import { Stack } from 'expo-router';
import { COLORS } from '../../../src/lib/constants';

export default function FeedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="events" />
      <Stack.Screen name="leaderboard" />
    </Stack>
  );
}
