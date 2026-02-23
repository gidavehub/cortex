
import { Timestamp } from 'firebase/firestore';
import { LucideIcon } from 'lucide-react';

export type ClientStatus = 'Leads' | 'Active' | 'Inactive' | 'Archived';

export interface Client {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    status: ClientStatus;
    tags: string[];
    totalRevenue: number;
    notes?: string;
    website?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateClientInput {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    status: ClientStatus;
    tags?: string[];
    website?: string;
    notes?: string;
}

export interface ClientProject {
    id: string;
    clientId: string;
    userId: string;
    name: string;
    description?: string;
    status: 'Planned' | 'In Progress' | 'Completed' | 'On Hold';
    budget: number;
    deadline?: Date;
    createdAt?: Date;
}

export interface ClientContract {
    id: string;
    clientId: string;
    userId: string;
    title: string;
    status: 'Draft' | 'Sent' | 'Signed' | 'Expired';
    value: number;
    startDate?: Date;
    endDate?: Date;
    pdfUrl?: string; // For later
    createdAt?: Date;
}

export interface ClientDeals {
    id: string;
    clientId: string;
    userId: string;
    title: string;
    status: 'Draft' | 'Sent' | 'Signed' | 'Expired';
    value: number;
    startDate?: Date;
    endDate?: Date;
    createdAt?: Date;
}
