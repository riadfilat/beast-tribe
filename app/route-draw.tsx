import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, PanResponder, Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { cityCentre, useMyPosition } from '../src/lib/location';
import { fmtDistance, LngLat, pathLength, saveRoute, useRoutePick } from '../src/data/routes';
import { MAP_STYLE_URL, maplibre, pointFeature, ROUTE_ORANGE, routeFeature, START_AQUA } from '../src/components/board/route';
import { Txt } from '../src/components/board/Txt';
import { Field, MarkerButton, Segmented, TextButton } from '../src/components/board/controls';
import { Toggle } from '../src/components/board/Toggle';
import { toast } from '../src/components/board/toast';
import { haptic } from '../src/lib/haptics';

// Draw a route with a finger on the Beast Tribe map. Lift and draw again to carry on; Undo takes back
// the last stroke; "Move map" pans and zooms. Saved routes are shared with the city unless kept private.
export default function RouteDrawScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ sport?: string; city?: string }>();
  const pos = useMyPosition();
  const ML = maplibre();
  const mapRef = useRef<any>(null);
  const [mode, setMode] = useState<'draw' | 'move'>('draw');
  // Strokes of points; a point is filled in when the map answers where the finger was.
  const strokes = useRef<(LngLat | null)[][]>([]);
  const [version, setVersion] = useState(0);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [name, setName] = useState('');
  const [shared, setShared] = useState(true);
  const [busy, setBusy] = useState(false);

  const centre = useMemo<LngLat>(() => {
    if (pos) return [pos.lng, pos.lat];
    const c = cityCentre(params.city);
    return c ? [c.lng, c.lat] : [46.6753, 24.7136];
  }, []);

  const path = useMemo(() => strokes.current.flat().filter(Boolean) as LngLat[], [version]);
  const distance = pathLength(path);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/host'));

  function addPoint(x: number, y: number) {
    const stroke = strokes.current[strokes.current.length - 1];
    if (!stroke || !mapRef.current) return;
    const i = stroke.length;
    stroke.push(null);
    mapRef.current
      .unproject([x, y])
      .then((ll: LngLat) => {
        stroke[i] = ll;
        setVersion((v) => v + 1);
      })
      .catch(() => {});
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          strokes.current.push([]);
          last.current = { x, y };
          addPoint(x, y);
        },
        onPanResponderMove: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          const l = last.current;
          if (l && Math.hypot(x - l.x, y - l.y) < 8) return;
          last.current = { x, y };
          addPoint(x, y);
        },
        onPanResponderRelease: () => {
          last.current = null;
          haptic('selection');
        },
      }),
    [],
  );

  function undo() {
    strokes.current.pop();
    setVersion((v) => v + 1);
  }

  async function save() {
    if (path.length < 2 || distance < 50) {
      toast.show(t('route.tooShort'), 'error');
      return;
    }
    setBusy(true);
    try {
      const route = await saveRoute({ name: name.trim() || t('route.defaultName'), city: params.city || null, sport: params.sport || 'running', path, isPublic: shared });
      useRoutePick.getState().set(route);
      haptic('success');
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
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      <View style={{ flex: 1 }}>
        <Map
          ref={mapRef}
          style={{ flex: 1 }}
          mapStyle={MAP_STYLE_URL}
          logo={false}
          attribution
          compass={false}
          dragPan={mode === 'move'}
          touchZoom={mode === 'move'}
          doubleTapZoom={mode === 'move'}
          touchRotate={false}
          touchPitch={false}
        >
          <Camera initialViewState={{ center: centre, zoom: 15 }} />
          {path.length > 1 ? (
            <GeoJSONSource id="draw" data={routeFeature(path)}>
              <Layer type="line" id="draw-glow" paint={{ 'line-color': ROUTE_ORANGE, 'line-opacity': 0.28, 'line-width': 14 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
              <Layer type="line" id="draw-line" paint={{ 'line-color': ROUTE_ORANGE, 'line-width': 5 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
            </GeoJSONSource>
          ) : null}
          {path.length ? (
            <GeoJSONSource id="draw-start" data={pointFeature(path[0])}>
              <Layer type="circle" id="draw-start-dot" paint={{ 'circle-radius': 8, 'circle-color': START_AQUA, 'circle-stroke-color': '#013131', 'circle-stroke-width': 3 }} />
            </GeoJSONSource>
          ) : null}
        </Map>
        {/* Drawing: the finger traces the route; the map stays still. */}
        {mode === 'draw' ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} {...pan.panHandlers} /> : null}
        <View style={s.hint} pointerEvents="none">
          <Txt v="label" size={12} color={p.ink}>
            {mode === 'draw' ? (path.length ? t('route.hintMore') : t('route.hintStart')) : t('route.hintMove')}
          </Txt>
        </View>
      </View>
      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt v="stencil" size={30}>
            {fmtDistance(distance, lang)}
          </Txt>
          <TextButton label={t('route.undo')} onPress={undo} color={path.length ? p.aqua : p.inkFaint} />
        </View>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'draw', label: t('route.modeDraw') },
            { value: 'move', label: t('route.modeMove') },
          ]}
        />
        <Field value={name} onChangeText={setName} placeholder={t('route.namePlaceholder')} maxLength={60} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt v="body" size={14} style={{ flex: 1 }}>
            {t('route.shared')}
          </Txt>
          <Toggle value={shared} onValueChange={setShared} accessibilityLabel={t('route.shared')} />
        </View>
        <MarkerButton label={busy ? t('route.saving') : t('route.save')} onPress={save} loading={busy} />
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
  hint: { position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: 'rgba(1,49,49,0.85)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  bar: { paddingHorizontal: 16, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
