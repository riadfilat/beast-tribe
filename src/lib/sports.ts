// Sport registry: one id per sport, drawn with SF Symbols on iOS and a matching
// Material Community Icons glyph elsewhere (each pair checked by eye: the sport's own figure or gear).
// Labels come from i18n (sports.<id> / sportNoun.<id>).

export type SportId =
  | 'running' | 'walking' | 'gym' | 'crossfit' | 'hyrox' | 'cycling' | 'swimming'
  | 'yoga' | 'pilates' | 'football' | 'basketball' | 'tennis' | 'padel' | 'pickleball'
  | 'badminton' | 'volleyball' | 'boxing' | 'mma' | 'hiking' | 'climbing'
  | 'skateboarding' | 'meditation' | 'horse_riding' | 'squash' | 'table_tennis'
  | 'calisthenics' | 'lagree' | 'spinning' | 'bootcamp' | 'barre' | 'dance' | 'muay_thai' | 'jiu_jitsu' | 'golf' | 'diving'
  | 'community' | 'other';

export interface SportDef {
  id: SportId;
  sf: string;
  /** Material Community Icons glyph (Android and web) */
  mci: string;
  /** Name in the Supabase `sports` table (user_sports links by this name) */
  dbName?: string;
}

export const SPORT_LIST: SportDef[] = [
  { id: 'running', sf: 'figure.run', mci: 'run-fast', dbName: 'Running' },
  { id: 'padel', sf: 'figure.pickleball', mci: 'racquetball', dbName: 'Padel' },
  { id: 'football', sf: 'soccerball', mci: 'soccer', dbName: 'Football' },
  { id: 'gym', sf: 'dumbbell.fill', mci: 'dumbbell', dbName: 'Gym' },
  { id: 'basketball', sf: 'basketball.fill', mci: 'basketball', dbName: 'Basketball' },
  { id: 'crossfit', sf: 'figure.cross.training', mci: 'weight-lifter', dbName: 'CrossFit' },
  { id: 'hyrox', sf: 'figure.strengthtraining.functional', mci: 'kettlebell', dbName: 'Hyrox' },
  { id: 'cycling', sf: 'figure.outdoor.cycle', mci: 'bike', dbName: 'Cycling' },
  { id: 'swimming', sf: 'figure.pool.swim', mci: 'swim', dbName: 'Swimming' },
  { id: 'walking', sf: 'figure.walk', mci: 'walk', dbName: 'Walking' },
  { id: 'yoga', sf: 'figure.yoga', mci: 'yoga', dbName: 'Yoga' },
  { id: 'pilates', sf: 'figure.pilates', mci: 'human-handsup', dbName: 'Pilates' },
  { id: 'tennis', sf: 'tennis.racket', mci: 'tennis', dbName: 'Tennis' },
  { id: 'pickleball', sf: 'figure.pickleball', mci: 'racquetball', dbName: 'Pickleball' },
  { id: 'badminton', sf: 'figure.badminton', mci: 'badminton', dbName: 'Badminton' },
  { id: 'volleyball', sf: 'volleyball.fill', mci: 'volleyball', dbName: 'Volleyball' },
  { id: 'boxing', sf: 'figure.boxing', mci: 'boxing-glove', dbName: 'Boxing' },
  { id: 'mma', sf: 'figure.martial.arts', mci: 'gymnastics', dbName: 'MMA' },
  { id: 'hiking', sf: 'figure.hiking', mci: 'hiking', dbName: 'Hiking' },
  { id: 'climbing', sf: 'figure.climbing', mci: 'carabiner', dbName: 'Climbing' },
  { id: 'skateboarding', sf: 'figure.skateboarding', mci: 'skateboarding', dbName: 'Skate' },
  { id: 'meditation', sf: 'figure.mind.and.body', mci: 'meditation', dbName: 'Meditation' },
  { id: 'horse_riding', sf: 'figure.equestrian.sports', mci: 'horse-human', dbName: 'Horse Riding' },
  { id: 'squash', sf: 'figure.squash', mci: 'tennis', dbName: 'Squash' },
  { id: 'table_tennis', sf: 'figure.table.tennis', mci: 'table-tennis', dbName: 'Table Tennis' },
  { id: 'calisthenics', sf: 'figure.gymnastics', mci: 'arm-flex', dbName: 'Calisthenics' },
  { id: 'lagree', sf: 'figure.core.training', mci: 'fire', dbName: 'Lagree' },
  { id: 'spinning', sf: 'figure.indoor.cycle', mci: 'bike-fast', dbName: 'Spinning' },
  { id: 'bootcamp', sf: 'figure.mixed.cardio', mci: 'timer', dbName: 'Bootcamp' },
  { id: 'barre', sf: 'figure.barre', mci: 'shoe-ballet', dbName: 'Barre' },
  { id: 'dance', sf: 'figure.dance', mci: 'dance-ballroom', dbName: 'Dance' },
  { id: 'muay_thai', sf: 'figure.kickboxing', mci: 'karate', dbName: 'Muay Thai' },
  { id: 'jiu_jitsu', sf: 'figure.wrestling', mci: 'kabaddi', dbName: 'Jiu-Jitsu' },
  { id: 'golf', sf: 'figure.golf', mci: 'golf', dbName: 'Golf' },
  { id: 'diving', sf: 'figure.open.water.swim', mci: 'diving-scuba', dbName: 'Diving' },
];

