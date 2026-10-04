import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { fmtAgo } from '../../../src/i18n/format';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useFeed, toggleBeast, createPost, deletePost, reportPost, blockMember, Post } from '../../../src/data/feed';
import { useMyPackList, PackSummary } from '../../../src/data/member';
import { Community, useMyCommunities, useOpenCommunities } from '../../../src/data/communities';
import { CommunityRow, JoinCommunityForm } from '../../../src/components/board/communities';
import { RequestCommunityCard } from '../../../src/components/board/clubs';
import { useMySessions } from '../../../src/data/sessions';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { Txt } from '../../../src/components/board/Txt';
import { WolfGlyph } from '../../../src/components/brand/Logo';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Magnet } from '../../../src/components/board/people';
import { Chip, IconButton, MarkerButton, OutlineButton, SectionHeading, Segmented, TextButton } from '../../../src/components/board/controls';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { compressImage } from '../../../src/lib/imageUtils';
import { Patch } from '../../../src/components/board/Patch';
import { TRAIN_ENABLED } from '../../../src/lib/constants';


type Tab = 'feed' | 'communities' | 'packs';
const REASONS = ['inappropriate', 'spam', 'harassment', 'nudity', 'other'] as const;

export default function TribeScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ compose?: string; tab?: string }>();
  const { user, profile } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const feed = useFeed();
  const packs = useMyPackList();
  const communities = useMyCommunities();
  const openCommunities = useOpenCommunities();
  const [tab, setTab] = useState<Tab>('feed');

  useEffect(() => {
    if (params.tab === 'communities' || params.tab === 'packs') setTab(params.tab);
  }, [params.tab]);
  const [composeFor, setComposeFor] = useState<string | null | undefined>(undefined); // undefined = closed
  const [reporting, setReporting] = useState<Post | null>(null);

  // A recap handed over from a finished session opens the composer tagged to it.
  useEffect(() => {
    if (params.compose) setComposeFor(params.compose);
  }, [params.compose]);

  async function onBeast(post: Post) {
    if (!meId) return;
    haptic(post.beasted ? 'selection' : 'medium');
    feed.setData((prev) =>
      prev?.map((x) => (x.id === post.id ? { ...x, beasted: !x.beasted, beastCount: x.beastCount + (x.beasted ? -1 : 1) } : x)),
    );
    try {
      await toggleBeast(meId, post.id, post.beasted);
    } catch {
      feed.setData((prev) => prev?.map((x) => (x.id === post.id ? { ...x, beasted: post.beasted, beastCount: post.beastCount } : x)));
    }
  }

  function onMore(post: Post) {
    const own = post.author.id === meId;
    const options: { label: string; destructive?: boolean; run: () => void }[] = own
      ? [{ label: t('tribe.deletePost'), destructive: true, run: () => confirmDelete(post) }]
      : [
          { label: t('tribe.report'), run: () => setReporting(post) },
          { label: `${t('tribe.block')} ${post.author.name.split(' ')[0]}`, destructive: true, run: () => confirmBlock(post) },
        ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options.map((o) => o.label), t('common.cancel')],
          destructiveButtonIndex: options.findIndex((o) => o.destructive),
          cancelButtonIndex: options.length,
        },
        (i) => options[i]?.run(),
      );
    } else {
      Alert.alert('', undefined, [...options.map((o) => ({ text: o.label, style: (o.destructive ? 'destructive' : 'default') as any, onPress: o.run })), { text: t('common.cancel'), style: 'cancel' as const }]);
    }
  }

  function confirmDelete(post: Post) {
    Alert.alert(t('tribe.deleteConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          feed.setData((prev) => prev?.filter((x) => x.id !== post.id));
          await deletePost(post.id).catch(() => toast.show(t('common.somethingWrong'), 'error'));
        },
      },
    ]);
  }

  function confirmBlock(post: Post) {
    Alert.alert(t('tribe.blockTitle', { name: post.author.name }), t('tribe.blockBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('tribe.block'),
        style: 'destructive',
        onPress: async () => {
          feed.setData((prev) => prev?.filter((x) => x.author.id !== post.author.id));
          if (meId) await blockMember(meId, post.author.id).catch(() => toast.show(t('common.somethingWrong'), 'error'));
        },
      },
    ]);
  }

  const me = { id: meId || 'me', name: profile?.display_name || profile?.full_name || '', avatarUrl: profile?.avatar_url ?? null };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <Txt v="title" size={32} style={{ flex: 1 }} accessibilityRole="header">
          {t('tribe.title')}
        </Txt>
        {tab === 'feed' ? <IconButton name="plus" label={t('tribe.composeTitle')} onPress={() => setComposeFor(null)} /> : null}
      </View>
      <Segmented
        value={tab}
        onChange={setTab}
        style={{ marginHorizontal: 16, marginBottom: 6 }}
        options={[
          { value: 'feed', label: t('tribe.feed') },
          { value: 'communities', label: t('tribe.communities') },
          { value: 'packs', label: t('tribe.packs') },
        ]}
      />

      {tab === 'feed' ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={feed.refetch} tintColor={p.ink} />}
        >
          <Press onPress={() => setComposeFor(null)} feedback="selection" depress={0.99} style={s.prompt}>
            <Magnet person={me} size={36} yours />
            <Txt v="body" color={p.inkFaint} style={{ flex: 1 }}>
              {t('tribe.composePlaceholder')}
            </Txt>
            <Icon name="camera" size={18} color={p.inkFaint} />
          </Press>
          {!feed.loading && (feed.data ?? []).length === 0 ? (
            <Txt v="body" color={p.inkSoft} align="center" style={{ padding: 32 }}>
              {t('tribe.feedEmpty')}
            </Txt>
          ) : null}
          {(feed.data ?? []).map((post) => (
            <PostItem
              key={post.id}
              post={post}
              meId={meId}
              onBeast={() => onBeast(post)}
              onMore={() => onMore(post)}
              onOpenEvent={() => post.event && router.push({ pathname: '/session/[id]', params: { id: post.event.id } })}
              onOpenWorkout={() => TRAIN_ENABLED && post.workout && router.push({ pathname: '/workout/[id]', params: { id: post.workout.id } })}
            />
          ))}
        </ScrollView>
      ) : tab === 'communities' ? (
        <CommunitiesPane
          mine={communities.data ?? []}
          open={openCommunities.data ?? []}
          refreshing={communities.refreshing}
          onRefresh={() => { communities.refetch(); openCommunities.refetch(); }}
          onOpen={(c) => router.push({ pathname: '/(tabs)/feed/community', params: { id: c.id } })}
        />
      ) : (
        <PacksPane
          packs={packs.data ?? []}
          loading={packs.loading}
          onOpen={(pk) => router.push({ pathname: '/(tabs)/feed/pack', params: { packId: pk.id } })}
          onCreate={() => router.push('/(tabs)/feed/pack-create')}
          onJoin={() => router.push('/(tabs)/feed/pack')}
        />
      )}

      <ComposeSheet
        visible={composeFor !== undefined}
        eventId={composeFor ?? null}
        meId={meId}
        onClose={() => {
          setComposeFor(undefined);
          if (params.compose) router.setParams({ compose: undefined });
        }}
        onPosted={() => feed.refetch()}
        communities={communities.data ?? []}
      />
      <ReportSheet post={reporting} meId={meId} onClose={() => setReporting(null)} />
    </SafeAreaView>
  );
}

