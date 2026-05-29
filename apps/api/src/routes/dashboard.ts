import { Router, Response } from "express";
import prisma from "../utils/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    if (role === "DOCTOR") {
      const [totalPrescriptions, activePrescriptions, uniquePatients, recentPrescriptions, allStatuses] =
        await Promise.all([
          prisma.prescription.count({ where: { doctorId: userId } }),
          prisma.prescription.count({ where: { doctorId: userId, status: "ACTIVE" } }),
          prisma.prescription.findMany({
            where: { doctorId: userId },
            distinct: ["patientId"],
            select: { patientId: true },
          }),
          prisma.prescription.findMany({
            where: { doctorId: userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              patient: { include: { patientProfile: true } },
              doctor: { include: { doctorProfile: true } },
            },
          }),
          prisma.prescription.findMany({
            where: { doctorId: userId },
            select: { status: true },
          }),
        ]);

      const statusMap: Record<string, number> = {};
      for (const p of allStatuses) {
        statusMap[p.status] = (statusMap[p.status] || 0) + 1;
      }
      const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

      const recent = recentPrescriptions.map((p: any) => ({
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
      }));

      res.json({
        success: true,
        data: {
          totalPrescriptions,
          activePrescriptions,
          totalPatients: uniquePatients.length,
          recentActivity: recent,
          statusBreakdown,
          monthlyStats: [],
        },
      });
    } else {
      const [totalPrescriptions, activePrescriptions, totalRecords, recentPrescriptions] = await Promise.all([
        prisma.prescription.count({ where: { patientId: userId } }),
        prisma.prescription.count({ where: { patientId: userId, status: "ACTIVE" } }),
        prisma.medicalRecord.count({ where: { patientId: userId } }),
        prisma.prescription.findMany({
          where: { patientId: userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            doctor: { include: { doctorProfile: true } },
            patient: { include: { patientProfile: true } },
          },
        }),
      ]);

      const recent = recentPrescriptions.map((p: any) => ({
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
      }));

      res.json({
        success: true,
        data: { totalPrescriptions, activePrescriptions, totalRecords, recentActivity: recent },
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch dashboard data" });
  }
});
