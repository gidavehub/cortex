"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Target, Clock, X, ArrowRight, CheckCircle2, Layers, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task, TASK_COLORS } from "@/lib/types/task";
import { format, parse, isValid, addDays, startOfWeek, startOfMonth, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

type SearchResult = {
    type: 'task' | 'date' | 'week' | 'month' | 'year';
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    color?: string;
    href: string;
    task?: Task;
};

const SCOPE_ICONS = {
    day: Clock,
    week: Layers,
    month: Calendar,
    year: TrendingUp,
};

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const router = useRouter();
    const { user } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Fetch all tasks for search
    useEffect(() => {
        if (!user || !isOpen) return;

        const q = query(
            collection(db, "users", user.uid, "tasks"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
            })) as Task[];
            setTasks(fetchedTasks);
        });

        return () => unsubscribe();
    }, [user, isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setSearchQuery("");
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Smart Search algorithm with ranking and limits
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const MAX_RESULTS = 15;

        // Scored results for ranking
        type ScoredResult = SearchResult & { score: number };
        const scoredResults: ScoredResult[] = [];

        // Search tasks with relevance scoring
        tasks.forEach(task => {
            const titleLower = task.title.toLowerCase();
            const descLower = task.description?.toLowerCase() || '';

            let score = 0;

            // Exact title match = highest score
            if (titleLower === query) {
                score = 100;
            } else if (titleLower.startsWith(query)) {
                score = 80;
            } else if (titleLower.includes(query)) {
                score = 60;
            } else if (descLower.includes(query)) {
                score = 30;
            }

            if (score > 0) {
                // Boost by priority
                const priorityBoost = { critical: 15, high: 10, medium: 5, low: 0 };
                score += priorityBoost[task.priority] || 0;

                // Boost if task has deadline
                if (task.deadline) score += 5;

                const ScopeIcon = task.scope && SCOPE_ICONS[task.scope] ? SCOPE_ICONS[task.scope] : Clock;

                scoredResults.push({
                    type: 'task',
                    id: task.id,
                    title: task.title,
                    subtitle: `${task.scope || 'task'} • ${task.scopeKey || ''}${task.status === 'done' ? ' • ✓ Done' : ''}`,
                    icon: <ScopeIcon className="w-4 h-4" />,
                    color: task.color || TASK_COLORS[0],
                    href: `/dashboard/tasks/${task.id}`,
                    task,
                    score,
                });
            }
        });

        // Parse date queries - only show NEXT occurrence
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayIndex = dayNames.findIndex(d => d.startsWith(query) && query.length >= 3);

        if (dayIndex !== -1) {
            const today = new Date();
            const currentDay = today.getDay();
            const daysUntil = (dayIndex - currentDay + 7) % 7 || 7;
            const date = addDays(today, daysUntil);
            const dateKey = format(date, 'yyyy-MM-dd');

            scoredResults.push({
                type: 'date',
                id: `date-${dateKey}`,
                title: `${dayNames[dayIndex].charAt(0).toUpperCase() + dayNames[dayIndex].slice(1)}, ${format(date, 'MMMM d')}`,
                subtitle: `Next ${dayNames[dayIndex]}`,
                icon: <Calendar className="w-4 h-4" />,
                href: `/dashboard/calendar/day/${dateKey}`,
                score: 50,
            });
        }

        // "today" / "tomorrow" / "yesterday"
        if (query === 'today') {
            const date = new Date();
            const dateKey = format(date, 'yyyy-MM-dd');
            scoredResults.push({
                type: 'date',
                id: `date-${dateKey}`,
                title: format(date, 'EEEE, MMMM d'),
                subtitle: 'Today',
                icon: <Calendar className="w-4 h-4" />,
                href: `/dashboard/calendar/day/${dateKey}`,
                score: 90,
            });
        } else if (query === 'tomorrow') {
            const date = addDays(new Date(), 1);
            const dateKey = format(date, 'yyyy-MM-dd');
            scoredResults.push({
                type: 'date',
                id: `date-${dateKey}`,
                title: format(date, 'EEEE, MMMM d'),
                subtitle: 'Tomorrow',
                icon: <Calendar className="w-4 h-4" />,
                href: `/dashboard/calendar/day/${dateKey}`,
                score: 85,
            });
        }

        // Parse YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(query)) {
            try {
                const date = parseISO(query);
                if (isValid(date)) {
                    scoredResults.push({
                        type: 'date',
                        id: `date-${query}`,
                        title: format(date, 'EEEE, MMMM d, yyyy'),
                        subtitle: 'Go to this day',
                        icon: <Calendar className="w-4 h-4" />,
                        href: `/dashboard/calendar/day/${query}`,
                        score: 70,
                    });
                }
            } catch { }
        }

        // Parse month names
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'];
        const monthIndex = monthNames.findIndex(m => m.startsWith(query) && query.length >= 3);
        if (monthIndex !== -1) {
            const year = new Date().getFullYear();
            const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
            scoredResults.push({
                type: 'month',
                id: `month-${monthKey}`,
                title: `${monthNames[monthIndex].charAt(0).toUpperCase() + monthNames[monthIndex].slice(1)} ${year}`,
                subtitle: 'View month',
                icon: <Calendar className="w-4 h-4" />,
                href: `/dashboard/calendar/month/${monthKey}`,
                score: 55,
            });
        }

        // Parse year
        if (/^\d{4}$/.test(query)) {
            scoredResults.push({
                type: 'year',
                id: `year-${query}`,
                title: `Year ${query}`,
                subtitle: 'View year goals',
                icon: <TrendingUp className="w-4 h-4" />,
                href: `/dashboard/calendar/year/${query}`,
                score: 45,
            });
        }

        // Parse week
        if (/^week\s*\d+$/i.test(query)) {
            const weekNum = parseInt(query.replace(/\D/g, ''));
            const year = new Date().getFullYear();
            const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
            scoredResults.push({
                type: 'week',
                id: `week-${weekKey}`,
                title: `Week ${weekNum}, ${year}`,
                subtitle: 'View week goals',
                icon: <Layers className="w-4 h-4" />,
                href: `/dashboard/calendar/week/${weekKey}`,
                score: 50,
            });
        }

        // Sort by score (highest first) and limit results
        scoredResults.sort((a, b) => b.score - a.score);
        const limitedResults = scoredResults.slice(0, MAX_RESULTS);

        // Remove score before setting results
        setResults(limitedResults.map(({ score, ...rest }) => rest));
        setSelectedIndex(0);
    }, [searchQuery, tasks]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            router.push(results[selectedIndex].href);
            onClose();
        }
    }, [results, selectedIndex, router, onClose]);

    const handleResultClick = (result: SearchResult) => {
        router.push(result.href);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Search Modal */}
                    <motion.div
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", duration: 0.3 }}
                    >
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                            {/* Search Input */}
                            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search tasks, dates, weeks, months..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-gray-400"
                                />
                                <kbd className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-mono rounded">ESC</kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-[400px] overflow-y-auto">
                                {results.length > 0 ? (
                                    <div className="p-2">
                                        {results.map((result, index) => (
                                            <motion.div
                                                key={result.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className={cn(
                                                    "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all",
                                                    selectedIndex === index
                                                        ? "bg-blue-50 text-blue-900"
                                                        : "hover:bg-gray-50"
                                                )}
                                                onClick={() => handleResultClick(result)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                                        result.type === 'task' ? "bg-gray-100" : "bg-blue-100"
                                                    )}
                                                    style={result.type === 'task' ? {
                                                        backgroundColor: `${result.color}20`,
                                                        color: result.color
                                                    } : undefined}
                                                >
                                                    {result.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {result.title}
                                                    </p>
                                                    {result.subtitle && (
                                                        <p className="text-sm text-gray-500 truncate">
                                                            {result.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                                <ArrowRight className={cn(
                                                    "w-4 h-4 transition-opacity",
                                                    selectedIndex === index ? "opacity-100" : "opacity-0"
                                                )} />
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : searchQuery ? (
                                    <div className="p-8 text-center text-gray-400">
                                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No results for "{searchQuery}"</p>
                                        <p className="text-sm mt-1">Try searching for a task, date, or "today"</p>
                                    </div>
                                ) : (
                                    <div className="p-6 text-gray-500">
                                        <p className="text-sm font-medium text-gray-400 mb-3">Quick Actions</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: 'Today', query: 'today' },
                                                { label: 'Tomorrow', query: 'tomorrow' },
                                                { label: 'This Week', query: `week ${getISOWeek(new Date())}` },
                                                { label: `${format(new Date(), 'MMMM')}`, query: format(new Date(), 'MMMM').toLowerCase() },
                                            ].map(item => (
                                                <button
                                                    key={item.label}
                                                    className="px-4 py-2 text-left rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                                                    onClick={() => setSearchQuery(item.query)}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono">↑</kbd>
                                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono">↓</kbd>
                                        to navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono">↵</kbd>
                                        to select
                                    </span>
                                </div>
                                <span>{results.length} results</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
