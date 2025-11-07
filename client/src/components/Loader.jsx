import React from 'react'

const Loader = () => {
    return (
        <div>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Loader */}
      <span className="loader"></span>

      {/* Brand Text */}
      <h1 className="mt-8 text-2xl md:text-3xl font-black bg-gradient-to-r from-[#7F27FF] via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse tracking-wide">
        Abacco Technology
      </h1>

      {/* Tagline */}
      <p className="text-sm md:text-base text-blak mt-2 animate-fade-in">
        Empowering Innovation, One Line of Code at a Time 💡
      </p>

      {/* Custom CSS */}
      <style jsx>{`
        .loader {
          width: 96px;
          height: 48px;
          background: #ffffff;
          border-color: #7f27ff;
          border-style: solid;
          border-width: 2px 2px 50px 2px;
          border-radius: 100%;
          position: relative;
          animation: yinYang 3s linear infinite;
          box-sizing: content-box;
          box-shadow: 0 0 20px rgba(127, 39, 255, 0.3);
        }

        .loader::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          background: #ffffff;
          border: 18px solid #7f27ff;
          border-radius: 100%;
          width: 12px;
          height: 12px;
          box-sizing: content-box;
        }

        .loader::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          background: #7f27ff;
          border: 18px solid #ffffff;
          border-radius: 100%;
          width: 12px;
          height: 12px;
          box-sizing: content-box;
        }

        @keyframes yinYang {
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0.4;
            transform: translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1.5s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
        </div>
    )
}

export default Loader
