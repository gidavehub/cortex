"use client";

import { Search, Bell, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
    onSearchClick?: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isMac, setIsMac] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Detect OS on mount
    useEffect(() => {
        if (typeof navigator !== "undefined") {
            setIsMac(navigator.platform.toUpperCase().includes("MAC"));
        }
    }, []);

    const shortcutText = isMac ? "⌘F" : "Ctrl+F";

    return (
        <header className="flex items-center justify-center mb-8 sticky top-4 z-30">
            {/* Frosted Glass Nav Container */}
            <div className="flex items-center gap-5 px-5 py-2.5 bg-white/80 backdrop-blur-xl rounded-full shadow-lg border border-white/60">

                {/* Search Bar - Now a button that opens overlay */}
                <button
                    onClick={onSearchClick}
                    className="relative group flex items-center gap-3 w-72 px-4 py-2.5 bg-gray-100/80 hover:bg-gray-200/80 border border-transparent rounded-full text-left transition-all"
                >
                    <Search className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400 flex-1">Search tasks, dates...</span>
                    <span className="px-2 py-1 bg-gray-200/80 text-gray-500 rounded-md text-xs font-medium">
                        {shortcutText}
                    </span>
                </button>

                <div className="h-6 w-px bg-gray-300"></div>

                {/* Calendar Icon */}
                <button
                    onClick={() => router.push('/dashboard/calendar')}
                    className="w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-all"
                >
                    <CalendarIcon className="w-4 h-4" />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-all relative"
                    >
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">Notifications</h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50">
                                    <p className="text-sm font-medium text-gray-900">Welcome to Cortex!</p>
                                    <p className="text-xs text-gray-500 mt-1">Get started by adding your first task.</p>
                                </div>
                                <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                    <p className="text-sm font-medium text-gray-900">💡 Tip: Global search</p>
                                    <p className="text-xs text-gray-500 mt-1">Press {shortcutText} to search anywhere.</p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 border-t border-gray-100">
                                <button className="w-full text-center text-sm text-blue-600 font-medium hover:underline">
                                    Mark all as read
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-gray-300"></div>

                {/* Profile */}
                <button
                    onClick={() => router.push('/dashboard/settings')}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 hover:bg-gray-100/80 rounded-full transition-all cursor-pointer"
                >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-inner overflow-hidden">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user?.name ? user.name.charAt(0).toUpperCase() : "U"
                        )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0] || "User"}</span>
                </button>
            </div>
        </header>
    );
}
