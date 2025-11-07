import React, { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, Users, Building2, UserCheck, Calendar, ChevronDown } from "lucide-react";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AllLeadsSummary = ({ employeeId }) => {
  const [filterType, setFilterType] = useState("today");
  const [month, setMonth] = useState(
    new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
    ).getMonth()
  );

  const [leads, setLeads] = useState({ total: 0, associations: 0, industry: 0, attendees: 0 });
  const [allLeads, setAllLeads] = useState({ today: {}, months: {} });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/employees/leads-summary`);
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
      setLeads(allLeads.today || { total: 0, associations: 0, industry: 0, attendees: 0 });
    } else {
      const monthName = months[month];
      setLeads(allLeads.months?.[monthName] || { total: 0, associations: 0, industry: 0, attendees: 0 });
    }
  }, [filterType, month, allLeads]);

  const stats = [
    {
      title: "Associations",
      value: leads.associations,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Industry",
      value: leads.industry,
      icon: Building2,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Attendees",
      value: leads.attendees,
      icon: UserCheck,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    }
  ];

  return (
    <div className=" bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Leads Dashboard</h1>
          </div>
          <p className="text-slate-600 ml-14">Track and monitor your lead generation performance</p>
        </div>

        {/* Total Leads Card */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-500 to-indigo-500 rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <p className="text-white text-sm font-medium uppercase tracking-wider mb-2">Total Leads Generated</p>
                <h2 className="text-7xl font-extrabold text-white mb-4">{leads.total}</h2>
                <div className="flex items-center gap-2 text-indigo-100">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm text-white">
                    {filterType === "today" ? "Today's Performance" : `${months[month]} Overview`}
                  </span>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="appearance-none bg-white/20 backdrop-blur-sm text-white border border-white/30 px-6 py-3 pr-12 rounded-xl font-medium cursor-pointer hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="today" className="text-slate-800">Today</option>
                    <option value="month" className="text-slate-800">Monthly</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" />
                </div>

                {filterType === "month" && (
                  <div className="relative">
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="appearance-none bg-white/20 backdrop-blur-sm text-white border border-white/30 px-6 py-3 pr-12 rounded-xl font-medium cursor-pointer hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      {months.map((m, idx) => (
                        <option key={idx} value={idx} className="text-slate-800">
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${stat.color} text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    Active
                  </div>
                </div>
                <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-2">
                  {stat.title}
                </h3>
                <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className={`h-1 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Data updates in real-time • Last synced:{" "}
            {new Date(
              new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
            ).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AllLeadsSummary;