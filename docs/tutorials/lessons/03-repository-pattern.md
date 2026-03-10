# الدرس 03: نمط المستودعات (Repository Pattern)

> هدف الدرس: فهم لماذا ومتى نستخدم نمط المستودعات، وكيف نبني طبقة وصول للبيانات قابلة للاختبار والتوسعة والصيانة.

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 02: نماذج قاعدة البيانات](02-database-models.md)

---

## جدول المحتويات

1. [المشكلة: عندما تتحدث Controllers مباشرة مع قاعدة البيانات](#1-المشكلة-عندما-تتحدث-controllers-مباشرة-مع-قاعدة-البيانات)
2. [الحل: نمط المستودعات](#2-الحل-نمط-المستودعات)
3. [repository.interface.ts — العقد العام](#3-repositoryinterfacets--العقد-العام)
4. [base.repository.ts — التطبيق الأساسي](#4-baserepositoryt--التطبيق-الأساسي)
5. [user.repository.ts — مستودع المستخدم](#5-userrepositoryt--مستودع-المستخدم)
6. [device.repository.ts — مستودع الأجهزة](#6-devicerepositoryt--مستودع-الأجهزة)
7. [subscription.repository.ts — مستودع الاشتراكات](#7-subscriptionrepositoryt--مستودع-الاشتراكات)
8. [note.repository.ts — مستودع الملاحظات](#8-noterepositoryt--مستودع-الملاحظات)
9. [repositories/index.ts — مدير المستودعات](#9-repositoriesindexts--مدير-المستودعات)
10. [ملخص](#10-ملخص)

---

## 1. المشكلة: عندما تتحدث Controllers مباشرة مع قاعدة البيانات

### تشبيه: المطبخ بدون طاهٍ

تخيّل مطعمًا حيث **كل نادل** يدخل مباشرةً إلى المطبخ ليطهو الطلب بنفسه. كل نادل يعرف وصفات مختلفة؛ أحدهم يُضيف ملحًا أكثر، وآخر ينسى التحقق من تاريخ الصلاحية. النتيجة: فوضى وعدم اتساق.

**نمط المستودعات** هو وضع **طاهٍ خبير** بين النادل والمطبخ — طاهٍ يعرف الوصفة الصحيحة دائمًا، ويتحقق من المكونات، ويُرجع طبقًا موحّدًا.

### كود بدون Repository

```ts
// ❌ في route.ts — Controller يتحدث مباشرة مع النموذج
import Note from '@/app/models/Note';

// استعلام مكرر في كل route يحتاج ملاحظات المستخدم
const notes = await Note.find({ user: userId }).sort({ createdAt: -1 });
```

**المشاكل:**

| المشكلة | التأثير |
|---------|---------|
| **تكرار الكود** | نفس الاستعلام موزّع بين 5 routes مختلفة |
| **اتساق البيانات** | كل route يُرتّب بشكل مختلف |
| **صعوبة الاختبار** | لا يمكن Mock النموذج بسهولة |
| **اقتران قوي** | تغيير اسم الحقل يتطلب تعديل 5 مواضع |
| **ترقيم الصفحات** | كل مطوّر يحسبه بطريقة مختلفة |

### كود مع Repository

```ts
// ✅ في route.ts — Controller يتحدث مع Repository فقط
import { getRepositoryManager } from '@/app/repositories';

const repos = getRepositoryManager();
const result = await repos.note.findByUserPaginated(userId, page, limit);
```

**النتيجة:** سطر واحد، منطق مركزي، قابل للاختبار بسهولة.

---

## 2. الحل: نمط المستودعات

### هيكل الطبقات

```
IRepository<T>                     ← العقد (repository.interface.ts)
      ↑ implements
BaseRepository<T>                  ← التطبيق العام (base.repository.ts)
      ↑ extends
┌─────────────────┬──────────────────┬──────────────────────┬───────────────────┐
│ UserRepository  │ NoteRepository   │ SubscriptionRepo     │ DeviceRepository  │
│ (user.repo.ts)  │ (note.repo.ts)   │ (subscription.repo)  │ (device.repo.ts)  │
└─────────────────┴──────────────────┴──────────────────────┴───────────────────┘
                            ↓ aggregated by
                    RepositoryManager                         ← نقطة الوصول (index.ts)
```

### مبدأ الوراثة

كل مستودع متخصص **يرث** من `BaseRepository` ويكتسب تلقائيًا 11 عملية CRUD أساسية؛ وعليه هو يُضيف فقط ما يخصّه.

```
BaseRepository<INote>
  +findAll()         ← موروثة
  +findById()        ← موروثة
  +create()          ← موروثة
  +update()          ← موروثة
  +delete()          ← موروثة
  ... (6 عمليات أخرى)

NoteRepository extends BaseRepository<INote>
  +findByUser()      ← مضافة
  +findByUserPaginated() ← مضافة
  +findByType()      ← مضافة
  +search()          ← مضافة
  +deleteByUser()    ← مضافة
```

---

## 3. repository.interface.ts — العقد العام

هذا الملف هو **عقد** يُحدّد ما يجب أن يوفره أي مستودع في التطبيق.

### العقد كاملًا

```ts
import { Document, QueryFilter, UpdateQuery, QueryOptions } from 'mongoose';
import type { PaginatedResult } from '@/app/types';

export interface IRepository<T extends Document> {
  // ─── عمليات القراءة ────────────────────────────────────
  findAll(filter?: QueryFilter<T>, options?: QueryOptions<T>): Promise<T[]>;
  findOne(filter: QueryFilter<T>, options?: QueryOptions<T>): Promise<T | null>;
  findById(id: string, options?: QueryOptions<T>): Promise<T | null>;
  findPaginated(
    page: number,
    limit: number,
    filter?: QueryFilter<T>,
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T>>;

  // ─── عمليات الكتابة ────────────────────────────────────
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  updateWhere(filter: QueryFilter<T>, data: UpdateQuery<T>): Promise<number>;

  // ─── عمليات الحذف ──────────────────────────────────────
  delete(id: string): Promise<T | null>;
  deleteWhere(filter: QueryFilter<T>): Promise<number>;

  // ─── عمليات المساعدة ───────────────────────────────────
  exists(filter: QueryFilter<T>): Promise<boolean>;
  count(filter?: QueryFilter<T>): Promise<number>;
}
```

### جدول العمليات

| العملية | المُدخلات | المُخرجات | الاستخدام |
|---------|-----------|-----------|-----------|
| `findAll` | filter, options | `T[]` | جلب قائمة |
| `findOne` | filter, options | `T \| null` | جلب سجل واحد |
| `findById` | id | `T \| null` | جلب بالمُعرَّف |
| `findPaginated` | page, limit, filter | `PaginatedResult<T>` | قوائم مُرقَّمة |
| `create` | data | `T` | إنشاء سجل جديد |
| `update` | id, data | `T \| null` | تحديث بالمُعرَّف |
| `updateWhere` | filter, data | `number` | تحديث جماعي |
| `delete` | id | `T \| null` | حذف بالمُعرَّف |
| `deleteWhere` | filter | `number` | حذف جماعي |
| `exists` | filter | `boolean` | هل يوجد؟ |
| `count` | filter? | `number` | عدد السجلات |

### Generics `<T extends Document>`

```ts
interface IRepository<T extends Document> { ... }
//                    ^^^^^^^^^^^^^^^^^^^
//                    T = أي نوع Mongoose Document
//                    extends Document = يجب أن يكون T مستندًا

// مثال على الاستخدام:
IRepository<IUser>   // مستودع المستخدمين
IRepository<INote>   // مستودع الملاحظات
IRepository<IDevice> // مستودع الأجهزة
```

الـ Generics تُعطي **أمان نوع كامل** — لا يمكن استخدام `findById` لمستودع الملاحظات وتوقّع إرجاع `IUser`.

---

## 4. base.repository.ts — التطبيق الأساسي

المستودع الأساسي هو **فئة عامة** تُطبّق جميع عمليات `IRepository` بشكل مُعاد الاستخدام.

### البنية الأساسية

```ts
import { Model, Document, QueryFilter, UpdateQuery, QueryOptions } from 'mongoose';
import { IRepository } from './repository.interface';
import { MAX_PAGE_SIZE } from '@/app/config'; // = 50
import type { PaginatedResult } from '@/app/types';

export class BaseRepository<T extends Document> implements IRepository<T> {
  protected model: Model<T>; // ← protected = مُتاح للفئات الوارثة

  constructor(model: Model<T>) {
    this.model = model; // ← كل مستودع يُمرّر نموذجه عند الإنشاء
  }

  /** يكشف النموذج الأصلي للاستعلامات المتقدمة */
  getModel(): Model<T> {
    return this.model;
  }
  // ...
}
```

### عمليات القراءة

```ts
// ─── Read Operations ─────────────────────────────────────────────────────────

async findAll(
  filter: QueryFilter<T> = {} as QueryFilter<T>, // {} = كل السجلات بدون تصفية
  options: QueryOptions<T> = {}
): Promise<T[]> {
  return this.model.find(filter, null, options);
}

async findOne(filter: QueryFilter<T>, options: QueryOptions<T> = {}): Promise<T | null> {
  return this.model.findOne(filter, null, options);
}

async findById(id: string, options: QueryOptions<T> = {}): Promise<T | null> {
  return this.model.findById(id, null, options);
}
```

### findPaginated — الترقيم الآمن

هذه العملية هي الأهم في `BaseRepository` — تُطبّق **حدودًا آمنة** على صفحات الترقيم:

```ts
async findPaginated(
  page: number = 1,
  limit: number = 10,
  filter: QueryFilter<T> = {} as QueryFilter<T>,
  options: QueryOptions<T> = {}
): Promise<PaginatedResult<T>> {
  // 1. تأمين حدود المدخلات (لا pages سالبة، لا 10000 نتيجة)
  const safePage = Math.max(1, page);                          // لا يقل عن 1
  const safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE); // بين 1 و 50

  const skip = (safePage - 1) * safeLimit;

  // 2. استعلامان متوازيان (لا انتظار متسلسل)
  const [rows, count] = await Promise.all([
    this.model.find(filter, null, { ...options, skip, limit: safeLimit }),
    this.model.countDocuments(filter), // إجمالي الكل (بدون صفحة)
  ]);

  // 3. استجابة PaginatedResult<T> كاملة
  return {
    rows,
    count,
    page: safePage,
    totalPages: Math.ceil(count / safeLimit),
  };
}
```

**لماذا `Promise.all`؟**

```
بدون Promise.all:
  ① find() → انتظر → ②  countDocuments() → ←  النتيجة
  الوقت الكلي = وقت① + وقت②

مع Promise.all:
  ① find() ↘
            → ← النتيجة
  ② countDocuments() ↗
  الوقت الكلي = max(وقت①, وقت②)
```

الاستعلامان مستقلّان ويُنفَّذان معًا — **توفير 30-50% من وقت الاستجابة** عند الترقيم.

### عمليات الكتابة والحذف

```ts
// ─── Write Operations ────────────────────────────────────────────────────────

async create(data: Partial<T>): Promise<T> {
  const doc = new this.model(data); // ← ينشئ Document مع validation
  return doc.save();                // ← يُشغّل pre('save') middlewares
}

async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
  return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  //                                             ↑ يُعيد النسخة المحدّثة
}

async updateWhere(filter: QueryFilter<T>, data: UpdateQuery<T>): Promise<number> {
  const result = await this.model.updateMany(filter, data);
  return result.modifiedCount; // ← عدد السجلات المعدّلة فعلًا
}

// ─── Delete Operations ───────────────────────────────────────────────────────

async delete(id: string): Promise<T | null> {
  return this.model.findByIdAndDelete(id); // ← يُعيد المحذوف أو null
}

async deleteWhere(filter: QueryFilter<T>): Promise<number> {
  const result = await this.model.deleteMany(filter);
  return result.deletedCount; // ← عدد السجلات المحذوفة
}

// ─── Utility Operations ──────────────────────────────────────────────────────

async exists(filter: QueryFilter<T>): Promise<boolean> {
  const result = await this.model.exists(filter);
  return result !== null; // ← model.exists يُعيد { _id } أو null
}

async count(filter: QueryFilter<T> = {} as QueryFilter<T>): Promise<number> {
  return this.model.countDocuments(filter);
}
```

**لماذا `create()` يستخدم `new Model + save()` وليس `Model.create()`؟**

```ts
// Model.create() — أقصر، لكن يتجاوز بعض Middlewares في بعض الإصدارات
await Model.create(data);

// new Model + save() — الأضمن
const doc = new Model(data); // ← يُطبّق default values و validators
await doc.save();            // ← يُشغّل pre('save') بالتأكيد
```

نختار `save()` لضمان تشغيل حارس الاتساق في `noteSchema.pre('save')` الذي رأيناه في الدرس السابق.

---

## 5. user.repository.ts — مستودع المستخدم

### التخصصات المُضافة

```ts
class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User); // ← يُمرّر نموذج User لـ BaseRepository
  }

  /** البحث بالبريد الإلكتروني — يُستخدم في تسجيل الدخول */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email }); // ← يستخدم findOne الموروثة
  }

  /** البحث باسم المستخدم — يُستخدم في التحقق من الوجود */
  async findByUsername(username: string): Promise<IUser | null> {
    return this.findOne({ username });
  }

  /** هل البريد مُسجَّل؟ — للتحقق قبل التسجيل */
  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email }); // ← يستخدم exists الموروثة
  }

  /** هل اسم المستخدم مأخوذ؟ — للتحقق قبل التسجيل */
  async usernameExists(username: string): Promise<boolean> {
    return this.exists({ username });
  }
  // ...
}
```

**القيمة المُضافة:** واجهة نِيَّوية (intention-revealing) — `findByEmail()` أوضح من `findOne({ email })`، وقابلة للـ Mock في الاختبارات.

### deleteUserCascade — الحذف بالمعاملة (Transaction)

هذه العملية هي الأعقد في المستودع — تحذف المستخدم مع **جميع بياناته المرتبطة** في عملية ذرية (atomic):

```ts
async deleteUserCascade(userId: string): Promise<IUser | null> {
  // 1. بدء الجلسة (Session = سياق المعاملة)
  const session = await mongoose.startSession();

  try {
    session.startTransaction(); // ← بدء المعاملة

    // 2. حذف متوازٍ لجميع البيانات المرتبطة
    await Promise.all([
      Note.deleteMany({ user: userId }, { session }),         // ملاحظاته
      Subscription.deleteMany({ user: userId }, { session }), // اشتراكاته
      Device.deleteMany({ user: userId }, { session }),        // أجهزته
    ]);

    // 3. حذف المستخدم نفسه
    const deletedUser = await User.findByIdAndDelete(userId, { session });

    await session.commitTransaction(); // ← تأكيد المعاملة
    return deletedUser;

  } catch (error) {
    await session.abortTransaction(); // ← تراجع كامل عند الخطأ
    throw error;
  } finally {
    session.endSession(); // ← تنظيف الجلسة دائمًا
  }
}
```

### لماذا Transaction ضروري؟

تخيّل حذف المستخدم بدون Transaction:

```
① حذف Note.deleteMany({ user }) ← نجح
② حذف Subscription.deleteMany({ user }) ← نجح
③ حذف User.findByIdAndDelete() ← فشل (خطأ شبكة)

النتيجة: ملاحظات المستخدم حُذفت لكنه لا يزال موجودًا!
         → بيانات غير متسقة (orphaned records)
```

مع Transaction:

```
① حذف Notes ← في الذاكرة مؤقتًا
② حذف Subscriptions ← في الذاكرة مؤقتًا
③ حذف User ← فشل
  ↓ abortTransaction()
← يُلغى كل شيء — قاعدة البيانات تعود لحالتها السابقة
```

### ملاحظة: النماذج مباشرةً في `deleteUserCascade`

لاحظ أن `deleteUserCascade` تستورد `Note`, `Subscription`, `Device` **كنماذج مباشرة** وليس كمستودعات:

```ts
import Note from '@/app/models/Note';           // ← النموذج مباشرة
import Subscription from '@/app/models/Subscription';
import Device from '@/app/models/Device';
```

**السبب:** عمليات Transaction تحتاج `{ session }` كخيار — وهذا خيار Mongoose منخفض المستوى لا تُجرّده واجهة `IRepository`. لذا نتجاوز طبقة Repository هنا واستثنائيًا للتعامل المباشر مع النماذج.

---

## 6. device.repository.ts — مستودع الأجهزة

```ts
class DeviceRepository extends BaseRepository<IDevice> {
  constructor() {
    super(Device);
  }

  /** جلب أجهزة مستخدم مرتبةً بالأحدث نشاطًا */
  async findByUser(userId: string): Promise<IDevice[]> {
    return this.findAll({ user: userId }, { sort: { lastSeenAt: -1 } });
    //                                            ↑ ترتيب النشاط الأخير أولًا
  }

  /** البحث عن جهاز محدد بمُعرَّفه */
  async findByDeviceId(userId: string, deviceId: string): Promise<IDevice | null> {
    return this.findOne({ user: userId, deviceId }); // ← شرطان معًا
  }

  /** تحديث lastSeenAt — يُستدعى عند كل تسجيل دخول */
  async touch(userId: string, deviceId: string): Promise<IDevice | null> {
    return this.model.findOneAndUpdate(
      { user: userId, deviceId },       // ← معيار البحث
      { lastSeenAt: new Date() },        // ← ما يُحدَّث
      { returnDocument: 'after' }        // ← يُعيد النسخة الجديدة
    );
  }

  /** حذف جميع أجهزة مستخدم (cascade) */
  async deleteByUser(userId: string): Promise<number> {
    return this.deleteWhere({ user: userId }); // ← موروثة من BaseRepository
  }

  /** حذف جهاز محدد */
  async deleteByDeviceId(userId: string, deviceId: string): Promise<IDevice | null> {
    return this.model.findOneAndDelete({ user: userId, deviceId });
  }
}
```

### جدول عمليات DeviceRepository

| العملية | المدخل | المخرج | الغرض |
|---------|--------|--------|-------|
| `findByUser` | userId | `IDevice[]` | عرض قائمة الأجهزة |
| `findByDeviceId` | userId, deviceId | `IDevice \| null` | جلب جهاز محدد |
| `touch` | userId, deviceId | `IDevice \| null` | تحديث آخر نشاط |
| `deleteByUser` | userId | `number` | cascade عند حذف المستخدم |
| `deleteByDeviceId` | userId, deviceId | `IDevice \| null` | إلغاء ثقة جهاز |

### لماذا `touch()` لا تستخدم `update()` الموروثة؟

```ts
// update() الموروثة تبحث بـ _id (ObjectId)
await this.update(deviceMongoId, { lastSeenAt: new Date() });
// مشكلة: نحن نعرف userId + deviceId وليس _id MongoDB

// touch() تبحث بـ user + deviceId (أطبيعي في هذا السياق)
await this.model.findOneAndUpdate(
  { user: userId, deviceId },  // ← مُعرَّفنا الطبيعي
  { lastSeenAt: new Date() }
);
```

الأسلوب الثاني مباشر ومناسب للسياق — حالة استخدام لا تحتاج `_id`.

---

## 7. subscription.repository.ts — مستودع الاشتراكات

```ts
class SubscriptionRepository extends BaseRepository<ISubscription> {
  constructor() {
    super(Subscription);
  }

  /** جلب كل اشتراكات مستخدم (لإرسال إشعار لكل أجهزته) */
  async findByUser(userId: string): Promise<ISubscription[]> {
    return this.findAll({ user: userId });
  }

  /** البحث باستخدام رابط Push الفريد */
  async findByEndpoint(endpoint: string): Promise<ISubscription | null> {
    return this.findOne({ endpoint });
  }

  /** حذف جميع اشتراكات مستخدم (cascade) */
  async deleteByUser(userId: string): Promise<number> {
    return this.deleteWhere({ user: userId });
  }

  /** حذف اشتراك بعد إلغاء الاشتراك */
  async deleteByEndpoint(endpoint: string): Promise<ISubscription | null> {
    return this.model.findOneAndDelete({ endpoint });
  }

  /**
   * حذف اشتراكات بـ deviceId — يُستخدم عند حذف جهاز
   * الفهرس على deviceId في نموذج Subscription يجعل هذا سريعًا
   */
  async deleteByDeviceId(deviceId: string): Promise<number> {
    return this.deleteWhere({ deviceId });
  }
}
```

### جدول عمليات SubscriptionRepository

| العملية | المدخل | المخرج | المتى؟ |
|---------|--------|--------|--------|
| `findByUser` | userId | `ISubscription[]` | عند إرسال إشعار |
| `findByEndpoint` | endpoint | `ISubscription \| null` | للتحقق قبل الإضافة |
| `deleteByUser` | userId | `number` | عند حذف المستخدم |
| `deleteByEndpoint` | endpoint | `ISubscription \| null` | عند إلغاء الاشتراك |
| `deleteByDeviceId` | deviceId | `number` | عند حذف جهاز |

### سلسلة الحذف المتسلسل

```
حذف المستخدم
  ↓ deleteUserCascade()
  ├── Note.deleteMany({ user })       ← ملاحظاته
  ├── Subscription.deleteMany({ user }) ← اشتراكاته
  └── Device.deleteMany({ user })    ← أجهزته

حذف جهاز محدد
  ↓ DeviceRepository.deleteByDeviceId()
  └── SubscriptionRepository.deleteByDeviceId(deviceId) ← اشتراكات الجهاز
```

الحذف المتسلسل للأجهزة يستخدم `deleteByDeviceId` وليس `deleteByUser` — لأننا نحذف جهازًا واحدًا وليس كل الأجهزة.

---

## 8. note.repository.ts — مستودع الملاحظات

الأغنى بالعمليات — يوفر ترقيمًا وتصفيةً وبحثًا.

### عمليات القراءة

```ts
class NoteRepository extends BaseRepository<INote> {
  constructor() {
    super(Note);
  }

  /** جلب كل ملاحظات مستخدم (بدون ترقيم) مرتبةً بالأحدث */
  async findByUser(userId: string): Promise<INote[]> {
    return this.findAll({ user: userId }, { sort: { createdAt: -1 } });
  }

  /** جلب مُرقَّم مع ترتيب بالأحدث */
  async findByUserPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<INote>> {
    return this.findPaginated(  // ← موروثة من BaseRepository
      page,
      limit,
      { user: userId },
      { sort: { createdAt: -1 } }
    );
  }

  /** تصفية حسب النوع (نص/صوت) مع ترقيم */
  async findByType(
    userId: string,
    type: NoteType,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<INote>> {
    return this.findPaginated(
      page,
      limit,
      { user: userId, type },  // ← فلتر النوع مُضاف
      { sort: { createdAt: -1 } }
    );
  }
```

### search() — البحث الآمن بالـ Regex

```ts
async search(
  userId: string,
  searchTerm: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResult<INote>> {
  // 1. تنظيف الإدخال — حماية من حقن Regex
  const escaped = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  //                                          ↑ يهرب الأحرف الخاصة في Regex

  const regex = new RegExp(escaped, 'i'); // 'i' = case-insensitive

  // 2. بحث في العنوان أو المحتوى (أو كليهما)
  return this.findPaginated(
    page,
    limit,
    {
      user: userId,
      $or: [
        { title: regex },   // تطابق في العنوان
        { content: regex }, // أو في المحتوى
      ],
    },
    { sort: { createdAt: -1 } }
  );
}
```

### أمان البحث — لماذا escape الـ Regex؟

```ts
// مدخل المستخدم: "ملاحظة.*جديدة"
// بدون escape: regex = /ملاحظة.*جديدة/i
// .* = أي شيء → هذا regex صالح لكن قد يُعيد نتائج غير متوقعة
// أو: "(?:)" → كسر regex pattern

// مع escape: regex = /ملاحظة\.\*جديدة/i
// يبحث حرفيًا عن "ملاحظة.*جديدة" وليس عن pattern
const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
```

هذا التحصين يمنع **ReDoS (Regex Denial of Service)** — هجوم يمكن إطلاقه بأنماط regex متداخلة تُرهق المعالج.

### عملية الحذف

```ts
async deleteByUser(userId: string): Promise<number> {
  return this.deleteWhere({ user: userId }); // ← موروثة من BaseRepository
}
```

---

## 9. repositories/index.ts — مدير المستودعات

### البنية

```ts
import { getUserRepository, UserRepository } from './user.repository';
import { getNoteRepository, NoteRepository } from './note.repository';
import { getSubscriptionRepository, SubscriptionRepository } from './subscription.repository';

class RepositoryManager {
  // ← getters — يستدعون فوق functions الموجودة
  get user(): UserRepository {
    return getUserRepository();
  }

  get note(): NoteRepository {
    return getNoteRepository();
  }

  get subscription(): SubscriptionRepository {
    return getSubscriptionRepository();
  }
  // ...
}

// ─── Singleton ───────────────────────────────────────────────────────────────
let instance: RepositoryManager | null = null;

export function getRepositoryManager(): RepositoryManager {
  if (!instance) instance = new RepositoryManager();
  return instance;
}
```

### الاستخدام في route.ts

```ts
import { getRepositoryManager } from '@/app/repositories';

// في دالة GET أو POST:
const repos = getRepositoryManager();

// جلب ملاحظات مع ترقيم:
const result = await repos.note.findByUserPaginated(userId, page, limit);

// التحقق من وجود بريد:
const exists = await repos.user.emailExists(email);

// جلب اشتراكات لإرسال إشعار:
const subs = await repos.subscription.findByUser(userId);
```

### healthCheck — فحص الصحة

```ts
async healthCheck(): Promise<{
  status: string;
  database: string;
  repositories: Record<string, boolean>;
}> {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  const results: Record<string, boolean> = {};

  // اختبار كل مستودع باستعلام بسيط
  try { await this.user.count(); results.user = true; }
  catch { results.user = false; }

  try { await this.note.count(); results.note = true; }
  catch { results.note = false; }

  try { await this.subscription.count(); results.subscription = true; }
  catch { results.subscription = false; }

  const allHealthy = Object.values(results).every(Boolean);

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    repositories: results,
  };
}
```

يُستدعى هذا من `GET /api/health` — يُعيد حالة قاعدة البيانات وكل مستودع.

نموذج استجابة:

```json
{
  "status": "healthy",
  "database": "connected",
  "repositories": {
    "user": true,
    "note": true,
    "subscription": true
  }
}
```

### ملاحظة: DeviceRepository ليس في RepositoryManager

```ts
// RepositoryManager يوفر:
repos.user         ✅
repos.note         ✅
repos.subscription ✅
repos.device       ❌ — غير موجود!
```

**لماذا؟** `DeviceRepository` يُستخدم في سياقات محدودة (إدارة الأجهزة) ويمكن الوصول إليه مباشرةً عبر:

```ts
import { getDeviceRepository } from '@/app/repositories/device.repository';
const deviceRepo = getDeviceRepository();
```

هذا تصميم مقصود — ليس كل المستودعات تحتاج تجميعًا مركزيًا.

---

## 10. ملخص

### خريطة الملفات والعلاقات

| الملف | الدور | يعتمد على |
|-------|-------|-----------|
| `repository.interface.ts` | عقد IRepository | types.ts |
| `base.repository.ts` | CRUD عام | repository.interface, config (MAX_PAGE_SIZE) |
| `user.repository.ts` | User + Transaction | base.repository, models/User, Note, Subscription, Device |
| `device.repository.ts` | Device-specific | base.repository, models/Device |
| `subscription.repository.ts` | Push subscriptions | base.repository, models/Subscription |
| `note.repository.ts` | Notes + Search | base.repository, models/Note |
| `repositories/index.ts` | نقطة وصول مركزية | user+note+subscription repos |

### الأنماط المُستخدمة في هذا الدرس

| النمط | الملف | الغرض |
|-------|-------|-------|
| **Repository Pattern** | جميع الملفات | فصل طبقة الوصول للبيانات |
| **Generic Classes** | base.repository | إعادة استخدام الكود مع أمان الأنواع |
| **Inheritance** | كل X.repository | إضافة العمليات المتخصصة |
| **Singleton** | getXRepository() | مشاركة نسخة واحدة عبر التطبيق |
| **Transaction** | deleteUserCascade | ضمان اتساق البيانات عند الحذف المتسلسل |
| **Façade** | RepositoryManager | تبسيط الوصول لمتعدد المستودعات |

### نقطة المراقبة

بعد الانتهاء من هذا الدرس، يجب أن تستطيع:

- [ ] شرح لماذا نُفضّل Repository Pattern على الاستعلام المباشر من Controllers
- [ ] قراءة `IRepository<T>` وتحديد كل العمليات وأنواعها
- [ ] فهم كيف يُقيّد `findPaginated` المدخلات (`Math.max`, `Math.min`, `MAX_PAGE_SIZE`)
- [ ] شرح لماذا يُستخدم `Promise.all` في `findPaginated` وما فائدته
- [ ] فهم لماذا `deleteUserCascade` تستخدم Transaction وما يحدث بدونها
- [ ] فهم لماذا `search()` تُهرّب الـ Regex وما خطر التجاهل
- [ ] معرفة كيف تصل لأي مستودع عبر `getRepositoryManager()`

---

الدرس السابق → [الدرس 02: نماذج قاعدة البيانات](02-database-models.md) | الدرس التالي → [الدرس 04: المصادقة والحماية](04-authentication.md)
