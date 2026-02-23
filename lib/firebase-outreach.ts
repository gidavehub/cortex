// Firebase Outreach Operations for Cortex

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
import {
    OutreachContact,
    CreateOutreachInput,
    OutreachProgram,
    Hackathon,
    CreateHackathonInput,
} from './types/outreach';

export * from './types/outreach';

// Collection reference helpers
const outreachCollection = (userId: string) => collection(db, 'users', userId, 'outreach_contacts');
const hackathonsCollection = (userId: string) => collection(db, 'users', userId, 'hackathons');

// ─── Outreach Contacts ───────────────────────────────────────────────

export async function createOutreachContact(userId: string, input: CreateOutreachInput): Promise<string> {
    const contactData = {
        ...input,
        status: input.status || 'contacted',
        followUpDone: false,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    // Convert followUpDate to Timestamp if present
    if (input.followUpDate) {
        (contactData as any).followUpDate = Timestamp.fromDate(input.followUpDate);
    }

    const docRef = await addDoc(outreachCollection(userId), contactData);
    return docRef.id;
}

export async function updateOutreachContact(
    userId: string,
    contactId: string,
    updates: Partial<OutreachContact>
): Promise<void> {
    const contactRef = doc(db, 'users', userId, 'outreach_contacts', contactId);
    const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
    };

    // Convert Date fields to Timestamps
    if (updates.followUpDate) {
        updateData.followUpDate = Timestamp.fromDate(updates.followUpDate);
    }

    await updateDoc(contactRef, updateData);
}

export async function deleteOutreachContact(userId: string, contactId: string): Promise<void> {
    const contactRef = doc(db, 'users', userId, 'outreach_contacts', contactId);
    await deleteDoc(contactRef);
}

export async function getOutreachContact(userId: string, contactId: string): Promise<OutreachContact | null> {
    const contactRef = doc(db, 'users', userId, 'outreach_contacts', contactId);
    const snap = await getDoc(contactRef);
    if (!snap.exists()) return null;
    return {
        id: snap.id,
        ...snap.data(),
        createdAt: snap.data().createdAt?.toDate(),
        updatedAt: snap.data().updatedAt?.toDate(),
        followUpDate: snap.data().followUpDate?.toDate(),
    } as OutreachContact;
}

// Subscribe to outreach contacts by program
export function subscribeOutreachByProgram(
    userId: string,
    program: OutreachProgram,
    callback: (contacts: OutreachContact[]) => void
): () => void {
    const q = query(
        outreachCollection(userId),
        where('program', '==', program),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const contacts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            followUpDate: doc.data().followUpDate?.toDate(),
        })) as OutreachContact[];
        callback(contacts);
    });
}

// Subscribe to all outreach contacts
export function subscribeAllOutreach(
    userId: string,
    callback: (contacts: OutreachContact[]) => void
): () => void {
    const q = query(
        outreachCollection(userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const contacts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            followUpDate: doc.data().followUpDate?.toDate(),
        })) as OutreachContact[];
        callback(contacts);
    });
}

// Get outreach count for a specific date and program
export async function getOutreachCountForDate(
    userId: string,
    program: OutreachProgram,
    dateKey: string
): Promise<number> {
    const q = query(
        outreachCollection(userId),
        where('program', '==', program),
        where('date', '==', dateKey)
    );
    const snap = await getDocs(q);
    return snap.size;
}

// Subscribe to follow-ups due on or before a given date
export function subscribeFollowUps(
    userId: string,
    callback: (contacts: OutreachContact[]) => void
): () => void {
    const q = query(
        outreachCollection(userId),
        where('followUpDone', '==', false),
        orderBy('followUpDate', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const contacts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            followUpDate: doc.data().followUpDate?.toDate(),
        })) as OutreachContact[];
        // Filter for contacts that have a followUpDate
        callback(contacts.filter(c => c.followUpDate));
    });
}

// ─── Hackathons ──────────────────────────────────────────────────────

export async function createHackathon(userId: string, input: CreateHackathonInput): Promise<string> {
    const hackathonData: any = {
        ...input,
        status: input.status || 'planned',
        ideas: input.ideas || [],
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    // Convert Date fields
    if (input.startDate) hackathonData.startDate = Timestamp.fromDate(input.startDate);
    if (input.endDate) hackathonData.endDate = Timestamp.fromDate(input.endDate);
    if (input.reminderDate) hackathonData.reminderDate = Timestamp.fromDate(input.reminderDate);

    const docRef = await addDoc(hackathonsCollection(userId), hackathonData);
    return docRef.id;
}

export async function updateHackathon(
    userId: string,
    hackathonId: string,
    updates: Partial<Hackathon>
): Promise<void> {
    const hackRef = doc(db, 'users', userId, 'hackathons', hackathonId);
    const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
    };

    if (updates.startDate) updateData.startDate = Timestamp.fromDate(updates.startDate);
    if (updates.endDate) updateData.endDate = Timestamp.fromDate(updates.endDate);
    if (updates.reminderDate) updateData.reminderDate = Timestamp.fromDate(updates.reminderDate);

    await updateDoc(hackRef, updateData);
}

export async function deleteHackathon(userId: string, hackathonId: string): Promise<void> {
    const hackRef = doc(db, 'users', userId, 'hackathons', hackathonId);
    await deleteDoc(hackRef);
}

export function subscribeHackathons(
    userId: string,
    callback: (hackathons: Hackathon[]) => void
): () => void {
    const q = query(
        hackathonsCollection(userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const hackathons = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            startDate: doc.data().startDate?.toDate(),
            endDate: doc.data().endDate?.toDate(),
            reminderDate: doc.data().reminderDate?.toDate(),
        })) as Hackathon[];
        callback(hackathons);
    });
}
