import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Montserrat, Noto_Kufi_Arabic } from 'next/font/google';
import { createAdminClient } from '@/lib/supabase-server';

// Public landing for a shared session link (https://beast-tribe.vercel.app/s/<id>).
// The app's Share sheet sends this URL, mostly over WhatsApp, so it must preview well
// and open the session in the app. Pack-only sessions show nothing beyond "private".

export const dynamic = 'force-dynamic';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-mont', display: 'swap' });
const kufi = Noto_Kufi_Arabic({ subsets: ['arabic'], weight: ['500', '700'], variable: '--font-kufi', display: 'swap' });

const SITE = 'https://beast-tribe.vercel.app';
const APP_LINK = (id: string) => `beasttribe://session/${id}`;

type Lang = 'en' | 'ar';

const TZ: Record<string, string> = {
  SA: 'Asia/Riyadh', AE: 'Asia/Dubai', BH: 'Asia/Bahrain', KW: 'Asia/Kuwait',
  QA: 'Asia/Qatar', OM: 'Asia/Muscat', EG: 'Africa/Cairo', JO: 'Asia/Amman',
};

const SPORTS: Record<Lang, Record<string, string>> = {
  en: {
    running: 'Running', walking: 'Walking', gym: 'Gym', crossfit: 'CrossFit', hyrox: 'Hyrox', cycling: 'Cycling',
    swimming: 'Swimming', yoga: 'Yoga', pilates: 'Pilates', football: 'Football', basketball: 'Basketball', tennis: 'Tennis',
    padel: 'Padel', pickleball: 'Pickleball', badminton: 'Badminton', volleyball: 'Volleyball', boxing: 'Boxing', mma: 'MMA',
    hiking: 'Hiking', climbing: 'Climbing', skateboarding: 'Skate', meditation: 'Meditation',
  },
  ar: {
    running: 'جري', walking: 'مشي', gym: 'جيم', crossfit: 'كروس فت', hyrox: 'هايروكس', cycling: 'دراجات',
    swimming: 'سباحة', yoga: 'يوغا', pilates: 'بيلاتس', football: 'كرة قدم', basketball: 'كرة سلة', tennis: 'تنس',
    padel: 'بادل', pickleball: 'بيكلبول', badminton: 'ريشة طائرة', volleyball: 'كرة طائرة', boxing: 'ملاكمة', mma: 'فنون قتالية',
    hiking: 'هايكنج', climbing: 'تسلق', skateboarding: 'تزلج', meditation: 'تأمل',
  },
};

const COPY = {
  en: {
    brand: 'Beast Tribe',
    tagline: 'Find a session. Show up. Train with your tribe.',
    open: 'Open in Beast Tribe',
    soon: 'Beast Tribe is coming to the App Store soon.',
    hostedBy: (n: string) => `Hosted by ${n}`,
    going: (n: number) => `${n} going`,
    left: (n: number) => (n === 1 ? '1 spot left' : `${n} spots left`),
    full: 'Full · the waitlist is open in the app',
    womenOnly: 'Women only',
    cancelled: 'This session was cancelled.',
    finished: 'This session has finished.',
    private: 'This is a pack session. Open Beast Tribe to see it if you’re in the pack.',
    missing: 'This session isn’t on the board anymore.',
    directions: 'Directions',
    session: 'Session',
  },
  ar: {
    brand: 'بيست ترايب',
    tagline: 'اعثر على تمرين. احضر. تمرّن مع مجتمعك.',
    open: 'افتح في بيست ترايب',
    soon: 'بيست ترايب قريبًا على متجر التطبيقات.',
    hostedBy: (n: string) => `المنظّم: ${n}`,
    going: (n: number) => `المشاركون: ${n}`,
    left: (n: number) => `أماكن متبقية: ${n}`,
    full: 'اكتمل العدد · قائمة الانتظار متاحة في التطبيق',
    womenOnly: 'للسيدات فقط',
    cancelled: 'تم إلغاء هذا التمرين.',
    finished: 'انتهى هذا التمرين.',
    private: 'هذا تمرين خاص بفريق. افتح بيست ترايب لرؤيته إن كنت عضوًا في الفريق.',
    missing: 'هذا التمرين لم يعد على اللوحة.',
    directions: 'الاتجاهات',
    session: 'تمرين',
  },
};

interface Row {
  id: string;
  title: string | null;
  event_type: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  location_city: string | null;
  gym_name: string | null;
  country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  image_url: string | null;
  max_capacity: number | null;
  going_count: number | null;
  visibility: string | null;
  is_women_only: boolean | null;
  cancelled_at: string | null;
  host: { display_name: string | null; full_name: string | null } | null;
}

async function getSession(id: string): Promise<Row | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = createAdminClient();
  const { data } = await db
    .from('events')
    .select(
      'id, title, event_type, starts_at, ends_at, location_name, location_city, gym_name, country, location_lat, location_lng, image_url, max_capacity, going_count, visibility, is_women_only, cancelled_at, host:profiles!events_created_by_fkey(display_name, full_name)',
    )
    .eq('id', id)
    .maybeSingle();
  return (data as unknown as Row) ?? null;
}

