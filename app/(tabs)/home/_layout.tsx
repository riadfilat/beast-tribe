import { Stack } from 'expo-router';
import { useKit } from '../../../src/theme';

export default function HomeLayout() {
  const { p } = useKit();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.board } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="nutrition" />
    </Stack>
  );
}
