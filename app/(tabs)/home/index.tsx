import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { dayOffset, fmtBoardDate } from '../../../src/i18n/format';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useBoardSessions, useMySessions, useSessionActions } from '../../../src/data/sessions';
import { useUnreadCount } from '../../../src/data/inbox';
import { usePopularSpots } from '../../../src/data/member';
import { cityKeys, cityKey, cityLabel } from '../../../src/lib/cities';
import { GenderAsk } from '../../../src/components/board/gender';
import { LocationAsk } from '../../../src/components/board/location';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import type { Session } from '../../../src/data/model';
import { Txt } from '../../../src/components/board/Txt';
import { PackMark } from '../../../src/components/brand/Logo';
import { Press } from '../../../src/components/board/Press';
import { Icon } from '../../../src/components/board/Icon';
import { IconButton, MarkerButton, OutlineButton, TextButton } from '../../../src/components/board/controls';
import { CaptainWeek } from '../../../src/components/board/captain';
import { RateNudge } from '../../../src/components/board/ratings';
import { DayHeading, NowMarker, SessionRow, useNow } from '../../../src/components/board/session';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { syncEventReminders } from '../../../src/lib/notifications';
import { useMyPlan } from '../../../src/data/programs';
import { errorKey } from '../../../src/data/errors';
import { TRAIN_ENABLED } from '../../../src/lib/constants';


