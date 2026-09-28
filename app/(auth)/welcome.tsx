import React from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { Txt } from '../../src/components/board/Txt';
import { MarkerButton, OutlineButton, TextButton } from '../../src/components/board/controls';

const WOLF = require('../../assets/images/animals/Wolf/1.png');
const MARK = require('../../assets/images/mark-sun.png');

export default function WelcomeScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, setLanguage } = useI18n();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const art = Math.min(width * 0.82, height * 0.4, 360);

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.top}>
        <Image source={MARK} style={{ width: 30, height: 30 }} accessibilityLabel="Operation Beast" />
        <TextButton label={t('auth.langSwitch')} onPress={() => setLanguage(lang === 'ar' ? 'en' : 'ar')} color={p.ink} />
      </View>

      <View style={s.stage}>
        <View style={[s.spot, { width: art, height: art, borderRadius: art / 2 }]}>
          <Image source={WOLF} style={{ width: art * 0.96, height: art * 0.96 }} resizeMode="contain" accessibilityIgnoresInvertColors />
        </View>
      </View>

      <View style={s.bottom}>
        <Txt v="hero" size={58} accessibilityRole="header">
          {lang === 'ar' ? t('auth.tagline') : t('auth.tagline').toUpperCase()}
        </Txt>
        <Txt v="body" size={17} color={p.inkSoft} style={{ marginTop: 10 }}>
          {t('auth.welcomeBody')}
        </Txt>
        <View style={{ gap: 10, marginTop: 26 }}>
          <MarkerButton label={t('auth.createAccount')} onPress={() => router.push({ pathname: '/(auth)/sign-in', params: { mode: 'signup' } })} />
          <OutlineButton label={t('auth.signIn')} onPress={() => router.push('/(auth)/sign-in')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spot: { backgroundColor: '#023C3C', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: p.isDark ? p.ruleStrong : 'transparent', overflow: 'hidden' },
  bottom: { paddingHorizontal: 24, paddingBottom: 18 },
}));
