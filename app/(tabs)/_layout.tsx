import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../src/components/board/Icon';
import { useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { useInboxLive } from '../../src/data/inbox';

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Icon name={name} size={22} color={color} weight="semibold" />;
}

export default function TabLayout() {
  const { p, f } = useKit();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  // Same 54pt for icon + label on every device; only the padding below changes.
  const bottom = insets.bottom > 0 ? insets.bottom - 2 : 8;
  useInboxLive();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.ink,
        tabBarInactiveTintColor: p.inkFaint,
        tabBarStyle: {
          backgroundColor: p.boardDeep,
          borderTopColor: p.rule,
          borderTopWidth: 1,
          height: 6 + 54 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
        },
        tabBarLabelStyle: { ...f.uiSemibold, fontSize: 11 },
        sceneStyle: { backgroundColor: p.board },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('tabs.board'), tabBarIcon: ({ color }) => <TabIcon name="board" color={color} /> }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: t('tabs.explore'), tabBarIcon: ({ color }) => <TabIcon name="explore" color={color} /> }}
      />
      <Tabs.Screen
        name="feed"
        options={{ title: t('tabs.tribe'), tabBarIcon: ({ color }) => <TabIcon name="tribe" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.you'), tabBarIcon: ({ color }) => <TabIcon name="you" color={color} /> }}
      />
    </Tabs>
  );
}
