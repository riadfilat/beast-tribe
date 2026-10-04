import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { usePrograms } from '../src/data/programs';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { IconButton } from '../src/components/board/controls';
import { LEVELS, LEVEL_KEY, LevelBars, LevelTag } from '../src/components/board/level';

// Every plan, grouped by level (beginner, intermediate, advanced): what it's for, how long, how often.
export default function ProgramsScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const list = usePrograms(lang).data ?? [];
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.topRow}>
        <IconButton name="back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/train'))} />
        <Txt v="headline" accessibilityRole="header">
          {t('plan.plans')}
        </Txt>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {LEVELS.map((l) => {
          const group = list.filter((pr) => pr.level === l);
          if (!group.length) return null;
          return (
            <View key={l} style={{ marginTop: 10 }}>
              <View style={s.groupHead}>
                <LevelBars level={l} color={l === 'easy' ? p.aqua : p.ink} size={13} />
                <Txt v="label" size={13} color={p.inkSoft} style={lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.8 } : null}>
                  {t(`plan.levelGroup.${LEVEL_KEY[l]}`)}
                </Txt>
              </View>
              {group.map((pr, i) => renderRow(pr, i === group.length - 1))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );

  function renderRow(pr: (typeof list)[number], last: boolean) {
    return (
          <Press
            key={pr.id}
            onPress={() => router.push({ pathname: '/program/[slug]', params: { slug: pr.slug } })}
            feedback="selection"
            depress={0.99}
            accessibilityRole="button"
            style={[s.row, last ? { borderBottomWidth: 0 } : null]}
          >
            <View style={s.icon}>
              <Icon sport={pr.sport} size={20} color={p.board} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Txt v="row" size={15}>
                {pr.title}
              </Txt>
              <Txt v="meta" numberOfLines={1}>
                {t(`plan.goals.${pr.goal}`)}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                <LevelTag level={pr.level} />
                <Txt v="meta" color={p.inkFaint}>
                  {t('plan.planMeta', { weeks: pr.weeks, days: pr.daysPerWeek, min: pr.minutes ?? 30 })}
                </Txt>
              </View>
            </View>
            <Icon name="chevron" size={13} color={p.inkFaint} weight="bold" />
          </Press>
    );
  }
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: p.rule },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 6 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center' },
}));
