# طبقة البيانات — نماذج Mongoose ونمط المستودعات 🗄️

> **الغرض:** توثيق تقني لطبقة البيانات في **ملاحظاتي** — تشمل نماذج MongoDB والنمط المعماري لـ Repository
> **الملفات:** `src/app/models/` + `src/app/repositories/`

---

## جدول المحتويات

1. [نظرة عامة على الطبقة](#1-نظرة-عامة-على-الطبقة)
2. [الاتصال بـ MongoDB](#2-الاتصال-بـ-mongodb)
3. [نماذج Mongoose (Models)](#3-نماذج-mongoose-models)
4. [نمط المستودعات (Repository Pattern)](#4-نمط-المستودعات-repository-pattern)
5. [المستودعات المتخصصة](#5-المستودعات-المتخصصة)
6. [مدير المستودعات (Repository Manager)](#6-مدير-المستودعات-repository-manager)
7. [الحذف المتسلسل (Cascade Delete)](#7-الحذف-المتسلسل-cascade-delete)
8. [Singleton Pattern](#8-singleton-pattern)

---

## 1. نظرة عامة على الطبقة

طبقة البيانات في **ملاحظاتي** تتألف من ثلاث طبقات متراكبة:

```text
Route Handler (api/)
      ↓
  Repository  // نقطة الوصول الوحيدة للبيانات
      ↓
  Mongoose Model  // تعريف الـ Schema والتحقق
      ↓
  MongoDB  // قاعدة البيانات الفعلية
```

**المبدأ الجوهري:** لا يتواصل أي Route Handler مع Mongoose مباشرةً — كل وصول للبيانات يمر عبر Repository.

### هيكل الملفات

```text
src/app/
├── lib/
│   └── mongodb.ts                    ← Singleton اتصال MongoDB
├── models/
│   ├── User.ts  // نموذج المستخدمين
│   ├── Note.ts  // نموذج الملاحظات
│   ├── Device.ts  // نموذج الأجهزة الموثوقة
│   └── Subscription.ts  // نموذج اشتراكات Push
└── repositories/
    ├── repository.interface.ts  // الواجهة العامة
    ├── base.repository.ts  // التطبيق الأساسي (CRUD عام)
    ├── user.repository.ts  // مستودع المستخدمين
    ├── note.repository.ts  // مستودع الملاحظات
    ├── device.repository.ts  // مستودع الأجهزة
    ├── subscription.repository.ts  // مستودع الاشتراكات
    └── index.ts  // مدير المستودعات
```

---

## 2. الاتصال بـ MongoDB

**الملف:** `src/app/lib/mongodb.ts`

```typescript
export async function connectDB(): Promise<typeof mongoose>
```

**التصميم:** Singleton مع Connection Pooling — الاتصال يُنشأ مرة واحدة ويُعاد استخدامه.

```typescript
import { connectDB } from '@/app/lib/mongodb';
// مثال الاستخدام في أي Route Handler

export async function GET() {
  await connectDB();    // لا عمل إذا كان متصلاً
  const userRepo = getUserRepository();
  // ...
}
```

**حالات الاتصال:**

| الحالة | القيمة | المعنى |
|--------|--------|--------|
| `0` | disconnected | لا يوجد اتصال |
| `1` | connected | متصل وجاهز |
| `2` | connecting | جاري الاتصال |
| `3` | disconnecting | جاري القطع |

**المتغير البيئي المطلوب:** `DATABASE_URL`

---

## 3. نماذج Mongoose (Models)

### ٣.١ نموذج المستخدم (User)

**الملف:** `src/app/models/User.ts`  
**المجموعة في MongoDB:** `users`

| الحقل | النوع | المتطلبات | الافتراضي |
|-------|-------|----------|----------|
| `username` | String | required, unique | — |
| `email` | String | required, unique | — |
| `password` | String | required (مشفر bcrypt) | — |
| `displayName` | String | اختياري | — |
| `language` | String (enum) | — | `'unset'` |
| `createdAt` | Date | تلقائي (timestamps) | — |
| `updatedAt` | Date | تلقائي (timestamps) | — |

**قيود الحقول:**
- `username`: 3-30 حرف، trimmed
- `email`: lowercase، trimmed
- `password`: ≥ 6 أحرف (مخزّن كـ bcrypt hash)
- `displayName`: ≤ 50 حرف
- `language` enum: `['ar', 'en', 'unset']`

**Indexes:**
```javascript
{ username: 1 }  // unique
{ email: 1 }     // unique
```

---

### ٣.٢ نموذج الملاحظة (Note)

**الملف:** `src/app/models/Note.ts`  
**المجموعة في MongoDB:** `notes`

| الحقل | النوع | المتطلبات | الملاحظات |
|-------|-------|----------|----------|
| `title` | String | required | 1-200 حرف |
| `content` | String | اختياري | HTML للملاحظات النصية |
| `audioData` | Buffer | اختياري | Base64 للملاحظات الصوتية |
| `audioDuration` | Number | اختياري | المدة بالثواني، min: 0 |
| `type` | String (enum) | required | `'text'` أو `'voice'` |
| `user` | ObjectId (ref: User) | required | مرجع للمستخدم |
| `createdAt` | Date | تلقائي | — |
| `updatedAt` | Date | تلقائي | — |

**Indexes:**
```javascript
{ user: 1, createdAt: -1 }  // للجلب المرتب حسب التاريخ
{ user: 1, type: 1 }        // للتصفية حسب النوع
{ title: 'text', content: 'text' }  // Full-text search
```

**Pre-Save Hook — حارس التناسق:**

```typescript
noteSchema.pre('save', function (next) {
// قبل حفظ أي ملاحظة — التحقق من تطابق type مع البيانات
  if (this.type === 'voice' && !this.audioData) {
    return next(new Error('الملاحظة الصوتية يجب أن تحتوي على بيانات صوتية'));
  }
  if (this.type === 'text' && this.audioData) {
    return next(new Error('الملاحظة النصية لا يمكن أن تحتوي على بيانات صوتية'));
  }
  next();
});
```

> هذا الـ hook هو خط الدفاع الأخير — يمنع التلوث المتبادل بين أنواع الملاحظات على مستوى قاعدة البيانات.

---

### ٣.٣ نموذج الجهاز (Device)

**الملف:** `src/app/models/Device.ts`  
**المجموعة في MongoDB:** `devices`

| الحقل | النوع | المتطلبات | الافتراضي |
|-------|-------|----------|----------|
| `user` | ObjectId (ref: User) | required | — |
| `deviceId` | String | required | UUID من localStorage |
| `name` | String | اختياري | `''` |
| `browser` | String | اختياري | `''` |
| `os` | String | اختياري | `''` |
| `lastSeenAt` | Date | اختياري | `Date.now` |
| `createdAt` | Date | تلقائي (createdAt فقط) | — |

**Indexes:**
```javascript
{ user: 1 }                    // للبحث السريع
{ user: 1, deviceId: 1 }       // unique — جهاز واحد لكل مستخدم
```

> **ملاحظة:** `updatedAt` غير مفعّل — يُستخدم `lastSeenAt` بديلاً.

---

### ٣.٤ نموذج الاشتراك (Subscription)

**الملف:** `src/app/models/Subscription.ts`  
**المجموعة في MongoDB:** `subscriptions`

| الحقل | النوع | المتطلبات | الملاحظات |
|-------|-------|----------|----------|
| `user` | ObjectId (ref: User) | required | مرجع للمستخدم |
| `endpoint` | String | required, unique | Web Push endpoint URL |
| `keys.p256dh` | String | required | مفتاح التشفير |
| `keys.auth` | String | required | مفتاح المصادقة |
| `deviceId` | String | اختياري, indexed | لربط الاشتراك بجهاز معين |
| `deviceInfo` | String | اختياري | بيانات الجهاز |
| `createdAt` | Date | تلقائي | — |

**Indexes:**
```javascript
{ user: 1 }         // للبحث عن اشتراكات المستخدم
{ endpoint: 1 }     // unique — endpoint واحد لكل مستخدم
{ deviceId: 1 }     // للحذف المتسلسل عند إزالة جهاز
```

---

## 4. نمط المستودعات (Repository Pattern)

### الفكرة الأساسية

نمط المستودعات يعمل مثل **قسم المستودعات في شركة** — لا تذهب مباشرةً إلى الرفوف، بل تطلب من الموظف المسؤول الذي يعرف أين كل شيء وكيف يُحضره.

### الواجهة العامة (`IRepository<T>`)

**الملف:** `src/app/repositories/repository.interface.ts`

```typescript
interface IRepository<T extends Document> {
  // القراءة
  findAll(filter?, options?): Promise<T[]>
  findOne(filter, options?): Promise<T | null>
  findById(id, options?): Promise<T | null>
  findPaginated(page, limit, filter?, options?): Promise<PaginatedResult<T>>

  // الكتابة
  create(data: Partial<T>): Promise<T>
  update(id, data): Promise<T | null>
  updateWhere(filter, data): Promise<number>

  // الحذف
  delete(id): Promise<T | null>
  deleteWhere(filter): Promise<number>

  // التحقق والعد
  exists(filter): Promise<boolean>
  count(filter?): Promise<number>
}
```

**نوع `PaginatedResult<T>`:**
```typescript
interface PaginatedResult<T> {
  rows: T[]
  count: number       // إجمالي السجلات المطابقة
  page: number        // الصفحة الحالية
  totalPages: number  // مجموع الصفحات
}
```

### المستودع الأساسي (`BaseRepository<T>`)

**الملف:** `src/app/repositories/base.repository.ts`

يُطبّق جميع دوال `IRepository<T>` باستخدام Mongoose مباشرةً. يعتني بـ:

- **حماية ترقيم الصفحات:** `page` لا تقل عن 1، `limit` بين 1 و `MAX_PAGE_SIZE` (50)
- **الـ lean queries:** إرجاع كائنات JavaScript عادية (أسرع من Mongoose Documents)
- **التعامل مع ObjectId:** التحقق من صلاحية الـ id قبل الاستعلام

```typescript
async findPaginated(page = 1, limit = 10, filter?, options?) {
// مثال: findPaginated آمن من الحدود
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
  // ...
}
```

---

## 5. المستودعات المتخصصة

### ٥.١ مستودع المستخدمين (`UserRepository`)

**الملف:** `src/app/repositories/user.repository.ts`  
**يرث من:** `BaseRepository<IUser>`

| الدالة | توقيع القيمة المُرجعة | الوصف |
|--------|----------------------|-------|
| `findByEmail(email)` | `IUser \| null` | البحث عبر البريد الإلكتروني (lowercase) |
| `findByUsername(username)` | `IUser \| null` | البحث عبر اسم المستخدم |
| `emailExists(email)` | `boolean` | هل البريد مستخدم؟ |
| `usernameExists(username)` | `boolean` | هل الاسم مستخدم؟ |
| `deleteUserCascade(userId)` | `IUser \| null` | حذف متسلسل داخل transaction |

---

### ٥.٢ مستودع الملاحظات (`NoteRepository`)

**الملف:** `src/app/repositories/note.repository.ts`  
**يرث من:** `BaseRepository<INote>`

| الدالة | توقيع القيمة المُرجعة | الوصف |
|--------|----------------------|-------|
| `findByUser(userId)` | `INote[]` | جميع الملاحظات — مرتبة من الأحدث |
| `findByUserPaginated(userId, page?, limit?)` | `PaginatedResult<INote>` | ملاحظات مع ترقيم |
| `findByType(userId, type, page?, limit?)` | `PaginatedResult<INote>` | تصفية حسب `text` أو `voice` |
| `search(userId, searchTerm, page?, limit?)` | `PaginatedResult<INote>` | بحث Regex في العنوان والمحتوى |
| `deleteByUser(userId)` | `number` | حذف جميع ملاحظات المستخدم |

> **ملاحظة أمان:** دالة `search()` تُهرّب أحرف Regex الخاصة قبل البحث لمنع injection:
> ```typescript
> const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
> ```

---

### ٥.٣ مستودع الأجهزة (`DeviceRepository`)

**الملف:** `src/app/repositories/device.repository.ts`  
**يرث من:** `BaseRepository<IDevice>`

| الدالة | توقيع القيمة المُرجعة | الوصف |
|--------|----------------------|-------|
| `findByUser(userId)` | `IDevice[]` | جميع الأجهزة — مرتبة من الأحدث |
| `findByDeviceId(userId, deviceId)` | `IDevice \| null` | جهاز محدد |
| `touch(userId, deviceId)` | `IDevice \| null` | تحديث `lastSeenAt` |
| `deleteByUser(userId)` | `number` | حذف جميع أجهزة المستخدم |
| `deleteByDeviceId(userId, deviceId)` | `IDevice \| null` | حذف جهاز محدد |

---

### ٥.٤ مستودع الاشتراكات (`SubscriptionRepository`)

**الملف:** `src/app/repositories/subscription.repository.ts`  
**يرث من:** `BaseRepository<ISubscription>`

| الدالة | توقيع القيمة المُرجعة | الوصف |
|--------|----------------------|-------|
| `findByUser(userId)` | `ISubscription[]` | جميع اشتراكات Push للمستخدم |
| `findByEndpoint(endpoint)` | `ISubscription \| null` | اشتراك عبر endpoint URL |
| `deleteByUser(userId)` | `number` | حذف جميع اشتراكات المستخدم |
| `deleteByEndpoint(endpoint)` | `ISubscription \| null` | حذف اشتراك منتهي (410 Gone) |
| `deleteByDeviceId(deviceId)` | `number` | حذف اشتراكات جهاز محدد |

---

## 6. مدير المستودعات (Repository Manager)

**الملف:** `src/app/repositories/index.ts`

يجمع جميع المستودعات في نقطة وصول واحدة، ويوفر فحص صحة الطبقة.

```typescript
const manager = getRepositoryManager();

// الوصول إلى المستودعات
manager.user          // UserRepository
manager.note          // NoteRepository
manager.subscription  // SubscriptionRepository

// فحص الصحة
const health = await manager.healthCheck();
// {
//   status: 'healthy' | 'degraded',
//   database: 'connected' | 'disconnected',
//   repositories: { user: true, note: true, subscription: true }
// }
```

---

## 7. الحذف المتسلسل (Cascade Delete)

عند حذف مستخدم، يجب حذف **كل** بياناته. يستخدم التطبيق **MongoDB Transaction** لضمان الذرّية (Atomicity):

```text
deleteUserCascade(userId)
    │
    ├─ Session.startTransaction()
    │
    ├─ NoteModel.deleteMany({ user: userId })  // الملاحظات أولاً
    ├─ SubscriptionModel.deleteMany({ user: userId })  // الاشتراكات ثانياً
    ├─ DeviceModel.deleteMany({ user: userId })  // الأجهزة ثالثاً
    ├─ UserModel.findByIdAndDelete(userId)  // المستخدم أخيراً
    │
    ├─ session.commitTransaction()  // نجح: تأكيد الكل
    └─ session.abortTransaction()  // فشل: تراجع عن الكل
```

**الضمان:** إذا فشلت أي خطوة، تتراجع جميع الخطوات السابقة. لا يمكن أن ينتهي الأمر بحساب محذوف لكن ملاحظاته موجودة.

---

## 8. Singleton Pattern

كل مستودع يُصدَّر عبر دالة Singleton تضمن إنشاء نسخة واحدة فقط طوال دورة حياة الخادم:

```typescript
let instance: UserRepository | null = null;
// في كل ملف repository

export function getUserRepository(): UserRepository {
  if (!instance) {
    instance = new UserRepository(UserModel);
  }
  return instance;
}
```

**الفائدة:** إنشاء نسخة واحدة من كل مستودع، وإعادة استخدامها بدلاً من إنشاء نسخ جديدة في كل طلب — يوفر الذاكرة ويحسن الأداء.

**الاستخدام:**
```typescript
const userRepo = getUserRepository();   // دائمًا نفس النسخة
const noteRepo = getNoteRepository();
const subRepo = getSubscriptionRepository();
const devRepo = getDeviceRepository();
```

---

*للمرجع السريع لعمليات المستودع: [repository-quick-reference.md](repository-quick-reference.md)*  
*لمسارات API التي تستخدم هذه الطبقة: [api-endpoints.md](api-endpoints.md)*  
*للدرس التعليمي: [tutorials/lessons/02-database-models.md](tutorials/lessons/02-database-models.md) و [tutorials/lessons/03-repository-pattern.md](tutorials/lessons/03-repository-pattern.md)*
