export function calculateDistributionProgress({
  leads,
  target,
  associationPercent,
  attendeesPercent,
  industryPercent,
}) {
  const associationLeads = leads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("association"),
  ).length;

  const attendeesLeads = leads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("attendee"),
  ).length;

  const industryLeads = leads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("industry"),
  ).length;

  const associationTarget = Math.round((target * associationPercent) / 100);
  const attendeesTarget = Math.round((target * attendeesPercent) / 100);
  const industryTarget = Math.round((target * industryPercent) / 100);

  const achieved =
    Math.min(associationLeads, associationTarget) +
    Math.min(attendeesLeads, attendeesTarget) +
    Math.min(industryLeads, industryTarget);

  const totalTarget = associationTarget + attendeesTarget + industryTarget;

  const achievementRate =
    totalTarget > 0 ? Math.round((achieved / totalTarget) * 100) : 0;

  return {
    associationLeads,
    attendeesLeads,
    industryLeads,
    achievementRate,
  };
}
