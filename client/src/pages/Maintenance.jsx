import React, { useState } from "react";

export default function Maintenance() {
  const [blames, setBlames] = useState(304);
  const [message, setMessage] = useState(null);
  const [isShaking, setIsShaking] = useState(false);

  const guiltMessages = [
    "Et tu, Brute? 🗡️",
    "Wow. Just wow. 🚩",
    "Logging this to your permanent record... 📝",
    "The server felt that one. ⚡",
    "Karma is watching you 👀",
    "Dev crying in the corner rn 😭",
    "HR has been notified 🧾",
  ];

  const handleBlame = () => {
    setBlames((prev) => prev + 1);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    const randomMsg =
      guiltMessages[Math.floor(Math.random() * guiltMessages.length)];
    setMessage(randomMsg);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0); }
          }

          @keyframes glow {
            0% { box-shadow: 0 0 10px #ff0055; }
            50% { box-shadow: 0 0 30px #ff0055; }
            100% { box-shadow: 0 0 10px #ff0055; }
          }

          @keyframes shake {
            0%, 100% { transform: translate(0, 0); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 0); }
            20%, 40%, 60%, 80% { transform: translate(4px, 0); }
          }

          @keyframes progress {
            from { width: 0%; }
            to { width: 78%; }
          }
        `}
      </style>

      <div style={styles.container}>
        {message && <div style={styles.toast}>{message}</div>}

        {/* floating emojis */}
        <div style={{ ...styles.emoji, top: "15%", left: "10%" }}>🔥</div>
        <div style={{ ...styles.emoji, top: "25%", right: "12%" }}>💀</div>
        <div style={{ ...styles.emoji, bottom: "20%", left: "15%" }}>🚨</div>

        <div style={styles.card}>
          <p style={styles.badge}>🚧 SYSTEM HAVING A MOMENT</p>

          <h1 style={styles.title}>
            Oops… <br />
            <span style={styles.neon}>We broke production.</span>
          </h1>

          <p style={styles.text}>
            Our servers tripped over a cable, spilled coffee on themselves and
            are now questioning their life choices.
            <br />
            <br />
            Engineers are currently:
            <strong> googling the error message</strong>.
          </p>

          {/* fake progress */}
          <div style={styles.progressWrap}>
            <div style={styles.progressBar}></div>
          </div>
          <small style={styles.progressText}>
            Fixing: 78% (remaining 22% panic)
          </small>

          <div style={styles.divider}></div>

          <p style={styles.counterTitle}>ANGER STORAGE:</p>

          {/* KEEP BUTTON */}
          <button
            onClick={handleBlame}
            style={{
              ...styles.blameButton,
              animation: isShaking ? "shake 0.2s infinite" : "none",
            }}
          >
            🤬 BLAME THE DEV <span style={styles.counter}>{blames}</span>
          </button>

          <p style={styles.footer}>
            Clicking harder does not fix it. But it *feels* good.
          </p>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "radial-gradient(circle at top, #1a0025, #050505 70%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Inter', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  emoji: {
    position: "absolute",
    fontSize: "40px",
    animation: "float 3s ease-in-out infinite",
    opacity: 0.4,
  },

  card: {
    width: "90%",
    maxWidth: "600px",
    background: "rgba(20,20,20,0.8)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "50px",
    border: "1px solid #333",
    boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
  },

  badge: {
    color: "#ffbd2e",
    letterSpacing: "2px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "15px",
  },

  title: {
    color: "#fff",
    fontSize: "52px",
    lineHeight: "1",
    marginBottom: "20px",
    fontWeight: "900",
  },

  neon: {
    color: "#ff0055",
    animation: "glow 2s infinite",
  },

  text: {
    color: "#aaa",
    fontSize: "17px",
    lineHeight: "1.6",
    marginBottom: "30px",
  },

  progressWrap: {
    height: "8px",
    width: "100%",
    background: "#222",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    width: "78%",
    background: "#ff0055",
    animation: "progress 2s ease-out",
  },

  progressText: {
    color: "#666",
    fontSize: "12px",
    display: "block",
    marginTop: "8px",
  },

  divider: {
    height: "1px",
    background: "linear-gradient(90deg, #333, transparent)",
    margin: "35px 0",
  },

  counterTitle: {
    color: "#555",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "2px",
    marginBottom: "12px",
  },

  blameButton: {
    background: "#fff",
    color: "#000",
    border: "none",
    padding: "16px 28px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "transform 0.1s",
    boxShadow: "0 10px 20px rgba(255, 255, 255, 0.1)",
  },

  counter: {
    background: "#eee",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#ff0055",
  },

  footer: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#555",
    textAlign: "center",
  },

  toast: {
    position: "absolute",
    top: "8%",
    background: "#ff0055",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "8px",
    fontWeight: "bold",
    zIndex: 100,
    boxShadow: "0 10px 30px rgba(255, 0, 85, 0.4)",
  },
};
