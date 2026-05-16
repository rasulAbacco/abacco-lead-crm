import { useState, useEffect, useRef } from "react";

const Maintenance = () => {
  const canvasRef = useRef(null);
  const [countdown, setCountdown] = useState(60);
  const [statusVisible, setStatusVisible] = useState(false);
  const [progressWidth, setProgressWidth] = useState(35);
  const [eyesBlink, setEyesBlink] = useState(false);

  /* ─── Particle canvas ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const colors = ["#6366f1", "#3b82f6", "#a78bfa", "#ec4899", "#f59e0b"];
    const rand = (a, b) => a + Math.random() * (b - a);

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      vx: rand(-0.2, 0.2),
      vy: rand(-0.5, -0.15),
      r: rand(1.5, 3.5),
      alpha: rand(0.15, 0.45),
      col: colors[Math.floor(rand(0, colors.length))],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.002;
        if (p.y < 0 || p.alpha <= 0) {
          p.x = rand(0, canvas.width);
          p.y = canvas.height + 5;
          p.alpha = rand(0.2, 0.45);
          p.vx = rand(-0.2, 0.2);
          p.vy = rand(-0.5, -0.15);
        }
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ─── Countdown ─── */
  useEffect(() => {
    if (countdown <= 0) {
      window.location.reload();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /* ─── Progress animation ─── */
  useEffect(() => {
    let dir = 1;
    let val = 35;
    const iv = setInterval(() => {
      val += dir * 0.4;
      if (val >= 80) dir = -1;
      if (val <= 30) dir = 1;
      setProgressWidth(val);
    }, 50);
    return () => clearInterval(iv);
  }, []);

  /* ─── Eye blink ─── */
  useEffect(() => {
    const blink = () => {
      setEyesBlink(true);
      setTimeout(() => setEyesBlink(false), 150);
    };
    const iv = setInterval(blink, 3200 + Math.random() * 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={styles.page}>
      {/* Particle canvas */}
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Soft mesh background */}
      <div style={styles.meshA} />
      <div style={styles.meshB} />
      <div style={styles.meshC} />

      {/* Floating orbs */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />
      <div style={{ ...styles.orb, ...styles.orb3 }} />

      {/* ── CARD ── */}
      <div style={styles.card}>
        {/* Grid lines accent */}
        <div style={styles.gridOverlay} />

        {/* ── Robot ── */}
        <div style={styles.robotWrap}>
          <div style={styles.robot}>
            {/* Shadow */}
            <div style={styles.robotShadow} />

            {/* Head */}
            <div style={styles.head}>
              <div style={styles.antennaBase}>
                <div style={styles.antennaPole} />
                <div style={styles.antennaBall} />
              </div>
              <div style={styles.earL} />
              <div style={styles.earR} />
              {/* Face plate */}
              <div style={styles.face}>
                <div style={styles.eyeRow}>
                  <div
                    style={{
                      ...styles.eye,
                      ...(eyesBlink ? styles.eyeBlink : {}),
                    }}
                  />
                  <div
                    style={{
                      ...styles.eye,
                      ...(eyesBlink ? styles.eyeBlink : {}),
                    }}
                  />
                </div>
                <div style={styles.mouth} />
              </div>
              {/* Head shine */}
              <div style={styles.headShine} />
            </div>

            {/* Neck */}
            <div style={styles.neck}>
              <div style={styles.neckInner} />
            </div>

            {/* Body */}
            <div style={styles.body}>
              <div style={styles.bodyShine} />
              <div style={styles.chestPanel}>
                <div
                  style={{
                    ...styles.led,
                    background: "#ef4444",
                    boxShadow: "0 0 6px #ef4444",
                  }}
                />
                <div
                  style={{
                    ...styles.led,
                    background: "#6366f1",
                    boxShadow: "0 0 6px #6366f1",
                    animationDelay: "0.3s",
                  }}
                />
                <div
                  style={{
                    ...styles.led,
                    background: "#10b981",
                    boxShadow: "0 0 6px #10b981",
                    animationDelay: "0.6s",
                  }}
                />
              </div>
              <div style={styles.ventRow}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={styles.vent} />
                ))}
              </div>
            </div>

            {/* Legs */}
            <div style={styles.legsRow}>
              <div style={styles.leg}>
                <div style={styles.foot} />
              </div>
              <div style={styles.leg}>
                <div style={styles.foot} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Text ── */}
        <div style={styles.badge}>
          <span style={styles.badgeDot} />
          Live incident in progress
        </div>

        <h1 style={styles.h1}>
          We broke production <span style={styles.h1Accent}>again.</span>
        </h1>

        <p style={styles.subtitle}>
          Our engineers are rebooting servers, hunting rogue bugs, and
          absolutely <em>not</em> panicking in Slack right now.
        </p>

        {/* Status pills */}
        <div style={styles.pillRow}>
          {[
            {
              label: "Fixing in progress",
              color: "#6366f1",
              bg: "#eef2ff",
              dot: "#6366f1",
            },
            {
              label: "Services degraded",
              color: "#dc2626",
              bg: "#fef2f2",
              dot: "#ef4444",
            },
            {
              label: "ETA: soon™",
              color: "#d97706",
              bg: "#fffbeb",
              dot: "#f59e0b",
            },
          ].map(({ label, color, bg, dot }) => (
            <div key={label} style={{ ...styles.pill, background: bg, color }}>
              <span style={{ ...styles.pillDot, background: dot }} />
              {label}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>Repair progress</span>
            <span style={styles.progressPct}>{Math.round(progressWidth)}%</span>
          </div>
          <div style={styles.track}>
            <div style={{ ...styles.fill, width: `${progressWidth}%` }} />
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.btnRow}>
          <button
            style={styles.btnPrimary}
            onClick={() => window.location.reload()}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, styles.btnPrimaryHover)
            }
            onMouseLeave={(e) =>
              Object.assign(e.currentTarget.style, {
                transform: "translateY(0)",
                boxShadow: styles.btnPrimary.boxShadow,
              })
            }
          >
            ↻ &nbsp;Try Again
          </button>
          <button
            style={styles.btnGhost}
            onClick={() => setStatusVisible((v) => !v)}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, { background: "#f1f5f9" })
            }
            onMouseLeave={(e) =>
              Object.assign(e.currentTarget.style, {
                background: "transparent",
              })
            }
          >
            Check Status
          </button>
        </div>

        {/* Status toast */}
        {statusVisible && (
          <div style={styles.toast}>
            <span style={styles.toastIcon}>🔍</span>
            All systems are being monitored. We appreciate your patience!
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span>
            Estimated recovery:{" "}
            <strong style={{ color: "#6366f1" }}>soon™</strong>
          </span>
          <span style={styles.divider}>·</span>
          <span>
            Auto-refresh in{" "}
            <strong style={{ color: "#6366f1" }}>{countdown}s</strong>
          </span>
        </div>
      </div>

      <style>{cssAnimations}</style>
    </div>
  );
};

/* ─────────────────────────────── Styles ─────────────────────────────── */
const styles = {
  page: {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8faff",
    fontFamily: "'DM Sans', 'Nunito', sans-serif",
  },
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
    pointerEvents: "none",
    opacity: 0.5,
  },
  meshA: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    background:
      "radial-gradient(ellipse 70% 60% at 10% 10%, rgba(99,102,241,0.12) 0%, transparent 70%)",
  },
  meshB: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    background:
      "radial-gradient(ellipse 60% 50% at 90% 90%, rgba(59,130,246,0.10) 0%, transparent 70%)",
  },
  meshC: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    background:
      "radial-gradient(ellipse 40% 40% at 50% 50%, rgba(167,139,250,0.07) 0%, transparent 80%)",
  },
  orb: {
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  },
  orb1: {
    width: 320,
    height: 320,
    background: "rgba(99,102,241,0.10)",
    filter: "blur(50px)",
    top: -80,
    left: -80,
    animation: "orbFloat1 7s ease-in-out infinite",
  },
  orb2: {
    width: 240,
    height: 240,
    background: "rgba(59,130,246,0.09)",
    filter: "blur(40px)",
    bottom: -60,
    right: -60,
    animation: "orbFloat2 9s ease-in-out infinite",
  },
  orb3: {
    width: 180,
    height: 180,
    background: "rgba(236,72,153,0.07)",
    filter: "blur(35px)",
    top: "55%",
    left: "5%",
    animation: "orbFloat3 6s ease-in-out infinite",
  },

  /* Card */
  card: {
    position: "relative",
    zIndex: 2,
    width: "92%",
    maxWidth: 620,
    padding: "52px 44px 40px",
    borderRadius: 28,
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(99,102,241,0.14)",
    boxShadow:
      "0 4px 6px rgba(0,0,0,0.03), 0 20px 60px rgba(99,102,241,0.10), 0 0 0 1px rgba(255,255,255,0.9) inset",
    textAlign: "center",
    animation: "cardTilt 8s ease-in-out infinite",
    transformStyle: "preserve-3d",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    backgroundImage:
      "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    borderRadius: 28,
  },

  /* ── Robot ── */
  robotWrap: {
    position: "relative",
    zIndex: 1,
    marginBottom: 28,
    animation: "robotFloat 3s ease-in-out infinite",
    transformStyle: "preserve-3d",
  },
  robot: {
    width: 110,
    margin: "0 auto",
    position: "relative",
    transformStyle: "preserve-3d",
  },
  robotShadow: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    transform: "translateX(-50%)",
    width: 80,
    height: 12,
    background: "rgba(99,102,241,0.15)",
    borderRadius: "50%",
    filter: "blur(6px)",
  },
  head: {
    width: 110,
    height: 86,
    background: "linear-gradient(145deg, #ffffff, #e8ecff)",
    borderRadius: 20,
    boxShadow:
      "0 0 0 2px rgba(99,102,241,0.25), 6px 6px 0 0 rgba(99,102,241,0.10), 0 12px 28px rgba(99,102,241,0.18)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    transform: "translateZ(6px)",
  },
  antennaBase: {
    position: "absolute",
    top: -28,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  antennaPole: {
    width: 3,
    height: 18,
    background: "linear-gradient(180deg, #a5b4fc, #6366f1)",
    borderRadius: 2,
  },
  antennaBall: {
    width: 10,
    height: 10,
    background: "#6366f1",
    borderRadius: "50%",
    boxShadow: "0 0 10px #6366f1",
    animation: "antennaPulse 1.8s ease-in-out infinite",
    marginTop: -2,
    order: -1,
  },
  earL: {
    position: "absolute",
    top: "50%",
    left: -9,
    transform: "translateY(-50%)",
    width: 9,
    height: 22,
    borderRadius: "4px 0 0 4px",
    background: "linear-gradient(180deg, #c7d2fe, #a5b4fc)",
    boxShadow: "0 0 6px rgba(99,102,241,0.3)",
  },
  earR: {
    position: "absolute",
    top: "50%",
    right: -9,
    transform: "translateY(-50%)",
    width: 9,
    height: 22,
    borderRadius: "0 4px 4px 0",
    background: "linear-gradient(180deg, #c7d2fe, #a5b4fc)",
    boxShadow: "0 0 6px rgba(99,102,241,0.3)",
  },
  face: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  eyeRow: { display: "flex", gap: 16 },
  eye: {
    width: 16,
    height: 16,
    background: "#6366f1",
    borderRadius: "50%",
    boxShadow: "0 0 10px rgba(99,102,241,0.8), 0 0 4px #fff inset",
    transition: "transform 0.06s",
  },
  eyeBlink: { transform: "scaleY(0.08)" },
  mouth: {
    width: 32,
    height: 4,
    background: "linear-gradient(90deg, #a5b4fc, #6366f1)",
    borderRadius: 4,
    boxShadow: "0 0 6px rgba(99,102,241,0.4)",
  },
  headShine: {
    position: "absolute",
    top: 6,
    left: 12,
    right: 12,
    height: 14,
    background: "rgba(255,255,255,0.5)",
    borderRadius: 10,
    pointerEvents: "none",
  },
  neck: {
    width: 28,
    height: 10,
    background: "#e8ecff",
    margin: "0 auto",
    borderRadius: "0 0 4px 4px",
    border: "1px solid rgba(99,102,241,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  neckInner: { width: 14, height: 4, background: "#c7d2fe", borderRadius: 2 },
  body: {
    width: 88,
    height: 72,
    background: "linear-gradient(145deg, #eef2ff, #e8ecff)",
    borderRadius: 16,
    margin: "0 auto",
    boxShadow:
      "0 0 0 2px rgba(99,102,241,0.2), 5px 5px 0 rgba(99,102,241,0.08), 0 10px 20px rgba(99,102,241,0.14)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transform: "translateZ(3px)",
  },
  bodyShine: {
    position: "absolute",
    top: 4,
    left: 8,
    right: 8,
    height: 10,
    background: "rgba(255,255,255,0.55)",
    borderRadius: 8,
  },
  chestPanel: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "rgba(255,255,255,0.7)",
    padding: "5px 10px",
    borderRadius: 8,
    border: "1px solid rgba(99,102,241,0.15)",
  },
  led: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    animation: "ledBlink 2s ease-in-out infinite",
  },
  ventRow: { display: "flex", gap: 4 },
  vent: {
    width: 12,
    height: 3,
    borderRadius: 2,
    background: "rgba(99,102,241,0.2)",
  },
  legsRow: {
    display: "flex",
    gap: 20,
    justifyContent: "center",
    marginTop: 4,
  },
  leg: {
    width: 22,
    height: 22,
    background: "linear-gradient(180deg, #e8ecff, #c7d2fe)",
    borderRadius: "0 0 8px 8px",
    border: "1px solid rgba(99,102,241,0.2)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  foot: {
    width: 28,
    height: 7,
    background: "#c7d2fe",
    borderRadius: "0 0 6px 6px",
    border: "1px solid rgba(99,102,241,0.2)",
    marginBottom: -7,
  },

  /* ── Copy ── */
  badge: {
    position: "relative",
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "#eef2ff",
    border: "1px solid rgba(99,102,241,0.25)",
    color: "#4338ca",
    padding: "6px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.4px",
    marginBottom: 18,
    textTransform: "uppercase",
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#6366f1",
    boxShadow: "0 0 6px #6366f1",
    animation: "dotPulse 1.5s infinite",
    display: "inline-block",
  },
  h1: {
    position: "relative",
    zIndex: 1,
    fontSize: 46,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.08,
    letterSpacing: "-1.5px",
    marginBottom: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  h1Accent: {
    background: "linear-gradient(135deg, #6366f1, #3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    position: "relative",
    zIndex: 1,
    fontSize: 16,
    color: "#475569",
    lineHeight: 1.8,
    maxWidth: 430,
    margin: "0 auto 28px",
    fontStyle: "normal",
  },

  /* Status pills */
  pillRow: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 28,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.2px",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    animation: "dotPulse 1.5s infinite",
    display: "inline-block",
  },

  /* Progress */
  progressSection: {
    position: "relative",
    zIndex: 1,
    marginBottom: 28,
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
    fontWeight: 600,
  },
  progressLabel: { textTransform: "uppercase", letterSpacing: "0.5px" },
  progressPct: { color: "#6366f1", fontWeight: 700 },
  track: {
    width: "100%",
    height: 7,
    background: "#e8ecff",
    borderRadius: 999,
    overflow: "hidden",
    border: "1px solid rgba(99,102,241,0.12)",
  },
  fill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #3b82f6)",
    borderRadius: 999,
    transition: "width 0.1s linear",
    boxShadow: "0 0 8px rgba(99,102,241,0.3)",
  },

  /* Buttons */
  btnRow: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  btnPrimary: {
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #3b82f6)",
    color: "#fff",
    padding: "14px 32px",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 8px 24px rgba(99,102,241,0.30)",
    letterSpacing: "0.2px",
  },
  btnPrimaryHover: {
    transform: "translateY(-3px) scale(1.04)",
    boxShadow: "0 14px 32px rgba(99,102,241,0.42)",
  },
  btnGhost: {
    border: "1.5px solid rgba(99,102,241,0.28)",
    background: "transparent",
    color: "#6366f1",
    padding: "14px 28px",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s, transform 0.2s",
  },

  /* Toast */
  toast: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#eef2ff",
    border: "1px solid rgba(99,102,241,0.22)",
    color: "#4338ca",
    borderRadius: 12,
    padding: "11px 16px",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 16,
    textAlign: "left",
    animation: "fadeSlideIn 0.25s ease",
  },
  toastIcon: { fontSize: 16 },

  /* Footer */
  footer: {
    position: "relative",
    zIndex: 1,
    fontSize: 13,
    color: "#94a3b8",
    display: "flex",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  divider: { opacity: 0.4 },
};

