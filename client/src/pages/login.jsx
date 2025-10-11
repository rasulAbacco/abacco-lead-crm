import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Sparkles } from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [userRole, setUserRole] = useState("");
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

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.success) {
        // Store in localStorage
        localStorage.setItem("employeeId", data.employeeId);
        localStorage.setItem("role", data.role.toLowerCase());
        localStorage.setItem("token", data.token);
        localStorage.setItem("fullName", data.fullName);

        // Show welcome message
        const role = data.role.toLowerCase();
        setUserRole(role);
        const message = role === "admin"
          ? "Welcome to Admin Dashboard!"
          : "Welcome to Employee Dashboard!";
        setWelcomeMessage(message);
        setShowWelcome(true);

        // Redirect after showing welcome message
        setTimeout(() => {
          if (role === "admin") {
            navigate("/admin-dashboard");
          } else {
            navigate("/employee-dashboard");
          }
        }, 2500);
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Server error, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob top-0 -left-4"></div>
        <div className="absolute w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000 top-0 right-0"></div>
        <div className="absolute w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000 bottom-0 left-20"></div>
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Welcome Overlay - Full Screen */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 animate-fade-in">
          <div className="text-center animate-scale-up">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <CheckCircle className="w-32 h-32 text-white animate-check-bounce" />
                <Sparkles className="w-12 h-12 text-yellow-300 absolute -top-2 -right-2 animate-sparkle" />
              </div>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-slide-down">
              Success!
            </h2>
            <p className="text-2xl md:text-3xl text-white/90 font-medium animate-slide-up">
              {welcomeMessage}
            </p>
            <div className="mt-8 flex justify-center gap-2 animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-3 h-3 bg-white rounded-full animation-delay-200"></div>
              <div className="w-3 h-3 bg-white rounded-full animation-delay-400"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 tracking-tight">
            Abacco Technology
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-light">
            Lead CRM
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md animate-slide-up">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-gray-100">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-center mb-8">Sign in to continue</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border-2 border-red-200 animate-shake">
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={loading || showWelcome}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm animate-fade-in">
          <p>© {new Date().getFullYear()} Abacco Technology. All rights reserved.</p>
        </div>

      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from { 
            opacity: 0;
            transform: translateY(-30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-up {
          0% { 
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            transform: scale(1.05);
          }
          100% { 
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes check-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes sparkle {
          0%, 100% { 
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
          50% { 
            opacity: 0.5;
            transform: rotate(180deg) scale(1.2);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.8s ease-out;
        }

        .animate-scale-up {
          animation: scale-up 0.8s ease-out;
        }

        .animate-check-bounce {
          animation: check-bounce 1s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}