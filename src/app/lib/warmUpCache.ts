'use client';

/**
 * warmUpCache.ts — offline cache seeding after PWA activation.
 *
 * Called from PwaActivationDialog immediately after the SW registers.
 * Runs all phases in sequence:
 *
 *   Phase 1 (awaited) — Fetch the full notes list and seed Dexie so the notes
 *     page works offline right away.
 *
 *   Phase 2a (awaited with allSettled) — Fetch each voice note individually to
 *     capture the full audioData (the list API strips it for bandwidth). Capped
 *     at MAX_AUDIO_PREFETCH notes to avoid a very long activation.
 *
 *   Phase 2b (fire-and-forget) — Pre-fetch page shells for all important routes
 *     so Next.js / the SW runtime cache has them ready for offline navigation.
 *
 * Every phase wraps errors internally: activation must never fail because of
 * a warm-up error.
 */

import { cacheNotes } from '@/app/lib/db';
import { getNotesApi, getNoteApi } from '@/app/lib/api';
import { MAX_CACHED_NOTES, SUPPORTED_LOCALES } from '@/app/config';
import type { Note } from '@/app/types';

/** Maximum number of voice notes to individually pre-fetch for audioData. */
const MAX_AUDIO_PREFETCH = 20;

/**
 * Pre-fetch important page shells in the background so the SW caches them.
 * The SW's defaultCache (NetworkFirst / StaleWhileRevalidate) stores each
 * response so subsequent offline navigations are served from the cache.
 *
 * Exported for unit testing; call-sites should treat it as an impl detail.
 */
export async function prefetchPageShells(noteIds: string[]): Promise<void> {
  const paths: string[] = SUPPORTED_LOCALES.flatMap((locale) => [
    `/${locale}/notes`,
    `/${locale}/notes/new`,
    `/${locale}/profile`,
    ...noteIds
      .slice(0, 20)
      .flatMap((id) => [`/${locale}/notes/${id}`, `/${locale}/notes/${id}/edit`]),
  ]);

  await Promise.allSettled(
    paths.map((url) =>
      // credentials: 'include' so the session cookie (if any) is forwarded
      fetch(url, { credentials: 'include' }).catch(() => {})
    )
  );
}

/**
 * Seed the offline cache immediately after PWA activation.
 *
 * Awaits phase 1 + 2a; fires phase 2b in the background.
 * Never throws — all errors are caught internally.
 */
export async function warmUpOfflineCache(): Promise<void> {
  let notes: Note[] = [];

  // ── Phase 1: Seed notes list into Dexie ───────────────────────────────────
  try {
    const res = await getNotesApi({ page: 1, limit: MAX_CACHED_NOTES });
    notes = res.data.notes;
    await cacheNotes(notes);
  } catch {
    // Can't fetch list → no further warm-up possible
    return;
  }

  const noteIds = notes.map((n) => n._id);
  const voiceNoteIds = notes.filter((n) => n.type === 'voice').map((n) => n._id);

  // ── Phase 2a: Fetch voice notes individually (includes audioData) ─────────
  await Promise.allSettled(
    voiceNoteIds.slice(0, MAX_AUDIO_PREFETCH).map(async (id) => {
      try {
        const res = await getNoteApi(id);
        await cacheNotes([res.data]);
      } catch {
        // One voice note failing is not critical
      }
    })
  );

  // ── Phase 2b: Pre-fetch page shells (background — never blocks the dialog) ─
  void prefetchPageShells(noteIds);
}
