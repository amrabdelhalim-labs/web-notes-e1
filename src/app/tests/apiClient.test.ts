/**
 * API Client Tests
 *
 * Tests the client-side API layer (api.ts) by mocking global fetch.
 * Verifies correct URL construction, HTTP methods, headers, and error handling.
 */

import {
  fetchApi,
  loginApi,
  registerApi,
  getMeApi,
  getNotesApi,
  getNoteApi,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
  updateUserApi,
  deleteUserApi,
  changePasswordApi,
} from '@/app/lib/api';

// ─── Setup ──────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockSuccess(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

function mockError(message: string, code = 'ERROR', status = 400) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: { code, message } }),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

// ─── fetchApi ───────────────────────────────────────────────────────────────

describe('fetchApi', () => {
  it('makes a GET request with correct headers', async () => {
    mockSuccess({ data: 'ok' });
    await fetchApi('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('auth-token', 'my-jwt');
    mockSuccess({ data: 'ok' });
    await fetchApi('/api/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer my-jwt');
  });

  it('omits Authorization header when no token', async () => {
    mockSuccess({ data: 'ok' });
    await fetchApi('/api/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('throws on non-2xx response with error message', async () => {
    mockError('خطأ في المدخلات');
    await expect(fetchApi('/api/test')).rejects.toThrow('خطأ في المدخلات');
  });

  it('throws generic message when no error.message in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });
    await expect(fetchApi('/api/test')).rejects.toThrow('Unexpected server error');
  });

  it('sends x-locale header derived from URL pathname', async () => {
    mockSuccess({ data: 'ok' });
    await fetchApi('/api/test');

    const [, options] = mockFetch.mock.calls[0];
    // jsdom sets window.location.pathname to '/' which maps to 'ar'
    expect(options.headers['x-locale']).toBe('ar');
  });
});

// ─── Auth APIs ──────────────────────────────────────────────────────────────

describe('loginApi', () => {
  it('sends POST to /api/auth/login with credentials', async () => {
    mockSuccess({ data: { token: 'tok', user: {} } });
    await loginApi({ email: 'a@b.com', password: '123456' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: '123456' }),
      })
    );
  });
});

describe('registerApi', () => {
  it('sends POST to /api/auth/register', async () => {
    mockSuccess({ data: { token: 'tok', user: {} } });
    await registerApi({ username: 'user', email: 'a@b.com', password: '123456' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});

describe('getMeApi', () => {
  it('sends GET to /api/auth/me', async () => {
    mockSuccess({ data: { _id: '1', username: 'u' } });
    const result = await getMeApi();

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', expect.anything());
    expect(result.data.username).toBe('u');
  });
});

// ─── Notes APIs ─────────────────────────────────────────────────────────────

describe('getNotesApi', () => {
  it('sends GET to /api/notes without params', async () => {
    mockSuccess({ data: { notes: [], count: 0, page: 1, totalPages: 0 } });
    await getNotesApi();

    expect(mockFetch).toHaveBeenCalledWith('/api/notes', expect.anything());
  });

  it('builds query string from params', async () => {
    mockSuccess({ data: { notes: [], count: 0, page: 2, totalPages: 3 } });
    await getNotesApi({ page: 2, limit: 5, type: 'voice', q: 'test' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('limit=5');
    expect(url).toContain('type=voice');
    expect(url).toContain('q=test');
  });

  it('omits undefined params from query string', async () => {
    mockSuccess({ data: { notes: [], count: 0, page: 1, totalPages: 1 } });
    await getNotesApi({ page: 1 });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('type=');
    expect(url).not.toContain('q=');
  });
});

describe('getNoteApi', () => {
  it('sends GET to /api/notes/:id', async () => {
    mockSuccess({ data: { _id: 'abc', title: 'Test' } });
    await getNoteApi('abc');

    expect(mockFetch).toHaveBeenCalledWith('/api/notes/abc', expect.anything());
  });
});

describe('createNoteApi', () => {
  it('sends POST to /api/notes', async () => {
    mockSuccess({ data: { _id: 'new' }, message: 'تم الإنشاء' });
    await createNoteApi({ title: 'Note', type: 'text', content: 'Body' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});

describe('updateNoteApi', () => {
  it('sends PUT to /api/notes/:id', async () => {
    mockSuccess({ data: { _id: 'abc' }, message: 'تم التحديث' });
    await updateNoteApi('abc', { title: 'Updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes/abc',
      expect.objectContaining({
        method: 'PUT',
      })
    );
  });
});

describe('deleteNoteApi', () => {
  it('sends DELETE to /api/notes/:id', async () => {
    mockSuccess({ message: 'تم الحذف' });
    await deleteNoteApi('abc');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notes/abc',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });
});

// ─── User APIs ──────────────────────────────────────────────────────────────

describe('updateUserApi', () => {
  it('sends PUT to /api/users/:id', async () => {
    mockSuccess({ data: { _id: 'u1' }, message: 'تم التحديث' });
    await updateUserApi('u1', { displayName: 'New Name' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/u1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ displayName: 'New Name' }),
      })
    );
  });
});

describe('deleteUserApi', () => {
  it('sends DELETE to /api/users/:id with password in body', async () => {
    mockSuccess({ message: 'تم الحذف' });
    await deleteUserApi('u1', 'mypassword');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/u1',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ password: 'mypassword' }),
      })
    );
  });
});

describe('changePasswordApi', () => {
  it('sends PUT to /api/users/:id with password data', async () => {
    mockSuccess({ data: { _id: 'u1' }, message: 'تم التغيير' });
    const input = {
      currentPassword: 'old',
      newPassword: 'newpass',
      confirmPassword: 'newpass',
    };
    await changePasswordApi('u1', input);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/u1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(input),
      })
    );
  });
});
