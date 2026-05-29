import PDFDocument from "pdfkit";

export async function generatePrescriptionPDF(prescription: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
      info: {
        Title: `Prescription ${prescription.prescriptionNumber}`,
        Author: prescription.doctor?.name || "RxVault",
        Subject: "Medical Prescription",
        Creator: "RxVault Digital Prescription System",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const primaryColor = "#0F172A";
    const accentColor = "#2563EB";
    const mutedColor = "#64748B";
    const borderColor = "#E2E8F0";
    const successColor = "#059669";

    doc.rect(0, 0, doc.page.width, 130).fill("#F8FAFC");
    doc.rect(0, 0, 6, 130).fill(accentColor);

    doc.fontSize(22).font("Helvetica-Bold").fillColor(primaryColor).text("RxVault", 70, 35);
    doc.fontSize(9).font("Helvetica").fillColor(mutedColor).text("Digital Prescription Management System", 70, 62);
    doc.moveTo(70, 75).lineTo(doc.page.width - 60, 75).strokeColor(borderColor).lineWidth(0.5).stroke();

    const doctor = prescription.doctor;
    const doctorProfile = doctor?.doctorProfile;

    doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text(`Dr. ${doctor?.name || "Unknown"}`, 70, 85);
    doc.fontSize(9).font("Helvetica").fillColor(mutedColor)
      .text(doctorProfile?.specialization || "", 70, 101)
      .text(doctorProfile?.hospital || "", 70, 114);

    if (doctorProfile?.licenseNumber) {
      doc.fontSize(8).fillColor(mutedColor)
        .text(`License: ${doctorProfile.licenseNumber}`, doc.page.width - 180, 95, { align: "right", width: 120 });
    }
    if (doctorProfile?.phone) {
      doc.fontSize(8).fillColor(mutedColor)
        .text(`Phone: ${doctorProfile.phone}`, doc.page.width - 180, 108, { align: "right", width: 120 });
    }

    let y = 150;
    const rxBoxWidth = doc.page.width - 120;

    doc.rect(60, y, rxBoxWidth, 32).fill(accentColor);
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#FFFFFF")
      .text(`PRESCRIPTION  #${prescription.prescriptionNumber}`, 70, y + 9);

    const dateStr = new Date(prescription.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });
    doc.fontSize(8).fillColor("#FFFFFF")
      .text(dateStr, doc.page.width - 180, y + 13, { align: "right", width: 110 });

    y += 50;

    const colWidth = (rxBoxWidth - 20) / 2;
    doc.rect(60, y, colWidth, 90).fill("#F1F5F9").strokeColor(borderColor).lineWidth(0.5).stroke();
    doc.rect(90 + colWidth, y, colWidth, 90).fill("#F1F5F9").strokeColor(borderColor).lineWidth(0.5).stroke();

    doc.fontSize(8).font("Helvetica-Bold").fillColor(accentColor).text("PATIENT INFORMATION", 70, y + 10);
    const patient = prescription.patient;
    const patientProfile = patient?.patientProfile;

    doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryColor)
      .text(patient?.name || "Unknown Patient", 70, y + 26);

    const patAge = patientProfile?.dateOfBirth
      ? `${Math.floor((Date.now() - new Date(patientProfile.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))} years`
      : "";

    doc.fontSize(9).font("Helvetica").fillColor(mutedColor)
      .text(`${patAge}${patientProfile?.bloodGroup ? "  ·  Blood: " + patientProfile.bloodGroup : ""}`, 70, y + 43);

    if (patientProfile?.phone) {
      doc.text(`Phone: ${patientProfile.phone}`, 70, y + 57);
    }

    // ✅ FIXED: handle allergies as either array or JSON string
    if (patientProfile?.allergies) {
      const allergies: string[] = Array.isArray(patientProfile.allergies)
        ? patientProfile.allergies
        : JSON.parse((patientProfile.allergies as unknown as string) || "[]");
      if (allergies.length > 0) {
        doc.fontSize(8).fillColor("#DC2626").text(`Allergies: ${allergies.join(", ")}`, 70, y + 71);
      }
    }

    const col2X = 100 + colWidth;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(accentColor).text("VISIT INFORMATION", col2X, y + 10);
    doc.fontSize(9).font("Helvetica").fillColor(mutedColor).text("Date of Issue", col2X, y + 26);
    doc.fontSize(9).font("Helvetica-Bold").fillColor(primaryColor).text(dateStr, col2X, y + 38);

    if (prescription.followUpDate) {
      doc.fontSize(9).font("Helvetica").fillColor(mutedColor).text("Follow-up Date", col2X, y + 56);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(successColor).text(
        new Date(prescription.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
        col2X, y + 68
      );
    }

    y += 108;

    doc.rect(60, y, rxBoxWidth, 40).fill("#EFF6FF").strokeColor("#BFDBFE").lineWidth(0.5).stroke();
    doc.fontSize(8).font("Helvetica-Bold").fillColor(accentColor).text("DIAGNOSIS", 70, y + 8);
    doc.fontSize(10).font("Helvetica").fillColor(primaryColor)
      .text(prescription.diagnosis, 70, y + 22, { width: rxBoxWidth - 20 });

    y += 58;

    doc.rect(60, y, rxBoxWidth, 24).fill(primaryColor);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#FFFFFF").text("℞  MEDICATIONS", 70, y + 7);

    y += 32;

    // ✅ FIXED: safely parse medications if it ever comes as a string
    const meds: any[] = Array.isArray(prescription.medications)
      ? prescription.medications
      : JSON.parse((prescription.medications as unknown as string) || "[]");

    meds.forEach((med, index) => {
      const isEven = index % 2 === 0;
      const medBoxHeight = 68;
      doc.rect(60, y, rxBoxWidth, medBoxHeight)
        .fill(isEven ? "#FAFAFA" : "#FFFFFF")
        .strokeColor(borderColor).lineWidth(0.3).stroke();
      doc.rect(60, y, 4, medBoxHeight).fill(accentColor);

      doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryColor)
        .text(`${index + 1}. ${med.name}`, 74, y + 10);

      doc.fontSize(9).font("Helvetica").fillColor(mutedColor).text(`Dosage: `, 74, y + 28)
        .font("Helvetica-Bold").fillColor(primaryColor).text(med.dosage, 120, y + 28);

      doc.font("Helvetica").fillColor(mutedColor).text(`  ·  Frequency: `, 200, y + 28)
        .font("Helvetica-Bold").fillColor(primaryColor).text(med.frequency, 285, y + 28);

      doc.font("Helvetica").fillColor(mutedColor).text(`  ·  Duration: `, 360, y + 28)
        .font("Helvetica-Bold").fillColor(primaryColor).text(med.duration, 430, y + 28);

      if (med.instructions) {
        doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
          .text(`Instructions: ${med.instructions}`, 74, y + 47, { width: rxBoxWidth - 30 });
      }

      y += medBoxHeight + 2;
    });

    if (prescription.notes) {
      y += 12;
      doc.rect(60, y, rxBoxWidth, 22).fill("#FFFBEB").strokeColor("#FDE68A").lineWidth(0.5).stroke();
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#92400E").text("CLINICAL NOTES", 70, y + 6);
      y += 28;
      doc.fontSize(9).font("Helvetica").fillColor(primaryColor)
        .text(prescription.notes, 60, y, { width: rxBoxWidth });
      y += doc.heightOfString(prescription.notes, { width: rxBoxWidth }) + 12;
    }

    y += 20;
    doc.moveTo(60, y).lineTo(doc.page.width - 60, y).strokeColor(borderColor).lineWidth(0.5).stroke();
    y += 16;

    if (prescription.qrCode) {
      try {
        const qrDataUrl = prescription.qrCode.replace(/^data:image\/png;base64,/, "");
        const qrBuffer = Buffer.from(qrDataUrl, "base64");
        doc.image(qrBuffer, 60, y, { width: 70, height: 70 });
        doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
          .text("Scan to verify", 60, y + 72, { width: 70, align: "center" });
      } catch {
        // QR render failed silently — PDF still generates
      }
    }

    const sigX = doc.page.width - 200;
    doc.moveTo(sigX, y + 45).lineTo(sigX + 130, y + 45).strokeColor(primaryColor).lineWidth(0.5).stroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor(primaryColor)
      .text(`Dr. ${doctor?.name || ""}`, sigX, y + 50, { width: 130, align: "center" });
    doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
      .text("Signature & Stamp", sigX, y + 63, { width: 130, align: "center" });

    const statusColors: Record<string, string> = {
      ACTIVE: successColor, EXPIRED: "#DC2626", CANCELLED: "#6B7280", FILLED: "#7C3AED",
    };
    doc.rect(doc.page.width - 150, y, 90, 20).fill(statusColors[prescription.status] || mutedColor);
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF")
      .text(prescription.status, doc.page.width - 150, y + 6, { width: 90, align: "center" });

    const footerY = doc.page.height - 40;
    doc.moveTo(60, footerY - 8).lineTo(doc.page.width - 60, footerY - 8)
      .strokeColor(borderColor).lineWidth(0.3).stroke();
    doc.fontSize(7).font("Helvetica").fillColor(mutedColor).text(
      "This is a digitally generated prescription by RxVault. Valid only with doctor's verified digital signature. Verify authenticity via QR code.",
      60, footerY - 2, { width: doc.page.width - 120, align: "center" }
    );

    doc.end();
  });
}