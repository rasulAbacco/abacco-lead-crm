import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Users,
  BarChart3,
  Target,
  Zap,
  MailCheck,
  Loader2,
  Info,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { api, clearCache } from "../lib/api";
import { getSession, saveSession } from "../lib/session";
import { cx } from "../components/ui";

/* Brand palette (login page only) */
// teal #0B3048 · pearl #F2F0E9 · lime #B9F12F · white · text #08090B · muted #65727A · border #D8DAD5

const LOGO = "https://www.abaccotech.com/Logo/icon.png";
const REMEMBER_KEY = "rememberEmail";
const ACCESS_EMAIL = "info@abaccotech.com";

/* Product picture. Put the real files in client/public and set the paths here.
   Right now one combined picture (laptop + phone + plant) is used as the laptop,
   so phone and plant are off. With three separate files, set all three. */
const ART = {
  laptop: "/login-showcase.png",
  phone: null, // e.g. "/login-phone.webp"
  plant: null, // e.g. "/login-plant.webp"
};

const FEATURES = [
  { icon: BarChart3, label: "Track Leads" },
  { icon: Target, label: "Meet Targets" },
  { icon: Users, label: "Team Collaboration" },
  { icon: Zap, label: "Real-time Insights" },
];

function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);
  const set = (i, v) => {
    const digits = Array.from({ length: 6 }, (_, k) => value[k] || "");
    digits[i] = v;
    onChange(digits.join(""));
  };
  return (
    <div
      className="grid grid-cols-6 gap-2 sm:gap-2.5"
      onPaste={(e) => {
        const t = e.clipboardData
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6);
        if (t) {
          e.preventDefault();
          onChange(t);
          refs.current[Math.min(t.length, 5)]?.focus();
        }
      }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          value={value[i] || ""}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            set(i, v);
            if (v) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i])
              refs.current[i - 1]?.focus();
          }}
          className="num w-full min-w-0 h-[58px] text-center text-2xl font-bold text-[#08090B] rounded-2xl bg-white border border-[#D8DAD5] focus:border-[#0B3048] focus:ring-4 focus:ring-[#B9F12F]/60 outline-none transition"
        />
      ))}
    </div>
  );
}

function Logo({ className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-full bg-white shrink-0 overflow-hidden",
        className,
      )}
    >
      <img
        src={LOGO}
        alt="Abacco Technology"
        className="w-[72%] h-[72%] object-contain"
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
    </span>
  );
}

function Badge({ className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-3 rounded-full bg-[#B9F12F] text-[#08090B] font-bold px-[26px] py-3 text-[clamp(18px,2.6vh,24px)] leading-none shadow-[0_10px_24px_-12px_rgba(185,241,47,0.8)]",
        className,
      )}
    >
      <Users size={24} strokeWidth={2.6} /> Lead CRM
    </span>
  );
}

/* Laptop + phone + plant, sitting on the bottom of the hero */
function ProductVisual() {
  return (
    <div
      className="relative w-full h-full flex items-end justify-center lg:justify-start lg:pl-[3%] pointer-events-none select-none"
      aria-hidden="true"
    >
      {ART.plant && (
        <img
          src={ART.plant}
          alt=""
          className="h-[min(300px,88%)] w-auto max-w-[180px] object-contain mr-[-30px] drop-shadow-[0_18px_22px_rgba(0,0,0,0.35)]"
          draggable="false"
        />
      )}
      <img
        src={ART.laptop}
        alt=""
        className="relative z-[1] max-h-full w-auto max-w-[650px] object-contain object-bottom drop-shadow-[0_24px_30px_rgba(0,0,0,0.4)]"
        draggable="false"
      />
      {ART.phone && (
        <img
          src={ART.phone}
          alt=""
          className="relative z-[2] h-[min(250px,74%)] w-auto max-w-[145px] object-contain ml-[-48px] drop-shadow-[0_16px_22px_rgba(0,0,0,0.45)]"
          draggable="false"
        />
      )}
    </div>
  );
}

/* Desktop background: pearl page with a large curved teal shape on the left and a
   lime swoosh behind the top of the card (matches the reference split). */
