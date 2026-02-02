"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Link as LinkIcon, Image, Video, CheckSquare, Clock, Layers, Flag, Calendar, AlertTriangle, Target, Zap, GitBranch } from "lucide-react";
import { Task, TaskScope, TaskPriority, CreateTaskInput, TASK_COLORS, TaskLink, TaskChecklistItem, PRIORITY_CONFIG, MilestoneCondition, MilestoneOutcome, ConfidenceLevel, CONFIDENCE_CONFIG } from "@/lib/types/task";
import { Conditional, URGENCY_CONFIG } from "@/lib/types/conditional";
import { getPotentialParentTasks } from "@/lib/firebase-tasks";
import { getConditionals } from "@/lib/firebase-conditionals";
import { cn } from "@/lib/utils";

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: CreateTaskInput) => Promise<void>;
    initialTask?: Task | null;
    defaultScope?: TaskScope;
    defaultScopeKey?: string;
    userId: string;
}

export function TaskModal({
    isOpen,
    onClose,
    onSave,
    initialTask,
    defaultScope = 'day',
    defaultScopeKey = '',
    userId
}: TaskModalProps) {
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scope, setScope] = useState<TaskScope>(defaultScope);
    const [scopeKey, setScopeKey] = useState(defaultScopeKey);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [color, setColor] = useState(TASK_COLORS[0]);
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [deadline, setDeadline] = useState<string>('');

    // Rich content
    const [images, setImages] = useState<string[]>([]);
    const [links, setLinks] = useState<TaskLink[]>([]);
    const [videos, setVideos] = useState<string[]>([]);
    const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);

    // Parent task
    const [parentTaskId, setParentTaskId] = useState<string | undefined>();
    const [contributionPercent, setContributionPercent] = useState(100);
    const [potentialParents, setPotentialParents] = useState<Task[]>([]);

    // UI state
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'content' | 'parent' | 'conditional'>('details');
    const [newLinkLabel, setNewLinkLabel] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newVideoUrl, setNewVideoUrl] = useState('');

    // Milestone state (for creating milestones)
    const [isMilestone, setIsMilestone] = useState(false);
    const [milestoneConditions, setMilestoneConditions] = useState<MilestoneCondition[]>([]);
    const [milestoneOutcomes, setMilestoneOutcomes] = useState<MilestoneOutcome[]>([]);
    const [newConditionDesc, setNewConditionDesc] = useState('');
    const [newConditionExpected, setNewConditionExpected] = useState('');
    const [newConditionConfidence, setNewConditionConfidence] = useState<ConfidenceLevel>('medium');
    const [newOutcomeLabel, setNewOutcomeLabel] = useState('');
    const [newOutcomePositive, setNewOutcomePositive] = useState(true);

    // Conditional dependency state (for linking to conditionals)
    const [availableConditionals, setAvailableConditionals] = useState<Conditional[]>([]);
    const [selectedConditionalId, setSelectedConditionalId] = useState<string | undefined>();
    const [hasConditionalDependency, setHasConditionalDependency] = useState(false);

    // Load initial data
    useEffect(() => {
        if (initialTask) {
            setTitle(initialTask.title);
            setDescription(initialTask.description || '');
            setScope(initialTask.scope);
            setScopeKey(initialTask.scopeKey);
            setStartTime(initialTask.startTime || '09:00');
            setEndTime(initialTask.endTime || '10:00');
            setColor(initialTask.color || TASK_COLORS[0]);
            setPriority(initialTask.priority || 'medium');
            setDeadline(initialTask.deadline ? initialTask.deadline.toISOString().split('T')[0] : '');
            setImages(initialTask.content?.images || []);
            setLinks(initialTask.content?.links || []);
            setVideos(initialTask.content?.videos || []);
            setChecklist(initialTask.content?.checklist || []);
            setParentTaskId(initialTask.parentTaskId);
            setContributionPercent(initialTask.contributionPercent || 100);
            // Conditional dependency
            setHasConditionalDependency(!!initialTask.blockedByConditionalId);
            setSelectedConditionalId(initialTask.blockedByConditionalId);
            // Milestone
            setIsMilestone(initialTask.isMilestone || false);
            setMilestoneConditions(initialTask.milestoneConditions || []);
            setMilestoneOutcomes(initialTask.milestoneOutcomes || []);
        } else {
            // Reset form
            setTitle('');
            setDescription('');
            setScope(defaultScope);
            setScopeKey(defaultScopeKey);
            setStartTime('09:00');
            setEndTime('10:00');
            setColor(TASK_COLORS[0]);
            setPriority('medium');
            setDeadline('');
            setImages([]);
            setLinks([]);
            setVideos([]);
            setChecklist([]);
            setParentTaskId(undefined);
            setContributionPercent(100);
            // Reset conditional dependency
            setHasConditionalDependency(false);
            setSelectedConditionalId(undefined);
            // Reset milestone
            setIsMilestone(false);
            setMilestoneConditions([]);
            setMilestoneOutcomes([]);
        }
    }, [initialTask, defaultScope, defaultScopeKey, isOpen]);

    // Load potential parent tasks
    useEffect(() => {
        if (isOpen && userId) {
            getPotentialParentTasks(userId, scope).then(setPotentialParents);
        }
    }, [isOpen, userId, scope]);

    // Load available conditionals
    useEffect(() => {
        if (isOpen && userId) {
            getConditionals(userId).then(setAvailableConditionals);
        }
    }, [isOpen, userId]);

    const handleSave = async () => {
        if (!title.trim()) return;

        setSaving(true);
        try {
            const taskInput: CreateTaskInput = {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                deadline: deadline ? new Date(deadline) : undefined,
                scope,
                scopeKey,
                startTime: scope === 'day' ? startTime : undefined,
                endTime: scope === 'day' ? endTime : undefined,
                color,
                content: {
                    images: images.length > 0 ? images : undefined,
                    links: links.length > 0 ? links : undefined,
                    videos: videos.length > 0 ? videos : undefined,
                    checklist: checklist.length > 0 ? checklist : undefined,
                },
                parentTaskId,
                contributionPercent: parentTaskId ? contributionPercent : undefined,
                // Milestone fields
                isMilestone: isMilestone || undefined,
                milestoneConditions: isMilestone && milestoneConditions.length > 0 ? milestoneConditions : undefined,
                milestoneOutcomes: isMilestone && milestoneOutcomes.length > 0 ? milestoneOutcomes : undefined,
                // Conditional dependency
                blockedByConditionalId: hasConditionalDependency && selectedConditionalId ? selectedConditionalId : undefined,
            };

            await onSave(taskInput);
            onClose();
        } catch (err) {
            console.error('Failed to save task:', err);
        } finally {
            setSaving(false);
        }
    };

    const addLink = () => {
        if (newLinkLabel && newLinkUrl) {
            setLinks([...links, { label: newLinkLabel, url: newLinkUrl }]);
            setNewLinkLabel('');
            setNewLinkUrl('');
        }
    };

    const addChecklistItem = () => {
        if (newChecklistItem.trim()) {
            setChecklist([...checklist, {
                id: Date.now().toString(),
                text: newChecklistItem.trim(),
                done: false
            }]);
            setNewChecklistItem('');
        }
    };

    const addImage = () => {
        if (newImageUrl.trim()) {
            setImages([...images, newImageUrl.trim()]);
            setNewImageUrl('');
        }
    };

    const addVideo = () => {
        if (newVideoUrl.trim()) {
            setVideos([...videos, newVideoUrl.trim()]);
            setNewVideoUrl('');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialTask ? 'Edit Task' : 'Create Task'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        {(['details', 'content', 'parent', 'conditional'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-3 text-sm font-medium transition-colors relative",
                                    activeTab === tab
                                        ? "text-blue-600"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                {tab === 'details' && 'Details'}
                                {tab === 'content' && 'Content'}
                                {tab === 'parent' && 'Parent'}
                                {tab === 'conditional' && (
                                    <span className="flex items-center justify-center gap-1">
                                        <GitBranch className="w-3 h-3" />
                                        Conditional
                                    </span>
                                )}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTaskTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {activeTab === 'details' && (
                            <>
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="What needs to be done?"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg"
                                        autoFocus
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add more details..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                    />
                                </div>

                                {/* Scope */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
                                    <div className="flex gap-2">
                                        {(['day', 'week', 'month', 'year'] as const).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setScope(s)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                                                    scope === s
                                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Flag className="w-4 h-4 inline mr-1" />
                                        Priority
                                    </label>
                                    <div className="flex gap-2">
                                        {(['low', 'medium', 'high', 'critical'] as const).map((p) => {
                                            const config = PRIORITY_CONFIG[p];
                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => setPriority(p)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize flex items-center gap-2",
                                                        priority === p
                                                            ? "ring-2 ring-offset-1"
                                                            : "hover:scale-105"
                                                    )}
                                                    style={{
                                                        backgroundColor: config.bgColor,
                                                        color: config.color,
                                                        ...(priority === p && {
                                                            boxShadow: `0 4px 14px ${config.color}40`,
                                                        })
                                                    }}
                                                >
                                                    {p === 'critical' && <AlertTriangle className="w-3.5 h-3.5" />}
                                                    {config.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Deadline */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Deadline (optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    {deadline && (
                                        <p className="mt-2 text-sm text-gray-500">
                                            Due: {new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>

                                {/* Time (for day scope) */}
                                {scope === 'day' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Clock className="w-4 h-4 inline mr-1" />
                                                Start Time
                                            </label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Clock className="w-4 h-4 inline mr-1" />
                                                End Time
                                            </label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Color */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                                    <div className="flex gap-2">
                                        {TASK_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setColor(c)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full transition-all",
                                                    color === c && "ring-2 ring-offset-2"
                                                )}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'content' && (
                            <>
                                {/* Checklist */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <CheckSquare className="w-4 h-4 inline mr-1" />
                                        Checklist
                                    </label>
                                    <div className="space-y-2 mb-3">
                                        {checklist.map((item, i) => (
                                            <div key={item.id} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={item.done}
                                                    onChange={() => {
                                                        const updated = [...checklist];
                                                        updated[i].done = !updated[i].done;
                                                        setChecklist(updated);
                                                    }}
                                                    className="w-4 h-4 rounded text-blue-500"
                                                />
                                                <span className={cn("flex-1", item.done && "line-through text-gray-400")}>
                                                    {item.text}
                                                </span>
                                                <button
                                                    onClick={() => setChecklist(checklist.filter((_, idx) => idx !== i))}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                            placeholder="Add checklist item..."
                                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                        />
                                        <button
                                            onClick={addChecklistItem}
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Links */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <LinkIcon className="w-4 h-4 inline mr-1" />
                                        Links
                                    </label>
                                    <div className="space-y-2 mb-3">
                                        {links.map((link, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                <LinkIcon className="w-4 h-4 text-gray-400" />
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-blue-600 hover:underline text-sm truncate">
                                                    {link.label}
                                                </a>
                                                <button
                                                    onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
                                        <input
                                            type="text"
                                            value={newLinkLabel}
                                            onChange={(e) => setNewLinkLabel(e.target.value)}
                                            placeholder="Label"
                                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                        />
                                        <input
                                            type="url"
                                            value={newLinkUrl}
                                            onChange={(e) => setNewLinkUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                        />
                                        <button
                                            onClick={addLink}
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Image className="w-4 h-4 inline mr-1" />
                                        Images
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {images.map((img, i) => (
                                            <div key={i} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={newImageUrl}
                                            onChange={(e) => setNewImageUrl(e.target.value)}
                                            placeholder="Image URL..."
                                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                        />
                                        <button
                                            onClick={addImage}
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Videos */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Video className="w-4 h-4 inline mr-1" />
                                        Videos
                                    </label>
                                    <div className="space-y-2 mb-3">
                                        {videos.map((video, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                <Video className="w-4 h-4 text-gray-400" />
                                                <span className="flex-1 text-sm text-gray-600 truncate">{video}</span>
                                                <button
                                                    onClick={() => setVideos(videos.filter((_, idx) => idx !== i))}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={newVideoUrl}
                                            onChange={(e) => setNewVideoUrl(e.target.value)}
                                            placeholder="Video embed URL..."
                                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                        />
                                        <button
                                            onClick={addVideo}
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'parent' && (
                            <>
                                {/* Parent Task Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Layers className="w-4 h-4 inline mr-1" />
                                        Parent Task
                                    </label>
                                    <p className="text-xs text-gray-400 mb-3">
                                        Link this task to a higher-level goal. Completing this task will contribute to the parent's progress.
                                    </p>

                                    {potentialParents.length === 0 ? (
                                        <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-400 text-sm">
                                            No parent tasks available. Create week, month, or year tasks first.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            <button
                                                onClick={() => setParentTaskId(undefined)}
                                                className={cn(
                                                    "w-full p-3 rounded-xl text-left transition-all",
                                                    !parentTaskId
                                                        ? "bg-blue-50 border-2 border-blue-500"
                                                        : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                                                )}
                                            >
                                                <span className="text-gray-500">No parent (standalone task)</span>
                                            </button>
                                            {potentialParents.map((parent) => (
                                                <button
                                                    key={parent.id}
                                                    onClick={() => setParentTaskId(parent.id)}
                                                    className={cn(
                                                        "w-full p-3 rounded-xl text-left transition-all flex items-center gap-3",
                                                        parentTaskId === parent.id
                                                            ? "bg-blue-50 border-2 border-blue-500"
                                                            : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                                                    )}
                                                >
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: parent.color || TASK_COLORS[0] }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium">{parent.title}</div>
                                                        <div className="text-xs text-gray-400 capitalize">
                                                            {parent.scope} • {parent.scopeKey}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Contribution Percentage */}
                                {parentTaskId && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Contribution Percentage
                                        </label>
                                        <p className="text-xs text-gray-400 mb-3">
                                            How much does completing this task contribute to the parent goal?
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                value={contributionPercent}
                                                onChange={(e) => setContributionPercent(Number(e.target.value))}
                                                className="flex-1"
                                            />
                                            <span className="w-12 text-center font-bold text-blue-600">
                                                {contributionPercent}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'conditional' && (
                            <>
                                {/* Conditional Dependency Toggle */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                            <GitBranch className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Depends on Conditional</h4>
                                            <p className="text-xs text-gray-500">Block this task until a conditional is resolved</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setHasConditionalDependency(!hasConditionalDependency)}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-colors relative",
                                            hasConditionalDependency ? "bg-purple-500" : "bg-gray-200"
                                        )}
                                    >
                                        <motion.div
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                            animate={{ left: hasConditionalDependency ? 28 : 4 }}
                                        />
                                    </button>
                                </div>

                                {hasConditionalDependency && (
                                    <>
                                        {/* Select Conditional */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <GitBranch className="w-4 h-4 inline mr-1 text-purple-500" />
                                                Select Conditional
                                            </label>
                                            <p className="text-xs text-gray-400 mb-3">
                                                This task will be blocked until the selected conditional is resolved
                                            </p>

                                            {availableConditionals.length === 0 ? (
                                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                                    <p className="text-sm text-gray-500">No conditionals available</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Create conditionals from the Conditionals page first
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {availableConditionals.filter(c => c.status === 'pending').map((conditional) => {
                                                        const isSelected = selectedConditionalId === conditional.id;
                                                        const urgencyConfig = URGENCY_CONFIG[conditional.urgency];
                                                        const daysUntil = Math.ceil((new Date(conditional.expectedDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                                                        return (
                                                            <button
                                                                key={conditional.id}
                                                                onClick={() => setSelectedConditionalId(isSelected ? undefined : conditional.id)}
                                                                className={cn(
                                                                    "w-full p-4 rounded-xl text-left transition-all border-2",
                                                                    isSelected
                                                                        ? "border-purple-500 bg-purple-50"
                                                                        : "border-gray-200 bg-white hover:border-purple-300"
                                                                )}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <h5 className="font-medium text-gray-900">{conditional.title}</h5>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span
                                                                                className="px-2 py-0.5 rounded text-xs font-medium"
                                                                                style={{ backgroundColor: urgencyConfig.color + '20', color: urgencyConfig.color }}
                                                                            >
                                                                                {urgencyConfig.icon} {urgencyConfig.label}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                Expected: {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                                        isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"
                                                                    )}>
                                                                        {isSelected && (
                                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Show Outcomes Preview */}
                                        {selectedConditionalId && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <Zap className="w-4 h-4 inline mr-1 text-amber-500" />
                                                    What happens when resolved?
                                                </label>
                                                <p className="text-xs text-gray-400 mb-3">
                                                    When the conditional is resolved, this task will be affected based on the outcome
                                                </p>

                                                {(() => {
                                                    const conditional = availableConditionals.find(c => c.id === selectedConditionalId);
                                                    if (!conditional) return null;

                                                    return (
                                                        <div className="space-y-2">
                                                            {conditional.outcomes.map((outcome) => (
                                                                <div
                                                                    key={outcome.id}
                                                                    className={cn(
                                                                        "p-3 rounded-lg border",
                                                                        outcome.type === 'success'
                                                                            ? "bg-green-50 border-green-200"
                                                                            : outcome.type === 'delayed'
                                                                                ? "bg-amber-50 border-amber-200"
                                                                                : "bg-red-50 border-red-200"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-medium text-sm">{outcome.label}</span>
                                                                        <span className={cn(
                                                                            "px-2 py-0.5 rounded text-xs font-medium",
                                                                            outcome.type === 'success'
                                                                                ? "bg-green-100 text-green-700"
                                                                                : outcome.type === 'delayed'
                                                                                    ? "bg-amber-100 text-amber-700"
                                                                                    : "bg-red-100 text-red-700"
                                                                        )}>
                                                                            {outcome.action === 'activate'
                                                                                ? '→ Unblock task'
                                                                                : outcome.action === 'postpone'
                                                                                    ? `→ Postpone ${outcome.postponeDays || 7} days`
                                                                                    : '→ Switch to fallback'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Info about blocking */}
                                        {selectedConditionalId && (
                                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                <div className="flex gap-3">
                                                    <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h5 className="font-medium text-blue-900">Task will be blocked</h5>
                                                        <p className="text-sm text-blue-700 mt-1">
                                                            This task will have &quot;blocked&quot; status until the conditional is resolved.
                                                            When resolved, the task&apos;s schedule may be adjusted based on the outcome.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Divider */}
                                {hasConditionalDependency && (
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <p className="text-xs text-gray-400 text-center">
                                            — or create this task as a milestone —
                                        </p>
                                    </div>
                                )}

                                {/* Milestone Toggle (secondary option) */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                            <Target className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">This is a Milestone</h4>
                                            <p className="text-xs text-gray-500">Other tasks depend on this completing</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsMilestone(!isMilestone)}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-colors relative",
                                            isMilestone ? "bg-amber-500" : "bg-gray-200"
                                        )}
                                    >
                                        <motion.div
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                            animate={{ left: isMilestone ? 28 : 4 }}
                                        />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !title.trim()}
                            className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                initialTask ? 'Update Task' : 'Create Task'
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
