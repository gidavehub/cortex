"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Plus, Clock, CheckCircle2, Calendar, Sun, Moon, Sparkles, Target, TrendingUp, Flame, Award, ArrowRight, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, differenceInDays, isToday, subDays, eachDayOfInterval } from "date-fns";
import { Task, TASK_COLORS } from "@/lib/types/task";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Time & Date
    const today = new Date();
    const dateString = format(today, 'EEEE, MMMM do');
    const todaySlug = format(today, 'yyyy-MM-dd');
    const currentYear = today.getFullYear();
    const currentMonth = format(today, 'yyyy-MM');
    const currentWeek = getISOWeekString(today);

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
            })) as Task[];
            setTasks(fetchedTasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    function getISOWeekString(date: Date): string {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    }

    function getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return { greeting: "Good Morning", icon: Sun, message: "Let's make today count!" };
        if (hour < 18) return { greeting: "Good Afternoon", icon: Sun, message: "Keep the momentum going!" };
        return { greeting: "Good Evening", icon: Moon, message: "Wrapping up the day?" };
    }

    const { greeting, icon: TimeIcon, message } = getTimeOfDay();

    // Task Categories
    const todayTasks = tasks.filter(t => t.scope === 'day' && t.scopeKey === todaySlug);
    const weekTasks = tasks.filter(t => t.scope === 'week' && t.scopeKey === currentWeek);
    const monthTasks = tasks.filter(t => t.scope === 'month' && t.scopeKey === currentMonth);
    const yearTasks = tasks.filter(t => t.scope === 'year' && t.scopeKey === String(currentYear));

    // Stats
    const completedToday = todayTasks.filter(t => t.status === 'done').length;
    const pendingToday = todayTasks.filter(t => t.status !== 'done').length;
    const weekProgress = weekTasks.length > 0
        ? Math.round(weekTasks.reduce((sum, t) => sum + t.progress, 0) / weekTasks.length)
        : 0;
    const monthProgress = monthTasks.length > 0
        ? Math.round(monthTasks.reduce((sum, t) => sum + t.progress, 0) / monthTasks.length)
        : 0;

    // Calculate streak (consecutive days with completed tasks in last 30 days)
    const calculateStreak = () => {
        let streak = 0;
        const last30Days = eachDayOfInterval({
            start: subDays(today, 30),
            end: today
        }).reverse();

        for (const day of last30Days) {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks.filter(t => t.scope === 'day' && t.scopeKey === dayKey);
            const hasCompleted = dayTasks.some(t => t.status === 'done');

            if (hasCompleted || isToday(day)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };
    const streak = calculateStreak();

    // Next upcoming task (with time)
    const upcomingTask = todayTasks
        .filter(t => t.status !== 'done' && t.startTime)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))[0];

    // Toggle task status
    const toggleTask = async (task: Task) => {
        if (!user) return;
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        const newProgress = newStatus === 'done' ? 100 : 0;
        await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
            status: newStatus,
            progress: newProgress
        });
    };

    // Motivational insights based on data
    const getInsight = () => {
        if (completedToday >= 5) return "🔥 You're on fire! " + completedToday + " tasks completed!";
        if (pendingToday === 0 && todayTasks.length > 0) return "🎉 All tasks done! Time to relax.";
        if (weekProgress >= 80) return "📈 Week goals nearly complete at " + weekProgress + "%!";
        if (streak >= 7) return "🏆 " + streak + " day streak! Keep it going!";
        if (monthTasks.length > 0 && monthProgress < 25) return "💪 Month just started. Let's build momentum!";
        if (yearTasks.length > 0) return "🎯 " + yearTasks.length + " year goal" + (yearTasks.length > 1 ? 's' : '') + " to conquer!";
        return "✨ " + message;
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-between px-2"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
                            <TimeIcon className="w-5 h-5 text-yellow-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{dateString}</span>
                    </div>
                    <h1 className="text-4xl font-bold text-[#1A1C1E] mb-1">{greeting}, {user?.name?.split(' ')[0] || 'there'}!</h1>
                    <p className="text-[#64748B] text-lg">{getInsight()}</p>
                </div>
                <div className="flex gap-3">
                    <Link href={`/dashboard/calendar/day/${todaySlug}`}>
                        <button className="px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-medium shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Plan Today
                        </button>
                    </Link>
                    <Link href={`/dashboard/calendar`}>
                        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Full Calendar
                        </button>
                    </Link>
                </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-5 gap-4"
            >
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-500">Today</span>
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{completedToday}/{todayTasks.length}</p>
                    <p className="text-xs text-gray-400 mt-1">tasks done</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-500">Week Goals</span>
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Layers className="w-4 h-4 text-indigo-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-indigo-600">{weekProgress}%</p>
                    <div className="mt-2 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${weekProgress}%` }} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-500">Month Goals</span>
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Target className="w-4 h-4 text-purple-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{monthProgress}%</p>
                    <div className="mt-2 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${monthProgress}%` }} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-500">Year Goals</span>
                        <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-rose-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-rose-600">{yearTasks.length}</p>
                    <p className="text-xs text-gray-400 mt-1">active goals</p>
                </div>
                <div className="bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl p-5 shadow-lg text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white/80">Streak</span>
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Flame className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold">{streak}</p>
                    <p className="text-xs text-white/70 mt-1">days in a row</p>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Today's Tasks - 8 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="col-span-12 lg:col-span-8 bg-white rounded-[32px] p-8 shadow-soft border border-gray-100 flex flex-col min-h-[500px]"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-[#1A1C1E]">Today's Tasks</h2>
                            <p className="text-sm text-gray-500">
                                {pendingToday} remaining • {completedToday} completed
                            </p>
                        </div>
                        <Link href={`/dashboard/calendar/day/${todaySlug}`}>
                            <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                                View Timeline
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>

                    {/* Upcoming Alert */}
                    {upcomingTask && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Up Next @ {upcomingTask.startTime}</p>
                                    <p className="font-semibold text-gray-900">{upcomingTask.title}</p>
                                </div>
                                <button
                                    onClick={() => toggleTask(upcomingTask)}
                                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
                                >
                                    Start
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Task List */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        ) : todayTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">No tasks for today</h3>
                                <p className="text-gray-500 max-w-sm mb-4">Plan your day by adding tasks to your timeline.</p>
                                <Link href={`/dashboard/calendar/day/${todaySlug}`}>
                                    <button className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
                                        Plan your day
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todayTasks.map((task, idx) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={cn(
                                            "group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer",
                                            task.status === 'done'
                                                ? "bg-gray-50 border-gray-100"
                                                : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                                        )}
                                        onClick={() => toggleTask(task)}
                                    >
                                        <div
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                task.status === 'done'
                                                    ? "bg-green-500 border-green-500"
                                                    : "border-gray-300 group-hover:border-green-400"
                                            )}
                                        >
                                            {task.status === 'done' && (
                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={cn(
                                                "font-medium",
                                                task.status === 'done' ? "text-gray-400 line-through" : "text-gray-900"
                                            )}>
                                                {task.title}
                                            </p>
                                            {task.startTime && (
                                                <p className="text-sm text-gray-400">
                                                    {task.startTime} - {task.endTime}
                                                </p>
                                            )}
                                        </div>
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: task.color || TASK_COLORS[0] }}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Right Widgets - 4 cols */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Week Goals Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-[#1A1C1E]">Week Goals</h2>
                            <Link href={`/dashboard/calendar/week/${currentWeek}`}>
                                <button className="text-xs font-medium text-indigo-600 hover:underline">View All</button>
                            </Link>
                        </div>

                        {weekTasks.length > 0 ? (
                            <div className="space-y-3">
                                {weekTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: task.color || TASK_COLORS[0] }}
                                            />
                                            <span className="text-sm font-medium text-gray-900 truncate">{task.title}</span>
                                        </div>
                                        <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${task.progress}%`,
                                                    backgroundColor: task.color || TASK_COLORS[0]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-400">
                                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No week goals set</p>
                                <Link href={`/dashboard/calendar/week/${currentWeek}`}>
                                    <button className="mt-2 text-indigo-600 text-sm font-medium hover:underline">
                                        Add goals →
                                    </button>
                                </Link>
                            </div>
                        )}
                    </motion.div>

                    {/* Year Goals Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-[#1A1C1E]">{currentYear} Goals</h2>
                            <Link href={`/dashboard/calendar/year/${currentYear}`}>
                                <button className="text-xs font-medium text-rose-600 hover:underline">View All</button>
                            </Link>
                        </div>

                        {yearTasks.length > 0 ? (
                            <div className="space-y-3">
                                {yearTasks.slice(0, 2).map(task => (
                                    <div key={task.id} className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900 truncate">{task.title}</span>
                                            <span className="text-xs font-bold text-rose-600">{task.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-rose-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${task.progress}%` }}
                                                transition={{ duration: 0.8 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-400">
                                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No year goals set</p>
                                <Link href={`/dashboard/calendar/year/${currentYear}`}>
                                    <button className="mt-2 text-rose-600 text-sm font-medium hover:underline">
                                        Set your vision →
                                    </button>
                                </Link>
                            </div>
                        )}
                    </motion.div>

                    {/* Motivation Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[32px] p-6 shadow-soft text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Award className="w-5 h-5 text-yellow-400" />
                                <span className="text-sm font-medium text-gray-400">Achievement Unlocked</span>
                            </div>
                            {streak >= 7 ? (
                                <>
                                    <h3 className="text-lg font-bold mb-2">🔥 {streak} Day Streak!</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        You've been consistent for {streak} days straight. That's discipline in action!
                                    </p>
                                </>
                            ) : completedToday >= 3 ? (
                                <>
                                    <h3 className="text-lg font-bold mb-2">⚡ Productive Day!</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {completedToday} tasks completed today. Keep crushing it!
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold mb-2">🎯 Stay Focused</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        "The secret of getting ahead is getting started." — Mark Twain
                                    </p>
                                </>
                            )}
                            <div className="mt-4 flex gap-2">
                                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
                                    {streak >= 7 ? 'Consistency' : 'Motivation'}
                                </span>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
                                    {completedToday >= 3 ? 'Productive' : 'Focus'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
