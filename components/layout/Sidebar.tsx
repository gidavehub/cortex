"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Calendar, Settings, LogOut, Target,
    Trophy, GitBranch, Users, Megaphone
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useSpring,
    useTransform,
    MotionValue,
} from "framer-motion";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Target, label: "Tasks", href: "/dashboard/tasks" },
    { icon: Megaphone, label: "Outreach", href: "/dashboard/outreach" },
    { icon: Users, label: "Clients", href: "/dashboard/clients" },
    { icon: GitBranch, label: "Conditionals", href: "/dashboard/conditionals" },
    { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
    { icon: Trophy, label: "Achievements", href: "/dashboard/achievements" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

// ─── Dock Item with Spring Physics ───────────────────────────────────
interface DockNavItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    isActive: boolean;
    mouseY: MotionValue<number>;
}

function DockNavItem({ icon: Icon, label, href, isActive, mouseY }: DockNavItemProps) {
    const ref = useRef<HTMLAnchorElement>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);

    // ─── Physics Configuration ───
    const baseSize = 38;        // Resting icon button size
    const magnifiedSize = 58;   // Peak size on hover
    const distance = 120;       // Influence radius in pixels

    // Calculate distance from mouse to center of this item
    const mouseDistance = useTransform(mouseY, (val: number) => {
        const rect = ref.current?.getBoundingClientRect() ?? { y: 0, height: baseSize };
        return val - rect.y - rect.height / 2;
    });

    // Map distance to size — swell effect
    const sizeSync = useTransform(
        mouseDistance,
        [-distance, 0, distance],
        [baseSize, magnifiedSize, baseSize]
    );

    // Spring for elastic rubber-band feel
    const size = useSpring(sizeSync, {
        mass: 0.1,
        stiffness: 180,
        damping: 12,
    });

    // Icon scales proportionally
    const iconSize = useTransform(size, [baseSize, magnifiedSize], [16, 24]);

    return (
        <Link ref={ref} href={href}>
            <motion.div
                style={{ width: size, height: size }}
                onHoverStart={() => setTooltipVisible(true)}
                onHoverEnd={() => setTooltipVisible(false)}
                className={cn(
                    "relative flex items-center justify-center rounded-full transition-colors duration-200 cursor-pointer",
                    isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40"
                        : "text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                )}
            >
                {/* Animated icon */}
                <motion.div
                    className="flex items-center justify-center"
                    style={{ width: iconSize, height: iconSize }}
                >
                    <Icon className="w-full h-full" />
                </motion.div>

                {/* Tooltip */}
                <AnimatePresence>
                    {tooltipVisible && (
                        <motion.div
                            initial={{ opacity: 0, x: -8, scale: 0.85 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -8, scale: 0.85 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-xl"
                        >
                            {label}
                            {/* Arrow */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/90" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active indicator dot */}
                {isActive && (
                    <motion.div
                        layoutId="sidebar-active-dot"
                        className="absolute -right-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50"
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                )}
            </motion.div>
        </Link>
    );
}

// ─── Dock Logout Button with Spring Physics ──────────────────────────
function DockLogoutButton({ mouseY, onClick }: { mouseY: MotionValue<number>; onClick: () => void }) {
    const ref = useRef<HTMLButtonElement>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);

    const baseSize = 38;
    const magnifiedSize = 54;
    const distance = 120;

    const mouseDistance = useTransform(mouseY, (val: number) => {
        const rect = ref.current?.getBoundingClientRect() ?? { y: 0, height: baseSize };
        return val - rect.y - rect.height / 2;
    });

    const sizeSync = useTransform(mouseDistance, [-distance, 0, distance], [baseSize, magnifiedSize, baseSize]);
    const size = useSpring(sizeSync, { mass: 0.1, stiffness: 180, damping: 12 });
    const iconSize = useTransform(size, [baseSize, magnifiedSize], [16, 22]);

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            style={{ width: size, height: size }}
            onHoverStart={() => setTooltipVisible(true)}
            onHoverEnd={() => setTooltipVisible(false)}
            className="relative flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200 cursor-pointer"
        >
            <motion.div
                className="flex items-center justify-center"
                style={{ width: iconSize, height: iconSize }}
            >
                <LogOut className="w-full h-full" />
            </motion.div>

            <AnimatePresence>
                {tooltipVisible && (
                    <motion.div
                        initial={{ opacity: 0, x: -8, scale: 0.85 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -8, scale: 0.85 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-xl"
                    >
                        Logout
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/90" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

// ─── Main Sidebar ────────────────────────────────────────────────────
export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    // Shared MotionValue — tracks cursor Y across the entire dock
    const mouseY = useMotionValue(Infinity);

    return (
        <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40">
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
                className="glass flex flex-col items-center py-4 px-2.5 rounded-full shadow-2xl bg-white/90 backdrop-blur-xl border border-white/40 max-h-[calc(100vh-3rem)]"
                onMouseMove={(e) => mouseY.set(e.clientY)}
                onMouseLeave={() => mouseY.set(Infinity)}
            >
                {/* Cortex Logo */}
                <div className="mb-3">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.83327 15.2485L4.56432 15.0809L3.83327 15.2485ZM3.83327 9.35323L4.56432 9.52078L3.83327 9.35323ZM20.1667 9.35323L19.4357 9.52079L20.1667 9.35323ZM20.1667 15.2485L19.4357 15.0809L20.1667 15.2485ZM14.8801 20.6589L15.0552 21.3882L14.8801 20.6589ZM9.11986 20.6589L9.29493 19.9296L9.11986 20.6589ZM9.11985 3.94279L9.29493 4.67207L9.11985 3.94279ZM14.8801 3.94279L15.0552 3.21351L14.8801 3.94279ZM8.82008 3C8.82008 2.58579 8.48429 2.25 8.07008 2.25C7.65587 2.25 7.32008 2.58579 7.32008 3H8.82008ZM7.32008 5.51375C7.32008 5.92796 7.65587 6.26375 8.07008 6.26375C8.48429 6.26375 8.82008 5.92796 8.82008 5.51375H7.32008ZM16.6799 3C16.6799 2.58579 16.3441 2.25 15.9299 2.25C15.5157 2.25 15.1799 2.58579 15.1799 3H16.6799ZM15.1799 5.51375C15.1799 5.92796 15.5157 6.26375 15.9299 6.26375C16.3441 6.26375 16.6799 5.92796 16.6799 5.51375H15.1799ZM4.56432 15.0809C4.14523 13.2524 4.14523 11.3493 4.56432 9.52078L3.10223 9.18568C2.63259 11.2347 2.63259 13.367 3.10223 15.416L4.56432 15.0809ZM19.4357 9.52079C19.8548 11.3493 19.8548 13.2524 19.4357 15.0809L20.8978 15.416C21.3674 13.367 21.3674 11.2347 20.8978 9.18568L19.4357 9.52079ZM14.7051 19.9296C12.9258 20.3568 11.0742 20.3568 9.29493 19.9296L8.94478 21.3882C10.9543 21.8706 13.0458 21.8706 15.0552 21.3882L14.7051 19.9296ZM9.29493 4.67207C11.0742 4.24493 12.9258 4.24493 14.7051 4.67207L15.0552 3.21351C13.0458 2.73111 10.9542 2.73111 8.94478 3.21351L9.29493 4.67207ZM9.29493 19.9296C6.95607 19.3682 5.11769 17.4953 4.56432 15.0809L3.10223 15.416C3.77946 18.3708 6.03739 20.6902 8.94478 21.3882L9.29493 19.9296ZM15.0552 21.3882C17.9626 20.6902 20.2205 18.3708 20.8978 15.416L19.4357 15.0809C18.8823 17.4953 17.0439 19.3682 14.7051 19.9296L15.0552 21.3882ZM14.7051 4.67207C17.0439 5.23355 18.8823 7.10642 19.4357 9.52079L20.8978 9.18568C20.2205 6.23089 17.9626 3.91147 15.0552 3.21351L14.7051 4.67207ZM8.94478 3.21351C6.03739 3.91147 3.77946 6.23089 3.10223 9.18568L4.56432 9.52078C5.11769 7.10641 6.95607 5.23355 9.29493 4.67207L8.94478 3.21351ZM7.32008 3V5.51375H8.82008V3H7.32008ZM15.1799 3V5.51375H16.6799V3H15.1799Z" fill="#3B82F6" />
                        <path d="M7.98809 10.2877C7.6736 10.0181 7.20012 10.0546 6.93056 10.369C6.66099 10.6835 6.69741 11.157 7.01191 11.4266L7.98809 10.2877ZM8.5 11.7143L8.01191 12.2837C8.29277 12.5245 8.70723 12.5245 8.98809 12.2837L8.5 11.7143ZM10.9881 10.5694C11.3026 10.2999 11.339 9.8264 11.0694 9.51191C10.7999 9.19741 10.3264 9.16099 10.0119 9.43056L10.9881 10.5694ZM7.98809 14.5734C7.6736 14.3038 7.20012 14.3403 6.93056 14.6548C6.66099 14.9693 6.69741 15.4427 7.01191 15.7123L7.98809 14.5734ZM8.5 16L8.01191 16.5694C8.29277 16.8102 8.70723 16.8102 8.98809 16.5694L8.5 16ZM10.9881 14.8552C11.3026 14.5856 11.339 14.1121 11.0694 13.7976C10.7999 13.4831 10.3264 13.4467 10.0119 13.7163L10.9881 14.8552ZM13 10.5357C12.5858 10.5357 12.25 10.8715 12.25 11.2857C12.25 11.6999 12.5858 12.0357 13 12.0357V10.5357ZM16.5 12.0357C16.9142 12.0357 17.25 11.6999 17.25 11.2857C17.25 10.8715 16.9142 10.5357 16.5 10.5357V12.0357ZM13 14.8214C12.5858 14.8214 12.25 15.1572 12.25 15.5714C12.25 15.9856 12.5858 16.3214 13 16.3214V14.8214ZM16.5 16.3214C16.9142 16.3214 17.25 15.9856 17.25 15.5714C17.25 15.1572 16.9142 14.8214 16.5 14.8214V16.3214ZM7.01191 11.4266L8.01191 12.2837L8.98809 11.1448L7.98809 10.2877L7.01191 11.4266ZM8.98809 12.2837L10.9881 10.5694L10.0119 9.43056L8.01191 11.1448L8.98809 12.2837ZM7.01191 15.7123L8.01191 16.5694L8.98809 15.4306L7.98809 14.5734L7.01191 15.7123ZM8.98809 16.5694L10.9881 14.8552L10.0119 13.7163L8.01191 15.4306L8.98809 16.5694ZM13 12.0357H16.5V10.5357H13V12.0357ZM13 16.3214H16.5V14.8214H13V16.3214Z" fill="#3B82F6" />
                    </svg>
                </div>

                {/* Nav Items — Elastic Dock */}
                <nav className="flex flex-col items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                        return (
                            <DockNavItem
                                key={item.href}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                isActive={isActive}
                                mouseY={mouseY}
                            />
                        );
                    })}
                </nav>

                <div className="w-6 h-px bg-gray-200 my-2" />

                {/* Logout — also elastic */}
                <DockLogoutButton mouseY={mouseY} onClick={() => logout()} />
            </motion.div>
        </aside>
    );
}