// ─── A post ─────────────────────────────────────────────────────────────────
function PostItem({ post, meId, onBeast, onMore, onOpenEvent, onOpenWorkout }: { post: Post; meId: string | null; onBeast: () => void; onMore: () => void; onOpenEvent: () => void; onOpenWorkout: () => void }) {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  return (
    <View style={s.post}>
      <View style={s.postHead}>
        <Magnet person={post.author} size={36} yours={post.author.id === meId} />
        <View style={{ flex: 1 }}>
          <Txt v="headline" size={15}>
            {post.author.id === meId ? t('common.you') : post.author.name}
          </Txt>
          <Txt v="caption">{fmtAgo(post.createdAt, lang)}</Txt>
        </View>
        <IconButton name="more" label={t('tribe.report')} size={18} color={p.inkSoft} onPress={onMore} />
      </View>
      {post.community?.private ? (
        <View style={s.where}>
          <Icon name="lock" size={11} color={p.aqua} />
          <Txt v="label" size={12} color={p.aqua}>
            {post.community.name}
          </Txt>
        </View>
      ) : null}
      {post.event ? (
        <Press onPress={onOpenEvent} feedback="selection" style={s.recap}>
          <Icon name="calendar" size={12} color={p.aqua} />
          <Txt v="label" size={12} color={p.aqua}>
            {t('tribe.recapOf', { event: post.event.title })}
          </Txt>
        </Press>
      ) : null}
      {post.workout ? (
        <Press onPress={onOpenWorkout} feedback="selection" style={s.recap}>
          <Icon name="train" size={12} color={p.aqua} />
          <Txt v="label" size={12} color={p.aqua}>
            {t('tribe.workoutOf', { workout: lang === 'ar' && post.workout.titleAr ? post.workout.titleAr : post.workout.title })}
          </Txt>
        </Press>
      ) : null}
      {post.content ? (
        <Txt v="body" style={{ marginTop: 8 }}>
          {post.content}
        </Txt>
      ) : null}
      {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={s.postImg} accessibilityIgnoresInvertColors /> : null}
      <View style={s.actions}>
        <Press onPress={onBeast} feedback={null} depress={0.9} accessibilityLabel={t('tribe.beast')} accessibilityState={{ selected: post.beasted }} style={[s.beast, post.beasted ? { backgroundColor: p.marker, borderColor: p.marker } : null]}>
          <WolfGlyph size={16} color={post.beasted ? p.onMarker : p.ink} />
          <Txt v="label" size={13} color={post.beasted ? p.onMarker : p.ink}>
            {post.beastCount > 0 ? tn('tribe.beasts', post.beastCount) : t('tribe.beast')}
          </Txt>
        </Press>
        {post.commentCount > 0 ? <Txt v="meta">{tn('tribe.comments', post.commentCount)}</Txt> : null}
      </View>
    </View>
  );
}

