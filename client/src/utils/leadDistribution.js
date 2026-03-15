export function calculateDistributionProgress({
  leads,
  target,
  associationPercent = 0,
  attendeesPercent = 0,
  industryPercent = 0,
  memberAttendeesPercent = 0,
}) {

  const associationLeads = leads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("association"),
  ).length;

  const memberAttendeesLeads = leads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("member"),
  ).length;

  const attendeesLeads = leads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("attendee") &&
    !(l.leadType || "").toLowerCase().includes("member"),
  ).length;

  const industryLeads = leads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("industry"),
  ).length;

  const associationTarget = Math.round((target * associationPercent) / 100);
  const attendeesTarget = Math.round((target * attendeesPercent) / 100);
  const industryTarget = Math.round((target * industryPercent) / 100);
  const memberAttendeesTarget = Math.round(
    (target * memberAttendeesPercent) / 100,
  );

  const achieved =
    Math.min(associationLeads, associationTarget) +
    Math.min(attendeesLeads, attendeesTarget) +
    Math.min(industryLeads, industryTarget) +
    Math.min(memberAttendeesLeads, memberAttendeesTarget);

  const totalTarget = target;

const achievementRate =
  target > 0 ? Math.round((achieved / target) * 100) : 0;

  return {
    associationLeads,
    attendeesLeads,
    industryLeads,
    memberAttendeesLeads,
    achieved,
    totalTarget,
    achievementRate,
  };
}