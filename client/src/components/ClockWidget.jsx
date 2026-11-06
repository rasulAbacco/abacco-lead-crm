// System clock-in / clock-out. Independent of website login: logging out does not clock you out.
import { useEffect, useState } from "react";
import { LogIn, LogOut, Timer } from "lucide-react";
import { api, invalidate, useApi } from "../lib/api";
import { useToast, cx } from "./ui";

function elapsed(since) {
  const m = Math.max(
    0,
    Math.floor((Date.now() - new Date(since).getTime()) / 60000),
  );
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

export default function ClockWidget({ dark = false, compact = false }) {
  const toast = useToast();
  const { data, reload } = useApi("/attendance/clock", { ttl: 60 * 1000 });
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  async function toggle() {
    const out = data?.clockedIn;
    if (
      out &&
      !window.confirm(
        "Clock out now? Do this when you finish work for the day.",
      )
    )
      return;
    setBusy(true);
    try {
      await api(out ? "/attendance/clock/out" : "/attendance/clock/in", {
        method: "POST",
      });
      invalidate("/attendance");
      await reload();
      toast(
        out
          ? "Clocked out. See you next shift."
          : "Clocked in. Have a good shift.",
      );
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (!data) return null;
  const on = data.clockedIn;
  return (
    <div className="flex items-center gap-2">
      {on && !compact && (
        <span
          className={cx(
            "hidden md:inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-[13px] font-semibold num",
            dark ? "text-white/80" : "btn-glass text-ink-soft",
          )}
          title={`Clocked in at ${data.sinceIST} IST`}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-60 animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-lime" />
          </span>
          <Timer size={15} /> {elapsed(data.since)}
        </span>
      )}
      <button
        onClick={toggle}
        disabled={busy}
        className={cx(
          "inline-flex items-center gap-1.5 rounded-full font-semibold transition disabled:opacity-60 whitespace-nowrap border border-white/25",
          compact ? "h-8 px-3 text-xs" : "h-10 px-4 text-[13px]",
          on
            ? "bg-white text-teal-deep border-white hover:bg-pearl"
            : "btn-blue text-ink font-bold border-lime shadow-[0_10px_20px_-10px_rgba(185,241,47,0.9)]",
        )}
        title={
          on ? `Clocked in since ${data.sinceIST} IST` : "Start your work day"
        }
      >
        {on ? <LogOut size={15} /> : <LogIn size={15} />}
        {on ? "Clock out" : "Clock in"}
      </button>
    </div>
  );
}
