"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Users, Search, Plus, ChevronRight, Heart, AlertTriangle, FileText, X } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const PAGE_SIZE = 16;

  const { data, isLoading } = useQuery({
    queryKey: ["patients", search, page],
    queryFn: () => api.get("/patients", { params: { search: search || undefined, page, pageSize: PAGE_SIZE } }).then((r) => r.data.data),
  });

  const items: any[] = data?.items || [];
  const total = data?.total || 0;

  return (
    <AuthGuard role="DOCTOR">
      <AppShell>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 anim-in">
          <div>
            <h1 className="page-title" style={{ fontFamily: "Fraunces, serif" }}>Patient Directory</h1>
            <p className="page-sub">{total} registered patients · all time</p>
          </div>
        </div>

        {/* Search */}
        <div className="card p-4 mb-6 anim-in delay-1">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email…" className="input pl-10 pr-10" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Patient grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-44 shimmer-bg rounded-2xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-600 mb-1">No patients found</p>
            <p className="text-sm text-slate-400">{search ? `No results for "${search}"` : "Patients appear when they register"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 anim-in delay-2">
            {items.map((pt: any) => (
              <Link key={pt.id} href={`/patients/${pt.id}`}>
                <div className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden h-full">
                  <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7C3AED, #0891B2)" }} />
                  <div className="p-5">
                    {/* Avatar + name */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl flex-shrink-0"
                           style={{ background: "linear-gradient(135deg, #7C3AED, #0891B2)" }}>
                        {pt.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 truncate">{pt.name}</p>
                        <p className="text-xs text-slate-400 truncate">{pt.email}</p>
                      </div>
                    </div>

                    {/* Health info pills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pt.patientProfile?.bloodGroup && (
                        <span className="pill-danger text-[10px] font-black">🩸 {pt.patientProfile.bloodGroup}</span>
                      )}
                      {pt.patientProfile?.allergies?.length > 0 && (
                        <span className="pill-amber text-[10px]">
                          <AlertTriangle size={8} /> {pt.patientProfile.allergies.length} allerg{pt.patientProfile.allergies.length === 1 ? "y" : "ies"}
                        </span>
                      )}
                      {pt.patientProfile?.phone && (
                        <span className="pill text-[10px]">{pt.patientProfile.phone}</span>
                      )}
                    </div>

                    {/* Rx count + CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <FileText size={11} className="text-brand-400" />
                        {pt._count?.prescriptions ?? 0} prescription{pt._count?.prescriptions !== 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:gap-2 transition-all">
                        View <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {Math.ceil(total / PAGE_SIZE) > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {[...Array(Math.min(5, Math.ceil(total / PAGE_SIZE)))].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={clsx("w-9 h-9 rounded-xl text-sm font-bold transition-all",
                  page === i + 1 ? "text-white" : "bg-white border border-slate-200 text-slate-600"
                )}
                style={page === i + 1 ? { background: "linear-gradient(135deg, #0891B2, #0D9488)" } : {}}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
