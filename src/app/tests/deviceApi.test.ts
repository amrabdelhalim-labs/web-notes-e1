/**
 * Device Client API Tests
 *
 * Tests getDevicesApi, trustDeviceApi, deleteDeviceApi from the client API layer.
 * Uses global fetch mock to validate request shape and response handling.
 */

import { getDevicesApi, trustDeviceApi, deleteDeviceApi } from '@/app/lib/api';

// ─── Fetch mock ─────────────────────────────────────────────────────────────

const TOKEN = 'test-jwt-token';
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem('auth-token', TOKEN);
});

afterEach(() => {
  localStorage.clear();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Device client API', () => {
  // ── getDevicesApi ─────────────────────────────────────────────────────

  describe('getDevicesApi', () => {
    it('sends GET /api/devices with auth header', async () => {
      mockFetch.mockReturnValue(jsonResponse({ data: [] }));
      await getDevicesApi();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/devices',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
          }),
        }),
      );
    });

    it('appends currentDeviceId as query param when provided', async () => {
      mockFetch.mockReturnValue(jsonResponse({ data: [] }));
      await getDevicesApi('abc-123');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/devices?currentDeviceId=abc-123',
        expect.anything(),
      );
    });

    it('returns the data array', async () => {
      const fakeDevices = [{ _id: 'd1', deviceId: 'x' }];
      mockFetch.mockReturnValue(jsonResponse({ data: fakeDevices }));

      const res = await getDevicesApi();
      expect(res.data).toEqual(fakeDevices);
    });

    it('throws on non-2xx response', async () => {
      mockFetch.mockReturnValue(
        jsonResponse({ error: { message: 'غير مصرح' } }, 401),
      );
      await expect(getDevicesApi()).rejects.toThrow('غير مصرح');
    });
  });

  // ── trustDeviceApi ────────────────────────────────────────────────────

  describe('trustDeviceApi', () => {
    it('sends POST /api/devices with device payload', async () => {
      const payload = { deviceId: 'dev-001', password: 'testpass', name: 'Chrome', browser: 'Chrome', os: 'Windows' };
      mockFetch.mockReturnValue(jsonResponse({ data: payload, message: 'ok' }, 201));

      await trustDeviceApi(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/devices',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
    });

    it('returns created device', async () => {
      const device = { _id: 'd1', deviceId: 'dev-001' };
      mockFetch.mockReturnValue(jsonResponse({ data: device, message: 'تم' }, 201));

      const res = await trustDeviceApi({ deviceId: 'dev-001', password: 'testpass' });
      expect(res.data).toEqual(device);
    });

    it('throws on validation error', async () => {
      mockFetch.mockReturnValue(
        jsonResponse({ error: { message: 'معرّف الجهاز غير صالح' } }, 400),
      );
      await expect(trustDeviceApi({ deviceId: 'x', password: 'testpass' })).rejects.toThrow('معرّف الجهاز غير صالح');
    });
  });

  // ── deleteDeviceApi ───────────────────────────────────────────────────

  describe('deleteDeviceApi', () => {
    it('sends DELETE /api/devices with deviceId in body', async () => {
      mockFetch.mockReturnValue(jsonResponse({ message: 'تم' }));

      await deleteDeviceApi('dev-001', 'testpass');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/devices',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ deviceId: 'dev-001', password: 'testpass' }),
        }),
      );
    });

    it('returns success message', async () => {
      mockFetch.mockReturnValue(jsonResponse({ message: 'تم إزالة الجهاز بنجاح' }));
      const res = await deleteDeviceApi('dev-001', 'testpass');
      expect(res.message).toBe('تم إزالة الجهاز بنجاح');
    });

    it('throws on 404 not found', async () => {
      mockFetch.mockReturnValue(
        jsonResponse({ error: { message: 'الجهاز غير موجود' } }, 404),
      );
      await expect(deleteDeviceApi('missing', 'testpass')).rejects.toThrow('الجهاز غير موجود');
    });
  });
});
