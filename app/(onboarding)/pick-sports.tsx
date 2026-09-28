import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/providers/AuthProvider';
import { useSaveSports } from '../../src/hooks';
import { useMySports } from '../../src/data/member';
import { invalidate } from '../../src/data/query';
import { SPORT_LIST } from '../../src/lib/sports';
import { Txt } from '../../src/components/board/Txt';
import { Icon } from '../../src/components/board/Icon';
import { Press } from '../../src/components/board/Press';
import { IconButton, MarkerButton } from '../../src/components/board/controls';
import { toast } from '../../src/components/board/toast';

export default function PickSportsScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const { completeOnboarding } = useAuth();
  const { saveSports } = useSaveSports();
  const current = useMySports().data;
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (current && current.length && !picked.length) setPicked(current);
  }, [current]);

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function done() {
    setBusy(true);
    try {
      await saveSports(picked);
      invalidate('member:sports');
      if (editing) {
        router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
        return;
      }
      await completeOnboarding();
      router.replace('/(tabs)/home');
    } catch {
      toast.show(t('onboarding.saveError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.topRow}>
        <IconButton name="back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
        <Txt v="label" color={p.inkSoft}>
          {editing ? t('you.mySports') : t('onboarding.step', { n: 2, total: 2 })}
        </Txt>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Txt v="title" size={30} accessibilityRole="header">
          {t('onboarding.sportsTitle')}
        </Txt>
        <Txt v="body" color={p.inkSoft} style={{ marginTop: 6, marginBottom: 20 }}>
          {t('onboarding.sportsSub')}
        </Txt>
        <View style={s.grid}>
          {SPORT_LIST.map((sp) => {
            const on = picked.includes(sp.id);
            return (
              <Press
                key={sp.id}
                onPress={() => toggle(sp.id)}
                feedback="selection"
                depress={0.96}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={[s.tile, on ? { backgroundColor: p.ink, borderColor: p.ink } : null]}
              >
                <Icon sport={sp.id} size={24} color={on ? p.board : p.ink} />
                <Txt v="label" size={15} color={on ? p.board : p.ink} style={{ flex: 1 }} numberOfLines={1}>
                  {t(`sports.${sp.id}`)}
                </Txt>
                {on ? <Icon name="check" size={14} color={p.board} weight="bold" /> : null}
              </Press>
            );
          })}
        </View>
      </ScrollView>
      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <MarkerButton label={editing ? t('common.save') : t('onboarding.enter')} onPress={done} loading={busy} disabled={!picked.length} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: p.rule },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
