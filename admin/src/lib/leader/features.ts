// What a community can switch on (migration 092, community_features). Each feature with a page
// adds it to the leader dashboard's menu. Labels live here so the menu, the Features page and the
// command center say the same thing.

export type Feature = 'courts' | 'guests' | 'coaching' | 'nutrition' | 'teams';
export type TeamRole = 'leader' | 'supporter';

export interface FeatureInfo {
  key: Feature;
  title: string;
  about: string;
  /** The page it adds, or null when it only adds an option elsewhere. */
  page: { href: string; label: string } | null;
  /** Supporters never see money, so pages about prices stay hidden from them. */
  leadersOnly?: boolean;
}

export const FEATURES: FeatureInfo[] = [
  { key: 'courts', title: 'Courts & booking', about: 'You own a space or a gym: list courts, prices and opening hours. Members book them in the app and split the price.', page: { href: '/leader/courts', label: 'Courts' }, leadersOnly: true },
  { key: 'guests', title: 'Guest passes', about: 'People outside your community can join the sessions you choose, for a guest fee you set.', page: null },
  { key: 'coaching', title: '1:1 coaching', about: 'Members book your coaches’ free times for private sessions in the app.', page: { href: '/leader/coaching', label: 'Coaching' } },
  { key: 'nutrition', title: 'Nutrition', about: 'You have an in-house nutritionist. Members will book a consult with them in the app.', page: { href: '/leader/nutrition', label: 'Nutrition' } },
  { key: 'teams', title: 'Company teams', about: 'Split employees into teams and run team challenges between them.', page: { href: '/leader/teams', label: 'Teams' } },
];

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

/** The leader dashboard's menu for this role and these features. */
export function leaderNav(role: TeamRole, features: Set<Feature>): NavItem[] {
  const extra = FEATURES.filter((f) => f.page && features.has(f.key) && (role === 'leader' || !f.leadersOnly)).map((f) => ({ href: f.page!.href, label: f.page!.label, icon: f.key }));
  return [
    { href: '/leader', label: 'Home', icon: 'home' },
    { href: '/leader/sessions', label: 'Sessions', icon: 'sessions' },
    ...extra,
    { href: '/leader/people', label: 'People', icon: 'people' },
    { href: '/leader/features', label: 'Features', icon: 'features' },
    { href: '/leader/profile', label: 'Profile', icon: 'profile' },
  ];
}
