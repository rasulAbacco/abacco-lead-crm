import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart3,
  Users,
  Building2,
  UserCheck,
  Calendar,
  ChevronDown,
} from "lucide-react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AllLeadsSummary = ({ employeeId }) => {
  const [filterType, setFilterType] = useState("today");
  const [month, setMonth] = useState(
    new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
    ).getMonth(),
  );

  const [leads, setLeads] = useState({
    total: 0,
    associations: 0,
    industry: 0,
    attendees: 0,
  });
  const [allLeads, setAllLeads] = useState({ today: {}, months: {} });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/employees/leads-summary`,
        );
        if (res.data.success) {
          const today = {
            total: res.data.today?.total || 0,
            associations: res.data.today?.associations || 0,
            industry: res.data.today?.industry || 0,
            attendees: res.data.today?.attendees || 0,
          };
          const monthsData = {};
          months.forEach((m) => {
            monthsData[m] = {
              total: res.data.months?.[m]?.total || 0,
              associations: res.data.months?.[m]?.associations || 0,
              industry: res.data.months?.[m]?.industry || 0,
              attendees: res.data.months?.[m]?.attendees || 0,
            };
          });
          setAllLeads({ today, months: monthsData });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLeads();
  }, [employeeId]);

  useEffect(() => {
    if (filterType === "today") {
      setLeads(
        allLeads.today || {
          total: 0,
          associations: 0,
          industry: 0,
          attendees: 0,
        },
      );
    } else {
      const monthName = months[month];
      setLeads(
        allLeads.months?.[monthName] || {
          total: 0,
          associations: 0,
          industry: 0,
          attendees: 0,
        },
      );
    }
  }, [filterType, month, allLeads]);

  const stats = [
    {
      title: "Associations",
      value: leads.associations,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Industry",
      value: leads.industry,
      icon: Building2,
      color: "text-indigo-600",
    },
    {
      title: "Attendees",
      value: leads.attendees,
      icon: UserCheck,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 py-3 px-6 shadow-sm">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Compact Title & Filter Area */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
              Overview
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
              {["today", "month"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded capitalize transition-all ${
                    filterType === type
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {filterType === "month" && (
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 py-1 pl-2 pr-7 rounded text-[11px] font-bold outline-none cursor-pointer focus:ring-1 focus:ring-blue-400"
                >
                  {months.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* High-Density Stat Cards */}
        <div className="flex flex-wrap items-center gap-3 lg:gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Leads
            </span>
            <span className="text-xl font-black text-slate-900 leading-none">
              {leads.total}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden lg:block" />

          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-3 min-w-[120px]">
              <div
                className={`p-1.5 rounded bg-slate-50 border border-slate-100`}
              >
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {stat.title}
                </span>
                <span className="text-base font-bold text-slate-800 leading-none">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllLeadsSummary;
