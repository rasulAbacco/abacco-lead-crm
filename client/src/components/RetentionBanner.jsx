// Shown on every page while a month's leads are waiting to be deleted.
import { useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { download } from "../lib/api";
import { fmtDateTime, timeLeft } from "../lib/format";
import { Button, useToast } from "./ui";

export function DownloadMonthButton({ notice, isAdmin, size = "sm" }) {
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
          await download(`/system/retention/${notice.id}/download`, `leads-${notice.year}-${notice.month}.xlsx`);
        } catch (e) {
          toast(e.message || "Download failed", "error");
        } finally {
          setBusy(false);
        }
      }}
    >
      {isAdmin ? `Download all ${notice.label} leads` : `Download my ${notice.label} leads`}
    </Button>
  );
}

export default function RetentionBanner({ notices, isAdmin }) {
  if (!notices.length) return null;
  return (
    <div className="bg-noresp-soft border-b border-noresp/25">
      {notices.map((n) => (
        <div key={n.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6 lg:px-8 py-2.5 text-[13px]">
          <span className="flex items-center gap-2 text-noresp font-medium">
            <AlertTriangle size={16} />
            {n.label} leads will be permanently deleted on {fmtDateTime(n.deleteAfter)} CT ({timeLeft(n.deleteAfter)} left).
          </span>
          <span className="text-ink-soft">Download the report now if you need it.</span>
          <DownloadMonthButton notice={n} isAdmin={isAdmin} />
        </div>
      ))}
    </div>
  );
}
