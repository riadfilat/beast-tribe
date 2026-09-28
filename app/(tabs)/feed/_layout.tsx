import { Stack } from 'expo-router';
import { useKit } from '../../../src/theme';

export default function TribeLayout() {
  const { p } = useKit();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.board } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pack" />
      <Stack.Screen name="pack-create" />
      <Stack.Screen name="pack-invite" />
      <Stack.Screen name="pack-chat" />
    </Stack>
  );
}
