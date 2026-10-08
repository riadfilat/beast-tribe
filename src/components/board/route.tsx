import React, { useMemo, useState } from 'react';
import { Platform, StyleProp, TurboModuleRegistry, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useKit } from '../../theme';
import { LEGAL_BASE_URL } from '../../lib/constants';
import type { LngLat } from '../../data/routes';
import { Txt } from './Txt';

// Routes on a Beast Tribe map: our own slate style (streets from OpenStreetMap via OpenFreeMap), the
// route in Operation Beast orange, the start in aqua. Builds without the map component (older app
// versions, the web preview) draw the route itself as a sketch.

export const ROUTE_ORANGE = '#E88F24';
export const START_AQUA = '#56C4C4';
export const MAP_STYLE_URL = `${LEGAL_BASE_URL}/map/beast.json`;

/** The map component is in this build (checked without loading it: the package throws when it isn't). */
export const mapsReady = Platform.OS !== 'web' && !!TurboModuleRegistry.get('MLRNMapViewModule');
let lib: any = null;
export function maplibre(): any | null {
  if (!mapsReady) return null;
  if (!lib) lib = require('@maplibre/maplibre-react-native');
  return lib;
}

export function boundsOf(path: LngLat[]): [number, number, number, number] {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [lng, lat] of path) {
    w = Math.min(w, lng); e = Math.max(e, lng); s = Math.min(s, lat); n = Math.max(n, lat);
  }
  return [w, s, e, n];
}

export function routeFeature(path: LngLat[]) {
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: path } };
}
export function pointFeature(at: LngLat) {
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: at } };
}

/** The route drawn on its own: a picture for lists, and for builds without the map. */
export function RouteSketch({ path, height, style, stroke = 4 }: { path: LngLat[]; height: number; style?: StyleProp<ViewStyle>; stroke?: number }) {
  const { p } = useKit();
  const [width, setWidth] = useState(0);
  const d = useMemo(() => {
    if (!width || path.length < 2) return null;
    const [w, s, e, n] = boundsOf(path);
    const k = Math.cos((((s + n) / 2) * Math.PI) / 180);
    const spanX = Math.max(1e-6, (e - w) * k);
    const spanY = Math.max(1e-6, n - s);
    const pad = Math.max(10, stroke * 3);
    const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
    const ox = (width - spanX * scale) / 2;
    const oy = (height - spanY * scale) / 2;
    const xy = ([lng, lat]: LngLat) => [ox + (lng - w) * k * scale, oy + (n - lat) * scale] as const;
    const pts = path.map(xy);
    return { line: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '), start: pts[0] };
  }, [width, height, path, stroke]);
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[{ height, backgroundColor: p.boardDeep, overflow: 'hidden' }, style]}>
      {d ? (
        <Svg width={width} height={height}>
          <Path d={d.line} stroke={ROUTE_ORANGE} strokeOpacity={0.28} strokeWidth={stroke * 2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d={d.line} stroke={ROUTE_ORANGE} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={d.start[0]} cy={d.start[1]} r={stroke * 1.6} fill={START_AQUA} stroke={p.boardDeep} strokeWidth={2} />
        </Svg>
      ) : null}
    </View>
  );
}

/** The route on the Beast Tribe map (or its sketch where the map isn't available). */
export function RouteMap({ path, height, style, interactive = false }: { path: LngLat[]; height: number; style?: StyleProp<ViewStyle>; interactive?: boolean }) {
  const ML = maplibre();
  const bounds = useMemo(() => boundsOf(path), [path]);
  if (!ML || path.length < 2) return <RouteSketch path={path} height={height} style={style} />;
  const { Map, Camera, GeoJSONSource, Layer } = ML;
  return (
    <View style={[{ height, overflow: 'hidden' }, style]}>
      <Map
        style={{ flex: 1 }}
        mapStyle={MAP_STYLE_URL}
        logo={false}
        attribution
        attributionPosition={{ bottom: 6, right: 6 }}
        compass={false}
        dragPan={interactive}
        touchZoom={interactive}
        doubleTapZoom={interactive}
        touchRotate={false}
        touchPitch={false}
      >
        <Camera initialViewState={{ bounds, padding: { top: 36, right: 36, bottom: 36, left: 36 } }} />
        <GeoJSONSource id="route" data={routeFeature(path)}>
          <Layer type="line" id="route-glow" paint={{ 'line-color': ROUTE_ORANGE, 'line-opacity': 0.28, 'line-width': 14 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
          <Layer type="line" id="route-line" paint={{ 'line-color': ROUTE_ORANGE, 'line-width': 5 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
        </GeoJSONSource>
        <GeoJSONSource id="route-start" data={pointFeature(path[0])}>
          <Layer type="circle" id="route-start-dot" paint={{ 'circle-radius': 8, 'circle-color': START_AQUA, 'circle-stroke-color': '#013131', 'circle-stroke-width': 3 }} />
        </GeoJSONSource>
      </Map>
    </View>
  );
}

/** "Distance · laps" chips under a route. */
export function RouteFacts({ items }: { items: string[] }) {
  const { p } = useKit();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map((x) => (
        <View key={x} style={{ borderWidth: 1, borderColor: p.ruleStrong, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Txt v="label" size={12} color={p.inkSoft}>
            {x}
          </Txt>
        </View>
      ))}
    </View>
  );
}
