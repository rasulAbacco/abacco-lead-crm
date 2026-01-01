import { useEffect, useState, useMemo } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function NewYearOverlay() {
  const [visible, setVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [particles, setParticles] = useState([]);
  const [fireworks, setFireworks] = useState([]);
  const [stars, setStars] = useState([]);

  // Quote states
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");

  const DISPLAY_DURATION = 6000;
  const FADE_OUT_DURATION = 1000;

  // Generate stars
  useEffect(() => {
    const newStars = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.3,
    }));
    setStars(newStars);
  }, []);

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 3,
      color: ["#FFD700", "#00F5FF", "#BC13FE"][Math.floor(Math.random() * 3)],
    }));
    setParticles(newParticles);
  }, []);

  // Generate fireworks bursts
  useEffect(() => {
    const createFirework = () => {
      const newFirework = {
        id: Date.now() + Math.random(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 10,
        color: ["#FFD700", "#00F5FF", "#BC13FE"][Math.floor(Math.random() * 3)],
      };
      setFireworks((prev) => [...prev, newFirework]);

      setTimeout(() => {
        setFireworks((prev) => prev.filter((fw) => fw.id !== newFirework.id));
      }, 2000);
    };

    const intervals = [300, 1000, 1800, 2800, 3800, 4800].map((delay) =>
      setTimeout(createFirework, delay)
    );

    return () => intervals.forEach(clearTimeout);
  }, []);

  // Quote polling (3s)
  useEffect(() => {
    let lastQuote = "";

    const fetchQuote = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/quotes`);
        const data = await res.json();

        if (data?.quote?.text && data.quote.text !== lastQuote) {
          setQuote(data.quote.text);
          setAuthor(data.quote.author || "");
          lastQuote = data.quote.text;
        }
      } catch (err) {
        console.error("Failed to fetch quote", err);
      }
    };

    fetchQuote();
    const interval = setInterval(fetchQuote, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, DISPLAY_DURATION - FADE_OUT_DURATION);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, DISPLAY_DURATION);

    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@900&family=Great+Vibes&family=Montserrat:wght@300;500;700&display=swap');`}
      </style>
      <style>
        {`
        * {
          box-sizing: border-box;
        }
        
        .ny-overlay-container {
          position: fixed;
          inset: 0;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: opacity ${FADE_OUT_DURATION}ms ease-in-out;
        }

        .ny-fading-out {
           opacity: 0;
           pointer-events: none;
        }

        .ny-bg-layer {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #090a1f 0%, #161838 50%, #050511 100%);
          z-index: 1;
        }
        
        /* Ambient Glow Background */
        .ny-ambient-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          transform: translate(-50%, -50%);
          background: 
            radial-gradient(circle at 20% 30%, rgba(188, 19, 254, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(0, 245, 255, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 60%);
          animation: pulseGlow 6s ease-in-out infinite alternate;
          z-index: 2;
        }

        @keyframes pulseGlow {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        }

        /* Stars */
        .ny-star {
          position: absolute;
          background: white;
          border-radius: 50%;
          z-index: 3;
          opacity: 0;
          animation: twinkle ease-in-out infinite;
        }

        @keyframes twinkle {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }

        /* Particles */
        .ny-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 4;
          filter: blur(1px);
          animation: floatParticle linear infinite;
          opacity: 0;
        }

        @keyframes floatParticle {
          0% { transform: translateY(100vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100vh) translateX(100px) rotate(360deg); opacity: 0; }
        }

        /* Fireworks */
        .ny-firework {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          z-index: 5;
          transform: translate(-50%, -50%);
        }

        .ny-firework::before, .ny-firework::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          box-shadow: 
            0 0 10px 2px currentColor,
            0 0 20px 4px currentColor,
            0 0 40px 6px currentColor;
          animation: fireworkExplode 2s ease-out forwards;
        }

        @keyframes fireworkExplode {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          50% { opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(25); opacity: 0; }
        }

        /* Content */
        .ny-content-wrapper {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 900px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ny-year-label {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          letter-spacing: 8px;
          text-transform: uppercase;
          color: #FFD700;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          text-shadow: 0 2px 20px rgba(255, 215, 0, 0.5);
          opacity: 0;
          animation: fadeInDown 1s ease-out 0.3s forwards;
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ny-quote-box {
          display: inline-block;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          padding: 2rem 3rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: fadeIn 1.5s ease-out 0.5s forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ny-quote-box::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to right,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.1) 50%,
            rgba(255,255,255,0) 100%
          );
          transform: rotate(30deg);
          animation: shine 3s ease-in-out infinite;
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) rotate(30deg);
          }
          100% {
            transform: translateX(100%) rotate(30deg);
          }
        }

        .ny-quote-text {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(1rem, 2.5vw, 1.3rem);
          font-weight: 300;
          color: #FFFFFF;
          line-height: 1.7;
          margin: 0;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
          position: relative;
          z-index: 1;
        }
        `}
      </style>

      <div
        className={`ny-overlay-container ${isFadingOut ? "ny-fading-out" : ""}`}
      >
        <div className="ny-bg-layer"></div>
        <div className="ny-ambient-glow"></div>

        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="ny-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}

        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="ny-particle"
            style={{
              left: `${particle.x}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}

        {/* Fireworks */}
        {fireworks.map((fw) => (
          <div
            key={fw.id}
            className="ny-firework"
            style={{
              left: `${fw.x}%`,
              top: `${fw.y}%`,
              color: fw.color,
            }}
          />
        ))}

        {/* Content */}
        <div className="ny-content-wrapper">
          <div className="ny-year-label">ABACCO TECHNOLOGY</div>
          <div className="ny-quote-box">
            <p className="ny-quote-text">
              "{quote}"
              {author && (
                <span className="block mt-4 text-sm opacity-70">
                  — {author}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
