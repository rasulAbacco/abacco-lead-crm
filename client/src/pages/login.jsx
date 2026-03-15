import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Zap,
  TrendingUp,
  Shield,
  Users,
  Target,
  BarChart2,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      if (data.otpRequired) {
        setOtpRequired(true);
        setLoading(false);
        return;
      }
      if (data.success) loginSuccess(data);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");
      loginSuccess(data);
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("OTP resent successfully");
    } catch (err) {
      setError(err.message);
    }
  };

  const loginSuccess = (data) => {
    localStorage.setItem("employeeId", data.employeeId);
    localStorage.setItem("role", data.role.toLowerCase());
    localStorage.setItem("token", data.token);
    localStorage.setItem("fullName", data.fullName);
    const role = data.role.toLowerCase();
    setWelcomeMessage(role === "admin" ? "Welcome, Admin!" : `Welcome back!`);
    setShowWelcome(true);
    setTimeout(
      () =>
        navigate(role === "admin" ? "/admin-dashboard" : "/employee-dashboard"),
      2600,
    );
  };

  return (
    <div className="root">
      {/* ── Welcome overlay ── */}
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-box">
            <div className="wc-ripple" />
            <div className="wc-ripple r2" />
            <div className="wc-ripple r3" />
            <div className="wc-icon-wrap">
              <CheckCircle className="wc-icon" />
            </div>
            <h2 className="wc-title">Authenticated!</h2>
            <p className="wc-msg">{welcomeMessage}</p>
            <div className="wc-bar">
              <div className="wc-bar-fill" />
            </div>
          </div>
        </div>
      )}

      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="left">
        {/* Mesh background */}
        <div className="mesh" />
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />

        <div className="left-content">
          {/* Logo */}
          <div className="brand">
            <div className="brand-logo">
              <img
                src="https://www.abaccotech.com/Logo/icon.png"
                alt="Abacco"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span
                style={{
                  display: "none",
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                A
              </span>
            </div>
            <div>
              <div className="brand-name">Abacco Technology</div>
              <div className="brand-sub">Lead CRM Platform</div>
            </div>
          </div>

          {/* Headline */}
          <div className="headline-block">
            <div className="headline-tag">✦ CRM Intelligence</div>
            <h1 className="headline">
              Turn every
              <br />
              lead into a<br />
              <span className="headline-hl">closed deal.</span>
            </h1>
            <p className="headline-body">
              Streamline your pipeline, track performance in real time, and hit
              targets faster with data-driven insights.
            </p>
          </div>

          {/* Metric cards */}
          <div className="metrics">
            <div className="metric-card">
              <div
                className="metric-icon"
                style={{
                  background: "linear-gradient(135deg,#a78bfa,#7c3aed)",
                }}
              >
                <Users size={15} />
              </div>
              <div>
                <div className="metric-val">2,400+</div>
                <div className="metric-lbl">Active leads</div>
              </div>
            </div>
            <div className="metric-card">
              <div
                className="metric-icon"
                style={{
                  background: "linear-gradient(135deg,#f472b6,#ec4899)",
                }}
              >
                <Target size={15} />
              </div>
              <div>
                <div className="metric-val">94%</div>
                <div className="metric-lbl">Target hit rate</div>
              </div>
            </div>
            <div className="metric-card">
              <div
                className="metric-icon"
                style={{
                  background: "linear-gradient(135deg,#34d399,#059669)",
                }}
              >
                <BarChart2 size={15} />
              </div>
              <div>
                <div className="metric-val">3.2×</div>
                <div className="metric-lbl">Pipeline velocity</div>
              </div>
            </div>
          </div>

          {/* Feature list */}
          <div className="feats">
            {[
              {
                icon: <Zap size={13} />,
                label: "Real-time lead tracking",
                color: "#a78bfa",
              },
              {
                icon: <TrendingUp size={13} />,
                label: "AI-powered analytics",
                color: "#f472b6",
              },
              {
                icon: <Shield size={13} />,
                label: "Role-based access control",
                color: "#34d399",
              },
            ].map((f, i) => (
              <div className="feat" key={i}>
                <span className="feat-icon" style={{ color: f.color }}>
                  {f.icon}
                </span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="left-footer">
          © {new Date().getFullYear()} Abacco Technology
        </div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div className="right">
        {/* subtle grid bg */}
        <div className="right-grid" />

        <div className="form-shell">
          {/* Glowing border top */}
          <div className="shell-glow" />

          {!otpRequired ? (
            <>
              <div className="form-top">
                <div className="form-avatar">
                  <img
                    src="https://www.abaccotech.com/Logo/icon.png"
                    alt=""
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <span className="avatar-fallback">A</span>
                </div>
                <div>
                  <h2 className="form-title">Sign in</h2>
                  <p className="form-sub">Access your CRM dashboard</p>
                </div>
              </div>

              {error && (
                <div className="err">
                  <span className="err-pip" /> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="form">
                <div className="field">
                  <label className="lbl">Email</label>
                  <div className="input-wrap">
                    <span className="input-prefix">@</span>
                    <input
                      type="email"
                      placeholder="you@abaccotech.com"
                      className="inp"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="lbl">Password</label>
                  <div className="input-wrap">
                    <span className="input-prefix lock">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••"
                      className="inp"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spin" /> Signing in…
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} className="btn-arrow" />
                    </>
                  )}
                </button>
              </form>

              <div className="divider">
                <span>secured by Abacco CRM</span>
              </div>

              <div className="trust-row">
                <span className="trust-badge">
                  <span className="trust-dot green" />
                  SSL Encrypted
                </span>
                <span className="trust-badge">
                  <span className="trust-dot blue" />
                  2FA Ready
                </span>
                <span className="trust-badge">
                  <span className="trust-dot purple" />
                  SOC2 Safe
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="otp-header">
                <div className="otp-icon-wrap">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="1.8"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h2 className="form-title">Verify your identity</h2>
                <p className="form-sub">
                  Enter the 6-digit code sent to
                  <br />
                  <strong>{email}</strong>
                </p>
              </div>

              {error && (
                <div className="err">
                  <span className="err-pip" /> {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="form">
                <div className="otp-grid">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      className="otp-box"
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/, "");
                        const a = otp.split("");
                        a[i] = v;
                        setOtp(a.join("").slice(0, 6));
                        if (v && e.target.nextSibling)
                          e.target.nextSibling.focus();
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !otp[i] &&
                          e.target.previousSibling
                        )
                          e.target.previousSibling.focus();
                      }}
                    />
                  ))}
                </div>

                <div className="otp-progress">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`otp-pip ${otp[i] ? "filled" : ""}`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight size={16} className="btn-arrow" />
                    </>
                  )}
                </button>

                <button type="button" onClick={resendOtp} className="btn-ghost">
                  Didn't get it? <span>Resend code</span>
                </button>
              </form>
            </>
          )}

          <p className="shell-footer">
            © {new Date().getFullYear()} Abacco Technology · All rights reserved
          </p>
        </div>
      </div>

      {/* ════ ALL STYLES ════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .root{
          min-height:100vh; display:flex;
          font-family:'Outfit',sans-serif;
          background:#0d0b1a;
        }

        /* ─── LEFT ─── */
        .left{
          width:480px; min-height:100vh;
          position:relative; overflow:hidden;
          display:flex; flex-direction:column;
          justify-content:space-between;
          padding:48px 44px;
          flex-shrink:0;
          background:#0d0b1a;
        }

        .mesh{
          position:absolute;inset:0;
          background:
            radial-gradient(ellipse 80% 60% at 10% 20%, rgba(124,58,237,0.45) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99,102,241,0.35) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(236,72,153,0.12) 0%, transparent 60%);
        }

        .orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.18;}
        .o1{width:380px;height:380px;background:#7c3aed;top:-60px;right:-80px;animation:drift 9s ease-in-out infinite;}
        .o2{width:280px;height:280px;background:#6366f1;bottom:-40px;left:-60px;animation:drift 12s ease-in-out infinite reverse;}
        .o3{width:150px;height:150px;background:#ec4899;top:55%;left:50%;animation:drift 7s ease-in-out infinite 1.5s;}
        @keyframes drift{
          0%,100%{transform:translate(0,0)scale(1);}
          40%{transform:translate(20px,-25px)scale(1.06);}
          70%{transform:translate(-15px,18px)scale(0.94);}
        }

        .left-content{position:relative;z-index:2;display:flex;flex-direction:column;gap:36px;}

        /* brand */
        .brand{display:flex;align-items:center;gap:12px;}
        .brand-logo{
          width:48px;height:48px;border-radius:12px;
          background:rgba(255,255,255,0.12);
          backdrop-filter:blur(10px);
          border:1px solid rgba(255,255,255,0.2);
          display:flex;align-items:center;justify-content:center;overflow:hidden;
        }
        .brand-logo img{width:32px;height:32px;object-fit:contain;}
        .brand-name{font-size:15px;font-weight:700;color:#fff;line-height:1.2;}
        .brand-sub{font-size:10px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.12em;}

        /* headline */
        .headline-block{display:flex;flex-direction:column;gap:14px;}
        .headline-tag{
          display:inline-flex;align-items:center;gap:6px;
          font-size:11px;font-weight:600;color:#a78bfa;
          letter-spacing:.1em;text-transform:uppercase;
        }
        .headline{
          font-family:'Syne',sans-serif;
          font-size:46px;font-weight:800;
          color:#fff;line-height:1.08;
        }
        .headline-hl{
          background:linear-gradient(90deg,#a78bfa,#f472b6);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .headline-body{font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7;max-width:320px;}

        /* metrics */
        .metrics{display:flex;flex-direction:column;gap:10px;}
        .metric-card{
          display:flex;align-items:center;gap:14px;
          padding:14px 18px;
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:14px;
          backdrop-filter:blur(8px);
          transition:background .2s;
        }
        .metric-card:hover{background:rgba(255,255,255,0.1);}
        .metric-icon{
          width:32px;height:32px;border-radius:9px;
          display:flex;align-items:center;justify-content:center;
          color:#fff;flex-shrink:0;
        }
        .metric-val{font-size:16px;font-weight:700;color:#fff;line-height:1.1;}
        .metric-lbl{font-size:11px;color:rgba(255,255,255,0.45);}

        /* features */
        .feats{display:flex;flex-direction:column;gap:8px;}
        .feat{
          display:flex;align-items:center;gap:10px;
          font-size:13px;color:rgba(255,255,255,0.65);
          padding:8px 0;
          border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .feat:last-child{border-bottom:none;}
        .feat-icon{display:flex;align-items:center;}

        .left-footer{position:relative;z-index:2;font-size:11px;color:rgba(255,255,255,0.25);}

        /* ─── RIGHT ─── */
        .right{
          flex:1; display:flex;
          align-items:center; justify-content:center;
          padding:40px 32px;
          background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 40%,#f0f4ff 100%);
          position:relative;
          overflow:hidden;
        }

        .right-grid{
          position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(124,58,237,.06) 1px,transparent 1px),
            linear-gradient(90deg,rgba(124,58,237,.06) 1px,transparent 1px);
          background-size:40px 40px;
        }

        /* form shell */
        .form-shell{
          position:relative;z-index:2;
          width:100%;max-width:440px;
          background:#fff;
          border-radius:28px;
          padding:40px 40px 28px;
          box-shadow:
            0 0 0 1px rgba(124,58,237,0.12),
            0 20px 60px rgba(124,58,237,0.14),
            0 4px 16px rgba(0,0,0,0.06);
          animation:shellIn .55s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes shellIn{
          from{opacity:0;transform:translateY(28px)scale(.97);}
          to{opacity:1;transform:translateY(0)scale(1);}
        }

        .shell-glow{
          position:absolute;top:0;left:10%;right:10%;
          height:3px;border-radius:100px;
          background:linear-gradient(90deg,#7c3aed,#6366f1,#ec4899,#f472b6);
        }

        /* form top */
        .form-top{display:flex;align-items:center;gap:16px;margin-bottom:32px;}
        .form-avatar{
          width:52px;height:52px;border-radius:14px;
          background:linear-gradient(135deg,#7c3aed,#6366f1);
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;flex-shrink:0;
          box-shadow:0 4px 14px rgba(124,58,237,0.4);
        }
        .form-avatar img{width:34px;height:34px;object-fit:contain;}
        .avatar-fallback{
          display:flex;align-items:center;justify-content:center;
          font-size:20px;font-weight:900;color:#fff;
          width:34px;height:34px;
        }
        .form-title{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:#1e1b4b;line-height:1.15;}
        .form-sub{font-size:13px;color:#9ca3af;margin-top:2px;}

        /* error */
        .err{
          display:flex;align-items:center;gap:10px;
          padding:11px 14px;margin-bottom:20px;
          background:#fff5f5;border:1px solid #fca5a5;
          border-radius:10px;font-size:13px;color:#dc2626;
        }
        .err-pip{width:7px;height:7px;border-radius:50%;background:#dc2626;flex-shrink:0;}

        /* form */
        .form{display:flex;flex-direction:column;gap:20px;}

        .field{display:flex;flex-direction:column;gap:7px;}
        .lbl{font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;}

        .input-wrap{
          position:relative;display:flex;align-items:center;
          background:#f8f7ff;border:2px solid #ede9fe;
          border-radius:12px;overflow:hidden;
          transition:border-color .2s,box-shadow .2s;
        }
        .input-wrap:focus-within{
          border-color:#7c3aed;background:#fff;
          box-shadow:0 0 0 4px rgba(124,58,237,0.1);
        }
        .input-prefix{
          display:flex;align-items:center;justify-content:center;
          width:42px;height:100%;
          font-size:14px;font-weight:600;color:#a78bfa;
          border-right:2px solid #ede9fe;
          flex-shrink:0;align-self:stretch;
        }
        .input-wrap:focus-within .input-prefix{border-right-color:#c4b5fd;}

        .inp{
          flex:1;padding:13px 14px;
          background:transparent;border:none;outline:none;
          font-family:'Outfit',sans-serif;font-size:15px;color:#1e1b4b;
        }
        .inp::placeholder{color:#c4b5fd;}

        .eye{
          padding:0 14px;background:none;border:none;cursor:pointer;
          color:#a78bfa;display:flex;align-items:center;
          transition:color .15s;
        }
        .eye:hover{color:#7c3aed;}

        /* primary button */
        .btn-primary{
          position:relative;overflow:hidden;
          width:100%;padding:15px 20px;
          background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 50%,#4f46e5 100%);
          color:#fff;border:none;border-radius:13px;
          font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;
          cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:9px;
          transition:transform .15s,box-shadow .2s;
          margin-top:4px;
        }
        .btn-primary::before{
          content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,#6d28d9,#4338ca);
          opacity:0;transition:opacity .2s;
        }
        .btn-primary:hover:not(:disabled)::before{opacity:1;}
        .btn-primary:hover:not(:disabled){
          transform:translateY(-2px);
          box-shadow:0 10px 28px rgba(124,58,237,.4);
        }
        .btn-primary:active:not(:disabled){transform:translateY(0);}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed;}
        .btn-primary>*{position:relative;z-index:1;}
        .btn-arrow{transition:transform .2s;}
        .btn-primary:hover .btn-arrow{transform:translateX(4px);}

        .spin{
          width:16px;height:16px;
          border:2px solid rgba(255,255,255,.3);border-top-color:#fff;
          border-radius:50%;animation:spin .7s linear infinite;display:inline-block;
        }
        @keyframes spin{to{transform:rotate(360deg);}}

        /* divider */
        .divider{
          display:flex;align-items:center;gap:12px;
          margin-top:24px;
        }
        .divider::before,.divider::after{
          content:'';flex:1;height:1px;background:#f0ecff;
        }
        .divider span{font-size:11px;color:#c4b5fd;white-space:nowrap;}

        /* trust badges */
        .trust-row{display:flex;justify-content:center;gap:12px;margin-top:14px;}
        .trust-badge{
          display:flex;align-items:center;gap:6px;
          font-size:11px;color:#9ca3af;font-weight:500;
        }
        .trust-dot{width:6px;height:6px;border-radius:50%;}
        .trust-dot.green{background:#10b981;}
        .trust-dot.blue{background:#3b82f6;}
        .trust-dot.purple{background:#7c3aed;}

        /* OTP */
        .otp-header{text-align:center;margin-bottom:28px;display:flex;flex-direction:column;align-items:center;gap:10px;}
        .otp-icon-wrap{
          width:60px;height:60px;border-radius:18px;
          background:linear-gradient(135deg,#ede9fe,#ddd6fe);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 14px rgba(124,58,237,0.18);
          margin-bottom:6px;
        }

        .otp-grid{display:flex;gap:10px;justify-content:center;}
        .otp-box{
          width:54px;height:64px;
          border:2px solid #ede9fe;border-radius:14px;
          background:#f8f7ff;
          text-align:center;
          font-size:26px;font-weight:800;color:#1e1b4b;
          font-family:'Syne',sans-serif;
          outline:none;
          transition:border-color .2s,box-shadow .2s,transform .1s;
          caret-color:#7c3aed;
        }
        .otp-box:focus{
          border-color:#7c3aed;background:#fff;
          box-shadow:0 0 0 4px rgba(124,58,237,.12);
          transform:scale(1.04);
        }

        .otp-progress{display:flex;justify-content:center;gap:8px;margin-top:14px;}
        .otp-pip{
          width:28px;height:4px;border-radius:100px;
          background:#ede9fe;transition:background .25s;
        }
        .otp-pip.filled{background:linear-gradient(90deg,#7c3aed,#6366f1);}

        .btn-ghost{
          background:none;border:none;
          color:#9ca3af;font-size:13px;cursor:pointer;text-align:center;
          font-family:'Outfit',sans-serif;padding:4px;
        }
        .btn-ghost span{color:#7c3aed;font-weight:600;text-decoration:underline;text-underline-offset:3px;}
        .btn-ghost:hover span{color:#6d28d9;}

        .shell-footer{font-size:11px;color:#d1d5db;text-align:center;margin-top:24px;}

        /* ─── Welcome (light mode) ─── */
        .welcome-overlay{
          position:fixed;inset:0;z-index:200;
          background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 50%,#f0f4ff 100%);
          display:flex;align-items:center;justify-content:center;
          animation:fadeIn .35s ease both;
        }
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        .welcome-box{
          text-align:center;position:relative;
          animation:popIn .6s cubic-bezier(.34,1.56,.64,1) .15s both;
        }
        @keyframes popIn{from{opacity:0;transform:scale(.7);}to{opacity:1;transform:scale(1);}}

        .wc-ripple{
          position:absolute;inset:-30px;border-radius:50%;
          border:2px solid rgba(124,58,237,0.2);
          animation:ripple 2s ease-in-out infinite;
        }
        .wc-ripple.r2{inset:-55px;animation-delay:.4s;border-color:rgba(99,102,241,0.14);}
        .wc-ripple.r3{inset:-80px;animation-delay:.8s;border-color:rgba(236,72,153,0.1);}
        @keyframes ripple{0%,100%{transform:scale(1);opacity:.6;}50%{transform:scale(1.06);opacity:1;}}

        .wc-icon-wrap{
          width:96px;height:96px;border-radius:28px;
          background:#fff;
          box-shadow:0 8px 32px rgba(124,58,237,0.18),0 2px 8px rgba(124,58,237,0.1);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 24px;
        }
        .wc-icon{width:52px;height:52px;color:#7c3aed;}
        .wc-title{font-family:'Syne',sans-serif;font-size:48px;font-weight:800;color:#1e1b4b;margin-bottom:8px;}
        .wc-msg{font-size:17px;color:#7c3aed;font-weight:500;margin-bottom:32px;}
        .wc-bar{width:220px;height:4px;background:#e9e4ff;border-radius:100px;margin:0 auto;overflow:hidden;}
        .wc-bar-fill{
          height:100%;background:linear-gradient(90deg,#7c3aed,#6366f1,#ec4899);border-radius:100px;
          animation:barFill 2.4s linear both;
        }
        @keyframes barFill{from{width:0;}to{width:100%;}}

        /* ─── Responsive ─── */
        @media(max-width:960px){
          .left{width:380px;padding:40px 32px;}
          .headline{font-size:36px;}
          .metrics{display:none;}
        }
        @media(max-width:700px){
          .left{display:none;}
          .right{background:linear-gradient(160deg,#1e1b4b,#312e81);}
          .form-shell{background:rgba(255,255,255,0.97);}
        }
      `}</style>
    </div>
  );
}
