"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Stethoscope, Heart, ShieldCheck, Plus, X, ChevronRight, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SPECIALIZATIONS = ["General Physician","Cardiologist","Dermatologist","Neurologist","Orthopedic","Pediatrician","Psychiatrist","Ophthalmologist","ENT Specialist","Gynecologist","Oncologist","Radiologist","Anesthesiologist","Other"];

type Role = "DOCTOR" | "PATIENT";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]         = useState(1);
  const [role, setRole]         = useState<Role>("PATIENT");
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [newAllergy, setNewAllergy] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", password: "",
    phone: "", bloodGroup: "", gender: "", dateOfBirth: "", weight: "", height: "",
    allergies: [] as string[],
    specialization: "", hospital: "", licenseNumber: "", experience: "",
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    set("allergies", [...form.allergies, newAllergy.trim()]);
    setNewAllergy("");
  };
  const removeAllergy = (a: string) => set("allergies", form.allergies.filter((x) => x !== a));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Please fill all required fields"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", { ...form, role });
      toast.success("Account created! Please sign in.");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const canStep2 = form.name && form.email && form.password.length >= 8;

  return (
    <div className="min-h-screen flex bg-[#F0F4F8]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-center px-12"
           style={{ background: "linear-gradient(145deg, #0B1437 0%, #0d2060 60%, #083344 100%)" }}>
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 25% 40%, rgba(8,145,178,0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(13,148,136,0.2) 0%, transparent 40%)"
        }} />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-12">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)", boxShadow: "0 6px 24px rgba(8,145,178,0.45)" }}>
            <span className="text-white font-black text-xl" style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Rx</span>
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>RxVault</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "Fraunces, serif" }}>
            Join India's most advanced<br />
            <span style={{ background: "linear-gradient(90deg, #22D3EE, #2DD4BF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              prescription platform
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Doctors and patients trust RxVault for secure, verifiable digital prescriptions with QR authentication and complete EMR management.
          </p>

          <div className="space-y-4">
            {[
              { icon: ShieldCheck, text: "QR-verified prescriptions — impossible to forge" },
              { icon: Stethoscope, text: "Complete patient medical history at your fingertips" },
              { icon: Heart, text: "Patients access all Rx and health records securely" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(8,145,178,0.25)" }}>
                  <Icon size={15} className="text-brand-300" />
                </div>
                <p className="text-slate-300 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-12 pt-8 border-t border-white/10">
          <p className="text-slate-500 text-xs">© 2025 RxVault · Jaypee Brothers Medical Assessment</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
              <span className="text-white font-black" style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Rx</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">RxVault</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>Create account</h2>
            <p className="text-slate-500 text-sm mt-1">Join RxVault as a doctor or patient</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(["DOCTOR", "PATIENT"] as Role[]).map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200",
                  role === r ? "border-brand-500 text-brand-700 scale-[1.02]" : "border-slate-200 text-slate-500 hover:border-brand-200"
                )}
                style={role === r ? { background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)" } : { background: "white" }}>
                {r === "DOCTOR"
                  ? <Stethoscope size={22} className={role === r ? "text-brand-600" : "text-slate-400"} />
                  : <Heart size={22} className={role === r ? "text-brand-600" : "text-slate-400"} />}
                {r === "DOCTOR" ? "I'm a Doctor" : "I'm a Patient"}
              </button>
            ))}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className={clsx("flex items-center gap-2", s < 2 ? "flex-1" : "")}>
                <div className={clsx("w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                  step >= s ? "text-white" : "bg-slate-100 text-slate-400"
                )} style={step >= s ? { background: "linear-gradient(135deg, #0891B2, #0D9488)" } : {}}>
                  {s}
                </div>
                <span className={clsx("text-xs font-bold", step >= s ? "text-brand-600" : "text-slate-400")}>
                  {s === 1 ? "Account" : "Profile"}
                </span>
                {s < 2 && <div className={clsx("flex-1 h-0.5 rounded mx-1", step > 1 ? "bg-brand-400" : "bg-slate-200")} />}
              </div>
            ))}
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (canStep2) setStep(2); } : handleSubmit}>

            {/* Step 1: Account basics */}
            {step === 1 && (
              <div className="space-y-4 anim-in">
                <div>
                  <label className="label">Full Name *</label>
                  <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="Dr. Priya Sharma" required />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" placeholder="doctor@hospital.com" required />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} value={form.password}
                      onChange={(e) => set("password", e.target.value)} className="input pr-12"
                      placeholder="Min. 8 characters" required minLength={8} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={clsx("h-1 flex-1 rounded-full transition-colors",
                          form.password.length >= i * 2 ? i <= 1 ? "bg-rose-400" : i <= 2 ? "bg-amber-400" : i <= 3 ? "bg-brand-400" : "bg-emerald-400" : "bg-slate-200"
                        )} />
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" disabled={!canStep2}
                  className="btn-primary w-full justify-center py-3.5 mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Profile details */}
            {step === 2 && (
              <div className="space-y-4 anim-in">
                {role === "DOCTOR" ? (
                  <>
                    <div>
                      <label className="label">Specialization</label>
                      <select value={form.specialization} onChange={(e) => set("specialization", e.target.value)} className="select">
                        <option value="">Select specialization</option>
                        {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Hospital / Clinic</label>
                      <input value={form.hospital} onChange={(e) => set("hospital", e.target.value)} className="input" placeholder="e.g. AIIMS Delhi" />
                    </div>
                    <div>
                      <label className="label">Medical License Number</label>
                      <input value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} className="input font-mono" placeholder="MCI-XXXXX" />
                    </div>
                    <div>
                      <label className="label">Years of Experience</label>
                      <input type="number" value={form.experience} onChange={(e) => set("experience", e.target.value)} className="input" min={0} placeholder="0" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Date of Birth</label>
                        <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} className="input" />
                      </div>
                      <div>
                        <label className="label">Gender</label>
                        <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="select">
                          <option value="">Select</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Blood Group</label>
                      <div className="grid grid-cols-4 gap-2">
                        {BLOOD_GROUPS.map((bg) => (
                          <button key={bg} type="button" onClick={() => set("bloodGroup", bg)}
                            className={clsx("py-2 rounded-xl text-sm font-black border-2 transition-all",
                              form.bloodGroup === bg ? "border-rose-400 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-500 hover:border-rose-200"
                            )}>
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" placeholder="+91 98765 43210" />
                    </div>
                    <div>
                      <label className="label">Allergies (optional)</label>
                      <div className="flex gap-2 mb-2">
                        <input value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
                          className="input flex-1" placeholder="e.g. Penicillin" />
                        <button type="button" onClick={addAllergy} className="btn-primary px-3"><Plus size={14} /></button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {form.allergies.map((a) => (
                          <span key={a} className="pill-danger flex items-center gap-1">
                            {a} <button type="button" onClick={() => removeAllergy(a)}><X size={9} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-shrink-0">
                    <ChevronLeft size={15} />
                  </button>
                  <button type="submit" disabled={loading}
                    className="btn-primary flex-1 justify-center py-3.5 disabled:opacity-60">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                      : <>Create Account <ArrowRight size={15} /></>}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
