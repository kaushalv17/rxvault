import { Router, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import prisma from "../utils/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { generatePrescriptionPDF } from "../services/pdfService";
import { generateQRCode, generateVerificationHash } from "../services/qrService";

export const prescriptionRouter = Router();
prescriptionRouter.use(authenticate);

function buildPrescriptionInclude() {
  return {
    doctor: { include: { doctorProfile: true } },
    patient: { include: { patientProfile: true } },
  };
}

function formatPrescription(p: any) {
  return {
    ...p,
    medications: JSON.parse(p.medications || "[]"),
    patient: p.patient
      ? {
          ...p.patient,
          patientProfile: p.patient.patientProfile
            ? { ...p.patient.patientProfile, allergies: JSON.parse(p.patient.patientProfile.allergies || "[]") }
            : null,
        }
      : null,
  };
}

const medicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
});

const createSchema = z.object({
  patientId: z.string().uuid(),
  diagnosis: z.string().min(3),
  medications: z.array(medicationSchema).min(1),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
});

prescriptionRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, startDate, endDate, page = "1", pageSize = "10" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const where: any = {};
    if (req.user!.role === "DOCTOR") where.doctorId = req.user!.id;
    if (req.user!.role === "PATIENT") where.patientId = req.user!.id;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { prescriptionNumber: { contains: search } },
        { diagnosis: { contains: search } },
        { doctor: { name: { contains: search } } },
        { patient: { name: { contains: search } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.prescription.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: buildPrescriptionInclude() }),
      prisma.prescription.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: items.map(formatPrescription),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch prescriptions" });
  }
});

prescriptionRouter.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const p = await prisma.prescription.findUnique({ where: { id: req.params.id }, include: buildPrescriptionInclude() });
    if (!p) {
      res.status(404).json({ success: false, error: "Prescription not found" });
      return;
    }
    if (req.user!.role === "DOCTOR" && p.doctorId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }
    if (req.user!.role === "PATIENT" && p.patientId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }
    res.json({ success: true, data: formatPrescription(p) });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch prescription" });
  }
});

prescriptionRouter.post("/", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createSchema.parse(req.body);
    const patient = await prisma.user.findUnique({ where: { id: data.patientId } });
    if (!patient) {
      res.status(404).json({ success: false, error: "Patient not found" });
      return;
    }

    const id = uuidv4();
    const prescriptionNumber = `RX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const verificationHash = generateVerificationHash(id, req.user!.id, data.patientId);
    const qrCode = await generateQRCode(prescriptionNumber, verificationHash);

    const prescription = await prisma.prescription.create({
      data: {
        id,
        prescriptionNumber,
        doctorId: req.user!.id,
        patientId: data.patientId,
        diagnosis: data.diagnosis,
        medications: JSON.stringify(data.medications),
        notes: data.notes,
        followUpDate: data.followUpDate,
        verificationHash,
        qrCode,
        status: "ACTIVE",
      },
      include: buildPrescriptionInclude(),
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "CREATE", resource: "PRESCRIPTION", details: prescriptionNumber },
    });

    res.status(201).json({ success: true, data: formatPrescription(prescription) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
    } else {
      res.status(500).json({ success: false, error: "Failed to create prescription" });
    }
  }
});

prescriptionRouter.put("/:id", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.prescription.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Prescription not found" });
      return;
    }
    if (existing.doctorId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const { diagnosis, medications, notes, followUpDate, status } = req.body;
    const updated = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        ...(diagnosis && { diagnosis }),
        ...(medications && { medications: JSON.stringify(medications) }),
        ...(notes !== undefined && { notes }),
        ...(followUpDate !== undefined && { followUpDate }),
        ...(status && { status }),
      },
      include: buildPrescriptionInclude(),
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "UPDATE", resource: "PRESCRIPTION", details: existing.prescriptionNumber },
    });

    res.json({ success: true, data: formatPrescription(updated) });
  } catch {
    res.status(500).json({ success: false, error: "Failed to update prescription" });
  }
});

prescriptionRouter.delete("/:id", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.prescription.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Prescription not found" });
      return;
    }
    if (existing.doctorId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }
    await prisma.prescription.update({ where: { id: req.params.id }, data: { status: "CANCELLED" } });
    res.json({ success: true, message: "Prescription cancelled" });
  } catch {
    res.status(500).json({ success: false, error: "Failed to cancel prescription" });
  }
});

prescriptionRouter.get("/:id/download", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const p = await prisma.prescription.findUnique({ where: { id: req.params.id }, include: buildPrescriptionInclude() });
    if (!p) {
      res.status(404).json({ success: false, error: "Prescription not found" });
      return;
    }
    if (req.user!.role === "DOCTOR" && p.doctorId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }
    if (req.user!.role === "PATIENT" && p.patientId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const formatted = formatPrescription(p);
    const pdfBuffer = await generatePrescriptionPDF(formatted as any);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${p.prescriptionNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "DOWNLOAD", resource: "PRESCRIPTION", details: p.prescriptionNumber },
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to generate PDF" });
  }
});
