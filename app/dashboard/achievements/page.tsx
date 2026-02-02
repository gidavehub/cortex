"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Medal, Crown, Lock, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task } from "@/lib/types/task";
import {
    Achievement,
    WEEKLY_ACHIEVEMENTS,
    MONTHLY_ACHIEVEMENTS,
    YEARLY_ACHIEVEMENTS,
    TIER_CONFIG,
    AchievementTier
} from "@/lib/types/achievement";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from "date-fns";

interface UnlockedAchievement extends Achievement {
    unlockedAt: Date;
    periodKey: string;
}

export default function AchievementsPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTier, setSelectedTier] = useState<AchievementTier | 'all'>('all');
    const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
    const [progress, setProgress] = useState<Record<string, { current: number; target: number }>>({});

    // Fetch all tasks
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "tasks"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
                deadline: doc.data().deadline?.toDate?.() || undefined,
            })) as Task[];
            setTasks(fetchedTasks);
        });

        return () => unsubscribe();
    }, [user]);

    // Calculate achievements
    useEffect(() => {
        if (tasks.length === 0) return;

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const year = now.getFullYear();

        // This week's completed tasks
        const thisWeekTasks = tasks.filter(t =>
            t.status === 'done' &&
            isWithinInterval(t.updatedAt, { start: weekStart, end: weekEnd })
        );

        // This month's completed tasks
        const thisMonthTasks = tasks.filter(t =>
            t.status === 'done' &&
            isWithinInterval(t.updatedAt, { start: monthStart, end: monthEnd })
        );

        // Calculate streak (consecutive days with completed tasks)
        const completedDates = new Set(
            tasks
                .filter(t => t.status === 'done')
                .map(t => format(t.updatedAt, 'yyyy-MM-dd'))
        );
        let streak = 0;
        let checkDate = new Date();
        while (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
            streak++;
            checkDate = new Date(checkDate.setDate(checkDate.getDate() - 1));
        }

        // Calculate progress for each achievement
        const newProgress: Record<string, { current: number; target: number }> = {};
        const unlocked: UnlockedAchievement[] = [];

        // Weekly achievements
        WEEKLY_ACHIEVEMENTS.forEach(achievement => {
            let current = 0;
            switch (achievement.id) {
                case 'streak_starter':
                    current = streak;
                    break;
                case 'productive_week':
                    current = thisWeekTasks.length;
                    break;
                case 'goal_crusher':
                    current = tasks.filter(t => t.scope === 'week' && t.status === 'done').length > 0 ? 1 : 0;
                    break;
            }
            newProgress[achievement.id] = { current, target: achievement.requirement };
            if (current >= achievement.requirement) {
                unlocked.push({ ...achievement, unlockedAt: now, periodKey: format(now, 'yyyy-Www') });
            }
        });

        // Monthly achievements
        MONTHLY_ACHIEVEMENTS.forEach(achievement => {
            let current = 0;
            switch (achievement.id) {
                case 'consistent':
                    current = new Set(
                        thisMonthTasks.map(t => format(t.updatedAt, 'yyyy-MM-dd'))
                    ).size;
                    break;
                case 'progress_master':
                    const monthGoals = tasks.filter(t => t.scope === 'month');
                    current = monthGoals.length > 0
                        ? Math.round(monthGoals.reduce((acc, t) => acc + t.progress, 0) / monthGoals.length)
                        : 0;
                    break;
                case 'perfect_week':
                    // Simplified: check if any week had 100% completion
                    current = thisWeekTasks.length >= 10 ? 100 : Math.min(thisWeekTasks.length * 10, 99);
                    break;
                case 'overachiever':
                    current = thisMonthTasks.length;
                    break;
                case 'deadline_keeper':
                    const withDeadlines = tasks.filter(t => t.deadline);
                    const metDeadlines = withDeadlines.filter(t =>
                        t.status === 'done' && t.deadline && t.updatedAt <= t.deadline
                    );
                    current = withDeadlines.length > 0
                        ? Math.round((metDeadlines.length / withDeadlines.length) * 100)
                        : 100;
                    break;
            }
            newProgress[achievement.id] = { current, target: achievement.requirement };
            if (current >= achievement.requirement) {
                unlocked.push({ ...achievement, unlockedAt: now, periodKey: format(now, 'yyyy-MM') });
            }
        });

        // Yearly achievements
        const yearTasks = tasks.filter(t => t.createdAt.getFullYear() === year);
        const completedYearTasks = yearTasks.filter(t => t.status === 'done');

        YEARLY_ACHIEVEMENTS.forEach(achievement => {
            let current = 0;
            switch (achievement.id) {
                case 'year_champion':
                    current = tasks.filter(t => t.scope === 'year' && t.status === 'done').length;
                    break;
                case 'veteran':
                    const firstTask = tasks.reduce((min, t) =>
                        t.createdAt < min ? t.createdAt : min, new Date()
                    );
                    current = differenceInDays(now, firstTask);
                    break;
                case 'productivity_legend':
                    current = completedYearTasks.length;
                    break;
                case 'monthly_maven':
                    // Count months with all achievements unlocked
                    current = unlocked.filter(a => a.tier === 'monthly').length >= 5 ? 5 : 0;
                    break;
                case 'century_club':
                    current = new Set(
                        completedYearTasks.map(t => format(t.updatedAt, 'yyyy-MM-dd'))
                    ).size;
                    break;
                case 'diverse_achiever':
                    const scopes = new Set(completedYearTasks.map(t => t.scope));
                    current = scopes.size;
                    break;
                case 'time_master':
                    current = tasks.filter(t =>
                        t.deadline && t.status === 'done' && t.updatedAt <= t.deadline
                    ).length;
                    break;
                case 'streak_legend':
                    current = streak;
                    break;
                case 'data_driven':
                    const allGoals = tasks.filter(t => ['week', 'month', 'year'].includes(t.scope));
                    current = allGoals.length > 0
                        ? Math.round(allGoals.reduce((acc, t) => acc + t.progress, 0) / allGoals.length)
                        : 0;
                    break;
                case 'celebration':
                    current = tasks.filter(t => t.scope === 'month' && t.status === 'done').length;
                    break;
            }
            newProgress[achievement.id] = { current, target: achievement.requirement };
            if (current >= achievement.requirement) {
                unlocked.push({ ...achievement, unlockedAt: now, periodKey: String(year) });
            }
        });

        setProgress(newProgress);
        setUnlockedAchievements(unlocked);
    }, [tasks]);

    const allAchievements = [...WEEKLY_ACHIEVEMENTS, ...MONTHLY_ACHIEVEMENTS, ...YEARLY_ACHIEVEMENTS];
    const filteredAchievements = selectedTier === 'all'
        ? allAchievements
        : allAchievements.filter(a => a.tier === selectedTier);

    const isUnlocked = (id: string) => unlockedAchievements.some(a => a.id === id);

    const tierStats = {
        weekly: { total: WEEKLY_ACHIEVEMENTS.length, unlocked: unlockedAchievements.filter(a => a.tier === 'weekly').length },
        monthly: { total: MONTHLY_ACHIEVEMENTS.length, unlocked: unlockedAchievements.filter(a => a.tier === 'monthly').length },
        yearly: { total: YEARLY_ACHIEVEMENTS.length, unlocked: unlockedAchievements.filter(a => a.tier === 'yearly').length },
    };

    const totalXP = unlockedAchievements.reduce((acc, a) => acc + a.rewardXP, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
                    <p className="text-gray-500 mt-1">Track your progress and unlock rewards</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl text-white font-bold shadow-lg">
                    <Sparkles className="w-5 h-5" />
                    {totalXP} XP
                </div>
            </div>

            {/* Tier Stats */}
            <div className="grid grid-cols-3 gap-4">
                {(['weekly', 'monthly', 'yearly'] as const).map((tier) => {
                    const config = TIER_CONFIG[tier];
                    const stats = tierStats[tier];
                    return (
                        <motion.div
                            key={tier}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                                "p-6 rounded-3xl bg-gradient-to-br text-white relative overflow-hidden cursor-pointer",
                                config.bgGradient
                            )}
                            onClick={() => setSelectedTier(selectedTier === tier ? 'all' : tier)}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <Trophy className="w-8 h-8 mb-3 opacity-80" />
                            <h3 className="text-lg font-bold capitalize">{tier}</h3>
                            <p className="text-2xl font-bold mt-1">
                                {stats.unlocked}/{stats.total}
                            </p>
                            <p className="text-sm opacity-80">achievements unlocked</p>
                            {selectedTier === tier && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/50" />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
                {(['all', 'weekly', 'monthly', 'yearly'] as const).map((tier) => (
                    <button
                        key={tier}
                        onClick={() => setSelectedTier(tier)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                            selectedTier === tier
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        {tier}
                    </button>
                ))}
            </div>

            {/* Achievement Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredAchievements.map((achievement, index) => {
                        const unlocked = isUnlocked(achievement.id);
                        const prog = progress[achievement.id] || { current: 0, target: achievement.requirement };
                        const percentage = Math.min((prog.current / prog.target) * 100, 100);
                        const config = TIER_CONFIG[achievement.tier];

                        return (
                            <motion.div
                                key={achievement.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(
                                    "relative p-5 rounded-2xl border-2 transition-all",
                                    unlocked
                                        ? "bg-white border-yellow-300 shadow-lg shadow-yellow-100"
                                        : "bg-gray-50 border-gray-200"
                                )}
                            >
                                {/* Badge */}
                                <div className={cn(
                                    "absolute -top-3 -right-3 px-2 py-1 rounded-full text-xs font-bold uppercase",
                                    `bg-gradient-to-r ${config.bgGradient} text-white`
                                )}>
                                    {achievement.tier}
                                </div>

                                {/* Icon */}
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4",
                                    unlocked
                                        ? "bg-gradient-to-br from-yellow-100 to-amber-100"
                                        : "bg-gray-100 grayscale opacity-50"
                                )}>
                                    {unlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-400" />}
                                </div>

                                {/* Content */}
                                <h3 className={cn(
                                    "font-bold text-lg",
                                    unlocked ? "text-gray-900" : "text-gray-400"
                                )}>
                                    {achievement.name}
                                </h3>
                                <p className={cn(
                                    "text-sm mt-1",
                                    unlocked ? "text-gray-600" : "text-gray-400"
                                )}>
                                    {achievement.description}
                                </p>

                                {/* Progress */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className={unlocked ? "text-green-600 font-medium" : "text-gray-400"}>
                                            {unlocked ? "Completed!" : `${prog.current}/${prog.target}`}
                                        </span>
                                        <span className="text-amber-600 font-medium">+{achievement.rewardXP} XP</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn(
                                                "h-full rounded-full",
                                                unlocked
                                                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                                    : "bg-gradient-to-r from-blue-400 to-blue-500"
                                            )}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.5, delay: index * 0.05 }}
                                        />
                                    </div>
                                </div>

                                {/* Unlocked badge */}
                                {unlocked && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-4 left-4"
                                    >
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Empty state */}
            {filteredAchievements.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No achievements in this category</p>
                </div>
            )}
        </div>
    );
}
