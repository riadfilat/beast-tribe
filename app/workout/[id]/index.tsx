import React, { useState } from 'react';
import { Image, ScrollView, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { fmtDuration } from '../../../src/i18n/format';
import { useAuth } from '../../../src/providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { setSaved, useWorkout } from '../../../src/data/workouts';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Magnet } from '../../../src/components/board/people';
import { Rule, Tag, ZigZag } from '../../../src/components/board/marks';
import { IconButton, MarkerButton, TextButton } from '../../../src/components/board/controls';
import { BlockView, equipmentLine, workoutLine } from '../../../src/components/board/workout';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';

export default function WorkoutScreen() {
  const { id, event } = useLocalSearchParams<{ id: string; event?: string }>();
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const q = useWorkout(id, lang);
  const [saving, setSaving] = useState(false);
  const w = q.data;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/train'));

  if (!w) {
    return (
      <SafeAreaView style={s.screen}>
        <IconButton name="back" label={t('common.back')} onPress={back} style={{ marginStart: 6 }} />
        {!q.loading ? (
          <View style={s.center}>
            <Txt v="headline" align="center">
              {q.error ? t('common.offline') : t('common.notAvailable')}
            </Txt>
            {q.error ? <TextButton label={t('common.retry')} onPress={q.refetch} /> : null}
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  async function toggleSave() {
    if (!meId || !w) return;
    setSaving(true);
    try {
      await setSaved(meId, w.id, !w.saved);
      q.setData((prev) => (prev ? { ...prev, saved: !prev.saved } : prev));
      haptic('selection');
      if (!w.saved) toast.show(t('train.savedToast'), 'yours');
    } catch {
      toast.show(t('common.somethingWrong'), 'error');
    } finally {
      setSaving(false);
    }
  }

  const hasPhoto = !!w.imageUrl;
  const fg = hasPhoto ? '#FFFFFF' : p.ink;

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {hasPhoto ? (
          <View style={s.photoWrap}>
            <Image source={{ uri: w.imageUrl! }} style={s.photo} accessibilityIgnoresInvertColors />
            <LinearGradient colors={[p.scrim[0], p.scrim[1]]} style={s.photoScrim} />
          </View>
        ) : (
          <View style={{ height: insets.top + 52 }} />
        )}

        <View style={[s.body, { marginTop: hasPhoto ? -64 : 0 }]}>
          <Txt v="title" size={30} accessibilityRole="header" style={lang === 'en' ? { textTransform: 'uppercase' } : null}>
            {w.title}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Icon sport={w.sport} size={16} color={p.inkSoft} />
            <Txt v="label" size={14} color={p.inkSoft} style={{ flexShrink: 1 }}>
              {[t(`sports.${w.sport}`), fmtDuration(w.minutes, lang), workoutLine(w, t, tn)].join(' · ')}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            <Tag label={equipmentLine(w, t)} />
            {w.community ? <Tag label={t('train.onlyFor', { community: w.community.name })} tone="aqua" icon="lock" /> : null}
          </View>

          {w.description ? (
            <Txt v="body" style={{ marginTop: 14 }}>
              {w.description}
            </Txt>
          ) : null}

          {/* Who wrote it, and who's been doing it */}
          <View style={s.byline}>
            {w.coach ? <Magnet person={w.coach} size={36} /> : null}
            <View style={{ flex: 1 }}>
              <Txt v="headline" size={15}>
                {w.coach ? w.coach.name : t('train.byOB')}
              </Txt>
              <Txt v="meta">{tn('train.doneWeek', w.doneWeek)}</Txt>
            </View>
          </View>

          <Rule style={s.rule} />
          {w.blocks.map((b, i) => (
            <View key={i}>
              {i > 0 ? <ZigZag style={{ marginVertical: 18 }} /> : null}
              <BlockView b={b} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[s.topBar, { top: insets.top }]} pointerEvents="box-none">
        <IconButton name="back" label={t('common.back')} onPress={back} color={fg} style={hasPhoto ? s.floatBtn : null} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton
            name="share"
            label={t('session.invite')}
            onPress={() => Share.share({ message: `${w.title} · ${fmtDuration(w.minutes, lang)}\n${workoutLine(w, t, tn)}` }).catch(() => {})}
            color={fg}
            style={hasPhoto ? s.floatBtn : null}
          />
          <IconButton
            name={w.saved ? 'bookmarkFill' : 'bookmark'}
            label={w.saved ? t('train.unsave') : t('train.save')}
            onPress={saving ? undefined : toggleSave}
            color={fg}
            style={hasPhoto ? s.floatBtn : null}
          />
        </View>
      </View>

      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <MarkerButton label={t('train.start')} icon="play" onPress={() => router.push({ pathname: '/workout/[id]/play', params: event ? { id: w.id, event } : { id: w.id } })} />
        <TextButton
          label={t('train.withCrewLong')}
          onPress={() => router.push({ pathname: '/host', params: { workout: w.id } })}
          style={{ alignSelf: 'center', marginTop: 4 }}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  photoWrap: { height: 260, backgroundColor: p.boardDeep },
  photo: { width: '100%', height: '100%' },
  photoScrim: { position: 'absolute', start: 0, end: 0, top: 0, bottom: 0 },
  body: { paddingHorizontal: 20 },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  rule: { marginVertical: 18 },
  topBar: { position: 'absolute', start: 8, end: 8, flexDirection: 'row', justifyContent: 'space-between' },
  floatBtn: { backgroundColor: 'rgba(2,60,60,0.55)', borderRadius: 22 },
  bar: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: p.boardDeep,
    borderTopWidth: 1,
    borderTopColor: p.rule,
  },
}));
