import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
const SUGAR_GOAL = 50;
const FIBER_GOAL = 30;
const WATER_GOAL = 3; // liters

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Quick food items with pre-filled nutrition
const QUICK_FOODS = [
  { icon: '🥗', name: 'Salad', cal: 250, p: 12, c: 20, f: 15, s: 5, fi: 6 },
  { icon: '🍗', name: 'Grilled Chicken', cal: 350, p: 40, c: 5, f: 18, s: 0, fi: 0 },
  { icon: '🍚', name: 'Rice & Protein', cal: 500, p: 30, c: 60, f: 12, s: 2, fi: 2 },
  { icon: '🥚', name: 'Eggs (2)', cal: 180, p: 14, c: 1, f: 12, s: 0, fi: 0 },
  { icon: '🥣', name: 'Oatmeal', cal: 300, p: 10, c: 50, f: 8, s: 12, fi: 8 },
  { icon: '🥤', name: 'Protein Shake', cal: 200, p: 30, c: 15, f: 5, s: 3, fi: 1 },
  { icon: '🥪', name: 'Sandwich', cal: 450, p: 22, c: 45, f: 18, s: 6, fi: 4 },
  { icon: '🍌', name: 'Banana', cal: 105, p: 1, c: 27, f: 0, s: 14, fi: 3 },
  { icon: '🥜', name: 'Nuts (handful)', cal: 180, p: 6, c: 6, f: 16, s: 2, fi: 2 },
  { icon: '☕', name: 'Coffee + Milk', cal: 80, p: 4, c: 8, f: 3, s: 6, fi: 0 },
  { icon: '🍕', name: 'Pizza (2 slices)', cal: 550, p: 20, c: 60, f: 25, s: 8, fi: 3 },
  { icon: '🌯', name: 'Shawarma', cal: 600, p: 35, c: 50, f: 25, s: 5, fi: 3 },
];

