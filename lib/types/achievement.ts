// Achievement System for Cortex

export type AchievementTier = 'weekly' | 'monthly' | 'yearly';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;  // Emoji icon
    tier: AchievementTier;
    requirement: number;  // Target value to unlock
    rewardXP: number;
}

export interface UserAchievement {
    achievementId: string;
    unlockedAt: Date;
    periodKey: string;  // "2026-W05", "2026-02", "2026"
}

export interface AchievementProgress {
    achievementId: string;
    current: number;
    target: number;
    periodKey: string;
}

// Weekly Achievements (3)
export const WEEKLY_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'streak_starter',
        name: 'Streak Starter',
        description: 'Complete tasks 3+ days in a row',
        icon: '🔥',
        tier: 'weekly',
        requirement: 3,
        rewardXP: 50,
    },
    {
        id: 'productive_week',
        name: 'Productive Week',
        description: 'Complete 10+ tasks this week',
        icon: '⚡',
        tier: 'weekly',
        requirement: 10,
        rewardXP: 75,
    },
    {
        id: 'goal_crusher',
        name: 'Goal Crusher',
        description: 'Complete a week-level goal',
        icon: '🎯',
        tier: 'weekly',
        requirement: 1,
        rewardXP: 100,
    },
    {
        id: 'outreach_champion',
        name: 'Outreach Champion',
        description: 'Hit daily outreach target 5 days',
        icon: '📞',
        tier: 'weekly',
        requirement: 5,
        rewardXP: 75,
    },
];

// Monthly Achievements (5)
export const MONTHLY_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'consistent',
        name: 'Consistent',
        description: 'Complete tasks on 20+ days',
        icon: '🏆',
        tier: 'monthly',
        requirement: 20,
        rewardXP: 150,
    },
    {
        id: 'progress_master',
        name: 'Progress Master',
        description: 'All month goals at 50%+ progress',
        icon: '📈',
        tier: 'monthly',
        requirement: 50,
        rewardXP: 200,
    },
    {
        id: 'perfect_week',
        name: 'Perfect Week',
        description: '100% task completion in any week',
        icon: '🌟',
        tier: 'monthly',
        requirement: 100,
        rewardXP: 175,
    },
    {
        id: 'overachiever',
        name: 'Overachiever',
        description: 'Complete 50+ tasks this month',
        icon: '💎',
        tier: 'monthly',
        requirement: 50,
        rewardXP: 250,
    },
    {
        id: 'deadline_keeper',
        name: 'Deadline Keeper',
        description: 'Meet all deadlines this month',
        icon: '🔒',
        tier: 'monthly',
        requirement: 100, // percentage
        rewardXP: 200,
    },
    {
        id: 'networking_pro',
        name: 'Networking Pro',
        description: 'Log 100+ outreach contacts',
        icon: '🤝',
        tier: 'monthly',
        requirement: 100,
        rewardXP: 250,
    },
];

// Yearly Achievements (10)
export const YEARLY_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'year_champion',
        name: 'Year Champion',
        description: 'Complete a year-level goal',
        icon: '👑',
        tier: 'yearly',
        requirement: 1,
        rewardXP: 500,
    },
    {
        id: 'veteran',
        name: 'Veteran',
        description: 'Use the app for 365 days',
        icon: '🎖️',
        tier: 'yearly',
        requirement: 365,
        rewardXP: 1000,
    },
    {
        id: 'productivity_legend',
        name: 'Productivity Legend',
        description: 'Complete 500+ tasks',
        icon: '🚀',
        tier: 'yearly',
        requirement: 500,
        rewardXP: 750,
    },
    {
        id: 'monthly_maven',
        name: 'Monthly Maven',
        description: 'Earn all monthly achievements in one month',
        icon: '🏅',
        tier: 'yearly',
        requirement: 5,
        rewardXP: 400,
    },
    {
        id: 'century_club',
        name: 'Century Club',
        description: '100 days with completed tasks',
        icon: '💯',
        tier: 'yearly',
        requirement: 100,
        rewardXP: 300,
    },
    {
        id: 'diverse_achiever',
        name: 'Diverse Achiever',
        description: 'Complete tasks in all 4 scopes',
        icon: '🌈',
        tier: 'yearly',
        requirement: 4,
        rewardXP: 200,
    },
    {
        id: 'time_master',
        name: 'Time Master',
        description: 'Meet 50+ deadlines',
        icon: '⏰',
        tier: 'yearly',
        requirement: 50,
        rewardXP: 350,
    },
    {
        id: 'streak_legend',
        name: 'Streak Legend',
        description: 'Achieve a 30-day completion streak',
        icon: '🔥',
        tier: 'yearly',
        requirement: 30,
        rewardXP: 500,
    },
    {
        id: 'data_driven',
        name: 'Data Driven',
        description: '90%+ average progress on all goals',
        icon: '📊',
        tier: 'yearly',
        requirement: 90,
        rewardXP: 400,
    },
    {
        id: 'celebration',
        name: 'Celebration',
        description: 'Complete 12 month-level goals',
        icon: '🎉',
        tier: 'yearly',
        requirement: 12,
        rewardXP: 600,
    },
];

// All achievements combined
export const ALL_ACHIEVEMENTS = [
    ...WEEKLY_ACHIEVEMENTS,
    ...MONTHLY_ACHIEVEMENTS,
    ...YEARLY_ACHIEVEMENTS,
];

// Get achievement by ID
export function getAchievementById(id: string): Achievement | undefined {
    return ALL_ACHIEVEMENTS.find(a => a.id === id);
}

// Tier colors and labels
export const TIER_CONFIG = {
    weekly: { label: 'Weekly', color: '#CD7F32', bgGradient: 'from-amber-600 to-yellow-500' },
    monthly: { label: 'Monthly', color: '#C0C0C0', bgGradient: 'from-slate-400 to-gray-300' },
    yearly: { label: 'Yearly', color: '#FFD700', bgGradient: 'from-yellow-400 to-amber-300' },
};
