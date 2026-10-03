import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { CATEGORIES, Exercise, ExerciseCategory, groupOf, MUSCLE_GROUPS, MuscleGroup, useExercises } from '../src/data/exercises';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { Chip, Field, IconButton } from '../src/components/board/controls';
import { ExerciseSheet } from '../src/components/board/exercise';

// The exercise library: every move members meet in a workout, searchable by name,
// filterable by what it is (strength, core…) and what it trains (chest, glutes…).
export default function MovesScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const lib = useExercises(lang).data;
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<ExerciseCategory | 'all'>('all');
  const [group, setGroup] = useState<MuscleGroup | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const all = useMemo(() => Array.from(lib?.values() ?? []).sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category)), [lib]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((e) => {
      if (cat !== 'all' && e.category !== cat) return false;
      if (group !== 'all' && !e.primary.some((m) => groupOf(m) === group)) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.slug.replace(/_/g, ' ').includes(q)) return false;
      return true;
    });
  }, [all, query, cat, group]);

  const muscleLine = (e: Exercise) => e.primary.map((m) => t(`ex.muscle.${m}`)).join(' · ');

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.topRow}>
        <IconButton name="back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/train'))} />
        <Txt v="headline" accessibilityRole="header">
          {t('ex.library')}
        </Txt>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 8 }}>
        <Field value={query} onChangeText={setQuery} placeholder={t('ex.search')} autoCorrect={false} returnKeyType="search" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label={t('ex.all')} selected={cat === 'all'} onPress={() => setCat('all')} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={t(`ex.category.${c}`)} selected={cat === c} onPress={() => setCat(cat === c ? 'all' : c)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {MUSCLE_GROUPS.map((g) => (
            <Chip key={g} label={t(`ex.group.${g}`)} selected={group === g} onPress={() => setGroup(group === g ? 'all' : g)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {lib && !list.length ? (
          <Txt v="body" color={p.inkSoft} align="center" style={{ marginTop: 40 }}>
            {t('ex.none')}
          </Txt>
        ) : null}
        {list.map((e, i) => (
          <Press
            key={e.slug}
            onPress={() => setOpen(e.slug)}
            feedback="selection"
            depress={0.99}
            accessibilityRole="button"
            accessibilityLabel={`${e.name}, ${muscleLine(e)}`}
            style={[s.row, i === list.length - 1 ? { borderBottomWidth: 0 } : null]}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Txt v="row" size={15} numberOfLines={1}>
                {e.name}
              </Txt>
              <Txt v="meta" numberOfLines={1}>
                {[muscleLine(e), t(`train.level.${e.level}`)].join(' · ')}
              </Txt>
            </View>
            <Txt v="label" size={11} color={p.inkFaint} style={lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.6 } : null}>
              {t(`ex.category.${e.category}`)}
            </Txt>
            <Icon name="chevron" size={13} color={p.inkFaint} weight="bold" />
          </Press>
        ))}
      </ScrollView>

      <ExerciseSheet slug={open} onClose={() => setOpen(null)} />
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: p.rule },
}));
