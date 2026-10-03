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

// Every plan, one row each: what it's for, how long, how often.
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
        {list.map((pr, i) => (
          <Press
            key={pr.id}
            onPress={() => router.push({ pathname: '/program/[slug]', params: { slug: pr.slug } })}
            feedback="selection"
            depress={0.99}
            accessibilityRole="button"
            style={[s.row, i === list.length - 1 ? { borderBottomWidth: 0 } : null]}
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
              <Txt v="meta" color={p.inkFaint}>
                {t('plan.planMeta', { weeks: pr.weeks, days: pr.daysPerWeek, min: pr.minutes ?? 30 })}
              </Txt>
            </View>
            <Icon name="chevron" size={13} color={p.inkFaint} weight="bold" />
          </Press>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: p.rule },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center' },
}));
