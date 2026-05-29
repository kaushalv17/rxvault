"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/store/auth";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { toast } from "sonner";
import { User, Stethoscope, Heart, Shield, Bell, Save, Plus, X, Key, Mail, Phone, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";

const TABS = ["Profile", "Security"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function SettingsPage() {
  const { user, login } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("Profile");
  const [newAllergy, setNewAllergy] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["settings-profile"],
    queryFn: () => api.get("/auth/me").then((r) => r.data.data),
  });

  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (profile) setForm({
      name: profile.name || "",
      phone: profile.patientProfile?.phone || profile.doctorProfile?.phone || "",
      bloodGroup: profile.patientProfile?.bloodGroup || "",
      allergies: Array.isArray(profile.patientProfile?.allergies)
  ? profile.patientProfile.allergies
  : JSON.parse((profile.patientProfile?.allergies as unknown as string) || "[]"),
      dateOfBirth: profile.patientProfile?.dateOfBirth?.split("T")[0] || "",
      gender: profile.patientProfile?.gender || "",
      weight: profile.patientProfile?.weight || "",
      height: profile.patientProfile?.height || "",
      specialization: profile.doctorProfile?.specialization || "",
      hospital: profile.doctorProfile?.hospital || "",
      licenseNumber: profile.doctorProfile?.licenseNumber || "",
      experience: profile.doctorProfile?.experience || "",
    });
  }, [profile]);

 const updateMutation = useMutation({
  mutationFn: (data: any) => api.put("/auth/profile", data),
  onSuccess: async () => {
    toast.success("Profile updated!");
    // Re-fetch fresh user data and update auth context
    const res = await api.get("/auth/me");
    const token = localStorage.getItem("rxvault_token") || "";
    login(token, res.data.data);
    qc.invalidateQueries({ queryKey: ["settings-profile"] });
  },
  onError: (e: any) => toast.error(e.response?.data?.error || "Update failed"),
});

  const pwdMutation = useMutation({
    mutationFn: (data: any) => api.put("/auth/change-password", data),
    onSuccess: () => { toast.success("Password changed!"); setCurrentPwd(""); setNewPwd(""); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    set("allergies", [...(form.allergies || []), newAllergy.trim()]);
    setNewAllergy("");
  };
  const removeAllergy = (a: string) => set("allergies", form.allergies.filter((x: string) => x !== a));

  const handleSave = () => updateMutation.mutate(form);

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-8 anim-in">
            <h1 className="page-title" style={{ fontFamily: "Fraunces, serif" }}>Settings</h1>
            <p className="page-sub">Manage your account, profile, and security</p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl mb-6 anim-in delay-1 w-fit">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx("px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                  tab === t ? "text-white shadow-glow-sm" : "text-slate-500 hover:text-slate-700"
                )}
                style={tab === t ? { background: "linear-gradient(135deg, #0891B2, #0D9488)" } : {}}>
                {t}
              </button>
            ))}
          </div>

          {/* ─── Profile Tab ─── */}
          {tab === "Profile" && (
            <div className="space-y-5 anim-in">
              {/* Avatar hero */}
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl text-white"
                       style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
                    {form.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-xl text-slate-800">{form.name || profile?.name}</p>
                    <p className="text-slate-500 text-sm">{profile?.email}</p>
                    <span className={clsx("mt-1 inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      user?.role === "DOCTOR" ? "bg-brand-50 text-brand-600 border border-brand-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    )}>{user?.role}</span>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <User size={16} className="text-brand-600" />
                  <h3 className="font-black text-slate-800">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input value={form.name || ""} onChange={(e) => set("name", e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} className="input" placeholder="+91 98765 43210" />
                  </div>
                </div>
              </div>

              {/* Doctor-specific */}
              {user?.role === "DOCTOR" && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Stethoscope size={16} className="text-brand-600" />
                    <h3 className="font-black text-slate-800">Medical Profile</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Specialization</label>
                      <input value={form.specialization || ""} onChange={(e) => set("specialization", e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Hospital / Clinic</label>
                      <input value={form.hospital || ""} onChange={(e) => set("hospital", e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">License Number</label>
                      <input value={form.licenseNumber || ""} onChange={(e) => set("licenseNumber", e.target.value)} className="input font-mono" />
                    </div>
                    <div>
                      <label className="label">Years of Experience</label>
                      <input type="number" value={form.experience || ""} onChange={(e) => set("experience", e.target.value)} className="input" min={0} />
                    </div>
                  </div>
                </div>
              )}

              {/* Patient-specific */}
              {user?.role === "PATIENT" && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Heart size={16} className="text-rose-500" />
                    <h3 className="font-black text-slate-800">Health Profile</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Date of Birth</label>
                      <input type="date" value={form.dateOfBirth || ""} onChange={(e) => set("dateOfBirth", e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Gender</label>
                      <select value={form.gender || ""} onChange={(e) => set("gender", e.target.value)} className="select">
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Blood Group</label>
                      <select value={form.bloodGroup || ""} onChange={(e) => set("bloodGroup", e.target.value)} className="select">
                        <option value="">Select</option>
                        {BLOOD_GROUPS.map((bg) => <option key={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Weight (kg)</label>
                      <input type="number" value={form.weight || ""} onChange={(e) => set("weight", e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Height (cm)</label>
                      <input type="number" value={form.height || ""} onChange={(e) => set("height", e.target.value)} className="input" />
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="mt-5">
                    <label className="label">Known Allergies</label>
                    <div className="flex gap-2 mb-3">
                      <input value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addAllergy()}
                        className="input flex-1" placeholder="e.g. Penicillin" />
                      <button onClick={addAllergy} className="btn-primary px-4">
                        <Plus size={15} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(form.allergies || []).map((a: string) => (
                        <span key={a} className="pill-danger flex items-center gap-1.5">
                          {a}
                          <button onClick={() => removeAllergy(a)} className="hover:text-rose-800 ml-0.5"><X size={10} /></button>
                        </span>
                      ))}
                      {!(form.allergies?.length) && <p className="text-xs text-slate-400">No allergies recorded</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={handleSave} disabled={updateMutation.isPending}
                  className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none px-8">
                  {updateMutation.isPending
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    : <><Save size={15} /> Save Changes</>}
                </button>
              </div>
            </div>
          )}

          {/* ─── Security Tab ─── */}
          {tab === "Security" && (
            <div className="space-y-5 anim-in">
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Key size={16} className="text-brand-600" />
                  <h3 className="font-black text-slate-800">Change Password</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="label">Current Password</label>
                    <div className="relative">
                      <input type={showCurrent ? "text" : "password"} value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)} className="input pr-12" />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <input type={showNew ? "text" : "password"} value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)} className="input pr-12" placeholder="Min. 8 characters" />
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPwd && (
                      <div className="flex gap-1 mt-2">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={clsx("h-1 flex-1 rounded-full transition-colors",
                            newPwd.length >= i * 2 ? i <= 1 ? "bg-rose-400" : i <= 2 ? "bg-amber-400" : i <= 3 ? "bg-brand-400" : "bg-emerald-400" : "bg-slate-200"
                          )} />
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => pwdMutation.mutate({ currentPassword: currentPwd, newPassword: newPwd })}
                    disabled={!currentPwd || !newPwd || pwdMutation.isPending}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    {pwdMutation.isPending
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                      : <><Shield size={15} /> Update Password</>}
                  </button>
                </div>
              </div>

              {/* Account info */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={16} className="text-emerald-600" />
                  <h3 className="font-black text-slate-800">Account Security</h3>
                </div>
                <div className="space-y-3">
                  {[
                    ["Email Verified", profile?.emailVerified ? "Verified ✓" : "Not verified", profile?.emailVerified ? "text-emerald-600" : "text-amber-600"],
                    ["Account Type", user?.role || "", "text-brand-600"],
                    ["Email Address", profile?.email || "", "text-slate-700"],
                  ].map(([label, value, cls]) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-500 font-semibold">{label}</span>
                      <span className={clsx("text-sm font-bold", cls)}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </AppShell>
    </AuthGuard>
  );
}
