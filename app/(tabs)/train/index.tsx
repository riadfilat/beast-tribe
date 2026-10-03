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
import { Chip, MarkerButton, SectionHeading, TextButton } from '../../../src/components/board/controls';
import { mainBlock, workoutLine, WorkoutRow } from '../../../src/components/board/workout';
import { useExercises } from '../../../src/data/exercises';
import { activeWeekFocus, Goal, GOAL_SPORT, ProgramSession, recommendedSlug, startPlan, TrainLevel, useFocusSessions, useMyPlan, usePrograms } from '../../../src/data/programs';
import { useMySports } from '../../../src/data/member';
import { useAuth } from '../../../src/providers/AuthProvider';
import { FindPlanCard, FocusSheet, NextUpCard, RecommendedCard, SessionRows, WeekFocusSheet } from '../../../src/components/board/plan';
import { toast } from '../../../src/components/board/toast';
import { schedulePlanReminder } from '../../../src/lib/notifications';

// A sport's plan, when there is one; otherwise the sport filters the workouts.
const SPORT_PLAN: Record<string, string> = { padel: 'padel-fit', running: 'first-5k', walking: 'first-5k', hyrox: 'hyrox-ready', gym: 'strength-base', crossfit: 'busy-week' };

type Filter = 'all' | 'saved' | 'nokit' | 'short' | string;

