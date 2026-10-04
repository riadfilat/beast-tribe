import { useAuth } from '../providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from './preview';

/** The signed-in member's id (the demo member in the web preview), or null when signed out. */
export function useMeId(): string | null {
  const { user } = useAuth();
  return PREVIEW ? PREVIEW_ME : user?.id ?? null;
}
