"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Lightbulb, ExternalLink, Trash2, Edit2, X, ChevronDown, ChevronUp, Rocket } from "lucide-react";
import { Hackathon, CreateHackathonInput } from "@/lib/firebase-outreach";
import { format } from "date-fns";

interface HackathonSectionProps {
    hackathons: Hackathon[];
    onAdd: (input: CreateHackathonInput) => void;
    onUpdate: (id: string, updates: Partial<Hackathon>) => void;
    onDelete: (id: string) => void;
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    planned: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    in_progress: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    cancelled: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400" },
};

export function HackathonSection({ hackathons, onAdd, onUpdate, onDelete }: HackathonSectionProps) {
    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [platform, setPlatform] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [url, setUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [newIdea, setNewIdea] = useState("");
    const [ideas, setIdeas] = useState<string[]>([]);

    const resetForm = () => {
        setName("");
        setPlatform("");
        setStartDate("");
        setEndDate("");
        setUrl("");
        setNotes("");
        setIdeas([]);
        setNewIdea("");
        setShowForm(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const input: CreateHackathonInput = {
            name: name.trim(),
            platform: platform.trim() || undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            url: url.trim() || undefined,
            notes: notes.trim() || undefined,
            ideas,
        };

        if (editingId) {
            onUpdate(editingId, input);
        } else {
            onAdd(input);
        }
        resetForm();
    };

    const startEdit = (h: Hackathon) => {
        setEditingId(h.id);
        setName(h.name);
        setPlatform(h.platform || "");
        setStartDate(h.startDate ? format(h.startDate, "yyyy-MM-dd") : "");
        setEndDate(h.endDate ? format(h.endDate, "yyyy-MM-dd") : "");
        setUrl(h.url || "");
        setNotes(h.notes || "");
        setIdeas(h.ideas || []);
        setShowForm(true);
    };

    const addIdea = () => {
        if (newIdea.trim()) {
            setIdeas([...ideas, newIdea.trim()]);
            setNewIdea("");
        }
    };

    const removeIdea = (index: number) => {
        setIdeas(ideas.filter((_, i) => i !== index));
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-orange-500" />
                    <h3 className="text-base font-semibold text-gray-900">Hackathons</h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{hackathons.length}</span>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-medium hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Hackathon
                </button>
            </div>

            {/* Add/Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <form onSubmit={handleSubmit} className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">{editingId ? "Edit Hackathon" : "New Hackathon"}</span>
                                <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Hackathon name"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                required
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                    placeholder="Platform (e.g. Devpost)"
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="URL"
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                            </div>

                            {/* Ideas */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Ideas</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newIdea}
                                        onChange={(e) => setNewIdea(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIdea(); } }}
                                        placeholder="Add an idea..."
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                                    />
                                    <button type="button" onClick={addIdea} className="px-3 py-2 bg-orange-100 text-orange-600 rounded-xl text-sm hover:bg-orange-200 transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                {ideas.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {ideas.map((idea, i) => (
                                            <span key={i} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-xs">
                                                <Lightbulb className="w-3 h-3" />
                                                {idea}
                                                <button type="button" onClick={() => removeIdea(i)} className="ml-0.5 hover:text-orange-900">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notes..."
                                rows={2}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                            />

                            <button type="submit" className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm">
                                {editingId ? "Update" : "Add Hackathon"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hackathon List */}
            {hackathons.length === 0 && !showForm ? (
                <div className="text-center py-12 text-gray-400">
                    <Rocket className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No hackathons yet. Add one to get started!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {hackathons.map((h, i) => {
                            const sc = statusColors[h.status] || statusColors.planned;
                            const isExpanded = expandedId === h.id;
                            return (
                                <motion.div
                                    key={h.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft"
                                >
                                    <div
                                        className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                                        onClick={() => setExpandedId(isExpanded ? null : h.id)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-2 h-2 rounded-full ${sc.dot} flex-shrink-0`} />
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm text-gray-900 truncate">{h.name}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {h.platform && <span className="text-xs text-gray-400">{h.platform}</span>}
                                                    {h.startDate && (
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(h.startDate, "MMM d, yyyy")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} font-medium`}>
                                                {h.status.replace("_", " ")}
                                            </span>
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: "auto" }}
                                                exit={{ height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3">
                                                    {h.ideas && h.ideas.length > 0 && (
                                                        <div>
                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ideas</span>
                                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                {h.ideas.map((idea, idx) => (
                                                                    <span key={idx} className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs">
                                                                        <Lightbulb className="w-3 h-3" />
                                                                        {idea}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {h.notes && (
                                                        <div>
                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</span>
                                                            <p className="text-sm text-gray-600 mt-1">{h.notes}</p>
                                                        </div>
                                                    )}

                                                    {h.url && (
                                                        <a href={h.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700">
                                                            <ExternalLink className="w-3 h-3" />
                                                            View Hackathon
                                                        </a>
                                                    )}

                                                    <div className="flex items-center gap-2 pt-1">
                                                        <button onClick={() => startEdit(h)} className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit2 className="w-3 h-3" /> Edit
                                                        </button>
                                                        <button onClick={() => onDelete(h.id)} className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 className="w-3 h-3" /> Delete
                                                        </button>
                                                        <select
                                                            value={h.status}
                                                            onChange={(e) => onUpdate(h.id, { status: e.target.value as Hackathon["status"] })}
                                                            className="ml-auto text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="planned">Planned</option>
                                                            <option value="in_progress">In Progress</option>
                                                            <option value="completed">Completed</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
