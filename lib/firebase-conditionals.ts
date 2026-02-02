/**
 * Firebase Conditionals Operations
 * 
 * CRUD operations for conditionals and task rescheduling logic
 * when conditionals are resolved.
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { Conditional, CreateConditionalInput, ConditionalOutcome } from "./types/conditional";
import { Task } from "./types/task";

// Collection reference helper
const getConditionalsRef = (userId: string) =>
    collection(db, "users", userId, "conditionals");

const getTasksRef = (userId: string) =>
    collection(db, "users", userId, "tasks");

/**
 * Create a new conditional
 */
export async function createConditional(
    userId: string,
    input: CreateConditionalInput
): Promise<Conditional> {
    const conditionalsRef = getConditionalsRef(userId);

    const conditionalData = {
        title: input.title,
        description: input.description || '',
        expectedDate: Timestamp.fromDate(input.expectedDate),
        urgency: input.urgency,
        status: 'pending',
        outcomes: input.outcomes.map((o, i) => ({
            ...o,
            id: `outcome-${Date.now()}-${i}`,
        })),
        fallbackConditionalId: input.fallbackConditionalId || null,
        fallbackPostponeDays: input.fallbackPostponeDays || null,
        color: input.color || null,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(conditionalsRef, conditionalData);

    return {
        id: docRef.id,
        ...conditionalData,
        expectedDate: input.expectedDate,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as Conditional;
}

/**
 * Get all conditionals for a user
 */
export async function getConditionals(userId: string): Promise<Conditional[]> {
    const conditionalsRef = getConditionalsRef(userId);
    const q = query(conditionalsRef, orderBy("expectedDate", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            expectedDate: data.expectedDate?.toDate() || new Date(),
            resolvedAt: data.resolvedAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Conditional;
    });
}

/**
 * Get a single conditional
 */
export async function getConditional(userId: string, conditionalId: string): Promise<Conditional | null> {
    const docRef = doc(db, "users", userId, "conditionals", conditionalId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
        id: snapshot.id,
        ...data,
        expectedDate: data.expectedDate?.toDate() || new Date(),
        resolvedAt: data.resolvedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Conditional;
}

/**
 * Get tasks blocked by a conditional
 */
export async function getTasksBlockedByConditional(
    userId: string,
    conditionalId: string
): Promise<Task[]> {
    const tasksRef = getTasksRef(userId);
    const q = query(tasksRef, where("blockedByConditionalId", "==", conditionalId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            deadline: data.deadline?.toDate(),
            originalScheduledDate: data.originalScheduledDate?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Task;
    });
}

/**
 * Resolve a conditional with a selected outcome
 * This triggers automatic task rescheduling based on the outcome action
 */
export async function resolveConditional(
    userId: string,
    conditionalId: string,
    selectedOutcomeId: string
): Promise<{ updatedTasks: number; switchedToFallback?: string }> {
    const conditional = await getConditional(userId, conditionalId);
    if (!conditional) throw new Error("Conditional not found");

    const outcome = conditional.outcomes.find(o => o.id === selectedOutcomeId);
    if (!outcome) throw new Error("Outcome not found");

    const batch = writeBatch(db);
    let result: { updatedTasks: number; switchedToFallback?: string } = { updatedTasks: 0 };

    // Update the conditional itself
    const conditionalRef = doc(db, "users", userId, "conditionals", conditionalId);
    batch.update(conditionalRef, {
        status: outcome.type === 'failed' ? 'failed' : 'resolved',
        selectedOutcomeId,
        resolvedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    // Get blocked tasks
    const blockedTasks = await getTasksBlockedByConditional(userId, conditionalId);

    // Handle based on action type
    switch (outcome.action) {
        case 'activate':
            // Unblock all dependent tasks
            for (const task of blockedTasks) {
                const taskRef = doc(db, "users", userId, "tasks", task.id);
                batch.update(taskRef, {
                    status: 'pending',
                    blockedByConditionalId: null,
                    updatedAt: Timestamp.now(),
                });
                result.updatedTasks++;
            }
            break;

        case 'postpone':
            // Postpone all dependent tasks
            const postponeDays = outcome.postponeDays || 7;
            for (const task of blockedTasks) {
                const taskRef = doc(db, "users", userId, "tasks", task.id);

                // Calculate new date
                const currentDate = new Date(task.scopeKey);
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + postponeDays);
                const newScopeKey = newDate.toISOString().split('T')[0];

                batch.update(taskRef, {
                    scopeKey: newScopeKey,
                    originalScheduledDate: task.originalScheduledDate
                        ? Timestamp.fromDate(task.originalScheduledDate)
                        : Timestamp.fromDate(currentDate),
                    updatedAt: Timestamp.now(),
                });
                result.updatedTasks++;
            }
            break;

        case 'switch_fallback':
            // Switch to fallback conditional
            if (conditional.fallbackConditionalId) {
                for (const task of blockedTasks) {
                    const taskRef = doc(db, "users", userId, "tasks", task.id);
                    batch.update(taskRef, {
                        blockedByConditionalId: conditional.fallbackConditionalId,
                        updatedAt: Timestamp.now(),
                    });
                    result.updatedTasks++;
                }
                result.switchedToFallback = conditional.fallbackConditionalId;
            } else if (conditional.fallbackPostponeDays) {
                // No fallback conditional, use postpone days
                const postponeDays = conditional.fallbackPostponeDays;
                for (const task of blockedTasks) {
                    const taskRef = doc(db, "users", userId, "tasks", task.id);

                    const currentDate = new Date(task.scopeKey);
                    const newDate = new Date(currentDate);
                    newDate.setDate(newDate.getDate() + postponeDays);
                    const newScopeKey = newDate.toISOString().split('T')[0];

                    batch.update(taskRef, {
                        scopeKey: newScopeKey,
                        blockedByConditionalId: null,
                        status: 'pending',
                        originalScheduledDate: task.originalScheduledDate
                            ? Timestamp.fromDate(task.originalScheduledDate)
                            : Timestamp.fromDate(currentDate),
                        updatedAt: Timestamp.now(),
                    });
                    result.updatedTasks++;
                }
            }
            break;
    }

    await batch.commit();
    return result;
}

/**
 * Update a conditional
 */
export async function updateConditional(
    userId: string,
    conditionalId: string,
    updates: Partial<CreateConditionalInput>
): Promise<void> {
    const conditionalRef = doc(db, "users", userId, "conditionals", conditionalId);

    const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.expectedDate) updateData.expectedDate = Timestamp.fromDate(updates.expectedDate);
    if (updates.urgency !== undefined) updateData.urgency = updates.urgency;
    if (updates.outcomes !== undefined) {
        updateData.outcomes = updates.outcomes.map((o, i) => ({
            ...o,
            id: `outcome-${Date.now()}-${i}`,
        }));
    }
    if (updates.fallbackConditionalId !== undefined) updateData.fallbackConditionalId = updates.fallbackConditionalId;
    if (updates.fallbackPostponeDays !== undefined) updateData.fallbackPostponeDays = updates.fallbackPostponeDays;
    if (updates.color !== undefined) updateData.color = updates.color;

    await updateDoc(conditionalRef, updateData);
}

/**
 * Delete a conditional
 */
export async function deleteConditional(userId: string, conditionalId: string): Promise<void> {
    // First unblock any tasks blocked by this conditional
    const blockedTasks = await getTasksBlockedByConditional(userId, conditionalId);
    const batch = writeBatch(db);

    for (const task of blockedTasks) {
        const taskRef = doc(db, "users", userId, "tasks", task.id);
        batch.update(taskRef, {
            blockedByConditionalId: null,
            status: 'pending',
            updatedAt: Timestamp.now(),
        });
    }

    // Delete the conditional
    const conditionalRef = doc(db, "users", userId, "conditionals", conditionalId);
    batch.delete(conditionalRef);

    await batch.commit();
}

/**
 * Link a task to a conditional (block the task)
 */
export async function linkTaskToConditional(
    userId: string,
    taskId: string,
    conditionalId: string
): Promise<void> {
    const taskRef = doc(db, "users", userId, "tasks", taskId);
    await updateDoc(taskRef, {
        blockedByConditionalId: conditionalId,
        status: 'blocked',
        updatedAt: Timestamp.now(),
    });
}

/**
 * Unlink a task from a conditional
 */
export async function unlinkTaskFromConditional(
    userId: string,
    taskId: string
): Promise<void> {
    const taskRef = doc(db, "users", userId, "tasks", taskId);
    await updateDoc(taskRef, {
        blockedByConditionalId: null,
        status: 'pending',
        updatedAt: Timestamp.now(),
    });
}
