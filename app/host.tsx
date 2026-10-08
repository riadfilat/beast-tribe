import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Platform, ScrollView, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sportIdOf } from '../src/lib/sports';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { addDays, clockParts, fmtClock, fmtDay, localDateKey, localDateTime, startOfLocalDay } from '../src/i18n/format';
import { useAuth } from '../src/providers/AuthProvider';
import { hostAtCourt, hostSession } from '../src/data/sessions';
import { useHostPlaces, type Place } from '../src/data/places';
import { BookError, useFacilitySlots } from '../src/data/facilities';
import { useCoaches, useMyPackList, useMySports } from '../src/data/member';
import { useMyCommunities } from '../src/data/communities';
import { useMyCaptaincies } from '../src/data/captains';
import { CITIES, cityKey, cityLabel } from '../src/lib/cities';
import { nearestCity, refreshPosition, useMyPosition } from '../src/lib/location';
import { Sheet } from '../src/components/board/sheet';
import { PREVIEW, PREVIEW_ME } from '../src/data/preview';
import { COURT_SPORTS, ROUTE_SPORTS, SPORT_LIST, SportId, sportsByPopularity } from '../src/lib/sports';
import { fmtDistance, Route, useRoutePick, useRoutesNear } from '../src/data/routes';
import { RouteSketch } from '../src/components/board/route';
import { SportSearchList } from '../src/components/board/SportPicker';
import { PAYMENTS_ENABLED, SESSION_LINK_BASE } from '../src/lib/constants';
import { bookCoach, useCoachSlots } from '../src/data/coaching';
import { useWorkouts } from '../src/data/workouts';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { Sun } from '../src/components/board/marks';
import { Chip, Dropdown, Field, MarkerButton, OutlineButton, Segmented, SectionHeading, TextButton } from '../src/components/board/controls';
import { Group, GroupRow } from '../src/components/board/list';
import { haptic } from '../src/lib/haptics';
import { DURATIONS, Period, SLOTS, durationLabel } from '../src/lib/times';
import { errorKey } from '../src/data/errors';

