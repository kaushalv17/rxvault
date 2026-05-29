import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth";
import { prescriptionRouter } from "./routes/prescriptions";
import { patientRouter } from "./routes/patients";
import { doctorRouter } from "./routes/doctors";
import { medicalRecordRouter } from "./routes/medicalRecords";
import { dashboardRouter } from "./routes/dashboard";
import { verifyRouter } from "./routes/verify";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

const app = express();
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, error: "Too many requests, please try again later." },
});
app.use(limiter);

app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "healthy", timestamp: new Date().toISOString() } });
});

app.use("/api/auth", authRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/patients", patientRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/medical-records", medicalRecordRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/verify", verifyRouter);

app.use(errorHandler);

export default app;
