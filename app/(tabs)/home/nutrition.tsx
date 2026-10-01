import React, { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { fmtDay, fmtWeekday, localDateKey } from '../../../src/i18n/format';
import { useAuth } from '../../../src/providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { FoodPartner, useFoodPartners } from '../../../src/data/partners';
import {
  addGlass,
  DEFAULT_GOALS,
  deleteMeal,
  GLASS_L,
  logMeal,
  Meal,
  MEAL_TYPES,
  mealTypeForNow,
  MealType,
  NutritionGoals,
  QUICK_FOODS,
  QuickFood,
  removeGlass,
  saveNutritionGoals,
  useNutritionGoals,
  useNutritionWeek,
} from '../../../src/data/nutrition';
import { Txt } from '../../../src/components/board/Txt';
import { Press } from '../../../src/components/board/Press';
import { Tally } from '../../../src/components/board/marks';
import { Field, IconButton, MarkerButton, Segmented, SectionHeading, TextButton } from '../../../src/components/board/controls';
import { Sheet } from '../../../src/components/board/sheet';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';

const fmtNum = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const dayOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function NutritionScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const week = useNutritionWeek();
  const { goals } = useNutritionGoals();
  const today = localDateKey(new Date());
  const [day, setDay] = useState(today);
  const [logOpen, setLogOpen] = useState(false);
  const [targetsOpen, setTargetsOpen] = useState(false);

  const days = week.data?.days ?? [];
  const meals = (week.data?.meals ?? []).filter((m) => m.date === day);
  const glasses = week.data?.glasses[day] ?? 0;
  const totals = meals.reduce((a, m) => ({ cal: a.cal + m.calories, p: a.p + m.protein, c: a.c + m.carbs, f: a.f + m.fat }), { cal: 0, p: 0, c: 0, f: 0 });
  const dayCalories = (key: string) => (week.data?.meals ?? []).filter((m) => m.date === key).reduce((sum, m) => sum + m.calories, 0);
  const remaining = goals.calories - totals.cal;

  async function water(delta: 1 | -1) {
    if (!meId) return;
    if (delta < 0 && glasses === 0) return;
    week.setData((prev) => (prev ? { ...prev, glasses: { ...prev.glasses, [day]: Math.max(0, (prev.glasses[day] ?? 0) + delta) } } : prev));
    try {
      await (delta > 0 ? addGlass(meId, day) : removeGlass(meId, day));
    } catch {
      toast.show(t('common.somethingWrong'), 'error');
      week.refetch();
    }
  }

  function askRemove(m: Meal) {
    Alert.alert(t('nutrition.removeTitle', { food: m.title }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: async () => {
          week.setData((prev) => (prev ? { ...prev, meals: prev.meals.filter((x) => x.id !== m.id) } : prev));
          try {
            await deleteMeal(m.id);
            haptic('light');
          } catch {
            toast.show(t('common.somethingWrong'), 'error');
            week.refetch();
          }
        },
      },
    ]);
  }

  const grouped = MEAL_TYPES.map((type) => ({ type, items: meals.filter((m) => m.type === type) })).filter((g) => g.items.length);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <IconButton name="back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
        <Txt v="title" size={22} style={{ flex: 1 }} accessibilityRole="header">
          {t('nutrition.title')}
        </Txt>
        <TextButton label={t('nutrition.targets')} onPress={() => setTargetsOpen(true)} style={{ paddingHorizontal: 8 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={week.refreshing} onRefresh={week.refetch} tintColor={p.ink} />}
      >
        {/* The week: each day's total against the target; tap a day to open it. */}
        <View style={s.week} accessibilityRole="tablist" accessibilityLabel={t('nutrition.week')}>
          {days.map((key) => {
            const d = dayOf(key);
            const cal = dayCalories(key);
            const ratio = Math.min(1, cal / Math.max(1, goals.calories));
            const on = key === day;
            const isToday = key === today;
            return (
              <Press
                key={key}
                onPress={() => setDay(key)}
                feedback="selection"
                depress={0.95}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t('nutrition.dayTotal', { day: fmtDay(d, lang), n: fmtNum(cal) })}
                style={s.dayCol}
              >
                <Txt v="caption" size={11} color={on ? p.ink : p.inkSoft} numberOfLines={1} adjustsFontSizeToFit>
                  {lang === 'ar' ? fmtWeekday(d, lang) : fmtWeekday(d, lang).toUpperCase()}
                </Txt>
                <View style={[s.bar, { backgroundColor: p.rule }]}>
                  <View style={[s.barFill, { height: `${Math.round(ratio * 100)}%`, backgroundColor: on ? p.ink : p.inkFaint }]} />
                </View>
                <View style={[s.date, on ? { backgroundColor: p.ink } : null]}>
                  <Txt v="time" size={15} color={on ? p.board : isToday ? p.markerText : p.ink}>
                    {d.getDate()}
                  </Txt>
                </View>
              </Press>
            );
          })}
        </View>

        {/* The day's ledger */}
        <View style={s.section}>
          <Txt v="row" size={20} accessibilityRole="header">
            {fmtDay(dayOf(day), lang)}
          </Txt>
          <View style={s.totalRow}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1 }}>
              <Txt v="time" size={44}>
                {fmtNum(totals.cal)}
              </Txt>
              <Txt v="meta" size={15}>
                {t('nutrition.kcal')}
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt v="label" size={15} color={remaining < 0 ? p.markerText : p.ink}>
                {remaining >= 0 ? t('nutrition.left', { n: fmtNum(remaining) }) : t('nutrition.over', { n: fmtNum(-remaining) })}
              </Txt>
              <Txt v="meta">{t('nutrition.ofTarget', { n: fmtNum(goals.calories) })}</Txt>
            </View>
          </View>
          <MeasureLine ratio={totals.cal / Math.max(1, goals.calories)} dot />

          <View style={s.macros}>
            <Macro label={t('nutrition.protein')} value={totals.p} goal={goals.protein} />
            <Macro label={t('nutrition.carbs')} value={totals.c} goal={goals.carbs} />
            <Macro label={t('nutrition.fat')} value={totals.f} goal={goals.fat} />
          </View>

          {/* Water, counted in tally strokes: one stroke per glass */}
          <View style={s.water}>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Txt v="label" size={15}>
                  {t('nutrition.water')}
                </Txt>
                <Txt v="meta">{t('nutrition.waterOf', { n: String(glasses * GLASS_L), goal: String(goals.water) })}</Txt>
              </View>
              <Tally count={glasses} capacity={Math.round(goals.water / GLASS_L)} size={18} />
            </View>
            <IconButton name="minus" label={t('nutrition.removeGlass')} onPress={() => water(-1)} color={glasses ? p.ink : p.ghost} style={s.waterBtn} />
            <IconButton name="plus" label={t('nutrition.addGlass')} onPress={() => water(1)} style={s.waterBtn} />
          </View>
        </View>

        {/* Meals */}
        <View style={[s.section, { marginTop: 18 }]}>
          {grouped.length === 0 && !week.loading ? (
            <Txt v="body" color={p.inkSoft} style={{ paddingVertical: 12 }}>
              {day === today ? t('nutrition.emptyToday') : t('nutrition.emptyDay')}
            </Txt>
          ) : null}
          {grouped.map((g) => (
            <View key={g.type} style={{ marginBottom: 14 }}>
              <View style={s.mealHead}>
                <Txt v="row" size={14} color={p.inkSoft} style={{ flex: 1 }}>
                  {t(`nutrition.meals.${g.type}`)}
                </Txt>
                <Txt v="time" size={14} color={p.inkSoft}>
                  {fmtNum(g.items.reduce((sum, m) => sum + m.calories, 0))}
                </Txt>
              </View>
              {g.items.map((m) => (
                <Press key={m.id} onPress={() => askRemove(m)} feedback="selection" depress={0.99} style={s.mealRow} accessibilityHint={t('nutrition.removeTitle', { food: m.title })}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="body" numberOfLines={1}>
                      {m.title}
                    </Txt>
                    {m.protein || m.carbs || m.fat ? (
                      <Txt v="caption">{t('nutrition.macros', { p: fmtNum(m.protein), c: fmtNum(m.carbs), f: fmtNum(m.fat) })}</Txt>
                    ) : null}
                  </View>
                  <Txt v="time" size={16}>
                    {fmtNum(m.calories)}
                  </Txt>
                </Press>
              ))}
            </View>
          ))}
        </View>

        <FoodOffers />
      </ScrollView>

      <View style={[s.bar2, { paddingBottom: 12 + insets.bottom }]}>
        <MarkerButton label={t('nutrition.logMeal')} icon="plus" onPress={() => setLogOpen(true)} />
      </View>

      <LogMealSheet visible={logOpen} day={day} meId={meId} onClose={() => setLogOpen(false)} />
      <TargetsSheet visible={targetsOpen} goals={goals} meId={meId} onClose={() => setTargetsOpen(false)} />
    </SafeAreaView>
  );
}

