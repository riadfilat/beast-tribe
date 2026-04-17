import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Modal,
  TextInput, ScrollView, Image, Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../../src/components/ui';
import { useLogWorkout, useCreatePost } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { COLORS, FONTS } from '../../../src/lib/constants';

const REST_DURATIONS = [30, 45, 60, 90];
const DEFAULT_REST = 60;

// ─── Data types ───────────────────────────────────────────────────────────────

interface SubExercise {
  name: string;
  duration?: string;   // "1 min", "30 sec each"
  reps?: string;       // "10 reps", "5 each side"
  cues?: string;
}

interface WorkoutInstruction {
  step: number;
  title?: string;
  text: string;
  sets?: number;              // how many times to repeat the exercises array
  exercises?: SubExercise[];  // individual items within this step
  rest_between_sets?: number; // seconds of rest between each set repeat
  rest_seconds?: number;      // rest after the final set (before next step)
  is_warmup?: boolean;
  video_url?: string;
}

// A single item in the flat execution list
interface SessionItem {
  key: string;
  stepTitle: string;
  name: string;
  duration?: string;
  reps?: string;
  cues?: string;
  setNumber: number;
  totalSets: number;
  isWarmup: boolean;
  restAfter: number; // seconds; 0 = no rest
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isWarmupStep(step: WorkoutInstruction): boolean {
  return step.is_warmup === true || /warm/i.test(step.title || step.text);
}

function buildSessionItems(
  instructions: WorkoutInstruction[],
  includeWarmup: boolean,
): SessionItem[] {
  const items: SessionItem[] = [];

  for (const step of instructions) {
    if (isWarmupStep(step) && !includeWarmup) continue;

    // If no exercises sub-array: treat the whole step as one exercise
    const exercises: SubExercise[] = step.exercises?.length
      ? step.exercises
      : [{ name: step.title || step.text, cues: step.text }];

    const totalSets = step.sets || 1;
    const restBetweenSets = step.rest_between_sets ?? DEFAULT_REST;
    const restAfterStep = step.rest_seconds ?? 0;

    for (let setNum = 1; setNum <= totalSets; setNum++) {
      const isLastSet = setNum === totalSets;

      for (let exIdx = 0; exIdx < exercises.length; exIdx++) {
        const ex = exercises[exIdx];
        const isLastEx = exIdx === exercises.length - 1;

        let restAfter = 0;
        if (isLastEx && !isLastSet) restAfter = restBetweenSets;
        else if (isLastEx && isLastSet) restAfter = restAfterStep;

        items.push({
          key: `s${step.step}-set${setNum}-ex${exIdx}`,
          stepTitle: step.title || `Step ${step.step}`,
          name: ex.name,
          duration: ex.duration,
          reps: ex.reps,
          cues: ex.cues,
          setNumber: setNum,
          totalSets,
          isWarmup: isWarmupStep(step),
          restAfter,
        });
      }
    }
  }

  return items;
}

// ─── Segmented tracker ────────────────────────────────────────────────────────

interface TrackerProps {
  items: SessionItem[];
  currentIndex: number;
  phase: 'exercise' | 'rest';
}

function WorkoutTracker({ items, currentIndex, phase }: TrackerProps) {
  if (items.length === 0) return null;

  // Group items by stepTitle for visual breaks
  // Show all segments up to 40; overflow shown as "+N"
  const MAX_SEGS = 40;
  const visible = items.slice(0, MAX_SEGS);

  return (
    <View style={styles.trackerWrapper}>
      <View style={styles.trackerRow}>
        {visible.map((item, idx) => {
          // completed = already past this item, OR we're in rest after it
          const completed =
            idx < currentIndex ||
            (idx === currentIndex && phase === 'rest');
          const active = idx === currentIndex && phase === 'exercise';

          // small gap between different steps
          const prevItem = idx > 0 ? visible[idx - 1] : null;
          const isNewStep = prevItem && prevItem.stepTitle !== item.stepTitle;

          return (
            <React.Fragment key={item.key}>
              {isNewStep && <View style={styles.trackerGap} />}
              <View
                style={[
                  styles.trackerSeg,
                  completed && styles.trackerSegDone,
                  active && styles.trackerSegActive,
                  !completed && !active && styles.trackerSegUpcoming,
                ]}
              />
            </React.Fragment>
          );
        })}

        {items.length > MAX_SEGS && (
          <Text style={styles.trackerOverflow}>+{items.length - MAX_SEGS}</Text>
        )}
      </View>

      <View style={styles.trackerMeta}>
        <Text
          style={[
            styles.trackerPhaseLabel,
            phase === 'rest' && { color: COLORS.aqua },
          ]}
          numberOfLines={1}
        >
          {phase === 'rest'
            ? `REST  ·  NEXT: ${items[currentIndex + 1]?.name || 'Final step'}`
            : items[currentIndex]?.stepTitle?.toUpperCase()}
        </Text>
        <Text style={styles.trackerPos}>
          {currentIndex + 1} / {items.length}
        </Text>
      </View>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

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
    instructions?: string;
  }>();

  const { refreshProfile } = useAuth();
  const { logWorkout } = useLogWorkout();
  const { createPost, loading: posting } = useCreatePost();

  const workoutTitle = params.title || 'Workout';
  const durationMin = parseInt(params.duration_minutes || '30');
  const difficulty = params.difficulty || 'All levels';
  const xpReward = parseInt(params.xp || '100');

  const rawInstructions: WorkoutInstruction[] = params.instructions
    ? JSON.parse(params.instructions)
    : [];

  const instructions: WorkoutInstruction[] =
    rawInstructions.length > 0
      ? rawInstructions
      : [
          {
            step: 1,
            title: 'Warm-Up',
            text: 'Prepare your body for the workout',
            is_warmup: true,
            sets: 1,
            rest_seconds: 60,
            exercises: [
              { name: 'Light cardio', duration: '2 min', cues: 'Easy pace, gradually raise heart rate' },
              { name: 'Arm circles', duration: '30 sec each direction', cues: 'Progress from small to large' },
              { name: 'Leg swings', duration: '30 sec each leg', cues: 'Hold a wall, controlled arc' },
            ],
          },
          {
            step: 2,
            title: 'Main Set',
            text: 'Complete the workout',
            sets: 1,
            rest_seconds: 0,
            exercises: [
              { name: 'Complete the workout routine', cues: 'Follow proper form throughout' },
            ],
          },
          {
            step: 3,
            title: 'Cool-Down',
            text: 'Lower heart rate and stretch',
            sets: 1,
            exercises: [
              { name: 'Easy movement', duration: '2 min' },
              { name: 'Static stretching', duration: '3 min', cues: 'Hold each stretch 30–45 seconds' },
            ],
          },
        ];

  const hasWarmup = instructions.some(isWarmupStep);

  // ── Pre-session state ──
  const [sessionStarted, setSessionStarted] = useState(false);
  const [includeWarmup, setIncludeWarmup] = useState(true);

  // ── Session state ──
  const [items, setItems] = useState<SessionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<'exercise' | 'rest' | 'completed'>('exercise');
  const [restTime, setRestTime] = useState(DEFAULT_REST);
  const [earnedXP, setEarnedXP] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Share modal ──
  const [showShare, setShowShare] = useState(false);
  const [shareTarget, setShareTarget] = useState<'feed' | 'pack'>('feed');
  const [shareCaption, setShareCaption] = useState('');
  const [sharePhotoUri, setSharePhotoUri] = useState<string | null>(null);

  // ── Elapsed time ──
  const startTimeRef = useRef(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!sessionStarted || phase === 'completed') return;
    const tick = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [sessionStarted, phase]);