export default function NutritionScreen() {
  const router = useRouter();
  const { data: nutritionLogs, loading: nutritionLoading, refetch: refetchNutrition } = useTodayNutrition();
  const { data: waterLogs, loading: waterLoading, refetch: refetchWater } = useTodayWater();
  const { logMeal, loading: logMealLoading } = useLogMeal();
  const { logWater, loading: logWaterLoading } = useLogWater();

  const [showMealModal, setShowMealModal] = useState(false);
  const [mealType, setMealType] = useState('Lunch');
  const [mealTitle, setMealTitle] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const hasRealData = nutritionLogs && nutritionLogs.length > 0;
  const totalCalories = hasRealData ? nutritionLogs.reduce((s: number, l: any) => s + (l.calories ?? 0), 0) : 0;
  const totalProtein = hasRealData ? nutritionLogs.reduce((s: number, l: any) => s + (l.protein_g ?? 0), 0) : 0;
  const totalCarbs = hasRealData ? nutritionLogs.reduce((s: number, l: any) => s + (l.carbs_g ?? 0), 0) : 0;
  const totalFat = hasRealData ? nutritionLogs.reduce((s: number, l: any) => s + (l.fat_g ?? 0), 0) : 0;

  const waterCount = waterLogs && waterLogs.length > 0
    ? waterLogs.reduce((s: number, l: any) => s + ((l.glasses ?? 1) * 0.5), 0)
    : 0;

  const macros = [
    { label: 'Protein', current: totalProtein, goal: PROTEIN_GOAL, unit: 'g', color: COLORS.teal, icon: 'fitness-outline' },
    { label: 'Carbs', current: totalCarbs, goal: CARBS_GOAL, unit: 'g', color: COLORS.aqua, icon: 'leaf-outline' },
    { label: 'Fat', current: totalFat, goal: FAT_GOAL, unit: 'g', color: COLORS.orange, icon: 'water-outline' },
    { label: 'Water', current: waterCount, goal: WATER_GOAL, unit: 'L', color: COLORS.blueGray, icon: 'water-outline' },
  ];

  const meals = hasRealData
    ? nutritionLogs.map((log: any) => ({
        mealType: log.meal_type ? log.meal_type.charAt(0).toUpperCase() + log.meal_type.slice(1) : 'Meal',
        description: log.title ?? '',
        calories: log.calories ?? 0,
        color: ({ breakfast: COLORS.orange, lunch: COLORS.green, dinner: COLORS.teal, snack: COLORS.aqua } as Record<string, string>)[log.meal_type?.toLowerCase()] ?? COLORS.aqua,
      }))
    : [];

  function parseNum(v: string): number | undefined {
    if (!v) return undefined;
    const n = parseInt(v);
    return isNaN(n) || n < 0 ? undefined : n;
  }

  // Quick-add a food item directly
  async function quickAddFood(food: typeof QUICK_FOODS[0]) {
    await logMeal({
      meal_type: mealType.toLowerCase(),
      title: food.name,
      calories: food.cal,
      protein_g: food.p,
      carbs_g: food.c,
      fat_g: food.f,
    });
    refetchNutrition();
    setShowMealModal(false);
  }

  async function handleLogMeal() {
    if (!mealTitle.trim()) return;
    const cal = parseNum(mealCalories);
    await logMeal({
      meal_type: mealType.toLowerCase(),
      title: mealTitle.trim(),
      calories: cal,
      protein_g: parseNum(mealProtein),
      carbs_g: parseNum(mealCarbs),
      fat_g: parseNum(mealFat),
    });
    setMealTitle(''); setMealCalories(''); setMealProtein(''); setMealCarbs(''); setMealFat('');
    setShowMealModal(false); setShowCustom(false);
    refetchNutrition();
  }

  async function handleLogWater() {
    await logWater();
    refetchWater();
  }

  if (nutritionLoading && waterLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <CalorieRing current={totalCalories} goal={CALORIE_GOAL} size={110} />
        <MacroGrid macros={macros} />

        {/* Logged meals */}
        {meals.length > 0 ? (
          meals.map((meal: any, i: number) => (
            <MealRow key={`${meal.mealType}-${i}`} {...meal} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No meals logged today</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.logMealBtn} onPress={() => setShowMealModal(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={20} color={COLORS.dark} />
            <Text style={styles.logMealText}>Log Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.waterBtn, logWaterLoading && { opacity: 0.5 }]}
            onPress={handleLogWater}
            disabled={logWaterLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="water" size={18} color={COLORS.aqua} />
            <Text style={styles.waterBtnText}>+0.5L</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ============ LOG MEAL MODAL ============ */}
      <Modal visible={showMealModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            {/* Meal type */}
            <Text style={styles.modalTitle}>Log a meal</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.mealChip, mealType === type && styles.mealChipActive]}
                  onPress={() => setMealType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.mealChipText, mealType === type && styles.mealChipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick-add food grid */}
            <Text style={styles.sectionLabel}>TAP TO ADD</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.foodScrollOuter}>
              <View style={styles.foodGrid}>
                {QUICK_FOODS.map((food) => (
                  <TouchableOpacity
                    key={food.name}
                    style={styles.foodCard}
                    onPress={() => quickAddFood(food)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.foodEmoji}>{food.icon}</Text>
                    <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
                    <Text style={styles.foodCal}>{food.cal} cal</Text>
                    <View style={styles.foodMacroRow}>
                      <Text style={styles.foodMacro}>P{food.p}</Text>
                      <Text style={styles.foodMacro}>C{food.c}</Text>
                      <Text style={styles.foodMacro}>F{food.f}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Custom entry toggle */}
            {!showCustom ? (
              <TouchableOpacity style={styles.customToggle} onPress={() => setShowCustom(true)} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color={COLORS.orange} />
                <Text style={styles.customToggleText}>Custom entry</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.customSection}>
                <TextInput
                  style={styles.input}
                  placeholder="What did you eat?"
                  placeholderTextColor={COLORS.textMuted}
                  value={mealTitle}
                  onChangeText={setMealTitle}
                />
                <View style={styles.macroRow}>
                  {[
                    { key: 'cal', label: 'Cal', val: mealCalories, set: setMealCalories },
                    { key: 'p', label: 'Protein', val: mealProtein, set: setMealProtein },
                    { key: 'c', label: 'Carbs', val: mealCarbs, set: setMealCarbs },
                    { key: 'f', label: 'Fat', val: mealFat, set: setMealFat },
                  ].map(({ key, label, val, set }) => (
                    <View key={key} style={styles.macroField}>
                      <Text style={styles.macroLabel}>{label}</Text>
                      <TextInput
                        style={styles.macroInput}
                        placeholder="0"
                        placeholderTextColor={COLORS.textMuted}
                        value={val}
                        onChangeText={set}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.saveBtn, !mealTitle.trim() && { opacity: 0.4 }]}
                  onPress={handleLogMeal}
                  disabled={logMealLoading || !mealTitle.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>{logMealLoading ? 'Saving...' : 'Log Meal'}</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={() => { setShowMealModal(false); setShowCustom(false); }} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.white },
  scroll: { flex: 1, paddingHorizontal: 16 },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  logMealBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 14,
  },
  logMealText: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.dark },
  waterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(86,196,196,0.1)', borderWidth: 1, borderColor: 'rgba(86,196,196,0.25)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  waterBtnText: { fontSize: 13, fontFamily: FONTS.heading, color: COLORS.aqua },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 12 },

  // Meal type chips
  mealTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mealChip: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  mealChipActive: { borderColor: COLORS.orange, backgroundColor: 'rgba(232,143,36,0.1)' },
  mealChipText: { fontSize: 11, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
  mealChipTextActive: { color: COLORS.orange },

  // Quick food grid
  sectionLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  foodScrollOuter: { maxHeight: 280 },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodCard: {
    width: '31%', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  foodEmoji: { fontSize: 24, marginBottom: 4 },
  foodName: { fontSize: 10, fontFamily: FONTS.bodyMedium, color: COLORS.textPrimary, textAlign: 'center' },
  foodCal: { fontSize: 11, fontFamily: FONTS.heading, color: COLORS.orange, marginTop: 2 },
  foodMacroRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  foodMacro: { fontSize: 8, fontFamily: FONTS.body, color: COLORS.textMuted },

  // Custom entry
  customToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, marginTop: 12,
  },
  customToggleText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.orange },
  customSection: { marginTop: 8 },
  input: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: FONTS.body, color: COLORS.textPrimary, marginBottom: 10,
  },
  macroRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  macroField: { flex: 1 },
  macroLabel: { fontSize: 8, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  macroInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10,
    fontSize: 14, fontFamily: FONTS.heading, color: COLORS.textPrimary, textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.dark },

  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  cancelText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
});
