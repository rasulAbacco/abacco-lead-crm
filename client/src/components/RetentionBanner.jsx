// Shown on every page while a month's leads are waiting to be deleted.
// Sticks under the top bar. Can be minimised / extended by hand, and
// minimises itself as soon as the page is scrolled (re-extends when you are
// back at the top, unless you changed it yourself).
// "Don't display" (asks for confirmation) hides it completely and moves it to
// an alert button in the top bar (<RetentionAlert/>); clicking that opens the
// notice, and "Show banner again" brings the banner back. The choice is
// remembered per browser, per notice (a new month's notice shows again).
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  EyeOff,
} from "lucide-react";
import { download } from "../lib/api";
import { fmtDateTime, timeLeft } from "../lib/format";
import { Button, Modal, useToast, cx } from "./ui";

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
      {isAdmin
        ? `Download all ${notice.label} leads`
        : `Download my ${notice.label} leads`}
    </Button>
  );
}

/* ---- hidden notices (shared by the banner and the alert button) ---- */
const HIDDEN_KEY = "retentionHiddenIds";
const HIDDEN_EVENT = "retention-hidden-change";
const readHidden = () => {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]").map(String);
  } catch {
    return [];
  }
};
function useHiddenNotices() {
  const [ids, setIds] = useState(readHidden);
  useEffect(() => {
    const sync = () => setIds(readHidden());
    window.addEventListener(HIDDEN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HIDDEN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const write = (next) => {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: only hides until reload */
    }
    setIds(next);
    window.dispatchEvent(new Event(HIDDEN_EVENT));
  };
  return {
    ids,
    hide: (list) => write([...new Set([...ids, ...list.map(String)])]),
    show: (list) => write(ids.filter((i) => !list.map(String).includes(i))),
  };
}

const SCROLL_DOWN_AT = 40; // px scrolled before it minimises
const SCROLL_TOP_AT = 8; // px from top where auto-minimised banner re-extends

/** stickyClass = where the banner sticks, e.g. "top-14 lg:top-16" (just under the top bar) */
export default function RetentionBanner({
  notices,
  isAdmin,
  stickyClass = "top-0",
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const hidden = useHiddenNotices();
  const autoCollapsed = useRef(false); // true when the scroll (not the user) minimised it
  const manual = useRef(false); // user clicked: stop auto behaviour until back at top

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= SCROLL_TOP_AT) {
        manual.current = false;
        if (autoCollapsed.current) {
          autoCollapsed.current = false;
          setCollapsed(false);
        }
      } else if (
        y > SCROLL_DOWN_AT &&
        !manual.current &&
        !autoCollapsed.current
      ) {
        autoCollapsed.current = true;
        setCollapsed(true);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visible = notices.filter((n) => !hidden.ids.includes(String(n.id)));
  if (!visible.length) return null; // none, or all moved to the alert button
  notices = visible;

  const toggle = () => {
    manual.current = true;
    autoCollapsed.current = false;
    setCollapsed((c) => !c);
  };
  const soonest = [...notices].sort(
    (a, b) => new Date(a.deleteAfter) - new Date(b.deleteAfter),
  )[0];

  return (
    <div
      className={cx(
        "sticky z-10 bg-noresp-soft border-b border-noresp/25",
        stickyClass,
      )}
    >
      {collapsed ? (
        <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-1.5 text-[12.5px]">
          <AlertTriangle size={15} className="text-noresp shrink-0" />
          <span className="min-w-0 flex-1 truncate text-noresp font-medium">
            {notices.map((n) => n.label).join(", ")} leads will be deleted,{" "}
            {timeLeft(soonest.deleteAfter)} left
          </span>
          <button
            onClick={toggle}
            aria-expanded="false"
            className="inline-flex items-center gap-1 shrink-0 rounded-md px-2 py-1 font-semibold text-noresp hover:bg-white/60"
          >
            Expand <ChevronDown size={15} />
          </button>
          <button
            onClick={() => setConfirm(true)}
            title="Don't display"
            aria-label="Don't display"
            className="shrink-0 rounded-md p-1.5 text-noresp hover:bg-white/60"
          >
            <EyeOff size={15} />
          </button>
        </div>
      ) : (
        <div className="px-4 sm:px-6 lg:px-8 py-2.5">
          {/* header: title on the left, controls on the right (never overlap the list) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 text-[13px] font-semibold text-noresp">
              <AlertTriangle size={16} className="shrink-0" />
              <span className="truncate">
                {notices.length > 1
                  ? `${notices.length} lead reports will be permanently deleted`
                  : "Lead report will be permanently deleted"}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={toggle}
                aria-expanded="true"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-semibold text-noresp hover:bg-white/70"
              >
                <ChevronUp size={15} /> Minimise
              </button>
              <button
                onClick={() => setConfirm(true)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-semibold text-noresp hover:bg-white/70"
              >
                <EyeOff size={15} />{" "}
                <span className="hidden sm:inline">Don't display</span>
              </button>
            </div>
          </div>

          {/* one compact row per month; scrolls if there are many */}
          <ul className="mt-2 max-h-[34vh] overflow-y-auto rounded-xl border border-noresp/20 bg-white/60 divide-y divide-noresp/15">
            {notices.map((n) => (
              <li
                key={n.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5"
              >
                <div className="min-w-0 text-[13px]">
                  <div className="font-semibold text-ink">{n.label} leads</div>
                  <div className="text-ink-soft">
                    Deleted on {fmtDateTime(n.deleteAfter)} CT,{" "}
                    <b className="text-noresp">
                      {timeLeft(n.deleteAfter)} left
                    </b>
                  </div>
                </div>
                <DownloadMonthButton notice={n} isAdmin={isAdmin} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {confirm && (
        <Modal
          open
          onClose={() => setConfirm(false)}
          title="Hide this banner?"
          footer={
            <>
              <Button onClick={() => setConfirm(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  hidden.hide(notices.map((n) => n.id));
                  setConfirm(false);
                }}
              >
                Yes, hide it
              </Button>
            </>
          }
        >
          <p className="text-[14px] text-ink-soft">
            The banner will be removed from the page and moved to the{" "}
            <b className="text-noresp">alert button</b> in the top bar. The
            leads are still deleted on the date shown, so open the alert any
            time to read the notice and download your report.
          </p>
        </Modal>
      )}
    </div>
  );
}

/** Top-bar alert button: appears only while a notice is hidden from the banner. */
export function RetentionAlert({ notices = [], isAdmin, dark = false }) {
  const hidden = useHiddenNotices();
  const [open, setOpen] = useState(false);
  const mine = notices.filter((n) => hidden.ids.includes(String(n.id)));
  if (!mine.length) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Lead deletion alert"
        aria-label={`Lead deletion alert, ${mine.length} notice${mine.length > 1 ? "s" : ""}`}
        className={cx(
          "relative inline-flex items-center justify-center size-10 rounded-xl transition",
          dark
            ? "text-[#fbbf24] hover:bg-white/10"
            : "text-noresp hover:bg-noresp-soft",
        )}
      >
        <AlertTriangle size={20} />
        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-leave text-white text-[10px] font-bold leading-4 text-center">
          {mine.length}
        </span>
      </button>
      {open && (
        <Modal
          open
          onClose={() => setOpen(false)}
          title="Lead deletion alert"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Close</Button>
              <Button
                variant="primary"
                onClick={() => {
                  hidden.show(mine.map((n) => n.id));
                  setOpen(false);
                }}
              >
                Show banner again
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            {mine.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-noresp/25 bg-noresp-soft p-3.5"
              >
                <div className="flex items-start gap-2 text-[14px] text-noresp font-medium">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {n.label} leads will be permanently deleted on{" "}
                    {fmtDateTime(n.deleteAfter)} CT ({timeLeft(n.deleteAfter)}{" "}
                    left).
                  </span>
                </div>
                <p className="text-[13px] text-ink-soft mt-1.5 mb-3">
                  Download the report now if you need it.
                </p>
                <DownloadMonthButton notice={n} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
