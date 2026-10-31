// API client with a small in-memory cache.
// Data is fetched once and reused while you move between pages (5 min by default).
// Any change you make (upload, edit, status...) clears the related cache so the
// next screen shows fresh data. "Refresh" buttons force a reload.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getToken, clearSession } from "./session";

const BASE = `${import.meta.env.VITE_API_BASE_URL || ""}/api`;
const DEFAULT_TTL = 5 * 60 * 1000;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function handleUnauthorized(path) {
  if (path.startsWith("/auth/")) return;
  clearSession();
  clearCache();
  if (window.location.pathname !== "/") window.location.href = "/?expired=1";
}

export async function api(path, { method = "GET", body, raw = false } = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) handleUnauthorized(path);
  if (raw && res.ok) return res;
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : null;
  if (!res.ok) throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  return data;
}

/** Download a file (Excel) from the API and save it. */
export async function download(path, fallbackName = "download.xlsx") {
  const res = await api(path, { raw: true });
  const cd = res.headers.get("content-disposition") || "";
  const name = cd.match(/filename="?([^"]+)"?/)?.[1] || fallbackName;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ------------------------------------------------------------------ cache */
const store = new Map(); // key -> { data, error, at, promise }
const listeners = new Set();
let version = 0;
const notify = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function load(path, force = false) {
  const entry = store.get(path);
  if (!force && entry?.promise) return entry.promise;
  const promise = api(path)
    .then((data) => {
      store.set(path, { data, at: Date.now() });
      notify();
      return data;
    })
    .catch((error) => {
      store.set(path, { ...store.get(path), error, promise: null, at: Date.now() });
      notify();
      throw error;
    });
  store.set(path, { ...entry, promise });
  notify();
  return promise;
}

/**
 * Mark cached entries as stale (path starts with one of the prefixes).
 * Screens keep showing the old data while the fresh copy loads in the background.
 */
export function invalidate(...prefixes) {
  for (const [key, entry] of [...store.entries()]) {
    if (prefixes.some((p) => key.startsWith(p))) {
      if (entry.data !== undefined) store.set(key, { data: entry.data, at: 0 });
      else store.delete(key);
    }
  }
  notify();
}

/** Forget everything (used on login/logout). */
export function clearCache() {
  store.clear();
  notify();
}

/**
 * useApi("/leads/mine") -> { data, error, loading, refreshing, reload }
 * Pass null as path to skip.
 */
export function useApi(path, { ttl = DEFAULT_TTL, keepPrevious = false } = {}) {
  useSyncExternalStore(subscribe, () => version);
  const prev = useRef();
  let entry = path ? store.get(path) : undefined;
  if (entry?.data !== undefined) prev.current = entry.data;
  else if (keepPrevious && prev.current !== undefined && path) entry = { ...entry, data: prev.current, promise: entry?.promise };
  const stale = !entry || (!entry.promise && Date.now() - (entry.at || 0) > ttl);

  useEffect(() => {
    if (path && stale && !entry?.promise) load(path).catch(() => {});
  }, [path, stale, entry?.promise]);

  const reload = useCallback(() => (path ? load(path, true).catch(() => {}) : undefined), [path]);
  return {
    data: entry?.data,
    error: entry?.data === undefined ? entry?.error : null,
    loading: !!path && entry?.data === undefined && !entry?.error,
    refreshing: !!entry?.promise && entry?.data !== undefined,
    reload,
  };
}

/** Run a mutation and clear the given cache prefixes afterwards. */
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (path, { method = "POST", body, invalidates = [] } = {}) => {
    setBusy(true);
    try {
      const data = await api(path, { method, body });
      if (invalidates.length) invalidate(...invalidates);
      return data;
    } finally {
      setBusy(false);
    }
  }, []);
  return { run, busy };
}

/** Cache prefixes that depend on lead data */
export const LEAD_KEYS = ["/leads", "/employees/stats", "/employees/me", "/incentives/leaderboard", "/incentives/summary", "/incentives/progress", "/reports"];
