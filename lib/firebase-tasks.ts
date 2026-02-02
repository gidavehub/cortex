// Firebase Task Operations for Cortex

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    getDoc,
    getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, CreateTaskInput, TaskScope } from './types/task';

// Collection reference helper
const tasksCollection = (userId: string) => collection(db, 'users', userId, 'tasks');

// Create a new task
export async function createTask(userId: string, input: CreateTaskInput): Promise<string> {
    // Determine initial status - blocked if it has a conditional dependency
    const status = input.blockedByConditionalId ? 'blocked' : 'pending';

    const taskData = {
        ...input,
        status,
        progress: 0,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(tasksCollection(userId), taskData);
    return docRef.id;
}

// Update a task
export async function updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Task>
): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

// Delete a task
export async function deleteTask(userId: string, taskId: string): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
}

// Get a single task
export async function getTask(userId: string, taskId: string): Promise<Task | null> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    const snap = await getDoc(taskRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Task;
}

// Subscribe to tasks by scope and key
export function subscribeTasks(
    userId: string,
    scope: TaskScope,
    scopeKey: string,
    callback: (tasks: Task[]) => void
): () => void {
    const q = query(
        tasksCollection(userId),
        where('scope', '==', scope),
        where('scopeKey', '==', scopeKey),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        })) as Task[];
        callback(tasks);
    });
}

// Subscribe to tasks for time canvas (day scope with time slots)
export function subscribeTimedTasks(
    userId: string,
    dateKey: string,
    callback: (tasks: Task[]) => void
): () => void {
    const q = query(
        tasksCollection(userId),
        where('scope', '==', 'day'),
        where('scopeKey', '==', dateKey),
        orderBy('startTime', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        })) as Task[];
        callback(tasks);
    });
}

// Get all tasks that could be parents (higher scope tasks)
export async function getPotentialParentTasks(
    userId: string,
    currentScope: TaskScope
): Promise<Task[]> {
    // Map scope to parent scopes
    const parentScopes: Record<TaskScope, TaskScope[]> = {
        day: ['week', 'month', 'year'],
        week: ['month', 'year'],
        month: ['year'],
        year: [],
    };

    const scopes = parentScopes[currentScope];
    if (scopes.length === 0) return [];

    const tasks: Task[] = [];
    for (const scope of scopes) {
        const q = query(
            tasksCollection(userId),
            where('scope', '==', scope),
            where('status', 'in', ['pending', 'in-progress']),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        snap.docs.forEach((doc) => {
            tasks.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            } as Task);
        });
    }

    return tasks;
}

// Get child tasks of a parent
export async function getChildTasks(userId: string, parentTaskId: string): Promise<Task[]> {
    const q = query(
        tasksCollection(userId),
        where('parentTaskId', '==', parentTaskId),
        orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
    })) as Task[];
}

// Calculate and update parent task progress based on children
export async function updateParentProgress(userId: string, parentTaskId: string): Promise<void> {
    const children = await getChildTasks(userId, parentTaskId);
    if (children.length === 0) return;

    // Calculate weighted progress
    let totalWeight = 0;
    let weightedProgress = 0;

    for (const child of children) {
        const weight = child.contributionPercent || (100 / children.length);
        totalWeight += weight;
        weightedProgress += (child.progress / 100) * weight;
    }

    const progress = Math.round((weightedProgress / totalWeight) * 100);

    await updateTask(userId, parentTaskId, { progress });
}
