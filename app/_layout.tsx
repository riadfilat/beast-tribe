import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter, useSegments, useGlobalSearchParams } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { ThemeProvider, useKit } from '../src/theme';
import { FONT_FILES } from '../src/theme/type';
import { bootLanguage } from '../src/i18n';
import { useOtaUpdates } from '../src/lib/useOtaUpdates';
import { ToastHost } from '../src/components/board/toast';
import { isKeepableLink, savePendingLink, takePendingLink } from '../src/lib/pendingLink';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, profile, loading, isEmailConfirmed } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ edit?: string; g?: string }>();
  const pathname = usePathname();
  const entering = useRef(false);
  const { p } = useKit();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const onVerifyScreen = segments[1] === 'verify-email';
    // Edit mode — the member opened onboarding from Profile to change details
    const isEditMode = globalParams.edit === '1';

    // A session or court link opened before signing up is kept and opened once they're in.
    const keep = () => {
      if (isKeepableLink(pathname)) savePendingLink(globalParams.g ? `${pathname}?g=${encodeURIComponent(String(globalParams.g))}` : pathname);
    };
    const enter = () => {
      if (entering.current) return;
      entering.current = true;
      takePendingLink()
        .then((link) => router.replace((link ?? '/(tabs)/home') as any))
        .finally(() => setTimeout(() => (entering.current = false), 800));
    };

    if (!session) {
      if (!inAuthGroup) {
        keep();
        router.replace('/(auth)/welcome');
      }
    } else if (!isEmailConfirmed) {
      if (!onVerifyScreen) {
        keep();
        router.replace('/(auth)/verify-email');
      }
    } else if (!profile?.onboarding_completed) {
      if (!inOnboarding) {
        keep();
        router.replace('/(onboarding)/about-you');
      }
    } else {
      if (inAuthGroup || (inOnboarding && !isEditMode)) enter();
    }
  }, [session, profile, loading, isEmailConfirmed, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.board } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="session/[id]/index" />
      <Stack.Screen name="session/[id]/chat" />
      <Stack.Screen name="session/[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="workout/[id]/index" />
      <Stack.Screen name="workout/[id]/play" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="host" options={{ presentation: 'modal' }} />
      <Stack.Screen name="inbox" />
      <Stack.Screen name="my-sessions" />
      <Stack.Screen name="moves" />
      <Stack.Screen name="programs" />
      <Stack.Screen name="program/[slug]" />
      <Stack.Screen name="partners" />
      <Stack.Screen name="courts" />
      <Stack.Screen name="court/[id]" />
      <Stack.Screen name="assistant" />
      <Stack.Screen name="community-request" options={{ presentation: 'modal' }} />
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
