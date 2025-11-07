import React from "react";
import { Navigate } from "react-router-dom";

const ShareLinkAccessWrapper = ({ children }) => {
    const role = localStorage.getItem("role");
    const employeeId = localStorage.getItem("employeeId");

    // ✅ Allow admin
    if (role === "admin") return children;

    // ✅ Allow only employee AT014
    if (role === "employee" && employeeId === "AT014") return children;

    // ❌ Block everyone else
    return <Navigate to="/" />;
};

export default ShareLinkAccessWrapper;
