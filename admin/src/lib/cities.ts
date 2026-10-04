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
