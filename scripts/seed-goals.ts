/**
 * Comprehensive Task & Conditionals Seed Script for Cortex
 * 
 * This script populates the Firebase database with:
 * - Monthly goals (February 2026)
 * - Weekly goals (Week of Feb 2-8, 2026)
 * - Daily tasks (Feb 2-4, 2026)
 * - Conditionals (uncertain events that tasks depend on)
 * - Parent-child relationships
 * - Conditional dependencies
 * 
 * Run with: npx tsx scripts/seed-goals.ts
 */

import { config } from 'dotenv';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

// Load environment variables from .env.local
config({ path: '.env.local' });

// Firebase Config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Types for our seed data
interface SeedTask {
    id?: string;  // Reference key for linking
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    scope: 'day' | 'week' | 'month' | 'year';
    scopeKey: string;
    startTime?: string;
    endTime?: string;
    color?: string;
    parentRef?: string;  // Reference key to link after creation
    contributionPercent?: number;
    deadline?: Date;
    status?: 'pending' | 'in-progress' | 'done' | 'blocked';
    blockedByConditionalRef?: string; // Reference to conditional blocking this task
    content?: {
        checklist?: Array<{ id: string; text: string; done: boolean }>;
        links?: Array<{ label: string; url: string; type?: string }>;
    };
}

interface SeedConditional {
    id?: string;
    title: string;
    description?: string;
    expectedDate: Date;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    outcomes: Array<{
        id: string;
        label: string;
        type: 'success' | 'delayed' | 'failed';
        action: 'activate' | 'postpone' | 'switch_fallback';
        postponeDays?: number;
    }>;
    fallbackConditionalRef?: string;
    fallbackPostponeDays?: number;
    color?: string;
}

// Reference maps for linking
const taskRefs: Record<string, string> = {};
const conditionalRefs: Record<string, string> = {};

// ============================================================================
// COLORS
// ============================================================================
const COLORS = {
    AMAKA: '#8B5CF6',      // Purple - Amaka AI
    TAF: '#F59E0B',        // Amber - TAF Contract
    NOVA: '#10B981',       // Green - Nova Program
    FUNDING: '#3B82F6',    // Blue - Funding/Money
    PERSONAL: '#EC4899',   // Pink - Personal/Self-care
    MEETING: '#06B6D4',    // Cyan - Meetings
};

// ============================================================================
// CONDITIONALS (Uncertain events that tasks depend on)
// ============================================================================
const conditionals: SeedConditional[] = [
    {
        id: 'cond-colley-money',
        title: 'Money from Mr. Colley',
        description: 'Meeting with Mr. Colley on Feb 3, 2026 at 9:30 AM. Expected outcome: GMD 3,000 for printing materials, self-care, and proposal submission.',
        expectedDate: new Date('2026-02-03'),
        urgency: 'critical',
        outcomes: [
            {
                id: 'out-money-received',
                label: 'Money Received',
                type: 'success',
                action: 'activate',
            },
            {
                id: 'out-money-delayed',
                label: 'Payment Delayed',
                type: 'delayed',
                action: 'postpone',
                postponeDays: 2,
            },
            {
                id: 'out-money-failed',
                label: 'Meeting Cancelled',
                type: 'failed',
                action: 'switch_fallback',
            },
        ],
        fallbackConditionalRef: 'cond-alex-money',
        color: COLORS.FUNDING,
    },
    {
        id: 'cond-alex-money',
        title: 'Money from Alex',
        description: 'Fallback funding source. Ask Alex for advance payment or loan if Mr. Colley falls through.',
        expectedDate: new Date('2026-02-04'),
        urgency: 'high',
        outcomes: [
            {
                id: 'out-alex-success',
                label: 'Got Funding from Alex',
                type: 'success',
                action: 'activate',
            },
            {
                id: 'out-alex-no',
                label: 'Alex Cannot Help',
                type: 'failed',
                action: 'postpone',
                postponeDays: 7,
            },
        ],
        fallbackPostponeDays: 7,
        color: COLORS.FUNDING,
    },
    {
        id: 'cond-billing-account',
        title: 'Billing Account from Alex Team',
        description: 'Get Google Cloud billing account access and API credentials from Alex\'s team. This will restore Amaka AI site functionality.',
        expectedDate: new Date('2026-02-02'),
        urgency: 'critical',
        outcomes: [
            {
                id: 'out-billing-success',
                label: 'Billing Account Restored',
                type: 'success',
                action: 'activate',
            },
            {
                id: 'out-billing-delayed',
                label: 'Delayed - Need More Time',
                type: 'delayed',
                action: 'postpone',
                postponeDays: 3,
            },
        ],
        fallbackPostponeDays: 7,
        color: COLORS.AMAKA,
    },
    {
        id: 'cond-domain',
        title: 'Domain Acquired for Amaka AI',
        description: 'Secure a proper domain name for Amaka AI platform with Alex\'s help.',
        expectedDate: new Date('2026-02-08'),
        urgency: 'medium',
        outcomes: [
            {
                id: 'out-domain-success',
                label: 'Domain Acquired',
                type: 'success',
                action: 'activate',
            },
            {
                id: 'out-domain-temp',
                label: 'Use Temporary Domain',
                type: 'delayed',
                action: 'activate', // Still activates but with temp domain
            },
        ],
        color: COLORS.AMAKA,
    },
];

