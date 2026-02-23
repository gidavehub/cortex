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

// ─── Helpers ─────────────────────────────────────────────────────────

const outreachCollection = (userId: string) => collection(db, 'users', userId, 'outreach_contacts');
const hackathonsCollection = (userId: string) => collection(db, 'users', userId, 'hackathons');

/**
 * Removes undefined fields from an object to prevent Firestore errors.
 * Firestore does not accept 'undefined' but accepts 'null' or omitted keys.
 */
function sanitizeData(data: any) {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === undefined) {
            delete sanitized[key];
        }
    });
    return sanitized;
}

// ─── Outreach Contacts ───────────────────────────────────────────────

export async function createOutreachContact(userId: string, input: CreateOutreachInput): Promise<string> {
    const contactData: any = sanitizeData({
        ...input,
        status: input.status || 'contacted',
        pipelineStage: input.pipelineStage || 'new',
        activityLog: input.activityLog || [],
        followUpDone: false,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    // Convert Date fields to Timestamps
    if (input.followUpDate) {
        contactData.followUpDate = Timestamp.fromDate(input.followUpDate);
    }
    if (input.meetingDate) {
        contactData.meetingDate = Timestamp.fromDate(input.meetingDate);
    }

    const docRef = await addDoc(outreachCollection(userId), contactData);
    return docRef.id;
}

// Append an activity log entry to a contact
export async function addActivityLogEntry(
    userId: string,
    contactId: string,
    note: string
): Promise<void> {
    const contactRef = doc(db, 'users', userId, 'outreach_contacts', contactId);
    const snap = await getDoc(contactRef);
    if (!snap.exists()) return;
    const existing = snap.data().activityLog || [];
    existing.push({ date: new Date().toISOString(), note });
    await updateDoc(contactRef, { activityLog: existing, updatedAt: Timestamp.now() });
}

// Convert a closed-won outreach contact into a client
export async function convertToClient(
    userId: string,
    contactId: string
): Promise<string> {
    const contactRef = doc(db, 'users', userId, 'outreach_contacts', contactId);
    const snap = await getDoc(contactRef);
    if (!snap.exists()) throw new Error('Outreach contact not found');
    const data = snap.data();

    // Build client data from outreach contact
    const clientData = sanitizeData({
        name: data.contactPerson || data.businessName,
        email: data.email || '',
        phone: data.phone,
        company: data.businessName,
        address: data.address,
        website: data.website,
        status: 'Active',
        tags: [data.category, data.program].filter(Boolean),
        totalRevenue: 0,
        notes: data.notes,
        sourceOutreachId: contactId,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    const clientsCol = collection(db, 'users', userId, 'clients');
    const clientRef = await addDoc(clientsCol, clientData);

    // Mark outreach contact as converted
    await updateDoc(contactRef, {
        status: 'converted',
        pipelineStage: 'closed_won',
        updatedAt: Timestamp.now(),
    });

    return clientRef.id;
}

export async function updateOutreachContact(
    userId: string,
    contactId: string,
    updates: Partial<OutreachContact>
): Promise<void> {
    const contactRef = doc(db, 'users', userId, 'outreach_contacts', contactId);
    const updateData: any = sanitizeData({
        ...updates,
        updatedAt: Timestamp.now(),
    });

    // Convert Date fields to Timestamps
    if (updates.followUpDate) {
        updateData.followUpDate = Timestamp.fromDate(updates.followUpDate);
    }
    if (updates.meetingDate) {
        updateData.meetingDate = Timestamp.fromDate(updates.meetingDate);
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
        meetingDate: snap.data().meetingDate?.toDate(),
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
            meetingDate: doc.data().meetingDate?.toDate(),
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
            meetingDate: doc.data().meetingDate?.toDate(),
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
            meetingDate: doc.data().meetingDate?.toDate(),
        })) as OutreachContact[];
        // Filter for contacts that have a followUpDate
        callback(contacts.filter(c => c.followUpDate));
    });
}

// Subscribe to contacts with meetings scheduled
export function subscribeMeetings(
    userId: string,
    callback: (contacts: OutreachContact[]) => void
): () => void {
    const q = query(
        outreachCollection(userId),
        orderBy('meetingDate', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const contacts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            followUpDate: doc.data().followUpDate?.toDate(),
            meetingDate: doc.data().meetingDate?.toDate(),
        })) as OutreachContact[];
        callback(contacts.filter(c => c.meetingDate));
    });
}

// ─── Hackathons ──────────────────────────────────────────────────────

export async function createHackathon(userId: string, input: CreateHackathonInput): Promise<string> {
    const hackathonData: any = sanitizeData({
        ...input,
        status: input.status || 'planned',
        ideas: input.ideas || [],
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

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
    const updateData: any = sanitizeData({
        ...updates,
        updatedAt: Timestamp.now(),
    });

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
