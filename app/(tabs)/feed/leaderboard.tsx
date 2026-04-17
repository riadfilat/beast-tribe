import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, TierPill, FilterTabs } from '../../../src/components/ui';
import { COLORS, FONTS, Tier } from '../../../src/lib/constants';
import { useLeaderboard, useMyPack } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';

const TIME_TABS = ['Beast Score', 'This week', 'All time', 'My pack'];

interface LeaderEntry {
  rank: number;
  name: string;
  tier?: Tier;
  xp: number;
  isMe?: boolean;
}

// Empty — real leaderboard from Supabase
const DEMO_LEADERS: LeaderEntry[] = [];

// Map TIME_TABS index to timeRange parameter
function getTimeRange(index: number): string {
  switch (index) {
    case 0: return 'beast_score';
    case 1: return 'weekly';
    case 2: return 'all';
    case 3: return 'pack';
    default: return 'beast_score';
  }
}

export default function LeaderboardScreen() {
  const [timeTab, setTimeTab] = useState(0);

  const { user } = useAuth();
  const timeRange = getTimeRange(timeTab);
  const { data: myPackData } = useMyPack();
  const myPackId = myPackData?.pack?.id;

  const { data: leaderData, loading } = useLeaderboard(timeRange, myPackId);

  // Map Supabase data to leaderboard entries
  let leaders: LeaderEntry[];
  if (leaderData?.length) {
    if (timeRange === 'weekly') {
      // Aggregate XP per user from xp_transactions rows
      const userMap = new Map<string, { xp: number; profile: any }>();
      leaderData.forEach((tx: any) => {
        const p = tx.profile;
        if (!p) return;
        const pid = p.id;
        const existing = userMap.get(pid);
        if (existing) {
          existing.xp += tx.amount || 0;
        } else {
          userMap.set(pid, { xp: tx.amount || 0, profile: p });
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
    } else if (timeRange === 'beast_score') {
      // Beast Score leaderboard — profiles ordered by beast_score
      leaders = leaderData.map((p: any, index: number) => ({
        rank: index + 1,
        name: p.display_name || p.full_name || 'Beast',
        tier: p.tier as Tier | undefined,
        xp: Math.round(p.beast_score || 0),
        isMe: p.id === user?.id,
      }));
    } else if (timeRange === 'pack') {
      // Pack leaderboard without sport filter — data from pack_members
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
      // 'all' without sport filter — global profiles with total_xp
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

  // Find the current user's entry for the "Your rank" card
  const myEntry = leaders.find((e) => e.isMe);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Beast rank</Text>

        <FilterTabs tabs={TIME_TABS} activeIndex={timeTab} onTabPress={setTimeTab} size="small" />

        {/* Your rank card */}
        {myEntry && (
          <View style={styles.myRankCard}>
            <Text style={styles.myRankLabel}>Your rank</Text>
            <Text style={styles.myRankNumber}>#{myEntry.rank}</Text>
            <Text style={styles.myRankXP}>{myEntry.xp.toLocaleString()} {timeRange === 'beast_score' ? 'pts' : 'XP'}</Text>
          </View>
        )}

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
        ) : leaders.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary }}>
              No rankings yet for this sport
            </Text>
            <Text style={{ fontSize: 11, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 4 }}>
              Be the first to earn XP here
            </Text>
          </View>
        ) : (
          leaders.map((entry) => (
            <View key={`${entry.rank}-${entry.name}`} style={[styles.row, entry.isMe && styles.rowMe]}>
              <Text style={[styles.rank, entry.rank <= 3 ? styles.rankGold : styles.rankDim]}>
                {entry.rank}
              </Text>
              <Avatar name={entry.name} size={28} tier={entry.isMe ? (entry.tier || 'initiate') : undefined} />
              <View style={styles.nameContainer}>
                <Text style={[styles.name, entry.isMe && styles.nameMe]}>{entry.isMe ? 'You' : entry.name}</Text>
              </View>
              {entry.tier && <TierPill tier={entry.tier} size="small" />}
              <Text style={[styles.xp, entry.isMe && styles.xpMe]}>
                {timeRange === 'beast_score' ? entry.xp : entry.xp.toLocaleString()}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.resetNote}>
          {timeRange === 'beast_score' ? 'Ranked by 30-day consistency · Show up every day' : timeRange === 'weekly' ? 'Resets Monday · Top 3 = Beasts of the Week' : 'Ranked by lifetime XP'}
        </Text>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginTop: 8, marginBottom: 10 },
  myRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(232,143,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  myRankLabel: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textSecondary },
  myRankNumber: { fontSize: 20, fontFamily: FONTS.heading, color: COLORS.orange },
  myRankXP: { fontSize: 12, fontFamily: FONTS.heading, color: COLORS.aqua, marginLeft: 'auto' },
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
