// Beast Tribe — Design System Constants

// Dark theme (default)
export const DARK_COLORS = {
  teal: '#023C3C',
  tealLight: '#034E4E',
  orange: '#E88F24',
  aqua: '#56C4C4',
  dark: '#011E1E',
  background: '#012A2A',
  gray: '#F2F0EE',
  coral: '#EF8C86',
  green: '#62B797',
  blueGray: '#759CA9',
  white: '#FFFFFF',
  cardBg: 'rgba(255,255,255,0.07)',
  cardBorder: 'rgba(86,196,196,0.18)',
  inputBg: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(86,196,196,0.22)',
  statCardBg: 'rgba(86,196,196,0.08)',
  statCardBorder: 'rgba(86,196,196,0.25)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textTertiary: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.3)',
  tabBarBg: '#011E1E',
  tabBarBorder: 'rgba(86,196,196,0.12)',
  tabInactive: 'rgba(255,255,255,0.2)',
} as const;

// Light theme — maximum contrast, fully readable
export const LIGHT_COLORS = {
  teal: '#023C3C',
  tealLight: '#034E4E',
  orange: '#C06A00',            // Deep amber — strong on white
  aqua: '#1A7A7A',              // Deep teal — high contrast
  dark: '#111111',
  background: '#F2F0ED',
  gray: '#E8E5E1',
  coral: '#C44840',
  green: '#2D7558',
  blueGray: '#4A6A78',
  white: '#FFFFFF',             // Always actual white — used on dark/colored backgrounds
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.12)',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(0,0,0,0.20)',
  statCardBg: '#FFFFFF',
  statCardBorder: 'rgba(0,0,0,0.10)',
  textPrimary: '#111111',
  textSecondary: '#333333',
  textTertiary: '#555555',
  textMuted: '#777777',
  tabBarBg: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.12)',
  tabInactive: '#666666',
} as const;

// Read theme at module load — BEFORE any StyleSheet.create() uses COLORS
function _getInitialTheme(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('beast_tribe_theme') !== 'light';
    }
  } catch {}
  return true;
}

// Initialize COLORS with the correct theme immediately
export let COLORS = { ...(_getInitialTheme() ? DARK_COLORS : LIGHT_COLORS) };

/** Called by ThemeProvider to switch theme globally */
export function setThemeColors(isDark: boolean) {
  const newColors = isDark ? DARK_COLORS : LIGHT_COLORS;
  Object.assign(COLORS, newColors);
}

// Operation levels — Beast Tribe gamification system
export type Tier = 'initiate' | 'vanguard' | 'apex' | 'prime' | 'beast';

export const TIERS: Record<Tier, {
  label: string;         // "Operation: Beast"
  shortLabel: string;   // "Beast" — for compact display
  xpRange: [number, number];
  color: string;
  bgColor: string;
  borderColor?: string;
  tagline: string;
}> = {
  initiate: {
    label: 'Operation: Initiate',
    shortLabel: 'Initiate',
    xpRange: [0, 999],
    color: '#56C4C4',
    bgColor: 'rgba(86,196,196,0.12)',
    tagline: 'Your operation has begun',
  },
  vanguard: {
    label: 'Operation: Vanguard',
    shortLabel: 'Vanguard',
    xpRange: [1000, 4999],
    color: '#4A9EE0',
    bgColor: 'rgba(74,158,224,0.14)',
    tagline: 'Leading the charge',
  },
  apex: {
    label: 'Operation: Apex',
    shortLabel: 'Apex',
    xpRange: [5000, 14999],
    color: '#E88F24',
    bgColor: 'rgba(232,143,36,0.15)',
    tagline: 'Peak performance unlocked',
  },
  prime: {
    label: 'Operation: Prime',
    shortLabel: 'Prime',
    xpRange: [15000, 39999],
    color: '#EF8C86',
    bgColor: 'rgba(239,140,134,0.14)',
    borderColor: 'rgba(239,140,134,0.3)',
    tagline: 'Elite. Relentless. Prime.',
  },
  beast: {
    label: 'Operation: Beast',
    shortLabel: 'Beast',
    xpRange: [40000, Infinity],
    color: '#FFD700',
    bgColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.35)',
    tagline: 'Nothing holds you back',
  },
} as const;