// ─── Packs ──────────────────────────────────────────────────────────────────
// ─── Communities ────────────────────────────────────────────────────────────
function CommunitiesPane({ mine, open, refreshing, onRefresh, onOpen }: { mine: Community[]; open: Community[]; refreshing: boolean; onRefresh: () => void; onOpen: (c: Community) => void }) {
  const { p } = useKit();
  const { t } = useI18n();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.ink} />}>
      <SectionHeading title={t('community.mine')} />
      {mine.length ? (
        mine.map((c, i) => <CommunityRow key={c.id} c={c} onPress={() => onOpen(c)} last={i === mine.length - 1} />)
      ) : (
        <Txt v="meta">{t('community.noneYet')}</Txt>
      )}
      <View style={{ marginTop: 24 }}>
        <JoinCommunityForm onJoined={onRefresh} />
      </View>
      <View style={{ marginTop: 20 }}>
        <RequestCommunityCard />
      </View>
      {open.length ? (
        <View style={{ marginTop: 24 }}>
          <SectionHeading title={t('community.discover')} />
          <Txt v="meta" style={{ marginBottom: 4 }}>
            {t('community.discoverSub')}
          </Txt>
          {open.map((c, i) => (
            <CommunityRow key={c.id} c={c} onPress={() => onOpen(c)} onJoined={onRefresh} last={i === open.length - 1} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

// ─── Packs ──────────────────────────────────────────────────────────────────
function PacksPane({ packs, loading, onOpen, onCreate, onJoin }: { packs: PackSummary[]; loading: boolean; onOpen: (p: PackSummary) => void; onCreate: () => void; onJoin: () => void }) {
  const s = useStyles();
  const { p } = useKit();
  const { t, tn } = useI18n();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}>
      {!loading && !packs.length ? (
        <Txt v="body" color={p.inkSoft} style={{ marginVertical: 8 }}>
          {t('tribe.packsEmpty')}
        </Txt>
      ) : null}
      {/* Groups sit under the community they belong to. */}
      {Array.from(new Set(packs.map((pk) => pk.community ?? ''))).map((community) => (
        <View key={community || 'none'} style={{ gap: 12 }}>
          {community ? (
            <Txt v="label" size={13} color={p.inkSoft} style={{ marginTop: 6 }}>
              {community}
            </Txt>
          ) : null}
          {packs
            .filter((pk) => (pk.community ?? '') === community)
            .map((pk) => (
              <Press key={pk.id} onPress={() => onOpen(pk)} feedback="selection" depress={0.99} style={s.packRow}>
                <Patch emblem={pk.emblem} name={pk.name} size={56} />
                <View style={{ flex: 1 }}>
                  <Txt v="row" size={16}>
                    {pk.name}
                  </Txt>
                  <Txt v="meta">{tn('tribe.members', pk.members)}</Txt>
                </View>
                <Icon name="chevron" size={14} color={p.inkFaint} weight="bold" />
              </Press>
            ))}
        </View>
      ))}
      <View style={{ gap: 10, marginTop: 8 }}>
        <MarkerButton label={t('tribe.startPack')} icon="plus" onPress={onCreate} />
        <OutlineButton label={t('tribe.joinWithCode')} icon="key" onPress={onJoin} />
      </View>
    </ScrollView>
  );
}

// ─── Compose ────────────────────────────────────────────────────────────────
function ComposeSheet({ visible, eventId, meId, onClose, onPosted, communities }: { visible: boolean; eventId: string | null; meId: string | null; onClose: () => void; onPosted: () => void; communities: Community[] }) {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const mine = useMySessions().data ?? [];
  const recent = mine.filter((x) => x.state === 'finished' && x.myStatus === 'going').slice(-6).reverse();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(eventId);
  const [where, setWhere] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Private communities come first, so a member of a company posts to the company by default.
  const target = where ?? communities[0]?.id ?? null;

  useEffect(() => {
    if (visible) setTag(eventId);
  }, [visible, eventId]);

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.85 });
    if (!res.canceled && res.assets[0]) setPhoto(await compressImage(res.assets[0].uri, 'post'));
  }

  async function post() {
    if (!meId || (!text.trim() && !photo) || busy) return;
    setBusy(true);
    try {
      await createPost(meId, { content: text, imageUri: photo, eventId: tag, communityId: target });
      haptic('success');
      setText('');
      setPhoto(null);
      onPosted();
      onClose();
    } catch {
      haptic('error');
      toast.show(t('tribe.postError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[s.sheet]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheetHeader}>
          <TextButton label={t('common.cancel')} onPress={onClose} color={p.inkSoft} />
          <Txt v="headline" style={{ flex: 1 }} align="center">
            {t('tribe.composeTitle')}
          </Txt>
          <TextButton label={busy ? t('tribe.posting') : t('tribe.post')} onPress={post} disabled={busy || (!text.trim() && !photo)} color={p.markerText} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('tribe.composePlaceholder')}
            placeholderTextColor={p.inkFaint}
            selectionColor={p.marker}
            multiline
            autoFocus
            maxLength={500}
            style={[s.composeInput, { textAlign: lang === 'ar' ? 'right' : 'left' }]}
          />
          {photo ? (
            <View>
              <Image source={{ uri: photo }} style={s.postImg} />
              <TextButton label={t('common.remove')} onPress={() => setPhoto(null)} color={p.danger} />
            </View>
          ) : (
            <OutlineButton label={t('tribe.photo')} icon="photo" onPress={pick} />
          )}
          {!tag && communities.length > 1 ? (
            <View style={{ gap: 8 }}>
              <Txt v="label" color={p.inkSoft}>
                {t('community.postTo')}
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {communities.map((c) => (
                  <Chip key={c.id} label={c.name} icon={c.open ? 'people' : 'lock'} selected={target === c.id} onPress={() => setWhere(c.id)} />
                ))}
              </View>
            </View>
          ) : null}
          {recent.length ? (
            <View style={{ gap: 8 }}>
              <Txt v="label" color={p.inkSoft}>
                {t('tribe.tagSession')}
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Chip label={t('tribe.untag')} selected={!tag} onPress={() => setTag(null)} />
                {recent.map((x) => (
                  <Chip key={x.id} sport={x.sport} label={x.title} selected={tag === x.id} onPress={() => setTag(x.id)} />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Report ─────────────────────────────────────────────────────────────────
function ReportSheet({ post, meId, onClose }: { post: Post | null; meId: string | null; onClose: () => void }) {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReason(null);
    setDetails('');
  }, [post?.id]);

  async function send() {
    if (!post || !meId || !reason) return;
    setBusy(true);
    try {
      await reportPost(meId, post.id, reason, details);
      onClose();
      toast.show(t('tribe.reportThanks'), 'info');
    } catch {
      toast.show(t('common.somethingWrong'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!post} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.sheet}>
        <View style={s.sheetHeader}>
          <TextButton label={t('common.cancel')} onPress={onClose} color={p.inkSoft} />
          <Txt v="headline" style={{ flex: 1 }} align="center">
            {t('tribe.report')}
          </Txt>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          <Txt v="title" size={20}>
            {t('tribe.reportTitle')}
          </Txt>
          {REASONS.map((r) => (
            <Press key={r} onPress={() => setReason(r)} feedback="selection" style={[s.reason, reason === r ? { borderColor: p.ink, backgroundColor: p.wash } : null]} accessibilityState={{ selected: reason === r }}>
              <View style={[s.radio, reason === r ? { borderColor: p.ink } : null]}>{reason === r ? <View style={s.radioDot} /> : null}</View>
              <Txt v="body">{t(`tribe.reasons.${r}`)}</Txt>
            </Press>
          ))}
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder={t('tribe.reportDetails')}
            placeholderTextColor={p.inkFaint}
            multiline
            maxLength={500}
            style={[s.composeInput, { minHeight: 90, textAlign: lang === 'ar' ? 'right' : 'left' }]}
          />
          <MarkerButton label={t('tribe.reportSend')} onPress={send} loading={busy} disabled={!reason} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles(({ p, f }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingStart: 16, paddingEnd: 8, paddingTop: 6, paddingBottom: 8 },
  prompt: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 8, marginBottom: 4, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.rule },
  post: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: p.rule },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recap: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10, minHeight: 28, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1.5, borderColor: p.aqua },
  postImg: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10, marginTop: 10, backgroundColor: p.wash },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  beast: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.5, borderColor: p.ruleStrong },
  where: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  packRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: p.rule },
  sheet: { flex: 1, backgroundColor: p.board },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
  composeInput: { minHeight: 140, borderRadius: 10, borderWidth: 1.5, borderColor: p.ruleStrong, backgroundColor: p.wash, padding: 14, color: p.ink, fontSize: 17, textAlignVertical: 'top', ...f.ui },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: p.rule },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: p.ruleStrong, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: p.ink },
}));
