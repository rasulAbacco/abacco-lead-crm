/* eslint-disable react-refresh/only-export-components */
// Shared UI building blocks (design: navy navigation, white cards, teal/blue actions).
import { createContext, useCallback, useContext, useEffect, useId, useState } from "react";
import { X, Loader2, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

export const cx = (...c) => c.filter(Boolean).join(" ");

// Let a passed width/height/text-size/padding class replace the default instead of fighting it.
const GROUPS = [/^w-/, /^h-/, /^min-h-/, /^text-(xs|sm|base|lg|\[)/, /^px-/, /^pl-/, /^pr-/];
function merge(base, extra = "") {
  const ex = (extra || "").split(/\s+/).filter(Boolean);
  const kept = base.split(/\s+/).filter((b) => !GROUPS.some((g) => g.test(b) && ex.some((e) => g.test(e))));
  return [...kept, ...ex].join(" ");
}

/* ---------------- Buttons ---------------- */
const BTN = {
  primary: "btn-teal text-white border border-transparent shadow-[0_4px_12px_rgba(13,148,136,0.25)] hover:brightness-105",
  blue: "btn-blue text-white border border-transparent shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:brightness-105",
  secondary: "bg-white text-ink border border-line-strong hover:bg-paper",
  ghost: "bg-transparent text-ink-soft hover:bg-paper border border-transparent",
  danger: "bg-white text-leave border border-leave/30 hover:bg-leave-soft",
};
export function Button({ variant = "secondary", size = "md", loading, icon: Icon, className, children, ...p }) {
  return (
    <button
      {...p}
      disabled={p.disabled || loading}
      className={merge(
        cx(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
          size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
          BTN[variant],
        ),
        className,
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

export function RefreshButton({ onClick, spinning }) {
  return (
    <Button variant="secondary" onClick={onClick} title="Load the latest data">
      <RefreshCw size={16} className={spinning ? "animate-spin" : ""} /> <span className="hidden sm:inline">Refresh</span>
    </Button>
  );
}

/* ---------------- Layout pieces ---------------- */
export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <IconTile icon={Icon} tone="blue" />}
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-ink leading-tight">{title}</h1>
          {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, icon: Icon, iconTone = "blue", actions, children, className, bodyClass = "p-5" }) {
  return (
    <section className={cx("card min-w-0", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-line">
          <h2 className="flex items-center gap-2.5 font-bold text-[16px] text-ink">
            {Icon && <Icon size={20} className={TONE_TEXT[iconTone]} />}
            {title}
          </h2>
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

const TONE_BG = { blue: "bg-blue-soft text-blue", green: "bg-active-soft text-active", orange: "bg-orange-soft text-orange", violet: "bg-violet-soft text-violet", teal: "bg-brand-soft text-brand", red: "bg-leave-soft text-leave" };
const TONE_TEXT = { blue: "text-blue", green: "text-active", orange: "text-orange", violet: "text-violet", teal: "text-brand", red: "text-leave" };
const TONE_STROKE = { blue: "#2563eb", green: "#16a34a", orange: "#f97316", violet: "#7c3aed", teal: "#0d9488", red: "#dc2626" };

export function IconTile({ icon: Icon, tone = "blue", size = 44 }) {
  return (
    <span className={cx("inline-flex items-center justify-center rounded-xl shrink-0", TONE_BG[tone])} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.48)} strokeWidth={2} />
    </span>
  );
}

/** Tiny area chart for stat cards */
export function Sparkline({ data = [], tone = "blue", width = 96, height = 36 }) {
  const id = useId().replace(/:/g, "");
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - 3 - ((v - min) / (max - min || 1)) * (height - 8)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const c = TONE_STROKE[tone];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.28" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${id})`} />
      <path d={line} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({ label, value, hint, icon, tone = "blue", trend, spark, valueTone }) {
  return (
    <div className="card relative overflow-hidden p-4 sm:p-5 flex gap-3.5 min-w-0">
      {icon && <IconTile icon={icon} tone={tone} />}
      <div className="flex-1 min-w-0 relative z-[1]">
        <div className="text-muted text-[13px] font-medium leading-snug">{label}</div>
        <div className={cx("num text-[26px] sm:text-[28px] font-bold leading-tight mt-0.5", valueTone || "text-ink")}>{value}</div>
        {hint && <div className="text-muted text-xs mt-0.5 truncate pr-20">{hint}</div>}
        {trend}
      </div>
      {spark && <div className="absolute right-3 bottom-3 opacity-90 pointer-events-none"><Sparkline data={spark} tone={tone} width={84} height={34} /></div>}
    </div>
  );
}
/** v2 compatibility */
export const Stat = ({ label, value, hint, tone }) => <StatCard label={label} value={value} hint={hint} valueTone={tone} />;

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 size={18} className="animate-spin" /> {label}
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="text-center py-14 px-6">
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="text-muted mt-1 max-w-md mx-auto">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-leave-soft text-leave border border-leave/20 rounded-xl px-4 py-3 mb-4">
      <span className="flex items-center gap-2"><AlertCircle size={16} /> {error.message || String(error)}</span>
      {onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/* ---------------- Avatar ---------------- */
const AVATAR = ["bg-blue", "bg-violet", "bg-brand", "bg-orange", "bg-[#db2777]", "bg-[#0891b2]", "bg-[#4f46e5]", "bg-active"];
export function Avatar({ name = "", size = 28, soft = false }) {
  const initial = (name.trim()[0] || "?").toUpperCase();
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = AVATAR[h % AVATAR.length];
  return (
    <span
      className={cx("inline-flex items-center justify-center rounded-full font-semibold shrink-0", soft ? "bg-blue-soft text-blue" : `${color} text-white`)}
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
      {error ? <span className="block text-xs text-leave mt-1">{error}</span> : hint ? <span className="block text-xs text-muted mt-1">{hint}</span> : null}
    </label>
  );
}
const INPUT = "w-full h-10 rounded-lg border border-line-strong bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus:border-blue focus:ring-4 focus:ring-blue/10 outline-none transition";
export const Input = ({ className, ...p }) => <input {...p} className={merge(INPUT, className)} />;
export const Select = ({ className = "", children, ...p }) => {
  const width = className.match(/(?:^|\s)((?:\w+:)?w-\S+)/g)?.map((s) => s.trim()).join(" ");
  const rest = className.replace(/(?:^|\s)(?:\w+:)?w-\S+/g, " ");
  return (
    <span className={cx("relative", width ? `inline-block ${width}` : "block w-full")}>
      <select {...p} className={merge(`${INPUT} pr-9 appearance-none cursor-pointer`, `${rest} w-full`)}>
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </span>
  );
};
export const Textarea = ({ className, ...p }) => <textarea {...p} className={merge(`${INPUT.replace("h-10", "h-auto")} py-2.5 min-h-[100px]`, className)} />;

/** Input with an icon on the left */
export function IconInput({ icon: Icon, className, ...p }) {
  return (
    <span className="relative block">
      <Icon size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <Input {...p} className={cx("pl-10", className)} />
    </span>
  );
}

/* ---------------- Status ---------------- */
export const STATUS_STYLE = {
  PENDING: "bg-pending-soft text-pending border-pending/20",
  ACTIVE: "bg-active-soft text-active border-active/25",
  NO_RESPONSE: "bg-noresp-soft text-noresp border-noresp/25",
  LEAVE_OUT: "bg-leave-soft text-leave border-leave/25",
};
const STATUS_TEXT = { PENDING: "Pending", ACTIVE: "Active", NO_RESPONSE: "No Response", LEAVE_OUT: "Leave Out" };
export function StatusBadge({ status }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 h-6 text-xs font-semibold whitespace-nowrap", STATUS_STYLE[status] || STATUS_STYLE.PENDING)}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_TEXT[status] || status}
    </span>
  );
}

/** Number chip (team table counts) */
export function Chip({ tone = "pending", children }) {
  const t = { active: STATUS_STYLE.ACTIVE, noresp: STATUS_STYLE.NO_RESPONSE, leave: STATUS_STYLE.LEAVE_OUT, pending: STATUS_STYLE.PENDING, blue: "bg-blue-soft text-blue border-blue/20" }[tone];
  return <span className={cx("num inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-md border text-[13px] font-semibold", t)}>{children}</span>;
}

export function Badge({ children, className }) {
  return <span className={cx("inline-flex items-center rounded-md px-2.5 h-6 text-xs font-semibold bg-blue-soft text-blue whitespace-nowrap", className)}>{children}</span>;
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, footer, width = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-navy/45 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" className={cx("w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col", width)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h2 className="font-bold text-[17px]">{title}</h2>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-paper text-muted" aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/60 rounded-b-2xl shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Tabs ---------------- */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 border-b border-line mb-5 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            "flex items-center gap-2 px-3.5 h-11 -mb-px border-b-[3px] text-sm font-semibold whitespace-nowrap transition",
            value === t.value ? "border-blue text-blue" : "border-transparent text-muted hover:text-ink",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cx("num rounded-md px-1.5 py-0.5 text-xs", value === t.value ? "bg-blue-soft text-blue" : "bg-pending-soft text-ink-soft")}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Segmented control */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-line-strong bg-white p-0.5 overflow-x-auto max-w-full">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} className={cx("h-8 px-3.5 rounded-md text-[13px] font-semibold whitespace-nowrap", value === v ? "bg-navy text-white" : "text-ink-soft hover:bg-paper")}>
          {l}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Pagination ---------------- */
export function Pagination({ page, totalPages, total, onPage }) {
  if (!totalPages || totalPages <= 1) return total !== undefined ? <div className="text-muted text-[13px] px-5 py-3 num">{total} total</div> : null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-line text-[13px]">
      <span className="text-muted num">Page {page} of {totalPages}, {total} total</span>
      <div className="flex gap-1">
        <Button size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={15} /></Button>
        <Button size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={15} /></Button>
      </div>
    </div>
  );
}

/* ---------------- Progress bar ---------------- */
export function Bar({ value, max, tone = "bg-blue", height = "h-2" }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cx("rounded-full bg-[#e9eef7] overflow-hidden", height)}>
      <div className={cx("h-full rounded-full", tone)} style={{ width: `${p}%` }} />
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
      <div className="fixed bottom-24 lg:bottom-5 right-4 left-4 sm:left-auto z-[80] flex flex-col items-end gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx("flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl text-sm text-white max-w-sm", t.type === "error" ? "bg-leave" : "bg-navy")}>
            {t.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} className="text-emerald-300" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Table helpers ---------------- */
export const TH = ({ children, className }) => (
  <th className={cx("text-left font-semibold text-muted text-[13px] px-4 py-3 bg-[#f6f8fc] border-b border-line whitespace-nowrap", className)}>{children}</th>
);
export const TD = ({ children, className, ...p }) => (
  <td {...p} className={cx("px-4 py-3 border-b border-line align-middle", className)}>
    {children}
  </td>
);
