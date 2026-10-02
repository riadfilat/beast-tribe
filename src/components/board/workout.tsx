import React from 'react';
import { View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import type { Workout, WorkoutBlock, WorkoutFormat } from '../../data/workouts';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Press } from './Press';
import { Magnet } from './people';
import { Tag } from './marks';

type T = (k: string, v?: any) => string;
type TN = (k: string, n: number, v?: any) => string;

/** "AMRAP 20 min", "5 rounds", "Every minute · 15 min" — how a coach writes it on the board. */
export function blockLine(b: Pick<WorkoutBlock, 'format' | 'minutes' | 'rounds'>, t: T, tn: TN): string {
  const m = b.minutes ?? 0;
  const n = b.rounds ?? 0;
  switch (b.format as WorkoutFormat | null) {
    case 'amrap':
      return t('train.format.amrap', { m });
    case 'emom':
      return t('train.format.emom', { m });
    case 'for_time':
      return m ? t('train.format.for_timeCap', { m }) : t('train.format.for_time');
    case 'rounds':
      return n ? tn('train.format.rounds', n) : '';
    case 'intervals':
      return tn('train.format.intervals', n || 1);
    case 'steady':
      return m ? t('train.format.steady', { m }) : '';
    case 'flow':
      return m ? t('train.format.flow', { m }) : '';
    case 'strength':
      return t('train.format.strength');
    default:
      return '';
  }
}

/** The workout's main piece (the block that carries its format), for list lines. */
export function mainBlock(w: Workout): WorkoutBlock | null {
  return w.blocks.find((b) => b.format === w.format) ?? w.blocks[w.blocks.length > 1 ? 1 : 0] ?? null;
}

export function workoutLine(w: Workout, t: T, tn: TN): string {
  const b = mainBlock(w);
  const line = b ? blockLine(b, t, tn) : '';
  return [line, t(`train.level.${w.level}`)].filter(Boolean).join(' · ');
}

export function equipmentLine(w: Workout, t: T): string {
  if (!w.equipment.length) return t('train.noKit');
  return w.equipment.map((e) => t(`train.equipment.${e}`)).join(' · ');
}

/**
 * A workout on a list: minutes on the leading rail (like a session's time), the title in caps,
 * sport and format under it, and the coach's face when a coach wrote it.
 */
export function WorkoutRow({ w, onPress, last }: { w: Workout; onPress: () => void; last?: boolean }) {
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  return (
    <Press
      onPress={onPress}
      feedback="selection"
      depress={0.99}
      accessibilityRole="button"
      accessibilityLabel={`${w.title}, ${w.minutes} min`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: p.rule }}
    >
      <View style={{ width: 46, alignItems: 'center' }}>
        <Txt v="time" size={22}>
          {w.minutes}
        </Txt>
        <Txt v="caption" size={11} color={p.inkFaint} style={lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.6 } : null}>
          {lang === 'ar' ? 'د' : 'min'}
        </Txt>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt v="row" size={15} numberOfLines={2}>
          {w.title}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon sport={w.sport} size={13} color={p.inkSoft} />
          <Txt v="meta" numberOfLines={1} style={{ flexShrink: 1 }}>
            {workoutLine(w, t, tn)}
          </Txt>
        </View>
        {w.community ? (
          <View style={{ flexDirection: 'row', marginTop: 2 }}>
            <Tag label={w.community.name} tone="aqua" icon="lock" />
          </View>
        ) : null}
      </View>
      {w.coach ? <Magnet person={w.coach} size={32} /> : <Icon name="chevron" size={14} color={p.inkFaint} weight="bold" />}
    </Press>
  );
}

/** One block of the workout as written on the board: heading, format, then each line. */
export function BlockView({ b, highlight }: { b: WorkoutBlock; highlight?: number | null }) {
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const line = blockLine(b, t, tn);
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <Txt v="row" size={16} style={{ flexShrink: 1 }}>
          {b.title}
        </Txt>
        {line ? (
          <Txt v="label" size={13} color={p.inkSoft} style={lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.6 } : null}>
            {line}
          </Txt>
        ) : null}
      </View>
      {b.note ? <Txt v="meta">{b.note}</Txt> : null}
      <View>
        {b.items.map((it, i) => {
          const on = highlight === i;
          return (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                paddingVertical: 9,
                paddingHorizontal: on ? 10 : 0,
                marginHorizontal: on ? -10 : 0,
                borderRadius: 8,
                backgroundColor: on ? p.wash : 'transparent',
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: p.rule,
              }}
            >
              <Txt v="time" size={15} color={on ? p.markerText : p.ink} style={{ width: 86 }} numberOfLines={2}>
                {it.reps || '—'}
              </Txt>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="body" size={16}>
                  {it.name}
                </Txt>
                {it.note ? <Txt v="meta">{it.note}</Txt> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
