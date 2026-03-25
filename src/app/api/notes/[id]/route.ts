/**
 * GET    /api/notes/[id] — Get a single note by ID
 * PUT    /api/notes/[id] — Update a note
 * DELETE /api/notes/[id] — Delete a note
 *
 * All routes require JWT authentication and verify ownership.
 * audioData is returned as a base64 string on the single-GET route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getNoteRepository } from '@/app/repositories/note.repository';
import { validateUpdateNoteInput } from '@/app/validators';
import {
  validationError,
  forbiddenError,
  notFoundError,
  serverError,
  getRequestLocale,
  serverMsg,
} from '@/app/lib/apiErrors';
import type { INote, Note } from '@/app/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function serializeNote(doc: INote, includeAudio = false): Note {
  const userId =
    doc.user instanceof Types.ObjectId
      ? doc.user.toString()
      : String((doc.user as { _id: unknown })._id ?? doc.user);

  return {
    _id: (doc._id as Types.ObjectId).toString(),
    title: doc.title,
    content: doc.content,
    audioData: includeAudio && doc.audioData ? doc.audioData.toString('base64') : undefined,
    audioDuration: doc.audioDuration,
    type: doc.type,
    user: userId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const locale = getRequestLocale(request);
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    await connectDB();
    const noteRepo = getNoteRepository();
    const note = await noteRepo.findById(id);

    if (!note) return notFoundError(locale, 'noteNotFound');

    const ownerId =
      note.user instanceof Types.ObjectId
        ? note.user.toString()
        : String((note.user as { _id: unknown })._id ?? note.user);

    if (ownerId !== auth.userId) return forbiddenError();

    return NextResponse.json({ data: serializeNote(note, true) }, { status: 200 });
  } catch (error) {
    console.error('Note get error:', error);
    return serverError();
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const locale = getRequestLocale(request);
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const errors = validateUpdateNoteInput(body, locale);
    if (errors.length) return validationError(errors, locale);

    await connectDB();
    const noteRepo = getNoteRepository();
    const existing = await noteRepo.findById(id);

    if (!existing) return notFoundError(locale, 'noteNotFound');

    const ownerId =
      existing.user instanceof Types.ObjectId
        ? existing.user.toString()
        : String((existing.user as { _id: unknown })._id ?? existing.user);

    if (ownerId !== auth.userId) return forbiddenError(locale);

    // Guard: type is immutable after creation — reject cross-type field updates
    if (
      existing.type === 'text' &&
      (body.audioData !== undefined || body.audioDuration !== undefined)
    ) {
      return validationError([serverMsg(locale, 'textNoteAudioField')], locale);
    }
    if (existing.type === 'voice' && body.content !== undefined) {
      return validationError([serverMsg(locale, 'voiceNoteTextField')], locale);
    }

    const updates: Partial<INote> = {};
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.content !== undefined) updates.content = String(body.content).trim();
    if (body.audioDuration !== undefined) updates.audioDuration = Number(body.audioDuration);
    if (body.audioData !== undefined && typeof body.audioData === 'string') {
      updates.audioData = Buffer.from(body.audioData, 'base64');
    }

    const updated = await noteRepo.update(id, updates);
    if (!updated) return notFoundError(locale, 'noteNotFound');

    return NextResponse.json(
      { data: serializeNote(updated as INote, false), message: 'تم تحديث الملاحظة بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Note update error:', error);
    return serverError(locale);
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const locale = getRequestLocale(request);
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    await connectDB();
    const noteRepo = getNoteRepository();
    const existing = await noteRepo.findById(id);

    if (!existing) return notFoundError(locale, 'noteNotFound');

    const ownerId =
      existing.user instanceof Types.ObjectId
        ? existing.user.toString()
        : String((existing.user as { _id: unknown })._id ?? existing.user);

    if (ownerId !== auth.userId) return forbiddenError(locale);

    await noteRepo.delete(id);

    return NextResponse.json({ message: 'تم حذف الملاحظة بنجاح' }, { status: 200 });
  } catch (error) {
    console.error('Note delete error:', error);
    return serverError(locale);
  }
}
