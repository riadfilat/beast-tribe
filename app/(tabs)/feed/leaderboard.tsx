import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, TierPill, FilterTabs } from '../../../src/components/ui';
import { COLORS, FONTS, Tier } from '../../../src/lib/constants';
import { useLeaderboard, useMyPack } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';

const TIME_TABS = ['This week', 'All time', 'My pack'];
const SPORT_TABS = ['All', 'Running', 'Gym', 'Yoga'];

interface LeaderEntry {
  rank: number;
  name: string;
  tier?: Tier;
  xp: number;
  isMe?: boolean;
}

const DEMO_LEADERS: LeaderEntry[] = [
  { rank: 1, name: 'Mohammed K.', tier: 'untamed', xp: 4280 },
  { rank: 2, name: 'Layla A.', xp: 3920 },
  { rank: 3, name: 'Fahad H.', xp: 3510 },
  { rank: 7, name: 'You', tier: 'forged', xp: 2840, isMe: true },
  { rank: 8, name: 'Reem N.', xp: 2680 },
  { rank: 9, name: 'Tariq A.', xp: 2410 },
];

// Map TIME_TABS index to timeRange parameter
function getTimeRange(index: number): string {
  switch (index) {
    case 0: return 'weekly';
    case 1: return 'all';
    case 2: return 'pack';
    default: return 'all';
  }
}

export default function LeaderboardScreen() {
  const [timeTab, setTimeTab] = useState(0);
  const [sportTab, setSportTab] = useState(0);

  const { user } = useAuth();
  const timeRange = getTimeRange(timeTab);
  const { data: myPackData } = useMyPack();
  const myPackId = myPackData?.pack?.id;
  const { data: leaderData, loading } = useLeaderboard(timeRange, myPackId);

  // Map Supabase data to leaderboard entries depending on timeRange format
  let leaders: LeaderEntry[];
  if (leaderData?.length) {
    if (timeRange === 'weekly') {
      // Weekly data comes from xp_transactions with nested profile
      // Aggregate XP per user
      const userMap = new Map<string, { xp: number; profile: any }>();
      leaderData.forEach((tx: any) => {
        const p = tx.profile;
        if (!p) return;
        const existing = userMap.get(p.id);
        if (existing) {
          existing.xp += tx.amount || 0;
        } else {
          userMap.set(p.id, { xp: tx.amount || 0, profile: p });
        }
      });
      leaders = Array.from(userMap.values())
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 20)
        .map((entry, index) => ({
          rank: index + 1,
          name: entry.profile.display_name || entry.profile.full_name || 'Beast',
          tier: entry.profile.tier as Tier | undefined,
          xp: entry.xp,
          isMe: entry.profile.id === user?.id,
        }));
    } else if (timeRange === 'pack') {
      // Pack leaderboard — data from pack_members with nested profile
      leaders = leaderData.map((member: any, index: number) => {
        const p = member.profile;
        return {
          rank: index + 1,
          name: p?.display_name || p?.full_name || 'Beast',
          tier: p?.tier as Tier | undefined,
          xp: p?.total_xp || 0,
          isMe: p?.id === user?.id,
        };
      });
    } else {
      // 'all' — global profiles with total_xp
      leaders = leaderData.map((p: any, index: number) => ({
        rank: index + 1,
        name: p.display_name || p.full_name || 'Beast',
        tier: p.tier as Tier | undefined,
        xp: p.total_xp || 0,
        isMe: p.id === user?.id,
      }));
    }
  } else {
    leaders = DEMO_LEADERS;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Beast rank</Text>

        <FilterTabs tabs={TIME_TABS} activeIndex={timeTab} onTabPress={setTimeTab} size="small" />
        <FilterTabs tabs={SPORT_TABS} activeIndex={sportTab} onTabPress={setSportTab} size="small" />

        {loading ? (
          <ActivityIndicator color={COLORS.aqua} style={{ marginTop: 40 }} />
        ) : timeRange === 'pack' && !myPackId ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary }}>
              You're not in a pack yet
            </Text>
            <Text style={{ fontSize: 11, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 4 }}>
              Join or create a pack to see pack rankings
            </Text>
          </View>
        ) : (
          leaders.map((entry) => (
            <View key={`${entry.rank}-${entry.name}`} style={[styles.row, entry.isMe && styles.rowMe]}>
              <Text style={[styles.rank, entry.rank <= 3 ? styles.rankGold : styles.rankDim]}>
                {entry.rank}
              </Text>
              <Avatar name={entry.name} size={28} tier={entry.isMe ? (entry.tier || 'forged') : undefined} />
              <View style={styles.nameContainer}>
                <Text style={[styles.name, entry.isMe && styles.nameMe]}>{entry.isMe ? 'You' : entry.name}</Text>
              </View>
              {entry.tier && <TierPill tier={entry.tier} size="small" />}
              <Text style={[styles.xp, entry.isMe && styles.xpMe]}>{entry.xp.toLocaleString()}</Text>
            </View>
          ))
        )}

        <Text style={styles.resetNote}>Resets Monday · Top 3 = Beasts of the Week</Text>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 8, marginBottom: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowMe: {
    backgroundColor: 'rgba(232,143,36,0.06)', borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.25)', borderRadius: 12, paddingHorizontal: 10, marginVertical: 4,
    borderBottomWidth: 1,
  },
  rank: { width: 22, fontSize: 14, fontFamily: FONTS.heading, textAlign: 'center' },
  rankGold: { color: COLORS.orange },
  rankDim: { color: COLORS.textTertiary },
  nameContainer: { flex: 1 },
  name: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.white },
  nameMe: { fontFamily: FONTS.heading },
  xp: { fontSize: 12, fontFamily: FONTS.heading, color: COLORS.aqua },
  xpMe: { color: COLORS.orange },
  resetNote: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted, textAlign: 'center', marginTop: 12 },
});
