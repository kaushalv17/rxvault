import QRCode from "qrcode";
import crypto from "crypto";

export function generateVerificationHash(prescriptionId: string, doctorId: string, patientId: string): string {
  const secret = process.env.JWT_SECRET || "rxvault-secret";
  return crypto.createHmac("sha256", secret).update(`${prescriptionId}:${doctorId}:${patientId}`).digest("hex").slice(0, 16);
}

export async function generateQRCode(prescriptionNumber: string, verificationHash: string): Promise<string> {
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify/${verificationHash}`;
  const qrData = JSON.stringify({ prescriptionNumber, verifyUrl, hash: verificationHash });
  return QRCode.toDataURL(qrData, { errorCorrectionLevel: "M", width: 200, margin: 1 });
}
