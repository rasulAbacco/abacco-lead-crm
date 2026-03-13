import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── ROAST POOL ────────────────────────────────────────────────────────────────
const ROASTS = [
  "You refreshed again? Adorable. 💅",
  "The server is fine. It's just not in the mood for you. 🙄",
  "Our engineers are googling. Pray for them. 🙏",
  "Error detected: your patience. 📉",
  "We pushed to prod on a Friday. Moment of silence. 🕯️",
  "Have you tried turning your expectations off and on? 🔁",
  "The intern touched something. We can't say more. 🤐",
  "This is fine. Everything is fine. ☕🔥",
  "Somewhere a git commit message just says 'fix'. 💀",
  "Your frustration is valid. Your refresh count is embarrassing. 😬",
  "404: Our will to deploy carefully. Gone. 🪦",
  "The on-call engineer is crying in the bathroom. Give them a minute. 🚽",
  "A senior dev said 'it works on my machine'. Rest in peace, production. 🫡",
  "We have a fix. We also have no idea if it works. Both are true. 🎲",
  "Our uptime is 99.9%. You caught the 0.1%. Congratulations, you cursed us. 🎯",
  "The bug was load-bearing. We found out the hard way. 🏗️",
  "Currently in a Slack thread with 73 messages and zero solutions. 💬",
  "Someone said 'this will only take 5 minutes' 3 hours ago. 🕐",
  "We are not in a meeting. We are in a CRISIS CALL. Different energy. 📞",
  "Rollback failed. Rollforward also failed. We're in rollsideways territory. ↔️",
  "The database has gone to find itself. 🧘",
  "Three engineers, two laptops, and one very bad afternoon. 🫠",
  "Update: the fix broke something else. Classic chess move. ♟️",
  "We named the bug Gerald. Gerald won today. 🐛",
  "Your data is safe. Your time, however, is gone forever. ⏳",
  "Don't panic. We are panicking enough for everyone. 🚨",
];

// ─── SERVER DODGE GAME ─────────────────────────────────────────────────────────
// Player is a little server icon. Avoid falling bugs. Collect coffees.
const GAME_W = 600;
const GAME_H = 300;
const PLAYER_W = 48;
const PLAYER_H = 48;
const TICK = 16;

