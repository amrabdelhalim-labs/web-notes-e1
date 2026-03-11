# دليل الاختبارات 🧪

> **الغرض:** توثيق منظومة الاختبارات في **ملاحظاتي** — التهيئة، الفئات، والأوامر
> **الإطار:** Vitest + Testing Library + jsdom
> **الأرقام:** 573 اختبار في 39 ملف

---

## جدول المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [تهيئة Vitest](#2-تهيئة-vitest)
3. [ملف الإعداد (setup.ts)](#3-ملف-الإعداد-setupts)
4. [هيكل ملفات الاختبار](#4-هيكل-ملفات-الاختبار)
5. [فئات الاختبارات وتوزيعها](#5-فئات-الاختبارات-وتوزيعها)
6. [أوامر الاختبار](#6-أوامر-الاختبار)
7. [أنماط الكتابة](#7-أنماط-الكتابة)

---

## 1. نظرة عامة

| المقياس | القيمة |
|---------|--------|
| إطار الاختبار | Vitest |
| بيئة الاختبار | jsdom |
| مكتبة المكونات | @testing-library/react |
| عدد الاختبارات | 573 |
| عدد الملفات | 39 |
| مسار الاختبارات | `src/app/tests/` |

**المبدأ:** الاختبارات تغطي كل طبقة — من دوال المساعدة حتى صفحات التطبيق الكاملة. لا يُكتب كود جديد دون اختبار مقابل.

---

## 2. تهيئة Vitest

**الملف:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',    // محاكاة DOM المتصفح
    globals: true,            // describe, it, expect بدون استيراد
    setupFiles: ['./src/app/tests/setup.ts'],
    include: ['src/app/tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),  // الاستيراد عبر @/...
    },
  },
});
```

### الخيارات الرئيسية

| الخيار | القيمة | الأثر |
|--------|--------|-------|
| `plugins` | `[react()]` | دعم JSX/TSX و React Fast Refresh في بيئة الاختبار |
| `environment` | `'jsdom'` | محاكاة المتصفح — `window`, `document`, `localStorage` |
| `globals` | `true` | `describe`, `it`, `expect`, `vi` متاحة عالمياً |
| `setupFiles` | `setup.ts` | يُشغَّل قبل كل ملف اختبار |
| `include` | `**/*.test.{ts,tsx}` | يكتشف ملفات الاختبار تلقائياً |
| `alias @` | `./src` | `import { x } from '@/app/...'` يعمل في الاختبارات |

---

## 3. ملف الإعداد (setup.ts)

**الملف:** `src/app/tests/setup.ts`

يُنفَّذ تلقائياً قبل كل ملف اختبار. يشمل:

```typescript
import '@testing-library/jest-dom'; // matchers مثل toBeInTheDocument

// محاكاة window.matchMedia (غير متاح في jsdom)
Object.defineProperty(window, 'matchMedia', {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// محاكاة IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// محاكاة navigator.serviceWorker (jsdom لا يدعمه)
Object.defineProperty(navigator, 'serviceWorker', {
  value: { register: vi.fn(), ready: Promise.resolve({}) },
});
```

---

## 4. هيكل ملفات الاختبار

جميع ملفات الاختبار في مجلد واحد مُسطح — بدون مجلدات فرعية:

```text
src/app/tests/
├── setup.ts  // إعداد عام لجميع الاختبارات
├── utils.tsx  // مساعدات خاصة بالاختبارات
│
│   ── الإعداد والأنواع ──
├── config.test.ts  // ثوابت التطبيق (config.ts)
├── types.test.ts  // أنواع TypeScript
├── validators.test.ts  // دوال التحقق من المدخلات
│
│   ── طبقة API والأدوات المساعدة ──
├── apiClient.test.ts  // عميل API (fetch wrapper)
├── deviceApi.test.ts  // استدعاءات API الأجهزة
├── devicesRoute.test.ts  // مسار API الأجهزة
├── noteUtils.test.ts  // دوال مساعدة للملاحظات
├── audioUtils.test.ts  // دوال معالجة الصوت
├── warmUpCache.test.ts  // تدفئة الـ Cache
│
│   ── Custom Hooks ──
├── useAuth.test.tsx  // خطاف المصادقة
├── useNotes.test.ts  // خطاف الملاحظات
├── useDevices.test.ts  // خطاف الأجهزة
├── useDeviceId.test.ts  // خطاف معرّف الجهاز
├── useOfflineStatus.test.ts  // خطاف حالة الاتصال
├── useSyncStatus.test.ts  // خطاف حالة المزامنة
├── usePwaStatus.test.ts  // خطاف حالة PWA
│
│   ── Contexts ──
├── ThemeContext.test.tsx  // سياق السمات (فاتح/داكن)
├── PwaActivationDialog.test.tsx  // حوار تفعيل PWA
│
│   ── المكونات ──
├── AppBar.test.tsx  // شريط التطبيق العلوي
├── SideBar.test.tsx  // القائمة الجانبية
├── ThemeToggle.test.tsx  // زر تبديل السمة
├── LanguageToggle.test.tsx  // زر تبديل اللغة
├── NoteCard.test.tsx  // بطاقة الملاحظة
├── NoteList.test.tsx  // قائمة الملاحظات
├── NoteEditorForm.test.tsx  // نموذج تحرير الملاحظة
├── DeleteConfirmDialog.test.tsx  // حوار تأكيد الحذف
├── DeleteAccountDialog.test.tsx  // حوار حذف الحساب
├── ConnectionIndicator.test.tsx  // مؤشر الاتصال
├── OfflineBanner.test.tsx  // شريط الاوف لاين
├── ProfileEditor.test.tsx  // محرر الملف الشخصي
├── PrivateRoute.test.tsx  // حارس المسارات الخاصة
│
│   ── الصفحات ──
├── login.test.tsx  // صفحة تسجيل الدخول
├── register.test.tsx  // صفحة إنشاء الحساب
├── NotesPage.test.tsx  // صفحة قائمة الملاحظات
├── NewNotePage.test.tsx  // صفحة إنشاء ملاحظة
├── NoteDetailPage.test.tsx  // صفحة تفاصيل ملاحظة
├── EditNotePage.test.tsx  // صفحة تعديل ملاحظة
├── ProfilePage.test.tsx  // صفحة الملف الشخصي
│
│   ── التكامل والتدفقات ──
└── offlineLogout.test.tsx  // تدفق تسجيل الخروج الاوف لاين
```

---

## 5. فئات الاختبارات وتوزيعها

### ٥.١ اختبارات الإعداد والأدوات (6 ملفات)
**الهدف:** التحقق من دوال خالصة (Pure Functions) — لا تأثيرات جانبية.

**الملفات:** `config.test.ts`, `types.test.ts`, `validators.test.ts`, `noteUtils.test.ts`, `audioUtils.test.ts`, `warmUpCache.test.ts`

```typescript
describe('validateEmail', () => {
// مثال: validators.test.ts
  it('يقبل بريد صحيح', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
  it('يرفض بريد بدون @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });
});
```

### ٥.٢ اختبارات طبقة الـ API (3 ملفات)
**الهدف:** التحقق من صحة طلبات `fetch` — الـ URL، الـ method، الـ headers، الـ body.

**الملفات:** `apiClient.test.ts`, `deviceApi.test.ts`, `devicesRoute.test.ts`

```typescript
describe('createNote', () => {
// مثال: apiClient.test.ts
  it('يرسل POST إلى /api/notes مع البيانات الصحيحة', async () => {
    await notesApi.create({ title: 'ملاحظة', type: 'text' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/notes',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
```

### ٥.٣ اختبارات Custom Hooks (7 ملفات)
**الهدف:** التحقق من سلوك الـ hooks بمعزل عن الـ UI.

**الملفات:** `useAuth.test.tsx`, `useNotes.test.ts`, `useDevices.test.ts`, `useDeviceId.test.ts`, `useOfflineStatus.test.ts`, `useSyncStatus.test.ts`, `usePwaStatus.test.ts`

```typescript
const { result } = renderHook(() => useNotes(), { wrapper: TestProviders });
// مثال: useNotes.test.ts باستخدام renderHook
await waitFor(() => expect(result.current.notes).toHaveLength(3));
```

### ٥.٤ اختبارات المكونات والـ Contexts (13 ملفاً)
**الهدف:** التحقق من الـ rendering والتفاعل.

**الملفات:** `ThemeContext.test.tsx`, `PwaActivationDialog.test.tsx`, `AppBar.test.tsx`, `SideBar.test.tsx`, `ThemeToggle.test.tsx`, `LanguageToggle.test.tsx`, `NoteCard.test.tsx`, `NoteList.test.tsx`, `NoteEditorForm.test.tsx`, `DeleteConfirmDialog.test.tsx`, `DeleteAccountDialog.test.tsx`, `ConnectionIndicator.test.tsx`, `OfflineBanner.test.tsx`

```typescript
describe('NoteCard', () => {
// مثال: NoteCard.test.tsx
  it('يعرض عنوان الملاحظة', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('عنوان الملاحظة')).toBeInTheDocument();
  });

  it('يستدعي onDelete عند النقر على حذف', async () => {
    const onDelete = vi.fn();
    render(<NoteCard note={mockNote} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /حذف/ }));
    expect(onDelete).toHaveBeenCalledWith(mockNote._id);
  });
});
```

### ٥.٥ اختبارات الصفحات (9 ملفات)
**الهدف:** التحقق من تدفقات صفحة كاملة مع تجميع المكونات.

**الملفات:** `login.test.tsx`, `register.test.tsx`, `NotesPage.test.tsx`, `NewNotePage.test.tsx`, `NoteDetailPage.test.tsx`, `EditNotePage.test.tsx`, `ProfilePage.test.tsx`, `ProfileEditor.test.tsx`, `PrivateRoute.test.tsx`

### ٥.٦ اختبارات التكامل والتدفقات (1 ملف)
**الهدف:** التحقق من تدفق كامل عبر عدة مكونات وسيناريوهات.

**الملفات:** `offlineLogout.test.tsx`

```typescript
it('يتعامل مع تسجيل الخروج أثناء الاوف لاين', async () => {
// مثال: offlineLogout.test.tsx
  render(<App />, { wrapper: TestProviders });
  // محاكاة الاوف لاين ثم تسجيل الخروج
  // ...
});
```

---

## 6. أوامر الاختبار

```bash
npm run test
# تشغيل جميع الاختبارات مرة واحدة

# وضع المشاهدة (يُعيد التشغيل عند التغيير)
npm run test:watch

# تشغيل اختبار محدد
npx vitest run src/app/tests/components/NoteCard.test.tsx

# تشغيل اختبارات مجلد معين
npx vitest run src/app/tests/hooks/

# فلتر بالاسم
npx vitest run --grep "يعرض عنوان"

# مع تقرير التغطية
npm run test:coverage
# يُولّد تقريراً في coverage/index.html
```

### قراءة النتائج

```text
✓ src/app/tests/utils/validators.test.ts (12 tests) 45ms
✗ src/app/tests/components/NoteForm.test.tsx (3 failed)
  × يجب أن يظهر خطأ التحقق للعنوان الفارغ
    AssertionError: expected element to be visible
```

- **✓** الملف نجح جميع اختباراته
- **✗** الملف فيه اختبارات فاشلة
- **×** اختبار فاشل محدد مع سبب الفشل

---

## 7. أنماط الكتابة

### ملف `utils.tsx` — مساعدات الاختبار

```typescript
export function TestProviders({ children }: { children: React.ReactNode }) {
// توفير جميع الـ Providers المطلوبة في شكل wrapper
  return (
    <QueryClientProvider client={testQueryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// render مع الـ providers
export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestProviders });
}
```

### محاكاة الوحدات (Mocking)

```typescript
vi.mock('@/app/lib/api', () => ({
// محاكاة وحدة كاملة
  notesApi: {
    getAll: vi.fn().mockResolvedValue([mockNote]),
    create: vi.fn().mockResolvedValue(mockNote),
  },
}));

// محاكاة استجابة HTTP
vi.spyOn(global, 'fetch').mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ notes: [mockNote] }),
} as Response);

// إعادة الضبط بين الاختبارات
afterEach(() => vi.clearAllMocks());
```

### بيانات وهمية (Mock Data)

```typescript
const mockNote: INote = {
// يُعرَّف عادةً في أعلى الملف أو في ملف fixtures/
  _id: '507f1f77bcf86cd799439011',
  title: 'ملاحظة تجريبية',
  content: '<p>محتوى</p>',
  type: 'text',
  user: 'user-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

---

*للتعمق في بنية المشروع: [database-abstraction.md](database-abstraction.md)*  
*للدرس التعليمي: [الدرس 13: الاختبارات الشاملة](tutorials/lessons/13-testing.md)*
