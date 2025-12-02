// src/components/IncentivePlan.jsx
import React from "react";
import { Users, Globe, Building2, TrendingUp, CheckCircle2 } from "lucide-react";

// 1. Separation of Data for easier maintenance
const INCENTIVE_DATA = [
    {
        id: "us-attendees",
        title: "US Attendees (1500+)",
        description: "High volume US-based participant targets",
        icon: <Users className="w-6 h-6 text-blue-600" />,
        accentColor: "border-t-blue-500",
        bgAccent: "bg-blue-50",
        tiers: [
            { label: "7 qualified leads", amount: 500 },
            { label: "10 qualified leads", amount: 1000 },
            { label: "15 qualified leads", amount: 1500 },
        ],
    },
    {
        id: "mixed-leads",
        title: "Mixed Leads",
        description: "Other regions + US (<1500 attendees)",
        icon: <Globe className="w-6 h-6 text-purple-600" />,
        accentColor: "border-t-purple-500",
        bgAccent: "bg-purple-50",
        tiers: [
            { label: "10 qualified mixed leads", amount: 500 },
            { label: "15 qualified mixed leads", amount: 1000 },
        ],
    },
    {
        id: "association-leads",
        title: "US Association Leads",
        description: "Specialized association targets",
        icon: <Building2 className="w-6 h-6 text-orange-600" />,
        accentColor: "border-t-orange-500",
        bgAccent: "bg-orange-50",
        tiers: [
            { label: "12 qualified association leads", amount: 500 },
            { label: "18 qualified association leads", amount: 1000 },
        ],
    },
];

const IncentiveCard = ({ data }) => (
    <div
        className={`relative flex flex-col h-full bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden ${data.accentColor} border-t-4`}
    >
        {/* Card Header */}
        <div className="p-6 pb-4">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${data.bgAccent}`}>
                    {data.icon}
                </div>
                <div className="flex items-center space-x-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                    <TrendingUp className="w-3 h-3" />
                    <span>Incentive</span>
                </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{data.description}</p>
        </div>

        {/* Tiers List */}
        <div className="px-6 pb-6 flex-1">
            <div className="space-y-3">
                {data.tiers.map((tier, idx) => (
                    <div
                        key={idx}
                        className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all"
                    >
                        <div className="flex items-center space-x-3">
                            <CheckCircle2 className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                            <span className="text-sm font-medium text-gray-700">
                                {tier.label}
                            </span>
                        </div>
                        <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-md">
                            <span className="text-sm font-bold">₹{tier.amount.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default function IncentivePlan() {
    return (
        <div className=" bg-gray-50/50 p-2">
            <div className=" mx-auto">
                {/* Page Header */}
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Performance Incentives
                    </h2>
                    <p className="mt-2 text-gray-700 text-lg">
                        Track your targets and unlock rewards based on lead qualification.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {INCENTIVE_DATA.map((plan) => (
                        <IncentiveCard key={plan.id} data={plan} />
                    ))}
                </div>
            </div>
        </div>
    );
}