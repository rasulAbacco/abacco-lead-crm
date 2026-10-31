import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";
import { getSession } from "./lib/session";
import Login from "./pages/Login";

// Pages load on demand so the first screen is small and fast.
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const LeadForm = lazy(() => import("./pages/employee/LeadForm"));
const MyLeads = lazy(() => import("./pages/employee/MyLeads"));
const MyReport = lazy(() => import("./pages/employee/MyReport"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const LeadReview = lazy(() => import("./pages/admin/LeadReview"));
const AllLeads = lazy(() => import("./pages/admin/AllLeads"));
const EmployeeLeads = lazy(() => import("./pages/admin/EmployeeLeads"));
const Employees = lazy(() => import("./pages/admin/Employees"));
const Targets = lazy(() => import("./pages/admin/Targets"));
const Incentives = lazy(() => import("./pages/admin/Incentives"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const DataRetention = lazy(() => import("./pages/admin/DataRetention"));
const LoginHistory = lazy(() => import("./pages/admin/LoginHistory"));
const AllowedIPs = lazy(() => import("./pages/admin/AllowedIPs"));
const Attendance = lazy(() => import("./pages/admin/Attendance"));

function Guard({ role, children }) {
  const s = getSession();
  if (!s) return <Navigate to="/" replace />;
  if (role && s.role !== role) return <Navigate to={s.role === "ADMIN" ? "/admin-dashboard" : "/employee-dashboard"} replace />;
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<Guard><Layout /></Guard>}>
        {/* Employee */}
        <Route path="/employee-dashboard" element={<Guard role="EMPLOYEE"><EmployeeDashboard /></Guard>} />
        <Route path="/leadform" element={<Guard role="EMPLOYEE"><LeadForm /></Guard>} />
        <Route path="/myleads" element={<Guard role="EMPLOYEE"><MyLeads /></Guard>} />
        <Route path="/myreport" element={<Guard role="EMPLOYEE"><MyReport /></Guard>} />

        {/* Admin */}
        <Route path="/admin-dashboard" element={<Guard role="ADMIN"><AdminDashboard /></Guard>} />
        <Route path="/lead-review" element={<Guard role="ADMIN"><LeadReview /></Guard>} />
        <Route path="/forward-leads" element={<Navigate to="/lead-review" replace />} />
        <Route path="/all-leads" element={<Guard role="ADMIN"><AllLeads /></Guard>} />
        <Route path="/employee/:employeeId" element={<Guard role="ADMIN"><EmployeeLeads /></Guard>} />
        <Route path="/employees" element={<Guard role="ADMIN"><Employees /></Guard>} />
        <Route path="/add-employee" element={<Navigate to="/employees?add=1" replace />} />
        <Route path="/set-targets" element={<Guard role="ADMIN"><Targets /></Guard>} />
        <Route path="/incentives" element={<Guard role="ADMIN"><Incentives /></Guard>} />
        <Route path="/reports" element={<Guard role="ADMIN"><Reports /></Guard>} />
        <Route path="/attendance" element={<Guard role="ADMIN"><Attendance /></Guard>} />
        <Route path="/data-retention" element={<Guard role="ADMIN"><DataRetention /></Guard>} />
        <Route path="/admin/login-history" element={<Guard role="ADMIN"><LoginHistory /></Guard>} />
        <Route path="/admin/allowed-ips" element={<Guard role="ADMIN"><AllowedIPs /></Guard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
