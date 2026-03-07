/**
 * GET  /api/notes — List the authenticated user's notes
 * POST /api/notes — Create a new note
 *
 * GET supports:
 *   ?page=1   — page number (default 1)
 *   ?limit=10 — items per page (default 10, max 50)
 *   ?type=text|voice — filter by note type
 *   ?q=...    — full-text search in title and content
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getNoteRepository } from '@/app/repositories/note.repository';
import { validateNoteInput } from '@/app/validators';
import {
  validationError,
  serverError,
} from '@/app/lib/apiErrors';
import type { INote, Note, NoteType } from '@/app/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a Mongoose INote document to a JSON-safe Note object.
 * audioData is excluded from list responses to reduce payload size.
 */
function serializeNote(doc: INote, includeAudio = false): Note {
  const userId =
    doc.user instanceof Types.ObjectId
      ? doc.user.toString()
      : String((doc.user as { _id: unknown })._id ?? doc.user);

  return {
    _id: (doc._id as Types.ObjectId).toString(),
    title: doc.title,
    content: doc.content,
    audioData:
      includeAudio && doc.audioData
        ? doc.audioData.toString('base64')
        : undefined,
    audioDuration: doc.audioDuration,
    type: doc.type,
    user: userId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '10') || 10));
    const type = searchParams.get('type') as NoteType | null;
    const q = searchParams.get('q')?.trim();

    await connectDB();
    const noteRepo = getNoteRepository();

    let result;
    if (q) {
      result = await noteRepo.search(auth.userId, q, page, limit);
    } else if (type === 'text' || type === 'voice') {
      result = await noteRepo.findByType(auth.userId, type, page, limit);
    } else {
      result = await noteRepo.findByUserPaginated(auth.userId, page, limit);
    }

    return NextResponse.json(
      {
        data: {
          notes: result.rows.map((n) => serializeNote(n)),
          count: result.count,
          page: result.page,
          totalPages: result.totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notes list error:', error);
    return serverError();
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const errors = validateNoteInput(body);
    if (errors.length) return validationError(errors);

    await connectDB();
    const noteRepo = getNoteRepository();

    // Convert base64 audioData string → Buffer before persisting
    const audioBuffer =
      body.audioData && typeof body.audioData === 'string'
        ? Buffer.from(body.audioData, 'base64')
        : undefined;

    const note = await noteRepo.create({
      title: body.title.trim(),
      content: body.type === 'text' ? (body.content ?? '').trim() : undefined,
      audioData: audioBuffer,
      audioDuration: body.audioDuration,
      type: body.type,
      user: new Types.ObjectId(auth.userId),
    });

    return NextResponse.json(
      { data: serializeNote(note as INote, true), message: 'تم إنشاء الملاحظة بنجاح' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Note create error:', error);
    return serverError();
  }
}
