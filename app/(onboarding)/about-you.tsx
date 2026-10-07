import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../src/theme';
import { CITIES } from '../../src/lib/cities';
import { nearestCity, refreshPosition, useMyPosition } from '../../src/lib/location';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { journeyStage, Stage, STAGE_TO_LEVEL } from '../../src/lib/journey';
import { Txt, alignEnd } from '../../src/components/board/Txt';
import { Icon } from '../../src/components/board/Icon';
import { Press } from '../../src/components/board/Press';
import { Chip, Field, IconButton, MarkerButton, Segmented, TextButton } from '../../src/components/board/controls';
import { toast } from '../../src/components/board/toast';

const COUNTRIES = ['SA', 'AE', 'BH', 'KW', 'QA', 'OM', 'EG', 'JO'] as const;
const STAGES: Stage[] = ['dreamer', 'seeker', 'mover'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 71 }, (_, i) => THIS_YEAR - 10 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const ITEM = 48;

export default function AboutYouScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, setLanguage } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const { user, profile, refreshProfile } = useAuth();

  const [country, setCountry] = useState<string>(profile?.region || 'SA');
  const [city, setCity] = useState(profile?.city || '');
  const [dob, setDob] = useState<string>(profile?.date_of_birth || '');
  const [gender, setGender] = useState<string>(profile?.gender || '');
  // Gender is set once; after that only support changes it (the database enforces this too).
  const genderLocked = !!profile?.gender;
  const [stage, setStage] = useState<Stage | null>(journeyStage(profile?.experience_level));
  const [dobOpen, setDobOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // No city yet: start from where the phone is (the nearest known city and its country).
  const pos = useMyPosition();
  const [placeTouched, setPlaceTouched] = useState(!!profile?.city);
  useEffect(() => {
    if (!profile?.city) refreshPosition(true);
  }, []);
  useEffect(() => {
    if (!pos || placeTouched) return;
    const near = nearestCity(pos);
    const where = near ? Object.keys(CITIES).find((k) => CITIES[k].some(([en]) => en === near)) : null;
    if (!near || !where) return;
    setCountry(where);
    setCity(near);
  }, [pos?.lat, pos?.lng]);

  const cityLabel = (en: string) => {
    const hit = (CITIES[country] || []).find((c) => c[0] === en);
    return hit ? (lang === 'ar' ? hit[1] : hit[0]) : en;
  };
  const months = lang === 'ar' ? MONTHS_AR : MONTHS_EN;
  const dobLabel = dob
    ? (() => {
        const [y, m, d] = dob.split('-').map(Number);
        return `${d} ${months[(m || 1) - 1]} ${y}`;
      })()
    : t('onboarding.dobPlaceholder');

  async function save() {
    if (!gender) {
      toast.show(t('onboarding.needGender'), 'error');
      return;
    }
    if (!stage) {
      toast.show(t('onboarding.needLevel'), 'error');
      return;
    }
    setSaving(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ region: country, city: city.trim() || null, date_of_birth: dob || null, ...(genderLocked ? {} : { gender }), experience_level: STAGE_TO_LEVEL[stage] })
          .eq('id', user.id);
        if (error) throw error;
        await refreshProfile();
      }
      if (editing) router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
      else router.push('/(onboarding)/pick-sports');
    } catch {
      toast.show(t('onboarding.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.topRow}>
        {editing ? <IconButton name="back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} /> : <View style={{ width: 44 }} />}
        <Txt v="label" color={p.inkSoft}>
          {editing ? t('onboarding.editTitle') : t('onboarding.step', { n: 1, total: 3 })}
        </Txt>
        {editing ? <View style={{ width: 44 }} /> : <TextButton label={t('auth.langSwitch')} onPress={() => setLanguage(lang === 'ar' ? 'en' : 'ar')} />}
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!editing ? (
          <>
            <Txt v="title" size={30} accessibilityRole="header">
              {t('onboarding.aboutTitle')}
            </Txt>
            <Txt v="body" color={p.inkSoft} style={{ marginTop: 6 }}>
              {t('onboarding.aboutSub')}
            </Txt>
          </>
        ) : null}

        {/* The brand's own question */}
        <Txt v="hero" size={40} style={{ marginTop: editing ? 4 : 28 }}>
          {lang === 'ar' ? t('onboarding.level') : t('onboarding.level').toUpperCase()}
        </Txt>
        <View style={{ gap: 10, marginTop: 12 }}>
          {STAGES.map((st) => {
            const on = stage === st;
            const color = st === 'dreamer' ? '#56C4C4' : st === 'seeker' ? '#E88F24' : '#023C3C';
            const text = st === 'mover' ? '#F4F1EA' : '#023C3C';
            return (
              <Press
                key={st}
                onPress={() => setStage(st)}
                feedback="selection"
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[s.stage, on ? { backgroundColor: color, borderColor: st === 'mover' ? p.ink : color } : null]}
              >
                <Txt v="hero" size={28} color={on ? text : p.ink}>
                  {lang === 'ar' ? t(`onboarding.levels.${st}`) : t(`onboarding.levels.${st}`).toUpperCase()}
                </Txt>
                <Txt v="meta" color={on ? text : p.inkSoft} style={{ flex: 1, textAlign: alignEnd(lang) }} numberOfLines={2}>
                  {t(`onboarding.levels.${st}Sub`)}
                </Txt>
              </Press>
            );
          })}
        </View>

        <Txt v="title" size={18} style={s.label}>
          {t('onboarding.country')}
        </Txt>
        <View style={s.wrap}>
          {COUNTRIES.map((c) => (
            <Chip key={c} label={t(`onboarding.countries.${c}`)} selected={country === c} onPress={() => { setPlaceTouched(true); setCountry(c); setCity(''); }} />
          ))}
        </View>

        <Txt v="title" size={18} style={s.label}>
          {t('onboarding.city')}
        </Txt>
        <View style={[s.wrap, { marginBottom: 10 }]}>
          {(CITIES[country] || []).map(([en]) => (
            <Chip key={en} label={cityLabel(en)} selected={city === en} onPress={() => { setPlaceTouched(true); setCity(en); }} />
          ))}
        </View>
        <Field value={cityLabel(city)} onChangeText={setCity} placeholder={t('onboarding.cityPlaceholder')} />

        <Txt v="title" size={18} style={s.label}>
          {t('onboarding.gender')}
        </Txt>
        {genderLocked ? (
          <View style={s.dob}>
            <Icon name="lock" size={15} color={p.inkSoft} />
            <Txt v="body" style={{ flex: 1 }}>
              {gender === 'female' ? t('onboarding.female') : gender === 'male' ? t('onboarding.male') : gender}
            </Txt>
          </View>
        ) : (
          <Segmented
            value={gender || 'none'}
            onChange={(v) => setGender(v === 'none' ? '' : v)}
            options={[
              { value: 'female', label: t('onboarding.female') },
              { value: 'male', label: t('onboarding.male') },
            ]}
          />
        )}


        <Txt v="title" size={18} style={s.label}>
          {t('onboarding.dob')}
        </Txt>
        <Press onPress={() => setDobOpen(true)} feedback="selection" style={s.dob}>
          <Icon name="calendar" size={17} color={dob ? p.ink : p.inkFaint} />
          <Txt v="body" color={dob ? p.ink : p.inkFaint} style={{ flex: 1 }}>
            {dobLabel}
          </Txt>
          <Icon name="chevron" size={12} color={p.inkFaint} weight="bold" style={{ transform: [{ rotate: '90deg' }] }} />
        </Press>
      </ScrollView>

      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <MarkerButton label={saving ? t('common.saving') : editing ? t('common.save') : t('common.continue')} onPress={save} loading={saving} />
      </View>

      <DobSheet visible={dobOpen} value={dob} months={months} onClose={() => setDobOpen(false)} onDone={(v) => { setDob(v); setDobOpen(false); }} />
    </SafeAreaView>
  );
}

