// Synthetic data for local design QA only (EXPO_PUBLIC_PREVIEW=1 on the web preview).
// Never used in a build: EAS environments don't set the flag. Names, counts, and
// photos here are illustrative; none of it is real member data.

import { startOfLocalDay, addDays } from '../i18n/format';
import type { Emblem } from '../lib/emblem';

export const PREVIEW = process.env.EXPO_PUBLIC_PREVIEW === '1';
export const PREVIEW_ME = 'preview-me';

// The preview speaks the member's language: names, places and posts read naturally in Arabic too.
const AR = (() => {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('beast_tribe_lang') === 'ar';
  } catch {
    return false;
  }
})();
const L = (en: string, ar: string) => (AR ? ar : en);

// Stand-in photography (Unsplash) until Operation Beast's own shoot replaces it.
const img = (id: string) => `https://images.unsplash.com/${id}?w=1000&h=620&fit=crop&q=70`;
const face = (id: string) => `https://images.unsplash.com/${id}?w=240&h=240&fit=crop&crop=faces&q=70`;
export const PREVIEW_PHOTOS = {
  wadi: img('photo-1720995437688-68cc4b9cab75'),
  dawnCrew: img('photo-1540474861915-87c6b849f6d0'),
  park: img('photo-1785003897036-d777c28c2f91'),
  pitch: img('photo-1431324155629-1a6deb1dec8d'),
  corniche: img('photo-1541625602330-2277a4c46182'),
  gym: img('photo-1606335543042-57c525922933'),
  box: img('photo-1632077804406-188472f1a810'),
  engine: img('photo-1775322838072-829ad37ab52d'),
  studio: img('photo-1545205597-3d9d02c29597'),
  padel: img('photo-1781310370779-9c45ab3f4e04'),
  padelNight: img('photo-1767128890439-1af9ca2ff1ac'),
  padelOutdoor: img('photo-1709587823868-735f9375ae74'),
  padelNet: img('photo-1709587823553-765b325cc31b'),
  hoops: img('photo-1713427508493-25e2c572deff'),
  hike: img('photo-1680246637685-65081afd4df8'),
};