function PageShapes() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1672 941"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="tl-glow" cx="0.38" cy="0.42" r="0.6">
          <stop offset="0%" stopColor="#14506A" />
          <stop offset="55%" stopColor="#0E3D58" />
          <stop offset="100%" stopColor="#0B3048" />
        </radialGradient>
        <radialGradient id="tl-low" cx="0.05" cy="1" r="0.55">
          <stop offset="0%" stopColor="#B9F12F" stopOpacity="0.28" />
          <stop offset="45%" stopColor="#1E6A5E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0B3048" stopOpacity="0" />
        </radialGradient>
        <clipPath id="tl-clip">
          <path d="M0 0 H1190 C1110 110 1030 230 1000 360 C972 480 905 560 880 690 C862 790 880 870 905 941 H0 Z" />
        </clipPath>
      </defs>
      {/* teal body with a curved right edge */}
      <path
        d="M0 0 H1190 C1110 110 1030 230 1000 360 C972 480 905 560 880 690 C862 790 880 870 905 941 H0 Z"
        fill="url(#tl-glow)"
      />
      <path
        d="M0 0 H1190 C1110 110 1030 230 1000 360 C972 480 905 560 880 690 C862 790 880 870 905 941 H0 Z"
        fill="url(#tl-low)"
      />
      {/* lighter rim along the curve, kept inside the teal shape (no hard cut-off) */}
      <g clipPath="url(#tl-clip)">
        <path
          d="M1190 0 C1110 110 1030 230 1000 360 C972 480 905 560 880 690 C862 790 880 870 905 941"
          fill="none"
          stroke="#1A5470"
          strokeOpacity="0.35"
          strokeWidth="90"
        />
        <path
          d="M1190 0 C1110 110 1030 230 1000 360 C972 480 905 560 880 690 C862 790 880 870 905 941"
          fill="none"
          stroke="#2A6A86"
          strokeOpacity="0.35"
          strokeWidth="34"
        />
        {/* soft lower wave behind the product picture */}
        <path
          d="M-20 700 C180 640 380 660 560 730 C700 785 820 800 960 790 L960 960 H-20 Z"
          fill="#0F4057"
          opacity="0.55"
        />
      </g>
      {/* lime swoosh behind the card */}
      <path
        d="M1150 118 C1230 60 1320 22 1450 -12"
        fill="none"
        stroke="#B9F12F"
        strokeWidth="44"
        strokeLinecap="round"
      />
      <path
        d="M1176 150 C1260 92 1350 52 1480 18"
        fill="none"
        stroke="#B9F12F"
        strokeOpacity="0.25"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_KEY) || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [otp, setOtp] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState(
    params.get("expired") ? "Your session ended. Please log in again." : "",
  );
  const [info, setInfo] = useState("");
  const [help, setHelp] = useState(""); // "forgot" | "access" | ""

  useEffect(() => clearCache(), []);

  const session = getSession();
  if (session)
    return (
      <Navigate
        to={
          session.role === "ADMIN" ? "/admin-dashboard" : "/employee-dashboard"
        }
        replace
      />
    );

  const emailErr = !email.trim()
    ? "Please enter your email."
    : !isEmail(email)
      ? "Please enter a valid email address."
      : "";
  const passErr = !password ? "Please enter your password." : "";

  async function submitCredentials(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailErr || passErr) return;
    setBusy(true);
    setError("");
    setHelp("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      setEmail(data.email || email.trim());
      setStep("otp");
      setInfo(`We sent a 6-digit code to ${data.email || email.trim()}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e) {
    e.preventDefault();
    if (otp.length < 6) return;
    setBusy(true);
    setError("");
    try {
      const data = await api("/auth/verify-otp", {
        method: "POST",
        body: { email, otp },
      });
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* storage blocked: ignore */
      }
      saveSession(data, remember);
      navigate(
        data.role === "ADMIN" ? "/admin-dashboard" : "/employee-dashboard",
        { replace: true },
      );
    } catch (err) {
      setError(err.message);
      setOtp("");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    try {
      await api("/auth/resend-otp", { method: "POST", body: { email } });
      setInfo(`A new code was sent to ${email}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  const field = (bad) =>
    cx(
      "w-full h-[clamp(52px,6.6vh,60px)] rounded-[18px] bg-[#FBFAF7] border pl-14 pr-4 text-[17px] text-[#08090B] placeholder:text-[#65727A] outline-none transition shadow-[0_6px_16px_-10px_rgba(11,48,72,0.35),inset_0_1px_0_#fff] focus:border-[#0B3048] focus:ring-4 focus:ring-[#B9F12F]/60",
      bad ? "border-[#0B3048] ring-2 ring-[#0B3048]/15" : "border-[#D8DAD5]",
    );
  const limeBtn =
    "w-full min-h-[clamp(56px,7vh,66px)] rounded-[32px] bg-[#B9F12F] text-[#08090B] text-[22px] font-[750] inline-flex items-center justify-center gap-3 shadow-[0_16px_30px_-14px_rgba(120,170,20,0.75),inset_0_1px_0_rgba(255,255,255,0.5)] hover:bg-[#A9E01F] active:translate-y-px disabled:opacity-60 transition-colors";

  return (
    <div className="relative min-h-screen lg:h-screen overflow-hidden bg-[#F2F0E9] text-[#08090B]">
      <div className="hidden lg:block">
        <PageShapes />
      </div>

      <div className="relative z-[1] min-h-screen lg:h-screen grid lg:grid-cols-[58%_42%]">
        {/* ======================= HERO ======================= */}
        <section className="relative bg-[#0B3048] lg:bg-transparent text-white px-5 sm:px-10 lg:pl-[7%] lg:pr-6 pt-7 lg:pt-[3.2vh] pb-8 lg:pb-0 flex flex-col min-h-0">
          {/* branding: logo | name */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Logo className="size-14 sm:size-[76px] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)]" />
            <span
              className="hidden sm:block w-px self-stretch my-1 bg-white/50"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="font-[family-name:var(--font-display)] text-[28px] sm:text-[36px] xl:text-[clamp(34px,5vh,46px)] font-bold leading-none tracking-[-0.01em]">
                Abacco Technology
              </div>
              <div className="mt-2 text-[11px] sm:text-[14px] xl:text-[15px] tracking-[3px] sm:tracking-[5px] text-[#F2F0E9]">
                BUSINESS SOFTWARE SOLUTIONS
              </div>
            </div>
          </div>

          <div className="mt-[clamp(18px,3.6vh,36px)]">
            <Badge />
          </div>

          <h1 className="font-[family-name:var(--font-display)] mt-[clamp(10px,1.6vh,16px)] text-[32px] sm:text-[42px] xl:text-[clamp(40px,6.2vh,56px)] font-extrabold leading-[1.06] tracking-[-0.02em] text-white">
            Manage Leads,
            <br />
            Run Campaigns &amp;
            <br />
            <span className="relative inline-block text-[#B9F12F]">
              Grow Your Business.
              <svg
                className="absolute right-0 -bottom-[0.32em] w-[48%]"
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 15 C60 6 140 3 198 10"
                  fill="none"
                  stroke="#B9F12F"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-[clamp(14px,2.6vh,26px)] max-w-[600px] text-[16px] sm:text-[19px] xl:text-[clamp(17px,2.3vh,21px)] leading-[1.35] text-[#F2F0E9]">
            A complete Lead CRM to capture, track and convert leads with your
            team, in real time.
          </p>

          {/* features: icon + text inside each tile, thin separators */}
          <ul className="hidden sm:grid mt-[clamp(12px,2vh,20px)] grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-3 xl:gap-4 max-w-[680px]">
            {FEATURES.map((f, i) => [
              i > 0 && (
                <li
                  key={`sep-${i}`}
                  className="w-px h-12 bg-white/30"
                  aria-hidden="true"
                />
              ),
              <li
                key={f.label}
                className="h-full min-w-0 flex flex-col items-center justify-center text-center rounded-[18px] bg-white/[0.07] border border-white/12 backdrop-blur-sm px-2 py-[clamp(8px,1.4vh,14px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <f.icon
                  strokeWidth={2.6}
                  className="text-[#B9F12F] w-[clamp(26px,4vh,36px)] h-[clamp(26px,4vh,36px)]"
                />
                <span className="mt-1.5 text-[clamp(13px,1.8vh,16px)] font-semibold leading-tight text-white">
                  {f.label}
                </span>
              </li>,
            ])}
          </ul>

          {/* product picture: takes the height that is left, never overlaps the text */}
          <div className="hidden lg:block flex-1 min-h-[150px] max-h-[360px] mt-[clamp(8px,1.6vh,16px)] pb-[6px]">
            <ProductVisual />
          </div>
        </section>

        {/* ======================= SIGN-IN ======================= */}
        <section className="relative flex flex-col items-center justify-center px-4 sm:px-8 lg:pl-0 lg:pr-[3.5%] py-8 lg:py-[clamp(16px,4vh,60px)] overflow-hidden lg:overflow-visible">
          <div className="relative w-full max-w-[610px] rounded-[32px] sm:rounded-[44px] bg-[#F6F4EE] border border-white shadow-[0_30px_70px_-20px_rgba(11,48,72,0.35),0_8px_20px_-8px_rgba(11,48,72,0.12),inset_0_1px_0_#fff] px-6 py-8 sm:px-[58px] sm:py-[clamp(26px,4.4vh,55px)]">
            {/* card branding */}
            <div className="hidden lg:flex [@media(max-height:800px)]:!hidden flex-col items-center text-center">
              <Logo className="size-[clamp(60px,10vh,96px)] shadow-[0_10px_24px_-12px_rgba(11,48,72,0.45)]" />
              <div className="font-[family-name:var(--font-display)] mt-3 text-[clamp(28px,4.4vh,40px)] font-extrabold leading-none text-[#0B3048] tracking-[-0.01em]">
                Abacco Technology
              </div>
              <div className="mt-3 flex items-center gap-3 w-full">
                <span
                  className="h-[3px] flex-1 rounded-full bg-[#B9F12F]"
                  aria-hidden="true"
                />
                <span className="text-[12px] xl:text-[13px] tracking-[3px] text-[#0B3048] font-medium whitespace-nowrap">
                  BUSINESS SOFTWARE SOLUTIONS
                </span>
                <span
                  className="h-[3px] flex-1 rounded-full bg-[#B9F12F]"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="text-center lg:mt-[clamp(14px,3vh,32px)] [@media(max-height:800px)]:!mt-0">
              {step === "otp" && (
                <span className="mx-auto mb-4 size-14 rounded-2xl bg-[#B9F12F] text-[#08090B] flex items-center justify-center">
                  <MailCheck size={28} />
                </span>
              )}
              <h2 className="font-[family-name:var(--font-display)] text-[26px] sm:text-[clamp(28px,4vh,34px)] font-[750] leading-tight text-[#08090B]">
                {step === "otp" ? (
                  "Check your email"
                ) : (
                  <>
                    Sign in to{" "}
                    <span className="inline-block rounded-full bg-[#B9F12F] px-4 py-0.5">
                      Lead CRM
                    </span>
                  </>
                )}
              </h2>
              {step === "otp" && (
                <p className="mt-2.5 text-[15px] sm:text-[16px] text-[#65727A]">
                  {info}
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-2xl bg-white border-2 border-[#0B3048] px-4 py-3 text-[14px] text-[#08090B]"
              >
                <AlertCircle
                  size={18}
                  className="shrink-0 mt-px text-[#0B3048]"
                />{" "}
                {error}
              </div>
            )}

            {step === "credentials" ? (
              <form
                onSubmit={submitCredentials}
                noValidate
                className="mt-[clamp(16px,3vh,30px)]"
              >
                <label className="block">
                  <span className="sr-only">Email</span>
                  <span className="relative block">
                    <Mail
                      size={22}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0B3048]"
                    />
                    <input
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="Enter your email"
                      aria-invalid={!!(touched.email && emailErr)}
                      className={field(touched.email && emailErr)}
                    />
                  </span>
                  {touched.email && emailErr && (
                    <span className="block mt-1.5 text-[13px] font-medium text-[#0B3048]">
                      {emailErr}
                    </span>
                  )}
                </label>

                <label className="block mt-[clamp(12px,2vh,20px)]">
                  <span className="sr-only">Password</span>
                  <span className="relative block">
                    <Lock
                      size={22}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0B3048]"
                    />
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, password: true }))
                      }
                      placeholder="Enter your password"
                      aria-invalid={!!(touched.password && passErr)}
                      className={cx(
                        field(touched.password && passErr),
                        "pr-14",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-[#08090B] hover:bg-[#B9F12F]/40 transition-colors"
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </span>
                  {touched.password && passErr && (
                    <span className="block mt-1.5 text-[13px] font-medium text-[#0B3048]">
                      {passErr}
                    </span>
                  )}
                </label>

                <div className="mt-[clamp(14px,2.4vh,24px)] flex items-center justify-between gap-3 text-[15px] sm:text-[16px]">
                  <label className="inline-flex items-center gap-3 cursor-pointer select-none text-[#08090B] font-medium">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="size-5 rounded-md accent-[#0B3048] cursor-pointer"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => setHelp(help === "forgot" ? "" : "forgot")}
                    aria-expanded={help === "forgot"}
                    className="font-semibold text-[#0B3048] rounded-md px-1 -mx-1 hover:bg-[#B9F12F]/50 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                {help === "forgot" && (
                  <p className="mt-3 flex items-start gap-2 rounded-2xl bg-white border border-[#D8DAD5] px-4 py-3 text-[14px] text-[#65727A]">
                    <Info
                      size={17}
                      className="text-[#0B3048] shrink-0 mt-0.5"
                    />
                    Please ask your admin to set a new password for you. They
                    can do it from Employees → Edit.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={cx(limeBtn, "mt-[clamp(14px,2.6vh,26px)]")}
                >
                  {busy ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      Sign In <ArrowRight size={24} strokeWidth={2.5} />
                    </>
                  )}
                </button>

                <div
                  className="my-[clamp(10px,2vh,22px)] flex items-center gap-5 text-[15px] font-semibold text-[#65727A]"
                  aria-hidden="true"
                >
                  <span className="h-px flex-1 bg-[#D8DAD5]" /> OR{" "}
                  <span className="h-px flex-1 bg-[#D8DAD5]" />
                </div>

                <button
                  type="button"
                  onClick={() => setHelp(help === "access" ? "" : "access")}
                  aria-expanded={help === "access"}
                  className="w-full min-h-[60px] rounded-[30px] border-2 border-[#0B3048] bg-transparent text-[#08090B] text-[19px] font-bold inline-flex items-center justify-center gap-3 hover:bg-[#B9F12F]/35 transition-colors"
                >
                  <UserPlus size={24} /> Request Access
                </button>
                {help === "access" && (
                  <p className="mt-3 flex items-start gap-2 rounded-2xl bg-white border border-[#D8DAD5] px-4 py-3 text-[14px] text-[#65727A]">
                    <Info
                      size={17}
                      className="text-[#0B3048] shrink-0 mt-0.5"
                    />
                    <span>
                      Accounts are created by your admin. Ask them to add you,
                      or{" "}
                      <a
                        href={`mailto:${ACCESS_EMAIL}?subject=${encodeURIComponent("Lead CRM access request")}`}
                        className="font-semibold text-[#0B3048] underline underline-offset-2"
                      >
                        email {ACCESS_EMAIL}
                      </a>
                      .
                    </span>
                  </p>
                )}
              </form>
            ) : (
              <form onSubmit={submitOtp} className="mt-7 space-y-6">
                <OtpBoxes value={otp} onChange={setOtp} />
                <button
                  type="submit"
                  disabled={busy || otp.length < 6}
                  className={limeBtn}
                >
                  {busy ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      Verify and Sign In{" "}
                      <ArrowRight size={22} strokeWidth={2.5} />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-between text-[15px]">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setOtp("");
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 font-semibold text-[#0B3048] rounded-md px-1 -mx-1 hover:bg-[#B9F12F]/50"
                  >
                    <ArrowLeft size={17} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={resend}
                    className="font-semibold text-[#0B3048] rounded-md px-1 -mx-1 hover:bg-[#B9F12F]/50"
                  >
                    Send a new code
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* phones/tablets: product picture below the form */}
          <div className="lg:hidden w-full max-w-[520px] mt-8 h-[220px] sm:h-[300px]">
            <ProductVisual />
          </div>

          <p className="relative mt-6 lg:mt-3 text-[13px] text-[#65727A] text-center">
            © {new Date().getFullYear()} Abacco Technology. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  );
}
