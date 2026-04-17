import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, SportChip } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { useSaveSports, useSaveTrainingFrequency, useUserSports } from '../../src/hooks';
import { useAuth } from '../../src/providers/AuthProvider';
import { COLORS, FONTS, SPORTS } from '../../src/lib/constants';

const FREQUENCY_OPTIONS = [2, 3, 4, 5, 6, 7];

export default function PickSportsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = params.edit === '1';

  const [selected, setSelected] = useState<string[]>([]);
  const [frequency, setFrequency] = useState(4);
  const { saveSports, loading: savingSports } = useSaveSports();
  const { saveFrequency, loading: savingFreq } = useSaveTrainingFrequency();
  const { profile } = useAuth();

  // In edit mode, pre-load current sports and frequency
  const { data: userSportsData } = useUserSports();

  useEffect(() => {
    if (isEditMode && userSportsData && userSportsData.length > 0) {
      const currentSportNames = userSportsData.map((us: any) => us.sport?.name).filter(Boolean);
      const matchedIds = SPORTS.filter(s => currentSportNames.includes(s.name)).map(s => s.id);
      if (matchedIds.length > 0) setSelected(matchedIds);
    }
  }, [isEditMode, userSportsData]);

  useEffect(() => {
    if (isEditMode && profile?.training_frequency) {
      setFrequency(profile.training_frequency);
    }
  }, [isEditMode, profile]);

  const saving = savingSports || savingFreq;

  async function handleContinue() {
    try {
      await Promise.all([
        saveSports(selected),
        saveFrequency(frequency),
      ]);
    } catch (e) {
      console.warn('Failed to save:', e);
    }

    if (isEditMode) {
      router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
    } else {
      router.push({ pathname: '/(onboarding)/set-habits', params: { sports: selected.join(','), frequency: String(frequency) } });
    }
  }

  function toggleSport(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isEditMode ? (
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.editHeaderTitle}>Edit Disciplines</Text>
          <View style={{ width: 22 }} />
        </View>
      ) : (
        <StepIndicator currentStep={2} totalSteps={4} />
      )}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{isEditMode ? 'Your disciplines' : 'Pick your disciplines'}</Text>
        <Text style={styles.subtitle}>Select 1 or more sports you train in.</Text>

        <View style={styles.grid}>
          {SPORTS.map((sport) => (
            <SportChip
              key={sport.id}
              icon={sport.icon}
              emoji={sport.emoji}
              name={sport.name}
              selected={selected.includes(sport.id)}
              onPress={() => toggleSport(sport.id)}
            />
          ))}
        </View>

        {/* Training frequency */}
        <Text style={styles.frequencyTitle}>How many days per week?</Text>
        <Text style={styles.frequencySubtitle}>Set your weekly training target</Text>

        <View style={styles.frequencyRow}>
          {FREQUENCY_OPTIONS.map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.frequencyPill, frequency === num && styles.frequencyPillActive]}
              onPress={() => setFrequency(num)}
              activeOpacity={0.7}
            >
              <Text style={[styles.frequencyText, frequency === num && styles.frequencyTextActive]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={saving ? "Saving..." : isEditMode ? "Save Changes" : "Continue"}
          onPress={handleContinue}
          disabled={selected.length === 0 || saving}
        />

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editHeaderTitle: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: COLORS.white,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  frequencyTitle: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 4,
  },
  frequencySubtitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  frequencyPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  frequencyPillActive: {
    backgroundColor: 'rgba(232,143,36,0.15)',
    borderColor: COLORS.orange,
  },
  frequencyText: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.textTertiary,
  },
  frequencyTextActive: {
    color: COLORS.orange,
  },
});