const P = (id: string, en: string, ar: string, photo: string) => ({ id, display_name: L(en, ar), full_name: L(en, ar), avatar_url: face(photo) });
const people = {
  me: P(PREVIEW_ME, 'Noor Al-Harbi', 'نور الحربي', 'photo-1774486033344-e65e11a4fa29'),
  sara: P('p-sara', 'Sara Al-Qahtani', 'سارة القحطاني', 'photo-1787100663079-4d1cc143ea47'),
  majed: P('p-majed', 'Majed Al-Otaibi', 'ماجد العتيبي', 'photo-1556452578-f140ac938de9'),
  noura: P('p-noura', 'Noura S', 'نورة س', 'photo-1787095245569-00f583ccd06b'),
  faisal: P('p-faisal', 'Faisal Alami', 'فيصل العلمي', 'photo-1698510047345-ff32de8a3b74'),
  lama: P('p-lama', 'Lama K', 'لمى ك', 'photo-1790575187818-16618fdc7a2d'),
  omar: P('p-omar', 'Omar Haddad', 'عمر حداد', 'photo-1623605931891-d5b95ee98459'),
  hessa: P('p-hessa', 'Hessa M', 'حصة م', 'photo-1783988074371-d05eaf346ee4'),
  khalid: P('p-khalid', 'Khalid Al-Dosari', 'خالد الدوسري', 'photo-1694712301331-1088f9dacb1a'),
  reem: P('p-reem', 'Reem A', 'ريم ع', 'photo-1771555290865-73c6572fbd75'),
  turki: P('p-turki', 'Turki B', 'تركي ب', 'photo-1520451160208-a741e481c527'),
  dana: P('p-dana', 'Dana F', 'دانة ف', 'photo-1681643964592-b13b4a492478'),
  yousef: P('p-yousef', 'Yousef R', 'يوسف ر', 'photo-1715838854648-ea200803934a'),
  maha: P('p-maha', 'Maha J', 'مها ج', 'photo-1787154604451-82f21e34e59b'),
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
// People book on the hour or the half hour, never at 9:42.
const HALF = 30 * 60000;
const floorHalf = (d: Date) => new Date(Math.floor(d.getTime() / HALF) * HALF);
const ceilHalf = (d: Date) => new Date(Math.ceil(d.getTime() / HALF) * HALF);

const RIYADH = L('Riyadh', 'الرياض');
const PLACES = {
  wadi: L('Wadi Hanifah Path', 'ممشى وادي حنيفة'),
  box: L('The Box — Al Malqa', 'ذا بوكس — الملقا'),
  padel: L('Olaya Padel Club', 'نادي العليا للبادل'),
  padelHittin: L('Hittin Padel Courts', 'ملاعب حطين للبادل'),
  padelMalqa: L('Malqa Padel Arena', 'ساحة الملقا للبادل'),
  pitch: L('Nakheel Pitches', 'ملاعب النخيل'),
  studio: L('Edge Studio', 'استوديو إيدج'),
  hoops: L('Sahafa Courts', 'ملاعب الصحافة'),
  boxing: L('Olaya Boxing Gym', 'نادي العليا للملاكمة'),
  corniche: L('Jeddah Corniche', 'كورنيش جدة'),
  trail: L('Jebel Fihrayn trailhead', 'مسار جبل فهرين'),
};
const COMPANY = { id: 'c-company', name: L('My Company', 'شركتي'), visibility: 'private', is_default: false };
const CREW = { id: 'pk-crew', name: L('Thursday Crew', 'شلة الخميس') };

export function previewSessionRows(): any[] {
  const now = new Date();
  const liveStart = floorHalf(plus(now, -30));
  const yoursStart = ceilHalf(plus(now, 90));
  const yogaStart = ceilHalf(plus(now, 150));
  const footballStart = ceilHalf(plus(now, 210));
  const base = (o: any) => ({
    description: null, gym_name: null, country: 'SA', location_lat: null, location_lng: null,
    visibility: 'community', community_id: 'c-beast', community: { id: 'c-beast', name: 'Beast Tribe', visibility: 'open', is_default: true },
    pack_id: null, pack: null, difficulty: null, coach_name: null,
    cancelled_at: null, is_women_only: false, max_capacity: null, location_city: RIYADH, ...o,
  });
  return [
    base({ id: 's-dawn-today', title: L('Dawn Run', 'جري الفجر'), event_type: 'running', starts_at: iso(at(0, 5, 30)), ends_at: iso(at(0, 6, 45)),
      location_name: PLACES.wadi, image_url: PREVIEW_PHOTOS.wadi, going_count: 9, created_by: 'p-majed', host: people.majed, roster: roster(9, { offset: 1 }) }),
    base({ id: 's-live', title: L('Hyrox Engine', 'تحدي هايروكس'), event_type: 'hyrox', starts_at: iso(liveStart), ends_at: iso(plus(liveStart, 90)),
      location_name: PLACES.box, image_url: PREVIEW_PHOTOS.box, max_capacity: 16, going_count: 11, difficulty: 'hard',
      coach_name: L('Coach Reem', 'المدربة ريم'), created_by: 'p-reem', host: people.reem, roster: roster(11, { offset: 3 }),
      workout_id: 'w-engine', workout: { id: 'w-engine', title: 'Engine 20', title_ar: 'محرك 20', duration_minutes: 35 } }),
    base({ id: 's-yours', title: L('Evening Padel', 'بادل المساء'), event_type: 'padel', starts_at: iso(yoursStart), ends_at: iso(plus(yoursStart, 90)),
      location_name: PLACES.padel, image_url: PREVIEW_PHOTOS.padel, max_capacity: 8, going_count: 7, difficulty: 'medium',
      description: L('Friendly doubles, rotating partners every set. Bring water — courts 3 and 4.', 'زوجي ودّي، نبدّل الشركاء كل شوط. أحضر ماءك — الملعبان 3 و4.'),
      created_by: 'p-sara', host: people.sara, roster: roster(7, { me: true }) }),
    base({ id: 's-yoga', title: L('Evening Yoga Flow', 'يوغا المساء'), event_type: 'yoga', starts_at: iso(yogaStart), ends_at: iso(plus(yogaStart, 60)),
      location_name: PLACES.studio, image_url: PREVIEW_PHOTOS.studio, max_capacity: 12, going_count: 5, is_women_only: true, difficulty: 'easy',
      created_by: 'p-lama', host: people.lama, roster: roster(5, { offset: 2 }) }),
    base({ id: 's-football', title: L('Night Football', 'كورة الليل'), event_type: 'football', starts_at: iso(footballStart), ends_at: iso(plus(footballStart, 90)),
      community_id: COMPANY.id, community: COMPANY,
      location_name: PLACES.pitch, image_url: PREVIEW_PHOTOS.park, max_capacity: 14, going_count: 10,
      created_by: 'p-khalid', host: people.khalid, roster: roster(10, { offset: 5 }) }),
    base({ id: 's-dawn-tmrw', title: L('Dawn Run', 'جري الفجر'), event_type: 'running', starts_at: iso(at(1, 5, 30)), ends_at: iso(at(1, 6, 45)),
      location_name: PLACES.wadi, image_url: PREVIEW_PHOTOS.wadi, going_count: 4, created_by: 'p-majed', host: people.majed, roster: roster(4, { offset: 1 }) }),
    base({ id: 's-full', title: L('Hyrox Engine', 'تحدي هايروكس'), event_type: 'hyrox', starts_at: iso(at(1, 6, 0)), ends_at: iso(at(1, 7, 30)),
      location_name: PLACES.box, image_url: PREVIEW_PHOTOS.box, max_capacity: 12, going_count: 12, difficulty: 'hard',
      created_by: 'p-reem', host: people.reem, roster: roster(12, { offset: 4, waitlist: 3 }) }),
    base({ id: 's-hosting', title: L('Hoops with the crew', 'سلة مع الشلة'), event_type: 'basketball', starts_at: iso(at(1, 19, 30)), ends_at: iso(at(1, 21, 0)),
      location_name: PLACES.hoops, image_url: PREVIEW_PHOTOS.hoops, max_capacity: 10, going_count: 6, visibility: 'pack', pack_id: CREW.id, community_id: null, community: null,
      pack: CREW, created_by: PREVIEW_ME, host: people.me, roster: roster(6, { me: true, offset: 6 }) }),
    base({ id: 's-cancelled', title: L('Boxing Basics', 'أساسيات الملاكمة'), event_type: 'boxing', starts_at: iso(at(2, 20, 0)), ends_at: iso(at(2, 21, 0)),
      location_name: PLACES.boxing, image_url: PREVIEW_PHOTOS.gym, max_capacity: 10, going_count: 3, cancelled_at: iso(plus(now, -600)),
      created_by: 'p-turki', host: people.turki, roster: roster(3, { me: true, offset: 7 }) }),
    base({ id: 's-ride', title: L('Corniche Ride', 'جولة الكورنيش'), event_type: 'cycling', starts_at: iso(at(3, 6, 0)), ends_at: iso(at(3, 8, 0)),
      location_name: PLACES.corniche, location_city: L('Jeddah', 'جدة'), image_url: PREVIEW_PHOTOS.corniche, max_capacity: 20, going_count: 13,
      created_by: 'p-faisal', host: people.faisal, roster: roster(13, { offset: 8 }) }),
    base({ id: 's-hike', title: L('Edge of the World Hike', 'هايك حافة العالم'), event_type: 'hiking', starts_at: iso(at(4, 15, 30)), ends_at: iso(at(4, 19, 0)),
      location_name: PLACES.trail, image_url: PREVIEW_PHOTOS.hike, max_capacity: 24, going_count: 17, difficulty: 'medium',
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
    { id: 'n1', type: 'rsvp_join', actor_id: 'p-sara', data: { event_id: 's-hosting', event_title: L('Hoops with the crew', 'سلة مع الشلة'), actor_name: people.sara.full_name }, read_at: null, created_at: ago(12) },
    { id: 'n2', type: 'beast', actor_id: 'p-omar', data: { post_id: 'post-1', actor_name: people.omar.full_name }, read_at: null, created_at: ago(95) },
    { id: 'n3', type: 'event_full', actor_id: null, data: { event_id: 's-full', event_title: L('Hyrox Engine', 'تحدي هايروكس') }, read_at: ago(60), created_at: ago(300) },
    { id: 'n4', type: 'event_cancelled', actor_id: 'p-turki', data: { event_id: 's-cancelled', event_title: L('Boxing Basics', 'أساسيات الملاكمة'), actor_name: people.turki.full_name }, read_at: ago(500), created_at: ago(600) },
    { id: 'n5', type: 'comment', actor_id: 'p-lama', data: { post_id: 'post-1', actor_name: people.lama.full_name }, read_at: ago(1500), created_at: ago(1600) },
  ];
}

export function previewPosts() {
  const now = Date.now();
  const ago = (min: number) => new Date(now - min * 60000).toISOString();
  return [
    { id: 'post-1', user_id: PREVIEW_ME, content: L('Seven of us at 5:30 and the wadi was ours. Same time tomorrow?', 'كنا سبعة الساعة 5:30 والوادي كله لنا. نفس الموعد بكرة؟'), image_url: PREVIEW_PHOTOS.dawnCrew,
      created_at: ago(140), event_id: 's-dawn-today', event: { id: 's-dawn-today', title: L('Dawn Run', 'جري الفجر') }, author: people.me, beast_count: [{ count: 14 }], comment_count: 3 },
    { id: 'post-2', user_id: 'p-reem', content: L('Engine day. Sled pushes until the legs said no, then two more rounds.', 'يوم هايروكس. دفعنا الزلاجة لين ما بقى فينا شي، وبعدها جولتين زيادة.'), image_url: PREVIEW_PHOTOS.engine,
      created_at: ago(420), event_id: null, event: null, workout: { id: 'w-engine', title: 'Engine 20', title_ar: 'محرك 20' }, author: people.reem, beast_count: [{ count: 22 }], comment_count: 5 },
    { id: 'post-3', user_id: 'p-khalid', content: L('Football tonight at Nakheel Pitches — 4 spots left. Bring both colours.', 'كورة الليلة في ملاعب النخيل — باقي 4 أماكن. جيبوا اللونين.'), image_url: PREVIEW_PHOTOS.pitch,
      community: { id: COMPANY.id, name: COMPANY.name, visibility: 'private' },
      created_at: ago(780), event_id: null, event: null, author: people.khalid, beast_count: [{ count: 6 }], comment_count: 0 },
  ];
}

export const previewPacks: { id: string; name: string; emblem: Emblem; members: number; community: string | null }[] = [
  { id: CREW.id, name: CREW.name, emblem: { kind: 'glyph', value: 'wolf', color: 'dreamer' }, members: 14, community: null },
  { id: 'pk-dawn', name: L('Dawn Patrol', 'دورية الفجر'), emblem: { kind: 'glyph', value: 'falcon', color: 'slate' }, members: 6, community: null },
  { id: 'pk-burn', name: L('Burn Unit', 'فرقة الحرق'), emblem: { kind: 'emoji', value: '🔥', color: 'orange' }, members: 9, community: null },
  { id: 'pk-desert', name: L('Desert Runners', 'عدّاؤو الصحراء'), emblem: { kind: 'letters', value: null, color: 'chalk' }, members: 11, community: null },
];

/** A pack's members: the member leads, then the crew (with their photos). */
export function previewPackMembers(packId: string) {
  const crew = [people.me, people.sara, people.majed, people.lama, people.omar, people.hessa, people.khalid];
  return crew.slice(0, packId === 'pk-dawn' ? 4 : 7).map((x, i) => ({
    id: i === 0 ? PREVIEW_ME : `${packId}-m${i}`,
    name: x.full_name,
    avatarUrl: x.avatar_url,
    role: (i === 0 ? 'leader' : 'member') as 'leader' | 'member',
  }));
}
export const PREVIEW_PACK_CODE = (packId: string) => (packId === 'pk-dawn' ? 'DAWN77' : 'CREW26');

// Communities: your company (private, by code), the open default, and open communities of people
// who play the same sport.
export const PREVIEW_COMPANY = { id: COMPANY.id, name: COMPANY.name };
export const previewCommunities: import('./communities').Community[] = [
  { id: COMPANY.id, name: COMPANY.name, description: L('Everyone at the office trains here.', 'كل زملاء العمل يتمرنون هنا.'), kind: 'company', open: false, isDefault: false, city: RIYADH, logoUrl: null, members: 48, joinCode: 'MYCO24', isMember: true },
  { id: 'c-beast', name: 'Beast Tribe', description: L('The open Operation Beast community. Everyone is welcome.', 'مجتمع أوبريشن بيست المفتوح. الكل مرحّب به.'), kind: 'brand', open: true, isDefault: true, city: null, logoUrl: null, members: 1240, joinCode: null, isMember: true },
  { id: 'c-padel', name: L('Padel Gang', 'شلة البادل'), description: L('Padel nights across Riyadh, every level.', 'ليالي بادل في الرياض لكل المستويات.'), kind: 'club', open: true, isDefault: false, city: RIYADH, logoUrl: null, members: 186, joinCode: null, isMember: false },
  { id: 'c-runners', name: L('Riyadh Runners', 'عدّاؤو الرياض'), description: L('Weekly dawn runs across Riyadh.', 'جري أسبوعي مع الفجر في الرياض.'), kind: 'club', open: true, isDefault: false, city: RIYADH, logoUrl: null, members: 312, joinCode: null, isMember: false },
  { id: 'c-football', name: L('Weekend Football', 'كورة الويكند'), description: L('Five-a-side every Friday and Saturday.', 'خماسيات كل جمعة وسبت.'), kind: 'club', open: true, isDefault: false, city: RIYADH, logoUrl: null, members: 240, joinCode: null, isMember: false },
];

export const previewStats = { attended: 23, hosted: 4, met: 57 };
export const previewMySports = ['running', 'padel', 'yoga', 'hyrox'];

export const previewProfile = {
  id: PREVIEW_ME,
  full_name: people.me.full_name,
  display_name: L('Noor', 'نور'),
  avatar_url: people.me.avatar_url,
  gender: 'female',
  region: 'SA',
  city: RIYADH,
  experience_level: 'intermediate',
  onboarding_completed: true,
  is_premium: false,
  pack_id: null,
  community_id: 'c-company',
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
    { id: 'm1', meal_type: 'breakfast', title: L('Foul', 'فول'), calories: 300, protein_g: 15, carbs_g: 35, fat_g: 9, logged_date: today },
    { id: 'm2', meal_type: 'breakfast', title: L('Laban', 'لبن'), calories: 130, protein_g: 8, carbs_g: 11, fat_g: 6, logged_date: today },
    { id: 'm3', meal_type: 'lunch', title: L('Chicken kabsa', 'كبسة دجاج'), calories: 650, protein_g: 40, carbs_g: 75, fat_g: 20, logged_date: today },
    { id: 'm4', meal_type: 'snack', title: L('Dates (3)', 'تمر (3)'), calories: 100, protein_g: 1, carbs_g: 27, fat_g: 0, logged_date: today },
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
  { id: 'ct-1', coach_id: 'c-reem', status: 'pending', started_at: null, coach: { id: 'c-reem', business_name: L('Coach Reem', 'المدربة ريم'), name: L('Coach Reem', 'المدربة ريم'), user_id: 'p-reem' } },
];
export const previewTrainees = [
  { id: 'ct-a', trainee_id: 'p-sara', status: 'active', started_at: '2026-08-02T08:00:00Z', trainee: people.sara },
  { id: 'ct-b', trainee_id: 'p-majed', status: 'active', started_at: '2026-07-14T08:00:00Z', trainee: people.majed },
  { id: 'ct-c', trainee_id: 'p-dana', status: 'pending', started_at: null, trainee: people.dana },
];

export const previewLocations = [
  { id: 'l-wadi', name: PLACES.wadi, city: RIYADH, country: 'SA', sports: ['running', 'cycling', 'walking'], image_url: PREVIEW_PHOTOS.wadi, latitude: 24.6405, longitude: 46.6286 },
  { id: 'l-pitch', name: PLACES.pitch, city: RIYADH, country: 'SA', sports: ['football'], image_url: PREVIEW_PHOTOS.pitch, latitude: null, longitude: null },
  { id: 'l-padel', name: PLACES.padel, city: RIYADH, country: 'SA', sports: ['padel', 'tennis'], image_url: PREVIEW_PHOTOS.padelNight, latitude: null, longitude: null },
  { id: 'l-padel-hittin', name: PLACES.padelHittin, city: RIYADH, country: 'SA', sports: ['padel'], image_url: PREVIEW_PHOTOS.padelOutdoor, latitude: null, longitude: null },
  { id: 'l-padel-malqa', name: PLACES.padelMalqa, city: RIYADH, country: 'SA', sports: ['padel'], image_url: PREVIEW_PHOTOS.padelNet, latitude: null, longitude: null },
  { id: 'l-box', name: PLACES.box, city: RIYADH, country: 'SA', sports: ['gym', 'crossfit', 'hyrox'], image_url: PREVIEW_PHOTOS.box, latitude: null, longitude: null },
  { id: 'l-studio', name: PLACES.studio, city: RIYADH, country: 'SA', sports: ['yoga', 'pilates', 'gym'], image_url: PREVIEW_PHOTOS.studio, latitude: null, longitude: null },
  { id: 'l-hoops', name: PLACES.hoops, city: RIYADH, country: 'SA', sports: ['basketball'], image_url: PREVIEW_PHOTOS.hoops, latitude: null, longitude: null },
];

/** Coaches by sport (partners of type coach). */
export const previewCoaches = [
  { id: 'c-faisal', name: L('Coach Faisal', 'المدرب فيصل'), sports: ['padel', 'tennis'], userId: 'p-faisal' },
  { id: 'c-reem', name: L('Coach Reem', 'المدربة ريم'), sports: ['hyrox', 'crossfit', 'gym'], userId: 'p-reem' },
  { id: 'c-lama', name: L('Coach Lama', 'المدربة لمى'), sports: ['yoga', 'pilates'], userId: 'p-lama' },
];

/** Healthy restaurants with a member offer (partners of type nutrition). */
export const previewFood = [
  { id: 'f-1', name: L('Greens & Grains', 'جرينز آند جرينز'), city: RIYADH, logoUrl: img('photo-1512621776951-a57141f2eefd'), url: null, offer: L('15% off bowls for Beast Tribe members', 'خصم 15% على الأطباق لأعضاء بيست ترايب'), code: 'BEAST15' },
  { id: 'f-2', name: L('Protein Kitchen', 'بروتين كتشن'), city: RIYADH, logoUrl: img('photo-1546069901-ba9599a7e63c'), url: null, offer: L('Free shake with any meal after a session', 'شيك مجاني مع أي وجبة بعد التمرين'), code: 'TRIBESHAKE' },
  { id: 'f-3', name: L('Shake Lab', 'شيك لاب'), city: RIYADH, logoUrl: img('photo-1622818426197-d54f85b88690'), url: null, offer: L('Buy one shake, your training partner gets one free', 'اشترِ شيك ويحصل شريك تمرينك على واحد مجانًا'), code: 'CREWSHAKE' },
];

// Train: a few library workouts plus two coaches' workouts, in the database's shape (both languages).
const coachAuthor = (id: string, en: string, ar: string, person: typeof people.reem) => ({
  id, business_name: L(en, ar), name: L(en, ar), logo_url: null, user_id: person.id,
  profile: { id: person.id, display_name: person.display_name, full_name: person.full_name, avatar_url: person.avatar_url },
});
const B = (title: string, title_ar: string, extra: Record<string, any>, items: [string, string, string, string?][]) => ({
  title, title_ar, ...extra,
  items: items.map(([name, name_ar, reps, reps_ar]) => ({ name, name_ar, reps, reps_ar: reps_ar ?? reps })),
});
export function previewWorkoutRows(): any[] {
  const base = (o: any) => ({ description: null, description_ar: null, featured: false, published_at: '2026-09-20T08:00:00Z', community_id: null, community: null, author: null, source: 'library', equipment: [], ...o });
  return [
    base({ id: 'w-engine', title: 'Engine 20', title_ar: 'محرك 20', sport: 'hyrox', format: 'amrap', difficulty: 'advanced', duration_minutes: 35, featured: true,
      equipment: ['rower', 'wall_ball', 'kettlebell'], image_url: img('photo-1540474861915-87c6b849f6d0'),
      description: 'Hyrox-style engine work: twenty minutes, as many rounds as you can. Pace it so the last round looks like the first.',
      description_ar: 'تمرين تحمّل بأسلوب هايروكس: عشرون دقيقة، أكبر عدد ممكن من الجولات. وزّع جهدك لتكون جولتك الأخيرة مثل الأولى.',
      blocks: [
        B('Warm-up', 'إحماء', { format: 'rounds', rounds: 2 }, [['Row', 'تجديف', '250 m', '250 م'], ['Air squats', 'سكوات بوزن الجسم', '10'], ['Push-ups', 'ضغط', '8']]),
        B('Engine', 'المحرك', { format: 'amrap', minutes: 20, note: 'Run 400 m or row 500 m.', note_ar: 'اجرِ 400 م أو جدّف 500 م.' },
          [['Run', 'جري', '400 m', '400 م'], ['Wall balls', 'رمي الكرة على الحائط', '20'], ['Kettlebell swings', 'أرجحة الكيتل بل', '15'], ['Burpees', 'بيربي', '10']]),
        B('Cool-down', 'تهدئة', { format: 'flow', minutes: 5 }, [['Easy walk', 'مشي هادئ', '2 min', '2 د'], ['Child\'s pose', 'وضعية الطفل', '1 min', '1 د']]),
      ] }),
    base({ id: 'w-reem', source: 'coach', title: 'Sled & Run', title_ar: 'زلاجة وجري', sport: 'hyrox', format: 'intervals', difficulty: 'intermediate', duration_minutes: 30,
      equipment: ['sled'], image_url: img('photo-1775322838072-829ad37ab52d'), community_id: 'c-company', community: { id: 'c-company', name: L('My Company', 'شركتي') },
      author: coachAuthor('c-reem', 'Coach Reem', 'المدربة ريم', people.reem),
      description: 'My Tuesday class, for the office crew. Push hard, jog it off, repeat.',
      description_ar: 'حصة الثلاثاء لفريق المكتب. ادفع بقوة، هرول لتستعيد، وكرّر.',
      blocks: [
        B('Warm-up', 'إحماء', { format: 'flow', minutes: 5 }, [['Easy jog', 'هرولة خفيفة', '3 min', '3 د'], ['Leg swings', 'أرجحة الرجل', '10']]),
        B('Sled & run', 'زلاجة وجري', { format: 'intervals', rounds: 6 }, [['Sled push', 'دفع الزلاجة', '60 s', '60 ث'], ['Easy jog', 'هرولة خفيفة', '90 s', '90 ث']]),
      ] }),
    base({ id: 'w-nokit', title: 'No-Kit 15', title_ar: 'بدون معدات 15', sport: 'gym', format: 'emom', difficulty: 'beginner', duration_minutes: 20,
      image_url: img('photo-1787154604266-e29f25f07056'),
      description: 'Fifteen minutes, no equipment, anywhere. A new move every minute on the minute.',
      description_ar: 'خمس عشرة دقيقة بلا معدات وفي أي مكان. حركة جديدة مع بداية كل دقيقة.',
      blocks: [
        B('Every minute', 'كل دقيقة', { format: 'emom', minutes: 15 }, [['Air squats', 'سكوات بوزن الجسم', '12'], ['Push-ups', 'ضغط', '10'], ['Plank', 'بلانك', '30 s', '30 ث'], ['Reverse lunges', 'طعنات خلفية', '6 / side', '6 لكل رجل'], ['Mountain climbers', 'متسلق الجبل', '20']]),
      ] }),
    base({ id: 'w-faisal', source: 'coach', title: 'Padel Footwork', title_ar: 'حركة القدمين في البادل', sport: 'padel', format: 'rounds', difficulty: 'intermediate', duration_minutes: 25,
      image_url: img('photo-1781310370779-9c45ab3f4e04'), author: coachAuthor('c-faisal', 'Coach Faisal', 'المدرب فيصل', people.faisal),
      description: 'The footwork I teach every beginner. Five rounds and you will reach the ball earlier.',
      description_ar: 'حركة القدمين التي أعلّمها لكل مبتدئ. خمس جولات وستصل إلى الكرة أبكر.',
      blocks: [
        B('Footwork', 'حركة القدمين', { format: 'rounds', rounds: 5 }, [['Split step + side shuffle', 'خطوة الانقسام + خطوات جانبية', '10'], ['Crossover to the glass', 'خطوة متقاطعة نحو الزجاج', '6 / side', '6 لكل جهة'], ['Lunge volley reach', 'طعنة للوصول إلى الطائرة', '8']]),
      ] }),
    base({ id: 'w-desk', title: 'Desk Reset 10', title_ar: 'استراحة المكتب 10', sport: 'yoga', format: 'flow', difficulty: 'beginner', duration_minutes: 10,
      image_url: img('photo-1545205597-3d9d02c29597'),
      description: 'Ten minutes to undo a day at the desk. No sweat, no kit, done next to your chair.',
      description_ar: 'عشر دقائق تمحو يومًا على المكتب. بلا تعرّق ولا معدات، بجانب كرسيك.',
      blocks: [
        B('Reset', 'استعادة', { format: 'flow', minutes: 10 }, [['Neck rolls', 'دوران الرقبة', '30 s', '30 ث'], ['Cat-cow', 'القطة والبقرة', '8'], ['Thoracic rotations', 'تدوير الظهر العلوي', '6 / side', '6 لكل جهة'], ['Hip flexor stretch', 'إطالة مثنيات الورك', '30 s', '30 ث']]),
      ] }),
    base({ id: 'w-padel', title: 'Padel Legs', title_ar: 'أرجل البادل', sport: 'padel', format: 'rounds', difficulty: 'intermediate', duration_minutes: 30,
      image_url: img('photo-1709587823553-765b325cc31b'),
      description: 'Quick feet and strong legs for the court: lateral power, landings and short bursts.',
      description_ar: 'خطوات سريعة وأرجل قوية للملعب: قوة جانبية، هبوط ثابت، وانطلاقات قصيرة.',
      blocks: [
        B('Court strength', 'قوة الملعب', { format: 'rounds', rounds: 4 }, [['Lateral lunges', 'طعنات جانبية', '5 / side', '5 لكل جهة'], ['Split-squat jumps', 'قفزات الطعن', '4 / side', '4 لكل رجل'], ['Shuttle runs (5 m)', 'جري مكوكي (5 م)', '6'], ['Calf raises', 'رفع السمانة', '15']]),
      ] }),
  ];
}
