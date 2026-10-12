import type { SportId } from './sports';

// A picture of the field for each sport, so the Board shows at a glance what a session is.
// Mostly photos of real courts and fields (the Andorra compound, used with the owner's permission),
// served by the dashboard site; climbing and gym are free-licence photos (see
// admin/public/places/*/CREDITS.md). Sports without a photo show their icon on a tinted tile.
const BASE = 'https://beast-tribe.vercel.app/places/';

const PHOTO: Partial<Record<SportId, string>> = {
  padel: 'andorra/padel.jpg',
  tennis: 'andorra/tennis.jpg',
  pickleball: 'andorra/tennis.jpg',
  basketball: 'andorra/indoor-court.jpg',
  volleyball: 'andorra/indoor-court.jpg',
  badminton: 'andorra/indoor-court.jpg',
  football: 'andorra/football-pitch.jpg',
  swimming: 'andorra/pool.jpg',
  squash: 'andorra/squash.jpg',
  table_tennis: 'andorra/squash-table-tennis.jpg',
  cycling: 'andorra/spin-studio.jpg',
  spinning: 'andorra/spin-studio.jpg',
  boxing: 'andorra/boxing-studio.jpg',
  mma: 'andorra/boxing-studio.jpg',
  muay_thai: 'andorra/boxing-studio.jpg',
  running: 'andorra/gardens.jpg',
  walking: 'andorra/gardens.jpg',
  climbing: 'sports/climbing.jpg',
  gym: 'spots/gym.jpg',
  crossfit: 'spots/gym.jpg',
  hyrox: 'spots/gym.jpg',
  calisthenics: 'spots/gym.jpg',
};

/** The sport's field photo, or null when the sport has none. */
export function sportPicture(sport: string): string | null {
  const file = PHOTO[sport as SportId];
  return file ? BASE + file : null;
}

/** The session's own photo (court, spot or cover) first, then the sport's field. */
export function sessionPicture(sport: string, imageUrl?: string | null): string | null {
  return imageUrl || sportPicture(sport);
}

/**
 * A place's picture: its own photo, else the photo of the sport being hosted there (when the place
 * takes it), else of the first of its sports that has one. Places without a photo of their own still
 * look like what they are.
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
