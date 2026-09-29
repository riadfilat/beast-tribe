import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { Txt } from '../../src/components/board/Txt';
import { Press } from '../../src/components/board/Press';
import { MarkerButton, TextButton } from '../../src/components/board/controls';
import { Lockup } from '../../src/components/brand/Logo';

// Stand-in photo until the Operation Beast shoot is ready: "A group of people running down a
// street" by Mina Rad (Tehran), free under the Unsplash License. Loaded from Unsplash's CDN;
// the teal board shows through if it can't load.
const HERO = 'https://images.unsplash.com/photo-1727849027217-fa9acf71553d?w=1200&h=2100&fit=crop&crop=entropy&q=72&fm=jpg';

// The welcome is always the dark board: a photo hero under the brand's teal overlay
// (Guideline: teal overlays at 60–80%), whatever appearance the member picks later.
const CHALK = '#F4F1EA';
const CHALK_SOFT = 'rgba(244,241,234,0.86)';

export default function WelcomeScreen() {
  const { lang } = useKit();
  const { t, setLanguage } = useI18n();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);

  // One authored moment: the photo settles in from a slight zoom as it arrives.
  const shown = useSharedValue(0);
  const photo = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ scale: 1.08 - 0.08 * shown.value }],
  }));
  const onLoad = () => {
    shown.value = reduce ? 1 : withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) });
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />
      {!failed ? (
        <Animated.Image
          source={{ uri: HERO }}
          onLoad={onLoad}
          onError={() => setFailed(true)}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, photo]}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <LinearGradient
        colors={['rgba(2,60,60,0.62)', 'rgba(2,60,60,0.30)', 'rgba(2,60,60,0.78)', '#023C3C']}
        locations={[0, 0.28, 0.62, 0.9]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={s.safe}>
        <View style={s.top}>
          <View style={{ gap: 7 }}>
            <Lockup height={24} ink={CHALK} />
            <Txt v="label" size={11} color={CHALK_SOFT} style={s.endorse}>
              {t('auth.byOB')}
            </Txt>
          </View>
          <TextButton label={t('auth.langSwitch')} onPress={() => setLanguage(lang === 'ar' ? 'en' : 'ar')} color={CHALK} />
        </View>

        <View style={{ flex: 1 }} />

        <View style={s.bottom}>
          <Txt v="hero" size={60} color={CHALK} accessibilityRole="header">
            {lang === 'ar' ? t('auth.tagline') : t('auth.tagline').toUpperCase()}
          </Txt>
          <Txt v="body" size={17} color={CHALK_SOFT} style={{ marginTop: 12, maxWidth: 340 }}>
            {t('auth.welcomeBody')}
          </Txt>
          <View style={{ gap: 12, marginTop: 28 }}>
            <MarkerButton label={t('auth.createAccount')} onPress={() => router.push({ pathname: '/(auth)/sign-in', params: { mode: 'signup' } })} />
            <Press onPress={() => router.push('/(auth)/sign-in')} feedback="light" accessibilityRole="button" accessibilityLabel={t('auth.signIn')} style={s.ghost}>
              <Txt v="button" size={15} color={CHALK}>
                {t('auth.signIn')}
              </Txt>
            </Press>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#023C3C' },
  safe: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingStart: 22, paddingEnd: 10, paddingTop: 10 },
  endorse: { letterSpacing: 1.6, textTransform: 'uppercase' },
  bottom: { paddingHorizontal: 22, paddingBottom: 18 },
  ghost: { height: 54, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(244,241,234,0.55)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,60,60,0.25)' },
});
