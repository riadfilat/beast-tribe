import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { addDays, clockParts, fmtClock, fmtDay, localDateKey, localDateTime, startOfLocalDay } from '../src/i18n/format';
import { useAuth } from '../src/providers/AuthProvider';
import { hostSession, SessionError } from '../src/data/sessions';
import { useCoaches, useMyPackList, useMySports, usePopularSpots } from '../src/data/member';
import { useMyCommunities } from '../src/data/communities';
import { useMyCaptaincies } from '../src/data/captains';
import { cityLabel } from '../src/lib/cities';
import { PREVIEW, PREVIEW_ME } from '../src/data/preview';
import { SPORT_LIST, SportId } from '../src/lib/sports';
import { PAYMENTS_ENABLED, SESSION_LINK_BASE } from '../src/lib/constants';
import { bookCoach, useCoachSlots } from '../src/data/coaching';
import { useWorkouts } from '../src/data/workouts';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { Sun } from '../src/components/board/marks';
import { Chip, Field, MarkerButton, OutlineButton, Segmented, SectionHeading, TextButton } from '../src/components/board/controls';
import { Group, GroupRow } from '../src/components/board/list';
import { haptic } from '../src/lib/haptics';

const SLOTS: Record<'dawn' | 'morning' | 'afternoon' | 'evening' | 'night', string[]> = {
  dawn: ['04:30', '05:00', '05:30', '06:00', '06:30'],
  morning: ['07:00', '07:30', '08:00', '09:00', '10:00', '11:00'],
  afternoon: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
  evening: ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
  night: ['21:00', '21:30', '22:00', '22:30', '23:00'],
};
const DEFAULT_SPOTS: Partial<Record<SportId, number>> = {
  padel: 4, tennis: 4, pickleball: 4, badminton: 4, football: 14, basketball: 10, volleyball: 12,
};
const DURATIONS = [30, 45, 60, 90, 120, 180];

function periodOf(hhmm: string) {
  const h = Number(hhmm.split(':')[0]);
  if (h >= 4 && h < 7) return 'dawn';
  if (h >= 7 && h < 12) return 'morning';
  if (h >= 12 && h < 15) return 'midday';
  if (h >= 15 && h < 18) return 'afternoon';
  if (h >= 18 && h < 21) return 'evening';
  return 'night';
}