// ============================================================================
// MONTHLY GOALS (February 2026)
// ============================================================================
const monthlyGoals: SeedTask[] = [
    {
        id: 'month-amaka-launch',
        title: '🚀 Launch Amaka AI Publicly',
        description: `Launch Amaka AI for public use. Get people actually using the platform.
        
Key objectives:
- Get domain secured
- Get billing account from Alex's team
- Make platform stable and tested
- Pitch to schools and organizations
- Integrate into Alex's platform`,
        priority: 'critical',
        scope: 'month',
        scopeKey: '2026-02',
        color: COLORS.AMAKA,
        deadline: new Date('2026-02-28'),
        content: {
            checklist: [
                { id: 'c1', text: 'Secure domain name', done: false },
                { id: 'c2', text: 'Get billing account from Alex', done: false },
                { id: 'c3', text: 'Test all features thoroughly', done: false },
                { id: 'c4', text: 'Create pitch deck', done: true },
                { id: 'c5', text: 'Pitch to first 10 schools', done: false },
                { id: 'c6', text: 'Integrate into Alex platform', done: false },
                { id: 'c7', text: 'Reduce processing time', done: false },
                { id: 'c8', text: 'Start SVG alternative library', done: false },
            ]
        }
    },
    {
        id: 'month-taf-contract',
        title: '📄 Close TAF Contract',
        description: `Close the contract with TAF (The Africa Foundation).

Steps:
- Finish paper proposal
- Finish digital proposal  
- Create handcrafted folder for submission
- Submit to TAF office
- Book meeting with decision maker
- Negotiate and close`,
        priority: 'critical',
        scope: 'month',
        scopeKey: '2026-02',
        color: COLORS.TAF,
        deadline: new Date('2026-02-28'),
        content: {
            checklist: [
                { id: 't1', text: 'Complete paper proposal', done: false },
                { id: 't2', text: 'Complete digital proposal', done: true },
                { id: 't3', text: 'Create handcrafted submission folder', done: false },
                { id: 't4', text: 'Print all materials', done: false },
                { id: 't5', text: 'Find TAF office location', done: false },
                { id: 't6', text: 'Submit proposal', done: false },
                { id: 't7', text: 'Get meeting with decision maker', done: false },
                { id: 't8', text: 'Close the deal', done: false },
            ]
        }
    },
    {
        id: 'month-nova-clients',
        title: '💼 Nova Program - Acquire Paying Clients',
        description: `Use Nova Program to acquire paying clients across industries.

Target sectors:
- Healthcare/Medication
- Technology
- UN Agencies
- Large corporations

Strategy:
- Cold emails to decision makers
- Handcrafted proposals
- Pitch meetings`,
        priority: 'high',
        scope: 'month',
        scopeKey: '2026-02',
        color: COLORS.NOVA,
    },
    {
        id: 'month-funding',
        title: '💰 Secure Funding from Foundations',
        description: `Apply to foundations and funding organizations.

Activities:
- Research eligible foundations
- Write funding applications
- Send cold emails
- Follow up systematically
- Apply for grants`,
        priority: 'high',
        scope: 'month',
        scopeKey: '2026-02',
        color: COLORS.FUNDING,
    },
];

