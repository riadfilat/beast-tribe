import React from 'react';
import { View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { clockParts } from '../../i18n/format';
import { Slot, slotState } from '../../data/facilities';
import { Txt } from './Txt';
import { Press } from './Press';
import { toast } from './toast';

// A court's times for one day. Every time stays on the board with what it is: free to book,
// booked by someone, or too soon to book (inside the venue's notice). Only free times can be picked.
export function SlotGrid({ slots, noticeHours, selected, onPick }: { slots: Slot[]; noticeHours: number; selected: number | null; onPick: (at: number) => void }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const now = Date.now();
  const rows = slots.map((x) => ({ x, state: slotState(x, noticeHours, now) }));
  const free = rows.filter((r) => r.state === 'free').length;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <Txt v="label" size={13} color={free ? p.aqua : p.inkSoft}>
          {t('courts.freeCount', { n: free, total: rows.length })}
        </Txt>
        <Legend color={p.aqua} label={t('courts.slotFree')} />
        <Legend color={p.inkFaint} label={t('courts.slotBooked')} struck />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {rows.map(({ x, state }) => {
          const at = x.startsAt.getTime();
          const on = selected === at && state === 'free';
          const { time, suffix } = clockParts(x.startsAt, lang);
          const status = state === 'free' ? t('courts.slotFree') : state === 'booked' ? t('courts.slotBooked') : t('courts.slotSoon');
          const fg = on ? p.board : state === 'free' ? p.ink : p.inkFaint;
          return (
            <Press
              key={at}
              // Taken times stay tappable so they can say why (a disabled button would fade them out).
              onPress={() => (state === 'free' ? onPick(at) : toast.show(state === 'booked' ? t('courts.slotBookedToast') : t('courts.slotSoonToast', { h: noticeHours })))}
              feedback="selection"
              depress={0.95}
              accessibilityRole="button"
              accessibilityLabel={`${time} ${suffix}, ${status}`}
              accessibilityState={{ selected: on, disabled: state !== 'free' }}
              style={{
                minWidth: 84,
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 8,
                borderWidth: 1.5,
                borderStyle: state === 'free' ? 'solid' : 'dashed',
                borderColor: on ? p.ink : state === 'free' ? p.ruleStrong : p.rule,
                backgroundColor: on ? p.ink : state === 'free' ? 'transparent' : p.wash,
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Txt v="label" size={15} color={fg} style={state === 'booked' ? { textDecorationLine: 'line-through' } : null}>
                {`${time} ${suffix}`}
              </Txt>
              <Txt v="label" size={11} color={on ? p.board : state === 'free' ? p.aqua : p.inkFaint} style={{ letterSpacing: 0.3 }}>
                {on ? t('courts.slotPicked') : status}
              </Txt>
            </Press>
          );
        })}
      </View>
    </View>
  );
}

function Legend({ color, label, struck }: { color: string; label: string; struck?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} accessibilityElementsHidden importantForAccessibility="no">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Txt v="caption" style={struck ? { textDecorationLine: 'line-through' } : null}>
        {label}
      </Txt>
    </View>
  );
}
