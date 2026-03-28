import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Modal,
  TextInput, ScrollView, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../../src/components/ui';
import { useLogWorkout, useCreatePost } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { COLORS, FONTS } from '../../../src/lib/constants';

// ── Rest timer durations (seconds) ──
const REST_DURATIONS = [30, 45, 60, 90];
const DEFAULT_REST = 60;

type SessionPhase = 'exercise' | 'rest' | 'completed';

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    sport_id?: string;
    title?: string;
    sport?: string;
    duration_minutes?: string;
    difficulty?: string;
    xp?: string;
    instructions?: string; // JSON stringified
  }>();

  const { profile, refreshProfile } = useAuth();
  const { logWorkout, loading: logging } = useLogWorkout();
  const { createPost, loading: posting } = useCreatePost();

  // Parse workout data from params
  const workoutTitle = params.title || 'Workout';
  const sport = params.sport || 'Workout';
  const durationMin = parseInt(params.duration_minutes || '30');
  const difficulty = params.difficulty || 'All levels';
  const xpReward = parseInt(params.xp || '100');
  const instructions: Array<{ step?: number; text: string; rest_seconds?: number; video_url?: string }> =
    params.instructions ? JSON.parse(params.instructions) : [];

  // If no instructions, generate placeholder steps
  const exercises = instructions.length > 0
    ? instructions
    : [
        { step: 1, text: 'Warm up — 5 minutes light cardio', rest_seconds: 30 },
        { step: 2, text: 'Main set — Follow the workout routine', rest_seconds: 60 },
        { step: 3, text: 'Cool down — 3 minutes stretching', rest_seconds: 0 },
      ];

  // ── Session state ──
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>('exercise');
  const [restTime, setRestTime] = useState(DEFAULT_REST);
  const [earnedXP, setEarnedXP] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Share modal state ──
  const [showShare, setShowShare] = useState(false);
  const [shareTarget, setShareTarget] = useState<'feed' | 'pack'>('feed');
  const [shareCaption, setShareCaption] = useState('');
  const [sharePhotoUri, setSharePhotoUri] = useState<string | null>(null);

  // ── Elapsed time tracking ──
  const startTimeRef = useRef(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (phase === 'completed') return;
    const tick = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [phase]);

  // ── Rest timer ──
  useEffect(() => {
    if (phase !== 'rest') return;
    timerRef.current = setInterval(() => {
      setRestTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleNextStep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  function handleNextStep() {
    const nextIndex = currentStep + 1;
    if (nextIndex >= exercises.length) {
      handleComplete();
    } else {
      setCurrentStep(nextIndex);
      setPhase('exercise');
    }
  }

  function handleFinishExercise() {
    const restSec = exercises[currentStep]?.rest_seconds ?? DEFAULT_REST;
    const isLast = currentStep >= exercises.length - 1;
    if (isLast || restSec <= 0) {
      handleNextStep();
    } else {
      setRestTime(restSec);
      setPhase('rest');
    }
  }

  function handleSkipRest() {
    if (timerRef.current) clearInterval(timerRef.current);
    handleNextStep();
  }

  async function handleComplete() {
    setPhase('completed');
    const xp = await logWorkout({
      workout_id: params.id,
      sport_id: params.sport_id,
      title: workoutTitle,
      duration_minutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      xp_reward: xpReward,
    });
    setEarnedXP(xp || xpReward);
    // Refresh profile to update XP/level on profile screen
    refreshProfile?.();
  }

  function handleQuit() {
    Alert.alert('Quit workout?', 'Your progress won\'t be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  // ── Share flow ──
  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to share a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSharePhotoUri(result.assets[0].uri);
    }
  }

  async function handleShare() {
    const caption = shareCaption.trim() || `Just crushed ${workoutTitle}! +${earnedXP} XP`;
    const success = await createPost(caption);
    if (success) {
      Alert.alert('Shared!', 'Your tribe can see your workout.');
      setShowShare(false);
      router.back();
    } else {
      Alert.alert('Error', 'Could not share. Try again.');
    }
  }

  function handleDone() {
    router.back();
  }

  // ── Format helpers ──
  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const progress = exercises.length > 0 ? (currentStep + (phase === 'completed' ? 1 : 0)) / exercises.length : 0;

  // ═══════════════════════════════════════
  // COMPLETED STATE
  // ═══════════════════════════════════════
  if (phase === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.completionContainer}>
          <Text style={styles.completionEmoji}>💪</Text>
          <Text style={styles.completionTitle}>Beast Mode!</Text>
          <Text style={styles.completionXP}>+{earnedXP} XP earned</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Workout</Text>
              <Text style={styles.summaryValue}>{workoutTitle}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{formatTime(elapsedSeconds)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Exercises</Text>
              <Text style={styles.summaryValue}>{exercises.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Difficulty</Text>
              <Text style={styles.summaryValue}>{difficulty}</Text>
            </View>
          </View>

          <Button title="Share to Tribe" onPress={() => { setShareCaption(`Just crushed ${workoutTitle}! +${earnedXP} XP`); setShowShare(true); }} />
          <TouchableOpacity style={styles.secondaryAction} onPress={handleDone}>
            <Text style={styles.secondaryText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Share Modal */}
        <Modal visible={showShare} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Share your workout</Text>

              {/* Target selector */}
              <View style={styles.targetRow}>
                <TouchableOpacity
                  style={[styles.targetChip, shareTarget === 'feed' && styles.targetActive]}
                  onPress={() => setShareTarget('feed')}
                >
                  <Text style={[styles.targetText, shareTarget === 'feed' && styles.targetTextActive]}>Public Feed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.targetChip, shareTarget === 'pack' && styles.targetActive]}
                  onPress={() => setShareTarget('pack')}
                >
                  <Text style={[styles.targetText, shareTarget === 'pack' && styles.targetTextActive]}>My Pack</Text>
                </TouchableOpacity>
              </View>

              {/* Caption */}
              <TextInput
                style={styles.captionInput}
                placeholder="Say something about your workout..."
                placeholderTextColor={COLORS.textMuted}
                value={shareCaption}
                onChangeText={setShareCaption}
                multiline
                maxLength={300}
              />

              {/* Photo */}
              {sharePhotoUri ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: sharePhotoUri }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => setSharePhotoUri(null)}>
                    <Text style={styles.photoRemoveText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
                  <Text style={styles.photoButtonIcon}>📷</Text>
                  <Text style={styles.photoButtonText}>Add a photo</Text>
                </TouchableOpacity>
              )}

              <Button title={posting ? 'Sharing...' : 'Share'} onPress={handleShare} disabled={posting} />
              <TouchableOpacity style={styles.secondaryAction} onPress={() => setShowShare(false)}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // REST STATE
  // ═══════════════════════════════════════
  if (phase === 'rest') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.restContainer}>
          <Text style={styles.restLabel}>REST</Text>
          <Text style={styles.restTimer}>{formatTime(restTime)}</Text>
          <Text style={styles.restNext}>
            Next: {exercises[currentStep + 1]?.text || 'Final exercise'}
          </Text>

          {/* Quick adjust rest time */}
          <View style={styles.restOptions}>
            {REST_DURATIONS.map(sec => (
              <TouchableOpacity
                key={sec}
                style={[styles.restChip, restTime === sec && styles.restChipActive]}
                onPress={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setRestTime(sec);
                  // Restart timer
                  timerRef.current = setInterval(() => {
                    setRestTime(prev => {
                      if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        handleNextStep();
                        return 0;
                      }
                      return prev - 1;
                    });
                  }, 1000);
                }}
              >
                <Text style={[styles.restChipText, restTime === sec && styles.restChipTextActive]}>
                  {sec}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Skip rest" onPress={handleSkipRest} />
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // EXERCISE STATE (main view)
  // ═══════════════════════════════════════
  const currentExercise = exercises[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleQuit}>
          <Text style={styles.quitText}>Quit</Text>
        </TouchableOpacity>
        <Text style={styles.elapsed}>{formatTime(elapsedSeconds)}</Text>
        <Text style={styles.stepCount}>{currentStep + 1}/{exercises.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView style={styles.exerciseScroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Video placeholder */}
        <View style={styles.videoPlaceholder}>
          {currentExercise.video_url ? (
            <Text style={styles.videoLabel}>Video preview</Text>
          ) : (
            <>
              <Text style={styles.videoEmoji}>🎬</Text>
              <Text style={styles.videoLabel}>Exercise demo</Text>
            </>
          )}
        </View>

        {/* Exercise info */}
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseStep}>EXERCISE {currentExercise.step || currentStep + 1}</Text>
          <Text style={styles.exerciseText}>{currentExercise.text}</Text>

          {currentExercise.rest_seconds && currentExercise.rest_seconds > 0 && currentStep < exercises.length - 1 && (
            <Text style={styles.restPreview}>
              {currentExercise.rest_seconds}s rest after this exercise
            </Text>
          )}
        </View>

        {/* Upcoming exercises */}
        {currentStep < exercises.length - 1 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.upcomingLabel}>COMING UP</Text>
            {exercises.slice(currentStep + 1, currentStep + 4).map((ex, i) => (
              <View key={i} style={styles.upcomingRow}>
                <View style={styles.upcomingBullet}>
                  <Text style={styles.upcomingNum}>{(ex.step || currentStep + 2 + i)}</Text>
                </View>
                <Text style={styles.upcomingText} numberOfLines={1}>{ex.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomBar}>
        <Button
          title={currentStep >= exercises.length - 1 ? 'Finish Workout' : 'Done — Next'}
          onPress={handleFinishExercise}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  quitText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.coral },
  elapsed: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.white },
  stepCount: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary },

  // Progress bar
  progressBar: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16, borderRadius: 2, marginBottom: 8,
  },
  progressFill: { height: 3, backgroundColor: COLORS.orange, borderRadius: 2 },

  // Exercise view
  exerciseScroll: { flex: 1, paddingHorizontal: 16 },
  videoPlaceholder: {
    height: 200, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  videoEmoji: { fontSize: 36, marginBottom: 8 },
  videoLabel: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted },
  exerciseInfo: { marginBottom: 24 },
  exerciseStep: {
    fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.orange,
    letterSpacing: 1, marginBottom: 6,
  },
  exerciseText: {
    fontSize: 18, fontFamily: FONTS.heading, color: COLORS.white, lineHeight: 26,
  },
  restPreview: {
    fontSize: 11, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 8,
  },

  // Upcoming
  upcomingSection: { marginTop: 8 },
  upcomingLabel: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary,
    letterSpacing: 1, marginBottom: 10,
  },
  upcomingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
    opacity: 0.5,
  },
  upcomingBullet: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(86,196,196,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  upcomingNum: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua },
  upcomingText: { flex: 1, fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary },

  // Bottom bar
  bottomBar: { paddingHorizontal: 16, paddingBottom: 16 },

  // ── Rest screen ──
  restContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  restLabel: {
    fontSize: 14, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua,
    letterSpacing: 3, marginBottom: 8,
  },
  restTimer: { fontSize: 72, fontFamily: FONTS.heading, color: COLORS.white, marginBottom: 12 },
  restNext: {
    fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary,
    textAlign: 'center', marginBottom: 24, paddingHorizontal: 20,
  },
  restOptions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  restChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  restChipActive: { backgroundColor: 'rgba(86,196,196,0.15)', borderColor: COLORS.aqua },
  restChipText: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary },
  restChipTextActive: { color: COLORS.aqua },

  // ── Completion screen ──
  completionContainer: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 60 },
  completionEmoji: { fontSize: 64, marginBottom: 12 },
  completionTitle: { fontSize: 28, fontFamily: FONTS.heading, color: COLORS.orange, marginBottom: 8 },
  completionXP: { fontSize: 18, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua, marginBottom: 28 },
  summaryCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 16, marginBottom: 28,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  summaryLabel: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary },
  summaryValue: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.white },

  secondaryAction: { alignItems: 'center', marginTop: 12, paddingVertical: 10 },
  secondaryText: { fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },

  // ── Share modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  modalTitle: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.white, marginBottom: 14 },
  targetRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  targetChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)',
  },
  targetActive: { borderColor: COLORS.orange, backgroundColor: 'rgba(232,143,36,0.12)' },
  targetText: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary },
  targetTextActive: { color: COLORS.orange },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14, fontSize: 13, fontFamily: FONTS.body,
    color: COLORS.white, minHeight: 80, textAlignVertical: 'top', marginBottom: 12,
  },
  photoButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingVertical: 14, marginBottom: 16,
  },
  photoButtonIcon: { fontSize: 18 },
  photoButtonText: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary },
  photoPreview: { alignItems: 'center', marginBottom: 16 },
  photoImage: { width: 120, height: 120, borderRadius: 12, marginBottom: 8 },
  photoRemove: { paddingVertical: 4 },
  photoRemoveText: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.coral },
});
