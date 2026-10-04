// Workouts as the admin and the partner portal write them: the same shape the app reads
// (workouts.blocks), checked here before anything reaches the database.

export const SPORTS: [string, string][] = [
  ['hyrox', 'Hyrox'], ['crossfit', 'CrossFit'], ['gym', 'Gym'], ['running', 'Running'], ['walking', 'Walking'],
  ['cycling', 'Cycling'], ['swimming', 'Swimming'], ['yoga', 'Yoga'], ['pilates', 'Pilates'], ['padel', 'Padel'],
  ['tennis', 'Tennis'], ['football', 'Football'], ['basketball', 'Basketball'], ['boxing', 'Boxing'], ['mma', 'MMA'],
  ['hiking', 'Hiking'], ['climbing', 'Climbing'], ['meditation', 'Meditation'], ['horse_riding', 'Horse riding'], ['squash', 'Squash'], ['table_tennis', 'Table tennis'],
];

export const FORMATS: [string, string][] = [
  ['amrap', 'AMRAP — as many rounds as possible in N min'],
  ['emom', 'EMOM — a move every minute for N min'],
  ['for_time', 'For time — finish the rounds, optional time cap'],
  ['rounds', 'Rounds — N rounds at your pace'],
  ['intervals', 'Intervals — timed steps (e.g. 3 min / 90 s) × N'],
  ['steady', 'Steady — one effort for N min'],
  ['flow', 'Flow — timed steps one after another'],
  ['strength', 'Strength — sets × reps'],
];

export const LEVELS: [string, string][] = [
  ['beginner', 'Easy'], ['intermediate', 'Medium'], ['advanced', 'Hard'], ['all_levels', 'All levels'],
];

export const EQUIPMENT: [string, string][] = [
  ['rower', 'Rower'], ['wall_ball', 'Wall ball'], ['kettlebell', 'Kettlebell'], ['barbell', 'Barbell'],
  ['dumbbells', 'Dumbbells'], ['bike', 'Bike'], ['sled', 'Sled'], ['jump_rope', 'Jump rope'], ['box', 'Box'],
  ['bench', 'Bench'], ['band', 'Band'], ['mat', 'Mat'],
];

export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  pending: { label: 'In review', className: 'bg-yellow-100 text-yellow-800' },
  published: { label: 'Live', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Needs changes', className: 'bg-red-100 text-red-700' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-400' },
};

export interface EditorItem {
  name: string;
  name_ar: string;
  reps: string;
  reps_ar: string;
  note: string;
  note_ar: string;
}
export interface EditorBlock {
  title: string;
  title_ar: string;
  format: string;
  minutes: string;
  rounds: string;
  note: string;
  note_ar: string;
  items: EditorItem[];
}

export const emptyItem = (): EditorItem => ({ name: '', name_ar: '', reps: '', reps_ar: '', note: '', note_ar: '' });
export const emptyBlock = (title = ''): EditorBlock => ({ title, title_ar: '', format: '', minutes: '', rounds: '', note: '', note_ar: '', items: [emptyItem()] });

/** Blocks from the database into editor state (strings everywhere, nothing undefined). */
export function toEditorBlocks(raw: any): EditorBlock[] {
  if (!Array.isArray(raw) || raw.length === 0) return [emptyBlock('Warm-up'), emptyBlock('Main'), emptyBlock('Cool-down')];
  const s = (v: any) => (v == null ? '' : String(v));
  return raw.map((b: any) => ({
    title: s(b.title), title_ar: s(b.title_ar), format: s(b.format), minutes: s(b.minutes), rounds: s(b.rounds),
    note: s(b.note), note_ar: s(b.note_ar),
    items: (Array.isArray(b.items) && b.items.length ? b.items : [{}]).map((i: any) => ({
      name: s(i.name), name_ar: s(i.name_ar), reps: s(i.reps), reps_ar: s(i.reps_ar), note: s(i.note), note_ar: s(i.note_ar),
    })),
  }));
}

