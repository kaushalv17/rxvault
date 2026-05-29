"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2, XCircle, Shield, Activity, Pill, User,
  Calendar, QrCode, Hash, ExternalLink, Stethoscope,
  FileText, ArrowLeft, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function VerifyPage() {
  const { hash } = useParams<{ hash: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["verify", hash],
    queryFn: () => api.get(`/verify/${hash}`).then((r) => r.data.data),  // ✅ FIXED endpoint
    retry: false,
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(145deg, #F0F4F8 0%, #E8F4F8 100%)" }}>
      {/* Top nav */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800" style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>RxVault</span>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
            Prescription Verification Portal
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-xl">

          {/* Loading */}
          {isLoading && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                   style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)", border: "1px solid #A5F3FC" }}>
                <QrCode size={32} className="text-brand-600 animate-pulse" />
              </div>
              <p className="font-bold text-slate-700 mb-1">Verifying prescription…</p>
              <p className="text-sm text-slate-400">Checking cryptographic hash</p>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto mb-5">
                <XCircle size={36} className="text-rose-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2" style={{ fontFamily: "Fraunces, serif" }}>Verification Failed</h2>
              <p className="text-slate-500 mb-6">This prescription could not be verified. It may be invalid, tampered, or the QR code may be incorrect.</p>
              <div className="card p-5 text-left mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-1">What this means</p>
                    <ul className="text-xs text-slate-500 space-y-1">
                      <li>• The prescription hash doesn't match our records</li>
                      <li>• The document may have been altered</li>
                      <li>• Contact the prescribing doctor for confirmation</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Link href="/" className="btn-secondary inline-flex"><ArrowLeft size={14} /> Go Back</Link>
            </div>
          )}

          {/* Success */}
          {data && (
            <div className="space-y-5 anim-in">
              {/* Verified banner */}
              <div className="text-center p-6 rounded-3xl border-2 border-emerald-300"
                   style={{ background: "linear-gradient(135deg, #ECFDF5, #F0FDFA)" }}>
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1" style={{ fontFamily: "Fraunces, serif" }}>Prescription Verified</h2>
                <p className="text-emerald-600 text-sm font-semibold">This is an authentic RxVault prescription</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <StatusBadge status={data.status} size="lg" />
                </div>
              </div>

              {/* Rx number + hash */}
              <div className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash size={13} className="text-brand-400" />
                  <span className="text-xs font-mono text-slate-500 truncate max-w-xs">{hash}</span>
                </div>
                <span className="pill-brand text-[10px]">{data.prescriptionNumber}</span>
              </div>

              {/* Rx Pad Preview */}
              <div className="rx-pad">
                <div className="h-1.5" style={{ background: "linear-gradient(90deg, #0891B2, #0D9488, #059669)" }} />
                <div className="rx-pad-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="rx-symbol">℞</span>
                      <div>
                        <p className="text-xs font-black text-brand-600 tracking-widest uppercase">Digital Prescription</p>
                        <p className="text-[10px] font-mono text-slate-400">{data.prescriptionNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <Shield size={13} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">Authenticated</span>
                    </div>
                  </div>
                </div>

                <div className="p-7 space-y-6">
                  {/* Doctor + Patient */}
                  <div className="grid grid-cols-2 gap-5 pb-6 border-b border-dashed border-slate-200">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
                        <Stethoscope size={9} /> Doctor
                      </p>
                      <p className="font-black text-slate-800">Dr. {data.doctor?.name}</p>
                      <p className="text-xs text-slate-500">{data.doctor?.doctorProfile?.specialization}</p>
                      <p className="text-xs text-slate-400">{data.doctor?.doctorProfile?.hospital}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
                        <User size={9} /> Patient
                      </p>
                      <p className="font-black text-slate-800">{data.patient?.name}</p>
                      <p className="text-xs text-slate-500">{data.patient?.email}</p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)", border: "1px solid #A5F3FC" }}>
                    <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest mb-1">Diagnosis</p>
                    <p className="font-black text-slate-800 text-base">{data.diagnosis}</p>
                    {data.notes && <p className="text-xs text-slate-500 mt-1">{data.notes}</p>}
                  </div>

                  {/* Medications */}
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <Pill size={9} /> Medications ({data.medications?.length})
                    </p>
                    <div className="space-y-2.5">
                      {data.medications?.map((m: any, i: number) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white flex-shrink-0"
                               style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>{i + 1}</div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <span className="pill text-[10px]">{m.dosage}</span>
                              <span className="pill text-[10px]">{m.frequency}</span>
                              <span className="pill text-[10px]">{m.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <Calendar size={14} className="text-slate-400" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Issued</p>
                        <p className="text-xs font-bold text-slate-700">{format(parseISO(data.createdAt), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                    {data.followUpDate && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <Calendar size={14} className="text-emerald-600" />
                        <div>
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Follow-up</p>
                          <p className="text-xs font-bold text-emerald-800">{format(parseISO(data.followUpDate), "dd MMM yyyy")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-7 py-4 border-t border-dashed border-slate-200 flex items-center justify-between"
                     style={{ background: "#FAFBFF" }}>
                  <div className="flex items-center gap-2">
                    <Shield size={11} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600">Cryptographically verified by RxVault</span>
                  </div>
                  <FileText size={11} className="text-slate-400" />
                </div>
              </div>

              {/* Footer note */}
              <p className="text-center text-xs text-slate-400">
                Verified via RxVault Prescription Authentication System · For pharmacist use only
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}