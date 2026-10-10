// Date of birth picker: three snapping wheels (day, month, year) with a Gregorian | Hijri switch.
// Whatever the calendar, the chosen date comes back as Gregorian 'YYYY-MM-DD' (what the profile stores).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { makeStyles, useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { birthYears, CalendarKind, daysInMonth, formatDate, fromIso, MONTHS, toIso, Ymd } from '../../lib/calendar';
import { Txt } from './Txt';
import { Press } from './Press';
import { Segmented, TextButton } from './controls';

const ITEM = 48;
const THIS_YEAR = new Date().getFullYear();
const YOUNGEST = THIS_YEAR - 10;
const SPAN = 71;
const MONTH_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

/** "21 Mar 1993 · 28 Ramadan 1413 AH": both calendars, so either reading can be checked. */
export function birthdayLabel(iso: string, lang: 'en' | 'ar'): string {
  return iso ? `${formatDate('gregorian', iso, lang)} · ${formatDate('hijri', iso, lang)}` : '';
}

function Wheel({ items, value, onChange, label, flex = 1 }: { items: number[]; value: number; onChange: (v: number) => void; label: (v: number) => string; flex?: number }) {
  const { p } = useKit();
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    const i = Math.max(0, items.indexOf(value));
    const id = setTimeout(() => ref.current?.scrollTo({ y: i * ITEM, animated: false }), 60);
    return () => clearTimeout(id);
  }, []);
  const settle = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM)));
      onChange(items[i]);
    },
    [items, onChange],
  );
  return (
    <View style={{ flex, height: ITEM * 5 }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: ITEM * 2, start: 4, end: 4, height: ITEM, borderRadius: 8, backgroundColor: p.wash, borderWidth: 1.5, borderColor: p.ruleStrong }} />
      <ScrollView
        ref={ref}
        snapToInterval={ITEM}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        contentContainerStyle={{ paddingVertical: ITEM * 2 }}
      >
        {items.map((it, i) => (
          <Press
            key={it}
            feedback="selection"
            depress={1}
            accessibilityRole="button"
            accessibilityState={{ selected: it === value }}
            onPress={() => {
              // Tapping a value picks it, as well as scrolling the wheel to it.
              ref.current?.scrollTo({ y: i * ITEM, animated: true });
              onChange(it);
            }}
            style={{ height: ITEM, alignItems: 'center', justifyContent: 'center' }}
          >
            <Txt v={it === value ? 'time' : 'body'} size={it === value ? 20 : 16} color={it === value ? p.ink : p.inkFaint} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {label(it)}
            </Txt>
          </Press>
        ))}
      </ScrollView>
    </View>
  );
}

export function DobSheet({ visible, value, onClose, onDone }: { visible: boolean; value: string; onClose: () => void; onDone: (iso: string) => void }) {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const [cal, setCal] = useState<CalendarKind>('gregorian');
  const start = (kind: CalendarKind): Ymd => fromIso(kind, value) || fromIso(kind, `${THIS_YEAR - 25}-01-01`)!;
  const [ymd, setYmd] = useState<Ymd>(() => start('gregorian'));
  // Each time the sheet opens, start from the saved date in the calendar last used.
  useEffect(() => {
    if (visible) setYmd(start(cal));
  }, [visible]);

  const [y, m, d] = ymd;
  const iso = toIso(cal, ymd);
  const other: CalendarKind = cal === 'gregorian' ? 'hijri' : 'gregorian';
  const years = birthYears(cal, YOUNGEST, SPAN);
  const days = Array.from({ length: cal === 'hijri' ? 30 : 31 }, (_, i) => i + 1);
  const months = MONTHS[cal][lang === 'ar' ? 'ar' : 'en'];

  // Switching calendars keeps the same birthday, shown the other way.
  const switchTo = (next: CalendarKind) => {
    if (next === cal) return;
    setYmd(fromIso(next, iso)!);
    setCal(next);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={s.sheet}>
        <View style={s.header}>
          <TextButton label={t('common.cancel')} onPress={onClose} color={p.inkSoft} />
          <Txt v="headline" style={{ flex: 1 }} align="center">
            {t('onboarding.dob')}
          </Txt>
          <TextButton label={t('common.done')} onPress={() => onDone(iso)} />
        </View>
        <Segmented
          value={cal}
          onChange={switchTo}
          options={[
            { value: 'gregorian', label: t('onboarding.gregorian') },
            { value: 'hijri', label: t('onboarding.hijri') },
          ]}
          style={s.switch}
        />
        {/* Remounted on a calendar switch so each wheel scrolls to its new value. */}
        <View key={cal} style={s.wheels}>
          <Wheel items={days} value={Math.min(d, daysInMonth(cal, y, m))} onChange={(v) => setYmd([y, m, v])} label={String} />
          <Wheel items={MONTH_NUMBERS} value={m} onChange={(v) => setYmd([y, v, d])} label={(v) => months[v - 1]} flex={1.5} />
          <Wheel items={years} value={y} onChange={(v) => setYmd([v, m, d])} label={String} />
        </View>
        <Txt v="body" color={p.inkSoft} align="center" style={s.other}>
          {formatDate(other, iso, lang === 'ar' ? 'ar' : 'en')}
        </Txt>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles(({ p }) => ({
  sheet: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
  switch: { marginHorizontal: 20, marginTop: 16 },
  wheels: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 12 },
  other: { marginTop: 12 },
}));
