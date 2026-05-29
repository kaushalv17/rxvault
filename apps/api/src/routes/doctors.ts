import { Router, Response } from "express";
import prisma from "../utils/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const doctorRouter = Router();
doctorRouter.use(authenticate);

const userSelect = {
  id: true, email: true, name: true, role: true,
  avatar: true, createdAt: true, updatedAt: true,
  doctorProfile: true,
};

doctorRouter.get("/", async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: userSelect,
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: doctors });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch doctors" });
  }
});

doctorRouter.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doctor = await prisma.user.findUnique({
      where: { id: req.params.id, role: "DOCTOR" },
      select: userSelect,
    });
    if (!doctor) {
      res.status(404).json({ success: false, error: "Doctor not found" });
      return;
    }
    res.json({ success: true, data: doctor });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch doctor" });
  }
});
