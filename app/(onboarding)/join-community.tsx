import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/providers/AuthProvider';
import { useMyCommunities, useOpenCommunities } from '../../src/data/communities';
import { Txt } from '../../src/components/board/Txt';
import { IconButton, MarkerButton, SectionHeading } from '../../src/components/board/controls';
import { CommunityRow, JoinCommunityForm } from '../../src/components/board/communities';
import { toast } from '../../src/components/board/toast';

// Onboarding step 3: get into your community. A company, compound or club code opens its
// private community; open communities are one tap. Everyone is already in the open Beast Tribe.
export default function JoinCommunityScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const mine = useMyCommunities();
  const open = useOpenCommunities();
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    mine.refetch();
    open.refetch();
  };

  async function enter() {
    setBusy(true);
    try {
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
        <IconButton name="back" label={t('common.back')} onPress={() => router.back()} />
        <Txt v="label" color={p.inkSoft}>
          {t('onboarding.step', { n: 3, total: 3 })}
        </Txt>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Txt v="title" size={30} accessibilityRole="header">
          {t('onboarding.communityTitle')}
        </Txt>
        <Txt v="body" color={p.inkSoft} style={{ marginTop: 6, marginBottom: 22 }}>
          {t('onboarding.communitySub')}
        </Txt>

        <JoinCommunityForm onJoined={refresh} />

        {(mine.data ?? []).length ? (
          <View style={{ marginTop: 22 }}>
            <SectionHeading title={t('community.mine')} />
            {(mine.data ?? []).map((c, i, arr) => (
              <CommunityRow key={c.id} c={c} last={i === arr.length - 1} />
            ))}
          </View>
        ) : null}

        {(open.data ?? []).length ? (
          <View style={{ marginTop: 22 }}>
            <SectionHeading title={t('onboarding.communityOpen')} />
            {(open.data ?? []).map((c, i, arr) => (
              <CommunityRow key={c.id} c={c} onJoined={refresh} last={i === arr.length - 1} />
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <MarkerButton label={t('onboarding.enter')} onPress={enter} loading={busy} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
