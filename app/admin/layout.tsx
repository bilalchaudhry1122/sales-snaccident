import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Utensils, 
  ShoppingBag, 
  TicketPercent, 
  BarChart3, 
  History,
  LogOut,
  ShieldAlert,
  ChevronRight,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/menu",      label: "Menu Manager", icon: Utensils },
  { href: "/admin/orders",    label: "Order Manager",icon: ShoppingBag },
  { href: "/admin/discounts", label: "Discounts",    icon: TicketPercent },
  { href: "/admin/analytics", label: "Analytics",    icon: BarChart3 },
  { href: "/admin/audit",     label: "Audit Reports",icon: History },
  { href: "/admin/reset",     label: "System Reset", icon: ShieldAlert },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      
      {/* ── Sidebar ── */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col"
        style={{
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.04)",
        }}
      >
        {/* Brand */}
        <div className="flex h-16 items-center px-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/admin/dashboard" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
              }}
            >
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} fill="white" />
            </div>
            <div>
              <p className="text-black font-black text-base leading-none tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                Snaccident
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>
                Sales System
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-3">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3 px-3"
            style={{ color: "var(--text-muted)" }}
          >
            Main Menu
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-black transition-all duration-150 group hover:bg-[var(--accent-glow)] hover:text-[var(--accent)]"
                style={{ color: "var(--text-secondary)" }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                  {item.label}
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
              </Link>
            ))}
          </nav>
        </div>

        {/* User */}
        <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3 px-1">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
            >
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {session.user.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Administrator</p>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2.5 w-full h-9 px-3 rounded-xl text-sm font-black transition-all hover:bg-red-50 hover:text-red-600"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut className="h-4 w-4" strokeWidth={2.5} />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header
          className="sticky top-0 z-40 h-16 flex items-center justify-between px-8"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            <h1
              className="text-lg font-black tracking-tight"
              style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}
            >
              Admin Console
            </h1>
            <span
              className="hidden md:flex items-center gap-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-full"
              style={{
                background: "rgba(16,185,129,0.08)",
                color: "#059669",
                border: "1px solid rgba(16,185,129,0.1)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <span className="text-sm font-medium hidden sm:block" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}
          </span>
        </header>

        <div className="p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
