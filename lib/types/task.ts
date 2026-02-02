// Task Types for Cortex Hierarchical Task System

export type TaskScope = 'day' | 'week' | 'month' | 'year';
export type TaskStatus = 'pending' | 'in-progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Confidence levels for milestone outcomes
export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

// Condition that can trigger/activate a milestone task
export interface MilestoneCondition {
    id: string;
    description: string;              // "Mr. Colley provides GMD 3,000"
    triggerTaskId?: string;           // Task whose completion triggers evaluation
    expectedOutcome: string;          // What we expect to happen
    confidence: ConfidenceLevel;      // How confident are we this will happen
    evaluatedAt?: Date;               // When was this condition evaluated
    wasSuccessful?: boolean;          // Did it succeed?
}

// Possible outcomes when a milestone condition is evaluated
export interface MilestoneOutcome {
    id: string;
    label: string;                    // "Money received" | "Delayed" | "Declined"
    isPositive: boolean;              // Does this activate dependent tasks?
    activateTaskIds?: string[];       // Tasks to activate if this outcome occurs
    pivotTaskIds?: string[];          // Alternative tasks if negative outcome
    notes?: string;
}

export const CONFIDENCE_CONFIG = {
    very_low: { label: 'Very Low', color: '#EF4444', percent: 20 },
    low: { label: 'Low', color: '#F97316', percent: 40 },
    medium: { label: 'Medium', color: '#F59E0B', percent: 60 },
    high: { label: 'High', color: '#10B981', percent: 80 },
    very_high: { label: 'Very High', color: '#059669', percent: 95 },
};

export interface TaskLink {
    label: string;
    url: string;
    type?: 'meeting' | 'resource' | 'video' | 'other';
}

export interface TaskChecklistItem {
    id: string;
    text: string;
    done: boolean;
}

export interface TaskContent {
    images?: string[];
    links?: TaskLink[];
    videos?: string[];
    checklist?: TaskChecklistItem[];
}

export interface Task {
    id: string;
    title: string;
    description?: string;

    // Priority & Deadline
    priority: TaskPriority;
    deadline?: Date;  // Hard deadline for the task

    // Scope & Timing
    scope: TaskScope;
    scopeKey: string; // "2026-02-02", "2026-W05", "2026-02", "2026"

    // Time slot (for day scope tasks)
    startTime?: string; // "09:00"
    endTime?: string;   // "11:30"

    // Rich Content
    content?: TaskContent;

    // Hierarchy
    parentTaskId?: string;
    contributionPercent?: number; // 0-100, how much this contributes to parent

    // Status & Progress
    status: TaskStatus;
    progress: number; // 0-100

    // Visual
    color?: string;

    // Meta
    userId: string;
    createdAt: Date;
    updatedAt: Date;

    // Milestone/Conditional Task Fields
    isMilestone?: boolean;                      // Is this a milestone task?
    milestoneConditions?: MilestoneCondition[]; // Conditions that activate this
    milestoneOutcomes?: MilestoneOutcome[];     // Possible outcomes
    blockedByMilestoneId?: string;              // Task ID of milestone blocking this
    activatedByOutcomeId?: string;              // Which outcome activated this task
    dependentTaskIds?: string[];                // Tasks that depend on this milestone

    // Conditional Dependencies (new system)
    blockedByConditionalId?: string;            // ID of conditional blocking this task
    originalScheduledDate?: Date;               // Original date before any postponements
}

// Priority configuration
export const PRIORITY_CONFIG = {
    low: { label: 'Low', color: '#94A3B8', bgColor: '#F1F5F9' },
    medium: { label: 'Medium', color: '#3B82F6', bgColor: '#EFF6FF' },
    high: { label: 'High', color: '#F97316', bgColor: '#FFF7ED' },
    critical: { label: 'Critical', color: '#EF4444', bgColor: '#FEF2F2' },
};

// Helper type for creating new tasks
export interface CreateTaskInput {
    title: string;
    description?: string;
    priority?: TaskPriority;
    deadline?: Date;
    scope: TaskScope;
    scopeKey: string;
    startTime?: string;
    endTime?: string;
    content?: TaskContent;
    parentTaskId?: string;
    contributionPercent?: number;
    color?: string;
    // Milestone fields
    isMilestone?: boolean;
    milestoneConditions?: MilestoneCondition[];
    milestoneOutcomes?: MilestoneOutcome[];
    blockedByMilestoneId?: string;
    // Conditional dependency
    blockedByConditionalId?: string;
}

// Helper to generate scope key from date
export function getScopeKey(date: Date, scope: TaskScope): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (scope) {
        case 'day':
            return `${year}-${month}-${day}`;
        case 'week':
            // ISO week number
            const weekNum = getISOWeek(date);
            return `${year}-W${String(weekNum).padStart(2, '0')}`;
        case 'month':
            return `${year}-${month}`;
        case 'year':
            return `${year}`;
    }
}

// Get ISO week number
function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Color presets for tasks
export const TASK_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
];
