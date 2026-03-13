import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LOGO_URL = "https://www.abaccotech.com/Logo/icon.png";
const DISPLAY_DURATION = 4000;
const FADE_OUT_DURATION = 1200;

const seededRand = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

// Soft light-mode floating orbs
const ORBS = (() => {
  const r = seededRand(31);
  return Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: r() * 100,
    y: r() * 100,
    size: r() * 180 + 80,
    dur: r() * 12 + 10,
    delay: r() * 8,
    opacity: r() * 0.18 + 0.06,
    hue: Math.floor(r() * 3), // 0=green, 1=teal, 2=lime
  }));
})();

// Small sparkle dots
const DOTS = (() => {
  const r = seededRand(55);
  return Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: r() * 100,
    y: r() * 100,
    size: r() * 5 + 2,
    dur: r() * 5 + 3,
    delay: r() * 7,
  }));
})();

const ORB_COLORS = [
  "rgba(34,197,94,.15)", // green
  "rgba(20,184,166,.12)", // teal
  "rgba(132,204,22,.13)", // lime
];

export default function DailyQuoteOverlay() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/quotes`);
        const data = await res.json();
        if (data?.quote?.text) {
          setQuote(data.quote.text);
          setAuthor(data.quote.author || "");
        }
      } catch (e) {
        console.error("Quote fetch failed", e);
      }
    })();
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setReady(true), 80);
    const t2 = setTimeout(
      () => setFadingOut(true),
      DISPLAY_DURATION - FADE_OUT_DURATION,
    );
    const t3 = setTimeout(() => setVisible(false), DISPLAY_DURATION);
    document.body.style.overflow = "hidden";
    return () => {
      [t1, t2, t3].forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className={`dq-root${fadingOut ? " dq-out" : ""}`}>
        {/* Warm light background */}
        <div className="dq-bg" />

        {/* Floating colour orbs */}
        {ORBS.map((o) => (
          <div
            key={o.id}
            className="dq-orb"
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              width: `${o.size}px`,
              height: `${o.size}px`,
              background: `radial-gradient(circle, ${ORB_COLORS[o.hue]}, transparent 70%)`,
              animationDuration: `${o.dur}s`,
              animationDelay: `${o.delay}s`,
            }}
          />
        ))}

        {/* Sparkle dots */}
        {DOTS.map((d) => (
          <div
            key={d.id}
            className="dq-dot"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDuration: `${d.dur}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}

        {/* Card */}
        <div className={`dq-card${ready ? " dq-card-in" : ""}`}>
          {/* Top accent bar */}
          <div className="dq-top-bar" />

          {/* Logo + Brand header */}
          <div className="dq-header">
            <div className="dq-logo-wrap">
              {!logoError ? (
                <img
                  src={LOGO_URL}
                  alt="Abacco Technology"
                  className="dq-logo"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="dq-logo-fb">AT</div>
              )}
            </div>
            <div className="dq-header-text">
              <p className="dq-brand">ABACCO TECHNOLOGY</p>
              <p className="dq-tag">✦ Quote of the Day ✦</p>
            </div>
          </div>

          {/* Divider */}
          <div className="dq-divider">
            <span className="dq-divider-line" />
            <span className="dq-divider-leaf">❧</span>
            <span className="dq-divider-line" />
          </div>

          {/* Quote */}
          <div className="dq-quote-area">
            <div className="dq-open-mark">"</div>
            <p className="dq-quote">
              {quote ||
                "Great things are done by a series of small things brought together."}
            </p>
            <div className="dq-close-mark">"</div>
            {author && <p className="dq-author">— {author}</p>}
          </div>

          {/* Bottom accent bar */}
          <div className="dq-bottom-bar" />
        </div>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Lora:ital,wght@0,600;1,400;1,500;1,600&family=Poppins:wght@600;700&display=swap');

.dq-root {
  position: fixed; inset: 0; z-index: 999999;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  transition: opacity ${FADE_OUT_DURATION}ms cubic-bezier(.4,0,.2,1);
}
.dq-out { opacity:0; pointer-events:none; }

/* ── Background ── */
.dq-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 20% 10%, #f0fdf4 0%, #dcfce7 30%, #f8fafc 70%, #f1f5f9 100%);
}

/* ── Orbs ── */
.dq-orb {
  position: absolute; border-radius:50%; pointer-events:none;
  transform: translate(-50%,-50%);
  animation: dqOrbDrift ease-in-out infinite alternate;
  filter: blur(2px);
}
@keyframes dqOrbDrift {
  0%   { transform:translate(-50%,-50%) scale(1);   }
  100% { transform:translate(-50%,-50%) scale(1.15); }
}

