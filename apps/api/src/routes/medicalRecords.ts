import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

export const medicalRecordRouter = Router();
medicalRecordRouter.use(authenticate);

const createSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().min(2),
  recordType: z.enum(["LAB_RESULT", "IMAGING", "DIAGNOSIS", "SURGERY", "VACCINATION", "ALLERGY", "OTHER"]),
  attachments: z.array(z.string()).optional(),
});

medicalRecordRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, recordType, page = "1", pageSize = "10" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const where: any = {};
    if (req.user!.role === "DOCTOR") where.doctorId = req.user!.id;
    if (req.user!.role === "PATIENT") where.patientId = req.user!.id;
    if (recordType) where.recordType = recordType;
    if (search) {
      where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
    }

    const [items, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          doctor: { include: { doctorProfile: true } },
          patient: { include: { patientProfile: true } },
        },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: items.map((r: any) => ({ ...r, attachments: JSON.parse(r.attachments || "[]") })),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch records" });
  }
});

medicalRecordRouter.post("/", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createSchema.parse(req.body);
    const record = await prisma.medicalRecord.create({
      data: {
        patientId: data.patientId,
        doctorId: req.user!.id,
        title: data.title,
        description: data.description,
        recordType: data.recordType,
        attachments: JSON.stringify(data.attachments || []),
      },
      include: { doctor: { include: { doctorProfile: true } }, patient: { include: { patientProfile: true } } },
    });
    res.status(201).json({ success: true, data: { ...record, attachments: JSON.parse(record.attachments) } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
    } else {
      res.status(500).json({ success: false, error: "Failed to create record" });
    }
  }
});

medicalRecordRouter.put("/:id", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.medicalRecord.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.doctorId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }
    const { title, description, recordType, attachments } = req.body;
    const updated = await prisma.medicalRecord.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(recordType && { recordType }),
        ...(attachments && { attachments: JSON.stringify(attachments) }),
      },
      include: { doctor: { include: { doctorProfile: true } } },
    });
    res.json({ success: true, data: { ...updated, attachments: JSON.parse(updated.attachments) } });
  } catch {
    res.status(500).json({ success: false, error: "Failed to update record" });
  }
});

medicalRecordRouter.delete("/:id", requireRole("DOCTOR"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.medicalRecord.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.doctorId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }
    await prisma.medicalRecord.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Record deleted" });
  } catch {
    res.status(500).json({ success: false, error: "Failed to delete record" });
  }
});
