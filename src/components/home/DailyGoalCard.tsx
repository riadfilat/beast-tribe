import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../ui';
import { COLORS, FONTS } from '../../lib/constants';

interface DailyGoalCardProps {
  currentSteps: number;
  goalSteps: number;
  xpReward: number;
  onUpdateSteps?: (steps: number) => void;
}

export function DailyGoalCard({ currentSteps, goalSteps, xpReward, onUpdateSteps }: DailyGoalCardProps) {
  const progress = goalSteps > 0 ? Math.min(1, currentSteps / goalSteps) : 0;
  const [showInput, setShowInput] = useState(false);
  const [stepInput, setStepInput] = useState('');

  function handleSave() {
    const steps = parseInt(stepInput);
    if (steps > 0 && onUpdateSteps) {
      onUpdateSteps(steps);
    }
    setShowInput(false);
    setStepInput('');
  }

  return (
    <View style={styles.card}>
      {/* Header: DAILY GOAL + count */}
      <View style={styles.header}>
        <Text style={styles.title}>DAILY GOAL</Text>
        <TouchableOpacity onPress={() => { setStepInput(String(currentSteps || '')); setShowInput(true); }} activeOpacity={0.7} style={styles.countTap}>
          <Text style={styles.count}>
            {currentSteps.toLocaleString()} / {goalSteps.toLocaleString()}
          </Text>
          <Ionicons name="pencil" size={10} color={COLORS.orange} />
        </TouchableOpacity>
      </View>

      {/* Progress bar with running icon */}
      <View style={styles.barRow}>
        <View style={styles.barWrap}>
          <ProgressBar progress={progress} color={COLORS.orange} height={8} />
        </View>
        <Ionicons name="walk" size={16} color={COLORS.orange} style={styles.walkIcon} />
      </View>

      {/* Footer labels */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>0 STEPS</Text>
        <Text style={styles.footerBonus}>BONUS +{xpReward} XP AT {(goalSteps / 1000).toFixed(0)}K</Text>
        <Text style={styles.footerText}>{goalSteps.toLocaleString()}</Text>
      </View>

      {/* Manual step entry modal */}
      <Modal visible={showInput} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInput(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Log your steps</Text>
            <Text style={styles.modalSub}>Enter today's step count</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 8500"
              placeholderTextColor={COLORS.textMuted}
              value={stepInput}
              onChangeText={setStepInput}
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalSaveBtn, !stepInput.trim() && { opacity: 0.4 }]}
              onPress={handleSave}
              disabled={!stepInput.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSaveText}>Save Steps</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowInput(false)} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  countTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  count: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barWrap: {
    flex: 1,
  },
  walkIcon: {
    marginTop: -1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  footerText: {
    fontSize: 8,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
  footerBonus: {
    fontSize: 8,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  modalSheet: {
    width: '80%', backgroundColor: COLORS.background, borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 16 },
  modalInput: {
    width: '100%', backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.orange,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 24, fontFamily: FONTS.heading, color: COLORS.orange, textAlign: 'center',
  },
  modalSaveBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.orange, alignItems: 'center', marginTop: 16,
  },
  modalSaveText: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.dark },
  modalCancelBtn: { paddingVertical: 10, marginTop: 4 },
  modalCancelText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
});
