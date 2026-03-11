# الدرس 05: مسارات API

> هدف الدرس: فهم كيف تُبنى مسارات API في Next.js App Router وكيف تتكامل مع طبقة المستودعات، مع استيعاب أنماط CRUD الجاهزة للإنتاج وآلية إشعارات الدفع (Web Push).

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 04: المصادقة والحماية](04-authentication.md)

---

## جدول المحتويات

1. [هيكل مسارات API في Next.js App Router](#1-هيكل-مسارات-api-في-nextjs-app-router)
2. [api/health — فحص صحة التطبيق](#2-apihealth--فحص-صحة-التطبيق)
3. [api/notes — قائمة وإنشاء الملاحظات](#3-apinotes--قائمة-وإنشاء-الملاحظات)
4. [api/notes/[id] — CRUD مفرد للملاحظة](#4-apinotesid--crud-مفرد-للملاحظة)
5. [api/devices — إدارة الأجهزة الموثوقة](#5-apidevices--إدارة-الأجهزة-الموثوقة)
6. [lib/webpush.ts — إرسال إشعارات الدفع](#6-libwebpushts--إرسال-إشعارات-الدفع)
7. [lib/pushUtils.ts — تنظيف الاشتراكات من المتصفح](#7-libpushutilsts--تنظيف-الاشتراكات-من-المتصفح)
8. [api/push/subscribe — تسجيل اشتراك الإشعارات](#8-apipushsubscribe--تسجيل-اشتراك-الإشعارات)
9. [api/push/send — إرسال الإشعار](#9-apipushsend--إرسال-الإشعار)
10. [lib/api.ts — طبقة العميل HTTP](#10-libapits--طبقة-العميل-http)
11. [ملخص](#11-ملخص)

---

## 1. هيكل مسارات API في Next.js App Router

### تشبيه: النوادل والمطبخ

التطبيق كمطعم: **المسارات (routes)** هي النوادل — يستقبلون الطلب من الزبون (المتصفح)، يتحققون من الهوية، يطلبون من المطبخ (repositories)، ويُقدّمون الطبق (JSON response). النادل لا يطهو بنفسه؛ هو يُنسّق فقط.

### نظام الملفات كمسارات

```text
src/app/
  api/
    health/
      route.ts          → GET /api/health
                        → HEAD /api/health
    notes/
      route.ts          → GET /api/notes
                        → POST /api/notes
      [id]/
        route.ts        → GET /api/notes/:id
                        → PUT /api/notes/:id
                        → DELETE /api/notes/:id
    devices/
      route.ts          → GET /api/devices
                        → POST /api/devices
                        → DELETE /api/devices
    push/
      subscribe/
        route.ts        → POST /api/push/subscribe
                        → DELETE /api/push/subscribe
      send/
        route.ts        → POST /api/push/send
    auth/               (تعلّمناه في الدرس 04)
    users/              (تعلّمناه في الدرس 04)
```

في App Router: **كل دالة مُصدَّرة بأسماء HTTP (`GET`, `POST`, `PUT`, `DELETE`, `HEAD`)** تُصبح نقطة نهاية (endpoint). اسم الدالة = فعل HTTP.

### النمط العام لكل مسار

```ts
export async function GET(
  request: NextRequest,
  // params موجودة فقط في المسارات الديناميكية [id]
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. المصادقة
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    // 2. قراءة المدخلات (params أو searchParams أو body)
    const { id } = await params; // ← await لأن params وعد في Next.js 15+

    // 3. الاتصال بقاعدة البيانات
    await connectDB();

    // 4. العمليات عبر المستودع
    const repo = getXRepository();
    const data = await repo.findById(id);

    // 5. التحقق من الوجود والملكية
    if (!data) return notFoundError('...');
    if (data.owner !== auth.userId) return forbiddenError();

    // 6. الاستجابة
    return NextResponse.json({ data: serialize(data) }, { status: 200 });
  } catch (error) {
    console.error('Error context:', error);
    return serverError();
  }
}
```

---

## 2. api/health — فحص صحة التطبيق

### نقطتا النهاية

```ts
// HEAD — مسبار خفيف الوزن (للتحقق من اتصال الشبكة فقط)
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
  // لا جسم, لا قاعدة بيانات — مجرد 200 OK
}

// GET — تقرير كامل عن صحة التطبيق
export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();
    const repos = getRepositoryManager();
    const health = await repos.healthCheck();

    return NextResponse.json(
      {
        status: health.status,         // 'healthy' أو 'degraded'
        database: health.database,     // 'connected', 'connecting', 'disconnected'
        repositories: health.repositories, // { user: true, note: true, subscription: true }
        timestamp: new Date().toISOString(),
      },
      { status: health.status === 'healthy' ? 200 : 503 }
      //                                              ↑ 503 Service Unavailable عند المشكلة
    );
  } catch {
    return NextResponse.json(
      { status: 'error', database: getConnectionStatus(), repositories: {}, timestamp: ... },
      { status: 503 }
    );
  }
}
```

### جدول ردود /api/health

| الحالة | status code | status | متى؟ |
|--------|-------------|--------|------|
| سليم | 200 | `'healthy'` | قاعدة البيانات متصلة وكل المستودعات تعمل |
| متدهور | 503 | `'degraded'` | بعض المستودعات تفشل |
| خطأ | 503 | `'error'` | فشل الاتصال بقاعدة البيانات كليًا |

### لماذا HEAD منفصل عن GET؟

`useOfflineStatus` في الواجهة يُرسل `HEAD` كل 30 ثانية لاكتشاف الاتصال:

```ts
// HEAD — مجرد فحص هل الخادم متاح؟
// لا يتصل بقاعدة البيانات → استجابة أسرع, ضغط أقل

// GET — تقرير شامل
// يتصل بقاعدة البيانات, يختبر المستودعات → أبطأ, لمراقبة الإنتاج
```

فصل المسبار الخفيف عن التقرير الشامل نمط شائع في الإنتاج (لiveness probe vs. health check كامل).

---

## 3. api/notes — قائمة وإنشاء الملاحظات

### دالة serializeNote — التحويل المركزي

```ts
function serializeNote(doc: INote, includeAudio = false): Note {
  // تحويل user إلى string (قد يكون ObjectId أو IUser بعد populate)
  const userId =
    doc.user instanceof Types.ObjectId
      ? doc.user.toString()
      : String((doc.user as { _id: unknown })._id ?? doc.user);

  return {
    _id: (doc._id as Types.ObjectId).toString(),
    title: doc.title,
    content: doc.content,
    // audioData مُدرَج فقط في الطلب المفرد أو عند الإنشاء
    audioData: includeAudio && doc.audioData ? doc.audioData.toString('base64') : undefined,
    audioDuration: doc.audioDuration,
    type: doc.type,
    user: userId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
```

**لماذا `includeAudio = false` افتراضيًا؟**

الملف الصوتي قد يصل لميغابايتات. في قائمة الملاحظات (عشرات النتائج)، إرسال الصوت لكل بطاقة يُهدر النطاق الترددي بلا حاجة — المستخدم يحتاجه فقط عند فتح ملاحظة محددة.

| الاستجابة | `includeAudio` | السبب |
|-----------|---------------|-------|
| `GET /api/notes` (قائمة) | `false` | أداء — بطاقات بدون صوت |
| `GET /api/notes/:id` (مفرد) | `true` | يحتاج المستخدم الاستماع |
| `POST /api/notes` (إنشاء) | `true` | يؤكد الحفظ الناجح |
| `PUT /api/notes/:id` (تحديث) | `false` | الصوت لا يتغيّر في التحديث |

### GET /api/notes — منطق التصفية

```ts
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (auth.error) return auth.error;

  // ── قراءة معاملات الاستعلام ─────────────────────────────────────────
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '10') || 10));
  const type = searchParams.get('type') as NoteType | null;
  const q = searchParams.get('q')?.trim();

  await connectDB();
  const noteRepo = getNoteRepository();

  // ── اختيار مسار الاستعلام بناءً على المعاملات ───────────────────────
  let result;
  if (q) {
    result = await noteRepo.search(auth.userId, q, page, limit);    // بحث نصي
  } else if (type === 'text' || type === 'voice') {
    result = await noteRepo.findByType(auth.userId, type, page, limit); // تصفية نوع
  } else {
    result = await noteRepo.findByUserPaginated(auth.userId, page, limit); // كل الملاحظات
  }

  return NextResponse.json({
    data: {
      notes: result.rows.map((n) => serializeNote(n)), // بدون صوت
      count: result.count,
      page: result.page,
      totalPages: result.totalPages,
    },
  });
}
```

**شجرة قرار الاستعلام:**

```text
GET /api/notes
  ├── ?q=كلمة          → noteRepo.search()  // بحث نصي
  ├── ?type=text|voice  → noteRepo.findByType()  // تصفية النوع
  └── (لا شيء)         → noteRepo.findByUserPaginated()  // كل الملاحظات
```

### POST /api/notes — إنشاء ملاحظة

```ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const errors = validateNoteInput(body);
  if (errors.length) return validationError(errors);

  await connectDB();
  const noteRepo = getNoteRepository();

  // تحويل Base64 → Buffer قبل الحفظ
  const audioBuffer =
    body.audioData && typeof body.audioData === 'string'
      ? Buffer.from(body.audioData, 'base64')
      : undefined;

  const note = await noteRepo.create({
    title: body.title.trim(),
    content: body.type === 'text' ? (body.content ?? '').trim() : undefined,
    audioData: audioBuffer,              // Buffer في قاعدة البيانات
    audioDuration: body.audioDuration,
    type: body.type,
    user: new Types.ObjectId(auth.userId), // ← ObjectId صريح
  });

  return NextResponse.json(
    { data: serializeNote(note as INote, true), message: 'تم إنشاء الملاحظة بنجاح' },
    { status: 201 } // 201 Created
  );
}
```

**دائرة البيانات الصوتية:**

```text
audioData: "base64..." →  Buffer.from(b64,'base64') → Buffer (ثنائي)
────────               ──────                     ──────────────
المتصفح               الخادم                     قاعدة البيانات
                          ↑ POST /api/notes

Buffer (ثنائي)        ← .toString('base64')       ← Buffer
                          ↑ GET /api/notes/:id (serializeNote)
```

---

## 4. api/notes/[id] — CRUD مفرد للملاحظة

### نمط التحقق من الملكية

يتكرر هذا النمط في GET، PUT، DELETE:

```ts
const note = await noteRepo.findById(id);
if (!note) return notFoundError('الملاحظة غير موجودة');

// استخراج userId من الـ user field (ObjectId أو IUser)
const ownerId =
  note.user instanceof Types.ObjectId
    ? note.user.toString()
    : String((note.user as { _id: unknown })._id ?? note.user);

if (ownerId !== auth.userId) return forbiddenError();
// ↑ المستخدم موثَّق لكن هذه ليست ملاحظته → 403
```

**لماذا الـ `instanceof Types.ObjectId` check؟**

```ts
note.user = Types.ObjectId("507f...") // ObjectId خام
// إذا استخدم findById دون populate:

// إذا استخدم findById مع populate('user'):
note.user = { _id: "507f...", username: "ahmed", ... } // IUser كامل

// الشرط يدعم الحالتين
```

في ملاحظاتي لا نستخدم `populate` في هذه المسارات — لكن الكود دفاعي لو تغيّر الاستعلام مستقبلًا.

### PUT /api/notes/[id] — القيود الثابتة (Immutable Invariants)

```ts
if (existing.type === 'text' && (body.audioData !== undefined || body.audioDuration !== undefined)) {
// النوع لا يتغيّر بعد الإنشاء — هذا ليس تحقق إدخال بل حارس منطق أعمال
  return validationError(['الملاحظات النصية لا تقبل بيانات صوتية']);
}
if (existing.type === 'voice' && body.content !== undefined) {
  return validationError(['الملاحظات الصوتية لا تقبل محتوى نصياً']);
}
```

**لماذا النوع ثابت؟**

تخيّل تحويل ملاحظة نصية لصوتية:
- الكود القديم يتوقع `content`، الكود الجديد يتوقع `audioData`
- الفهارس في MongoDB مبنية على `type`
- `pre('save')` يتحقق من الاتساق — سيرفض الحالة المختلطة

الحل الأبسط: **النوع ثابت**. لإنشاء ملاحظة بنوع مختلف، يُنشئ المستخدم واحدة جديدة.

### بناء كائن التحديث (فقط الحقول المُرسَلة)

```ts
const updates: Partial<INote> = {};
if (body.title !== undefined)     updates.title = String(body.title).trim();
if (body.content !== undefined)   updates.content = String(body.content).trim();
if (body.audioDuration !== undefined) updates.audioDuration = Number(body.audioDuration);
if (body.audioData !== undefined && typeof body.audioData === 'string') {
  updates.audioData = Buffer.from(body.audioData, 'base64');
}
// ← فقط الحقول الموجودة في body تُحدَّث
// لا نُعيد كتابة الحقول غير المُرسَلة
```

هذا النمط يتيح **التحديث الجزئي (Partial Update)** — المستخدم يُرسل فقط ما تغيّر.

### جدول عمليات /api/notes

| الفعل | المسار | المصادقة | ملكية | الاستجابة |
|-------|--------|----------|-------|-----------|
| `GET` | `/api/notes` | ✅ | ضمنية (user في الـ filter) | `{ data: { notes, count, page, totalPages } }` |
| `POST` | `/api/notes` | ✅ | — | `{ data: Note, message }` 201 |
| `GET` | `/api/notes/:id` | ✅ | ✅ تحقق صريح | `{ data: Note }` (مع audioData) |
| `PUT` | `/api/notes/:id` | ✅ | ✅ تحقق صريح | `{ data: Note, message }` |
| `DELETE` | `/api/notes/:id` | ✅ | ✅ تحقق صريح | `{ message }` |

---

## 5. api/devices — إدارة الأجهزة الموثوقة

### دالة serializeDevice — حقل isCurrent المُحسوب

```ts
function serializeDevice(doc: IDevice, currentDeviceId?: string): Device {
  return {
    _id: doc._id.toString(),
    user: (doc.user as Types.ObjectId).toString(),
    deviceId: doc.deviceId,
    name: doc.name ?? '',
    browser: doc.browser ?? '',
    os: doc.os ?? '',
    isCurrent: currentDeviceId ? doc.deviceId === currentDeviceId : undefined,
    // ↑ يُضاف عند المقارنة — ليس من قاعدة البيانات
    lastSeenAt: doc.lastSeenAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}
```

`isCurrent` حقل **مُحسوب في وقت التسلسل** — يُقارن `deviceId` الجهاز بـ `currentDeviceId` القادم من query string.

### GET /api/devices — جلب الأجهزة

```ts
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (auth.error) return auth.error;

  // currentDeviceId يأتي من المتصفح ليُعلَّم الجهاز الحالي
  const currentDeviceId = request.nextUrl.searchParams.get('currentDeviceId') ?? undefined;

  const devices = await deviceRepo.findByUser(auth.userId);
  // مرتبة بـ lastSeenAt DESC (الأحدث نشاطًا أولًا) — من المستودع

  return NextResponse.json({
    data: devices.map((d) => serializeDevice(d, currentDeviceId)),
  });
}
```

### POST /api/devices — توثيق جهاز (مع Upsert)

```ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ... التحقق من المصادقة والمدخلات ...

  // تأكيد كلمة المرور قبل الوثوق (حماية ضد الجلسات المسروقة)
  const user = await userRepo.findById(auth.userId);
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) return unauthorizedError('كلمة المرور غير صحيحة');

  // Upsert: إذا كان الجهاز موثوقًا بالفعل — تحديث آخر نشاط فقط
  const existing = await deviceRepo.findByDeviceId(auth.userId, deviceId);
  if (existing) {
    await deviceRepo.touch(auth.userId, deviceId);
    return NextResponse.json({
      data: serializeDevice(existing),
      message: 'الجهاز موثوق بالفعل',
    });
  }

  // إنشاء سجل جديد
  const device = await deviceRepo.create({
    user: new Types.ObjectId(auth.userId),
    deviceId,
    name: name ?? '',
    browser: browser ?? '',
    os: os ?? '',
    lastSeenAt: new Date(),
  });

  return NextResponse.json(
    { data: serializeDevice(device), message: 'تم الوثوق بالجهاز بنجاح' },
    { status: 201 }
  );
}
```

**نمط Upsert:**

```text
POST /api/devices
  ├── الجهاز موجود → touch() → 200 "موثوق بالفعل"
  └── الجهاز جديد  → create() → 201 "تم التوثيق"
```

يمنع ازدواجية السجلات في حال إعادة توثيق جهاز موجود.

### DELETE /api/devices — إزالة جهاز مع Cascade

```ts
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  // ... تأكيد كلمة المرور ...

  // حذف سجل الجهاز
  const deleted = await deviceRepo.deleteByDeviceId(auth.userId, deviceId);
  if (!deleted) {
    return NextResponse.json({ message: 'الجهاز غير موجود' }, { status: 404 });
  }

  // Cascade: حذف الاشتراكات المرتبطة بهذا الجهاز
  const subs = await subRepo.findByUser(auth.userId);
  await Promise.all(
    subs
      .filter(
        (s) =>
          s.deviceId === deviceId ||
          (s.deviceInfo && s.deviceInfo.startsWith(`${deviceId}|`)) // ← دعم legacy
      )
      .map((s) => subRepo.deleteByEndpoint(s.endpoint))
  );

  return NextResponse.json({ message: 'تم إزالة الجهاز بنجاح' });
}
```

### الفرق بين DELETE /api/devices و POST /api/auth/logout

| الخاصية | `DELETE /api/devices` | `POST /api/auth/logout` |
|---------|----------------------|------------------------|
| **يتطلب** | JWT + كلمة مرور | JWT فقط |
| **الغرض** | إزالة جهاز من قائمة الثقة | إنهاء الجلسة الحالية |
| **الاستخدام** | إزالة جهاز بعيد (مفقود/مسروق) | الخروج الطبيعي |
| **مستوى الخطر** | عالٍ (إزالة جهاز غائب) | منخفض (إزالة نفسك) |

---

## 6. lib/webpush.ts — إرسال إشعارات الدفع

### متغيرات البيئة المطلوبة

```ts
// NEXT_PUBLIC_VAPID_PUBLIC_KEY — المفتاح العام (متاح للعميل والخادم)
// VAPID_PRIVATE_KEY            — المفتاح الخاص (الخادم فقط)
// VAPID_EMAIL                  — بريد التواصل (إلزامي لمعايير Push)
```

**توليد مفاتيح VAPID:**
```bash
node -e "const wp=require('web-push'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"
```

### نمط التهيئة Lazy (مرة واحدة)

```ts
let initialised = false;

function ensureInitialised() {
  if (initialised) return; // ← لا تُعيد التهيئة إذا تمّت

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? 'mailto:admin@example.com';

  if (!publicKey || !privateKey) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set...');
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  initialised = true;
}
```

يستدعى `ensureInitialised()` عند أول نداء لـ `sendPushNotification` — يُهيّئ المكتبة مرة واحدة ثم يتخطّاها في كل نداء لاحق.

### sendPushNotification — إرسال مع معالجة الاشتراكات المنتهية

```ts
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  ensureInitialised();

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true; // ← نجح الإرسال
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      return false; // ← الاشتراك منتهي — المُستدعي يحذفه
    }
    throw err; // ← خطأ غير متوقع — ارمِه للأعلى
  }
}
```

**رموز استجابة خدمة Push:**

| كود | المعنى | الإجراء |
|-----|--------|--------|
| 201 | نجح الإرسال | `return true` |
| 410 Gone | الاشتراك ألغاه المستخدم | `return false` → حذف من DB |
| 404 Not Found | الاشتراك غير موجود (endpoint تالف) | `return false` → حذف من DB |
| 5xx | خطأ في خدمة Push | `throw err` → تسجيل في log |

هذا النمط يُنظّف تلقائيًا الاشتراكات المنتهية دون تدخل يدوي.

---

## 7. lib/pushUtils.ts — تنظيف الاشتراكات من المتصفح

### دالتان لسياقين مختلفين

```ts
/**
 * clearPushSubscription — إلغاء من المتصفح + إخطار الخادم
 * استخدم عندما: المستخدم يُلغي PWA أو يُزيل الثقة يدويًا
 */
export async function clearPushSubscription(): Promise<void> {
  try {
    const sub = await getBrowserSubscription(); // ← جلب الاشتراك من PushManager
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();                 // ← إلغاء من المتصفح
      await unsubscribePushApi(endpoint).catch(() => {}); // ← حذف من الخادم (best-effort)
    }
  } catch { /* non-critical */ } finally {
    localStorage.removeItem('push-subscribed'); // ← دائمًا تنظيف
  }
}

/**
 * clearLocalPushState — إلغاء من المتصفح فقط (بدون خادم)
 * استخدم عندما: الخادم حذف السجل مسبقًا (cascade بعد حذف جهاز)
 */
export async function clearLocalPushState(): Promise<void> {
  try {
    const sub = await getBrowserSubscription();
    if (sub) await sub.unsubscribe(); // ← إلغاء من المتصفح فقط
  } catch { /* non-critical */ } finally {
    localStorage.removeItem('push-subscribed');
  }
}
```

### متى تستخدم أيهما؟

| السيناريو | الدالة |
|-----------|--------|
| المستخدم يُلغي تفعيل PWA | `clearPushSubscription()` (يُخطر الخادم) |
| قرار إلغاء الثقة → الخادم يحذف cascade | `clearLocalPushState()` (بدون جولة ثانية للخادم) |
| تسجيل الخروج (logout) | `clearLocalPushState()` (لأن logout يحذف الجهاز الذي يحذف الاشتراك) |

### `finally` block — ضمان التنظيف

```ts
} finally {
  localStorage.removeItem('push-subscribed');
}
```

`finally` يعمل **حتى عند الخطأ**. لو فشل `sub.unsubscribe()` لسبب ما، مفتاح `localStorage` يُحذف على أي حال — الواجهة لا تعلق في حالة "مشترك" كاذبة.

---

## 8. api/push/subscribe — تسجيل اشتراك الإشعارات

### POST — تسجيل أو تحديث

```ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (auth.error) return auth.error;

  const { endpoint, keys, deviceId, deviceInfo } = body;

  // التحقق الأساسي من المفاتيح
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: { code: 'INVALID_SUBSCRIPTION', message: 'بيانات الاشتراك غير مكتملة' } },
      { status: 400 }
    );
  }

  await connectDB();
  const subRepo = getSubscriptionRepository();

  // بناء الحقول الاختيارية بشكل نظيف
  const fields = {
    keys,
    ...(deviceId && { deviceId }),       // أضف فقط إذا وُجد
    ...(deviceInfo && { deviceInfo }),   // أضف فقط إذا وُجد
  };

  // Upsert: إذا الـ endpoint موجود → حدّث, إلا → أنشئ
  const existing = await subRepo.findByEndpoint(endpoint);
  if (existing) {
    await subRepo.update(existing._id.toString(), fields);
  } else {
    await subRepo.create({
      user: new Types.ObjectId(userId),
      endpoint,
      ...fields,
    });
  }

  return NextResponse.json({ message: 'تم تسجيل الاشتراك بنجاح' }, { status: 201 });
}
```

### DELETE — إلغاء الاشتراك (عبر endpoint)

```ts
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (auth.error) return auth.error;

  const { endpoint } = body;
  if (!endpoint) {
    return NextResponse.json(
      { error: { code: 'MISSING_ENDPOINT', message: 'endpoint مطلوب' } },
      { status: 400 }
    );
  }

  const subRepo = getSubscriptionRepository();
  await subRepo.deleteByEndpoint(endpoint);
  // ← لا نتحقق من الوجود — deleteByEndpoint يُعيد null إذا لم يوجد (بشكل هادئ)

  return NextResponse.json({ message: 'تم إلغاء الاشتراك' }, { status: 200 });
}
```

### تدفق الاشتراك الكامل

```text
  1. navigator.serviceWorker.ready
المتصفح
  2. pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })
     → { endpoint, keys: { p256dh, auth } }
  3. POST /api/push/subscribe { endpoint, keys, deviceId }
     ← { message: 'تم التسجيل' }
  4. localStorage.setItem('push-subscribed', 'true')
```

---

## 9. api/push/send — إرسال الإشعار

### التدفق الكامل

```ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (auth.error) return auth.error;

  const { title, body: msgBody, url } = body;
  if (!title || !msgBody) {
    return NextResponse.json(
      { error: { code: 'MISSING_FIELDS', message: 'title و body مطلوبان' } },
      { status: 400 }
    );
  }

  const subRepo = getSubscriptionRepository();
  const subscriptions = await subRepo.findByUser(userId);

  if (subscriptions.length === 0) {
    return NextResponse.json({ message: 'لا توجد أجهزة مسجلة', sent: 0, failed: 0 });
  }

  let sent = 0; let failed = 0;

  // Promise.all — إرسال متوازٍ لكل الاشتراكات
  await Promise.all(
    subscriptions.map(async (sub) => {
      const pushSub: PushSubscription = { endpoint: sub.endpoint, keys: sub.keys };
      try {
        const success = await sendPushNotification(pushSub, payload);
        if (success) { sent++; }
        else {
          // الاشتراك منتهٍ (410/404) — احذفه تلقائيًا
          failed++;
          await subRepo.deleteByEndpoint(sub.endpoint);
        }
      } catch { failed++; }
    })
  );

  return NextResponse.json({ message: `تم إرسال ${sent} إشعار`, sent, failed });
}
```

**لماذا `Promise.all` وليس `Promise.allSettled`؟**

```ts
// Promise.all: يُلغى لو رمى أحدهم خطأ غير مُعالج
// لكننا نلتقط كل الأخطاء داخل map callback ← لا يصل خطأ للخارج

try {
  const success = await sendPushNotification(pushSub, payload);
  // ...
} catch { failed++; } // ← نُعدّ الفشل, لا نرمي للخارج
```

`Promise.all` هنا آمنة لأن كل callback يُعالج أخطاءه داخليًا. `Promise.allSettled` للحالات التي تريد الإكمال حتى مع الأخطاء غير الملتقطة.

### استجابة الإرسال

```json
{
  "message": "تم إرسال 3 إشعار",
  "sent": 3,
  "failed": 1
}
```

العداد `failed` يُخبر المُستدعي بعدد الاشتراكات المنتهية التي تمّ حذفها — مفيد للتشخيص والمراقبة.

---

## 10. lib/api.ts — طبقة العميل HTTP

### الفكرة: تجميع كل HTTP calls في مكان واحد

بدلًا من `fetch('/api/notes', { headers: { Authorization: `Bearer ${token}` }, ... })` في كل مكوّن، `lib/api.ts` يُتيح:

```ts
import { getNotesApi, createNoteApi } from '@/app/lib/api';

const result = await getNotesApi({ page: 1, limit: 10 });
const note = await createNoteApi({ title: 'ملاحظة', type: 'text', content: '...' });
```

### fetchApi — المُرسِل العام

```ts
const TOKEN_KEY = 'auth-token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null; // SSR — لا localStorage
  return localStorage.getItem(TOKEN_KEY);
}

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`; // ← حقن تلقائي للرمز

  const res = await fetch(path, { ...options, headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message ?? 'حدث خطأ غير متوقع'); // ← خطأ بالعربية
  }
  return json as T;
}
```

### جدول دوال api.ts

| الدالة | الفعل | المسار | النوع المُعاد |
|--------|-------|--------|--------------|
| `loginApi` | POST | `/api/auth/login` | `{ data: { token, user } }` |
| `registerApi` | POST | `/api/auth/register` | `{ data: { token, user } }` |
| `getMeApi` | GET | `/api/auth/me` | `{ data: User }` |
| `getNotesApi` | GET | `/api/notes?...` | `{ data: { notes, count, page, totalPages } }` |
| `getNoteApi` | GET | `/api/notes/:id` | `{ data: Note }` |
| `createNoteApi` | POST | `/api/notes` | `{ data: Note, message }` |
| `updateNoteApi` | PUT | `/api/notes/:id` | `{ data: Note, message }` |
| `deleteNoteApi` | DELETE | `/api/notes/:id` | `{ message }` |
| `updateUserApi` | PUT | `/api/users/:id` | `{ data: User, message }` |
| `changePasswordApi` | PUT | `/api/users/:id` | `{ data: User, message }` |
| `deleteUserApi` | DELETE | `/api/users/:id` | `{ message }` |
| `subscribePushApi` | POST | `/api/push/subscribe` | `{ message }` |
| `unsubscribePushApi` | DELETE | `/api/push/subscribe` | `{ message }` |
| `getDevicesApi` | GET | `/api/devices?...` | `{ data: Device[] }` |
| `trustDeviceApi` | POST | `/api/devices` | `{ data: Device, message }` |
| `deleteDeviceApi` | DELETE | `/api/devices` | `{ message }` |

### getNotesApi — بناء query string آمن

```ts
export function getNotesApi(params?: { page?: number; limit?: number; type?: string; q?: string }) {
  const sp = new URLSearchParams(); // ← ترميز URL تلقائي
  if (params?.page)  sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.type)  sp.set('type', params.type);
  if (params?.q)     sp.set('q', params.q);       // ← غير 'q=حروف عربية' آمن
  const qs = sp.toString();
  return fetchApi<NotesListResponse>(`/api/notes${qs ? `?${qs}` : ''}`);
}
```

`URLSearchParams` يُرمّز تلقائيًا الأحرف الخاصة والعربية — `ق=ملاحظة` يُصبح `q=%D9%85%D9%84%D8%A7%D8%AD%D8%B8%D8%A9` في URL.

---

## 11. ملخص

### خريطة مسارات API الكاملة

| المسار | الأفعال | المصادقة | الغرض |
|--------|---------|----------|-------|
| `GET /api/health` | GET, HEAD | ❌ | صحة التطبيق وقاعدة البيانات |
| `/api/notes` | GET, POST | ✅ | قائمة + إنشاء ملاحظات |
| `/api/notes/:id` | GET, PUT, DELETE | ✅ + ملكية | CRUD مفرد |
| `/api/devices` | GET, POST, DELETE | ✅ + كلمة مرور | إدارة الأجهزة |
| `/api/push/subscribe` | POST, DELETE | ✅ | اشتراكات Push |
| `/api/push/send` | POST | ✅ | إرسال إشعار |
| `/api/auth/*` | متنوع | جزئيًا | (درس 04) |
| `/api/users/:id` | PUT, DELETE | ✅ + ملكية | (درس 04) |

### الأنماط المُستخدمة في هذا الدرس

| النمط | الملف | الغرض |
|-------|-------|-------|
| **Route Handler** | جميع route.ts | دوال مُصدَّرة بأسماء HTTP |
| **Serialization Helper** | notes/route.ts, devices/route.ts | تحويل IDocument → JSON-safe |
| **includeAudio flag** | serializeNote | لا ترسل الصوت إلا عند الحاجة |
| **Upsert** | devices/POST, push/subscribe/POST | منع التكرار بشكل أنيق |
| **`Promise.all` للحذف** | devices/DELETE, push/send/POST | حذف متوازٍ لسجلات متعددة |
| **`Promise.allSettled`** | login/notifyOtherDevices | الإرسال لا يتوقف عند فشل بعضها |
| **Lazy Init** | webpush.ts/ensureInitialised | التهيئة مرة واحدة فقط |
| **`finally` block** | pushUtils.ts | تنظيف دائم حتى عند الأخطاء |
| **Centralized API client** | lib/api.ts | حقن JWT وتوحيد معالجة الأخطاء |
| **URLSearchParams** | getNotesApi | بناء query string آمن |

### نقطة المراقبة

بعد الانتهاء من هذا الدرس، يجب أن تستطيع:

- [ ] شرح كيف تُصبح دوال TypeScript مُصدَّرة مسارات API في Next.js App Router
- [ ] فهم لماذا `includeAudio = false` افتراضيًا في `serializeNote` وتأثيره على الأداء
- [ ] قراءة نمط Upsert (findByEndpoint → update أو create) وتفسيره
- [ ] شرح الفرق بين `clearPushSubscription` و`clearLocalPushState` وأين يُستخدم كل منهما
- [ ] فهم لماذا `sendPushNotification` تُعيد `false` عند 410/404 بدلًا من رمي استثناء
- [ ] وصف كيف تُعدّ `finally` block ضمانًا للتنظيف في `pushUtils.ts`
- [ ] معرفة دور `lib/api.ts` كطبقة وحيدة للـ HTTP في جانب العميل

---

الدرس السابق → [الدرس 04: المصادقة والحماية](04-authentication.md) | الدرس التالي → [الدرس 06: نظام السمات والتخطيط](06-theme-system.md)
