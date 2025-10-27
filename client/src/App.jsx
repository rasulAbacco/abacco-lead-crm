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

function App() {
  return (
    <Routes>
      {/* Login Page */}
      <Route path="/" element={<Layout><Login /></Layout>} />
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
            <ProtectedRoute role="admin">
              <ShareLink/>
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
  );
}

export default App;
