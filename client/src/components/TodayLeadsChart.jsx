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

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees/leads-summary`);
      const { today, weekly, months } = res.data;

      if (timeRange === "today") {
        const nowUSA = toZonedTime(new Date(), USA_TZ);
        const todayLabel = format(nowUSA, "EEE", { timeZone: USA_TZ }); // Mon, Tue, etc.

        setChartData([
          {
            day: todayLabel,
            ...today,
          },
        ]);
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

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {leadType === "total"
            ? "Total Leads"
            : leadType === "associations"
              ? "Associations Leads"
              : leadType === "attendees"
                ? "Attendees Leads"
                : "Industry Leads"}
        </h2>

        <div className="flex gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="today">Today</option>
            <option value="weekly">Weekly (Mon–Sat)</option>
            <option value="monthly">Monthly</option>
          </select>

          {/* Lead Type Selector */}
          <select
            value={leadType}
            onChange={(e) => setLeadType(e.target.value)}
            className="px-3 py-1 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="associations">Associations</option>
            <option value="attendees">Attendees</option>
            <option value="industry">Industry</option>
            <option value="total">Total</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey={timeRange === "monthly" ? "month" : "day"}
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Bar
            dataKey={leadType}
            fill="url(#leadGradient)"
            radius={[8, 8, 0, 0]}
            cursor="pointer"
            onClick={(data) => setSelectedEmployee(data)}
          />
          <defs>
            <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