export default function BoardScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const { user, profile } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id;
  const board = useBoardSessions(8);
  const mineAll = useMySessions();
  const unread = useUnreadCount();
  const now = useNow();
  const country = profile?.region || 'SA';
  const spots = usePopularSpots(country, lang);
  const { join } = useSessionActions();
  const myPlan = useMyPlan(lang).data;
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [justJoined, setJustJoined] = useState<string | null>(null);

  const sessions = useMemo(
    () => (board.data ?? []).filter((x) => x.state === 'upcoming' || x.state === 'live' || (x.state === 'cancelled' && x.isMine)),
    [board.data, now],
  );

  // Day buckets
  const today = sessions.filter((x) => dayOffset(x.startsAt, new Date(now)) <= 0);
  const tomorrow = sessions.filter((x) => dayOffset(x.startsAt, new Date(now)) === 1);
  const later = sessions.filter((x) => dayOffset(x.startsAt, new Date(now)) > 1);
  const live = today.filter((x) => x.state === 'live');
  const todayAhead = today.filter((x) => x.state !== 'live');

  // Hierarchy by size alone: your next session is set largest; otherwise the soonest.
  const upcoming = sessions.filter((x) => x.state === 'upcoming');
  const heroId = (upcoming.find((x) => x.myStatus === 'going' || x.isHost) ?? upcoming[0])?.id;

  // Local 15-minute reminders mirror every session you're in, including ones past this
  // week, and drop reminders for sessions you left (no-op on builds without notifications).
  useEffect(() => {
    if (!mineAll.data) return;
    const mine = mineAll.data.filter((x) => x.state === 'upcoming' && (x.myStatus === 'going' || x.isHost));
    syncEventReminders(mine.map((x) => ({ id: x.id, title: x.title, starts_at: x.startsAt.toISOString() }))).catch(() => {});
  }, [mineAll.data]);

  const onJoin = useCallback(
    async (x: Session) => {
      if (joiningId) return;
      setJoiningId(x.id);
      try {
        const result = await join(x.id);
        haptic(result === 'going' ? 'success' : 'warning');
        board.setData((prev) =>
          prev?.map((y) =>
            y.id !== x.id
              ? y
              : {
                  ...y,
                  myStatus: result,
                  isMine: true,
                  goingCount: result === 'going' ? y.goingCount + 1 : y.goingCount,
                  roster:
                    result === 'going' && meId
                      ? [...y.roster, { id: meId, name: profile?.display_name || profile?.full_name || '', avatarUrl: profile?.avatar_url ?? null }]
                      : y.roster,
                },
          ),
        );
        if (result === 'going') setJustJoined(x.id);
        toast.show(result === 'going' ? t('session.joinedToast') : t('session.waitlistToast'), result === 'going' ? 'yours' : 'info');
      } catch (e: any) {
        haptic('error');
        toast.show(t(errorKey('session', e)), 'error');
      } finally {
        setJoiningId(null);
      }
    },
    [joiningId, join, meId, profile],
  );

  const open = (x: Session) => router.push({ pathname: '/session/[id]', params: { id: x.id } });

  const row = (x: Session, i: number, list: Session[], opts: { showDay?: boolean; compact?: boolean } = {}) => (
    <SessionRow
      key={x.id}
      s={x}
      now={now}
      meId={meId}
      size={x.id === heroId ? 'hero' : opts.compact ? 'compact' : 'normal'}
      showDay={opts.showDay}
      last={i === list.length - 1}
      onPress={() => open(x)}
      onJoin={() => onJoin(x)}
      joining={joiningId === x.id}
      justJoined={justJoined === x.id}
    />
  );

  // Today, said to you: what you're in and what's still open to join (the city is already yours).
  const todayOn = today.filter((x) => x.state !== 'cancelled');
  const todayIn = todayOn.filter((x) => x.isHost || x.myStatus === 'going').length;
  const todayOpen = todayOn.length - todayIn;
  const todayLine = todayIn
    ? tn('board.todayIn', todayIn) + (todayOpen ? tn('board.todayInMore', todayOpen) : '')
    : todayOpen
      ? tn('board.todayOpen', todayOpen)
      : upcoming.length
        ? tn('board.todayNoneWeek', upcoming.length)
        : null;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={board.refreshing} onRefresh={board.refetch} tintColor={p.ink} />}
      >
        {/* Masthead */}
        <View style={s.masthead}>
          <PackMark height={17} ink={p.ink} />
          <Txt v="label" size={13} color={p.inkSoft} style={{ flex: 1 }}>
            {fmtBoardDate(new Date(now), lang)}
          </Txt>
          <IconButton name="bell" label={t('board.inboxA11y')} dot={unread > 0} onPress={() => router.push('/inbox')} />
          <Press onPress={() => router.push('/host')} feedback="light" accessibilityLabel={t('board.hostA11y')} style={s.hostChip}>
            <Icon name="plus" size={15} color={p.ink} weight="bold" />
            <Txt v="button" size={13}>
              {t('board.host')}
            </Txt>
          </Press>
        </View>

        {/* Your plan, one line: what's next and one tap to it */}
        {TRAIN_ENABLED && myPlan?.next ? (
          <Press
            onPress={() => router.push({ pathname: '/workout/[id]', params: { id: myPlan.next!.workoutId, ps: myPlan.next!.id } })}
            feedback="selection"
            depress={0.99}
            accessibilityRole="button"
            style={s.planStrip}
          >
            <Icon name="train" size={18} color={p.markerText} />
            <View style={{ flex: 1 }}>
              <Txt v="label" size={12} color={p.inkSoft}>
                {t('plan.boardNext')}
              </Txt>
              <Txt v="row" size={15} numberOfLines={1}>
                {`${myPlan.next.focus} · ${myPlan.next.minutes} ${lang === 'ar' ? 'د' : 'min'}`}
              </Txt>
            </View>
            <Icon name="chevron" size={13} color={p.inkFaint} weight="bold" />
          </Press>
        ) : null}

        <CaptainWeek onHost={(communityId) => router.push({ pathname: '/host', params: { community: communityId } })} />
        <RateNudge />
        {/* Hero */}
        <View style={s.hero}>
          <Txt v="hero" accessibilityRole="header">
            {lang === 'ar' ? t('board.today') : t('board.today').toUpperCase()}
          </Txt>
          {todayLine ? (
            <Txt v="meta" style={{ marginTop: 2 }}>
              {todayLine}
            </Txt>
          ) : null}
        </View>

        {board.loading && !board.data ? (
          <BoardSkeleton />
        ) : board.error && !board.data ? (
          <View style={s.center}>
            <Txt v="headline" align="center">
              {t('board.loadError')}
            </Txt>
            <TextButton label={t('common.retry')} onPress={board.refetch} />
          </View>
        ) : sessions.length === 0 ? (
          <EmptyBoard spots={(spots.data ?? []).filter((x) => !profile?.city || cityKeys(profile.city).includes(cityKey(x.city)))} onHost={(spotId) => router.push(spotId ? { pathname: '/host', params: { spot: spotId } } : '/host')} onTrain={TRAIN_ENABLED ? () => router.push('/(tabs)/train') : undefined} />
        ) : (
          <View>
            {live.map((x, i) => row(x, i, [...live, ...todayAhead]))}
            <NowMarker now={now} />
            {todayAhead.length ? (
              todayAhead.map((x, i) => row(x, i, todayAhead))
            ) : (
              <View style={s.nothingLeft}>
                <Txt v="meta" style={{ flex: 1 }}>
                  {t('board.nothingLeft')}
                </Txt>
                <TextButton label={t('board.hostThisSlot')} onPress={() => router.push('/host')} />
              </View>
            )}

            {tomorrow.length ? (
              <View style={s.section}>
                <DayHeading label={t('board.tomorrow')} />
                {tomorrow.map((x, i) => row(x, i, tomorrow))}
              </View>
            ) : null}

            {later.length ? (
              <View style={s.section}>
                <DayHeading label={t('board.laterThisWeek')} />
                {later.map((x, i) => row(x, i, later, { showDay: true, compact: true }))}
              </View>
            ) : null}

            <Press onPress={() => router.push('/(tabs)/events')} feedback="selection" style={s.fullSchedule}>
              <Txt v="button" size={14} color={p.aqua}>
                {t('board.fullSchedule')}
              </Txt>
              <Icon name="chevron" size={13} color={p.aqua} weight="bold" />
            </Press>
          </View>
        )}
      </ScrollView>
      <GenderAsk />
      <LocationAsk />
    </SafeAreaView>
  );
}

