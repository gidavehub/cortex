// Marketing Outreach Types for Cortex

export type OutreachProgram = 'nova' | 'amaka_ai';
export type OutreachChannel = 'cold_call' | 'cold_email' | 'walk_in' | 'whatsapp' | 'email' | 'fund_application' | 'other';
export type OutreachStatus = 'contacted' | 'follow_up' | 'responded' | 'converted' | 'no_response';
export type BusinessCategory =
    | 'law_firm'
    | 'hotel'
    | 'fintech'
    | 'retail'
    | 'wholesale'
    | 'restaurant'
    | 'healthcare'
    | 'education'
    | 'technology'
    | 'real_estate'
    | 'logistics'
    | 'manufacturing'
    | 'other';

export interface OutreachContact {
    id: string;
    userId: string;
    program: OutreachProgram;

    // Business/Organization info
    businessName: string;
    contactPerson?: string;
    category: BusinessCategory;

    // Channel & Contact Details
    channel: OutreachChannel;
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: string;
    website?: string;

    // Status & Follow-up
    status: OutreachStatus;
    notes?: string;
    followUpDate?: Date;
    followUpDone: boolean;

    // Date tracking
    date: string; // "2026-02-23" — the day the outreach was made
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOutreachInput {
    program: OutreachProgram;
    businessName: string;
    contactPerson?: string;
    category: BusinessCategory;
    channel: OutreachChannel;
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: string;
    website?: string;
    status?: OutreachStatus;
    notes?: string;
    followUpDate?: Date;
    date: string;
}

export interface Hackathon {
    id: string;
    userId: string;
    name: string;
    platform?: string;
    startDate?: Date;
    endDate?: Date;
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    ideas: string[];
    notes?: string;
    reminderDate?: Date;
    url?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateHackathonInput {
    name: string;
    platform?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    ideas?: string[];
    notes?: string;
    reminderDate?: Date;
    url?: string;
}

// Daily target configuration
export const OUTREACH_TARGETS = {
    nova: { daily: 20, label: 'Nova', fullName: 'Nexus for Operational & Visual Automation' },
    amaka_ai: { daily: 10, label: 'Amaka AI', fullName: 'Amaka AI Fund Applications' },
} as const;

// Channel display config
export const CHANNEL_CONFIG: Record<OutreachChannel, { label: string; color: string; bgColor: string }> = {
    cold_call: { label: 'Cold Call', color: '#3B82F6', bgColor: '#EFF6FF' },
    cold_email: { label: 'Cold Email', color: '#8B5CF6', bgColor: '#F5F3FF' },
    walk_in: { label: 'Walk-in', color: '#10B981', bgColor: '#ECFDF5' },
    whatsapp: { label: 'WhatsApp', color: '#25D366', bgColor: '#F0FDF4' },
    email: { label: 'Email', color: '#6366F1', bgColor: '#EEF2FF' },
    fund_application: { label: 'Fund Application', color: '#F59E0B', bgColor: '#FFFBEB' },
    other: { label: 'Other', color: '#64748B', bgColor: '#F8FAFC' },
};

// Category display config
export const CATEGORY_CONFIG: Record<BusinessCategory, { label: string }> = {
    law_firm: { label: 'Law Firm' },
    hotel: { label: 'Hotel' },
    fintech: { label: 'Fintech' },
    retail: { label: 'Retail' },
    wholesale: { label: 'Wholesale' },
    restaurant: { label: 'Restaurant' },
    healthcare: { label: 'Healthcare' },
    education: { label: 'Education' },
    technology: { label: 'Technology' },
    real_estate: { label: 'Real Estate' },
    logistics: { label: 'Logistics' },
    manufacturing: { label: 'Manufacturing' },
    other: { label: 'Other' },
};

// Status display config
export const STATUS_CONFIG: Record<OutreachStatus, { label: string; color: string; bgColor: string }> = {
    contacted: { label: 'Contacted', color: '#3B82F6', bgColor: '#EFF6FF' },
    follow_up: { label: 'Follow Up', color: '#F59E0B', bgColor: '#FFFBEB' },
    responded: { label: 'Responded', color: '#10B981', bgColor: '#ECFDF5' },
    converted: { label: 'Converted', color: '#059669', bgColor: '#D1FAE5' },
    no_response: { label: 'No Response', color: '#94A3B8', bgColor: '#F1F5F9' },
};
