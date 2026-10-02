import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { fmtDay } from '../../../src/i18n/format';
import { todaysWorkout, useMyWorkoutLogs, useWorkouts, Workout } from '../../../src/data/workouts';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Magnet } from '../../../src/components/board/people';
import { Rule } from '../../../src/components/board/marks';
import { Chip, MarkerButton, SectionHeading } from '../../../src/components/board/controls';
import { mainBlock, workoutLine, WorkoutRow } from '../../../src/components/board/workout';

type Filter = 'all' | 'saved' | 'nokit' | 'short' | string;

export default function TrainScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const q = useWorkouts(lang);
  const logs = useMyWorkoutLogs(5).data ?? [];
  const [filter, setFilter] = useState<Filter>('all');

  const all = q.data ?? [];
  const today = useMemo(() => todaysWorkout(all), [all]);
  const sports = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((w) => m.set(w.sport, (m.get(w.sport) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [all]);
  const hasSaved = all.some((w) => w.saved);

  const filtered = all.filter((w) => {
    if (filter === 'saved') return w.saved;
    if (filter === 'nokit') return w.equipment.length === 0;
    if (filter === 'short') return w.minutes <= 20;
    if (filter !== 'all') return w.sport === filter;
    return true;
  });
  const coaches = filtered.filter((w) => w.source === 'coach');
  const library = filtered.filter((w) => w.source === 'library' && (filter !== 'all' || w.id !== today?.id));
  const open = (w: Workout) => router.push({ pathname: '/workout/[id]', params: { id: w.id } });

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refetch} tintColor={p.ink} />}
      >
        <View style={s.header}>
          <Txt v="title" size={32} accessibilityRole="header">
            {t('train.title')}
          </Txt>
        </View>

        {/* Today's workout, written on the board */}
        {today && filter === 'all' ? renderToday(today, () => open(today), () => router.push({ pathname: '/workout/[id]/play', params: { id: today.id } })) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          <Chip label={t('train.all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
          {hasSaved ? <Chip label={t('train.saved')} icon="bookmarkFill" selected={filter === 'saved'} onPress={() => setFilter(filter === 'saved' ? 'all' : 'saved')} /> : null}
          {sports.map(([id]) => (
            <Chip key={id} sport={id} label={t(`sports.${id}`)} selected={filter === id} onPress={() => setFilter(filter === id ? 'all' : id)} />
          ))}
          <Chip label={t('train.noKit')} selected={filter === 'nokit'} onPress={() => setFilter(filter === 'nokit' ? 'all' : 'nokit')} />
          <Chip label={t('train.short')} icon="timer" selected={filter === 'short'} onPress={() => setFilter(filter === 'short' ? 'all' : 'short')} />
        </ScrollView>

        {q.error && !q.data ? (
          <Txt v="body" color={p.inkSoft} align="center" style={{ padding: 32 }}>
            {t('train.offline')}
          </Txt>
        ) : !q.loading && filtered.length === 0 ? (
          <Txt v="body" color={p.inkSoft} align="center" style={{ padding: 32 }}>
            {t('train.empty')}
          </Txt>
        ) : null}

        {coaches.length ? (
          <View style={s.section}>
            <SectionHeading title={t('train.fromCoaches')} style={s.heading} />
            {coaches.map((w, i) => (
              <WorkoutRow key={w.id} w={w} onPress={() => open(w)} last={i === coaches.length - 1} />
            ))}
          </View>
        ) : null}

        {library.length ? (
          <View style={s.section}>
            <SectionHeading title={t('train.library')} style={s.heading} />
            {library.map((w, i) => (
              <WorkoutRow key={w.id} w={w} onPress={() => open(w)} last={i === library.length - 1} />
            ))}
          </View>
        ) : null}

        {/* Your own log: proof you showed up */}
        {logs.length && filter === 'all' ? (
          <View style={s.section}>
            <SectionHeading title={t('train.log')} style={s.heading} />
            {logs.map((l, i) => (
              <Press
                key={l.id}
                onPress={l.workoutId ? () => router.push({ pathname: '/workout/[id]', params: { id: l.workoutId! } }) : undefined}
                feedback="selection"
                depress={0.99}
                style={[s.logRow, i === logs.length - 1 ? { borderBottomWidth: 0 } : null]}
              >
                <Txt v="label" size={13} color={p.inkSoft} style={{ width: 86 }}>
                  {fmtDay(l.completedAt, lang)}
                </Txt>
                <Txt v="headline" size={15} numberOfLines={1} style={{ flex: 1 }}>
                  {l.title}
                </Txt>
                <Txt v="time" size={14} color={p.inkSoft}>
                  {l.result || (l.minutes ? `${l.minutes} ${lang === 'ar' ? 'د' : 'min'}` : '')}
                </Txt>
              </Press>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );

  function renderToday(w: Workout, onOpen: () => void, onStart: () => void) {
    const b = mainBlock(w);
    const lines = (b?.items ?? []).slice(0, 4);
    return (
      <View style={s.today}>
        <SectionHeading title={t('train.today')} />
        <Press onPress={onOpen} feedback="selection" depress={0.99} accessibilityRole="button" style={{ gap: 10 }}>
          <Txt v="hero" size={48} numberOfLines={2}>
            {lang === 'en' ? w.title.toUpperCase() : w.title}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon sport={w.sport} size={15} color={p.inkSoft} />
            <Txt v="label" size={14} color={p.inkSoft} style={{ flexShrink: 1 }}>
              {[workoutLine(w, t, tn), `${w.minutes} ${lang === 'ar' ? 'د' : 'min'}`].join(' · ')}
            </Txt>
          </View>
          <View style={s.wod}>
            {lines.map((it, i) => (
              <View key={i} style={[s.wodLine, i === 0 ? { borderTopWidth: 0 } : null]}>
                <Txt v="time" size={15} style={{ width: 86 }} numberOfLines={1}>
                  {it.reps || '—'}
                </Txt>
                <Txt v="body" size={15} numberOfLines={1} style={{ flex: 1 }}>
                  {it.name}
                </Txt>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {w.coach ? <Magnet person={w.coach} size={26} /> : null}
            <Txt v="meta" style={{ flex: 1 }} numberOfLines={1}>
              {[w.coach ? t('train.byCoach', { name: w.coach.name }) : t('train.byOB'), tn('train.doneWeek', w.doneWeek)].join(' · ')}
            </Txt>
          </View>
        </Press>
        <MarkerButton label={t('train.start')} icon="play" onPress={onStart} style={{ marginTop: 6 }} />
        <Rule style={{ marginTop: 20 }} />
      </View>
    );
  }
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  today: { paddingHorizontal: 16, gap: 8 },
  wod: { borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: p.ruleStrong, paddingVertical: 2, marginTop: 2 },
  wodLine: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: p.rule },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  section: { marginTop: 6 },
  heading: { paddingHorizontal: 16 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: p.rule },
}));
