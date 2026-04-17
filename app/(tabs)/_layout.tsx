import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../src/lib/constants';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconName;
  nameFocused: IoniconName;
  focused: boolean;
  size?: number;
}

function TabIcon({ name, nameFocused, focused, size = 22 }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? nameFocused : name}
        size={size}
        color={focused ? COLORS.orange : COLORS.aqua}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.orange,
        tabBarInactiveTintColor: COLORS.aqua,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'HOME',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" nameFocused="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'TRIBE',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="people-outline" nameFocused="people" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'EVENTS',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar-outline" nameFocused="calendar" focused={focused} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'MISSION',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="ribbon-outline" nameFocused="ribbon" focused={focused} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" nameFocused="person" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBarBg,
    borderTopColor: COLORS.tabBarBorder,
    borderTopWidth: 1,
    height: 72,
    paddingTop: 6,
    paddingBottom: 10,
  },
  tabLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  iconWrap: {
    width: 40,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(232,143,36,0.14)',
  },
});
