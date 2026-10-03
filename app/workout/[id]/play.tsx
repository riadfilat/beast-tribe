import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useAuth } from '../../../src/providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { logWorkout, shareWorkout, ShareTarget, useWorkout, WorkoutBlock } from '../../../src/data/workouts';
import { buildGuide, nextStep } from '../../../src/data/guide';
import { useMyCommunities } from '../../../src/data/communities';
import { useMyPackList } from '../../../src/data/member';
import { Txt, alignEnd } from '../../../src/components/board/Txt';
import { Chip, Field, IconButton, MarkerButton, TextButton } from '../../../src/components/board/controls';
import { Sheet } from '../../../src/components/board/sheet';
import { ExerciseSheet } from '../../../src/components/board/exercise';
import { MoveDemo } from '../../../src/components/board/MoveDemo';
import { buildEntries, prefill, SetEntry, SetLogger } from '../../../src/components/board/sets';
import { e1rm, historyFor, History, saveSets } from '../../../src/data/sets';
import { useExercises } from '../../../src/data/exercises';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { useKeepAwake } from 'expo-keep-awake';

const clock = (secs: number) => {
  const s = Math.max(0, Math.round(secs));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

// One exercise at a time. The screen shows what to do now, a big Next button, and nothing else to
// decide. Timed moves count down and move on by themselves; everything else waits for Next.
export default function PlayScreen() {
  // The screen stays on while a workout runs.
  useKeepAwake();
  const { id, event, ps } = useLocalSearchParams<{ id: string; event?: string; ps?: string }>();
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const w = useWorkout(id, lang).data;
  const lib = useExercises(lang).data;
  const leave = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/workout/[id]', params: { id } }));

  const guide = useMemo(() => (w ? buildGuide(w.blocks, (slug) => (slug ? lib?.get(slug)?.restSeconds ?? null : null)) : null), [w, lib]);

  const [idx, setIdx] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null); // whole workout
  const [stepAt, setStepAt] = useState(0);
  const [blockAt, setBlockAt] = useState(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0); // whole workout
  const [stepBase, setStepBase] = useState(0); // paused time already spent when this step began
  const [blockBase, setBlockBase] = useState(0);
  const [laps, setLaps] = useState<Record<number, number>>({});
  const [now, setNow] = useState(Date.now());
  const [logOpen, setLogOpen] = useState(false);
  const [exSlug, setExSlug] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const started = startedAt != null;
  const running = started && pausedAt == null && !logOpen;
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [running]);

  const step = guide?.steps[idx] ?? null;
  const block = guide && step ? guide.blocks.find((b) => b.idx === step.blockIdx) ?? null : null;
  const at = pausedAt ?? now;
  const stepElapsed = started ? Math.max(0, (at - stepAt - (pausedMs - stepBase)) / 1000) : 0;
  const blockElapsed = started ? Math.max(0, (at - blockAt - (pausedMs - blockBase)) / 1000) : 0;
  const blockOver = !!block?.loop && !!block.limit && blockElapsed >= block.limit;
  const stepLeft = step?.secs ? Math.max(0, step.secs - stepElapsed) : 0;

  function goTo(to: number, tnow = Date.now()) {
    if (!guide) return;
    let paused = pausedMs;
    if (pausedAt != null) {
      paused += tnow - pausedAt;
      setPausedMs(paused);
      setPausedAt(null);
    }
    if (guide.steps[to].blockIdx !== guide.steps[idx].blockIdx) {
      setBlockAt(tnow);
      setBlockBase(paused);
    }
    setIdx(to);
    setStepAt(tnow);
    setStepBase(paused);
    setNow(tnow);
  }
  function start() {
    const tnow = Date.now();
    setStartedAt(tnow);
    setStepAt(tnow);
    setBlockAt(tnow);
    setNow(tnow);
    haptic('medium');
  }
  function next(auto = false) {
    if (!guide || !step) return;
    const { idx: to, lapped } = nextStep(guide, idx, blockOver);
    if (lapped) setLaps((l) => ({ ...l, [step.blockIdx]: (l[step.blockIdx] ?? 0) + 1 }));
    if (to == null) return finish();
    haptic(auto ? 'medium' : 'light');
    goTo(to);
  }
  function previous() {
    if (idx > 0) {
      haptic('selection');
      goTo(idx - 1);
    }
  }
  function togglePause() {
    const tnow = Date.now();
    if (pausedAt == null) setPausedAt(tnow);
    else {
      setPausedMs((v) => v + (tnow - pausedAt));
      setPausedAt(null);
      setNow(tnow);
    }
    haptic('selection');
  }
  function finish() {
    const tnow = Date.now();
    if (pausedAt != null) setPausedMs((v) => v + (tnow - pausedAt));
    setPausedAt(null);
    setEndedAt(tnow);
    setLogOpen(true);
    haptic('success');
  }
  function confirmEnd() {
    if (!startedAt) return leave();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(t('train.player.endConfirm'))) finish();
      return;
    }
    Alert.alert(t('train.player.end'), t('train.player.endConfirm'), [
      { text: t('train.player.keepGoing'), style: 'cancel' },
      { text: t('train.player.end'), style: 'destructive', onPress: finish },
    ]);
  }

  // Timed steps move on by themselves, with a tick on each of the last three seconds.
  const lastTick = useRef('');
  useEffect(() => {
    if (!running || !step?.secs) return;
    if (stepElapsed >= step.secs) {
      next(true);
      return;
    }
    const left = Math.ceil(stepLeft);
    const mark = `${step.key}:${left}`;
    if (left <= 3 && mark !== lastTick.current) {
      lastTick.current = mark;
      haptic('light');
    }
  }, [now, running]);
  // A buzz when an as-many-rounds clock runs out.
  const wasOver = useRef(false);
  useEffect(() => {
    if (blockOver && !wasOver.current) haptic('success');
    wasOver.current = blockOver;
  }, [blockOver]);

  if (!w || !guide || !step || !block) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <IconButton name="close" label={t('common.close')} onPress={leave} style={{ marginStart: 6 }} />
      </View>
    );
  }

  const total = guide.steps.length;
  const ex = step.ex ? lib?.get(step.ex) ?? null : null;
  const isRest = step.kind === 'rest';
  const { idx: afterIdx } = nextStep(guide, idx, blockOver);
  const after = afterIdx != null ? guide.steps[afterIdx] : null;
  const isLast = afterIdx == null;
  const myLaps = laps[step.blockIdx] ?? 0;
  const countOnly = step.dose != null && /^\d+$/.test(step.dose.trim());
  // Where this step sits: "Round 2 of 4 · Set 1 of 3", "Minute 3 of 15".
  const place = [
    step.minute ? t('train.player.minuteOf', { n: step.minute, total: step.minutes }) : null,
    step.round ? t('train.player.roundOf', { n: step.round, total: step.rounds }) : null,
    step.set ? t('train.player.setOf', { n: step.set, total: step.sets }) : null,
    block.loop ? tn('train.player.roundsDone', myLaps) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const blockClock = block.loop && block.limit ? (blockOver ? t('train.player.timeUp') : t('train.player.timeLeft', { time: clock(block.limit - blockElapsed) })) : block.stopwatch && started ? clock(blockElapsed) : null;
  const doseOf = (x: typeof step) => (x.secs && !x.dose ? clock(x.secs) : x.dose || '');

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <IconButton name="close" label={t('train.player.end')} onPress={confirmEnd} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt v="row" size={14} numberOfLines={1}>
            {block.title}
          </Txt>
          <Txt v="caption">{t('train.player.stepOf', { n: idx + 1, total })}</Txt>
        </View>
        <View style={{ width: 44 }} />
      </View>
      <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: idx + 1 }}>
        <View style={[s.trackFill, { width: `${((idx + (started ? 1 : 0)) / total) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {blockClock || place ? (
          <View style={s.placeRow}>
            {place ? (
              <Txt v="label" size={13} color={p.inkSoft} style={{ flex: 1 }}>
                {place}
              </Txt>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {blockClock ? (
              <View style={[s.pill, blockOver ? { borderColor: p.marker } : null]}>
                <Txt v="time" size={14} color={blockOver ? p.markerText : p.ink}>
                  {blockClock}
                </Txt>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* The move, animated (ExerciseDB); a picture when there is no animation. */}
        {!isRest && ex?.demoId ? (
          <MoveDemo key={ex.demoId} id={ex.demoId} size={220} style={{ marginTop: 12 }} />
        ) : ex?.posterUrl ? (
          <Image source={{ uri: ex.posterUrl }} style={s.media} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : null}

        <View style={s.hero}>
          <Txt v="title" size={34} align="center" accessibilityRole="header">
            {isRest ? t('train.player.rest') : step.name}
          </Txt>

          {step.secs && !step.dose ? (
            <Txt v="stencil" size={120} accessibilityLiveRegion="polite" color={isRest ? p.aqua : p.ink} style={{ fontVariant: ['tabular-nums'] }}>
              {clock(started ? stepLeft : step.secs)}
            </Txt>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Txt v="stencil" size={countOnly ? 120 : 64} align="center" color={p.markerText}>
                {step.dose || ''}
              </Txt>
              {countOnly ? (
                <Txt v="headline" size={18} color={p.inkSoft}>
                  {tn('train.player.repsWord', Number(step.dose))}
                </Txt>
              ) : null}
              {step.secs ? (
                <Txt v="time" size={22} color={p.inkSoft} style={{ marginTop: 10 }}>
                  {clock(started ? stepLeft : step.secs)}
                </Txt>
              ) : null}
              {step.minute ? <Txt v="meta">{t('train.player.restOfMinute')}</Txt> : null}
            </View>
          )}

          {step.note ? (
            <Txt v="body" color={p.inkSoft} align="center">
              {step.note}
            </Txt>
          ) : null}
        </View>

        {ex && ex.cues.length ? (
          <View style={s.cues}>
            {ex.cues.slice(0, 2).map((c) => (
              <View key={c} style={{ flexDirection: 'row', gap: 10 }}>
                <Txt v="body" color={p.markerText}>
                  •
                </Txt>
                <Txt v="body" style={{ flex: 1 }}>
                  {c}
                </Txt>
              </View>
            ))}
            <TextButton label={t('ex.howTo')} onPress={() => setExSlug(step.ex)} />
          </View>
        ) : null}

        {block.note && !isRest ? (
          <Txt v="meta" align="center" style={{ marginTop: 14 }}>
            {block.note}
          </Txt>
        ) : null}
      </ScrollView>

      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        {after ? (
          <Txt v="meta" numberOfLines={1} style={{ marginBottom: 10 }}>
            {t('train.player.upNext', { title: [after.kind === 'rest' ? t('train.player.rest') : after.name, doseOf(after)].filter(Boolean).join(' · ') })}
          </Txt>
        ) : null}
        {!started ? (
          <MarkerButton label={t('train.start')} icon="play" onPress={start} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconButton name="back" label={t('train.player.previous')} onPress={previous} color={idx > 0 ? p.ink : p.inkFaint} style={s.round} />
            <IconButton name={pausedAt == null ? 'pause' : 'play'} label={pausedAt == null ? t('train.player.pause') : t('train.player.resume')} onPress={togglePause} style={s.round} />
            {isLast ? (
              <MarkerButton label={t('train.player.finish')} icon="check" onPress={finish} style={{ flex: 1 }} />
            ) : (
              <MarkerButton label={t('train.player.next')} icon="next" onPress={() => next()} style={{ flex: 1 }} />
            )}
          </View>
        )}
      </View>

      <LogSheet
        visible={logOpen}
        onClose={() => setLogOpen(false)}
        title={w.title}
        workoutId={w.id}
        workoutCommunity={w.community}
        eventId={event ?? null}
        programSessionId={ps ?? null}
        blocks={w.blocks}
        meId={meId}
        startedAt={new Date(startedAt ?? Date.now())}
        activeSecs={startedAt ? ((endedAt ?? Date.now()) - startedAt - pausedMs) / 1000 : 0}
        suggested={(() => {
          // The result of an as-many-rounds workout is the rounds finished.
          const r = Math.max(0, ...guide.blocks.filter((b) => b.loop).map((b) => laps[b.idx] ?? 0));
          return r > 0 ? tn('train.player.roundsDone', r) : '';
        })()}
        onSaved={() => {
          setLogOpen(false);
          leave();
        }}
      />
      <ExerciseSheet slug={exSlug} onClose={() => setExSlug(null)} />
    </View>
  );
}

// ─── Log: what you did, how it felt, and whether the tribe should know ──────
const EFFORTS: { key: 'easy' | 'good' | 'hard' | 'max'; rpe: number }[] = [
  { key: 'easy', rpe: 3 },
  { key: 'good', rpe: 5 },
  { key: 'hard', rpe: 7 },
  { key: 'max', rpe: 9 },
];

function LogSheet({
  visible,
  onClose,
  title,
  workoutId,
  workoutCommunity,
  eventId,
  programSessionId,
  blocks,
  meId,
  startedAt,
  activeSecs,
  suggested,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  workoutId: string;
  workoutCommunity: { id: string; name: string } | null;
  eventId: string | null;
  programSessionId: string | null;
  blocks: WorkoutBlock[];
  meId: string | null;
  startedAt: Date;
  activeSecs: number;
  suggested: string;
  onSaved: () => void;
}) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const lib = useExercises(lang).data;
  const [entries, setEntries] = useState<SetEntry[]>([]);
  const [history, setHistory] = useState<Map<string, History>>(new Map());
  useEffect(() => {
    if (!visible) return;
    const base = buildEntries(blocks, lib);
    setEntries(base);
    if (meId && base.length) {
      historyFor(meId, base.map((e) => e.exercise))
        .then((h) => {
          setHistory(h);
          setEntries((cur) => prefill(cur.length ? cur : base, h));
        })
        .catch(() => {});
    }
  }, [visible, lib]);
  const [result, setResult] = useState('');
  const [effort, setEffort] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const communities = useMyCommunities().data ?? [];
  const packs = useMyPackList().data ?? [];
  // Where it goes is the member's call. Start with the most private place it belongs:
  // the workout's own community, else a private community, else a pack, else the open one.
  const targets: ShareTarget[] = [
    { kind: 'none' },
    ...communities.map((c) => ({ kind: 'community' as const, id: c.id, name: c.name })),
    ...packs.map((x) => ({ kind: 'pack' as const, id: x.id, name: x.name })),
  ];
  const fallback = (): ShareTarget => {
    const own = workoutCommunity && communities.find((c) => c.id === workoutCommunity.id);
    const priv = communities.find((c) => !c.open);
    const pick = own ?? priv;
    if (pick) return { kind: 'community', id: pick.id, name: pick.name };
    if (packs[0]) return { kind: 'pack', id: packs[0].id, name: packs[0].name };
    if (communities[0]) return { kind: 'community', id: communities[0].id, name: communities[0].name };
    return { kind: 'none' };
  };
  const [target, setTarget] = useState<ShareTarget | null>(null);
  const chosen = target ?? fallback();
  const same = (a: ShareTarget, b: ShareTarget) => a.kind === b.kind && (a.kind === 'none' || (b.kind !== 'none' && a.id === b.id));
  useEffect(() => {
    if (visible) setResult((r) => r || suggested);
  }, [visible]);

  const time = clock(activeSecs);
  async function save() {
    if (!meId) return;
    setBusy(true);
    try {
      const { id } = await logWorkout(meId, {
        workoutId,
        title,
        startedAt,
        minutes: activeSecs / 60,
        result: result || time,
        rpe: effort,
        notes,
        eventId,
        programSessionId,
      });
      // Sets, then any new personal best.
      const logged = entries.map((e) => ({
        exercise: e.exercise,
        sets: e.sets.map((x) => ({ reps: x.reps ? Math.round(Number(x.reps)) : null, kg: e.loaded && x.kg ? Number(x.kg) : null })),
      }));
      await saveSets(meId, id, logged).catch(() => {});
      for (const e of logged) {
        const h = history.get(e.exercise);
        const ent = entries.find((x) => x.exercise === e.exercise)!;
        const best = e.sets.reduce<{ v: number; kg: number; reps: number } | null>((b, x) => {
          if (!x.reps) return b;
          const v = x.kg ? e1rm(x.kg, x.reps) : x.reps;
          return !b || v > b.v ? { v, kg: x.kg ?? 0, reps: x.reps } : b;
        }, null);
        if (!best || !h) continue;
        const prev = ent.loaded ? h.bestE1rm : h.bestReps;
        if (prev != null && best.v > prev + 0.01) {
          toast.show(ent.loaded && best.kg ? t('train.sets.newBest', { name: ent.name, kg: best.kg, reps: best.reps }) : t('train.sets.newBestReps', { name: ent.name, reps: best.reps }), 'yours');
          break;
        }
      }
      if (chosen.kind !== 'none') {
        const content = result ? t('train.shareTextResult', { title, result }) : t('train.shareText', { title, time });
        await shareWorkout(meId, { logId: id, workoutId, content: notes.trim() ? `${content}\n${notes.trim()}` : content, target: chosen }).catch(() => {});
      }
      haptic('success');
      toast.show(t('train.logged'), 'yours');
      onSaved();
    } catch {
      haptic('error');
      toast.show(t('train.errors.generic'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} title={t('train.logTitle')} onClose={onClose} footer={<MarkerButton label={t('train.saveLog')} onPress={save} loading={busy} />}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Txt v="meta">{t('train.time')}</Txt>
          <Txt v="stencil" size={48}>
            {time}
          </Txt>
        </View>
        <Txt v="row" size={14} color={p.inkSoft} numberOfLines={2} style={{ flex: 1, textAlign: alignEnd(lang), marginStart: 16 }}>
          {title}
        </Txt>
      </View>
      <View style={{ gap: 8 }}>
        <Txt v="title" size={17}>
          {t('train.result')}
        </Txt>
        <Field value={result} onChangeText={setResult} placeholder={t('train.resultPlaceholder')} maxLength={80} />
      </View>
      <SetLogger entries={entries} onChange={setEntries} history={history} />
      <View style={{ gap: 8 }}>
        <Txt v="title" size={17}>
          {t('train.effort')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {EFFORTS.map((e) => (
            <Chip key={e.key} label={t(`train.efforts.${e.key}`)} selected={effort === e.rpe} onPress={() => setEffort(effort === e.rpe ? null : e.rpe)} />
          ))}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Txt v="title" size={17}>
          {t('train.notes')}
        </Txt>
        <Field value={notes} onChangeText={setNotes} placeholder={t('train.notesPlaceholder')} multiline maxLength={400} />
      </View>
      <View style={{ gap: 8 }}>
        <Txt v="title" size={17}>
          {t('train.shareTo')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {targets.map((x) => (
            <Chip
              key={x.kind === 'none' ? 'none' : `${x.kind}-${x.id}`}
              label={x.kind === 'none' ? t('train.shareNone') : x.name}
              icon={x.kind === 'none' ? 'lock' : x.kind === 'pack' ? 'shield' : 'people'}
              selected={same(x, chosen)}
              onPress={() => setTarget(x)}
            />
          ))}
        </View>
        <Txt v="meta">
          {chosen.kind === 'none'
            ? t('train.shareMe')
            : chosen.kind === 'pack'
              ? t('train.sharePack', { name: chosen.name })
              : t('train.shareCommunity', { name: chosen.name })}
        </Txt>
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 6 },
  track: { height: 4, backgroundColor: p.rule },
  trackFill: { height: 4, backgroundColor: p.marker },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 30 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1.5, borderColor: p.ruleStrong },
  media: { width: '100%', aspectRatio: 16 / 9, borderRadius: 14, backgroundColor: p.wash, marginTop: 12 },
  hero: { alignItems: 'center', gap: 6, paddingTop: 26, paddingBottom: 10 },
  cues: { gap: 8, marginTop: 14, paddingTop: 16, borderTopWidth: 1, borderTopColor: p.rule },
  bar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: p.boardDeep, borderTopWidth: 1, borderTopColor: p.rule },
  round: { width: 54, height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: p.ruleStrong, alignItems: 'center', justifyContent: 'center' },
}));
