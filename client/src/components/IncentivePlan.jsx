// client/src/components/IncentivePlan.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { Users, Globe, Building2, TrendingUp, CheckCircle2 } from "lucide-react";

const ICON_MAP = {
    Users: <Users className="w-6 h-6 text-blue-600" />,
    Globe: <Globe className="w-6 h-6 text-purple-600" />,
    Building2: <Building2 className="w-6 h-6 text-orange-600" />
};

// Group rules by lead type
const groupRules = (rules = []) => {
    return {
        Attendees: rules.filter(r => r.leadType === "Attendees"),
        Association: rules.filter(r => r.leadType === "Association"),
        Industry: rules.filter(r => r.leadType === "Industry"),
    };
};

// Card Component
const IncentiveCard = ({ data }) => {
    const ruleGroups = groupRules(data.rules || []);

    return (
        <div
            className={`relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all 
            duration-300 border border-gray-100 overflow-hidden ${data.accentColor} border-t-4`}
        >
            <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${data.bgAccent}`}>
                        {ICON_MAP[data.icon] || ICON_MAP["Users"]}
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full border">
                        <TrendingUp className="w-3 h-3" />
                        <span>Incentive Plan</span>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{data.description}</p>
            </div>

            {/* RULES SECTION */}
            <div className="px-6 pb-6 flex-1 space-y-6">

                {/* Attendees */}
                {ruleGroups.Attendees.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-blue-600 mb-2">Attendees Rules</h4>
                        <div className="space-y-2">
                            {ruleGroups.Attendees.map((r, idx) => (
                                <RuleRow key={idx} rule={r} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Association */}
                {ruleGroups.Association.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-purple-600 mb-2">Association Rules</h4>
                        <div className="space-y-2">
                            {ruleGroups.Association.map((r, idx) => (
                                <RuleRow key={idx} rule={r} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Industry */}
                {ruleGroups.Industry.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-green-600 mb-2">Industry Rules</h4>
                        <div className="space-y-2">
                            {ruleGroups.Industry.map((r, idx) => (
                                <RuleRow key={idx} rule={r} />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// Rule Row Component
const RuleRow = ({ rule }) => {
    const description =
        rule.leadType === "Attendees"
            ? `${rule.country} • Min Count ${rule.attendeesMinCount}`
            : rule.leadType === "Association"
                ? `${rule.country}`
                : rule.leadType === "Industry"
                    ? `${rule.industryDomain}`
                    : "";

    return (
        <div className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-all">
            <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                <div className="text-sm">
                    <p className="font-medium text-gray-700">{description}</p>
                    <p className="text-xs text-gray-500">{rule.leadsRequired} qualified leads</p>
                </div>
            </div>
            <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-md">
                <span className="text-sm font-bold">₹{rule.amount.toLocaleString()}</span>
            </div>
        </div>
    );
};

export default function IncentivePlan() {
    const [plans, setPlans] = useState([]);
    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchIncentives();
    }, []);

    const fetchIncentives = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_BASE}/api/incentives`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPlans(res.data); // Only active plans for employees
        } catch (error) {
            console.error("Failed to load incentives:", error);
        }
    };

    return (
        <div className="bg-gray-50/50 p-2">
            <div className="mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Performance Incentives</h2>
                    <p className="mt-2 text-gray-700 text-lg">
                        Achieve your targets and unlock rewards based on daily qualified leads.
                    </p>
                </div>

                {plans.length === 0 ? (
                    <p className="text-center text-gray-500">No incentive plans available.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <IncentiveCard key={plan.id} data={plan} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
