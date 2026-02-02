"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, isSameDay } from "date-fns";
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

export default function WeekViewPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const weekStr = params.week as string;
    const [year, weekNum] = weekStr.split('-W').map(Number);

    const getDateOfWeek = (week: number, year: number): Date => {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const startDate = new Date(simple);
        if (dow <= 4) {
            startDate.setDate(simple.getDate() - simple.getDay() + 1);
        } else {
            startDate.setDate(simple.getDate() + 8 - simple.getDay());
        }
        return startDate;
    };

    const weekStart = getDateOfWeek(weekNum, year);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const [weekTasks, setWeekTasks] = useState<Task[]>([]);
    const [dayTasks, setDayTasks] = useState<Record<string, Task[]>>({});
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeTasks(user.uid, 'week', weekStr, setWeekTasks);
        return () => unsubscribe();
    }, [user, weekStr]);

    useEffect(() => {
        if (!user) return;

        const unsubscribes: (() => void)[] = [];
        const newDayTasks: Record<string, Task[]> = {};

        weekDays.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const q = query(
                collection(db, "users", user.uid, "tasks"),
                where("scope", "==", "day"),
                where("scopeKey", "==", dateKey),
                orderBy("startTime", "asc")
            );

            const unsub = onSnapshot(q, (snap) => {
                newDayTasks[dateKey] = snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Task[];
                setDayTasks({ ...newDayTasks });
            });

            unsubscribes.push(unsub);
        });

        return () => unsubscribes.forEach(u => u());
    }, [user, weekStr]);

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newWeekStart = direction === 'prev'
            ? subWeeks(weekStart, 1)
            : addWeeks(weekStart, 1);
        const newYear = newWeekStart.getFullYear();
        const newWeekNum = getISOWeek(newWeekStart);
        router.push(`/dashboard/calendar/week/${newYear}-W${String(newWeekNum).padStart(2, '0')}`);
    };

    const handleAddWeekTask = () => {
        setSelectedTask(null);
        setShowModal(true);
    };

    const handleDayClick = (day: Date) => {
        router.push(`/dashboard/calendar/day/${format(day, 'yyyy-MM-dd')}`);
    };

    const handleSaveTask = async (input: CreateTaskInput) => {
        if (!user) return;

        if (selectedTask) {
            await updateTask(user.uid, selectedTask.id, input);
        } else {
            await createTask(user.uid, {
                ...input,
                scope: 'week',
                scopeKey: weekStr,
            });
        }
    };

    function getISOWeek(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

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
                                onClick={() => navigateWeek('prev')}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 font-medium text-white">
                                Week {weekNum}, {year}
                            </span>
                            <button
                                onClick={() => navigateWeek('next')}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <span className="text-white/50 text-sm">
                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                        </span>
                    </div>

                    <button
                        onClick={handleAddWeekTask}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/80 backdrop-blur-xl text-white rounded-full font-medium shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all border border-indigo-400/30"
                    >
                        <Plus className="w-4 h-4" />
                        Week Goal
                    </button>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Week Goals Sidebar - Liquid Glass */}
                    <motion.div
                        className="w-80 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl p-6 overflow-y-auto relative"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 opacity-80 rounded-t-[40px]" />

                        <div className="flex items-center gap-2 mb-6">
                            <Target className="w-5 h-5 text-indigo-400" />
                            <h2 className="font-semibold text-white">Week Goals</h2>
                        </div>

                        {weekTasks.length > 0 ? (
                            <div className="space-y-3">
                                {weekTasks.map(task => (
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
                                <p className="text-sm">No week goals yet</p>
                                <button
                                    onClick={handleAddWeekTask}
                                    className="mt-3 text-indigo-400 text-sm font-medium hover:underline"
                                >
                                    Add your first goal
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Week Grid - Liquid Glass */}
                    <motion.div
                        className="flex-1 grid grid-cols-7 gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {weekDays.map((day, index) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const tasks = dayTasks[dateKey] || [];
                            const isDayToday = isToday(day);

                            return (
                                <motion.div
                                    key={dateKey}
                                    className={cn(
                                        "bg-white/5 backdrop-blur-3xl rounded-[30px] border border-white/10 shadow-xl overflow-hidden flex flex-col cursor-pointer hover:bg-white/10 transition-all",
                                        isDayToday && "ring-2 ring-green-400/50 ring-offset-2 ring-offset-transparent"
                                    )}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + index * 0.05 }}
                                    onClick={() => handleDayClick(day)}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                >
                                    {/* Day Header */}
                                    <div className={cn(
                                        "p-4 text-center border-b border-white/10",
                                        isDayToday && "bg-green-500/20"
                                    )}>
                                        <div className={cn(
                                            "text-xs font-medium uppercase tracking-wider",
                                            isDayToday ? "text-green-300" : "text-white/40"
                                        )}>
                                            {format(day, 'EEE')}
                                        </div>
                                        <div className={cn(
                                            "text-3xl font-bold",
                                            isDayToday ? "text-green-300" : "text-white"
                                        )}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>

                                    {/* Tasks */}
                                    <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[300px] no-scrollbar">
                                        {tasks.slice(0, 5).map(task => (
                                            <div
                                                key={task.id}
                                                className="p-2 rounded-xl text-xs bg-white/5 border border-white/10"
                                                style={{ borderLeftColor: task.color || TASK_COLORS[0], borderLeftWidth: '3px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTask(task);
                                                    setShowModal(true);
                                                }}
                                            >
                                                <div className="font-medium text-white truncate">
                                                    {task.title}
                                                </div>
                                                {task.startTime && (
                                                    <div className="text-white/40 mt-0.5">
                                                        {task.startTime}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {tasks.length > 5 && (
                                            <div className="text-xs text-white/40 text-center py-1">
                                                +{tasks.length - 5} more
                                            </div>
                                        )}
                                        {tasks.length === 0 && (
                                            <div className="text-xs text-white/30 text-center py-4">
                                                No tasks
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
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
                    defaultScope="week"
                    defaultScopeKey={weekStr}
                    userId={user.uid}
                />
            )}
        </div>
    );
}
