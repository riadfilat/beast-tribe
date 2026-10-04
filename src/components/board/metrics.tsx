import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { useTrainingMetrics } from '../../data/metrics';
import { groupOf, MUSCLE_GROUPS, MuscleGroup, useExercises } from '../../data/exercises';
import { Txt, alignEnd } from './Txt';
import { Icon } from './Icon';
import { SectionHeading } from './controls';
import { localDateKey } from '../../i18n/format';

// Evidence-based weekly volume for growth: roughly 10–20 hard sets per muscle group.
const SETS_LOW = 10;
const SETS_HIGH = 20;

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  const { p } = useKit();
  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: p.rule, gap: 10 }}>
      <Txt v="label" color={p.inkSoft}>
        {title}
      </Txt>
      {children}
      {note ? <Txt v="caption">{note}</Txt> : null}
    </View>
  );
}

/** The member's training, measured: this week, the last weeks, active days, volume, bests. */
export function TrainingMetricsSection() {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const q = useTrainingMetrics(12);
  const lib = useExercises(lang).data;
  const m = q.data;

  const groupSets = useMemo(() => {
    const out = new Map<MuscleGroup, number>();
    if (!m || !lib) return out;
    m.setsByExercise.forEach((n, slug) => {
      const ex = lib.get(slug);
      if (!ex) return;
      const groups = new Set(ex.primary.map(groupOf).filter(Boolean) as MuscleGroup[]);
      groups.forEach((g) => out.set(g, (out.get(g) ?? 0) + n));
    });
    return out;
  }, [m, lib]);

  if (!m) return null;
  const weeks8 = m.weeks.slice(-8);
  const maxMin = Math.max(30, ...weeks8.map((w) => w.minutes));
  const empty = m.weeks.every((w) => w.sessions === 0) && !m.bests.length;

  // Active days: last 12 weeks as columns (oldest left), Sun–Sat rows.
  const today = new Date();
  const cols = m.weeks.map((w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = new Date(w.start);
      day.setDate(w.start.getDate() + d);
      const key = localDateKey(day);
      return { on: m.activeDays.has(key), future: day > today };
    }),
  );
  const activeCount = m.activeDays.size;

  return (
    <View>
      <SectionHeading title={t('metrics.title')} style={{ paddingHorizontal: 16, marginTop: 28 }} />
      {empty ? (
        <Card title={t('metrics.thisWeek')}>
          <Txt v="body" color={p.inkSoft}>
            {t('metrics.empty')}
          </Txt>
        </Card>
      ) : (
        <>
          <Card title={t('metrics.thisWeek')}>
            <View style={{ flexDirection: 'row' }}>
              {[
                { n: m.thisWeek.sessions, l: t('metrics.sessions') },
                { n: m.thisWeek.minutes, l: t('metrics.minutes') },
                { n: m.thisWeek.sets, l: t('metrics.sets') },
              ].map((x, i) => (
                <View key={i} style={{ flex: 1, gap: 2 }}>
                  <Txt v="stencil" size={34}>
                    {x.n}
                  </Txt>
                  <Txt v="meta">{x.l}</Txt>
                </View>
              ))}
            </View>
          </Card>

          <Card title={t('metrics.last8')}>
            <View style={{ height: 96, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              {weeks8.map((w, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Txt v="caption" size={10}>
                    {w.minutes || ''}
                  </Txt>
                  <View
                    style={{
                      width: '100%',
                      height: Math.max(3, Math.round((w.minutes / maxMin) * 70)),
                      borderRadius: 4,
                      backgroundColor: i === weeks8.length - 1 ? p.marker : w.minutes ? p.aqua : p.rule,
                    }}
                  />
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt v="caption">{t('metrics.weeksAgo', { n: 7 })}</Txt>
              <Txt v="caption">{t('metrics.now')}</Txt>
            </View>
          </Card>

          <Card title={t('metrics.activeDays', { n: activeCount })}>
            <View style={{ flexDirection: 'row', gap: 4, alignSelf: 'flex-start' }}>
              {cols.map((col, ci) => (
                <View key={ci} style={{ gap: 4 }}>
                  {col.map((d, di) => (
                    <View key={di} style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: d.future ? 'transparent' : d.on ? p.marker : p.rule }} />
                  ))}
                </View>
              ))}
            </View>
            <Txt v="caption">{t('metrics.activeNote')}</Txt>
          </Card>

          {groupSets.size ? (
            <Card title={t('metrics.setsPerMuscle')} note={t('metrics.setsNote', { lo: SETS_LOW, hi: SETS_HIGH })}>
              {MUSCLE_GROUPS.filter((g) => groupSets.has(g)).map((g) => {
                const n = groupSets.get(g) ?? 0;
                const pct = Math.min(1, n / SETS_HIGH);
                const inRange = n >= SETS_LOW && n <= SETS_HIGH;
                return (
                  <View key={g} style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Txt v="row" size={14}>{t(`ex.group.${g}`)}</Txt>
                      <Txt v="label" size={13} color={inRange ? p.aqua : p.inkSoft}>
                        {t('metrics.setsCount', { n })}
                      </Txt>
                    </View>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: p.rule, overflow: 'hidden' }}>
                      <View style={{ position: 'absolute', start: `${(SETS_LOW / SETS_HIGH) * 100}%`, top: 0, bottom: 0, width: 2, backgroundColor: p.ruleStrong }} />
                      <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: inRange ? p.aqua : p.marker }} />
                    </View>
                  </View>
                );
              })}
            </Card>
          ) : null}

          {m.bests.length ? (
            <Card title={t('metrics.bests')} note={t('metrics.bestsNote')}>
              {m.bests.map((b, i) => (
                <View key={b.exercise} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: i ? 8 : 0, borderTopWidth: i ? 1 : 0, borderTopColor: p.rule }}>
                  <Icon name="bolt" size={14} color={p.marker} />
                  <Txt v="row" size={14} style={{ flex: 1 }} numberOfLines={1}>
                    {lib?.get(b.exercise)?.name ?? b.exercise}
                  </Txt>
                  <Txt v="time" size={14}>
                    {b.kg ? `${b.kg} kg × ${b.reps}` : t('metrics.repsOnly', { n: b.reps })}
                  </Txt>
                  {b.e1rm ? (
                    <Txt v="caption" style={{ width: 70, textAlign: alignEnd(lang) }}>
                      {t('metrics.e1rm', { kg: Math.round(b.e1rm) })}
                    </Txt>
                  ) : null}
                </View>
              ))}
            </Card>
          ) : null}

          {m.effort.recent != null ? (
            <Card title={t('metrics.effort')}>
              <Txt v="body" size={15}>
                {m.effort.before != null
                  ? t('metrics.effortTrend', { now: m.effort.recent, before: m.effort.before })
                  : t('metrics.effortNow', { now: m.effort.recent })}
              </Txt>
            </Card>
          ) : null}

          {m.sports.length ? (
            <Card title={t('metrics.bySport')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {m.sports.map((x) => (
                  <View key={x.sport} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: p.rule }}>
                    <Icon sport={x.sport} size={14} color={p.ink} />
                    <Txt v="row" size={13}>{`${t(`sports.${x.sport}`)} · ${x.count}`}</Txt>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}
        </>
      )}
    </View>
  );
}
