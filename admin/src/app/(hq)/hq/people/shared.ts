// Small helpers shared by the People list and a person's page.

export const REGIONS: [string, string][] = [
  ['SA', 'Saudi Arabia'],
  ['AE', 'UAE'],
  ['KW', 'Kuwait'],
  ['BH', 'Bahrain'],
];

export type Show = 'all' | 'active' | 'new' | 'none';
export const SHOWS: { key: Show; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'active', label: 'Active this week' },
  { key: 'new', label: 'New this month' },
  { key: 'none', label: 'Only in Beast Tribe' },
];

const DAY = 86400000;

/** ISO timestamp for `n` days before now. */
export const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

export const regionName = (code?: string | null) => REGIONS.find(([k]) => k === code)?.[1] ?? code ?? '—';

export const nameOf = (p: { display_name?: string | null; full_name?: string | null }) => p.display_name || p.full_name || 'Member';

export const shortDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** "Today", "Yesterday", "5 days ago", "3 months ago", or "Never". */
export function since(d?: string | Date | null) {
  if (!d) return 'Never';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const m = Math.floor(days / 30);
  if (m < 12) return m === 1 ? 'A month ago' : `${m} months ago`;
  const y = Math.floor(m / 12);
  return y === 1 ? 'A year ago' : `${y} years ago`;
}
