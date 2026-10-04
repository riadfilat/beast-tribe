import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Image, Linking, Platform, ScrollView, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { cityLabel } from '../../../src/lib/cities';
import { clockParts, dayOffset, fmtClock, fmtDateLong, fmtDay, fmtDuration, fmtIn } from '../../../src/i18n/format';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useGuestToken, useSession, useSessionActions } from '../../../src/data/sessions';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { SESSION_LINK_BASE, TRAIN_ENABLED } from '../../../src/lib/constants';
import { Txt } from '../../../src/components/board/Txt';
import { PayBlock } from '../../../src/components/board/pay';
import { money } from '../../../src/data/dues';
import { useMyCommunities } from '../../../src/data/communities';
import { RatePeople } from '../../../src/components/board/ratings';
import { rateable } from '../../../src/data/ratings';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Magnet } from '../../../src/components/board/people';
import { Rule, Sun, Tally } from '../../../src/components/board/marks';
import { IconButton, MarkerButton, OutlineButton, TextButton } from '../../../src/components/board/controls';
import { SessionTags, capacityLine, useNow } from '../../../src/components/board/session';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { scheduleEventReminder } from '../../../src/lib/notifications';
import { GuestJoin } from '../../../src/components/board/guest-join';
import { errorKey } from '../../../src/data/errors';