// ============================================================================
// WEEKLY GOALS (Week of Feb 2-8, 2026 - Week 06)
// ============================================================================
const weeklyGoals: SeedTask[] = [
    {
        id: 'week-taf-proposal',
        title: '📝 Finish & Send TAF Proposal',
        description: `Complete the TAF proposal package this week.

Deliverables:
- Paper proposal with key content
- QR code/link to digital proposal
- Handcrafted folder for submission`,
        priority: 'critical',
        scope: 'week',
        scopeKey: '2026-W06',
        parentRef: 'month-taf-contract',
        contributionPercent: 40,
        color: COLORS.TAF,
        deadline: new Date('2026-02-08'),
    },
    {
        id: 'week-billing-account',
        title: '🔑 Get Billing Account from Alex Team',
        description: `Coordinate with Alex's team to:
- Get their Google Cloud billing account access
- Get API credentials
- Restore Amaka AI site functionality`,
        priority: 'critical',
        scope: 'week',
        scopeKey: '2026-W06',
        parentRef: 'month-amaka-launch',
        contributionPercent: 25,
        color: COLORS.AMAKA,
    },
    {
        id: 'week-domain',
        title: '🌐 Secure Domain for Amaka AI',
        description: 'Work with Alex to get a proper domain name for Amaka AI platform.',
        priority: 'high',
        scope: 'week',
        scopeKey: '2026-W06',
        parentRef: 'month-amaka-launch',
        contributionPercent: 15,
        color: COLORS.AMAKA,
    },
    {
        id: 'week-colley-money',
        title: '💵 Get GMD 3,000 from Mr. Colley',
        description: `Tuesday Feb 3, 2026 at 9:30 AM

Expected outcome: GMD 3,000 for:
- Printing proposal materials
- Self-care (clothes, haircut)
- Handcrafted folder materials
- Basic living expenses`,
        priority: 'critical',
        scope: 'week',
        scopeKey: '2026-W06',
        parentRef: 'month-funding',
        contributionPercent: 30,
        color: COLORS.FUNDING,
    },
    {
        id: 'week-cold-emails',
        title: '📧 Cold Email Marathon - Foundations & Funders',
        description: `Send cold emails to:
- Foundations that fund tech startups
- Organizations that might sponsor Amaka AI
- Potential Nova Program clients
- UN agencies for agriculture tech

Goal: Numbers game - send as many quality emails as possible`,
        priority: 'high',
        scope: 'week',
        scopeKey: '2026-W06',
        parentRef: 'month-funding',
        contributionPercent: 40,
        color: COLORS.FUNDING,
    },
    {
        id: 'week-alex-integration',
        title: '🔧 Plan Integration with Alex Platform',
        description: `Meet with Alex's team (specifically Remy) to discuss:
- How Amaka AI integrates into their platform
- API requirements
- Testing process
- Timeline`,
        priority: 'medium',
        scope: 'week',
        scopeKey: '2026-W06',
        parentRef: 'month-amaka-launch',
        contributionPercent: 20,
        color: COLORS.AMAKA,
    },
];

