import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BeastIcon } from '../ui';
import { COLORS, FONTS } from '../../lib/constants';

interface TabHeaderProps {
  title?: string;
  showNotifications?: boolean;
  onNotificationPress?: () => void;
}

export function TabHeader({ title, showNotifications = true, onNotificationPress }: TabHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <BeastIcon size={28} color={COLORS.orange} />
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
      {showNotifications && (
        <TouchableOpacity
          style={styles.notificationBtn}
          activeOpacity={0.7}
          onPress={onNotificationPress}
        >
          <Ionicons name="notifications" size={20} color={COLORS.orange} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  notificationBtn: {
    padding: 8,
  },
});
