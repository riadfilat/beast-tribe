import React from 'react';
import { View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { Txt } from './Txt';

// One way to show how hard something is, everywhere: 1, 2 or 3 bars and the word.
// Workouts and plans store easy | medium | hard; members read Beginner | Intermediate | Advanced.
export type Lvl = 'easy' | 'medium' | 'hard';
export const LEVELS: Lvl[] = ['easy', 'medium', 'hard'];
export const LEVEL_KEY: Record<Lvl, 'beginner' | 'intermediate' | 'advanced'> = { easy: 'beginner', medium: 'intermediate', hard: 'advanced' };

export function LevelBars({ level, color, size = 11 }: { level: Lvl; color: string; size?: number }) {
  const n = LEVELS.indexOf(level) + 1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: size }} accessibilityElementsHidden importantForAccessibility="no">
      {[0.45, 0.72, 1].map((h, i) => (
        <View key={i} style={{ width: 3, height: Math.round(size * h), borderRadius: 1, backgroundColor: color, opacity: i < n ? 1 : 0.28 }} />
      ))}
    </View>
  );
}

export function LevelTag({ level, solid }: { level: Lvl; solid?: boolean }) {
  const { p } = useKit();
  const { t } = useI18n();
  const c = level === 'easy' ? p.aqua : p.ink;
  const fill = solid || level === 'hard' ? c : 'transparent';
  const text = fill === 'transparent' ? c : p.board;
  const label = t(`plan.levels.${LEVEL_KEY[level]}`);
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: c, backgroundColor: fill, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' }}
    >
      <LevelBars level={level} color={text} size={10} />
      <Txt v="label" size={11} color={text} style={{ letterSpacing: 0.3 }}>
        {label}
      </Txt>
    </View>
  );
}
