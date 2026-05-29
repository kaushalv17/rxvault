import { Router, Request, Response } from "express";
import prisma from "../utils/prisma";

export const verifyRouter = Router();

verifyRouter.get("/:hash", async (req: Request, res: Response): Promise<void> => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { verificationHash: req.params.hash },
      include: {
        doctor: { include: { doctorProfile: true } },
        patient: { include: { patientProfile: true } },
      },
    });

    if (!prescription) {
      res.status(404).json({ success: false, error: "Prescription not found or invalid QR code" });
      return;
    }

    res.json({
      success: true,
      data: {
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        status: prescription.status,
        diagnosis: prescription.diagnosis,
        medications: JSON.parse(prescription.medications || "[]"),
        notes: prescription.notes,
        followUpDate: prescription.followUpDate,
        createdAt: prescription.createdAt,
        qrHash: prescription.verificationHash,
        doctor: prescription.doctor,
        patient: {
          ...prescription.patient,
          patientProfile: prescription.patient?.patientProfile
            ? {
                ...prescription.patient.patientProfile,
                allergies: JSON.parse(
                  (prescription.patient.patientProfile.allergies as unknown as string) || "[]"
                ),
              }
            : null,
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});