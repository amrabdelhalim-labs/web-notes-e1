# الدرس 02: نماذج قاعدة البيانات

> هدف الدرس: فهم كيف نُصمّم نماذج البيانات باستخدام Mongoose ونربطها بأنواع TypeScript لضمان اتساق البيانات من قاعدة البيانات حتى واجهة المستخدم.

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 01: إعداد المشروع](01-project-setup.md)

---

## جدول المحتويات

1. [المبدأ: العقد أولًا (Contract-First)](#1-المبدأ-العقد-أولًا-contract-first)
2. [types.ts — تعريف العقود](#2-typests--تعريف-العقود)
3. [mongodb.ts — اتصال Singleton](#3-mongodbts--اتصال-singleton)
4. [نموذج المستخدم (User)](#4-نموذج-المستخدم-user)
5. [نموذج الجهاز (Device)](#5-نموذج-الجهاز-device)
6. [نموذج الاشتراك (Subscription)](#6-نموذج-الاشتراك-subscription)
7. [نموذج الملاحظة (Note)](#7-نموذج-الملاحظة-note)
8. [العلاقات بين النماذج](#8-العلاقات-بين-النماذج)
9. [نمط HMR-Safe Model Registration](#9-نمط-hmr-safe-model-registration)
10. [ملخص](#10-ملخص)

---

## 1. المبدأ: العقد أولًا (Contract-First)

### تشبيه: نماذج البيانات كعقود موثّقة

تخيّل أن هناك **موثّق رسمي** ينظّم كل ما يُخزَّن في قاعدة البيانات. قبل أن نُنشئ أي "غرفة تخزين" (نموذج Mongoose)، يوقّع الموثّق على **عقد** (واجهة TypeScript) يُحدّد:

- ما الحقول المسموح بها؟
- أيها إلزامي وأيها اختياري؟
- ما نوع البيانات في كل حقل؟

في **ملاحظاتي**، العقود مُعرَّفة في `types.ts`، والنماذج في `models/` هي التنفيذ الفعلي لهذه العقود.

### سِلسلة البيانات في ملاحظاتي

```
types.ts (العقود)
  ↓
models/*.ts (تنفيذ Mongoose)
  ↓
repositories/*.ts (طبقة الوصول)
  ↓
api/*.ts (نقاط النهاية)
  ↓
المتصفح (أنواع Client-Side من types.ts)
```

لاحظ كيف أن `types.ts` يُغذّي **طرفَي** السِلسلة: تعريفات الخادم (`IUser`, `INote`...) وتعريفات العميل (`User`, `Note`...). هذا يُضمن اتساق البيانات من قاعدة البيانات حتى الصفحة.

---

## 2. types.ts — تعريف العقود

الملف الأضخم نظريًا رغم صغره — كل سطر فيه يُؤثّر على كامل التطبيق.

### ٢.١ الأنواع المشتركة

```ts
// ─── Shared Types ────────────────────────────────────────────────────────────

// اللغات المدعومة — تتوافق مع SUPPORTED_LOCALES في config.ts
export type SupportedLocale = 'ar' | 'en';

// تفضيل اللغة للمستخدم — 'unset' تعني لم يختر بعد
export type UserLanguagePref = SupportedLocale | 'unset';

// نوع الملاحظة — نصية أو صوتية فقط
export type NoteType = 'text' | 'voice';
```

هذه الأنواع البدائية الثلاثة تُستخدم في عشرات المواقع — في النماذج والمستودعات والمكوّنات والاختبارات.

### ٢.٢ أنواع العميل (Client-Side Types)

هذه الأنواع تُمثّل البيانات **بعد تحويلها لـ JSON** والإرسال للمتصفح:

```ts
// ─── Client-Side Types (serialisable — JSON safe) ───────────────────────────

export interface User {
  _id: string;        // ObjectId يتحوّل لـ string في JSON
  username: string;
  email: string;
  displayName?: string; // اختياري — ? تعني غياب مقبول
  language: UserLanguagePref;
  createdAt: string;  // Date يتحوّل لـ ISO string في JSON
  updatedAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content?: string;      // اختياري — الملاحظات الصوتية لا تحتوي content
  audioData?: string;    // Base64 string (ليس Buffer — Buffer لا يصلح لـ JSON)
  audioDuration?: number;
  type: NoteType;
  user: string;          // ObjectId المستخدم — reference مُبسَّط
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  _id: string;
  user: string;
  deviceId: string;   // UUID من localStorage (ليس _id MongoDB)
  name: string;
  browser: string;
  os: string;
  isCurrent?: boolean; // حقل مُحسوب في الواجهة — ليس في قاعدة البيانات!
  lastSeenAt: string;
  createdAt: string;
}
```

> لاحظ `isCurrent?: boolean` في `Device` — هذا الحقل **لا يوجد في قاعدة البيانات** على الإطلاق. يُضيفه `useDevices.ts` بعد مقارنة `deviceId` مع الجهاز الحالي. هذا مثال جيد على الفصل بين بيانات قاعدة البيانات ومتطلبات الواجهة.

### ٢.٣ أنواع الخادم (Server-Side / Mongoose Documents)

```ts
// ─── Server-Side Types (Mongoose Documents) ─────────────────────────────────

export interface IUser extends Document {
  _doc?: Record<string, unknown>; // للوصول المباشر للوثيقة الخام
  username: string;
  email: string;
  password: string;           // الكلمة المُشفّرة (hash) — غائبة من User العميل!
  displayName?: string;
  language: UserLanguagePref;
  createdAt: Date;            // Date حقيقي (ليس string) — Mongoose يُديره
  updatedAt: Date;
}

export interface INote extends Document {
  _doc?: Record<string, unknown>;
  title: string;
  content?: string;
  audioData?: Buffer;         // Buffer ثنائي — يتحوّل لـ Base64 string عند الإرسال
  audioDuration?: number;
  type: NoteType;
  user: Types.ObjectId | IUser; // مرجع مُنضمّ أو ObjectId خام
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription extends Document {
  _doc?: Record<string, unknown>;
  user: Types.ObjectId | IUser;
  endpoint: string;           // رابط Push فريد لكل متصفح/جهاز
  keys: {
    p256dh: string;           // مفتاح التشفير العام
    auth: string;             // سر المصادقة
  };
  deviceId?: string;          // مُفهرَس لتسهيل الحذف المتسلسل
  deviceInfo?: string;        // سلسلة إرثية (legacy) للتوافق القديم
  createdAt: Date;
}

export interface IDevice extends Document {
  _doc?: Record<string, unknown>;
  user: Types.ObjectId | IUser;
  deviceId: string;           // UUID من المتصفح (ليس MongoDB _id)
  name: string;
  browser: string;
  os: string;
  lastSeenAt: Date;           // يُحدَّث بدالة touch() في المستودع
  createdAt: Date;
}
```

**الفرق الجوهري بين أنواع العميل والخادم:**

| الجانب | أنواع الخادم (I-prefix) | أنواع العميل |
|--------|------------------------|--------------|
| `password` | موجودة (hash مُخزَّن) | **غائبة** (لا تُرسَل للمتصفح أبدًا) |
| `audioData` | `Buffer` ثنائي | `string` Base64 |
| `Date` | `Date` حقيقي | `string` ISO 8601 |
| `user` | `Types.ObjectId \| IUser` | `string` بسيط |
| `extends` | `extends Document` (Mongoose) | مستقل |

### ٢.٤ أنواع API

```ts
// ─── API Types ──────────────────────────────────────────────────────────────

// شكل الخطأ الموحد في كل الاستجابات
export interface ApiError {
  code: string;    // كود آلي: 'NOT_FOUND', 'UNAUTHORIZED'...
  message: string; // رسالة قابلة للعرض
}

// غلاف الاستجابة العام — إما data أو error (أو كلاهما في بعض الحالات)
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: ApiError;
}

// نتيجة أي قائمة مُرقَّمة
export interface PaginatedResult<T> {
  rows: T[];         // بيانات الصفحة الحالية
  count: number;     // إجمالي العناصر
  page: number;      // الصفحة الحالية (1-based)
  totalPages: number;
}
```

### ٢.٥ أنواع المدخلات (Input Types)

```ts
// ─── Input Types (for validators) ───────────────────────────────────────────

// كل مدخل من المستخدم له نوع خاص به — يُستخدم في validators/index.ts
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface NoteInput {
  title: string;
  content?: string;
  audioData?: string;
  audioDuration?: number;
  type: NoteType;
}

export interface UpdateNoteInput {
  title?: string;      // كل حقل اختياري — يُرسَل فقط ما تغيّر
  content?: string;
  audioData?: string;
  audioDuration?: number;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  displayName?: string;
  language?: UserLanguagePref;
}

export interface ChangePasswordInput {
  currentPassword: string; // للتحقق من الهوية قبل التغيير
  newPassword: string;
  confirmPassword: string; // للتحقق من تطابق الإدخال
}
```

---

## 3. mongodb.ts — اتصال Singleton

### ٣.١ المشكلة: Next.js و HMR

في وضع التطوير، Next.js يُعيد تحميل الوحدات عند كل تعديل (Hot Module Replacement). بدون حماية، سيُنشئ Mongoose اتصالًا جديدًا بقاعدة البيانات **مع كل إعادة تحميل** — ما يُفضي إلى آلاف الاتصالات المتراكمة.

**الحل: تخزين الاتصال على `globalThis`**

```ts
import mongoose from 'mongoose';

// رابط الاتصال بقاعدة البيانات (مع fallback للتطوير المحلي)
const DATABASE_URL =
  process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/mynotes';

// تحذير إذا لم يُضبط رابط حقيقي (في وضع التطوير فقط)
if (process.env.NODE_ENV !== 'test' && !process.env.DATABASE_URL && !process.env.MONGODB_URI) {
  console.warn('[mongodb] DATABASE_URL not set — using default fallback');
}

// نوع الكاش — يحتوي الاتصال والوعد الجاري
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// globalThis يبقى عبر كل إعادات تحميل HMR
declare global {
  var __mongoose: MongooseCache | undefined;
}

// استخدام الكاش الموجود أو إنشاء واحد جديد
const cached: MongooseCache = globalThis.__mongoose ?? { conn: null, promise: null };
if (!globalThis.__mongoose) globalThis.__mongoose = cached;
```

### ٣.٢ دالة connectDB

```ts
export async function connectDB(): Promise<typeof mongoose> {
  // إذا يوجد اتصال قائم، أعده مباشرة
  if (cached.conn) return cached.conn;

  // إذا لا يوجد وعد جارٍ، أنشئ اتصالًا جديدًا
  if (!cached.promise) {
    cached.promise = mongoose.connect(DATABASE_URL, {
      bufferCommands: false,         // لا تُخزّن الأوامر إذا لم يكن الاتصال جاهزًا
      serverSelectionTimeoutMS: 5_000, // انتظر 5 ثوانٍ كحد أقصى للاتصال
    });
  }

  try {
    cached.conn = await cached.promise; // انتظر إتمام الاتصال
  } catch (error) {
    cached.promise = null; // امسح الوعد الفاشل لإتاحة إعادة المحاولة
    throw error;
  }

  return cached.conn;
}
```

**لماذا `bufferCommands: false`؟**

```
bufferCommands: true (الافتراضي):
  طلب MongoDB ← الاتصال غير جاهز ← Mongoose يُخزّن الطلب في الذاكرة ← ينفّذه لاحقًا

bufferCommands: false (خيارنا):
  طلب MongoDB ← الاتصال غير جاهز ← Mongoose يُلقي خطأً فورًا
```

في بيئة serverless، من الأفضل معرفة المشكلة فورًا (وإعادة المحاولة) بدلًا من تراكم طلبات في الذاكرة.

### ٣.٣ دالة getConnectionStatus

```ts
export function getConnectionStatus(): string {
  const state = mongoose.connection.readyState;
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const map: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return map[state] ?? 'unknown';
}
```

هذه الدالة تُستخدم في `GET /api/health` لتقديم حالة قاعدة البيانات للمراقبة والتشخيص.

---

## 4. نموذج المستخدم (User)

### ٤.١ المخطط الكامل

```ts
import mongoose, { Schema } from 'mongoose';
import type { IUser } from '@/app/types';

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,  // حقل إلزامي
      unique: true,    // لا يتكرر (ينشئ فهرسًا unique تلقائيًا)
      trim: true,      // يحذف المسافات البادئة والتالية تلقائيًا
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // يُحوَّل للأحرف الصغيرة قبل الحفظ
    },
    password: {
      type: String,
      required: true,
      minlength: 6,    // الحد الأدنى للطول (التحقق الدقيق في validators)
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
      // ليس required — المستخدم قد لا يملأه
    },
    language: {
      type: String,
      enum: ['ar', 'en', 'unset'], // القيم المسموح بها فقط
      default: 'unset',            // القيمة الافتراضية
    },
  },
  { timestamps: true } // يُضيف createdAt و updatedAt تلقائيًا
);

// Mongoose يحمي من إعادة تسجيل النموذج عند HMR
export default mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
```

### ٤.٢ شرح الحقول سطرًا بسطر

| الحقل | النوع | القيود | ملاحظة |
|-------|-------|--------|--------|
| `username` | `String` | required, unique, 3-30 حرفًا | trim يُزيل المسافات المحيطة |
| `email` | `String` | required, unique, lowercase | تُحوَّل للأحرف الصغيرة قبل الحفظ |
| `password` | `String` | required, min 6 | **مُشفَّر دائمًا** — bcrypt 12 جولة |
| `displayName` | `String` | max 50 | اختياري — الاسم الظاهر للمستخدم |
| `language` | `String` | enum: ar/en/unset | تفضيل اللغة ('unset' = لم يختر بعد) |

### ٤.٣ `timestamps: true` — الإضافة السحرية

```ts
{ timestamps: true }
// يُضيف تلقائيًا:
// createdAt: Date  — وقت إنشاء المستند
// updatedAt: Date  — وقت آخر تعديل
// Mongoose تُحدّث updatedAt عند كل save()
```

بدون `timestamps: true`، تحتاج كتابة middleware أو تحديد الحقول يدويًا في كل عملية. الخيار `true` يختصر هذا كله.

---

## 5. نموذج الجهاز (Device)

### ٥.١ المخطط الكامل

```ts
const deviceSchema = new Schema<IDevice>(
  {
    user: {
      type: Schema.Types.ObjectId, // مرجع لـ ObjectId (ليس قيمة مُدمجة)
      ref: 'User',                 // اسم النموذج المُشار إليه — للـ populate()
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      // UUID يُنشئه المتصفح ويُخزَّن في localStorage
    },
    name: { type: String, trim: true, default: '' },    // اسم الجهاز (قابل للتعديل)
    browser: { type: String, trim: true, default: '' }, // Chrome, Firefox, Safari...
    os: { type: String, trim: true, default: '' },      // Windows, macOS, Android...
    lastSeenAt: {
      type: Date,
      default: Date.now, // وقت إنشاء السجل فقط — يُحدَّث لاحقًا بالمستودع
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
    // createdAt فقط — هذا النموذج لا يحتاج updatedAt (lastSeenAt يأخذ دوره)
  }
);

// فهرس على المستخدم للبحث السريع
deviceSchema.index({ user: 1 });
// فهرس مُركَّب فريد: نفس المستخدم لا يملك نفس الجهاز مرتين
deviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });
```

### ٥.٢ `deviceId` مقابل `_id`

هذا فارق جوهري:

| الخاصية | `_id` (MongoDB) | `deviceId` (localStorage) |
|---------|-----------------|---------------------------|
| **يُنشأ بواسطة** | MongoDB (تلقائي) | المتصفح (`crypto.randomUUID()`) |
| **يُخزَّن في** | قاعدة البيانات | `localStorage` |
| **يتغير عند** | حذف السجل | مسح بيانات المتصفح |
| **الغرض** | مُعرَّف السجل في قاعدة البيانات | ربط الجهاز بمتصفح محدد |

نحتاج `deviceId` منفصلًا لأن المتصفح يحتاج "بطاقة هوية" POST بها لإثبات أنه نفس الجهاز — حتى لو لم يُسجّل دخولًا بعد.

### ٥.٣ الفهارس المُركَّبة

```ts
deviceSchema.index({ user: 1 });                       // فهرس بسيط — جلب أجهزة مستخدم
deviceSchema.index({ user: 1, deviceId: 1 }, { unique: true }); // مُركَّب — منع التكرار
```

الفهرس المُركَّب `{ user: 1, deviceId: 1 }` يعني: **زوج (user + deviceId) فريد** — نفس المستخدم لا يملك جهازين بنفس `deviceId`. هذا يمنع تسجيل نفس الجهاز مرتين دون التدخل في جهاز مستخدم آخر لديه نفس `deviceId` (نادر لكن ممكن نظريًا في بيئات مُشتركة).

---

## 6. نموذج الاشتراك (Subscription)

يُمثّل كل سجل تسجيل إشعارات Web Push لجهاز محدد.

### ٦.١ المخطط الكامل

```ts
const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true, // رابط Push فريد عالميًا (كل متصفح/جهاز له endpoint خاص)
    },
    keys: {
      p256dh: { type: String, required: true }, // مفتاح التشفير (Diffie-Hellman)
      auth:   { type: String, required: true }, // سر المصادقة المشترك
    },
    deviceId: {
      type: String,
      index: true, // مُفهرَس للعثور على الاشتراك عند حذف جهاز
    },
    deviceInfo: {
      type: String,
      trim: true,
      // حقل إرثي (legacy) — نص مُركَّب "${deviceId}|${platform} — ${userAgent}"
      // أُبقي عليه للتوافق مع البيانات القديمة
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

subscriptionSchema.index({ user: 1 }); // جلب اشتراكات مستخدم
// unique: true على endpoint ينشئ فهرسه الخاص
```

### ٦.٢ مفاتيح Web Push (keys)

```ts
keys: {
  p256dh: string; // مفتاح عام للتشفير (Base64url)
  auth: string;   // سر المصادقة (Base64url)
}
```

عند إرسال إشعار، الخادم يستخدم هذين المفتاحين مع المفتاح الخاص VAPID لتشفير الرسالة. المتصفح وحده يمتلك المفتاح الخاص المقابل لـ `p256dh` ويستطيع فك تشفيرها.

### ٦.٣ `deviceId` في Subscription

```ts
deviceId: {
  type: String,
  index: true, // فهرس لتسريع الحذف المتسلسل
}
```

هذا الحقل يُربط الاشتراك بجهاز مُحدد. عند حذف جهاز:

```
حذف Device (deviceId: "abc-123")
  ↓ يُطلق cascade في user.repository.ts
  ↓ يبحث: Subscription.find({ deviceId: "abc-123" })
  ↓ يحذف كل الاشتراكات المرتبطة بهذا الجهاز
```

الفهرس على `deviceId` يجعل هذا البحث سريعًا حتى مع ملايين السجلات.

---

## 7. نموذج الملاحظة (Note)

الأغنى بالتفاصيل — يدعم نوعين مختلفين جذريًا من البيانات.

### ٧.١ المخطط الكامل

```ts
const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,    // لا عناوين فارغة
      maxlength: 200,  // حد معقول لطول العنوان
    },
    content: {
      type: String,
      trim: true,
      // اختياري — الملاحظات الصوتية ليس لها content نصي
    },
    audioData: {
      type: Buffer,    // بيانات ثنائية خام — ليس Base64
      // اختياري — الملاحظات النصية ليس لها صوت
    },
    audioDuration: {
      type: Number,
      min: 0,          // المدة بالثواني — لا تكون سالبة
    },
    type: {
      type: String,
      required: true,
      enum: ['text', 'voice'], // القيم الوحيدة الصالحة
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);
```

### ٧.٢ الفهارس

```ts
// ─── Indexes ─────────────────────────────────────────────────────────────────

// الاستخدام الأكثر شيوعًا: "أعطني ملاحظات هذا المستخدم مرتبةً بالأحدث"
noteSchema.index({ user: 1, createdAt: -1 });

// تصفية حسب النوع: "أعطني الملاحظات الصوتية فقط"
noteSchema.index({ user: 1, type: 1 });

// البحث النصي الكامل (Full-Text Search)
noteSchema.index({ title: 'text', content: 'text' });
```

**لماذا `{ user: 1, createdAt: -1 }` وليس فهرسين منفصلين؟**

الفهرس المُركَّب أكفأ بكثير:

```
استعلام: Note.find({ user: userId }).sort({ createdAt: -1 })

مع فهرس { user: 1, createdAt: -1 }:
  MongoDB يقرأ الفهرس مباشرةً → يُعيد النتائج مُرتَّبة فورًا
  لا فرز إضافي في الذاكرة

مع فهرسين منفصلين:
  MongoDB يستخدم أحدهما فقط → يقرأ وثائق → يُرتّبها في الذاكرة
```

### ٧.٣ حارس الاتساق (Consistency Guard)

```ts
// ─── Consistency Guard ───────────────────────────────────────────────────────
// يُطبَّق قبل كل save() — الخط الدفاعي الأخير لاتساق البيانات

noteSchema.pre('save', function () {
  // ملاحظة صوتية بدون بيانات صوت؟ خطأ!
  if (this.type === 'voice' && !this.audioData) {
    throw new Error('الملاحظة الصوتية يجب أن تحتوي على بيانات صوتية');
  }
  // ملاحظة نصية مع بيانات صوت؟ خطأ!
  if (this.type === 'text' && this.audioData) {
    throw new Error('الملاحظة النصية لا يمكن أن تحتوي على بيانات صوتية');
  }
});
```

**لماذا الحارس رغم تحقق API Layer؟**

مبدأ الدفاع العميق (Defense in Depth):

```
طلب API → validators/index.ts (الطبقة الأولى)
           → route.ts (الطبقة الثانية)
           → noteSchema.pre('save') (الخط الأخير)
```

لو تجاوز شيء ما الطبقتين الأوليتين (خطأ برمجي، أكواد legacy، استدعاء مباشر للمستودع)، الحارس يمنع تخزين بيانات غير متسقة في قاعدة البيانات.

### ٧.٤ Buffer مقابل Base64

```ts
// في قاعدة البيانات:
audioData: Buffer  // كفاءة تخزين أعلى

// عند الإرسال للمتصفح (في note.repository.ts أو API):
audioData.toString('base64')  // يُحوَّل لـ Base64 string قابل لـ JSON

// عند الاستقبال من المتصفح (في API route):
Buffer.from(base64String, 'base64')  // يُحوَّل للـ Buffer للتخزين
```

---

## 8. العلاقات بين النماذج

### ٨.١ خريطة العلاقات

```
User (المستخدم)
  │
  ├──► Note (1:N) — المستخدم يملك كثيرًا من الملاحظات
  │       [user: ObjectId → User]
  │
  ├──► Device (1:N) — المستخدم لديه أجهزة موثوقة متعددة
  │       [user: ObjectId → User]
  │       [فهرس فريد: user + deviceId]
  │
  └──► Subscription (1:N) — المستخدم مشترك في إشعارات من أجهزة متعددة
          [user: ObjectId → User]
          [deviceId → Device.deviceId (ليس ObjectId)]
```

### ٨.٢ نوع المراجع (References vs. Embedded Documents)

في MongoDB يمكن تخزين العلاقات بطريقتين:

| الطريقة | المثال | المناسب لـ |
|---------|--------|-----------|
| **مرجع (Reference)** | `user: ObjectId → User` | بيانات ضخمة أو مُشتركة |
| **مُضمَّن (Embedded)** | `keys: { p256dh: ..., auth: ... }` | بيانات صغيرة لا تُستخدم منفردةً |

**ملاحظاتي** يستخدم كلا الأسلوبين:
- **References**: `user` في كل النماذج (لتجنب تكرار بيانات المستخدم)
- **Embedded**: `keys` في `Subscription` (المفتاحان لا معنى لهما خارج الاشتراك)

### ٨.٣ `Types.ObjectId | IUser` — الغموض المقصود

```ts
user: Types.ObjectId | IUser;
```

Mongoose يدعم طريقتين للوصول لبيانات العلاقة:

```ts
// 1. ObjectId خام (الأسرع — مجرد قراءة):
const note = await Note.findById(id);
note.user; // Types.ObjectId — '507f1f77bcf86cd799439011'

// 2. Populate (أبطأ — يجلب البيانات كاملة):
const note = await Note.findById(id).populate('user');
note.user; // IUser — { username: 'ahmed', email: '...' }
```

نوع `Types.ObjectId | IUser` يُعبّر عن هذا الاحتمالين معًا — TypeScript سيُجبرك على التحقق قبل الاستخدام.

---

## 9. نمط HMR-Safe Model Registration

كل نموذج يُختتم بهذا السطر:

```ts
export default mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
//                          ^^^^          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                          إذا موجود     إلا فأنشئه
```

### لماذا ضروري؟

في التطوير، Next.js يُعيد تحميل الوحدات عند كل تعديل. لو كتبنا:

```ts
// ❌ خطأ — يُلقي "Cannot overwrite `User` model once compiled"
export default mongoose.model<IUser>('User', userSchema);
```

عند إعادة تحميل الصفحة، `mongoose.model('User', ...)` يُحاول إنشاء نموذج باسم 'User' للمرة الثانية — وهذا محظور في Mongoose.

الحل: `mongoose.models.User` يتحقق أأُنشئ النموذج من قبل — إن وجد يُعيده، إن لم يوجد يُنشئه. المُشغّل `??` (Nullish Coalescence) يُختصر هذا في سطر واحد.

---

## 10. ملخص

### ما تعلمناه في هذا الدرس

| الملف | الدور | النقطة المهمة |
|-------|-------|---------------|
| `types.ts` | عقود بيانات TypeScript | فارق Server/Client: `Buffer` vs `string`، `Date` vs `string`، `password` غائبة من العميل |
| `mongodb.ts` | Singleton connection | `globalThis.__mongoose` يحمي من تكرار الاتصال عند HMR |
| `models/User.ts` | نموذج المستخدم | `lowercase: true` على email، `unique: true` ينشئ فهرسًا تلقائيًا |
| `models/Device.ts` | نموذج الجهاز الموثوق | فهرس مُركَّب فريد `{user, deviceId}` يمنع التكرار |
| `models/Subscription.ts` | اشتراك Web Push | `deviceId` مُفهرَس للحذف المتسلسل السريع |
| `models/Note.ts` | نموذج الملاحظات | 3 فهارس، حارس `pre('save')` يضمن اتساق النوع |

### نمط مُستخدَم في كل النماذج

```ts
// 1. import النموذج والنوع
import mongoose, { Schema } from 'mongoose';
import type { ISomething } from '@/app/types';

// 2. تعريف المخطط بنوعه
const schema = new Schema<ISomething>({ /* الحقول */ }, { timestamps: true });

// 3. الفهارس خارج المخطط (اختياريًا)
schema.index({ field: 1 });

// 4. Middleware خارج المخطط (اختياريًا)
schema.pre('save', function () { /* حارس */ });

// 5. تصدير HMR-safe
export default mongoose.models.Something ?? mongoose.model<ISomething>('Something', schema);
```

### نقطة المراقبة

بعد الانتهاء من هذا الدرس، يجب أن تستطيع:

- [ ] شرح الفرق بين `User` (client) و `IUser` (server) وأين يُستخدم كل منهما
- [ ] فهم لماذا `audioData` هو `Buffer` في الخادم و `string` في العميل
- [ ] إضافة حقل جديد لنموذج موجود (مع تحديث النوع في `types.ts`)
- [ ] فهم لماذا نستخدم `globalThis.__mongoose` وليس متغير عادي
- [ ] قراءة فهرس مُركَّب (`{ user: 1, createdAt: -1 }`) وفهم معناه

---

الدرس السابق → [الدرس 01: إعداد المشروع](01-project-setup.md) | الدرس التالي → [الدرس 03: نمط المستودعات](03-repository-pattern.md)
