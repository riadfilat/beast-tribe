import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useAuth } from '../../../src/providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { logWorkout, shareWorkout, ShareTarget, stepSeconds, useWorkout, WorkoutBlock } from '../../../src/data/workouts';
import { useMyCommunities } from '../../../src/data/communities';
import { useMyPackList } from '../../../src/data/member';
import { Txt } from '../../../src/components/board/Txt';
import { Tally } from '../../../src/components/board/marks';
import { Chip, Field, IconButton, MarkerButton, OutlineButton } from '../../../src/components/board/controls';
import { Sheet } from '../../../src/components/board/sheet';
import { BlockView, blockLine } from '../../../src/components/board/workout';
import { ExerciseSheet } from '../../../src/components/board/exercise';
import { buildEntries, prefill, SetEntry, SetLogger } from '../../../src/components/board/sets';
import { e1rm, historyFor, History, saveSets } from '../../../src/data/sets';
import { useExercises } from '../../../src/data/exercises';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';

// How a block runs: a countdown (AMRAP), a minute clock (EMOM), timed steps (intervals or a
// fully timed flow), or a stopwatch with a rounds counter (rounds, for time, strength, steady).
type Mode = 'amrap' | 'emom' | 'steps' | 'stopwatch';

interface Plan {
  mode: Mode;
  /** Total seconds when the block has an end (AMRAP, EMOM, timed steps, a time cap). */
  limit: number | null;
  steps: { idx: number; secs: number }[];
  rounds: number;
  counts: boolean;
}

function planOf(b: WorkoutBlock): Plan {
  const timed = b.items.length > 0 && b.items.every((i) => stepSeconds(i.reps) != null);
  if (b.format === 'amrap' && b.minutes) return { mode: 'amrap', limit: b.minutes * 60, steps: [], rounds: 0, counts: true };
  if (b.format === 'emom' && b.minutes) return { mode: 'emom', limit: b.minutes * 60, steps: [], rounds: 0, counts: false };
  if ((b.format === 'intervals' || b.format === 'flow' || b.format === 'steady') && timed) {
    const steps = b.items.map((i, idx) => ({ idx, secs: stepSeconds(i.reps)! }));
    const rounds = b.rounds || 1;
    return { mode: 'steps', limit: steps.reduce((a, s) => a + s.secs, 0) * rounds, steps, rounds, counts: false };
  }
  const counts = b.format === 'rounds' || b.format === 'for_time';
  return { mode: 'stopwatch', limit: b.format === 'for_time' && b.minutes ? b.minutes * 60 : null, steps: [], rounds: b.rounds || 0, counts };
}

