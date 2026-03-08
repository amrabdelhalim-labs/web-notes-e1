/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * Requires a valid JWT token in the Authorization header.
 *
 * Response: { data: user }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getUserRepository } from '@/app/repositories/user.repository';
import { notFoundError, serverError } from '@/app/lib/apiErrors';
import type { User } from '@/app/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    await connectDB();
    const userRepo = getUserRepository();

    const foundUser = await userRepo.findById(auth.userId);
    if (!foundUser) return notFoundError('المستخدم غير موجود');

    const user: User = {
      _id: foundUser._id.toString(),
      username: foundUser.username,
      email: foundUser.email,
      displayName: foundUser.displayName,
      language: foundUser.language,
      createdAt: foundUser.createdAt.toISOString(),
      updatedAt: foundUser.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (error) {
    console.error('Auth/me error:', error);
    return serverError();
  }
}
