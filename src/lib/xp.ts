import { Tier, TIERS } from './constants';

/** Calculate level from total XP (1-100) */
export function calculateLevel(totalXP: number): number {
  return Math.min(100, Math.max(1, Math.floor(Math.sqrt(totalXP / 20)) + 1));
}

/** Derive tier from total XP */
export function calculateTier(totalXP: number): Tier {
  if (totalXP >= 15000) return 'untamed';
  if (totalXP >= 2000) return 'forged';
  return 'raw';
}

/** Get XP needed for next level */
export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 20;
}

/** Get XP progress within current level (0-1) */
export function levelProgress(totalXP: number): number {
  const level = calculateLevel(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const range = nextLevelXP - currentLevelXP;
  if (range <= 0) return 1;
  return Math.min(1, (totalXP - currentLevelXP) / range);
}

/** Get tier config from tier name */
export function getTierConfig(tier: Tier) {
  return TIERS[tier];
}