function langOf(): Lang {
  const al = headers().get('accept-language') || '';
  return al.trim().toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

function when(row: Row, lang: Lang) {
  const tz = TZ[row.country || 'SA'] || 'Asia/Riyadh';
  const d = new Date(row.starts_at);
  const locale = lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB';
  const day = new Intl.DateTimeFormat(locale, { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  const time = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(d);
  return { day, time };
}

const sportName = (row: Row, lang: Lang) => SPORTS[lang][(row.event_type || '').toLowerCase()] || COPY[lang].session;
const firstName = (row: Row) => (row.host?.display_name || row.host?.full_name || '').trim().split(/\s+/)[0] || '';
const placeOf = (row: Row) => [row.location_name || row.gym_name, row.location_city].filter(Boolean).join(' · ');

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const row = await getSession(params.id);
  const lang = langOf();
  const base: Metadata = { metadataBase: new URL(SITE), robots: { index: false, follow: false } };
  if (!row || row.visibility === 'pack') {
    return { ...base, title: COPY[lang].brand, description: COPY[lang].tagline, openGraph: { title: COPY[lang].brand, description: COPY[lang].tagline, images: ['/mark-sun.png'] } };
  }
  const { day, time } = when(row, lang);
  const title = `${row.title || sportName(row, lang)} · ${COPY[lang].brand}`;
  const description = [`${day} · ${time}`, placeOf(row)].filter(Boolean).join(' · ');
  return {
    ...base,
    title,
    description,
    openGraph: { title, description, images: [row.image_url || '/mark-sun.png'], type: 'website' },
    twitter: { card: row.image_url ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function SessionLinkPage({ params }: { params: { id: string } }) {
  const lang = langOf();
  const c = COPY[lang];
  const row = await getSession(params.id);
  const ar = lang === 'ar';

  const shell = (body: React.ReactNode) => (
    <main
      dir={ar ? 'rtl' : 'ltr'}
      lang={lang}
      className={`${montserrat.variable} ${kufi.variable} min-h-screen bg-[#023C3C] text-[#F4F1EA]`}
      style={{ fontFamily: ar ? 'var(--font-kufi), var(--font-mont), sans-serif' : 'var(--font-mont), sans-serif' }}
    >
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-[#E88F24]" aria-hidden />
          <span className="text-sm font-extrabold uppercase tracking-[0.12em]">{c.brand}</span>
        </div>
        {body}
      </div>
    </main>
  );

  if (!row || row.visibility === 'pack') {
    return shell(
      <div className="flex flex-1 flex-col justify-center gap-6">
        <p className="text-2xl font-extrabold leading-snug">{row ? c.private : c.missing}</p>
        {row ? <OpenButton id={row.id} label={c.open} /> : null}
        <p className="text-sm text-[#F4F1EA]/70">{c.tagline}</p>
      </div>,
    );
  }

  const { day, time } = when(row, lang);
  const end = row.ends_at ? new Date(row.ends_at) : new Date(new Date(row.starts_at).getTime() + 120 * 60000);
  const finished = end.getTime() < Date.now();
  const going = row.going_count ?? 0;
  const left = row.max_capacity != null ? Math.max(0, row.max_capacity - going) : null;
  const place = placeOf(row);
  const host = firstName(row);
  const maps = row.location_lat != null && row.location_lng != null ? `https://maps.google.com/?q=${row.location_lat},${row.location_lng}` : place ? `https://maps.google.com/?q=${encodeURIComponent(place)}` : null;
  const status = row.cancelled_at ? c.cancelled : finished ? c.finished : null;

  return shell(
    <>
      {row.image_url ? (
        <div className="relative mt-6 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={row.image_url} alt="" className="h-48 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#023C3C]/20 to-[#023C3C]/85" />
        </div>
      ) : null}

      <div className={`${row.image_url ? '-mt-14' : 'mt-10'} relative flex items-end gap-4`}>
        <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full bg-[#E88F24] text-[#023C3C]">
          <span className="text-2xl font-extrabold leading-none" style={{ fontFamily: 'var(--font-mont), sans-serif' }}>{time.replace(/\s?(AM|PM|ص|م)$/i, '')}</span>
          <span className="mt-1 text-xs font-extrabold uppercase">{(time.match(/(AM|PM|ص|م)$/i) || [''])[0]}</span>
        </div>
        <div className="pb-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#F4F1EA]/75">{day}</p>
          <p className="text-sm font-semibold text-[#56C4C4]">{sportName(row, lang)}</p>
        </div>
      </div>

      <h1 className={`mt-5 text-3xl font-extrabold leading-tight ${ar ? '' : 'uppercase'}`}>{row.title || sportName(row, lang)}</h1>

      <ul className="mt-6 divide-y divide-[#F4F1EA]/15 border-y border-[#F4F1EA]/15">
        {place ? (
          <li className="flex items-center justify-between gap-3 py-3">
            <span className="text-base">{place}</span>
            {maps ? (
              <a href={maps} className="shrink-0 text-sm font-semibold text-[#56C4C4] underline underline-offset-4">
                {c.directions}
              </a>
            ) : null}
          </li>
        ) : null}
        <li className="py-3 text-base">
          {c.going(going)}
          {left != null ? <span className="text-[#F4F1EA]/75"> · {left > 0 ? c.left(left) : c.full}</span> : null}
        </li>
        {host ? <li className="py-3 text-base">{c.hostedBy(host)}</li> : null}
        {row.is_women_only ? <li className="py-3 text-base text-[#EF8C86]">{c.womenOnly}</li> : null}
      </ul>

      {status ? <p className="mt-6 text-lg font-extrabold text-[#FF7A70]">{status}</p> : null}

      <div className="mt-auto pt-10">
        <OpenButton id={row.id} label={c.open} />
        <p className="mt-4 text-center text-sm text-[#F4F1EA]/70">{c.soon}</p>
      </div>
    </>,
  );
}

function OpenButton({ id, label }: { id: string; label: string }) {
  return (
    <a
      href={APP_LINK(id)}
      className="flex h-14 w-full items-center justify-center rounded-[10px] bg-[#E88F24] text-base font-extrabold uppercase tracking-wide text-[#023C3C] hover:opacity-90"
    >
      {label}
    </a>
  );
}
