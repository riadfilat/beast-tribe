import React from 'react';
import { View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import type { Session } from '../../data/model';
import { money, useSessionDues } from '../../data/dues';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Magnet } from './people';

/**
 * What a session costs each person, said plainly: the court price split per player, or the guest
 * price of a class. Payment is made at the venue for now; the venue marks it as paid.
 */
export function PayBlock({ x, meId, isGuest }: { x: Session; meId: string | null; isGuest: boolean }) {
  const { p } = useKit();
  const { t, tn } = useI18n();
  const dues = useSessionDues(x.share != null || x.guestOpen ? x.id : null).data ?? [];
  const mine = dues.find((d) => d.userId === meId) ?? null;
  const dueOf = (id: string) => dues.find((d) => d.userId === id) ?? null;

  if (x.share != null) {
    const players = x.capacity ?? x.goingCount;
    const total = x.share * players;
    const open = Math.max(0, players - x.goingCount);
    return (
      <View style={{ gap: 12 }}>
        <Txt v="title" size={18}>
          {t('pay.splitTitle')}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
          <View>
            <Txt v="caption">{t('pay.each')}</Txt>
            <Txt v="stencil" size={44} color={p.markerText}>
              {money(x.share)}
            </Txt>
          </View>
          <Txt v="body" size={14} color={p.inkSoft} style={{ flex: 1, paddingBottom: 6 }}>
            {t('pay.splitLine', { total: money(total), n: players })}
          </Txt>
        </View>
        <View style={{ borderTopWidth: 1, borderTopColor: p.rule }}>
          {x.roster.map((person) => {
            const d = dueOf(person.id);
            return (
              <View key={person.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: p.rule }}>
                <Magnet person={person} size={26} yours={person.id === meId} />
                <Txt v="row" size={14} style={{ flex: 1 }} numberOfLines={1}>
                  {person.id === meId ? t('common.you') : person.name}
                </Txt>
                {d?.paid ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name="check" size={12} color={p.aqua} />
                    <Txt v="label" size={13} color={p.aqua}>
                      {t('pay.paid')}
                    </Txt>
                  </View>
                ) : null}
                <Txt v="time" size={15}>
                  {money(x.share!)}
                </Txt>
              </View>
            );
          })}
          {open > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: p.ruleStrong, borderStyle: 'dashed' }} />
              <Txt v="row" size={14} color={p.inkSoft} style={{ flex: 1 }}>
                {tn('pay.openSpots', open)}
              </Txt>
              <Txt v="time" size={15} color={p.inkSoft}>
                {money(open * x.share)}
              </Txt>
            </View>
          ) : null}
        </View>
        <Txt v="caption">{open > 0 ? t('pay.splitNoteOpen') : t('pay.splitNote')}</Txt>
      </View>
    );
  }

  if (x.guestOpen && isGuest && x.guestPrice) {
    return (
      <View style={{ gap: 8 }}>
        <Txt v="title" size={18}>
          {t('pay.guestTitle')}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
          <Txt v="stencil" size={44} color={p.markerText}>
            {money(x.guestPrice)}
          </Txt>
          <Txt v="body" size={14} color={p.inkSoft} style={{ flex: 1, paddingBottom: 6 }}>
            {x.communityName ? t('pay.guestLine', { name: x.communityName }) : t('pay.guestLineAnon')}
          </Txt>
        </View>
        {mine ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={mine.paid ? 'check' : 'info'} size={13} color={mine.paid ? p.aqua : p.inkSoft} />
            <Txt v="caption">{mine.paid ? t('pay.youPaid') : t('pay.payAtDesk', { amount: money(mine.amount) })}</Txt>
          </View>
        ) : (
          <Txt v="caption">{t('pay.guestNote')}</Txt>
        )}
      </View>
    );
  }
  return null;
}
