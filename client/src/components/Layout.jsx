// App shell (spatial design).
//  Admin:    floating glass sidebar (desktop) + floating clock/bell pill.
//  Employee: floating glass top navigation bar.
//  Phones:   floating glass top bar + floating bottom dock for both roles.
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  FolderOpen,
  FileBarChart,
  ClipboardCheck,
  Table2,
  Users,
  Target,
  Trophy,
  BarChart3,
  Archive,
  History,
  ShieldCheck,
  LogOut,
  CalendarCheck,
  MoreHorizontal,
  X,
} from "lucide-react";
import { api, clearCache, useApi } from "../lib/api";
import { clearSession, getSession } from "../lib/session";
import { Avatar, cx } from "./ui";
import RetentionBanner from "./RetentionBanner";
import LoginNoticeModal from "./LoginNoticeModal";
import ClockWidget from "./ClockWidget";
import NotificationBell from "./NotificationBell";

const EMPLOYEE_NAV = [
  { to: "/employee-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leadform", label: "Upload lead", short: "Upload", icon: UploadCloud },
  { to: "/myleads", label: "My leads", icon: FolderOpen },
  { to: "/myreport", label: "My report", short: "Report", icon: FileBarChart },
];

const ADMIN_NAV = [
  { group: "Leads" },
  {
    to: "/admin-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    mobile: true,
  },
  {
    to: "/lead-review",
    label: "Lead review",
    short: "Review",
    icon: ClipboardCheck,
    mobile: true,
  },
  { to: "/all-leads", label: "All leads", icon: Table2, mobile: true },
  { group: "Team" },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/set-targets", label: "Targets", icon: Target },
  { to: "/incentives", label: "Incentives", icon: Trophy },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck, mobile: true },
  { group: "System" },
  { to: "/data-retention", label: "Data retention", icon: Archive },
  { to: "/admin/login-history", label: "Login history", icon: History },
  { to: "/admin/allowed-ips", label: "Allowed IPs", icon: ShieldCheck },
];

function Logo({ small }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className={cx(
          "inline-flex items-center justify-center rounded-full bg-white shrink-0 overflow-hidden",
          small ? "size-9" : "size-11",
        )}
      >
        <img
          src="https://www.abaccotech.com/Logo/icon.png"
          alt=""
          className="size-[72%] object-contain"
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
      </span>
      <div className="leading-tight">
        <div
          className={cx(
            "font-[family-name:var(--font-display)] font-extrabold text-white tracking-tight",
            small ? "text-[16px]" : "text-[19px]",
          )}
        >
          Abacco
        </div>
        <div className="text-[12px] font-bold text-lime">Lead CRM</div>
      </div>
    </div>
  );
}

function useLogout() {
  const navigate = useNavigate();
  return async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    clearSession();
    clearCache();
    navigate("/", { replace: true });
  };
}

/* Phones: floating glass dock */
function MobileBottomNav({ items, onMore }) {
  return (
    <nav
      className="lg:hidden fixed bottom-3 inset-x-3 z-40 glass-nav rounded-[26px]"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main"
    >
      <div
        className="grid px-1"
        style={{
          gridTemplateColumns: `repeat(${items.length + (onMore ? 1 : 0)}, minmax(0, 1fr))`,
        }}
      >
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              cx(
                "flex flex-col items-center justify-center gap-0.5 h-[66px] text-[11px] font-semibold",
                isActive ? "text-lime" : "text-pearl/70",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cx(
                    "flex items-center justify-center h-9 w-12 rounded-2xl transition",
                    isActive && "nav-active",
                  )}
                >
                  <it.icon size={19} />
                </span>
                {it.short || it.label}
              </>
            )}
          </NavLink>
        ))}
        {onMore && (
          <button
            onClick={onMore}
            className="flex flex-col items-center justify-center gap-0.5 h-[66px] text-[11px] font-semibold text-pearl/70"
          >
            <span className="flex items-center justify-center h-9 w-12">
              <MoreHorizontal size={20} />
            </span>
            More
          </button>
        )}
      </div>
    </nav>
  );
}

