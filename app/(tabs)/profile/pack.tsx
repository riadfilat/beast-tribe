import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, TierPill, Button } from '../../../src/components/ui';
import { COLORS, FONTS } from '../../../src/lib/constants';
import {
  useMyPack, usePackMembers, useJoinPackByCode, useLeavePack,
  usePackInvites, useRespondToInvite, usePackEventRSVPs,
} from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

const ANIMAL_EMOJIS: Record<string, string> = {
  wolf: '🐺', eagle: '🦅', tiger: '🐯', rhino: '🦏',
};

export default function PackScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: membership, loading: packLoading, refetch: refetchPack } = useMyPack();
  const pack = membership?.pack;
  const { data: members, loading: membersLoading, refetch: refetchMembers } = usePackMembers(pack?.id);
  const { data: invites, refetch: refetchInvites } = usePackInvites();
  const { respond: respondToInvite } = useRespondToInvite();

  // Join by code
  const [joinCode, setJoinCode] = useState('');
  const { joinPack, loading: joining, error: joinError } = useJoinPackByCode();
  const { leavePack, loading: leaving } = useLeavePack();

  async function handleJoinByCode() {
    if (!joinCode.trim()) return;
    const result = await joinPack(joinCode);
    if (result) {
      setJoinCode('');
      refetchPack();
    }
  }

  async function handleAcceptInvite(inviteId: string, packId: string) {
    await respondToInvite(inviteId, packId, true);
    refetchInvites();
    refetchPack();
  }

  async function handleDeclineInvite(inviteId: string, packId: string) {
    await respondToInvite(inviteId, packId, false);
    refetchInvites();
  }

  async function handleShareCode() {
    if (!pack?.invite_code) return;
    await Share.share({
      message: `Join my pack "${pack.name}" on Beast Tribe! Use code: ${pack.invite_code}`,
    });
  }

  async function handleLeavePack() {
    if (!pack?.id) return;
    Alert.alert('Leave Pack', `Are you sure you want to leave ${pack.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          await leavePack(pack.id);
          router.back();
        }
      },
    ]);
  }

  if (packLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // USER HAS A PACK
  // ==========================================
  if (pack) {
    const isLeader = membership?.role === 'leader';
    const animalEmoji = ANIMAL_EMOJIS[pack.animal?.toLowerCase()] || '🐾';

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Pack header */}
          <View style={styles.packHeader}>
            <Text style={styles.packEmoji}>{animalEmoji}</Text>
            <Text style={styles.packName}>{pack.name}</Text>
            {isLeader && <Text style={styles.leaderBadge}>LEADER</Text>}
          </View>

          {/* Invite code card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>INVITE CODE</Text>
            <Text style={styles.codeValue}>{pack.invite_code}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareCode} activeOpacity={0.7}>
              <Text style={styles.shareText}>Share with friends</Text>
            </TouchableOpacity>
          </View>

          {/* Invite button */}
          {isLeader && (
            <Button
              title="Invite Friends"
              onPress={() => router.push({ pathname: '/(tabs)/profile/pack-invite', params: { packId: pack.id } })}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Members */}
          <Text style={styles.sectionLabel}>PACK MEMBERS ({members?.length || 0})</Text>
          {membersLoading ? (
            <ActivityIndicator color={COLORS.aqua} style={{ marginVertical: 20 }} />
          ) : (
            (members || []).map((m: any) => {
              const p = m.profile;
              if (!p) return null;
              return (
                <View key={m.id} style={styles.memberRow}>
                  <Avatar name={p.display_name || p.full_name || 'Beast'} size={32} tier={p.tier} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {p.display_name || p.full_name}
                      {p.id === user?.id && <Text style={styles.youTag}> (you)</Text>}
                    </Text>
                    <Text style={styles.memberXP}>{(p.total_xp || 0).toLocaleString()} XP</Text>
                  </View>
                  <TierPill tier={p.tier || 'raw'} size="small" />
                  {m.role === 'leader' && <Text style={styles.leaderTag}>Leader</Text>}
                </View>
              );
            })
          )}

          {/* Pack stats */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{members?.length || 0}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(members || []).reduce((sum: number, m: any) => sum + (m.profile?.total_xp || 0), 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </View>

          {/* Weekly Activity Calendar */}
          <PackWeekCalendar packId={pack.id} members={members || []} />

          {/* Upcoming Event Attendance */}
          <PackEventAttendance packId={pack.id} />

          {/* Leave pack */}
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeavePack} disabled={leaving}>
            <Text style={styles.leaveText}>{leaving ? 'Leaving...' : 'Leave Pack'}</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // USER HAS NO PACK
  // ==========================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Pack</Text>
        <Text style={styles.subtitle}>Create or join a pack to compete with friends</Text>

        {/* Create pack */}
        <TouchableOpacity
          style={styles.ctaCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/profile/pack-create')}
        >
          <Text style={styles.ctaEmoji}>🐺</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Create a Pack</Text>
            <Text style={styles.ctaSub}>Pick a name and mascot, invite your friends</Text>
          </View>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>

        {/* Join by code */}
        <View style={styles.joinSection}>
          <Text style={styles.joinLabel}>Have an invite code?</Text>
          <View style={styles.joinRow}>
            <TextInput
              style={styles.joinInput}
              placeholder="Enter code"
              placeholderTextColor={COLORS.textMuted}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.joinButton, (!joinCode.trim() || joining) && { opacity: 0.5 }]}
              onPress={handleJoinByCode}
              disabled={!joinCode.trim() || joining}
            >
              <Text style={styles.joinButtonText}>{joining ? '...' : 'Join'}</Text>
            </TouchableOpacity>
          </View>
          {joinError && <Text style={styles.errorText}>{joinError}</Text>}
        </View>

        {/* Pending invites */}
        {invites && invites.length > 0 && (
          <View style={styles.invitesSection}>
            <Text style={styles.sectionLabel}>PENDING INVITES</Text>
            {invites.map((inv: any) => (
              <View key={inv.id} style={styles.inviteRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invitePack}>{inv.pack?.name}</Text>
                  <Text style={styles.inviteFrom}>From {inv.inviter?.display_name || 'Beast'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptInvite(inv.id, inv.pack_id)}
                >
                  <Text style={styles.acceptText}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleDeclineInvite(inv.id, inv.pack_id)}
                >
                  <Text style={styles.declineText}>Pass</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// PACK WEEK CALENDAR
// ==========================================
function PackWeekCalendar({ packId, members }: { packId: string; members: any[] }) {
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [activityMap, setActivityMap] = useState<Record<string, Set<number>>>({});
  const [loading, setLoading] = useState(true);

  // Get start of current week
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || members.length === 0) {
      // Demo data
      const demo: Record<string, Set<number>> = {};
      members.forEach((m: any) => {
        const uid = m.profile?.id || m.user_id;
        const days = new Set<number>();
        // Random 2-4 days for demo
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) days.add(Math.floor(Math.random() * 7));
        demo[uid] = days;
      });
      setActivityMap(demo);
      setLoading(false);
      return;
    }

    const memberIds = members.map((m: any) => m.user_id).filter(Boolean);
    if (memberIds.length === 0) { setLoading(false); return; }

    (async () => {
      const { data: logs } = await supabase.from('workout_logs')
        .select('user_id, completed_at')
        .in('user_id', memberIds)
        .gte('completed_at', weekStart.toISOString());

      const map: Record<string, Set<number>> = {};
      (logs || []).forEach((log: any) => {
        const day = new Date(log.completed_at).getDay();
        if (!map[log.user_id]) map[log.user_id] = new Set();
        map[log.user_id].add(day);
      });
      setActivityMap(map);
      setLoading(false);
    })();
  }, [packId, members.length]);

  if (loading) {
    return <ActivityIndicator color={COLORS.aqua} style={{ marginVertical: 16 }} />;
  }

  return (
    <View style={calStyles.container}>
      <Text style={calStyles.title}>THIS WEEK'S ACTIVITY</Text>

      {/* Day headers */}
      <View style={calStyles.headerRow}>
        <View style={calStyles.nameCol} />
        {DAY_LABELS.map((d) => (
          <View key={d} style={calStyles.dayCol}>
            <Text style={calStyles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Member rows */}
      {members.map((m: any) => {
        const p = m.profile;
        if (!p) return null;
        const uid = p.id || m.user_id;
        const activeDays = activityMap[uid] || new Set();
        return (
          <View key={m.id} style={calStyles.memberRow}>
            <View style={calStyles.nameCol}>
              <Text style={calStyles.memberName} numberOfLines={1}>{p.display_name || p.full_name}</Text>
            </View>
            {DAY_LABELS.map((_, dayIndex) => (
              <View key={dayIndex} style={calStyles.dayCol}>
                <View style={[calStyles.dot, activeDays.has(dayIndex) && calStyles.dotActive]} />
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(86,196,196,0.06)', borderWidth: 1, borderColor: 'rgba(86,196,196,0.15)',
    borderRadius: 14, padding: 14, marginTop: 16,
  },
  title: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  nameCol: { width: 70 },
  dayCol: { flex: 1, alignItems: 'center' },
  dayLabel: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textTertiary },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  memberName: { fontSize: 11, fontFamily: FONTS.bodyMedium, color: COLORS.white },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dotActive: {
    backgroundColor: COLORS.green,
  },
});

// ==========================================
// PACK EVENT ATTENDANCE
// ==========================================
function PackEventAttendance({ packId }: { packId: string }) {
  const { data: rsvpData, loading } = usePackEventRSVPs(packId);

  // Aggregate events and who's attending
  const events = useMemo(() => {
    if (!rsvpData?.length) return [];

    const eventMap: Record<string, { title: string; starts_at: string; location: string; attendees: string[] }> = {};
    rsvpData.forEach((member: any) => {
      const name = member.profile?.display_name || member.profile?.full_name || 'Beast';
      const rsvps = member.rsvps || [];
      rsvps.forEach((rsvp: any) => {
        const evt = rsvp.event;
        if (!evt) return;
        if (!eventMap[evt.id]) {
          eventMap[evt.id] = {
            title: evt.title,
            starts_at: evt.starts_at,
            location: evt.location_name || '',
            attendees: [],
          };
        }
        eventMap[evt.id].attendees.push(name);
      });
    });

    return Object.values(eventMap).sort((a, b) =>
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
  }, [rsvpData]);

  // Demo data if no real events
  const displayEvents = events.length > 0 ? events : [
    { title: 'Riyadh 5K Beast Run', starts_at: new Date(Date.now() + 86400000 * 3).toISOString(), location: 'King Fahd Park', attendees: ['Ahmed', 'Sara'] },
    { title: 'HIIT Beast Mode', starts_at: new Date(Date.now() + 86400000 * 5).toISOString(), location: 'Leejam Olaya', attendees: ['Ahmed'] },
  ];

  if (loading) return null;

  return (
    <View style={evtStyles.container}>
      <Text style={evtStyles.title}>PACK EVENTS</Text>
      {displayEvents.map((evt, i) => (
        <View key={i} style={evtStyles.eventRow}>
          <View style={evtStyles.eventInfo}>
            <Text style={evtStyles.eventTitle}>{evt.title}</Text>
            <Text style={evtStyles.eventMeta}>
              {new Date(evt.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {evt.location ? ` · ${evt.location}` : ''}
            </Text>
          </View>
          <View style={evtStyles.attendees}>
            {evt.attendees.map((name, j) => (
              <View key={j} style={evtStyles.attendeePill}>
                <Text style={evtStyles.attendeeName}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const evtStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(232,143,36,0.06)', borderWidth: 1, borderColor: 'rgba(232,143,36,0.15)',
    borderRadius: 14, padding: 14, marginTop: 14,
  },
  title: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 10 },
  eventRow: {
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  eventInfo: { marginBottom: 6 },
  eventTitle: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.white },
  eventMeta: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary, marginTop: 2 },
  attendees: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  attendeePill: {
    backgroundColor: 'rgba(232,143,36,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  attendeeName: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.orange },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 8, marginBottom: 4 },
  subtitle: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 20 },

  // CTA cards (no-pack state)
  ctaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(232,143,36,0.06)', borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  ctaEmoji: { fontSize: 32 },
  ctaTitle: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.white },
  ctaSub: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textSecondary, marginTop: 2 },
  ctaArrow: { fontSize: 18, color: COLORS.orange },

  // Join by code
  joinSection: { marginTop: 8, marginBottom: 16 },
  joinLabel: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, marginBottom: 8 },
  joinRow: { flexDirection: 'row', gap: 10 },
  joinInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    fontFamily: FONTS.heading, color: COLORS.white, letterSpacing: 4, textAlign: 'center',
  },
  joinButton: {
    backgroundColor: COLORS.orange, borderRadius: 10, paddingHorizontal: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  joinButtonText: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.teal },
  errorText: { fontSize: 11, fontFamily: FONTS.body, color: '#EF5350', marginTop: 6 },

  // Pending invites
  invitesSection: { marginTop: 8 },
  inviteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(86,196,196,0.06)', borderWidth: 1, borderColor: 'rgba(86,196,196,0.15)',
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  invitePack: { fontSize: 13, fontFamily: FONTS.heading, color: COLORS.white },
  inviteFrom: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary },
  acceptButton: { backgroundColor: COLORS.orange, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  acceptText: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: COLORS.teal },
  declineButton: { paddingHorizontal: 8, paddingVertical: 6 },
  declineText: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textMuted },

  // Pack header (has-pack state)
  packHeader: { alignItems: 'center', paddingVertical: 20 },
  packEmoji: { fontSize: 48 },
  packName: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 8 },
  leaderBadge: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.orange, letterSpacing: 1,
    backgroundColor: 'rgba(232,143,36,0.15)', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 8, marginTop: 6,
  },

  // Invite code card
  codeCard: {
    alignItems: 'center', backgroundColor: 'rgba(86,196,196,0.06)',
    borderWidth: 1, borderColor: 'rgba(86,196,196,0.15)', borderRadius: 14, padding: 16, marginBottom: 16,
  },
  codeLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 1 },
  codeValue: {
    fontSize: 28, fontFamily: FONTS.heading, color: COLORS.aqua, letterSpacing: 6, marginTop: 4,
  },
  shareButton: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(86,196,196,0.1)' },
  shareText: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua },

  // Section label
  sectionLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8 },

  // Member rows
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.white },
  youTag: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textMuted },
  memberXP: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary },
  leaderTag: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.orange },

  // Stats
  statsCard: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: 'rgba(86,196,196,0.06)', borderWidth: 1, borderColor: 'rgba(86,196,196,0.15)',
    borderRadius: 14, padding: 16, marginTop: 16,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.aqua },
  statLabel: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary, marginTop: 2 },

  // Leave
  leaveButton: { alignItems: 'center', marginTop: 20, paddingVertical: 12 },
  leaveText: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted },
});
