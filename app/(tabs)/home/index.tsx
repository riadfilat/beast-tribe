import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, TierPill, BeastIcon } from '../../../src/components/ui';
import { StatsGrid } from '../../../src/components/home/StatsGrid';
import { DailyGoalCard } from '../../../src/components/home/DailyGoalCard';
import { QuestCard } from '../../../src/components/home/QuestCard';
import { PackChallengeCard } from '../../../src/components/home/PackChallengeCard';
import { UpcomingEventCard } from '../../../src/components/home/UpcomingEventCard';
import { HabitChecklist } from '../../../src/components/habits/HabitChecklist';
import { WeeklyEventCalendar } from '../../../src/components/home/WeeklyEventCalendar';
import { COLORS, FONTS, TIERS, HABIT_DEFINITIONS, HABIT_COLORS } from '../../../src/lib/constants';
import { calculateLevel, calculateTier } from '../../../src/lib/xp';
import { getLocalEvents } from '../../../src/lib/localEventStore';
import {
  useProfile,
  useTodaySteps,
  useTodayQuest,
  useActivePackChallenge,
  useUpcomingEvents,
  useTodayNutrition,
  useJoinEvent,
  useUserHabits,
  useTodayHabitProgress,
  useLogHabit,
  useCheckPerfectDay,
} from '../../../src/hooks';

const OB_LOGO = require('../../../assets/images/ob-logo-icon.jpg');
const WOLF_IMG = require('../../../assets/images/animals/Wolf/1.png');

// Fallback defaults — replaced with real content before launch
const DEMO = {
  name: 'Beast',
  fullName: '',
  tier: 'initiate' as const,
  streak: 0,
  totalXP: 0,
  level: 1,
  steps: 0,
  stepGoal: 10000,
  quest: { title: 'Complete your first workout', xp: 200, description: 'Start your Beast Tribe journey with any workout — gym, run, or home session.' },
  pack: { a: '', b: '', aXP: 0, bXP: 0, daysLeft: 0 },
  event: {
    type: '',
    title: '',
    details: '',
    date: '',
    location: '',
  },
  nutritionCals: 0,
  nutritionGoal: 2200,
};

// Track joined events across navigations (persists while app is open)
const joinedEventIds = new Set<string>();

