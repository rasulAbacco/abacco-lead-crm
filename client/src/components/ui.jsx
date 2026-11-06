/* eslint-disable react-refresh/only-export-components */
// Shared UI building blocks. Spatial design: frosted-glass panels, glossy icon orbs, blue actions.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";
import {
  Search,
  X,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

/** Emojis are off so the app keeps strictly to the brand palette. Set to true to bring them back. */
export const SHOW_EMOJI = false;
/** Inline emoji that follows the switch above */
export function Emo({ children }) {
  return SHOW_EMOJI ? <span aria-hidden="true">{children}</span> : null;
}

export const cx = (...c) => c.filter(Boolean).join(" ");

// Let a passed width/height/text-size/padding class replace the default instead of fighting it.
const GROUPS = [
  /^w-/,
  /^h-/,
  /^min-h-/,
  /^text-(xs|sm|base|lg|\[)/,
  /^px-/,
  /^pl-/,
  /^pr-/,
];
function merge(base, extra = "") {
  const ex = (extra || "").split(/\s+/).filter(Boolean);
  const kept = base
    .split(/\s+/)
    .filter((b) => !GROUPS.some((g) => g.test(b) && ex.some((e) => g.test(e))));
  return [...kept, ...ex].join(" ");
}

/* ---------------- Buttons ---------------- */
const BTN = {
  primary:
    "btn-blue text-ink font-bold border border-lime shadow-[0_10px_22px_-12px_rgba(185,241,47,0.9)] active:translate-y-px",
  blue: "bg-teal-deep text-white border border-teal-deep shadow-[0_10px_22px_-12px_rgba(11,48,72,0.7)] hover:bg-teal-deep/90 active:translate-y-px",
  secondary: "btn-glass text-ink hover:bg-white/90 active:translate-y-px",
  ghost:
    "bg-transparent text-ink-soft hover:bg-white/60 border border-transparent",
  danger: "btn-glass text-leave hover:bg-leave-soft",
};
export function Button({
  variant = "secondary",
  size = "md",
  loading,
  icon: Icon,
  className,
  children,
  ...p
}) {
  return (
    <button
      {...p}
      disabled={p.disabled || loading}
      className={merge(
        cx(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
          size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
          BTN[variant],
        ),
        className,
      )}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
}

export function RefreshButton({ onClick, spinning }) {
  return (
    <Button variant="secondary" onClick={onClick} title="Load the latest data">
      <RefreshCw size={16} className={spinning ? "animate-spin" : ""} />{" "}
      <span className="hidden sm:inline">Refresh</span>
    </Button>
  );
}

/* ---------------- Layout pieces ---------------- */
export function PageHeader({ title, subtitle, actions, icon: Icon, emoji }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="hidden sm:inline-flex">
            <IconTile icon={Icon} tone="blue" size={52} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-[24px] sm:text-[30px] font-extrabold tracking-tight text-ink leading-tight">
            {title}
            {SHOW_EMOJI && emoji && (
              <span
                className="ml-2 inline-block align-[-2px]"
                aria-hidden="true"
              >
                {emoji}
              </span>
            )}
          </h1>
          {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function Panel({
  title,
  icon: Icon,
  iconTone = "blue",
  emoji,
  actions,
  children,
  className,
  bodyClass = "p-5",
}) {
  return (
    <section className={cx("card min-w-0", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3.5 border-b border-line">
          <h2 className="flex items-center gap-3 font-bold text-[16px] text-ink min-w-0">
            {Icon && <Orb icon={Icon} tone={iconTone} size={34} />}
            <span className="truncate">{title}</span>
            {SHOW_EMOJI && emoji && (
              <span className="text-[17px] leading-none" aria-hidden="true">
                {emoji}
              </span>
            )}
          </h2>
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

// sparkline colour: teal everywhere (lime would be too faint on white)
const TONE_STROKE = {
  blue: "#0B3048",
  green: "#0B3048",
  orange: "#0B3048",
  violet: "#0B3048",
  teal: "#0B3048",
  red: "#0B3048",
  sky: "#0B3048",
};

/** Glossy round icon */
export function Orb({ icon: Icon, tone = "blue", size = 44 }) {
  return (
    <span
      className={cx("orb", `orb-${tone}`)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.46)} strokeWidth={2.2} />
    </span>
  );
}
export const IconTile = Orb;

/** Tiny area chart for stat cards */
export function Sparkline({
  data = [],
  tone = "blue",
  width = 96,
  height = 36,
}) {
  const id = useId().replace(/:/g, "");
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - 3 - ((v - min) / (max - min || 1)) * (height - 8),
  ]);
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const c = TONE_STROKE[tone];
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#B9F12F" stopOpacity="0.55" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${id})`} />
      <path
        d={line}
        fill="none"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Floating tinted-glass stat tile with a glossy orb */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "blue",
  trend,
  spark,
  valueTone,
  children,
}) {
  return (
    <div className={cx("tile p-4 sm:p-5 flex gap-3.5 min-w-0", `tile-${tone}`)}>
      {icon && <Orb icon={icon} tone={tone} size={48} />}
      <div className="flex-1 min-w-0 relative z-[1]">
        <div className="text-ink-soft text-[13px] font-semibold leading-snug">
          {label}
        </div>
        <div
          className={cx(
            "num text-[28px] sm:text-[30px] font-extrabold leading-tight mt-0.5 tracking-tight",
            valueTone || "text-ink",
          )}
        >
          {value}
        </div>
        {hint && (
          <div
            className={cx(
              "text-muted text-xs mt-0.5 truncate",
              spark && "pr-24",
            )}
          >
            {hint}
          </div>
        )}
        {trend}
        {children}
      </div>
      {spark && (
        <div className="absolute right-3 bottom-3 opacity-90 pointer-events-none">
          <Sparkline data={spark} tone={tone} width={84} height={34} />
        </div>
      )}
    </div>
  );
}
/** v2 compatibility */
export const Stat = ({ label, value, hint, tone }) => (
  <StatCard
    label={label}
    value={value}
    hint={hint}
    valueTone={tone}
    tone="blue"
  />
);

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 size={18} className="animate-spin" /> {label}
    </div>
  );
}

export function Empty({ title, children, action, emoji = "✨" }) {
  return (
    <div className="text-center py-12 px-6">
      {SHOW_EMOJI && emoji && (
        <div className="text-[34px] leading-none mb-3" aria-hidden="true">
          {emoji}
        </div>
      )}
      <p className="font-semibold text-ink">{title}</p>
      {children && (
        <p className="text-muted mt-1 max-w-md mx-auto">{children}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white text-ink border-2 border-teal-deep rounded-2xl px-4 py-3 mb-4">
      <span className="flex items-center gap-2">
        <AlertCircle size={16} /> {error.message || String(error)}
      </span>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ---------------- Avatar ---------------- */
// palette only: teal with lime letter, lime with teal letter
const AVATAR = [
  "bg-teal-deep text-lime",
  "bg-lime text-teal-deep",
  "bg-teal-deep text-white",
];
export function Avatar({ name = "", size = 28, soft = false }) {
  const initial = (name.trim()[0] || "?").toUpperCase();
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = AVATAR[h % AVATAR.length];
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-full font-semibold shrink-0 ring-2 ring-white/90 shadow-[0_4px_10px_-4px_rgba(11,48,72,0.35)]",
        soft ? "bg-lime/40 text-teal-deep" : color,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

/* ---------------- Form controls ---------------- */
export function Field({ label, hint, error, children, className, required }) {
  return (
    <label className={cx("block min-w-0", className)}>
      {label && (
        <span className="block text-[13px] font-semibold text-ink mb-1.5">
          {label}
          {required && <span className="text-leave ml-0.5">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-xs text-leave mt-1">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-muted mt-1">{hint}</span>
      ) : null}
    </label>
  );
}
const INPUT =
  "w-full h-10 rounded-xl border border-white bg-white px-3 text-sm text-ink placeholder:text-muted/70 ring-1 ring-line focus:bg-white focus:ring-[3px] focus:ring-lime outline-none transition";
export const Input = ({ className, ...p }) => (
  <input {...p} className={merge(INPUT, className)} />
);
export const Select = ({ className = "", children, ...p }) => {
  const width = className
    .match(/(?:^|\s)((?:\w+:)?w-\S+)/g)
    ?.map((s) => s.trim())
    .join(" ");
  const rest = className.replace(/(?:^|\s)(?:\w+:)?w-\S+/g, " ");
  return (
    <span
      className={cx(
        "relative",
        width ? `inline-block ${width}` : "block w-full",
      )}
    >
      <select
        {...p}
        className={merge(
          `${INPUT} pr-9 appearance-none cursor-pointer`,
          `${rest} w-full`,
        )}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </span>
  );
};
export const Textarea = ({ className, ...p }) => (
  <textarea
    {...p}
    className={merge(
      `${INPUT.replace("h-10", "h-auto")} py-2.5 min-h-[100px]`,
      className,
    )}
  />
);

/** Input with an icon on the left */
export function IconInput({ icon: Icon, className, ...p }) {
  return (
    <span className="relative block">
      <Icon
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <Input {...p} className={cx("pl-10", className)} />
    </span>
  );
}

/* ---------------- Status ---------------- */
// Palette-only status look:
//  Pending = white + grey text, Active = lime, No Response = pearl + teal outline, Leave Out = solid teal
export const STATUS_STYLE = {
  PENDING: "bg-white text-muted border-line",
  ACTIVE: "bg-lime text-ink border-lime",
  NO_RESPONSE: "bg-pearl text-teal-deep border-teal-deep/40",
  LEAVE_OUT: "bg-teal-deep text-white border-teal-deep",
};
const STATUS_TEXT = {
  PENDING: "Pending",
  ACTIVE: "Active",
  NO_RESPONSE: "No Response",
  LEAVE_OUT: "Leave Out",
};
export function StatusBadge({ status }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 h-6 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLE[status] || STATUS_STYLE.PENDING,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_TEXT[status] || status}
    </span>
  );
}

/** Number chip (team table counts) */
export function Chip({ tone = "pending", children }) {
  const t = {
    active: STATUS_STYLE.ACTIVE,
    noresp: STATUS_STYLE.NO_RESPONSE,
    leave: STATUS_STYLE.LEAVE_OUT,
    pending: STATUS_STYLE.PENDING,
    blue: "bg-pearl text-teal-deep border-line",
  }[tone];
  return (
    <span
      className={cx(
        "num inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-md border text-[13px] font-semibold",
        t,
      )}
    >
      {children}
    </span>
  );
}

export function Badge({ children, className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2.5 h-6 text-xs font-semibold bg-pearl text-teal-deep border border-line whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-lg",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-teal-deep/40 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "w-full bg-white/90 backdrop-blur-2xl border border-white rounded-t-[26px] sm:rounded-[26px] shadow-[0_30px_80px_-20px_rgba(11,48,72,0.45)] max-h-[92vh] flex flex-col",
          width,
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h2 className="font-bold text-[17px]">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white text-muted"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-white/50 rounded-b-[26px] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Tabs ---------------- */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="glass-inset inline-flex max-w-full gap-1 p-1 mb-5 overflow-x-auto !rounded-2xl">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            "flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold whitespace-nowrap transition",
            value === t.value
              ? "nav-active"
              : "text-ink-soft hover:bg-white/70",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={cx(
                "num rounded-md px-1.5 py-0.5 text-xs",
                value === t.value
                  ? "bg-teal-deep text-white"
                  : "bg-white text-ink-soft",
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Segmented control */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="glass-inset inline-flex !rounded-xl p-0.5 overflow-x-auto max-w-full">
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cx(
            "h-8 px-3.5 rounded-[10px] text-[13px] font-semibold whitespace-nowrap transition",
            value === v ? "nav-active" : "text-ink-soft hover:bg-white/70",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Pagination ---------------- */
export function Pagination({ page, totalPages, total, onPage }) {
  if (!totalPages || totalPages <= 1)
    return total !== undefined ? (
      <div className="text-muted text-[13px] px-5 py-3 num">{total} total</div>
    ) : null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-line text-[13px]">
      <span className="text-muted num">
        Page {page} of {totalPages}, {total} total
      </span>
      <div className="flex gap-1">
        <Button
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </Button>
        <Button
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Progress bar ---------------- */
export function Bar({ value, max, tone = "bg-blue", height = "h-2" }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cx("track rounded-full overflow-hidden", height)}>
      <div
        className={cx(
          "h-full rounded-full shadow-[0_2px_6px_-2px_rgba(11,48,72,0.45)] transition-[width] duration-500",
          tone,
        )}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

/* ---------------- Toasts ---------------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Math.random();
    setItems((x) => [...x, { id, message, type }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        className="fixed bottom-24 lg:bottom-5 right-4 left-4 sm:left-auto z-[80] flex flex-col items-end gap-2"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              "flex items-center gap-2 rounded-2xl px-4 py-3 shadow-[0_18px_40px_-14px_rgba(11,48,72,0.55)] text-sm text-white max-w-sm backdrop-blur-xl border border-white/15",
              "bg-teal-deep",
            )}
          >
            {t.type === "error" ? (
              <AlertCircle size={16} className="text-lime" />
            ) : (
              <CheckCircle2 size={16} className="text-lime" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Table helpers ---------------- */
export const TH = ({ children, className }) => (
  <th
    className={cx(
      "text-left font-bold text-teal-deep text-[11.5px] uppercase tracking-[0.06em] px-4 py-3 bg-pearl border-b border-line whitespace-nowrap",
      className,
    )}
  >
    {children}
  </th>
);
export const TD = ({ children, className, ...p }) => (
  <td
    {...p}
    className={cx("px-4 py-3.5 border-b border-line align-middle", className)}
  >
    {children}
  </td>
);

/* ---------------- Small shared pieces used across admin pages ---------------- */

/** Compact summary tile for the row under a page header */
export function MiniStat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "plain",
  small = false,
}) {
  const t = {
    plain: "bg-white border-white text-ink",
    teal: "bg-teal-deep border-teal-deep text-white",
    lime: "bg-lime border-lime text-ink",
  }[tone];
  return (
    <div
      className={cx(
        "rounded-[20px] border px-4 py-3.5 shadow-[0_14px_30px_-20px_rgba(11,48,72,0.45)] flex items-center gap-3 min-w-0",
        t,
      )}
    >
      {Icon && (
        <span
          className={cx(
            "size-10 rounded-full flex items-center justify-center shrink-0",
            tone === "teal"
              ? "bg-white/10 text-lime"
              : tone === "lime"
                ? "bg-teal-deep text-lime"
                : "bg-teal-deep text-lime",
          )}
        >
          <Icon size={19} />
        </span>
      )}
      <div className="min-w-0">
        <div
          className={cx(
            "text-[12px] font-semibold truncate",
            tone === "teal" ? "text-pearl/75" : "text-muted",
            tone === "lime" && "!text-ink/70",
          )}
        >
          {label}
        </div>
        <div
          className={cx(
            "num font-[family-name:var(--font-display)] font-extrabold leading-tight",
            small
              ? "text-[14.5px] [overflow-wrap:anywhere]"
              : "text-[22px] truncate",
          )}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>
        {hint && (
          <div
            className={cx(
              "text-[11.5px] truncate",
              tone === "teal" ? "text-pearl/60" : "text-muted",
            )}
          >
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
export function StatRow({ children, cols = 4 }) {
  return (
    <div
      className={cx(
        "grid grid-cols-2 gap-3 sm:gap-4 mb-6",
        cols === 3
          ? "lg:grid-cols-3"
          : cols === 5
            ? "lg:grid-cols-5"
            : "lg:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}

/** Status pill: lime = good, teal = blocked/off, pearl = neutral, white = waiting */
export function Pill({ tone = "pearl", children, className, dot = true }) {
  const t = {
    lime: "bg-lime text-ink border-lime",
    teal: "bg-teal-deep text-white border-teal-deep",
    pearl: "bg-pearl text-teal-deep border-line",
    white: "bg-white text-muted border-line",
  }[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 h-6 text-[12px] font-semibold whitespace-nowrap",
        t,
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Round icon-only button */
export function IconButton({
  icon: Icon,
  label,
  onClick,
  tone = "plain",
  className,
  ...p
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex items-center justify-center size-9 rounded-full border transition shrink-0",
        tone === "danger"
          ? "border-line bg-white text-teal-deep hover:bg-teal-deep hover:text-white"
          : "border-line bg-white text-teal-deep hover:bg-lime hover:border-lime",
        className,
      )}
      {...p}
    >
      <Icon size={16} />
    </button>
  );
}

/** Card holding search + filters above a list */
export function Toolbar({ children, className }) {
  return (
    <div
      className={cx(
        "card p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Search box with icon */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}) {
  return (
    <div className={cx("relative flex-1 min-w-[220px]", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-10"
        aria-label={placeholder}
      />
    </div>
  );
}
