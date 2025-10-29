import React, { useState, useEffect, useRef } from "react";
import {
    Download,
    RefreshCw,
    Calendar,
    ChevronDown,
    Users,
    TrendingUp,
    FileText,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Briefcase,
    Building,
    UserCheck,
    Activity,
    Filter,
    BarChart3,
} from "lucide-react";

const Reports = () => {
    const [reportData, setReportData] = useState({});
    const [selectedMonth, setSelectedMonth] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [animatedCards, setAnimatedCards] = useState(new Set());
    const dropdownRef = useRef(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Fetch data
    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/reports/admin/monthly`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error("Failed to fetch report data");

            const data = await res.json();
            setReportData(data);

            const currentMonth = new Date().toLocaleString("default", {
                month: "long",
            });
            setSelectedMonth(
                data[currentMonth] && data[currentMonth].length > 0
                    ? currentMonth
                    : Object.keys(data).find((m) => data[m].length > 0) || ""
            );
        } catch (err) {
            setError("Unable to load report data. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Dropdown close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Animate cards when they come into view
    useEffect(() => {
        if (!loading && !error && selectedMonth && reportData[selectedMonth]) {
            const timer = setTimeout(() => {
                const cards = document.querySelectorAll('.employee-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        setAnimatedCards(prev => new Set(prev).add(card.id));
                    }, index * 100);
                });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [loading, error, selectedMonth, reportData]);

    const handleExport = () => {
        if (!selectedMonth || !reportData[selectedMonth]?.length) {
            alert("No data available to export for the selected month");
            return;
        }

        const data = reportData[selectedMonth];
        const headers = [
            "Employee Name",
            "Email",
            "Total Leads",
            "Qualified",
            "Disqualified",
            "Leave Out",
            "No Response",
            "Deal",
            "Invoice Pending",
            "Invoice Canceled",
            "Active",
            "Association Type",
            "Attendees Type",
            "Industry Type",
        ];

        const csvContent = [
            headers.join(","),
            ...data.map((r) =>
                [
                    r.name,
                    r.email,
                    r.totalLeads,
                    r.qualified,
                    r.disqualified,
                    r.leaveOut,
                    r.noResponse,
                    r.deal,
                    r.invoicePending,
                    r.invoiceCanceled,
                    r.active,
                    r.association,
                    r.attendees,
                    r.industry,
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedMonth}_Full_Report.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const getStats = () => {
        if (!selectedMonth || !reportData[selectedMonth]) return {};
        const data = reportData[selectedMonth];
        return {
            employees: data.length,
            totalLeads: data.reduce((s, e) => s + e.totalLeads, 0),
            qualified: data.reduce((s, e) => s + e.qualified, 0),
            disqualified: data.reduce((s, e) => s + e.disqualified, 0),
            deals: data.reduce((s, e) => s + e.deal, 0),
            active: data.reduce((s, e) => s + e.active, 0),
        };
    };

    const stats = getStats();

    // Filter and sort employee data
    const getFilteredAndSortedData = () => {
        if (!selectedMonth || !reportData[selectedMonth]) return [];

        let data = [...reportData[selectedMonth]];

        // Filter by search term
        if (searchTerm) {
            data = data.filter(emp =>
                emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort data
        data.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            if (sortDirection === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        return data;
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredData = getFilteredAndSortedData();

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin h-16 w-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BarChart3 size={24} className="text-white animate-pulse" />
                        </div>
                    </div>
                    <p className="text-white text-lg font-medium animate-pulse">Loading monthly reports...</p>
                </div>
            </div>
        );

    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md text-center transform transition-all hover:scale-105">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-70"></div>
                        <AlertCircle size={64} className="text-red-500 mx-auto mb-4 relative" />
                    </div>
                    <h2 className="font-bold text-2xl text-gray-800 mb-2">Oops! Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchReportData}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full hover:from-indigo-600 hover:to-purple-700 mx-auto transition-all transform hover:scale-105 shadow-lg"
                    >
                        <RefreshCw size={18} />
                        Retry
                    </button>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl">
                <div className="max-w-[1600px] mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Employee Performance Reports</h1>
                            <p className="text-indigo-100">Monthly breakdown of leads and performance metrics</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                                <Calendar size={18} />
                                <span className="font-medium">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100 transform transition-all hover:scale-105 hover:shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-2xl opacity-20 -mr-12 -mt-12"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                                    <Users className="text-white" size={24} />
                                </div>
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Team</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-1">Employees</p>
                            <h2 className="text-3xl font-bold text-gray-800">{stats.employees}</h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 transform transition-all hover:scale-105 hover:shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full blur-2xl opacity-20 -mr-12 -mt-12"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl shadow-md">
                                    <TrendingUp className="text-white" size={24} />
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Growth</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-1">Total Leads</p>
                            <h2 className="text-3xl font-bold text-gray-800">{stats.totalLeads}</h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100 transform transition-all hover:scale-105 hover:shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full blur-2xl opacity-20 -mr-12 -mt-12"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-md">
                                    <CheckCircle className="text-white" size={24} />
                                </div>
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Success</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-1">Qualified</p>
                            <h2 className="text-3xl font-bold text-gray-800">{stats.qualified}</h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100 transform transition-all hover:scale-105 hover:shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full blur-2xl opacity-20 -mr-12 -mt-12"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl shadow-md">
                                    <XCircle className="text-white" size={24} />
                                </div>
                                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Lost</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-1">Disqualified</p>
                            <h2 className="text-3xl font-bold text-gray-800">{stats.disqualified}</h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100 transform transition-all hover:scale-105 hover:shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full blur-2xl opacity-20 -mr-12 -mt-12"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl shadow-md">
                                    <DollarSign className="text-white" size={24} />
                                </div>
                                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Revenue</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-1">Deals</p>
                            <h2 className="text-3xl font-bold text-gray-800">{stats.deals}</h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100 transform transition-all hover:scale-105 hover:shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full blur-2xl opacity-20 -mr-12 -mt-12"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 rounded-xl shadow-md">
                                    <Activity className="text-white" size={24} />
                                </div>
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Active</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-1">Active Leads</p>
                            <h2 className="text-3xl font-bold text-gray-800">{stats.active}</h2>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                            <div className="flex items-center gap-3" ref={dropdownRef}>
                                <Calendar size={20} className="text-indigo-600" />
                                <span className="font-semibold text-gray-700">Month:</span>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-xl flex items-center gap-2 hover:from-indigo-100 hover:to-purple-100 transition-all border border-indigo-200"
                                >
                                    {selectedMonth || "Select Month"}
                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute mt-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 w-56 max-h-64 overflow-y-auto">
                                        {Object.keys(reportData)
                                            .filter((m) => reportData[m].length > 0)
                                            .map((month) => (
                                                <button
                                                    key={month}
                                                    onClick={() => {
                                                        setSelectedMonth(month);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`block w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all ${selectedMonth === month ? "bg-gradient-to-r from-indigo-50 to-purple-50 font-semibold text-indigo-600" : ""
                                                        }`}
                                                >
                                                    {month}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                                />
                                <Filter size={18} className="absolute left-3 top-2.5 text-gray-400" />
                            </div>
                        </div>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Employee Cards */}
                {!selectedMonth || !reportData[selectedMonth]?.length ? (
                    <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-gray-100 rounded-full blur-xl opacity-50"></div>
                            <FileText size={64} className="relative text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Data Available</h3>
                        <p className="text-gray-500">There is no data available for the selected month</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredData.map((emp, index) => (
                            <div
                                key={emp.id}
                                id={`card-${emp.id}`}
                                className={`employee-card bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transform transition-all duration-500 hover:shadow-xl hover:scale-[1.02] ${animatedCards.has(`card-${emp.id}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                    }`}
                            >
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                                                <UserCheck size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold">{emp.name}</h3>
                                                <p className="text-indigo-100">{emp.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                            <Briefcase size={16} />
                                            <span className="font-medium">{emp.association}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Leads</span>
                                                <TrendingUp size={16} className="text-blue-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-gray-800">{emp.totalLeads}</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-green-600 uppercase tracking-wider">Qualified</span>
                                                <CheckCircle size={16} className="text-green-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-gray-800">{emp.qualified}</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-red-600 uppercase tracking-wider">Disqualified</span>
                                                <XCircle size={16} className="text-red-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-gray-800">{emp.disqualified}</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Leave Out</span>
                                                <Clock size={16} className="text-amber-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-gray-800">{emp.leaveOut}</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">No Response</span>
                                                <Activity size={16} className="text-gray-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-gray-800">{emp.noResponse}</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">Deals</span>
                                                <DollarSign size={16} className="text-purple-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-gray-800">{emp.deal}</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Active</span>
                                                <Activity size={16} className="text-teal-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-gray-800">{emp.active}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                                                <Building size={16} className="text-gray-500" />
                                                <span className="text-sm text-gray-600">Industry:</span>
                                                <span className="font-medium text-gray-800">{emp.industry}</span>
                                            </div>

                                            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                                                <Users size={16} className="text-gray-500" />
                                                <span className="text-sm text-gray-600">Attendees:</span>
                                                <span className="font-medium text-gray-800">{emp.attendees}</span>
                                            </div>

                                            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                                                <FileText size={16} className="text-gray-500" />
                                                <span className="text-sm text-gray-600">Invoice Pending:</span>
                                                <span className="font-medium text-gray-800">{emp.invoicePending}</span>
                                            </div>

                                            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                                                <XCircle size={16} className="text-gray-500" />
                                                <span className="text-sm text-gray-600">Invoice Canceled:</span>
                                                <span className="font-medium text-gray-800">{emp.invoiceCanceled}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;