export default function HomeScreen() {
  const router = useRouter();
  const [eventJoining, setEventJoining] = useState(false);
  // Refresh local events when screen is focused
  const [focusKey, setFocusKey] = useState(0);
  useFocusEffect(useCallback(() => { setFocusKey(k => k + 1); }, []));
  // Check if user already joined (persists across navigations)
  const [eventJoined, setEventJoined] = useState(() => joinedEventIds.size > 0);

  const { profile, loading: profileLoading } = useProfile();
  const { data: stepData, loading: stepsLoading } = useTodaySteps();
  const { data: questData } = useTodayQuest();
  const { data: packData } = useActivePackChallenge();
  const { data: eventsData } = useUpcomingEvents(10);
  const { data: nutritionLogs } = useTodayNutrition();
  const { joinEvent } = useJoinEvent();
  const { data: userHabits } = useUserHabits();
  const { data: todayHabitLogs, refetch: refetchHabitLogs } = useTodayHabitProgress();
  const { logHabit } = useLogHabit();
  const { checkPerfectDay } = useCheckPerfectDay();

  const isLoading = profileLoading || stepsLoading;

  // Derive values with demo fallbacks
  const totalXP = profile?.total_xp ?? DEMO.totalXP;
  const tier = (profile?.tier ?? calculateTier(totalXP)) as import('../../../src/lib/constants').Tier;
  const tierConfig = TIERS[tier] || TIERS.initiate;
  const displayName = profile?.display_name ?? profile?.full_name ?? DEMO.name;
  const fullName = profile?.full_name ?? DEMO.fullName;
  const streak = profile?.current_streak ?? DEMO.streak;
  const level = calculateLevel(totalXP);

  const [manualSteps, setManualSteps] = useState<number | null>(null);
  const currentSteps = manualSteps ?? stepData?.steps ?? DEMO.steps;
  const stepGoal = stepData?.step_goal ?? DEMO.stepGoal;

  const questTitle = questData?.quest?.title ?? DEMO.quest.title;
  const questXP = questData?.quest?.xp_reward ?? DEMO.quest.xp;
  const questDesc = questData?.quest?.description ?? DEMO.quest.description;

  const packAName = packData?.pack_a?.name ?? DEMO.pack.a;
  const packBName = packData?.pack_b?.name ?? DEMO.pack.b;
  const packAXP = packData?.pack_a_xp ?? DEMO.pack.aXP;
  const packBXP = packData?.pack_b_xp ?? DEMO.pack.bXP;
  const packDaysLeft = packData
    ? Math.max(0, Math.ceil((new Date(packData.ends_at).getTime() - Date.now()) / 86400000))
    : DEMO.pack.daysLeft;
  const userPackIsA = packData
    ? profile?.pack_id === packData.pack_a_id
    : true;

  // Show locally created events first (newest), then DB events
  // Hide women-only events from male users
  const isMale = profile?.gender === 'male';
  const localEvts = getLocalEvents().filter(e => !isMale || !e.is_women_only);
  const firstLocalEvent = localEvts[0];
  const dbEvents = (eventsData || []).filter((e: any) => !isMale || !e.is_women_only);
  const dbEvent = dbEvents.length > 0 ? dbEvents[0] : null;
  // Prioritize local events so user sees what they just created
  const upcomingEvent = firstLocalEvent || dbEvent || null;
  const upcomingEventId = upcomingEvent?.id || '';

  const eventType = upcomingEvent?.sport?.name || upcomingEvent?.event_type || '';
  const eventTitle = upcomingEvent?.title || '';
  const eventDetails = upcomingEvent?.starts_at
    ? [
        new Date(upcomingEvent.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        new Date(upcomingEvent.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        upcomingEvent.location_name || upcomingEvent.gym_name,
      ].filter(Boolean).join(' · ')
    : '';
  const eventDate = upcomingEvent?.starts_at
    ? new Date(upcomingEvent.starts_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase() +
      ' · ' + new Date(upcomingEvent.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';
  const eventLocation = upcomingEvent?.location_name || upcomingEvent?.gym_name || '';

  // Habits
  const habitItems = (userHabits || []).map((uh: any) => {
    const def = uh.habit_definition;
    if (!def) return null;
    const log = (todayHabitLogs || []).find((l: any) => l.user_habit_id === uh.id);
    return {
      id: uh.id,
      icon: def.icon,
      label: def.label,
      current: log?.value ?? 0,
      target: uh.target,
      category: def.category,
      completed: (log?.value ?? 0) >= (def.frequency_type === 'daily' ? 1 : 1),
    };
  }).filter((x): x is NonNullable<typeof x> => x != null);

  // Track demo habit values locally so rings update
  const [demoHabitValues, setDemoHabitValues] = useState<Record<string, number>>({});

  // Demo habits if none set
  const displayHabits = habitItems.length > 0 ? habitItems : HABIT_DEFINITIONS.slice(0, 4).map((def, i) => {
    const demoId = `demo-${i}`;
    const demoVal = demoHabitValues[demoId] ?? 0;
    const current = demoVal || 0;
    return {
      id: demoId,
      icon: def.icon,
      label: def.label,
      current,
      target: def.default_target,
      category: def.category,
      completed: current >= (def.key === 'hit_steps' ? def.default_target : def.key === 'drink_water' ? def.default_target : 1),
    };
  });

  const isPerfectDay = displayHabits.length > 0 && displayHabits.every((h: any) => h.completed);

  // Habit value input modal state
  const [habitModal, setHabitModal] = useState<{ id: string; label: string; unit: string; icon: string } | null>(null);
  const [habitValueInput, setHabitValueInput] = useState('');

  // Map habit keys to their input config
  const HABIT_INPUT_CONFIG: Record<string, { unit: string; placeholder: string; icon: string }> = {
    hit_steps: { unit: 'steps', placeholder: 'e.g. 8500', icon: 'walk-outline' },
  };

  // Habits that navigate to a page instead of showing input
  const HABIT_NAV_CONFIG: Record<string, string> = {
    log_meals: '/(tabs)/home/nutrition',
    train_weekly: '/(tabs)/workouts', // Train → go to workouts/missions
  };

  // Habits that increment on each tap (quick-add)
  const HABIT_TAP_INCREMENT: Record<string, number> = {
    drink_water: 0.5, // +0.5L per tap
  };

  function handleHabitPress(habitId: string) {
    if (habitId.startsWith('demo-')) {
      const idx = parseInt(habitId.replace('demo-', ''));
      const def = HABIT_DEFINITIONS[idx];
      if (!def) return;

      // Navigate habits (e.g. Log Meals → nutrition page)
      if (HABIT_NAV_CONFIG[def.key]) {
        router.push(HABIT_NAV_CONFIG[def.key] as any);
        return;
      }
      // Tap-increment habits (e.g. Drink Water → +0.5L per tap)
      if (HABIT_TAP_INCREMENT[def.key]) {
        const increment = HABIT_TAP_INCREMENT[def.key];
        setDemoHabitValues(prev => ({ ...prev, [habitId]: (prev[habitId] ?? 0) + increment }));
        return;
      }
      // Input modal habits (e.g. Hit Steps)
      if (HABIT_INPUT_CONFIG[def.key]) {
        const config = HABIT_INPUT_CONFIG[def.key];
        setHabitModal({ id: habitId, label: def.label, unit: config.unit, icon: config.icon });
        setHabitValueInput('');
        return;
      }
      // Toggle habits (Train)
      setDemoHabitValues(prev => ({ ...prev, [habitId]: (prev[habitId] ?? 0) ? 0 : 1 }));
      return;
    }

    // Real habits from Supabase
    const userHabit = (userHabits || []).find((uh: any) => uh.id === habitId);
    const defKey = userHabit?.habit_definition?.key;
    if (defKey && HABIT_NAV_CONFIG[defKey]) {
      router.push(HABIT_NAV_CONFIG[defKey] as any);
      return;
    }
    if (defKey && HABIT_TAP_INCREMENT[defKey]) {
      (async () => {
        await logHabit(habitId, HABIT_TAP_INCREMENT[defKey]);
        refetchHabitLogs();
      })();
      return;
    }
    if (defKey && HABIT_INPUT_CONFIG[defKey]) {
      const config = HABIT_INPUT_CONFIG[defKey];
      setHabitModal({ id: habitId, label: userHabit.habit_definition.label, unit: config.unit, icon: config.icon });
      setHabitValueInput('');
      return;
    }

    // Simple toggle habits (train, log meals, attend events)
    (async () => {
      await logHabit(habitId, 1);
      refetchHabitLogs();
      if (userHabits && todayHabitLogs) {
        await checkPerfectDay(userHabits, todayHabitLogs);
      }
    })();
  }

  async function handleHabitValueSave() {
    if (!habitModal || !habitValueInput.trim()) return;
    const value = parseFloat(habitValueInput);
    if (isNaN(value) || value <= 0) return;

    if (habitModal.id.startsWith('demo-')) {
      // Demo mode — update the habit ring and steps tracker
      setDemoHabitValues(prev => ({ ...prev, [habitModal.id]: value }));
      if (habitModal.unit === 'steps') {
        setManualSteps(value);
      }
      setHabitModal(null);
      return;
    }

    await logHabit(habitModal.id, value);
    refetchHabitLogs();
    if (userHabits && todayHabitLogs) {
      await checkPerfectDay(userHabits, todayHabitLogs);
    }
    setHabitModal(null);
  }

  const nutritionCals = nutritionLogs && nutritionLogs.length > 0
    ? nutritionLogs.reduce((sum: number, log: any) => sum + (log.calories ?? 0), 0)
    : DEMO.nutritionCals;
  const nutritionGoal = DEMO.nutritionGoal;

  // Build weekly calendar data
  const weekDays = (() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // Monday start
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dbEvents = eventsData || [];
    const localEvts = getLocalEvents();
    const allEvents = [...dbEvents, ...localEvts];
    const todayIdx = (dayOfWeek + 6) % 7; // Monday=0 index for today

    // Check if any real events fall within this week
    const thisWeekEvents = allEvents.filter((evt: any) => {
      const d = new Date(evt.starts_at);
      return d >= startOfWeek && d < endOfWeek;
    });
    const hasRealWeekEvents = thisWeekEvents.length > 0;

    // Placeholder — will be populated with real events from DB
    const demoCalendarEvents: { id: string; title: string; sport: string; time: string; dayIdx: number }[] = [];

    // If the user joined the home event, show it on today
    const joinedEvent = eventJoined ? {
      id: upcomingEvent?.id || 'demo-joined',
      title: eventTitle.replace('\n', ' '),
      sport: eventType,
      time: eventDate?.split('·')[1]?.trim() || '6:00 AM',
    } : null;

    return dayLabels.map((label, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === today.toISOString().split('T')[0];

      // Real events from DB for this day
      const dayEvents = allEvents
        .filter((evt: any) => {
          const evtDate = new Date(evt.starts_at).toISOString().split('T')[0];
          return evtDate === dateStr;
        })
        .map((evt: any) => ({
          id: evt.id,
          title: evt.title,
          sport: evt.sport?.name || 'Event',
          time: new Date(evt.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        }));

      // Build final events list
      const events = [...dayEvents];

      // Add demo events if no real events this week
      if (!hasRealWeekEvents) {
        demoCalendarEvents.forEach(de => {
          if (de.dayIdx === i) events.push({ id: de.id, title: de.title, sport: de.sport, time: de.time });
        });
      }

      // Add joined event on today
      if (isToday && joinedEvent && !events.find(e => e.id === joinedEvent.id)) {
        events.push(joinedEvent);
      }

      return {
        dayLabel: label,
        dateNum: date.getDate(),
        isToday,
        events,
      };
    });
  })();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* App Header */}
        <View style={styles.appHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <BeastIcon size={24} color={COLORS.orange} />
              <Text style={styles.appTitle}>BEAST TRIBE</Text>
            </View>
            <View style={styles.avatarWrap}>
              <Avatar name={fullName} size={38} tier={tier} backgroundColor={COLORS.dark} />
              <TierPill tier={tier} size="small" />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.statusLabel}>STATUS: {tierConfig.shortLabel.toUpperCase()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Ionicons name="notifications" size={20} color={COLORS.orange} />
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <Text style={styles.welcomeLine1}>Welcome back,</Text>
        <Text style={styles.welcomeLine2}>{displayName}</Text>

        {/* Daily Habits */}
        <HabitChecklist
          habits={displayHabits}
          onHabitPress={handleHabitPress}
          isPerfectDay={isPerfectDay}
        />

        {/* Weekly Event Calendar */}
        <WeeklyEventCalendar
          days={weekDays}
          onEventPress={(eventId) => {
            router.push({
              pathname: '/(tabs)/home/activity-chat',
              params: { eventId, eventTitle: weekDays.flatMap(d => d.events).find(e => e.id === eventId)?.title || 'Event' },
            });
          }}
        />

        {/* Stats: Streak + XP */}
        <StatsGrid streak={streak} totalXP={totalXP} level={level} />

        {/* Beast Level card */}
        <TouchableOpacity
          style={styles.levelCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/home/levels')}
        >
          <View style={styles.levelCircle}>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>BEAST LEVEL</Text>
            <Text style={styles.levelSub}>Top 2% of {tierConfig.shortLabel} rank</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Daily Goal */}
        <DailyGoalCard
          currentSteps={currentSteps}
          goalSteps={stepGoal}
          xpReward={200}
          onUpdateSteps={(steps) => setManualSteps(steps)}
        />

        {/* Active Challenge */}
        <QuestCard title={questTitle} xpReward={questXP} description={questDesc} />

        {/* Performance Tracker */}
        <TouchableOpacity
          style={styles.trackerRow}
          onPress={() => router.push('/(tabs)/home/analytics')}
          activeOpacity={0.7}
        >
          <Ionicons name="analytics-outline" size={22} color={COLORS.aqua} />
          <Text style={styles.trackerTitle}>PERFORMANCE TRACKER</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Nutrition Tracker */}
        <TouchableOpacity
          style={styles.trackerRow}
          onPress={() => router.push('/(tabs)/home/nutrition')}
          activeOpacity={0.7}
        >
          <Ionicons name="nutrition-outline" size={22} color={COLORS.green} />
          <Text style={styles.trackerTitle}>NUTRITION TRACKER</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Pack section */}
        {packData ? (
          <PackChallengeCard
            packAName={packAName}
            packBName={packBName}
            packAXP={packAXP}
            packBXP={packBXP}
            daysLeft={packDaysLeft}
            userPackIsA={userPackIsA}
          />
        ) : (
          <View style={styles.packCta}>
            <View style={styles.packCtaIconWrap}>
              <Ionicons name="people-outline" size={24} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.packCtaTitle}>JOIN A PACK</Text>
            <Text style={styles.packCtaSub}>Train better with a tribe. Shared goals, shared glory.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile/pack')} activeOpacity={0.7}>
              <Text style={styles.packCtaLink}>BROWSE PACKS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Event — only show if real event exists */}
        {(upcomingEvent || eventTitle) ? <UpcomingEventCard
          type={eventType}
          title={eventTitle}
          details={eventDetails}
          date={eventDate}
          location={eventLocation}
          joined={eventJoined || upcomingEvent?.joined === true}
          joining={eventJoining}
          imageUrl={upcomingEvent?.image_url || undefined}
          onJoin={async () => {
            if (eventJoined || eventJoining) return;
            const eid = upcomingEvent?.id || 'demo-event';
            setEventJoining(true);
            try {
              if (upcomingEvent?.id) {
                await joinEvent(upcomingEvent.id);
              } else {
                await new Promise(r => setTimeout(r, 500));
              }
              setEventJoined(true);
              joinedEventIds.add(eid);
              // Navigate to event page after joining
              router.push({
                pathname: '/(tabs)/home/activity-chat',
                params: { eventId: eid, eventTitle: eventTitle.replace('\n', ' ') },
              });
            } finally {
              setEventJoining(false);
            }
          }}
          onPress={() => router.push({
            pathname: '/(tabs)/home/activity-chat',
            params: {
              eventId: upcomingEvent?.id || 'demo-event',
              eventTitle: eventTitle,
            },
          })}
        /> : null}

        {/* Create Activity CTA */}
        <TouchableOpacity
          style={styles.createActivityCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/home/create-activity')}
        >
          <View style={styles.createActivityIcon}>
            <Ionicons name="add" size={22} color={COLORS.orange} />
          </View>
          <View style={styles.createActivityText}>
            <Text style={styles.createActivityTitle}>Organize a Tribe Activity</Text>
            <Text style={styles.createActivitySub}>Rally the tribe for a workout, run, or find a coach</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Habit value input modal */}
      <Modal visible={!!habitModal} transparent animationType="fade">
        <TouchableOpacity style={styles.habitModalOverlay} activeOpacity={1} onPress={() => setHabitModal(null)}>
          <View style={styles.habitModalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.habitModalIcon}>
              <Ionicons name={(habitModal?.icon || 'walk-outline') as any} size={28} color={COLORS.orange} />
            </View>
            <Text style={styles.habitModalTitle}>{habitModal?.label}</Text>
            <Text style={styles.habitModalSub}>Enter today's {habitModal?.unit}</Text>
            <TextInput
              style={styles.habitModalInput}
              placeholder={habitModal?.unit === 'steps' ? 'e.g. 8500' : 'e.g. 2.5'}
              placeholderTextColor={COLORS.textMuted}
              value={habitValueInput}
              onChangeText={setHabitValueInput}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.habitModalUnit}>{habitModal?.unit}</Text>
            <TouchableOpacity
              style={[styles.habitModalSaveBtn, !habitValueInput.trim() && { opacity: 0.4 }]}
              onPress={handleHabitValueSave}
              disabled={!habitValueInput.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.habitModalSaveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setHabitModal(null)} style={styles.habitModalCancelBtn}>
              <Text style={styles.habitModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* App Header */
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 4,
  },
  headerTextCol: {},
  statusLabel: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  appTitle: {
    fontSize: 15,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232,143,36,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Welcome */
  welcomeLine1: {
    fontSize: 26,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
  },
  welcomeLine2: {
    fontSize: 26,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
    fontStyle: 'italic',
    marginBottom: 16,
  },

  /* Beast Level card */
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232,143,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.25)',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.orange,
    backgroundColor: 'rgba(232,143,36,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  levelSub: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 1,
  },

  /* Tracker rows */
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  trackerTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  /* Pack CTA */
  packCta: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  packCtaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  packCtaTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  packCtaSub: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
    maxWidth: 240,
  },
  packCtaLink: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.aqua,
    letterSpacing: 0.5,
  },

  /* Event Chat Link */
  eventChatLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(86,196,196,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(86,196,196,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  eventChatText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.aqua,
  },

  /* Create Activity CTA */
  createActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  createActivityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(232,143,36,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createActivityText: {
    flex: 1,
  },
  createActivityTitle: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  createActivitySub: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  /* Habit value modal */
  habitModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  habitModalSheet: {
    width: '80%', backgroundColor: COLORS.background, borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  habitModalIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(232,143,36,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  habitModalTitle: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 4 },
  habitModalSub: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 16 },
  habitModalInput: {
    width: '100%', backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.orange,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 28, fontFamily: FONTS.heading, color: COLORS.orange, textAlign: 'center',
  },
  habitModalUnit: {
    fontSize: 11, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 6,
  },
  habitModalSaveBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.orange, alignItems: 'center', marginTop: 16,
  },
  habitModalSaveText: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.dark },
  habitModalCancelBtn: { paddingVertical: 10, marginTop: 4 },
  habitModalCancelText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
});
