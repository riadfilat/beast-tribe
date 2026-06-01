import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, SportChip } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { useSaveSports, useUserSports } from '../../src/hooks';
import { useAuth } from '../../src/providers/AuthProvider';
import { COLORS, FONTS, SPORTS } from '../../src/lib/constants';

export default function PickSportsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = params.edit === '1';

  const [selected, setSelected] = useState<string[]>([]);
  const [finishing, setFinishing] = useState(false);
  const { saveSports, loading: savingSports } = useSaveSports();
  const { completeOnboarding } = useAuth();

  // In edit mode, pre-load current sports
  const { data: userSportsData } = useUserSports();

  useEffect(() => {
    if (isEditMode && userSportsData && userSportsData.length > 0) {
      const currentSportNames = userSportsData.map((us: any) => us.sport?.name).filter(Boolean);
      const matchedIds = SPORTS.filter(s => currentSportNames.includes(s.name)).map(s => s.id);
      if (matchedIds.length > 0) setSelected(matchedIds);
    }
  }, [isEditMode, userSportsData]);

  const saving = savingSports || finishing;

  async function handleContinue() {
    setFinishing(true);
    try {
      await saveSports(selected);
      if (isEditMode) {
        router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
        return;
      }
      // Final onboarding step — mark complete and enter the app.
      await completeOnboarding();
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally {
      setFinishing(false);
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
        <StepIndicator currentStep={2} totalSteps={2} />
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

        <Button
          title={saving ? "Saving..." : isEditMode ? "Save Changes" : "Enter Beast Tribe"}
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
});
