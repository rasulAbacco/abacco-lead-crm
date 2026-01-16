import React, { useState, useEffect } from "react";
import DashboardHeader from "../components/DashboardHeader";
import StatsGrid from "../components/StatsGrid";
import ChartsSection from "../components/ChartsSection";
import EmployeeSection from "../components/EmployeeSection";
import Loader from "../components/Loader";
import Leaderboard from "../components/Leaderboard";
import { Plus, MessageSquarePlus, X, Quote, User } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employees`);
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        console.log("Fetched employees:", data);
        setEmployees(data);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  if (loading) {
    return <Loader />;
  }

  const totalMonthlyLeads = employees.reduce(
    (sum, emp) => sum + emp.monthlyLeads,
    0
  );
  const avgLeads = employees.length
    ? Math.round(totalMonthlyLeads / employees.length)
    : 0;
  const achievedCount = employees.filter(
    (emp) => emp.monthlyLeads >= emp.target
  ).length;
  const topPerformer = employees.reduce(
    (max, emp) => (emp.monthlyLeads > max.monthlyLeads ? emp : max),
    employees[0] || { name: "-", monthlyLeads: 0 }
  );

  const getFilteredEmployees = () => {
    let data = [...employees];
    if (filter === "highest")
      data.sort((a, b) => b.monthlyLeads - a.monthlyLeads);
    else if (filter === "lowest")
      data.sort((a, b) => a.monthlyLeads - b.monthlyLeads);
    else if (filter === "achieved")
      data = data.filter((emp) => emp.monthlyLeads >= emp.target);
    else if (filter === "below")
      data = data.filter((emp) => emp.monthlyLeads < emp.target);
    return data;
  };

  const filteredEmployees = getFilteredEmployees();

  const performanceData = employees.map((emp) => ({
    employeeId: emp.employeeId,
    name: emp.fullName || emp.name,
    leads: emp.monthlyLeads || emp.leads || 0,
    target: emp.target || 0,
    qualifiedLeads: emp.qualifiedLeads || 0,
    disqualifiedLeads: emp.disqualifiedLeads || 0,
    pendingLeads: emp.pendingLeads || 0,
    dailyLeads: emp.dailyLeads || 0,
  }));

  console.log("✅ Prepared Performance Data:", performanceData);

  const pieData = [
    { name: "Achieved", value: achievedCount },
    { name: "Below Target", value: employees.length - achievedCount },
  ];

  const handleSaveQuote = async () => {
    if (!quoteText.trim()) {
      alert("Quote text is required");
      return;
    }

    setSavingQuote(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: quoteText,
          author: quoteAuthor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setShowQuoteModal(false);
      setQuoteText("");
      setQuoteAuthor("");
    } catch (err) {
      alert(err.message || "Failed to save quote");
    } finally {
      setSavingQuote(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="w-full flex justify-end mb-4">
          <button
            onClick={() => setShowQuoteModal(true)}
            className="
      group relative px-6 py-2.5 overflow-hidden
      bg-indigo-600 text-white font-medium rounded-xl
      shadow-md transition-all duration-300
      hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5
      active:scale-95
    "
          >
            {/* The Sliding Shine Effect */}
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] transition-all duration-500 group-hover:left-full ease-in-out" />

            <div className="relative flex items-center gap-2">
              <span className="text-xl leading-none font-light mb-0.5 transition-transform duration-300 group-hover:rotate-90">
                +
              </span>
              <span>Add Quote</span>
            </div>
          </button>
        </div>

        <DashboardHeader />
        <StatsGrid
          totalMonthlyLeads={totalMonthlyLeads}
          avgLeads={avgLeads}
          achievedCount={achievedCount}
          topPerformer={topPerformer}
          employeesLength={employees.length}
        />
        <ChartsSection
          employees={employees}
          setSelectedEmployee={setSelectedEmployee}
          pieData={pieData}
          performanceData={performanceData}
          achievedCount={achievedCount}
        />
        <EmployeeSection
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          filteredEmployees={filteredEmployees}
          filter={filter}
          setFilter={setFilter}
        />
        <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <Leaderboard apiBase={API_BASE_URL} />
        </div>
      </div>

      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300">
          {/* Modal Card */}
          <div
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <MessageSquarePlus size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  Add New Quote
                </h2>
              </div>

              {/* Close 'X' Button */}
              <button
                onClick={() => setShowQuoteModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Quote Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Quote size={14} className="text-indigo-500" />
                  Quote Text
                </label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-gray-400"
                  rows="4"
                  placeholder="Type the inspiring quote here..."
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                />
              </div>

              {/* Author Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User size={14} className="text-indigo-500" />
                  Author{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (Optional)
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                  placeholder="e.g. Steve Jobs"
                  value={quoteAuthor}
                  onChange={(e) => setQuoteAuthor(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowQuoteModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuote}
                disabled={savingQuote || !quoteText.trim()}
                className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center gap-2"
              >
                {savingQuote ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Quote"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
