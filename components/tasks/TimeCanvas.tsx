"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Task, TASK_COLORS } from "@/lib/types/task";
import { cn } from "@/lib/utils";
import { Plus, GripVertical } from "lucide-react";

interface TimeCanvasProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onAddTask: (startTime: string, endTime: string) => void;
    onTaskMove?: (taskId: string, newStartTime: string, newEndTime: string) => void;
}

const HOUR_HEIGHT = 80;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getTaskPosition(startTime: string, endTime: string): { top: number; height: number } {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
    return { top, height: Math.max(height, 40) };
}

function formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
}

export function TimeCanvas({ tasks, onTaskClick, onAddTask, onTaskMove }: TimeCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingTask, setDraggingTask] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const currentTimePosition = (currentTime.getHours() * 60 + currentTime.getMinutes()) / 60 * HOUR_HEIGHT;

    useEffect(() => {
        if (containerRef.current) {
            const scrollTo = Math.max(0, currentTimePosition - 200);
            containerRef.current.scrollTop = scrollTo;
        }
    }, []);

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = containerRef.current.scrollTop;
        const clickY = e.clientY - rect.top + scrollTop;

        const minutesFromMidnight = (clickY / HOUR_HEIGHT) * 60;
        const roundedMinutes = Math.round(minutesFromMidnight / 15) * 15;

        const startTime = minutesToTime(roundedMinutes);
        const endTime = minutesToTime(roundedMinutes + 60);

        onAddTask(startTime, endTime);
    };

    const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
        if (!task.startTime) return;

        setDraggingTask(task.id);

        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!draggingTask || !containerRef.current) {
            setDraggingTask(null);
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = containerRef.current.scrollTop;
        const dropY = e.clientY - rect.top + scrollTop;

        const minutesFromMidnight = (dropY / HOUR_HEIGHT) * 60;
        const roundedMinutes = Math.round(minutesFromMidnight / 15) * 15;

        const task = tasks.find(t => t.id === draggingTask);
        if (task && task.startTime && task.endTime && onTaskMove) {
            const duration = timeToMinutes(task.endTime) - timeToMinutes(task.startTime);
            const newStartTime = minutesToTime(roundedMinutes);
            const newEndTime = minutesToTime(roundedMinutes + duration);

            onTaskMove(task.id, newStartTime, newEndTime);
        }

        setDraggingTask(null);
    };

    return (
        <div
            ref={containerRef}
            className="relative h-full overflow-y-auto overflow-x-hidden no-scrollbar"
            onDoubleClick={handleDoubleClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            {/* Time Grid */}
            <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
                {/* Hour lines and labels */}
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-white/10"
                        style={{ top: hour * HOUR_HEIGHT }}
                    >
                        <span className="absolute -top-3 left-4 text-xs text-white/40 font-medium px-2 py-0.5 rounded-full bg-white/5">
                            {formatHour(hour)}
                        </span>
                    </div>
                ))}

                {/* Current time indicator */}
                <motion.div
                    className="absolute left-16 right-4 flex items-center z-20"
                    style={{ top: currentTimePosition }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-500/50 -ml-1.5" />
                    <div className="flex-1 h-0.5 bg-green-400 shadow-lg shadow-green-500/30" />
                    <span className="text-[10px] text-green-300 font-medium ml-2">
                        {format12Hour(currentTime)}
                    </span>
                </motion.div>

                {/* Tasks */}
                <div className="absolute left-20 right-4">
                    {tasks
                        .filter(task => task.startTime && task.endTime)
                        .map((task, index) => {
                            const pos = getTaskPosition(task.startTime!, task.endTime!);
                            const isBeingDragged = draggingTask === task.id;

                            return (
                                <motion.div
                                    key={task.id}
                                    className={cn(
                                        "absolute left-0 right-0 pr-2",
                                        isBeingDragged && "opacity-50"
                                    )}
                                    style={{
                                        top: pos.top,
                                        height: pos.height,
                                        zIndex: isBeingDragged ? 100 : 10 + index
                                    }}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    draggable
                                    onDragStart={(e) => handleTaskDragStart(e as any, task)}
                                >
                                    <div
                                        className="group h-full rounded-2xl overflow-hidden cursor-move backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all"
                                        style={{
                                            backgroundColor: `${task.color || TASK_COLORS[0]}20`,
                                            borderLeftWidth: '4px',
                                            borderLeftColor: task.color || TASK_COLORS[0]
                                        }}
                                        onClick={() => onTaskClick(task)}
                                    >
                                        {/* Drag Handle */}
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
                                            <GripVertical className="w-4 h-4 text-white" />
                                        </div>

                                        <div className="p-3 h-full flex flex-col pl-6">
                                            <h4 className={cn(
                                                "font-semibold text-sm",
                                                task.status === 'done' && "line-through opacity-50"
                                            )}
                                                style={{ color: task.color || TASK_COLORS[0] }}
                                            >
                                                {task.title}
                                            </h4>
                                            <p className="text-xs text-white/50 mt-0.5">
                                                {task.startTime} - {task.endTime}
                                            </p>
                                            {task.description && pos.height > 80 && (
                                                <p className="text-xs text-white/40 mt-1 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            {/* Progress indicator */}
                                            {task.progress > 0 && pos.height > 60 && (
                                                <div className="mt-auto pt-2">
                                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: task.color || TASK_COLORS[0] }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${task.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                </div>

                {/* Empty state hint */}
                {tasks.length === 0 && (
                    <div
                        className="absolute left-1/2 -translate-x-1/2 text-center text-white/40 pointer-events-none"
                        style={{ top: 9 * HOUR_HEIGHT }}
                    >
                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-3">
                            <Plus className="w-7 h-7 text-white/50" />
                        </div>
                        <p className="text-sm font-medium text-white/60">Double-click to add a task</p>
                        <p className="text-xs mt-1 text-white/30">or use the + button</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function format12Hour(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
}
