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
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverTimer, setHoverTimer] = useState(null);
  const sidebarRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`group flex items-center ${
        isExpanded ? "gap-3 px-4" : "justify-center px-0"
      } py-3 rounded-xl transition-all duration-200 ${
        isActive(to)
          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
          : "text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600"
      }`}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 ${
          isActive(to) ? "text-white" : "text-gray-500 group-hover:text-indigo-600"
        }`}
      />

      
   
      {/* Only show text when expanded */}
      {isExpanded && <span className="font-medium flex-1">{label}</span>}
      {isExpanded && isActive(to) && <ChevronRight className="w-4 h-4" />}
    </Link>
  );

  // Collapse after 2 seconds if not hovered or clicked outside
  useEffect(() => {
    if (isExpanded) {
      const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          setIsExpanded(false);
        }
      };
      document.addEventListener("click", handleClickOutside);

      const timer = setTimeout(() => {
        setIsExpanded(false);
      },2000);
      setHoverTimer(timer);

      return () => {
        document.removeEventListener("click", handleClickOutside);
        clearTimeout(timer);
      };
    }
  }, [isExpanded]);

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {!hideSidebar && (
        <aside
          ref={sidebarRef}
          onMouseEnter={() => {
            clearTimeout(hoverTimer);
            setIsExpanded(true);
          }}
          onMouseLeave={() => {
            const timer = setTimeout(() => setIsExpanded(false));
            setHoverTimer(timer);
          }}
          className={`${
            isExpanded ? "w-72" : "w-20"
          } h-screen bg-white border-r border-gray-200 flex flex-col shadow-xl fixed left-0 top-0 transition-all duration-300 ease-in-out overflow-hidden`}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
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
            className={`p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center ${
              isExpanded ? "gap-3" : "justify-center"
            }`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
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
                  {role === "admin" ? "Administrator" : "Team Member"}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {role === "employee" && (
              <>
                <NavLink to="/employee-dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavLink to="/leadform" icon={FileText} label="Lead Management" />
                <NavLink to="/myleads" icon={FolderOpen} label="My Leads" />
                <NavLink to="/myreport" icon={ServerCrash} label="My Report" />
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
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem("role");
                localStorage.removeItem("token");
                localStorage.removeItem("fullName");
                window.location.href = "/";
              }}
              className={`w-full flex items-center ${
                isExpanded ? "justify-center gap-2" : "justify-center"
              } bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium`}
            >
              <LogOut className="w-5 h-5" />
              {isExpanded && "Logout"}
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main
        className={`flex-1 overflow-y-auto ${
          !hideSidebar ? (isExpanded ? "ml-72" : "ml-20") : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export default Layout;
