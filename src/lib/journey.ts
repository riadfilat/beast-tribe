// Operation Beast journey stages (Guideline p31): Dreamer (aqua), Seeker (orange), Mover (teal).
// Stored in profiles.experience_level using the original values for compatibility.
export type Stage = 'dreamer' | 'seeker' | 'mover';

export function journeyStage(level?: string | null): Stage | null {
  if (!level) return null;
  if (level === 'dreamer' || level === 'beginner') return 'dreamer';
  if (level === 'seeker' || level === 'intermediate') return 'seeker';
  return 'mover';
}

export const STAGE_TO_LEVEL: Record<Stage, string> = {
  dreamer: 'beginner',
  seeker: 'intermediate',
  mover: 'advanced',
};
