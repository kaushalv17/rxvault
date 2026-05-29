"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/store/auth";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  FolderOpen, Trash2, FileText, Plus, Search, X,
  FlaskConical, Scan, Stethoscope, Syringe, AlertTriangle,
  User, ChevronDown, ChevronUp,
} from "lucide-react";
import { clsx } from "clsx";

const RECORD_TYPE_MAP: Record<string, { label: string; color: string; icon: any }> = {
  LAB_RESULT:   { label: "Lab Result",   color: "bg-brand-50 text-brand-700 border-brand-200",   icon: FlaskConical },
  IMAGING:      { label: "Imaging",      color: "bg-violet-50 text-violet-700 border-violet-200", icon: Scan },
  DIAGNOSIS:    { label: "Diagnosis",    color: "bg-teal-50 text-teal-700 border-teal-200",       icon: Stethoscope },
  SURGERY:      { label: "Surgery",      color: "bg-rose-50 text-rose-700 border-rose-200",       icon: FileText },
  VACCINATION:  { label: "Vaccination",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Syringe },
  ALLERGY:      { label: "Allergy",      color: "bg-amber-50 text-amber-700 border-amber-200",    icon: AlertTriangle },
  OTHER:        { label: "Other",        color: "bg-slate-100 text-slate-600 border-slate-200",   icon: FileText },
};

const FILTER_TABS = [
  { key: "ALL",         label: "All" },
  { key: "LAB_RESULT",  label: "Lab Result" },
  { key: "IMAGING",     label: "Imaging" },
  { key: "DIAGNOSIS",   label: "Diagnosis" },
  { key: "SURGERY",     label: "Surgery" },
  { key: "VACCINATION", label: "Vaccination" },
  { key: "ALLERGY",     label: "Allergy" },
  { key: "OTHER",       label: "Other" },
];