export default function TrainScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const q = useWorkouts(lang);
  const logs = useMyWorkoutLogs(5, lang).data ?? [];
  const moves = useExercises(lang).data?.size ?? 0;
  const { user, profile } = useAuth();
  const prof: any = profile;
  const goal: Goal | null = prof?.train_goal ?? null;
  const level: TrainLevel | null = prof?.train_level ?? null;
  const planQ = useMyPlan(lang);
  const plan = planQ.data ?? null;
  const programs = usePrograms(lang).data ?? [];
  const recommended = goal ? programs.find((pr) => pr.slug === recommendedSlug(goal, level)) ?? null : null;
  const weekFocus = activeWeekFocus(prof);
  const planGoal: Goal | null = plan?.program.goal ?? goal;
  const focusOther = weekFocus && weekFocus !== planGoal ? weekFocus : null;
  const picks = useFocusSessions(focusOther, level, lang);
  const mySports = useMySports().data ?? [];
  const [focusOpen, setFocusOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  React.useEffect(() => {
    if (planQ.loading) return;
    const trainedToday = logs.some((l) => new Date(l.completedAt).toDateString() === new Date().toDateString());
    schedulePlanReminder(plan?.next ? { focus: plan.next.focus, minutes: plan.next.minutes } : null, trainedToday);
  }, [plan?.next?.id, planQ.loading, logs.length]);
  const openSession = (ps: ProgramSession) => router.push({ pathname: '/workout/[id]', params: { id: ps.workoutId, ps: ps.id } });
  const playSession = (ps: ProgramSession) => router.push({ pathname: '/workout/[id]/play', params: { id: ps.workoutId, ps: ps.id } });
  const begin = async (programId: string) => {
    if (!user) return;
    setStarting(true);
    try {
      await startPlan(user.id, programId);
      planQ.refetch();
    } catch {
      toast.show(t('onboarding.saveError'), 'error');
    } finally {
      setStarting(false);
    }
  };
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

        {/* Your plan: what's next, or the plan that fits your goal, or the one question to get there */}
        {filter === 'all' ? (
          plan ? (
            <NextUpCard plan={plan} onStart={playSession} onOpenSession={openSession} onOpenPlan={() => router.push({ pathname: '/program/[slug]', params: { slug: plan.program.slug } })} />
          ) : goal && recommended ? (
            <RecommendedCard program={recommended} busy={starting} onStart={() => begin(recommended.id)} onSee={() => router.push({ pathname: '/program/[slug]', params: { slug: recommended.slug } })} />
          ) : !planQ.loading ? (
            <FindPlanCard onPress={() => setFocusOpen(true)} />
          ) : null
        ) : null}

        {/* This week: stay on the plan, or focus on something else for a week */}
        {filter === 'all' && (plan || goal) ? (
          <View style={s.weekRow}>
            <Press onPress={() => setWeekOpen(true)} feedback="selection" accessibilityRole="button" style={s.weekChip}>
              <Txt v="label" size={13} color={p.inkSoft}>
                {t('plan.thisWeek')}
              </Txt>
              <Txt v="row" size={14}>
                {focusOther ? t(`plan.goals.${focusOther}`) : t('plan.onPlan')}
              </Txt>
              <Icon name="chevron" size={11} color={p.inkSoft} weight="bold" style={{ transform: [{ rotate: '90deg' }] }} />
            </Press>
            <TextButton label={t('plan.changeGoal')} onPress={() => setFocusOpen(true)} />
          </View>
        ) : null}
        {focusOther && picks.sessions.length && filter === 'all' ? (
          <View style={s.section}>
            <SectionHeading title={t('plan.focusPicks')} style={s.heading} />
            <SessionRows sessions={picks.sessions} onOpen={(ps) => router.push({ pathname: '/workout/[id]', params: { id: ps.workoutId } })} />
          </View>
        ) : null}

        {/* For your sports: one tap to the plan or workouts for the sports you play */}
        {filter === 'all' && mySports.length ? (
          <View style={{ marginTop: 14 }}>
            <SectionHeading title={t('plan.forSports')} style={s.heading} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
              {mySports.map((sp) => {
                const slug = SPORT_PLAN[sp];
                const pr = slug ? programs.find((x) => x.slug === slug) : null;
                return (
                  <Press
                    key={sp}
                    onPress={() => (pr ? router.push({ pathname: '/program/[slug]', params: { slug: pr.slug } }) : setFilter(sp))}
                    feedback="selection"
                    accessibilityRole="button"
                    style={s.sportCard}
                  >
                    <Icon sport={sp} size={22} color={p.ink} />
                    <Txt v="row" size={14} numberOfLines={1}>
                      {t(`sports.${sp}`)}
                    </Txt>
                    <Txt v="meta" numberOfLines={2}>
                      {pr ? pr.title : t('plan.sportWorkouts')}
                    </Txt>
                  </Press>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Today's workout, written on the board (when there's no plan to follow) */}
        {today && filter === 'all' && !plan ? renderToday(today, () => open(today), () => router.push({ pathname: '/workout/[id]/play', params: { id: today.id } })) : null}

        {filter === 'all' ? (
          <Press onPress={() => router.push('/moves')} feedback="selection" depress={0.99} accessibilityRole="button" style={s.libraryRow}>
            <View style={s.libraryIcon}>
              <Icon name="doc" size={18} color={p.board} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="row" size={15}>
                {t('ex.library')}
              </Txt>
              {moves ? <Txt v="meta">{t('ex.librarySub', { n: moves })}</Txt> : null}
            </View>
            <Icon name="chevron" size={13} color={p.inkFaint} weight="bold" />
          </Press>
        ) : null}
        {filter === 'all' && programs.length ? (
          <Press onPress={() => router.push('/programs')} feedback="selection" depress={0.99} accessibilityRole="button" style={s.libraryRow}>
            <View style={s.libraryIcon}>
              <Icon name="calendar" size={18} color={p.board} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="row" size={15}>
                {t('plan.plans')}
              </Txt>
              <Txt v="meta">{t('plan.plansSub', { n: programs.length })}</Txt>
            </View>
            <Icon name="chevron" size={13} color={p.inkFaint} weight="bold" />
          </Press>
        ) : null}

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
      <FocusSheet visible={focusOpen} onClose={() => setFocusOpen(false)} />
      <WeekFocusSheet visible={weekOpen} onClose={() => setWeekOpen(false)} current={focusOther} planGoal={planGoal} />
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
  libraryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 4, marginBottom: 6, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: p.ruleStrong },
  libraryIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 14 },
  weekChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: p.ruleStrong },
  sportCard: { width: 132, gap: 6, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: p.rule },
}));