// ─── Empty board: the cold start ────────────────────────────────────────────
function EmptyBoard({ spots, onHost, onTrain }: { spots: { id: string; name: string; city: string; imageUrl: string | null }[]; onHost: (spotId?: string) => void; onTrain?: () => void }) {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  return (
    <View style={s.empty}>
      <NowMarker now={Date.now()} />
      <View style={{ paddingHorizontal: 28, gap: 12 }}>
        <Txt v="title" size={26}>
          {t('board.emptyTitle')}
        </Txt>
        <Txt v="body" color={p.inkSoft}>
          {t('board.emptyBody')}
        </Txt>
        <MarkerButton label={t('board.hostA11y')} icon="plus" onPress={() => onHost()} style={{ marginTop: 6 }} />
        {/* No session today is never a dead end: there's always a workout to do. */}
        {onTrain ? <OutlineButton label={t('board.trainToday')} icon="train" onPress={onTrain} /> : null}
      </View>
      {spots.length ? (
        <View style={{ marginTop: 28 }}>
          <Txt v="title" size={18} style={{ paddingHorizontal: 28, marginBottom: 12 }}>
            {t('board.popularSpots')}
          </Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 28, gap: 12 }}>
            {spots.slice(0, 8).map((spot) => (
              <Press key={spot.id} onPress={() => onHost(spot.id)} feedback="selection" style={s.spot}>
                {spot.imageUrl ? <Image source={{ uri: spot.imageUrl }} style={s.spotImg} /> : <View style={[s.spotImg, { backgroundColor: p.wash }]} />}
                <Txt v="label" size={14} numberOfLines={1} style={{ marginTop: 8 }}>
                  {spot.name}
                </Txt>
                <Txt v="caption">{cityLabel(spot.city, lang)}</Txt>
              </Press>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function BoardSkeleton() {
  const { p } = useKit();
  return (
    <View style={{ paddingStart: 28, paddingEnd: 16, gap: 22, paddingTop: 16 }} accessibilityElementsHidden>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ width: 62, height: 26, borderRadius: 4, backgroundColor: p.wash }} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ width: '70%', height: 16, borderRadius: 4, backgroundColor: p.wash }} />
            <View style={{ width: '45%', height: 12, borderRadius: 4, backgroundColor: p.wash }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  content: { paddingBottom: 40 },
  masthead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingStart: 16, paddingEnd: 12, paddingTop: 4 },
  hostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: p.ruleStrong,
  },
  hero: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  center: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 32 },
  nothingLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingStart: 28, paddingEnd: 16, paddingVertical: 10 },
  section: {},
  fullSchedule: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48, marginTop: 16 },
  empty: { paddingBottom: 16 },
  spot: { width: 168 },
  spotImg: { width: 168, height: 104, borderRadius: 8 },
  planStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 6, marginBottom: 4, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: p.ruleStrong },
}));
