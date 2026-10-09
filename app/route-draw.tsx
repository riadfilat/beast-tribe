import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { CITIES } from '../src/lib/cities';
import { cityCentre, refreshPosition, useMyPosition } from '../src/lib/location';
import { fmtDistance, LngLat, pathLength, saveRoute, useRoutePick } from '../src/data/routes';
import { MAP_STYLE_URL, maplibre, pointFeature, ROUTE_ORANGE, routeFeature, START_AQUA } from '../src/components/board/route';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { Field, MarkerButton, OutlineButton, TextButton } from '../src/components/board/controls';
import { Sheet } from '../src/components/board/sheet';
import { Toggle } from '../src/components/board/Toggle';
import { toast } from '../src/components/board/toast';
import { haptic } from '../src/lib/haptics';

// Plot a route on the Beast Tribe map: the map moves and zooms as usual; each tap drops a point and the
// orange line joins them. Search a place or tap "my location" to get there; name it in a sheet at the
// end, so the keyboard never covers the map.

interface Hit {
  key: string;
  title: string;
  sub: string;
  at: LngLat;
}

/** Places as you type: known cities first, then streets and landmarks (OpenStreetMap, via Photon). */
async function searchPlaces(q: string, near: LngLat, lang: string, signal: AbortSignal): Promise<Hit[]> {
  const needle = q.trim().toLowerCase();
  const local: Hit[] = [];
  for (const list of Object.values(CITIES)) {
    for (const [en, ar] of list) {
      if (en.toLowerCase().startsWith(needle) || ar.startsWith(q.trim())) {
        const c = cityCentre(en);
        if (c) local.push({ key: `city:${en}`, title: lang === 'ar' ? ar : en, sub: '', at: [c.lng, c.lat] });
      }
    }
  }
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q.trim())}&lat=${near[1]}&lon=${near[0]}&limit=6${lang === 'ar' ? '' : '&lang=en'}`;
  const res = await fetch(url, { signal });
  const json = await res.json();
  const remote: Hit[] = (json?.features || []).map((f: any, i: number) => {
    const pr = f.properties || {};
    return {
      key: `p:${pr.osm_type}${pr.osm_id}:${i}`,
      title: pr.name || pr.street || pr.city || '',
      sub: [pr.district, pr.city, pr.country].filter(Boolean).join(' · '),
      at: f.geometry?.coordinates as LngLat,
    };
  }).filter((h: Hit) => h.title && Array.isArray(h.at));
  return [...local.slice(0, 2), ...remote];
}

export default function RouteDrawScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ sport?: string; city?: string; lat?: string; lng?: string; place?: string }>();
  // Opened from a place in Play: the map starts there and the track takes its name.
  const placeAt: LngLat | null = params.lat && params.lng ? [Number(params.lng), Number(params.lat)] : null;
  const pos = useMyPosition();
  const ML = maplibre();
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [points, setPoints] = useState<LngLat[]>([]);
  const moved = useRef(!!placeAt);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(params.place ?? '');
  const [shared, setShared] = useState(true);
  const [busy, setBusy] = useState(false);

  const start = useMemo<LngLat>(() => {
    if (placeAt) return placeAt;
    if (pos) return [pos.lng, pos.lat];
    const c = cityCentre(params.city);
    return c ? [c.lng, c.lat] : [46.6753, 24.7136];
  }, []);

  const path = points;
  const distance = pathLength(path);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/host'));
  const flyTo = (at: LngLat, zoom = 15.5) => cameraRef.current?.easeTo?.({ center: at, zoom, duration: 700 });

  // The phone's position arrives after the map opens: go there unless they've moved the map already.
  useEffect(() => {
    if (pos && !moved.current && !points.length) flyTo([pos.lng, pos.lat]);
  }, [pos?.lat, pos?.lng]);

  // Suggestions as they type (a short pause, and only the latest answer counts).
  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const ctl = new AbortController();
    const id = setTimeout(() => {
      // Search around the place or city, never the member's own position (it stays on the phone).
      const c = cityCentre(params.city);
      const near: LngLat = placeAt ?? (c ? [c.lng, c.lat] : [46.6753, 24.7136]);
      searchPlaces(query, near, lang, ctl.signal).then(setHits).catch(() => {});
    }, 280);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [query]);

  function pick(h: Hit) {
    moved.current = true;
    Keyboard.dismiss();
    setQuery('');
    setHits([]);
    flyTo(h.at);
  }

  async function locate() {
    haptic('selection');
    const here = pos ?? (await refreshPosition(true));
    if (here) {
      moved.current = true;
      flyTo([here.lng, here.lat], 16);
    } else toast.show(t('route.noLocation'), 'info');
  }

  function tap(e: any) {
    const ll = e?.nativeEvent?.lngLat as LngLat | undefined;
    if (!ll) return;
    Keyboard.dismiss();
    if (hits.length) {
      setHits([]);
      return;
    }
    haptic('selection');
    setPoints((p0) => [...p0, ll]);
  }

  function undo() {
    setPoints((p0) => p0.slice(0, -1));
  }

  function closeLoop() {
    if (points.length < 3) return;
    haptic('selection');
    setPoints((p0) => [...p0, p0[0]]);
  }

  function next() {
    if (path.length < 2 || distance < 50) {
      toast.show(t('route.tooShort'), 'error');
      return;
    }
    setSaving(true);
  }

  async function save() {
    setBusy(true);
    try {
      const route = await saveRoute({ name: name.trim() || t('route.defaultName'), city: params.city || null, sport: params.sport || 'running', path, isPublic: shared });
      useRoutePick.getState().set(route);
      haptic('success');
      setSaving(false);
      close();
    } catch {
      haptic('error');
      toast.show(t('route.saveError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <View style={[s.header, { paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 8 }]}>
      <TextButton label={t('common.cancel')} onPress={close} color={p.inkSoft} />
      <Txt v="headline" style={{ flex: 1 }} align="center">
        {t('route.drawTitle')}
      </Txt>
      <View style={{ width: 60 }} />
    </View>
  );

  if (!ML) {
    return (
      <View style={s.screen}>
        {header}
        <View style={{ padding: 24, gap: 12 }}>
          <Txt v="title" size={20}>
            {t('route.needUpdate')}
          </Txt>
          <Txt v="body" color={p.inkSoft}>
            {t('route.needUpdateSub')}
          </Txt>
        </View>
      </View>
    );
  }

  const { Map, Camera, GeoJSONSource, Layer } = ML;
  return (
    <View style={s.screen}>
      {header}
      <View style={{ flex: 1 }}>
        <Map
          ref={mapRef}
          style={{ flex: 1 }}
          mapStyle={MAP_STYLE_URL}
          logo={false}
          attribution
          attributionPosition={{ bottom: 8, left: 8 }}
          compass={false}
          touchRotate={false}
          touchPitch={false}
          onPress={tap}
          onRegionWillChange={() => {
            moved.current = true;
          }}
        >
          <Camera ref={cameraRef} initialViewState={{ center: start, zoom: placeAt ? 15.5 : 15 }} />
          {pos ? (
            <GeoJSONSource id="me" data={pointFeature([pos.lng, pos.lat])}>
              <Layer type="circle" id="me-dot" paint={{ 'circle-radius': 7, 'circle-color': '#FFFFFF', 'circle-stroke-color': START_AQUA, 'circle-stroke-width': 3 }} />
            </GeoJSONSource>
          ) : null}
          {path.length > 1 ? (
            <GeoJSONSource id="draw" data={routeFeature(path)}>
              <Layer type="line" id="draw-glow" paint={{ 'line-color': ROUTE_ORANGE, 'line-opacity': 0.28, 'line-width': 14 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
              <Layer type="line" id="draw-line" paint={{ 'line-color': ROUTE_ORANGE, 'line-width': 5 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
            </GeoJSONSource>
          ) : null}
          {path.length ? (
            <GeoJSONSource id="draw-points" data={{ type: 'FeatureCollection', features: path.map((pt) => pointFeature(pt)) }}>
              <Layer type="circle" id="draw-point-dots" paint={{ 'circle-radius': 4, 'circle-color': '#F4F1EA', 'circle-stroke-color': ROUTE_ORANGE, 'circle-stroke-width': 2 }} />
            </GeoJSONSource>
          ) : null}
          {path.length ? (
            <GeoJSONSource id="draw-start" data={pointFeature(path[0])}>
              <Layer type="circle" id="draw-start-dot" paint={{ 'circle-radius': 8, 'circle-color': START_AQUA, 'circle-stroke-color': '#013131', 'circle-stroke-width': 3 }} />
            </GeoJSONSource>
          ) : null}
        </Map>


        {/* Search a place, with suggestions under it. */}
        <View style={s.searchWrap}>
          <View style={s.search}>
            <Icon name="explore" size={16} color={p.inkSoft} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('route.searchPlaceholder')}
              placeholderTextColor={p.inkFaint}
              style={[s.searchInput, { textAlign: lang === 'ar' ? 'right' : 'left' }]}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query ? (
              <Press onPress={() => { setQuery(''); setHits([]); }} accessibilityLabel={t('common.close')} feedback="selection">
                <Icon name="close" size={14} color={p.inkSoft} />
              </Press>
            ) : null}
          </View>
          {hits.length ? (
            <ScrollView style={s.hits} keyboardShouldPersistTaps="handled">
              {hits.map((h, i) => (
                <Press key={h.key} onPress={() => pick(h)} feedback="selection" style={[s.hit, i === hits.length - 1 ? { borderBottomWidth: 0 } : null]}>
                  <Icon name="pin" size={15} color={p.aqua} />
                  <View style={{ flex: 1 }}>
                    <Txt v="row" size={14} numberOfLines={1}>
                      {h.title}
                    </Txt>
                    {h.sub ? (
                      <Txt v="meta" numberOfLines={1}>
                        {h.sub}
                      </Txt>
                    ) : null}
                  </View>
                </Press>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* My location and undo, on the map's edge. */}
        <View style={s.tools}>
          <Press onPress={locate} feedback="selection" accessibilityLabel={t('route.myLocation')} style={s.tool}>
            <Icon name="locate" size={18} color={p.aqua} />
          </Press>
          <Press onPress={undo} feedback="selection" accessibilityLabel={t('route.undo')} style={[s.tool, { opacity: path.length ? 1 : 0.45 }]}>
            <Icon name="undo" size={18} color={p.ink} />
          </Press>
        </View>

        <View style={s.hint} pointerEvents="none">
          <Txt v="label" size={12} color={p.ink}>
            {path.length ? t('route.tapMore') : t('route.tapStart')}
          </Txt>
        </View>
      </View>

      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt v="stencil" size={28} style={{ flex: 1 }}>
            {fmtDistance(distance, lang)}
          </Txt>
          {points.length >= 3 ? <OutlineButton label={t('route.backToStart')} onPress={closeLoop} style={{ height: 38 }} /> : null}
        </View>
        <MarkerButton label={t('route.next')} onPress={next} />
      </View>

      {/* Naming happens here, after drawing: the keyboard never covers the map. */}
      <Sheet visible={saving} title={t('route.nameTitle')} onClose={() => setSaving(false)} footer={<View style={{ padding: 16, paddingBottom: 16 + insets.bottom }}><MarkerButton label={busy ? t('route.saving') : t('route.save')} onPress={save} loading={busy} /></View>}>
        <Txt v="stencil" size={26}>
          {fmtDistance(distance, lang)}
        </Txt>
        <Field value={name} onChangeText={setName} placeholder={t('route.namePlaceholder')} maxLength={60} autoFocus />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt v="body" size={14} style={{ flex: 1 }}>
            {t('route.shared')}
          </Txt>
          <Toggle value={shared} onValueChange={setShared} accessibilityLabel={t('route.shared')} />
        </View>
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
  searchWrap: { position: 'absolute', top: 10, left: 12, right: 12, gap: 6 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 12, borderRadius: 12, backgroundColor: p.boardDeep, borderWidth: 1, borderColor: p.ruleStrong },
  searchInput: { flex: 1, color: p.ink, fontSize: 15, paddingVertical: 0 },
  hits: { maxHeight: 260, borderRadius: 12, backgroundColor: p.boardDeep, borderWidth: 1, borderColor: p.rule },
  hit: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: p.rule },
  tools: { position: 'absolute', right: 12, bottom: 56, gap: 10 },
  tool: { width: 44, height: 44, borderRadius: 22, backgroundColor: p.boardDeep, borderWidth: 1, borderColor: p.ruleStrong, alignItems: 'center', justifyContent: 'center' },
  hint: { position: 'absolute', bottom: 14, alignSelf: 'center', backgroundColor: 'rgba(1,49,49,0.85)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  bar: { paddingHorizontal: 16, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
