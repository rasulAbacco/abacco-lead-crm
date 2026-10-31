// Popup shown once after each login:
//  - "What's new" during the first 48 hours after an update goes live
//  - the data-deletion notice while a month is about to be deleted
import { useEffect, useState } from "react";
import { Modal, Button } from "./ui";
import { DownloadMonthButton } from "./RetentionBanner";
import { fmtDateTime, timeLeft } from "../lib/format";

export default function LoginNoticeModal({ status, isAdmin }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!status) return;
    const pending = sessionStorage.getItem("showWhatsNew") === "1";
    if (pending && (status.release?.active || status.notices?.length)) setOpen(true);
    else if (pending) sessionStorage.removeItem("showWhatsNew");
  }, [status]);

  if (!open || !status) return null;
  const close = () => {
    sessionStorage.removeItem("showWhatsNew");
    setOpen(false);
  };
  const { release, notices = [] } = status;

  return (
    <Modal open title={release?.active ? release.title : "Lead data will be deleted soon"} onClose={close} width="max-w-xl" footer={<Button variant="primary" onClick={close}>Got it</Button>}>
      {notices.length > 0 && (
        <div className="rounded-md border border-noresp/30 bg-noresp-soft p-4 mb-4">
          {notices.map((n) => (
            <div key={n.id} className="mb-3 last:mb-0">
              <p className="font-medium text-noresp">
                {n.label} leads will be permanently deleted on {fmtDateTime(n.deleteAfter)} CT ({timeLeft(n.deleteAfter)} left).
              </p>
              <p className="text-ink-soft text-[13px] mt-1 mb-2">
                The CRM keeps the last 4 months. Download {isAdmin ? "the full report" : "your leads"} for {n.label} before then.
              </p>
              <DownloadMonthButton notice={n} isAdmin={isAdmin} />
            </div>
          ))}
        </div>
      )}
      {release?.active && (
        <>
          <p className="text-ink-soft mb-3">Here is what changed in this update:</p>
          <ul className="space-y-2">
            {release.notes.map((n) => (
              <li key={n} className="flex gap-2.5">
                <span className="mt-2 size-1.5 rounded-full bg-brand shrink-0" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
