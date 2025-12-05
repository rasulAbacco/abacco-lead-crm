import React from 'react';

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative overflow-hidden font-sans selection:bg-violet-100">

      {/* Background: Very Subtle Gradient & Pastel Blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-white"></div>

      {/* Animated Background Blobs (Lighter colors for white bg) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-200/40 rounded-full blur-[100px] animate-blob opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-200/40 rounded-full blur-[100px] animate-blob animation-delay-2000 opacity-60"></div>

      {/* Main Loader Container */}
      <div className="relative z-10 flex flex-col items-center">

        {/* --- LOGO SECTION --- */}
        <div className="relative mb-10">

          {/* 1. Outer Spinning Ring (Darker Violet for contrast) */}
          <div className="absolute inset-[-15px] rounded-full border-2 border-transparent border-t-violet-600 border-r-fuchsia-500 blur-[0.5px] animate-spin-slow opacity-90"></div>

          {/* 2. Inner Reverse Ring */}
          <div className="absolute inset-[-15px] rounded-full border-2 border-transparent border-l-violet-300 rotate-180 animate-spin-reverse opacity-70"></div>

          {/* 3. Soft Glow Behind (Subtle on white) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-400 to-fuchsia-400 rounded-full blur-2xl opacity-20 animate-pulse-fast"></div>

          {/* 4. The Logo Container (Glassmorphism Light) */}
          {/* w-40/h-40 mobile, w-48/h-48 desktop */}
          <div className="relative w-40 h-40 md:w-48 md:h-48 bg-white/70 backdrop-blur-xl rounded-full flex items-center justify-center border border-white shadow-[0_15px_40px_-10px_rgba(139,92,246,0.15)] animate-float">

            {/* Inner White Rim for clean look */}
            <div className="absolute inset-2 rounded-full border border-white shadow-sm"></div>

            {/* The Image */}
            <img
              src="/image.svg"
              alt="Abacco Technology"
              className="w-24 h-24 md:w-28 md:h-28 object-contain filter drop-shadow-sm"
            />
          </div>
        </div>

        {/* --- TEXT SECTION --- */}
        <div className="text-center space-y-4 relative px-4">

          {/* Main Title - Darker Gradient for Readability */}
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-700 via-fuchsia-600 to-violet-700 tracking-tight animate-shimmer bg-[length:200%_auto] drop-shadow-sm">
            Abacco Technology
          </h1>

          {/* Subtitle */}
          <div className="relative inline-block mt-2">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 tracking-[0.3em] uppercase animate-fade-in-up">
              Smart Solutions For a Digital World
            </p>
            {/* Decorative lines (Gray for light mode) */}
            <div className="absolute -left-8 top-1/2 w-6 h-[1px] bg-gradient-to-r from-transparent to-slate-300"></div>
            <div className="absolute -right-8 top-1/2 w-6 h-[1px] bg-gradient-to-l from-transparent to-slate-300"></div>
          </div>

          {/* Loading Dots */}
          <div className="flex items-center justify-center gap-2 pt-6">
            <div className="h-1.5 w-1.5 bg-violet-600 rounded-full animate-bounce"></div>
            <div className="h-1.5 w-1.5 bg-fuchsia-500 rounded-full animate-bounce delay-100"></div>
            <div className="h-1.5 w-1.5 bg-violet-600 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .animate-spin-slow { animation: spin 4s linear infinite; }
        .animate-spin-reverse { animation: spin 6s linear infinite reverse; }
        .animation-delay-2000 { animation-delay: 2s; }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0); box-shadow: 0 15px 40px -10px rgba(139,92,246,0.15); }
          50% { transform: translateY(-10px); box-shadow: 0 25px 50px -12px rgba(139,92,246,0.25); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes shimmer {
          to { background-position: 200% center; }
        }
        .animate-shimmer { animation: shimmer 3s linear infinite; }

        @keyframes pulse-fast {
           0%, 100% { opacity: 0.2; transform: scale(0.95); }
           50% { opacity: 0.4; transform: scale(1.05); }
        }
        .animate-pulse-fast { animation: pulse-fast 3s ease-in-out infinite; }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 1s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Loader;