import { GLYPHS, GLYPH_FAMILIES } from './glyphs';

// A pack's patch on the web (mirrors src/components/board/Patch.tsx in the app):
// one symbol — a Beast Tribe glyph, an emoji, or the pack's letters — on a brand colourway.

export const PATCH_PAINT: Record<string, { ground: string; ink: string }> = {
  slate: { ground: '#023C3C', ink: '#F4F1EA' },
  dreamer: { ground: '#023C3C', ink: '#56C4C4' },
  seeker: { ground: '#023C3C', ink: '#E88F24' },
  aqua: { ground: '#56C4C4', ink: '#023C3C' },
  orange: { ground: '#E88F24', ink: '#023C3C' },
  chalk: { ground: '#F4F1EA', ink: '#023C3C' },
};
export const PATCH_COLOR_NAMES: Record<string, string> = {
  slate: 'Teal',
  dreamer: 'Teal and aqua',
  seeker: 'Teal and orange',
  aqua: 'Aqua',
  orange: 'Orange',
  chalk: 'Chalk',
};
export const GLYPH_GROUPS = GLYPH_FAMILIES;
export const GLYPH_IDS = Object.keys(GLYPHS);

const LEGACY: Record<string, string> = { eagle: 'falcon', leopard: 'tiger', oryx: 'ibex', phoenix: 'griffin' };
export function glyphId(v?: string | null) {
  const k = (v || '').toLowerCase();
  const id = LEGACY[k] ?? k;
  return GLYPHS[id] ? id : 'wolf';
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  for (const w of words) {
    const letters = Array.from(w).filter((ch) => /[ء-ي]/.test(ch));
    if (!letters.length) continue;
    return { text: letters.length > 3 && letters[0] === 'ا' && letters[1] === 'ل' ? letters[2] : letters[0], arabic: true };
  }
  const latin = words.map((w) => Array.from(w).filter((ch) => /[A-Za-z0-9À-ɏ]/.test(ch))).filter((a) => a.length);
  if (!latin.length) return { text: '', arabic: false };
  return { text: (latin.length >= 2 ? latin[0][0] + latin[1][0] : latin[0][0]).toUpperCase(), arabic: false };
}

export interface PatchRow {
  id: string;
  name: string;
  animal?: string | null;
  emblem_kind?: string | null;
  emblem_value?: string | null;
  emblem_color?: string | null;
}

export function PackPatch({ pack, size }: { pack: PatchRow; size: number }) {
  const paint = PATCH_PAINT[pack.emblem_color ?? ''] ?? PATCH_PAINT.slate;
  const edge = paint.ground === '#023C3C' ? 'rgba(244,241,234,0.32)' : paint.ground === '#F4F1EA' ? 'rgba(2,60,60,0.30)' : null;
  const ini = pack.emblem_kind === 'letters' ? initials(pack.name) : null;
  const round = { width: size, height: size, borderRadius: '50%', background: paint.ground, boxShadow: edge ? `inset 0 0 0 1.5px ${edge}` : undefined };

  if (pack.emblem_kind === 'emoji' && pack.emblem_value) {
    return (
      <span aria-hidden className="inline-grid place-items-center shrink-0 overflow-hidden" style={{ ...round, fontSize: size * 0.54, lineHeight: 1 }}>
        {pack.emblem_value}
      </span>
    );
  }
  if (ini?.text) {
    return (
      <span aria-hidden className="inline-grid place-items-center shrink-0 overflow-hidden font-black" style={{ ...round, color: paint.ink, fontSize: size * 0.4, lineHeight: 1, letterSpacing: 0.5 }}>
        {ini.text}
      </span>
    );
  }
  const g = GLYPHS[glyphId(pack.emblem_value ?? pack.animal)];
  const [tx, ty, s] = g.t;
  const clip = `pp-${pack.id}-${size}`;
  const edgeW = (1.5 * 100) / size;
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="50" fill={paint.ground} />
      <g clipPath={`url(#${clip})`}>
        <g transform={`translate(${tx} ${ty}) scale(${s})`}>
          <path d={g.d} fill={paint.ink} />
        </g>
      </g>
      {edge ? <circle cx="50" cy="50" r={50 - edgeW / 2} fill="none" stroke={edge} strokeWidth={edgeW} /> : null}
    </svg>
  );
}
