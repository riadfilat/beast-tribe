// Synthetic data for local design QA only (EXPO_PUBLIC_PREVIEW=1 on the web preview).
// Never used in a build: EAS environments don't set the flag. Names, counts, and
// photos here are illustrative; none of it is real member data.

import { startOfLocalDay, addDays } from '../i18n/format';

export const PREVIEW = process.env.EXPO_PUBLIC_PREVIEW === '1';
export const PREVIEW_ME = 'preview-me';

const img = (id: string) => `https://images.unsplash.com/${id}?w=1000&h=620&fit=crop&q=70`;
export const PREVIEW_PHOTOS = {
  wadi: img('photo-1682687220742-aba13b6e50ba'),
  park: img('photo-1571902943202-507ec2618e8f'),
  corniche: img('photo-1544367567-0f2fcb009e0b'),
  gym: img('photo-1534438327276-14e5300c3a48'),
  box: img('photo-1540497077202-7c8a3999166f'),
  studio: img('photo-1558618666-fcd25c85f82e'),
  padel: img('photo-1554068865-24cecd4e34b8'),
  hike: img('photo-1506905925346-21bda4d32df4'),
};

const P = (id: string, name: string) => ({ id, display_name: name, full_name: name, avatar_url: null });
const people = {
  me: P(PREVIEW_ME, 'Noor Al-Harbi'),
  sara: P('p-sara', 'Sara Al-Qahtani'),
  majed: P('p-majed', 'Majed Al-Otaibi'),
  noura: P('p-noura', 'Noura S'),
  faisal: P('p-faisal', 'Faisal Alami'),
  lama: P('p-lama', 'Lama K'),
  omar: P('p-omar', 'Omar Haddad'),
  hessa: P('p-hessa', 'Hessa M'),
  khalid: P('p-khalid', 'Khalid Al-Dosari'),
  reem: P('p-reem', 'Reem A'),
  turki: P('p-turki', 'Turki B'),
  dana: P('p-dana', 'Dana F'),
  yousef: P('p-yousef', 'Yousef R'),
  maha: P('p-maha', 'Maha J'),
};
const crowd = Object.values(people).filter((x) => x.id !== PREVIEW_ME);

function roster(n: number, opts: { me?: boolean; waitlist?: number; offset?: number } = {}) {
  const rows: any[] = [];
  const pool = crowd.slice(opts.offset ?? 0).concat(crowd.slice(0, opts.offset ?? 0));
  const going = Math.max(0, n - (opts.me ? 1 : 0));
  for (let i = 0; i < going; i++) {
    const person = pool[i % pool.length];
    rows.push({ user_id: `${person.id}-${i}`, status: 'going', created_at: `2026-01-01T00:00:${String(10 + i).padStart(2, '0')}Z`, profile: { ...person, id: `${person.id}-${i}` } });
  }
  if (opts.me) rows.push({ user_id: PREVIEW_ME, status: 'going', created_at: '2026-01-01T00:00:59Z', profile: people.me });
  for (let i = 0; i < (opts.waitlist ?? 0); i++) {
    const person = pool[(going + i) % pool.length];
    rows.push({ user_id: `w-${i}`, status: 'waitlist', created_at: `2026-01-01T00:01:${String(10 + i).padStart(2, '0')}Z`, profile: { ...person, id: `w-${i}` } });
  }
  return rows;
}