export default function RecordsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter]  = useState("ALL");
  const [showForm, setShowForm]      = useState(false);
  const [expandedId, setExpandedId]  = useState<string | null>(null);

  // Form state (doctor only)
  const [formPatientId, setFormPatientId]   = useState("");
  const [formTitle, setFormTitle]           = useState("");
  const [formDesc, setFormDesc]             = useState("");
  const [formType, setFormType]             = useState("LAB_RESULT");

  const { data: rawRecords, isLoading } = useQuery({
    queryKey: ["records"],
    queryFn: () => api.get("/medical-records").then((r) => r.data.data),
  });

  const records: any[] = Array.isArray(rawRecords)
    ? rawRecords
    : rawRecords?.items ?? [];

  // Patients list for doctor's form
  const { data: patientsData } = useQuery({
    queryKey: ["patients-for-records"],
    queryFn: () => api.get("/patients", { params: { pageSize: 100 } }).then((r) => r.data.data),
    enabled: user?.role === "DOCTOR",
  });
  const patients: any[] = patientsData?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/medical-records", body),
    onSuccess: () => {
      toast.success("Record added successfully");
      qc.invalidateQueries({ queryKey: ["records"] });
      setShowForm(false);
      setFormTitle(""); setFormDesc(""); setFormPatientId(""); setFormType("LAB_RESULT");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to create record"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/medical-records/${id}`),
    onSuccess: () => { toast.success("Record deleted"); qc.invalidateQueries({ queryKey: ["records"] }); },
    onError: () => toast.error("Delete failed"),
  });

  const handleCreate = () => {
    if (!formTitle.trim() || !formDesc.trim() || !formPatientId) {
      toast.error("Please fill all fields and select a patient");
      return;
    }
    createMutation.mutate({
      patientId: formPatientId,
      title: formTitle,
      description: formDesc,
      recordType: formType,
    });
  };

  const filtered = records.filter((r: any) => {
    const matchSearch = !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient?.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || r.recordType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <AuthGuard>
      <AppShell>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 anim-in">
          <div>
            <h1 className="page-title" style={{ fontFamily: "Fraunces, serif" }}>Medical Records</h1>
            <p className="page-sub">{records.length} records · {user?.role === "DOCTOR" ? "your patients" : "your health history"}</p>
          </div>
          {user?.role === "DOCTOR" && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              <Plus size={15} /> Add Record
            </button>
          )}
        </div>

        {/* Create form (doctors only) */}
        {showForm && user?.role === "DOCTOR" && (
          <div className="card p-6 mb-6 border-2 border-brand-200 anim-in"
               style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-800" style={{ fontFamily: "Fraunces, serif" }}>New Medical Record</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5 rounded-lg">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Patient *</label>
                <select value={formPatientId} onChange={(e) => setFormPatientId(e.target.value)} className="select">
                  <option value="">Select patient…</option>
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Record Type *</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className="select">
                  {Object.entries(RECORD_TYPE_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Title *</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  className="input" placeholder="e.g. Complete Blood Count — June 2025" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description / Findings *</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  rows={3} className="input resize-none"
                  placeholder="Enter clinical findings, results, observations…" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary disabled:opacity-60">
                {createMutation.isPending
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  : <><Plus size={14} /> Save Record</>}
              </button>
            </div>
          </div>
        )}

        {/* Search + type filter */}
        <div className="card p-4 mb-6 anim-in delay-1">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, description or patient name…" className="input pl-10" />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap mt-3">
            {FILTER_TABS.map((t) => (
              <button key={t.key} onClick={() => setTypeFilter(t.key)}
                className={clsx("px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                  typeFilter === t.key
                    ? "text-white border-transparent"
                    : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
                )}
                style={typeFilter === t.key ? { background: "linear-gradient(135deg, #0891B2, #0D9488)" } : {}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Records list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 shimmer-bg rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center anim-in">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={32} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-600 mb-1">No records found</p>
            <p className="text-sm text-slate-400">
              {search ? `No results for "${search}"` : user?.role === "DOCTOR" ? "Add your first medical record above" : "Your doctor hasn't added any records yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 anim-in delay-2">
            {filtered.map((r: any) => {
              const typeInfo = RECORD_TYPE_MAP[r.recordType] || RECORD_TYPE_MAP.OTHER;
              const Icon = typeInfo.icon;
              const isExpanded = expandedId === r.id;

              return (
                <div key={r.id} className="card overflow-hidden hover:shadow-card-hover transition-all duration-200">
                  {/* Main row — clickable to expand */}
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                         style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)", border: "1px solid #A5F3FC" }}>
                      <Icon size={20} className="text-brand-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-black text-slate-800 truncate">{r.title || "Untitled Record"}</p>
                        <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border", typeInfo.color)}>
                          {typeInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium flex-wrap">
                        {r.patient?.name && (
                          <span className="flex items-center gap-1">
                            <User size={10} className="text-violet-400" />
                            <span className="font-bold text-slate-600">{r.patient.name}</span>
                          </span>
                        )}
                        {r.doctor?.name && (
                          <span className="flex items-center gap-1">
                            <Stethoscope size={10} className="text-brand-400" />
                            Dr. {r.doctor.name}
                          </span>
                        )}
                        <span>{format(parseISO(r.createdAt), "dd MMM yyyy")}</span>
                      </div>
                      {/* Description preview */}
                      {!isExpanded && r.description && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{r.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user?.role === "DOCTOR" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this record?")) deleteMutation.mutate(r.id);
                          }}
                          className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="p-2 text-slate-300">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-100 pt-4"
                         style={{ background: "linear-gradient(135deg, #FAFBFF, #F9FFFE)" }}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Notes / Findings</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.description}</p>

                      {r.attachments?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Attachments</p>
                          <div className="flex flex-wrap gap-2">
                            {r.attachments.map((att: string, i: number) => (
                              <span key={i} className="pill-brand text-xs">{att}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                        <span>Record ID: <span className="font-mono">{r.id?.slice(0, 8)}…</span></span>
                        <span>Added: {format(parseISO(r.createdAt), "dd MMMM yyyy, h:mm a")}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}