/**
 * POST /api/auth/login
 *
 * Authenticates a user by email and password, returns a JWT token.
 *
 * Body: { email, password }
 * Response: { data: { token, user }, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { comparePassword, generateToken } from '@/app/lib/auth';
import { getUserRepository } from '@/app/repositories/user.repository';
import { validateLoginInput } from '@/app/validators';
import { validationError, unauthorizedError, serverError } from '@/app/lib/apiErrors';
import type { User } from '@/app/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // ── Validate input ──────────────────────────────────────────────────────
    const errors = validateLoginInput(body);
    if (errors.length > 0) return validationError(errors);

    await connectDB();
    const userRepo = getUserRepository();

    // ── Find user by email ──────────────────────────────────────────────────
    const foundUser = await userRepo.findByEmail(body.email.trim().toLowerCase());
    if (!foundUser) {
      return unauthorizedError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // ── Verify password ─────────────────────────────────────────────────────
    const isMatch = await comparePassword(body.password, foundUser.password);
    if (!isMatch) {
      return unauthorizedError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // ── Generate token ──────────────────────────────────────────────────────
    const token = generateToken(foundUser._id.toString());

    const user: User = {
      _id: foundUser._id.toString(),
      username: foundUser.username,
      email: foundUser.email,
      displayName: foundUser.displayName,
      language: foundUser.language,
      createdAt: foundUser.createdAt.toISOString(),
      updatedAt: foundUser.updatedAt.toISOString(),
    };

    // ── Fire-and-forget push notification to other devices ────────────────
    // We import lazily so missing VAPID keys only error for push, not login.
    notifyOtherDevices(foundUser._id.toString()).catch((err) =>
      console.warn('Push notification after login failed (non-fatal):', err)
    );

    return NextResponse.json(
      { data: { token, user }, message: 'تم تسجيل الدخول بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return serverError();
  }
}

// ─── Push helper ─────────────────────────────────────────────────────────────

async function notifyOtherDevices(userId: string): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const { getSubscriptionRepository } = await import('@/app/repositories/subscription.repository');
  const { sendPushNotification } = await import('@/app/lib/webpush');
  const { type: PushSubscriptionType, ..._ } = await import('web-push').then(() => ({ type: '' }));
  void _;
  void PushSubscriptionType;

  const subRepo = getSubscriptionRepository();
  const subscriptions = await subRepo.findByUser(userId);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: sub.keys,
      } as import('web-push').PushSubscription;
      const success = await sendPushNotification(pushSub, {
        title: 'ملاحظاتي — تسجيل دخول',
        body: 'تم تسجيل الدخول إلى حسابك من جهاز جديد',
        url: '/ar/notes',
      });
      if (!success) {
        await subRepo.deleteByEndpoint(sub.endpoint);
      }
    })
  );
}
