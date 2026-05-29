"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/auth";
import { clsx } from "clsx";
import {
  LayoutDashboard, FileText, Users, FolderOpen,
  LogOut, Settings, Menu, X, Activity,
  ChevronRight, Stethoscope, Heart,
} from "lucide-react";
import { useState } from "react";

interface NavItem { href: string; label: string; icon: React.ElementType; roles?: string[]; desc: string }

const navItems: NavItem[] = [
  { href: "/dashboard",    label: "Dashboard",       icon: LayoutDashboard, desc: "Overview & analytics" },
  { href: "/prescriptions",label: "Prescriptions",   icon: FileText,        desc: "Manage Rx records" },
  { href: "/patients",     label: "Patients",        icon: Users,           roles: ["DOCTOR"], desc: "Patient directory" },
  { href: "/records",      label: "Medical Records", icon: FolderOpen,      desc: "Health documents" },
  { href: "/settings",     label: "Settings",        icon: Settings,        desc: "Account preferences" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filtered = navItems.filter((i) => !i.roles || i.roles.includes(user?.role || ""));

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={clsx(
          "nav-item group relative",
          active ? "nav-item-active" : "nav-item-inactive"
        )}
      >
        <div className={clsx(
          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150",
          active ? "bg-white/20" : "bg-white/5 group-hover:bg-white/15"
        )}>
          <item.icon size={15} strokeWidth={active ? 2.5 : 1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{item.label}</p>
          <p className={clsx("text-[10px] font-normal truncate", active ? "text-white/70" : "text-navy-400 group-hover:text-white/50")}>
            {item.desc}
          </p>
        </div>
        {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/50 rounded-l-full" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg, #0B1437 0%, #0d1a4a 50%, #0B1437 100%)" }}>
      {/* Background mesh */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle at 30% 20%, rgba(8,145,178,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(13,148,136,0.15) 0%, transparent 50%)"
      }} />

      {/* Logo */}
      <div className="relative px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)", boxShadow: "0 4px 16px rgba(8,145,178,0.4)" }}>
            <Activity size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>RxVault</span>
            </div>
            <p className="text-navy-300 text-[10px] font-medium tracking-widest uppercase">Digital Prescriptions</p>
          </div>
        </div>

        {/* Role indicator bar */}
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-teal-600 flex items-center justify-center">
            {user?.role === "DOCTOR" ? <Stethoscope size={12} className="text-white" /> : <Heart size={12} className="text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-navy-300 text-[9px] truncate">
              {user?.role === "DOCTOR" ? user.doctorProfile?.specialization : "Patient"} · {user?.role === "DOCTOR" ? "Doctor" : "Patient"}
            </p>
          </div>
          <span className={clsx(
            "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide flex-shrink-0",
            user?.role === "DOCTOR" ? "bg-brand-500/30 text-brand-300 border border-brand-500/40" : "bg-teal-500/30 text-teal-300 border border-teal-500/40"
          )}>{user?.role}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="relative mx-5 mb-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        <p className="text-[9px] font-black text-navy-400 uppercase tracking-[0.2em] px-3 mb-3">Navigation</p>
        {filtered.map((item) => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Bottom */}
      <div className="relative px-3 pb-5 pt-3 border-t border-white/10">
        <Link href="/prescriptions/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white mb-2 transition-all duration-150 hover:shadow-glow"
          style={{ background: "linear-gradient(135deg, #0891B2, #0D9488)" }}
          onClick={() => setMobileOpen(false)}
        >
          <span className="text-lg leading-none">+</span> New Prescription
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-navy-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2.5 bg-navy-900 rounded-xl shadow-float border border-white/10 lg:hidden"
      >
        <Menu size={17} className="text-white" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 relative overflow-hidden">
            <button onClick={() => setMobileOpen(false)} className="absolute top-5 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors z-10">
              <X size={14} className="text-white" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-0 bottom-0 z-40 overflow-hidden shadow-sidebar">
        <SidebarContent />
      </aside>
    </>
  );
}
