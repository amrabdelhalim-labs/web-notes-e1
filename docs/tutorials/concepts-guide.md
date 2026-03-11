# دليل المفاهيم التقنية — مشروع ملاحظاتي 📖

> كل مفهوم تقني مُستخدم في المشروع مشروح من الصفر — لا يُفترض أي معرفة مسبقة

[← العودة إلى الفهرس](README.md)

---

## جدول المحتويات

1. [أطر العمل (Frameworks)](#1-أطر-العمل-frameworks)
2. [اللغات والأنواع (TypeScript)](#2-اللغات-والأنواع-typescript)
3. [واجهة المستخدم (React + MUI)](#3-واجهة-المستخدم-react--mui)
4. [قاعدة البيانات (MongoDB + Mongoose)](#4-قاعدة-البيانات-mongodb--mongoose)
5. [نمط المستودعات (Repository Pattern)](#5-نمط-المستودعات-repository-pattern)
6. [المصادقة والحماية (JWT + bcrypt)](#6-المصادقة-والحماية-jwt--bcrypt)
7. [التخزين المحلي (IndexedDB + Dexie)](#7-التخزين-المحلي-indexeddb--dexie)
8. [تطبيق الويب التقدمي (PWA)](#8-تطبيق-الويب-التقدمي-pwa)
9. [المزامنة (Background Sync)](#9-المزامنة-background-sync)
10. [الإشعارات الفورية (Web Push)](#10-الإشعارات-الفورية-web-push)
11. [الترجمة (next-intl)](#11-الترجمة-next-intl)
12. [الاختبار (Vitest + Testing Library)](#12-الاختبار-vitest--testing-library)
13. [أنماط التصميم (Design Patterns)](#13-أنماط-التصميم-design-patterns)
14. [جودة الكود (Code Quality)](#14-جودة-الكود-code-quality)
15. [النشر (Deployment)](#15-النشر-deployment)

---

## 1. أطر العمل (Frameworks)

### ما هو Next.js؟

Next.js هو إطار عمل مبني فوق React يُقدّم بنية جاهزة لبناء تطبيقات ويب كاملة. يدعم عرض الصفحات على الخادم (SSR) وتوليدها مسبقًا (SSG) وعرضها على المتصفح (CSR).

يستخدم **ملاحظاتي** الإصدار **Next.js 16** مع نظام **App Router** — النظام الحديث الذي يعتمد على بنية المجلدات:

```text
src/app/
  [locale]/  // مسار ديناميكي للغة (ar أو en)
    layout.tsx  // التخطيط الذي يحيط بكل الصفحات
    page.tsx  // الصفحة الرئيسية
    notes/
      page.tsx  // صفحة قائمة الملاحظات
      [id]/
        page.tsx  // صفحة ملاحظة واحدة (id ديناميكي)
```

### SSR و CSR و SSG — ما الفرق؟

| المصطلح | المعنى | متى يُستخدم في ملاحظاتي |
|---------|--------|--------------------------|
| **SSR** (Server-Side Rendering) | الخادم يبني HTML لكل طلب | صفحات تحتاج بيانات من قاعدة البيانات |
| **CSR** (Client-Side Rendering) | المتصفح يبني الصفحة بجافاسكربت | المكونات التفاعلية مثل المحرر والنماذج |
| **SSG** (Static Site Generation) | HTML يُبنى وقت البناء | لا يُستخدم حاليًا (البيانات دائمًا متغيرة) |

### ما هي API Routes؟

بدلًا من إنشاء خادم Express منفصل، يوفر Next.js مسارات API داخل مجلد `api/`:

```ts
// src/app/api/notes/route.ts
export async function GET(request: NextRequest) {
  // معالجة طلب GET لجلب الملاحظات
  return NextResponse.json({ data: notes });
}
```

كل ملف `route.ts` يُصدّر دوال باسم طريقة HTTP (`GET`, `POST`, `PUT`, `DELETE`). يستخدم **ملاحظاتي** 18 نقطة نهاية (endpoint) — راجع [api-endpoints.md](../api-endpoints.md) للتفاصيل.

---

## 2. اللغات والأنواع (TypeScript)

### ما هو TypeScript؟

TypeScript هو JavaScript مع أنواع بيانات ثابتة. تكتب الكود كالمعتاد، لكن تُحدد نوع كل متغير ومعامل — والمُترجم يُنبهك لأي خطأ قبل التشغيل.

```ts
// JavaScript عادي — لن تعرف الخطأ إلا وقت التشغيل
function add(a, b) { return a + b; }
add("5", 3); // "53" (خطأ صامت!)

// TypeScript — التحذير يظهر فورًا في المحرر
function add(a: number, b: number): number { return a + b; }
add("5", 3); // خطأ تجميع: Argument of type 'string' is not assignable
```

### الوضع الصارم (Strict Mode)

يُفعّل **ملاحظاتي** الوضع الصارم في `tsconfig.json`:

```json
{ "compilerOptions": { "strict": true } }
```

هذا يعني: لا `any` ضمنية، لا قيم `null` غير محسوبة، كل متغير يجب أن يكون له نوع واضح.

### الأنواع العامة (Generics)

تتيح الأنواع العامة كتابة كود يعمل مع أنواع مختلفة دون تكرار:

```ts
interface IRepository<T extends Document> {
// واجهة المستودع تعمل مع أي نموذج
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  delete(id: string): Promise<T | null>;
}

// الاستخدام — T يصبح INote أو IUser حسب المستودع
const noteRepo: IRepository<INote>;
const userRepo: IRepository<IUser>;
```

### حراس الأنواع (Type Guards)

تُستخدم لتضييق النوع داخل الشروط:

```ts
if (note.type === 'voice') {
// التحقق من نوع الملاحظة
  // TypeScript يعرف أن audioData موجود هنا
  playAudio(note.audioData);
}
```

---

## 3. واجهة المستخدم (React + MUI)

### ما هو React؟

React هو مكتبة لبناء واجهات المستخدم بأسلوب المكونات (Components). كل جزء من الصفحة هو مكون مستقل يمكن إعادة استخدامه:

```tsx
function NoteCard({ title, content }: { title: string; content: string }) {
// مكون بطاقة ملاحظة
  return (
    <div>
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  );
}
```

يستخدم **ملاحظاتي** الإصدار **React 19** مع JSX.

### ما هو MUI (Material UI)؟

MUI 7 هو مكتبة مكونات جاهزة تتبع تصميم Material Design من Google. يوفر أزرارًا، حقول إدخال، جداول، حوارات، وغيرها — كلها جاهزة ومتوافقة مع إمكانية الوصول (Accessibility):

```tsx
import { Button, TextField } from '@mui/material';

<TextField label="العنوان" fullWidth />
<Button variant="contained" color="primary">حفظ</Button>
```

### ما هو Emotion و CSS-in-JS؟

Emotion هو محرك تنسيق يسمح بكتابة CSS داخل JavaScript. يستخدمه MUI داخليًا لتنسيق مكوناته. الفائدة: التنسيقات محصورة بالمكون ولا تتسرب لمكونات أخرى.

### دعم RTL (الكتابة من اليمين لليسار)

**ملاحظاتي** يدعم العربية (RTL) والإنجليزية (LTR). يتم ذلك عبر:

1. **إضافة Stylis RTL** — تعكس خصائص CSS تلقائيًا (`margin-left` ⟶ `margin-right`)
2. **EmotionCacheProvider** — ينشئ كاش Emotion منفصل لكل اتجاه
3. **ThemeContext** — يضبط `direction: 'rtl'` في سمة MUI عند اختيار العربية

---

## 4. قاعدة البيانات (MongoDB + Mongoose)

### ما هو MongoDB؟

MongoDB هو قاعدة بيانات NoSQL تخزن البيانات كمستندات JSON (تُسمى BSON). لا يحتاج جداول أو أعمدة ثابتة كقواعد SQL — كل مستند يمكن أن يكون بهيكل مختلف.

### ما هو Mongoose؟

Mongoose 9 هو مكتبة ODM (Object Document Mapper) تربط بين كود TypeScript وقاعدة MongoDB. يتيح تعريف مخططات (Schemas) تصف شكل البيانات:

```ts
const userSchema = new Schema<IUser>({
// مخطط المستخدم
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  language: { type: String, enum: ['ar', 'en', 'unset'], default: 'unset' },
}, { timestamps: true });
```

### نماذج المشروع

يحتوي **ملاحظاتي** على 4 نماذج:

| النموذج | الحقول الرئيسية | العلاقات |
|---------|----------------|----------|
| **User** | username, email, password, language | مالك الملاحظات والأجهزة |
| **Note** | title, content/audioData, type | ينتمي لمستخدم واحد |
| **Device** | deviceId, name, browser, os | ينتمي لمستخدم واحد |
| **Subscription** | endpoint, keys, deviceId | اشتراك إشعارات لمستخدم |

### الفهارس (Indexes)

الفهارس تُسرّع البحث — كفهرس الكتاب. يستخدم **ملاحظاتي** فهارس على الحقول الأكثر بحثًا:

```ts
noteSchema.index({ user: 1, createdAt: -1 });
// فهرس مركب — تسريع جلب ملاحظات مستخدم مرتبة بالتاريخ

// فهرس نصي — تسريع البحث في العنوان والمحتوى
noteSchema.index({ title: 'text', content: 'text' });
```

### المعاملات (Transactions)

عند حذف حساب مستخدم، يجب حذف جميع بياناته ذريًا (كلها أو لا شيء). يوفر MongoDB المعاملات لذلك:

```ts
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Note.deleteMany({ user: userId }, { session });
  await Device.deleteMany({ user: userId }, { session });
  await User.findByIdAndDelete(userId, { session });
  await session.commitTransaction(); // تمت جميعها بنجاح
} catch {
  await session.abortTransaction(); // تراجع عن الكل
}
```

---

## 5. نمط المستودعات (Repository Pattern)

### الفكرة

نمط المستودعات يفصل منطق الوصول لقاعدة البيانات عن بقية التطبيق. بدلًا من استخدام Mongoose مباشرة في كل مكان، يوجد طبقة وسيطة:

```text
API Route ──► Repository ──► Mongoose ──► MongoDB
             (واجهة موحدة)  (التنفيذ)   (قاعدة البيانات)
```

### الواجهة العامة (Generic Interface)

```ts
interface IRepository<T extends Document> {
  findAll(filter?): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findPaginated(filter, page, limit): Promise<PaginatedResult<T>>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
  exists(filter): Promise<boolean>;
  count(filter): Promise<number>;
}
```

### المستودع الأساسي (Base Repository)

`BaseRepository<T>` يوفر التنفيذ العام لكل العمليات — أي مستودع جديد يرث منه ويحصل على كل العمليات مجانًا.

### المستودعات المتخصصة

كل مستودع يضيف عمليات خاصة بنموذجه:

| المستودع | عمليات إضافية |
|----------|---------------|
| **NoteRepository** | `findByUser`, `findByUserPaginated`, `search` |
| **UserRepository** | `deleteUserCascade` (حذف ذري مع كل البيانات) |
| **DeviceRepository** | `findByDeviceId`, `touch` (تحديث آخر ظهور) |
| **SubscriptionRepository** | `findByEndpoint`, `deleteByDeviceId` |

### مدير المستودعات (RepositoryManager)

نمط Singleton يوفر نقطة وصول واحدة لكل المستودعات:

```ts
const repos = RepositoryManager.getInstance();
const notes = await repos.note.findByUser(userId);
```

راجع [database-abstraction.md](../database-abstraction.md) و[repository-quick-reference.md](../repository-quick-reference.md) للمرجع التقني الكامل.

---

## 6. المصادقة والحماية (JWT + bcrypt)

### ما هو JWT (JSON Web Token)؟

JWT هو رمز مُشفّر يحتوي معلومات المستخدم. بعد تسجيل الدخول، يحصل المتصفح على رمز JWT يُرسله مع كل طلب لإثبات هويته — بدون الحاجة لتخزين جلسة على الخادم.

```text
تسجيل الدخول
  المتصفح ──[email + password]──► الخادم
  المتصفح ◄──[JWT token]────── الخادم

كل طلب لاحق
  المتصفح ──[Authorization: Bearer <token>]──► الخادم
  الخادم يتحقق من الرمز ويعرف هوية المستخدم
```

في **ملاحظاتي**: الرمز يحتوي `{ id: userId }` وصالح لمدة **7 أيام**.

### ما هو bcrypt؟

bcrypt هي خوارزمية تشفير أحادية الاتجاه لكلمات المرور. تُحوّل الكلمة لنص مُشفّر لا يمكن عكسه:

```ts
const hashed = await bcrypt.hash(password, 12);
// عند التسجيل — تشفير الكلمة (12 جولة)

// عند تسجيل الدخول — مقارنة الكلمة المُدخلة بالمُشفّرة
const match = await bcrypt.compare(inputPassword, hashed);
```

### وسيط المصادقة (Auth Middleware)

كل طلب API محمي يمر عبر `authenticateRequest()`:

```ts
export async function authenticateRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 401 };
  const decoded = verifyToken(token); // فك تشفير JWT
  return { userId: decoded.id };
}
```

### AuthContext (سياق المصادقة في المتصفح)

`AuthContext` يوفر حالة المصادقة لكل المكونات:

- `user` — بيانات المستخدم الحالي
- `login()` / `register()` / `logout()`
- استرجاع المستخدم من الكاش المحلي عند فقدان الاتصال
- اقتراح تغيير اللغة إذا تختلف عن لغة المتصفح

---

## 7. التخزين المحلي (IndexedDB + Dexie)

### ما هو IndexedDB؟

IndexedDB هو قاعدة بيانات مدمجة في المتصفح. تتيح تخزين كميات كبيرة من البيانات (ملاحظات، ملفات صوتية) مباشرة على جهاز المستخدم — مهمة جدًا للعمل بدون اتصال.

### ما هو Dexie.js؟

Dexie 4 هو مكتبة تُبسّط التعامل مع IndexedDB. واجهته أشبه بقاعدة بيانات حقيقية:

```ts
class NotesDB extends Dexie {
// تعريف الجداول
  notes!: Table<Note>;
  pendingOps!: Table<PendingOp>;
  devices!: Table<Device>;

  constructor() {
    super('myNotes');
    this.version(1).stores({
      notes: '_id, title, type, updatedAt',
      pendingOps: '++id, type, noteId, timestamp',
      devices: '_id, deviceId',
    });
  }
}
```

### جداول التخزين المحلي في ملاحظاتي

| الجدول | الغرض |
|--------|-------|
| **notes** | نسخة محلية من ملاحظات المستخدم (تعمل بدون اتصال) |
| **pendingOps** | عمليات معلّقة (إنشاء، تعديل، حذف) تنتظر المزامنة |
| **devices** | قائمة الأجهزة الموثوقة محليًا |

### رتل العمليات المعلّقة (Pending Operations Queue)

عندما يُعدّل المستخدم ملاحظة بدون اتصال:

1. التعديل يُحفظ محليًا في `notes`
2. عملية "تعديل" تُضاف لـ `pendingOps`
3. عند عودة الاتصال، `processQueue()` يُرسل كل العمليات للخادم بالترتيب
4. العمليات الناجحة تُحذف من `pendingOps`

---

## 8. تطبيق الويب التقدمي (PWA)

### ما هو PWA؟

تطبيق الويب التقدمي (Progressive Web App) هو موقع ويب يتصرف كتطبيق أصلي — يمكن تثبيته على الشاشة الرئيسية، يعمل بدون اتصال، ويُرسل إشعارات.

### Service Worker

Service Worker هو سكربت يعمل في خلفية المتصفح — منفصل عن الصفحة. يعترض طلبات الشبكة ويقرر: هل يجلب من الشبكة أم من الكاش المحلي؟

يستخدم **ملاحظاتي** مكتبة **@serwist/next 9** لبناء Service Worker:

```ts
// src/sw.ts — استراتيجيات التخزين المؤقت
// مسارات API → الشبكة فقط (NetworkOnly)
// الملفات الثابتة → الكاش أولًا (CacheFirst, 365 يوم)
// أيقونات PWA → الكاش أولًا (CacheFirst, 30 يوم)
// الباقي → الاستراتيجية الافتراضية (defaultCache)
```

### ملف Manifest

ملف `manifest.json` يُعرّف التطبيق لنظام التشغيل:

```json
{
  "name": "ملاحظاتي — My Notes",
  "short_name": "ملاحظاتي",
  "lang": "ar",
  "dir": "rtl",
  "display": "standalone",
  "theme_color": "#1565c0"
}
```

### بصمة صفرية (Zero PWA Footprint)

في **ملاحظاتي**، لا يُسجَّل Service Worker ولا يُحقَن manifest إلا بعد تنشيط المستخدم صراحة عبر حوار `PwaActivationDialog`. هذا يعني:

- الزائر العادي لا يرى أي أثر PWA
- المستخدم يختار متى يُفعّل التطبيق
- يمكن إلغاء التنشيط وإزالة كل آثار PWA من المتصفح

يتحكم `PwaActivationContext` في كل هذا برمجيًا.

---

## 9. المزامنة (Background Sync)

### المشكلة

المستخدم يُعدّل ملاحظة بدون اتصال ← كيف نضمن وصول التعديل للخادم لاحقًا؟

### الحل: Background Sync API

عند عودة الاتصال، يُطلق المتصفح حدث `sync` لـ Service Worker:

```text
Service Worker يُرسل رسالة PROCESS_OFFLINE_QUEUE
  ↓
التعديل يُحفظ في IndexedDB (pendingOps)
  ↓
عودة الاتصال  // حدث sync يُطلَق
  ↓
المستخدم يُعدّل بدون اتصال
  ↓
PwaRuntime يستقبل الرسالة ويُنفّذ processQueue()
  ↓
كل عملية معلّقة تُرسل بالترتيب للخادم
```

### كشف الاتصال (اتصال مزدوج الطبقات)

لا يكفي الاعتماد على `navigator.onLine` — قد يكون الجهاز متصلًا بالشبكة لكن الخادم ميّت. لذا يستخدم `useOfflineStatus`:

1. **الطبقة الأولى** — أحداث المتصفح (`online`/`offline`)
2. **الطبقة الثانية** — نبض فعلي عبر `HEAD /api/health` كل فترة

---

## 10. الإشعارات الفورية (Web Push)

### ما هو Web Push؟

Web Push API تتيح إرسال إشعارات للمستخدم حتى لو لم يكن الموقع مفتوحًا — عبر Service Worker.

### كيف يعمل VAPID؟

VAPID (Voluntary Application Server Identification) هو بروتوكول مصادقة بين الخادم ومزود الإشعارات:

```text
1. الخادم يُنشئ زوج مفاتيح VAPID (عام + خاص)
2. المتصفح يُنشئ اشتراكًا (PushSubscription) باستخدام المفتاح العام
3. الاشتراك يُرسل للخادم ويُخزن في نموذج Subscription
4. الخادم يستخدم المفتاح الخاص لإرسال الإشعارات عبر مكتبة web-push
```

### دورة حياة الاشتراك في ملاحظاتي

يتحكم `usePushNotifications` في كل المراحل:

- طلب إذن الإشعارات من المستخدم
- إنشاء اشتراك PushSubscription
- إرسال الاشتراك للخادم (`POST /api/push/subscribe`)
- إلغاء الاشتراك (`DELETE /api/push/subscribe`)
- ربط الاشتراك بالجهاز الحالي عبر `deviceId`

---

## 11. الترجمة (next-intl)

### ما هو next-intl؟

next-intl 4 هو مكتبة ترجمة مُصممة خصيصًا لـ Next.js. تُخزّن النصوص في ملفات JSON لكل لغة:

```text
src/messages/
  ar.json  // النصوص العربية
  en.json  // النصوص الإنجليزية
```

### كيف تعمل الترجمة؟

```tsx
import { useTranslations } from 'next-intl';
// في أي مكون

function LoginButton() {
  const t = useTranslations('auth');
  return <Button>{t('login')}</Button>;
  // العربية: "تسجيل الدخول"
  // الإنجليزية: "Login"
}
```

### التوجيه حسب اللغة

يُستخدم مسار ديناميكي `[locale]` في بنية المجلدات:

```text
/ar/notes  // الواجهة العربية
/en/notes  // الواجهة الإنجليزية
```

وسيط `next-intl` (في `proxy.ts`) يكشف لغة المستخدم ويُعيد التوجيه تلقائيًا.

### RTL و LTR

عند تبديل اللغة:

1. يتغير اتجاه الصفحة (`dir="rtl"` ⟷ `dir="ltr"`)
2. تتبدل خصائص CSS تلقائيًا عبر Stylis RTL
3. يتغير الخط من Cairo (عربي) إلى الخط الافتراضي
4. تتبدل كل النصوص من ملف اللغة المناسب

---

## 12. الاختبار (Vitest + Testing Library)

### ما هو Vitest؟

Vitest 4 هو إطار اختبار سريع متوافق مع بيئة Vite. يستخدم نفس إعدادات المشروع ويدعم TypeScript مباشرة.

يحتوي **ملاحظاتي** على **573 اختبار** في **39 ملف اختبار** — نسبة تغطية شاملة.

### ما هو Testing Library؟

Testing Library 16 يختبر المكونات كما يتعامل معها المستخدم — بالنصوص والأدوار وليس بالتفاصيل الداخلية:

```tsx
render(<LoginPage />);
// اختبار تسجيل الدخول
await userEvent.type(screen.getByLabelText('البريد'), 'test@test.com');
await userEvent.type(screen.getByLabelText('كلمة المرور'), '123456');
await userEvent.click(screen.getByRole('button', { name: 'دخول' }));
expect(screen.getByText('مرحبًا')).toBeInTheDocument();
```

### نمط AAA (Arrange-Act-Assert)

كل اختبار يتبع ثلاث مراحل:

```ts
// Arrange — تجهيز البيئة والبيانات
const mockNotes = [{ _id: '1', title: 'ملاحظة' }];

// Act — تنفيذ الإجراء المطلوب
render(<NoteList notes={mockNotes} />);

// Assert — التحقق من النتيجة
expect(screen.getByText('ملاحظة')).toBeInTheDocument();
```

### Mocking (المحاكاة)

عند اختبار مكون يعتمد على API، نستبدل الاستدعاء الحقيقي بمحاكاة:

```ts
vi.mock('@/app/lib/api', () => ({
  fetchApi: vi.fn().mockResolvedValue({ data: mockNotes }),
}));
```

### أوامر الاختبار

| الأمر | الوظيفة |
|-------|---------|
| `npm test` | تشغيل كل الاختبارات مرة واحدة |
| `npm run test:watch` | إعادة التشغيل عند كل تعديل |
| `npm run test:coverage` | تقرير التغطية |

راجع [testing.md](../testing.md) لاستراتيجية الاختبار الكاملة.

---

## 13. أنماط التصميم (Design Patterns)

### Context + Hook

النمط الأساسي في **ملاحظاتي** — سياق React يحمل الحالة المشتركة، وخطاف (hook) يُسهّل الوصول إليها:

```text
ThemeContext (الحالة) ──► useThemeMode (الواجهة) ──► أي مكون
AuthContext  (الحالة) ──► useAuth      (الواجهة) ──► أي مكون
```

### Optimistic UI (واجهة متفائلة)

عند إنشاء ملاحظة، تظهر فورًا في القائمة قبل أن يُؤكد الخادم — ما يعطي إحساسًا بالسرعة. إذا فشل الطلب، تُرجع الحالة السابقة.

### Mutex (قفل التنفيذ)

`processQueue()` في `useNotes` يستخدم قفلًا لمنع معالجة الرتل مرتين في نفس الوقت:

```ts
let processing = false;
async function processQueue() {
  if (processing) return; // منع التكرار
  processing = true;
  try {
    // معالجة العمليات المعلّقة واحدة تلو الأخرى
  } finally {
    processing = false;
  }
}
```

### State Machine (آلة الحالة)

حالة PWA في `PwaActivationContext` تتبع آلة حالة واضحة:

```text
غير مُنشّط  // تنشيط  // مُنشّط  // إلغاء التنشيط  // غير مُنشّط
```

كل انتقال يُنفِّذ إجراءات محددة (تسجيل/إلغاء Service Worker، حقن/إزالة manifest).

---

## 14. جودة الكود (Code Quality)

### Prettier — تنسيق تلقائي

Prettier 3 يُوحّد تنسيق الكود تلقائيًا — مسافات بادئة بمقدار 2، فاصلة منقوطة في النهاية، علامات اقتباس مفردة:

```bash
npm run format:check
# فحص التنسيق

# تنسيق تلقائي
npm run format
```

### ESLint — تحليل ثابت

ESLint 9 يكشف الأخطاء المحتملة وأنماط الكود السيئة:

```bash
npm run lint
```

يستخدم **ملاحظاتي** إعدادات `eslint-config-next` مع قواعد TypeScript.

### Conventional Commits — رسائل إيداع منظمة

كل رسالة إيداع تتبع صيغة محددة:

```text
<type>(<scope>): <description>

# أمثلة:
feat(notes): add voice recording
fix(auth): handle expired token
docs(tutorials): add concepts guide
```

| النوع | المعنى |
|-------|--------|
| `feat` | ميزة جديدة |
| `fix` | إصلاح خطأ |
| `docs` | تغيير في التوثيق |
| `refactor` | إعادة هيكلة بدون تغيير السلوك |
| `test` | إضافة أو تعديل اختبارات |
| `chore` | مهام صيانة (تبعيات، إعدادات) |

### Annotated Tags — وسوم إصدار موقّعة

عند إصدار نسخة جديدة:

```bash
git tag -a v1.0.0 -m "Release v1.0.0: initial production release"
```

---

## 15. النشر (Deployment)

### ما هو Heroku؟

Heroku هو منصة سحابية لنشر التطبيقات. يُنشئ حاوية (dyno) تُشغّل التطبيق تلقائيًا عند رفع الكود.

### المتغيرات البيئية المطلوبة

| المتغير | الغرض |
|---------|-------|
| `MONGODB_URI` | رابط اتصال قاعدة البيانات |
| `JWT_SECRET` | مفتاح تشفير رموز JWT |
| `VAPID_PUBLIC_KEY` | مفتاح VAPID العام (إشعارات) |
| `VAPID_PRIVATE_KEY` | مفتاح VAPID الخاص (إشعارات) |
| `VAPID_SUBJECT` | بريد مسؤول الإشعارات |

### خطوات النشر

```bash
npm install -g heroku
# 1. تثبيت CLI

# 2. تسجيل الدخول
heroku login

# 3. إنشاء التطبيق
heroku create my-notes-app

# 4. ضبط المتغيرات البيئية
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="..."

# 5. رفع الكود
git push heroku main

# 6. فتح التطبيق
heroku open
```

راجع [deployment.md](../deployment.md) للدليل التفصيلي.

---

## اصطلاحات الترقيم في التوثيق

هذا التوثيق يتبع سياسة موحدة للرموز:

| السياق | الرموز المُستخدمة |
|--------|-------------------|
| النثر العربي | `,` (فاصلة عربية) — `؛` (فاصلة منقوطة عربية) — `؟` (علامة استفهام عربية) |
| كتل الكود والأوامر | `,` `;` `?` `%` والأرقام الغربية `0-9` |
| نصوص المستخدم داخل الكود | تبقى بترقيمها العربي الأصلي |
| الأرقام | أرقام غربية (`0-9`) في الكود دائمًا — ويمكن استخدام هندية-عربية (`٠-٩`) في النثر العربي |

---

[← العودة إلى الفهرس](README.md)