// ─── Healthy-food partners: member offers ───────────────────────────────────
function FoodOffers() {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const partners = useFoodPartners(lang).data ?? [];
  if (!partners.length) return null;
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
      <SectionHeading title={t('nutrition.partners')} />
      <Txt v="meta" style={{ marginBottom: 4 }}>
        {t('nutrition.partnersSub')}
      </Txt>
      {partners.map((x: FoodPartner, i) => (
        <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i === partners.length - 1 ? 0 : 1, borderBottomColor: p.rule }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="row" size={15} numberOfLines={1}>
              {x.name}
            </Txt>
            <Txt v="body" color={p.inkSoft}>
              {x.offer}
            </Txt>
            {x.city ? <Txt v="caption">{x.city}</Txt> : null}
          </View>
          {x.code ? (
            <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: p.ruleStrong, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Txt v="time" size={14} selectable accessibilityLabel={t('nutrition.partnerCode', { code: x.code })} style={{ letterSpacing: 1.5 }}>
                {x.code}
              </Txt>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

// ─── A measuring line: chalk fill, the orange circle marks where you are ─────
function MeasureLine({ ratio, dot, height = 8 }: { ratio: number; dot?: boolean; height?: number }) {
  const { p } = useKit();
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const target = Math.max(0, Math.min(1, ratio)) * w;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = reduce ? target : withSpring(target, { damping: 16, stiffness: 140 });
  }, [target, reduce]);
  const fill = useAnimatedStyle(() => ({ width: x.value }));
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ height: dot ? 18 : height, justifyContent: 'center', marginTop: dot ? 8 : 6 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={{ height, borderRadius: height / 2, backgroundColor: p.rule }} />
      <Animated.View style={[{ position: 'absolute', start: 0, height, borderRadius: height / 2, backgroundColor: p.ink }, fill]}>
        {dot ? <View style={{ position: 'absolute', end: -9, top: height / 2 - 9, width: 18, height: 18, borderRadius: 9, backgroundColor: p.marker, borderWidth: 3, borderColor: p.board }} /> : null}
      </Animated.View>
    </View>
  );
}

function Macro({ label, value, goal }: { label: string; value: number; goal: number }) {
  const { p } = useKit();
  const { t } = useI18n();
  return (
    <View style={{ flex: 1 }}>
      <Txt v="caption">{label}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Txt v="time" size={17}>
          {fmtNum(value)}
        </Txt>
        <Txt v="caption" color={p.inkFaint}>
          / {t('nutrition.grams', { n: fmtNum(goal) })}
        </Txt>
      </View>
      <MeasureLine ratio={value / Math.max(1, goal)} height={3} />
    </View>
  );
}

// ─── Log a meal ─────────────────────────────────────────────────────────────
function LogMealSheet({ visible, day, meId, onClose }: { visible: boolean; day: string; meId: string | null; onClose: () => void }) {
  const s = useStyles();
  const { t } = useI18n();
  const [type, setType] = useState<MealType>(mealTypeForNow());
  const [title, setTitle] = useState('');
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setType(mealTypeForNow());
    setTitle('');
    setKcal('');
    setProt('');
    setCarb('');
    setFat('');
  }, [visible]);

  const parse = (v: string) => {
    const n = Number(v.replace(',', '.'));
    return v.trim() && isFinite(n) && n >= 0 ? Math.round(n) : undefined;
  };

  async function add(entry: { title: string; calories?: number; protein?: number; carbs?: number; fat?: number }) {
    if (!meId || busy) return;
    setBusy(true);
    try {
      await logMeal(meId, day, { type, ...entry });
      haptic('success');
      toast.show(t('nutrition.added', { food: entry.title, meal: t(`nutrition.meals.${type}`) }), 'yours');
      onClose();
    } catch {
      haptic('error');
      toast.show(t('common.somethingWrong'), 'error');
    } finally {
      setBusy(false);
    }
  }

  const quick = (f: QuickFood) => add({ title: t(`nutrition.foods.${f.id}`), calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat });
  const custom = () => title.trim() && add({ title: title.trim(), calories: parse(kcal), protein: parse(prot), carbs: parse(carb), fat: parse(fat) });

  return (
    <Sheet
      visible={visible}
      title={t('nutrition.logMeal')}
      onClose={onClose}
      footer={<MarkerButton label={t('nutrition.addTo', { meal: t(`nutrition.meals.${type}`) })} onPress={custom} loading={busy} disabled={!title.trim()} />}
    >
      <Segmented options={MEAL_TYPES.map((m) => ({ value: m, label: t(`nutrition.meals.${m}`) }))} value={type} onChange={setType} />

      <SectionHeading title={t('nutrition.quickAdd')} style={{ marginTop: 6 }} />
      <View style={s.foods}>
        {QUICK_FOODS.map((f) => (
          <Press key={f.id} onPress={() => quick(f)} feedback="light" depress={0.97} style={s.food} disabled={busy} accessibilityLabel={`${t(`nutrition.foods.${f.id}`)}, ${f.calories} ${t('nutrition.kcal')}`}>
            <Txt v="label" size={15} numberOfLines={1}>
              {t(`nutrition.foods.${f.id}`)}
            </Txt>
            <Txt v="caption">
              {f.calories} {t('nutrition.kcal')}
            </Txt>
          </Press>
        ))}
      </View>
      <Txt v="caption">{t('nutrition.quickNote')}</Txt>

      <SectionHeading title={t('nutrition.custom')} style={{ marginTop: 6 }} />
      <Field value={title} onChangeText={setTitle} placeholder={t('nutrition.whatDidYouEat')} maxLength={60} returnKeyType="done" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { label: t('nutrition.kcal'), val: kcal, set: setKcal },
          { label: t('nutrition.protein'), val: prot, set: setProt },
          { label: t('nutrition.carbs'), val: carb, set: setCarb },
          { label: t('nutrition.fat'), val: fat, set: setFat },
        ].map((x) => (
          <View key={x.label} style={{ flex: 1, gap: 6 }}>
            <Txt v="caption" numberOfLines={1} adjustsFontSizeToFit>
              {x.label}
            </Txt>
            <Field value={x.val} onChangeText={x.set} keyboardType="number-pad" placeholder="0" maxLength={4} style={{ textAlign: 'center', paddingHorizontal: 0 }} />
          </View>
        ))}
      </View>
    </Sheet>
  );
}

