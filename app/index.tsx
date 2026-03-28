import { Redirect } from 'expo-router';

export default function Index() {
  // The auth gate in _layout.tsx handles routing
  // This just prevents a blank screen on initial load
  return <Redirect href="/(auth)/welcome" />;
}
