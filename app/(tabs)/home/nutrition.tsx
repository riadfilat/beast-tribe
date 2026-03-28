import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/ui';
import { CalorieRing } from '../../../src/components/nutrition/CalorieRing';
import { MacroGrid } from '../../../src/components/nutrition/MacroGrid';
import { MealRow } from '../../../src/components/nutrition/MealRow';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { useTodayNutrition, useTodayWater, useLogMeal, useLogWater } from '../../../src/hooks';

const CALORIE_GOAL = 2200;
const PROTEIN_GOAL = 150;
const CARBS_GOAL = 250;
const FAT_GOAL = 70;
const WATER_GOAL = 8;

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function NutritionScreen() {
  const { data: nutritionLogs, loading: nutritionLoading, refetch: refetchNutrition } = useTodayNutrition();
  const { data: waterLogs, loading: waterLoading, refetch: refetchWater } = useTodayWater();
  const { logMeal, loading: logMealLoading } = useLogMeal();
  const { logWater, loading: logWaterLoading } = useLogWater();

  // Meal log modal state
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealType, setMealType] = useState('Breakfast');
  const [mealTitle, setMealTitle] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  const hasRealData = nutritionLogs && nutritionLogs.length > 0;

  const totalCalories = hasRealData
    ? nutritionLogs.reduce((sum: number, log: any) => sum + (log.calories ?? 0), 0)
    : 0;
  const totalProtein = hasRealData
    ? nutritionLogs.reduce((sum: number, log: any) => sum + (log.protein_g ?? 0), 0)
    : 0;
  const totalCarbs = hasRealData
    ? nutritionLogs.reduce((sum: number, log: any) => sum + (log.carbs_g ?? 0), 0)
    : 0;
  const totalFat = hasRealData
    ? nutritionLogs.reduce((sum: number, log: any) => sum + (log.fat_g ?? 0), 0)
    : 0;

  const waterCount = waterLogs && waterLogs.length > 0
    ? waterLogs.reduce((sum: number, log: any) => sum + (log.glasses ?? 1), 0)
    : 0;

  const macros = [
    { label: 'Protein', value: `${Math.round(totalProtein)}g`, progress: Math.min(1, totalProtein / PROTEIN_GOAL), color: COLORS.teal },
    { label: 'Carbs', value: `${Math.round(totalCarbs)}g`, progress: Math.min(1, totalCarbs / CARBS_GOAL), color: COLORS.aqua },
    { label: 'Fat', value: `${Math.round(totalFat)}g`, progress: Math.min(1, totalFat / FAT_GOAL), color: COLORS.orange },
    { label: 'Water', value: `${waterCount}/${WATER_GOAL}`, progress: Math.min(1, waterCount / WATER_GOAL), color: COLORS.blueGray },
  ];

  const MEAL_COLORS: Record<string, string> = {
    breakfast: COLORS.orange,
    lunch: COLORS.green,
    dinner: COLORS.teal,
    snack: COLORS.aqua,
  };

  const meals = hasRealData
    ? nutritionLogs.map((log: any) => ({
        mealType: log.meal_type ? log.meal_type.charAt(0).toUpperCase() + log.meal_type.slice(1) : 'Meal',
        description: log.title ?? '',
        calories: log.calories ?? 0,
        color: MEAL_COLORS[log.meal_type?.toLowerCase()] ?? COLORS.aqua,
      }))
    : [];

  function parsePositiveInt(value: string): number | undefined {
    if (!value) return undefined;
    const num = parseInt(value);
    if (isNaN(num) || num < 0) return undefined;
    return num;
  }

  async function handleLogMeal() {
    if (!mealTitle.trim()) return;
    const cal = parsePositiveInt(mealCalories);
    if (mealCalories && cal === undefined) {
      Alert.alert('Invalid input', 'Calories must be a positive number');
      return;
    }
    if (cal !== undefined && cal > 10000) {
      Alert.alert('Invalid input', 'Calories cannot exceed 10,000');
      return;
    }
    await logMeal({
      meal_type: mealType.toLowerCase(),
      title: mealTitle.trim(),
      calories: cal,
      protein_g: parsePositiveInt(mealProtein),
      carbs_g: parsePositiveInt(mealCarbs),
      fat_g: parsePositiveInt(mealFat),
    });
    // Reset form and close
    setMealTitle('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
    setShowMealModal(false);
    refetchNutrition();
  }

  async function handleLogWater() {
    await logWater();
    refetchWater();
  }

  if (nutritionLoading && waterLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Nutrition</Text>
        <Text style={styles.subtitle}>Aligned to your goals</Text>

        <CalorieRing current={totalCalories} goal={CALORIE_GOAL} size={110} />

        <MacroGrid macros={macros} />

        {meals.length > 0 ? (
          meals.map((meal: any, index: number) => (
            <MealRow key={`${meal.mealType}-${index}`} {...meal} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No meals logged today</Text>
            <Text style={styles.emptySubtext}>Tap the button below to start tracking</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <View style={{ flex: 1 }}>
            <Button title="+ Log meal" onPress={() => setShowMealModal(true)} />
          </View>
          <TouchableOpacity
            style={[styles.waterButton, logWaterLoading && { opacity: 0.5 }]}
            onPress={handleLogWater}
            disabled={logWaterLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.waterIcon}>💧</Text>
            <Text style={styles.waterText}>+1</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Log Meal Modal */}
      <Modal visible={showMealModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log a meal</Text>

            {/* Meal type selector */}
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.mealTypeChip, mealType === type && styles.mealTypeActive]}
                  onPress={() => setMealType(type)}
                >
                  <Text style={[styles.mealTypeText, mealType === type && styles.mealTypeTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="What did you eat?"
              placeholderTextColor={COLORS.textMuted}
              value={mealTitle}
              onChangeText={setMealTitle}
            />

            <View style={styles.macroInputRow}>
              <TextInput
                style={[styles.modalInput, styles.macroInput]}
                placeholder="Cal"
                placeholderTextColor={COLORS.textMuted}
                value={mealCalories}
                onChangeText={setMealCalories}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.macroInput]}
                placeholder="Protein"
                placeholderTextColor={COLORS.textMuted}
                value={mealProtein}
                onChangeText={setMealProtein}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.macroInput]}
                placeholder="Carbs"
                placeholderTextColor={COLORS.textMuted}
                value={mealCarbs}
                onChangeText={setMealCarbs}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.macroInput]}
                placeholder="Fat"
                placeholderTextColor={COLORS.textMuted}
                value={mealFat}
                onChangeText={setMealFat}
                keyboardType="numeric"
              />
            </View>

            <Button
              title={logMealLoading ? 'Saving...' : 'Log meal'}
              onPress={handleLogMeal}
              disabled={logMealLoading || !mealTitle.trim()}
            />
            <TouchableOpacity onPress={() => setShowMealModal(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 8, marginBottom: 2 },
  subtitle: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary },
  emptySubtext: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  waterButton: {
    backgroundColor: 'rgba(86,196,196,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(86,196,196,0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  waterIcon: { fontSize: 16 },
  waterText: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua, marginTop: 2 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalTitle: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.white, marginBottom: 14 },
  mealTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  mealTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mealTypeActive: { backgroundColor: 'rgba(232,143,36,0.15)', borderColor: COLORS.orange },
  mealTypeText: { fontSize: 11, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
  mealTypeTextActive: { color: COLORS.orange },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.white,
    marginBottom: 10,
  },
  macroInputRow: { flexDirection: 'row', gap: 8 },
  macroInput: { flex: 1 },
  cancelButton: { alignItems: 'center', marginTop: 10 },
  cancelText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
});
