
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ChevronLeft, Plus, X, GripVertical, Clock, Trash2 } from "lucide-react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Event {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    color: string;
    order: number;
    date: string;
}

const colorOptions = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Pink", value: "#EC4899" },
    { name: "Orange", value: "#F97316" },
    { name: "Red", value: "#EF4444" },
];

export default function DayViewPage({ params }: { params: Promise<{ date: string }> }) {
    const resolvedParams = use(params);
    const dateSlug = resolvedParams.date;
    const router = useRouter();
    const { user } = useAuth();

    const [events, setEvents] = useState<Event[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        startTime: "09:00",
        endTime: "10:00",
        color: "#3B82F6"
    });

    // Parse the date
    let displayDate: Date;
    try {
        displayDate = parseISO(dateSlug);
    } catch {
        displayDate = new Date();
    }

    // Fetch events for this day
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "events"),
            where("date", "==", dateSlug),
            orderBy("startTime", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allEvents = snapshot.docs.map((doc, idx) => ({
                id: doc.id,
                order: idx,
                ...doc.data()
            })) as Event[];
            setEvents(allEvents);
        });

        return () => unsubscribe();
    }, [user, dateSlug]);

    const handleAddEvent = async () => {
        if (!user || !newEvent.title.trim()) return;

        await addDoc(collection(db, "users", user.uid, "events"), {
            ...newEvent,
            date: dateSlug,
            order: events.length
        });

        setNewEvent({ title: "", description: "", startTime: "09:00", endTime: "10:00", color: "#3B82F6" });
        setShowModal(false);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "events", eventId));
    };

    const handleReorder = async (newOrder: Event[]) => {
        setEvents(newOrder);
        // Update order in Firestore
        if (!user) return;
        const batch = writeBatch(db);
        newOrder.forEach((event, idx) => {
            const ref = doc(db, "users", user.uid, "events", event.id);
            batch.update(ref, { order: idx });
        });
        await batch.commit();
    };

    return (
        <div className="fixed inset-0 z-40 overflow-hidden">
            {/* Animated Background */}
            <motion.div
                className="absolute inset-0"
                initial={{ filter: "blur(0px)" }}
                animate={{ filter: "blur(20px)" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                    backgroundImage: 'url(/calendarbackgroundimage.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center bottom',
                    transform: 'scale(1.1)' // Prevent blur edges
                }}
            />

            {/* Gradient Overlay */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-b from-purple-900/85 via-purple-800/80 to-purple-900/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            />

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col p-8">
                {/* Header */}
                <motion.div
                    className="flex items-center justify-between mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/dashboard/calendar')}
                            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors backdrop-blur-sm"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-light text-white">
                                {format(displayDate, 'EEEE')}
                            </h1>
                            <p className="text-white/60 text-lg mt-1">
                                {format(displayDate, 'MMMM d, yyyy')}
                            </p>
                        </div>
                    </div>

                    <motion.button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Add Event</span>
                    </motion.button>
                </motion.div>

                {/* Events Canvas */}
                <motion.div
                    className="flex-1 bg-white/10 backdrop-blur-md rounded-[32px] p-8 overflow-y-auto custom-scrollbar"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    {events.length === 0 ? (
                        <motion.div
                            className="h-full flex flex-col items-center justify-center text-white/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Clock className="w-16 h-16 mb-4 opacity-30" />
                            <p className="text-xl font-light">No events planned</p>
                            <p className="text-sm mt-2 opacity-60">Click "Add Event" to start planning your day</p>
                        </motion.div>
                    ) : (
                        <Reorder.Group axis="y" values={events} onReorder={handleReorder} className="space-y-4">
                            <AnimatePresence>
                                {events.map((event, idx) => (
                                    <Reorder.Item
                                        key={event.id}
                                        value={event}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 30 }}
                                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    >
                                        <motion.div
                                            className="flex items-center gap-4 p-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 group cursor-grab active:cursor-grabbing"
                                            style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                                            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                        >
                                            <GripVertical className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />

                                            <div
                                                className="w-4 h-4 rounded-full shadow-lg"
                                                style={{ backgroundColor: event.color, boxShadow: `0 0 20px ${event.color}40` }}
                                            />

                                            <div className="flex-1">
                                                <h3 className="text-white font-medium text-lg">{event.title}</h3>
                                                {event.description && (
                                                    <p className="text-white/50 text-sm mt-1">{event.description}</p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <p className="text-white/80 font-medium">{event.startTime}</p>
                                                {event.endTime && (
                                                    <p className="text-white/40 text-sm">to {event.endTime}</p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/30 flex items-center justify-center text-white/40 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    </Reorder.Item>
                                ))}
                            </AnimatePresence>
                        </Reorder.Group>
                    )}
                </motion.div>
            </div>

            {/* Add Event Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        />

                        <motion.div
                            className="relative bg-gradient-to-br from-white to-gray-50 rounded-[32px] p-8 w-full max-w-lg shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold text-gray-900">New Event</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                                        placeholder="Event title..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 resize-none"
                                        placeholder="Add a description..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                                        <input
                                            type="time"
                                            value={newEvent.startTime}
                                            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                                        <input
                                            type="time"
                                            value={newEvent.endTime}
                                            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
                                    <div className="flex gap-3">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color.value}
                                                onClick={() => setNewEvent({ ...newEvent, color: color.value })}
                                                className={cn(
                                                    "w-10 h-10 rounded-full transition-all shadow-md",
                                                    newEvent.color === color.value
                                                        ? "ring-4 ring-offset-2 ring-gray-400 scale-110"
                                                        : "hover:scale-110"
                                                )}
                                                style={{
                                                    backgroundColor: color.value,
                                                    boxShadow: `0 4px 20px ${color.value}40`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                onClick={handleAddEvent}
                                disabled={!newEvent.title.trim()}
                                className="w-full mt-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Create Event
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
