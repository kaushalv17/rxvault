import { Router, Response } from "express";
import prisma from "../utils/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

export const patientRouter = Router();
patientRouter.use(authenticate);

const userSelect = {
  id: true, email: true, name: true, role: true,
  avatar: true, createdAt: true, updatedAt: true,
  patientProfile: true,
};

patientRouter.get("/", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = "1", pageSize = "20" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const where: any = { role: "PATIENT" };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { patientProfile: { phone: { contains: search } } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, orderBy: { name: "asc" }, select: userSelect }),
      prisma.user.count({ where }),
    ]);

    const formatted = patients.map((p: any) => ({
      ...p,
      patientProfile: p.patientProfile
        ? { ...p.patientProfile, allergies: JSON.parse(p.patientProfile.allergies || "[]") }
        : null,
    }));

    res.json({
      success: true,
      data: {
        items: formatted, total,
        page: parseInt(page), pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch patients" });
  }
});

patientRouter.get("/:id", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await prisma.user.findUnique({
      where: { id: req.params.id, role: "PATIENT" },
      select: userSelect,
    });
    if (!patient) {
      res.status(404).json({ success: false, error: "Patient not found" });
      return;
    }
    res.json({
      success: true,
      data: {
        ...patient,
        patientProfile: patient.patientProfile
          ? { ...patient.patientProfile, allergies: JSON.parse((patient.patientProfile as any).allergies || "[]") }
          : null,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch patient" });
  }
});

patientRouter.get("/:id/prescriptions", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.params.id },
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { include: { doctorProfile: true } },
        patient: { include: { patientProfile: true } },
      },
    });
    res.json({
      success: true,
      data: prescriptions.map((p: any) => ({ ...p, medications: JSON.parse(p.medications || "[]") })),
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch prescriptions" });
  }
});

patientRouter.get("/:id/records", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: req.params.id },
      orderBy: { createdAt: "desc" },
      include: { doctor: { include: { doctorProfile: true } } },
    });
    res.json({
      success: true,
      data: records.map((r: any) => ({ ...r, attachments: JSON.parse(r.attachments || "[]") })),
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch records" });
  }
});
