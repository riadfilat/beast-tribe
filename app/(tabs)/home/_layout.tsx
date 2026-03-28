import { Stack } from 'expo-router';
import { COLORS } from '../../../src/lib/constants';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="nutrition" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
