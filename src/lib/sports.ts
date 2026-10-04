// Sport registry: one id per sport, drawn with SF Symbols on iOS and a matching
// Ionicons glyph elsewhere. Labels come from i18n (sports.<id> / sportNoun.<id>).

export type SportId =
  | 'running' | 'walking' | 'gym' | 'crossfit' | 'hyrox' | 'cycling' | 'swimming'
  | 'yoga' | 'pilates' | 'football' | 'basketball' | 'tennis' | 'padel' | 'pickleball'
  | 'badminton' | 'volleyball' | 'boxing' | 'mma' | 'hiking' | 'climbing'
  | 'skateboarding' | 'meditation' | 'horse_riding' | 'squash' | 'table_tennis' | 'community' | 'other';

export interface SportDef {
  id: SportId;
  sf: string;
  ion: string;
  /** Name in the Supabase `sports` table (user_sports links by this name) */
  dbName?: string;
}

export const SPORT_LIST: SportDef[] = [
  { id: 'running', sf: 'figure.run', ion: 'walk', dbName: 'Running' },
  { id: 'padel', sf: 'figure.racquetball', ion: 'tennisball', dbName: 'Padel' },
  { id: 'football', sf: 'soccerball', ion: 'football', dbName: 'Football' },
  { id: 'gym', sf: 'dumbbell.fill', ion: 'barbell', dbName: 'Gym' },
  { id: 'basketball', sf: 'basketball.fill', ion: 'basketball', dbName: 'Basketball' },
  { id: 'crossfit', sf: 'figure.cross.training', ion: 'fitness', dbName: 'CrossFit' },
  { id: 'hyrox', sf: 'figure.highintensity.intervaltraining', ion: 'flash', dbName: 'Hyrox' },
  { id: 'cycling', sf: 'figure.outdoor.cycle', ion: 'bicycle', dbName: 'Cycling' },
  { id: 'swimming', sf: 'figure.pool.swim', ion: 'water', dbName: 'Swimming' },
  { id: 'walking', sf: 'figure.walk', ion: 'footsteps', dbName: 'Walking' },
  { id: 'yoga', sf: 'figure.yoga', ion: 'body', dbName: 'Yoga' },
  { id: 'pilates', sf: 'figure.pilates', ion: 'pulse', dbName: 'Pilates' },
  { id: 'tennis', sf: 'tennis.racket', ion: 'tennisball', dbName: 'Tennis' },
  { id: 'pickleball', sf: 'figure.racquetball', ion: 'tennisball', dbName: 'Pickleball' },
  { id: 'badminton', sf: 'figure.badminton', ion: 'tennisball', dbName: 'Badminton' },
  { id: 'volleyball', sf: 'volleyball.fill', ion: 'basketball', dbName: 'Volleyball' },
  { id: 'boxing', sf: 'figure.boxing', ion: 'hand-left', dbName: 'Boxing' },
  { id: 'mma', sf: 'figure.martial.arts', ion: 'shield', dbName: 'MMA' },
  { id: 'hiking', sf: 'figure.hiking', ion: 'trail-sign', dbName: 'Hiking' },
  { id: 'climbing', sf: 'figure.climbing', ion: 'trending-up', dbName: 'Climbing' },
  { id: 'skateboarding', sf: 'figure.skateboarding', ion: 'speedometer', dbName: 'Skate' },
  { id: 'meditation', sf: 'figure.mind.and.body', ion: 'leaf', dbName: 'Meditation' },
  { id: 'horse_riding', sf: 'figure.equestrian.sports', ion: 'paw', dbName: 'Horse Riding' },
  { id: 'squash', sf: 'figure.squash', ion: 'tennisball', dbName: 'Squash' },
  { id: 'table_tennis', sf: 'figure.table.tennis', ion: 'tennisball-outline', dbName: 'Table Tennis' },
];

const EXTRA: SportDef[] = [
  { id: 'community', sf: 'person.3.fill', ion: 'people' },
  { id: 'other', sf: 'person.3.fill', ion: 'people' },
];

const BY_ID: Record<string, SportDef> = {};
[...SPORT_LIST, ...EXTRA].forEach((s) => (BY_ID[s.id] = s));

const ALIASES: Record<string, SportId> = {
  run: 'running', runs: 'running', jog: 'running',
  hiit: 'hyrox', 'group fitness': 'gym', fitness: 'gym',
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
