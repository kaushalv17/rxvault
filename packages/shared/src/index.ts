export type UserRole = "DOCTOR" | "PATIENT";

export type PrescriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "FILLED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  phone: string;
  signature?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth: string;
  bloodGroup: string;
  allergies: string[];
  phone: string;
  emergencyContact?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  doctorId: string;
  patientId: string;
  doctor?: User & { doctorProfile?: DoctorProfile };
  patient?: User & { patientProfile?: PatientProfile };
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  followUpDate?: string;
  status: PrescriptionStatus;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctor?: User & { doctorProfile?: DoctorProfile };
  title: string;
  description: string;
  recordType: string;
  attachments?: string[];
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreatePrescriptionRequest {
  patientId: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  followUpDate?: string;
}

export interface UpdatePrescriptionRequest {
  diagnosis?: string;
  medications?: Medication[];
  notes?: string;
  followUpDate?: string;
  status?: PrescriptionStatus;
}

export interface PrescriptionFilters {
  search?: string;
  status?: PrescriptionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  totalPrescriptions: number;
  activePrescriptions: number;
  totalPatients?: number;
  recentActivity: Prescription[];
}
