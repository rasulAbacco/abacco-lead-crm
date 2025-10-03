import React from "react";
import { Users, Target, Award, Activity } from "lucide-react";
import StatCard from "./StatCard";

export default function StatsGrid({ totalMonthlyLeads, avgLeads, achievedCount, topPerformer, employeesLength }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Leads"
        value={totalMonthlyLeads}
        icon={Activity}
        color="bg-gradient-to-br from-indigo-500 to-indigo-600"
      />
      <StatCard
        title="Avg per Employee"
        value={avgLeads}
        icon={Users}
        color="bg-gradient-to-br from-purple-500 to-purple-600"
      />
      <StatCard
        title="Target Achievers"
        value={`${achievedCount}/${employeesLength}`}
        icon={Target}
        color="bg-gradient-to-br from-pink-500 to-pink-600"
      />
      <StatCard
        title="Top Performer"
        value={topPerformer.monthlyLeads}
        icon={Award}
        trend="up"
        trendValue={topPerformer.name.split(" ")[0]}
        color="bg-gradient-to-br from-amber-500 to-amber-600"
      />
    </div>
  );
}
