import { useAuth } from '../providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from './preview';
import { nearestCity, useMyPosition } from '../lib/location';

/** The signed-in member's id (the demo member in the web preview), or null when signed out. */
export function useMeId(): string | null {
  const { user } = useAuth();
  return PREVIEW ? PREVIEW_ME : user?.id ?? null;
}

/** The city the member is in right now: the phone's nearest known city, else their profile city. */
export function useHereCity(): string | null {
  const { profile } = useAuth();
  const pos = useMyPosition();
  return (pos && nearestCity(pos)) || profile?.city || null;
}
