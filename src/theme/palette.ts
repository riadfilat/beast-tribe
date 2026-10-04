// The Box Board — two real gym boards.
// Slate: the deep-teal chalkboard (brand field). Whiteboard: the dry-erase board.
// Every text token below is contrast-checked against `board` (≥4.5:1 unless noted).

export type BoardAppearance = 'slate' | 'whiteboard';

export interface Palette {
  appearance: BoardAppearance;
  isDark: boolean;
  /** Screen ground */
  board: string;
  /** Tab bar, headers that sit above scrolling content */
  boardDeep: string;
  /** Modal sheets and menus */
  sheet: string;
  /** Primary ink: chalk on slate, marker ink on whiteboard */
  ink: string;
  /** Secondary text */
  inkSoft: string;
  /** Tertiary text (still ≥4.5:1) */
  inkFaint: string;
  /** Erased: past sessions, decoration only (not for text that must be read) */
  ghost: string;
  /** Hairline rules between rows */
  rule: string;
  /** Day dividers, focused outlines */
  ruleStrong: string;
  /** Faint fill for pressed rows, inputs, magnets */
  wash: string;
  /** The orange marker — only for what is yours, what is live, and the act of joining */
  marker: string;
  /** Orange when used as text on the board */
  markerText: string;
  /** Text/icons sitting on a marker fill */
  onMarker: string;
  /** Aqua marker — packs and links */
  aqua: string;
  /** Coral marker — women-only */
  coral: string;
  /** Red strike — cancelled, destructive */
  danger: string;
  /** Scrim over photography, top → bottom */
  scrim: [string, string];
  /** Status bar content */
  statusBar: 'light-content' | 'dark-content';
}

// Brand values from the Operation Beast Guideline: Deep Teal #023C3C, Orange #E88F24
// (spot color only: CTA fills and the circle), Aqua #56C4C4, Light Gray #F2F0EE.
export const SLATE: Palette = {
  appearance: 'slate',
  isDark: true,
  board: '#023C3C',
  boardDeep: '#013131',
  sheet: '#034E4E',
  ink: '#F4F1EA', // 10.9:1
  inkSoft: 'rgba(244,241,234,0.74)', // 6.7:1
  inkFaint: 'rgba(244,241,234,0.60)', // 4.9:1
  ghost: 'rgba(244,241,234,0.30)',
  rule: 'rgba(244,241,234,0.13)',
  ruleStrong: 'rgba(244,241,234,0.32)',
  wash: 'rgba(244,241,234,0.07)',
  marker: '#E88F24', // 4.9:1 on the board
  markerText: '#E88F24',
  onMarker: '#023C3C', // teal on orange, 5.5:1 (brand pairing)
  aqua: '#56C4C4', // 5.9:1
  coral: '#EF8C86', // 5.1:1
  danger: '#FF7A70', // 4.8:1
  scrim: ['rgba(2,60,60,0.30)', 'rgba(2,60,60,0.88)'],
  statusBar: 'light-content',
};

export const WHITEBOARD: Palette = {
  appearance: 'whiteboard',
  isDark: false,
  board: '#F2F0EE',
  boardDeep: '#E8E5E1',
  sheet: '#FFFFFF',
  ink: '#023C3C', // 10.8:1 — brand teal as marker ink
  inkSoft: 'rgba(2,60,60,0.76)', // 5.5:1
  inkFaint: 'rgba(2,60,60,0.72)', // 5.0:1
  ghost: 'rgba(2,60,60,0.26)',
  rule: 'rgba(2,60,60,0.12)',
  ruleStrong: 'rgba(2,60,60,0.30)',
  wash: 'rgba(2,60,60,0.05)',
  marker: '#E88F24', // fills and the circle only — never small text on light
  markerText: '#023C3C',
  onMarker: '#023C3C',
  aqua: '#147070', // 5.2:1 on the board, 4.7:1 on bars (brand aqua is fill-only on light)
  coral: '#B23C35', // 5.2:1
  danger: '#B3261E', // 5.9:1
  scrim: ['rgba(2,60,60,0.25)', 'rgba(2,60,60,0.85)'],
  statusBar: 'dark-content',
};

export const PALETTES: Record<BoardAppearance, Palette> = {
  slate: SLATE,
  whiteboard: WHITEBOARD,
};
