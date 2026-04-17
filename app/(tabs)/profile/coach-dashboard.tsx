import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, TierPill } from '../../../src/components/ui';
import { useIsCoach, useCoachTrainees, useAddTrainee } from '../../../src/hooks';
import { COLORS, FONTS } from '../../../src/lib/constants';

export default function CoachDashboardScreen() {
  const router = useRouter();
  const { coachId } = useIsCoach();
  const { trainees, loading } = useCoachTrainees(coachId);
  const { addTrainee, loading: adding } = useAddTrainee();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchName, setSearchName] = useState('');

  async function handleAddTrainee() {
    if (!coachId || !searchName.trim()) return;
    const result = await addTrainee(coachId, searchName.trim());
    if (result) {
      setShowAddModal(false);
      setSearchName('');
    }
  }

  const activeCount = trainees.filter((t: any) => t.status === 'active').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach Dashboard</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="person-add" size={22} color={COLORS.orange} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>ACTIVE TRAINEES</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.orange }]}>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{trainees.length}</Text>
            <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>TOTAL</Text>
          </View>
        </View>

        {/* Trainees list */}
        <Text style={styles.sectionTitle}>MY TRAINEES</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.orange} style={{ marginTop: 40 }} />
        ) : trainees.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No trainees yet</Text>
            <Text style={styles.emptyText}>Tap the + icon to add your first trainee</Text>
          </View>
        ) : (
          trainees.map((ct: any) => {
            const t = ct.trainee;
            if (!t) return null;
            return (
              <TouchableOpacity
                key={ct.id}
                style={styles.traineeCard}
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: '/(tabs)/profile/trainee-detail',
                  params: { traineeId: t.id, coachId, traineeName: t.display_name || t.full_name },
                })}
              >
                <Avatar name={t.display_name || t.full_name || 'T'} size={44} tier={t.tier || 'initiate'} backgroundColor={COLORS.dark} />
                <View style={styles.traineeInfo}>
                  <Text style={styles.traineeName}>{t.display_name || t.full_name}</Text>
                  <View style={styles.traineeMetaRow}>
                    <Text style={styles.traineeMeta}>🔥 {t.current_streak || 0}d streak</Text>
                    <Text style={styles.traineeMeta}>⚡ {(t.total_xp || 0).toLocaleString()} XP</Text>
                    <Text style={styles.traineeMeta}>Lv {t.level || 1}</Text>
                  </View>
                </View>
                <TierPill tier={t.tier || 'initiate'} size="small" />
                <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Add Trainee Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Add Trainee</Text>
            <Text style={styles.modalSub}>Search by name to add a Beast Tribe member</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter trainee name..."
              placeholderTextColor={COLORS.textMuted}
              value={searchName}
              onChangeText={setSearchName}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalBtn, (!searchName.trim() || adding) && { opacity: 0.4 }]}
              onPress={handleAddTrainee}
              disabled={!searchName.trim() || adding}
            >
              <Text style={styles.modalBtnText}>{adding ? 'Adding...' : 'Add Trainee'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ paddingVertical: 10 }}>
              <Text style={{ color: COLORS.textTertiary, fontSize: 13 }}>Cancel</Text>
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

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontFamily: FONTS.heading, color: COLORS.orange },
  statLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted, letterSpacing: 1, marginTop: 4 },

  sectionTitle: { fontSize: 12, fontFamily: FONTS.heading, color: COLORS.textPrimary, letterSpacing: 0.5, marginBottom: 12 },

  traineeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  traineeInfo: { flex: 1 },
  traineeName: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.textPrimary },
  traineeMetaRow: { flexDirection: 'row', gap: 10, marginTop: 3 },
  traineeMeta: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: FONTS.heading, color: COLORS.textSecondary },
  emptyText: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalSheet: { width: '85%', backgroundColor: COLORS.background, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalTitle: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 16, textAlign: 'center' },
  modalInput: { width: '100%', backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: FONTS.body, color: COLORS.textPrimary, marginBottom: 14 },
  modalBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.orange, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontFamily: FONTS.heading, color: '#FFFFFF' },
});
