/**
 * /api/devices Route Tests
 *
 * Tests all three HTTP methods (GET, POST, DELETE) for the device management API.
 * Mocks: auth middleware, DB connection, device repository, subscription repository.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/devices/route';

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/app/lib/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockAuth = vi.fn();
vi.mock('@/app/middlewares/auth.middleware', () => ({
  authenticateRequest: (...args: unknown[]) => mockAuth(...args),
}));

const mockFindByUser = vi.fn();
const mockFindByDeviceId = vi.fn();
const mockTouch = vi.fn();
const mockCreate = vi.fn();
const mockDeleteByDeviceId = vi.fn();

vi.mock('@/app/repositories/device.repository', () => ({
  getDeviceRepository: () => ({
    findByUser: mockFindByUser,
    findByDeviceId: mockFindByDeviceId,
    touch: mockTouch,
    create: mockCreate,
    deleteByDeviceId: mockDeleteByDeviceId,
  }),
}));

const mockSubFindByUser = vi.fn();
const mockSubDeleteByEndpoint = vi.fn();

vi.mock('@/app/repositories/subscription.repository', () => ({
  getSubscriptionRepository: () => ({
    findByUser: mockSubFindByUser,
    deleteByEndpoint: mockSubDeleteByEndpoint,
  }),
}));

vi.mock('@/app/lib/apiErrors', () => ({
  validationError: (messages: string[]) =>
    new Response(
      JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: messages.join(', ') } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    ),
  serverError: () =>
    new Response(JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'خطأ في الخادم' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }),
  unauthorizedError: (message = 'غير مصرح') =>
    new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
}));

// ─── Auth + User mocks ───────────────────────────────────────────────────────

const mockComparePassword = vi.fn();
vi.mock('@/app/lib/auth', () => ({
  comparePassword: (...args: unknown[]) => mockComparePassword(...args),
}));

const mockFindById = vi.fn();
vi.mock('@/app/repositories/user.repository', () => ({
  getUserRepository: () => ({
    findById: mockFindById,
  }),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(method: string, body?: object, url = 'http://localhost/api/devices') {
  return new NextRequest(url, {
    method,
    ...(body && {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  });
}

const VALID_USER_ID = '507f1f77bcf86cd799439011';

const fakeDeviceDoc = {
  _id: { toString: () => 'd1' },
  user: { toString: () => VALID_USER_ID },
  deviceId: 'abc-12345-def',
  name: 'Chrome — Windows',
  browser: 'Chrome',
  os: 'Windows',
  lastSeenAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockReturnValue({ userId: VALID_USER_ID });
  mockComparePassword.mockResolvedValue(true);
  mockFindById.mockResolvedValue({ password: 'hashed_password' });
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('/api/devices', () => {
  // ── GET ─────────────────────────────────────────────────────────────────

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      const { NextResponse } = await import('next/server');
      const errorRes = NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      mockAuth.mockReturnValue({ error: errorRes });

      const res = await GET(makeRequest('GET'));
      expect(res.status).toBe(401);
    });

    it('returns list of devices for authenticated user', async () => {
      mockFindByUser.mockResolvedValue([fakeDeviceDoc]);

      const res = await GET(makeRequest('GET'));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].deviceId).toBe('abc-12345-def');
    });

    it('marks isCurrent when currentDeviceId query param matches', async () => {
      mockFindByUser.mockResolvedValue([fakeDeviceDoc]);

      const res = await GET(
        makeRequest('GET', undefined, 'http://localhost/api/devices?currentDeviceId=abc-12345-def')
      );
      const json = await res.json();

      expect(json.data[0].isCurrent).toBe(true);
    });

    it('sets isCurrent to false when currentDeviceId does not match', async () => {
      mockFindByUser.mockResolvedValue([fakeDeviceDoc]);

      const res = await GET(
        makeRequest('GET', undefined, 'http://localhost/api/devices?currentDeviceId=other-id')
      );
      const json = await res.json();

      expect(json.data[0].isCurrent).toBe(false);
    });

    it('returns empty array when no devices', async () => {
      mockFindByUser.mockResolvedValue([]);
      const res = await GET(makeRequest('GET'));
      const json = await res.json();
      expect(json.data).toHaveLength(0);
    });
  });

  // ── POST ────────────────────────────────────────────────────────────────

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      const { NextResponse } = await import('next/server');
      mockAuth.mockReturnValue({ error: NextResponse.json({}, { status: 401 }) });

      const res = await POST(makeRequest('POST', { deviceId: 'abc-12345-def' }));
      expect(res.status).toBe(401);
    });

    it('returns 400 when deviceId is missing', async () => {
      const res = await POST(makeRequest('POST', { password: 'TestPass1!' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when deviceId is too short', async () => {
      const res = await POST(makeRequest('POST', { deviceId: 'abc', password: 'TestPass1!' }));
      expect(res.status).toBe(400);
    });

    it('touches existing device and returns it', async () => {
      mockFindByDeviceId.mockResolvedValue(fakeDeviceDoc);
      mockTouch.mockResolvedValue(undefined);

      const res = await POST(
        makeRequest('POST', { deviceId: 'abc-12345-def', password: 'TestPass1!' })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(mockTouch).toHaveBeenCalledWith(VALID_USER_ID, 'abc-12345-def');
      expect(json.data.deviceId).toBe('abc-12345-def');
    });

    it('creates new device when not existing', async () => {
      mockFindByDeviceId.mockResolvedValue(null);
      mockCreate.mockResolvedValue(fakeDeviceDoc);

      const res = await POST(
        makeRequest('POST', {
          deviceId: 'abc-12345-def',
          browser: 'Chrome',
          os: 'Windows',
          password: 'TestPass1!',
        })
      );
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.message).toBe('تم الوثوق بالجهاز بنجاح');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'abc-12345-def',
          browser: 'Chrome',
          os: 'Windows',
        })
      );
    });
  });

  // ── DELETE ──────────────────────────────────────────────────────────────

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      const { NextResponse } = await import('next/server');
      mockAuth.mockReturnValue({ error: NextResponse.json({}, { status: 401 }) });

      const res = await DELETE(makeRequest('DELETE', { deviceId: 'abc' }));
      expect(res.status).toBe(401);
    });

    it('returns 400 when deviceId is missing', async () => {
      const res = await DELETE(makeRequest('DELETE', { password: 'TestPass1!' }));
      expect(res.status).toBe(400);
    });

    it('returns 404 when device not found', async () => {
      mockDeleteByDeviceId.mockResolvedValue(null);
      mockSubFindByUser.mockResolvedValue([]);

      const res = await DELETE(
        makeRequest('DELETE', { deviceId: 'non-existent', password: 'TestPass1!' })
      );
      expect(res.status).toBe(404);
    });

    it('deletes device and removes associated push subscriptions', async () => {
      mockDeleteByDeviceId.mockResolvedValue(fakeDeviceDoc);
      mockSubFindByUser.mockResolvedValue([
        { endpoint: 'https://push.example.com/1', deviceInfo: 'abc-12345-def|Windows' },
        { endpoint: 'https://push.example.com/2', deviceInfo: 'other-device|Linux' },
      ]);
      mockSubDeleteByEndpoint.mockResolvedValue({});

      const res = await DELETE(
        makeRequest('DELETE', { deviceId: 'abc-12345-def', password: 'TestPass1!' })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toBe('تم إزالة الجهاز بنجاح');
      expect(mockDeleteByDeviceId).toHaveBeenCalledWith(VALID_USER_ID, 'abc-12345-def');
      // Only the subscription with matching deviceId should be deleted
      expect(mockSubDeleteByEndpoint).toHaveBeenCalledWith('https://push.example.com/1');
      expect(mockSubDeleteByEndpoint).toHaveBeenCalledTimes(1);
    });

    it('deletes device even when no push subscriptions exist', async () => {
      mockDeleteByDeviceId.mockResolvedValue(fakeDeviceDoc);
      mockSubFindByUser.mockResolvedValue([]);

      const res = await DELETE(
        makeRequest('DELETE', { deviceId: 'abc-12345-def', password: 'TestPass1!' })
      );
      expect(res.status).toBe(200);
      expect(mockSubDeleteByEndpoint).not.toHaveBeenCalled();
    });
  });
});
