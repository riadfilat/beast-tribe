// Beast Tribe — Design System Constants

export const COLORS = {
  teal: '#023C3C',
  tealLight: '#034E4E',
  orange: '#E88F24',
  aqua: '#56C4C4',
  dark: '#011E1E',
  background: '#023C3C',
  gray: '#F2F0EE',
  coral: '#EF8C86',
  green: '#62B797',
  blueGray: '#759CA9',
  white: '#FFFFFF',

  // Semantic
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.08)',
  statCardBg: 'rgba(255,255,255,0.05)',
  statCardBorder: 'rgba(86,196,196,0.08)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.35)',
  textTertiary: 'rgba(255,255,255,0.2)',
  textMuted: 'rgba(255,255,255,0.1)',

  // Tab bar
  tabBarBg: 'rgba(1,20,20,0.85)',
  tabBarBorder: 'rgba(255,255,255,0.05)',
  tabInactive: 'rgba(255,255,255,0.2)',
} as const;

export type Tier = 'raw' | 'forged' | 'untamed';

export const TIERS: Record<Tier, {
  label: string;
  levels: [number, number];
  xpRange: [number, number];
  color: string;
  bgColor: string;
  borderColor?: string;
  tagline: string;
}> = {
  raw: {
    label: 'Raw',
    levels: [1, 10],
    xpRange: [0, 2000],
    color: '#56C4C4',
    bgColor: 'rgba(86,196,196,0.12)',
    tagline: 'Every beast starts somewhere',
  },
  forged: {
    label: 'Forged',
    levels: [11, 30],
    xpRange: [2000, 15000],
    color: '#E88F24',
    bgColor: 'rgba(232,143,36,0.15)',
    tagline: 'Shaped by discipline',
  },
  untamed: {
    label: 'Untamed',
    levels: [31, 100],
    xpRange: [15000, Infinity],
    color: '#FFD700',
    bgColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.3)',
    tagline: 'Nothing holds you back',
  },
} as const;

export const XP_REWARDS = {
  workout: { min: 100, max: 300 },
  mealLog: 50,
  dailySteps: 120,
  fiveBeasts: 30,
  quest: { min: 200, max: 500 },
  packChallengeWin: 1000,
  beastRoarWinner: 500,
} as const;

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
  { id: 'running', name: 'Running', emoji: '🏃', category: 'cardio' },
  { id: 'gym', name: 'Gym', emoji: '🏋', category: 'strength' },
  { id: 'cycling', name: 'Cycling', emoji: '🚴', category: 'cardio' },
  { id: 'crossfit', name: 'CrossFit', emoji: '🤸', category: 'strength' },
  { id: 'swimming', name: 'Swimming', emoji: '🏊', category: 'water' },
  { id: 'hyrox', name: 'Hyrox', emoji: '💪', category: 'strength' },
  { id: 'yoga', name: 'Yoga', emoji: '🧘', category: 'flexibility' },
  { id: 'pilates', name: 'Pilates', emoji: '🎯', category: 'flexibility' },
  { id: 'walking', name: 'Walking', emoji: '🚶', category: 'cardio' },
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
