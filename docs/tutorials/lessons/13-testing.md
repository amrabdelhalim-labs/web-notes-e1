# الدرس 13: الاختبارات الشاملة

> هدف الدرس: فهم كيف نختبر كل طبقة في ملاحظاتي — من الدوال البسيطة إلى المكوّنات التفاعلية والـ hooks وسيناريوهات التكامل — باستخدام Vitest و Testing Library.

---

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 12: الملف الشخصي وإعدادات الحساب](12-profile-settings.md)

---

## فهرس هذا الدرس

1. [فلسفة الاختبار في ملاحظاتي](#1-فلسفة-الاختبار-في-ملاحظاتي)
2. [إعداد بيئة الاختبار — setup.ts و utils.tsx و vitest.config.ts](#2-إعداد-بيئة-الاختبار--setupts-و-utilstsx-و-vitestconfigts)
3. [اختبارات الأدوات والتحقق — unit tests للدوال الخالصة](#3-اختبارات-الأدوات-والتحقق--unit-tests-للدوال-الخالصة)
4. [اختبارات طبقة API — mock fetch](#4-اختبارات-طبقة-api--mock-fetch)
5. [اختبارات الـ hooks — renderHook واختبار السلوك غير المتزامن](#5-اختبارات-الـ-hooks--renderhook-واختبار-السلوك-غير-المتزامن)
6. [اختبارات المكوّنات — render + screen + fireEvent](#6-اختبارات-المكوّنات--render--screen--fireevent)
7. [اختبارات الصفحات — تكامل المكوّن مع الـ hooks](#7-اختبارات-الصفحات--تكامل-المكوّن-مع-الـ-hooks)
8. [اختبارات التكامل — offlineLogout](#8-اختبارات-التكامل--offlinelogout)
9. [ملخص](#9-ملخص)

---

## 1. فلسفة الاختبار في ملاحظاتي

### تشبيه: المفتش في المصنع

تخيّل مصنعًا لتجميع السيارات:

- **فحص القطع المفردة قبل التجميع** — كل مسمار وكل صمام يُفحص منفردًا (= unit tests للدوال والـ validators)
- **فحص المجموعة الجزئية** — محرك كامل يُختبر على منصة تجريبية (= اختبارات الـ hooks)
- **فحص التجميع الكامل** — سيارة تامة تُقاد على مسار اختبار (= اختبارات الصفحات والتكامل)

المفتش لا يُركّب سيارة حقيقية لكل اختبار — يستبدل بعض الأجزاء بنماذج (mocks) لتعزيل ما يُختبر.

---

### هيكل ملفات الاختبار — 41 ملفًا في مكان واحد

```
src/app/tests/
├── setup.ts              ← تهيئة عامة (يُشغَّل قبل كل ملف اختبار)
├── utils.tsx             ← render مُعزَّز بـ MUI + i18n
│
├── # ── Tier 1: Unit ─────────────────────────────────────
├── config.test.ts        ← اختبار ثوابت التطبيق
├── types.test.ts         ← اختبار Type Guards
├── validators.test.ts    ← اختبار دوال التحقق (6 validators)
├── noteUtils.test.ts     ← اختبار دوال تنسيق الملاحظات
├── audioUtils.test.ts    ← اختبار دوال الصوت
│
├── # ── Tier 2: API Layer ───────────────────────────────
├── apiClient.test.ts     ← اختبار fetchApi + كل API functions
├── devicesRoute.test.ts  ← اختبار Route Handler الأجهزة (server-side)
├── deviceApi.test.ts     ← اختبار client-side device API
│
├── # ── Tier 3: Hooks ───────────────────────────────────
├── useAuth.test.tsx      ← hook wiring + AuthContext
├── useNotes.test.ts      ← 42KB — hook شامل مع offline queue
├── useDevices.test.ts    ← دورة حياة الأجهزة
├── usePwaStatus.test.ts  ← SW state + install state
├── useOfflineStatus.test.ts ← طبقتا الكشف + events
├── useSyncStatus.test.ts ← polling + hasFailures + refresh
├── useDeviceId.test.ts   ← UUID ثابت + UA detection
│
├── # ── Tier 4: Contexts ────────────────────────────────
├── ThemeContext.test.tsx ← toggle + localStorage + data-color-scheme
├── warmUpCache.test.ts   ← Dexie warm-up strategy
│
├── # ── Tier 5: Components ──────────────────────────────
├── AppBar.test.tsx
├── SideBar.test.tsx
├── ThemeToggle.test.tsx
├── LanguageToggle.test.tsx
├── OfflineBanner.test.tsx
├── ConnectionIndicator.test.tsx (16KB)
├── NoteCard.test.tsx
├── NoteList.test.tsx
├── NoteEditorForm.test.tsx
├── DeleteConfirmDialog.test.tsx
├── DeleteAccountDialog.test.tsx
├── ProfileEditor.test.tsx (29KB)
├── PwaActivationDialog.test.tsx
├── PrivateRoute.test.tsx
│
├── # ── Tier 6: Pages ───────────────────────────────────
├── login.test.tsx
├── register.test.tsx
├── NotesPage.test.tsx
├── NoteDetailPage.test.tsx
├── NewNotePage.test.tsx
├── EditNotePage.test.tsx
├── ProfilePage.test.tsx
│
└── # ── Tier 7: Integration ─────────────────────────────
    └── offlineLogout.test.tsx
```

---

### أرقام الاختبارات

| الطبقة | عدد الملفات | حجم الملفات |
|--------|------------|------------|
| Unit | 5 | صغيرة |
| API | 3 | متوسطة |
| Hooks | 7 | متوسطة-كبيرة |
| Contexts | 2 | متوسطة |
| Components | 14 | متوسطة-كبيرة |
| Pages | 7 | متوسطة |
| Integration | 1 | متوسطة |
| **المجموع** | **41 ملفًا** | **573 اختبارًا** |

---

## 2. إعداد بيئة الاختبار — setup.ts و utils.tsx و vitest.config.ts

### vitest.config.ts — نقطة الدخول

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],         // ← يدعم JSX/TSX
  test: {
    environment: 'jsdom',     // ← DOM محاكى في Node.js
    globals: true,            // ← describe/it/expect بدون import
    setupFiles: ['./src/app/tests/setup.ts'], // ← يُشغَّل أولًا
    include: ['src/app/tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // ← دعم @/
    },
  },
});
```

**`environment: 'jsdom'`** — يُحاكي DOM المتصفح داخل Node.js. يُتيح `document`, `window`, `localStorage` في اختباراتنا. بدونه، المتصفح APIs غير موجودة في Node.

**`globals: true`** — يُضيف `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` كمتغيرات عامة. لا حاجة لـ `import { describe } from 'vitest'` في كل ملف.

**`setupFiles`** — يُشغَّل قبل كل ملف اختبار (وليس قبل كل `it`). مثالي لإعداد mocks عامة مرة واحدة.

---

### setup.ts — المحاكاة العامة

```typescript
/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'; // ← matchers: toBeInTheDocument, toHaveTextContent...
import React from 'react';

// ── 1. محاكاة matchMedia (غير موجودة في jsdom) ─────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,                  // دائمًا false في الاختبارات
    media: query,
    onchange: null,
    addListener: () => {},           // API قديمة — لا تزال مستخدمة ببعض المكتبات
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
```

**لماذا `matchMedia` تحتاج محاكاة؟**

MUI يستخدم `window.matchMedia` للـ responsive breakpoints. jsdom لا يُطبّقها (ليس متصفحًا حقيقيًا). بدون المحاكاة، كل render لمكوّن MUI يُلقي خطأ `matchMedia is not a function`.

```typescript
// ── 2. محاكاة localStorage ────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:    (key: string) => store[key] ?? null,
    setItem:    (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear:      () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

**لماذا محاكاة localStorage بدل الحقيقي؟**

jsdom يوفّر `localStorage` حقيقيًا — لكنه **مشترك بين الاختبارات** في نفس العملية. مصدر bug خفي: اختبار يُعيّن `'auth-token'` → اختبار تالٍ يجد token موجودًا. المحاكاة بـ `let store = {}` قابلة للإفراغ التام في `beforeEach`.

```typescript
// ── 3. كتم تحذيرات React/MUI المعروفة ───────────────────────────────────────
const originalError = console.error.bind(console);
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? '');
    if (
      msg.includes('Warning:') ||
      msg.includes('ReactDOM.render') ||
      msg.includes('act(')
    ) return; // كتم
    originalError(...args); // باقي الأخطاء تظهر
  });
});
afterEach(() => {
  vi.restoreAllMocks(); // إعادة تعيين كل spies بعد كل اختبار
});
```

**`vi.restoreAllMocks()` في `afterEach`** — يُعيد تعيين كل `vi.spyOn` و `vi.fn` تلقائيًا. يمنع "تسرب" spy من اختبار لآخر.

---

### mock التنقل العام

```typescript
// ── 4. محاكاة @/app/lib/navigation ───────────────────────────────────────
vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/notes',
  Link: ({ children, href, ...props }) =>
    React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
}));
```

**لماذا mock التنقل في `setup.ts` وليس في كل ملف؟**

كل مكوّن تقريبًا يستخدم `Link` أو `useRouter`. محاكاته في `setup.ts` مرة واحدة يُوفّر تكرارًا في كل ملف.

بعض الملفات (مثل `login.test.tsx`) تُعيد تعريفه محليًا بـ `mockPush` خاص لقياس الاستدعاءات. `vi.mock` المحلي يُلغي العام.

---

### utils.tsx — render المُعزَّز

```typescript
import { render, type RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { NextIntlClientProvider } from 'next-intl';
import arMessages from '@/messages/ar.json';

const theme = createTheme({ direction: 'rtl' });

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="ar" messages={arMessages}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}

function renderWithTheme(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// إعادة تصدير كل Testing Library + override render
export * from '@testing-library/react';
export { renderWithTheme as render };
```

**`export * from '@testing-library/react'` + `export { renderWithTheme as render }`:**

يُتيح الاستيراد بسطر واحد:
```typescript
import { render, screen, fireEvent, waitFor } from './utils';
```

`render` من `./utils` هي `renderWithTheme`. `screen`, `fireEvent`, `waitFor` من Testing Library الحقيقية.

**لماذا `NextIntlClientProvider`؟**

مكوّنات ملاحظاتي تستخدم `useTranslations('ProfilePage')` داخليًا. بدون Provider، يُلقي خطأ `Missing NextIntl provider`. نُمرّر `arMessages` الحقيقي لاختبار النصوص العربية الفعلية.

**`createTheme({ direction: 'rtl' })`** — يُحاكي الاتجاه العربي الحقيقي. مكوّنات MUI تتصرف بشكل مختلف في RTL (أماكن الأيقونات، هوامش، إلخ).

---

## 3. اختبارات الأدوات والتحقق — unit tests للدوال الخالصة

### validators.test.ts — نمط الاختبار الهرمي

**الدالة الخالصة** (pure function) — تُعيد نفس النتيجة لنفس المدخلات، لا آثار جانبية:

```typescript
// الدالة الخالصة في validators/index.ts
function validateRegisterInput({ username, email, password }) {
  const errors: string[] = [];
  if (!username || username.length < 3) errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) errors.push('البريد الإلكتروني غير صحيح');
  if (!password || password.length < 6) errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  return errors;
}
```

**هيكل الاختبار:**

```typescript
describe('validateRegisterInput', () => {
  // ── Fixture: قيمة صالحة لإعادة استخدامها ───────────────────────────
  const valid = { username: 'testuser', email: 'test@example.com', password: '123456' };

  // ── الحالة المثالية (happy path) ─────────────────────────────────────
  it('returns empty array for valid input', () => {
    expect(validateRegisterInput(valid)).toEqual([]);
  });

  // ── حالات الحد (edge cases) لكل حقل ─────────────────────────────────
  it('rejects empty username', () => {
    const errors = validateRegisterInput({ ...valid, username: '' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('اسم المستخدم'); // ← نتحقق من الرسالة العربية
  });

  it('rejects short username (< 3 chars)', () => {
    const errors = validateRegisterInput({ ...valid, username: 'ab' });
    expect(errors[0]).toContain('3'); // ← الرقم في الرسالة، لا النص كاملًا
  });

  it('rejects long username (> 30 chars)', () => {
    const errors = validateRegisterInput({ ...valid, username: 'a'.repeat(31) });
    expect(errors[0]).toContain('30');
  });

  // ── الحالة المتعددة ───────────────────────────────────────────────────
  it('returns multiple errors for all fields invalid', () => {
    const errors = validateRegisterInput({ username: '', email: '', password: '' });
    expect(errors.length).toBeGreaterThanOrEqual(3); // ← ≥3 وليس ===3 لمرونة المستقبل
  });
});
```

**نمط `{ ...valid, username: 'ab' }`** — Spread + Override:

```
valid = { username: 'testuser', email: 'test@example.com', password: '123456' }
{ ...valid, username: 'ab' } = { username: 'ab', email: 'test@example.com', password: '123456' }
```

يُبقي الحقول الأخرى صالحة لعزل الحقل الذي نُريد اختباره.

**`toContain('3')` بدل `toBe('اسم المستخدم يجب أن يكون 3 أحرف')`:**

- إذا تغيّرت صياغة الرسالة → الاختبار لا ينكسر
- يتحقق من الجوهر (الرقم 3 موجود) لا الشكل الحرفي

**`toBeGreaterThanOrEqual(3)`** بدل `toBe(3)`:

إذا أُضيف حقل تحقق جديد مستقبلًا (مثل تحقق إضافي على username)، الاختبار لا ينكسر.

---

### نمط المحاور الست في validators

| الـ validator | المدخل | المخرج |
|--------------|--------|--------|
| `validateRegisterInput` | `{username, email, password}` | `string[]` |
| `validateLoginInput` | `{email, password}` | `string[]` |
| `validateNoteInput` | `{title, type, content/audioData}` | `string[]` |
| `validateUpdateNoteInput` | مثل noteInput | `string[]` |
| `validateUpdateUserInput` | `{username?, email?, displayName?}` | `string[]` |
| `validateChangePasswordInput` | `{currentPassword, newPassword, confirmPassword}` | `string[]` |

كل validator يُعيد `string[]` — قائمة فارغة = صالح.

---

## 4. اختبارات طبقة API — mock fetch

### apiClient.test.ts — عزل fetch بالكامل

```typescript
// ── المحاكاة الأساسية ────────────────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch; // ← استبدال global.fetch بالكامل

// ── مساعدات لتبسيط الإعداد ────────────────────────────────────────────────────
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
  mockFetch.mockReset();    // ← إفراغ التاريخ + الإعداد بين الاختبارات
  localStorage.clear();
});
```

**`mockResolvedValueOnce`** — يُعيد القيمة **مرة واحدة فقط** ثم يعود للحالة الافتراضية. مثالي حين اختبار واحد يستدعي fetch مرة واحدة.

**نمط الـ helper functions:**

```typescript
function mockSuccess(data, status = 200) { ... }
function mockError(message, code, status) { ... }
```

بدلًا من كتابة كل `mockFetch.mockResolvedValueOnce({...})` في كل اختبار — helpers تُبسّط وتعزز القراءة.

---

### ما يُختبر في fetchApi

```typescript
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

    const [, options] = mockFetch.mock.calls[0]; // ← الوسيط الثاني للاستدعاء الأول
    expect(options.headers.Authorization).toBe('Bearer my-jwt');
  });

  it('throws on non-2xx response with error message', async () => {
    mockError('خطأ في المدخلات');
    await expect(fetchApi('/api/test')).rejects.toThrow('خطأ في المدخلات');
  });
});
```

**`mockFetch.mock.calls[0]`** — مصفوفة كل الاستدعاءات. `calls[0]` = الاستدعاء الأول. كل عنصر = `[arg1, arg2, ...]`. `const [url, options] = mockFetch.mock.calls[0]` يُفكّك الوسائط.

**`expect(fn).rejects.toThrow('msg')`** — للتحقق من Promise المرفوضة:

```typescript
// الخطأ: تُلقي exception وليس تُعيد false
await expect(fetchApi('/bad')).rejects.toThrow('رسالة الخطأ');
```

---

### اختبارات API functions

```typescript
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
```

**`expect.objectContaining({...})`** — يتحقق من وجود خصائص **ضمن** الكائن ولا يشترط أن تكون الوحيدة. مرونة: لو أضيفت خاصية جديدة لـ options (مثل `signal`)، الاختبار لا ينكسر.

---

## 5. اختبارات الـ hooks — renderHook واختبار السلوك غير المتزامن

### renderHook — تشغيل hook خارج مكوّن

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSyncStatus } from '@/app/hooks/useSyncStatus';

const { result } = renderHook(() => useSyncStatus());
// result.current = القيمة المُعادة من useSyncStatus()
```

**لا يمكن استدعاء hook مباشرة في test** (خارج React component/hook). `renderHook` يُشغّل hook داخل مكوّن React مخفي تلقائيًا.

---

### vi.mock — محاكاة وحدات Dexie

```typescript
// في useSyncStatus.test.ts
vi.mock('@/app/lib/db', () => ({
  hasPendingOps: vi.fn(),
  getPendingOps: vi.fn(),
}));

import { hasPendingOps, getPendingOps } from '@/app/lib/db';

const mockHasPendingOps = vi.mocked(hasPendingOps); // ← typing مع Mock
const mockGetPendingOps = vi.mocked(getPendingOps);

beforeEach(() => {
  vi.clearAllMocks();
  mockHasPendingOps.mockResolvedValue(false); // ← الحالة الافتراضية
  mockGetPendingOps.mockResolvedValue([]);
});
```

**`vi.mocked(fn)`** — يُعيد نفس الدالة مع نوع TypeScript يُعامله كـ `Mock<...>`. يُتيح `.mockResolvedValue()` و `.mock.calls` بدون `as Mock`.

**`mockResolvedValue` vs `mockResolvedValueOnce`:**

| الدالة | المتى |
|--------|-------|
| `mockResolvedValue(v)` | لكل استدعاء مستقبلي حتى يُعاد التعيين |
| `mockResolvedValueOnce(v)` | مرة واحدة فقط ثم يعود للافتراضي |

`beforeEach` يُعيّن القيمة الافتراضية. الاختبار يُوفّر قيمة مختلفة عند الحاجة.

---

### waitFor — انتظار التحديثات غير المتزامنة

```typescript
it('becomes true when pending ops exist', async () => {
  mockHasPendingOps.mockResolvedValue(true);
  mockGetPendingOps.mockResolvedValue([
    { id: 1, type: 'create', payload: {}, timestamp: Date.now() },
  ]);

  const { result } = renderHook(() => useSyncStatus());

  // ← isChecking يبدأ true ثم يصبح false بعد انتهاء checkPendingOps
  await waitFor(() => expect(result.current.isChecking).toBe(false));

  expect(result.current.hasPending).toBe(true);
  expect(result.current.pendingCount).toBe(1);
});
```

**`waitFor(() => expect(...))`** — يُعيد محاولة الـ assertion كل 50ms لمدة 1000ms (افتراضي). يتوقف فور نجاح assertion أو انتهاء المهلة.

**لماذا ننتظر `isChecking === false` بدل مباشرة `hasPending`؟**

- `checkPendingOps` يُعيّن `isChecking = true` في البداية
- بعد انتهاء async calls → `isChecking = false`
- `isChecking === false` إشارة أن كل الـ state updates اكتملت

---

### act — تحديثات State في البيئة الاختبارية

```typescript
it('switches to false when "offline" event fires', async () => {
  const { result } = renderHook(() => useOfflineStatus());
  await waitFor(() => expect(result.current).toBe(true));

  act(() => {
    window.dispatchEvent(new Event('offline'));  // ← يُطلق state update
  });

  expect(result.current).toBe(false); // ← بعد act، التحديثات مُطبَّقة
});
```

**لماذا `act`؟**

React يُجمّع state updates لتحسين الأداء. خارج `act`، Testing Library قد لا يعرف أن state تحدّث ويستخدم قيمة قديمة. `act` يُجبر React على معالجة كل updates قبل assertions.

**متى `act` synchronous vs async؟**

```typescript
// Synchronous: تحديث فوري (event handlers)
act(() => { window.dispatchEvent(new Event('offline')); });

// Asynchronous: ينتظر Promises
await act(async () => { window.dispatchEvent(new Event('online')); });
```

---

### useAuth.test.tsx — اختبار hook عبر Context

```typescript
function makeContextValue(overrides = {}): AuthContextValue {
  return {
    user: null, token: null, loading: false,
    login: vi.fn(), register: vi.fn(), updateUser: vi.fn(), logout: vi.fn(),
    pendingLocaleSuggestion: null, clearLocaleSuggestion: vi.fn(),
    ...overrides, // ← تجاوز القيمة الافتراضية
  };
}

function wrapper(value: AuthContextValue) {
  return function Wrapper({ children }) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };
}

it('returns authenticated user', () => {
  const user = { _id: 'u1', username: 'ali', ... };
  const ctx = makeContextValue({ user, token: 'tok123' });
  const { result } = renderHook(() => useAuth(), { wrapper: wrapper(ctx) });

  expect(result.current.user).toEqual(user);
});
```

**`wrapper` option في `renderHook`** — يُغلّف الـ hook بـ Context provider. يعزل hook عن AuthProvider الحقيقي (الذي يحتاج fetch + localStorage).

**`makeContextValue` factory** — بدلًا من تعريف كامل القيمة في كل اختبار. `...overrides` يُتيح تجاوز حقول محددة مع إبقاء الباقي صالحًا.

---

### useOfflineStatus.test.ts — اختبار الطبقتين

```typescript
function mockFetchOnline() {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);
}
function mockFetchOffline() {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
}

// اختبار الطبقة الثانية: ping يكشف خادم غير متاح رغم navigator.onLine=true
it('detects server-unreachable even when navigator.onLine is true', async () => {
  // navigator.onLine = true (الافتراضي من beforeEach)
  mockFetchOffline(); // ← لكن ping يفشل

  const { result } = renderHook(() => useOfflineStatus());

  await waitFor(() => expect(result.current).toBe(false)); // ← hook يكشف الكذب
});
```

هذا الاختبار يُثبت القيمة الجوهرية للطبقة الثانية: `navigator.onLine` كذّاب — ping يكشف الحقيقة.

```typescript
// اختبار إذاعة الحدث
it('broadcasts connectivity:status event after verification', async () => {
  const handler = vi.fn();
  window.addEventListener(CONNECTIVITY_STATUS_EVENT, handler);

  renderHook(() => useOfflineStatus());
  await waitFor(() => expect(handler).toHaveBeenCalled());

  const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
  expect(detail).toEqual({ online: true });

  window.removeEventListener(CONNECTIVITY_STATUS_EVENT, handler); // ← تنظيف
});
```

**تعيين event listener قبل renderHook** — لما يُشغَّل الـ hook ويُطلق الحدث، العداد `handler` يُسجّله.

```typescript
// اختبار تنظيف event listeners
it('removes event listeners on unmount', async () => {
  const removeSpy = vi.spyOn(window, 'removeEventListener');
  const { unmount } = renderHook(() => useOfflineStatus());
  unmount(); // ← يُشغّل cleanup function من useEffect

  expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
  expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  expect(removeSpy).toHaveBeenCalledWith(CONNECTIVITY_CHECK_EVENT, expect.any(Function));
});
```

**اختبار تنظيف الـ event listeners مهم** — تسرّب listener يُسبّب:
1. تحديثات state على مكوّن unmounted → تحذيرات React
2. معالجة أحداث من اختبار سابق في سياق اختبار جديد

---

## 6. اختبارات المكوّنات — render + screen + fireEvent

### NoteCard.test.tsx — نمط الـ Fixtures

```typescript
// ── Fixtures: بيانات اختبار ثابتة ────────────────────────────────────────
const textNote: Note = {
  _id: 'note-1',
  title: 'ملاحظة نصية تجريبية',
  content: '<p>محتوى <strong>الملاحظة</strong> هنا</p>',
  type: 'text',
  user: 'user-1',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
};

const voiceNote: Note = {
  _id: 'note-2',
  title: 'ملاحظة صوتية',
  type: 'voice',
  audioDuration: 75, // 1:15
  user: 'user-1',
  createdAt: '2026-03-02T08:00:00.000Z',
  updatedAt: '2026-03-02T08:00:00.000Z',
};
```

**Fixtures على مستوى الوحدة** (خارج describe) — تُشارَك كل اختبارات الملف. لو تغيّر نوع `Note`، تُحدَّث في مكان واحد.

---

### screen — الاستعلام عن عناصر DOM

```typescript
// ── screen queries ────────────────────────────────────────────────────────────
// getBy***  : يُعيد العنصر أو يُلقي خطأ إذا لم يُوجد (افتراضي)
// queryBy** : يُعيد null إذا لم يُوجد (لا يُلقي خطأ)
// findBy**  : async — ينتظر ظهور العنصر

screen.getByText('ملاحظة نصية تجريبية')        // ← نص مطابق
screen.getByRole('button', { name: /تعديل/i })   // ← role + accessible name
screen.getByLabelText(/البريد الإلكتروني/i)      // ← label مرتبط بحقل
screen.queryByRole('alert')                       // ← null إذا لم يُوجد
screen.getByTestId('mode')                        // ← data-testid="mode"
```

**لماذا `getByRole` أفضل من `getByTestId`؟**

`getByRole` يتحقق من الـ accessibility (ARIA roles). مكوّن يُعيد `role="button"` بشكل صحيح → Accessibility سليمة + اختبار سليم. `data-testid` يتحقق فقط من وجود attribute — لا علاقة له بالـ accessibility.

```typescript
// ── Matcher لاختبار HTML ─────────────────────────────────────────────────────
it('strips HTML tags from content preview', () => {
  render(<NoteCard note={textNote} ... />);
  expect(screen.getByText(/محتوى/)).toBeInTheDocument();
  expect(screen.queryByText(/<strong>/)).not.toBeInTheDocument(); // ← HTML tag لا يظهر
});
```

اختبار أن المكوّن يُزيل HTML tags من المحتوى — يتحقق من السلوك لا التنفيذ.

---

### fireEvent vs userEvent

```typescript
import { fireEvent } from '@testing-library/react';
// vs
import userEvent from '@testing-library/user-event'; // ← مكتبة منفصلة

// fireEvent: يُطلق حدثًا واحدًا مباشرة
fireEvent.click(button);
fireEvent.submit(form);
fireEvent.change(input, { target: { value: 'new text' } });

// userEvent: يُحاكي سلوك مستخدم حقيقي (أبطأ، أكثر دقة)
await userEvent.type(input, 'new text'); // ← keydown/keypress/keyup + change
await userEvent.click(button);
```

ملاحظاتي تستخدم `fireEvent` في معظم الاختبارات (أسرع وكافٍ لاختبار السلوك). `userEvent` مناسب لاختبارات دقيقة مثل التحقق من accessibility keyboard navigation.

---

### اختبار التفاعل: onEdit / onDelete

```typescript
it('calls onEdit with the note when edit button is clicked', () => {
  const onEdit = vi.fn();
  render(<NoteCard note={textNote} onEdit={onEdit} onDelete={vi.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: /تعديل/i }));

  expect(onEdit).toHaveBeenCalledOnce();
  expect(onEdit).toHaveBeenCalledWith(textNote); // ← الـ prop نفسه مُمرَّر
});
```

**`vi.fn()`** — stub بسيط. يُسجّل كل استدعاء ومعاملاته. `.mock.calls`, `.mock.results` تُفصّل.

**`toHaveBeenCalledOnce()`** — أوضح من `toHaveBeenCalledTimes(1)`.

---

### PrivateRoute.test.tsx — اختبار guard الأمني

```typescript
let mockUser: { _id: string } | null = null;
let mockLoading = false;

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, loading: mockLoading }),
}));

