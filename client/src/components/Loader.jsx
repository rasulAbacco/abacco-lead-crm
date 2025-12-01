import React from 'react'

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Logo with Loading Animation */}
      <div className="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40">
        {/* Loading Ring */}
        <div className="loader-ring"></div>

        {/* Logo */}
        <img
          src="/image.svg"
          alt="Abacco Technology Logo"
          className="absolute w-20 h-20 md:w-24 md:h-24 object-contain logo-rotate"
        />
      </div>

      {/* Brand Text */}
      <h1 className="mt-8 text-2xl md:text-3xl font-black bg-gradient-to-r from-[#7F27FF] via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
        Abacco Technology
      </h1>

      {/* Tagline */}
      <p className="text-md font-bold md:text-base text-black mt-2 animate-fade-in">
        Smart Solutions For a Digital World 💡
      </p>

      {/* Custom CSS */}
      <style jsx>{`
        .loader-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid #e5e7eb;
          border-top-color: #7F27FF;
          border-right-color: #a855f7;
          border-radius: 50%;
          animation: spin 1.5s linear infinite;
        }

        .logo-rotate {
          animation: logo-spin 3s ease-in-out infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes logo-spin {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
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
  )
}

export default Loader