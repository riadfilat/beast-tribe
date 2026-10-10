// The steps a lead moves through, in order, and the plain-English names staff see.
// The database keeps the original status values (new, contacted, demo, trial, won, lost).

export type Stage = { id: string; label: string; hint: string };

export const STAGES: Stage[] = [
  { id: 'new', label: 'New', hint: 'Reply within one working day' },
  { id: 'contacted', label: 'Contacted', hint: 'Waiting on them' },
  { id: 'demo', label: 'Demo', hint: 'Shown the product' },
  { id: 'trial', label: 'Trial', hint: 'Trying it out' },
  { id: 'won', label: 'Paying', hint: 'Signed up and paying' },
];
export const LOST: Stage = { id: 'lost', label: 'Lost', hint: 'Not going ahead' };
export const ALL_STAGES = [...STAGES, LOST];

/** The step after this one, or null at the end of the line (and for lost leads). */
export function nextStage(status: string): Stage | null {
  const i = STAGES.findIndex((s) => s.id === status);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

export const KIND: Record<string, string> = {
  gym: 'Gym or club',
  company: 'Company',
  coach: 'Coach',
  venue: 'Restaurant or venue',
  leader: 'Run club or sports group',
  influencer: 'Sports creator',
  compound: 'Compound or residence',
  school: 'School or university',
  other: 'Other',
};

/** Which kind of business record a lead becomes (requests from the app included, since 2026-10-04). */
export const KIND_TO_TYPE: Record<string, string> = {
  gym: 'gym',
  company: 'company',
  coach: 'coach',
  venue: 'nutrition',
  leader: 'leader',
  influencer: 'leader',
  compound: 'venue',
  school: 'school',
};

/** Leads that are really a person running a group: the natural next step is making them a leader. */
export const LEADER_KINDS = ['leader', 'influencer', 'coach'];

export const CAPTAIN_REQUEST = 'captain request';

export function age(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

/** Hand-added leads without an email get a placeholder address; never show it. */
export const realEmail = (e: string | null) => (e && !e.endsWith('@lead.invalid') ? e : null);