export default function SessionScreen() {
  const { id, g } = useLocalSearchParams<{ id: string; g?: string }>();
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const q = useSession(id);
  const myCommunities = useMyCommunities();
  const { join, leave, cancel } = useSessionActions();
  const now = useNow();
  const [busy, setBusy] = useState(false);
  const [rose, setRose] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));
  const x = q.data;
  const guestKey = useGuestToken(x?.id ?? null, !!x?.isHost && !!x?.guestInvite).data ?? null;

  if (q.loading && !x) {
    return (
      <SafeAreaView style={s.screen}>
        <IconButton name="back" label={t('common.back')} onPress={back} style={{ marginStart: 6 }} />
      </SafeAreaView>
    );
  }
  if (!x && g && !q.error) {
    // Opened from a guest link by someone outside the community.
    return (
      <SafeAreaView style={s.screen}>
        <IconButton name="back" label={t('common.back')} onPress={back} style={{ marginStart: 6 }} />
        <GuestJoin eventId={id} token={String(g)} onJoined={q.refetch} />
      </SafeAreaView>
    );
  }
  if (!x) {
    return (
      <SafeAreaView style={s.screen}>
        <IconButton name="back" label={t('common.back')} onPress={back} style={{ marginStart: 6 }} />
        <View style={s.center}>
          <Txt v="headline" align="center">
            {q.error ? t('common.offline') : t('session.notFound')}
          </Txt>
          {q.error ? <TextButton label={t('common.retry')} onPress={q.refetch} /> : null}
        </View>
      </SafeAreaView>
    );
  }

  const going = x.myStatus === 'going' || x.isHost;
  // Outside the class's own community: joining takes a guest spot at the guest price.
  const isGuest = x.guestOpen && !!x.communityId && !!myCommunities.data && !myCommunities.data.some((c) => c.id === x.communityId);
  const waiting = x.myStatus === 'waitlist';
  const { time, suffix } = clockParts(x.startsAt, lang);
  const nowDate = new Date(now);
  const off = dayOffset(x.startsAt, nowDate);
  const dayLine = [
    off === 0 || off === 1 ? fmtDay(x.startsAt, lang, nowDate) : fmtDateLong(x.startsAt, lang),
    fmtDuration(x.durationMin, lang),
    x.state === 'upcoming' ? t('session.startsIn', { in: fmtIn(x.startsAt, lang, nowDate) }) : null,
    x.state === 'live' ? t('session.endsIn', { in: fmtIn(x.endsAt, lang, nowDate) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const whereLine = [x.place, x.city].filter(Boolean).join(' · ');
  // With guests allowed, the link carries the guest key so people outside the community can join.
  const link = `${SESSION_LINK_BASE}${x.id}${x.guestInvite && guestKey ? `?g=${guestKey}` : ''}`;

  async function onJoin() {
    if (busy || !x) return;
    setBusy(true);
    try {
      const result = await join(x.id);
      haptic(result === 'going' ? 'success' : 'warning');
      q.setData((prev) =>
        prev
          ? {
              ...prev,
              myStatus: result,
              isMine: true,
              goingCount: result === 'going' ? prev.goingCount + 1 : prev.goingCount,
              roster:
                result === 'going' && meId
                  ? [...prev.roster, { id: meId, name: profile?.display_name || profile?.full_name || '', avatarUrl: profile?.avatar_url ?? null }]
                  : prev.roster,
              myWaitlistPosition: result === 'waitlist' ? prev.waitlist.length + 1 : null,
            }
          : prev,
      );
      if (result === 'going') {
        setRose(true);
        Promise.resolve()
          .then(() => scheduleEventReminder({ id: x.id, title: x.title, starts_at: x.startsAt.toISOString() }))
          .catch(() => {});
      }
      toast.show(result === 'going' ? t('session.joinedToast') : t('session.waitlistToast'), result === 'going' ? 'yours' : 'info');
    } catch (e: any) {
      haptic('error');
      toast.show(t(errorKey('session', e)), 'error');
    } finally {
      setBusy(false);
    }
  }

  function confirm(title: string, body: string, action: string, run: () => Promise<void>) {
    Alert.alert(title, body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: action, style: 'destructive', onPress: () => run() },
    ]);
  }

  async function doLeave() {
    if (!x) return;
    setBusy(true);
    try {
      await leave(x.id);
      haptic('warning');
      q.setData((prev) =>
        prev
          ? {
              ...prev,
              myStatus: null,
              isMine: prev.isHost,
              goingCount: prev.myStatus === 'going' ? Math.max(0, prev.goingCount - 1) : prev.goingCount,
              roster: prev.roster.filter((r) => r.id !== meId),
              myWaitlistPosition: null,
            }
          : prev,
      );
      setRose(false);
    } catch (e: any) {
      toast.show(t(errorKey('session', e)), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function doCancel() {
    if (!x) return;
    setBusy(true);
    try {
      await cancel(x.id);
      haptic('warning');
      q.setData((prev) => (prev ? { ...prev, state: 'cancelled', cancelledAt: new Date() } : prev));
    } catch (e: any) {
      toast.show(t(errorKey('session', e)), 'error');
    } finally {
      setBusy(false);
    }
  }

  function more() {
    if (!x) return;
    const options: { label: string; run: () => void }[] = [];
    if (x.isHost && x.state === 'upcoming') {
      options.push({ label: t('session.cancelSession'), run: () => confirm(t('session.cancelTitle'), t('session.cancelBody'), t('session.cancelSession'), doCancel) });
    } else if (x.myStatus === 'going' && (x.state === 'upcoming' || x.state === 'live')) {
      options.push({ label: t('session.leave'), run: () => confirm(t('session.leaveTitle'), t('session.leaveBody'), t('session.leave'), doLeave) });
    } else if (x.myStatus === 'waitlist') {
      options.push({ label: t('session.leaveWaitlist'), run: () => doLeave() });
    } else if (x.myStatus === 'going') {
      options.push({ label: t('session.removeFromMine'), run: () => confirm(t('mySessions.removeTitle'), t('mySessions.removeBody'), t('common.remove'), doLeave) });
    }
    if (!options.length) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...options.map((o) => o.label), t('common.cancel')], destructiveButtonIndex: 0, cancelButtonIndex: options.length },
        (i) => options[i]?.run(),
      );
    } else {
      Alert.alert(x.title, undefined, [...options.map((o) => ({ text: o.label, style: 'destructive' as const, onPress: o.run })), { text: t('common.cancel'), style: 'cancel' as const }]);
    }
  }

  function invite() {
    if (!x) return;
    const when = `${fmtDay(x.startsAt, lang, new Date())} ${fmtClock(x.startsAt, lang)}`;
    Share.share({ message: t('session.shareMessage', { title: x.title, when, place: whereLine || t(`sports.${x.sport}`), link }) }).catch(() => {});
  }

  function directions() {
    if (!x) return;
    const label = encodeURIComponent([x.place, x.city].filter(Boolean).join(', '));
    const coords = x.lat != null && x.lng != null ? `${x.lat},${x.lng}` : null;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?q=${label}${coords ? `&ll=${coords}` : ''}`
        : `https://www.google.com/maps/search/?api=1&query=${coords ?? label}`;
    Linking.openURL(url).catch(() => {});
  }

  const hasPhoto = !!x.imageUrl;
  const canMore = x.isHost ? x.state === 'upcoming' : !!x.myStatus;

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {hasPhoto ? (
          <View style={s.photoWrap}>
            <Image source={{ uri: x.imageUrl! }} style={s.photo} />
            <LinearGradient colors={[p.scrim[0], p.scrim[1]]} style={s.photoScrim} />
          </View>
        ) : (
          <View style={{ height: insets.top + 52 }} />
        )}

        <View style={[s.body, { marginTop: hasPhoto ? -54 : 0 }]}>
          {/* The time is the heading */}
          <View style={s.timeRow}>
            {going && x.state !== 'cancelled' ? (
              <Sun size={124} rise={rose} style={{ marginStart: -10 }}>
                <Txt v="stencil" size={44} color={p.onMarker}>
                  {time}
                </Txt>
                <Txt v="label" size={12} color={p.onMarker}>
                  {suffix}
                </Txt>
              </Sun>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <Txt v="stencil" size={60} accessibilityRole="header" style={x.state === 'cancelled' ? { textDecorationLine: 'line-through', color: p.inkFaint } : null}>
                  {time}
                </Txt>
                <Txt v="label" size={15} color={p.inkSoft} style={{ marginBottom: 10 }}>
                  {suffix}
                </Txt>
              </View>
            )}
          </View>
          <Txt v="label" size={14} color={x.state === 'live' ? p.markerText : p.inkSoft} style={{ marginTop: 6 }}>
            {dayLine}
          </Txt>

          <Txt v="title" size={28} style={[{ marginTop: 14 }, lang === 'en' ? { textTransform: 'uppercase' } : null]}>
            {x.title || t(`sportNoun.${x.sport}`)}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Icon sport={x.sport} size={16} color={p.inkSoft} />
            <Txt v="meta" size={15}>
              {t(`sports.${x.sport}`)}
            </Txt>
          </View>
          <View style={{ marginTop: 12 }}>
            <SessionTags s={x} now={now} />
          </View>

          {/* Where */}
          <Rule style={s.rule} />
          <View style={s.section}>
            <Txt v="title" size={18}>
              {t('session.where')}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Txt v="headline">{x.place || t(`sports.${x.sport}`)}</Txt>
                {x.city ? <Txt v="meta">{cityLabel(x.city, lang)}</Txt> : null}
              </View>
              {x.place ? <OutlineButton label={t('session.directions')} icon="directions" onPress={directions} style={{ height: 40 }} /> : null}
            </View>
          </View>

          {x.share != null || (x.guestOpen && isGuest && x.guestPrice) ? (
            <>
              <Rule style={s.rule} />
              <View style={s.section}>
                <PayBlock x={x} meId={meId} isGuest={isGuest} />
              </View>
            </>
          ) : null}

          {/* The plan, when the host attached a workout */}
          {TRAIN_ENABLED && x.workout ? (
            <>
              <Rule style={s.rule} />
              <Press
                onPress={() => router.push({ pathname: '/workout/[id]', params: { id: x.workout!.id, event: x.id } })}
                feedback="selection"
                depress={0.99}
                accessibilityRole="button"
                style={s.section}
              >
                <Txt v="title" size={18}>
                  {t('session.workout')}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Icon name="train" size={18} color={p.ink} />
                  <View style={{ flex: 1 }}>
                    <Txt v="headline" style={lang === 'en' ? { textTransform: 'uppercase' } : null}>
                      {lang === 'ar' && x.workout.titleAr ? x.workout.titleAr : x.workout.title}
                    </Txt>
                    {x.workout.minutes ? <Txt v="meta">{fmtDuration(x.workout.minutes, lang)}</Txt> : null}
                  </View>
                  <Icon name="chevron" size={14} color={p.inkFaint} weight="bold" />
                </View>
              </Press>
            </>
          ) : null}

          {x.state === 'finished' && going && rateable(x.sport) && Date.now() - x.endsAt.getTime() < 14 * 86400000 ? (
            <>
              <Rule style={s.rule} />
              <View style={s.section}>
                <RatePeople eventId={x.id} sport={x.sport} people={[...x.roster, ...(x.host && !x.roster.some((r) => r.id === x.host!.id) ? [x.host] : [])].filter((r) => r.id !== meId)} />
              </View>
            </>
          ) : null}

          {/* Who's in */}
          <Rule style={s.rule} />
          <View style={s.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt v="title" size={18}>
                {t('session.whosIn')}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Tally count={x.goingCount} capacity={x.capacity} size={15} />
                <Txt v="label" size={13} color={p.inkSoft}>
                  {capacityLine(x, t, tn)}
                </Txt>
              </View>
            </View>
            {x.roster.length ? (
              <View style={s.magnets}>
                {x.roster.map((person) => (
                  <View key={person.id} style={{ alignItems: 'center', width: 58, gap: 4 }}>
                    <Magnet person={person} size={40} yours={person.id === meId} snap={rose && person.id === meId} />
                    <Txt v="caption" numberOfLines={1} align="center" style={{ width: 58 }}>
                      {person.id === meId ? t('common.you') : person.name.split(' ')[0]}
                    </Txt>
                  </View>
                ))}
              </View>
            ) : (
              <Txt v="meta">{tn('session.going', 0)}</Txt>
            )}
            {x.waitlist.length ? (
              <Txt v="meta">{tn('session.onWaitlistCount', x.waitlist.length)}</Txt>
            ) : null}
            {x.host ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Magnet person={x.host} size={28} yours={x.host.id === meId} />
                <Txt v="meta" size={14}>
                  {t(x.captainHosted ? 'session.hostedByCaptain' : 'session.hostedBy', { name: x.host.id === meId ? t('common.you') : x.host.name })}
                </Txt>
              </View>
            ) : null}
          </View>

          {/* About */}
          {x.description || x.coachName ? (
            <>
              <Rule style={s.rule} />
              <View style={s.section}>
                <Txt v="title" size={18}>
                  {t('session.about')}
                </Txt>
                {x.coachName ? (
                  <Txt v="headline">
                    {/^(coach|المدرب|المدربة)\s/i.test(x.coachName) ? x.coachName : t('session.coach', { name: x.coachName })}
                  </Txt>
                ) : null}
                {x.description ? <Txt v="body">{x.description}</Txt> : null}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Top controls float over the photo */}
      <View style={[s.topBar, { top: insets.top }]} pointerEvents="box-none">
        <IconButton name="back" label={t('common.back')} onPress={back} color={hasPhoto ? '#FFFFFF' : p.ink} style={hasPhoto ? s.floatBtn : null} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {x.state !== 'cancelled' && x.state !== 'finished' ? (
            <IconButton name="share" label={t('session.invite')} onPress={invite} color={hasPhoto ? '#FFFFFF' : p.ink} style={hasPhoto ? s.floatBtn : null} />
          ) : null}
          {canMore ? (
            <IconButton name="more" label={t('common.edit')} onPress={more} color={hasPhoto ? '#FFFFFF' : p.ink} style={hasPhoto ? s.floatBtn : null} />
          ) : null}
        </View>
      </View>

      {/* Commit bar */}
      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        {x.state === 'cancelled' ? (
          <Txt v="headline" color={p.danger} align="center">
            {t('session.errors.EVENT_CANCELLED')}
          </Txt>
        ) : x.state === 'finished' ? (
          going ? (
            <OutlineButton label={t('session.recapPrompt')} icon="camera" onPress={() => router.push({ pathname: '/(tabs)/feed', params: { compose: x.id } })} />
          ) : (
            <Txt v="headline" color={p.inkSoft} align="center">
              {t('session.finished')}
            </Txt>
          )
        ) : going ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: p.marker }} />
              <Txt v="label" size={14} color={p.markerText}>
                {x.isHost ? t('session.hosting') : t('session.onTheBoard')}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <OutlineButton label={t('session.chatShort')} icon="chat" onPress={() => router.push({ pathname: '/session/[id]/chat', params: { id: x.id } })} style={{ flex: 1 }} />
              <OutlineButton label={t('session.invite')} icon="share" onPress={invite} style={{ flex: 1 }} />
            </View>
          </View>
        ) : waiting ? (
          <View style={{ gap: 6, alignItems: 'center' }}>
            <Txt v="headline" align="center">
              {t('session.waitlistPosition', { n: x.myWaitlistPosition ?? 1 })}
            </Txt>
            <TextButton label={t('session.leaveWaitlist')} onPress={doLeave} color={p.inkSoft} />
          </View>
        ) : x.isFull ? (
          <OutlineButton label={t('session.joinWaitlist')} icon="hourglass" onPress={onJoin} loading={busy} />
        ) : (
          <>
            {x.dropIn ? (
              <Txt v="caption" align="center" style={{ marginBottom: 8 }}>
                {t('session.dropInNote')}
              </Txt>
            ) : null}
            <MarkerButton
              label={isGuest && x.guestPrice ? t('pay.joinGuest', { amount: money(x.guestPrice) }) : x.share != null ? t('pay.joinShare', { amount: money(x.share) }) : t('session.imIn')}
              onPress={onJoin}
              loading={busy}
            />
          </>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  photoWrap: { height: 280, backgroundColor: p.boardDeep },
  photo: { width: '100%', height: '100%' },
  photoScrim: { position: 'absolute', start: 0, end: 0, top: 0, bottom: 0 },
  body: { paddingHorizontal: 20 },
  timeRow: { minHeight: 108, justifyContent: 'flex-end' },
  rule: { marginVertical: 18 },
  section: { gap: 10 },
  magnets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  topBar: { position: 'absolute', start: 8, end: 8, flexDirection: 'row', justifyContent: 'space-between' },
  floatBtn: { backgroundColor: 'rgba(2,60,60,0.55)', borderRadius: 22 },
  bar: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: p.boardDeep,
    borderTopWidth: 1,
    borderTopColor: p.rule,
  },
}));
