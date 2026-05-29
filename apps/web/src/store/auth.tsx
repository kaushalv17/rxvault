"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "DOCTOR" | "PATIENT";
  avatar?: string;
  doctorProfile?: {
    specialization: string;
    licenseNumber: string;
    hospital: string;
    phone: string;
    experience?: number;
    bio?: string;
  };
  patientProfile?: {
    dateOfBirth: string;
    bloodGroup: string;
    allergies: string[];
    phone: string;
    emergencyContact?: string;
    address?: string;
    weight?: number;
    height?: number;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("rxvault_token");
    const storedUser = localStorage.getItem("rxvault_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = (t: string, u: UserProfile) => {
    setToken(t);
    setUser(u);
    localStorage.setItem("rxvault_token", t);
    localStorage.setItem("rxvault_user", JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("rxvault_token");
    localStorage.removeItem("rxvault_user");
    window.location.href = "/auth/login";
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.data);
      localStorage.setItem("rxvault_user", JSON.stringify(data.data));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
