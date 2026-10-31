// Demo / test data for Abacco Lead CRM v2.
//
//   npm run seed                       -> only runs on an empty database (no leads)
//   SEED_FORCE=true npm run seed       -> removes ALL existing leads first, then seeds
//   SEED_ALLOWED_IP=103.x.x.x npm run seed   -> also allows your office IP to log in
//
// Creates:
//   1 admin      admin@gmail.com / 123456
//   10 employees emp1@gmail.com … emp10@gmail.com / 123456
//   500 leads over the last 3 months (current month + 2 before), Mon–Sat only,
//   with mixed lead types, countries and statuses; targets + lead mix per employee;
//   one incentive plan; one team; allowed IPs 127.0.0.1 and ::1 for local login;
//   1 biometric machine, cards for all 10, ~2 months of night-shift punches + clock-ins.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { fromZonedTime } from "date-fns-tz";
import prisma from "../src/prismaClient.js";

const TZ = "America/Chicago";
const PASSWORD = "123456";
const LEAD_COUNT = 500;
const MONTHS = 3;

// deterministic random so every run gives the same data
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));

const EMPLOYEES = [
  ["AT101", "Aarav Sharma", 60],
  ["AT102", "Priya Nair", 55],
  ["AT103", "Rahul Verma", 50],
  ["AT104", "Sneha Rao", 50],
  ["AT105", "Vikram Iyer", 45],
  ["AT106", "Ananya Gupta", 45],
  ["AT107", "Karthik Reddy", 40],
  ["AT108", "Meera Pillai", 40],
  ["AT109", "Rohan Desai", 35],
  ["AT110", "Divya Menon", 35],
];

const LEAD_TYPES = [
  ["Association Lead", 35],
  ["Attendees Lead", 30],
  ["Industry Lead", 20],
  ["Member Attendees", 15],
];
const COUNTRIES = [["USA", 55], ["Canada", 12], ["UK", 12], ["Australia", 8], ["Germany", 5], ["India", 4], ["Ireland", 4]];
const STATUSES = [["ACTIVE", 30], ["NO_RESPONSE", 25], ["LEAVE_OUT", 15], ["PENDING", 30]];
const EVENTS = [
  "National Dental Expo", "HealthTech Summit", "Global Logistics Forum", "Retail Innovation Week",
  "American Nurses Conference", "Construction & Builders Show", "FinTech World Congress",
  "Pet Industry Expo", "Hospitality Leaders Meet", "Solar Energy Convention", "AgriTech Fair",
  "Insurance Brokers Association", "Manufacturing Excellence Expo", "Real Estate Investors Summit",
];
const FIRST = ["James", "Mary", "Robert", "Linda", "Michael", "Sarah", "David", "Karen", "Daniel", "Emily", "Mark", "Laura", "Paul", "Nancy", "Steven", "Lisa"];
const LAST = ["Smith", "Johnson", "Brown", "Miller", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Clark", "Lewis", "Walker", "Hall"];
const DOMAINS = ["eventsco", "expopros", "summitgroup", "tradeshowhub", "meetplanners", "assocworld", "industrylink", "confcentral"];

function weighted(list) {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of list) if ((r -= w) < 0) return v;
  return list[0][0];
}

/** Central-time calendar parts for "now" */
function centralNow() {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}

/** Working days (Mon–Sat) from the 1st of (current month - 2) up to today, Central time */
function workingDays() {
  const { y, m, d } = centralNow();
  const start = new Date(Date.UTC(y, m - 1 - (MONTHS - 1), 1));
  const end = new Date(Date.UTC(y, m - 1, d));
  const days = [];
  for (let t = start; t <= end; t = new Date(t.getTime() + 86400000)) {
    if (t.getUTCDay() !== 0) days.push(t.toISOString().slice(0, 10));
  }
  return days;
}

const atCentral = (day, h, min) => fromZonedTime(`${day}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`, TZ);

