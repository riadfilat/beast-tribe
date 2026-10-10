// Same city table as the app (src/lib/cities.ts), for matching on the server.
const CITIES: Record<string, [string, string][]> = {
  SA: [['Riyadh', 'الرياض'], ['Jeddah', 'جدة'], ['Dammam', 'الدمام'], ['Khobar', 'الخبر'], ['Mecca', 'مكة'], ['Medina', 'المدينة']],
  AE: [['Dubai', 'دبي'], ['Abu Dhabi', 'أبوظبي'], ['Sharjah', 'الشارقة'], ['Al Ain', 'العين']],
  BH: [['Manama', 'المنامة'], ['Riffa', 'الرفاع'], ['Muharraq', 'المحرق']],
  KW: [['Kuwait City', 'مدينة الكويت'], ['Hawalli', 'حولي'], ['Salmiya', 'السالمية']],
  QA: [['Doha', 'الدوحة'], ['Al Wakrah', 'الوكرة'], ['Al Khor', 'الخور']],
  OM: [['Muscat', 'مسقط'], ['Salalah', 'صلالة'], ['Sohar', 'صحار']],
  EG: [['Cairo', 'القاهرة'], ['Alexandria', 'الإسكندرية'], ['Giza', 'الجيزة']],
  JO: [['Amman', 'عمّان'], ['Aqaba', 'العقبة'], ['Irbid', 'إربد']],
};

const cityKey = (city?: string | null) => (city || '').trim().replace(/\s+/g, ' ').toLowerCase();

export function cityKeys(city?: string | null): string[] {
  const k = cityKey(city);
  if (!k) return [];
  const out = new Set([k]);
  for (const list of Object.values(CITIES)) {
    for (const pair of list) {
      if (pair.some((n) => cityKey(n) === k)) pair.forEach((n) => out.add(cityKey(n)));
    }
  }
  return Array.from(out);
}

// City centres, the same as the app's (src/lib/location.ts, CENTRES), for the command center map.
const CENTRES: Record<string, [number, number]> = {
  Riyadh: [24.7136, 46.6753], Jeddah: [21.4858, 39.1925], Dammam: [26.4207, 50.0888], Khobar: [26.2172, 50.1971],
  Mecca: [21.3891, 39.8579], Medina: [24.5247, 39.5692], Dubai: [25.2048, 55.2708], 'Abu Dhabi': [24.4539, 54.3773],
  Sharjah: [25.3463, 55.4209], 'Al Ain': [24.1302, 55.8023], Manama: [26.2285, 50.586], Riffa: [26.13, 50.555],
  Muharraq: [26.2572, 50.6119], 'Kuwait City': [29.3759, 47.9774], Hawalli: [29.3328, 48.0286], Salmiya: [29.3339, 48.0758],
  Doha: [25.2854, 51.531], 'Al Wakrah': [25.1659, 51.5976], 'Al Khor': [25.6839, 51.5058], Muscat: [23.588, 58.3829],
  Salalah: [17.0151, 54.0924], Sohar: [24.3643, 56.7468], Cairo: [30.0444, 31.2357], Alexandria: [31.2001, 29.9187],
  Giza: [30.0131, 31.2089], Amman: [31.9454, 35.9284], Aqaba: [29.5321, 35.0063], Irbid: [32.5556, 35.85],
};

/** A stored city key (English or Arabic, lower case) → its English name and centre, or null. */
export function cityPlace(key: string): { name: string; lat: number; lng: number } | null {
  const k = cityKey(key);
  for (const list of Object.values(CITIES)) {
    for (const pair of list) {
      if (pair.some((n) => cityKey(n) === k) && CENTRES[pair[0]]) return { name: pair[0], lat: CENTRES[pair[0]][0], lng: CENTRES[pair[0]][1] };
    }
  }
  return null;
}

