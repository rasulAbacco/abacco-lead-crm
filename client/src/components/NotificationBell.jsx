// Bell with unread count; checks for new notifications every minute.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ClipboardCheck, Archive, Clock, HandCoins, CalendarCheck, Info } from "lucide-react";
import { api, invalidate, useApi } from "../lib/api";
import { getSession } from "../lib/session";
import { cx } from "./ui";

const ICON = { lead_status: ClipboardCheck, retention: Archive, clock: Clock, incentive: HandCoins, attendance: CalendarCheck, system: Info };
const TONE = { lead_status: "bg-active-soft text-active", retention: "bg-noresp-soft text-noresp", clock: "bg-leave-soft text-leave", incentive: "bg-violet-soft text-violet", attendance: "bg-blue-soft text-blue", system: "bg-pending-soft text-pending" };

function ago(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export default function NotificationBell({ dark = false }) {
  const navigate = useNavigate();
  const isAdmin = getSession()?.role === "ADMIN";
  const { data, reload } = useApi("/notifications", { ttl: 60 * 1000 });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const t = setInterval(() => reload(), 60 * 1000);
    return () => clearInterval(t);
  }, [reload]);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unread = data?.unread || 0;
  async function openItem(n) {
    if (!n.readAt) api(`/notifications/${n.id}/read`, { method: "POST" }).then(() => invalidate("/notifications"));
    setOpen(false);
    let link = n.link;
    if (isAdmin && link === "/myleads") link = "/data-retention";
    if (isAdmin && link === "/employee-dashboard") link = "/admin-dashboard";
    if (link) navigate(link);
  }
  async function readAll() {
    await api("/notifications/read-all", { method: "POST" });
    invalidate("/notifications");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) reload(); }}
        className={cx("relative inline-flex items-center justify-center size-9 rounded-lg transition", dark ? "text-white/85 hover:bg-white/10" : "text-ink-soft hover:bg-white border border-transparent hover:border-line")}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <Bell size={19} />
        {unread > 0 && <span className="num absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-leave text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-16 sm:top-11 sm:right-0 sm:w-96 z-[60] card shadow-2xl overflow-hidden text-ink">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="font-bold">Notifications</span>
            {unread > 0 && <button onClick={readAll} className="inline-flex items-center gap-1 text-[13px] text-blue font-semibold hover:underline"><CheckCheck size={15} /> Mark all read</button>}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {!data?.items?.length && <li className="px-4 py-10 text-center text-muted">You're all caught up.</li>}
            {data?.items?.map((n) => {
              const Icon = ICON[n.type] || Info;
              return (
                <li key={n.id}>
                  <button onClick={() => openItem(n)} className={cx("w-full flex gap-3 px-4 py-3 text-left hover:bg-paper border-b border-line/70", !n.readAt && "bg-blue-soft/40")}>
                    <span className={cx("size-9 rounded-lg flex items-center justify-center shrink-0", TONE[n.type] || TONE.system)}><Icon size={17} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={cx("text-[13px] leading-snug", !n.readAt ? "font-semibold" : "font-medium")}>{n.title}</span>
                        {!n.readAt && <span className="mt-1 size-2 rounded-full bg-blue shrink-0" />}
                      </span>
                      {n.body && <span className="block text-xs text-muted mt-0.5 line-clamp-2">{n.body}</span>}
                      <span className="block text-[11px] text-muted mt-1">{ago(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
