"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Calendar, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Task, CreateTaskInput, TASK_COLORS } from "@/lib/types/task";
import { createTask, updateTask, subscribeTasks } from "@/lib/firebase-tasks";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const weekDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthViewPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const monthStr = params.month as string;
    const [year, monthNum] = monthStr.split('-').map(Number);
    const currentDate = new Date(year, monthNum - 1, 1);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const [monthTasks, setMonthTasks] = useState<Task[]>([]);
    const [dayTaskCounts, setDayTaskCounts] = useState<Record<string, number>>({});
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeTasks(user.uid, 'month', monthStr, setMonthTasks);
        return () => unsubscribe();
    }, [user, monthStr]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "tasks"),
            where("scope", "==", "day")
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const counts: Record<string, number> = {};
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.scopeKey) {
                    counts[data.scopeKey] = (counts[data.scopeKey] || 0) + 1;
                }
            });
            setDayTaskCounts(counts);
        });

        return () => unsubscribe();
    }, [user]);

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = direction === 'prev'
            ? subMonths(currentDate, 1)
            : addMonths(currentDate, 1);
        router.push(`/dashboard/calendar/month/${format(newDate, 'yyyy-MM')}`);
    };

    const handleDayClick = (day: Date) => {
        router.push(`/dashboard/calendar/day/${format(day, 'yyyy-MM-dd')}`);
    };

    const handleAddMonthGoal = () => {
        setSelectedTask(null);
        setShowModal(true);
    };

    const handleSaveTask = async (input: CreateTaskInput) => {
        if (!user) return;

        if (selectedTask) {
            await updateTask(user.uid, selectedTask.id, input);
        } else {
            await createTask(user.uid, {
                ...input,
                scope: 'month',
                scopeKey: monthStr,
            });
        }
    };

    return (
        <div className="fixed inset-0 z-40 overflow-hidden bg-[#2D1B4E]">
            {/* Background Image */}
            <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1.05 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                    backgroundImage: 'url(/calendarbackgroundimage.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center bottom',
                }}
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-black/30 pointer-events-none" />

            <div className="relative z-10 h-full flex flex-col p-8">
                {/* Header */}
                <motion.div
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard/calendar')}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all shadow-lg"
                        >
                            <Calendar className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full px-1 py-1 border border-white/20 shadow-lg">
                            <button
                                onClick={() => navigateMonth('prev')}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-4 font-semibold text-white text-lg">
                                {format(currentDate, 'MMMM yyyy')}
                            </span>
                            <button
                                onClick={() => navigateMonth('next')}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleAddMonthGoal}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/80 backdrop-blur-xl text-white rounded-full font-medium shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-all border border-purple-400/30"
                    >
                        <Plus className="w-4 h-4" />
                        Month Objective
                    </button>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Month Objectives Sidebar - Liquid Glass */}
                    <motion.div
                        className="w-80 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl p-6 overflow-y-auto relative"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 opacity-80 rounded-t-[40px]" />

                        <div className="flex items-center gap-2 mb-6">
                            <Target className="w-5 h-5 text-purple-400" />
                            <h2 className="font-semibold text-white">Month Objectives</h2>
                        </div>

                        {monthTasks.length > 0 ? (
                            <div className="space-y-3">
                                {monthTasks.map(task => (
                                    <motion.div
                                        key={task.id}
                                        className="p-4 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setShowModal(true);
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: task.color || TASK_COLORS[0] }}
                                            />
                                            <span className="font-medium text-white">{task.title}</span>
                                        </div>
                                        {task.progress > 0 && (
                                            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${task.progress}%`,
                                                        backgroundColor: task.color || TASK_COLORS[0]
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-white/40">
                                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No objectives yet</p>
                                <button
                                    onClick={handleAddMonthGoal}
                                    className="mt-3 text-purple-400 text-sm font-medium hover:underline"
                                >
                                    Add your first objective
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Calendar Grid - Liquid Glass */}
                    <motion.div
                        className="flex-1 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl p-6 overflow-hidden flex flex-col"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 mb-4">
                            {weekDayNames.map(day => (
                                <div key={day} className="text-center text-sm font-medium text-white/40 py-2 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="flex-1 grid grid-cols-7 gap-2">
                            {days.map((day, index) => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const taskCount = dayTaskCounts[dateKey] || 0;
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isDayToday = isToday(day);

                                return (
                                    <motion.div
                                        key={dateKey}
                                        className={cn(
                                            "relative p-2 rounded-xl cursor-pointer transition-all flex flex-col",
                                            "hover:bg-white/10",
                                            !isCurrentMonth && "opacity-30",
                                            isDayToday && "ring-2 ring-green-400/50 bg-green-500/10"
                                        )}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: isCurrentMonth ? 1 : 0.3, scale: 1 }}
                                        transition={{ delay: index * 0.01 }}
                                        onClick={() => handleDayClick(day)}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <span className={cn(
                                            "text-sm font-medium",
                                            isDayToday ? "text-green-300" : "text-white"
                                        )}>
                                            {format(day, 'd')}
                                        </span>

                                        {taskCount > 0 && (
                                            <div className="mt-auto flex gap-1 flex-wrap">
                                                {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.5)]"
                                                    />
                                                ))}
                                                {taskCount > 3 && (
                                                    <span className="text-[10px] text-white/40">+{taskCount - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Task Modal */}
            {user && (
                <TaskModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedTask(null);
                    }}
                    onSave={handleSaveTask}
                    initialTask={selectedTask}
                    defaultScope="month"
                    defaultScopeKey={monthStr}
                    userId={user.uid}
                />
            )}
        </div>
    );
}
