"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/store/auth";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { PrescriptionCard } from "@/components/prescriptions/PrescriptionCard";
import { FileText, Plus, Search, Filter, ChevronLeft, ChevronRight, X, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

const STATUSES = ["ALL", "ACTIVE", "FILLED", "EXPIRED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  ALL: "bg-slate-100 text-slate-700 border-slate-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FILLED: "bg-brand-50 text-brand-700 border-brand-200",
  EXPIRED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};
const STATUS_ACTIVE_COLORS: Record<string, string> = {
  ALL: "bg-slate-800 text-white border-slate-800",
  ACTIVE: "bg-emerald-600 text-white border-emerald-600",
  FILLED: "bg-brand-600 text-white border-brand-600",
  EXPIRED: "bg-rose-600 text-white border-rose-600",
  CANCELLED: "bg-slate-600 text-white border-slate-600",
};

function PrescriptionsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "ALL");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const { data, isLoading } = useQuery({
    queryKey: ["prescriptions", status, search, page],
    queryFn: () => api.get("/prescriptions", {
      params: { status: status === "ALL" ? undefined : status, search: search || undefined, page, pageSize: PAGE_SIZE }
    }).then((r) => r.data.data),
  });

  const items: any[] = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AuthGuard>
      <AppShell>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 anim-in">
          <div>
            <h1 className="page-title" style={{ fontFamily: "Fraunces, serif" }}>Prescriptions</h1>
            <p className="page-sub">{total} total records · filtered by <span className="font-bold text-slate-700">{status === "ALL" ? "all statuses" : status.toLowerCase()}</span></p>
          </div>
          {user?.role === "DOCTOR" && (
            <Link href="/prescriptions/new" className="btn-primary">
              <Plus size={15} /> New Prescription
            </Link>
          )}
        </div>

        {/* Filters card */}
        <div className="card p-4 mb-6 anim-in delay-1">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={user?.role === "DOCTOR" ? "Search by patient name or diagnosis…" : "Search by diagnosis or doctor…"}
                className="input pl-10 pr-10"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                  className={clsx(
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-150",
                    status === s ? STATUS_ACTIVE_COLORS[s] : STATUS_COLORS[s], "hover:opacity-90"
                  )}>
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 shimmer-bg rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card p-16 text-center anim-in">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No prescriptions found</h3>
            <p className="text-sm text-slate-400 mb-6">
              {search ? `No results for "${search}"` : "No prescriptions match the selected filter"}
            </p>
            {user?.role === "DOCTOR" && (
              <Link href="/prescriptions/new" className="btn-primary inline-flex mx-auto">
                <Plus size={14} /> Create First Prescription
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 anim-in delay-2">
            {items.map((p: any) => (
              <PrescriptionCard key={p.id} prescription={p} viewAs={user?.role || "PATIENT"} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 card p-4 anim-in delay-3">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}</span> of <span className="font-bold text-slate-700">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={15} />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={clsx("w-9 h-9 rounded-xl text-sm font-bold transition-all",
                      page === p ? "text-white shadow-glow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300"
                    )}
                    style={page === p ? { background: "linear-gradient(135deg, #0891B2, #0D9488)" } : {}}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}export default function PrescriptionsPage() {
  return (
    <Suspense>
      <PrescriptionsContent />
    </Suspense>
  );
}
