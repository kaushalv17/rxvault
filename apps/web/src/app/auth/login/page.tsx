"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Stethoscope, Heart, ShieldCheck, Zap, QrCode, FileText } from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck, title: "Tamper-proof QR", desc: "Every prescription is uniquely hashed and verifiable" },
  { icon: Zap,         title: "30-second Rx",    desc: "Create complete prescriptions in under a minute" },
  { icon: QrCode,      title: "Instant PDF",     desc: "Download professional PDFs with a single click" },
  { icon: FileText,    title: "Full EMR",         desc: "Complete electronic medical record management" },
];

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.data.token, data.data.user);
      toast.success(`Welcome back, ${data.data.user.name.split(" ")[0]}!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "doctor" | "patient") => {
    if (role === "doctor") { setEmail("dr.sharma@rxvault.com"); setPassword("password123"); }
    else { setEmail("rahul.kumar@gmail.com"); setPassword("password123"); }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden flex-col justify-between"
           style={{ background: "linear-gradient(145deg, #0B1437 0%, #0d1e55 40%, #083344 100%)" }}>
        {/* Mesh blobs */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, rgba(8,145,178,0.25) 0%, transparent 50%), radial-gradient(circle at 75% 70%, rgba(13,148,136,0.20) 0%, transparent 45%), radial-gradient(circle at 60% 10%, rgba(124,58,237,0.12) 0%, transparent 40%)"
        }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        {/* Top: Logo */}
        <div className="relative p-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)", boxShadow: "0 6px 24px rgba(8,145,178,0.45)" }}>
              <span className="text-white font-black text-xl" style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Rx</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>RxVault</span>
          </div>
        </div>

        {/* Centre: Hero text */}
        <div className="relative px-10 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 text-xs font-semibold">Built for Jaypee Brothers Medical Assessment</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "Fraunces, serif" }}>
            India's smartest<br />
            <span style={{ background: "linear-gradient(90deg, #22D3EE, #2DD4BF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              digital Rx platform
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-md">
            Secure, blockchain-verifiable prescriptions with QR codes, PDF export, complete EMR, and real-time patient management.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
                   style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: "rgba(8,145,178,0.3)" }}>
                  <Icon size={14} className="text-brand-300" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{title}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 border-t border-white/10 pt-6">
            {[["10K+", "Prescriptions"], ["99.9%", "Uptime"], ["QR", "Verified"], ["PDF", "Instant"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-brand-400 font-bold text-lg leading-tight">{val}</p>
                <p className="text-slate-500 text-[11px]">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative px-10 py-6">
          <p className="text-slate-600 text-xs">© 2025 RxVault · Jaypee Brothers Medical Publishers Assessment</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-[#F0F4F8] p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}>
              <span className="text-white font-black" style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Rx</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">RxVault</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>
              Welcome back
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">Sign in to your prescription dashboard</p>
          </div>

          {/* Demo pills */}
          <div className="flex gap-2 mb-7">
            <button onClick={() => fillDemo("doctor")}
              className="flex items-center gap-2 flex-1 justify-center text-xs py-2.5 px-3 rounded-xl font-semibold border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ECFEFF, #F0FDFA)", borderColor: "#A5F3FC", color: "#0E7490" }}>
              <Stethoscope size={13} /> Demo Doctor
            </button>
            <button onClick={() => fillDemo("patient")}
              className="flex items-center gap-2 flex-1 justify-center text-xs py-2.5 px-3 rounded-xl font-semibold border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ECFDF5, #F0FDFA)", borderColor: "#A7F3D0", color: "#047857" }}>
              <Heart size={13} /> Demo Patient
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs font-medium">or sign in manually</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="doctor@hospital.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3.5 mt-2 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</span>
                : <><span>Sign in</span> <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              New to RxVault?{" "}
              <Link href="/auth/register" className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors">
                Create account →
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-4">
            {["HIPAA Compliant", "256-bit SSL", "QR Verified"].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                <ShieldCheck size={10} className="text-emerald-500" /> {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
