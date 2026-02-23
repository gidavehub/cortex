"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Filter,
    Phone,
    Mail,
    MapPin,
    MessageCircle,
    Globe,
    Bell,
    Trash2,
    Edit2,
    CheckCircle2,
    MoreHorizontal,
    X,
    ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import {
    OutreachContact,
    OutreachProgram,
    OutreachChannel,
    BusinessCategory,
    OutreachStatus,
    CreateOutreachInput,
    Hackathon,
    CreateHackathonInput,
    CHANNEL_CONFIG,
    CATEGORY_CONFIG,
    STATUS_CONFIG,
    OUTREACH_TARGETS,
    subscribeAllOutreach,
    subscribeFollowUps,
    subscribeHackathons,
    createOutreachContact,
    updateOutreachContact,
    deleteOutreachContact,
    createHackathon,
    updateHackathon,
    deleteHackathon,
} from "@/lib/firebase-outreach";
import { OutreachStats } from "@/components/outreach/OutreachStats";
import { OutreachModal } from "@/components/outreach/OutreachModal";
import { HackathonSection } from "@/components/outreach/HackathonSection";

type TabKey = "nova" | "amaka_ai" | "hackathons";

const tabs: { key: TabKey; label: string; color: string; gradient: string }[] = [
    { key: "nova", label: "Nova Outreach", color: "blue", gradient: "from-blue-500 to-blue-600" },
    { key: "amaka_ai", label: "Amaka AI", color: "purple", gradient: "from-purple-500 to-purple-600" },
    { key: "hackathons", label: "Hackathons", color: "orange", gradient: "from-orange-500 to-orange-600" },
];