const DEFAULT_SPOTS: Partial<Record<SportId, number>> = {
  padel: 4, tennis: 4, pickleball: 4, badminton: 4, football: 14, basketball: 10, volleyball: 12,
};

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
  const { t, tn } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ spot?: string; community?: string; pack?: string; workout?: string; sport?: string }>();
  const { user, profile } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const country = profile?.region || 'SA';
  const mySports = useMySports().data ?? [];
  const packs = useMyPackList().data ?? [];
  const communities = useMyCommunities().data ?? [];
  const coaches = useCoaches().data ?? [];
  const workouts = useWorkouts(lang).data ?? [];

  const [sport, setSport] = useState<SportId | null>(params.sport ? sportIdOf(params.sport) : null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [picked, setPicked] = useState<Place | null>(null);
  const [slotAt, setSlotAt] = useState<number | null>(null);
  const [sportsOpen, setSportsOpen] = useState(false);
  // A run's route: picked from the city's routes or drawn on the map.
  const [route, setRoute] = useState<Route | null>(null);
  const [routesOpen, setRoutesOpen] = useState(false);
  const [period, setPeriod] = useState<Period>(() => {
    const h = new Date().getHours();
    return h < 11 ? 'morning' : h < 16 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  });
  const [place, setPlace] = useState('');
  const [city, setCity] = useState(profile?.city || '');
  const [name, setName] = useState('');
  const [spotsCount, setSpotsCount] = useState<number | null>(null);
  const [spotsTouched, setSpotsTouched] = useState(false);
  const [more, setMore] = useState(false);
  const [duration, setDuration] = useState(60);
  // The level the game is for: the host's own level to start with (players at it, or one below, can join).
  const [level, setLevel] = useState<'any' | 'easy' | 'medium' | 'hard'>(() => {
    const own = (profile?.experience_level || '').toLowerCase();
    return own === 'beginner' || own === 'dreamer' ? 'easy' : own === 'intermediate' || own === 'seeker' ? 'medium' : own === 'advanced' || own === 'mover' || own === 'expert' ? 'hard' : 'any';
  });
  const [waitlist, setWaitlist] = useState<'0' | '1' | '2' | '3'>('3');
  const [womenOnly, setWomenOnly] = useState(false);
  const [menOnly, setMenOnly] = useState(false);
  const gender = (profile?.gender || '').toLowerCase();
  const [guests, setGuests] = useState(false);
  const [dropIn, setDropIn] = useState(true);
  const [repeat, setRepeat] = useState<'1' | '4' | '8'>('1');
  // Every session lives somewhere: one of my communities or one of my packs.
  const [audience, setAudience] = useState<{ kind: 'community' | 'pack'; id: string } | null>(
    params.pack ? { kind: 'pack', id: params.pack } : params.community ? { kind: 'community', id: params.community } : null,
  );
  const [price, setPrice] = useState('');
  // A court booked with the venue (we can't see its times): who has booked it, and what it costs.
  const [courtBooking, setCourtBooking] = useState<'booked' | 'pending'>('pending');
  const [courtPrice, setCourtPrice] = useState('');
  const [coachId, setCoachId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  // No workout picker: a session only carries a workout when it was started from one in Train.
  const [workoutId] = useState<string | null>(params.workout ?? null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; title: string } | null>(null);

  const now = new Date();
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfLocalDay(now), i)), []);
  const coach = coaches.find((c) => c.id === coachId) ?? null;
  // The phone's position (asked once, kept on the phone) picks the city and sorts places by distance.
  const pos = useMyPosition();
  useEffect(() => {
    refreshPosition(true);
  }, []);
  // Places follow the chosen city (plus my own community's courts).
  const places = useHostPlaces(sport, lang, pos, city);
  const routes = useRoutesNear(city || null, sport && ROUTE_SPORTS.includes(sport) ? sport : null);
  // A route drawn on the map comes back here.
  const drawn = useRoutePick((st) => st.route);
  useEffect(() => {
    if (!drawn) return;
    setRoute(drawn);
    if (!place.trim() && !picked) setPlace(drawn.name);
    useRoutePick.getState().set(null);
  }, [drawn]);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);
  const [custom, setCustom] = useState('');
  // A bookable court: its free slots, length and rules decide the time; booking it creates the session.
  const court = picked?.facility?.bookable ? picked.facility : null;
  const courtSlots = useFacilitySlots(court?.id, dayKey ?? localDateKey(now)).data ?? [];
  // A community's court lives in that community; otherwise the first community (private ones are listed first).
  const where = court?.communityId
    ? { kind: 'community' as const, id: court.communityId }
    : audience ?? (communities[0] ? { kind: 'community' as const, id: communities[0].id } : null);
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
    if (!params.spot || picked) return;
    const spot = [...places.community, ...places.more].find((x) => x.key === `s:${params.spot}`);
    if (spot) pickPlace(spot);
  }, [params.spot, places.more.length]);

  // Where the member is: the nearest known city, until they pick one themselves.
  useEffect(() => {
    if (!pos || cityTouched || picked) return;
    const c = nearestCity(pos);
    if (c) setCity(c);
  }, [pos?.lat, pos?.lng]);

  // No position (yet): the city on the member's profile, once it has loaded.
  useEffect(() => {
    if (!city && !cityTouched && !picked && profile?.city) setCity(profile.city);
  }, [profile?.city]);

  // A place that doesn't fit a newly picked sport is let go.
  useEffect(() => {
    if (picked && sport && !picked.sports.includes(sport)) setPicked(null);
  }, [sport]);

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

  // My sports as quick picks (the most popular ones for someone who hasn't chosen any); every other
  // sport is in "More sports": a searchable list, most popular first.
  const shownSports = useMemo(() => {
    const quick = mySports.length ? SPORT_LIST.filter((x) => mySports.includes(x.id)) : sportsByPopularity().slice(0, 6);
    const extra = sport && !quick.some((x) => x.id === sport) ? SPORT_LIST.filter((x) => x.id === sport) : [];
    return [...quick, ...extra];
  }, [mySports, sport]);

  const autoTitle = sport && time ? t('autoTitle', { period: t(`periods.${periodOf(time)}`), sport: t(`sportNoun.${sport}`) }) : '';
  const example = autoTitle || t('autoTitle', { period: t('periods.evening'), sport: t('sportNoun.padel') });

  function pickPlace(x: Place) {
    setPlaceOpen(false);
    if (picked?.key === x.key) return;
    setPicked(x);
    setPlace(x.name);
    setCity(x.city ?? '');
    setSlotAt(null);
    if (!sport) setSport((x.sports.find((v) => mySports.includes(v as any)) ?? x.sports[0] ?? null) as SportId | null);
    const f = x.facility;
    if (f?.bookable) {
      setDuration(f.slotMinutes);
      setCoachId(null);
      if (!spotsTouched) setSpotsCount(f.maxPlayers);
    }
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
    if (court) return submitCourt();
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
      const spot = picked;
      const title = name.trim() || autoTitle;
      const { id, photoFailed } = await hostSession(meId, {
        title,
        sport,
        startsAt,
        durationMin: duration,
        place,
        city,
        lat: spot?.lat ?? (routeFits && route ? route.start[1] : null),
        lng: spot?.lng ?? (routeFits && route ? route.start[0] : null),
        routeId: routeFits ? route?.id ?? null : null,
        capacity: open ? null : spotsCount,
        dropIn: open,
        waitlistMax: Number(waitlist),
        repeatWeeks: captaincy ? Number(repeat) : 1,
        difficulty: level === 'any' ? null : level,
        womenOnly: gender === 'female' && womenOnly,
        menOnly: gender === 'male' && menOnly,
        guestInvite: guestable && guests,
        packId,
        communityId,
        priceSar: PAYMENTS_ENABLED && Number(price) > 0 ? Number(price) : null,
        workoutId,
        coachName: coach?.name ?? null,
        notes,
        cover: cover ?? spot?.imageUrl ?? null,
        country,
        courtBooking: venueCourt ? courtBooking : null,
        courtPrice: venueCourt && Number(courtPrice) > 0 ? Number(courtPrice) : null,
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
      setError(t(errorKey('session', e)));
    } finally {
      setBusy(false);
    }
  }

  async function submitCourt() {
    if (!court || !sport || !dayKey || !slotAt) {
      setError(t('host.errMissing'));
      haptic('warning');
      return;
    }
    if (!meId) return;
    setBusy(true);
    try {
      const title = name.trim() || autoTitle || court.name;
      const { id, photoFailed } = await hostAtCourt(meId, {
        facilityId: court.id,
        startsAt: new Date(slotAt),
        players: Math.min(spotsCount ?? court.maxPlayers, court.maxPlayers),
        title,
        sport,
        communityId: where?.kind === 'community' ? where.id : null,
        packId,
        difficulty: level === 'any' ? null : level,
        womenOnly: gender === 'female' && womenOnly,
        menOnly: gender === 'male' && menOnly,
        guestInvite: guestable && guests,
        coachName: coach?.name ?? null,
        notes,
        cover,
        waitlistMax: Number(waitlist),
      });
      haptic('success');
      if (photoFailed) setError(t('host.errPhoto'));
      const at = new Date(slotAt);
      setTime(`${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`);
      setDone({ id, title });
    } catch (e: any) {
      haptic('error');
      setError(t(errorKey(e instanceof BookError ? 'courts' : 'session', e)));
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

  const timeRows: { key: string; label: string; times: { v: string; booked?: boolean }[] }[] = coach && dayKey && !court
    ? [{ key: 'coach', label: coach.name, times: coachSlots.map((x) => ({ v: x.start, booked: x.booked })) }]
    : [{ key: period, label: '', times: SLOTS[period].map((v) => ({ v })) }];
  // Runs, walks, rides and hikes follow a route.
  const routeFits = !!sport && ROUTE_SPORTS.includes(sport);
  // A court sport somewhere we can't book through the app.
  const venueCourt = !!sport && COURT_SPORTS.includes(sport) && !court && !!(picked || place.trim());
  const courtDay = court && dayKey ? courtSlots.filter((x) => x.startsAt.getTime() > Date.now()) : [];
  const courtClosed = !!court && !!dayKey && !court.openDays.includes(new Date(`${dayKey}T12:00:00`).getDay());

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
          {shownSports.map((x) => (
            <Chip key={x.id} sport={x.id} label={t(`sports.${x.id}`)} selected={sport === x.id} onPress={() => setSport(x.id)} />
          ))}
          <Chip label={t('host.moreSports')} icon="explore" onPress={() => setSportsOpen(true)} />
        </View>

        {communities.length + packs.length > 1 && !court?.communityId ? (
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

        {/* Women only for women, men only for men */}
        {gender === 'female' || gender === 'male' || PREVIEW ? (
          <Group style={s.gap}>
            {gender === 'male' ? (
              <GroupRow label={t('host.menOnly')} sub={t('host.menOnlySub')} toggle={menOnly} onToggle={setMenOnly} />
            ) : (
              <GroupRow label={t('host.womenOnly')} sub={t('host.womenOnlySub')} toggle={womenOnly} onToggle={setWomenOnly} />
            )}
          </Group>
        ) : null}

        {/* Where: the city first (set from the phone's position), then a place in that city: my community's
            courts first, then places for the sport nearest first, or somewhere else. */}
        <SectionHeading title={t('host.city')} style={s.gap} />
        <Dropdown label={cityLabel(city, lang) || t('host.chooseCity')} placeholder={!city} onPress={() => setCityOpen(true)} />
        <SectionHeading title={t('host.place')} style={{ marginTop: 14 }} />
        <Dropdown
          label={picked ? picked.name : place || t('host.choosePlace')}
          sub={picked ? [picked.facility?.communityName, cityLabel(picked.city, lang)].filter(Boolean).join(' · ') : null}
          image={picked?.imageUrl ?? null}
          placeholder={!picked && !place}
          onPress={() => setPlaceOpen(true)}
        />
        {court ? (
          <Txt v="caption" style={{ marginTop: 6 }}>
            {[t('host.courtNote', { min: court.slotMinutes, n: court.maxPlayers }), court.dailyLimit ? t('courts.dailyRule', { n: court.dailyLimit, sport: t(`sports.${court.sport}`) }) : null].filter(Boolean).join(' ')}
          </Txt>
        ) : null}

        {/* A run's route: the city's routes, most run first, or draw a new one. */}
        {routeFits ? (
          <View style={{ gap: 8, marginTop: 14 }}>
            <SectionHeading title={t('route.title')} />
            {route ? (
              <Press onPress={() => setRoutesOpen(true)} feedback="selection" style={s.routeCard}>
                <RouteSketch path={route.path} height={64} style={{ width: 64, borderRadius: 8 }} stroke={3} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt v="row" size={15} numberOfLines={1}>
                    {route.name}
                  </Txt>
                  <Txt v="meta">{[fmtDistance(route.distanceM, lang), route.isLoop ? t('route.loop') : null, route.runs ? tn('route.runs', route.runs) : null].filter(Boolean).join(' · ')}</Txt>
                </View>
                <Txt v="label" size={13} color={p.aqua}>
                  {t('route.change')}
                </Txt>
              </Press>
            ) : (
              <Dropdown label={t('route.pick')} placeholder onPress={() => setRoutesOpen(true)} />
            )}
          </View>
        ) : null}

        <Sheet visible={routesOpen} title={t('route.title')} onClose={() => setRoutesOpen(false)}>
          <View style={{ gap: 4 }}>
            <SectionHeading title={city ? t('route.near', { city: cityLabel(city, lang) }) : t('route.nearAny')} />
            {(routes.data ?? []).length ? (
              (routes.data ?? []).map((r) => (
                <Press
                  key={r.id}
                  onPress={() => {
                    setRoute(r);
                    if (!place.trim() && !picked) setPlace(r.name);
                    setRoutesOpen(false);
                  }}
                  feedback="selection"
                  style={s.routeRow}
                >
                  <RouteSketch path={r.path} height={52} style={{ width: 52, borderRadius: 8 }} stroke={2.5} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="row" size={15} numberOfLines={1}>
                      {r.name}
                    </Txt>
                    <Txt v="meta">{[fmtDistance(r.distanceM, lang), r.isLoop ? t('route.loop') : null, r.runs ? tn('route.runs', r.runs) : null].filter(Boolean).join(' · ')}</Txt>
                  </View>
                  {route?.id === r.id ? <Icon name="check" size={16} color={p.aqua} /> : null}
                </Press>
              ))
            ) : routes.loading ? null : (
              <Txt v="meta" style={{ paddingVertical: 8 }}>
                {t('route.none')}
              </Txt>
            )}
            <Press
              onPress={() => {
                setRoutesOpen(false);
                router.push({ pathname: '/route-draw', params: { sport: sport ?? 'running', city } } as any);
              }}
              feedback="selection"
              style={s.routeRow}
            >
              <Icon name="plus" size={18} color={p.aqua} />
              <Txt v="row" size={15} color={p.aqua}>
                {t('route.draw')}
              </Txt>
            </Press>
            {route ? <TextButton label={t('route.remove')} onPress={() => { setRoute(null); setRoutesOpen(false); }} color={p.inkSoft} /> : null}
          </View>
        </Sheet>

        {/* A court we can't book through: the host books it with the venue and says so here. */}
        {venueCourt ? (
          <View style={{ gap: 10, marginTop: 14 }}>
            {picked?.phone || picked?.bookingUrl ? (
              <View style={s.venueCard}>
                <Txt v="caption">{t('host.venueNote')}</Txt>
                <View style={{ flexDirection: 'row', gap: 18 }}>
                  {picked.phone ? <TextButton label={t('host.venueCall')} onPress={() => Linking.openURL(`tel:${picked.phone!.replace(/\s+/g, '')}`).catch(() => {})} color={p.aqua} /> : null}
                  {picked.bookingUrl ? <TextButton label={t('host.venueBook')} onPress={() => Linking.openURL(picked.bookingUrl!).catch(() => {})} color={p.aqua} /> : null}
                </View>
              </View>
            ) : null}
            <SectionHeading title={t('host.courtTitle')} />
            <Segmented
              value={courtBooking}
              onChange={setCourtBooking}
              options={[
                { value: 'booked', label: t('host.courtBooked') },
                { value: 'pending', label: t('host.courtWillBook') },
              ]}
            />
            {courtBooking === 'pending' ? <Txt v="caption">{t('host.courtPendingNote')}</Txt> : null}
            <SectionHeading title={t('host.courtPrice')} style={{ marginTop: 4 }} />
            <Field value={courtPrice} onChangeText={(v) => setCourtPrice(v.replace(/[^0-9.]/g, ''))} placeholder="SAR" keyboardType="decimal-pad" maxLength={6} />
            {Number(courtPrice) > 0 ? (
              <Txt v="caption">
                {spotsCount ? t('host.courtSplit', { n: spotsCount, amount: Math.round((Number(courtPrice) / spotsCount) * 100) / 100 }) : t('host.courtSplitAny')}
              </Txt>
            ) : null}
          </View>
        ) : null}

        <Sheet visible={sportsOpen} title={t('sportPicker.title')} onClose={() => setSportsOpen(false)}>
          <SportSearchList
            selected={sport ? [sport] : []}
            onPick={(id) => {
              setSport(id);
              setSportsOpen(false);
            }}
          />
        </Sheet>

        <Sheet visible={placeOpen} title={t('host.placeSheet')} onClose={() => setPlaceOpen(false)}>
          {places.community.length ? (
            <PlaceList
              title={places.community[0].facility?.communityName ? t('host.placeCommunity', { name: places.community[0].facility.communityName }) : t('courts.yourCommunity')}
              items={places.community}
              picked={picked}
              onPick={pickPlace}
            />
          ) : null}
          {places.more.length ? (
            <PlaceList
              title={places.community.length ? t('host.placeMore') : sport ? t('host.placeFor', { sport: t(`sports.${sport}`) }) : t('host.placeForYou')}
              items={places.more}
              picked={picked}
              onPick={pickPlace}
            />
          ) : null}
          <View style={{ gap: 8 }}>
            <Txt v="label" size={13} color={p.inkSoft}>
              {t('host.somewhereElse')}
            </Txt>
            <Field value={custom} onChangeText={setCustom} placeholder={t('host.placePlaceholder')} maxLength={80} />
            <OutlineButton
              label={t('host.usePlace')}
              disabled={!custom.trim()}
              onPress={() => {
                setPicked(null);
                setSlotAt(null);
                setPlace(custom.trim());
                setPlaceOpen(false);
              }}
            />
          </View>
        </Sheet>

        <Sheet visible={cityOpen} title={t('host.city')} onClose={() => setCityOpen(false)}>
          {(Object.keys(CITIES) as string[])
            .sort((a, b) => Number(b === country) - Number(a === country))
            .map((cc) => (
              <View key={cc} style={{ gap: 6 }}>
                {cc !== country ? (
                  <Txt v="label" size={12} color={p.inkFaint} style={{ marginTop: 6 }}>
                    {t(`onboarding.countries.${cc}`)}
                  </Txt>
                ) : null}
                <View style={s.wrap}>
                  {CITIES[cc].map(([en, ar]) => (
                    <Chip
                      key={en}
                      label={lang === 'ar' ? ar : en}
                      selected={cityKey(city) === cityKey(en) || cityKey(city) === cityKey(ar)}
                      onPress={() => {
                        setCity(en);
                        setCityTouched(true);
                        setCityOpen(false);
                        if (picked && picked.facility?.reason !== 'community' && cityKey(picked.city) !== cityKey(en)) {
                          setPicked(null);
                          setPlace('');
                          setSlotAt(null);
                        }
                      }}
                    />
                  ))}
                </View>
              </View>
            ))}
        </Sheet>

        <SectionHeading title={t('host.day')} style={s.gap} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {days.map((d, i) => {
            const key = localDateKey(d);
            return (
              <Chip
                key={key}
                label={i === 0 ? t('board.today') : i === 1 ? t('board.tomorrow') : fmtDay(d, lang, now)}
                selected={dayKey === key}
                disabled={!!court && !court.openDays.includes(d.getDay())}
                struck={!!court && !court.openDays.includes(d.getDay())}
                onPress={() => {
                  setDayKey(key);
                  setSlotAt(null);
                  if (time && isPast(key, time)) setTime(null);
                }}
              />
            );
          })}
        </ScrollView>

        <SectionHeading title={t('host.time')} style={s.gap} />
        {court ? (
          !dayKey ? (
            <Txt v="meta">{t('host.pickDay')}</Txt>
          ) : courtClosed ? (
            <Txt v="meta">{t('courts.closed')}</Txt>
          ) : courtDay.some((x) => x.free) ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
              {courtDay.map((x) => {
                const { time: c, suffix } = clockParts(x.startsAt, lang);
                const at = x.startsAt.getTime();
                return <Chip key={at} label={`${c} ${suffix}`} selected={slotAt === at} disabled={!x.free} struck={!x.free} onPress={() => setSlotAt(at)} />;
              })}
            </ScrollView>
          ) : (
            <Txt v="meta">{dayKey === localDateKey(now) ? t('courts.doneToday') : t('courts.fullDay')}</Txt>
          )
        ) : (
          <>
            {coach && dayKey ? null : (
              <Segmented value={period} onChange={setPeriod} options={(Object.keys(SLOTS) as Period[]).map((k) => ({ value: k, label: t(`periods.${k}`) }))} />
            )}
            <View style={{ gap: 12, marginTop: 10 }}>
              {timeRows.map((r) =>
                r.times.length ? (
                  <View key={r.key} style={{ gap: 6 }}>
                    {r.label ? (
                      <Txt v="label" size={13} color={p.inkSoft}>
                        {r.label}
                      </Txt>
                    ) : null}
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
          </>
        )}


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
            onPress={() => { setSpotsTouched(true); setSpotsCount((n) => (n == null ? 2 : Math.min(court?.maxPlayers ?? 200, n + 1))); }}
            feedback="selection"
            accessibilityLabel="+"
            style={s.stepBtn}
          >
            <Icon name="plus" size={18} />
          </Press>
        </View>

        {/* Who it's for: players at this level, or one below, can join and are called to fill it. */}
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
        {level !== 'any' ? (
          <Txt v="caption" style={{ marginTop: 6 }}>
            {t('host.levelSub')}
          </Txt>
        ) : null}

        {!open && spotsCount != null ? (
          <>
            <SectionHeading title={t('host.waitlist')} style={s.gap} />
            <Segmented
              value={waitlist}
              onChange={setWaitlist}
              options={[
                { value: '0', label: t('host.waitlistNone') },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
              ]}
            />
            <Txt v="caption" style={{ marginTop: 6 }}>
              {t('host.waitlistSub')}
            </Txt>
          </>
        ) : null}

        <Press onPress={() => setMore((m) => !m)} feedback="selection" style={s.moreToggle}>
          <Txt v="label" size={15} color={p.aqua}>
            {more ? t('host.less') : t('host.more')}
          </Txt>
          <Icon name="chevron" size={12} color={p.aqua} weight="bold" style={{ transform: [{ rotate: more ? '-90deg' : '90deg' }] }} />
        </Press>

        {more ? (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 8, display: court ? 'none' : 'flex' }}>
              <SectionHeading title={t('host.duration')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
                {DURATIONS.map((d) => (
                  <Chip key={d} label={durationLabel(d, lang)} selected={duration === d} onPress={() => setDuration(d)} />
                ))}
              </ScrollView>
            </View>


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

/** One group of places in the Where sheet: photo, name, and why it's here (free / played here / distance). */
function PlaceList({ title, items, picked, onPick }: { title: string; items: Place[]; picked: Place | null; onPick: (x: Place) => void }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  return (
    <View style={{ gap: 4 }}>
      <Txt v="label" size={13} color={p.inkSoft}>
        {title}
      </Txt>
      {items.map((x) => {
        const f = x.facility;
        const line = [
          x.reason === 'community' ? (f && !f.price ? t('host.tagFree') : f ? t('host.tagPrice', { n: f.price }) : null) : x.reason === 'used' ? t('host.tagPlayed') : null,
          f && !f.bookable ? t('courts.classesOnly') : null,
          x.km != null ? t('host.kmAway', { km: x.km < 10 ? x.km.toFixed(1) : Math.round(x.km) }) : cityLabel(x.city, lang) || null,
        ]
          .filter(Boolean)
          .join(' · ');
        const on = picked?.key === x.key;
        return (
          <Press key={x.key} onPress={() => onPick(x)} feedback="selection" accessibilityRole="button" accessibilityState={{ selected: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            {x.imageUrl ? (
              <Image source={{ uri: x.imageUrl }} style={{ width: 56, height: 42, borderRadius: 8 }} />
            ) : (
              <View style={{ width: 56, height: 42, borderRadius: 8, backgroundColor: p.wash, alignItems: 'center', justifyContent: 'center' }}>
                <Icon sport={x.sports[0] ?? 'other'} size={18} color={p.inkSoft} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Txt v="label" size={15} numberOfLines={1}>
                {x.name}
              </Txt>
              {line ? (
                <Txt v="caption" numberOfLines={1}>
                  {line}
                </Txt>
              ) : null}
            </View>
            {on ? <Icon name="check" size={16} color={p.aqua} weight="bold" /> : null}
          </Press>
        );
      })}
    </View>
  );
}

function fmtEnd(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
  content: { padding: 16, paddingBottom: 40 },
  gap: { marginTop: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { gap: 8 },
  rowLabel: { marginTop: 4, marginBottom: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: p.ruleStrong, borderRadius: 10, padding: 4 },
  stepBtn: { width: 48, height: 44, borderRadius: 8, backgroundColor: p.wash, alignItems: 'center', justifyContent: 'center' },
  routeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: p.ruleStrong },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: p.rule },
  venueCard: { gap: 6, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: p.rule, backgroundColor: p.wash },
  moreToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, marginTop: 14 },
  cover: { width: '100%', height: 180, borderRadius: 10 },
  bar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
  doneWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
}));
