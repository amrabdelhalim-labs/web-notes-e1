/**
 * Root page — server-side redirect to the default locale.
 *
 * The next-intl middleware normally handles the / → /ar redirect, but this
 * server-side redirect acts as a belt-and-suspenders fallback and avoids the
 * previous client-only redirect that used a non-locale-aware router and sent
 * the user to /notes (which doesn't exist — the real path is /ar/notes).
 */
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/ar');
}