  // ── Rest countdown ──
  useEffect(() => {
    if (phase !== 'rest') return;
    timerRef.current = setInterval(() => {
      setRestTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          advanceToNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  function startSession() {
    const built = buildSessionItems(instructions, includeWarmup);
    setItems(built);
    setCurrentIdx(0);
    setPhase('exercise');
    startTimeRef.current = Date.now();
    setSessionStarted(true);
  }

  function advanceToNext() {
    setCurrentIdx(prev => {
      const next = prev + 1;
      if (next >= items.length) {
        handleComplete();
        return prev;
      }
      setPhase('exercise');
      return next;
    });
  }

  function handleCompleteExercise() {
    const item = items[currentIdx];
    if (!item) return;
    if (item.restAfter > 0) {
      setRestTime(item.restAfter);
      setPhase('rest');
    } else {
      const next = currentIdx + 1;
      if (next >= items.length) {
        handleComplete();
      } else {
        setCurrentIdx(next);
        setPhase('exercise');
      }
    }
  }

  function handleSkipRest() {
    if (timerRef.current) clearInterval(timerRef.current);
    const next = currentIdx + 1;
    if (next >= items.length) {
      handleComplete();
    } else {
      setCurrentIdx(next);
      setPhase('exercise');
    }
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
    refreshProfile?.();
  }

  function handleQuit() {
    Alert.alert('Quit workout?', "Your progress won't be saved.", [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: () => router.back() },
    ]);
  }

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
    if (!result.canceled && result.assets[0]) setSharePhotoUri(result.assets[0].uri);
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

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRE-SESSION SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (!sessionStarted) {
    const previewItems = buildSessionItems(instructions, includeWarmup);

    return (
      <SafeAreaView style={styles.container}>
        {/* Back button */}
        <View style={styles.preTopBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.preContainer}>
          {/* Header */}
          <Text style={styles.preSportLabel}>
            {(params.sport || 'workout').toUpperCase()}
          </Text>
          <Text style={styles.preTitle}>{workoutTitle}</Text>
          <View style={styles.preMeta}>
            <Text style={styles.preMetaItem}>⏱ {durationMin} min</Text>
            <Text style={styles.preMetaDot}>·</Text>
            <Text style={styles.preMetaItem}>{difficulty}</Text>
            <Text style={styles.preMetaDot}>·</Text>
            <Text style={styles.preMetaItem}>+{xpReward} XP</Text>
          </View>

          {/* Warm-up toggle */}
          {hasWarmup && (
            <View style={styles.warmupCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.warmupCardTitle}>Include Warm-Up</Text>
                <Text style={styles.warmupCardSub}>Recommended to prevent injury</Text>
              </View>
              <Switch
                value={includeWarmup}
                onValueChange={setIncludeWarmup}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(86,196,196,0.4)' }}
                thumbColor={includeWarmup ? COLORS.aqua : COLORS.textTertiary}
              />
            </View>
          )}

          {/* Workout plan */}
          <Text style={styles.preSectionLabel}>WORKOUT PLAN</Text>
          {instructions.map((step, idx) => {
            const skipped = isWarmupStep(step) && !includeWarmup;
            const exCount = step.exercises?.length || 1;
            const sets = step.sets || 1;

            return (
              <View
                key={idx}
                style={[styles.preStepRow, skipped && styles.preStepRowSkipped]}
              >
                {/* Step number */}
                <View style={[styles.preStepBullet, skipped && styles.preStepBulletSkipped]}>
                  <Text style={[styles.preStepBulletText, skipped && { opacity: 0.3 }]}>
                    {idx + 1}
                  </Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.preStepTitle, skipped && { opacity: 0.35 }]}>
                      {step.title || `Step ${idx + 1}`}
                    </Text>
                    {isWarmupStep(step) && (
                      <View style={styles.warmupPill}>
                        <Text style={styles.warmupPillText}>WARM-UP</Text>
                      </View>
                    )}
                    {skipped && (
                      <Text style={styles.skippedLabel}>skipped</Text>
                    )}
                  </View>
                  <Text style={[styles.preStepDetail, skipped && { opacity: 0.35 }]}>
                    {exCount} exercise{exCount !== 1 ? 's' : ''}
                    {sets > 1 ? ` · ${sets} sets` : ''}
                  </Text>

                  {/* Exercise preview */}
                  {!skipped && step.exercises && step.exercises.length > 0 && (
                    <View style={styles.exPreviewList}>
                      {step.exercises.slice(0, 4).map((ex, ei) => (
                        <Text key={ei} style={styles.exPreviewItem} numberOfLines={1}>
                          {ex.name}
                          {ex.duration ? `  ·  ${ex.duration}` : ex.reps ? `  ·  ${ex.reps}` : ''}
                        </Text>
                      ))}
                      {step.exercises.length > 4 && (
                        <Text style={styles.exPreviewMore}>
                          +{step.exercises.length - 4} more
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Totals */}
          <View style={styles.preTotalsRow}>
            <Text style={styles.preTotalsText}>
              {previewItems.length} total exercises
              {previewItems.filter(i => i.restAfter > 0).length > 0
                ? `  ·  ${previewItems.filter(i => i.restAfter > 0).length} rest periods`
                : ''}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.preBottomBar}>
          <Button title="Begin Workout" onPress={startSession} />
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLETED
  // ═══════════════════════════════════════════════════════════════════════════

  if (phase === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.completionContainer}>
          <Text style={styles.completionEmoji}>💪</Text>
          <Text style={styles.completionTitle}>Beast Mode!</Text>
          <Text style={styles.completionXP}>+{earnedXP} XP earned</Text>

          <View style={styles.summaryCard}>
            {(
              [
                ['Workout', workoutTitle],
                ['Duration', formatTime(elapsedSeconds)],
                ['Exercises', String(items.length)],
                ['Difficulty', difficulty],
              ] as [string, string][]
            ).map(([label, value]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}
          </View>

          <Button
            title="Share to Tribe"
            onPress={() => {
              setShareCaption(`Just crushed ${workoutTitle}! +${earnedXP} XP`);
              setShowShare(true);
            }}
          />
          <TouchableOpacity style={styles.secondaryAction} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Share modal */}
        <Modal visible={showShare} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Share your workout</Text>
              <View style={styles.targetRow}>
                {(['feed', 'pack'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.targetChip, shareTarget === t && styles.targetActive]}
                    onPress={() => setShareTarget(t)}
                  >
                    <Text style={[styles.targetText, shareTarget === t && styles.targetTextActive]}>
                      {t === 'feed' ? 'Public Feed' : 'My Pack'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.captionInput}
                placeholder="Say something about your workout..."
                placeholderTextColor={COLORS.textMuted}
                value={shareCaption}
                onChangeText={setShareCaption}
                multiline
                maxLength={300}
              />
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
              <Button title={posting ? 'Sharing…' : 'Share'} onPress={handleShare} disabled={posting} />
              <TouchableOpacity style={styles.secondaryAction} onPress={() => setShowShare(false)}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE SESSION
  // ═══════════════════════════════════════════════════════════════════════════

  const currentItem = items[currentIdx];
  const nextItem = items[currentIdx + 1];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleQuit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.quitText}>Quit</Text>
        </TouchableOpacity>
        <Text style={styles.elapsed}>{formatTime(elapsedSeconds)}</Text>
        <Text style={styles.stepCount}>{currentIdx + 1} / {items.length}</Text>
      </View>

      {/* ── Segmented tracker ── */}
      <WorkoutTracker
        items={items}
        currentIndex={currentIdx}
        phase={phase as 'exercise' | 'rest'}
      />

      {/* ═══════════ REST ═══════════ */}
      {phase === 'rest' && (
        <View style={styles.restContainer}>
          <Text style={styles.restLabel}>RECOVER</Text>
          <Text style={styles.restTimer}>{formatTime(restTime)}</Text>

          {nextItem && (
            <View style={styles.restNextCard}>
              <Text style={styles.restNextLabel}>NEXT UP</Text>
              <Text style={styles.restNextName}>{nextItem.name}</Text>
              {(nextItem.duration || nextItem.reps) && (
                <Text style={styles.restNextDetail}>
                  {nextItem.duration || nextItem.reps}
                </Text>
              )}
              {nextItem.totalSets > 1 && (
                <Text style={styles.restNextSet}>
                  Set {nextItem.setNumber} of {nextItem.totalSets}
                </Text>
              )}
            </View>
          )}

          {/* Rest duration chips */}
          <View style={styles.restOptions}>
            {REST_DURATIONS.map(sec => (
              <TouchableOpacity
                key={sec}
                style={[styles.restChip, restTime === sec && styles.restChipActive]}
                onPress={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setRestTime(sec);
                  timerRef.current = setInterval(() => {
                    setRestTime(prev => {
                      if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        advanceToNext();
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
      )}

      {/* ═══════════ EXERCISE ═══════════ */}
      {phase === 'exercise' && currentItem && (
        <>
          <ScrollView
            style={styles.exerciseScroll}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Set dots + label */}
            {currentItem.totalSets > 1 && (
              <View style={styles.setRow}>
                <View style={styles.setDots}>
                  {Array.from({ length: currentItem.totalSets }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.setDot,
                        i < currentItem.setNumber - 1 && styles.setDotDone,
                        i === currentItem.setNumber - 1 && styles.setDotActive,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.setLabel}>
                  SET {currentItem.setNumber} OF {currentItem.totalSets}
                </Text>
              </View>
            )}

            {/* Step / warmup tags */}
            <View style={styles.tagRow}>
              <View style={styles.stepTag}>
                <Text style={styles.stepTagText}>
                  {currentItem.stepTitle.toUpperCase()}
                </Text>
              </View>
              {currentItem.isWarmup && (
                <View style={styles.warmupTag}>
                  <Text style={styles.warmupTagText}>WARM-UP</Text>
                </View>
              )}
            </View>

            {/* Exercise name */}
            <Text style={styles.exerciseName}>{currentItem.name}</Text>

            {/* Duration / reps badge */}
            {(currentItem.duration || currentItem.reps) && (
              <View style={styles.measureBadge}>
                <Text style={styles.measureText}>
                  {currentItem.duration || currentItem.reps}
                </Text>
              </View>
            )}

            {/* Coaching cue */}
            {currentItem.cues && (
              <View style={styles.cueCard}>
                <Text style={styles.cueLabel}>COACHING CUE</Text>
                <Text style={styles.cueText}>{currentItem.cues}</Text>
              </View>
            )}

            {/* Rest preview badge */}
            {currentItem.restAfter > 0 && (
              <View style={styles.restPreviewBadge}>
                <Text style={styles.restPreviewText}>
                  {currentItem.restAfter}s rest follows
                </Text>
              </View>
            )}

            {/* Upcoming list */}
            {nextItem && (
              <View style={styles.upcomingSection}>
                <Text style={styles.upcomingLabel}>UP NEXT</Text>
                {items.slice(currentIdx + 1, currentIdx + 4).map((item, i) => (
                  <View key={item.key} style={styles.upcomingRow}>
                    <View style={styles.upcomingBullet}>
                      <Text style={styles.upcomingNum}>{currentIdx + 2 + i}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upcomingText} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.totalSets > 1 && (
                        <Text style={styles.upcomingSet}>
                          Set {item.setNumber}/{item.totalSets}
                        </Text>
                      )}
                    </View>
                    {(item.duration || item.reps) && (
                      <Text style={styles.upcomingMeasure}>
                        {item.duration || item.reps}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.bottomBar}>
            <Button
              title={currentIdx >= items.length - 1 ? 'Finish Workout  ✓' : 'Complete  ✓'}
              onPress={handleCompleteExercise}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Pre-session ──────────────────────────────────────────────────────────

  preTopBar: {
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8,
  },
  backText: { fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.aqua },

  preContainer: { paddingHorizontal: 20, paddingBottom: 100 },

  preSportLabel: {
    fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.orange,
    letterSpacing: 2, marginBottom: 6, marginTop: 8,
  },
  preTitle: {
    fontSize: 26, fontFamily: FONTS.heading, color: COLORS.textPrimary,
    marginBottom: 10, lineHeight: 32,
  },
  preMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  preMetaItem: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary },
  preMetaDot: { fontSize: 12, color: COLORS.textMuted },

  warmupCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(86,196,196,0.07)',
    borderWidth: 1, borderColor: 'rgba(86,196,196,0.2)',
    borderRadius: 14, padding: 14, marginBottom: 24, gap: 12,
  },
  warmupCardTitle: { fontSize: 14, fontFamily: FONTS.bodySemiBold, color: COLORS.textPrimary, marginBottom: 2 },
  warmupCardSub: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textTertiary },

  preSectionLabel: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary,
    letterSpacing: 1.5, marginBottom: 12,
  },

  preStepRow: {
    flexDirection: 'row', gap: 12, marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 12,
  },
  preStepRowSkipped: { opacity: 0.5 },
  preStepBullet: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(232,143,36,0.15)', alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  preStepBulletSkipped: { backgroundColor: 'rgba(255,255,255,0.05)' },
  preStepBulletText: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.orange },

  preStepTitle: {
    fontSize: 14, fontFamily: FONTS.bodySemiBold, color: COLORS.textPrimary, marginBottom: 2,
  },
  preStepDetail: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textTertiary, marginBottom: 6 },

  warmupPill: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    backgroundColor: 'rgba(86,196,196,0.12)', borderWidth: 1, borderColor: 'rgba(86,196,196,0.25)',
  },
  warmupPillText: { fontSize: 8, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua, letterSpacing: 0.5 },
  skippedLabel: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textMuted, fontStyle: 'italic' },

  exPreviewList: { gap: 3, marginTop: 2 },
  exPreviewItem: {
    fontSize: 11, fontFamily: FONTS.body, color: COLORS.textSecondary,
  },
  exPreviewMore: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 2 },

  preTotalsRow: {
    marginTop: 8, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  preTotalsText: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textTertiary, textAlign: 'center' },

  preBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },

  // ── Top bar ──────────────────────────────────────────────────────────────

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8,
  },
  quitText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.coral },
  elapsed: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.white },
  stepCount: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary },

  // ── Segmented tracker ────────────────────────────────────────────────────

  trackerWrapper: { paddingHorizontal: 16, paddingBottom: 12 },
  trackerRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap',
    marginBottom: 6, gap: 2,
  },
  trackerGap: { width: 5 },
  trackerSeg: { flex: 1, height: 5, borderRadius: 3, minWidth: 4 },
  trackerSegDone: { backgroundColor: 'rgba(232,143,36,0.5)' },
  trackerSegActive: { backgroundColor: COLORS.orange, height: 7, borderRadius: 4 },
  trackerSegUpcoming: { backgroundColor: 'rgba(255,255,255,0.1)' },
  trackerOverflow: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted, marginLeft: 4 },
  trackerMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackerPhaseLabel: {
    fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.orange,
    letterSpacing: 1, flex: 1,
  },
  trackerPos: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary },

  // ── Exercise screen ──────────────────────────────────────────────────────

  exerciseScroll: { flex: 1, paddingHorizontal: 16 },

  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  setDots: { flexDirection: 'row', gap: 5 },
  setDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  setDotDone: { backgroundColor: 'rgba(232,143,36,0.4)' },
  setDotActive: { backgroundColor: COLORS.orange, width: 10, height: 10, borderRadius: 5 },
  setLabel: {
    fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.orange, letterSpacing: 1,
  },

  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  stepTag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepTagText: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 0.8,
  },
  warmupTag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: 'rgba(86,196,196,0.1)', borderWidth: 1, borderColor: 'rgba(86,196,196,0.25)',
  },
  warmupTagText: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua, letterSpacing: 0.8,
  },

  exerciseName: {
    fontSize: 28, fontFamily: FONTS.heading, color: COLORS.textPrimary,
    lineHeight: 34, marginBottom: 14,
  },

  measureBadge: {
    alignSelf: 'flex-start', marginBottom: 16,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: 'rgba(232,143,36,0.1)',
    borderWidth: 1, borderColor: 'rgba(232,143,36,0.3)',
  },
  measureText: { fontSize: 15, fontFamily: FONTS.bodySemiBold, color: COLORS.orange },

  cueCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  cueLabel: {
    fontSize: 8, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary,
    letterSpacing: 1.5, marginBottom: 6,
  },
  cueText: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.textSecondary, lineHeight: 20 },

  restPreviewBadge: {
    alignSelf: 'flex-start', marginBottom: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, backgroundColor: 'rgba(86,196,196,0.08)',
    borderWidth: 1, borderColor: 'rgba(86,196,196,0.2)',
  },
  restPreviewText: { fontSize: 11, fontFamily: FONTS.bodyMedium, color: COLORS.aqua },

  upcomingSection: { marginTop: 4 },
  upcomingLabel: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary,
    letterSpacing: 1, marginBottom: 10,
  },
  upcomingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 10, opacity: 0.5,
  },
  upcomingBullet: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(86,196,196,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  upcomingNum: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua },
  upcomingText: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary },
  upcomingSet: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted },
  upcomingMeasure: { fontSize: 10, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },

  bottomBar: { paddingHorizontal: 16, paddingBottom: 16 },

  // ── Rest screen ──────────────────────────────────────────────────────────

  restContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  restLabel: {
    fontSize: 11, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua,
    letterSpacing: 4, marginBottom: 8,
  },
  restTimer: { fontSize: 80, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 20 },

  restNextCard: {
    width: '100%', backgroundColor: 'rgba(86,196,196,0.07)',
    borderWidth: 1, borderColor: 'rgba(86,196,196,0.15)',
    borderRadius: 14, padding: 14, marginBottom: 28, alignItems: 'center',
  },
  restNextLabel: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua,
    letterSpacing: 1.5, marginBottom: 6,
  },
  restNextName: {
    fontSize: 16, fontFamily: FONTS.heading, color: COLORS.textPrimary,
    textAlign: 'center', marginBottom: 4,
  },
  restNextDetail: {
    fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.orange, marginBottom: 4,
  },
  restNextSet: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary },

  restOptions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  restChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  restChipActive: { backgroundColor: 'rgba(86,196,196,0.15)', borderColor: COLORS.aqua },
  restChipText: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary },
  restChipTextActive: { color: COLORS.aqua },

  // ── Completion ───────────────────────────────────────────────────────────

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

  // ── Share modal ──────────────────────────────────────────────────────────

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  modalTitle: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 14 },
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
    color: COLORS.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: 12,
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
