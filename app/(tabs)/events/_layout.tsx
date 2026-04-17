import { Stack } from 'expo-router';
import { COLORS } from '../../../src/lib/constants';

export default function EventsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
