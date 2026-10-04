// One dashboard for every kind of partner. What a partner sees depends on what they run:
// a community, classes, guest spots, bookable facilities, workouts, events.

export type Cap = 'community' | 'members' | 'classes' | 'guests' | 'facilities' | 'teams' | 'challenges' | 'report' | 'poster' | 'workouts' | 'events';

export interface PartnerKind {
  label: string;
  /** What this partner calls its people and its sessions. */
  people: string;
  sessions: string;
  community: string;
  caps: Cap[];
}

const PARTNER_KINDS: Record<string, PartnerKind> = {
  gym: { label: 'Gym or club', people: 'Members', sessions: 'Classes', community: 'Club', caps: ['community', 'members', 'classes', 'guests', 'facilities', 'teams', 'challenges', 'report', 'poster', 'workouts'] },
  company: { label: 'Company', people: 'People', sessions: 'Sessions', community: 'Community', caps: ['community', 'members', 'classes', 'teams', 'challenges', 'report', 'poster'] },
  school: { label: 'School', people: 'Members', sessions: 'Classes', community: 'Community', caps: ['community', 'members', 'classes', 'guests', 'facilities', 'poster'] },
  venue: { label: 'Courts and venues', people: 'Players', sessions: 'Bookings', community: 'Venue', caps: ['facilities'] },
  coach: { label: 'Coach', people: 'Trainees', sessions: 'Sessions', community: 'Community', caps: ['events', 'workouts'] },
  leader: { label: 'Club leader', people: 'Members', sessions: 'Sessions', community: 'Club', caps: ['community', 'members', 'classes', 'poster'] },
  event_company: { label: 'Event company', people: 'Guests', sessions: 'Events', community: 'Community', caps: ['events'] },
  nutritionist: { label: 'Nutritionist', people: 'Clients', sessions: 'Sessions', community: 'Community', caps: ['events', 'workouts'] },
  nutrition: { label: 'Restaurant', people: 'Guests', sessions: 'Events', community: 'Community', caps: ['events'] },
};

export const kindOf = (type: string): PartnerKind => PARTNER_KINDS[type] || { label: type, people: 'Members', sessions: 'Events', community: 'Community', caps: ['events'] };
export const can = (type: string, cap: Cap) => kindOf(type).caps.includes(cap);

export interface NavEntry {
  label: string;
  href: string;
  icon: string;
}

/** The sidebar for a partner type: Overview first, then only what this partner runs. */
export function navFor(type: string): NavEntry[] {
  const k = kindOf(type);
  const has = (c: Cap) => k.caps.includes(c);
  const out: NavEntry[] = [{ label: 'Overview', href: '/partner/dashboard', icon: 'dashboard' }];
  if (has('community')) out.push({ label: k.community, href: '/partner/club', icon: 'communities' });
  if (has('members')) out.push({ label: k.people, href: '/partner/members', icon: 'users' });
  if (has('classes')) out.push({ label: k.sessions, href: '/partner/classes', icon: 'events' });
  if (has('facilities')) out.push({ label: 'Courts and facilities', href: '/partner/facilities', icon: 'locations' }, { label: 'Bookings', href: '/partner/bookings', icon: 'key' });
  if (has('events')) out.push({ label: 'My events', href: '/partner/events', icon: 'events' });
  if (has('teams')) out.push({ label: 'Teams', href: '/partner/teams', icon: 'communities' });
  if (has('challenges')) out.push({ label: 'Challenges', href: '/partner/challenges', icon: 'steps' });
  if (has('report')) out.push({ label: 'Monthly report', href: '/partner/report', icon: 'business' });
  if (has('poster')) out.push({ label: 'Join poster', href: '/partner/poster', icon: 'print' });
  if (has('workouts')) out.push({ label: 'Workouts', href: '/partner/workouts', icon: 'workouts' });
  out.push({ label: 'Plan', href: '/partner/plan', icon: 'payouts' }, { label: 'Profile', href: '/partner/profile', icon: 'settings' }, { label: 'Security', href: '/security', icon: 'key' });
  return out;
}
