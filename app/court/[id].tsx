import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { bookFacility, dayKey, useFacility, useFacilitySlots } from '../../src/data/facilities';
import { useMyCommunities } from '../../src/data/communities';
import { useMyPackList, useCoaches } from '../../src/data/member';
import { money } from '../../src/data/dues';
import { addDays, fmtClock, fmtDay } from '../../src/i18n/format';
import { cityLabel } from '../../src/lib/cities';
import { Txt } from '../../src/components/board/Txt';
import { Icon } from '../../src/components/board/Icon';
import { Press } from '../../src/components/board/Press';
import { Chip, Field, IconButton, MarkerButton, SectionHeading } from '../../src/components/board/controls';
import { toast } from '../../src/components/board/toast';
import { haptic } from '../../src/lib/haptics';
import { errorKey } from '../../src/data/errors';

type Audience = { kind: 'community' | 'pack'; id: string; name: string };

// One court: pick a day, a free time and how many are playing. The price is split per player.
export default function CourtScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const f = useFacility(id, lang).data;
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);
  const [day, setDay] = useState(dayKey(today));
  const slotsQ = useFacilitySlots(id, day);
  const [pick, setPick] = useState<number | null>(null);
  // Late in the day there is nothing left to book today: open on tomorrow instead.
  const moved = useRef(false);
  useEffect(() => {
    const list = slotsQ.data;
    if (moved.current || !list || day !== dayKey(today)) return;
    moved.current = true;
    if (list.some((x) => x.free) || !f) return;
    const next = days.slice(1).find((d) => f.openDays.includes(d.getDay()));
    if (next) setDay(dayKey(next));
  }, [slotsQ.data, day, today, days, f]);
  const [players, setPlayers] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [aud, setAud] = useState<Audience | null>(null);
  const [busy, setBusy] = useState(false);
  const [playSport, setPlaySport] = useState<string | null>(null);
  const coaches = useCoaches().data ?? [];
  const communities = useMyCommunities().data ?? [];
  const packs = useMyPackList().data ?? [];
  const back = () => (router.canGoBack() ? router.back() : router.replace('/courts'));

  if (!f) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <IconButton name="back" label={t('common.back')} onPress={back} style={{ marginStart: 4 }} />
      </SafeAreaView>
    );
  }

  // A pool used for classes: no slots to book; the coaches who teach here, and one tap to set up a class.
  if (!f.bookable) {
    const teachers = coaches.filter((c) => c.sports.includes(f.sport as any));
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.top}>
          <IconButton name="back" label={t('common.back')} onPress={back} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {f.imageUrl ? <Image source={{ uri: f.imageUrl }} style={s.img} accessibilityIgnoresInvertColors /> : null}
          <View style={s.body}>
            <Txt v="title" size={26} accessibilityRole="header">
              {f.name}
            </Txt>
            <Txt v="meta" style={{ marginTop: 4 }}>
              {[t(`sports.${f.sport}`), f.communityName || f.venue].filter(Boolean).join(' · ')}
            </Txt>
            {f.description ? (
              <Txt v="body" size={15} color={p.inkSoft} style={{ marginTop: 10 }}>
                {f.description}
              </Txt>
            ) : null}
            <SectionHeading title={t('courts.coaches')} style={{ marginTop: 18 }} />
            {teachers.length ? (
              teachers.map((c) => (
                <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: p.rule }}>
                  <Icon name="coach" size={18} color={p.aqua} />
                  <Txt v="row" size={15} style={{ flex: 1 }}>
                    {c.name}
                  </Txt>
                </View>
              ))
            ) : (
              <Txt v="meta">{t('courts.noCoaches')}</Txt>
            )}
          </View>
        </ScrollView>
        <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
          <MarkerButton label={t('courts.setUpClass')} onPress={() => router.push({ pathname: '/host', params: { sport: f.sport, ...(f.communityId ? { community: f.communityId } : {}) } })} />
        </View>
      </SafeAreaView>
    );
  }

  const n = players ?? f.maxPlayers;
  const chosenSport = playSport && f.sports.includes(playSport) ? playSport : f.sports[0] ?? f.sport;
  const share = f.price / n;
  // Times that already started are not offered.
  const all = slotsQ.data ?? [];
  const slots = all.filter((x) => x.startsAt.getTime() > Date.now());
  const chosen = slots.find((x) => x.startsAt.getTime() === pick && x.free) ?? null;
  const audiences: Audience[] =
    f.audience === 'community'
      ? []
      : [...communities.map((c) => ({ kind: 'community' as const, id: c.id, name: c.name })), ...packs.map((x) => ({ kind: 'pack' as const, id: x.id, name: x.name }))];
  // Start with the most private place: a private community, else a pack, else the open one.
  const fallback = audiences.find((a) => a.kind === 'community' && communities.find((c) => c.id === a.id && !c.open)) ?? audiences.find((a) => a.kind === 'pack') ?? audiences[0] ?? null;
  const who = aud ?? fallback;

  async function book() {
    if (!chosen || busy || !f) return;
    setBusy(true);
    try {
      const eventId = await bookFacility({
        facilityId: f.id,
        startsAt: chosen.startsAt,
        players: n,
        title,
        communityId: who?.kind === 'community' ? who.id : null,
        packId: who?.kind === 'pack' ? who.id : null,
        sport: chosenSport,
      });
      haptic('success');
      toast.show(t('courts.booked'), 'yours');
      router.replace({ pathname: '/session/[id]', params: { id: eventId } });
    } catch (e: any) {
      haptic('error');
      toast.show(t(errorKey('courts', e)), 'error');
      slotsQ.refetch();
      setPick(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.top}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        {f.imageUrl ? <Image source={{ uri: f.imageUrl }} style={s.img} accessibilityIgnoresInvertColors /> : null}
        <View style={s.body}>
          <Txt v="title" size={26} accessibilityRole="header">
            {f.name}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Icon sport={f.sport} size={14} color={p.aqua} />
            <Txt v="meta" style={{ flex: 1 }}>
              {[t(`sports.${f.sport}`), f.venue, cityLabel(f.city, lang)].filter(Boolean).join(' · ')}
            </Txt>
          </View>
          {f.description ? (
            <Txt v="body" size={15} color={p.inkSoft} style={{ marginTop: 10 }}>
              {f.description}
            </Txt>
          ) : null}

          {f.sports.length > 1 ? (
            <>
              <SectionHeading title={t('courts.playing')} style={{ marginTop: 14 }} />
              <View style={s.wrap}>
                {f.sports.map((x) => (
                  <Chip key={x} sport={x} label={t(`sports.${x}`)} selected={chosenSport === x} onPress={() => setPlaySport(x)} />
                ))}
              </View>
            </>
          ) : null}
          {f.parentId ? (
            <Txt v="caption" style={{ marginTop: 8 }}>
              {t('courts.halfCourt')}
            </Txt>
          ) : null}
          {f.dailyLimit ? (
            <Txt v="caption" style={{ marginTop: 8 }}>
              {t('courts.dailyRule', { n: f.dailyLimit, sport: t(`sports.${f.sport}`) })}
            </Txt>
          ) : null}

          <SectionHeading title={t('host.day')} style={{ marginTop: 14 }} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {days.map((d, i) => {
            const key = dayKey(d);
            const closed = !f.openDays.includes(d.getDay());
            return (
              <Chip
                key={key}
                label={i === 0 ? t('board.today') : i === 1 ? t('board.tomorrow') : fmtDay(d, lang, today)}
                selected={day === key}
                disabled={closed}
                onPress={() => {
                  moved.current = true;
                  setDay(key);
                  setPick(null);
                }}
              />
            );
          })}
        </ScrollView>

        <View style={s.body}>
          <SectionHeading title={t('courts.time')} style={{ marginTop: 10 }} />
          {slotsQ.loading ? null : slots.length ? (
            <View style={s.wrap}>
              {slots.map((x) => (
                <Chip key={x.startsAt.getTime()} label={fmtClock(x.startsAt, lang)} selected={pick === x.startsAt.getTime()} disabled={!x.free} onPress={() => setPick(x.startsAt.getTime())} />
              ))}
            </View>
          ) : (
            <Txt v="meta">{t(all.length ? 'courts.doneToday' : 'courts.closed')}</Txt>
          )}
          {slots.length && !slots.some((x) => x.free) ? (
            <Txt v="caption" style={{ marginTop: 8 }}>
              {t('courts.fullDay')}
            </Txt>
          ) : null}

          <SectionHeading title={t('courts.players')} style={{ marginTop: 14 }} />
          <View style={s.wrap}>
            {Array.from({ length: f.maxPlayers }, (_, i) => i + 1)
              .filter((k) => f.maxPlayers <= 8 || k % 2 === 0 || k === f.maxPlayers)
              .map((k) => (
                <Chip key={k} label={String(k)} selected={n === k} onPress={() => setPlayers(k)} />
              ))}
          </View>

          {/* The split, before anything is booked */}
          {f.price === 0 ? (
            <Txt v="body" size={15} color={p.inkSoft} style={{ marginTop: 14 }}>
              {t('courts.freeForMembers')}
            </Txt>
          ) : (
          <View style={s.split}>
            <View>
              <Txt v="caption">{t('pay.each')}</Txt>
              <Txt v="stencil" size={46} color={p.markerText}>
                {money(share)}
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 2, paddingBottom: 6 }}>
              <Txt v="body" size={14}>
                {t('pay.splitLine', { total: money(f.price), n })}
              </Txt>
              <Txt v="caption">{t('courts.payNote', { h: f.cancelHours })}</Txt>
            </View>
          </View>
          )}

          {audiences.length > 1 ? (
            <>
              <SectionHeading title={t('host.audience')} style={{ marginTop: 14 }} />
              <View style={s.wrap}>
                {audiences.map((a) => (
                  <Chip key={`${a.kind}-${a.id}`} label={a.name} icon={a.kind === 'pack' ? 'shield' : 'people'} selected={who?.kind === a.kind && who?.id === a.id} onPress={() => setAud(a)} />
                ))}
              </View>
              <Txt v="caption" style={{ marginTop: 6 }}>
                {t('courts.audienceSub')}
              </Txt>
            </>
          ) : null}

          <SectionHeading title={t('host.name')} style={{ marginTop: 14 }} />
          <Field value={title} onChangeText={setTitle} placeholder={f.name} maxLength={60} />
        </View>
      </ScrollView>
      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <MarkerButton
          label={chosen ? (f.price === 0 ? t('courts.bookFree', { time: fmtClock(chosen.startsAt, lang) }) : t('courts.book', { time: fmtClock(chosen.startsAt, lang), amount: money(share) })) : t('courts.pickTime')}
          onPress={book}
          disabled={!chosen}
          loading={busy}
        />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  top: { paddingStart: 4, paddingBottom: 4 },
  img: { width: '100%', height: 200, backgroundColor: p.wash },
  body: { paddingHorizontal: 20, paddingTop: 12 },
  row: { gap: 8, paddingHorizontal: 20 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  split: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: p.marker },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
