/**
 * Types Tests
 *
 * Validates that the shared TypeScript types have the correct shape at runtime.
 * Uses object-literal assignability checks to guard against accidental renames.
 */

import type { User, Note, NoteType, UserLanguagePref, SupportedLocale } from '@/app/types';

describe('Shared types', () => {
  describe('User', () => {
    it('accepts a valid user object', () => {
      const user: User = {
        _id: 'abc123',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ar',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      expect(user._id).toBe('abc123');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
      expect(user.language).toBe('ar');
      expect(user.createdAt).toBeTruthy();
      expect(user.updatedAt).toBeTruthy();
    });

    it('allows displayName to be omitted', () => {
      const user: User = {
        _id: 'xyz',
        username: 'u2',
        email: 'u2@x.com',
        language: 'en',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(user.displayName).toBeUndefined();
    });
  });

  describe('Note', () => {
    it('accepts a valid text note', () => {
      const note: Note = {
        _id: 'n1',
        title: 'Test Note',
        content: 'Hello world',
        type: 'text',
        user: 'u1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      expect(note._id).toBe('n1');
      expect(note.title).toBe('Test Note');
      expect(note.type).toBe('text');
      expect(note.user).toBe('u1');
    });

    it('accepts a valid voice note', () => {
      const note: Note = {
        _id: 'n2',
        title: 'Voice Note',
        audioData: 'data:audio/wav;base64,abc',
        audioDuration: 5.3,
        type: 'voice',
        user: 'u1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      expect(note.type).toBe('voice');
      expect(note.audioData).toContain('data:audio');
      expect(note.audioDuration).toBe(5.3);
    });

    it('allows content/audioData/audioDuration to be absent', () => {
      const note: Note = {
        _id: 'n3',
        title: 'Minimal',
        type: 'text',
        user: 'u1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(note.content).toBeUndefined();
      expect(note.audioData).toBeUndefined();
      expect(note.audioDuration).toBeUndefined();
    });
  });

  describe('NoteType union', () => {
    it('accepts "text" as a NoteType', () => {
      const t: NoteType = 'text';
      expect(t).toBe('text');
    });

    it('accepts "voice" as a NoteType', () => {
      const t: NoteType = 'voice';
      expect(t).toBe('voice');
    });
  });

  describe('UserLanguagePref union', () => {
    it('accepts "ar", "en", and "unset"', () => {
      const prefs: UserLanguagePref[] = ['ar', 'en', 'unset'];
      expect(prefs).toHaveLength(3);
    });
  });

  describe('SupportedLocale union', () => {
    it('accepts "ar" and "en"', () => {
      const locales: SupportedLocale[] = ['ar', 'en'];
      expect(locales).toHaveLength(2);
    });
  });
});
