import { Stack } from 'expo-router';
import { useKit } from '../../src/theme';

export default function AuthLayout() {
  const { p } = useKit();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: p.board } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
