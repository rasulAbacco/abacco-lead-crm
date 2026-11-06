// Login session. "Remember me" keeps it in localStorage (stays signed in after the
// browser closes); otherwise sessionStorage (signed out when the browser closes).
const KEYS = ["token", "role", "employeeId", "fullName"];

const store = () =>
  localStorage.getItem("token") ? localStorage : sessionStorage;

export const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

export function getSession() {
  const token = getToken();
  if (!token) return null;
  const s = store();
  return {
    token,
    role: (s.getItem("role") || "").toUpperCase(),
    employeeId: s.getItem("employeeId"),
    fullName: s.getItem("fullName"),
  };
}

export function saveSession(
  { token, role, employeeId, fullName },
  remember = true,
) {
  clearSession();
  const s = remember ? localStorage : sessionStorage;
  s.setItem("token", token);
  s.setItem("role", role);
  s.setItem("employeeId", employeeId);
  s.setItem("fullName", fullName);
  // "What's new" popup is shown once per login
  sessionStorage.setItem("showWhatsNew", "1");
}

export function clearSession() {
  KEYS.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
  sessionStorage.removeItem("showWhatsNew");
}

export const isAdmin = () => getSession()?.role === "ADMIN";
