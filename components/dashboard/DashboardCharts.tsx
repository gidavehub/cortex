"use client";

import { useMemo } from "react";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveCalendar } from "@nivo/calendar";
import { ResponsiveStream } from "@nivo/stream";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar
} from "recharts";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion } from "framer-motion";

// ─── Goal Ring ───────────────────────────────────────────────────────
interface GoalRingProps {
    value: number;
    maxValue?: number;
    label: string;
    sublabel?: string;
    color: string;
    trailColor?: string;
    icon?: React.ReactNode;
    delay?: number;
}

export function GoalRing({ value, maxValue = 100, label, sublabel, color, trailColor, icon, delay = 0 }: GoalRingProps) {
    const percentage = maxValue > 0 ? Math.min(Math.round((value / maxValue) * 100), 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white rounded-3xl p-5 shadow-soft border border-gray-100 flex flex-col items-center"
        >
            <div className="w-20 h-20 mb-3">
                <CircularProgressbar
                    value={percentage}
                    text={`${percentage}%`}
                    styles={buildStyles({
                        textSize: "24px",
                        textColor: color,
                        pathColor: color,
                        trailColor: trailColor || "#f1f5f9",
                        pathTransitionDuration: 1.2,
                    })}
                />
            </div>
            {icon && <div className="mb-1">{icon}</div>}
            <p className="text-sm font-bold text-gray-900">{label}</p>
            {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </motion.div>
    );
}

// ─── Activity Heatmap (Nivo Calendar) ─────────────────────────────────
interface HeatmapData {
    day: string; // "YYYY-MM-DD"
    value: number;
}

interface ActivityHeatmapProps {
    data: HeatmapData[];
    from: string;
    to: string;
}

export function ActivityHeatmap({ data, from, to }: ActivityHeatmapProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Activity Heatmap</h3>
                    <p className="text-xs text-gray-400">Task completions over time</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>Less</span>
                    {["#f0fdf4", "#bbf7d0", "#4ade80", "#16a34a", "#15803d"].map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                    ))}
                    <span>More</span>
                </div>
            </div>
            <div className="h-[180px]">
                <ResponsiveCalendar
                    data={data}
                    from={from}
                    to={to}
                    emptyColor="#f8fafc"
                    colors={["#bbf7d0", "#4ade80", "#16a34a", "#15803d"]}
                    margin={{ top: 20, right: 20, bottom: 10, left: 20 }}
                    yearSpacing={40}
                    monthBorderColor="#ffffff"
                    dayBorderWidth={2}
                    dayBorderColor="#ffffff"
                    legends={[]}
                    tooltip={({ day, value }) => (
                        <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl">
                            {day}: <strong>{value ?? 0}</strong> tasks
                        </div>
                    )}
                />
            </div>
        </motion.div>
    );
}

// ─── Skill Radar (Nivo Radar) ────────────────────────────────────────
interface RadarData {
    category: string;
    value: number;
}

interface SkillRadarProps {
    data: RadarData[];
}

export function SkillRadar({ data }: SkillRadarProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 h-full"
        >
            <h3 className="text-lg font-bold text-gray-900 mb-1">Productivity Radar</h3>
            <p className="text-xs text-gray-400 mb-4">Multi-dimensional progress snapshot</p>
            <div className="h-[280px]">
                <ResponsiveRadar
                    data={data}
                    keys={["value"]}
                    indexBy="category"
                    maxValue={100}
                    margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
                    curve="catmullRomClosed"
                    borderWidth={2}
                    borderColor="#6366f1"
                    gridLevels={4}
                    gridShape="circular"
                    gridLabelOffset={16}
                    dotSize={8}
                    dotColor="#6366f1"
                    dotBorderWidth={2}
                    dotBorderColor="#fff"
                    colors={["rgba(99,102,241,0.35)"]}
                    fillOpacity={0.6}
                    blendMode="multiply"
                    motionConfig="wobbly"
                    theme={{
                        text: { fontSize: 11, fill: "#94a3b8" },
                        grid: { line: { stroke: "#e2e8f0", strokeWidth: 1 } },
                    }}
                />
            </div>
        </motion.div>
    );
}

// ─── Productivity Stream (Nivo Stream) ────────────────────────────────
interface StreamDataPoint {
    [key: string]: number;
}

interface ProductivityStreamProps {
    data: StreamDataPoint[];
    keys: string[];
}

export function ProductivityStream({ data, keys }: ProductivityStreamProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 h-full"
        >
            <h3 className="text-lg font-bold text-gray-900 mb-1">Task Flow</h3>
            <p className="text-xs text-gray-400 mb-4">Completion patterns over 30 days</p>
            <div className="h-[280px]">
                <ResponsiveStream
                    data={data}
                    keys={keys}
                    margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                    axisBottom={{
                        tickSize: 0,
                        tickPadding: 10,
                        format: (v: number) => v % 7 === 0 ? `W${Math.floor(v / 7) + 1}` : "",
                    }}
                    axisLeft={{
                        tickSize: 0,
                        tickPadding: 8,
                    }}
                    curve="basis"
                    offsetType="silhouette"
                    colors={["#818cf8", "#34d399", "#fb923c", "#f472b6"]}
                    fillOpacity={0.75}
                    borderWidth={0}
                    enableGridX={false}
                    enableGridY={false}
                    motionConfig="molasses"
                    dotSize={0}
                    theme={{
                        text: { fontSize: 10, fill: "#94a3b8" },
                        axis: { ticks: { text: { fill: "#94a3b8" } } },
                    }}
                    legends={[
                        {
                            anchor: "bottom",
                            direction: "row",
                            translateY: 50,
                            itemWidth: 80,
                            itemHeight: 20,
                            itemTextColor: "#94a3b8",
                            symbolSize: 10,
                            symbolShape: "circle",
                        }
                    ]}
                />
            </div>
        </motion.div>
    );
}

// ─── Weekly Area Chart (Recharts) ─────────────────────────────────────
interface WeeklyDataPoint {
    day: string;
    tasks: number;
}

interface WeeklyAreaChartProps {
    data: WeeklyDataPoint[];
}

export function WeeklyAreaChart({ data }: WeeklyAreaChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100"
        >
            <h3 className="text-lg font-bold text-gray-900 mb-1">This Week</h3>
            <p className="text-xs text-gray-400 mb-4">Daily task completions</p>
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#1e293b",
                                border: "none",
                                borderRadius: "12px",
                                color: "#fff",
                                fontSize: "12px",
                                padding: "8px 14px",
                            }}
                            cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 4" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="tasks"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            fill="url(#areaGrad)"
                            dot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

// ─── Scope Distribution Bar Chart (Recharts) ──────────────────────────
interface ScopeBarData {
    scope: string;
    completed: number;
    total: number;
}

interface ScopeBarChartProps {
    data: ScopeBarData[];
}

export function ScopeBarChart({ data }: ScopeBarChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100"
        >
            <h3 className="text-lg font-bold text-gray-900 mb-1">Goals by Scope</h3>
            <p className="text-xs text-gray-400 mb-4">Completed vs total per scope</p>
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="scope"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#1e293b",
                                border: "none",
                                borderRadius: "12px",
                                color: "#fff",
                                fontSize: "12px",
                                padding: "8px 14px",
                            }}
                        />
                        <Bar dataKey="total" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={20} name="Total" />
                        <Bar dataKey="completed" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} name="Done" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