/* ── Sparkle dots ── */
.dq-dot {
  position:absolute; border-radius:50%;
  background: rgba(34,197,94,.4);
  pointer-events:none;
  animation: dqDotBlink ease-in-out infinite;
}
@keyframes dqDotBlink {
  0%,100% { opacity:.1; transform:scale(.5); }
  50%     { opacity:.7; transform:scale(1); }
}

/* ── Card ── */
.dq-card {
  position:relative; z-index:10;
  max-width:640px; width:92%;
  border-radius:20px;
  background: rgba(255,255,255,.82);
  border: 1.5px solid rgba(34,197,94,.25);
  box-shadow:
    0 4px 6px rgba(0,0,0,.04),
    0 20px 60px rgba(34,197,94,.12),
    0 40px 80px rgba(0,0,0,.08);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  overflow: hidden;
  opacity:0; transform:translateY(32px) scale(.96);
  transition: opacity .9s cubic-bezier(.2,0,.2,1), transform .9s cubic-bezier(.2,0,.2,1);
}
.dq-card-in { opacity:1; transform:translateY(0) scale(1); }

/* Top accent bar */
.dq-top-bar {
  height: 5px;
  background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #22c55e, #16a34a);
  background-size: 200% 100%;
  animation: dqBarShimmer 3s linear infinite;
}
@keyframes dqBarShimmer { 0%{background-position:0%} 100%{background-position:200%} }

.dq-bottom-bar {
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(34,197,94,.4), transparent);
  margin-top: 28px;
}

/* ── Header ── */
.dq-header {
  display: flex; align-items: center; gap: 18px;
  padding: 28px 32px 0;
}
.dq-logo-wrap {
  flex-shrink: 0; width:72px; height:72px;
  border-radius:50%;
  box-shadow: 0 0 0 3px rgba(34,197,94,.2), 0 8px 24px rgba(34,197,94,.2);
  overflow:hidden;
}
.dq-logo { width:100%; height:100%; object-fit:contain; }
.dq-logo-fb {
  width:100%; height:100%; border-radius:50%;
  background: linear-gradient(135deg,#22c55e,#16a34a);
  display:flex; align-items:center; justify-content:center;
  font-family:'Poppins',sans-serif; font-size:20px; font-weight:700; color:white;
}

.dq-header-text { flex:1; }
.dq-brand {
  font-family: 'Nunito', sans-serif;
  font-size: clamp(18px, 3.5vw, 26px);
  font-weight: 900;
  color: #15803d;
  letter-spacing: .08em;
  margin: 0 0 4px;
  text-shadow: 0 1px 0 rgba(255,255,255,.8);
}
.dq-tag {
  font-family: 'Poppins', sans-serif;
  font-size: 11px; font-weight: 600;
  color: rgba(22,163,74,.6);
  letter-spacing: .2em; text-transform: uppercase;
  margin: 0;
}

/* ── Divider ── */
.dq-divider {
  display:flex; align-items:center; gap:12px;
  padding: 20px 32px 0;
}
.dq-divider-line {
  flex:1; height:1px;
  background: linear-gradient(90deg, transparent, rgba(34,197,94,.35), transparent);
  display:block;
}
.dq-divider-leaf {
  color: rgba(34,197,94,.5); font-size:18px;
  display:block; line-height:1;
}

/* ── Quote area ── */
.dq-quote-area {
  position:relative;
  padding: 24px 44px 10px;
}

.dq-open-mark, .dq-close-mark {
  font-family: 'Lora', Georgia, serif;
  font-size: 90px; line-height:1; font-weight:600;
  color: rgba(34,197,94,.18);
  position:absolute; pointer-events:none; user-select:none;
  animation: dqMarkPulse 4s ease-in-out infinite alternate;
}
@keyframes dqMarkPulse {
  0%{color:rgba(34,197,94,.12)} 100%{color:rgba(34,197,94,.28)}
}
.dq-open-mark  { top:12px;  left:24px; }
.dq-close-mark { bottom:-18px; right:24px; }

.dq-quote {
  font-family: 'Lora', Georgia, serif;
  font-size: clamp(20px, 3.2vw, 26px);
  font-weight: 600;
  font-style: italic;
  color: #1e293b;
  line-height: 1.7;
  letter-spacing: .01em;
  margin: 0;
  text-align: center;
  position: relative; z-index:1;
  text-shadow: 0 1px 2px rgba(255,255,255,.6);
}

.dq-author {
  font-family: 'Poppins', sans-serif;
  font-size: 13px; font-weight: 600;
  color: #16a34a;
  letter-spacing: .1em; text-transform: uppercase;
  margin: 16px 0 0; text-align:center;
}

@media(max-width:520px){
  .dq-header { padding:22px 22px 0; gap:14px; }
  .dq-logo-wrap { width:58px; height:58px; }
  .dq-quote-area { padding:20px 32px 8px; }
  .dq-quote { font-size:18px; }
  .dq-open-mark,.dq-close-mark { font-size:70px; }
}
`;