function at(dayOffset: number, hh: number, mm: number) {
  const d = addDays(startOfLocalDay(new Date()), dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d;
}
const iso = (d: Date) => d.toISOString();
const plus = (d: Date, min: number) => new Date(d.getTime() + min * 60000);

export function previewSessionRows(): any[] {
  const now = new Date();
  const liveStart = plus(now, -35);
  const yoursStart = plus(now, 110);
  const base = (o: any) => ({
    description: null, gym_name: null, country: 'SA', location_lat: null, location_lng: null,
    visibility: 'public', pack_id: null, pack: null, difficulty: null, coach_name: null,
    cancelled_at: null, is_women_only: false, max_capacity: null, location_city: 'Riyadh', ...o,
  });
  return [
    base({ id: 's-dawn-today', title: 'Dawn Run', event_type: 'running', starts_at: iso(plus(now, -190)), ends_at: iso(plus(now, -120)),
      location_name: 'Wadi Hanifah Path', image_url: PREVIEW_PHOTOS.wadi, going_count: 9, created_by: 'p-majed', host: people.majed, roster: roster(9, { offset: 1 }) }),
    base({ id: 's-live', title: 'Hyrox Engine', event_type: 'hyrox', starts_at: iso(liveStart), ends_at: iso(plus(liveStart, 90)),
      location_name: 'Fitness Time — King Fahd', image_url: PREVIEW_PHOTOS.box, max_capacity: 16, going_count: 11, difficulty: 'hard',
      coach_name: 'Coach Reem', created_by: 'p-reem', host: people.reem, roster: roster(11, { offset: 3 }) }),
    base({ id: 's-yours', title: 'Evening Padel', event_type: 'padel', starts_at: iso(yoursStart), ends_at: iso(plus(yoursStart, 90)),
      location_name: 'Padel Saudi — Olaya', image_url: PREVIEW_PHOTOS.padel, max_capacity: 8, going_count: 7, difficulty: 'medium',
      description: 'Friendly doubles, rotating partners every set. Bring water — courts 3 and 4.',
      created_by: 'p-sara', host: people.sara, roster: roster(7, { me: true }) }),
    base({ id: 's-football', title: 'Night Football', event_type: 'football', starts_at: iso(plus(now, 265)), ends_at: iso(plus(now, 355)),
      location_name: 'King Fahd Park', image_url: PREVIEW_PHOTOS.park, max_capacity: 14, going_count: 10,
      created_by: 'p-khalid', host: people.khalid, roster: roster(10, { offset: 5 }) }),
    base({ id: 's-yoga', title: 'Sunset Yoga Flow', event_type: 'yoga', starts_at: iso(plus(now, 300)), ends_at: iso(plus(now, 360)),
      location_name: 'The Edge Studio', image_url: PREVIEW_PHOTOS.studio, max_capacity: 12, going_count: 5, is_women_only: true, difficulty: 'easy',
      created_by: 'p-lama', host: people.lama, roster: roster(5, { offset: 2 }) }),
    base({ id: 's-dawn-tmrw', title: 'Dawn Run', event_type: 'running', starts_at: iso(at(1, 5, 30)), ends_at: iso(at(1, 6, 45)),
      location_name: 'Wadi Hanifah Path', image_url: PREVIEW_PHOTOS.wadi, going_count: 4, created_by: 'p-majed', host: people.majed, roster: roster(4, { offset: 1 }) }),
    base({ id: 's-full', title: 'Hyrox Engine', event_type: 'hyrox', starts_at: iso(at(1, 6, 0)), ends_at: iso(at(1, 7, 15)),
      location_name: 'Fitness Time — King Fahd', image_url: PREVIEW_PHOTOS.box, max_capacity: 12, going_count: 12, difficulty: 'hard',
      created_by: 'p-reem', host: people.reem, roster: roster(12, { offset: 4, waitlist: 3 }) }),
    base({ id: 's-hosting', title: 'Hoops at Andoraa', event_type: 'basketball', starts_at: iso(at(1, 19, 30)), ends_at: iso(at(1, 21, 0)),
      location_name: 'Andoraa basketball court', max_capacity: 10, going_count: 6, visibility: 'pack', pack_id: 'pk-andoraa',
      pack: { id: 'pk-andoraa', name: 'ANDORAA' }, created_by: PREVIEW_ME, host: people.me, roster: roster(6, { me: true, offset: 6 }) }),
    base({ id: 's-cancelled', title: 'Boxing Basics', event_type: 'boxing', starts_at: iso(at(2, 20, 0)), ends_at: iso(at(2, 21, 0)),
      location_name: 'Leejam — Olaya', image_url: PREVIEW_PHOTOS.gym, max_capacity: 10, going_count: 3, cancelled_at: iso(plus(now, -600)),
      created_by: 'p-turki', host: people.turki, roster: roster(3, { me: true, offset: 7 }) }),
    base({ id: 's-ride', title: 'Corniche Ride', event_type: 'cycling', starts_at: iso(at(3, 6, 0)), ends_at: iso(at(3, 8, 0)),
      location_name: 'Jeddah Corniche', location_city: 'Jeddah', image_url: PREVIEW_PHOTOS.corniche, max_capacity: 20, going_count: 13,
      created_by: 'p-faisal', host: people.faisal, roster: roster(13, { offset: 8 }) }),
    base({ id: 's-hike', title: 'Edge of the World Hike', event_type: 'hiking', starts_at: iso(at(4, 15, 30)), ends_at: iso(at(4, 19, 0)),
      location_name: 'Jebel Fihrayn trailhead', image_url: PREVIEW_PHOTOS.hike, max_capacity: 24, going_count: 17, difficulty: 'medium',
      created_by: 'p-omar', host: people.omar, roster: roster(17, { offset: 9 }) }),
  ];
}

export function previewMyRsvps() {
  return [
    { event_id: 's-yours', status: 'going', created_at: '2026-01-01T00:00:59Z' },
    { event_id: 's-hosting', status: 'going', created_at: '2026-01-01T00:00:59Z' },
    { event_id: 's-cancelled', status: 'going', created_at: '2026-01-01T00:00:59Z' },
  ];
}

export function previewNotifications() {
  const now = Date.now();
  const ago = (min: number) => new Date(now - min * 60000).toISOString();
  return [
    { id: 'n1', type: 'rsvp_join', actor_id: 'p-sara', data: { event_id: 's-hosting', event_title: 'Hoops at Andoraa', actor_name: 'Sara Al-Qahtani' }, read_at: null, created_at: ago(12) },
    { id: 'n2', type: 'beast', actor_id: 'p-omar', data: { post_id: 'post-1', actor_name: 'Omar Haddad' }, read_at: null, created_at: ago(95) },
    { id: 'n3', type: 'event_full', actor_id: null, data: { event_id: 's-full', event_title: 'Hyrox Engine' }, read_at: ago(60), created_at: ago(300) },
    { id: 'n4', type: 'event_cancelled', actor_id: 'p-turki', data: { event_id: 's-cancelled', event_title: 'Boxing Basics', actor_name: 'Turki B' }, read_at: ago(500), created_at: ago(600) },
    { id: 'n5', type: 'comment', actor_id: 'p-lama', data: { post_id: 'post-1', actor_name: 'Lama K' }, read_at: ago(1500), created_at: ago(1600) },
  ];
}

export function previewPosts() {
  const now = Date.now();
  const ago = (min: number) => new Date(now - min * 60000).toISOString();
  return [
    { id: 'post-1', user_id: PREVIEW_ME, content: 'Seven of us at 5:30 and the wadi was ours. Same time tomorrow?', image_url: PREVIEW_PHOTOS.wadi,
      created_at: ago(140), event_id: 's-dawn-today', event: { id: 's-dawn-today', title: 'Dawn Run' }, author: people.me, beast_count: [{ count: 14 }], comment_count: 3 },
    { id: 'post-2', user_id: 'p-reem', content: 'Engine day. Sled pushes until the legs said no, then two more rounds.', image_url: PREVIEW_PHOTOS.box,
      created_at: ago(420), event_id: null, event: null, author: people.reem, beast_count: [{ count: 22 }], comment_count: 5 },
    { id: 'post-3', user_id: 'p-khalid', content: 'Football tonight at King Fahd Park — 4 spots left. Bring both colours.', image_url: null,
      created_at: ago(780), event_id: null, event: null, author: people.khalid, beast_count: [{ count: 6 }], comment_count: 0 },
  ];
}

export const previewPacks = [
  { id: 'pk-andoraa', name: 'ANDORAA', animal: 'wolf', members: 14, community: 'Andorra Sports Tribe' },
  { id: 'pk-dawn', name: 'Dawn Patrol', animal: 'eagle', members: 6, community: null },
];

export const previewStats = { attended: 23, hosted: 4, met: 57 };
export const previewMySports = ['running', 'padel', 'yoga', 'hyrox'];

export const previewProfile = {
  id: PREVIEW_ME,
  full_name: 'Noor Al-Harbi',
  display_name: 'Noor',
  avatar_url: null,
  gender: 'female',
  region: 'SA',
  city: 'Riyadh',
  experience_level: 'intermediate',
  onboarding_completed: true,
  is_premium: false,
  pack_id: null,
  community_id: 'c-andorra',
  created_at: '2026-01-01T00:00:00Z',
  date_of_birth: null,
  five_k_time_seconds: null,
  max_bench_kg: null,
  daily_steps_avg: null,
};

// Nutrition: a believable week (keys are local day strings, oldest first).
export function previewMeals(days: string[]) {
  const today = days[days.length - 1];
  const rows: any[] = [
    { id: 'm1', meal_type: 'breakfast', title: 'Foul', calories: 300, protein_g: 15, carbs_g: 35, fat_g: 9, logged_date: today },
    { id: 'm2', meal_type: 'breakfast', title: 'Laban', calories: 130, protein_g: 8, carbs_g: 11, fat_g: 6, logged_date: today },
    { id: 'm3', meal_type: 'lunch', title: 'Chicken kabsa', calories: 650, protein_g: 40, carbs_g: 75, fat_g: 20, logged_date: today },
    { id: 'm4', meal_type: 'snack', title: 'Dates (3)', calories: 100, protein_g: 1, carbs_g: 27, fat_g: 0, logged_date: today },
  ];
  const past = [1850, 2310, 1620, 2050, 0, 1980];
  days.slice(0, 6).forEach((d, i) => {
    if (past[i]) rows.push({ id: `mp${i}`, meal_type: 'lunch', title: 'Logged', calories: past[i], protein_g: 110, carbs_g: 200, fat_g: 60, logged_date: d });
  });
  return rows;
}
export function previewWater(days: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  [5, 6, 4, 6, 0, 3, 3].forEach((g, i) => {
    if (days[i]) out[days[i]] = g;
  });
  return out;
}

// Coaching: one pending request from a coach, so the consent card can be reviewed.
export const previewCoachLinks = [
  { id: 'ct-1', coach_id: 'c-reem', status: 'pending', started_at: null, coach: { id: 'c-reem', business_name: 'Coach Reem', name: 'Coach Reem', user_id: 'p-reem' } },
];
export const previewTrainees = [
  { id: 'ct-a', trainee_id: 'p-sara', status: 'active', started_at: '2026-08-02T08:00:00Z', trainee: people.sara },
  { id: 'ct-b', trainee_id: 'p-majed', status: 'active', started_at: '2026-07-14T08:00:00Z', trainee: people.majed },
  { id: 'ct-c', trainee_id: 'p-dana', status: 'pending', started_at: null, trainee: people.dana },
];

export const previewLocations = [
  { id: 'l-wadi', name: 'Wadi Hanifah Path', city: 'Riyadh', country: 'SA', sports: ['running', 'cycling', 'walking'], image_url: PREVIEW_PHOTOS.wadi, latitude: 24.6405, longitude: 46.6286 },
  { id: 'l-park', name: 'King Fahd Park', city: 'Riyadh', country: 'SA', sports: ['running', 'walking', 'football', 'yoga'], image_url: PREVIEW_PHOTOS.park, latitude: null, longitude: null },
  { id: 'l-padel', name: 'Padel Saudi — Olaya', city: 'Riyadh', country: 'SA', sports: ['padel', 'tennis'], image_url: PREVIEW_PHOTOS.padel, latitude: null, longitude: null },
  { id: 'l-box', name: 'Fitness Time — King Fahd', city: 'Riyadh', country: 'SA', sports: ['gym', 'crossfit', 'hyrox'], image_url: PREVIEW_PHOTOS.box, latitude: null, longitude: null },
  { id: 'l-studio', name: 'The Edge Studio', city: 'Riyadh', country: 'SA', sports: ['yoga', 'pilates', 'gym'], image_url: PREVIEW_PHOTOS.studio, latitude: null, longitude: null },
];
