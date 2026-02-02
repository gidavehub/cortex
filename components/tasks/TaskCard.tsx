"use client";

import { Task, TASK_COLORS, CONFIDENCE_CONFIG } from "@/lib/types/task";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock, Link as LinkIcon, Image, Video, CheckSquare, ChevronRight, GripVertical, Target, Lock, GitBranch } from "lucide-react";

interface TaskCardProps {
    task: Task;
    onClick?: () => void;
    onDragStart?: (e: React.DragEvent) => void;
    variant?: 'default' | 'compact' | 'timeline';
    showParent?: boolean;
    parentTask?: Task | null;
}

export function TaskCard({
    task,
    onClick,
    onDragStart,
    variant = 'default',
    showParent = false,
    parentTask
}: TaskCardProps) {
    const hasContent = task.content && (
        (task.content.images && task.content.images.length > 0) ||
        (task.content.links && task.content.links.length > 0) ||
        (task.content.videos && task.content.videos.length > 0) ||
        (task.content.checklist && task.content.checklist.length > 0)
    );

    const checklistProgress = task.content?.checklist
        ? Math.round((task.content.checklist.filter(c => c.done).length / task.content.checklist.length) * 100)
        : null;

    const statusColors = {
        pending: 'bg-gray-100 text-gray-600',
        'in-progress': 'bg-blue-100 text-blue-600',
        done: 'bg-green-100 text-green-600',
        blocked: 'bg-orange-100 text-orange-600'
    };

    // Get confidence info for milestone
    const milestoneConfidence = task.isMilestone && task.milestoneConditions?.[0]?.confidence
        ? CONFIDENCE_CONFIG[task.milestoneConditions[0].confidence]
        : null;

    if (variant === 'timeline') {
        // Compact version for TimeCanvas
        return (
            <motion.div
                layoutId={task.id}
                draggable
                onDragStart={onDragStart}
                onClick={onClick}
                className={cn(
                    "group relative rounded-xl p-3 cursor-pointer transition-all border-l-4",
                    "bg-white/90 backdrop-blur-sm shadow-md hover:shadow-xl",
                    "hover:-translate-y-0.5"
                )}
                style={{ borderLeftColor: task.color || TASK_COLORS[0] }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Drag Handle */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
                    <GripVertical className="w-3 h-3 text-gray-400" />
                </div>

                <div className="flex items-start gap-2">
                    {/* Color dot */}
                    <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: task.color || TASK_COLORS[0] }}
                    />

                    <div className="flex-1 min-w-0">
                        <h4 className={cn(
                            "font-medium text-sm truncate",
                            task.status === 'done' && "line-through text-gray-400"
                        )}>
                            {task.title}
                        </h4>

                        {task.startTime && task.endTime && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {task.startTime} - {task.endTime}
                            </p>
                        )}
                    </div>

                    {/* Content indicators */}
                    <div className="flex gap-1 flex-shrink-0">
                        {task.content?.images?.length! > 0 && (
                            <Image className="w-3 h-3 text-gray-300" />
                        )}
                        {task.content?.links?.length! > 0 && (
                            <LinkIcon className="w-3 h-3 text-gray-300" />
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                {task.progress > 0 && (
                    <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: task.color || TASK_COLORS[0] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                        />
                    </div>
                )}
            </motion.div>
        );
    }

    // Default full card
    return (
        <motion.div
            layoutId={task.id}
            onClick={onClick}
            className={cn(
                "group relative rounded-2xl p-4 cursor-pointer transition-all",
                "bg-white shadow-md hover:shadow-xl border border-gray-100",
                "hover:-translate-y-1",
                task.status === 'blocked' && "opacity-70"
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            {/* Color accent bar */}
            <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ backgroundColor: task.color || TASK_COLORS[0] }}
            />

            {/* Milestone badge */}
            {task.isMilestone && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                    <Target className="w-3 h-3" />
                    <span>Milestone</span>
                    {milestoneConfidence && (
                        <span
                            className="ml-1 px-1.5 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: milestoneConfidence.color + '40' }}
                        >
                            {milestoneConfidence.percent}%
                        </span>
                    )}
                </div>
            )}

            {/* Blocked overlay */}
            {task.status === 'blocked' && (
                <div className="absolute inset-0 bg-gray-900/5 rounded-2xl flex items-center justify-center pointer-events-none">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium shadow",
                        task.blockedByConditionalId
                            ? "bg-purple-100 text-purple-700"
                            : "bg-orange-100 text-orange-700"
                    )}>
                        {task.blockedByConditionalId ? (
                            <>
                                <GitBranch className="w-4 h-4" />
                                <span>Waiting for conditional</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                <span>Waiting for milestone</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between gap-4 mt-1">
                <div className="flex-1 min-w-0">
                    {/* Parent indicator */}
                    {showParent && parentTask && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            <span className="truncate">{parentTask.title}</span>
                            <ChevronRight className="w-3 h-3" />
                        </div>
                    )}

                    <h3 className={cn(
                        "font-semibold text-gray-900",
                        task.status === 'done' && "line-through text-gray-400"
                    )}>
                        {task.title}
                    </h3>

                    {task.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {/* Time slot */}
                    {task.startTime && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                            <Clock className="w-3 h-3" />
                            {task.startTime}{task.endTime && ` - ${task.endTime}`}
                        </div>
                    )}
                </div>

                {/* Status badge */}
                <span className={cn(
                    "px-2 py-1 rounded-lg text-xs font-medium capitalize",
                    statusColors[task.status]
                )}>
                    {task.status.replace('-', ' ')}
                </span>
            </div>

            {/* Rich content indicators */}
            {hasContent && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                    {task.content?.images && task.content.images.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Image className="w-3.5 h-3.5" />
                            <span>{task.content.images.length}</span>
                        </div>
                    )}
                    {task.content?.links && task.content.links.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>{task.content.links.length}</span>
                        </div>
                    )}
                    {task.content?.videos && task.content.videos.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Video className="w-3.5 h-3.5" />
                            <span>{task.content.videos.length}</span>
                        </div>
                    )}
                    {task.content?.checklist && task.content.checklist.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>{task.content.checklist.filter(c => c.done).length}/{task.content.checklist.length}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Progress bar */}
            {(task.progress > 0 || checklistProgress !== null) && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{checklistProgress ?? task.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: task.color || TASK_COLORS[0] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${checklistProgress ?? task.progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
            )}

            {/* Contribution indicator */}
            {task.contributionPercent && task.parentTaskId && (
                <div className="mt-2 text-xs text-gray-400">
                    Contributes {task.contributionPercent}% to parent
                </div>
            )}
        </motion.div>
    );
}
