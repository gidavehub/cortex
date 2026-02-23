
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
import { Client, CreateClientInput } from './types/client';

export * from './types/client';

// Collection reference helper
const clientsCollection = (userId: string) => collection(db, 'users', userId, 'clients');

// Create a new client
export async function createClient(userId: string, input: CreateClientInput): Promise<string> {
    const clientData = {
        ...input,
        totalRevenue: 0,
        tags: input.tags || [],
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(clientsCollection(userId), clientData);
    return docRef.id;
}

// Update a client
export async function updateClient(
    userId: string,
    clientId: string,
    updates: Partial<Client>
): Promise<void> {
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    await updateDoc(clientRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

// Delete a client
export async function deleteClient(userId: string, clientId: string): Promise<void> {
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    await deleteDoc(clientRef);
}

// Get a single client
export async function getClient(userId: string, clientId: string): Promise<Client | null> {
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    const snap = await getDoc(clientRef);
    if (!snap.exists()) return null;
    return {
        id: snap.id,
        ...snap.data(),
        createdAt: snap.data().createdAt?.toDate(),
        updatedAt: snap.data().updatedAt?.toDate(),
    } as Client;
}

// Subscribe to all clients
export function subscribeClients(
    userId: string,
    callback: (clients: Client[]) => void
): () => void {
    const q = query(
        clientsCollection(userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const clients = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        })) as Client[];
        callback(clients);
    });
}
