"use client";
import { CheckCircle2, AlertCircle, Ban, RefreshCw, Clock } from "lucide-react";
import { clsx } from "clsx";

const config: Record<string, { cls: string; Icon: any; label: string; dot: string }> = {
  ACTIVE:    { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2, label: "Active",    dot: "bg-emerald-500" },
  FILLED:    { cls: "bg-brand-50 text-brand-700 border-brand-200",       Icon: RefreshCw,   label: "Filled",    dot: "bg-brand-500" },
  EXPIRED:   { cls: "bg-rose-50 text-rose-700 border-rose-200",          Icon: AlertCircle, label: "Expired",   dot: "bg-rose-500" },
  CANCELLED: { cls: "bg-slate-100 text-slate-600 border-slate-200",      Icon: Ban,         label: "Cancelled", dot: "bg-slate-400" },
  PENDING:   { cls: "bg-amber-50 text-amber-700 border-amber-200",       Icon: Clock,       label: "Pending",   dot: "bg-amber-500" },
};

export function StatusBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" | "lg" }) {
  const c = config[status] || config.CANCELLED;
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 font-bold border rounded-lg",
      c.cls,
      size === "sm" ? "px-2 py-0.5 text-[10px]" :
      size === "lg" ? "px-3.5 py-1.5 text-sm" :
                      "px-2.5 py-1 text-xs"
    )}>
      <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
      {c.label}
    </span>
  );
}
