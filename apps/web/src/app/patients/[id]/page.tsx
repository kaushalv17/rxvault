"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PrescriptionCard } from "@/components/prescriptions/PrescriptionCard";
import {
  ArrowLeft, User, FileText, Plus, AlertTriangle,
  Phone, Mail, Heart, Calendar, Activity, Pill,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data.data),
  });

  if (isLoading) return (
    <AuthGuard role="DOCTOR"><AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 shimmer-bg rounded-2xl" />)}
      </div>
    </AppShell></AuthGuard>
  );

  const profile    = patient?.patientProfile || {};
  const allergies: string[] = profile.allergies || [];
  const rxList: any[] = patient?.prescriptions || [];
  const activeRx = rxList.filter((r) => r.status === "ACTIVE").length;

  return (
    <AuthGuard role="DOCTOR">
      <AppShell>
        <div className="max-w-4xl mx-auto">

          {/* Back */}
          <div className="flex items-center justify-between mb-6 anim-in">
            <Link href="/patients" className="btn-ghost px-3 py-2.5 border border-slate-200 rounded-xl">
              <ArrowLeft size={15} /> Patients
            </Link>
            <Link href={`/prescriptions/new?patientId=${id}`} className="btn-primary">
              <Plus size={15} /> New Prescription
            </Link>
          </div>

          {/* Hero card */}
          <div className="rx-pad mb-6 anim-in delay-1">
            <div className="h-1.5" style={{ background: "linear-gradient(90deg, #7C3AED, #0891B2, #0D9488)" }} />
            <div className="p-8">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-white text-4xl flex-shrink-0"
                     style={{ background: "linear-gradient(135deg, #7C3AED, #0891B2)" }}>
                  {patient?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "Fraunces, serif" }}>{patient?.name}</h1>
                      <p className="text-slate-500 text-sm mt-0.5">{patient?.email}</p>
                    </div>
                    {profile.bloodGroup && (
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-rose-50 border-2 border-rose-200 mb-1">
                          <span className="text-rose-600 font-black text-lg">{profile.bloodGroup}</span>
                        </div>
                        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Blood Type</p>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <div className="metric-tile">
                      <Activity size={14} className="text-brand-500" />
                      <div>
                        <p className="text-xs font-black text-slate-700">{rxList.length}</p>
                        <p className="text-[10px] text-slate-400">Total Rx</p>
                      </div>
                    </div>
                    <div className="metric-tile">
                      <Heart size={14} className="text-emerald-500" />
                      <div>
                        <p className="text-xs font-black text-slate-700">{activeRx}</p>
                        <p className="text-[10px] text-slate-400">Active Rx</p>
                      </div>
                    </div>
                    {profile.phone && (
                      <div className="metric-tile">
                        <Phone size={14} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">{profile.phone}</p>
                          <p className="text-[10px] text-slate-400">Phone</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-in delay-2">

            {/* Left: Health details */}
            <div className="space-y-4">

              {/* Allergies */}
              {allergies.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                      <AlertTriangle size={13} className="text-rose-500" />
                    </div>
                    <p className="text-sm font-black text-slate-800">Known Allergies</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allergies.map((a: string) => (
                      <span key={a} className="pill-danger">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile info */}
              <div className="card p-5">
                <p className="text-sm font-black text-slate-800 mb-4">Health Profile</p>
                <div className="space-y-3 text-sm">
                  {profile.dateOfBirth && (
                    <div className="flex items-center gap-2.5 py-2 border-b border-slate-100">
                      <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-slate-400 text-xs font-semibold flex-1">Date of Birth</span>
                      <span className="font-bold text-slate-700 text-xs">{format(parseISO(profile.dateOfBirth), "dd MMM yyyy")}</span>
                    </div>
                  )}
                  {profile.gender && (
                    <div className="flex items-center gap-2.5 py-2 border-b border-slate-100">
                      <User size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-slate-400 text-xs font-semibold flex-1">Gender</span>
                      <span className="font-bold text-slate-700 text-xs capitalize">{profile.gender}</span>
                    </div>
                  )}
                  {profile.weight && (
                    <div className="flex items-center gap-2.5 py-2 border-b border-slate-100">
                      <Activity size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-slate-400 text-xs font-semibold flex-1">Weight</span>
                      <span className="font-bold text-slate-700 text-xs">{profile.weight} kg</span>
                    </div>
                  )}
                  {profile.height && (
                    <div className="flex items-center gap-2.5 py-2">
                      <Activity size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-slate-400 text-xs font-semibold flex-1">Height</span>
                      <span className="font-bold text-slate-700 text-xs">{profile.height} cm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick action */}
              <Link href={`/prescriptions/new?patientId=${id}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm text-white transition-all hover:shadow-glow"
                style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                <Plus size={15} /> New Prescription for {patient?.name?.split(" ")[0]}
              </Link>
            </div>

            {/* Right: Prescriptions history */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-black text-slate-800" style={{ fontFamily: "Fraunces, serif" }}>Prescription History</p>
                <span className="pill-brand text-xs">{rxList.length} total</span>
              </div>
              {rxList.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-600">No prescriptions yet</p>
                  <Link href={`/prescriptions/new?patientId=${id}`} className="btn-primary mt-4 inline-flex mx-auto">
                    <Plus size={14} /> Create First Prescription
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rxList.map((rx: any) => (
                    <PrescriptionCard key={rx.id} prescription={rx} viewAs="DOCTOR" />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </AppShell>
    </AuthGuard>
  );
}
