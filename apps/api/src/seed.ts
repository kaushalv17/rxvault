import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import crypto from "crypto";

const prisma = new PrismaClient();

function makeHash(id: string, doctorId: string, patientId: string) {
  return crypto.createHmac("sha256", process.env.JWT_SECRET || "rxvault-secret")
    .update(`${id}:${doctorId}:${patientId}`).digest("hex").slice(0, 16);
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("password123", 12);

  const doctor1 = await prisma.user.create({
    data: {
      id: uuidv4(), email: "dr.sharma@rxvault.com", password: hash,
      name: "Dr. Priya Sharma", role: "DOCTOR",
      doctorProfile: {
        create: {
          specialization: "Internal Medicine", licenseNumber: "MCI-12345-DL",
          hospital: "Apollo Hospitals, New Delhi", phone: "+91-9876543210",
          experience: 12, bio: "Specialist in internal medicine with 12 years of clinical experience.",
        },
      },
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      id: uuidv4(), email: "dr.mehta@rxvault.com", password: hash,
      name: "Dr. Arjun Mehta", role: "DOCTOR",
      doctorProfile: {
        create: {
          specialization: "Cardiology", licenseNumber: "MCI-67890-MH",
          hospital: "Fortis Hospital, Mumbai", phone: "+91-9765432109",
          experience: 18, bio: "Senior cardiologist with expertise in interventional cardiology.",
        },
      },
    },
  });

  const patient1 = await prisma.user.create({
    data: {
      id: uuidv4(), email: "rahul.kumar@gmail.com", password: hash,
      name: "Rahul Kumar", role: "PATIENT",
      patientProfile: {
        create: {
          dateOfBirth: "1990-05-15", bloodGroup: "O+",
          allergies: JSON.stringify(["Penicillin", "Sulfa drugs"]),
          phone: "+91-9988776655", emergencyContact: "Sunita Kumar: +91-9988776644",
          address: "45, Sector 18, Noida, UP", weight: 72.5, height: 175,
        },
      },
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      id: uuidv4(), email: "anita.singh@gmail.com", password: hash,
      name: "Anita Singh", role: "PATIENT",
      patientProfile: {
        create: {
          dateOfBirth: "1985-11-22", bloodGroup: "B+",
          allergies: JSON.stringify(["Aspirin"]),
          phone: "+91-9876543211", address: "12, MG Road, Bangalore, KA",
          weight: 58, height: 162,
        },
      },
    },
  });

  const patient3 = await prisma.user.create({
    data: {
      id: uuidv4(), email: "vikram.patel@gmail.com", password: hash,
      name: "Vikram Patel", role: "PATIENT",
      patientProfile: {
        create: {
          dateOfBirth: "1978-03-08", bloodGroup: "A+",
          allergies: JSON.stringify([]),
          phone: "+91-9654321098", address: "78, Paldi, Ahmedabad, GJ",
          weight: 85, height: 180,
        },
      },
    },
  });

  const prescriptionsData = [
    {
      doctorId: doctor1.id, patientId: patient1.id,
      diagnosis: "Type 2 Diabetes Mellitus with Hypertension",
      medications: [
        { name: "Metformin HCl", dosage: "500mg", frequency: "Twice daily after meals", duration: "90 days", instructions: "Take with food to reduce GI side effects" },
        { name: "Amlodipine", dosage: "5mg", frequency: "Once daily at bedtime", duration: "90 days", instructions: "Monitor blood pressure regularly" },
        { name: "Atorvastatin", dosage: "10mg", frequency: "Once daily at night", duration: "90 days" },
      ],
      notes: "Patient should monitor blood glucose twice daily. Low-sodium, low-carbohydrate diet recommended. Follow-up with HbA1c test after 3 months.",
      followUpDate: "2025-09-15", status: "ACTIVE" as const,
    },
    {
      doctorId: doctor1.id, patientId: patient2.id,
      diagnosis: "Acute Respiratory Infection (Bacterial)",
      medications: [
        { name: "Amoxicillin-Clavulanate", dosage: "625mg", frequency: "Twice daily", duration: "7 days", instructions: "Complete the full course even if feeling better" },
        { name: "Cetirizine", dosage: "10mg", frequency: "Once daily at night", duration: "5 days" },
        { name: "Dextromethorphan + Guaifenesin", dosage: "10ml", frequency: "Three times daily", duration: "5 days", instructions: "Take 30 minutes before meals" },
      ],
      notes: "Adequate rest and hydration essential. Avoid cold beverages. Steam inhalation twice daily.",
      followUpDate: "2025-06-20", status: "FILLED" as const,
    },
    {
      doctorId: doctor2.id, patientId: patient3.id,
      diagnosis: "Essential Hypertension with Dyslipidemia",
      medications: [
        { name: "Telmisartan", dosage: "40mg", frequency: "Once daily in the morning", duration: "180 days", instructions: "Do not stop abruptly" },
        { name: "Rosuvastatin", dosage: "10mg", frequency: "Once daily at night", duration: "180 days" },
        { name: "Aspirin", dosage: "75mg", frequency: "Once daily after breakfast", duration: "180 days", instructions: "Take with food, avoid on empty stomach" },
      ],
      notes: "DASH diet strongly recommended. Restrict sodium intake to less than 2g/day. Regular aerobic exercise 30 minutes daily.",
      followUpDate: "2025-12-01", status: "ACTIVE" as const,
    },
    {
      doctorId: doctor1.id, patientId: patient3.id,
      diagnosis: "Seasonal Allergic Rhinitis",
      medications: [
        { name: "Fexofenadine", dosage: "180mg", frequency: "Once daily", duration: "30 days" },
        { name: "Fluticasone Nasal Spray", dosage: "2 puffs each nostril", frequency: "Once daily in morning", duration: "30 days", instructions: "Shake well before use, clean nozzle after each use" },
      ],
      status: "ACTIVE" as const,
    },
  ];

  for (const pd of prescriptionsData) {
    const id = uuidv4();
    const num = `RX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const hash16 = makeHash(id, pd.doctorId, pd.patientId);
    const verifyUrl = `http://localhost:3000/verify/${hash16}`;
    const qrData = JSON.stringify({ prescriptionNumber: num, verifyUrl, hash: hash16 });
    const qrCode = await QRCode.toDataURL(qrData, { errorCorrectionLevel: "M", width: 200, margin: 1 });

    await prisma.prescription.create({
      data: {
        id, prescriptionNumber: num,
        doctorId: pd.doctorId, patientId: pd.patientId,
        diagnosis: pd.diagnosis,
        medications: JSON.stringify(pd.medications),
        notes: pd.notes,
        followUpDate: pd.followUpDate,
        status: pd.status,
        verificationHash: hash16,
        qrCode,
      },
    });
    await new Promise((r) => setTimeout(r, 50));
  }

  await prisma.medicalRecord.createMany({
    data: [
      { id: uuidv4(), patientId: patient1.id, doctorId: doctor1.id, title: "HbA1c Test Results - March 2025", description: "HbA1c: 7.8% (Target: <7%). FBS: 142 mg/dL. PPBS: 198 mg/dL. Kidney function normal.", recordType: "LAB_RESULT", attachments: "[]" },
      { id: uuidv4(), patientId: patient1.id, doctorId: doctor1.id, title: "Chest X-Ray", description: "PA view: No active pulmonary lesion. Heart size normal. Lung fields clear.", recordType: "IMAGING", attachments: "[]" },
      { id: uuidv4(), patientId: patient2.id, doctorId: doctor1.id, title: "CBC Report", description: "WBC: 11.2 (elevated). Hb: 13.4 g/dL. Platelet count: 2.1 lakhs. Infection markers elevated.", recordType: "LAB_RESULT", attachments: "[]" },
      { id: uuidv4(), patientId: patient3.id, doctorId: doctor2.id, title: "ECG Report", description: "Normal sinus rhythm. Heart rate 76 bpm. No ST changes. No arrhythmia.", recordType: "LAB_RESULT", attachments: "[]" },
      { id: uuidv4(), patientId: patient3.id, doctorId: doctor2.id, title: "Echocardiography", description: "EF 58%. Normal LV function. Mild concentric LVH consistent with hypertension. No wall motion abnormality.", recordType: "IMAGING", attachments: "[]" },
    ],
  });

  console.log("Seed complete.");
  console.log("Doctor login: dr.sharma@rxvault.com / password123");
  console.log("Doctor login: dr.mehta@rxvault.com / password123");
  console.log("Patient login: rahul.kumar@gmail.com / password123");
  console.log("Patient login: anita.singh@gmail.com / password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
