// App shell.
//  Admin:    navy sidebar (desktop), slim top bar with clock + bell.
//  Employee: navy top navigation bar (desktop).
//  Phones:   compact top bar + bottom navigation bar for both roles.
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
import RetentionBanner, { RetentionAlert } from "./RetentionBanner";
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
      <img
        src="https://www.abaccotech.com/Logo/icon.png"
        alt=""
        className={cx(
          "rounded-lg bg-white/10 object-contain",
          small ? "size-8" : "size-10",
        )}
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
      <div className="leading-tight">
        <div
          className={cx(
            "font-bold text-white",
            small ? "text-[15px]" : "text-[17px]",
          )}
        >
          Abacco
        </div>
        <div className="text-[12px] text-white/55">Lead CRM</div>
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

function MobileBottomNav({ items, onMore }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 nav-surface border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main"
    >
      <div
        className="grid"
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
                "flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-semibold",
                isActive ? "text-white" : "text-white/55",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cx(
                    "flex items-center justify-center h-8 w-12 rounded-full transition",
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
            className="flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-semibold text-white/55"
          >
            <span className="flex items-center justify-center h-8 w-12">
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
    <div className="lg:hidden fixed inset-0 z-50 bg-navy/50" onClick={onClose}>
      <div
        className="absolute bottom-0 inset-x-0 nav-surface rounded-t-2xl p-4 pb-24 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar name={session?.fullName || ""} size={36} />
            <div>
              <div className="font-semibold">{session?.fullName}</div>
              <div className="text-xs text-white/55">
                {session?.role === "ADMIN"
                  ? "Administrator"
                  : session?.employeeId}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-white/10"
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
                  "flex flex-col items-center gap-1.5 rounded-xl p-3 text-[12px] font-semibold",
                  isActive ? "nav-active" : "bg-white/6 hover:bg-white/10",
                )
              }
            >
              <it.icon size={20} />
              {it.label}
            </NavLink>
          ))}
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-[12px] font-semibold bg-white/6 hover:bg-white/10"
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
    <div className="min-h-screen lg:pl-64">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col nav-surface text-white">
        <div className="px-5 h-[76px] flex items-center border-b border-white/10">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main">
          {ADMIN_NAV.map((item, i) =>
            item.group ? (
              <div
                key={i}
                className="px-3 pt-5 pb-2 text-[11px] font-bold tracking-[0.08em] uppercase text-[#6f9cff]"
              >
                {item.group}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    "flex items-center gap-3 px-3.5 h-11 rounded-xl text-[14px] font-medium mb-1 transition",
                    isActive
                      ? "nav-active text-white"
                      : "text-white/80 hover:bg-white/8 hover:text-white",
                  )
                }
              >
                <item.icon size={19} strokeWidth={1.9} />
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={session.fullName || "A"} size={38} />
            <div className="min-w-0">
              <div className="font-semibold text-[14px] truncate">
                {session.fullName}
              </div>
              <div className="text-white/50 text-xs">Administrator</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3.5 h-10 rounded-xl text-white/80 hover:bg-white/8 hover:text-white text-[14px]"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>

      {/* top bar: phone = logo, desktop = actions only */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 h-14 lg:h-16 px-4 sm:px-6 lg:px-8 nav-surface lg:bg-none lg:bg-paper/90 lg:backdrop-blur lg:border-b lg:border-line">
        <div className="lg:hidden">
          <Logo small />
        </div>
        <div className="hidden lg:block text-[13px] text-muted">
          US Central time is used for all dates
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ClockWidget compact={false} dark={false} />
          <span className="lg:hidden">
            <RetentionAlert notices={status?.notices || []} isAdmin dark />
          </span>
          <span className="hidden lg:inline-flex">
            <RetentionAlert notices={status?.notices || []} isAdmin />
          </span>
          <span className="lg:hidden">
            <NotificationBell dark />
          </span>
          <span className="hidden lg:inline-flex">
            <NotificationBell />
          </span>
        </div>
      </header>
      <RetentionBanner
        notices={status?.notices || []}
        isAdmin
        stickyClass="top-14 lg:top-16"
      />
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1500px] pb-mobile-nav">
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
      <header className="sticky top-0 z-30 nav-surface text-white shadow-[0_6px_20px_rgba(11,23,57,0.25)]">
        <div className="max-w-[1500px] mx-auto flex items-center gap-4 h-14 lg:h-[68px] px-4 sm:px-6 lg:px-8">
          <Logo small />
          <nav
            className="hidden lg:flex items-center gap-1 ml-6"
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
                      ? "nav-active text-white"
                      : "text-white/75 hover:bg-white/8 hover:text-white",
                  )
                }
              >
                <it.icon size={18} /> {it.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
            <ClockWidget dark />
            <RetentionAlert
              notices={status?.notices || []}
              isAdmin={false}
              dark
            />
            <NotificationBell dark />
            <div className="relative">
              <button
                onClick={() => setMenu(!menu)}
                className="flex items-center gap-2 rounded-xl p-1 lg:pr-3 hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={menu}
              >
                <Avatar name={session.fullName || ""} size={34} />
                <span className="hidden lg:block text-left leading-tight">
                  <span className="block text-[13px] font-semibold">
                    {session.fullName}
                  </span>
                  <span className="block text-[11px] text-white/55">
                    {session.employeeId}
                  </span>
                </span>
              </button>
              {menu && (
                <div
                  className="absolute right-0 top-12 w-48 card shadow-xl text-ink py-1 z-50"
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
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] hover:bg-paper"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <RetentionBanner
        notices={status?.notices || []}
        isAdmin={false}
        stickyClass="top-14 lg:top-[68px]"
      />
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1500px] mx-auto pb-mobile-nav">
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