export const TIER_ORDER: Tier[] = ['initiate', 'vanguard', 'apex', 'prime', 'beast'];

export const XP_REWARDS = {
  workout: { min: 100, max: 300 },
  streak: 50,            // per day streak bonus
  personalRecord: 200,   // beating a PR
  postWorkout: 75,       // posting a workout to feed
  giveBeast: 10,         // giving a beast reaction
  mealLog: 50,
  dailySteps: 120,
  quest: { min: 200, max: 500 },
  packChallengeWin: 1000,
  beastRoarWinner: 500,
  perfectDay: 100,
} as const;

// Habit definitions — local fallback for demo mode
export const HABIT_DEFINITIONS = [
  { key: 'train_weekly', label: 'Train', description: 'Complete workouts each week', icon: 'barbell-outline', category: 'workout', frequency_type: 'weekly' as const, default_target: 4, target_unit: 'days', sort_order: 1 },
  { key: 'log_meals', label: 'Log Meals', description: 'Track your nutrition daily', icon: 'restaurant-outline', category: 'nutrition', frequency_type: 'daily' as const, default_target: 3, target_unit: 'meals', sort_order: 2 },
  { key: 'hit_steps', label: 'Hit 10K Steps', description: 'Reach your daily step goal', icon: 'walk-outline', category: 'movement', frequency_type: 'daily' as const, default_target: 10000, target_unit: 'steps', sort_order: 3 },
  { key: 'drink_water', label: 'Drink Water', description: 'Stay hydrated throughout the day', icon: 'water-outline', category: 'nutrition', frequency_type: 'daily' as const, default_target: 3, target_unit: 'liters', sort_order: 4 },
  { key: 'attend_event', label: 'Attend Events', description: 'Join community events', icon: 'calendar-outline', category: 'social', frequency_type: 'monthly' as const, default_target: 1, target_unit: 'events', sort_order: 5 },
] as const;

export const HABIT_COLORS: Record<string, string> = {
  workout: '#E88F24',
  nutrition: '#62B797',
  movement: '#56C4C4',
  social: '#4A9EE0',
  general: '#759CA9',
};

export const FONTS = {
  heading: 'Montserrat-Bold',
  subheading: 'Montserrat-SemiBold',
  body: 'Poppins-Regular',
  bodyMedium: 'Poppins-Medium',
  bodySemiBold: 'Poppins-SemiBold',
  bodyBold: 'Poppins-Bold',
  light: 'Montserrat-Light',
  display: 'SlamDunk',
} as const;

