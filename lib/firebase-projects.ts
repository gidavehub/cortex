
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
    getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { ClientProject } from './types/client';

// Collection: users/{userId}/projects
const projectsCollection = (userId: string) => collection(db, 'users', userId, 'projects');

export interface CreateProjectInput {
    clientId: string;
    name: string;
    description?: string;
    status: 'Planned' | 'In Progress' | 'Completed' | 'On Hold';
    budget: number;
    deadline?: Date;
}

// Create
export async function createProject(userId: string, input: CreateProjectInput): Promise<string> {
    const data = {
        ...input,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(projectsCollection(userId), data);
    return docRef.id;
}

// Update
export async function updateProject(userId: string, projectId: string, updates: Partial<ClientProject>): Promise<void> {
    const ref = doc(db, 'users', userId, 'projects', projectId);
    await updateDoc(ref, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

// Delete
export async function deleteProject(userId: string, projectId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(ref);
}

// Subscribe to Client Projects
export function subscribeClientProjects(
    userId: string,
    clientId: string,
    callback: (projects: ClientProject[]) => void
): () => void {
    const q = query(
        projectsCollection(userId),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            deadline: doc.data().deadline?.toDate(),
        } as unknown as ClientProject));
        callback(projects);
    });
}