export default function HostScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ spot?: string; community?: string; pack?: string; workout?: string }>();
  const { user, profile } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const country = profile?.region || 'SA';
  const spots = usePopularSpots(country, lang).data ?? [];
  const mySports = useMySports().data ?? [];
  const packs = useMyPackList().data ?? [];
  const communities = useMyCommunities().data ?? [];
  const coaches = useCoaches().data ?? [];
  const workouts = useWorkouts(lang).data ?? [];

  const [sport, setSport] = useState<SportId | null>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [place, setPlace] = useState('');
  const [city, setCity] = useState(profile?.city || '');
  const [name, setName] = useState('');
  const [spotsCount, setSpotsCount] = useState<number | null>(null);
  const [spotsTouched, setSpotsTouched] = useState(false);
  const [more, setMore] = useState(false);
  const [duration, setDuration] = useState(60);
  const [level, setLevel] = useState<'any' | 'easy' | 'medium' | 'hard'>('any');
  const [womenOnly, setWomenOnly] = useState(false);
  const [guests, setGuests] = useState(false);
  const [dropIn, setDropIn] = useState(true);
  const [repeat, setRepeat] = useState<'1' | '4' | '8'>('1');
  // Every session lives somewhere: one of my communities or one of my packs.
  const [audience, setAudience] = useState<{ kind: 'community' | 'pack'; id: string } | null>(
    params.pack ? { kind: 'pack', id: params.pack } : params.community ? { kind: 'community', id: params.community } : null,
  );
  const [price, setPrice] = useState('');
  const [coachId, setCoachId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(params.workout ?? null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; title: string } | null>(null);

  const now = new Date();
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfLocalDay(now), i)), []);
  const coach = coaches.find((c) => c.id === coachId) ?? null;
  // Default: the first community (private ones are listed first).
  const where = audience ?? (communities[0] ? { kind: 'community' as const, id: communities[0].id } : null);
  const packId = where?.kind === 'pack' ? where.id : null;
  const communityId = where?.kind === 'community' ? where.id : null;
  const chosen = communityId ? communities.find((c) => c.id === communityId) : null;
  const guestable = !!chosen && !chosen.open && chosen.allowGuests !== false;
  const coachSlots = useCoachSlots(coachId, dayKey).data ?? [];
  // A Beast Captain hosting in their community: open sessions, repeated weekly.
  const captaincy = (useMyCaptaincies().data ?? []).find((c) => c.communityId === communityId) ?? null;
  const open = !!captaincy && dropIn;

  // Preselect a spot handed over from the board.
  useEffect(() => {
    if (!params.spot || !spots.length || spotId) return;
    const spot = spots.find((x) => x.id === params.spot);
    if (spot) pickSpot(spot.id);
  }, [params.spot, spots.length]);

  // A workout handed over from Train ("with your crew") sets the sport, the length and the name.
  useEffect(() => {
    if (!params.workout) return;
    const w = workouts.find((x) => x.id === params.workout);
    if (!w) return;
    setSport((v) => v ?? (SPORT_LIST.some((x) => x.id === w.sport) ? w.sport : v));
    setDuration((v) => DURATIONS.find((d) => d >= w.minutes) ?? v);
    setName((v) => v || w.title);
  }, [params.workout, workouts.length]);

  // Sensible spots per sport until the host sets it.
  useEffect(() => {
    if (sport && !spotsTouched) setSpotsCount(DEFAULT_SPOTS[sport] ?? null);
  }, [sport]);

  const sportOrder = useMemo(() => {
    const mine = SPORT_LIST.filter((x) => mySports.includes(x.id));
    const rest = SPORT_LIST.filter((x) => !mySports.includes(x.id));
    return [...mine, ...rest];
  }, [mySports]);

  const spotChoices = spots.filter((x) => !sport || x.sports.includes(sport));
  const autoTitle = sport && time ? t('autoTitle', { period: t(`periods.${periodOf(time)}`), sport: t(`sportNoun.${sport}`) }) : '';
  const example = autoTitle || t('autoTitle', { period: t('periods.evening'), sport: t('sportNoun.padel') });

  function pickSpot(id: string) {
    const spot = spots.find((x) => x.id === id);
    if (!spot) return;
    setSpotId(id);
    setPlace(spot.name);
    setCity(spot.city);
    if (!sport && spot.sports[0]) setSport(spot.sports[0] as SportId);
  }

  function isPast(key: string, hhmm: string) {
    return localDateTime(key, hhmm).getTime() < Date.now() - 5 * 60000;
  }

  async function pickCover() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 10], quality: 0.85 });
    if (!res.canceled && res.assets[0]) setCover(res.assets[0].uri);
  }

  async function submit() {
    setError('');
    if (!sport || !dayKey || !time) {
      setError(t('host.errMissing'));
      haptic('warning');
      return;
    }
    if (isPast(dayKey, time)) {
      setError(t('host.errPast'));
      haptic('warning');
      return;
    }
    if (!meId) return;
    setBusy(true);
    try {
      const startsAt = localDateTime(dayKey, time);
      const spot = spots.find((x) => x.id === spotId);
      const title = name.trim() || autoTitle;
      const { id, photoFailed } = await hostSession(meId, {
        title,
        sport,
        startsAt,
        durationMin: duration,
        place,
        city,
        lat: spot?.lat ?? null,
        lng: spot?.lng ?? null,
        capacity: open ? null : spotsCount,
        dropIn: open,
        repeatWeeks: captaincy ? Number(repeat) : 1,
        difficulty: level === 'any' ? null : level,
        womenOnly,
        guestInvite: guestable && guests,
        packId,
        communityId,
        priceSar: PAYMENTS_ENABLED && Number(price) > 0 ? Number(price) : null,
        workoutId,
        coachName: coach?.name ?? null,
        notes,
        cover: cover ?? spot?.imageUrl ?? null,
        country,
      });
      if (coach && coachSlots.some((x) => x.start === time && !x.booked)) {
        // The session is already live; a failed booking shouldn't undo it.
        await bookCoach(meId, coach.id, dayKey, time, fmtEnd(time, duration), id).catch(() => {});
      }
      haptic('success');
      if (photoFailed) setError(t('host.errPhoto'));
      setDone({ id, title });
    } catch (e: any) {
      haptic('error');
      setError(t(`session.errors.${e instanceof SessionError ? e.code : 'generic'}`));
    } finally {
      setBusy(false);
    }
  }

  function invite() {
    if (!done || !dayKey || !time) return;
    const startsAt = localDateTime(dayKey, time);
    Share.share({
      message: t('session.shareMessage', {
        title: done.title,
        when: `${fmtDay(startsAt, lang)} ${fmtClock(startsAt, lang)}`,
        place: [place, city].filter(Boolean).join(' · ') || t(`sports.${sport}`),
        link: `${SESSION_LINK_BASE}${done.id}`,
      }),
    }).catch(() => {});
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));

  // ─── Success ──────────────────────────────────────────────────────────────
  if (done && dayKey && time) {
    const { time: clock, suffix } = clockParts(localDateTime(dayKey, time), lang);
    return (
      <View style={[s.screen, s.doneWrap, { paddingBottom: insets.bottom + 20 }]}>
        <Sun size={150} rise>
          <Txt v="stencil" size={50} color={p.onMarker}>
            {clock}
          </Txt>
          <Txt v="label" size={13} color={p.onMarker}>
            {suffix}
          </Txt>
        </Sun>
        <Txt v="title" size={28} align="center" style={{ marginTop: 22 }}>
          {t('host.successTitle')}
        </Txt>
        <Txt v="body" color={p.inkSoft} align="center">
          {done.title} · {fmtDay(localDateTime(dayKey, time), lang)}
        </Txt>
        <Txt v="meta" align="center" style={{ marginTop: 4 }}>
          {t('host.successBody')}
        </Txt>
        {error ? (
          <Txt v="meta" color={p.danger} align="center">
            {error}
          </Txt>
        ) : null}
        <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 26 }}>
          <MarkerButton label={t('host.shareNow')} icon="share" onPress={invite} />
          <OutlineButton
            label={t('common.done')}
            onPress={() => {
              router.back();
              setTimeout(() => router.push({ pathname: '/session/[id]', params: { id: done.id } }), 250);
            }}
          />
        </View>
      </View>
    );
  }

  const timeRows: { key: string; label: string; times: { v: string; booked?: boolean }[] }[] = coach && dayKey
    ? [{ key: 'coach', label: coach.name, times: coachSlots.map((x) => ({ v: x.start, booked: x.booked })) }]
    : (Object.keys(SLOTS) as (keyof typeof SLOTS)[]).map((k) => ({ key: k, label: t(`periods.${k}`), times: SLOTS[k].map((v) => ({ v })) }));

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Sheet header */}
      <View style={[s.header, { paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 8 }]}>
        <TextButton label={t('common.cancel')} onPress={close} color={p.inkSoft} />
        <Txt v="headline" style={{ flex: 1 }} align="center">
          {t('host.title')}
        </Txt>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SectionHeading title={t('host.sport')} />
        <View style={s.wrap}>
          {sportOrder.map((x) => (
            <Chip key={x.id} sport={x.id} label={t(`sports.${x.id}`)} selected={sport === x.id} onPress={() => setSport(x.id)} />
          ))}
        </View>

        {communities.length + packs.length > 1 ? (
          <>
            <SectionHeading title={t('host.audience')} style={s.gap} />
            <Txt v="meta" style={{ marginTop: -6, marginBottom: 8 }}>
              {t('host.audienceSub')}
            </Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
              {communities.map((c) => (
                <Chip key={c.id} label={c.name} icon={c.open ? 'people' : 'shield'} selected={where?.kind === 'community' && where.id === c.id} onPress={() => setAudience({ kind: 'community', id: c.id })} />
              ))}
              {packs.map((x) => (
                <Chip key={x.id} label={x.name} icon="lock" selected={where?.kind === 'pack' && where.id === x.id} onPress={() => setAudience({ kind: 'pack', id: x.id })} />
              ))}
            </ScrollView>
            {/* A private community's session: the host can let outsiders join with the session's link. */}
            {guestable ? (
              <Group style={{ marginTop: 10 }}>
                <GroupRow label={t('host.guests')} toggle={guests} onToggle={setGuests} />
              </Group>
            ) : null}
          </>
        ) : null}

        {workouts.length ? (
          <>
            <SectionHeading title={t('host.workout')} style={s.gap} />
            <Txt v="meta" style={{ marginTop: -6, marginBottom: 8 }}>
              {t('host.workoutSub')}
            </Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
              <Chip label={t('host.workoutNone')} selected={!workoutId} onPress={() => setWorkoutId(null)} />
              {workouts
                .filter((w) => !sport || w.sport === sport || w.id === workoutId)
                .slice(0, 12)
                .map((w) => (
                  <Chip key={w.id} label={w.title} icon="train" selected={workoutId === w.id} onPress={() => setWorkoutId(workoutId === w.id ? null : w.id)} />
                ))}
            </ScrollView>
          </>
        ) : null}

        <SectionHeading title={t('host.day')} style={s.gap} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {days.map((d, i) => {
            const key = localDateKey(d);
            return (
              <Chip
                key={key}
                label={i === 0 ? t('board.today') : i === 1 ? t('board.tomorrow') : fmtDay(d, lang, now)}
                selected={dayKey === key}
                onPress={() => {
                  setDayKey(key);
                  if (time && isPast(key, time)) setTime(null);
                }}
              />
            );
          })}
        </ScrollView>

        <SectionHeading title={t('host.time')} style={s.gap} />
        <View style={{ gap: 12 }}>
          {timeRows.map((r) =>
            r.times.length ? (
              <View key={r.key} style={{ gap: 6 }}>
                <Txt v="label" size={13} color={p.inkSoft}>
                  {r.label}
                </Txt>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
                  {r.times.map(({ v, booked }) => {
                    const past = !!dayKey && isPast(dayKey, v);
                    const { time: c, suffix } = clockParts(localDateTime('2000-01-01', v), lang);
                    return (
                      <Chip key={v} label={`${c} ${suffix}`} selected={time === v} disabled={past || booked} struck={past || booked} onPress={() => setTime(v)} />
                    );
                  })}
                </ScrollView>
              </View>
            ) : null,
          )}
        </View>

        <SectionHeading title={t('host.place')} style={s.gap} />
        {spotChoices.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.row, { paddingBottom: 12 }]}>
            {spotChoices.slice(0, 10).map((x) => (
              <Press key={x.id} onPress={() => pickSpot(x.id)} feedback="selection" style={[s.spot, spotId === x.id ? { borderColor: p.ink } : null]}>
                {x.imageUrl ? <Image source={{ uri: x.imageUrl }} style={s.spotImg} /> : <View style={[s.spotImg, { backgroundColor: p.wash }]} />}
                <View style={{ padding: 8 }}>
                  <Txt v="label" size={13} numberOfLines={1}>
                    {x.name}
                  </Txt>
                  <Txt v="caption" size={11}>
                    {cityLabel(x.city, lang)}
                  </Txt>
                </View>
                {spotId === x.id ? (
                  <View style={s.spotCheck}>
                    <Icon name="check" size={12} color={p.board} weight="bold" />
                  </View>
                ) : null}
              </Press>
            ))}
          </ScrollView>
        ) : null}
        <View style={{ gap: 10 }}>
          <Field value={place} onChangeText={(v) => { setPlace(v); setSpotId(null); }} placeholder={t('host.placePlaceholder')} />
          <Field value={city} onChangeText={setCity} placeholder={t('host.cityPlaceholder')} />
        </View>

        <SectionHeading title={t('host.name')} style={s.gap} />
        <Field value={name} onChangeText={setName} placeholder={t('host.namePlaceholder', { example })} maxLength={80} />

        {captaincy ? (
          <View style={{ gap: 10 }}>
            <SectionHeading title={t('captain.hostTitle')} style={s.gap} />
            <Group>
              <GroupRow label={t('captain.openSession')} sub={t('captain.openSessionSub')} toggle={dropIn} onToggle={setDropIn} />
            </Group>
            <Segmented
              options={[
                { value: '1', label: t('captain.once') },
                { value: '4', label: t('captain.weeks', { n: 4 }) },
                { value: '8', label: t('captain.weeks', { n: 8 }) },
              ]}
              value={repeat}
              onChange={setRepeat}
            />
            <Txt v="caption">{t('captain.weekHint', { have: captaincy.thisWeek, target: captaincy.target })}</Txt>
          </View>
        ) : null}

        {open ? null : <SectionHeading title={t('host.spots')} style={s.gap} />}
        <View style={[s.stepper, open ? { display: 'none' } : null]}>
          <Press
            onPress={() => { setSpotsTouched(true); setSpotsCount((n) => (n == null ? null : n <= 2 ? null : n - 1)); }}
            feedback="selection"
            accessibilityLabel="−"
            style={s.stepBtn}
          >
            <Icon name="minus" size={18} />
          </Press>
          <Txt v="time" size={24} style={{ minWidth: 110, textAlign: 'center' }}>
            {spotsCount == null ? t('session.noLimit') : String(spotsCount)}
          </Txt>
          <Press
            onPress={() => { setSpotsTouched(true); setSpotsCount((n) => (n == null ? 2 : Math.min(200, n + 1))); }}
            feedback="selection"
            accessibilityLabel="+"
            style={s.stepBtn}
          >
            <Icon name="plus" size={18} />
          </Press>
        </View>

        <Press onPress={() => setMore((m) => !m)} feedback="selection" style={s.moreToggle}>
          <Txt v="label" size={15} color={p.aqua}>
            {more ? t('host.less') : t('host.more')}
          </Txt>
          <Icon name="chevron" size={12} color={p.aqua} weight="bold" style={{ transform: [{ rotate: more ? '-90deg' : '90deg' }] }} />
        </Press>

        {more ? (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 8 }}>
              <SectionHeading title={t('host.duration')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
                {DURATIONS.map((d) => (
                  <Chip key={d} label={durationLabel(d, lang)} selected={duration === d} onPress={() => setDuration(d)} />
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: 8 }}>
              <SectionHeading title={t('host.level')} />
              <Segmented
                value={level}
                onChange={setLevel}
                options={[
                  { value: 'any', label: t('host.anyLevel') },
                  { value: 'easy', label: t('session.difficulty.easy') },
                  { value: 'medium', label: t('session.difficulty.medium') },
                  { value: 'hard', label: t('session.difficulty.hard') },
                ]}
              />
            </View>

            <Group>
              {profile?.gender === 'female' || PREVIEW ? (
                <GroupRow label={t('host.womenOnly')} sub={t('host.womenOnlySub')} toggle={womenOnly} onToggle={setWomenOnly} />
              ) : null}
            </Group>

            {PAYMENTS_ENABLED ? (
              <View style={{ gap: 8 }}>
                <SectionHeading title={t('host.price')} />
                <Field value={price} onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ''))} placeholder={t('host.priceFree')} keyboardType="decimal-pad" maxLength={6} />
              </View>
            ) : null}

            <View style={{ gap: 8 }}>
              <SectionHeading title={t('host.coach')} />
              {coaches.filter((c) => !sport || !c.sports.length || c.sports.includes(sport)).length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
                  {coaches
                    .filter((c) => !sport || !c.sports.length || c.sports.includes(sport))
                    .map((c) => (
                      <Chip key={c.id} label={c.name} icon="coach" selected={coachId === c.id} onPress={() => { setCoachId(coachId === c.id ? null : c.id); setTime(null); }} />
                    ))}
                </ScrollView>
              ) : (
                <Txt v="meta">{t('host.coachEmpty')}</Txt>
              )}
            </View>

            <View style={{ gap: 8 }}>
              <SectionHeading title={t('host.notes')} />
              <Field value={notes} onChangeText={setNotes} placeholder={t('host.notesPlaceholder')} multiline maxLength={600} />
            </View>

            <View style={{ gap: 8 }}>
              <SectionHeading title={t('host.cover')} />
              {cover ? (
                <View>
                  <Image source={{ uri: cover }} style={s.cover} />
                  <TextButton label={t('common.remove')} onPress={() => setCover(null)} color={p.danger} />
                </View>
              ) : (
                <OutlineButton label={t('host.addCover')} icon="photo" onPress={pickCover} />
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        {error ? (
          <Txt v="meta" color={p.danger} align="center" style={{ marginBottom: 8 }}>
            {error}
          </Txt>
        ) : null}
        <MarkerButton label={busy ? t('host.submitting') : t('host.submit')} onPress={submit} loading={busy} />
      </View>
    </KeyboardAvoidingView>
  );
}

function fmtEnd(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function durationLabel(min: number, lang: string) {
  if (lang === 'ar') {
    if (min === 30) return '30 دقيقة';
    if (min === 45) return '45 دقيقة';
    if (min === 60) return 'ساعة';
    if (min === 90) return 'ساعة ونصف';
    if (min === 120) return 'ساعتان';
    return '3 ساعات';
  }
  if (min < 60) return `${min} min`;
  if (min === 90) return '1.5 h';
  return `${min / 60} h`;
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
  content: { padding: 16, paddingBottom: 40 },
  gap: { marginTop: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { gap: 8 },
  spot: { width: 150, borderRadius: 10, borderWidth: 1.5, borderColor: p.rule, overflow: 'hidden' },
  spotImg: { width: '100%', height: 84 },
  spotCheck: { position: 'absolute', top: 6, end: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: p.ruleStrong, borderRadius: 10, padding: 4 },
  stepBtn: { width: 48, height: 44, borderRadius: 8, backgroundColor: p.wash, alignItems: 'center', justifyContent: 'center' },
  moreToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, marginTop: 14 },
  cover: { width: '100%', height: 180, borderRadius: 10 },
  bar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
  doneWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
}));
