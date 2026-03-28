import { Stack } from 'expo-router';
import { COLORS } from '../../../src/lib/constants';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pack" />
      <Stack.Screen name="pack-create" />
      <Stack.Screen name="pack-invite" />
    </Stack>
  );
}
