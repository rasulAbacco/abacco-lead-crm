// components/MyReport.js
import React, { useState, useEffect } from 'react';
import { Calendar, User, Mail, Target, CheckCircle, XCircle, Send, TrendingUp, RefreshCw, AlertCircle, LogOut, BarChart3, PieChart, Users, FileText, Clock, Briefcase, Building, Activity, ArrowUp, ArrowDown, Filter, Download, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const MyReport = () => {
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [animateCards, setAnimateCards] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const employeeId = localStorage.getItem('employeeId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (employeeId && token) {
      fetchReportData();
    } else {
      setError("Employee ID or authentication token not found. Please log in again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setAnimateCards(true), 300);
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthError(null);

      const response = await fetch(`${API_BASE_URL}/api/reports/employee/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        const errorData = await response.json();
        console.error("Authentication error:", errorData);
        setAuthError(errorData);
        setError("Authentication failed. You may need to log in again.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setReportData(data);

      // Set default month to current month if available
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      if (data.monthlyData[currentMonth]) {
        setSelectedMonth(currentMonth);
      } else {
        // If current month has no data, select the first month with data
        const monthsWithData = Object.keys(data.monthlyData);
        if (monthsWithData.length > 0) {
          setSelectedMonth(monthsWithData[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(`Failed to load your report data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeId');
    window.location.href = '/login';
  };

  // Count leads by type for the current month
  const countLeadsByType = (leads) => {
    const counts = {
      'Association Lead': 0,
      'Attendees Lead': 0,
      'Industry Lead': 0
    };
    
    leads.forEach(lead => {
      if (counts[lead.leadType] !== undefined) {
        counts[lead.leadType]++;
      }
    });
    
    return counts;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-300 animate-ping"></div>
          </div>
          <p className="mt-6 text-gray-600 text-lg font-medium animate-pulse">Loading your report data...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-red-500 mb-4">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-left text-xs">
              <p className="font-semibold mb-1 text-gray-700">Debug Info:</p>
              <pre className="whitespace-pre-wrap text-gray-700">{JSON.stringify(authError, null, 2)}</pre>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <button
              onClick={fetchReportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md transform transition-all duration-200 hover:scale-105"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-md transform transition-all duration-200 hover:scale-105"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-red-500 mb-4">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md transform transition-all duration-200 hover:scale-105 mx-auto"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Data Available</h2>
          <p className="text-gray-600">Unable to load your report data.</p>
        </div>
      </div>
    );
  }

  const { employee, stats, monthlyData } = reportData;
  const currentMonthData = selectedMonth && monthlyData[selectedMonth] ? monthlyData[selectedMonth] : null;
  const leadTypeCounts = currentMonthData ? countLeadsByType(currentMonthData.leads) : null;

  // Calculate percentage for progress bars
  const qualifiedPercentage = stats.totalLeads > 0 ? (stats.totalQualified / stats.totalLeads) * 100 : 0;
  const disqualifiedPercentage = stats.totalLeads > 0 ? (stats.totalDisqualified / stats.totalLeads) * 100 : 0;
  const forwardedPercentage = stats.totalLeads > 0 ? (stats.totalForwarded / stats.totalLeads) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 transform transition-all duration-500 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <User className="text-white" size={24} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">My Performance Report</h1>
              <p className="text-gray-600">Track your lead generation and qualification metrics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm font-medium text-gray-800">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Joining Date:</span>
              <span className="text-sm font-medium text-gray-800">
                {format(new Date(employee.joiningDate), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              title: "Total Leads",
              value: stats.totalLeads,
              icon: <Target className="text-white" size={20} />,
              color: "from-blue-500 to-blue-600",
              bgGlow: "shadow-blue-500/50"
            },
            {
              title: "Qualified",
              value: stats.totalQualified,
              icon: <CheckCircle className="text-white" size={20} />,
              color: "from-green-500 to-green-600",
              bgGlow: "shadow-green-500/50"
            },
            {
              title: "Disqualified",
              value: stats.totalDisqualified,
              icon: <XCircle className="text-white" size={20} />,
              color: "from-red-500 to-red-600",
              bgGlow: "shadow-red-500/50"
            },
            {
              title: "Forwarded",
              value: stats.totalForwarded,
              icon: <Send className="text-white" size={20} />,
              color: "from-purple-500 to-purple-600",
              bgGlow: "shadow-purple-500/50"
            }
          ].map((stat, index) => (
            <div 
              key={index}
              className={`bg-white rounded-2xl shadow-xl p-4 border border-gray-200 transform transition-all duration-500 hover:scale-105 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl shadow-lg ${stat.bgGlow}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Metrics with Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`bg-white rounded-2xl shadow-xl p-4 border border-gray-200 transform transition-all duration-500 hover:scale-105 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium">Qualification Rate</p>
              <p className="text-2xl font-bold text-gray-800">{stats.qualificationRate}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.qualificationRate}%` }}
              ></div>
            </div>
          </div>

          <div className={`bg-white rounded-2xl shadow-xl p-4 border border-gray-200 transform transition-all duration-500 hover:scale-105 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ animationDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium">Forwarding Rate</p>
              <p className="text-2xl font-bold text-gray-800">{stats.forwardingRate}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-teal-400 to-teal-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.forwardingRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className={`bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 transform transition-all duration-500 hover:scale-105 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">Monthly Breakdown</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-50 text-gray-800 px-4 py-2 rounded-lg font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(monthlyData).map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {currentMonthData ? (
          <>
            {/* Monthly Stats */}
            <div className={`bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 transform transition-all duration-500 hover:scale-105 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ animationDelay: '700ms' }}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    title: "Total Leads",
                    value: currentMonthData.totalLeads,
                    color: "from-blue-500 to-blue-600",
                    icon: <Target className="text-white" size={16} />
                  },
                  {
                    title: "Qualified",
                    value: currentMonthData.qualified,
                    color: "from-green-500 to-green-600",
                    icon: <CheckCircle className="text-white" size={16} />
                  },
                  {
                    title: "Disqualified",
                    value: currentMonthData.disqualified,
                    color: "from-red-500 to-red-600",
                    icon: <XCircle className="text-white" size={16} />
                  },
                  {
                    title: "Forwarded",
                    value: currentMonthData.forwarded,
                    color: "from-purple-500 to-purple-600",
                    icon: <Send className="text-white" size={16} />
                  }
                ].map((stat, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`bg-gradient-to-br ${stat.color} p-2 rounded-lg`}>
                        {stat.icon}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Type Summary */}
            <div className={`bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 transform transition-all duration-500 hover:scale-105 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ animationDelay: '800ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={20} className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Lead Type Summary</h2>
              </div>

              {leadTypeCounts ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Association Type",
                      value: leadTypeCounts['Association Lead'],
                      color: "from-blue-500 to-blue-600",
                      icon: <Building size={16} className="text-blue-400" />,
                      percentage: currentMonthData.totalLeads > 0 
                        ? ((leadTypeCounts['Association Lead'] / currentMonthData.totalLeads) * 100).toFixed(1)
                        : '0'
                    },
                    {
                      title: "Attendees Type",
                      value: leadTypeCounts['Attendees Lead'],
                      color: "from-purple-500 to-purple-600",
                      icon: <Users size={16} className="text-purple-400" />,
                      percentage: currentMonthData.totalLeads > 0 
                        ? ((leadTypeCounts['Attendees Lead'] / currentMonthData.totalLeads) * 100).toFixed(1)
                        : '0'
                    },
                    {
                      title: "Industry Type",
                      value: leadTypeCounts['Industry Lead'],
                      color: "from-indigo-500 to-indigo-600",
                      icon: <Briefcase size={16} className="text-indigo-400" />,
                      percentage: currentMonthData.totalLeads > 0 
                        ? ((leadTypeCounts['Industry Lead'] / currentMonthData.totalLeads) * 100).toFixed(1)
                        : '0'
                    }
                  ].map((type, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`bg-gradient-to-br ${type.color} p-2 rounded-lg`}>
                          {type.icon}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">{type.title}</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{type.value}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`bg-gradient-to-r ${type.color} h-1.5 rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${type.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{type.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <PieChart size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Lead Type Data Available</h3>
                  <p className="text-gray-600">
                    {!selectedMonth
                      ? "Please select a month to view lead type summary"
                      : `No lead type data available for ${selectedMonth}`}
                  </p>
                </div>
              )}
            </div>

            {/* Lead Details Summary - Card Layout */}
            <div className={`bg-white rounded-2xl shadow-xl p-6 border border-gray-200 transform transition-all duration-500 hover:scale-105 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ animationDelay: '900ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800">Lead Details Summary</h2>
                </div>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {expandedSection === 'details' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                </button>
              </div>

              {/* Card Layout for Lead Details */}
              <div className={`flex w-full align-center gap-4 overflow-hidden transition-all duration-500 ${expandedSection === 'details' ? 'max-h-96' : 'max-h-0'}`}>
                {/* Employee Info Card */}
                <div className="flex align-center justify-around bg-gradient-to-r w-[50%] from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-lg">
                      <User className="text-white" size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{employee.fullName}</h3>
                      <p className="text-xs text-gray-500">Employee</p>
                    </div>
                  </div>
                  <div className="flex items-center flex-col align-center justify-center text-center">
                    <h2 className="text-xl text-gray-800 font-semibold">Total Leads</h2>
                    <p className="text-xl font-bold text-blue-700">{currentMonthData.totalLeads}</p>
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="flex flex-wrap gap-3">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={14} className="text-green-600" />
                      <p className="text-xs text-gray-600">Qualified</p>
                    </div>
                    <p className="text-xl font-bold text-green-700">{currentMonthData.qualified}</p>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-3 border border-red-200">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={14} className="text-red-600" />
                      <p className="text-xs text-gray-600">Disqualified</p>
                    </div>
                    <p className="text-xl font-bold text-red-700">{currentMonthData.disqualified}</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Send size={14} className="text-purple-600" />
                      <p className="text-xs text-gray-600">Forwarded</p>
                    </div>
                    <p className="text-xl font-bold text-purple-700">{currentMonthData.forwarded}</p>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity size={14} className="text-gray-600" />
                      <p className="text-xs text-gray-600">Leave Out</p>
                    </div>
                    <p className="text-xl font-bold text-gray-700">0</p>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-orange-600" />
                      <p className="text-xs text-gray-600">No Response</p>
                    </div>
                    <p className="text-xl font-bold text-gray-700">0</p>
                  </div>

                  <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl p-3 border border-teal-200">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-teal-600" />
                      <p className="text-xs text-gray-600">Deal</p>
                    </div>
                    <p className="text-xl font-bold text-gray-700">0</p>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-3 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase size={14} className="text-indigo-600" />
                      <p className="text-xs text-gray-600">Invoice Pending</p>
                    </div>
                    <p className="text-xl font-bold text-gray-700">0</p>
                  </div>

                  <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl p-3 border border-pink-200">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={14} className="text-pink-600" />
                      <p className="text-xs text-gray-600">Invoice Canceled</p>
                    </div>
                    <p className="text-xl font-bold text-gray-700">0</p>
                  </div>

                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-3 border border-gray-300">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle size={14} className="text-gray-400" />
                      <p className="text-xs text-gray-600">Active</p>
                    </div>
                    <p className="text-xl font-bold text-gray-700">Not Updated</p>
                  </div>
                </div>
              </div>
            </div>
          
        </>
        ) : (
          <div className={`bg-white rounded-2xl shadow-xl p-6 border border-gray-200 transform transition-all duration-500 hover:scale-105 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ animationDelay: '1000ms' }}>
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Calendar size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                {!selectedMonth
                  ? "Please select a month to view your performance"
                  : `No lead data available for ${selectedMonth}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReport;