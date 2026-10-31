// Login session stored in localStorage.
const KEYS = ["token", "role", "employeeId", "fullName"];

export const getToken = () => localStorage.getItem("token");

export function getSession() {
  const token = getToken();
  if (!token) return null;
  return {
    token,
    role: (localStorage.getItem("role") || "").toUpperCase(),
    employeeId: localStorage.getItem("employeeId"),
    fullName: localStorage.getItem("fullName"),
  };
}

export function saveSession({ token, role, employeeId, fullName }) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("employeeId", employeeId);
  localStorage.setItem("fullName", fullName);
  // "What's new" popup is shown once per login
  sessionStorage.setItem("showWhatsNew", "1");
}

export function clearSession() {
  KEYS.forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem("showWhatsNew");
}

export const isAdmin = () => getSession()?.role === "ADMIN";
