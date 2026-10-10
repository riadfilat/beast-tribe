'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface MapCity {
  key: string;
  name: string;
  lat: number;
  lng: number;
  members: number;
  active: number;
  live: number;
}

/**
 * Where members are, on the Beast Tribe map (the app's own style). Bubble size = members,
 * the aqua fill = active this week, the orange dot = sessions on right now. Tap a city to filter.
 */
export function CityMap({ cities, selected }: { cities: MapCity[]; selected: string | null }) {
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    let map: any;
    let gone = false;
    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (gone || !box.current) return;
      map = new maplibregl.Map({
        container: box.current,
        style: '/map/beast.json',
        center: [46.7, 24.7],
        zoom: 4,
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
      const max = Math.max(1, ...cities.map((c) => c.members));
      for (const c of cities) {
        const size = 18 + Math.sqrt(c.members / max) * 40;
        const el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('aria-label', `${c.name}: ${c.members} members, ${c.active} active this week, ${c.live} sessions on now`);
        el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;cursor:pointer;position:relative;border:${selected === c.key ? 3 : 1.5}px solid #56C4C4;background:rgba(86,196,196,${0.18 + (c.members ? Math.min(0.5, c.active / c.members) : 0)});opacity:${selected && selected !== c.key ? 0.4 : 1}`;
        el.innerHTML =
          (c.live ? `<span style="position:absolute;top:50%;left:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#E88F24;box-shadow:0 0 0 4px rgba(232,143,36,.25)"></span>` : '') +
          `<span style="position:absolute;left:100%;top:50%;transform:translateY(-50%);margin-left:6px;white-space:nowrap;font:600 12px var(--bt-body),sans-serif;color:#F4F1EA;text-shadow:0 1px 3px #012A2A">${c.name} <span style="color:#56C4C4">${c.members.toLocaleString('en')}</span></span>`;
        el.onclick = () => {
          const q = new URLSearchParams(params.toString());
          if (selected === c.key) q.delete('city');
          else q.set('city', c.key);
          router.push(`/hq?${q.toString()}`);
        };
        new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(map);
      }
      if (cities.length > 1) {
        const lngs = cities.map((c) => c.lng);
        const lats = cities.map((c) => c.lat);
        map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 7, duration: 0 });
      } else if (cities.length === 1) {
        map.jumpTo({ center: [cities[0].lng, cities[0].lat], zoom: 8 });
      }
    })();
    return () => {
      gone = true;
      map?.remove();
    };
  }, [cities, selected, params, router]);

  return <div ref={box} className="w-full rounded-xl overflow-hidden" style={{ height: 340, background: 'var(--deep)' }} />;
}
