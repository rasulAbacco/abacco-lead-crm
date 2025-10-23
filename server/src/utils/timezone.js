import { toZonedTime, fromZonedTime } from "date-fns-tz";

const USA_TZ = "America/New_York";

// 🕐 Get current date/time in US timezone
export function getUSADateTime() {
    // "toZonedTime" replaces "utcToZonedTime"
    return toZonedTime(new Date(), USA_TZ);
}

// 📆 Get start of today (midnight) in US timezone, converted to UTC for DB comparison
export function getUSATodayRange() {
    const now = getUSADateTime();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    return {
        // "fromZonedTime" replaces "zonedTimeToUtc"
        start: fromZonedTime(startOfDay, USA_TZ),
        end: fromZonedTime(endOfDay, USA_TZ),
    };
}
