import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, useGlobalSearchParams } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { ThemeProvider, useKit } from '../src/theme';
import { FONT_FILES } from '../src/theme/type';
import { bootLanguage } from '../src/i18n';
import { useOtaUpdates } from '../src/lib/useOtaUpdates';
import { ToastHost } from '../src/components/board/toast';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, profile, loading, isEmailConfirmed } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ edit?: string }>();
  const { p } = useKit();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const onVerifyScreen = segments[1] === 'verify-email';
    // Edit mode — the member opened onboarding from Profile to change details
    const isEditMode = globalParams.edit === '1';

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/welcome');
    } else if (!isEmailConfirmed) {
      if (!onVerifyScreen) router.replace('/(auth)/verify-email');
    } else if (!profile?.onboarding_completed) {
      if (!inOnboarding) router.replace('/(onboarding)/about-you');
    } else {
      if (inAuthGroup) router.replace('/(tabs)/home');
      if (inOnboarding && !isEditMode) router.replace('/(tabs)/home');
    }
  }, [session, profile, loading, isEmailConfirmed, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.board } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="session/[id]/index" />
      <Stack.Screen name="session/[id]/chat" />
      <Stack.Screen name="workout/[id]/index" />
      <Stack.Screen name="workout/[id]/play" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="host" options={{ presentation: 'modal' }} />
      <Stack.Screen name="inbox" />
      <Stack.Screen name="my-sessions" />
    </Stack>
  );
}

export default function RootLayout() {
  // Auto-download + apply OTA updates on launch and on every foreground.
  useOtaUpdates();

  const [fontsLoaded, fontError] = useFonts({
    ...FONT_FILES,
  });
  // Language decides layout direction; settle it before the first frame.
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    // A font that fails to load falls back to the system face; never block the app on it.
    if (fontError) console.warn('[fonts]', fontError);
  }, [fontError]);

  useEffect(() => {
    let alive = true;
    bootLanguage()
      .then((reloading) => {
        if (alive && !reloading) setLangReady(true);
      })
      .catch(() => alive && setLangReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const ready = (fontsLoaded || !!fontError) && langReady;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

function ThemedApp() {
  const { p, isRTL } = useKit();
  return (
    <AuthProvider>
      {/* On the web, `dir` also tells react-native-web to resolve start/end styles right-to-left. */}
      <View
        style={{ flex: 1, backgroundColor: p.board, direction: isRTL ? 'rtl' : 'ltr' }}
        {...(Platform.OS === 'web' ? ({ dir: isRTL ? 'rtl' : 'ltr' } as any) : null)}
      >
        <StatusBar barStyle={p.statusBar} />
        <AuthGate />
        <ToastHost />
      </View>
    </AuthProvider>
  );
}
