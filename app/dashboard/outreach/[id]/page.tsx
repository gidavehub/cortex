"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    getOutreachContact,
    updateOutreachContact,
    addActivityLogEntry,
    convertToClient,
    OutreachContact,
    PipelineStage,
    PIPELINE_STAGES,
    CHANNEL_CONFIG,
    CATEGORY_CONFIG,
    STATUS_CONFIG,
} from "@/lib/firebase-outreach";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft, Save, Loader2, Check, Phone, Mail, Globe, MapPin,
    MessageCircle, User, Building, Tag, Send, CheckCircle2, Clock,
    ArrowRight, UserPlus, ChevronRight, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OutreachDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const [contact, setContact] = useState<OutreachContact | null>(null);
    const [loading, setLoading] = useState(true);

    // Editable fields
    const [contactPerson, setContactPerson] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [website, setWebsite] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Activity log
    const [newActivity, setNewActivity] = useState("");
    const [addingActivity, setAddingActivity] = useState(false);

    // Convert
    const [converting, setConverting] = useState(false);

    useEffect(() => {
        if (!user || !id) return;
        async function fetchContact() {
            if (!user) return;
            const data = await getOutreachContact(user.uid, id);
            if (data) {
                setContact(data);
                setContactPerson(data.contactPerson || "");
                setPhone(data.phone || "");
                setEmail(data.email || "");
                setAddress(data.address || "");
                setWebsite(data.website || "");
                setNotes(data.notes || "");
            }
            setLoading(false);
        }
        fetchContact();
    }, [user, id]);

    const handleSaveDetails = async () => {
        if (!user || !contact) return;
        setSaving(true);
        await updateOutreachContact(user.uid, contact.id, {
            contactPerson: contactPerson || undefined,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            website: website || undefined,
            notes: notes || undefined,
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleStageChange = async (stage: PipelineStage) => {
        if (!user || !contact) return;
        await updateOutreachContact(user.uid, contact.id, { pipelineStage: stage } as any);
        setContact({ ...contact, pipelineStage: stage });
    };

    const handleAddActivity = async () => {
        if (!user || !contact || !newActivity.trim()) return;
        setAddingActivity(true);
        await addActivityLogEntry(user.uid, contact.id, newActivity.trim());
        const updatedLog = [...(contact.activityLog || []), { date: new Date().toISOString(), note: newActivity.trim() }];
        setContact({ ...contact, activityLog: updatedLog });
        setNewActivity("");
        setAddingActivity(false);
    };

    const handleConvert = async () => {
        if (!user || !contact) return;
        setConverting(true);
        try {
            const clientId = await convertToClient(user.uid, contact.id);
            router.push(`/dashboard/clients/${clientId}`);
        } catch (err) {
            console.error("Failed to convert:", err);
            setConverting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 text-lg">Contact not found</p>
                <Link href="/dashboard/outreach" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    Back to Outreach
                </Link>
            </div>
        );
    }

    const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.key === (contact.pipelineStage || "new"));
    const statusCfg = STATUS_CONFIG[contact.status];
    const channelCfg = CHANNEL_CONFIG[contact.channel];
    const categoryCfg = CATEGORY_CONFIG[contact.category];
    const isConverted = contact.status === "converted";
    const isClosedWon = contact.pipelineStage === "closed_won";

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            {/* Back + Header */}
            <div className="flex flex-col gap-4">
                <Link
                    href="/dashboard/outreach"
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors w-fit text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Outreach
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm">
                            {contact.businessName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{contact.businessName}</h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {contact.contactPerson && (
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" />
                                        {contact.contactPerson}
                                    </span>
                                )}
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: categoryCfg.label ? '#F1F5F9' : '#F1F5F9', color: '#475569' }}>
                                    {categoryCfg.label}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: channelCfg.bgColor, color: channelCfg.color }}>
                                    {channelCfg.label}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: statusCfg.bgColor, color: statusCfg.color }}>
                                    {statusCfg.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Convert to Client CTA */}
                    {!isConverted && isClosedWon && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConvert}
                            disabled={converting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                        >
                            {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Convert to Client
                        </motion.button>
                    )}
                    {isConverted && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-200">
                            <CheckCircle2 className="w-4 h-4" />
                            Converted to Client
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ═══════════════════════════════════════════════════
                PIPELINE STEPPER
            ═══════════════════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Pipeline Stage</h3>
                <div className="flex items-center gap-1">
                    {PIPELINE_STAGES.map((stage, idx) => {
                        const isActive = idx === currentStageIdx;
                        const isPast = idx < currentStageIdx;
                        return (
                            <div key={stage.key} className="flex items-center flex-1">
                                <button
                                    onClick={() => handleStageChange(stage.key)}
                                    className={cn(
                                        "flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all text-center border-2",
                                        isActive
                                            ? "border-current shadow-sm"
                                            : isPast
                                                ? "border-transparent opacity-70"
                                                : "border-transparent opacity-40 hover:opacity-70"
                                    )}
                                    style={{
                                        backgroundColor: (isActive || isPast) ? stage.bgColor : '#F8FAFC',
                                        color: (isActive || isPast) ? stage.color : '#94A3B8',
                                        borderColor: isActive ? stage.color : 'transparent',
                                    }}
                                >
                                    {stage.label}
                                </button>
                                {idx < PIPELINE_STAGES.length - 1 && (
                                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mx-0.5" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════
                DETAILS + ACTIVITY LOG (2 columns)
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-12 gap-6">

                {/* Left: Editable Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Contact Details</h3>
                        <button
                            onClick={handleSaveDetails}
                            disabled={saving}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                saved ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            )}
                        >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                            {saved ? "Saved!" : "Save"}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Contact Person</label>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <User className="w-4 h-4 text-gray-400" />
                                <input
                                    value={contactPerson}
                                    onChange={e => setContactPerson(e.target.value)}
                                    placeholder="Name of the key person..."
                                    className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Phone</label>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Phone number..."
                                    className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Email</label>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <input
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Email address..."
                                    className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Address</label>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <input
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Business address..."
                                    className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Website</label>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <input
                                    value={website}
                                    onChange={e => setWebsite(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Internal notes about this contact..."
                                className="w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-none placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {/* Meta info */}
                    <div className="mt-5 pt-4 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-400">
                        <p>Outreach date: <span className="text-gray-600 font-medium">{contact.date}</span></p>
                        {contact.followUpDate && (
                            <p>Follow-up: <span className="text-amber-600 font-medium">{format(contact.followUpDate, "MMM d, yyyy")}</span></p>
                        )}
                        {contact.meetingDate && (
                            <p>Meeting: <span className="text-blue-600 font-medium">{format(contact.meetingDate, "MMM d, yyyy")}{contact.meetingTime ? ` at ${contact.meetingTime}` : ""}</span></p>
                        )}
                        <p>Created: {contact.createdAt ? format(contact.createdAt, "MMM d, yyyy") : "—"}</p>
                    </div>
                </motion.div>

                {/* Right: Activity Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col max-h-[650px]"
                >
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Activity Timeline</h3>

                    {/* Add new entry */}
                    <div className="flex gap-2 mb-5">
                        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            <Plus className="w-4 h-4 text-gray-400" />
                            <input
                                value={newActivity}
                                onChange={e => setNewActivity(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleAddActivity()}
                                placeholder="Log an interaction, call, email, note..."
                                className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddActivity}
                            disabled={addingActivity || !newActivity.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 flex items-center gap-1.5"
                        >
                            {addingActivity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Log
                        </motion.button>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {(!contact.activityLog || contact.activityLog.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                                    <Clock className="w-7 h-7 text-gray-300" />
                                </div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">No activity logged yet</p>
                                <p className="text-xs text-gray-400">Log your first interaction above.</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100" />

                                <div className="space-y-4">
                                    {[...(contact.activityLog || [])].reverse().map((entry, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="flex gap-3 relative"
                                        >
                                            {/* Timeline dot */}
                                            <div className="w-[31px] flex items-start justify-center flex-shrink-0 pt-1">
                                                <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full z-10",
                                                    idx === 0 ? "bg-blue-500 shadow-sm shadow-blue-300" : "bg-gray-300"
                                                )} />
                                            </div>
                                            <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                <p className="text-sm text-gray-800">{entry.note}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {format(new Date(entry.date), "MMM d, yyyy · h:mm a")}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
