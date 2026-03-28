import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SportChip } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { useSaveSports } from '../../src/hooks';
import { COLORS, FONTS, SPORTS } from '../../src/lib/constants';

export default function PickSportsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const { saveSports, loading: saving } = useSaveSports();

  async function handleContinue() {
    try {
      await saveSports(selected);
    } catch (e) {
      console.warn('Failed to save sports:', e);
    }
    router.push({ pathname: '/(onboarding)/baseline', params: { sports: selected.join(',') } });
  }

  function toggleSport(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StepIndicator currentStep={1} totalSteps={5} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Pick your disciplines</Text>
        <Text style={styles.subtitle}>Select 1 or more to get started.</Text>

        <View style={styles.grid}>
          {SPORTS.map((sport) => (
            <SportChip
              key={sport.id}
              emoji={sport.emoji}
              name={sport.name}
              selected={selected.includes(sport.id)}
              onPress={() => toggleSport(sport.id)}
            />
          ))}
        </View>

        <Button
          title={saving ? "Saving..." : "Continue"}
          onPress={handleContinue}
          disabled={selected.length === 0 || saving}
        />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
});