/** Most played first (Saudi Arabia): the order of the "all sports" lists. */
export const SPORT_POPULARITY: SportId[] = [
  'football', 'padel', 'running', 'walking', 'gym', 'basketball', 'swimming', 'cycling', 'tennis', 'volleyball',
  'crossfit', 'hyrox', 'yoga', 'pilates', 'calisthenics', 'spinning', 'bootcamp', 'boxing', 'lagree', 'hiking',
  'muay_thai', 'jiu_jitsu', 'badminton', 'squash', 'golf', 'dance', 'barre', 'table_tennis', 'pickleball',
  'mma', 'climbing', 'diving', 'horse_riding', 'skateboarding', 'meditation',
];
/** Every sport, most popular first (any sport not ranked goes last). */
export function sportsByPopularity(): SportDef[] {
  const rank = (id: string) => {
    const i = SPORT_POPULARITY.indexOf(id as SportId);
    return i < 0 ? 999 : i;
  };
  return [...SPORT_LIST].sort((a, b) => rank(a.id) - rank(b.id));
}

const EXTRA: SportDef[] = [
  { id: 'community', sf: 'person.3.fill', mci: 'account-group' },
  { id: 'other', sf: 'person.3.fill', mci: 'account-group' },
];

const BY_ID: Record<string, SportDef> = {};
[...SPORT_LIST, ...EXTRA].forEach((s) => (BY_ID[s.id] = s));

const ALIASES: Record<string, SportId> = {
  run: 'running', runs: 'running', jog: 'running',
  hiit: 'bootcamp', 'boot camp': 'bootcamp', 'group fitness': 'gym', fitness: 'gym',
  spin: 'spinning', 'indoor cycling': 'spinning', zumba: 'dance', 'muay thai': 'muay_thai', muaythai: 'muay_thai', kickboxing: 'muay_thai',
  bjj: 'jiu_jitsu', jiujitsu: 'jiu_jitsu', 'jiu jitsu': 'jiu_jitsu', 'jiu-jitsu': 'jiu_jitsu', scuba: 'diving', 'street workout': 'calisthenics', megaformer: 'lagree',
  soccer: 'football', skate: 'skateboarding', skating: 'skateboarding',
  'horse riding': 'horse_riding', horseback: 'horse_riding', 'horseback riding': 'horse_riding', equestrian: 'horse_riding', riding: 'horse_riding',
  'table tennis': 'table_tennis', 'ping pong': 'table_tennis', pingpong: 'table_tennis',
};

/** Normalise any event_type / sport name coming from the database. */
export function sportIdOf(raw?: string | null): SportId {
  if (!raw) return 'other';
  const k = raw.trim().toLowerCase();
  if (BY_ID[k]) return k as SportId;
  if (ALIASES[k]) return ALIASES[k];
  const byDb = SPORT_LIST.find((s) => s.dbName?.toLowerCase() === k);
  return byDb ? byDb.id : 'other';
}

export function sportDef(id: SportId | string): SportDef {
  return BY_ID[sportIdOf(id)] ?? BY_ID.other;
}
