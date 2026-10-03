import React from 'react';
import { TextInput, View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import type { WorkoutBlock } from '../../data/workouts';
import type { Exercise } from '../../data/exercises';
import { History, parsePrescription, suggestion } from '../../data/sets';
import { Txt } from './Txt';
import { TextButton } from './controls';

export interface SetEntry {
  exercise: string;
  name: string;
  loaded: boolean;
  target: number | null;
  prescription: string;
  sets: { reps: string; kg: string }[];
}

/** The strength moves of a workout (with their prescriptions), ready to log set by set. */
export function buildEntries(blocks: WorkoutBlock[], lib: Map<string, Exercise> | undefined): SetEntry[] {
  if (!lib) return [];
  const seen = new Set<string>();
  const out: SetEntry[] = [];
  for (const b of blocks) {
    if (b.format !== 'strength' && b.format !== 'rounds') continue;
    for (const it of b.items) {
      const ex = it.ex ? lib.get(it.ex) : null;
      if (!ex || seen.has(ex.slug)) continue;
      if (ex.tracking !== 'reps' && ex.tracking !== 'reps_weight') continue;
      seen.add(ex.slug);
      const rx = parsePrescription(it.reps, b.format === 'rounds' ? b.rounds : null);
      out.push({
        exercise: ex.slug,
        name: ex.name,
        loaded: ex.tracking === 'reps_weight',
        target: rx.reps,
        prescription: it.reps || '',
        sets: Array.from({ length: rx.sets }, () => ({ reps: rx.reps ? String(rx.reps) : '', kg: '' })),
      });
    }
  }
  return out;
}

/** Fill empty fields with the suggested next step from last time. */
export function prefill(entries: SetEntry[], hist: Map<string, History>): SetEntry[] {
  return entries.map((e) => {
    const h = hist.get(e.exercise);
    const sug = h ? suggestion(h.last, e.target, e.loaded) : null;
    if (!sug) return e;
    return {
      ...e,
      sets: e.sets.map((s, i) => ({
        reps: sug.reps != null ? String(sug.reps) : s.reps,
        kg: s.kg || (e.loaded ? String(sug.kg ?? h?.last[i]?.kg ?? h?.last[h.last.length - 1]?.kg ?? '') : ''),
      })),
    };
  });
}

function lastLine(h: History | undefined, loaded: boolean) {
  if (!h?.last.length) return '';
  const reps = h.last.map((s) => s.reps ?? 0);
  const kg = h.last.reduce((m, s) => Math.max(m, s.kg ?? 0), 0);
  const same = reps.every((r) => r === reps[0]);
  const repsTxt = same ? `${reps.length} × ${reps[0]}` : reps.join(', ');
  return loaded && kg ? `${repsTxt} @ ${kg} kg` : repsTxt;
}

export function SetLogger({ entries, onChange, history }: { entries: SetEntry[]; onChange: (e: SetEntry[]) => void; history: Map<string, History> }) {
  const { p } = useKit();
  const { t } = useI18n();
  const update = (ei: number, si: number, key: 'reps' | 'kg', v: string) => {
    const clean = v.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(',', '.').replace(/[^0-9.]/g, '');
    onChange(entries.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : { ...s, [key]: clean })) })));
  };
  const addSet = (ei: number) =>
    onChange(entries.map((e, i) => (i !== ei ? e : { ...e, sets: [...e.sets, { ...(e.sets[e.sets.length - 1] ?? { reps: '', kg: '' }) }] })));
  const input = {
    minWidth: 64,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: p.ruleStrong,
    backgroundColor: p.wash,
    color: p.ink,
    fontSize: 16,
    textAlign: 'center' as const,
  };
  if (!entries.length) return null;
  return (
    <View style={{ gap: 14 }}>
      <Txt v="title" size={17}>
        {t('train.sets.title')}
      </Txt>
      {entries.map((e, ei) => {
        const h = history.get(e.exercise);
        const sug = h ? suggestion(h.last, e.target, e.loaded) : null;
        return (
          <View key={e.exercise} style={{ gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: p.rule }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Txt v="row" size={15} style={{ flex: 1 }} numberOfLines={1}>
                {e.name}
              </Txt>
              <Txt v="label" size={13} color={p.inkSoft}>
                {e.prescription}
              </Txt>
            </View>
            {h ? (
              <Txt v="meta">
                {[t('train.sets.last', { sets: lastLine(h, e.loaded) }), sug ? (sug.up && sug.kg ? t('train.sets.tryKg', { kg: sug.kg, reps: sug.reps ?? '' }) : t('train.sets.tryReps', { reps: sug.reps ?? '' })) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Txt>
            ) : null}
            {e.sets.map((s, si) => (
              <View key={si} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Txt v="label" size={13} color={p.inkSoft} style={{ width: 52 }}>
                  {t('train.sets.set', { n: si + 1 })}
                </Txt>
                {e.loaded ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TextInput value={s.kg} onChangeText={(v) => update(ei, si, 'kg', v)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={p.inkFaint} style={input} accessibilityLabel={`${e.name} ${t('train.sets.set', { n: si + 1 })} kg`} />
                    <Txt v="meta">kg</Txt>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TextInput value={s.reps} onChangeText={(v) => update(ei, si, 'reps', v)} keyboardType="number-pad" placeholder="0" placeholderTextColor={p.inkFaint} style={input} accessibilityLabel={`${e.name} ${t('train.sets.set', { n: si + 1 })} ${t('train.sets.reps')}`} />
                  <Txt v="meta">{t('train.sets.reps')}</Txt>
                </View>
              </View>
            ))}
            <TextButton label={t('train.sets.addSet')} onPress={() => addSet(ei)} style={{ alignSelf: 'flex-start' }} />
          </View>
        );
      })}
      <Txt v="caption">{t('train.sets.hint')}</Txt>
    </View>
  );
}
