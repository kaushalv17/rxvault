"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { toast } from "sonner";
import {
  Plus, Trash2, ArrowLeft, ArrowRight, User, CheckCircle2, AlertTriangle,
  Pill, FileText, Stethoscope, CalendarDays, ClipboardList, Search
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions: string; }
const EMPTY_MED: Medication = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

const FREQ_OPTIONS = ["Once daily","Twice daily","Three times daily","Four times daily","Every 8 hours","Every 12 hours","At bedtime","With meals","As needed"];
const DUR_OPTIONS  = ["3 days","5 days","7 days","10 days","14 days","30 days","60 days","90 days","6 months","Ongoing"];

const STEPS = [
  { id: 1, label: "Select Patient",  icon: User,          desc: "Choose who to prescribe for" },
  { id: 2, label: "Medications",     icon: Pill,          desc: "Add drugs and dosages" },
  { id: 3, label: "Diagnosis",       icon: Stethoscope,   desc: "Clinical notes and details" },
  { id: 4, label: "Review & Issue",  icon: CheckCircle2,  desc: "Confirm and send" },
];

function NewPrescriptionContent() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const qc            = useQueryClient();

  const [step, setStep]                     = useState<1|2|3|4>(1);
  const [patientId, setPatientId]           = useState(searchParams.get("patientId") || "");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [diagnosis, setDiagnosis]           = useState("");
  const [notes, setNotes]                   = useState("");
  const [followUpDate, setFollowUpDate]     = useState("");
  const [meds, setMeds]                     = useState<Medication[]>([{ ...EMPTY_MED }]);
  const [patientSearch, setPatientSearch]   = useState("");

  const { data: patients } = useQuery({
    queryKey: ["patients-search", patientSearch],
    queryFn: () => api.get("/patients", { params: { search: patientSearch, pageSize: 20 } }).then((r) => r.data.data.items),
  });

  useEffect(() => {
    if (patientId && patients) {
      const found = patients.find((p: any) => p.id === patientId);
      if (found) { setSelectedPatient(found); setPatientSearch(found.name); }
    }
  }, [patientId, patients]);

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post("/prescriptions", payload),
    onSuccess: (res) => {
      toast.success("Prescription issued successfully!");
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/prescriptions/${res.data.data.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to create prescription"),
  });

  const addMed    = () => setMeds((m) => [...m, { ...EMPTY_MED }]);
  const removeMed = (i: number) => setMeds((m) => m.filter((_, idx) => idx !== i));
  const updateMed = (i: number, k: keyof Medication, v: string) =>
    setMeds((m) => m.map((med, idx) => idx === i ? { ...med, [k]: v } : med));

  const handleSelectPatient = (pt: any) => {
    setPatientId(pt.id); setSelectedPatient(pt); setPatientSearch(pt.name);
  };

  const handleSubmit = () => {
    if (!patientId)        { toast.error("Please select a patient"); return; }
    if (!diagnosis.trim()) { toast.error("Please enter a diagnosis"); return; }
    if (meds.some((m) => !m.name || !m.dosage || !m.frequency || !m.duration)) {
      toast.error("Please fill all required medication fields"); return;
    }
    mutation.mutate({ patientId, diagnosis, medications: meds, notes: notes || undefined, followUpDate: followUpDate || undefined });
  };

  const canNextStep1 = !!selectedPatient;
  const canNextStep2 = meds.length > 0 && meds.every((m) => m.name && m.dosage && m.frequency && m.duration);
  const canNextStep3 = !!diagnosis.trim();
  const allergies: string[] = selectedPatient?.patientProfile?.allergies || [];

  return (
    <AuthGuard role="DOCTOR">
      <AppShell>
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8 anim-in">
            <Link href="/prescriptions" className="btn-ghost p-2.5 rounded-xl border border-slate-200">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="page-title" style={{ fontFamily: "Fraunces, serif" }}>New Prescription</h1>
              <p className="page-sub">Issue a new digital Rx with QR verification</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="card p-5 mb-6 anim-in delay-1">
            <div className="flex items-center">
              {STEPS.map((s, idx) => (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center cursor-pointer" onClick={() => {
                    if (s.id < step) setStep(s.id as any);
                  }}>
                    <div className={clsx(
                      "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-200",
                      step === s.id ? "text-white shadow-glow-sm scale-110" : s.id < step ? "text-white" : "bg-slate-100 text-slate-400"
                    )} style={step === s.id ? { background: "linear-gradient(135deg, #0891B2, #0D9488)" } : s.id < step ? { background: "#0891B2" } : {}}>
                      {s.id < step ? <CheckCircle2 size={16} /> : <s.icon size={15} />}
                    </div>
                    <p className={clsx("text-[10px] font-bold mt-1.5 text-center hidden sm:block",
                      step === s.id ? "text-brand-600" : s.id < step ? "text-emerald-600" : "text-slate-400"
                    )}>{s.label}</p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={clsx("flex-1 h-0.5 mx-2 rounded transition-colors", s.id < step ? "bg-brand-400" : "bg-slate-200")} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Step 1: Patient ─── */}
          {step === 1 && (
            <div className="space-y-4 anim-in">
              <div className="card p-6">
                <h2 className="text-lg font-black text-slate-800 mb-1" style={{ fontFamily: "Fraunces, serif" }}>Select Patient</h2>
                <p className="text-sm text-slate-500 mb-5">Search and select the patient for this prescription</p>

                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(null); setPatientId(""); }}
                    placeholder="Search patient by name or email…"
                    className="input pl-10" />
                </div>

                {/* Patient list */}
                {patients && !selectedPatient && (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {patients.map((pt: any) => (
                      <button key={pt.id} onClick={() => handleSelectPatient(pt)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 border border-transparent hover:border-brand-200 transition-all text-left group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0"
                             style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                          {pt.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{pt.name}</p>
                          <p className="text-xs text-slate-400 truncate">{pt.email}</p>
                        </div>
                        {pt.patientProfile?.bloodGroup && (
                          <span className="pill-danger text-[10px]">{pt.patientProfile.bloodGroup}</span>
                        )}
                      </button>
                    ))}
                    {patients.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">No patients found</p>
                    )}
                  </div>
                )}

                {/* Selected patient card */}
                {selectedPatient && (
                  <div className="p-4 rounded-2xl border-2 border-brand-300"
                       style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg"
                           style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                        {selectedPatient.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-800">{selectedPatient.name}</p>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-500">{selectedPatient.email}</p>
                      </div>
                      <button onClick={() => { setSelectedPatient(null); setPatientId(""); setPatientSearch(""); }}
                        className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Change</button>
                    </div>
                    {/* Allergy alert */}
                    {allergies.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-rose-700">Known Allergies</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {allergies.map((a: string) => (
                              <span key={a} className="pill-danger text-[10px]">{a}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedPatient.patientProfile?.bloodGroup && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500 font-semibold">Blood Group:</span>
                        <span className="font-black text-rose-600">{selectedPatient.patientProfile.bloodGroup}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button onClick={() => setStep(2)} disabled={!canNextStep1}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Medications ─── */}
          {step === 2 && (
            <div className="space-y-4 anim-in">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-black text-slate-800" style={{ fontFamily: "Fraunces, serif" }}>Medications</h2>
                  <span className="pill-brand text-xs">{meds.length} drug{meds.length !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-sm text-slate-500 mb-5">Add all prescribed medications with dosage and frequency</p>

                {/* Allergy reminder */}
                {allergies.length > 0 && (
                  <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-amber-700">
                      ⚠️ Patient is allergic to: {allergies.join(", ")}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {meds.map((med, i) => (
                    <div key={i} className="p-5 rounded-2xl border-2 border-slate-100 hover:border-brand-200 transition-colors"
                         style={{ background: i % 2 === 0 ? "#FAFBFF" : "#FAFFFE" }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs text-white"
                               style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>{i + 1}</div>
                          <span className="text-sm font-bold text-slate-700">Medication {i + 1}</span>
                        </div>
                        {meds.length > 1 && (
                          <button onClick={() => removeMed(i)}
                            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors font-semibold">
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="label-sm">Drug Name *</label>
                          <input value={med.name} onChange={(e) => updateMed(i, "name", e.target.value)}
                            className="input" placeholder="e.g. Amoxicillin 500mg" />
                        </div>
                        <div>
                          <label className="label-sm">Dosage *</label>
                          <input value={med.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)}
                            className="input" placeholder="e.g. 500mg" />
                        </div>
                        <div>
                          <label className="label-sm">Frequency *</label>
                          <select value={med.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} className="select">
                            <option value="">Select frequency</option>
                            {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label-sm">Duration *</label>
                          <select value={med.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} className="select">
                            <option value="">Select duration</option>
                            {DUR_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label-sm">Instructions</label>
                          <input value={med.instructions} onChange={(e) => updateMed(i, "instructions", e.target.value)}
                            className="input" placeholder="e.g. Take after meals" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={addMed}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-brand-300 text-brand-600 text-sm font-bold hover:bg-brand-50 transition-colors">
                  <Plus size={16} /> Add Another Medication
                </button>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft size={15} /> Back
                </button>
                <button onClick={() => setStep(3)} disabled={!canNextStep2}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Diagnosis ─── */}
          {step === 3 && (
            <div className="space-y-4 anim-in">
              <div className="card p-6">
                <h2 className="text-lg font-black text-slate-800 mb-1" style={{ fontFamily: "Fraunces, serif" }}>Diagnosis & Notes</h2>
                <p className="text-sm text-slate-500 mb-5">Clinical assessment and follow-up information</p>

                <div className="space-y-4">
                  <div>
                    <label className="label">Primary Diagnosis *</label>
                    <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                      className="input" placeholder="e.g. Acute bacterial pharyngitis" />
                  </div>
                  <div>
                    <label className="label">Clinical Notes</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                      className="input resize-none" placeholder="Additional observations, patient history, special instructions…" />
                  </div>
                  <div>
                    <label className="label">Follow-up Date</label>
                    <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)}
                      className="input" min={new Date().toISOString().split("T")[0]} />
                    <p className="text-xs text-slate-400 mt-1.5">Optional — leave blank if no follow-up needed</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="btn-secondary"><ArrowLeft size={15} /> Back</button>
                <button onClick={() => setStep(4)} disabled={!canNextStep3}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
                  Review <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Review ─── */}
          {step === 4 && (
            <div className="space-y-4 anim-in">
              {/* Rx preview */}
              <div className="rx-pad">
                <div className="rx-pad-header">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="rx-symbol">℞</span>
                        <span className="text-brand-600 font-black text-sm tracking-widest uppercase">RxVault Digital Prescription</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Issued electronically · QR verified</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {/* Doctor + Patient */}
                  <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-dashed border-slate-200">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Prescribing Doctor</p>
                      <p className="font-black text-slate-800">Dr. {"{your name}"}</p>
                      <p className="text-xs text-slate-500">RxVault Platform</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient</p>
                      <p className="font-black text-slate-800">{selectedPatient?.name}</p>
                      <p className="text-xs text-slate-500">{selectedPatient?.email}</p>
                      {selectedPatient?.patientProfile?.bloodGroup && (
                        <span className="pill-danger text-[10px] mt-1">Blood: {selectedPatient.patientProfile.bloodGroup}</span>
                      )}
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="mb-6 p-4 rounded-xl" style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)", border: "1px solid #A5F3FC" }}>
                    <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest mb-1">Diagnosis</p>
                    <p className="font-bold text-slate-800">{diagnosis}</p>
                    {notes && <p className="text-xs text-slate-500 mt-1">{notes}</p>}
                  </div>

                  {/* Medications */}
                  <div className="mb-6">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Prescribed Medications</p>
                    <div className="space-y-3">
                      {meds.map((m, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white flex-shrink-0"
                               style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>{i + 1}</div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="pill text-[10px]">{m.dosage}</span>
                              <span className="pill text-[10px]">{m.frequency}</span>
                              <span className="pill text-[10px]">{m.duration}</span>
                              {m.instructions && <span className="pill-brand text-[10px]">{m.instructions}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {followUpDate && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CalendarDays size={14} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">
                        Follow-up: {new Date(followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Allergy final warning */}
              {allergies.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-center gap-3">
                  <AlertTriangle size={18} className="text-rose-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-black text-rose-700">⚠️ Allergy Warning</p>
                    <p className="text-xs text-rose-600">Please verify medications against patient's known allergies: <strong>{allergies.join(", ")}</strong></p>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="btn-secondary"><ArrowLeft size={15} /> Back</button>
                <button onClick={handleSubmit} disabled={mutation.isPending}
                  className="btn-primary gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                  {mutation.isPending
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Issuing Rx…</>
                    : <><FileText size={15} /> Issue Prescription</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </AppShell>
    </AuthGuard>
  );
}
export default function NewPrescriptionPage() {
  return (
    <Suspense>
      <NewPrescriptionContent />
    </Suspense>
  );
}