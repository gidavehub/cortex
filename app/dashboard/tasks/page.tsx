"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Filter, CheckCircle2, Clock, Calendar, Layers, TrendingUp, Target, MoreHorizontal, Trash2, Edit, Megaphone, Users, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { Task, TaskScope, TASK_COLORS } from "@/lib/types/task";
import { TaskModal } from "@/components/tasks/TaskModal";
import { createTask, updateTask } from "@/lib/firebase-tasks";
import { cn } from "@/lib/utils";
import { subscribeMeetings, subscribeFollowUps, OutreachContact } from "@/lib/firebase-outreach";

const SCOPE_CONFIG = {
    day: { label: 'Daily', icon: Clock, color: 'blue' },
    week: { label: 'Weekly', icon: Layers, color: 'indigo' },
    month: { label: 'Monthly', icon: Calendar, color: 'purple' },
    year: { label: 'Yearly', icon: TrendingUp, color: 'rose' },
    client: { label: 'Client', icon: Target, color: 'emerald' },
};

type FilterScope = 'all' | TaskScope;
type FilterStatus = 'all' | 'pending' | 'in-progress' | 'done';

export default function TasksPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterScope, setFilterScope] = useState<FilterScope>('all');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [contextMenu, setContextMenu] = useState<{ task: Task; x: number; y: number } | null>(null);
    const [meetingContacts, setMeetingContacts] = useState<OutreachContact[]>([]);
    const [followUpContacts, setFollowUpContacts] = useState<OutreachContact[]>([]);

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

    // Fetch outreach meetings and follow-ups
    useEffect(() => {
        if (!user) return;
        const unsub1 = subscribeMeetings(user.uid, setMeetingContacts);
        const unsub2 = subscribeFollowUps(user.uid, setFollowUpContacts);
        return () => { unsub1(); unsub2(); };
    }, [user]);

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesScope = filterScope === 'all' || task.scope === filterScope;
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        return matchesSearch && matchesScope && matchesStatus;
    });

    // Group by scope
    const groupedTasks = {
        day: filteredTasks.filter(t => t.scope === 'day'),
        week: filteredTasks.filter(t => t.scope === 'week'),
        month: filteredTasks.filter(t => t.scope === 'month'),
        year: filteredTasks.filter(t => t.scope === 'year'),
        client: filteredTasks.filter(t => t.scope === 'client'),
    };

    const handleSaveTask = async (input: any) => {
        if (!user) return;

        if (selectedTask) {
            await updateTask(user.uid, selectedTask.id, input);
        } else {
            await createTask(user.uid, input);
        }
    };

    const handleDeleteTask = async (task: Task) => {
        if (!user) return;
        if (confirm(`Delete "${task.title}"?`)) {
            await deleteDoc(doc(db, "users", user.uid, "tasks", task.id));
        }
        setContextMenu(null);
    };

    const handleToggleStatus = async (task: Task) => {
        if (!user) return;
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        const newProgress = newStatus === 'done' ? 100 : task.progress;
        await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
            status: newStatus,
            progress: newProgress
        });
    };

    const handleContextMenu = (e: React.MouseEvent, task: Task) => {
        e.preventDefault();
        setContextMenu({ task, x: e.clientX, y: e.clientY });
    };

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const todaySlug = format(new Date(), 'yyyy-MM-dd');

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-[#1A1C1E]">All Tasks</h1>
                    <p className="text-gray-500 mt-1">{tasks.length} total • {tasks.filter(t => t.status !== 'done').length} pending</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedTask(null);
                        setShowModal(true);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Task
                </button>
            </motion.div>

            {/* Search & Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-4"
            >
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                {/* Scope Filter */}
                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {(['all', 'day', 'week', 'month', 'year'] as const).map(scope => (
                        <button
                            key={scope}
                            onClick={() => setFilterScope(scope)}
                            className={cn(
                                "px-4 py-3 text-sm font-medium transition-colors",
                                filterScope === scope
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            {scope === 'all' ? 'All' : SCOPE_CONFIG[scope].label}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {(['all', 'pending', 'in-progress', 'done'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                                "px-4 py-3 text-sm font-medium transition-colors capitalize",
                                filterStatus === status
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            {status === 'all' ? 'All Status' : status}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Task List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            ) : filteredTasks.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                >
                    <Target className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No tasks found</h3>
                    <p className="text-gray-500 mb-6">
                        {searchQuery ? 'Try a different search term' : 'Create your first task to get started'}
                    </p>
                    <button
                        onClick={() => {
                            setSelectedTask(null);
                            setShowModal(true);
                        }}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                        Create Task
                    </button>
                </motion.div>
            ) : (
                <>
                    {/* ── Outreach Meetings & Follow-ups Section ── */}
                    {(meetingContacts.length > 0 || followUpContacts.length > 0) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {meetingContacts.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">Scheduled Meetings</h2>
                                        <span className="text-sm text-gray-400">{meetingContacts.length}</span>
                                    </div>
                                    <div className="grid gap-2">
                                        {meetingContacts.map((c, idx) => (
                                            <motion.div
                                                key={`meeting-${c.id}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-indigo-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                                                onClick={() => router.push(`/dashboard/outreach/${c.id}`)}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                                                </div>
                                                <div className="w-1 h-10 rounded-full bg-indigo-400 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">Meeting: {c.businessName}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {c.contactPerson && `${c.contactPerson} · `}
                                                        {c.meetingDate ? format(c.meetingDate, "MMM d, yyyy") : "Date TBD"}
                                                        {c.meetingTime ? ` at ${c.meetingTime}` : ""}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 rounded-lg text-[11px] font-medium bg-indigo-50 text-indigo-600">Meeting Set</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {followUpContacts.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <Bell className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">Follow-ups Due</h2>
                                        <span className="text-sm text-gray-400">{followUpContacts.length}</span>
                                    </div>
                                    <div className="grid gap-2">
                                        {followUpContacts.map((c, idx) => (
                                            <motion.div
                                                key={`followup-${c.id}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer"
                                                onClick={() => router.push(`/dashboard/outreach/${c.id}`)}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                                                </div>
                                                <div className="w-1 h-10 rounded-full bg-amber-400 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">Follow up: {c.businessName}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {c.contactPerson && `${c.contactPerson} · `}
                                                        {c.followUpDate ? format(c.followUpDate, "MMM d, yyyy") : ""}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-600">Follow Up</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Regular Task List ── */}
                    {filterScope === 'all' ? (
                        // Grouped view
                        <div className="space-y-8">
                            {(Object.keys(groupedTasks) as TaskScope[]).map(scope => {
                                const scopeTasks = groupedTasks[scope];
                                if (scopeTasks.length === 0) return null;

                                const config = SCOPE_CONFIG[scope];
                                const Icon = config.icon;

                                return (
                                    <motion.div
                                        key={scope}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-8 h-8 rounded-lg bg-${config.color}-100 flex items-center justify-center`}>
                                                <Icon className={`w-4 h-4 text-${config.color}-500`} />
                                            </div>
                                            <h2 className="text-lg font-semibold text-gray-900">{config.label} Tasks</h2>
                                            <span className="text-sm text-gray-400">{scopeTasks.length}</span>
                                        </div>

                                        <div className="grid gap-3">
                                            {scopeTasks.map((task, idx) => (
                                                <TaskRow
                                                    key={task.id}
                                                    task={task}
                                                    index={idx}
                                                    onContextMenu={handleContextMenu}
                                                    onToggle={handleToggleStatus}
                                                    onEdit={() => {
                                                        setSelectedTask(task);
                                                        setShowModal(true);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        // Flat list
                        <div className="grid gap-3">
                            {filteredTasks.map((task, idx) => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    index={idx}
                                    onContextMenu={handleContextMenu}
                                    onToggle={handleToggleStatus}
                                    onEdit={() => {
                                        setSelectedTask(task);
                                        setShowModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 min-w-[160px]"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            onClick={() => {
                                setSelectedTask(contextMenu.task);
                                setShowModal(true);
                                setContextMenu(null);
                            }}
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </button>
                        <Link href={`/dashboard/tasks/${contextMenu.task.id}`}>
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                View Details
                            </button>
                        </Link>
                        <hr className="my-2 border-gray-100" />
                        <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            onClick={() => handleDeleteTask(contextMenu.task)}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    defaultScopeKey={todaySlug}
                    userId={user.uid}
                />
            )}
        </div>
    );
}

// Task Row Component
function TaskRow({
    task,
    index,
    onContextMenu,
    onToggle,
    onEdit
}: {
    task: Task;
    index: number;
    onContextMenu: (e: React.MouseEvent, task: Task) => void;
    onToggle: (task: Task) => void;
    onEdit: () => void;
}) {
    const config = SCOPE_CONFIG[task.scope];
    const Icon = config.icon;
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
                "group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer",
                task.status === 'done' && "opacity-60"
            )}
            onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
            onContextMenu={(e) => onContextMenu(e, task)}
        >
            {/* Checkbox */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(task);
                }}
                className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                    task.status === 'done'
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-green-400"
                )}
            >
                {task.status === 'done' && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                )}
            </button>

            {/* Color indicator */}
            <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.color || TASK_COLORS[0] }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "font-medium text-gray-900 truncate",
                    task.status === 'done' && "line-through text-gray-400"
                )}>
                    {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        `bg-${config.color}-50 text-${config.color}-600`
                    )}>
                        {config.label}
                    </span>
                    <span className="text-xs text-gray-400">{task.scopeKey}</span>
                    {task.startTime && (
                        <span className="text-xs text-gray-400">
                            • {task.startTime} - {task.endTime}
                        </span>
                    )}
                </div>
            </div>

            {/* Progress */}
            {task.progress > 0 && task.progress < 100 && (
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${task.progress}%`,
                            backgroundColor: task.color || TASK_COLORS[0]
                        }}
                    />
                </div>
            )}

            {/* Actions */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                }}
                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all text-gray-400 hover:text-blue-600"
                title="Edit Task"
            >
                <Edit className="w-4 h-4" />
            </button>
            <button
                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                title="View Details"
                onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/tasks/${task.id}`);
                }}
            >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
        </motion.div>
    );
}
