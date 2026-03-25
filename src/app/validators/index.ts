/**
 * Input Validators
 *
 * Pure validation functions for all user inputs.
 * Each function accepts an optional `locale` parameter and returns an array
 * of localised error messages resolved from the i18n message files.
 * An empty array means the input is valid.
 */

import type {
  RegisterInput,
  LoginInput,
  NoteInput,
  UpdateNoteInput,
  UpdateUserInput,
  ChangePasswordInput,
  SupportedLocale,
} from '@/app/types';
import { serverMsg } from '@/app/lib/apiErrors';

// ─── Helpers ────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Auth Validators ────────────────────────────────────────────────────────

export function validateRegisterInput(
  input: RegisterInput,
  locale: SupportedLocale = 'ar'
): string[] {
  const errors: string[] = [];

  if (!input.username || input.username.trim().length < 3) {
    errors.push(serverMsg(locale, 'validUsernameTooShort'));
  }
  if (input.username && input.username.trim().length > 30) {
    errors.push(serverMsg(locale, 'validUsernameTooLong'));
  }

  if (!input.email || !isValidEmail(input.email)) {
    errors.push(serverMsg(locale, 'validEmailInvalid'));
  }

  if (!input.password || input.password.trim().length < 6) {
    errors.push(serverMsg(locale, 'validPasswordTooShort'));
  }

  return errors;
}

export function validateLoginInput(input: LoginInput, locale: SupportedLocale = 'ar'): string[] {
  const errors: string[] = [];

  if (!input.email || !isValidEmail(input.email)) {
    errors.push(serverMsg(locale, 'validEmailInvalid'));
  }

  if (!input.password || input.password.trim().length < 6) {
    errors.push(serverMsg(locale, 'validPasswordTooShort'));
  }

  return errors;
}

// ─── Note Validators ────────────────────────────────────────────────────────

export function validateNoteInput(input: NoteInput, locale: SupportedLocale = 'ar'): string[] {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 1) {
    errors.push(serverMsg(locale, 'validNoteTitleRequired'));
  }
  if (input.title && input.title.trim().length > 200) {
    errors.push(serverMsg(locale, 'validNoteTitleTooLong'));
  }

  if (!input.type || !['text', 'voice'].includes(input.type)) {
    errors.push(serverMsg(locale, 'validNoteTypeInvalid'));
  }

  if (input.type === 'text' && (!input.content || input.content.trim().length < 1)) {
    errors.push(serverMsg(locale, 'validNoteContentRequired'));
  }

  if (input.type === 'voice' && !input.audioData) {
    errors.push(serverMsg(locale, 'validNoteAudioRequired'));
  }

  if (input.audioDuration !== undefined && input.audioDuration < 0) {
    errors.push(serverMsg(locale, 'validAudioDurationInvalid'));
  }

  return errors;
}

export function validateUpdateNoteInput(
  input: UpdateNoteInput,
  locale: SupportedLocale = 'ar'
): string[] {
  const errors: string[] = [];

  if (input.title !== undefined) {
    if (input.title.trim().length < 1) {
      errors.push(serverMsg(locale, 'validNoteTitleRequired'));
    }
    if (input.title.trim().length > 200) {
      errors.push(serverMsg(locale, 'validNoteTitleTooLong'));
    }
  }

  if (input.audioDuration !== undefined && input.audioDuration < 0) {
    errors.push(serverMsg(locale, 'validAudioDurationInvalid'));
  }

  return errors;
}

// ─── User Validators ────────────────────────────────────────────────────────

export function validateUpdateUserInput(
  input: UpdateUserInput,
  locale: SupportedLocale = 'ar'
): string[] {
  const errors: string[] = [];

  if (input.username !== undefined) {
    if (input.username.trim().length < 3) {
      errors.push(serverMsg(locale, 'validUsernameTooShort'));
    }
    if (input.username.trim().length > 30) {
      errors.push(serverMsg(locale, 'validUsernameTooLong'));
    }
  }

  if (input.email !== undefined && !isValidEmail(input.email)) {
    errors.push(serverMsg(locale, 'validEmailInvalid'));
  }

  if (input.displayName !== undefined && input.displayName.trim().length > 50) {
    errors.push(serverMsg(locale, 'validDisplayNameTooLong'));
  }

  if (input.language !== undefined && !['ar', 'en', 'unset'].includes(input.language)) {
    errors.push(serverMsg(locale, 'validLanguageUnsupported'));
  }

  return errors;
}

export function validateChangePasswordInput(
  input: ChangePasswordInput,
  locale: SupportedLocale = 'ar'
): string[] {
  const errors: string[] = [];

  if (!input.currentPassword || input.currentPassword.trim().length < 1) {
    errors.push(serverMsg(locale, 'validCurrentPasswordRequired'));
  }

  if (!input.newPassword || input.newPassword.trim().length < 6) {
    errors.push(serverMsg(locale, 'validNewPasswordTooShort'));
  }

  if (input.newPassword !== input.confirmPassword) {
    errors.push(serverMsg(locale, 'validPasswordMismatch'));
  }

  if (input.currentPassword && input.newPassword && input.currentPassword === input.newPassword) {
    errors.push(serverMsg(locale, 'validPasswordSameAsCurrent'));
  }

  return errors;
}
