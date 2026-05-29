"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/store/auth";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  FileText, Users, Activity, TrendingUp, Clock,
  ArrowRight, Plus, FolderOpen, ChevronRight, Pill,
  CheckCircle2, AlertCircle, Ban, RefreshCw, Stethoscope,
  Heart, QrCode, Download, Shield, Zap, Star,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { clsx } from "clsx";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#059669", FILLED: "#0891B2", EXPIRED: "#E11D48", CANCELLED: "#94A3B8",
};
const STATUS_ICONS: Record<string, any> = {
  ACTIVE: CheckCircle2, FILLED: RefreshCw, EXPIRED: AlertCircle, CANCELLED: Ban,
};

function StatCard({ icon: Icon, label, value, sub, gradient, href, iconBg }: any) {
  const inner = (
    <div className="card p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon size={20} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
          <TrendingUp size={10} /> Live
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value ?? "—"}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {href && (
        <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-brand-600 group-hover:gap-2 transition-all">
          View details <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SkeletonCard() {
  return <div className="card p-6 h-40 shimmer-bg rounded-2xl" />;
}

function ActivityItem({ p, viewAs }: { p: any; viewAs: string }) {
  const person = viewAs === "DOCTOR" ? p.patient : p.doctor;
  return (
    <Link href={`/prescriptions/${p.id}`}
      className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-slate-50 hover:border-slate-200 border border-transparent transition-all duration-150 group">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
           style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)", border: "1px solid #A5F3FC" }}>
        <FileText size={15} className="text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800 truncate">{person?.name}</p>
          <StatusBadge status={p.status} size="sm" />
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{p.diagnosis}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <Clock size={9} /> {format(parseISO(p.createdAt), "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <Pill size={9} /> {p.medications?.length} medication{p.medications?.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard").then((r) => r.data.data),
  });

  const statusPieData = (data?.statusBreakdown || []).map((s: any) => ({
    name: s.status, value: Number(s.count),
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statCards = [
    {
      icon: FileText, label: "Total Prescriptions", value: data?.totalPrescriptions,
      sub: "All time records", iconBg: "bg-gradient-to-br from-brand-500 to-brand-700", href: "/prescriptions"
    },
    {
      icon: Activity, label: "Active Prescriptions", value: data?.activePrescriptions,
      sub: "Currently active", iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600", href: "/prescriptions?status=ACTIVE"
    },
    user?.role === "DOCTOR"
      ? { icon: Users, label: "Total Patients", value: data?.totalPatients, sub: "Registered patients", iconBg: "bg-gradient-to-br from-violet-500 to-violet-700", href: "/patients" }
      : { icon: FolderOpen, label: "Medical Records", value: data?.totalRecords, sub: "Health documents", iconBg: "bg-gradient-to-br from-amber-500 to-amber-600", href: "/records" },
    {
      icon: TrendingUp, label: "Recent Activity", value: data?.recentActivity?.length ?? 0,
      sub: "This period", iconBg: "bg-gradient-to-br from-rose-500 to-rose-700", href: "/prescriptions"
    },
  ];

  return (
    <AuthGuard>
      <AppShell>

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between mb-8 anim-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>
              {greeting},{" "}
              <span style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {user?.name?.split(" ").slice(0, 2).join(" ")}
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              {user?.role === "DOCTOR"
                ? `${user.doctorProfile?.specialization || "Doctor"} · ${user.doctorProfile?.hospital || "RxVault"}`
                : "Your personal health dashboard"}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {user?.role === "DOCTOR" && (
              <Link href="/prescriptions/new" className="btn-primary">
                <Plus size={15} /> New Prescription
              </Link>
            )}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card, i) => (
                <div key={i} className={clsx("anim-in", `delay-${i + 1}`)}>
                  <StatCard {...card} />
                </div>
              ))}
        </div>

        {/* ── Quick Actions banner ── */}
        <div className="card p-5 mb-8 anim-in delay-3"
             style={{ background: "linear-gradient(135deg, #0B1437 0%, #0d2060 100%)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: "rgba(8,145,178,0.3)" }}>
                <Zap size={16} className="text-brand-300" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Quick Actions</p>
                <p className="text-navy-300 text-xs">Jump straight to what you need</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.role === "DOCTOR" ? (
                <>
                  <Link href="/prescriptions/new" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all"
                        style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                    <Plus size={12} /> New Rx
                  </Link>
                  <Link href="/patients" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all">
                    <Users size={12} /> Patients
                  </Link>
                  <Link href="/prescriptions" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all">
                    <FileText size={12} /> All Prescriptions
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/prescriptions" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                    <FileText size={12} /> My Prescriptions
                  </Link>
                  <Link href="/records" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all">
                    <FolderOpen size={12} /> Records
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Prescriptions */}
          <div className="lg:col-span-2 card p-6 anim-in delay-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900" style={{ fontFamily: "Fraunces, serif" }}>Recent Prescriptions</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Your latest prescription activity</p>
              </div>
              <Link href="/prescriptions"
                className="flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-xl hover:bg-brand-100 transition-colors">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 shimmer-bg rounded-2xl mb-2" />
                ))
              ) : !data?.recentActivity?.length ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-semibold text-sm">No prescriptions yet</p>
                  {user?.role === "DOCTOR" && (
                    <Link href="/prescriptions/new" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline">
                      <Plus size={11} /> Create your first prescription
                    </Link>
                  )}
                </div>
              ) : (
                data.recentActivity.map((p: any) => (
                  <ActivityItem key={p.id} p={p} viewAs={user?.role || "PATIENT"} />
                ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Status breakdown */}
            {user?.role === "DOCTOR" && statusPieData.length > 0 && (
              <div className="card p-5 anim-in delay-4">
                <h3 className="text-sm font-black text-slate-800 mb-1" style={{ fontFamily: "Fraunces, serif" }}>Status Breakdown</h3>
                <p className="text-xs text-slate-400 font-medium mb-4">Prescription distribution</p>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                         paddingAngle={4} dataKey="value">
                      {statusPieData.map((entry: any) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#CBD5E1"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 11, fontFamily: "Plus Jakarta Sans" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-1">
                  {statusPieData.map((s: any) => {
                    const Icon = STATUS_ICONS[s.name] || Activity;
                    const total = statusPieData.reduce((acc: number, d: any) => acc + d.value, 0);
                    const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                    return (
                      <Link key={s.name} href={`/prescriptions?status=${s.name}`}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 group transition-all">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                             style={{ background: `${STATUS_COLORS[s.name]}20` }}>
                          <Icon size={11} style={{ color: STATUS_COLORS[s.name] }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 flex-1">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{pct}%</span>
                        <span className="text-xs font-black text-slate-800">{s.value}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Profile card */}
            <div className="card p-5 anim-in delay-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800" style={{ fontFamily: "Fraunces, serif" }}>Your Profile</h3>
                <Link href="/settings" className="text-[10px] font-bold text-brand-600 hover:underline">Edit</Link>
              </div>
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl"
                   style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)", border: "1px solid #A5F3FC" }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-white text-lg"
                     style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              {/* Profile details */}
              <div className="space-y-2.5 text-xs">
                {user?.role === "DOCTOR" && user.doctorProfile && <>
                  {[
                    ["Specialization", user.doctorProfile.specialization],
                    ["Hospital", user.doctorProfile.hospital],
                    ["License No.", user.doctorProfile.licenseNumber],
                    (user.doctorProfile.experience ?? 0) > 0 ? ["Experience", `${user.doctorProfile.experience} yrs`] : null,
                  ].filter(Boolean).map(([k, v]: any) => (
                    <div key={k} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-slate-400 font-semibold">{k}</span>
                      <span className="font-bold text-slate-700 text-right max-w-[160px] truncate">{v}</span>
                    </div>
                  ))}
                </>}
                {user?.role === "PATIENT" && user.patientProfile && <>
                  {user.patientProfile.bloodGroup && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold">Blood Group</span>
                      <span className="font-black text-rose-600 text-base">{user.patientProfile.bloodGroup}</span>
                    </div>
                  )}
                  {user.patientProfile.phone && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold">Phone</span>
                      <span className="font-bold text-slate-700">{user.patientProfile.phone}</span>
                    </div>
                  )}
                  {user.patientProfile.allergies?.length > 0 && (
                    <div className="py-2">
                      <p className="text-slate-400 font-semibold mb-2">Allergies</p>
                      <div className="flex flex-wrap gap-1.5">
                       {(Array.isArray(user.patientProfile.allergies)
  ? user.patientProfile.allergies
  : JSON.parse((user.patientProfile.allergies as unknown as string) || "[]")
).map((a: string) => (
  <span key={a} className="pill-danger text-[10px]">{a}</span>
))}
                      </div>
                    </div>
                  )}
                </>}
              </div>
            </div>

            {/* Trust bar */}
            <div className="card p-4 anim-in delay-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} className="text-emerald-600" />
                <span className="text-xs font-black text-slate-700">Security & Trust</span>
              </div>
              <div className="space-y-2">
                {[["QR Code Verification", "Every prescription is QR-verifiable"], ["SHA-256 Hash", "Tamper-proof prescription hashes"], ["PDF Audit Trail", "Complete download history"]].map(([t, d]) => (
                  <div key={t} className="flex items-start gap-2">
                    <CheckCircle2 size={11} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">{t}</p>
                      <p className="text-[10px] text-slate-400">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
