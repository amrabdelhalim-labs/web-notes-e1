/**
 * GET    /api/devices        — List trusted devices for the authenticated user
 * POST   /api/devices        — Trust the current device
 * DELETE  /api/devices        — Remove a trusted device (+ its push subscription)
 *
 * Trust flow:
 *   1. Client generates a deviceId (crypto.randomUUID) and stores it in localStorage
 *   2. User clicks "Trust this device" → POST /api/devices with deviceId + browser info
 *   3. Only trusted devices may install the PWA or subscribe to push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { comparePassword } from '@/app/lib/auth';
import { getDeviceRepository } from '@/app/repositories/device.repository';
import { getUserRepository } from '@/app/repositories/user.repository';
import { getSubscriptionRepository } from '@/app/repositories/subscription.repository';
import { validationError, unauthorizedError, serverError } from '@/app/lib/apiErrors';
import type { Device, IDevice } from '@/app/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function serializeDevice(doc: IDevice, currentDeviceId?: string): Device {
  return {
    _id: doc._id.toString(),
    user: (doc.user as Types.ObjectId).toString(),
    deviceId: doc.deviceId,
    name: doc.name ?? '',
    browser: doc.browser ?? '',
    os: doc.os ?? '',
    isCurrent: currentDeviceId ? doc.deviceId === currentDeviceId : undefined,
    lastSeenAt: doc.lastSeenAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const currentDeviceId = request.nextUrl.searchParams.get('currentDeviceId') ?? undefined;

    await connectDB();
    const deviceRepo = getDeviceRepository();

    const devices = await deviceRepo.findByUser(auth.userId);

    return NextResponse.json({
      data: devices.map((d) => serializeDevice(d, currentDeviceId)),
    });
  } catch (error) {
    console.error('Device list error:', error);
    return serverError();
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { deviceId, name, browser, os, password } = body as {
      deviceId: string;
      name?: string;
      browser?: string;
      os?: string;
      password: string;
    };

    if (!password || typeof password !== 'string') {
      return validationError(['كلمة المرور مطلوبة']);
    }

    if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8) {
      return validationError(['معرّف الجهاز غير صالح']);
    }

    await connectDB();
    const userRepo = getUserRepository();
    const deviceRepo = getDeviceRepository();

    // Verify password before trusting the device
    const user = await userRepo.findById(auth.userId);
    if (!user) return unauthorizedError('المستخدم غير موجود');
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return unauthorizedError('كلمة المرور غير صحيحة');

    // Upsert: update if already trusted, else create
    const existing = await deviceRepo.findByDeviceId(auth.userId, deviceId);
    if (existing) {
      await deviceRepo.touch(auth.userId, deviceId);
      return NextResponse.json({
        data: serializeDevice(existing),
        message: 'الجهاز موثوق بالفعل',
      });
    }

    const device = await deviceRepo.create({
      user: new Types.ObjectId(auth.userId),
      deviceId,
      name: name ?? '',
      browser: browser ?? '',
      os: os ?? '',
      lastSeenAt: new Date(),
    });

    return NextResponse.json(
      { data: serializeDevice(device), message: 'تم الوثوق بالجهاز بنجاح' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Device trust error:', error);
    return serverError();
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { deviceId, password } = body as { deviceId: string; password: string };

    if (!password || typeof password !== 'string') {
      return validationError(['كلمة المرور مطلوبة']);
    }

    if (!deviceId) {
      return validationError(['معرّف الجهاز مطلوب']);
    }

    await connectDB();
    const userRepo = getUserRepository();
    const deviceRepo = getDeviceRepository();
    const subRepo = getSubscriptionRepository();

    // Verify password before allowing device removal
    const user = await userRepo.findById(auth.userId);
    if (!user) return unauthorizedError('المستخدم غير موجود');
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return unauthorizedError('كلمة المرور غير صحيحة');

    // Delete the device
    const deleted = await deviceRepo.deleteByDeviceId(auth.userId, deviceId);
    if (!deleted) {
      return NextResponse.json({ message: 'الجهاز غير موجود' }, { status: 404 });
    }

    // Also remove any push subscriptions that include this deviceId in deviceInfo
    const subs = await subRepo.findByUser(auth.userId);
    for (const sub of subs) {
      if (sub.deviceInfo && sub.deviceInfo.includes(deviceId)) {
        await subRepo.deleteByEndpoint(sub.endpoint);
      }
    }

    return NextResponse.json({ message: 'تم إزالة الجهاز بنجاح' });
  } catch (error) {
    console.error('Device delete error:', error);
    return serverError();
  }
}
