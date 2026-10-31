import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { api, clearCache } from "../lib/api";
import { getSession, saveSession } from "../lib/session";
import { Button, Field, Input } from "../components/ui";

function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);
  const set = (i, v) => {
    const digits = Array.from({ length: 6 }, (_, k) => value[k] || "");
    digits[i] = v;
    onChange(digits.join(""));
  };
  return (
    <div className="flex gap-2" onPaste={(e) => {
      const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (t) {
        e.preventDefault();
        onChange(t);
        refs.current[Math.min(t.length, 5)]?.focus();
      }
    }}>
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
            if (e.key === "Backspace" && !value[i]) refs.current[i - 1]?.focus();
          }}
          className="num size-12 text-center text-xl font-semibold rounded-md border border-line-strong focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none"
        />
      ))}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("expired") ? "Your session ended. Please log in again." : "");
  const [info, setInfo] = useState("");

  useEffect(() => clearCache(), []);

  const session = getSession();
  if (session) return <Navigate to={session.role === "ADMIN" ? "/admin-dashboard" : "/employee-dashboard"} replace />;

  async function submitCredentials(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/auth/login", { method: "POST", body: { email, password } });
      setEmail(data.email || email);
      setStep("otp");
      setInfo(`We sent a 6-digit code to ${data.email || email}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/auth/verify-otp", { method: "POST", body: { email, otp } });
      saveSession(data);
      navigate(data.role === "ADMIN" ? "/admin-dashboard" : "/employee-dashboard", { replace: true });
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

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(380px,44%)_1fr]">
      <section className="hidden lg:flex flex-col justify-between bg-ink text-white p-12">
        <div className="flex items-center gap-3">
          <img src="https://www.abaccotech.com/Logo/icon.png" alt="" className="size-10 rounded-md bg-white/10" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="text-lg font-semibold">Abacco Technology</span>
        </div>
        <div className="max-w-md">
          <p className="text-[34px] leading-[1.15] font-semibold tracking-tight">
            Every lead you upload, tracked from first email to final status.
          </p>
          <p className="mt-5 text-white/60 text-[15px] leading-relaxed">
            Upload leads, follow your monthly target and see how the team is doing, all in US Central time.
          </p>
        </div>
        <p className="text-white/40 text-sm">© {new Date().getFullYear()} Abacco Technology</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{step === "otp" ? "Check your email" : "Sign in to Lead CRM"}</h1>
          <p className="text-muted mt-1 mb-7">{step === "otp" ? info : "Use your work email and password."}</p>

          {error && <div className="mb-4 rounded-md border border-leave/30 bg-leave-soft text-leave px-3.5 py-2.5 text-[13px]">{error}</div>}

          {step === "credentials" ? (
            <form onSubmit={submitCredentials} className="space-y-4">
              <Field label="Email">
                <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@abaccotech.com" />
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Input type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Button type="submit" variant="primary" loading={busy} className="w-full h-10">Continue</Button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="space-y-5">
              <OtpBoxes value={otp} onChange={setOtp} />
              <Button type="submit" variant="primary" loading={busy} disabled={otp.length < 6} className="w-full h-10">Verify and sign in</Button>
              <div className="flex items-center justify-between text-[13px]">
                <button type="button" onClick={() => { setStep("credentials"); setOtp(""); setError(""); }} className="inline-flex items-center gap-1 text-muted hover:text-ink">
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="button" onClick={resend} className="text-brand hover:underline">Send a new code</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
