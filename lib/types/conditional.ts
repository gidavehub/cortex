/**
 * Conditional Types
 * 
 * Conditionals are first-class entities representing uncertain events
 * that tasks can depend on. When resolved, they trigger automatic
 * task rescheduling based on the selected outcome.
 */

// Urgency levels for conditionals
export type ConditionalUrgency = 'low' | 'medium' | 'high' | 'critical';

// Status of a conditional
export type ConditionalStatus = 'pending' | 'resolved' | 'failed';

// Type of outcome
export type OutcomeType = 'success' | 'delayed' | 'failed';

// Action to take when outcome is selected
export type OutcomeAction = 'activate' | 'postpone' | 'switch_fallback';

/**
 * A possible outcome when a conditional is resolved
 */
export interface ConditionalOutcome {
    id: string;
    label: string;                    // "Money received", "Delayed to next week"
    type: OutcomeType;

    // Action when this outcome is selected
    action: OutcomeAction;
    postponeDays?: number;            // For 'postpone' action - days to add
    newExpectedDate?: Date;           // For 'delayed' - new expected date
    notes?: string;
}

/**
 * A conditional - an uncertain event that tasks depend on
 */
export interface Conditional {
    id: string;
    title: string;                    // "Money from Mr. Colley"
    description?: string;

    // Timing
    expectedDate: Date;               // When we expect resolution
    urgency: ConditionalUrgency;

    // Status
    status: ConditionalStatus;
    resolvedAt?: Date;
    selectedOutcomeId?: string;       // Which outcome occurred

    // Possible outcomes
    outcomes: ConditionalOutcome[];

    // Fallback chain
    fallbackConditionalId?: string;   // If this fails, try another conditional
    fallbackPostponeDays?: number;    // Final fallback: postpone by this many days

    // Visual
    color?: string;
    icon?: string;

    // Meta
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Input for creating a new conditional
 */
export interface CreateConditionalInput {
    title: string;
    description?: string;
    expectedDate: Date;
    urgency: ConditionalUrgency;
    outcomes: Omit<ConditionalOutcome, 'id'>[];
    fallbackConditionalId?: string;
    fallbackPostponeDays?: number;
    color?: string;
}

/**
 * Urgency configuration for display
 */
export const URGENCY_CONFIG: Record<ConditionalUrgency, { label: string; color: string; icon: string }> = {
    low: { label: 'Low', color: '#6B7280', icon: '⚪' },
    medium: { label: 'Medium', color: '#F59E0B', icon: '🟡' },
    high: { label: 'High', color: '#EF4444', icon: '🟠' },
    critical: { label: 'Critical', color: '#DC2626', icon: '🔴' },
};

/**
 * Outcome type configuration
 */
export const OUTCOME_TYPE_CONFIG: Record<OutcomeType, { label: string; color: string }> = {
    success: { label: 'Success', color: '#10B981' },
    delayed: { label: 'Delayed', color: '#F59E0B' },
    failed: { label: 'Failed', color: '#EF4444' },
};
