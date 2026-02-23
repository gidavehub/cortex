
"use client";

import { useEffect, useState } from "react";
import { Task, TaskPriority, CreateTaskInput, TaskScope, TASK_COLORS, PRIORITY_CONFIG } from "@/lib/types/task";
import { subscribeTasks, updateTask, createTask, deleteTask } from "@/lib/firebase-tasks";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Plus, CheckCircle, Circle, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface ClientTasksProps {
    clientId: string;
}

export function ClientTasks({ clientId }: ClientTasksProps) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        if (!user || !clientId) return;

        // Subscribe to tasks with scope='client' and scopeKey=clientId
        const unsubscribe = subscribeTasks(user.uid, 'client', clientId, (data) => {
            setTasks(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, clientId]);

    const handleCreateTask = async (input: CreateTaskInput) => {
        if (!user) return;
        try {
            await createTask(user.uid, input);
        } catch (error) {
            console.error("Error creating task:", error);
        }
    };

    const handleToggleStatus = async (task: Task) => {
        if (!user) return;
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        const progress = newStatus === 'done' ? 100 : 0;
        await updateTask(user.uid, task.id, { status: newStatus, progress });
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!user) return;
        if (confirm("Are you sure you want to delete this task?")) {
            await deleteTask(user.uid, taskId);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Tasks & To-Dos</h3>
                <button
                    onClick={() => {
                        setSelectedTask(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {tasks.map((task) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={task.id}
                            className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${task.status === 'done'
                                    ? 'bg-gray-50 border-gray-100 opacity-60'
                                    : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'
                                }`}
                        >
                            <button
                                onClick={() => handleToggleStatus(task)}
                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'done'
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-gray-300 hover:border-blue-500 text-transparent'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                            </button>

                            <div className="flex-1 cursor-pointer" onClick={() => {
                                setSelectedTask(task);
                                setIsModalOpen(true);
                            }}>
                                <h4 className={`font-medium ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                    {task.title}
                                </h4>
                                {task.description && (
                                    <p className="text-sm text-gray-500 truncate max-w-md">{task.description}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {task.priority !== 'medium' && (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium bg-${PRIORITY_CONFIG[task.priority].color} bg-opacity-10 text-${PRIORITY_CONFIG[task.priority].color}`} style={{ color: PRIORITY_CONFIG[task.priority].color, backgroundColor: PRIORITY_CONFIG[task.priority].bgColor }}>
                                        {PRIORITY_CONFIG[task.priority].label}
                                    </span>
                                )}
                                {task.deadline && (
                                    <span className={`text-xs flex items-center gap-1 ${new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-gray-400'
                                        }`}>
                                        <Clock className="w-3 h-3" />
                                        {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {tasks.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">No tasks yet</p>
                        <p className="text-xs mt-1">Add tasks to track work for this client</p>
                    </div>
                )}
            </div>

            {user && (
                <TaskModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleCreateTask}
                    userId={user.uid}
                    initialTask={selectedTask}
                    defaultScope="client"
                    defaultScopeKey={clientId}
                />
            )}
        </div>
    );
}