it('redirects to /login when user is null and loading is done', async () => {
  mockUser = null;
  mockLoading = false;
  render(<PrivateRoute><div>Protected</div></PrivateRoute>);

  await waitFor(() => { expect(mockReplace).toHaveBeenCalledWith('/login'); });
  expect(screen.queryByText('Protected')).not.toBeInTheDocument();
});

it('renders children when user is authenticated', () => {
  mockUser = { _id: 'u1', username: 'test' };
  render(<PrivateRoute><div>Protected</div></PrivateRoute>);

  expect(screen.getByText('Protected')).toBeInTheDocument();
});
```

**متغيرات `let` على مستوى الوحدة** — `vi.mock` يُنفَّذ مرة واحدة (hoisted). المحاكاة تُعيد `mockUser` من closure. كل اختبار يُعيّن `mockUser` قبل render.

هذا النمط بديل عن `vi.mocked(useAuth).mockReturnValue(...)` — أبسط للقراءة.

---

### OfflineBanner.test.tsx — محاكاة hook بسيطة

```typescript
let mockIsOnline = true;

vi.mock('@/app/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockIsOnline, // ← يُعيد القيمة الحالية
}));

it('renders nothing when online', () => {
  mockIsOnline = true;
  render(<OfflineBanner />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('shows offline warning when offline', () => {
  mockIsOnline = false;
  render(<OfflineBanner />);
  expect(screen.getByRole('alert')).toBeInTheDocument();
});

it('has role="status" aria-live region for accessibility', () => {
  render(<OfflineBanner />);
  const region = document.querySelector('[role="status"]');
  expect(region?.getAttribute('aria-live')).toBe('polite');
});
```

اختبار Accessibility (`aria-live`) — يتحقق أن التغييرات تُعلَن لقارئات الشاشة.

---

## 7. اختبارات الصفحات — تكامل المكوّن مع الـ hooks

### login.test.tsx — نمط الصفحة الشامل

```typescript
// ── مساعد إعداد مركزي ────────────────────────────────────────────────────────
function setupAuth(overrides: Record<string, unknown> = {}) {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockLogin.mockReset();
  (useAuth as Mock).mockReturnValue({
    login: mockLogin,
    user: null,
    loading: false,
    ...overrides,
  });
}

describe('LoginPage', () => {
  // ── 1. Rendering ───────────────────────────────────────────────────────────
  describe('Rendering', () => {
    beforeEach(() => setupAuth());
    it('renders the page title', () => { ... });
    it('renders an email input', () => { ... });
    it('renders a password input', () => { ... });
    it('renders the submit button', () => { ... });
  });

  // ── 2. Validation ──────────────────────────────────────────────────────────
  describe('Client-side validation', () => {
    beforeEach(() => setupAuth());
    it('shows error when email is empty', async () => { ... });
    it('shows error for password < 6 chars', async () => { ... });
  });

  // ── 3. Submission ──────────────────────────────────────────────────────────
  describe('Successful submission', () => {
    it('calls login() with trimmed email and password', async () => {
      setupAuth();
      mockLogin.mockResolvedValue(undefined); // ← نجح
      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/البريد/i), { target: { value: ' a@b.com ' } });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), { target: { value: '123456' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('a@b.com', '123456'); // ← trimmed
        expect(mockPush).toHaveBeenCalledWith('/notes');
      });
    });
  });

  // ── 4. Auth guard ──────────────────────────────────────────────────────────
  describe('Auth guard', () => {
    it('returns null when user is already logged in', () => {
      setupAuth({ user: { _id: 'u1', username: 'ali' } });
      const { container } = render(<LoginPage />);
      expect(container.firstChild).toBeNull(); // ← return null → DOM فارغ
    });
  });
});
```

**تنظيم الاختبارات في 4 مجموعات:** Rendering → Validation → Submission → Guard

هذا الترتيب يتبع "تدفق المستخدم":
1. هل يُرى الصفحة؟
2. هل التحقق يعمل؟
3. هل الإرسال ينجح؟
4. هل الحماية تعمل؟

**`container.querySelector('form')`** — حين `fireEvent.submit(form)` يُريح الصفحة:

```typescript
fireEvent.submit(container.querySelector('form')!);
// ↑ أوضح من fireEvent.click(submitButton) — يختبر form submission وليس click فقط
```

عندما لا يُوجد زر submit (أو يوجد Enter في حقل) — submit يجب أن يعمل على النموذج.

---

## 8. اختبارات التكامل — offlineLogout

### ما يُختبر — الـ cascade الكامل

```typescript
describe('AuthContext offline logout', () => {
  it('clears Dexie tables on logout', async () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(db.notes.clear).toHaveBeenCalled();
    expect(db.pendingOps.clear).toHaveBeenCalled();
  });

  it('unregisters service workers', async () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockUnregister).toHaveBeenCalled();
  });

  it('clears browser caches', async () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockCacheDelete).toHaveBeenCalled();
  });
});
```

**`renderHook` + `Wrapper` حقيقي** — هذا الاختبار يستخدم `AuthProvider` الحقيقي (ليس `AuthContext.Provider` مزيفًا):

```typescript
function Wrapper({ children }) {
  return (
    <NextIntlClientProvider locale="ar" messages={arMessages}>
      <AuthProvider>{children}</AuthProvider> {/* ← AuthProvider حقيقي */}
    </NextIntlClientProvider>
  );
}
```

**ما المحاكاة مطلوبة؟**

```typescript
// Dexie — لأنه يحتاج IndexedDB الحقيقي (غير متاح في jsdom)
vi.mock('@/app/lib/db', () => ({
  db: {
    notes: { clear: vi.fn().mockResolvedValue(undefined) },
    pendingOps: { clear: vi.fn().mockResolvedValue(undefined) },
    devices: { clear: vi.fn().mockResolvedValue(undefined) },
  },
}));

