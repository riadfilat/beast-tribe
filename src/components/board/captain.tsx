import React from 'react';
import { View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { useCaptains, useMyCaptaincies } from '../../data/captains';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Press } from './Press';
import { Magnet } from './people';

/** For a captain, on the Board: each community's week against its target, one tap from hosting. */
export function CaptainWeek({ onHost }: { onHost: (communityId: string) => void }) {
  const { p } = useKit();
  const { t } = useI18n();
  const mine = useMyCaptaincies().data ?? [];
  if (!mine.length) return null;
  return (
    <View style={{ marginHorizontal: 16, marginTop: 10, gap: 8 }}>
      {mine.map((c) => {
        const done = c.thisWeek >= c.target;
        return (
          <Press key={c.communityId} onPress={() => onHost(c.communityId)} feedback="light" style={{ padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: done ? p.rule : p.marker, gap: 8 }} accessibilityRole="button">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="flag" size={14} color={p.marker} />
              <Txt v="label" size={12} color={p.inkSoft} style={{ flex: 1 }} numberOfLines={1}>
                {t('captain.youAre', { name: c.name })}
              </Txt>
              <Icon name="plus" size={16} color={p.ink} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {Array.from({ length: c.target }, (_, i) => (
                <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < c.thisWeek ? p.marker : p.rule }} />
              ))}
            </View>
            <Txt v="row" size={15}>
              {done ? t('captain.weekDone', { n: c.thisWeek }) : t('captain.week', { have: c.thisWeek, target: c.target })}
            </Txt>
            <Txt v="caption">{c.nextWeek ? t('captain.nextWeek', { n: c.nextWeek }) : t('captain.nextWeekEmpty')}</Txt>
          </Press>
        );
      })}
    </View>
  );
}

/** On a community's page: who the captains are. */
export function CommunityCaptains({ communityId }: { communityId: string }) {
  const { p } = useKit();
  const { t } = useI18n();
  const captains = useCaptains(communityId).data ?? [];
  if (!captains.length) return null;
  return (
    <View style={{ marginTop: 14, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: p.rule, gap: 10 }}>
      <Txt v="label" size={12} color={p.inkSoft}>
        {t(captains.length === 1 ? 'captain.one' : 'captain.many')}
      </Txt>
      {captains.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Magnet person={c} size={32} />
          <Txt v="row" size={16} style={{ flex: 1 }} numberOfLines={1}>
            {c.name}
          </Txt>
        </View>
      ))}
      <Txt v="caption">{t('captain.about')}</Txt>
    </View>
  );
}
