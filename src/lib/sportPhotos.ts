import type { SportId } from './sports';

// A picture for each sport, for places and sessions without a photo of their own.
// It is brand art, not a photo, so it never passes off another venue as this one: the sport's
// icon (Operation Beast's own set and game-icons.net, CC BY 3.0) on a brand colourway, made by
// scripts/brand/place-art/generate.js and served by the dashboard site. Real photos (a place's
// own, uploaded in HQ, or the Andorra courts) always come first.
const BASE = 'https://beast-tribe.vercel.app/places/art/';

const ART: Partial<Record<SportId, string>> = {
  padel: 'padel', tennis: 'tennis', pickleball: 'racket', squash: 'racket', badminton: 'badminton',
  table_tennis: 'pingpong', football: 'football', basketball: 'basketball', volleyball: 'volleyball',
  swimming: 'swim', diving: 'swim', climbing: 'climbing',
  boxing: 'boxing', muay_thai: 'boxing', mma: 'martial', jiu_jitsu: 'martial',
  yoga: 'yoga', meditation: 'yoga', pilates: 'yoga', barre: 'yoga',
  gym: 'dumbbell', calisthenics: 'dumbbell', crossfit: 'kettlebell', hyrox: 'kettlebell', bootcamp: 'kettlebell', lagree: 'kettlebell',
  running: 'run', walking: 'walk', hiking: 'hiking', cycling: 'cycling', spinning: 'cycling', horse_riding: 'riding',
};

/** The sport's art, or null when the sport has none (the app then shows its icon). */
export function sportPicture(sport: string): string | null {
  const art = ART[sport as SportId];
  return art ? `${BASE}${art}.jpg` : null;
}

/** The session's own photo (court, spot or cover) first, then the sport's art. */
export function sessionPicture(sport: string, imageUrl?: string | null): string | null {
  return imageUrl || sportPicture(sport);
}

/**
 * A place's picture: its own photo, else the art of the sport being hosted there (when the place
 * takes it), else of the first of its sports that has art.
 */
export function placePicture(imageUrl: string | null, sports: string[], sport?: string | null): string | null {
  if (imageUrl) return imageUrl;
  if (sport && sports.includes(sport) && sportPicture(sport)) return sportPicture(sport);
  for (const s of sports) {
    const pic = sportPicture(s);
    if (pic) return pic;
  }
  return null;
}
