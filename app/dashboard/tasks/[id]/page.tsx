"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
    ArrowLeft, Calendar, Clock, Layers, TrendingUp, Target, Edit, Trash2,
    CheckCircle2, Circle, Play, ExternalLink, Image, Video, Link as LinkIcon,
    ChevronRight, Plus
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Task, TASK_COLORS, TaskChecklistItem, TaskLink } from "@/lib/types/task";
import { TaskModal } from "@/components/tasks/TaskModal";
import { updateTask, getChildTasks, getTask } from "@/lib/firebase-tasks";
import { cn } from "@/lib/utils";

const SCOPE_CONFIG = {
    day: { label: 'Daily Task', icon: Clock, color: 'blue', bgGradient: 'from-blue-500 to-cyan-500' },
    week: { label: 'Week Goal', icon: Layers, color: 'indigo', bgGradient: 'from-indigo-500 to-purple-500' },
    month: { label: 'Month Objective', icon: Calendar, color: 'purple', bgGradient: 'from-purple-500 to-pink-500' },
    year: { label: 'Year Goal', icon: TrendingUp, color: 'rose', bgGradient: 'from-rose-500 to-orange-500' },
};

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const taskId = params.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [parentTask, setParentTask] = useState<Task | null>(null);
    const [childTasks, setChildTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Fetch task
    useEffect(() => {
        if (!user || !taskId) return;

        const unsubscribe = onSnapshot(
            doc(db, "users", user.uid, "tasks", taskId),
            async (snapshot) => {
                if (snapshot.exists()) {
                    const taskData = {
                        id: snapshot.id,
                        ...snapshot.data(),
                        createdAt: snapshot.data().createdAt?.toDate?.() || new Date(),
                        updatedAt: snapshot.data().updatedAt?.toDate?.() || new Date(),
                    } as Task;
                    setTask(taskData);

                    // Fetch parent if exists
                    if (taskData.parentTaskId) {
                        const parent = await getTask(user.uid, taskData.parentTaskId);
                        setParentTask(parent);
                    }

                    // Fetch children
                    const children = await getChildTasks(user.uid, taskId);
                    setChildTasks(children);
                } else {
                    router.push('/dashboard/tasks');
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, taskId, router]);

    const handleToggleStatus = async () => {
        if (!user || !task) return;
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        const newProgress = newStatus === 'done' ? 100 : task.progress;
        await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
            status: newStatus,
            progress: newProgress
        });
    };

    const handleDelete = async () => {
        if (!user || !task) return;
        if (confirm(`Delete "${task.title}"? This cannot be undone.`)) {
            await deleteDoc(doc(db, "users", user.uid, "tasks", task.id));
            router.push('/dashboard/tasks');
        }
    };

    const handleChecklistToggle = async (itemId: string) => {
        if (!user || !task || !task.content?.checklist) return;

        const updatedChecklist = task.content.checklist.map(item =>
            item.id === itemId ? { ...item, done: !item.done } : item
        );

        await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
            'content.checklist': updatedChecklist
        });
    };

    const handleSaveTask = async (input: any) => {
        if (!user || !task) return;
        await updateTask(user.uid, task.id, input);
    };

    const getScopeHref = () => {
        if (!task) return '';
        switch (task.scope) {
            case 'day': return `/dashboard/calendar/day/${task.scopeKey}`;
            case 'week': return `/dashboard/calendar/week/${task.scopeKey}`;
            case 'month': return `/dashboard/calendar/month/${task.scopeKey}`;
            case 'year': return `/dashboard/calendar/year/${task.scopeKey}`;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="text-center py-20">
                <Target className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Task not found</h3>
                <Link href="/dashboard/tasks">
                    <button className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-xl">
                        Back to Tasks
                    </button>
                </Link>
            </div>
        );
    }

    const config = SCOPE_CONFIG[task.scope];
    const Icon = config.icon;
    const checklistProgress = task.content?.checklist
        ? Math.round((task.content.checklist.filter(i => i.done).length / task.content.checklist.length) * 100)
        : 0;

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8"
            >
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Link href="/dashboard/tasks" className="hover:text-gray-700">Tasks</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-700">{task.title}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowModal(true)}
                        className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <Edit className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                </div>
            </motion.div>

            {/* Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`relative rounded-3xl p-8 bg-gradient-to-br ${config.bgGradient} text-white overflow-hidden mb-8`}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -ml-24 -mb-24" />

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-white/70 text-sm">{config.label}</span>
                                <Link href={getScopeHref()}>
                                    <p className="text-white/90 text-sm hover:underline flex items-center gap-1">
                                        {task.scopeKey}
                                        <ExternalLink className="w-3 h-3" />
                                    </p>
                                </Link>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleStatus}
                            className={cn(
                                "px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2",
                                task.status === 'done'
                                    ? "bg-white text-green-600"
                                    : "bg-white/20 hover:bg-white/30"
                            )}
                        >
                            {task.status === 'done' ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Completed
                                </>
                            ) : task.status === 'in-progress' ? (
                                <>
                                    <Play className="w-4 h-4" />
                                    In Progress
                                </>
                            ) : (
                                <>
                                    <Circle className="w-4 h-4" />
                                    Mark Done
                                </>
                            )}
                        </button>
                    </div>

                    <h1 className="text-3xl font-bold mb-3">{task.title}</h1>
                    {task.description && (
                        <p className="text-white/80 text-lg">{task.description}</p>
                    )}

                    {/* Time */}
                    {task.startTime && (
                        <div className="mt-4 flex items-center gap-2 text-white/70">
                            <Clock className="w-4 h-4" />
                            <span>{task.startTime} - {task.endTime}</span>
                        </div>
                    )}

                    {/* Progress */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-white/70">Progress</span>
                            <span className="font-bold">{task.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${task.progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-6">
                {/* Main Content - 2 cols */}
                <div className="col-span-2 space-y-6">
                    {/* Checklist */}
                    {task.content?.checklist && task.content.checklist.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-gray-900">Checklist</h2>
                                <span className="text-sm text-gray-500">
                                    {task.content.checklist.filter(i => i.done).length}/{task.content.checklist.length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {task.content.checklist.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                                            item.done ? "bg-green-50" : "bg-gray-50 hover:bg-gray-100"
                                        )}
                                        onClick={() => handleChecklistToggle(item.id)}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                            item.done ? "bg-green-500 border-green-500" : "border-gray-300"
                                        )}>
                                            {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={cn(
                                            item.done && "line-through text-gray-400"
                                        )}>
                                            {item.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Links */}
                    {task.content?.links && task.content.links.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                        >
                            <h2 className="font-semibold text-gray-900 mb-4">Links</h2>
                            <div className="space-y-2">
                                {task.content.links.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                        <LinkIcon className="w-4 h-4 text-blue-500" />
                                        <span className="text-blue-700 font-medium">{link.label}</span>
                                        <ExternalLink className="w-3 h-3 text-blue-400 ml-auto" />
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Child Tasks */}
                    {childTasks.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                        >
                            <h2 className="font-semibold text-gray-900 mb-4">Contributing Tasks</h2>
                            <div className="space-y-2">
                                {childTasks.map((child) => (
                                    <Link key={child.id} href={`/dashboard/tasks/${child.id}`}>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div
                                                className="w-2 h-8 rounded-full"
                                                style={{ backgroundColor: child.color || TASK_COLORS[0] }}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{child.title}</p>
                                                <p className="text-xs text-gray-500">{child.scope} • {child.scopeKey}</p>
                                            </div>
                                            <span className="text-sm font-medium text-gray-500">
                                                {child.contributionPercent}%
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar - 1 col */}
                <div className="space-y-6">
                    {/* Parent Task */}
                    {parentTask && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                        >
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Contributing To</h3>
                            <Link href={`/dashboard/tasks/${parentTask.id}`}>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: parentTask.color || TASK_COLORS[0] }}
                                        />
                                        <span className="text-xs text-gray-500 uppercase">{parentTask.scope}</span>
                                    </div>
                                    <p className="font-medium text-gray-900">{parentTask.title}</p>
                                    <p className="text-sm text-blue-600 mt-2">
                                        +{task.contributionPercent}% contribution
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    )}

                    {/* Meta Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                    >
                        <h3 className="text-sm font-medium text-gray-500 mb-4">Details</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Created</p>
                                <p className="text-sm text-gray-700">
                                    {format(task.createdAt, 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                                <p className="text-sm text-gray-700">
                                    {format(task.updatedAt, 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>
                            {task.content?.images && task.content.images.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Attachments</p>
                                    <p className="text-sm text-gray-700 flex items-center gap-1">
                                        <Image className="w-4 h-4" />
                                        {task.content.images.length} image(s)
                                    </p>
                                </div>
                            )}
                            {task.content?.videos && task.content.videos.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Videos</p>
                                    <p className="text-sm text-gray-700 flex items-center gap-1">
                                        <Video className="w-4 h-4" />
                                        {task.content.videos.length} video(s)
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Task Modal */}
            {user && (
                <TaskModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSave={handleSaveTask}
                    initialTask={task}
                    defaultScope={task.scope}
                    defaultScopeKey={task.scopeKey}
                    userId={user.uid}
                />
            )}
        </div>
    );
}