function useDodgeGame() {
  const [state, setState] = useState("idle"); // idle | playing | dead
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerX, setPlayerX] = useState(GAME_W / 2 - PLAYER_W / 2);
  const [objects, setObjects] = useState([]); // {id,x,y,type:'bug'|'coffee',speed}
  const [flash, setFlash] = useState(null); // 'hit'|'collect'
  const keysRef = useRef({ left: false, right: false });
  const stateRef = useRef("idle");
  const scoreRef = useRef(0);
  const playerXRef = useRef(GAME_W / 2 - PLAYER_W / 2);
  const objectsRef = useRef([]);
  const idRef = useRef(0);
  const rafRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const frameRef = useRef(0);

  stateRef.current = state;

  const reset = useCallback(() => {
    const startX = GAME_W / 2 - PLAYER_W / 2;
    playerXRef.current = startX;
    objectsRef.current = [];
    scoreRef.current = 0;
    idRef.current = 0;
    lastSpawnRef.current = 0;
    frameRef.current = 0;
    setPlayerX(startX);
    setObjects([]);
    setScore(0);
    setFlash(null);
  }, []);

  const start = useCallback(() => {
    reset();
    setState("playing");
    stateRef.current = "playing";
  }, [reset]);

  useEffect(() => {
    const onKey = (e) => {
      const v = e.type === "keydown";
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = v;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = v;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  useEffect(() => {
    if (state !== "playing") {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const loop = () => {
      frameRef.current++;
      const f = frameRef.current;

      // Move player
      const spd = 5;
      let nx = playerXRef.current;
      if (keysRef.current.left) nx = Math.max(0, nx - spd);
      if (keysRef.current.right) nx = Math.min(GAME_W - PLAYER_W, nx + spd);
      playerXRef.current = nx;
      setPlayerX(nx);

      // Spawn objects every ~60 frames, increasing
      const spawnInterval = Math.max(30, 65 - Math.floor(scoreRef.current / 5));
      if (f - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = f;
        const isBug = Math.random() > 0.3;
        const spd2 = 2 + Math.random() * 2 + scoreRef.current * 0.05;
        objectsRef.current = [
          ...objectsRef.current,
          {
            id: idRef.current++,
            x: Math.random() * (GAME_W - 36),
            y: -40,
            type: isBug ? "bug" : "coffee",
            speed: spd2,
          },
        ];
      }

      // Move objects, check collisions
      let hit = false;
      let collected = false;
      const px = playerXRef.current;
      const py = GAME_H - PLAYER_H - 8;

      objectsRef.current = objectsRef.current
        .map((o) => ({ ...o, y: o.y + o.speed }))
        .filter((o) => {
          if (o.y > GAME_H + 40) return false;
          // collision AABB
          const overlap =
            o.x < px + PLAYER_W - 6 &&
            o.x + 34 > px + 6 &&
            o.y < py + PLAYER_H - 6 &&
            o.y + 34 > py + 6;
          if (overlap) {
            if (o.type === "bug") {
              hit = true;
              return false;
            }
            if (o.type === "coffee") {
              collected = true;
              return false;
            }
          }
          return true;
        });

      setObjects([...objectsRef.current]);

      if (hit) {
        setFlash("hit");
        setState("dead");
        stateRef.current = "dead";
        setHighScore((h) => Math.max(h, scoreRef.current));
        setTimeout(() => setFlash(null), 600);
        return;
      }

      if (collected) {
        scoreRef.current += 3;
        setScore(scoreRef.current);
        setFlash("collect");
        setTimeout(() => setFlash(null), 200);
      }

      // Auto score
      if (f % 30 === 0) {
        scoreRef.current++;
        setScore(scoreRef.current);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state]);

  // Touch / mobile drag
  const handleTouchMove = (e) => {
    if (stateRef.current !== "playing") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tx = e.touches[0].clientX - rect.left;
    const scale = GAME_W / rect.width;
    const nx = Math.min(
      GAME_W - PLAYER_W,
      Math.max(0, tx * scale - PLAYER_W / 2),
    );
    playerXRef.current = nx;
  };

  return {
    state,
    score,
    highScore,
    playerX,
    objects,
    flash,
    start,
    handleTouchMove,
  };
}

function DodgeGame() {
  const {
    state,
    score,
    highScore,
    playerX,
    objects,
    flash,
    start,
    handleTouchMove,
  } = useDodgeGame();
  const canvasRef = useRef(null);

  const bgFlash =
    flash === "hit"
      ? "rgba(239,68,68,0.18)"
      : flash === "collect"
        ? "rgba(34,197,94,0.12)"
        : "transparent";

  const scoreMsg = () => {
    if (score >= 60) return "Legendary 🏆";
    if (score >= 40) return "Not bad 👏";
    if (score >= 20) return "Decent 😐";
    return "Yikes 😬";
  };

  return (
    <div style={gm.wrap}>
      {/* Header */}
      <div style={gm.topBar}>
        <div style={gm.gameTitle}>
          <span style={gm.gameTitleIcon}>🖥️</span>
          <div>
            <div style={gm.gameName}>SERVER DODGE</div>
            <div style={gm.gameDesc}>Dodge bugs · Collect coffee · Survive</div>
          </div>
        </div>
        <div style={gm.scores}>
          <div style={gm.scoreChip}>
            <span style={gm.scoreChipLabel}>SCORE</span>
            <span style={gm.scoreChipVal}>{score}</span>
          </div>
          <div
            style={{
              ...gm.scoreChip,
              background: "#fef9c3",
              border: "1px solid #fde68a",
            }}
          >
            <span style={gm.scoreChipLabel}>BEST</span>
            <span style={{ ...gm.scoreChipVal, color: "#b45309" }}>
              {highScore}
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={gm.legend}>
        <span style={gm.legendItem}>
          <span>🪲</span> = −life
        </span>
        <span style={gm.legendItem}>
          <span>☕</span> = +3 pts
        </span>
        <span style={gm.legendItem}>← → or A/D to move</span>
        <span style={gm.legendItem}>Touch: drag to move</span>
      </div>

      {/* Arena */}
      <div
        ref={canvasRef}
        onTouchMove={handleTouchMove}
        style={{
          ...gm.arena,
          background:
            bgFlash !== "transparent"
              ? `linear-gradient(180deg, ${bgFlash}, #f0f9ff 60%)`
              : "linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 60%, #f8fafc 100%)",
          transition: "background 0.15s",
        }}
      >
        {/* Ground */}
        <div style={gm.ground} />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((v) => (
          <div key={v} style={{ ...gm.gridLine, left: `${v * 100}%` }} />
        ))}

        {/* Objects */}
        {objects.map((o) => (
          <div
            key={o.id}
            style={{
              ...gm.obj,
              left: o.x,
              top: o.y,
              fontSize: o.type === "bug" ? 28 : 26,
              filter:
                o.type === "bug"
                  ? "drop-shadow(0 2px 4px rgba(239,68,68,0.4))"
                  : "drop-shadow(0 2px 4px rgba(251,191,36,0.4))",
            }}
          >
            {o.type === "bug" ? "🪲" : "☕"}
          </div>
        ))}

        {/* Player */}
        <div style={{ ...gm.player, left: playerX, bottom: 8 }}>🖥️</div>

        {/* Overlays */}
        {state === "idle" && (
          <div style={gm.overlay}>
            <div style={gm.overlayCard}>
              <div style={gm.overlayEmoji}>🖥️</div>
              <div style={gm.overlayTitle}>Ready to dodge?</div>
              <div style={gm.overlayBody}>
                Avoid bugs. Grab coffee. Don't die.
              </div>
              <button onClick={start} style={gm.startBtn}>
                Start Game →
              </button>
            </div>
          </div>
        )}

        {state === "dead" && (
          <div style={gm.overlay}>
            <div style={{ ...gm.overlayCard, borderColor: "#fecaca" }}>
              <div style={gm.overlayEmoji}>💥</div>
              <div style={{ ...gm.overlayTitle, color: "#dc2626" }}>
                Server Crashed
              </div>
              <div style={gm.overlayScore}>
                {score} pts — {scoreMsg()}
              </div>
              <div style={gm.overlayBody}>
                {score < 10
                  ? "The bugs barely had to try. Disappointing."
                  : score < 30
                    ? "Not terrible. Still pretty bad though."
                    : score < 50
                      ? "Honestly impressive. Still crashed though."
                      : "You were born to dodge production bugs. Hire yourself."}
              </div>
              <button
                onClick={start}
                style={{ ...gm.startBtn, background: "#dc2626" }}
              >
                Try Again →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Maintenance() {
  const [blameCount, setBlameCount] = useState(1337);
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const [lastRoastIdx, setLastRoastIdx] = useState(-1);
  const [btnShake, setBtnShake] = useState(false);
  const [progress] = useState(63);
  const [tapCount, setTapCount] = useState(0);
  const toastTimer = useRef(null);

  const handleBlame = () => {
    const next = blameCount + 1;
    setBlameCount(next);
    setTapCount((c) => c + 1);
    setBtnShake(true);
    setTimeout(() => setBtnShake(false), 450);

    let idx;
    do {
      idx = Math.floor(Math.random() * ROASTS.length);
    } while (idx === lastRoastIdx);
    setLastRoastIdx(idx);

    clearTimeout(toastTimer.current);
    setToast(ROASTS[idx]);
    setToastKey((k) => k + 1);
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  };

  const blameIntensity = Math.min(tapCount, 20);
  const btnHue = `hsl(${240 - blameIntensity * 6}, ${60 + blameIntensity}%, ${16 - blameIntensity * 0.3}%)`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Epilogue:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; min-height: 100vh; }
        body { background: #f5f3ff; }
        :root {
          --ink: #0d0d14;
          --muted: #6b7280;
          --border: #e5e7eb;
          --accent: #4f46e5;
          --accent2: #7c3aed;
          --warn: #ef4444;
          --green: #22c55e;
          --amber: #f59e0b;
          --surface: #ffffff;
        }

        @keyframes slideDown {
          from { opacity:0; transform: translateY(-20px) scale(0.96); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes slideUp {
          from { opacity:0; transform: translateY(30px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes fillBar {
          from { width: 0; }
          to   { width: ${progress}%; }
        }
        @keyframes blobFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(30px,-20px) scale(1.05); }
          66%     { transform: translate(-20px,15px) scale(0.97); }
        }
        @keyframes shake {
          0%,100% { transform: rotate(0deg) scale(1); }
          15%     { transform: rotate(-4deg) scale(0.95); }
          30%     { transform: rotate(4deg) scale(1.05); }
          45%     { transform: rotate(-3deg) scale(0.97); }
          60%     { transform: rotate(3deg) scale(1.03); }
          75%     { transform: rotate(-1deg) scale(0.99); }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(79,70,229,0.35); }
          50%     { box-shadow: 0 0 0 10px rgba(79,70,229,0); }
        }
        @keyframes toastPop {
          0%   { opacity:0; transform:translateX(-50%) translateY(-10px) scale(0.92); }
          15%  { opacity:1; transform:translateX(-50%) translateY(0) scale(1.02); }
          20%  { transform:translateX(-50%) translateY(0) scale(1); }
          85%  { opacity:1; }
          100% { opacity:0; transform:translateX(-50%) translateY(-8px); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes floatEmoji {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%     { transform: translateY(-18px) rotate(8deg); }
        }
        @keyframes countUp {
          from { transform: scale(1.4); color: var(--accent); }
          to   { transform: scale(1); }
        }
        .blame-btn-inner:hover { filter: brightness(1.1); }
        .secondary-btn:hover { background: #f0f0f0 !important; }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div key={toastKey} style={p.toast}>
          {toast}
        </div>
      )}

      <div style={p.page}>
        {/* ── BG Blobs ── */}
        <div style={p.blobA} aria-hidden />
        <div style={p.blobB} aria-hidden />
        <div style={p.blobC} aria-hidden />

        {/* ── Marquee ticker ── */}
        <div style={p.ticker}>
          <div style={p.tickerInner}>
            {Array(6)
              .fill(
                "🔴 SYSTEM DOWN  ·  ENGINEERS PANICKING  ·  BLAME BEING DISTRIBUTED  ·  ETA: UNKNOWN  ·  ",
              )
              .join("")}
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={p.hero}>
          <div style={p.heroLeft}>
            <div style={p.incidentBadge}>
              <span style={p.incidentDot} />
              INCIDENT — P0 — ACTIVE
            </div>

            <h1 style={p.h1}>
              We shipped
              <br />
              <span style={p.h1Accent}>chaos</span> to prod.
            </h1>

            <p style={p.lead}>
              Our servers are having a moment. Engineers are in a Zoom call with
              47 people and <em>no one is sharing their screen</em>. Classic.
            </p>

            {/* Progress */}
            <div style={p.progressBox}>
              <div style={p.progressHeader}>
                <span style={p.progressLabel}>RECOVERY</span>
                <span style={p.progressPct}>{progress}%</span>
              </div>
              <div style={p.track}>
                <div style={p.fill} />
              </div>
              <div style={p.steps}>
                {["Panic", "Blame", "Google It", "Fix", "Deploy Again"].map(
                  (s, i) => {
                    const done = i < 3;
                    const active = i === 2;
                    return (
                      <div
                        key={s}
                        style={{
                          ...p.step,
                          color: done
                            ? "#22c55e"
                            : active
                              ? "#f59e0b"
                              : "#cbd5e1",
                        }}
                      >
                        <span style={p.stepDot(done, active)} />
                        {s}
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Blame button */}
            <div style={p.blameArea}>
              <button
                className="blame-btn-inner"
                onClick={handleBlame}
                style={{
                  ...p.blameBtn,
                  background: btnHue,
                  animation: btnShake
                    ? "shake 0.45s ease"
                    : "pulse 2.5s infinite",
                }}
              >
                <span style={p.blameFace}>🤬</span>
                <span style={p.blameText}>BLAME THE DEV</span>
                <span
                  style={{
                    ...p.blamePill,
                    animation: btnShake ? "countUp 0.3s ease" : "none",
                  }}
                >
                  {blameCount.toLocaleString()}
                </span>
              </button>
              <p style={p.blameNote}>
                {tapCount === 0 && "Your rage is a gift to us."}
                {tapCount >= 1 &&
                  tapCount < 5 &&
                  "Keep going. It definitely helps."}
                {tapCount >= 5 &&
                  tapCount < 12 &&
                  "You are very committed to this."}
                {tapCount >= 12 &&
                  tapCount < 20 &&
                  "The button is getting scared."}
                {tapCount >= 20 && "You need a hobby. Or a vacation. Both."}
              </p>
            </div>
          </div>

          <div style={p.heroRight}>
            {/* Status card */}
            <div style={p.statusCard}>
              <div style={p.statusCardHeader}>SYSTEM STATUS</div>
              {[
                { label: "API Gateway", status: "down", icon: "🔴" },
                { label: "Database", status: "degraded", icon: "🟡" },
                { label: "Auth Service", status: "up", icon: "🟢" },
                { label: "File Storage", status: "degraded", icon: "🟡" },
                { label: "Cache Layer", status: "down", icon: "🔴" },
                { label: "Email Queue", status: "up", icon: "🟢" },
              ].map(({ label, status, icon }) => (
                <div key={label} style={p.statusRow}>
                  <span style={p.statusLabel}>{label}</span>
                  <span
                    style={{
                      ...p.statusBadge,
                      background:
                        status === "down"
                          ? "#fef2f2"
                          : status === "degraded"
                            ? "#fffbeb"
                            : "#f0fdf4",
                      color:
                        status === "down"
                          ? "#dc2626"
                          : status === "degraded"
                            ? "#d97706"
                            : "#15803d",
                      border: `1px solid ${status === "down" ? "#fecaca" : status === "degraded" ? "#fde68a" : "#bbf7d0"}`,
                    }}
                  >
                    {icon} {status.toUpperCase()}
                  </span>
                </div>
              ))}
              <div style={p.statusFooter}>
                Last checked: just now · Accuracy: optimistic
              </div>
            </div>

            {/* Floating emojis around card */}
            <span
              style={{ ...p.floatE, top: -20, right: 20, animationDelay: "0s" }}
            >
              🔥
            </span>
            <span
              style={{
                ...p.floatE,
                bottom: 40,
                right: -10,
                animationDelay: "1.2s",
              }}
            >
              ⚡
            </span>
            <span
              style={{
                ...p.floatE,
                bottom: -10,
                left: 20,
                animationDelay: "0.6s",
              }}
            >
              💣
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={p.section}>
          <div style={p.sectionLabel}>
            <span style={p.sectionLine} />
            <span style={p.sectionText}>KILL TIME — WE KNOW YOU HAVE SOME</span>
            <span style={p.sectionLine} />
          </div>

          {/* Game */}
          <DodgeGame />
        </div>

        {/* ── Footer ── */}
        <footer style={p.footer}>
          <div style={p.footerInner}>
            <span>Status page: also down.</span>
            <span>·</span>
            <span>ETA: soon™</span>
            <span>·</span>
            <span>Blame distributed: {blameCount.toLocaleString()}</span>
          </div>
        </footer>
      </div>
    </>
  );
}

// ─── PAGE STYLES ───────────────────────────────────────────────────────────────
const p = {
  page: {
    width: "100%",
    minHeight: "100vh",
    background: "#f5f3ff",
    fontFamily: "'Epilogue', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blobA: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 500,
    height: 500,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)",
    animation: "blobFloat 14s ease-in-out infinite",
    pointerEvents: "none",
  },
  blobB: {
    position: "absolute",
    top: "30%",
    right: -80,
    width: 400,
    height: 400,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
    animation: "blobFloat 18s ease-in-out infinite reverse",
    pointerEvents: "none",
  },
  blobC: {
    position: "absolute",
    bottom: 100,
    left: "40%",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)",
    animation: "blobFloat 12s ease-in-out infinite 2s",
    pointerEvents: "none",
  },
  toast: {
    position: "fixed",
    top: 20,
    left: "50%",
    zIndex: 9999,
    background: "#0d0d14",
    color: "#fff",
    fontFamily: "'Epilogue', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    padding: "13px 22px",
    borderRadius: 14,
    whiteSpace: "nowrap",
    boxShadow: "0 8px 40px rgba(13,13,20,0.25)",
    border: "1px solid rgba(255,255,255,0.08)",
    animation: "toastPop 3.8s ease forwards",
    letterSpacing: 0.2,
  },
  ticker: {
    width: "100%",
    background: "#0d0d14",
    color: "#a78bfa",
    padding: "10px 0",
    overflow: "hidden",
    position: "relative",
    zIndex: 10,
  },
  tickerInner: {
    display: "inline-block",
    whiteSpace: "nowrap",
    fontFamily: "'Cabinet Grotesk', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    animation: "marquee 28s linear infinite",
  },
  hero: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "64px 32px 48px",
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: 64,
    alignItems: "start",
    position: "relative",
    zIndex: 1,
  },
  heroLeft: {},
  heroRight: {
    position: "relative",
  },
  incidentBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 99,
    padding: "6px 16px",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#dc2626",
    marginBottom: 24,
    fontFamily: "'Cabinet Grotesk', sans-serif",
  },
  incidentDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#ef4444",
    boxShadow: "0 0 0 3px rgba(239,68,68,0.25)",
    display: "inline-block",
    animation: "pulse 1.5s infinite",
  },
  h1: {
    fontFamily: "'Cabinet Grotesk', sans-serif",
    fontSize: "clamp(44px, 5.5vw, 72px)",
    fontWeight: 900,
    color: "#0d0d14",
    lineHeight: 1.02,
    letterSpacing: "-0.03em",
    marginBottom: 20,
    animation: "slideUp 0.6s ease",
  },
  h1Accent: {
    background:
      "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  lead: {
    fontSize: 17,
    color: "#4b5563",
    lineHeight: 1.75,
    marginBottom: 36,
    maxWidth: 520,
    animation: "slideUp 0.6s ease 0.1s both",
  },
  progressBox: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: "24px 28px",
    marginBottom: 32,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    animation: "slideUp 0.6s ease 0.2s both",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "#9ca3af",
    fontFamily: "'Cabinet Grotesk', sans-serif",
  },
  progressPct: {
    fontSize: 14,
    fontWeight: 800,
    color: "#4f46e5",
    fontFamily: "'Cabinet Grotesk', sans-serif",
  },
  track: {
    height: 10,
    background: "#f3f4f6",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 14,
  },
  fill: {
    height: "100%",
    background: "linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899)",
    borderRadius: 99,
    animation: "fillBar 2.2s cubic-bezier(0.4,0,0.2,1) forwards",
  },
  steps: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    fontFamily: "'Cabinet Grotesk', sans-serif",
  },
  stepDot: (done, active) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: done ? "#22c55e" : active ? "#f59e0b" : "#d1d5db",
    display: "inline-block",
    flexShrink: 0,
  }),
  blameArea: {
    animation: "slideUp 0.6s ease 0.3s both",
  },
  blameBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 14,
    color: "#fff",
    border: "none",
    padding: "16px 28px",
    borderRadius: 16,
    cursor: "pointer",
    fontFamily: "'Cabinet Grotesk', sans-serif",
    transition: "background 0.5s, filter 0.2s",
    boxShadow: "0 6px 30px rgba(13,13,20,0.22)",
  },
  blameFace: { fontSize: 24, lineHeight: 1 },
  blameText: {
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#fff",
  },
  blamePill: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "4px 12px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 800,
    color: "#c4b5fd",
    fontVariantNumeric: "tabular-nums",
    display: "inline-block",
  },
  blameNote: {
    marginTop: 10,
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  statusCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    animation: "slideUp 0.6s ease 0.15s both",
  },
  statusCardHeader: {
    background: "#0d0d14",
    color: "#a78bfa",
    padding: "14px 20px",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.16em",
    fontFamily: "'Cabinet Grotesk', sans-serif",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid #f9fafb",
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 800,
    padding: "3px 10px",
    borderRadius: 99,
    letterSpacing: "0.06em",
    fontFamily: "'Cabinet Grotesk', sans-serif",
  },
  statusFooter: {
    padding: "10px 20px",
    fontSize: 10,
    color: "#d1d5db",
    fontStyle: "italic",
  },
  floatE: {
    position: "absolute",
    fontSize: 24,
    opacity: 0.5,
    animation: "floatEmoji 3.5s ease-in-out infinite",
    pointerEvents: "none",
  },
  section: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "0 32px 64px",
    position: "relative",
    zIndex: 1,
  },
  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    background: "#e5e7eb",
  },
  sectionText: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.16em",
    color: "#9ca3af",
    whiteSpace: "nowrap",
    fontFamily: "'Cabinet Grotesk', sans-serif",
  },
  footer: {
    background: "#0d0d14",
    padding: "20px 32px",
    position: "relative",
    zIndex: 1,
  },
  footerInner: {
    maxWidth: 1280,
    margin: "0 auto",
    display: "flex",
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    color: "#6b7280",
    fontFamily: "'Cabinet Grotesk', sans-serif",
    letterSpacing: "0.08em",
    fontWeight: 600,
    flexWrap: "wrap",
  },
};

