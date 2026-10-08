import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/providers/AuthProvider';
import { useMyCommunities, useOpenCommunities } from '../../src/data/communities';
import { useHereCity } from '../../src/data/me';
import { cityLabel } from '../../src/lib/cities';
import { refreshPosition } from '../../src/lib/location';
import { Txt } from '../../src/components/board/Txt';
import { IconButton, MarkerButton, SectionHeading, TextButton } from '../../src/components/board/controls';
import { CommunityRow, JoinCommunityForm } from '../../src/components/board/communities';
import { toast } from '../../src/components/board/toast';

// Onboarding step 3: where you belong. Everyone is already in Beast Tribe; open communities and
// verified clubs in the city you're in are one tap; a private community (company, gym, club) needs
// its code, folded away at the end.
export default function JoinCommunityScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, setLanguage } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const mine = useMyCommunities();
  const open = useOpenCommunities();
  const [busy, setBusy] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const city = useHereCity();

  useEffect(() => {
    refreshPosition(false);
  }, []);

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
        <TextButton label={t('auth.langSwitch')} onPress={() => setLanguage(lang === 'ar' ? 'en' : 'ar')} />
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Txt v="title" size={30} accessibilityRole="header">
          {t('onboarding.communityTitle')}
        </Txt>
        <Txt v="body" color={p.inkSoft} style={{ marginTop: 6, marginBottom: 22 }}>
          {t('onboarding.communitySub')}
        </Txt>

        {/* 1. Where they already are: Beast Tribe (everyone), plus any community they've joined. */}
        {(mine.data ?? []).length ? (
          <View>
            <SectionHeading title={t('onboarding.communityIn')} />
            {(mine.data ?? []).map((c, i, arr) => (
              <CommunityRow key={c.id} c={c} last={i === arr.length - 1} />
            ))}
          </View>
        ) : null}

        {/* 2. Open communities and verified clubs in the city they're in: one tap. */}
        <View style={{ marginTop: 22 }}>
          <SectionHeading title={city ? t('onboarding.communityNear', { city: cityLabel(city, lang) }) : t('onboarding.communityNearAny')} />
          {(open.data ?? []).length ? (
            (open.data ?? []).map((c, i, arr) => <CommunityRow key={c.id} c={c} onJoined={refresh} last={i === arr.length - 1} />)
          ) : open.loading ? null : (
            <Txt v="meta" style={{ marginTop: 4 }}>
              {city ? t('onboarding.communityNearNone', { city: cityLabel(city, lang) }) : t('onboarding.communityNearNoneAny')}
            </Txt>
          )}
        </View>

        {/* 3. A private community (company, gym, club) needs its code. */}
        <View style={{ marginTop: 26 }}>
          {codeOpen ? (
            <>
              <SectionHeading title={t('onboarding.communityCode')} />
              <Txt v="meta" style={{ marginBottom: 10 }}>
                {t('onboarding.communityCodeSub')}
              </Txt>
              <JoinCommunityForm onJoined={refresh} />
            </>
          ) : (
            <TextButton label={t('onboarding.communityCode')} onPress={() => setCodeOpen(true)} color={p.aqua} />
          )}
        </View>
      </ScrollView>
      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <MarkerButton label={t('onboarding.enter')} onPress={enter} loading={busy} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingEnd: 16 },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
