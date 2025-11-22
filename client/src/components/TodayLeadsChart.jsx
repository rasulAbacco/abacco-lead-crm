import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { toZonedTime, format } from "date-fns-tz";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USA_TZ = "America/Chicago"; // ✅ Central USA timezone

export default function TodayLeadsChart({ setSelectedEmployee }) {
  const [timeRange, setTimeRange] = useState("today"); // today | weekly | monthly
  const [leadType, setLeadType] = useState("total"); // associations | attendees | industry | total
  const [chartData, setChartData] = useState([]);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [progress, setProgress] = useState(0);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees/leads-summary`);
      const { today, weekly, months } = res.data;

      if (timeRange === "today") {
        const nowUSA = toZonedTime(new Date(), USA_TZ);
        const todayLabel = format(nowUSA, "EEE", { timeZone: USA_TZ }); // Mon, Tue, etc.

        const todayData = [{
          day: todayLabel,
          ...today,
        }];

        setChartData(todayData);

        // Reset and start animation
        setAnimatedCount(0);
        setProgress(0);

        const targetValue = today[leadType] || 0;
        const duration = 2000; // Animation duration in ms
        const frameDuration = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameDuration);

        let frame = 0;
        const counter = setInterval(() => {
          frame++;
          const progress = frame / totalFrames;
          const currentCount = Math.round(targetValue * easeOutQuad(progress));

          setAnimatedCount(currentCount);
          setProgress(progress * 100);

          if (frame === totalFrames) {
            clearInterval(counter);
          }
        }, frameDuration);

      } else if (timeRange === "weekly") {
        // ✅ Ensure consistent Mon → Sat order and fill missing days
        const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weeklyMap = {};
        weekly.forEach((d) => {
          weeklyMap[d.day] = d;
        });

        const sortedWeekly = dayOrder.map(
          (day) =>
            weeklyMap[day] || {
              day,
              total: 0,
              associations: 0,
              attendees: 0,
              industry: 0,
            }
        );

        setChartData(sortedWeekly);
      } else if (timeRange === "monthly") {
        const data = Object.keys(months).map((m) => ({
          month: m,
          ...months[m],
        }));
        setChartData(data);
      }
    } catch (err) {
      console.error("❌ Failed to fetch leads summary:", err);
    }
  };

  // Easing function for smooth animation
  const easeOutQuad = (t) => {
    return t * (2 - t);
  };

  useEffect(() => {
    fetchData();
  }, [timeRange, leadType]);

  // Chart title based on lead type
  const getChartTitle = () => {
    switch (leadType) {
      case "associations":
        return "Associations Leads";
      case "attendees":
        return "Attendees Leads";
      case "industry":
        return "Industry Leads";
      default:
        return "Total Leads";
    }
  };

  // Get current value for today display
  const getTodayValue = () => {
    if (chartData.length > 0) {
      return chartData[0][leadType] || 0;
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{getChartTitle()}</h2>
          <p className="text-sm text-gray-500">
            {timeRange === "today"
              ? "Today's performance"
              : timeRange === "weekly"
                ? "Weekly overview (Mon–Sat)"
                : "Monthly trends"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Time Range Selector */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-xl py-2 px-4 pr-10 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="today">Today</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          {/* Lead Type Selector */}
          <div className="relative">
            <select
              value={leadType}
              onChange={(e) => setLeadType(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-xl py-2 px-4 pr-10 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="associations">Associations</option>
              <option value="attendees">Attendees</option>
              <option value="industry">Industry</option>
              <option value="total">Total</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="h-80">
        {timeRange === "today" ? (
          // Today's metric display with circular progress and animation
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative mb-8">
              {/* Circular progress background */}
              <div className="w-48 h-48 rounded-full border-8 border-gray-100 flex items-center justify-center">
                {/* Inner circle with gradient */}
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-inner">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 transition-all duration-300 transform scale-100">
                      {animatedCount}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Leads</div>
                  </div>
                </div>
              </div>

              {/* Progress indicator with animation */}
              <div
                className="absolute top-0 left-0 w-48 h-48 rounded-full border-8 border-transparent"
                style={{
                  borderTopColor: "#6366f1",
                  borderRightColor: "#6366f1",
                  transform: `rotate(${Math.min(progress * 3.6, 360)}deg)`,
                  transition: "transform 0.3s ease-out"
                }}
              ></div>

              {/* Pulsing dot animation */}
              <div
                className="absolute top-0 left-1/2 w-4 h-4 bg-indigo-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  animation: "pulse 2s infinite",
                  opacity: progress > 0 ? 1 : 0
                }}
              ></div>
            </div>

            {/* Stats grid with animation */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center transform transition-all duration-500 hover:scale-105">
                <div className="text-2xl font-bold text-indigo-600">{chartData[0]?.associations || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Associations</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center transform transition-all duration-500 hover:scale-105">
                <div className="text-2xl font-bold text-purple-600">{chartData[0]?.attendees || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Attendees</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center transform transition-all duration-500 hover:scale-105">
                <div className="text-2xl font-bold text-pink-600">{chartData[0]?.industry || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Industry</div>
              </div>
            </div>
          </div>
        ) : (
          // Bar chart for weekly and monthly
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey={timeRange === "monthly" ? "month" : "day"}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
                labelStyle={{ color: "#4f46e5", fontWeight: "600", marginBottom: "4px" }}
                formatter={(value) => [value, "Leads"]}
              />
              <Bar
                dataKey={leadType}
                fill="url(#leadGradient)"
                radius={[12, 12, 0, 0]}
                cursor="pointer"
                onClick={(data) => setSelectedEmployee(data)}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <defs>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart footer */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <span>{getChartTitle()}</span>
        </div>
        <div>{timeRange === "today" ? "Today's summary" : "Click on bars for details"}</div>
      </div>

      {/* Pulse animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}