// ServiceWorker — لأنه غير متاح في jsdom
Object.defineProperty(navigator, 'serviceWorker', {
  configurable: true,
  value: { getRegistrations: mockGetRegistrations, ... },
});

// CacheStorage — لأنه غير متاح في jsdom
Object.defineProperty(window, 'caches', {
  configurable: true,
  value: { keys: mockCacheKeys, delete: mockCacheDelete },
});
```

**`configurable: true`** — لازم لإمكانية إعادة تعريف الـ property في اختبارات مختلفة. بدونها، `Object.defineProperty` ثانية تُلقي خطأ `Cannot redefine property`.

**قيمة هذا الاختبار:**

يثبت أن `logout()` لا يكتفي بمسح `user` من state — بل يُنظّف كل الآثار الجانبية:
- Dexie tables → بيانات المستخدم لا تتسرب لمستخدم تالٍ
- Service Worker → الـ push notifications تتوقف
- Browser caches → الصفحات المحفوظة تُمسح

---

## 9. ملخص

| ما تعلمناه | الأداة/النمط | الغرض |
|------------|-------------|-------|
| jsdom environment | vitest.config.ts | DOM APIs في Node.js |
| globals: true | vitest.config.ts | describe/it/expect بدون import |
| setupFiles | vitest.config.ts | مرة واحدة قبل كل ملف |
| matchMedia محاكاة | setup.ts | MUI يحتاجها |
| localStorage محاكاة بـ store منفصل | setup.ts | عزل بين الاختبارات |
| vi.restoreAllMocks() في afterEach | setup.ts | منع تسرب spy |
| mock التنقل العام | setup.ts | كل مكوّن يستخدمه |
| AllProviders Wrapper | utils.tsx | MUI RTL + i18n في كل render |
| export * from testing-library | utils.tsx | سطر استيراد واحد |
| `{ ...valid, field: 'bad' }` | validators.test.ts | عزل الحقل المُختبَر |
| toContain بدل toBe للرسائل | validators.test.ts | مرونة الصياغة |
| global.fetch = vi.fn() | apiClient.test.ts | عزل API layer |
| mockResolvedValueOnce | apiClient.test.ts | استجابة واحدة لكل اختبار |
| expect.objectContaining | apiClient.test.ts | تحقق جزئي من الكائن |
| rejects.toThrow | apiClient.test.ts | اختبار Promise مرفوضة |
| renderHook | hook tests | تشغيل hook خارج مكوّن |
| vi.mock('@/path', factory) | hook tests | استبدال module كامل |
| vi.mocked(fn) | hook tests | typing صحيح للـ mock |
| waitFor | hook tests | انتظار async state updates |
| act (sync/async) | hook tests | إجبار React على معالجة updates |
| Fixtures على مستوى الوحدة | component tests | بيانات مشتركة |
| getByRole بدل getByTestId | component tests | accessibility + correctness |
| queryByRole للتحقق من غياب | component tests | null إذا لم يُوجد |
| vi.fn() للـ callbacks | component tests | سجل الاستدعاءات + args |
| toHaveBeenCalledOnce | component tests | وضوح الكمية |
| setupAuth helper function | page tests | إعادة استخدام state |
| describe مُقسَّم: Rendering/Validation/Submission/Guard | page tests | تنظيم بتدفق المستخدم |
| AuthProvider حقيقي في integration | offlineLogout | اختبار السلوك الكامل |
| Object.defineProperty + configurable:true | integration | محاكاة browser APIs |
| اختبار cleanup (removeSpy) | hook tests | منع تسرب listeners |

---

### نقطة المراقبة

قبل إنهاء الرحلة، تأكد من قدرتك على الإجابة:

1. ما الفرق بين `mockResolvedValue` و `mockResolvedValueOnce`؟ متى تستخدم كلًا منهما؟
2. لماذا `renderHook` ضروري لاختبار hooks؟ ما المشكلة في استدعاء hook مباشرة في اختبار؟
3. ما الفرق بين `getByRole` و `queryByRole` في screen queries؟ متى يُستخدم كل منهما؟
4. لماذا يُعاد إنشاء `localStorage` كمحاكاة (mock) بدل استخدام jsdom المدمج؟
5. ما القيمة الإضافية التي يُقدمها `offlineLogout.test.tsx` مقارنةً باختبار `logout()` في إطار unit test بسيط؟

---

الدرس السابق → [الدرس 12: الملف الشخصي وإعدادات الحساب](12-profile-settings.md)

---

*انتهت سلسلة دروس ملاحظاتي — 13 درسًا يُغطي كل طبقة من طبقات التطبيق من الإعداد حتى الاختبار.*
