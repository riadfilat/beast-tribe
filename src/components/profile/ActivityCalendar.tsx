import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../lib/constants';
import { useMonthlyActivity, useSaveJournal, DayActivity } from '../../hooks';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getActivityLevel(day?: DayActivity): 'none' | 'low' | 'high' {
  if (!day) return 'none';
  const total = day.workouts + day.habits + day.posts + day.events;
  if (total === 0) return 'none';
  if (total >= 3) return 'high';
  return 'low';
}

interface ActivityCalendarProps {
  streak?: number;
}

export function ActivityCalendar({ streak = 0 }: ActivityCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [journalText, setJournalText] = useState('');

  const { data: activityData, loading } = useMonthlyActivity(viewYear, viewMonth);
  const { saveJournal, loading: savingJournal } = useSaveJournal();
  // Local journal cache so saved entries show immediately without refetch
  const [localJournals, setLocalJournals] = useState<Record<string, string>>({});

  // Calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const todayStr = today.toISOString().split('T')[0];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Stats for the month
  const activeDays = Object.values(activityData).filter(d => (d.workouts + d.habits + d.posts + d.events) > 0).length;
  const totalDays = Object.keys(activityData).length;

  function navigateMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  }

  function handleDayPress(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    // Load journal from local cache first, then from activity data
    setJournalText(localJournals[dateStr] ?? activityData[dateStr]?.journal ?? '');
  }

  async function handleSaveJournal() {
    if (!selectedDate) return;
    // Save locally so it persists without refetch
    setLocalJournals(prev => ({ ...prev, [selectedDate]: journalText }));
    await saveJournal(selectedDate, journalText);
    setSelectedDate(null);
  }

  const selectedDayData = selectedDate ? {
    ...(activityData[selectedDate] || { workouts: 0, habits: 0, posts: 0, events: 0 }),
    journal: localJournals[selectedDate] ?? activityData[selectedDate]?.journal,
  } : null;
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>MY JOURNEY</Text>
          {streak > 0 && (
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={14} color={COLORS.orange} />
              <Text style={styles.streakText}>{streak} day streak</Text>
            </View>
          )}
        </View>
        <Text style={styles.activeCount}>{activeDays}/{totalDays || daysInMonth} active</Text>
      </View>

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
        <TouchableOpacity
          onPress={() => navigateMonth(1)}
          disabled={isCurrentMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? COLORS.textMuted : COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.dayLabelCell}>
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {calendarDays.map((day, i) => {
          if (day === null) return <View key={`empty-${i}`} style={styles.cell} />;

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const isFuture = new Date(dateStr) > today;
          const dayData = activityData[dateStr];
          const level = isFuture ? 'none' : getActivityLevel(dayData);
          const hasJournal = !!(localJournals[dateStr] || dayData?.journal);

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.cell,
                isToday && styles.cellToday,
                level === 'low' && styles.cellActive,
                level === 'high' && styles.cellHighActive,
                level === 'none' && !isFuture && !isToday && styles.cellInactive,
              ]}
              onPress={() => !isFuture && handleDayPress(day)}
              disabled={isFuture}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.cellText,
                isToday && styles.cellTextToday,
                level !== 'none' && styles.cellTextActive,
                isFuture && styles.cellTextFuture,
              ]}>
                {day}
              </Text>
              {hasJournal && <View style={styles.journalDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellInactive]} />
          <Text style={styles.legendText}>No activity</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellActive]} />
          <Text style={styles.legendText}>Active</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellHighActive]} />
          <Text style={styles.legendText}>Beast mode</Text>
        </View>
      </View>

      {/* Day Detail Modal */}
      <Modal visible={!!selectedDate} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedDate(null)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />

            {/* Date header */}
            <Text style={styles.modalDate}>
              {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
            </Text>

            {/* Activity summary */}
            {selectedDayData && (selectedDayData.workouts + selectedDayData.habits + selectedDayData.posts + selectedDayData.events) > 0 ? (
              <View style={styles.activityList}>
                {selectedDayData.workouts > 0 && (
                  <View style={styles.activityRow}>
                    <Ionicons name="barbell" size={16} color={COLORS.orange} />
                    <Text style={styles.activityText}>{selectedDayData.workouts} workout{selectedDayData.workouts > 1 ? 's' : ''} completed</Text>
                  </View>
                )}
                {selectedDayData.habits > 0 && (
                  <View style={styles.activityRow}>
                    <Ionicons name="checkbox" size={16} color={COLORS.green} />
                    <Text style={styles.activityText}>{selectedDayData.habits} habit{selectedDayData.habits > 1 ? 's' : ''} logged</Text>
                  </View>
                )}
                {selectedDayData.events > 0 && (
                  <View style={styles.activityRow}>
                    <Ionicons name="calendar" size={16} color={COLORS.aqua} />
                    <Text style={styles.activityText}>{selectedDayData.events} event{selectedDayData.events > 1 ? 's' : ''} joined</Text>
                  </View>
                )}
                {selectedDayData.posts > 0 && (
                  <View style={styles.activityRow}>
                    <Ionicons name="chatbubble" size={16} color={COLORS.coral} />
                    <Text style={styles.activityText}>{selectedDayData.posts} post{selectedDayData.posts > 1 ? 's' : ''} shared</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noActivity}>
                <Ionicons name="moon-outline" size={24} color={COLORS.textMuted} />
                <Text style={styles.noActivityText}>Rest day — no activity logged</Text>
              </View>
            )}

            {/* Journal */}
            <Text style={styles.journalLabel}>JOURNAL</Text>
            <TextInput
              style={styles.journalInput}
              placeholder="Write about your day..."
              placeholderTextColor={COLORS.textMuted}
              value={journalText}
              onChangeText={setJournalText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />

            <TouchableOpacity
              style={[styles.saveBtn, !journalText.trim() && { opacity: 0.4 }]}
              onPress={handleSaveJournal}
              disabled={savingJournal || !journalText.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="bookmark" size={16} color={COLORS.dark} />
              <Text style={styles.saveBtnText}>{savingJournal ? 'Saving...' : 'Save Journal'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.white },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  streakText: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: COLORS.orange },
  activeCount: { fontSize: 11, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, paddingHorizontal: 4,
  },
  monthLabel: { fontSize: 15, fontFamily: FONTS.heading, color: COLORS.white },

  dayLabelsRow: { flexDirection: 'row', marginBottom: 4 },
  dayLabelCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted, letterSpacing: 0.5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, position: 'relative',
  },
  cellToday: { borderWidth: 2, borderColor: COLORS.orange },
  cellActive: { backgroundColor: 'rgba(98,183,151,0.15)' },
  cellHighActive: { backgroundColor: 'rgba(98,183,151,0.35)' },
  cellInactive: { backgroundColor: 'rgba(239,83,80,0.06)' },
  cellText: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary },
  cellTextToday: { color: COLORS.orange, fontFamily: FONTS.heading },
  cellTextActive: { color: COLORS.green },
  cellTextFuture: { color: COLORS.textMuted, opacity: 0.3 },
  journalDot: {
    position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.aqua,
  },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalDate: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 16 },

  activityList: { gap: 10, marginBottom: 20 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.white },

  noActivity: { alignItems: 'center', gap: 8, marginBottom: 20, paddingVertical: 12 },
  noActivityText: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted },

  journalLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 8 },
  journalInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minHeight: 100,
    fontSize: 14, fontFamily: FONTS.body, color: COLORS.textPrimary, marginBottom: 14,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 14,
  },
  saveBtnText: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.dark },
  closeBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  closeBtnText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
});
