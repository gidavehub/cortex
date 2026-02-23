"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
    Plus, Clock, CheckCircle2, Calendar, Sun, Moon, Sparkles,
    Target, TrendingUp, Flame, Award, ArrowRight, Layers,
    Megaphone, Zap, Trophy, Star, Shield, Crown
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    isWithinInterval, differenceInDays, isToday, subDays,
    eachDayOfInterval, subMonths, parseISO
} from "date-fns";
import { Task, TASK_COLORS } from "@/lib/types/task";
import {
    WEEKLY_ACHIEVEMENTS, MONTHLY_ACHIEVEMENTS, YEARLY_ACHIEVEMENTS,
    TIER_CONFIG, Achievement
} from "@/lib/types/achievement";
import { OUTREACH_TARGETS } from "@/lib/types/outreach";
import { subscribeAllOutreach, subscribeFollowUps } from "@/lib/firebase-outreach";
import { OutreachContact } from "@/lib/types/outreach";
import { cn } from "@/lib/utils";
import {
    GoalRing, ActivityHeatmap, SkillRadar,
    ProductivityStream, WeeklyAreaChart, ScopeBarChart
} from "@/components/dashboard/DashboardCharts";

export default function DashboardPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [outreachContacts, setOutreachContacts] = useState<OutreachContact[]>([]);
    const [followUpCount, setFollowUpCount] = useState(0);

    // Time & Date
    const today = new Date();
    const dateString = format(today, "EEEE, MMMM do");
    const todaySlug = format(today, "yyyy-MM-dd");
    const currentYear = today.getFullYear();
    const currentMonth = format(today, "yyyy-MM");
    const currentWeek = getISOWeekString(today);

    // ── Fetch all tasks ──
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "users", user.uid, "tasks"),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
                updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
                deadline: d.data().deadline?.toDate?.() || undefined,
            })) as Task[];
            setTasks(fetchedTasks);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // ── Fetch outreach data ──
    useEffect(() => {
        if (!user) return;
        const unsub1 = subscribeAllOutreach(user.uid, setOutreachContacts);
        const unsub2 = subscribeFollowUps(user.uid, (items) => setFollowUpCount(items.length));
        return () => { unsub1(); unsub2(); };
    }, [user]);

    function getISOWeekString(date: Date): string {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    }

    function getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return { greeting: "Good Morning", icon: Sun, emoji: "☀️", message: "Let's make today count!" };
        if (hour < 18) return { greeting: "Good Afternoon", icon: Sun, emoji: "🌤️", message: "Keep the momentum going!" };
        return { greeting: "Good Evening", icon: Moon, emoji: "🌙", message: "Wrapping up the day?" };
    }

    const { greeting, icon: TimeIcon, emoji, message } = getTimeOfDay();

    // ── Task scopes ──
    const todayTasks = tasks.filter(t => t.scope === "day" && t.scopeKey === todaySlug);
    const weekTasks = tasks.filter(t => t.scope === "week" && t.scopeKey === currentWeek);
    const monthTasks = tasks.filter(t => t.scope === "month" && t.scopeKey === currentMonth);
    const yearTasks = tasks.filter(t => t.scope === "year" && t.scopeKey === String(currentYear));

    // ── Stats ──
    const completedToday = todayTasks.filter(t => t.status === "done").length;
    const pendingToday = todayTasks.filter(t => t.status !== "done").length;
    const todayProgress = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;
    const weekProgress = weekTasks.length > 0
        ? Math.round(weekTasks.reduce((s, t) => s + t.progress, 0) / weekTasks.length) : 0;
    const monthProgress = monthTasks.length > 0
        ? Math.round(monthTasks.reduce((s, t) => s + t.progress, 0) / monthTasks.length) : 0;
    const yearProgress = yearTasks.length > 0
        ? Math.round(yearTasks.reduce((s, t) => s + t.progress, 0) / yearTasks.length) : 0;

    // ── Streak ──
    const streak = useMemo(() => {
        let s = 0;
        const last30 = eachDayOfInterval({ start: subDays(today, 30), end: today }).reverse();
        for (const day of last30) {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasks.filter(t => t.scope === "day" && t.scopeKey === dayKey);
            if (dayTasks.some(t => t.status === "done") || isToday(day)) s++;
            else break;
        }
        return s;
    }, [tasks]);

    // ── Achievement calculations ──
    const achievementData = useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const thisWeekDone = tasks.filter(t =>
            t.status === "done" && isWithinInterval(t.updatedAt, { start: weekStart, end: weekEnd })
        );
        const thisMonthDone = tasks.filter(t =>
            t.status === "done" && isWithinInterval(t.updatedAt, { start: monthStart, end: monthEnd })
        );

        const completedDates = new Set(
            tasks.filter(t => t.status === "done").map(t => format(t.updatedAt, "yyyy-MM-dd"))
        );
        let achieveStreak = 0;
        let checkDate = new Date();
        while (completedDates.has(format(checkDate, "yyyy-MM-dd"))) {
            achieveStreak++;
            checkDate = new Date(checkDate.setDate(checkDate.getDate() - 1));
        }

        // Calculate unlocked count per tier
        let weeklyUnlocked = 0;
        let monthlyUnlocked = 0;
        let yearlyUnlocked = 0;
        let totalXP = 0;

        const getWeeklyVal = (id: string) => {
            switch (id) {
                case "streak_starter": return achieveStreak;
                case "productive_week": return thisWeekDone.length;
                case "goal_crusher": return tasks.filter(t => t.scope === "week" && t.status === "done").length > 0 ? 1 : 0;
                default: return 0;
            }
        };

        const getMonthlyVal = (id: string) => {
            switch (id) {
                case "consistent": return new Set(thisMonthDone.map(t => format(t.updatedAt, "yyyy-MM-dd"))).size;
                case "progress_master":
                    const mg = tasks.filter(t => t.scope === "month");
                    return mg.length > 0 ? Math.round(mg.reduce((a, t) => a + t.progress, 0) / mg.length) : 0;
                case "perfect_week": return thisWeekDone.length >= 10 ? 100 : Math.min(thisWeekDone.length * 10, 99);
                case "overachiever": return thisMonthDone.length;
                case "deadline_keeper":
                    const wd = tasks.filter(t => t.deadline);
                    const md = wd.filter(t => t.status === "done" && t.deadline && t.updatedAt <= t.deadline);
                    return wd.length > 0 ? Math.round((md.length / wd.length) * 100) : 100;
                default: return 0;
            }
        };

        WEEKLY_ACHIEVEMENTS.forEach(a => {
            if (getWeeklyVal(a.id) >= a.requirement) { weeklyUnlocked++; totalXP += a.rewardXP; }
        });
        MONTHLY_ACHIEVEMENTS.forEach(a => {
            if (getMonthlyVal(a.id) >= a.requirement) { monthlyUnlocked++; totalXP += a.rewardXP; }
        });

        const completedYearTasks = tasks.filter(t => t.createdAt.getFullYear() === now.getFullYear() && t.status === "done");
        YEARLY_ACHIEVEMENTS.forEach(a => {
            let val = 0;
            switch (a.id) {
                case "year_champion": val = tasks.filter(t => t.scope === "year" && t.status === "done").length; break;
                case "productivity_legend": val = completedYearTasks.length; break;
                case "century_club": val = new Set(completedYearTasks.map(t => format(t.updatedAt, "yyyy-MM-dd"))).size; break;
                case "diverse_achiever": val = new Set(completedYearTasks.map(t => t.scope)).size; break;
                case "streak_legend": val = achieveStreak; break;
                default: break;
            }
            if (val >= a.requirement) { yearlyUnlocked++; totalXP += a.rewardXP; }
        });

        const totalAchievements = WEEKLY_ACHIEVEMENTS.length + MONTHLY_ACHIEVEMENTS.length + YEARLY_ACHIEVEMENTS.length;
        const totalUnlocked = weeklyUnlocked + monthlyUnlocked + yearlyUnlocked;

        // Radar data
        const radarData = [
            { category: "Consistency", value: Math.min(achieveStreak * 10, 100) },
            { category: "Productivity", value: Math.min(thisWeekDone.length * 10, 100) },
            { category: "Goals", value: weekProgress },
            { category: "Deadlines", value: getMonthlyVal("deadline_keeper") },
            { category: "Streaks", value: Math.min(streak * 15, 100) },
            { category: "Diversity", value: Math.min(new Set(tasks.filter(t => t.status === "done").map(t => t.scope)).size * 25, 100) },
        ];

        return { weeklyUnlocked, monthlyUnlocked, yearlyUnlocked, totalUnlocked, totalAchievements, totalXP, radarData };
    }, [tasks, streak, weekProgress]);

    // ── Activity heatmap data ──
    const heatmapData = useMemo(() => {
        const sixMonthsAgo = subMonths(today, 6);
        const days = eachDayOfInterval({ start: sixMonthsAgo, end: today });
        return days.map(day => {
            const dayKey = format(day, "yyyy-MM-dd");
            const count = tasks.filter(t =>
                t.status === "done" && format(t.updatedAt, "yyyy-MM-dd") === dayKey
            ).length;
            return { day: dayKey, value: count };
        }).filter(d => d.value > 0);
    }, [tasks]);

    // ── Stream chart data (30 days) ──
    const streamData = useMemo(() => {
        const last30 = eachDayOfInterval({ start: subDays(today, 29), end: today });
        return last30.map(day => {
            const dayKey = format(day, "yyyy-MM-dd");
            return {
                Daily: tasks.filter(t => t.scope === "day" && t.scopeKey === dayKey && t.status === "done").length,
                Weekly: tasks.filter(t => t.scope === "week" && t.status === "done" && format(t.updatedAt, "yyyy-MM-dd") === dayKey).length,
                Monthly: tasks.filter(t => t.scope === "month" && t.status === "done" && format(t.updatedAt, "yyyy-MM-dd") === dayKey).length,
            };
        });
    }, [tasks]);

    // ── Weekly area chart data ──
    const weeklyChartData = useMemo(() => {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        return days.map(day => ({
            day: format(day, "EEE"),
            tasks: tasks.filter(t =>
                t.status === "done" && format(t.updatedAt, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
            ).length,
        }));
    }, [tasks]);

    // ── Scope bar chart data ──
    const scopeBarData = useMemo(() => [
        { scope: "Day", completed: todayTasks.filter(t => t.status === "done").length, total: todayTasks.length },
        { scope: "Week", completed: weekTasks.filter(t => t.status === "done").length, total: weekTasks.length },
        { scope: "Month", completed: monthTasks.filter(t => t.status === "done").length, total: monthTasks.length },
        { scope: "Year", completed: yearTasks.filter(t => t.status === "done").length, total: yearTasks.length },
    ], [todayTasks, weekTasks, monthTasks, yearTasks]);

    // ── Outreach stats ──
    const outreachStats = useMemo(() => {
        const todayStr = format(today, "yyyy-MM-dd");
        const novaToday = outreachContacts.filter(c => c.program === "nova" && c.date === todayStr).length;
        const amakaToday = outreachContacts.filter(c => c.program === "amaka_ai" && c.date === todayStr).length;
        return { novaToday, amakaToday };
    }, [outreachContacts]);

    // ── Next upcoming task ──
    const upcomingTask = todayTasks
        .filter(t => t.status !== "done" && t.startTime)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))[0];

    // Toggle task
    const toggleTask = async (task: Task) => {
        if (!user) return;
        const newStatus = task.status === "done" ? "pending" : "done";
        await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
            status: newStatus,
            progress: newStatus === "done" ? 100 : 0,
        });
    };

    // Motivational insight
    const getInsight = () => {
        if (completedToday >= 5) return `🔥 You're on fire! ${completedToday} tasks completed!`;
        if (pendingToday === 0 && todayTasks.length > 0) return "🎉 All tasks done! Time to relax.";
        if (weekProgress >= 80) return `📈 Week goals nearly complete at ${weekProgress}%!`;
        if (streak >= 7) return `🏆 ${streak} day streak! Keep it going!`;
        if (monthTasks.length > 0 && monthProgress < 25) return "💪 Month just started. Let's build momentum!";
        return `✨ ${message}`;
    };

    // ── Heatmap date range ──
    const heatmapFrom = format(subMonths(today, 6), "yyyy-MM-dd");
    const heatmapTo = format(today, "yyyy-MM-dd");

    return (
        <div className="space-y-6 pb-10">

            {/* ═══════════════════════════════════════════════════
                1. HERO HEADER — Personalized greeting + XP + Actions
            ═══════════════════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-8 text-white"
            >
                {/* Ambient blobs */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl" />
                <div className="absolute top-10 right-40 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

                <div className="relative z-10 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl border border-white/10">
                                {emoji}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/50 uppercase tracking-wider">{dateString}</p>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight">
                            {greeting}, <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">{user?.name?.split(" ")[0] || "there"}</span>!
                        </h1>
                        <p className="text-lg text-white/60">{getInsight()}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* XP Badge */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border border-yellow-400/30 rounded-2xl backdrop-blur-sm"
                        >
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                            <span className="font-bold text-yellow-300 text-lg">{achievementData.totalXP}</span>
                            <span className="text-yellow-400/60 text-sm font-medium">XP</span>
                        </motion.div>

                        {/* Streak Badge */}
                        {streak > 0 && (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-400/20 to-rose-400/20 border border-orange-400/30 rounded-2xl backdrop-blur-sm"
                            >
                                <Flame className="w-5 h-5 text-orange-400" />
                                <span className="font-bold text-orange-300 text-lg">{streak}</span>
                                <span className="text-orange-400/60 text-sm font-medium">day streak</span>
                            </motion.div>
                        )}

                        {/* Quick actions */}
                        <div className="flex gap-2">
                            <Link href={`/dashboard/calendar/day/${todaySlug}`}>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    className="px-5 py-3 bg-white/10 border border-white/15 rounded-2xl font-medium text-sm hover:bg-white/20 transition-all backdrop-blur-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Plan Today
                                </motion.button>
                            </Link>
                            <Link href="/dashboard/tasks">
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl font-medium text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> All Tasks
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════
                2. RADIAL PROGRESS RINGS
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-4 gap-4">
                <GoalRing
                    value={completedToday}
                    maxValue={Math.max(todayTasks.length, 1)}
                    label="Today"
                    sublabel={`${completedToday}/${todayTasks.length} tasks`}
                    color="#3b82f6"
                    trailColor="#dbeafe"
                    delay={0.1}
                />
                <GoalRing
                    value={weekProgress}
                    label="This Week"
                    sublabel={`${weekTasks.filter(t => t.status === "done").length}/${weekTasks.length} goals`}
                    color="#6366f1"
                    trailColor="#e0e7ff"
                    delay={0.15}
                />
                <GoalRing
                    value={monthProgress}
                    label="This Month"
                    sublabel={`${monthTasks.filter(t => t.status === "done").length}/${monthTasks.length} goals`}
                    color="#a855f7"
                    trailColor="#f3e8ff"
                    delay={0.2}
                />
                <GoalRing
                    value={yearProgress}
                    label="This Year"
                    sublabel={`${yearTasks.filter(t => t.status === "done").length}/${yearTasks.length} goals`}
                    color="#f43f5e"
                    trailColor="#ffe4e6"
                    delay={0.25}
                />
            </div>

            {/* ═══════════════════════════════════════════════════
                3. ACTIVITY HEATMAP
            ═══════════════════════════════════════════════════ */}
            <ActivityHeatmap data={heatmapData} from={heatmapFrom} to={heatmapTo} />

            {/* ═══════════════════════════════════════════════════
                4. STREAM CHART + SKILL RADAR
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-7">
                    <ProductivityStream
                        data={streamData}
                        keys={["Daily", "Weekly", "Monthly"]}
                    />
                </div>
                <div className="col-span-5">
                    <SkillRadar data={achievementData.radarData} />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                5. WEEKLY CHART + SCOPE BAR + ACHIEVEMENTS
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-4">
                    <WeeklyAreaChart data={weeklyChartData} />
                </div>
                <div className="col-span-4">
                    <ScopeBarChart data={scopeBarData} />
                </div>
                <div className="col-span-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl p-6 shadow-soft border border-yellow-200/50 h-full"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
                                <p className="text-xs text-gray-400">{achievementData.totalUnlocked}/{achievementData.totalAchievements} unlocked</p>
                            </div>
                            <Link href="/dashboard/achievements">
                                <button className="text-xs font-medium text-amber-600 hover:underline flex items-center gap-1">
                                    View All <ArrowRight className="w-3 h-3" />
                                </button>
                            </Link>
                        </div>

                        {/* XP Progress */}
                        <div className="mb-4 p-3 bg-white/80 rounded-2xl border border-yellow-200/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500">Total XP</span>
                                <span className="text-sm font-bold text-amber-600">{achievementData.totalXP}</span>
                            </div>
                            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((achievementData.totalXP / 2000) * 100, 100)}%` }}
                                    transition={{ duration: 1, delay: 0.6 }}
                                />
                            </div>
                        </div>

                        {/* Tier breakdown */}
                        <div className="space-y-2">
                            {([
                                { tier: "weekly" as const, unlocked: achievementData.weeklyUnlocked, total: WEEKLY_ACHIEVEMENTS.length, icon: "⚡" },
                                { tier: "monthly" as const, unlocked: achievementData.monthlyUnlocked, total: MONTHLY_ACHIEVEMENTS.length, icon: "🏆" },
                                { tier: "yearly" as const, unlocked: achievementData.yearlyUnlocked, total: YEARLY_ACHIEVEMENTS.length, icon: "👑" },
                            ]).map(({ tier, unlocked, total, icon }) => (
                                <div key={tier} className="flex items-center gap-3 p-2.5 bg-white/60 rounded-xl">
                                    <span className="text-lg">{icon}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-gray-700 capitalize">{tier}</span>
                                            <span className="text-xs font-bold text-gray-500">{unlocked}/{total}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                                            <div
                                                className={`h-full rounded-full bg-gradient-to-r ${TIER_CONFIG[tier].bgGradient}`}
                                                style={{ width: total > 0 ? `${(unlocked / total) * 100}%` : "0%" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                6. TODAY'S TASKS + OUTREACH PULSE + MOTIVATION
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-12 gap-6">
                {/* Today's Tasks */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="col-span-5 bg-white rounded-3xl p-6 shadow-soft border border-gray-100 flex flex-col max-h-[420px]"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Today&apos;s Tasks</h3>
                            <p className="text-xs text-gray-400">{pendingToday} remaining · {completedToday} done</p>
                        </div>
                        <Link href={`/dashboard/calendar/day/${todaySlug}`}>
                            <button className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                                Timeline <ArrowRight className="w-3 h-3" />
                            </button>
                        </Link>
                    </div>

                    {/* Upcoming alert */}
                    {upcomingTask && (
                        <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wide">Next @ {upcomingTask.startTime}</p>
                                    <p className="font-semibold text-gray-900 text-sm truncate">{upcomingTask.title}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        ) : todayTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                                    <CheckCircle2 className="w-7 h-7 text-gray-300" />
                                </div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">No tasks for today</p>
                                <p className="text-xs text-gray-400 mb-3">Plan your day to get started.</p>
                                <Link href={`/dashboard/calendar/day/${todaySlug}`}>
                                    <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors">
                                        Plan your day
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            todayTasks.map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.55 + idx * 0.03 }}
                                    className={cn(
                                        "group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                        task.status === "done"
                                            ? "bg-gray-50 border-gray-100"
                                            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                    )}
                                    onClick={() => toggleTask(task)}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                        task.status === "done"
                                            ? "bg-green-500 border-green-500"
                                            : "border-gray-300 group-hover:border-green-400"
                                    )}>
                                        {task.status === "done" && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-medium truncate",
                                            task.status === "done" ? "text-gray-400 line-through" : "text-gray-900"
                                        )}>{task.title}</p>
                                        {task.startTime && (
                                            <p className="text-[11px] text-gray-400">{task.startTime}{task.endTime ? ` - ${task.endTime}` : ""}</p>
                                        )}
                                    </div>
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.color || TASK_COLORS[0] }} />
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Outreach Pulse */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="col-span-3 bg-white rounded-3xl p-6 shadow-soft border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Outreach Pulse</h3>
                            <p className="text-xs text-gray-400">Daily progress</p>
                        </div>
                        <Link href="/dashboard/outreach">
                            <button className="text-xs font-medium text-teal-600 hover:underline flex items-center gap-1">
                                Open <ArrowRight className="w-3 h-3" />
                            </button>
                        </Link>
                    </div>

                    {/* Nova */}
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Nova</span>
                            </div>
                            <span className="text-xs font-bold text-blue-600">{outreachStats.novaToday}/{OUTREACH_TARGETS.nova.daily}</span>
                        </div>
                        <div className="h-2.5 bg-blue-50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((outreachStats.novaToday / OUTREACH_TARGETS.nova.daily) * 100, 100)}%` }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                            />
                        </div>
                    </div>

                    {/* Amaka AI */}
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <Target className="w-3.5 h-3.5 text-purple-500" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Amaka AI</span>
                            </div>
                            <span className="text-xs font-bold text-purple-600">{outreachStats.amakaToday}/{OUTREACH_TARGETS.amaka_ai.daily}</span>
                        </div>
                        <div className="h-2.5 bg-purple-50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((outreachStats.amakaToday / OUTREACH_TARGETS.amaka_ai.daily) * 100, 100)}%` }}
                                transition={{ duration: 0.8, delay: 0.75 }}
                            />
                        </div>
                    </div>

                    {/* Follow-ups */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
                                <Megaphone className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{followUpCount}</p>
                                <p className="text-[11px] text-gray-500">follow-ups due</p>
                            </div>
                        </div>
                    </div>

                    {/* Total outreach */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Total contacts</span>
                            <span className="font-bold text-gray-700">{outreachContacts.length}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Motivation + Week/Year preview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    className="col-span-4 space-y-4"
                >
                    {/* Week Goals */}
                    <div className="bg-white rounded-3xl p-5 shadow-soft border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900">Week Goals</h3>
                            <Link href={`/dashboard/calendar/week/${currentWeek}`}>
                                <button className="text-[11px] font-medium text-indigo-600 hover:underline">View All</button>
                            </Link>
                        </div>
                        {weekTasks.length > 0 ? (
                            <div className="space-y-2">
                                {weekTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.color || TASK_COLORS[0] }} />
                                        <span className="text-xs text-gray-700 truncate flex-1">{task.title}</span>
                                        <span className="text-[11px] font-bold text-indigo-500">{task.progress}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-3">No week goals set</p>
                        )}
                    </div>

                    {/* Motivation widget */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-5 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl -mr-8 -mt-8" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/15 rounded-full blur-2xl -ml-8 -mb-8" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Award className="w-4 h-4 text-yellow-400" />
                                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Motivation</span>
                            </div>
                            {streak >= 7 ? (
                                <>
                                    <h3 className="text-base font-bold mb-1">🔥 {streak} Day Streak!</h3>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        {streak} days of consistency. That&apos;s discipline in action!
                                    </p>
                                </>
                            ) : completedToday >= 3 ? (
                                <>
                                    <h3 className="text-base font-bold mb-1">⚡ Productive Day!</h3>
                                    <p className="text-gray-400 text-xs leading-relaxed">{completedToday} tasks completed today. Keep crushing it!</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-base font-bold mb-1">🎯 Stay Focused</h3>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        &quot;The secret of getting ahead is getting started.&quot; — Mark Twain
                                    </p>
                                </>
                            )}
                            <div className="mt-3 flex gap-2">
                                <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-medium">
                                    {streak >= 7 ? "Consistency" : "Motivation"}
                                </span>
                                <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-medium">
                                    {completedToday >= 3 ? "Productive" : "Focus"}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
