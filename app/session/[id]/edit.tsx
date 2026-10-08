import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { addDays, clockParts, fmtDay, localDateKey, localDateTime, startOfLocalDay } from '../../../src/i18n/format';
import { updateSession, useSession } from '../../../src/data/sessions';
import { DURATIONS, Period, SLOTS, durationLabel, periodFor } from '../../../src/lib/times';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Chip, Field, MarkerButton, Segmented, SectionHeading, TextButton } from '../../../src/components/board/controls';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { errorKey } from '../../../src/data/errors';

type Level = 'easy' | 'medium' | 'hard' | 'any';
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** The host changes a session they posted. A booked court keeps its time and place. */
export default function EditSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const q = useSession(id);
  const x = q.data;

  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [dayKey, setDayKey] = useState('');
  const [time, setTime] = useState('');
  const [period, setPeriod] = useState<Period>('evening');
  const [duration, setDuration] = useState(60);
  const [place, setPlace] = useState('');
  const [spots, setSpots] = useState<number | null>(null);
  const [level, setLevel] = useState<Level>('any');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the session as it is now.
  useEffect(() => {
    if (!x || ready) return;
    const at = hhmm(x.startsAt);
    setName(x.title);
    setDayKey(localDateKey(x.startsAt));
    setTime(at);
    setPeriod(periodFor(at));
    setDuration(x.durationMin);
    setPlace(x.place ?? '');
    setSpots(x.capacity);
    setLevel(x.difficulty ?? 'any');
    setNotes(x.description ?? '');
    setReady(true);
  }, [x, ready]);

  const now = new Date();
  const days = useMemo(() => {
    const list = Array.from({ length: 14 }, (_, i) => addDays(startOfLocalDay(new Date()), i));
    // A session further ahead keeps its own day in the list.
    if (x && !list.some((d) => localDateKey(d) === localDateKey(x.startsAt))) list.push(startOfLocalDay(x.startsAt));
    return list;
  }, [x?.id]);
  const times = useMemo(() => {
    const list = [...SLOTS[period]];
    if (time && periodFor(time) === period && !list.includes(time)) list.push(time);
    return list.sort();
  }, [period, time]);
  const durations = useMemo(() => (DURATIONS.includes(duration) ? DURATIONS : [...DURATIONS, duration].sort((a, b) => a - b)), [duration]);

  const close = () => (router.canGoBack() ? router.back() : router.replace(`/session/${id}`));
  const fixed = !!x?.atCourt;
  const minSpots = Math.max(2, x?.goingCount ?? 0);
  const isPast = (key: string, v: string) => localDateTime(key, v).getTime() < Date.now() + 5 * 60000;

  async function save() {
    if (!x || busy) return;
    if (!name.trim()) {
      setError(t('session.errors.TITLE_NEEDED'));
      return;
    }
    const startsAt = fixed ? x.startsAt : localDateTime(dayKey, time);
    const moved = !fixed && (startsAt.getTime() !== x.startsAt.getTime() || duration !== x.durationMin || (place.trim() || null) !== (x.place ?? null));
    setBusy(true);
    setError(null);
    try {
      await updateSession(x.id, {
        title: name.trim(),
        startsAt,
        durationMin: fixed ? x.durationMin : duration,
        place: fixed ? x.place : place.trim() || null,
        capacity: x.dropIn ? null : spots,
        difficulty: level === 'any' ? null : level,
        notes,
      });
      haptic('success');
      toast.show(moved && x.goingCount > 1 ? t('session.editSavedTold') : t('session.editSaved'), 'yours');
      q.refetch();
      close();
    } catch (e: any) {
      haptic('error');
      setError(t(errorKey('session', e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.header, { paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 8 }]}>
        <TextButton label={t('common.cancel')} onPress={close} color={p.inkSoft} />
        <Txt v="headline" style={{ flex: 1 }} align="center">
          {t('session.editSession')}
        </Txt>
        <View style={{ width: 60 }} />
      </View>

      {!ready ? null : (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SectionHeading title={t('host.name')} />
          <Field value={name} onChangeText={setName} maxLength={80} />

          {fixed ? (
            <Txt v="caption" style={s.gap}>
              {t('session.editCourtFixed')}
            </Txt>
          ) : (
            <>
              <SectionHeading title={t('host.day')} style={s.gap} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
                {days.map((d, i) => {
                  const key = localDateKey(d);
                  return (
                    <Chip
                      key={key}
                      label={i === 0 ? t('board.today') : i === 1 ? t('board.tomorrow') : fmtDay(d, lang, now)}
                      selected={dayKey === key}
                      onPress={() => setDayKey(key)}
                    />
                  );
                })}
              </ScrollView>

              <SectionHeading title={t('host.time')} style={s.gap} />
              <Segmented value={period} onChange={setPeriod} options={(Object.keys(SLOTS) as Period[]).map((k) => ({ value: k, label: t(`periods.${k}`) }))} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.row, { marginTop: 10 }]}>
                {times.map((v) => {
                  const past = isPast(dayKey, v);
                  const { time: c, suffix } = clockParts(localDateTime('2000-01-01', v), lang);
                  return <Chip key={v} label={`${c} ${suffix}`} selected={time === v} disabled={past} struck={past} onPress={() => setTime(v)} />;
                })}
              </ScrollView>
              <Txt v="caption" style={{ marginTop: 6 }}>
                {t('session.editTold')}
              </Txt>

              <SectionHeading title={t('host.duration')} style={s.gap} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
                {durations.map((d) => (
                  <Chip key={d} label={durationLabel(d, lang)} selected={duration === d} onPress={() => setDuration(d)} />
                ))}
              </ScrollView>

              <SectionHeading title={t('host.place')} style={s.gap} />
              <Field value={place} onChangeText={setPlace} maxLength={120} />
            </>
          )}

          {x?.dropIn ? null : (
            <>
              <SectionHeading title={t('host.spots')} style={s.gap} />
              <View style={s.stepper}>
                <Press
                  onPress={() => setSpots((n) => (n == null ? null : n <= minSpots ? n : n - 1))}
                  feedback="selection"
                  accessibilityLabel="−"
                  style={s.stepBtn}
                >
                  <Icon name="minus" size={18} />
                </Press>
                <Txt v="time" size={24} style={{ minWidth: 110, textAlign: 'center' }}>
                  {spots == null ? t('session.noLimit') : String(spots)}
                </Txt>
                <Press onPress={() => setSpots((n) => (n == null ? minSpots : Math.min(200, n + 1)))} feedback="selection" accessibilityLabel="+" style={s.stepBtn}>
                  <Icon name="plus" size={18} />
                </Press>
              </View>
              {spots != null ? <TextButton label={t('session.noLimit')} onPress={() => setSpots(null)} color={p.aqua} /> : null}
            </>
          )}

          <SectionHeading title={t('host.level')} style={s.gap} />
          <Segmented
            value={level}
            onChange={setLevel}
            options={[
              { value: 'easy', label: t('session.difficulty.easy') },
              { value: 'medium', label: t('session.difficulty.medium') },
              { value: 'hard', label: t('session.difficulty.hard') },
              { value: 'any', label: t('host.anyLevel') },
            ]}
          />

          <SectionHeading title={t('host.notes')} style={s.gap} />
          <Field value={notes} onChangeText={setNotes} placeholder={t('host.notesPlaceholder')} multiline maxLength={600} />
        </ScrollView>
      )}

      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        {error ? (
          <Txt v="meta" color={p.danger} align="center" style={{ marginBottom: 8 }}>
            {error}
          </Txt>
        ) : null}
        <MarkerButton label={busy ? t('session.editSaving') : t('session.editSave')} onPress={save} loading={busy} />
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
  content: { padding: 16, paddingBottom: 40 },
  gap: { marginTop: 18 },
  row: { gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: p.ruleStrong, borderRadius: 10, padding: 4 },
  stepBtn: { width: 48, height: 44, borderRadius: 8, backgroundColor: p.wash, alignItems: 'center', justifyContent: 'center' },
  bar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
