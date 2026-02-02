
"use client";

import { useState, useEffect, useRef } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { ChevronLeft, Plus, Calendar, CalendarDays, CalendarRange, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Event {
    id: string;
    title: string;
    startTime: string;
    date: string;
    color?: string;
    status?: string;
}

const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [eventsMap, setEventsMap] = useState<Record<string, Event[]>>({});
    const router = useRouter();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const yearScrollRef = useRef<HTMLDivElement>(null);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Calendar Grid Calculation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Fetch events for the visible range
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "users", user.uid, "events"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newEventsMap: Record<string, Event[]> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Event;
                const dateKey = data.date;
                if (!newEventsMap[dateKey]) newEventsMap[dateKey] = [];
                newEventsMap[dateKey].push({ id: doc.id, ...data });
            });
            setEventsMap(newEventsMap);
        });
        return () => unsubscribe();
    }, [user]);

    // Auto-scroll year selector to current year whenever it changes
    useEffect(() => {
        if (yearScrollRef.current) {
            const currentYearEl = document.getElementById(`year-${currentYear}`);
            if (currentYearEl) {
                currentYearEl.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        }
    }, [currentYear]);

    const onDateClick = (date: Date) => {
        const slug = format(date, 'yyyy-MM-dd');
        router.push(`/dashboard/calendar/day/${slug}`);
    };

    // Navigate to scope views
    const goToWeekView = () => {
        const weekNum = getISOWeek(currentDate);
        router.push(`/dashboard/calendar/week/${currentYear}-W${String(weekNum).padStart(2, '0')}`);
    };

    const goToMonthView = () => {
        router.push(`/dashboard/calendar/month/${format(currentDate, 'yyyy-MM')}`);
    };

    const goToYearView = () => {
        router.push(`/dashboard/calendar/year/${currentYear}`);
    };

    // Get ISO week number
    function getISOWeek(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    const handleMonthChange = (index: number) => {
        setCurrentDate(new Date(currentYear, index, 1));
    };

    const handleYearChange = (year: number) => {
        setCurrentDate(new Date(year, currentMonth, 1));
    };

    // Generate year range (centered around current year)
    const years = Array.from({ length: 41 }, (_, i) => currentYear - 20 + i);

    const selectedDateSlug = format(selectedDate, 'yyyy-MM-dd');
    const selectedDateEvents = eventsMap[selectedDateSlug] || [];

    return (
        <div className="fixed inset-0 z-40 overflow-hidden bg-[#2D1B4E]">
            {/* Background Image */}
            <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1.05 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                    backgroundImage: 'url(/calendarbackgroundimage.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center bottom',
                }}
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-black/30 pointer-events-none" />

            {/* Scope Navigation Tabs - Floating at top */}
            <motion.div
                className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-white/10 backdrop-blur-xl rounded-full p-1.5 border border-white/20 shadow-2xl"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <button
                    onClick={() => onDateClick(selectedDate)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                    <Calendar className="w-4 h-4" />
                    Day
                </button>
                <button
                    onClick={goToWeekView}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                    <CalendarDays className="w-4 h-4" />
                    Week
                </button>
                <button
                    onClick={goToMonthView}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                    <CalendarRange className="w-4 h-4" />
                    Month
                </button>
                <button
                    onClick={goToYearView}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                    <TrendingUp className="w-4 h-4" />
                    Year
                </button>
            </motion.div>

            <div className="relative z-10 w-full h-full flex p-8 pt-20 gap-8">

                {/* LEFT PANEL: Selected Date Context */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-80 flex flex-col h-full bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 p-8 shadow-2xl relative overflow-hidden group"
                >
                    {/* Decorative colored glow based on day */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-80" />

                    {/* Header: Back & Add */}
                    <div className="flex justify-between items-center mb-12">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onDateClick(selectedDate)}
                            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Big Typography Date */}
                    <div className="flex flex-col mb-8">
                        <span className="text-white/60 font-medium tracking-[0.2em] uppercase mb-[-10px]">
                            {format(selectedDate, 'EEEE')}
                        </span>
                        <h1 className="text-[140px] leading-none font-thin text-white tracking-tighter -ml-2 select-none">
                            {format(selectedDate, 'd')}
                        </h1>
                        <span className="text-white/40 text-lg font-light tracking-widest uppercase ml-2 mt-2 border-t border-white/10 pt-4 inline-block w-fit">
                            {format(selectedDate, 'MMMM yyyy')}
                        </span>
                    </div>

                    {/* Mini Timeline / Events Preview */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-4">
                        <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">
                            Schedule
                        </h3>
                        {selectedDateEvents.length > 0 ? (
                            selectedDateEvents.map((event, i) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="group/item flex gap-4 items-start p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => onDateClick(selectedDate)}
                                >
                                    <div className={`mt-1.5 w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]`} style={{ color: event.color || '#3B82F6', backgroundColor: event.color || '#3B82F6' }} />
                                    <div>
                                        <p className="text-white font-medium text-sm group-hover/item:text-blue-200 transition-colors">
                                            {event.title}
                                        </p>
                                        <p className="text-white/40 text-xs">{event.startTime}</p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center">
                                <p className="text-white/30 text-sm">No plans yet</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* CENTER PANEL: Main Calendar Grid */}
                <div className="flex-1 flex flex-col h-full bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-2xl overflow-hidden relative">

                    {/* Navigation Tabs (Months) */}
                    <div className="h-24 flex items-center px-10 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex gap-1 overflow-x-auto no-scrollbar mask-linear-fade w-full justify-between">
                            {months.map((m, idx) => (
                                <button
                                    key={m}
                                    onClick={() => handleMonthChange(idx)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative",
                                        idx === currentMonth
                                            ? "text-white bg-white/10 shadow-inner"
                                            : "text-white/30 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {m}
                                    {idx === currentMonth && (
                                        <motion.div
                                            layoutId="activeMonth"
                                            className="absolute bottom-1 left-1/2 w-1 h-1 bg-blue-400 rounded-full -translate-x-1/2"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 px-8 pt-8 pb-4">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-white/30 text-xs font-bold tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* The Grid */}
                    <div className="flex-1 p-8 pt-0 grid grid-cols-7 grid-rows-5 gap-4 overflow-y-auto no-scrollbar">
                        {days.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isSelected = isSameDay(day, selectedDate);
                            const isDayToday = isToday(day);
                            const daySlug = format(day, 'yyyy-MM-dd');
                            const dayEvents = eventsMap[daySlug] || [];

                            return (
                                <motion.div
                                    key={day.toString()}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: isCurrentMonth ? 1 : 0.3, scale: 1 }}
                                    transition={{ delay: idx * 0.01 }}
                                    onClick={() => {
                                        setSelectedDate(day);
                                    }}
                                    onDoubleClick={() => onDateClick(day)}
                                    className={cn(
                                        "relative group flex flex-col p-3 rounded-2xl cursor-pointer transition-all duration-300 border",
                                        "bg-gradient-to-br from-white/5 to-transparent hover:from-white/10 hover:to-white/5",
                                        "border-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1",
                                        "border-l-4",
                                        isSelected
                                            ? "border-l-blue-400 bg-white/10 shadow-2xl ring-1 ring-white/20"
                                            : isDayToday
                                                ? "border-l-green-400"
                                                : "border-l-transparent hover:border-l-white/30"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={cn(
                                            "text-lg font-medium transition-colors",
                                            isSelected ? "text-white" : isDayToday ? "text-green-400" : "text-white/70 group-hover:text-white"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        {isDayToday && <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_8px_currentColor]" />}
                                    </div>

                                    <div className="mt-auto flex gap-1 flex-wrap content-end h-full">
                                        {dayEvents.slice(0, 4).map((evt, i) => (
                                            <div
                                                key={i}
                                                className="w-2 h-2 rounded-full ring-1 ring-black/20"
                                                style={{
                                                    backgroundColor: evt.color || '#60A5FA',
                                                    boxShadow: isSelected ? '0 0 5px currentColor' : 'none'
                                                }}
                                            />
                                        ))}
                                        {dayEvents.length > 4 && (
                                            <span className="text-[10px] text-white/40 leading-none self-end">+</span>
                                        )}
                                    </div>

                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT PANEL: Liquid Glass Year Selector PILL */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center"
                >
                    {/* The Pill Container */}
                    <div className="w-20 h-[85%] bg-white/10 backdrop-blur-3xl rounded-[100px] border border-white/20 shadow-2xl relative overflow-hidden flex flex-col items-center">

                        {/* Scroll Mask */}
                        <div className="absolute inset-0 z-20 pointer-events-none mask-calendar-years" />

                        {/* Liquid sheen effect details */}
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none z-10" />

                        {/* Scrollable Years */}
                        <div
                            className="h-full overflow-y-auto no-scrollbar scroll-smooth py-32 space-y-6 w-full flex flex-col items-center"
                            ref={yearScrollRef}
                        >
                            {years.map((year) => {
                                const isCurrent = year === currentYear;
                                return (
                                    <button
                                        key={year}
                                        id={`year-${year}`}
                                        onClick={() => handleYearChange(year)}
                                        className={cn(
                                            "relative flex items-center justify-center transition-all duration-300 z-10 font-medium tracking-wide",
                                            isCurrent
                                                ? "w-16 py-2 bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110 font-bold"
                                                : "w-full text-white/40 hover:text-white"
                                        )}
                                    >
                                        <span className={cn("text-xs", isCurrent && "text-sm")}>
                                            {year}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
