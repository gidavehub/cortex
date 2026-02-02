
"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface TaskProps {
    task: {
        id: string;
        title: string;
        status: string;
        priority?: string;
    };
    onToggle: (id: string, status: string) => void;
}

export function TaskItem({ task, onToggle }: TaskProps) {
    const isDone = task.status === "done";

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${isDone
                    ? "bg-gray-50 border-gray-100 opacity-60"
                    : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm"
                }`}
            onClick={() => onToggle(task.id, isDone ? "todo" : "done")}
        >
            <div className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors ${isDone ? "text-green-500" : "text-gray-300 group-hover:text-blue-500"
                }`}>
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </div>

            <span className={`text-sm font-medium transition-colors ${isDone ? "text-gray-400 line-through" : "text-gray-700"
                }`}>
                {task.title}
            </span>

            {task.priority === 'high' && !isDone && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-400 shadow-sm"></span>
            )}
        </motion.li>
    );
}
