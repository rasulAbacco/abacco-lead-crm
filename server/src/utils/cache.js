// In-memory cache for read-heavy endpoints (dashboards, lists, leaderboards).
// Any write to leads/targets/incentives/teams clears the related keys, so
// users always see fresh data after a change but the DB is hit only once
// per TTL for repeated reads.
import NodeCache from "node-cache";
import { config } from "../config.js";

const cache = new NodeCache({ stdTTL: config.cacheTtlSeconds, checkperiod: 120, useClones: false });
const inflight = new Map();

/** Return cached value for key, or compute it once (concurrent callers share the same promise). */
export async function remember(key, fn, ttl) {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    try {
      const value = await fn();
      cache.set(key, value, ttl ?? config.cacheTtlSeconds);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/** Remove every key starting with one of the given prefixes. */
export function invalidate(...prefixes) {
  const keys = cache.keys().filter((k) => prefixes.some((p) => k.startsWith(p)));
  if (keys.length) cache.del(keys);
}

export function flushAll() {
  cache.flushAll();
}

/** Cache groups */
export const CK = {
  leads: "leads:", // anything derived from leads
  employees: "emp:",
  incentives: "inc:",
  teams: "team:",
  system: "sys:",
};
