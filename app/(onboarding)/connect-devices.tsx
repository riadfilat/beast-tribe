import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { useAuth } from '../../src/providers/AuthProvider';
import { COLORS, FONTS } from '../../src/lib/constants';

interface DeviceItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
}

export default function ConnectDevicesScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();

  const [devices, setDevices] = useState<DeviceItem[]>([
    { id: 'apple_watch', name: 'Apple Watch', icon: 'W', color: '#1a1a1a', connected: false },
    { id: 'apple_health', name: 'Apple Health', icon: 'H', color: '#E24B4A', connected: false },
    { id: 'google_fit', name: 'Google Fit', icon: 'G', color: '#378ADD', connected: false },
    { id: 'strava', name: 'Strava', icon: 'S', color: '#FC4C02', connected: false },
  ]);

  function toggleDevice(id: string) {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, connected: !d.connected } : d))
    );
  }

  async function handleLaunch() {
    try {
      await completeOnboarding();
    } catch (e) {
      console.warn('completeOnboarding error:', e);
    }
    router.replace('/(tabs)/home');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StepIndicator currentStep={5} totalSteps={5} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Unleash your data</Text>
        <Text style={styles.subtitle}>Connect your wearables. We'll track your beast mode automatically.</Text>

        {devices.map((device) => (
          <TouchableOpacity
            key={device.id}
            style={styles.deviceRow}
            onPress={() => toggleDevice(device.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.deviceIcon, { backgroundColor: device.color }]}>
              <Text style={styles.deviceIconText}>{device.icon}</Text>
            </View>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={[styles.deviceStatus, device.connected ? styles.connected : styles.notConnected]}>
              {device.connected ? 'Connected' : 'Connect'}
            </Text>
          </TouchableOpacity>
        ))}

        {/* QR Code Box */}
        <View style={styles.qrBox}>
          <Text style={styles.qrTitle}>Have a QR code?</Text>
          <Text style={styles.qrSubtitle}>
            Scan from your Operation Beast purchase for 3 months free premium
          </Text>
        </View>

        <Button title="Launch Beast Tribe" onPress={handleLaunch} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    marginBottom: 8,
  },
  deviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconText: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  deviceName: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.white,
  },
  deviceStatus: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
  },
  connected: {
    color: COLORS.green,
  },
  notConnected: {
    color: COLORS.textTertiary,
  },
  qrBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(232,143,36,0.25)',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  qrTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
  qrSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
});