// ─── Daily targets ──────────────────────────────────────────────────────────
function TargetsSheet({ visible, goals, meId, onClose }: { visible: boolean; goals: NutritionGoals; meId: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const { p } = useKit();
  const [form, setForm] = useState<Record<keyof NutritionGoals, string>>(() => toForm(goals));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setForm(toForm(goals));
  }, [visible]);

  const parsed = useMemo(() => {
    const out: Partial<NutritionGoals> = {};
    (Object.keys(form) as (keyof NutritionGoals)[]).forEach((k) => {
      const n = Number(form[k].replace(',', '.'));
      if (form[k].trim() && isFinite(n) && n > 0) out[k] = k === 'water' ? Math.round(n * 2) / 2 : Math.round(n);
    });
    return out;
  }, [form]);
  const valid = Object.keys(parsed).length === 5;

  async function save(next: NutritionGoals) {
    if (!meId) return;
    setBusy(true);
    try {
      await saveNutritionGoals(meId, next);
      haptic('success');
      toast.show(t('nutrition.savedTargets'), 'info');
      onClose();
    } catch {
      toast.show(t('common.somethingWrong'), 'error');
    } finally {
      setBusy(false);
    }
  }

  const rows: { k: keyof NutritionGoals; label: string; unit: string; decimal?: boolean }[] = [
    { k: 'calories', label: t('nutrition.calories'), unit: t('nutrition.kcal') },
    { k: 'protein', label: t('nutrition.protein'), unit: t('nutrition.grams', { n: '' }).trim() },
    { k: 'carbs', label: t('nutrition.carbs'), unit: t('nutrition.grams', { n: '' }).trim() },
    { k: 'fat', label: t('nutrition.fat'), unit: t('nutrition.grams', { n: '' }).trim() },
    { k: 'water', label: t('nutrition.water'), unit: t('nutrition.litres', { n: '' }).trim(), decimal: true },
  ];

  return (
    <Sheet visible={visible} title={t('nutrition.targets')} onClose={onClose} action={{ label: busy ? t('common.saving') : t('common.save'), onPress: () => valid && save(parsed as NutritionGoals), disabled: !valid || busy }}>
      <Txt v="body" color={p.inkSoft}>
        {t('nutrition.targetsSub')}
      </Txt>
      {rows.map((r) => (
        <View key={r.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt v="label" size={16} style={{ flex: 1 }}>
            {r.label}
          </Txt>
          <Field
            value={form[r.k]}
            onChangeText={(v) => setForm((f) => ({ ...f, [r.k]: v }))}
            keyboardType={r.decimal ? 'decimal-pad' : 'number-pad'}
            maxLength={5}
            containerStyle={{ width: 120 }}
            style={{ textAlign: 'center' }}
            trailing={<Txt v="meta">{r.unit}</Txt>}
          />
        </View>
      ))}
      <TextButton label={t('nutrition.useDefaults')} onPress={() => setForm(toForm(DEFAULT_GOALS))} />
    </Sheet>
  );
}

function toForm(g: NutritionGoals): Record<keyof NutritionGoals, string> {
  return { calories: String(g.calories), protein: String(g.protein), carbs: String(g.carbs), fat: String(g.fat), water: String(g.water) };
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingStart: 4, paddingEnd: 8, paddingBottom: 6 },
  week: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 4, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: p.rule },
  dayCol: { flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  bar: { width: 8, height: 44, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4 },
  date: { minWidth: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6, gap: 12 },
  macros: { flexDirection: 'row', gap: 16, marginTop: 18 },
  water: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: p.rule },
  waterBtn: { borderWidth: 1.5, borderColor: p.ruleStrong, borderRadius: 10, width: 44, height: 44, marginStart: 6 },
  mealHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: p.ruleStrong },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.rule },
  bar2: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
  foods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  food: { width: '48.5%', minHeight: 60, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: p.rule, gap: 2, justifyContent: 'center' },
}));
