"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Calendar, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Task, CreateTaskInput, TASK_COLORS } from "@/lib/types/task";
import { createTask, updateTask, subscribeTasks } from "@/lib/firebase-tasks";
import { cn } from "@/lib/utils";

const months = [
    { name: "January", short: "Jan" },
    { name: "February", short: "Feb" },
    { name: "March", short: "Mar" },
    { name: "April", short: "Apr" },
    { name: "May", short: "May" },
    { name: "June", short: "Jun" },
    { name: "July", short: "Jul" },
    { name: "August", short: "Aug" },
    { name: "September", short: "Sep" },
    { name: "October", short: "Oct" },
    { name: "November", short: "Nov" },
    { name: "December", short: "Dec" },
];

const quarters = [
    { name: "Q1", months: [0, 1, 2], color: "#3B82F6" },
    { name: "Q2", months: [3, 4, 5], color: "#10B981" },
    { name: "Q3", months: [6, 7, 8], color: "#F59E0B" },
    { name: "Q4", months: [9, 10, 11], color: "#EF4444" },
];

export default function YearViewPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const yearStr = params.year as string;
    const year = parseInt(yearStr);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [yearTasks, setYearTasks] = useState<Task[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeTasks(user.uid, 'year', yearStr, setYearTasks);
        return () => unsubscribe();
    }, [user, yearStr]);

    const navigateYear = (direction: 'prev' | 'next') => {
        const newYear = direction === 'prev' ? year - 1 : year + 1;
        router.push(`/dashboard/calendar/year/${newYear}`);
    };

    const handleMonthClick = (monthIndex: number) => {
        const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        router.push(`/dashboard/calendar/month/${monthStr}`);
    };

    const handleAddYearGoal = () => {
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
                scope: 'year',
                scopeKey: yearStr,
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
                                onClick={() => navigateYear('prev')}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-6 font-bold text-white text-2xl">
                                {year}
                            </span>
                            <button
                                onClick={() => navigateYear('next')}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {year === currentYear && (
                            <span className="px-3 py-1 bg-green-500/20 backdrop-blur-xl text-green-300 text-sm font-medium rounded-full border border-green-500/30">
                                This Year
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddYearGoal}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/80 to-rose-500/80 backdrop-blur-xl text-white rounded-full font-medium shadow-lg shadow-rose-500/30 hover:from-orange-500 hover:to-rose-500 transition-all border border-rose-400/30"
                    >
                        <Plus className="w-4 h-4" />
                        Year Goal
                    </button>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Year Goals Sidebar - Liquid Glass */}
                    <motion.div
                        className="w-96 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl p-6 overflow-y-auto relative"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-rose-500 to-pink-500 opacity-80 rounded-t-[40px]" />

                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-rose-400" />
                            <h2 className="font-semibold text-white">Year Goals</h2>
                        </div>

                        {yearTasks.length > 0 ? (
                            <div className="space-y-4">
                                {yearTasks.map(task => (
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
                                                className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                                                style={{ backgroundColor: task.color || TASK_COLORS[0], color: task.color || TASK_COLORS[0] }}
                                            />
                                            <span className="font-medium text-white">{task.title}</span>
                                        </div>
                                        {task.description && (
                                            <p className="text-sm text-white/50 mt-2 line-clamp-2">{task.description}</p>
                                        )}
                                        {task.progress > 0 && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs text-white/40 mb-1">
                                                    <span>Progress</span>
                                                    <span>{task.progress}%</span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: task.color || TASK_COLORS[0] }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${task.progress}%` }}
                                                        transition={{ duration: 0.5 }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-white/40">
                                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-lg font-medium">No year goals yet</p>
                                <p className="text-sm mt-1 text-white/30">What do you want to achieve this year?</p>
                                <button
                                    onClick={handleAddYearGoal}
                                    className="mt-4 px-4 py-2 bg-rose-500/20 text-rose-300 rounded-xl font-medium hover:bg-rose-500/30 transition-colors border border-rose-500/30"
                                >
                                    Add your first goal
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Year Overview - Liquid Glass */}
                    <motion.div
                        className="flex-1 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl p-8 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Quarters Grid */}
                        <div className="grid grid-cols-4 gap-6 h-full">
                            {quarters.map((quarter, qIndex) => (
                                <motion.div
                                    key={quarter.name}
                                    className="flex flex-col"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + qIndex * 0.1 }}
                                >
                                    {/* Quarter Header */}
                                    <div
                                        className="text-center py-3 rounded-2xl mb-4 font-bold text-white shadow-lg border border-white/20"
                                        style={{
                                            backgroundColor: `${quarter.color}40`,
                                            boxShadow: `0 0 20px ${quarter.color}30`
                                        }}
                                    >
                                        {quarter.name}
                                    </div>

                                    {/* Months in Quarter */}
                                    <div className="flex-1 space-y-3">
                                        {quarter.months.map(monthIndex => {
                                            const isCurrentMonth = year === currentYear && monthIndex === currentMonth;
                                            const isPastMonth = year < currentYear || (year === currentYear && monthIndex < currentMonth);

                                            return (
                                                <motion.div
                                                    key={monthIndex}
                                                    className={cn(
                                                        "p-4 rounded-2xl cursor-pointer transition-all border border-white/10",
                                                        "hover:border-white/30",
                                                        isCurrentMonth
                                                            ? "bg-green-500/20 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                                                            : isPastMonth
                                                                ? "bg-white/5 opacity-50"
                                                                : "bg-white/5 hover:bg-white/10"
                                                    )}
                                                    onClick={() => handleMonthClick(monthIndex)}
                                                    whileHover={{ scale: 1.03, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className={cn(
                                                        "font-semibold",
                                                        isCurrentMonth ? "text-green-300" : "text-white"
                                                    )}>
                                                        {months[monthIndex].name}
                                                    </div>
                                                    {isCurrentMonth && (
                                                        <div className="text-xs text-green-400/70 mt-1">
                                                            Current Month
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ))}
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
                    defaultScope="year"
                    defaultScopeKey={yearStr}
                    userId={user.uid}
                />
            )}
        </div>
    );
}
