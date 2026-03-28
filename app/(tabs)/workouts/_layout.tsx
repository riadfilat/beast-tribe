import { Stack } from 'expo-router';
import { COLORS } from '../../../src/lib/constants';

export default function WorkoutsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="session" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
    </Stack>
  );
}
