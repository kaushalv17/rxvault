"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/store/auth";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  Download, X, ArrowLeft, QrCode, Pill, User,
  Calendar, FileText, Stethoscope, AlertTriangle,
  Clock, CheckCircle2, Shield, Hash, ExternalLink, Printer,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

const LIFECYCLE = ["ACTIVE", "FILLED", "EXPIRED"];

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: p, isLoading } = useQuery({
    queryKey: ["prescription", id],
    queryFn: () => api.get(`/prescriptions/${id}`).then((r) => r.data.data),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.put(`/prescriptions/${id}`, { status: "CANCELLED" }),
    onSuccess: () => {
      toast.success("Prescription cancelled");
      qc.invalidateQueries({ queryKey: ["prescription", id] });
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
    },
    onError: () => toast.error("Failed to cancel"),
  });

  const fillMutation = useMutation({
    mutationFn: () => api.put(`/prescriptions/${id}`, { status: "FILLED" }),
    onSuccess: () => {
      toast.success("Prescription marked as filled");
      qc.invalidateQueries({ queryKey: ["prescription", id] });
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
    },
    onError: () => toast.error("Failed to update"),
  });

  const handleDownload = async () => {
    const toastId = toast.loading("Generating PDF…");
    try {
      const res = await api.get(`/prescriptions/${id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `${p.prescriptionNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!", { id: toastId });
    } catch { toast.error("Download failed", { id: toastId }); }
  };

  if (isLoading) {
    return (
      <AuthGuard><AppShell>
        <div className="max-w-4xl mx-auto space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 shimmer-bg rounded-2xl" />)}
        </div>
      </AppShell></AuthGuard>
    );
  }

  if (!p) return (
    <AuthGuard><AppShell>
      <div className="text-center py-20">
        <p className="text-slate-500">Prescription not found.</p>
        <Link href="/prescriptions" className="btn-primary mt-4 inline-flex">Back to prescriptions</Link>
      </div>
    </AppShell></AuthGuard>
  );

  const doctor  = p.doctor;
  const patient = p.patient;
  const allergies: string[] = patient?.patientProfile?.allergies || [];
  const lifecycleIdx = LIFECYCLE.indexOf(p.status);

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-4xl mx-auto">

          {/* Back + actions bar */}
          <div className="flex items-center justify-between mb-6 anim-in">
            <Link href="/prescriptions" className="btn-ghost px-3 py-2.5 rounded-xl border border-slate-200">
              <ArrowLeft size={15} /> Back
            </Link>
            <div className="flex items-center gap-2">
              {user?.role === "DOCTOR" && p.status === "ACTIVE" && (
                <>
                  <button onClick={() => fillMutation.mutate()} disabled={fillMutation.isPending}
                    className="btn-success py-2 px-4 text-sm disabled:opacity-60">
                    <CheckCircle2 size={14} /> Mark Filled
                  </button>
                  <button onClick={() => { if (confirm("Cancel this prescription?")) cancelMutation.mutate(); }}
                    disabled={cancelMutation.isPending}
                    className="btn-danger py-2 px-4 text-sm disabled:opacity-60">
                    <X size={14} /> Cancel
                  </button>
                </>
              )}
              <button onClick={handleDownload} className="btn-primary py-2 px-4 text-sm">
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>

          {/* ── Rx Pad ── */}
          <div className="rx-pad mb-6 anim-in delay-1">
            {/* Header stripe */}
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #0891B2, #0D9488, #059669)" }} />

            <div className="rx-pad-header">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="rx-symbol">℞</span>
                    <div>
                      <p className="text-xs font-black text-brand-600 tracking-widest uppercase">RxVault Digital Prescription</p>
                      <p className="text-[10px] text-slate-500 font-mono">{p.prescriptionNumber}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={p.status} size="lg" />
                  <p className="text-xs text-slate-500 font-medium">
                    Issued {format(parseISO(p.createdAt), "dd MMM yyyy")}
                  </p>
                </div>
              </div>

              {/* Status lifecycle bar */}
              {p.status !== "CANCELLED" && (
                <div className="mt-5 flex items-center gap-0">
                  {LIFECYCLE.map((s, idx) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={clsx(
                          "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                          idx <= lifecycleIdx ? "text-white" : "bg-slate-100 text-slate-400"
                        )} style={idx <= lifecycleIdx ? { background: "linear-gradient(135deg, #0891B2, #0D9488)" } : {}}>
                          <CheckCircle2 size={14} />
                        </div>
                        <p className={clsx("text-[9px] font-black uppercase tracking-wide",
                          idx <= lifecycleIdx ? "text-brand-600" : "text-slate-400")}>{s}</p>
                      </div>
                      {idx < LIFECYCLE.length - 1 && (
                        <div className={clsx("flex-1 h-0.5 mx-2 rounded", idx < lifecycleIdx ? "bg-brand-400" : "bg-slate-200")} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8">
              {/* Doctor + Patient columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pb-8 border-b border-dashed border-slate-200">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Stethoscope size={10} /> Prescribing Doctor
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-lg"
                         style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                      {doctor?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">Dr. {doctor?.name}</p>
                      <p className="text-xs text-slate-500">{doctor?.doctorProfile?.specialization}</p>
                      <p className="text-xs text-slate-400">{doctor?.doctorProfile?.hospital}</p>
                      {doctor?.doctorProfile?.licenseNumber && (
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">Lic: {doctor.doctorProfile.licenseNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <User size={10} /> Patient
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-lg"
                         style={{ background: "linear-gradient(135deg, #7C3AED, #0891B2)" }}>
                      {patient?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{patient?.name}</p>
                      <p className="text-xs text-slate-500">{patient?.email}</p>
                      {patient?.patientProfile?.bloodGroup && (
                        <span className="pill-danger text-[10px] mt-1">Blood: {patient.patientProfile.bloodGroup}</span>
                      )}
                    </div>
                  </div>
                  {allergies.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2">
                      <AlertTriangle size={11} className="text-rose-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-rose-600">Allergies</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {allergies.map((a: string) => (
                            <span key={a} className="pill-danger text-[10px]">{a}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnosis block */}
              <div className="mb-8 p-5 rounded-2xl" style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)", border: "1px solid #A5F3FC" }}>
                <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Stethoscope size={10} /> Primary Diagnosis
                </p>
                <p className="text-lg font-black text-slate-800 leading-tight">{p.diagnosis}</p>
                {p.notes && <p className="text-sm text-slate-600 mt-2 leading-relaxed border-t border-brand-200 pt-2">{p.notes}</p>}
              </div>

              {/* Medications */}
              <div className="mb-8">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Pill size={10} /> Prescribed Medications ({p.medications?.length})
                </p>
                <div className="space-y-3">
                  {p.medications?.map((m: any, i: number) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-brand-200 transition-colors"
                         style={{ background: i % 2 === 0 ? "#FAFBFF" : "#F9FFFE" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                           style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-base">{m.name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="flex items-center gap-1 pill text-[11px]">
                            <span className="text-slate-400 font-normal">Dose:</span> {m.dosage}
                          </span>
                          <span className="flex items-center gap-1 pill text-[11px]">
                            <span className="text-slate-400 font-normal">Freq:</span> {m.frequency}
                          </span>
                          <span className="flex items-center gap-1 pill text-[11px]">
                            <span className="text-slate-400 font-normal">For:</span> {m.duration}
                          </span>
                          {m.instructions && (
                            <span className="pill-brand text-[11px]">{m.instructions}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up + Date row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Calendar size={15} className="text-brand-500 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Issue Date</p>
                    <p className="text-sm font-bold text-slate-700">{format(parseISO(p.createdAt), "dd MMMM yyyy")}</p>
                  </div>
                </div>
                {p.followUpDate && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <Clock size={15} className="text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Follow-up</p>
                      <p className="text-sm font-bold text-emerald-800">{format(parseISO(p.followUpDate), "dd MMMM yyyy")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with hash */}
            <div className="px-8 py-4 border-t border-dashed border-slate-200 flex items-center justify-between"
                 style={{ background: "#FAFBFF" }}>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <Hash size={10} className="text-brand-400" />
                <span className="truncate max-w-xs">{p.qrHash || "verifiable-hash-pending"}</span>
              </div>
              <Link href={`/verify/${p.verificationHash}`} target="_blank"
                className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 hover:underline">
                <QrCode size={11} /> Verify QR <ExternalLink size={9} />
              </Link>
            </div>
          </div>

          {/* Security card */}
          <div className="card p-5 anim-in delay-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={15} className="text-emerald-600" />
              <span className="text-sm font-black text-slate-800">Prescription Verification</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="metric-tile">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
                  <QrCode size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700">QR Verification</p>
                  <p className="text-[10px] text-slate-400">Scannable & unique</p>
                </div>
              </div>
              <div className="metric-tile">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ECFEFF, #CFFAFE)" }}>
                  <Shield size={14} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700">SHA-256 Hash</p>
                  <p className="text-[10px] text-slate-400">Tamper-proof</p>
                </div>
              </div>
              <div className="metric-tile">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" }}>
                  <FileText size={14} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700">PDF Export</p>
                  <p className="text-[10px] text-slate-400">Professional format</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </AppShell>
    </AuthGuard>
  );
}
