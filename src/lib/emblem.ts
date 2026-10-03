// A pack's patch: one symbol on one of six brand colourways.
// Symbols are glyphs (beasts, myths, marks), any emoji, or the pack's letters.
import { GLYPHS, GLYPH_FAMILIES, GlyphFamily } from '../components/brand/glyphs';

export type PatchColor = 'slate' | 'dreamer' | 'seeker' | 'aqua' | 'orange' | 'chalk' | 'blush' | 'rose';
export const PATCH_COLORS: PatchColor[] = ['slate', 'dreamer', 'seeker', 'aqua', 'orange', 'chalk', 'blush', 'rose'];

export type EmblemKind = 'glyph' | 'emoji' | 'letters';
export interface Emblem {
  kind: EmblemKind;
  /** Glyph id or the emoji; null for letters (they come from the pack's name). */
  value: string | null;
  color: PatchColor;
}

const TEAL = '#023C3C';
const CHALK = '#F4F1EA';
/** Ground and ink of each colourway; anything written on orange or aqua is teal. */
export const PATCH_PAINT: Record<PatchColor, { ground: string; ink: string }> = {
  slate: { ground: TEAL, ink: CHALK },
  dreamer: { ground: TEAL, ink: '#56C4C4' },
  seeker: { ground: TEAL, ink: '#E88F24' },
  aqua: { ground: '#56C4C4', ink: TEAL },
  orange: { ground: '#E88F24', ink: TEAL },
  chalk: { ground: CHALK, ink: TEAL },
  // Pink: on teal (blush) or as the ground (rose).
  blush: { ground: TEAL, ink: '#F2A7C3' },
  rose: { ground: '#F2A7C3', ink: TEAL },
};

// Ids from earlier drawings: the eagle became the falcon; leopard, oryx and phoenix were retired.
const LEGACY: Record<string, string> = { eagle: 'falcon', leopard: 'tiger', oryx: 'ibex', phoenix: 'griffin' };

export function glyphId(value?: string | null): string {
  const v = (value || '').toLowerCase();
  const id = LEGACY[v] ?? v;
  return GLYPHS[id] ? id : 'wolf';
}

export function familyOf(id: string): GlyphFamily {
  return (Object.keys(GLYPH_FAMILIES) as GlyphFamily[]).find((f) => GLYPH_FAMILIES[f].includes(id)) ?? 'beasts';
}

/** Reads a packs row (emblem_* columns, falling back to the legacy `animal`). */
export function emblemOf(row?: { emblem_kind?: string | null; emblem_value?: string | null; emblem_color?: string | null; animal?: string | null } | null): Emblem {
  const color = (PATCH_COLORS as string[]).includes(row?.emblem_color ?? '') ? (row!.emblem_color as PatchColor) : 'slate';
  if (row?.emblem_kind === 'emoji' && row.emblem_value) return { kind: 'emoji', value: row.emblem_value, color };
  if (row?.emblem_kind === 'letters') return { kind: 'letters', value: null, color };
  return { kind: 'glyph', value: glyphId(row?.emblem_value ?? row?.animal), color };
}

/** Columns for an insert/update; `animal` mirrors the glyph for older readers. */
export function emblemColumns(e: Emblem) {
  return {
    emblem_kind: e.kind,
    emblem_value: e.kind === 'letters' ? null : e.kind === 'glyph' ? glyphId(e.value) : e.value,
    emblem_color: e.color,
    ...(e.kind === 'glyph' ? { animal: glyphId(e.value) } : {}),
  };
}

/** A new pack starts on a random beast, on one of the calmer colourways. */
export function randomEmblem(): Emblem {
  const beasts = GLYPH_FAMILIES.beasts;
  const colors: PatchColor[] = ['slate', 'dreamer', 'aqua', 'chalk'];
  return { kind: 'glyph', value: beasts[Math.floor(Math.random() * beasts.length)], color: colors[Math.floor(Math.random() * colors.length)] };
}

const ARABIC_LETTER = /[ء-ي]/;
const LATIN = /[A-Za-z0-9À-ɏ]/;

/**
 * Letters for the patch: two initials for Latin names ("Dawn Patrol" → DP), one letter for
 * Arabic names (initials don't pair in Arabic), skipping the article: "الذئاب" → ذ.
 */
export function packInitials(name: string): { text: string; arabic: boolean } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  for (const w of words) {
    const letters = Array.from(w).filter((ch) => ARABIC_LETTER.test(ch));
    if (!letters.length) continue;
    const i = letters.length > 3 && letters[0] === 'ا' && letters[1] === 'ل' ? 2 : 0;
    return { text: letters[i], arabic: true };
  }
  const latin = words.map((w) => Array.from(w).filter((ch) => LATIN.test(ch))).filter((a) => a.length);
  if (!latin.length) return { text: '', arabic: false };
  const text = latin.length >= 2 ? latin[0][0] + latin[1][0] : latin[0][0];
  return { text: text.toUpperCase(), arabic: false };
}

function startsEmoji(cp: number, next?: string) {
  if (cp >= 0x1f000 && cp <= 0x1faff) return true;
  if ((cp >= 0x2600 && cp <= 0x27bf) || (cp >= 0x2b00 && cp <= 0x2bff) || (cp >= 0x2300 && cp <= 0x23ff)) return true;
  const vs = next === '️';
  if (cp >= 0x2190 && cp <= 0x21ff) return vs;
  if ([0xa9, 0xae, 0x203c, 0x2049, 0x2122, 0x2139, 0x3030, 0x303d, 0x3297, 0x3299].includes(cp)) return vs;
  if ((cp >= 0x30 && cp <= 0x39) || cp === 0x23 || cp === 0x2a) return vs || next === '⃣';
  return false;
}

/** The first emoji in what was typed (keeps skin tones, ZWJ sequences, flags and keycaps whole). */
export function firstEmoji(text: string): string | null {
  const cps = Array.from(text);
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i].codePointAt(0)!;
    if (!startsEmoji(cp, cps[i + 1])) continue;
    let out = cps[i];
    let j = i + 1;
    if (cp >= 0x1f1e6 && cp <= 0x1f1ff) {
      const c2 = cps[j]?.codePointAt(0) ?? 0;
      return c2 >= 0x1f1e6 && c2 <= 0x1f1ff ? out + cps[j] : out;
    }
    while (j < cps.length) {
      const c = cps[j].codePointAt(0)!;
      if (c === 0xfe0f || c === 0x20e3 || (c >= 0x1f3fb && c <= 0x1f3ff) || (c >= 0xe0020 && c <= 0xe007f)) {
        out += cps[j];
        j++;
      } else if (c === 0x200d && j + 1 < cps.length) {
        out += cps[j] + cps[j + 1];
        j += 2;
      } else break;
    }
    return out.length <= 24 ? out : null;
  }
  return null;
}

/** A short, sporty starting list for the emoji tab. */
export const PATCH_EMOJI = ['🔥', '⚡️', '💪', '🏆', '🎯', '🏃', '🚴', '🏊', '🧗', '🏋️', '🥊', '🏀', '⚽️', '🎾', '🏐', '⛰️', '🌊', '🌅', '🌙', '⭐️'];