const clock = (secs: number) => {
  const s = Math.max(0, Math.round(secs));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

export default function PlayScreen() {
  const { id, event, ps } = useLocalSearchParams<{ id: string; event?: string; ps?: string }>();
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const w = useWorkout(id, lang).data;
  const leave = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/workout/[id]', params: { id } }));

  const [blockIdx, setBlockIdx] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null); // whole workout
  const [blockAt, setBlockAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0); // this block
  const [totalPausedMs, setTotalPausedMs] = useState(0);
  const [rounds, setRounds] = useState<number[]>([]);
  const [now, setNow] = useState(Date.now());
  const [logOpen, setLogOpen] = useState(false);
  const [exSlug, setExSlug] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const running = blockAt != null && pausedAt == null && !logOpen;
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [running]);

  const block = w?.blocks[blockIdx] ?? null;
  const plan = useMemo(() => (block ? planOf(block) : null), [block]);
  const elapsed = blockAt == null ? 0 : ((pausedAt ?? now) - blockAt - pausedMs) / 1000;
  const over = !!plan?.limit && elapsed >= plan.limit;

  // Where we are inside the block.
  let current: number | null = null;
  let stepLeft = 0;
  let stepRound = 1;
  let isRest = false;
  if (plan && block && blockAt != null) {
    if (plan.mode === 'emom') {
      const minute = Math.min(Math.floor(elapsed / 60), Math.max(0, (block.minutes ?? 1) - 1));
      current = block.items.length ? minute % block.items.length : null;
      stepLeft = 60 - (elapsed % 60);
    } else if (plan.mode === 'steps' && plan.steps.length) {
      const cycle = plan.steps.reduce((a, x) => a + x.secs, 0);
      const e = Math.min(elapsed, (plan.limit ?? 0) - 0.001);
      stepRound = Math.floor(e / cycle) + 1;
      let into = e % cycle;
      for (const st of plan.steps) {
        if (into < st.secs) {
          current = st.idx;
          stepLeft = st.secs - into;
          break;
        }
        into -= st.secs;
      }
      const name = current != null ? block.items[current]?.name?.toLowerCase() ?? '' : '';
      isRest = block.format === 'intervals' && /rest|walk|jog|راحة|مشي|هرولة/.test(name) && plan.steps.length > 1;
    }
  }

  // A buzz when the step or the minute turns over, and when time is up.
  const lastMark = useRef<string>('');
  useEffect(() => {
    if (!running || !plan) return;
    const mark = over ? 'over' : plan.mode === 'emom' ? `m${Math.floor(elapsed / 60)}` : plan.mode === 'steps' ? `s${stepRound}-${current}` : '';
    if (mark && mark !== lastMark.current) {
      if (lastMark.current) haptic(over ? 'success' : 'medium');
      lastMark.current = mark;
    }
  }, [now, running]);

  if (!w || !block || !plan) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <IconButton name="close" label={t('common.close')} onPress={leave} style={{ marginStart: 6 }} />
      </View>
    );
  }

  const started = blockAt != null;
  const isLast = blockIdx === w.blocks.length - 1;
  const myRounds = rounds[blockIdx] ?? 0;

  function start() {
    const tnow = Date.now();
    setStartedAt((v) => v ?? tnow);
    setBlockAt(tnow);
    setPausedMs(0);
    setPausedAt(null);
    setNow(tnow);
    lastMark.current = '';
    haptic('medium');
  }
  function togglePause() {
    const tnow = Date.now();
    if (pausedAt == null) {
      setPausedAt(tnow);
    } else {
      setPausedMs((v) => v + (tnow - pausedAt));
      setTotalPausedMs((v) => v + (tnow - pausedAt));
      setPausedAt(null);
      setNow(tnow);
    }
    haptic('selection');
  }
  function addRound() {
    setRounds((r) => {
      const next = [...r];
      next[blockIdx] = (next[blockIdx] ?? 0) + 1;
      return next;
    });
    haptic('light');
  }
  function nextBlock() {
    if (pausedAt != null) setTotalPausedMs((v) => v + (Date.now() - pausedAt));
    setBlockIdx((i) => i + 1);
    setBlockAt(null);
    setPausedAt(null);
    setPausedMs(0);
  }
  function finish() {
    const tnow = Date.now();
    if (pausedAt != null) setTotalPausedMs((v) => v + (tnow - pausedAt));
    setPausedAt(null);
    setEndedAt(tnow);
    setLogOpen(true);
    haptic('success');
  }
  function confirmEnd() {
    if (!startedAt) return leave();
    const go = () => finish();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(t('train.player.endConfirm'))) go();
      return;
    }
    Alert.alert(t('train.player.end'), t('train.player.endConfirm'), [
      { text: t('train.player.keepGoing'), style: 'cancel' },
      { text: t('train.player.end'), style: 'destructive', onPress: go },
    ]);
  }

  // The big number: what's left when the block has an end, otherwise time on the clock.
  const big =
    !started ? clock(plan.limit ?? 0) :
    plan.mode === 'amrap' ? clock((plan.limit ?? 0) - elapsed) :
    plan.mode === 'emom' || plan.mode === 'steps' ? clock(stepLeft) :
    clock(elapsed);
  const context =
    !started ? blockLine(block, t, tn) :
    over ? t('train.player.timeUp') :
    plan.mode === 'emom' ? t('train.player.minuteOf', { n: Math.floor(elapsed / 60) + 1, total: block.minutes }) :
    plan.mode === 'steps' && plan.rounds > 1 ? t('train.player.roundOf', { n: stepRound, total: plan.rounds }) :
    plan.mode === 'stopwatch' && plan.rounds ? t('train.player.roundOf', { n: Math.min(myRounds + 1, plan.rounds), total: plan.rounds }) :
    blockLine(block, t, tn);
  const currentItem = current != null ? block.items[current] : null;
  const nextIdx = plan.mode === 'steps' && current != null ? (current + 1) % block.items.length : plan.mode === 'emom' && current != null ? (current + 1) % block.items.length : null;

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <IconButton name="close" label={t('train.player.end')} onPress={confirmEnd} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt v="row" size={14} numberOfLines={1}>
            {block.title}
          </Txt>
          <Txt v="caption">{`${blockIdx + 1} / ${w.blocks.length} · ${w.title}`}</Txt>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={s.clockWrap}>
          <Txt v="label" size={14} color={over ? p.markerText : isRest ? p.aqua : p.inkSoft} style={lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 1 } : null}>
            {started && plan.mode === 'steps' && block.format === 'intervals' && !over ? (isRest ? t('train.player.rest') : t('train.player.work')) : started ? '' : t('train.player.ready')}
          </Txt>
          <Txt v="stencil" size={112} accessibilityLiveRegion="polite" color={over ? p.markerText : p.ink} style={{ fontVariant: ['tabular-nums'] }}>
            {big}
          </Txt>
          <Txt v="headline" size={16} color={p.inkSoft} align="center">
            {context}
          </Txt>
        </View>

        {started && currentItem ? (
          <View style={s.now}>
            <Txt v="time" size={18} color={p.markerText}>
              {currentItem.reps || ''}
            </Txt>
            <Txt v="title" size={26} align="center">
              {currentItem.name}
            </Txt>
            {nextIdx != null && block.items[nextIdx] ? (
              <Txt v="meta" align="center">
                {t('train.player.upNext', { title: block.items[nextIdx].name })}
              </Txt>
            ) : null}
          </View>
        ) : null}

        {started && plan.counts ? (
          <View style={s.rounds}>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt v="headline">{tn('train.player.roundsDone', myRounds)}</Txt>
              {myRounds > 0 && myRounds <= 20 ? <Tally count={myRounds} capacity={plan.rounds > myRounds ? plan.rounds : null} size={18} /> : null}
            </View>
            <OutlineButton label={t('train.player.addRound')} onPress={addRound} style={{ minWidth: 130 }} />
          </View>
        ) : null}

        <View style={{ marginTop: 22 }}>
          <BlockView b={block} highlight={started ? current : null} onExercise={setExSlug} />
        </View>
        {!isLast ? (
          <Txt v="meta" style={{ marginTop: 16 }}>
            {t('train.player.upNext', { title: w.blocks[blockIdx + 1].title })}
          </Txt>
        ) : null}
      </ScrollView>

      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        {!started ? (
          <MarkerButton label={blockIdx === 0 ? t('train.start') : t('train.player.startBlock', { title: block.title })} icon="play" onPress={start} />
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <OutlineButton
              label={pausedAt == null ? t('train.player.pause') : t('train.player.resume')}
              icon={pausedAt == null ? 'pause' : 'play'}
              onPress={togglePause}
              style={{ flex: 1 }}
            />
            {isLast ? (
              <MarkerButton label={t('train.player.finish')} icon="check" onPress={finish} style={{ flex: 1.3 }} />
            ) : (
              <MarkerButton label={t('train.player.next')} icon="next" onPress={nextBlock} style={{ flex: 1.3 }} />
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
        activeSecs={startedAt ? ((endedAt ?? Date.now()) - startedAt - totalPausedMs) / 1000 : 0}
        suggested={(() => {
          // The result is the main piece's rounds (the AMRAP, not the warm-up).
          const main = w.blocks.findIndex((b) => b.format === w.format && planOf(b).counts);
          const r = main >= 0 ? rounds[main] ?? 0 : Math.max(0, ...w.blocks.map((_, i) => rounds[i] ?? 0));
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
        <Txt v="row" size={14} color={p.inkSoft} numberOfLines={2} style={{ flex: 1, textAlign: 'right', marginStart: 16 }}>
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
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: p.rule },
  clockWrap: { alignItems: 'center', paddingTop: 22, paddingBottom: 6, gap: 2 },
  now: { alignItems: 'center', gap: 4, paddingVertical: 16, marginTop: 12, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: p.ruleStrong },
  rounds: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: p.rule },
  bar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: p.boardDeep, borderTopWidth: 1, borderTopColor: p.rule },
}));
