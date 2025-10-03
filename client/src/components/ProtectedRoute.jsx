import React from "react";
import { Navigate } from "react-router-dom";

// Helper to get role
const getRole = () => localStorage.getItem("role")?.toLowerCase();

export default function ProtectedRoute({ children, role }) {
  const currentRole = getRole();
  if (currentRole !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
