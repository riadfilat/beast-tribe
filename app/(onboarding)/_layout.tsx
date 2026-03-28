import { Stack } from 'expo-router';
import { COLORS } from '../../src/lib/constants';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="pick-sports" />
      <Stack.Screen name="baseline" />
      <Stack.Screen name="set-goals" />
      <Stack.Screen name="beast-level" />
      <Stack.Screen name="connect-devices" />
    </Stack>
  );
}
