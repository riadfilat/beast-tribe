import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button, Input } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { useSaveBaseline } from '../../src/hooks';
import { COLORS, FONTS } from '../../src/lib/constants';

export default function BaselineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sports?: string }>();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [fiveKTime, setFiveKTime] = useState('');
  const [maxBench, setMaxBench] = useState('');
  const [dailySteps, setDailySteps] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { saveBaseline, loading: saving } = useSaveBaseline();

  async function handlePhotoPick() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload a progress photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleContinue() {
    // Parse 5K time string (e.g. "28:40") to seconds
    let fiveKSeconds: number | undefined;
    if (fiveKTime) {
      const parts = fiveKTime.split(':');
      if (parts.length === 2) {
        fiveKSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
    }

    try {
      await saveBaseline({
        weight_kg: weight ? parseFloat(weight) : undefined,
        height_cm: height ? parseFloat(height) : undefined,
        five_k_time_seconds: fiveKSeconds,
        max_bench_kg: maxBench ? parseFloat(maxBench) : undefined,
        daily_steps_avg: dailySteps ? parseInt(dailySteps.replace(/,/g, '')) : undefined,
      });
    } catch (e) {
      console.warn('Failed to save baseline:', e);
    }
    router.push({ pathname: '/(onboarding)/set-goals', params: { sports: params.sports || '' } });
  }

  return (
    <SafeAreaView style={styles.container}>
      <StepIndicator currentStep={2} totalSteps={5} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your starting line</Text>
        <Text style={styles.subtitle}>Every beast had a first step. This is yours.</Text>

        <Input label="Weight" placeholder="82 kg" value={weight} onChangeText={setWeight} keyboardType="numeric" />
        <Input label="Height" placeholder="178 cm" value={height} onChangeText={setHeight} keyboardType="numeric" />
        <Input label="5K time" placeholder="28:40" value={fiveKTime} onChangeText={setFiveKTime} />
        <Input label="Max bench" placeholder="70 kg" value={maxBench} onChangeText={setMaxBench} keyboardType="numeric" />
        <Input label="Daily steps" placeholder="4,200 avg" value={dailySteps} onChangeText={setDailySteps} keyboardType="numeric" />

        <TouchableOpacity style={styles.photoUpload} activeOpacity={0.7} onPress={handlePhotoPick}>
          {photoUri ? (
            <Text style={styles.photoAdded}>Photo added ✓</Text>
          ) : (
            <>
              <Text style={styles.photoPlus}>+</Text>
              <Text style={styles.photoText}>Add progress photo</Text>
            </>
          )}
        </TouchableOpacity>

        <Button title={saving ? "Saving..." : "Continue"} onPress={handleContinue} disabled={saving} />
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
  photoUpload: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  photoPlus: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  photoText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontFamily: FONTS.body,
    marginTop: 4,
  },
  photoAdded: {
    fontSize: 13,
    color: COLORS.green,
    fontFamily: FONTS.bodyMedium,
  },
});
