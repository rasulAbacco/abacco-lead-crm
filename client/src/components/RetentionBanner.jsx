// Shown at the top of every page while months of leads are waiting to be deleted.
// One compact glass notice; the per-month downloads open on demand.
import { useState } from "react";
import { AlertTriangle, ChevronDown, Download } from "lucide-react";
import { download } from "../lib/api";
import { fmtDateTime, timeLeft } from "../lib/format";
import { Button, cx, useToast } from "./ui";

export function DownloadMonthButton({
  notice,
  isAdmin,
  size = "sm",
  short = false,
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size={size}
      variant="secondary"
      loading={busy}
      icon={Download}
      onClick={async () => {
        setBusy(true);
        try {
          await download(
            `/system/retention/${notice.id}/download`,
            `leads-${notice.year}-${notice.month}.xlsx`,
          );
        } catch (e) {
          toast(e.message || "Download failed", "error");
        } finally {
          setBusy(false);
        }
      }}
    >
      {short
        ? notice.label
        : isAdmin
          ? `Download all ${notice.label} leads`
          : `Download my ${notice.label} leads`}
    </Button>
  );
}

export default function RetentionBanner({ notices, isAdmin }) {
  const [open, setOpen] = useState(false);
  if (!notices.length) return null;
  const sorted = [...notices].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );
  const first = sorted.reduce((a, b) =>
    new Date(a.deleteAfter) <= new Date(b.deleteAfter) ? a : b,
  );
  const what =
    sorted.length === 1
      ? `${sorted[0].label} leads`
      : `${sorted.length} months of leads (${sorted[0].label} – ${sorted[sorted.length - 1].label})`;
  return (
    <div className="mb-5 rounded-[20px] border border-line border-l-[6px] border-l-lime bg-white shadow-[0_16px_36px_-22px_rgba(11,48,72,0.45)]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span
          className="size-9 rounded-full bg-teal-deep text-lime flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <AlertTriangle size={18} />
        </span>
        <p className="flex-1 min-w-[220px] text-[13.5px] text-ink">
          <b>{what}</b> will be permanently deleted on{" "}
          <b>{fmtDateTime(first.deleteAfter)} CT</b>
          <span className="ml-1.5 inline-flex items-center rounded-full bg-teal-deep text-lime font-semibold px-2 py-0.5 text-xs num">
            {timeLeft(first.deleteAfter)} left
          </span>
        </p>
        {sorted.length === 1 ? (
          <DownloadMonthButton notice={sorted[0]} isAdmin={isAdmin} />
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            <Download size={15} /> Download reports{" "}
            <ChevronDown
              size={15}
              className={cx("transition", open && "rotate-180")}
            />
          </Button>
        )}
      </div>
      {open && sorted.length > 1 && (
        <div className="px-4 pb-4 pt-1 border-t border-line">
          <p className="text-xs text-muted mb-2.5">
            {isAdmin
              ? "Every employee's leads for that month."
              : "Only the leads you uploaded."}
          </p>
          <div className="flex flex-wrap gap-2">
            {sorted.map((n) => (
              <DownloadMonthButton
                key={n.id}
                notice={n}
                isAdmin={isAdmin}
                short
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
