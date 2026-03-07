/**
 * Validator Tests
 *
 * Tests all 6 validation functions from validators/index.ts.
 * Each validator returns string[] — empty = valid.
 */

import {
  validateRegisterInput,
  validateLoginInput,
  validateNoteInput,
  validateUpdateNoteInput,
  validateUpdateUserInput,
  validateChangePasswordInput,
} from '@/app/validators';

// ─── validateRegisterInput ──────────────────────────────────────────────────

describe('validateRegisterInput', () => {
  const valid = { username: 'testuser', email: 'test@example.com', password: '123456' };

  it('returns empty array for valid input', () => {
    expect(validateRegisterInput(valid)).toEqual([]);
  });

  it('rejects empty username', () => {
    const errors = validateRegisterInput({ ...valid, username: '' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('اسم المستخدم');
  });

  it('rejects short username (< 3 chars)', () => {
    const errors = validateRegisterInput({ ...valid, username: 'ab' });
    expect(errors[0]).toContain('3');
  });

  it('rejects long username (> 30 chars)', () => {
    const errors = validateRegisterInput({ ...valid, username: 'a'.repeat(31) });
    expect(errors[0]).toContain('30');
  });

  it('rejects invalid email', () => {
    const errors = validateRegisterInput({ ...valid, email: 'not-an-email' });
    expect(errors[0]).toContain('البريد الإلكتروني');
  });

  it('rejects empty email', () => {
    const errors = validateRegisterInput({ ...valid, email: '' });
    expect(errors[0]).toContain('البريد الإلكتروني');
  });

  it('rejects short password (< 6 chars)', () => {
    const errors = validateRegisterInput({ ...valid, password: '12345' });
    expect(errors[0]).toContain('6');
  });

  it('rejects empty password', () => {
    const errors = validateRegisterInput({ ...valid, password: '' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns multiple errors for all fields invalid', () => {
    const errors = validateRegisterInput({ username: '', email: '', password: '' });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── validateLoginInput ─────────────────────────────────────────────────────

describe('validateLoginInput', () => {
  const valid = { email: 'test@example.com', password: '123456' };

  it('returns empty array for valid input', () => {
    expect(validateLoginInput(valid)).toEqual([]);
  });

  it('rejects invalid email', () => {
    const errors = validateLoginInput({ ...valid, email: 'bad' });
    expect(errors[0]).toContain('البريد الإلكتروني');
  });

  it('rejects short password', () => {
    const errors = validateLoginInput({ ...valid, password: '123' });
    expect(errors[0]).toContain('6');
  });

  it('returns two errors when both invalid', () => {
    const errors = validateLoginInput({ email: '', password: '' });
    expect(errors.length).toBe(2);
  });
});

// ─── validateNoteInput ──────────────────────────────────────────────────────

describe('validateNoteInput', () => {
  const validText = { title: 'Test Note', type: 'text' as const, content: 'Hello world' };
  const validVoice = { title: 'Voice', type: 'voice' as const, audioData: 'base64data' };

  it('returns empty array for valid text note', () => {
    expect(validateNoteInput(validText)).toEqual([]);
  });

  it('returns empty array for valid voice note', () => {
    expect(validateNoteInput(validVoice)).toEqual([]);
  });

  it('rejects empty title', () => {
    const errors = validateNoteInput({ ...validText, title: '' });
    expect(errors[0]).toContain('عنوان');
  });

  it('rejects title over 200 chars', () => {
    const errors = validateNoteInput({ ...validText, title: 'x'.repeat(201) });
    expect(errors[0]).toContain('200');
  });

  it('rejects invalid type', () => {
    const errors = validateNoteInput({ ...validText, type: 'image' as 'text' });
    expect(errors[0]).toContain('نوع');
  });

  it('rejects text note without content', () => {
    const errors = validateNoteInput({ title: 'T', type: 'text', content: '' });
    expect(errors[0]).toContain('محتوى');
  });

  it('rejects voice note without audioData', () => {
    const errors = validateNoteInput({ title: 'T', type: 'voice' });
    expect(errors[0]).toContain('صوتية');
  });

  it('rejects negative audioDuration', () => {
    const errors = validateNoteInput({ ...validVoice, audioDuration: -1 });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts zero audioDuration', () => {
    const errors = validateNoteInput({ ...validVoice, audioDuration: 0 });
    expect(errors).toEqual([]);
  });
});

// ─── validateUpdateNoteInput ────────────────────────────────────────────────

describe('validateUpdateNoteInput', () => {
  it('returns empty for valid partial update', () => {
    expect(validateUpdateNoteInput({ title: 'Updated' })).toEqual([]);
  });

  it('returns empty when no fields provided', () => {
    expect(validateUpdateNoteInput({})).toEqual([]);
  });

  it('rejects empty title if provided', () => {
    const errors = validateUpdateNoteInput({ title: '' });
    expect(errors[0]).toContain('عنوان');
  });

  it('rejects overly long title', () => {
    const errors = validateUpdateNoteInput({ title: 'x'.repeat(201) });
    expect(errors[0]).toContain('200');
  });

  it('rejects negative audioDuration', () => {
    const errors = validateUpdateNoteInput({ audioDuration: -5 });
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ─── validateUpdateUserInput ────────────────────────────────────────────────

describe('validateUpdateUserInput', () => {
  it('returns empty for valid update', () => {
    expect(validateUpdateUserInput({ username: 'newname', email: 'a@b.com' })).toEqual([]);
  });

  it('returns empty when no fields provided', () => {
    expect(validateUpdateUserInput({})).toEqual([]);
  });

  it('rejects short username', () => {
    const errors = validateUpdateUserInput({ username: 'ab' });
    expect(errors[0]).toContain('3');
  });

  it('rejects long username', () => {
    const errors = validateUpdateUserInput({ username: 'a'.repeat(31) });
    expect(errors[0]).toContain('30');
  });

  it('rejects invalid email', () => {
    const errors = validateUpdateUserInput({ email: 'nope' });
    expect(errors[0]).toContain('البريد');
  });

  it('rejects long displayName (> 50 chars)', () => {
    const errors = validateUpdateUserInput({ displayName: 'a'.repeat(51) });
    expect(errors[0]).toContain('50');
  });

  it('rejects unsupported language', () => {
    const errors = validateUpdateUserInput({ language: 'fr' as 'ar' });
    expect(errors[0]).toContain('اللغة');
  });

  it('accepts valid language "ar"', () => {
    expect(validateUpdateUserInput({ language: 'ar' })).toEqual([]);
  });

  it('accepts valid language "en"', () => {
    expect(validateUpdateUserInput({ language: 'en' })).toEqual([]);
  });
});

// ─── validateChangePasswordInput ────────────────────────────────────────────

describe('validateChangePasswordInput', () => {
  const valid = {
    currentPassword: 'oldpass',
    newPassword: 'newpass123',
    confirmPassword: 'newpass123',
  };

  it('returns empty for valid input', () => {
    expect(validateChangePasswordInput(valid)).toEqual([]);
  });

  it('rejects empty current password', () => {
    const errors = validateChangePasswordInput({ ...valid, currentPassword: '' });
    expect(errors[0]).toContain('الحالية');
  });

  it('rejects short new password', () => {
    const errors = validateChangePasswordInput({
      ...valid,
      newPassword: '12345',
      confirmPassword: '12345',
    });
    expect(errors[0]).toContain('6');
  });

  it('rejects mismatched confirm password', () => {
    const errors = validateChangePasswordInput({ ...valid, confirmPassword: 'different' });
    expect(errors.some((e) => e.includes('متطابق'))).toBe(true);
  });

  it('rejects new password same as current', () => {
    const errors = validateChangePasswordInput({
      currentPassword: 'samepass',
      newPassword: 'samepass',
      confirmPassword: 'samepass',
    });
    expect(errors.some((e) => e.includes('تختلف'))).toBe(true);
  });

  it('returns multiple errors for all invalid fields', () => {
    const errors = validateChangePasswordInput({
      currentPassword: '',
      newPassword: '123',
      confirmPassword: 'xyz',
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
