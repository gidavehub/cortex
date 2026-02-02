"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GitBranch,
    Plus,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Trash2,
    Edit3,
    Link as LinkIcon,
    Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
    Conditional,
    ConditionalOutcome,
    URGENCY_CONFIG,
    OUTCOME_TYPE_CONFIG,
    ConditionalUrgency,
    OutcomeType,
    OutcomeAction
} from "@/lib/types/conditional";
import {
    getConditionals,
    createConditional,
    resolveConditional,
    deleteConditional,
    getTasksBlockedByConditional
} from "@/lib/firebase-conditionals";
import { Task } from "@/lib/types/task";
import { cn } from "@/lib/utils";

export default function ConditionalsPage() {
    const { user } = useAuth();
    const [conditionals, setConditionals] = useState<Conditional[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedConditional, setSelectedConditional] = useState<Conditional | null>(null);
    const [blockedTasks, setBlockedTasks] = useState<Task[]>([]);

    // Load conditionals
    useEffect(() => {
        if (user?.uid) {
            loadConditionals();
        }
    }, [user?.uid]);

    const loadConditionals = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const data = await getConditionals(user.uid);
            setConditionals(data);
        } catch (err) {
            console.error("Failed to load conditionals:", err);
        } finally {
            setLoading(false);
        }
    };

    // Load blocked tasks when a conditional is selected
    useEffect(() => {
        if (selectedConditional && user?.uid) {
            getTasksBlockedByConditional(user.uid, selectedConditional.id)
                .then(setBlockedTasks)
                .catch(console.error);
        } else {
            setBlockedTasks([]);
        }
    }, [selectedConditional, user?.uid]);

    const handleResolve = async (conditionalId: string, outcomeId: string) => {
        if (!user?.uid) return;
        try {
            const result = await resolveConditional(user.uid, conditionalId, outcomeId);
            console.log(`Resolved! Updated ${result.updatedTasks} tasks`, result);
            await loadConditionals();
            setSelectedConditional(null);
        } catch (err) {
            console.error("Failed to resolve:", err);
        }
    };

    const handleDelete = async (conditionalId: string) => {
        if (!user?.uid) return;
        if (!confirm("Delete this conditional? Blocked tasks will be unblocked.")) return;
        try {
            await deleteConditional(user.uid, conditionalId);
            await loadConditionals();
            setSelectedConditional(null);
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    const pendingConditionals = conditionals.filter(c => c.status === 'pending');
    const resolvedConditionals = conditionals.filter(c => c.status !== 'pending');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <GitBranch className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Conditionals</h1>
                            <p className="text-gray-500">Manage uncertain events that tasks depend on</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Conditional
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Pending Conditionals */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                Pending ({pendingConditionals.length})
                            </h2>

                            {pendingConditionals.length === 0 ? (
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-100">
                                    <GitBranch className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">No pending conditionals</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Create a conditional to track uncertain events
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingConditionals.map((conditional) => (
                                        <ConditionalCard
                                            key={conditional.id}
                                            conditional={conditional}
                                            onClick={() => setSelectedConditional(conditional)}
                                            isSelected={selectedConditional?.id === conditional.id}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Resolved */}
                            {resolvedConditionals.length > 0 && (
                                <>
                                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mt-8">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        Resolved ({resolvedConditionals.length})
                                    </h2>
                                    <div className="space-y-3 opacity-60">
                                        {resolvedConditionals.map((conditional) => (
                                            <ConditionalCard
                                                key={conditional.id}
                                                conditional={conditional}
                                                onClick={() => setSelectedConditional(conditional)}
                                                isSelected={selectedConditional?.id === conditional.id}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Detail Panel */}
                        <div className="lg:col-span-1">
                            <AnimatePresence mode="wait">
                                {selectedConditional ? (
                                    <ConditionalDetail
                                        key={selectedConditional.id}
                                        conditional={selectedConditional}
                                        blockedTasks={blockedTasks}
                                        onResolve={handleResolve}
                                        onDelete={handleDelete}
                                        onClose={() => setSelectedConditional(null)}
                                    />
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 text-center sticky top-8"
                                    >
                                        <Zap className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">Select a conditional</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            to view details and resolve
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateConditionalModal
                        conditionals={conditionals}
                        onClose={() => setShowCreateModal(false)}
                        onCreate={async (input) => {
                            if (!user?.uid) return;
                            await createConditional(user.uid, input);
                            await loadConditionals();
                            setShowCreateModal(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Conditional Card Component
function ConditionalCard({
    conditional,
    onClick,
    isSelected
}: {
    conditional: Conditional;
    onClick: () => void;
    isSelected: boolean;
}) {
    const urgencyConfig = URGENCY_CONFIG[conditional.urgency];
    const daysUntil = Math.ceil((new Date(conditional.expectedDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntil < 0 && conditional.status === 'pending';

    return (
        <motion.div
            layoutId={conditional.id}
            onClick={onClick}
            className={cn(
                "bg-white rounded-xl p-4 cursor-pointer transition-all border-2",
                "hover:shadow-lg hover:-translate-y-0.5",
                isSelected
                    ? "border-purple-500 shadow-lg shadow-purple-100"
                    : "border-transparent shadow-md"
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    conditional.status === 'pending'
                        ? "bg-amber-100"
                        : conditional.status === 'resolved'
                            ? "bg-green-100"
                            : "bg-red-100"
                )}>
                    {conditional.status === 'pending' ? (
                        <Clock className="w-5 h-5 text-amber-600" />
                    ) : conditional.status === 'resolved' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{conditional.title}</h3>
                        <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: urgencyConfig.color + '20', color: urgencyConfig.color }}
                        >
                            {urgencyConfig.icon} {urgencyConfig.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className={cn(
                            "flex items-center gap-1",
                            isOverdue ? "text-red-500 font-medium" : "text-gray-500"
                        )}>
                            <Calendar className="w-3.5 h-3.5" />
                            {isOverdue ? `${Math.abs(daysUntil)} days overdue` : (
                                daysUntil === 0 ? "Today" :
                                    daysUntil === 1 ? "Tomorrow" :
                                        `In ${daysUntil} days`
                            )}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                            {conditional.outcomes.length} outcomes
                        </span>
                    </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
        </motion.div>
    );
}

// Detail Panel Component
function ConditionalDetail({
    conditional,
    blockedTasks,
    onResolve,
    onDelete,
    onClose
}: {
    conditional: Conditional;
    blockedTasks: Task[];
    onResolve: (conditionalId: string, outcomeId: string) => void;
    onDelete: (conditionalId: string) => void;
    onClose: () => void;
}) {
    const urgencyConfig = URGENCY_CONFIG[conditional.urgency];
    const isPending = conditional.status === 'pending';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-8"
        >
            {/* Header */}
            <div
                className="p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${conditional.color || '#8B5CF6'}, ${conditional.color || '#6366F1'})` }}
            >
                <h3 className="font-bold text-lg">{conditional.title}</h3>
                <p className="text-white/80 text-sm mt-1">
                    Expected: {new Date(conditional.expectedDate).toLocaleDateString()}
                </p>
            </div>

            <div className="p-4 space-y-4">
                {/* Description */}
                {conditional.description && (
                    <p className="text-gray-600 text-sm">{conditional.description}</p>
                )}

                {/* Urgency */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Urgency:</span>
                    <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: urgencyConfig.color + '20', color: urgencyConfig.color }}
                    >
                        {urgencyConfig.icon} {urgencyConfig.label}
                    </span>
                </div>

                {/* Blocked Tasks */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        Blocked Tasks ({blockedTasks.length})
                    </h4>
                    {blockedTasks.length === 0 ? (
                        <p className="text-xs text-gray-400">No tasks waiting on this conditional</p>
                    ) : (
                        <div className="space-y-1">
                            {blockedTasks.slice(0, 5).map(task => (
                                <div key={task.id} className="text-sm bg-gray-50 px-3 py-2 rounded-lg truncate">
                                    {task.title}
                                </div>
                            ))}
                            {blockedTasks.length > 5 && (
                                <p className="text-xs text-gray-400">+ {blockedTasks.length - 5} more</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Outcomes */}
                {isPending && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Resolve - Select Outcome
                        </h4>
                        <div className="space-y-2">
                            {conditional.outcomes.map(outcome => {
                                const typeConfig = OUTCOME_TYPE_CONFIG[outcome.type];
                                return (
                                    <button
                                        key={outcome.id}
                                        onClick={() => onResolve(conditional.id, outcome.id)}
                                        className={cn(
                                            "w-full p-3 rounded-xl text-left transition-all border-2",
                                            "hover:scale-[1.02] hover:shadow-md",
                                            outcome.type === 'success'
                                                ? "border-green-200 bg-green-50 hover:border-green-400"
                                                : outcome.type === 'delayed'
                                                    ? "border-amber-200 bg-amber-50 hover:border-amber-400"
                                                    : "border-red-200 bg-red-50 hover:border-red-400"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: typeConfig.color }}
                                            />
                                            <span className="font-medium text-gray-900">{outcome.label}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Action: {outcome.action === 'activate' ? 'Unblock tasks' :
                                                outcome.action === 'postpone' ? `Postpone ${outcome.postponeDays || 7} days` :
                                                    'Switch to fallback'}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Resolved Status */}
                {!isPending && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600">
                            Resolved: {conditional.outcomes.find(o => o.id === conditional.selectedOutcomeId)?.label || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {conditional.resolvedAt && new Date(conditional.resolvedAt).toLocaleString()}
                        </p>
                    </div>
                )}

                {/* Delete Button */}
                <button
                    onClick={() => onDelete(conditional.id)}
                    className="w-full py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Conditional
                </button>
            </div>
        </motion.div>
    );
}

// Create Modal Component
function CreateConditionalModal({
    conditionals,
    onClose,
    onCreate
}: {
    conditionals: Conditional[];
    onClose: () => void;
    onCreate: (input: {
        title: string;
        description?: string;
        expectedDate: Date;
        urgency: ConditionalUrgency;
        outcomes: Omit<ConditionalOutcome, 'id'>[];
        fallbackConditionalId?: string;
        fallbackPostponeDays?: number;
        color?: string;
    }) => Promise<void>;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [urgency, setUrgency] = useState<ConditionalUrgency>('medium');
    const [outcomes, setOutcomes] = useState<Array<{
        label: string;
        type: OutcomeType;
        action: OutcomeAction;
        postponeDays?: number;
    }>>([
        { label: 'Success', type: 'success', action: 'activate' },
        { label: 'Delayed', type: 'delayed', action: 'postpone', postponeDays: 7 },
        { label: 'Failed', type: 'failed', action: 'switch_fallback' },
    ]);
    const [fallbackConditionalId, setFallbackConditionalId] = useState('');
    const [fallbackPostponeDays, setFallbackPostponeDays] = useState(7);
    const [color, setColor] = useState('#8B5CF6');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!title || !expectedDate) return;
        setSaving(true);
        try {
            await onCreate({
                title,
                description: description || undefined,
                expectedDate: new Date(expectedDate),
                urgency,
                outcomes,
                fallbackConditionalId: fallbackConditionalId || undefined,
                fallbackPostponeDays: fallbackConditionalId ? undefined : fallbackPostponeDays,
                color,
            });
        } finally {
            setSaving(false);
        }
    };

    const pendingConditionals = conditionals.filter(c => c.status === 'pending');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Create Conditional</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Define an uncertain event that tasks depend on
                    </p>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Money from Mr. Colley"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Details about this conditional..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Expected Date & Urgency */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Date *</label>
                            <input
                                type="date"
                                value={expectedDate}
                                onChange={(e) => setExpectedDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                            <select
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value as ConditionalUrgency)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {Object.entries(URGENCY_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.icon} {config.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <div className="flex gap-2">
                            {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-transform",
                                        color === c && "ring-2 ring-offset-2 ring-gray-400 scale-110"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Outcomes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Outcomes</label>
                        <div className="space-y-2">
                            {outcomes.map((outcome, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                    <input
                                        type="text"
                                        value={outcome.label}
                                        onChange={(e) => {
                                            const newOutcomes = [...outcomes];
                                            newOutcomes[i].label = e.target.value;
                                            setOutcomes(newOutcomes);
                                        }}
                                        className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                    />
                                    <select
                                        value={outcome.type}
                                        onChange={(e) => {
                                            const newOutcomes = [...outcomes];
                                            newOutcomes[i].type = e.target.value as OutcomeType;
                                            setOutcomes(newOutcomes);
                                        }}
                                        className="px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                    >
                                        <option value="success">Success</option>
                                        <option value="delayed">Delayed</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                    <select
                                        value={outcome.action}
                                        onChange={(e) => {
                                            const newOutcomes = [...outcomes];
                                            newOutcomes[i].action = e.target.value as OutcomeAction;
                                            setOutcomes(newOutcomes);
                                        }}
                                        className="px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                    >
                                        <option value="activate">Activate</option>
                                        <option value="postpone">Postpone</option>
                                        <option value="switch_fallback">Switch Fallback</option>
                                    </select>
                                    {outcome.action === 'postpone' && (
                                        <input
                                            type="number"
                                            value={outcome.postponeDays || 7}
                                            onChange={(e) => {
                                                const newOutcomes = [...outcomes];
                                                newOutcomes[i].postponeDays = parseInt(e.target.value);
                                                setOutcomes(newOutcomes);
                                            }}
                                            className="w-16 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                            min={1}
                                        />
                                    )}
                                    <button
                                        onClick={() => setOutcomes(outcomes.filter((_, idx) => idx !== i))}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setOutcomes([...outcomes, { label: 'New Outcome', type: 'success', action: 'activate' }])}
                                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-purple-300 hover:text-purple-600 text-sm"
                            >
                                + Add Outcome
                            </button>
                        </div>
                    </div>

                    {/* Fallback */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fallback (if failed)</label>
                        <select
                            value={fallbackConditionalId}
                            onChange={(e) => setFallbackConditionalId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">No fallback conditional</option>
                            {pendingConditionals.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                        {!fallbackConditionalId && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-500">Or postpone by</span>
                                <input
                                    type="number"
                                    value={fallbackPostponeDays}
                                    onChange={(e) => setFallbackPostponeDays(parseInt(e.target.value))}
                                    className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    min={1}
                                />
                                <span className="text-sm text-gray-500">days</span>
                            </div>
                        )}
                    </div>
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
                        onClick={handleSubmit}
                        disabled={!title || !expectedDate || saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {saving ? 'Creating...' : 'Create Conditional'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