export const SPORTS = [
  // Core fitness
  { id: 'running', name: 'Running', icon: 'walk-outline', emoji: '🏃', category: 'cardio' },
  { id: 'gym', name: 'Gym', icon: 'barbell-outline', emoji: '🏋', category: 'strength' },
  { id: 'cycling', name: 'Cycling', icon: 'bicycle-outline', emoji: '🚴', category: 'cardio' },
  { id: 'crossfit', name: 'CrossFit', icon: 'fitness-outline', emoji: '🤸', category: 'strength' },
  { id: 'swimming', name: 'Swimming', icon: 'water-outline', emoji: '🏊', category: 'water' },
  { id: 'hyrox', name: 'Hyrox', icon: 'flash-outline', emoji: '💪', category: 'strength' },
  { id: 'yoga', name: 'Yoga', icon: 'body-outline', emoji: '🧘', category: 'flexibility' },
  { id: 'pilates', name: 'Pilates', icon: 'pulse-outline', emoji: '🎯', category: 'flexibility' },
  { id: 'walking', name: 'Walking', icon: 'footsteps-outline', emoji: '🚶', category: 'cardio' },
  // Ball sports
  { id: 'football', name: 'Football', icon: 'football-outline', emoji: '⚽', category: 'team' },
  { id: 'basketball', name: 'Basketball', icon: 'basketball-outline', emoji: '🏀', category: 'team' },
  { id: 'tennis', name: 'Tennis', icon: 'tennisball-outline', emoji: '🎾', category: 'racket' },
  { id: 'padel', name: 'Padel', icon: 'grid-outline', emoji: '🏓', category: 'racket' },
  { id: 'pickleball', name: 'Pickleball', icon: 'disc-outline', emoji: '🏸', category: 'racket' },
  { id: 'badminton', name: 'Badminton', icon: 'swap-vertical-outline', emoji: '🏸', category: 'racket' },
  { id: 'volleyball', name: 'Volleyball', icon: 'basketball-outline', emoji: '🏐', category: 'team' },
  // Combat & outdoor
  { id: 'boxing', name: 'Boxing', icon: 'hand-left-outline', emoji: '🥊', category: 'combat' },
  { id: 'mma', name: 'MMA', icon: 'shield-outline', emoji: '🥋', category: 'combat' },
  { id: 'hiking', name: 'Hiking', icon: 'trail-sign-outline', emoji: '🥾', category: 'outdoor' },
  { id: 'climbing', name: 'Climbing', icon: 'trending-up-outline', emoji: '🧗', category: 'outdoor' },
  { id: 'skateboarding', name: 'Skate', icon: 'boat-outline', emoji: '🛹', category: 'outdoor' },
  { id: 'meditation', name: 'Meditation', icon: 'leaf-outline', emoji: '🧘‍♂️', category: 'mindfulness' },
] as const;

// Goal templates per sport (fallback for demo mode)
export const GOAL_TEMPLATES: Record<string, Array<{ title: string; difficulty: string; months: number }>> = {
  running: [
    { title: 'Run a sub-30 min 5K', difficulty: 'beginner', months: 3 },
    { title: 'Run a sub-25 min 5K', difficulty: 'intermediate', months: 4 },
    { title: 'Complete a 10K race', difficulty: 'intermediate', months: 5 },
  ],
  gym: [
    { title: 'Bench press 80 kg', difficulty: 'beginner', months: 3 },
    { title: 'Bench press 100 kg', difficulty: 'intermediate', months: 5 },
    { title: 'Deadlift 150 kg', difficulty: 'intermediate', months: 4 },
  ],
  cycling: [
    { title: 'Complete a 25 km ride', difficulty: 'beginner', months: 2 },
    { title: 'Complete a 50 km ride', difficulty: 'intermediate', months: 4 },
    { title: 'Average 30 km/h on 20 km', difficulty: 'advanced', months: 5 },
  ],
  crossfit: [
    { title: 'Complete 30 WODs', difficulty: 'beginner', months: 3 },
    { title: 'Achieve a muscle-up', difficulty: 'intermediate', months: 4 },
  ],
  swimming: [
    { title: 'Swim 1 km non-stop', difficulty: 'beginner', months: 3 },
    { title: 'Swim 2 km in under 45 min', difficulty: 'intermediate', months: 4 },
  ],
  hyrox: [
    { title: 'Finish a Hyrox race', difficulty: 'intermediate', months: 4 },
    { title: 'Finish Hyrox under 90 min', difficulty: 'advanced', months: 6 },
  ],
  yoga: [
    { title: 'Practice yoga 3x/week for a month', difficulty: 'beginner', months: 1 },
    { title: 'Hold a headstand for 30 seconds', difficulty: 'intermediate', months: 3 },
  ],
  pilates: [
    { title: 'Practice Pilates 3x/week for a month', difficulty: 'beginner', months: 1 },
    { title: 'Complete 50 Pilates sessions', difficulty: 'intermediate', months: 4 },
  ],
  walking: [
    { title: 'Walk 10K steps daily for 30 days', difficulty: 'beginner', months: 1 },
    { title: 'Walk 300 km total', difficulty: 'intermediate', months: 3 },
  ],
};

export const PACK_ANIMALS = ['wolf', 'eagle', 'tiger', 'rhino'] as const;
export type PackAnimal = (typeof PACK_ANIMALS)[number];
