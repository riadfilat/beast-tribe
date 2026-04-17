import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../lib/constants';

interface CalendarEvent {
  id: string;
  title: string;
  sport: string;
  time: string;
}

interface DayEvents {
  dayLabel: string;    // "Mon", "Tue", etc.
  dateNum: number;     // 4, 5, 6...
  isToday: boolean;
  events: CalendarEvent[];
}

interface WeeklyEventCalendarProps {
  days: DayEvents[];
  onEventPress?: (eventId: string) => void;
}

const SPORT_ICONS: Record<string, string> = {
  running: 'walk',
  gym: 'barbell',
  cycling: 'bicycle',
  crossfit: 'fitness',
  swimming: 'water',
  yoga: 'body',
  hyrox: 'flash',
  default: 'calendar',
};

export function WeeklyEventCalendar({ days, onEventPress }: WeeklyEventCalendarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>THIS WEEK</Text>
        <Text style={styles.subtitle}>Your upcoming activities</Text>
      </View>

      <View style={styles.daysRow}>
        {days.map((day) => (
          <View key={day.dayLabel + day.dateNum} style={styles.dayColumn}>
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {day.dayLabel}
            </Text>
            <View style={[
              styles.dateCircle,
              day.isToday && styles.dateCircleToday,
              day.events.length > 0 && !day.isToday && styles.dateCircleHasEvent,
            ]}>
              <Text style={[
                styles.dateNum,
                day.isToday && styles.dateNumToday,
              ]}>
                {day.dateNum}
              </Text>
            </View>
            {day.events.length > 0 && (
              <View style={styles.eventDots}>
                {day.events.slice(0, 2).map((evt, i) => (
                  <View key={i} style={styles.eventDot} />
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Event cards for days with events */}
      {days.filter(d => d.events.length > 0).map((day) => (
        day.events.map((evt) => (
          <TouchableOpacity
            key={evt.id}
            style={styles.eventCard}
            activeOpacity={0.7}
            onPress={() => onEventPress?.(evt.id)}
          >
            <View style={styles.eventIconWrap}>
              <Ionicons
                name={(SPORT_ICONS[evt.sport.toLowerCase()] || SPORT_ICONS.default) as any}
                size={16}
                color={COLORS.orange}
              />
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={1}>{evt.title}</Text>
              <Text style={styles.eventTime}>{day.dayLabel} · {evt.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ))
      ))}

      {days.every(d => d.events.length === 0) && (
        <View style={styles.emptyRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No events this week — create or join one!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  dayLabel: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  dayLabelToday: {
    color: COLORS.orange,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dateCircleToday: {
    backgroundColor: COLORS.orange,
  },
  dateCircleHasEvent: {
    backgroundColor: 'rgba(232,143,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.3)',
  },
  dateNum: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.textSecondary,
  },
  dateNumToday: {
    color: COLORS.dark,
  },
  eventDots: {
    flexDirection: 'row',
    gap: 3,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.orange,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  eventIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(232,143,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  eventTime: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
});
