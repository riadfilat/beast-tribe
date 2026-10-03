import { stepSeconds, WorkoutBlock } from './workouts';

// The guided player walks a workout one exercise at a time. This turns a workout's blocks into
// that walk: rounds are laid out in order, "3 × 10" becomes three sets with a rest between them,
// an every-minute block becomes one step per minute, and an as-many-rounds block is a loop that
// runs until its clock ends.

export interface GuideStep {
  key: string;
  blockIdx: number;
  kind: 'move' | 'rest';
  /** The exercise name; empty for a rest (the screen says "Rest"). */
  name: string;
  /** Exercise library slug, when the move is in the library. */
  ex: string | null;
  /** What to do when it isn't just a clock: "10", "10 / side", "400 m". */
  dose: string | null;
  /** A step with seconds counts down and moves on by itself. */
  secs: number | null;
  note: string | null;
  round: number | null;
  rounds: number | null;
  set: number | null;
  sets: number | null;
  minute: number | null;
  minutes: number | null;
}

export interface GuideBlock {
  idx: number;
  title: string;
  note: string | null;
  format: WorkoutBlock['format'];
  /** Index of the block's first step, and how many steps it has. */
  first: number;
  count: number;
  /** As many rounds as possible: the steps repeat until the clock ends. */
  loop: boolean;
  /** Seconds on the block's clock (the loop's length, or a time cap). */
  limit: number | null;
  /** For time: the block shows a running clock. */
  stopwatch: boolean;
}

export interface Guide {
  steps: GuideStep[];
  blocks: GuideBlock[];
}

const SETS = /^(\d{1,2})\s*[×x]\s*(.+)$/;

/** restOf: seconds to rest between sets of an exercise, when the library knows it. */
export function buildGuide(blocks: WorkoutBlock[], restOf: (slug: string | null) => number | null = () => null): Guide {
  const steps: GuideStep[] = [];
  const out: GuideBlock[] = [];
  const blank = { round: null, rounds: null, set: null, sets: null, minute: null, minutes: null };

  blocks.forEach((b, bi) => {
    const first = steps.length;
    const items = b.items.filter((i) => i.name);
    const loop = b.format === 'amrap' && !!b.minutes;

    if (b.format === 'emom' && b.minutes && items.length) {
      // One step per minute: do the move, rest for what is left of the minute.
      for (let m = 0; m < b.minutes; m++) {
        const it = items[m % items.length];
        steps.push({ ...blank, key: `${bi}-m${m}`, blockIdx: bi, kind: 'move', name: it.name, ex: it.ex, dose: it.reps, secs: 60, note: it.note, minute: m + 1, minutes: b.minutes });
      }
    } else {
      const rounds = loop ? 1 : Math.max(1, Math.round(b.rounds || 1));
      for (let r = 1; r <= rounds; r++) {
        items.forEach((it, ii) => {
          const m = it.reps ? it.reps.trim().match(SETS) : null;
          const n = m ? Number(m[1]) : 1;
          const each = m ? m[2].trim() : it.reps;
          const secs = stepSeconds(each);
          const rest = n > 1 && b.format === 'strength' ? restOf(it.ex) : null;
          for (let s = 1; s <= n; s++) {
            steps.push({
              ...blank,
              key: `${bi}-${r}-${ii}-${s}`,
              blockIdx: bi,
              kind: 'move',
              name: it.name,
              ex: it.ex,
              dose: secs ? null : each,
              secs,
              note: it.note,
              round: rounds > 1 ? r : null,
              rounds: rounds > 1 ? rounds : null,
              set: n > 1 ? s : null,
              sets: n > 1 ? n : null,
            });
            if (rest && s < n) {
              steps.push({ ...blank, key: `${bi}-${r}-${ii}-${s}-rest`, blockIdx: bi, kind: 'rest', name: '', ex: null, dose: null, secs: rest, note: null, set: s, sets: n });
            }
          }
        });
      }
    }

    out.push({
      idx: bi,
      title: b.title,
      note: b.note,
      format: b.format,
      first,
      count: steps.length - first,
      loop,
      limit: (loop || b.format === 'for_time') && b.minutes ? b.minutes * 60 : null,
      stopwatch: b.format === 'for_time',
    });
  });

  return { steps, blocks: out.filter((b) => b.count > 0) };
}

/** The step after `i`, or null when the workout is done. `blockOver`: the block's clock has ended. */
export function nextStep(g: Guide, i: number, blockOver: boolean): { idx: number | null; lapped: boolean } {
  const st = g.steps[i];
  const b = g.blocks.find((x) => x.idx === st.blockIdx)!;
  const end = b.first + b.count;
  let to: number;
  let lapped = false;
  if (b.loop && !blockOver && i === end - 1) {
    to = b.first;
    lapped = true;
  } else if (b.loop && blockOver) {
    to = end;
  } else {
    to = i + 1;
  }
  return { idx: to >= g.steps.length ? null : to, lapped };
}
