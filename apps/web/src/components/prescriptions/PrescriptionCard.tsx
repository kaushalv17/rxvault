"use client";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Download, Eye, FileText, Calendar, Pill, Clock, QrCode, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import api from "@/lib/api";
import { toast } from "sonner";

export function PrescriptionCard({ prescription: p, viewAs }: { prescription: any; viewAs: string }) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const toastId = toast.loading("Generating PDF…");
    try {
      const res = await api.get(`/prescriptions/${p.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `${p.prescriptionNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!", { id: toastId });
    } catch {
      toast.error("Download failed", { id: toastId });
    }
  };

  const person = viewAs === "DOCTOR" ? p.patient : p.doctor;

  return (
    <Link href={`/prescriptions/${p.id}`}>
      <div className="card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 cursor-pointer group overflow-hidden h-full flex flex-col">
        {/* Colored top stripe */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0891B2, #0D9488)" }} />

        <div className="p-5 flex flex-col gap-3 flex-1">
          {/* Top: person + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
                   style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                {person?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-slate-400 truncate">{p.prescriptionNumber}</p>
                <p className="text-sm font-bold text-slate-800 truncate">{person?.name}</p>
              </div>
            </div>
            <StatusBadge status={p.status} size="sm" />
          </div>

          {/* Diagnosis */}
          <div className="flex-1 p-3 rounded-xl" style={{ background: "linear-gradient(135deg, #F8FAFC, #F0F9FF)" }}>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Diagnosis</p>
            <p className="text-sm text-slate-700 font-semibold line-clamp-2 leading-snug">{p.diagnosis}</p>
          </div>

          {/* Medications */}
          {p.medications?.length > 0 && (
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Medications</p>
              <div className="flex flex-wrap gap-1.5">
                {p.medications.slice(0, 2).map((m: any, i: number) => (
                  <span key={i} className="pill text-[10px] flex items-center gap-1">
                    <Pill size={8} className="text-brand-500" /> {m.name}
                  </span>
                ))}
                {p.medications.length > 2 && (
                  <span className="pill text-[10px] text-slate-500">+{p.medications.length - 2} more</span>
                )}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1"><Calendar size={9} /> {format(parseISO(p.createdAt), "MMM d, yyyy")}</span>
            <span className="flex items-center gap-1"><Pill size={9} /> {p.medications?.length} meds</span>
            {p.followUpDate && (
              <span className="flex items-center gap-1 text-teal-600 font-bold ml-auto">
                <Clock size={9} /> {format(parseISO(p.followUpDate), "MMM d")}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 -mx-1">
            <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 group-hover:bg-brand-100 transition-colors">
              <Eye size={12} /> View Rx
            </span>
            <button onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
              <Download size={12} /> PDF
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
