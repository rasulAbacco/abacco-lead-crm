import React, { useState } from "react";

export default function Maintenance() {
  const [blames, setBlames] = useState(304);
  const [message, setMessage] = useState(null);
  const [isShaking, setIsShaking] = useState(false);

  // Funny guilt-trip messages
  const guiltMessages = [
    "Et tu, Brute? 🗡️",
    "Wow. Just wow. 🚩",
    "I thought u r good buddy but u also did same thing 😭",
    "Sending your IP to HR... 📝",
    "The developer is crying now. Happy? ☔",
    "Traitors everywhere! 🕵️‍♂️",
    "Karma is watching you 👀",
  ];

  const handleBlame = () => {
    // 1. Increase Count
    setBlames((prev) => prev + 1);

    // 2. Trigger Shake Animation
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    // 3. Show Random Message
    const randomMsg =
      guiltMessages[Math.floor(Math.random() * guiltMessages.length)];
    setMessage(randomMsg);

    // 4. Hide message after 5 seconds (UPDATED)
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <>
      <style>
        {`
          @keyframes slideUpFade {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            100% { opacity: 1; transform: translate(-50%, -20px); }
          }
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-5deg); }
            50% { transform: translateX(5px) rotate(5deg); }
            75% { transform: translateX(-5px) rotate(-5deg); }
            100% { transform: translateX(0); }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>

      <div style={styles.container}>
        {/* Background Hazard Stripes */}
        <div style={styles.stripes}></div>

        {/* TOAST MESSAGE POPUP */}
        {message && <div style={styles.toast}>{message}</div>}

        <div style={styles.card}>
          {/* LEFT SIDE: TEXT */}
          <div style={styles.leftCol}>
            <div style={styles.badge}>🚧 SYSTEM MELTDOWN 🚧</div>

            <h1 style={styles.headline}>
              We Smashed <br /> The Server.
            </h1>

            {/* UPDATED FUNNY TEXT */}
            <p style={styles.subtitle}>
              A developer said{" "}
              <b>"Hold my beer, I’ll fix this in 5 minutes."</b>
              <br />
              <br />
              That was 3 days ago. The server has now gained sentience, locked
              us out, and is refusing to work until we apologize.
            </p>

            <div style={styles.blameSection}>
              <p style={styles.counterTitle}>PEOPLE WHO BLAMED THE DEV:</p>

              <button
                onClick={handleBlame}
                style={{
                  ...styles.blameButton,
                  animation: isShaking
                    ? "shake 0.4s ease-in-out"
                    : "pulse 3s infinite",
                }}
              >
                🤬 BLAME THE DEV
                <span style={styles.counter}>{blames}</span>
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: MEME */}
          <div style={styles.rightCol}>
            <div style={styles.memeFrame}>
              <img
                // MEME: Man destroying computer (Office Space style)
                src="https://media.giphy.com/media/l2Je0oOcT4cioSIfu/giphy.gif"
                alt="Smashing Computer"
                style={styles.memeImage}
              />
              <div style={styles.memeTag}>LIVE FOOTAGE FROM IT DEPT</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111", // Dark background
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  stripes: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage:
      "linear-gradient(45deg, #1a1a1a 25%, #111 25%, #111 50%, #1a1a1a 50%, #1a1a1a 75%, #111 75%, #111 100%)",
    backgroundSize: "40px 40px",
    zIndex: 0,
    opacity: 0.5,
  },
  card: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    flexWrap: "wrap",
    backgroundColor: "rgba(20, 20, 20, 0.9)",
    backdropFilter: "blur(20px)",
    border: "1px solid #333",
    borderRadius: "24px",
    padding: "50px",
    maxWidth: "1100px",
    width: "90%",
    boxShadow: "0 0 80px rgba(0,0,0, 0.8)",
    alignItems: "center",
    gap: "50px",
  },
  // Toast Popup Styles
  toast: {
    position: "absolute",
    top: "15%", // Appears slightly above the card
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#fff",
    color: "#000",
    padding: "15px 30px",
    borderRadius: "50px",
    fontWeight: "bold",
    boxShadow: "0 10px 30px rgba(255, 255, 255, 0.2)",
    zIndex: 100,
    animation: "slideUpFade 0.3s ease-out forwards",
    whiteSpace: "nowrap",
    border: "2px solid #fbbf24", // Yellow border
    fontSize: "16px",
  },

  // Left Column
  leftCol: {
    flex: "1 1 400px",
  },
  badge: {
    background: "#fbbf24", // Warning Yellow
    color: "#000",
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: "8px",
    fontWeight: "900",
    fontSize: "14px",
    letterSpacing: "1px",
    marginBottom: "20px",
    transform: "rotate(-2deg)",
  },
  headline: {
    fontSize: "clamp(40px, 5vw, 70px)",
    color: "#fff",
    fontWeight: "900",
    lineHeight: "0.95",
    marginBottom: "20px",
    letterSpacing: "-2px",
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#999",
    fontSize: "18px",
    lineHeight: "1.6",
    marginBottom: "40px",
    maxWidth: "450px",
  },

  // Blame Section
  blameSection: {
    background: "#222",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #333",
    display: "inline-block",
  },
  counterTitle: {
    color: "#666",
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "10px",
    letterSpacing: "1px",
  },
  blameButton: {
    background: "#ef4444", // Red
    color: "white",
    border: "none",
    padding: "16px 32px",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "800",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow: "0 5px 0 #b91c1c", // 3D effect button
    transition: "transform 0.1s",
  },
  counter: {
    background: "rgba(0,0,0,0.2)",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "16px",
  },

  // Right Column (Meme)
  rightCol: {
    flex: "1 1 400px",
    display: "flex",
    justifyContent: "center",
  },
  memeFrame: {
    position: "relative",
    animation: "float 6s ease-in-out infinite",
    transformStyle: "preserve-3d",
    perspective: "1000px",
  },
  memeImage: {
    width: "100%",
    maxWidth: "500px",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
    border: "4px solid #fff",
  },
  memeTag: {
    position: "absolute",
    bottom: "20px",
    right: "-20px",
    background: "#ef4444",
    color: "#fff",
    padding: "10px 20px",
    fontWeight: "bold",
    fontSize: "14px",
    transform: "rotate(5deg)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
  },
};
