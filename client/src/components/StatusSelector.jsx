// Admin status dropdown: Pending / Active / No Response / Leave Out. Saves on change.
import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { api, invalidate, LEAD_KEYS } from "../lib/api";
import { useToast, cx, STATUS_STYLE } from "./ui";

const OPTIONS = [
  ["PENDING", "Pending"],
  ["ACTIVE", "Active"],
  ["NO_RESPONSE", "No Response"],
  ["LEAVE_OUT", "Leave Out"],
];

export default function StatusSelector({
  lead,
  onChange,
  size = "md",
  className,
}) {
  const toast = useToast();
  const [status, setStatus] = useState(lead.status);
  const [saving, setSaving] = useState(false);
  useEffect(() => setStatus(lead.status), [lead.status]);

  async function choose(next) {
    if (next === status) return;
    const prev = status;
    setStatus(next); // instant feedback
    setSaving(true);
    try {
      await api(`/leads/${lead.id}/status`, {
        method: "PATCH",
        body: { status: next },
      });
      invalidate(...LEAD_KEYS);
      toast(`Status set to ${OPTIONS.find((o) => o[0] === next)[1]}`);
      onChange?.(next);
    } catch (e) {
      setStatus(prev);
      toast(e.message || "Could not save the status", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className={cx("relative inline-flex", className)}>
      <span
        className={cx(
          "pointer-events-none absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 size-2 rounded-full bg-current",
          STATUS_STYLE[status]?.split(" ").find((c) => c.startsWith("text-")),
        )}
      />
      <select
        aria-label="Lead status"
        value={status}
        disabled={saving}
        onChange={(e) => choose(e.target.value)}
        className={cx(
          "appearance-none cursor-pointer rounded-full border font-semibold outline-none transition focus:ring-[3px] focus:ring-lime/70 hover:brightness-[0.97] disabled:cursor-wait w-full",
          size === "sm"
            ? "h-8 pl-5 pr-6 sm:pl-6 sm:pr-7 text-[12px] sm:text-[13px]"
            : "h-10 pl-7 pr-9 text-sm",
          STATUS_STYLE[status],
        )}
      >
        {OPTIONS.map(([v, l]) => (
          <option key={v} value={v} className="text-ink bg-white">
            {l}
          </option>
        ))}
      </select>
      {saving ? (
        <Loader2
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin"
        />
      ) : (
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 opacity-70"
        />
      )}
    </span>
  );
}
