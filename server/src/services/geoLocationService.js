// IP -> location lookup for login history. Never blocks login for more than 2s.
const PRIVATE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|localhost)/;

export async function getGeoLocation(ip) {
  const empty = { location: null, latitude: null, longitude: null, isp: null };
  if (!ip || PRIVATE.test(ip)) return { ...empty, location: "Local network" };
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return empty;
    const d = await res.json();
    return {
      location: [d.city, d.country_name].filter(Boolean).join(", ") || null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      isp: d.org ?? null,
    };
  } catch {
    return empty;
  }
}
