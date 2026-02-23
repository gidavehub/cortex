"use client";

import { motion } from "framer-motion";
import { OutreachContact, OUTREACH_TARGETS, OutreachProgram } from "@/lib/firebase-outreach";
import { TrendingUp, Target, Bell, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface OutreachStatsProps {
    contacts: OutreachContact[];
    followUps: OutreachContact[];
}

export function OutreachStats({ contacts, followUps }: OutreachStatsProps) {
    const today = format(new Date(), "yyyy-MM-dd");
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const getCount = (program: OutreachProgram, filter: "today" | "week" | "month") => {
        return contacts.filter((c) => {
            if (c.program !== program) return false;
            if (filter === "today") return c.date === today;
            const d = new Date(c.date);
            if (filter === "week") return isWithinInterval(d, { start: weekStart, end: weekEnd });
            return isWithinInterval(d, { start: monthStart, end: monthEnd });
        }).length;
    };

    const todayFollowUps = followUps.filter(
        (c) => c.followUpDate && format(c.followUpDate, "yyyy-MM-dd") <= today
    );

    const stats = [
        {
            label: "Nova Today",
            value: getCount("nova", "today"),
            target: OUTREACH_TARGETS.nova.daily,
            icon: Target,
            gradient: "from-blue-500 to-blue-600",
            bgGlow: "bg-blue-500/10",
        },
        {
            label: "Amaka AI Today",
            value: getCount("amaka_ai", "today"),
            target: OUTREACH_TARGETS.amaka_ai.daily,
            icon: TrendingUp,
            gradient: "from-purple-500 to-purple-600",
            bgGlow: "bg-purple-500/10",
        },
        {
            label: "This Week",
            value: getCount("nova", "week") + getCount("amaka_ai", "week"),
            target: (OUTREACH_TARGETS.nova.daily + OUTREACH_TARGETS.amaka_ai.daily) * 7,
            icon: Calendar,
            gradient: "from-emerald-500 to-emerald-600",
            bgGlow: "bg-emerald-500/10",
        },
        {
            label: "Follow-ups Due",
            value: todayFollowUps.length,
            target: null,
            icon: Bell,
            gradient: todayFollowUps.length > 0 ? "from-amber-500 to-orange-500" : "from-gray-400 to-gray-500",
            bgGlow: todayFollowUps.length > 0 ? "bg-amber-500/10" : "bg-gray-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => {
                const progress = stat.target ? Math.min((stat.value / stat.target) * 100, 100) : null;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50 relative overflow-hidden"
                    >
                        {/* Background glow */}
                        <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${stat.bgGlow} blur-2xl`} />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {stat.label}
                                </span>
                                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                                    <stat.icon className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-semibold text-gray-900">{stat.value}</span>
                                {stat.target && (
                                    <span className="text-sm text-gray-400 font-medium">/ {stat.target}</span>
                                )}
                            </div>

                            {/* Progress bar */}
                            {progress !== null && (
                                <div className="mt-3">
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                                            className={`h-full rounded-full bg-gradient-to-r ${stat.gradient}`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
