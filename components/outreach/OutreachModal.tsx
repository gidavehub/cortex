"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, MapPin, Globe, MessageCircle, Plus, Calendar } from "lucide-react";
import {
    OutreachProgram,
    OutreachChannel,
    BusinessCategory,
    OutreachStatus,
    CreateOutreachInput,
    CHANNEL_CONFIG,
    CATEGORY_CONFIG,
    STATUS_CONFIG,
    OutreachContact,
} from "@/lib/firebase-outreach";
import { format } from "date-fns";

interface OutreachModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (input: CreateOutreachInput) => void;
    editContact?: OutreachContact | null;
    defaultProgram?: OutreachProgram;
}

const channelIcons: Record<OutreachChannel, React.ReactNode> = {
    cold_call: <Phone className="w-4 h-4" />,
    cold_email: <Mail className="w-4 h-4" />,
    walk_in: <MapPin className="w-4 h-4" />,
    whatsapp: <MessageCircle className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    fund_application: <Globe className="w-4 h-4" />,
    other: <Plus className="w-4 h-4" />,
};

export function OutreachModal({ isOpen, onClose, onSave, editContact, defaultProgram = "nova" }: OutreachModalProps) {
    const [program, setProgram] = useState<OutreachProgram>(editContact?.program || defaultProgram);
    const [businessName, setBusinessName] = useState(editContact?.businessName || "");
    const [contactPerson, setContactPerson] = useState(editContact?.contactPerson || "");
    const [category, setCategory] = useState<BusinessCategory>(editContact?.category || "other");
    const [channel, setChannel] = useState<OutreachChannel>(editContact?.channel || (defaultProgram === "amaka_ai" ? "email" : "cold_call"));
    const [phone, setPhone] = useState(editContact?.phone || "");
    const [email, setEmail] = useState(editContact?.email || "");
    const [whatsapp, setWhatsapp] = useState(editContact?.whatsapp || "");
    const [address, setAddress] = useState(editContact?.address || "");
    const [website, setWebsite] = useState(editContact?.website || "");
    const [notes, setNotes] = useState(editContact?.notes || "");
    const [status, setStatus] = useState<OutreachStatus>(editContact?.status || "contacted");
    const [enableFollowUp, setEnableFollowUp] = useState(!!editContact?.followUpDate);
    const [followUpDate, setFollowUpDate] = useState(
        editContact?.followUpDate ? format(editContact.followUpDate, "yyyy-MM-dd") : format(new Date(Date.now() + 86400000), "yyyy-MM-dd")
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessName.trim()) return;

        const input: CreateOutreachInput = {
            program,
            businessName: businessName.trim(),
            contactPerson: contactPerson.trim() || undefined,
            category,
            channel,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            whatsapp: whatsapp.trim() || undefined,
            address: address.trim() || undefined,
            website: website.trim() || undefined,
            notes: notes.trim() || undefined,
            status,
            date: editContact?.date || format(new Date(), "yyyy-MM-dd"),
            followUpDate: enableFollowUp ? new Date(followUpDate) : undefined,
        };

        onSave(input);
        handleClose();
    };

    const handleClose = () => {
        setBusinessName("");
        setContactPerson("");
        setCategory("other");
        setChannel(defaultProgram === "amaka_ai" ? "email" : "cold_call");
        setPhone("");
        setEmail("");
        setWhatsapp("");
        setAddress("");
        setWebsite("");
        setNotes("");
        setStatus("contacted");
        setEnableFollowUp(false);
        onClose();
    };

    // Determine which channels are relevant for the selected program
    const availableChannels: OutreachChannel[] = program === "amaka_ai"
        ? ["email", "fund_application", "cold_email", "other"]
        : ["cold_call", "cold_email", "walk_in", "whatsapp", "email", "other"];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 pt-6 pb-4 border-b border-gray-100 rounded-t-3xl z-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editContact ? "Edit Outreach" : "Log Outreach"}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                        {/* Program Selector */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Program</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(["nova", "amaka_ai"] as OutreachProgram[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setProgram(p)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${program === p
                                            ? p === "nova"
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                                : "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {p === "nova" ? "Nova" : "Amaka AI"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Business Name */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                {program === "amaka_ai" ? "Organization / Platform" : "Business Name"} *
                            </label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder={program === "amaka_ai" ? "e.g. Y Combinator, Techstars..." : "e.g. Apex Law Firm..."}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all text-sm"
                                required
                            />
                        </div>

                        {/* Contact Person */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Contact Person</label>
                            <input
                                type="text"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Category & Channel Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all text-sm appearance-none"
                                >
                                    {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as OutreachStatus)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all text-sm appearance-none"
                                >
                                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Channel Selector */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Channel</label>
                            <div className="flex flex-wrap gap-2">
                                {availableChannels.map((ch) => (
                                    <button
                                        key={ch}
                                        type="button"
                                        onClick={() => setChannel(ch)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${channel === ch
                                            ? `text-white shadow-sm`
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                        style={channel === ch ? { backgroundColor: CHANNEL_CONFIG[ch].color } : {}}
                                    >
                                        {channelIcons[ch]}
                                        {CHANNEL_CONFIG[ch].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Contact Fields */}
                        <div className="space-y-3">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Contact Details</label>

                            {(channel === "cold_call" || channel === "whatsapp" || channel === "walk_in") && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Phone number"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-sm"
                                    />
                                </div>
                            )}

                            {(channel === "cold_email" || channel === "email" || channel === "fund_application") && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email address"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-sm"
                                    />
                                </div>
                            )}

                            {channel === "whatsapp" && (
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        placeholder="WhatsApp number"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-sm"
                                    />
                                </div>
                            )}

                            {channel === "walk_in" && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Business address"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-sm"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="Website (optional)"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any notes about this outreach..."
                                rows={2}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all text-sm resize-none"
                            />
                        </div>

                        {/* Follow-up Toggle */}
                        <div className="flex items-center justify-between bg-amber-50/50 rounded-xl px-4 py-3 border border-amber-100">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-medium text-amber-800">Schedule follow-up</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {enableFollowUp && (
                                    <input
                                        type="date"
                                        value={followUpDate}
                                        onChange={(e) => setFollowUpDate(e.target.value)}
                                        className="px-2 py-1 text-xs bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => setEnableFollowUp(!enableFollowUp)}
                                    className={`w-10 h-6 rounded-full transition-all relative ${enableFollowUp ? "bg-amber-500" : "bg-gray-200"}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${enableFollowUp ? "left-5" : "left-1"}`} />
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-2 pb-2">
                            <button
                                type="submit"
                                className={`w-full py-3 rounded-xl text-white font-medium transition-all shadow-lg ${program === "nova"
                                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                                    : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30"
                                    }`}
                            >
                                {editContact ? "Update Outreach" : "Log Outreach"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
