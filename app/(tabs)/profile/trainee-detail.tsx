import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, ProgressBar } from '../../../src/components/ui';
import { useBodyMetrics, useLogBodyMetrics, useTraineeWorkouts, useTraineeNutrition, useCoachNotes, useTraineePrivacy } from '../../../src/hooks';
import { COLORS, FONTS } from '../../../src/lib/constants';

const TABS = ['Overview', 'Body', 'Workouts', 'Nutrition', 'Notes'];

export default function TraineeDetailScreen() {
  const router = useRouter();
  const { traineeId, coachId, traineeName } = useLocalSearchParams<{ traineeId: string; coachId: string; traineeName: string }>();

  const [activeTab, setActiveTab] = useState(0);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteType, setNoteType] = useState('feedback');
  const [noteContent, setNoteContent] = useState('');
  const [metricWeight, setMetricWeight] = useState('');
  const [metricHeight, setMetricHeight] = useState('');
  const [metricBodyFat, setMetricBodyFat] = useState('');
  const [metricWaist, setMetricWaist] = useState('');
  const [metricChest, setMetricChest] = useState('');
  const [metricNotes, setMetricNotes] = useState('');

  const { metrics, loading: metricsLoading } = useBodyMetrics(traineeId);
  const { logMetrics, loading: loggingMetrics } = useLogBodyMetrics();
  const { workouts, loading: workoutsLoading } = useTraineeWorkouts(traineeId);
  const { logs: nutritionLogs, loading: nutritionLoading } = useTraineeNutrition(traineeId);
  const { notes, loading: notesLoading, addNote } = useCoachNotes(coachId, traineeId);
  const { privacy } = useTraineePrivacy(traineeId, coachId);

  const latestMetric = metrics[0];
  const bmi = latestMetric?.bmi || (latestMetric?.weight_kg && latestMetric?.height_cm ? Math.round((latestMetric.weight_kg / ((latestMetric.height_cm / 100) ** 2)) * 10) / 10 : null);
  const bmiCategory = bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese') : '';
  const bmiColor = bmi ? (bmi < 18.5 ? COLORS.aqua : bmi < 25 ? COLORS.green : bmi < 30 ? COLORS.orange : '#EF5350') : COLORS.textMuted;

  async function handleSaveMetric() {
    if (!traineeId) return;
    await logMetrics(traineeId, {
      weight_kg: metricWeight ? parseFloat(metricWeight) : undefined,
      height_cm: metricHeight ? parseFloat(metricHeight) : undefined,
      body_fat_pct: metricBodyFat ? parseFloat(metricBodyFat) : undefined,
      waist_cm: metricWaist ? parseFloat(metricWaist) : undefined,
      chest_cm: metricChest ? parseFloat(metricChest) : undefined,
      notes: metricNotes || undefined,
    });
    setShowMetricModal(false);
    setMetricWeight(''); setMetricHeight(''); setMetricBodyFat(''); setMetricWaist(''); setMetricChest(''); setMetricNotes('');
  }

  async function handleSaveNote() {
    if (!noteContent.trim()) return;
    await addNote(noteType, noteContent.trim());
    setShowNoteModal(false);
    setNoteContent('');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile/coach-dashboard')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{traineeName || 'Trainee'}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(i)} style={[styles.tab, activeTab === i && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* OVERVIEW TAB */}
        {activeTab === 0 && (
          <>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <Ionicons name="flash" size={18} color={COLORS.orange} />
                <Text style={styles.overviewValue}>{bmi || '—'}</Text>
                <Text style={styles.overviewLabel}>BMI</Text>
                {bmiCategory ? <Text style={[styles.overviewBadge, { color: bmiColor }]}>{bmiCategory}</Text> : null}
              </View>
              <View style={styles.overviewCard}>
                <Ionicons name="scale-outline" size={18} color={COLORS.aqua} />
                <Text style={styles.overviewValue}>{latestMetric?.weight_kg || '—'}</Text>
                <Text style={styles.overviewLabel}>Weight (kg)</Text>
              </View>
              <View style={styles.overviewCard}>
                <Ionicons name="body-outline" size={18} color={COLORS.green} />
                <Text style={styles.overviewValue}>{latestMetric?.body_fat_pct ? `${latestMetric.body_fat_pct}%` : '—'}</Text>
                <Text style={styles.overviewLabel}>Body Fat</Text>
              </View>
              <View style={styles.overviewCard}>
                <Ionicons name="barbell-outline" size={18} color={COLORS.coral} />
                <Text style={styles.overviewValue}>{workouts.length}</Text>
                <Text style={styles.overviewLabel}>Workouts (30d)</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowMetricModal(true)}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Record Measurement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.aqua }]} onPress={() => setShowNoteModal(true)}>
              <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Add Note</Text>
            </TouchableOpacity>
          </>
        )}

        {/* BODY METRICS TAB */}
        {activeTab === 1 && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowMetricModal(true)}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>New Measurement</Text>
            </TouchableOpacity>

            {metricsLoading ? <ActivityIndicator color={COLORS.orange} style={{ marginTop: 20 }} /> :
             metrics.length === 0 ? <Text style={styles.emptyText}>No measurements recorded yet</Text> :
             metrics.map((m: any) => (
              <View key={m.id} style={styles.metricCard}>
                <Text style={styles.metricDate}>{new Date(m.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                <View style={styles.metricGrid}>
                  {m.weight_kg && <View style={styles.metricItem}><Text style={styles.metricValue}>{m.weight_kg}</Text><Text style={styles.metricLabel}>kg</Text></View>}
                  {m.bmi && <View style={styles.metricItem}><Text style={[styles.metricValue, { color: bmiColor }]}>{m.bmi}</Text><Text style={styles.metricLabel}>BMI</Text></View>}
                  {m.body_fat_pct && <View style={styles.metricItem}><Text style={styles.metricValue}>{m.body_fat_pct}%</Text><Text style={styles.metricLabel}>Body Fat</Text></View>}
                  {m.waist_cm && <View style={styles.metricItem}><Text style={styles.metricValue}>{m.waist_cm}</Text><Text style={styles.metricLabel}>Waist</Text></View>}
                  {m.chest_cm && <View style={styles.metricItem}><Text style={styles.metricValue}>{m.chest_cm}</Text><Text style={styles.metricLabel}>Chest</Text></View>}
                </View>
                {m.notes && <Text style={styles.metricNotes}>{m.notes}</Text>}
              </View>
            ))}
          </>
        )}

        {/* WORKOUTS TAB */}
        {activeTab === 2 && (
          <>
            {!privacy?.share_workouts ? <Text style={styles.privateText}>Trainee has not shared workout data</Text> :
             workoutsLoading ? <ActivityIndicator color={COLORS.orange} style={{ marginTop: 20 }} /> :
             workouts.length === 0 ? <Text style={styles.emptyText}>No workouts logged</Text> :
             workouts.map((w: any) => (
              <View key={w.id} style={styles.workoutCard}>
                <View style={styles.workoutIcon}><Ionicons name="barbell" size={18} color={COLORS.orange} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutTitle}>{w.title || 'Workout'}</Text>
                  <Text style={styles.workoutMeta}>{w.sport?.name || ''} · {w.duration_minutes || 0} min · {w.calories_burned || 0} cal</Text>
                  <Text style={styles.workoutDate}>{new Date(w.completed_at).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* NUTRITION TAB */}
        {activeTab === 3 && (
          <>
            {!privacy?.share_nutrition ? <Text style={styles.privateText}>Trainee has not shared nutrition data</Text> :
             nutritionLoading ? <ActivityIndicator color={COLORS.orange} style={{ marginTop: 20 }} /> :
             nutritionLogs.length === 0 ? <Text style={styles.emptyText}>No meals logged recently</Text> :
             nutritionLogs.map((n: any, i: number) => (
              <View key={i} style={styles.nutritionCard}>
                <Text style={styles.nutritionType}>{(n.meal_type || 'meal').toUpperCase()}</Text>
                <Text style={styles.nutritionTitle}>{n.title || 'Meal'}</Text>
                <View style={styles.nutritionMacros}>
                  <Text style={styles.nutritionMacro}>{n.calories || 0} cal</Text>
                  {n.protein_g && <Text style={styles.nutritionMacro}>P{n.protein_g}g</Text>}
                  {n.carbs_g && <Text style={styles.nutritionMacro}>C{n.carbs_g}g</Text>}
                  {n.fat_g && <Text style={styles.nutritionMacro}>F{n.fat_g}g</Text>}
                </View>
                <Text style={styles.nutritionDate}>{n.logged_date}</Text>
              </View>
            ))}
          </>
        )}

        {/* NOTES TAB */}
        {activeTab === 4 && (
          <>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.aqua }]} onPress={() => setShowNoteModal(true)}>
              <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Add Note</Text>
            </TouchableOpacity>

            {notesLoading ? <ActivityIndicator color={COLORS.orange} style={{ marginTop: 20 }} /> :
             notes.length === 0 ? <Text style={styles.emptyText}>No notes yet</Text> :
             notes.map((n: any) => {
              const typeIcon = ({ feedback: 'chatbubble', goal: 'flag', milestone: 'trophy', warning: 'warning', program: 'clipboard' } as Record<string, string>)[n.note_type] || 'chatbubble';
              const typeColor = ({ feedback: COLORS.aqua, goal: COLORS.orange, milestone: COLORS.green, warning: '#EF5350', program: COLORS.textSecondary } as Record<string, string>)[n.note_type] || COLORS.aqua;
              return (
                <View key={n.id} style={styles.noteCard}>
                  <View style={[styles.noteIcon, { backgroundColor: `${typeColor}15` }]}>
                    <Ionicons name={typeIcon as any} size={16} color={typeColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.noteType, { color: typeColor }]}>{n.note_type?.toUpperCase()}</Text>
                      {n.is_private && <Text style={styles.privateBadge}>PRIVATE</Text>}
                    </View>
                    <Text style={styles.noteContent}>{n.content}</Text>
                    <Text style={styles.noteDate}>{new Date(n.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Record Measurement Modal */}
      <Modal visible={showMetricModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMetricModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Record Measurement</Text>
            <View style={styles.modalGrid}>
              {[
                { label: 'Weight (kg)', val: metricWeight, set: setMetricWeight },
                { label: 'Height (cm)', val: metricHeight, set: setMetricHeight },
                { label: 'Body Fat %', val: metricBodyFat, set: setMetricBodyFat },
                { label: 'Waist (cm)', val: metricWaist, set: setMetricWaist },
                { label: 'Chest (cm)', val: metricChest, set: setMetricChest },
              ].map(f => (
                <View key={f.label} style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>{f.label}</Text>
                  <TextInput style={styles.modalFieldInput} value={f.val} onChangeText={f.set} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={COLORS.textMuted} />
                </View>
              ))}
            </View>
            <TextInput style={styles.modalNotesInput} value={metricNotes} onChangeText={setMetricNotes} placeholder="Notes (optional)" placeholderTextColor={COLORS.textMuted} multiline />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveMetric} disabled={loggingMetrics}>
              <Text style={styles.modalSaveBtnText}>{loggingMetrics ? 'Saving...' : 'Save Measurement'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Note Modal */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNoteModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Coach Note</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['feedback', 'goal', 'milestone', 'warning', 'program'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setNoteType(t)}
                    style={[styles.noteTypeChip, noteType === t && styles.noteTypeChipActive]}>
                    <Text style={[styles.noteTypeText, noteType === t && { color: COLORS.orange }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput style={styles.modalNotesInput} value={noteContent} onChangeText={setNoteContent} placeholder="Write your note..." placeholderTextColor={COLORS.textMuted} multiline />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveNote} disabled={!noteContent.trim()}>
              <Text style={styles.modalSaveBtnText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.textPrimary },
  scroll: { flex: 1, paddingHorizontal: 16 },

  tabBar: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder, marginBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.orange },
  tabText: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
  tabTextActive: { color: COLORS.orange },

  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  overviewCard: { width: '47%', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 14, padding: 14, alignItems: 'center' },
  overviewValue: { fontSize: 24, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginTop: 6 },
  overviewLabel: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 2 },
  overviewBadge: { fontSize: 10, fontFamily: FONTS.bodySemiBold, marginTop: 2 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 14, marginBottom: 10 },
  actionBtnText: { fontSize: 14, fontFamily: FONTS.heading, color: '#FFFFFF' },

  emptyText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, paddingVertical: 30 },
  privateText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, paddingVertical: 30, fontStyle: 'italic' },

  // Body metrics
  metricCard: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 14, padding: 14, marginBottom: 8 },
  metricDate: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: COLORS.orange, marginBottom: 8 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricItem: { alignItems: 'center' },
  metricValue: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.textPrimary },
  metricLabel: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted },
  metricNotes: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 8, fontStyle: 'italic' },

  // Workouts
  workoutCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 14, padding: 14, marginBottom: 8 },
  workoutIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(232,143,36,0.1)', alignItems: 'center', justifyContent: 'center' },
  workoutTitle: { fontSize: 13, fontFamily: FONTS.heading, color: COLORS.textPrimary },
  workoutMeta: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 2 },
  workoutDate: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 2 },

  // Nutrition
  nutritionCard: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 14, padding: 14, marginBottom: 8 },
  nutritionType: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.orange, letterSpacing: 1 },
  nutritionTitle: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textPrimary, marginTop: 2 },
  nutritionMacros: { flexDirection: 'row', gap: 10, marginTop: 6 },
  nutritionMacro: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.textTertiary },
  nutritionDate: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 4 },

  // Notes
  noteCard: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 14, padding: 14, marginBottom: 8 },
  noteIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  noteType: { fontSize: 9, fontFamily: FONTS.bodySemiBold, letterSpacing: 0.5 },
  privateBadge: { fontSize: 8, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  noteContent: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.textPrimary, marginTop: 4, lineHeight: 18 },
  noteDate: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 4 },

  noteTypeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  noteTypeChipActive: { borderColor: COLORS.orange, backgroundColor: 'rgba(232,143,36,0.1)' },
  noteTypeText: { fontSize: 11, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 16 },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modalField: { width: '47%' },
  modalFieldLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  modalFieldInput: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontFamily: FONTS.heading, color: COLORS.orange, textAlign: 'center' },
  modalNotesInput: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: FONTS.body, color: COLORS.textPrimary, minHeight: 80, marginTop: 12, marginBottom: 14, textAlignVertical: 'top' },
  modalSaveBtn: { backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalSaveBtnText: { fontSize: 14, fontFamily: FONTS.heading, color: '#FFFFFF' },
});
