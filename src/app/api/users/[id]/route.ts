/**
 * PUT  /api/users/[id] — Update user profile
 * DELETE /api/users/[id] — Delete user account (cascade with transaction)
 *
 * Both routes require JWT authentication and verify ownership (user can only
 * modify their own account).
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getUserRepository } from '@/app/repositories/user.repository';
import { hashPassword, comparePassword } from '@/app/lib/auth';
import { validateUpdateUserInput, validateChangePasswordInput } from '@/app/validators';
import {
  validationError,
  forbiddenError,
  notFoundError,
  conflictError,
  unauthorizedError,
  serverError,
} from '@/app/lib/apiErrors';
import type { User } from '@/app/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Serialize a Mongoose user document to a plain User object. */
function serializeUser(doc: {
  _id: { toString(): string };
  username: string;
  email: string;
  displayName?: string;
  language: 'ar' | 'en' | 'unset';
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    _id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    displayName: doc.displayName,
    language: doc.language,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ─── PUT ────────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    if (auth.userId !== id) return forbiddenError();

    const body = await request.json();

    // Handle password change separately
    if (body.currentPassword || body.newPassword || body.confirmPassword) {
      const pwErrors = validateChangePasswordInput(body);
      if (pwErrors.length > 0) return validationError(pwErrors);

      await connectDB();
      const userRepo = getUserRepository();

      const currentUser = await userRepo.findById(id);
      if (!currentUser) return notFoundError('المستخدم غير موجود');

      const isMatch = await comparePassword(body.currentPassword, currentUser.password);
      if (!isMatch) return unauthorizedError('كلمة المرور الحالية غير صحيحة');

      const hashed = await hashPassword(body.newPassword);
      const updated = await userRepo.update(id, { password: hashed });
      if (!updated) return notFoundError('المستخدم غير موجود');

      return NextResponse.json({
        data: serializeUser(updated),
        message: 'تم تغيير كلمة المرور بنجاح',
      });
    }

    // Handle profile update
    const profileErrors = validateUpdateUserInput(body);
    if (profileErrors.length > 0) return validationError(profileErrors);

    await connectDB();
    const userRepo = getUserRepository();

    // Check for conflicts if email or username is being changed
    if (body.email) {
      const emailTaken = await userRepo.findByEmail(body.email.trim().toLowerCase());
      if (emailTaken && emailTaken._id.toString() !== id) {
        return conflictError('البريد الإلكتروني مستخدم بالفعل');
      }
    }
    if (body.username) {
      const usernameTaken = await userRepo.findByUsername(body.username.trim());
      if (usernameTaken && usernameTaken._id.toString() !== id) {
        return conflictError('اسم المستخدم مستخدم بالفعل');
      }
    }

    // Build update object (only provided fields)
    const updateData: Record<string, unknown> = {};
    if (body.username !== undefined) updateData.username = body.username.trim();
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
    if (body.displayName !== undefined) updateData.displayName = body.displayName.trim();
    if (body.language !== undefined) updateData.language = body.language;

    const updated = await userRepo.update(id, updateData);
    if (!updated) return notFoundError('المستخدم غير موجود');

    return NextResponse.json({
      data: serializeUser(updated),
      message: 'تم تحديث البيانات بنجاح',
    });
  } catch (error) {
    console.error('User update error:', error);
    return serverError();
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    if (auth.userId !== id) return forbiddenError();

    // Require password confirmation for account deletion
    const body = await request.json().catch(() => ({}));
    if (!body.password) {
      return validationError(['كلمة المرور مطلوبة لتأكيد حذف الحساب']);
    }

    await connectDB();
    const userRepo = getUserRepository();

    const currentUser = await userRepo.findById(id);
    if (!currentUser) return notFoundError('المستخدم غير موجود');

    const isMatch = await comparePassword(body.password, currentUser.password);
    if (!isMatch) return unauthorizedError('كلمة المرور غير صحيحة');

    // Cascade delete with MongoDB transaction (prevents partial failure)
    const deleted = await userRepo.deleteUserCascade(id);
    if (!deleted) return notFoundError('المستخدم غير موجود');

    return NextResponse.json(
      { message: 'تم حذف الحساب وجميع البيانات المرتبطة بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('User delete error:', error);
    return serverError();
  }
}