export default function OutreachPage() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<OutreachContact[]>([]);
    const [followUps, setFollowUps] = useState<OutreachContact[]>([]);
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [activeTab, setActiveTab] = useState<TabKey>("nova");
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editContact, setEditContact] = useState<OutreachContact | null>(null);
    const [filterChannel, setFilterChannel] = useState<OutreachChannel | "all">("all");
    const [filterCategory, setFilterCategory] = useState<BusinessCategory | "all">("all");
    const [filterStatus, setFilterStatus] = useState<OutreachStatus | "all">("all");
    const [showFilters, setShowFilters] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; contact: OutreachContact } | null>(null);
    const [sortBy, setSortBy] = useState<"date" | "name">("date");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    // Subscribe to data
    useEffect(() => {
        if (!user) return;
        const unsub1 = subscribeAllOutreach(user.uid, setContacts);
        const unsub2 = subscribeFollowUps(user.uid, setFollowUps);
        const unsub3 = subscribeHackathons(user.uid, setHackathons);
        return () => { unsub1(); unsub2(); unsub3(); };
    }, [user]);

    // Close context menu on click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    // Filter & sort contacts for the active program tab
    const filteredContacts = useMemo(() => {
        if (activeTab === "hackathons") return [];
        return contacts
            .filter((c) => c.program === activeTab)
            .filter((c) => {
                if (filterChannel !== "all" && c.channel !== filterChannel) return false;
                if (filterCategory !== "all" && c.category !== filterCategory) return false;
                if (filterStatus !== "all" && c.status !== filterStatus) return false;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    return (
                        c.businessName.toLowerCase().includes(q) ||
                        c.contactPerson?.toLowerCase().includes(q) ||
                        c.notes?.toLowerCase().includes(q) ||
                        c.email?.toLowerCase().includes(q) ||
                        c.phone?.includes(q)
                    );
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "date") {
                    return sortDir === "desc"
                        ? new Date(b.date).getTime() - new Date(a.date).getTime()
                        : new Date(a.date).getTime() - new Date(b.date).getTime();
                }
                return sortDir === "desc"
                    ? b.businessName.localeCompare(a.businessName)
                    : a.businessName.localeCompare(b.businessName);
            });
    }, [contacts, activeTab, filterChannel, filterCategory, filterStatus, searchQuery, sortBy, sortDir]);

    // Handlers
    const handleSaveOutreach = async (input: CreateOutreachInput) => {
        if (!user) return;
        if (editContact) {
            await updateOutreachContact(user.uid, editContact.id, input);
        } else {
            await createOutreachContact(user.uid, input);
        }
        setEditContact(null);
    };

    const handleDeleteContact = async (contact: OutreachContact) => {
        if (!user) return;
        await deleteOutreachContact(user.uid, contact.id);
    };

    const handleToggleFollowUp = async (contact: OutreachContact) => {
        if (!user) return;
        await updateOutreachContact(user.uid, contact.id, {
            followUpDone: !contact.followUpDone,
        });
    };

    const handleMarkStatus = async (contact: OutreachContact, status: OutreachStatus) => {
        if (!user) return;
        await updateOutreachContact(user.uid, contact.id, { status });
    };

    const handleContextMenu = (e: React.MouseEvent, contact: OutreachContact) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, contact });
    };

    // Hackathon handlers
    const handleAddHackathon = async (input: CreateHackathonInput) => {
        if (!user) return;
        await createHackathon(user.uid, input);
    };

    const handleUpdateHackathon = async (id: string, updates: Partial<Hackathon>) => {
        if (!user) return;
        await updateHackathon(user.uid, id, updates);
    };

    const handleDeleteHackathon = async (id: string) => {
        if (!user) return;
        await deleteHackathon(user.uid, id);
    };

    const activeTabConfig = tabs.find((t) => t.key === activeTab)!;
    const hasActiveFilters = filterChannel !== "all" || filterCategory !== "all" || filterStatus !== "all";

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Marketing Outreach</h1>
                <p className="text-sm text-gray-500 mt-1">Track daily business outreach, applications, and hackathons</p>
            </div>

            {/* Stats */}
            <OutreachStats contacts={contacts} followUps={followUps} />

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100/80 rounded-2xl p-1.5 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key
                                ? "text-white shadow-lg"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {activeTab === tab.key && (
                            <motion.div
                                layoutId="activeTab"
                                className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-xl`}
                                transition={{ type: "spring", duration: 0.4 }}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === "hackathons" ? (
                <motion.div
                    key="hackathons"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50"
                >
                    <HackathonSection
                        hackathons={hackathons}
                        onAdd={handleAddHackathon}
                        onUpdate={handleUpdateHackathon}
                        onDelete={handleDeleteHackathon}
                    />
                </motion.div>
            ) : (
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-soft border border-gray-100/50 overflow-hidden"
                >
                    {/* Toolbar */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search businesses, contacts, notes..."
                                className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder-gray-400"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Sort */}
                        <button
                            onClick={() => {
                                if (sortBy === "date") {
                                    setSortDir(sortDir === "desc" ? "asc" : "desc");
                                } else {
                                    setSortBy("date");
                                    setSortDir("desc");
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            {sortBy === "date" ? (sortDir === "desc" ? "Newest" : "Oldest") : "A-Z"}
                        </button>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${hasActiveFilters
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-4 h-4 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center">
                                    {[filterChannel !== "all", filterCategory !== "all", filterStatus !== "all"].filter(Boolean).length}
                                </span>
                            )}
                        </button>

                        {/* Add Button */}
                        <button
                            onClick={() => {
                                setEditContact(null);
                                setShowModal(true);
                            }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white transition-all shadow-sm ${activeTab === "nova"
                                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                                    : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                                }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Log Outreach
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Channel:</span>
                                        <select
                                            value={filterChannel}
                                            onChange={(e) => setFilterChannel(e.target.value as OutreachChannel | "all")}
                                            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
                                        >
                                            <option value="all">All</option>
                                            {Object.entries(CHANNEL_CONFIG).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Category:</span>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value as BusinessCategory | "all")}
                                            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
                                        >
                                            <option value="all">All</option>
                                            {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Status:</span>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value as OutreachStatus | "all")}
                                            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
                                        >
                                            <option value="all">All</option>
                                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={() => {
                                                setFilterChannel("all");
                                                setFilterCategory("all");
                                                setFilterStatus("all");
                                            }}
                                            className="text-xs text-red-500 hover:text-red-600 ml-auto"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Contacts Table */}
                    <div className="overflow-x-auto">
                        {filteredContacts.length === 0 ? (
                            <div className="text-center py-16 px-6">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeTabConfig.gradient} flex items-center justify-center mx-auto mb-4 opacity-20`}>
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-sm text-gray-500 mb-1">
                                    {searchQuery || hasActiveFilters ? "No contacts match your filters" : "No outreach logged yet"}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {searchQuery || hasActiveFilters ? "Try adjusting your search or filters" : "Start logging your daily outreach to track progress"}
                                </p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left">
                                        <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Business / Contact</th>
                                        <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                                        <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Channel</th>
                                        <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Contact Details</th>
                                        <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredContacts.map((contact, i) => {
                                            const channelConf = CHANNEL_CONFIG[contact.channel];
                                            const statusConf = STATUS_CONFIG[contact.status];
                                            const today = format(new Date(), "yyyy-MM-dd");
                                            const isOverdueFollowUp = contact.followUpDate && !contact.followUpDone && format(contact.followUpDate, "yyyy-MM-dd") <= today;

                                            return (
                                                <motion.tr
                                                    key={contact.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors group"
                                                    onContextMenu={(e) => handleContextMenu(e, contact)}
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            {isOverdueFollowUp && (
                                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" title="Follow-up due" />
                                                            )}
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{contact.businessName}</div>
                                                                {contact.contactPerson && (
                                                                    <div className="text-xs text-gray-400 mt-0.5">{contact.contactPerson}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3.5">
                                                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                                                            {CATEGORY_CONFIG[contact.category]?.label || contact.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3.5">
                                                        <span
                                                            className="text-xs font-medium px-2 py-1 rounded-lg inline-flex items-center gap-1"
                                                            style={{ backgroundColor: channelConf.bgColor, color: channelConf.color }}
                                                        >
                                                            {contact.channel === "cold_call" || contact.channel === "whatsapp" ? (
                                                                <Phone className="w-3 h-3" />
                                                            ) : contact.channel === "walk_in" ? (
                                                                <MapPin className="w-3 h-3" />
                                                            ) : (
                                                                <Mail className="w-3 h-3" />
                                                            )}
                                                            {channelConf.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3.5">
                                                        <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                                                            {contact.phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                                    {contact.phone}
                                                                </span>
                                                            )}
                                                            {contact.email && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                                    {contact.email}
                                                                </span>
                                                            )}
                                                            {contact.whatsapp && (
                                                                <span className="flex items-center gap-1">
                                                                    <MessageCircle className="w-3 h-3 text-gray-400" />
                                                                    {contact.whatsapp}
                                                                </span>
                                                            )}
                                                            {contact.address && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3 text-gray-400" />
                                                                    {contact.address}
                                                                </span>
                                                            )}
                                                            {!contact.phone && !contact.email && !contact.whatsapp && !contact.address && (
                                                                <span className="text-gray-300">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3.5">
                                                        <span
                                                            className="text-xs font-medium px-2 py-1 rounded-lg"
                                                            style={{ backgroundColor: statusConf.bgColor, color: statusConf.color }}
                                                        >
                                                            {statusConf.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3.5">
                                                        <div className="text-xs text-gray-500">{contact.date}</div>
                                                        {contact.followUpDate && !contact.followUpDone && (
                                                            <div className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-0.5">
                                                                <Bell className="w-3 h-3" />
                                                                Follow up: {format(contact.followUpDate, "MMM d")}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3.5">
                                                        <button
                                                            onClick={(e) => handleContextMenu(e, contact)}
                                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Summary bar */}
                    {filteredContacts.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-500">
                            Showing {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
                            {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Outreach Modal */}
            <OutreachModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditContact(null); }}
                onSave={handleSaveOutreach}
                editContact={editContact}
                defaultProgram={activeTab === "hackathons" ? "nova" : activeTab}
            />

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[160px]"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <button
                            onClick={() => {
                                setEditContact(contextMenu.contact);
                                setShowModal(true);
                                setContextMenu(null);
                            }}
                            className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>

                        {contextMenu.contact.followUpDate && (
                            <button
                                onClick={() => {
                                    handleToggleFollowUp(contextMenu.contact);
                                    setContextMenu(null);
                                }}
                                className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {contextMenu.contact.followUpDone ? "Reopen Follow-up" : "Mark Followed Up"}
                            </button>
                        )}

                        <div className="border-t border-gray-100 my-1" />

                        {(Object.entries(STATUS_CONFIG) as [OutreachStatus, typeof STATUS_CONFIG[OutreachStatus]][]).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    handleMarkStatus(contextMenu.contact, key);
                                    setContextMenu(null);
                                }}
                                className={`w-full px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 text-left ${contextMenu.contact.status === key ? "text-blue-600 font-medium" : "text-gray-600"
                                    }`}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
                                {val.label}
                            </button>
                        ))}

                        <div className="border-t border-gray-100 my-1" />

                        <button
                            onClick={() => {
                                handleDeleteContact(contextMenu.contact);
                                setContextMenu(null);
                            }}
                            className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 text-left"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
