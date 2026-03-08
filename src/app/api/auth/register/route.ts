/**
 * POST /api/auth/register
 *
 * Creates a new user account and returns a JWT token.
 *
 * Body: { username, email, password }
 * Response: { data: { token, user }, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { hashPassword, generateToken } from '@/app/lib/auth';
import { getUserRepository } from '@/app/repositories/user.repository';
import { validateRegisterInput } from '@/app/validators';
import { validationError, conflictError, serverError } from '@/app/lib/apiErrors';
import type { User } from '@/app/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // ── Validate input ──────────────────────────────────────────────────────
    const errors = validateRegisterInput(body);
    if (errors.length > 0) return validationError(errors);

    await connectDB();
    const userRepo = getUserRepository();

    // ── Check for duplicates ────────────────────────────────────────────────
    const [emailTaken, usernameTaken] = await Promise.all([
      userRepo.emailExists(body.email),
      userRepo.usernameExists(body.username),
    ]);

    if (emailTaken) return conflictError('البريد الإلكتروني مستخدم بالفعل');
    if (usernameTaken) return conflictError('اسم المستخدم مستخدم بالفعل');

    // ── Create user ─────────────────────────────────────────────────────────
    const hashedPassword = await hashPassword(body.password);

    const newUser = await userRepo.create({
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      password: hashedPassword,
      displayName: body.username.trim(),
      language: 'ar',
    });

    const token = generateToken(newUser._id.toString());

    const user: User = {
      _id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName,
      language: newUser.language,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { data: { token, user }, message: 'تم إنشاء الحساب بنجاح' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return serverError();
  }
}