/* ─────────────────────────────── CSS Keyframes ─────────────────────────────── */
const cssAnimations = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');

  @keyframes robotFloat {
    0%,100% { transform: translateY(0) rotateY(-8deg); }
    50%      { transform: translateY(-16px) rotateY(8deg); }
  }
  @keyframes cardTilt {
    0%,100% { transform: rotateX(0deg) rotateY(0deg); }
    33%     { transform: rotateX(2deg) rotateY(-2.5deg); }
    66%     { transform: rotateX(-1.5deg) rotateY(3deg); }
  }
  @keyframes orbFloat1 {
    0%,100% { transform: translateY(0) scale(1); }
    50%     { transform: translateY(-28px) scale(1.06); }
  }
  @keyframes orbFloat2 {
    0%,100% { transform: translateY(0) scale(1); }
    50%     { transform: translateY(-22px) scale(1.04); }
  }
  @keyframes orbFloat3 {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-18px); }
  }
  @keyframes antennaPulse {
    0%,100% { transform: scale(1); opacity: 1; box-shadow: 0 0 10px #6366f1; }
    50%     { transform: scale(1.4); opacity: 0.7; box-shadow: 0 0 18px #6366f1; }
  }
  @keyframes dotPulse {
    0%     { transform: scale(1); opacity: 1; }
    60%    { transform: scale(2); opacity: 0; }
    100%   { transform: scale(1); opacity: 0; }
  }
  @keyframes ledBlink {
    0%,100% { opacity: 1; transform: scale(1); }
    50%     { opacity: 0.4; transform: scale(0.85); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 600px) {
    h1 { font-size: 32px !important; }
  }
`;

export default Maintenance;
