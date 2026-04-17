import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, useGlobalSearchParams } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { ThemeProvider, useTheme } from '../src/providers/ThemeProvider';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, profile, loading, isEmailConfirmed } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ edit?: string }>();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const onVerifyScreen = segments[1] === 'verify-email';

    // Allow edit mode — user navigated to onboarding from Profile to edit settings
    const isEditMode = globalParams.edit === '1';

    if (!session) {
      // Not signed in → auth screens
      if (!inAuthGroup) router.replace('/(auth)/welcome');
    } else if (!isEmailConfirmed) {
      // Signed up but hasn't clicked confirmation link yet
      if (!onVerifyScreen) router.replace('/(auth)/verify-email');
    } else if (!profile?.onboarding_completed) {
      if (!inOnboarding) router.replace('/(onboarding)/about-you');
    } else {
      if (inAuthGroup) router.replace('/(tabs)/home');
      if (inOnboarding && !isEditMode) router.replace('/(tabs)/home');
    }
  }, [session, profile, loading, isEmailConfirmed, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Montserrat-Light': require('../assets/fonts/Montserrat-Light.otf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.otf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.otf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-ExtraBold': require('../assets/fonts/Montserrat-ExtraBold.ttf'),
    'Poppins-ExtraLight': require('../assets/fonts/Poppins-ExtraLight.otf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.otf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.otf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.otf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.otf'),
    SlamDunk: require('../assets/fonts/SlamDunk.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

function ThemedApp() {
  const { isDark } = useTheme();
  // Key forces full re-render when theme changes so all COLORS refs update
  return (
    <AuthProvider key={isDark ? 'dark' : 'light'}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AuthGate />
    </AuthProvider>
  );
}