// ─── GAME STYLES ───────────────────────────────────────────────────────────────
const gm = {
  wrap: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    borderBottom: "1px solid #f3f4f6",
    flexWrap: "wrap",
    gap: 12,
  },
  gameTitle: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  gameTitleIcon: {
    fontSize: 32,
    lineHeight: 1,
  },
  gameName: {
    fontFamily: "'Cabinet Grotesk', sans-serif",
    fontSize: 18,
    fontWeight: 900,
    color: "#0d0d14",
    letterSpacing: "-0.01em",
  },
  gameDesc: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  scores: {
    display: "flex",
    gap: 10,
  },
  scoreChip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: 12,
    padding: "8px 18px",
    minWidth: 70,
  },
  scoreChipLabel: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "#94a3b8",
    fontFamily: "'Cabinet Grotesk', sans-serif",
    marginBottom: 2,
  },
  scoreChipVal: {
    fontSize: 22,
    fontWeight: 900,
    color: "#0369a1",
    fontFamily: "'Cabinet Grotesk', sans-serif",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  },
  legend: {
    display: "flex",
    gap: 20,
    padding: "10px 24px",
    background: "#fafafa",
    borderBottom: "1px solid #f3f4f6",
    flexWrap: "wrap",
  },
  legendItem: {
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "'Cabinet Grotesk', sans-serif",
    letterSpacing: "0.04em",
  },
  arena: {
    position: "relative",
    width: "100%",
    height: GAME_H,
    overflow: "hidden",
    cursor: "crosshair",
    userSelect: "none",
  },
  ground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    background: "linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899)",
    borderRadius: "4px 4px 0 0",
  },
  gridLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    background: "rgba(0,0,0,0.04)",
  },
  obj: {
    position: "absolute",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    userSelect: "none",
  },
  player: {
    position: "absolute",
    width: PLAYER_W,
    height: PLAYER_H,
    fontSize: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    filter: "drop-shadow(0 4px 8px rgba(79,70,229,0.4))",
    transition: "left 0.05s linear",
    zIndex: 2,
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(245,243,255,0.88)",
    backdropFilter: "blur(4px)",
    zIndex: 10,
  },
  overlayCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: "28px 36px",
    textAlign: "center",
    boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
    animation: "slideDown 0.3s ease",
    maxWidth: 340,
  },
  overlayEmoji: {
    fontSize: 40,
    marginBottom: 10,
    lineHeight: 1,
  },
  overlayTitle: {
    fontFamily: "'Cabinet Grotesk', sans-serif",
    fontSize: 22,
    fontWeight: 900,
    color: "#0d0d14",
    marginBottom: 6,
  },
  overlayScore: {
    fontFamily: "'Cabinet Grotesk', sans-serif",
    fontSize: 18,
    fontWeight: 800,
    color: "#4f46e5",
    marginBottom: 8,
  },
  overlayBody: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 1.6,
    marginBottom: 18,
    fontStyle: "italic",
  },
  startBtn: {
    background: "#0d0d14",
    color: "#fff",
    border: "none",
    padding: "12px 28px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "'Cabinet Grotesk', sans-serif",
    letterSpacing: "0.04em",
    transition: "opacity 0.2s",
  },
};
