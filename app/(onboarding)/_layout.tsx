import { Stack } from 'expo-router';
import { useKit } from '../../src/theme';

export default function OnboardingLayout() {
  const { p } = useKit();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: p.board } }}>
      <Stack.Screen name="about-you" />
      <Stack.Screen name="pick-sports" />
    </Stack>
  );
}
