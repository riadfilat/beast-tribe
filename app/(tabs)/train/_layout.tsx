import { Stack } from 'expo-router';
import { useKit } from '../../../src/theme';

export default function TrainLayout() {
  const { p } = useKit();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.board } }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
