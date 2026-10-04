import type { SportId } from './sports';

// A picture of the field for each sport, so the Board shows at a glance what a session is.
// Photos of real courts and fields (the Andorra compound, used with the owner's permission),
// served by the dashboard site. Sports without a photo show their icon on a tinted tile.
const BASE = 'https://beast-tribe.vercel.app/places/andorra/';

const PHOTO: Partial<Record<SportId, string>> = {
  padel: 'padel.jpg',
  tennis: 'tennis.jpg',
  pickleball: 'tennis.jpg',
  basketball: 'indoor-court.jpg',
  volleyball: 'indoor-court.jpg',
  badminton: 'indoor-court.jpg',
  football: 'football-pitch.jpg',
  swimming: 'pool.jpg',
  squash: 'squash.jpg',
  table_tennis: 'squash-table-tennis.jpg',
  cycling: 'spin-studio.jpg',
  boxing: 'boxing-studio.jpg',
  mma: 'boxing-studio.jpg',
  running: 'gardens.jpg',
  walking: 'gardens.jpg',
};

/** The session's own photo (court, spot or cover) first, then the sport's field. */
export function sessionPicture(sport: string, imageUrl?: string | null): string | null {
  if (imageUrl) return imageUrl;
  const file = PHOTO[sport as SportId];
  return file ? BASE + file : null;
}
