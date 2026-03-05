/**
 * Input Validators
 *
 * Pure validation functions for all user inputs.
 * Each function returns an array of error messages (Arabic).
 * An empty array means the input is valid.
 *
 * The validators are separated from business logic following
 * the workspace quality standards.
 */

import type {
  RegisterInput,
  LoginInput,
  NoteInput,
  UpdateNoteInput,
  UpdateUserInput,
  ChangePasswordInput,
} from '@/app/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Auth Validators ────────────────────────────────────────────────────────

export function validateRegisterInput(input: RegisterInput): string[] {
  const errors: string[] = [];

  if (!input.username || input.username.trim().length < 3) {
    errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
  }
  if (input.username && input.username.trim().length > 30) {
    errors.push('اسم المستخدم يجب ألا يتجاوز 30 حرف');
  }

  if (!input.email || !isValidEmail(input.email)) {
    errors.push('البريد الإلكتروني غير صالح');
  }

  if (!input.password || input.password.trim().length < 6) {
    errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  }

  return errors;
}

export function validateLoginInput(input: LoginInput): string[] {
  const errors: string[] = [];

  if (!input.email || !isValidEmail(input.email)) {
    errors.push('البريد الإلكتروني غير صالح');
  }

  if (!input.password || input.password.trim().length < 6) {
    errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  }

  return errors;
}

// ─── Note Validators ────────────────────────────────────────────────────────

export function validateNoteInput(input: NoteInput): string[] {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 1) {
    errors.push('عنوان الملاحظة مطلوب');
  }
  if (input.title && input.title.trim().length > 200) {
    errors.push('عنوان الملاحظة يجب ألا يتجاوز 200 حرف');
  }

  if (!input.type || !['text', 'voice'].includes(input.type)) {
    errors.push('نوع الملاحظة يجب أن يكون نصية أو صوتية');
  }

  if (input.type === 'text' && (!input.content || input.content.trim().length < 1)) {
    errors.push('محتوى الملاحظة النصية مطلوب');
  }

  if (input.type === 'voice' && !input.audioData) {
    errors.push('البيانات الصوتية مطلوبة للملاحظات الصوتية');
  }

  if (input.audioDuration !== undefined && input.audioDuration < 0) {
    errors.push('مدة التسجيل يجب أن تكون رقماً موجباً');
  }

  return errors;
}

export function validateUpdateNoteInput(input: UpdateNoteInput): string[] {
  const errors: string[] = [];

  if (input.title !== undefined) {
    if (input.title.trim().length < 1) {
      errors.push('عنوان الملاحظة مطلوب');
    }
    if (input.title.trim().length > 200) {
      errors.push('عنوان الملاحظة يجب ألا يتجاوز 200 حرف');
    }
  }

  if (input.audioDuration !== undefined && input.audioDuration < 0) {
    errors.push('مدة التسجيل يجب أن تكون رقماً موجباً');
  }

  return errors;
}

// ─── User Validators ────────────────────────────────────────────────────────

export function validateUpdateUserInput(input: UpdateUserInput): string[] {
  const errors: string[] = [];

  if (input.username !== undefined) {
    if (input.username.trim().length < 3) {
      errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
    }
    if (input.username.trim().length > 30) {
      errors.push('اسم المستخدم يجب ألا يتجاوز 30 حرف');
    }
  }

  if (input.email !== undefined && !isValidEmail(input.email)) {
    errors.push('البريد الإلكتروني غير صالح');
  }

  if (input.displayName !== undefined && input.displayName.trim().length > 50) {
    errors.push('اسم العرض يجب ألا يتجاوز 50 حرف');
  }

  if (input.language !== undefined && !['ar', 'en'].includes(input.language)) {
    errors.push('اللغة المختارة غير مدعومة');
  }

  return errors;
}

export function validateChangePasswordInput(
  input: ChangePasswordInput
): string[] {
  const errors: string[] = [];

  if (!input.currentPassword || input.currentPassword.trim().length < 1) {
    errors.push('كلمة المرور الحالية مطلوبة');
  }

  if (!input.newPassword || input.newPassword.trim().length < 6) {
    errors.push('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
  }

  if (input.newPassword !== input.confirmPassword) {
    errors.push('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
  }

  if (input.currentPassword && input.newPassword && input.currentPassword === input.newPassword) {
    errors.push('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
  }

  return errors;
}
