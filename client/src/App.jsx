import React from "react";
import { Routes, Route } from "react-router-dom";

import LeadForm from "./pages/LeadForm";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/login";
import SetTarget from "./pages/SetTarget";
import ForwardLeads from "./pages/ForwardLeads";
import EmployeeDetails from "./pages/EmployeeDetails";
import LeadDetails from "./pages/LeadDetails";
import AddEmployeeForm from "./pages/AddEmployeeForm";
import EmployeeLeadsPage from "./pages/EmployeeLeadsPage";
import AllLeads from "./pages/AllLeads";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import IndustryType from "./pages/IndustryType";
import IndustryTypeEmployee from "./pages/IndustryTypeEmployee";
import AllEmployees from "./pages/AllEmployees";
import MyLeads from "./pages/MyLeads";
import ShareLink from "./pages/ShareLink";
import MyLink from "./pages/MyLink";
import MyReport from "./pages/MyReport";
import Reports from "./pages/Reports";
import ShareLinkAccessWrapper from "./components/ShareLinkAccessWrapper";
import IncentiveManagement from "./pages/IncentiveManagement";
import NewYearOverlay from "./components/NewYearOverlay";
import Maintenance from "./pages/Maintenance";

const MAINTENANCE_MODE = true;

function App() {
  if (MAINTENANCE_MODE) {
    return <Maintenance />;
  }
  return (
    <>
      <NewYearOverlay />
      <Routes>
        {/* Login Page */}
        <Route
          path="/"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />
        <Route path="/employee/:id" element={<EmployeeLeadsPage />} />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <Layout>
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/forward-leads"
          element={
            <Layout>
              <ProtectedRoute role="admin">
                <ForwardLeads />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/add-employee"
          element={
            <Layout>
              <ProtectedRoute role="admin">
                <AddEmployeeForm />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/all-leads"
          element={
            <Layout>
              <ProtectedRoute role="admin">
                <AllLeads />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/set-targets"
          element={
            <Layout>
              <ProtectedRoute role="admin">
                <SetTarget />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/reports"
          element={
            <Layout>
              <ProtectedRoute role="admin">
                <Reports />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/industry-types"
          element={
            <Layout>
              <ProtectedRoute role="admin">
                <IndustryType />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/share-links"
          element={
            <Layout>
              <ShareLinkAccessWrapper>
                <ShareLink />
              </ShareLinkAccessWrapper>
            </Layout>
          }
        />
        <Route
          path="/incentives"
          element={
            <Layout>
              <ProtectedRoute role="admin">
                <IncentiveManagement />
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/employee-dashboard"
          element={
            <Layout>
              <ProtectedRoute role="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/leadform"
          element={
            <Layout>
              <ProtectedRoute role="employee">
                <LeadForm />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/myleads"
          element={
            <Layout>
              <ProtectedRoute role="employee">
                <MyLeads />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/myreport"
          element={
            <Layout>
              <ProtectedRoute role="employee">
                <MyReport />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/my-links"
          element={
            <Layout>
              <ProtectedRoute role="employee">
                <MyLink />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/industry-type"
          element={
            <Layout>
              <ProtectedRoute role="employee">
                <IndustryTypeEmployee />
              </ProtectedRoute>
            </Layout>
          }
        />

        {/* Details */}
        <Route path="/employee/:id" element={<EmployeeDetails />} />
        <Route path="/lead/:id" element={<LeadDetails />} />
        <Route path="/employees" element={<AllEmployees />} />
      </Routes>
    </>
  );
}

export default App;
