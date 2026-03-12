# المرجع السريع — عمليات المستودعات 📋

> **الغرض:** مرجع سريع لجميع دوال المستودعات مع أمثلة عملية جاهزة للاستخدام
> **للتوثيق التفصيلي:** [database-abstraction.md](database-abstraction.md)

---

## جدول المحتويات

1. [الاستيراد والإعداد](#1-الاستيراد-والإعداد)
2. [العمليات العامة (BaseRepository)](#2-العمليات-العامة-baserepository)
3. [UserRepository](#3-userrepository)
4. [NoteRepository](#4-noterepository)
5. [DeviceRepository](#5-devicerepository)
6. [SubscriptionRepository](#6-subscriptionrepository)
7. [RepositoryManager وفحص الصحة](#7-repositorymanager-وفحص-الصحة)
8. [أنماط الاستخدام في Route Handlers](#8-أنماط-الاستخدام-في-route-handlers)

---

## 1. الاستيراد والإعداد

```typescript
import { connectDB } from '@/app/lib/mongodb';
import {
  getUserRepository,
  getNoteRepository,
  getDeviceRepository,
  getSubscriptionRepository,
  getRepositoryManager,
} from '@/app/repositories';

// في بداية كل Route Handler
await connectDB();
const userRepo = getUserRepository();
const noteRepo = getNoteRepository();
const deviceRepo = getDeviceRepository();
const subRepo = getSubscriptionRepository();
```

---

## 2. العمليات العامة (BaseRepository)

متاحة في **جميع** المستودعات الأربعة.

### `findAll`
```typescript
const notes = await noteRepo.findAll();
// كل السجلات (بدون فلتر)

// مع فلتر
const textNotes = await noteRepo.findAll({ type: 'text' });

// مع ترتيب
const sorted = await noteRepo.findAll({}, { sort: { createdAt: -1 } });
```

### `findOne`
```typescript
const note = await noteRepo.findOne({ title: 'عنوان معين', user: userId });
// تُرجع null إذا لم توجد
```

### `findById`
```typescript
const note = await noteRepo.findById('507f1f77bcf86cd799439011');
// تُرجع null إذا لم يوجد أو كان الـ id غير صالح
```

### `findPaginated`
```typescript
const result = await noteRepo.findPaginated(
  1,          // رقم الصفحة
  10,         // العدد لكل صفحة (الحد الأقصى 50)
  { user: userId }, // فلتر اختياري
);

// الناتج
// {
//   rows: INote[],
//   count: 42,        // إجمالي السجلات
//   page: 1,
//   totalPages: 5,
// }
```

### `create`
```typescript
const newNote = await noteRepo.create({
  title: 'ملاحظة جديدة',
  content: '<p>المحتوى</p>',
  type: 'text',
  user: userId,
});
// تُرجع المستند الكامل بعد الحفظ
```

### `update`
```typescript
const updated = await noteRepo.update(noteId, {
  title: 'عنوان محدّث',
  content: '<p>محتوى محدّث</p>',
});
// تُرجع المستند المحدّث, أو null إذا لم يوجد
```

### `updateWhere`
```typescript
const count = await noteRepo.updateWhere(
// تحديث جماعي
  { user: userId, type: 'text' },  // فلتر
  { title: 'محدّث' },               // التحديثات
);
// count = عدد السجلات المحدّثة
```

### `delete`
```typescript
const deleted = await noteRepo.delete(noteId);
// تُرجع المستند المحذوف, أو null إذا لم يوجد
```

### `deleteWhere`
```typescript
const count = await noteRepo.deleteWhere({ user: userId });
// count = عدد السجلات المحذوفة
```

### `exists`
```typescript
const exists = await userRepo.exists({ email: 'test@example.com' });
// true | false
```

### `count`
```typescript
const total = await noteRepo.count({ user: userId });
const textCount = await noteRepo.count({ user: userId, type: 'text' });
```

---

## 3. UserRepository

```typescript
const userRepo = getUserRepository();
```

### `findByEmail`
```typescript
const user = await userRepo.findByEmail('user@example.com');
// البريد يتحول تلقائياً إلى lowercase
// تُرجع null إذا لم يوجد
```

### `findByUsername`
```typescript
const user = await userRepo.findByUsername('ahmed_dev');
// تُرجع null إذا لم يوجد
```

### `emailExists`
```typescript
const taken = await userRepo.emailExists('user@example.com');
// استخدم هذا بدلاً من findByEmail للتحقق من التوفر (أسرع)
```

### `usernameExists`
```typescript
const taken = await userRepo.usernameExists('ahmed_dev');
```

### `deleteUserCascade`
```typescript
const deletedUser = await userRepo.deleteUserCascade(userId);
// يحذف بالترتيب داخل MongoDB Transaction:
//   1. جميع الملاحظات
//   2. جميع الاشتراكات
//   3. جميع الأجهزة
//   4. المستخدم نفسه
// تُرجع null إذا لم يوجد المستخدم
```

---

## 4. NoteRepository

```typescript
const noteRepo = getNoteRepository();
```

### `findByUser`
```typescript
const notes = await noteRepo.findByUser(userId);
// مرتبة من الأحدث إلى الأقدم
// بدون ترقيم صفحات — لجميع الملاحظات دفعةً واحدة
```

### `findByUserPaginated`
```typescript
const page1 = await noteRepo.findByUserPaginated(userId);         // الافتراضي: page=1, limit=10
const page2 = await noteRepo.findByUserPaginated(userId, 2, 20); // الصفحة 2, 20 ملاحظة
// الناتج: PaginatedResult<INote>
```

### `findByType`
```typescript
const voiceNotes = await noteRepo.findByType(userId, 'voice');
const textNotes  = await noteRepo.findByType(userId, 'text', 1, 10); // مع ترقيم
// الناتج: PaginatedResult<INote>
```

### `search`
```typescript
const results = await noteRepo.search(userId, 'كلمة البحث');
const results2 = await noteRepo.search(userId, 'كلمة', 1, 5); // مع ترقيم
// يبحث في title + content باستخدام Regex
// أحرف Regex الخاصة تُهرَّب تلقائياً
// الناتج: PaginatedResult<INote>
```

### `deleteByUser`
```typescript
const count = await noteRepo.deleteByUser(userId);
// تُرجع عدد الملاحظات المحذوفة
// تُستخدم في deleteUserCascade
```

---

## 5. DeviceRepository

```typescript
const deviceRepo = getDeviceRepository();
```

### `findByUser`
```typescript
const devices = await deviceRepo.findByUser(userId);
// مرتبة من الأحدث إلى الأقدم
```

### `findByDeviceId`
```typescript
const device = await deviceRepo.findByDeviceId(userId, 'uuid-string');
// تُرجع null إذا لم يوجد
```

### `touch`
```typescript
const device = await deviceRepo.touch(userId, 'uuid-string');
// يُحدّث lastSeenAt إلى الوقت الحالي
// يُستدعى في كل طلب مصادق عليه
```

### `deleteByUser`
```typescript
const count = await deviceRepo.deleteByUser(userId);
```

### `deleteByDeviceId`
```typescript
const deleted = await deviceRepo.deleteByDeviceId(userId, 'uuid-string');
// تُرجع المستند المحذوف, أو null إذا لم يوجد
```

---

## 6. SubscriptionRepository

```typescript
const subRepo = getSubscriptionRepository();
```

### `findByUser`
```typescript
const subscriptions = await subRepo.findByUser(userId);
// جميع اشتراكات Push للمستخدم عبر كل أجهزته
```

### `findByEndpoint`
```typescript
const sub = await subRepo.findByEndpoint('https://fcm.googleapis.com/...');
// تُرجع null إذا لم يوجد
```

### `deleteByUser`
```typescript
const count = await subRepo.deleteByUser(userId);
```

### `deleteByEndpoint`
```typescript
const deleted = await subRepo.deleteByEndpoint(endpoint);
// تُستخدم عند وصول 410 Gone من خدمة Push — الاشتراك انتهى
```

### `deleteByDeviceId`
```typescript
const count = await subRepo.deleteByDeviceId('uuid-string');
// تُستخدم عند إزالة جهاز موثوق
```

---

## 7. RepositoryManager وفحص الصحة

```typescript
const manager = getRepositoryManager();

// الوصول المتكامل
const user = await manager.user.findByEmail('test@example.com');
const note = await manager.note.findByUser(userId);

// فحص صحة الطبقة — يُستخدم في /api/health
const health = await manager.healthCheck();
```

**مثال ناتج `healthCheck()`:**
```json
{
  "status": "healthy",
  "database": "connected",
  "repositories": {
    "user": true,
    "note": true,
    "subscription": true,
    "device": true
  }
}
```

---

## 8. أنماط الاستخدام في Route Handlers

### نمط أساسي
```typescript
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const userId = await requireAuth(request); // يُرجع userId أو يرمي خطأ

    const noteRepo = getNoteRepository();
    const { data, count, page, totalPages } = await noteRepo.findByUserPaginated(userId);

    return NextResponse.json({ notes: data, count, page, totalPages });
  } catch (error) {
    return handleError(error); // معالجة المركزية للأخطاء
  }
}
```

### نمط التحقق من الملكية قبل التعديل
```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  await connectDB();
  const userId = await requireAuth(request);
  const noteRepo = getNoteRepository();

  // التحقق من الوجود
  const existing = await noteRepo.findById(params.id);
  if (!existing) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

  // التحقق من الملكية
  if (existing.user.toString() !== userId) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  const updated = await noteRepo.update(params.id, await request.json());
  return NextResponse.json(updated);
}
```

### نمط التسجيل مع التحقق من التكرار
```typescript
export async function POST(request: NextRequest) {
  await connectDB();
  const { email, username, password } = await request.json();

  const userRepo = getUserRepository();

  const [emailTaken, usernameTaken] = await Promise.all([
    userRepo.emailExists(email),
    userRepo.usernameExists(username),
  ]);

  if (emailTaken) return NextResponse.json({ error: 'البريد مستخدم' }, { status: 409 });
  if (usernameTaken) return NextResponse.json({ error: 'الاسم مستخدم' }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await userRepo.create({ email, username, password: hashed });
  // ...
}
```

### نمط الاستعلام التوازي
```typescript
const [notes, devices] = await Promise.all([
// لجلب بيانات متعددة في آنٍ واحد
  noteRepo.findByUserPaginated(userId),
  deviceRepo.findByUser(userId),
]);
```

---

*للفهم التفصيلي للـ schemas والـ indexes: [database-abstraction.md](database-abstraction.md)*  
*لبنية API التي تستدعي هذه الدوال: [api-endpoints.md](api-endpoints.md)*
