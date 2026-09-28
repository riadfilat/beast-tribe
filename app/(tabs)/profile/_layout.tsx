import { Stack } from 'expo-router';
import { useKit } from '../../../src/theme';

export default function YouLayout() {
  const { p } = useKit();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.board } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="coach-dashboard" />
      <Stack.Screen name="trainee-detail" />
    </Stack>
  );
}
