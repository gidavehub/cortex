"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, addDays, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Calendar, Layers } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TimeCanvas } from "@/components/tasks/TimeCanvas";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Task, CreateTaskInput, getScopeKey } from "@/lib/types/task";
import { createTask, updateTask, subscribeTimedTasks } from "@/lib/firebase-tasks";
import { cn } from "@/lib/utils";

export default function DayViewPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const dateStr = params.date as string;
    const currentDate = parseISO(dateStr);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [defaultStartTime, setDefaultStartTime] = useState('09:00');
    const [defaultEndTime, setDefaultEndTime] = useState('10:00');

    // Subscribe to tasks for this day
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeTimedTasks(user.uid, dateStr, setTasks);
        return () => unsubscribe();
    }, [user, dateStr]);

    const navigateDay = (direction: 'prev' | 'next') => {
        const newDate = direction === 'prev'
            ? subDays(currentDate, 1)
            : addDays(currentDate, 1);
        router.push(`/dashboard/calendar/day/${format(newDate, 'yyyy-MM-dd')}`);
    };

    const handleAddTask = (startTime: string, endTime: string) => {
        setDefaultStartTime(startTime);
        setDefaultEndTime(endTime);
        setSelectedTask(null);
        setShowModal(true);
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setShowModal(true);
    };

    const handleTaskMove = async (taskId: string, newStartTime: string, newEndTime: string) => {
        if (!user) return;
        await updateTask(user.uid, taskId, { startTime: newStartTime, endTime: newEndTime });
    };

    const handleSaveTask = async (input: CreateTaskInput) => {
        if (!user) return;

        if (selectedTask) {
            await updateTask(user.uid, selectedTask.id, input);
        } else {
            await createTask(user.uid, {
                ...input,
                scope: 'day',
                scopeKey: dateStr,
                startTime: input.startTime || defaultStartTime,
                endTime: input.endTime || defaultEndTime,
            });
        }
    };

    const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

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
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard/calendar')}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all shadow-lg"
                        >
                            <Calendar className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full px-1 py-1 border border-white/20 shadow-lg">
                            <button
                                onClick={() => navigateDay('prev')}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 font-medium text-white">
                                {format(currentDate, 'MMM d, yyyy')}
                            </span>
                            <button
                                onClick={() => navigateDay('next')}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {isToday && (
                            <span className="px-3 py-1 bg-green-500/20 backdrop-blur-xl text-green-300 text-sm font-medium rounded-full border border-green-500/30">
                                Today
                            </span>
                        )}
                    </div>

                    {/* Center: Day Name */}
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                            {format(currentDate, 'EEEE')}
                        </h1>
                        <p className="text-white/50 text-sm">
                            {tasks.length} task{tasks.length !== 1 ? 's' : ''} scheduled
                        </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleAddTask('09:00', '10:00')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/80 backdrop-blur-xl text-white rounded-full font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all border border-blue-400/30"
                        >
                            <Plus className="w-4 h-4" />
                            Add Task
                        </button>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Time Canvas - Liquid Glass */}
                    <motion.div
                        className="flex-1 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <TimeCanvas
                            tasks={tasks}
                            onTaskClick={handleTaskClick}
                            onAddTask={handleAddTask}
                            onTaskMove={handleTaskMove}
                        />
                    </motion.div>

                    {/* Sidebar: Parent Tasks / Goals - Liquid Glass */}
                    <motion.div
                        className="w-80 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl p-6 overflow-y-auto"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Decorative accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-80 rounded-t-[40px]" />

                        <div className="flex items-center gap-2 mb-6">
                            <Layers className="w-5 h-5 text-blue-400" />
                            <h2 className="font-semibold text-white">Contributing To</h2>
                        </div>

                        {tasks.filter(t => t.parentTaskId).length > 0 ? (
                            <div className="space-y-3">
                                {Array.from(new Set(tasks.filter(t => t.parentTaskId).map(t => t.parentTaskId)))
                                    .map(parentId => {
                                        const childTasks = tasks.filter(t => t.parentTaskId === parentId);
                                        const totalContribution = childTasks.reduce((sum, t) => sum + (t.contributionPercent || 0), 0);

                                        return (
                                            <div key={parentId} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-white/70 truncate">
                                                        Parent Task
                                                    </span>
                                                    <span className="text-xs text-blue-400 font-medium">
                                                        +{totalContribution}%
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    {childTasks.map(task => (
                                                        <div
                                                            key={task.id}
                                                            className="flex items-center gap-2 text-xs text-white/50"
                                                        >
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: task.color }}
                                                            />
                                                            <span className="truncate">{task.title}</span>
                                                            <span className="ml-auto text-white/30">
                                                                {task.contributionPercent}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        ) : (
                            <div className="text-center py-8 text-white/40">
                                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No linked goals</p>
                                <p className="text-xs mt-1 text-white/30">Link tasks to week/month goals</p>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <h3 className="text-sm font-medium text-white/50 mb-4">Today's Progress</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-center border border-blue-500/20">
                                    <div className="text-2xl font-bold text-blue-400">
                                        {tasks.filter(t => t.status === 'done').length}
                                    </div>
                                    <div className="text-xs text-blue-300/60">Completed</div>
                                </div>
                                <div className="p-3 bg-amber-500/10 rounded-xl text-center border border-amber-500/20">
                                    <div className="text-2xl font-bold text-amber-400">
                                        {tasks.filter(t => t.status === 'pending').length}
                                    </div>
                                    <div className="text-xs text-amber-300/60">Pending</div>
                                </div>
                            </div>
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
                    defaultScope="day"
                    defaultScopeKey={dateStr}
                    userId={user.uid}
                />
            )}
        </div>
    );
}