// ─── Date of birth: three snapping wheels ───────────────────────────────────
function Wheel<T extends string | number>({ items, value, onChange, label }: { items: T[]; value: T; onChange: (v: T) => void; label: (v: T) => string }) {
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
    <View style={{ flex: 1, height: ITEM * 5 }}>
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
            key={String(it)}
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
            <Txt v={it === value ? 'time' : 'body'} size={it === value ? 20 : 16} color={it === value ? p.ink : p.inkFaint}>
              {label(it)}
            </Txt>
          </Press>
        ))}
      </ScrollView>
    </View>
  );
}

function DobSheet({ visible, value, months, onClose, onDone }: { visible: boolean; value: string; months: string[]; onClose: () => void; onDone: (v: string) => void }) {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const parts = value ? value.split('-').map(Number) : [THIS_YEAR - 25, 1, 1];
  const [y, setY] = useState(YEARS.includes(parts[0]) ? parts[0] : THIS_YEAR - 25);
  const [m, setM] = useState(parts[1] || 1);
  const [d, setD] = useState(parts[2] || 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={s.sheet}>
        <View style={s.sheetHeader}>
          <TextButton label={t('common.cancel')} onPress={onClose} color={p.inkSoft} />
          <Txt v="headline" style={{ flex: 1 }} align="center">
            {t('onboarding.dob')}
          </Txt>
          <TextButton label={t('common.done')} onPress={() => onDone(`${y}-${pad(m)}-${pad(Math.min(d, new Date(y, m, 0).getDate()))}`)} />
        </View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 12 }}>
          <Wheel items={DAYS} value={d} onChange={setD} label={(v) => String(v)} />
          <Wheel items={Array.from({ length: 12 }, (_, i) => i + 1)} value={m} onChange={setM} label={(v) => months[v - 1]} />
          <Wheel items={YEARS} value={y} onChange={setY} label={(v) => String(v)} />
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingEnd: 16 },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingHorizontal: 18, borderRadius: 32, borderWidth: 2, borderColor: p.ruleStrong },
  label: { marginTop: 26, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dob: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: p.ruleStrong, backgroundColor: p.wash },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
  sheet: { flex: 1, backgroundColor: p.board },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
}));
