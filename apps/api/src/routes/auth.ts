import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { authenticate, AuthRequest } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["DOCTOR", "PATIENT"]),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  hospital: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  experience: z.number().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ success: false, error: "Email already registered" });
      return;
    }
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        name: data.name,
        role: data.role,
        ...(data.role === "DOCTOR" && {
          doctorProfile: {
            create: {
              specialization: data.specialization || "General Physician",
              licenseNumber: data.licenseNumber || `LIC-${Date.now()}`,
              hospital: data.hospital || "Private Practice",
              phone: data.phone || "",
              experience: data.experience || 0,
            },
          },
        }),
        ...(data.role === "PATIENT" && {
          patientProfile: {
            create: {
              dateOfBirth: data.dateOfBirth || "1990-01-01",
              bloodGroup: data.bloodGroup || "O+",
              allergies: "[]",
              phone: data.phone || "",
            },
          },
        }),
      },
      include: { doctorProfile: true, patientProfile: true },
    });

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
    } else {
      res.status(500).json({ success: false, error: "Registration failed" });
    }
  }
});

authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { doctorProfile: true, patientProfile: true },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ success: false, error: "Invalid email or password" });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          doctorProfile: user.doctorProfile,
          patientProfile: user.patientProfile,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
    } else {
      res.status(500).json({ success: false, error: "Login failed" });
    }
  }
});

authRouter.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { doctorProfile: true, patientProfile: true },
    });
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        doctorProfile: user.doctorProfile,
        patientProfile: user.patientProfile,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

authRouter.put("/profile", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, specialization, hospital, bio, experience, dateOfBirth, bloodGroup, allergies, emergencyContact, address, weight, height } = req.body;
    await prisma.user.update({ where: { id: req.user!.id }, data: { name } });

    if (req.user!.role === "DOCTOR") {
      await prisma.doctorProfile.upsert({
        where: { userId: req.user!.id },
        update: { phone, specialization, hospital, bio, experience },
        create: {
          userId: req.user!.id,
          phone: phone || "",
          specialization: specialization || "General Physician",
          licenseNumber: `LIC-${Date.now()}`,
          hospital: hospital || "Private Practice",
        },
      });
    } else {
      await prisma.patientProfile.upsert({
        where: { userId: req.user!.id },
        update: { phone, dateOfBirth, bloodGroup, allergies: JSON.stringify(allergies || []), emergencyContact, address, weight, height },
        create: {
          userId: req.user!.id,
          phone: phone || "",
          dateOfBirth: dateOfBirth || "1990-01-01",
          bloodGroup: bloodGroup || "O+",
          allergies: JSON.stringify(allergies || []),
        },
      });
    }
    res.json({ success: true, message: "Profile updated successfully" });
  } catch {
    res.status(500).json({ success: false, error: "Profile update failed" });
  }
  
  
});authRouter.put("/change-password", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ success: false, error: "New password must be at least 8 characters" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      res.status(401).json({ success: false, error: "Current password is incorrect" });
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashed } });
    res.json({ success: true, message: "Password updated successfully" });
  } catch {
    res.status(500).json({ success: false, error: "Password change failed" });
  }
});