// ============================================================================
// DAILY TASKS
// ============================================================================
const dailyTasks: SeedTask[] = [
    // ========== FEBRUARY 2, 2026 (TODAY - Sunday) ==========
    {
        id: 'day-feb2-alex-meeting',
        title: '🤝 Meeting with Alex Team (Billing Account)',
        description: `Meet with Alex's team around 10 AM - 3 PM

Agenda:
- Discuss billing account access
- Get API credentials
- Talk with Remy about integration
- Understand their testing requirements`,
        priority: 'critical',
        scope: 'day',
        scopeKey: '2026-02-02',
        startTime: '10:00',
        endTime: '15:00',
        parentRef: 'week-billing-account',
        contributionPercent: 80,
        color: COLORS.MEETING,
    },
    {
        id: 'day-feb2-funding-emails',
        title: '📧 Send Funding Emails - All Day Marathon',
        description: `Spend today sending cold emails to:
- Foundations
- Funding organizations  
- Potential investors
- Anyone who might fund Amaka AI or Nova

This is a numbers game - volume matters!`,
        priority: 'high',
        scope: 'day',
        scopeKey: '2026-02-02',
        startTime: '08:00',
        endTime: '21:00',
        parentRef: 'week-cold-emails',
        contributionPercent: 20,
        color: COLORS.FUNDING,
        content: {
            checklist: [
                { id: 'e1', text: 'Research 20 potential foundations', done: false },
                { id: 'e2', text: 'Write personalized email templates', done: false },
                { id: 'e3', text: 'Send to first 10 foundations', done: false },
                { id: 'e4', text: 'Send to second batch of 10', done: false },
                { id: 'e5', text: 'Track all sent emails in spreadsheet', done: false },
            ]
        }
    },
    {
        id: 'day-feb2-home-9pm',
        title: '🏠 Be Home by 9 PM',
        description: 'Need to be home at 9 o\'clock.',
        priority: 'medium',
        scope: 'day',
        scopeKey: '2026-02-02',
        startTime: '21:00',
        endTime: '21:30',
        color: COLORS.PERSONAL,
    },

    // ========== FEBRUARY 3, 2026 (Monday) ==========
    {
        id: 'day-feb3-colley-meeting',
        title: '💵 Meeting with Mr. Colley',
        description: `9:30 AM meeting with Mr. Colley

Expected outcome: GMD 3,000

Use funds for:
- Proposal printing
- Handcrafted folder materials
- Self-care (clothes, haircut)
- Reduced feeding habits`,
        priority: 'critical',
        scope: 'day',
        scopeKey: '2026-02-03',
        startTime: '09:30',
        endTime: '11:00',
        parentRef: 'week-colley-money',
        contributionPercent: 100,
        color: COLORS.MEETING,
    },
    {
        id: 'day-feb3-buy-materials',
        title: '🛍️ Buy Proposal Materials',
        description: `After getting money from Mr. Colley:

Shopping list:
- Quality paper for proposal
- Folder materials for handcrafted case
- Binding supplies
- Any presentation materials

Also self-care:
- Get proper clothes for client meetings
- Haircut`,
        priority: 'high',
        scope: 'day',
        scopeKey: '2026-02-03',
        startTime: '12:00',
        endTime: '16:00',
        color: COLORS.PERSONAL,
        blockedByConditionalRef: 'cond-colley-money',
        status: 'blocked',
    },
    {
        id: 'day-feb3-more-emails',
        title: '📧 Continue Cold Email Campaign',
        description: 'Continue sending funding applications and cold emails.',
        priority: 'medium',
        scope: 'day',
        scopeKey: '2026-02-03',
        startTime: '16:00',
        endTime: '21:00',
        parentRef: 'week-cold-emails',
        contributionPercent: 20,
        color: COLORS.FUNDING,
    },

    // ========== FEBRUARY 4, 2026 (Tuesday) ==========
    {
        id: 'day-feb4-print-proposal',
        title: '🖨️ Print TAF Proposal',
        description: `Print the full proposal package:
- Paper proposal (multiple copies)
- Include QR code to digital proposal
- Professional quality printing`,
        priority: 'critical',
        scope: 'day',
        scopeKey: '2026-02-04',
        startTime: '09:00',
        endTime: '12:00',
        parentRef: 'week-taf-proposal',
        contributionPercent: 30,
        color: COLORS.TAF,
        blockedByConditionalRef: 'cond-colley-money',
        status: 'blocked',
    },
    {
        id: 'day-feb4-handcraft-folder',
        title: '✂️ Create Handcrafted Proposal Folder',
        description: `Take time to create a premium, handcrafted folder for the TAF proposal.

This should look professional and unique - stand out from other proposals.`,
        priority: 'high',
        scope: 'day',
        scopeKey: '2026-02-04',
        startTime: '13:00',
        endTime: '17:00',
        parentRef: 'week-taf-proposal',
        contributionPercent: 20,
        color: COLORS.TAF,
        blockedByConditionalRef: 'cond-colley-money',
        status: 'blocked',
    },
    {
        id: 'day-feb4-find-taf-office',
        title: '📍 Research TAF Office Location',
        description: `Find where TAF office is located.
- Check online
- Ask contacts
- Plan route for submission`,
        priority: 'medium',
        scope: 'day',
        scopeKey: '2026-02-04',
        startTime: '17:00',
        endTime: '18:00',
        parentRef: 'week-taf-proposal',
        contributionPercent: 10,
        color: COLORS.TAF,
    },
    {
        id: 'day-feb4-cold-emails',
        title: '📧 Evening Email Session',
        description: 'Continue sending funding applications.',
        priority: 'medium',
        scope: 'day',
        scopeKey: '2026-02-04',
        startTime: '19:00',
        endTime: '22:00',
        parentRef: 'week-cold-emails',
        contributionPercent: 20,
        color: COLORS.FUNDING,
    },

    // ========== FEBRUARY 5, 2026 (Wednesday) ==========
    {
        id: 'day-feb5-submit-taf',
        title: '📬 Submit Proposal to TAF',
        description: `GO TO TAF OFFICE AND SUBMIT THE PROPOSAL!

Bring:
- Handcrafted folder with printed proposal
- Business cards
- Pitch deck (digital backup)

Goal: Get the proposal in their hands and request a meeting.`,
        priority: 'critical',
        scope: 'day',
        scopeKey: '2026-02-05',
        startTime: '10:00',
        endTime: '14:00',
        parentRef: 'week-taf-proposal',
        contributionPercent: 40,
        color: COLORS.TAF,
        blockedByConditionalRef: 'cond-colley-money',
        status: 'blocked',
    },

    // ========== FEBRUARY 6-8, 2026 (Thu-Sun) ==========
    {
        id: 'day-feb6-amaka-dev',
        title: '💻 Amaka AI Development',
        description: `Once billing account is restored:
- Test all features
- Reduce processing time
- Start SVG alternative library
- Prepare for integration`,
        priority: 'high',
        scope: 'day',
        scopeKey: '2026-02-06',
        startTime: '08:00',
        endTime: '20:00',
        parentRef: 'month-amaka-launch',
        contributionPercent: 10,
        color: COLORS.AMAKA,
        blockedByConditionalRef: 'cond-billing-account',
        status: 'blocked',
    },
    {
        id: 'day-feb7-school-pitches',
        title: '🏫 Plan School Pitch Tour',
        description: `Plan the school-to-school pitch tour for Amaka AI.

Tasks:
- List target schools
- Prepare pitch materials
- Schedule visits`,
        priority: 'medium',
        scope: 'day',
        scopeKey: '2026-02-07',
        startTime: '09:00',
        endTime: '17:00',
        parentRef: 'month-amaka-launch',
        contributionPercent: 10,
        color: COLORS.AMAKA,
    },
    {
        id: 'day-feb8-nova-outreach',
        title: '📞 Nova Program Outreach',
        description: `Reach out to potential Nova Program clients.

Industries to target:
- Healthcare/Medication
- Large corporations
- Tech companies`,
        priority: 'medium',
        scope: 'day',
        scopeKey: '2026-02-08',
        startTime: '09:00',
        endTime: '17:00',
        parentRef: 'month-nova-clients',
        contributionPercent: 20,
        color: COLORS.NOVA,
    },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================
async function seedGoals() {
    console.log("🌱 Starting Comprehensive Goal Seed...\n");
    console.log("📅 Date: February 2, 2026");
    console.log("📍 Current Week: Week 06 (Feb 2-8)\n");

    const userId = "admin";
    const tasksRef = collection(db, "users", userId, "tasks");
    const conditionalsRef = collection(db, "users", userId, "conditionals");

    try {
        // ====== PASS 0: Create Conditionals ======
        // First pass: create all conditionals without fallback links
        console.log("🔀 Creating CONDITIONALS...");
        for (const cond of conditionals) {
            const condData: Record<string, unknown> = {
                title: cond.title,
                description: cond.description || '',
                expectedDate: Timestamp.fromDate(cond.expectedDate),
                urgency: cond.urgency,
                status: 'pending',
                outcomes: cond.outcomes,
                userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            // Only add optional fields if they have values
            if (cond.color) condData.color = cond.color;
            if (cond.fallbackPostponeDays) condData.fallbackPostponeDays = cond.fallbackPostponeDays;

            const docRef = await addDoc(conditionalsRef, condData);
            if (cond.id) {
                conditionalRefs[cond.id] = docRef.id;
            }
            console.log(`   ✅ ${cond.title}`);
        }

        // ====== Helper to create task ======
        async function createTask(
            task: SeedTask,
            existingParentId?: string,
            blockedByConditionalId?: string
        ) {
            const taskData: Record<string, unknown> = {
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                scope: task.scope,
                scopeKey: task.scopeKey,
                status: task.status || 'pending',
                progress: 0,
                userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            // Optional fields
            if (task.startTime) taskData.startTime = task.startTime;
            if (task.endTime) taskData.endTime = task.endTime;
            if (task.color) taskData.color = task.color;
            if (task.deadline) taskData.deadline = Timestamp.fromDate(task.deadline);
            if (task.contributionPercent) taskData.contributionPercent = task.contributionPercent;
            if (task.content) taskData.content = task.content;

            // Parent reference
            if (existingParentId) {
                taskData.parentTaskId = existingParentId;
            }

            // Blocked by conditional
            if (blockedByConditionalId) {
                taskData.blockedByConditionalId = blockedByConditionalId;
                taskData.status = 'blocked';
            }

            const docRef = await addDoc(tasksRef, taskData);

            // Store reference for linking
            if (task.id) {
                taskRefs[task.id] = docRef.id;
            }

            return docRef.id;
        }

        // ====== PASS 1: Create monthly goals ======
        console.log("\n📆 Creating MONTHLY goals...");
        for (const task of monthlyGoals) {
            await createTask(task);
            console.log(`   ✅ ${task.title}`);
        }

        // ====== PASS 2: Create weekly goals with parent links ======
        console.log("\n📅 Creating WEEKLY goals...");
        for (const task of weeklyGoals) {
            const parentId = task.parentRef ? taskRefs[task.parentRef] : undefined;
            await createTask(task, parentId);
            console.log(`   ✅ ${task.title}${parentId ? ' (→ parent linked)' : ''}`);
        }

        // ====== PASS 3: Create daily tasks with parent and conditional links ======
        console.log("\n📋 Creating DAILY tasks...");
        for (const task of dailyTasks) {
            const parentId = task.parentRef ? taskRefs[task.parentRef] : undefined;
            const conditionalId = task.blockedByConditionalRef
                ? conditionalRefs[task.blockedByConditionalRef]
                : undefined;

            await createTask(task, parentId, conditionalId);

            const blockedNote = task.status === 'blocked' ? ' ⏸️' : '';
            console.log(`   ✅ [${task.scopeKey}] ${task.title}${blockedNote}`);
        }

        // ====== Summary ======
        console.log("\n" + "=".repeat(60));
        console.log("✨ SEED COMPLETE!");
        console.log("=".repeat(60));
        console.log(`🔀 Created ${conditionals.length} conditionals`);
        console.log(`📊 Created ${monthlyGoals.length} monthly goals`);
        console.log(`📊 Created ${weeklyGoals.length} weekly goals`);
        console.log(`📊 Created ${dailyTasks.length} daily tasks`);
        console.log(`📊 Total: ${monthlyGoals.length + weeklyGoals.length + dailyTasks.length} tasks`);
        console.log("\n🔑 Key Conditionals:");
        console.log("   💵 Money from Mr. Colley (Feb 3) - CRITICAL");
        console.log("   💵 Money from Alex (Feb 4) - fallback");
        console.log("   🔑 Billing Account from Alex (Feb 2) - CRITICAL");
        console.log("   🌐 Domain for Amaka AI (Feb 8)");
        console.log("\n🚀 Next Actions:");
        console.log("   1. Meet Alex team around 10 AM today");
        console.log("   2. Send cold emails all day");
        console.log("   3. Be home by 9 PM");
        console.log("\n💪 LET'S GET THIS MONEY! 💰");

    } catch (e) {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    }

    process.exit(0);
}

// Run
seedGoals();