async function main() {
  const existing = await prisma.lead.count();
  if (existing > 0 && process.env.SEED_FORCE !== "true") {
    console.log(`Database already has ${existing} leads. Nothing changed.`);
    console.log("Run with SEED_FORCE=true to delete ALL leads and seed again.");
    return;
  }
  if (existing > 0) {
    const { count } = await prisma.lead.deleteMany({});
    console.log(`• Removed ${count} existing leads`);
  }

  const hash = await bcrypt.hash(PASSWORD, 10);

  // ---- admin
  await prisma.employee.upsert({
    where: { email: "admin@gmail.com" },
    update: { password: hash, role: "ADMIN", isActive: true, fullName: "Admin" },
    create: { employeeId: "AT100", fullName: "Admin", email: "admin@gmail.com", password: hash, role: "ADMIN", joiningDate: new Date("2023-01-02") },
  });

  // ---- employees + targets + lead mix
  const mixes = [
    [40, 30, 20, 10], [35, 35, 15, 15], [50, 30, 10, 10], [30, 30, 30, 10], [40, 40, 20, 0],
    [25, 35, 25, 15], [45, 25, 20, 10], [30, 40, 20, 10], [50, 50, 0, 0], [35, 30, 20, 15],
  ];
  for (const [i, [employeeId, fullName, target]] of EMPLOYEES.entries()) {
    const email = `emp${i + 1}@gmail.com`;
    await prisma.employee.upsert({
      where: { employeeId },
      update: { fullName, email, password: hash, role: "EMPLOYEE", target, isActive: true },
      create: { employeeId, fullName, email, password: hash, role: "EMPLOYEE", target, joiningDate: new Date(Date.UTC(2023 + (i % 3), (i * 2) % 12, 1)) },
    });
    const [a, at, ind, mem] = mixes[i];
    const mix = { associationPercent: a, attendeesPercent: at, industryPercent: ind, memberAttendeesPercent: mem };
    await prisma.employeeLeadTarget.upsert({ where: { employeeId }, update: mix, create: { employeeId, ...mix } });
  }
  console.log(`• Admin + ${EMPLOYEES.length} employees ready (password ${PASSWORD})`);

  // ---- leads (busier employees get a bigger share)
  const days = workingDays();
  const byTarget = EMPLOYEES.map((e) => [e, e[2]]); // weight = monthly target
  const leads = [];
  for (let n = 0; n < LEAD_COUNT; n++) {
    const e = weighted(byTarget);
    const day = pick(days);
    const leadType = weighted(LEAD_TYPES);
    const country = leadType === "Industry Lead" && rand() < 0.3 ? "USA" : weighted(COUNTRIES);
    const event = pick(EVENTS);
    const first = pick(FIRST);
    const last = pick(LAST);
    const domain = pick(DOMAINS);
    const createdAt = atCentral(day, between(8, 18), between(0, 59));
    const status = weighted(STATUSES);
    const isAttendee = /attend/i.test(leadType);
    const slug = event.toLowerCase().replace(/[^a-z]+/g, "");

    leads.push({
      employeeId: e[0],
      agentName: `${first} ${last}`,
      clientEmail: `${first.toLowerCase()}.${last.toLowerCase()}${n + 1}@${domain}.com`,
      leadEmail: `${e[1].split(" ")[0].toLowerCase()}.leads@abaccotech.com`,
      ccEmail: rand() < 0.3 ? `info@${domain}.com` : "",
      subjectLine: `${event.toLowerCase()} ${day.slice(0, 4)} attendee list`,
      emailPitch: `Hi ${first},\n\nWe have the verified contact list for ${event}. Would you like counts and pricing?\n\nRegards,\n${e[1]}`,
      emailResponce: status === "NO_RESPONSE" || rand() < 0.4 ? null : `Hi, yes please share counts and pricing for ${event}. Thanks, ${first}`,
      website: `www.${domain}.com`,
      phone: `+1 ${between(201, 989)}-${between(200, 999)}-${String(between(0, 9999)).padStart(4, "0")}`,
      country,
      leadType,
      link: `https://www.${slug}.com`,
      attendeesCount: isAttendee ? between(80, 2500) : null,
      date: atCentral(day, 12, 0), // contact date = same day, noon Central
      createdAt,
      status,
      statusUpdatedAt: status === "PENDING" ? null : new Date(createdAt.getTime() + between(1, 48) * 3600000),
    });
  }
  // Recent days are more likely still pending, like real life
  const recent = days.slice(-3);
  for (const l of leads) {
    if (recent.some((d) => l.createdAt >= atCentral(d, 0, 0)) && rand() < 0.6) {
      l.status = "PENDING";
      l.statusUpdatedAt = null;
    }
  }
  await prisma.lead.createMany({ data: leads });
  console.log(`• ${leads.length} leads created from ${days[0]} to ${days[days.length - 1]} (Mon–Sat)`);

  // ---- incentive plan (only if none exists)
  if ((await prisma.incentivePlan.count()) === 0) {
    await prisma.incentivePlan.create({
      data: {
        title: "Daily lead incentive",
        description: "Paid per day for qualifying uploads",
        icon: "award", accentColor: "blue", bgAccent: "blue",
        validFrom: atCentral(days[0], 0, 0),
        rules: {
          create: [
            { leadType: "Association", leadsRequired: 3, amount: 300 },
            { leadType: "Association", leadsRequired: 5, amount: 600 },
            { leadType: "Attendees", country: "USA, Canada", attendeesMinCount: 500, leadsRequired: 2, amount: 250 },
            { leadType: "Industry", leadsRequired: 2, amount: 200 },
            { leadType: "Member Attendees", leadsRequired: 2, amount: 200 },
          ],
        },
      },
    });
    console.log("• Incentive plan created");
  }

  // ---- one team (only if none exists)
  if ((await prisma.team.count()) === 0) {
    await prisma.team.create({
      data: {
        name: "Team Alpha",
        leaderId: "AT101",
        targetValue: 150000,
        members: { create: ["AT102", "AT103", "AT104", "AT105"].map((employeeId) => ({ employeeId })) },
      },
    });
    console.log("• Team Alpha created (leader AT101)");
  }

  // ---- attendance: one biometric machine, cards for all 10, ~2 months of night-shift punches + clock-ins
  await seedAttendance(days);

  // ---- allowed IPs so you can log in
  const ips = ["127.0.0.1", "::1", ...(process.env.SEED_ALLOWED_IP ? process.env.SEED_ALLOWED_IP.split(",").map((s) => s.trim()) : [])];
  for (const ip of ips) {
    await prisma.allowedIP.upsert({ where: { ipAddress: ip }, update: { status: true }, create: { ipAddress: ip, label: "Seed" } });
  }
  console.log(`• Allowed IPs: ${ips.join(", ")}`);

  console.log("\n✅ Seed complete");
  console.log("   Admin:     admin@gmail.com / 123456");
  console.log("   Employees: emp1@gmail.com … emp10@gmail.com / 123456");
  console.log("   Login still needs the emailed OTP code (or MASTER_OTP if you set one).");
}

