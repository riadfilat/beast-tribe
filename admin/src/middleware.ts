import { type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase-middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Protect every page, but never static files: link-preview images, icons and other
    // public assets must reach logged-out visitors and crawlers (WhatsApp, iMessage).
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|webmanifest)$).*)',
  ],
};
