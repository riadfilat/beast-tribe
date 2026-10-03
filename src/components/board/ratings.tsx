import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { Level, LEVELS, ratePlayers, rateable, useMyGivenRatings, useSessionsToRate } from '../../data/ratings';
import type { Person } from './people';
import { Magnet } from './people';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Press } from './Press';
import { Chip, MarkerButton } from './controls';
import { toast } from './toast';
import { haptic } from '../../lib/haptics';

/**
 * After a session: rate the level of the people you trained with. Private, and it only helps the
 * matching put people of a similar level together.
 */
export function RatePeople({ eventId, sport, people }: { eventId: string; sport: string; people: Person[] }) {
  const { p } = useKit();
  const { t } = useI18n();
  const given = useMyGivenRatings(eventId).data;
  const [picks, setPicks] = useState<Record<string, Level>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (given) setPicks((cur) => ({ ...given, ...cur }));
  }, [given]);
  if (!rateable(sport) || !people.length) return null;
  const changed = Object.keys(picks).some((id) => picks[id] !== given?.[id]);

  async function save() {
    setBusy(true);
    try {
      await ratePlayers(eventId, picks);
      haptic('success');
      toast.show(t('rate.saved'), 'yours');
    } catch {
      toast.show(t('rate.error'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Txt v="title" size={18}>
          {t('rate.title', { sport: t(`sports.${sport}`) })}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
          <Icon name="lock" size={12} color={p.aqua} style={{ marginTop: 3 }} />
          <Txt v="caption" style={{ flex: 1 }}>
            {t('rate.private')}
          </Txt>
        </View>
      </View>
      {people.map((person) => (
        <View key={person.id} style={{ gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: p.rule }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Magnet person={person} size={30} />
            <Txt v="row" size={15} style={{ flex: 1 }} numberOfLines={1}>
              {person.name}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {LEVELS.map((lv) => (
              <Chip key={lv} label={t(`rate.levels.${lv}`)} selected={picks[person.id] === lv} onPress={() => setPicks((cur) => ({ ...cur, [person.id]: lv }))} />
            ))}
          </View>
        </View>
      ))}
      {changed ? <MarkerButton label={t('rate.save')} onPress={save} loading={busy} /> : null}
    </View>
  );
}

/** On the Board: a finished session with people still to rate. */
export function RateNudge() {
  const { p } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const first = (useSessionsToRate().data ?? [])[0];
  if (!first) return null;
  return (
    <Press
      onPress={() => router.push({ pathname: '/session/[id]', params: { id: first.eventId } })}
      feedback="light"
      accessibilityRole="button"
      style={{ marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: p.rule, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.wash, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="people" size={18} color={p.aqua} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="row" size={14} numberOfLines={1}>
          {t('rate.nudgeTitle', { title: first.title })}
        </Txt>
        <Txt v="caption">{tn('rate.nudgeSub', first.people)}</Txt>
      </View>
      <Icon name="chevron" size={14} color={p.inkFaint} />
    </Press>
  );
}
