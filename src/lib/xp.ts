import { Tier, TIERS, TIER_ORDER } from './constants';

/** Calculate level from total XP (1-100) */
export function calculateLevel(totalXP: number): number {
  return Math.min(100, Math.max(1, Math.floor(Math.sqrt(totalXP / 20)) + 1));
}

/** Derive operation tier from total XP */
export function calculateTier(totalXP: number): Tier {
  if (totalXP >= 40000) return 'beast';
  if (totalXP >= 15000) return 'prime';
  if (totalXP >= 5000) return 'apex';
  if (totalXP >= 1000) return 'vanguard';
  return 'initiate';
}

/** Get XP needed for a given level boundary */
export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 20;
}

/** Get XP progress within current level (0–1) */
export function levelProgress(totalXP: number): number {
  const level = calculateLevel(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const range = nextLevelXP - currentLevelXP;
  if (range <= 0) return 1;
  return Math.min(1, (totalXP - currentLevelXP) / range);
}

/** XP progress toward next operation tier (0–1) */
export function tierProgress(totalXP: number): number {
  const tier = calculateTier(totalXP);
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === TIER_ORDER.length - 1) return 1; // max tier
  const [start] = TIERS[tier].xpRange;
  const [, end] = TIERS[TIER_ORDER[idx + 1]].xpRange;
  const nextStart = TIERS[TIER_ORDER[idx + 1]].xpRange[0];
  const range = nextStart - start;
  if (range <= 0) return 1;
  return Math.min(1, (totalXP - start) / range);
}

/** XP needed to reach next tier (0 if already max) */
export function xpToNextTier(totalXP: number): number {
  const tier = calculateTier(totalXP);
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === TIER_ORDER.length - 1) return 0;
  const nextTierXP = TIERS[TIER_ORDER[idx + 1]].xpRange[0];
  return Math.max(0, nextTierXP - totalXP);
}

/** Get tier config from tier name */
export function getTierConfig(tier: Tier) {
  return TIERS[tier];
}