const clip = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const numIn = (v: unknown, min: number, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const has = (list: [string, string][], v: string) => list.some(([k]) => k === v);

export class WorkoutFormError extends Error {}

/** Read and check the editor's form. Throws a WorkoutFormError with a readable message. */
export function readWorkoutForm(fd: FormData) {
  const title = clip(fd.get('title'), 80);
  if (!title) throw new WorkoutFormError('Give the workout a title.');
  const sport = clip(fd.get('sport'), 30);
  if (!has(SPORTS, sport)) throw new WorkoutFormError('Pick a sport.');
  const difficulty = clip(fd.get('difficulty'), 20);
  if (!has(LEVELS, difficulty)) throw new WorkoutFormError('Pick a level.');
  const duration = numIn(fd.get('duration_minutes'), 5, 240);
  if (!duration) throw new WorkoutFormError('Length must be between 5 and 240 minutes.');
  const format = clip(fd.get('format'), 20);
  const imageUrl = clip(fd.get('image_url'), 500);
  if (imageUrl && !/^https:\/\/\S+$/.test(imageUrl)) throw new WorkoutFormError('The photo must be an https:// link.');

  let rawBlocks: any[] = [];
  try {
    rawBlocks = JSON.parse(String(fd.get('blocks') || '[]'));
  } catch {
    throw new WorkoutFormError('The workout blocks could not be read. Try again.');
  }
  const blocks = (Array.isArray(rawBlocks) ? rawBlocks : [])
    .slice(0, 8)
    .map((b: any) => {
      const f = clip(b?.format, 20);
      const items = (Array.isArray(b?.items) ? b.items : [])
        .slice(0, 20)
        .map((i: any) => ({
          name: clip(i?.name, 80), name_ar: clip(i?.name_ar, 80) || undefined,
          reps: clip(i?.reps, 30) || undefined, reps_ar: clip(i?.reps_ar, 30) || undefined,
          note: clip(i?.note, 120) || undefined, note_ar: clip(i?.note_ar, 120) || undefined,
        }))
        .filter((i: any) => i.name);
      return {
        title: clip(b?.title, 60), title_ar: clip(b?.title_ar, 60) || undefined,
        format: has(FORMATS, f) ? f : undefined,
        minutes: numIn(b?.minutes, 1, 180) ?? undefined,
        rounds: numIn(b?.rounds, 1, 50) ?? undefined,
        note: clip(b?.note, 200) || undefined, note_ar: clip(b?.note_ar, 200) || undefined,
        items,
      };
    })
    .filter((b) => b.title && b.items.length);
  if (!blocks.length) throw new WorkoutFormError('Add at least one block with one movement.');
  for (const b of blocks) {
    if ((b.format === 'amrap' || b.format === 'emom') && !b.minutes) throw new WorkoutFormError(`"${b.title}" needs its minutes (${b.format.toUpperCase()}).`);
  }

  const equipment = fd.getAll('equipment').map(String).filter((e) => has(EQUIPMENT, e));
  const community = clip(fd.get('community_id'), 40);

  return {
    title,
    title_ar: clip(fd.get('title_ar'), 80) || null,
    description: clip(fd.get('description'), 600) || null,
    description_ar: clip(fd.get('description_ar'), 600) || null,
    sport,
    difficulty,
    duration_minutes: duration,
    format: has(FORMATS, format) ? format : (blocks.find((b) => b.format)?.format ?? null),
    equipment,
    image_url: imageUrl || null,
    community_id: /^[0-9a-f-]{36}$/.test(community) ? community : null,
    blocks: JSON.parse(JSON.stringify(blocks)), // drop undefined keys
  };
}

/** The month a payout covers, as [start, end) in Riyadh time (UTC+3). */
export function monthRange(month?: string | null) {
  const now = new Date(Date.now() + 3 * 3600000);
  const m = /^(\d{4})-(\d{2})$/.exec(month || '');
  const y = m ? Number(m[1]) : now.getUTCFullYear();
  const mo = m ? Number(m[2]) - 1 : now.getUTCMonth();
  const start = new Date(Date.UTC(y, mo, 1) - 3 * 3600000);
  const end = new Date(Date.UTC(y, mo + 1, 1) - 3 * 3600000);
  const key = `${y}-${String(mo + 1).padStart(2, '0')}`;
  const label = new Date(Date.UTC(y, mo, 15)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const prev = new Date(Date.UTC(y, mo - 1, 15));
  const next = new Date(Date.UTC(y, mo + 1, 15));
  const k = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  return { start, end, key, label, prev: k(prev), next: k(next) };
}

export interface CoachPay {
  mode: 'rate' | 'pool';
  rate_sar: number;
  pool_sar: number;
}

/** What each coach is owed for a month: per counted use, or a share of a fixed pool. */
export function payoutFor(uses: number, totalUses: number, pay: CoachPay) {
  if (pay.mode === 'pool') return totalUses > 0 ? (pay.pool_sar * uses) / totalUses : 0;
  return uses * pay.rate_sar;
}
