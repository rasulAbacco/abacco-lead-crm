import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Send,
  LogOut,
  Users,
  Sparkles,
  Briefcase,
  ChevronRight,
  FolderOpen,
  UserPlus,
  CloudUpload,
  CloudDownload,
  ServerCrash
} from "lucide-react";

const getRole = () => localStorage.getItem("role")?.toLowerCase();

function Layout({ children }) {
  const location = useLocation();
  const hideSidebar = location.pathname === "/";
  const role = getRole();
  const employeeId = localStorage.getItem("employeeId");
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`group flex items-center ${isExpanded ? "gap-3 px-4" : "justify-center px-0"
        } py-3 rounded-xl transition-all duration-300 ${isActive(to)
          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
          : "text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600"
        }`}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 ${isActive(to) ? "text-white" : "text-gray-500 group-hover:text-indigo-600"
          }`}
      />
      {/* Only show text when expanded */}
      {isExpanded && <span className="font-medium flex-1">{label}</span>}
      {isExpanded && isActive(to) && <ChevronRight className="w-4 h-4" />}
    </Link>
  );

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {!hideSidebar && (
        <aside
          ref={sidebarRef}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          className={`${isExpanded ? "w-64" : "w-20"
            } h-screen bg-white flex flex-col shadow-xl fixed left-0 top-0 transition-all duration-300 ease-in-out overflow-hidden z-50 border-r border-gray-200`}
        >
          {/* Header */}
          <div className="p-2 py-3 border-b border-gray-100 flex items-center justify-center gap-3">
            {/* Change bg-indigo-100 and border-indigo-200 to match your brand theme */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              {/* Background Glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-orange-500 blur-md opacity-40"></div>

              {/* The Ring Container */}
              {/* p-[3px] determines the thickness of the green/orange border */}
              <div className="relative w-full h-full rounded-full p-[3px] bg-gradient-to-br from-green-400 via-yellow-400 to-orange-500 shadow-lg shadow-orange-500/20">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <img
                    src="/image.svg"
                    alt="Company Logo"
                    className="w-10 h-10 object-contain"
                  />
                </div>
              </div>
            </div>
            {isExpanded && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  LEADS CRM
                </h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            )}
          </div>

          {/* User Info */}
          <div
            className={`p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center ${isExpanded ? "gap-3" : "justify-center"
              }`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {role === "admin"
                ? "A"
                : localStorage.getItem("fullName")?.charAt(0).toUpperCase() || "E"}
            </div>
            {isExpanded && (
              <div className="flex-1">
                <p className="font-semibold text-gray-900 capitalize">
                  {role === "admin"
                    ? "Welcome Admin"
                    : `Welcome ${localStorage.getItem("fullName") || "Employee"}`}
                </p>
                <p className="text-xs text-gray-600">
                  {role === "admin" ? "Administrator" : "Abacco Technology"}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {role === "employee" && (
              <>
                <NavLink to="/employee-dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavLink to="/leadform" icon={FileText} label="Upload Leads" />
                <NavLink to="/myleads" icon={FolderOpen} label="My Leads" />
                <NavLink to="/myreport" icon={ServerCrash} label="My Report" />
                {/* Special Access: Only for Employee ID AT014 */}
                {employeeId?.trim().toUpperCase() === "AT014" && (
                  <NavLink to="/share-links" icon={CloudUpload} label="Share Links" />
                )}
                <NavLink to="/my-links" icon={CloudDownload} label="My Links" />
                <NavLink to="/industry-type" icon={Briefcase} label="Industry Types" />
              </>
            )}
            {role === "admin" && (
              <>
                <NavLink to="/admin-dashboard" icon={LayoutDashboard} label="Admin Dashboard" />
                <NavLink to="/forward-leads" icon={Send} label="Forward Leads" />
                <NavLink to="/add-employee" icon={UserPlus} label="Add Employee" />
                <NavLink to="/all-leads" icon={FileText} label="All Leads" />
                <NavLink to="/set-targets" icon={Sparkles} label="Set Targets" />
                <NavLink to="/share-links" icon={CloudUpload} label="Share Links" />
                <NavLink to="/reports" icon={ServerCrash} label="Reports" />
                <NavLink to="/employees" icon={Users} label="All Employees" />
                <NavLink to="/industry-types" icon={Briefcase} label="Industry Types" />
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => {
                localStorage.removeItem("role");
                localStorage.removeItem("token");
                localStorage.removeItem("fullName");
                window.location.href = "/";
              }}
              className={`w-full flex items-center ${isExpanded ? "justify-center gap-2" : "justify-center"
                } bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium`}
            >
              <LogOut className="w-5 h-5" />
              {isExpanded && "Logout"}
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main
        className={`flex-1 overflow-y-auto ${!hideSidebar ? (isExpanded ? "ml-64" : "ml-20") : ""
          }`}
      >
        {children}
      </main>
    </div>
  );
}

export default Layout;