function MoreSheet({ items, onClose, onLogout, session }) {
  return (
    <div
      className="lg:hidden fixed inset-0 z-50 bg-teal-deep/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute bottom-3 inset-x-3 card !bg-white p-4 pb-[92px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={session?.fullName || ""} size={38} />
            <div>
              <div className="font-bold">{session?.fullName}</div>
              <div className="text-xs text-muted">
                {session?.role === "ADMIN"
                  ? "Administrator"
                  : session?.employeeId}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onClose}
              className={({ isActive }) =>
                cx(
                  "flex flex-col items-center gap-1.5 rounded-2xl p-3 text-[12px] font-semibold text-center",
                  isActive ? "nav-active" : "glass-inset text-teal-deep",
                )
              }
            >
              <it.icon size={20} />
              {it.label}
            </NavLink>
          ))}
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1.5 rounded-2xl p-3 text-[12px] font-semibold glass-inset text-teal-deep"
          >
            <LogOut size={20} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminShell({ session, status, children }) {
  const logout = useLogout();
  const [more, setMore] = useState(false);
  const links = ADMIN_NAV.filter((n) => !n.group);
  return (
    <div className="min-h-screen lg:pl-[272px]">
      {/* floating glass sidebar */}
      <aside className="hidden lg:flex fixed top-4 bottom-4 left-4 z-30 w-[240px] flex-col glass-nav rounded-[28px]">
        <div className="px-5 pt-6 pb-4">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-2" aria-label="Main">
          {ADMIN_NAV.map((item, i) =>
            item.group ? (
              <div
                key={i}
                className="px-3 pt-4 pb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase text-pearl/45"
              >
                {item.group}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    "flex items-center gap-3 px-3.5 h-11 rounded-2xl text-[14px] font-semibold mb-1 transition",
                    isActive
                      ? "nav-active"
                      : "text-pearl/85 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <item.icon size={19} strokeWidth={2} />
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="m-3 rounded-2xl bg-white/[0.06] border border-white/10 p-2">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <Avatar name={session.fullName || "A"} size={36} />
            <div className="min-w-0">
              <div className="font-bold text-[14px] text-white truncate">
                {session.fullName}
              </div>
              <div className="text-pearl/60 text-xs">Administrator</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 h-9 rounded-xl text-pearl/80 hover:bg-white/10 hover:text-lime text-[13px] font-semibold"
          >
            <LogOut size={17} /> Log out
          </button>
        </div>
      </aside>

      {/* phone: floating glass bar | desktop: floating action pill */}
      <header className="sticky top-0 z-20 px-3 sm:px-6 lg:px-8 pt-3 lg:pt-4">
        <div className="flex items-center justify-between gap-3 glass-nav lg:bg-none lg:!bg-transparent lg:!border-transparent lg:!shadow-none lg:![backdrop-filter:none] rounded-[22px] px-3 lg:px-0 h-16">
          <div className="lg:hidden">
            <Logo small />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 lg:glass-nav lg:rounded-full lg:p-1.5 lg:pl-3">
            <ClockWidget />
            <NotificationBell />
          </div>
        </div>
      </header>
      <main className="px-4 sm:px-6 lg:px-8 pt-4 pb-8 max-w-[1500px] pb-mobile-nav">
        <RetentionBanner notices={status?.notices || []} isAdmin />
        {children}
      </main>
      <MobileBottomNav
        items={links.filter((l) => l.mobile)}
        onMore={() => setMore(true)}
      />
      {more && (
        <MoreSheet
          items={links.filter((l) => !l.mobile)}
          onClose={() => setMore(false)}
          onLogout={logout}
          session={session}
        />
      )}
    </div>
  );
}

function EmployeeShell({ session, status, children }) {
  const logout = useLogout();
  const [menu, setMenu] = useState(false);
  return (
    <div className="min-h-screen">
      {/* floating glass top bar */}
      <header className="sticky top-0 z-30 px-3 sm:px-6 lg:px-8 pt-3 lg:pt-4">
        <div className="max-w-[1500px] mx-auto flex items-center gap-4 h-16 lg:h-[70px] px-3 lg:px-5 glass-nav rounded-[24px]">
          <Logo small />
          <nav
            className="hidden lg:flex items-center gap-1 ml-6 rounded-2xl bg-white/[0.06] border border-white/10 p-1"
            aria-label="Main"
          >
            {EMPLOYEE_NAV.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  cx(
                    "flex items-center gap-2 px-4 h-10 rounded-xl text-[14px] font-semibold transition",
                    isActive
                      ? "nav-active"
                      : "text-pearl/85 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <it.icon size={18} /> {it.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
            <ClockWidget />
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setMenu(!menu)}
                className="flex items-center gap-2 rounded-full p-1 lg:pr-3 hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={menu}
              >
                <Avatar name={session.fullName || ""} size={36} />
                <span className="hidden lg:block text-left leading-tight">
                  <span className="block text-[13px] font-bold text-white">
                    {session.fullName}
                  </span>
                  <span className="block text-[11px] text-pearl/60">
                    {session.employeeId}
                  </span>
                </span>
              </button>
              {menu && (
                <div
                  className="absolute right-0 top-13 w-52 card !bg-white text-ink py-1.5 z-50"
                  onMouseLeave={() => setMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-line lg:hidden">
                    <div className="font-semibold text-[13px]">
                      {session.fullName}
                    </div>
                    <div className="text-xs text-muted">
                      {session.employeeId}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-teal-deep hover:bg-pearl"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="px-4 sm:px-6 lg:px-8 pt-5 pb-8 max-w-[1500px] mx-auto pb-mobile-nav">
        <RetentionBanner notices={status?.notices || []} isAdmin={false} />
        {children}
      </main>
      <MobileBottomNav items={EMPLOYEE_NAV} />
    </div>
  );
}

export default function Layout() {
  const session = getSession();
  const isAdmin = session?.role === "ADMIN";
  const { data: status } = useApi("/system/status", { ttl: 60 * 1000 });
  const Shell = isAdmin ? AdminShell : EmployeeShell;
  return (
    <>
      <Shell session={session} status={status}>
        <Outlet />
      </Shell>
      <LoginNoticeModal status={status} isAdmin={isAdmin} />
    </>
  );
}
