import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { cityLabel } from '../../lib/cities';
import { clockParts, fmtClock, fmtDay, fmtIn } from '../../i18n/format';
import type { Session } from '../../data/model';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Press } from './Press';
import { MagnetRow } from './people';
import { Node, Sun, Tag, Tally, ZigZag } from './marks';
import { MarkerButton, OutlineButton } from './controls';

/** Re-render on a clock tick so NOW, LIVE, and countdowns stay true. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function sportLabel(t: (k: string) => string, sport: string) {
  return t(`sports.${sport}`);
}

/** Place line: "Padel · Olaya Courts · Riyadh" */
function placeLine(s: Session, t: (k: string) => string, lang: string) {
  return [sportLabel(t, s.sport), s.place, cityLabel(s.city, lang)].filter(Boolean).join(' · ');
}

// ─── Tags for a session's state ─────────────────────────────────────────────
export function SessionTags({ s, now }: { s: Session; now: number }) {
  const { t } = useI18n();
  const tags: React.ReactNode[] = [];
  if (s.state === 'cancelled') tags.push(<Tag key="c" label={t('session.cancelled')} tone="danger" />);
  if (s.state === 'live') tags.push(<Tag key="l" label={t('session.live')} tone="marker" solid />);
  if (s.state !== 'cancelled' && s.isFull) tags.push(<Tag key="f" label={t('session.full')} tone="ink" />);
  if (s.dropIn && s.state !== 'cancelled') tags.push(<Tag key="o" label={t('session.dropIn')} tone="marker" />);
  if (s.womenOnly) tags.push(<Tag key="w" label={t('session.womenOnly')} tone="coral" />);
  if (s.communityPrivate && s.communityName && !s.packOnly) tags.push(<Tag key="cm" icon="shield" label={s.communityName} tone="aqua" />);
  if (s.packOnly) tags.push(<Tag key="p" icon="lock" label={s.packName ? t('session.packOnly', { pack: s.packName }) : t('session.packOnlyGeneric')} tone="aqua" />);
  if (s.difficulty) tags.push(<Tag key="d" label={t(`session.difficulty.${s.difficulty}`)} tone="ghost" />);
  if (!tags.length) return null;
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{tags}</View>;
}

/** "7 of 8 · 1 spot left" / "12 going" */
export function capacityLine(s: Session, t: (k: string, v?: any) => string, tn: (k: string, n: number, v?: any) => string) {
  if (s.capacity != null) {
    const base = t('session.goingOf', { n: s.goingCount, cap: s.capacity });
    if (s.isFull || s.state === 'cancelled') return base;
    return `${base} · ${tn('session.spotsLeft', s.spotsLeft ?? 0)}`;
  }
  return tn('session.going', s.goingCount);
}

// ─── The row ────────────────────────────────────────────────────────────────
export type RowSize = 'hero' | 'normal' | 'compact';

interface RowProps {
  s: Session;
  size?: RowSize;
  now: number;
  meId?: string | null;
  /** show the day under the time (lists that span days) */
  showDay?: boolean;
  /** draw the leading rail (board lists) */
  rail?: boolean;
  last?: boolean;
  onPress?: () => void;
  onJoin?: () => void;
  joining?: boolean;
  /** animate the sun rising (just joined) */
  justJoined?: boolean;
}

