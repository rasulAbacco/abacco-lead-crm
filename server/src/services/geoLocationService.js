import axios from "axios";

export async function getGeoLocation(ip) {
    try {
        // Skip localhost / private IP
        if (!ip || ip === "127.0.0.1" || ip === "::1") {
            return {
                location: "Localhost",
                latitude: null,
                longitude: null,
                isp: "Local Network",
            };
        }

        const response = await axios.get(`https://ipapi.co/${ip}/json/`);

        const data = response.data;

        return {
            location: `${data.city || ""}, ${data.country_name || ""}`.trim(),
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            isp: data.org || null,
        };
    } catch (error) {
        console.error("GeoLocation lookup failed:", error.message);

        return {
            location: null,
            latitude: null,
            longitude: null,
            isp: null,
        };
    }
}