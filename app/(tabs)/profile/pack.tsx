import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Share, Alert, Modal, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, TierPill, Button } from '../../../src/components/ui';
import { COLORS, FONTS } from '../../../src/lib/constants';
import {
  useMyPacks, usePackMembers, useJoinPackByCode, useLeavePack,
  usePackInvites, useRespondToInvite, usePackEventRSVPs,
} from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

const ANIMAL_EMOJIS: Record<string, string> = {
  wolf: '🐺', eagle: '🦅', tiger: '🐯', rhino: '🦏',
};

const MAX_PACKS = 20;

export default function PackScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: memberships, loading: packsLoading, refetch: refetchPacks } = useMyPacks();
  const { data: invites, refetch: refetchInvites } = usePackInvites();
  const { respond: respondToInvite } = useRespondToInvite();
  const { leavePack, loading: leaving } = useLeavePack();

  // Which pack tab is selected
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  // Whether to show the "add pack" panel inline
  const [showAddPanel, setShowAddPanel] = useState(false);
  // Leave pack confirmation modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Join by code
  const [joinCode, setJoinCode] = useState('');
  const { joinPack, loading: joining, error: joinError } = useJoinPackByCode();

  // Set first pack as default when data loads
  useEffect(() => {
    if (memberships && memberships.length > 0 && !selectedPackId) {
      setSelectedPackId(memberships[0].pack?.id || null);
    }
  }, [memberships]);

  const selectedMembership = useMemo(
    () => memberships?.find((m: any) => m.pack?.id === selectedPackId) || null,
    [memberships, selectedPackId]
  );

  async function handleJoinByCode() {
    if (!joinCode.trim()) return;
    const result = await joinPack(joinCode);
    if (result) {
      setJoinCode('');
      setShowAddPanel(false);
      await refetchPacks();
      setSelectedPackId(result.id);
    }
  }

  async function handleAcceptInvite(inviteId: string, packId: string) {
    const currentCount = memberships?.length || 0;
    if (currentCount >= MAX_PACKS) {
      Alert.alert('Pack Limit Reached', `You can join up to ${MAX_PACKS} packs. Leave one first to accept this invite.`);
      return;
    }
    await respondToInvite(inviteId, packId, true);
    refetchInvites();
    await refetchPacks();
    setSelectedPackId(packId);
  }

  async function handleDeclineInvite(inviteId: string, packId: string) {
    await respondToInvite(inviteId, packId, false);
    refetchInvites();
  }

  async function handleShareCode(pack: any) {
    if (!pack?.invite_code) return;
    const msg = `Join my pack "${pack.name}" on Beast Tribe! Use code: ${pack.invite_code}`;
    try {
      if (Platform.OS === 'web') {
        if (navigator?.clipboard) {
          await navigator.clipboard.writeText(msg);
          Alert.alert('Copied!', 'Invite code copied to clipboard.');
        } else {
          Alert.alert('Invite Code', msg);
        }
      } else {
        await Share.share({ message: msg });
      }
    } catch {
      Alert.alert('Invite Code', msg);
    }
  }

  async function handleLeavePackConfirmed() {
    const packId = selectedMembership?.pack?.id;
    if (!packId) return;
    try {
      await leavePack(packId);
      const remaining = (memberships || []).filter((m: any) => m.pack?.id !== packId);
      setSelectedPackId(remaining[0]?.pack?.id || null);
      setShowLeaveModal(false);
      await refetchPacks();
    } catch (e) {
      console.warn('Failed to leave pack:', e);
    }
  }

  if (packsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      </SafeAreaView>
    );
  }

  const packCount = memberships?.length || 0;
  const canAddMore = packCount < MAX_PACKS;

  // ==========================================
  // USER HAS AT LEAST ONE PACK
  // ==========================================
  if (packCount > 0 && selectedMembership) {
    const pack = selectedMembership.pack;
    const isLeader = selectedMembership.role === 'leader';
    const animalEmoji = ANIMAL_EMOJIS[pack?.animal?.toLowerCase()] || '🐾';

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Packs</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Pack selector tabs ── */}
          <View style={styles.selectorHeader}>
            <Text style={styles.sectionLabel}>MY PACKS ({packCount}/{MAX_PACKS})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {(memberships || []).map((m: any) => {
              const p = m.pack;
              const emoji = ANIMAL_EMOJIS[p?.animal?.toLowerCase()] || '🐾';
              const isActive = p?.id === selectedPackId;
              return (
                <TouchableOpacity
                  key={p?.id}
                  style={[styles.packTab, isActive && styles.packTabActive]}
                  onPress={() => { setSelectedPackId(p?.id); setShowAddPanel(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.packTabEmoji}>{emoji}</Text>
                  <Text style={[styles.packTabName, isActive && styles.packTabNameActive]} numberOfLines={1}>
                    {p?.name}
                  </Text>
                  {m.role === 'leader' && <View style={styles.leaderDot} />}
                </TouchableOpacity>
              );
            })}

            {/* Add pack tab */}
            {canAddMore && (
              <TouchableOpacity
                style={[styles.packTab, styles.addPackTab, showAddPanel && styles.addPackTabActive]}
                onPress={() => { setShowAddPanel((v) => !v); setSelectedPackId(selectedMembership?.pack?.id); }}
                activeOpacity={0.7}
              >
                <Text style={styles.addPackIcon}>＋</Text>
                <Text style={styles.addPackText}>Add Pack</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* ── Inline Add Pack Panel ── */}
          {showAddPanel && (
            <View style={styles.addPanel}>
              <Text style={styles.addPanelTitle}>Join another pack</Text>

              {/* Join by code */}
              <View style={styles.joinRow}>
                <TextInput
                  style={styles.joinInput}
                  placeholder="Enter invite code"
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

              {/* Or create a new pack */}
              <TouchableOpacity
                style={styles.createPackLink}
                onPress={() => router.push('/(tabs)/profile/pack-create')}
              >
                <Text style={styles.createPackLinkText}>Or create a new pack →</Text>
              </TouchableOpacity>

              {/* Pending invites */}
              {invites && invites.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>PENDING INVITES</Text>
                  {invites.map((inv: any) => (
                    <View key={inv.id} style={styles.inviteRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.invitePack}>{inv.pack?.name}</Text>
                        <Text style={styles.inviteFrom}>From {inv.inviter?.display_name || 'Beast'}</Text>
                      </View>
                      <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptInvite(inv.id, inv.pack_id)}>
                        <Text style={styles.acceptText}>Join</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.declineButton} onPress={() => handleDeclineInvite(inv.id, inv.pack_id)}>
                        <Text style={styles.declineText}>Pass</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Selected pack detail ── */}
          {!showAddPanel && (
            <>
              {/* Pack header */}
              <View style={styles.packHeader}>
                <Text style={styles.packEmoji}>{animalEmoji}</Text>
                <Text style={styles.packName}>{pack?.name}</Text>
                {isLeader && <Text style={styles.leaderBadge}>LEADER</Text>}
              </View>

              {/* Invite code card */}
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>INVITE CODE</Text>
                <Text style={styles.codeValue}>{pack?.invite_code}</Text>
                <TouchableOpacity style={styles.shareButton} onPress={() => handleShareCode(pack)} activeOpacity={0.7}>
                  <Text style={styles.shareText}>Share with friends</Text>
                </TouchableOpacity>
              </View>

              {/* Pack Chat button */}
              <TouchableOpacity
                style={styles.chatButton}
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: '/(tabs)/profile/pack-chat',
                  params: { packId: pack?.id, packName: pack?.name },
                })}
              >
                <Ionicons name="chatbubbles" size={18} color={COLORS.orange} />
                <Text style={styles.chatButtonText}>PACK CHAT</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>

              {/* Invite button (leader only) */}
              {isLeader && (
                <Button
                  title="Invite Friends"
                  onPress={() => router.push({ pathname: '/(tabs)/profile/pack-invite', params: { packId: pack?.id } })}
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* Members */}
              <PackMembersSection packId={pack?.id} userId={user?.id} />

              {/* Weekly Activity */}
              {pack?.id && <PackWeekCalendarFetcher packId={pack.id} />}

              {/* Upcoming events */}
              {pack?.id && <PackEventAttendance packId={pack.id} />}

              {/* Leave pack */}
              <TouchableOpacity
                style={[styles.leaveButton, leaving && { opacity: 0.5 }]}
                onPress={() => setShowLeaveModal(true)}
                disabled={leaving}
                activeOpacity={0.7}
              >
                <Ionicons name="exit-outline" size={16} color="rgba(239,83,80,0.7)" />
                <Text style={styles.leaveText}>{leaving ? 'Leaving...' : 'Leave Pack'}</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* Leave Pack Confirmation Modal */}
        <Modal visible={showLeaveModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => !leaving && setShowLeaveModal(false)}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="exit-outline" size={32} color="#EF5350" />
              </View>
              <Text style={styles.modalTitle}>Leave Pack?</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to leave "{pack?.name}"? This will remove you permanently.
              </Text>
              <TouchableOpacity
                style={styles.modalDestructiveBtn}
                onPress={handleLeavePackConfirmed}
                disabled={leaving}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDestructiveText}>
                  {leaving ? 'Leaving...' : 'Leave Pack'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLeaveModal(false)}
                disabled={leaving}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  // ==========================================
  // USER HAS NO PACKS
  // ==========================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Packs</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Packs</Text>
        <Text style={styles.subtitle}>Join up to 4 tribe packs and compete together</Text>

        {/* Create pack */}
        <TouchableOpacity
          style={styles.ctaCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/profile/pack-create')}
        >
          <View style={styles.ctaIconWrap}><Ionicons name="people" size={22} color={COLORS.orange} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Create a Pack</Text>
            <Text style={styles.ctaSub}>Pick a name and mascot, invite your tribe</Text>
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
                <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptInvite(inv.id, inv.pack_id)}>
                  <Text style={styles.acceptText}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineButton} onPress={() => handleDeclineInvite(inv.id, inv.pack_id)}>
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
// PACK MEMBERS SECTION
// ==========================================
function PackMembersSection({ packId, userId }: { packId?: string; userId?: string }) {
  const { data: members, loading } = usePackMembers(packId);

  const totalXP = (members || []).reduce((sum: number, m: any) => sum + (m.profile?.total_xp || 0), 0);

  return (
    <>
      <Text style={styles.sectionLabel}>PACK MEMBERS ({members?.length || 0})</Text>
      {loading ? (
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
                  {p.id === userId && <Text style={styles.youTag}> (you)</Text>}
                </Text>
                <Text style={styles.memberXP}>{(p.total_xp || 0).toLocaleString()} XP</Text>
              </View>
              <TierPill tier={p.tier || 'initiate'} size="small" />
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
          <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
      </View>
    </>
  );
}

// ==========================================
// PACK WEEK CALENDAR (fetches its own members)
// ==========================================
function PackWeekCalendarFetcher({ packId }: { packId: string }) {
  const { data: members, loading } = usePackMembers(packId);
  if (loading) return null;
  return <PackWeekCalendar packId={packId} members={members || []} />;
}

function PackWeekCalendar({ packId, members }: { packId: string; members: any[] }) {
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [activityMap, setActivityMap] = useState<Record<string, Set<number>>>({});
  const [loading, setLoading] = useState(true);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || members.length === 0) {
      const demo: Record<string, Set<number>> = {};
      members.forEach((m: any) => {
        const uid = m.profile?.id || m.user_id;
        const days = new Set<number>();
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

  if (loading) return <ActivityIndicator color={COLORS.aqua} style={{ marginVertical: 16 }} />;

  return (
    <View style={calStyles.container}>
      <Text style={calStyles.title}>THIS WEEK'S ACTIVITY</Text>
      <View style={calStyles.headerRow}>
        <View style={calStyles.nameCol} />
        {DAY_LABELS.map((d) => (
          <View key={d} style={calStyles.dayCol}>
            <Text style={calStyles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>
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

// ==========================================
// PACK EVENT ATTENDANCE
// ==========================================
function PackEventAttendance({ packId }: { packId: string }) {
  const { data: rsvpData, loading } = usePackEventRSVPs(packId);

  const events = useMemo(() => {
    if (!rsvpData?.length) return [];
    const eventMap: Record<string, { title: string; starts_at: string; location: string; attendees: string[] }> = {};
    rsvpData.forEach((member: any) => {
      const name = member.profile?.display_name || member.profile?.full_name || 'Beast';
      (member.rsvps || []).forEach((rsvp: any) => {
        const evt = rsvp.event;
        if (!evt) return;
        if (!eventMap[evt.id]) {
          eventMap[evt.id] = { title: evt.title, starts_at: evt.starts_at, location: evt.location_name || '', attendees: [] };
        }
        eventMap[evt.id].attendees.push(name);
      });
    });
    return Object.values(eventMap).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [rsvpData]);

  const displayEvents = events;

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

// ==========================================
// STYLES
// ==========================================
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
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.06)' },
  dotActive: { backgroundColor: COLORS.green },
});

const evtStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(232,143,36,0.06)', borderWidth: 1, borderColor: 'rgba(232,143,36,0.15)',
    borderRadius: 14, padding: 14, marginTop: 14,
  },
  title: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 10 },
  eventRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  eventInfo: { marginBottom: 6 },
  eventTitle: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.white },
  eventMeta: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary, marginTop: 2 },
  attendees: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  attendeePill: { backgroundColor: 'rgba(232,143,36,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  attendeeName: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.orange },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.white },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginTop: 8, marginBottom: 4 },
  subtitle: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 20 },

  // Pack selector tabs
  selectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  tabScroll: { marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 4 },
  packTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginRight: 8, marginBottom: 12,
  },
  packTabActive: {
    borderColor: COLORS.orange,
    backgroundColor: 'rgba(232,143,36,0.12)',
  },
  packTabEmoji: { fontSize: 16 },
  packTabName: {
    fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary, maxWidth: 90,
  },
  packTabNameActive: { color: COLORS.white },
  leaderDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.orange,
  },
  addPackTab: {
    borderColor: 'rgba(86,196,196,0.25)',
    backgroundColor: 'rgba(86,196,196,0.05)',
  },
  addPackTabActive: {
    borderColor: COLORS.aqua,
    backgroundColor: 'rgba(86,196,196,0.12)',
  },
  addPackIcon: { fontSize: 14, color: COLORS.aqua, fontFamily: FONTS.heading },
  addPackText: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.aqua },

  // Inline add pack panel
  addPanel: {
    backgroundColor: 'rgba(86,196,196,0.05)',
    borderWidth: 1, borderColor: 'rgba(86,196,196,0.15)',
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  addPanelTitle: { fontSize: 13, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 12 },
  createPackLink: { marginTop: 10, alignSelf: 'flex-start' },
  createPackLinkText: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua },

  // CTA cards (no-pack state)
  ctaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(232,143,36,0.06)', borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  ctaEmoji: { fontSize: 32 },
  ctaIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(232,143,36,0.12)', alignItems: 'center', justifyContent: 'center' },
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
    fontFamily: FONTS.heading, color: COLORS.textPrimary, letterSpacing: 4, textAlign: 'center',
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

  // Pack header (selected pack)
  packHeader: { alignItems: 'center', paddingVertical: 20 },
  packEmoji: { fontSize: 48 },
  packName: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginTop: 8 },
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
  codeValue: { fontSize: 28, fontFamily: FONTS.heading, color: COLORS.aqua, letterSpacing: 6, marginTop: 4 },
  shareButton: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(86,196,196,0.1)' },
  shareText: { fontSize: 12, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua },

  // Chat button
  chatButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(232,143,36,0.08)', borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 14, padding: 14, marginBottom: 16,
  },
  chatButtonText: {
    flex: 1, fontSize: 13, fontFamily: FONTS.heading, color: COLORS.orange, letterSpacing: 1,
  },

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

  // Leave pack
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,83,80,0.25)',
    backgroundColor: 'rgba(239,83,80,0.05)',
  },
  leaveText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: 'rgba(239,83,80,0.8)' },

  // Leave modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  modalSheet: {
    width: '85%', backgroundColor: COLORS.background, borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239,83,80,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 8 },
  modalMessage: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalDestructiveBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(239,83,80,0.15)', borderWidth: 1, borderColor: 'rgba(239,83,80,0.3)',
    alignItems: 'center', marginBottom: 10,
  },
  modalDestructiveText: { fontSize: 14, fontFamily: FONTS.heading, color: '#EF5350' },
  modalCancelBtn: { paddingVertical: 10 },
  modalCancelText: { fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
});