export function SessionRow({ s, size = 'normal', now, meId, showDay, rail = true, last, onPress, onJoin, joining, justJoined }: RowProps) {
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const hero = size === 'hero';
  const compact = size === 'compact';
  const { time, suffix } = clockParts(s.startsAt, lang);
  const mine = s.myStatus === 'going' || s.isHost;
  const dim = s.state === 'cancelled' || s.state === 'finished';
  const nodeState = s.state === 'live' ? 'live' : mine && !dim ? 'yours' : dim ? 'past' : 'open';

  const timeSize = hero ? 46 : compact ? 18 : 22;
  const sunSize = hero ? 108 : compact ? 58 : 70;

  const timeBlock = (
    <View style={{ width: hero ? 118 : compact ? 64 : 76, alignItems: 'flex-start' }}>
      {mine && !dim ? (
        <Sun size={sunSize} rise={justJoined} style={{ marginStart: hero ? -6 : -8, marginTop: hero ? -8 : -12 }}>
          <View style={{ alignItems: 'center' }}>
            <Txt v={hero ? 'stencil' : 'time'} size={hero ? timeSize - 6 : compact ? 14 : 16} color={p.onMarker}>
              {time}
            </Txt>
            <Txt v="label" size={11} color={p.onMarker}>
              {suffix}
            </Txt>
          </View>
        </Sun>
      ) : (
        <View>
          <Txt
            v={hero ? 'stencil' : 'time'}
            size={timeSize}
            color={dim ? p.inkFaint : p.ink}
            style={s.state === 'cancelled' ? { textDecorationLine: 'line-through' } : null}
          >
            {time}
          </Txt>
          <Txt v="label" size={11} color={p.inkSoft}>
            {suffix}
          </Txt>
        </View>
      )}
      {showDay ? (
        <Txt v="caption" style={{ marginTop: 4 }}>
          {fmtDay(s.startsAt, lang, new Date(now))}
        </Txt>
      ) : null}
    </View>
  );

  const statusLine =
    s.state === 'live'
      ? t('session.endsIn', { in: fmtIn(s.endsAt, lang, new Date(now)) })
      : s.state === 'upcoming' && hero
        ? t('session.startsIn', { in: fmtIn(s.startsAt, lang, new Date(now)) })
        : null;

  const body = (
    <View style={{ flex: 1, gap: hero ? 8 : 6, paddingBottom: 2 }}>
      <Txt v="row" size={hero ? 22 : compact ? 14 : 16} numberOfLines={2} color={dim ? p.inkFaint : p.ink}>
        {s.title || t(`sportNoun.${s.sport}`)}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon sport={s.sport} size={14} color={p.inkSoft} />
        <Txt v="meta" numberOfLines={1} style={{ flex: 1 }}>
          {placeLine(s, t, lang)}
        </Txt>
      </View>
      {statusLine ? (
        <Txt v="label" size={13} color={s.state === 'live' ? p.markerText : p.inkSoft}>
          {statusLine}
        </Txt>
      ) : null}
      {!compact ? <SessionTags s={s} now={now} /> : null}
      {!compact && s.state !== 'cancelled' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <MagnetRow people={s.roster} total={s.goingCount} max={hero ? 6 : 4} size={hero ? 30 : 24} meId={meId} snapId={justJoined ? meId : null} />
          <Tally count={s.goingCount} capacity={s.capacity} size={hero ? 16 : 13} />
          <Txt v="meta" size={12}>
            {capacityLine(s, t, tn)}
          </Txt>
        </View>
      ) : null}
      {hero && s.state === 'upcoming' && !mine && onJoin ? (
        s.isFull ? (
          <OutlineButton label={t('session.joinWaitlist')} icon="hourglass" onPress={onJoin} loading={joining} style={{ marginTop: 6 }} />
        ) : (
          <MarkerButton label={t('session.imIn')} onPress={onJoin} loading={joining} style={{ marginTop: 6 }} />
        )
      ) : null}
      {hero && mine && s.state !== 'cancelled' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.marker }} />
          <Txt v="label" size={13} color={p.markerText}>
            {s.isHost ? t('session.hosting') : t('session.onTheBoard')}
          </Txt>
        </View>
      ) : null}
    </View>
  );

  return (
    <Animated.View exiting={FadeOut.duration(320)} layout={LinearTransition.duration(220)}>
      <Press
        onPress={onPress}
        feedback="selection"
        depress={0.985}
        accessibilityLabel={`${s.title}, ${fmtClock(s.startsAt, lang)}, ${placeLine(s, t, lang)}`}
        style={{ flexDirection: 'row', alignItems: 'stretch' }}
      >
        {rail ? (
          <View style={{ width: 28, alignItems: 'center' }}>
            <View style={{ position: 'absolute', top: 0, bottom: last ? '70%' : 0, width: 2, backgroundColor: p.rule }} />
            <View style={{ marginTop: hero ? 14 : 6 }}>
              <Node state={nodeState} size={hero ? 14 : 11} />
            </View>
          </View>
        ) : null}
        <View style={{ flex: 1, flexDirection: 'row', gap: 10, paddingVertical: hero ? 18 : compact ? 12 : 16, paddingEnd: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: p.rule, opacity: s.state === 'cancelled' ? 0.8 : 1 }}>
          {timeBlock}
          {body}
        </View>
      </Press>
    </Animated.View>
  );
}

// ─── NOW marker on the rail ─────────────────────────────────────────────────
export function NowMarker({ now }: { now: number }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 34 }} accessibilityLabel={`${t('board.now')} ${fmtClock(new Date(now), lang)}`}>
      <View style={{ width: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: p.rule }} />
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.marker, borderWidth: 3, borderColor: p.board }} />
      </View>
      <Txt v="label" size={12} color={p.markerText} style={{ letterSpacing: 0.6 }}>
        {t('board.now').toUpperCase()} · {fmtClock(new Date(now), lang)}
      </Txt>
      <View style={{ flex: 1, height: 2, backgroundColor: p.marker, marginStart: 10, marginEnd: 16, opacity: 0.85 }} />
    </View>
  );
}

// ─── Day heading with the brand zig-zag ─────────────────────────────────────
export function DayHeading({ label, first }: { label: string; first?: boolean }) {
  const { p } = useKit();
  return (
    <View style={{ marginTop: first ? 0 : 22, marginBottom: 6, paddingHorizontal: 16 }}>
      {!first ? <ZigZag style={{ marginBottom: 12 }} color={p.ruleStrong} /> : null}
      <Txt v="row" size={20} accessibilityRole="header">
        {label}
      </Txt>
    </View>
  );
}
