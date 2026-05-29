"use client";
import { useAuth } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Activity } from "lucide-react";

export function AuthGuard({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/auth/login");
    if (!isLoading && user && role && user.role !== role) router.push("/dashboard");
  }, [user, isLoading, router, role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F0F4F8" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)", boxShadow: "0 8px 24px rgba(8,145,178,0.3)" }}>
            <Activity size={22} className="text-white animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700 text-sm"
               style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>RxVault</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Loading your workspace…</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                   style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;
  if (role && user.role !== role) return null;
  return <>{children}</>;
}