/* Night shift in India ≈ 5:30 PM – 3:30 AM IST (one US Central workday). */
async function seedAttendance(leadDays) {
  const IST = "Asia/Kolkata";
  const rules = ["ALTERNATE", "ALTERNATE", "WORKING", "OFF", "ALTERNATE", "WORKING", "ALTERNATE", "OFF", "ALTERNATE", "WORKING"];
  for (const [i, [employeeId]] of EMPLOYEES.entries()) {
    await prisma.employee.update({ where: { employeeId }, data: { saturdayRule: rules[i] } });
  }

  const device = await prisma.biometricDevice.upsert({
    where: { deviceCode_location: { deviceCode: "1", location: "Bengaluru Office" } },
    update: { isActive: true },
    create: { deviceCode: "1", serialNo: "CQUJ2341", deviceName: "Main entrance", location: "Bengaluru Office" },
  });
  await prisma.biometricPunch.deleteMany({});
  await prisma.workSession.deleteMany({});
  await prisma.biometricMapping.deleteMany({});
  const mappings = {};
  for (const [i, [employeeId]] of EMPLOYEES.entries()) {
    mappings[employeeId] = await prisma.biometricMapping.create({ data: { employeeId, enrollmentId: String(101 + i), location: device.location } });
  }

  // last ~2 months of Central-time days (current + previous month)
  const { y, m } = centralNow();
  const prevStart = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}-01`;
  const attDays = leadDays.filter((d) => d >= prevStart);
  const todayKey = leadDays[leadDays.length - 1];
  // midnight IST of the (day + addDays), plus h hours and min minutes (min may exceed 59)
  const istAt = (dayKey, h, min, addDays = 0) => {
    const t = new Date(`${dayKey}T00:00:00Z`);
    t.setUTCDate(t.getUTCDate() + addDays);
    const midnight = fromZonedTime(`${t.toISOString().slice(0, 10)}T00:00:00`, IST);
    return new Date(midnight.getTime() + (h * 60 + min) * 60000);
  };

  const punches = [];
  const sessions = [];
  for (const [i, [employeeId]] of EMPLOYEES.entries()) {
    const rule = rules[i];
    for (const day of attDays) {
      const date = new Date(`${day}T12:00:00Z`);
      const wd = date.getUTCDay();
      const nth = Math.floor((date.getUTCDate() - 1) / 7) + 1;
      const satOff = wd === 6 && (rule === "OFF" || (rule === "ALTERNATE" && [2, 4].includes(nth)));
      if (satOff && rand() > 0.1) continue; // occasionally someone works on their off Saturday
      const r = rand();
      if (r < 0.06) continue; // absent
      const isToday = day === todayKey;
      // IST shift: in ~17:15–18:10 on the US date, out next IST day ~02:00–03:45
      const inT = istAt(day, 17, between(15, 59) + (rand() < 0.3 ? between(0, 10) : 0));
      const short = r < 0.14; // left early -> half day
      const outT = short ? istAt(day, between(22, 23), between(0, 59)) : istAt(day, between(2, 3), between(20, 50), 1);
      punches.push({ enrollmentId: mappings[employeeId].enrollmentId, deviceId: device.id, mappingId: mappings[employeeId].id, employeeId, location: device.location, punchTime: inT, punchMode: "0" });
      const missingOut = r > 0.96;
      if (!isToday && !missingOut) punches.push({ enrollmentId: mappings[employeeId].enrollmentId, deviceId: device.id, mappingId: mappings[employeeId].id, employeeId, location: device.location, punchTime: outT, punchMode: "1" });

      // system clock-in a few minutes after punching in
      const ci = new Date(inT.getTime() + between(2, 9) * 60000);
      if (isToday) {
        if (ci < new Date()) sessions.push({ employeeId, workDate: day, clockIn: ci, clockOut: null });
      } else if (rand() < 0.07) {
        sessions.push({ employeeId, workDate: day, clockIn: ci, clockOut: istAt(day, 4, 30, 1), autoClosed: true }); // forgot to clock out
      } else {
        sessions.push({ employeeId, workDate: day, clockIn: ci, clockOut: new Date(outT.getTime() - between(1, 6) * 60000) });
      }
    }
  }
  await prisma.biometricPunch.createMany({ data: punches.filter((p) => p.punchTime < new Date()) });
  await prisma.workSession.createMany({ data: sessions });
  console.log(`• Attendance: 1 device, 10 cards, ${punches.length} punches, ${sessions.length} clock-ins (${attDays[0]} → ${todayKey})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
