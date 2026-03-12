# مرجع مسارات API — ملاحظاتي 📝

> **إجمالي المسارات:** ١٨ نقطة نهاية — ١٢ مسار أساسي + ٣ مسارات للأجهزة والإشعارات + ٢ إشعارات Push + ١ فحص صحة
> **المصادقة:** JWT عبر `Authorization: Bearer <token>` في ترويسة الطلب
> **صالح من:** v0.2.1

---

## جدول المحتويات

1. [نظرة عامة على المسارات](#1-نظرة-عامة-على-المسارات)
2. [المصادقة وإدارة الحساب](#2-المصادقة-وإدارة-الحساب)
3. [الملاحظات (CRUD)](#3-الملاحظات-crud)
4. [إدارة المستخدم](#4-إدارة-المستخدم)
5. [الأجهزة الموثوقة](#5-الأجهزة-الموثوقة)
6. [الإشعارات الفورية](#6-الإشعارات-الفورية)
7. [فحص الصحة](#7-فحص-الصحة)
8. [رموز الأخطاء المشتركة](#8-رموز-الأخطاء-المشتركة)
9. [أنواع البيانات](#9-أنواع-البيانات)

---

## 1. نظرة عامة على المسارات

| الطريقة | المسار | المصادقة | الوصف |
|---------|--------|----------|-------|
| `POST` | `/api/auth/register` | ❌ | إنشاء حساب جديد |
| `POST` | `/api/auth/login` | ❌ | تسجيل الدخول |
| `GET` | `/api/auth/me` | ✅ | بيانات المستخدم الحالي |
| `POST` | `/api/auth/logout` | ✅ | تسجيل الخروج |
| `GET` | `/api/notes` | ✅ | قائمة الملاحظات (مع ترقيم وبحث) |
| `POST` | `/api/notes` | ✅ | إنشاء ملاحظة جديدة |
| `GET` | `/api/notes/[id]` | ✅ | تفاصيل ملاحظة |
| `PUT` | `/api/notes/[id]` | ✅ | تعديل ملاحظة |
| `DELETE` | `/api/notes/[id]` | ✅ | حذف ملاحظة |
| `PUT` | `/api/users/[id]` | ✅ | تعديل البيانات الشخصية أو كلمة المرور |
| `DELETE` | `/api/users/[id]` | ✅ | حذف الحساب وجميع بياناته |
| `GET` | `/api/devices` | ✅ | قائمة الأجهزة الموثوقة |
| `POST` | `/api/devices` | ✅ | الوثوق بجهاز جديد |
| `DELETE` | `/api/devices` | ✅ | إزالة جهاز موثوق |
| `POST` | `/api/push/subscribe` | ✅ | تسجيل اشتراك Push |
| `DELETE` | `/api/push/subscribe` | ✅ | إلغاء اشتراك Push |
| `POST` | `/api/push/send` | ✅ | إرسال إشعار (داخلي) |
| `GET` | `/api/health` | ❌ | فحص صحة الخادم وقاعدة البيانات |
| `HEAD` | `/api/health` | ❌ | فحص وصول سريع (بدون حمولة) |

### مبادئ المصادقة

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

- **مدة الصلاحية:** ٧ أيام (قابلة للتعديل عبر `JWT_SECRET`)
- **الـ token يُرسل فقط في الترويسة** (لا في الكوكيز، لا في query string)
- جميع المسارات المحمية ترجع `401` إذا كان الـ token مفقودًا أو منتهيًا أو غير صالح

---

## 2. المصادقة وإدارة الحساب

### POST /api/auth/register

إنشاء حساب مستخدم جديد وإرجاع JWT token.

**الطلب:**
```json
{
  "username": "ahmed123",
  "email": "ahmed@example.com",
  "password": "secret123",
  "language": "ar"
}
```

| الحقل | النوع | المتطلبات |
|-------|-------|----------|
| `username` | string | إلزامي — 3 إلى 30 حرف |
| `email` | string | إلزامي — تنسيق بريد صالح |
| `password` | string | إلزامي — 6 أحرف على الأقل |
| `language` | `'ar'` \| `'en'` | اختياري — لغة الواجهة عند التسجيل، الافتراضي `'unset'` |

**الاستجابة الناجحة (201):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "65f3a2b4c1e2d3f4a5b6c7d8",
      "username": "ahmed123",
      "email": "ahmed@example.com",
      "displayName": "ahmed123",
      "language": "ar",
      "createdAt": "2026-03-10T10:00:00.000Z",
      "updatedAt": "2026-03-10T10:00:00.000Z"
    }
  },
  "message": "تم إنشاء الحساب بنجاح"
}
```

**الأخطاء:**
| الكود | السبب |
|-------|-------|
| `400 VALIDATION_ERROR` | username أقل من 3 أحرف، بريد غير صالح، كلمة مرور أقل من 6 |
| `409 CONFLICT` | البريد أو اسم المستخدم مستخدم بالفعل |
| `500 SERVER_ERROR` | خطأ داخلي |

---

### POST /api/auth/login

تسجيل دخول بالبريد الإلكتروني وكلمة المرور. يُرسل أيضًا إشعار Push للأجهزة الأخرى المسجلة (fire-and-forget).

**الطلب:**
```json
{
  "email": "ahmed@example.com",
  "password": "secret123"
}
```

**الاستجابة الناجحة (200):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "...نفس كائن المستخدم أعلاه..." }
  },
  "message": "تم تسجيل الدخول بنجاح"
}
```

**الأخطاء:**
| الكود | السبب |
|-------|-------|
| `400 VALIDATION_ERROR` | حقل مفقود |
| `401 UNAUTHORIZED` | البريد أو كلمة المرور غير صحيحة |
| `500 SERVER_ERROR` | خطأ داخلي |

> **ملاحظة:** رسالة الخطأ غامضة عمدًا ("البريد الإلكتروني أو كلمة المرور غير صحيحة") لمنع enumeration attacks.

---

### GET /api/auth/me

جلب بيانات المستخدم الحالي من الـ token.

**الاستجابة الناجحة (200):**
```json
{
  "data": {
    "_id": "65f3a2b4c1e2d3f4a5b6c7d8",
    "username": "ahmed123",
    "email": "ahmed@example.com",
    "displayName": "أحمد",
    "language": "ar",
    "createdAt": "2026-03-10T10:00:00.000Z",
    "updatedAt": "2026-03-10T12:00:00.000Z"
  }
}
```

**الأخطاء:**
| الكود | السبب |
|-------|-------|
| `401 UNAUTHORIZED` | token مفقود أو غير صالح |
| `404 NOT_FOUND` | المستخدم حُذف بعد إصدار الـ token |

---

### POST /api/auth/logout

تسجيل الخروج مع إمكانية إزالة الجهاز الحالي واشتراكاته.

**الطلب:**
```json
{
  "deviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| الحقل | النوع | المتطلبات |
|-------|-------|----------|
| `deviceId` | string | اختياري — إذا أُرسل: يُحذف الجهاز وجميع اشتراكات Push المرتبطة به |

**الاستجابة الناجحة (200):**
```json
{ "message": "تم تسجيل الخروج وإزالة الجهاز" }
```
أو بدون `deviceId`:
```json
{ "message": "تم تسجيل الخروج" }
```

---

## 3. الملاحظات (CRUD)

### GET /api/notes

جلب قائمة ملاحظات المستخدم الحالي مع ترقيم وتصفية وبحث.

> **ملاحظة:** لا يُضمَّن `audioData` في قائمة الملاحظات لأسباب الأداء. استخدم `GET /api/notes/[id]` للحصول على البيانات الصوتية.

**Query Parameters:**

| المعامل | النوع | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `page` | number | 1 | رقم الصفحة |
| `limit` | number | 10 | عدد العناصر (الحد الأقصى: 50) |
| `type` | `text` \| `voice` | — | تصفية حسب نوع الملاحظة |
| `q` | string | — | بحث نصي في العنوان والمحتوى |

**مثال:**
```http
GET /api/notes?page=1&limit=20&type=text&q=اجتماع
```

**الاستجابة الناجحة (200):**
```json
{
  "data": {
    "notes": [
      {
        "_id": "65f3a2b4c1e2d3f4a5b6c7d8",
        "title": "ملاحظة الاجتماع",
        "content": "<p>نقاط الاجتماع...</p>",
        "audioDuration": null,
        "type": "text",
        "user": "65f3a2b4c1e2d3f4a5b6c7d0",
        "createdAt": "2026-03-10T10:00:00.000Z",
        "updatedAt": "2026-03-10T10:00:00.000Z"
      }
    ],
    "count": 45,
    "page": 1,
    "totalPages": 3
  }
}
```

---

### POST /api/notes

إنشاء ملاحظة جديدة (نصية أو صوتية).

**الطلب — ملاحظة نصية:**
```json
{
  "title": "ملاحظة الاجتماع",
  "type": "text",
  "content": "<p>محتوى الملاحظة بتنسيق HTML</p>"
}
```

**الطلب — ملاحظة صوتية:**
```json
{
  "title": "تسجيل صوتي",
  "type": "voice",
  "audioData": "data:audio/webm;base64,GkXfo59ChoEB...",
  "audioDuration": 47.3
}
```

| الحقل | النوع | المتطلبات |
|-------|-------|----------|
| `title` | string | إلزامي — 1 إلى 200 حرف |
| `type` | `text` \| `voice` | إلزامي |
| `content` | string | إلزامي إذا كان `type === "text"` |
| `audioData` | string (base64) | إلزامي إذا كان `type === "voice"` |
| `audioDuration` | number | اختياري — المدة بالثواني |

**الاستجابة الناجحة (201):**
```json
{
  "data": {
    "_id": "65f3a2b4c1e2d3f4a5b6c7d9",
    "title": "ملاحظة الاجتماع",
    "content": "<p>محتوى الملاحظة</p>",
    "audioData": null,
    "audioDuration": null,
    "type": "text",
    "user": "65f3a2b4c1e2d3f4a5b6c7d0",
    "createdAt": "2026-03-10T11:00:00.000Z",
    "updatedAt": "2026-03-10T11:00:00.000Z"
  },
  "message": "تم إنشاء الملاحظة بنجاح"
}
```

**الأخطاء:**
| الكود | السبب |
|-------|-------|
| `400 VALIDATION_ERROR` | عنوان فارغ، نوع غير صالح، `content` مفقود للنصية، `audioData` مفقود للصوتية |
| `401 UNAUTHORIZED` | token غير صالح |

---

### GET /api/notes/[id]

جلب تفاصيل ملاحظة واحدة كاملة بما فيها `audioData`.

**الاستجابة الناجحة (200):**
```json
{
  "data": {
    "_id": "65f3a2b4c1e2d3f4a5b6c7d9",
    "title": "تسجيل صوتي",
    "content": null,
    "audioData": "data:audio/webm;base64,GkXfo59ChoEB...",
    "audioDuration": 47.3,
    "type": "voice",
    "user": "65f3a2b4c1e2d3f4a5b6c7d0",
    "createdAt": "2026-03-10T11:00:00.000Z",
    "updatedAt": "2026-03-10T11:00:00.000Z"
  }
}
```

**الأخطاء:**
| الكود | السبب |
|-------|-------|
| `401 UNAUTHORIZED` | token غير صالح |
| `403 FORBIDDEN` | الملاحظة لا تخصّ المستخدم الحالي |
| `404 NOT_FOUND` | الملاحظة غير موجودة |

---

### PUT /api/notes/[id]

تعديل ملاحظة. النوع ثابت لا يمكن تغييره بعد الإنشاء.

**الطلب:**
```json
{
  "title": "عنوان محدّث",
  "content": "<p>محتوى محدّث</p>"
}
```

| الحقل | متاح لـ | الملاحظات |
|-------|---------|----------|
| `title` | text + voice | اختياري |
| `content` | text فقط | اختياري |
| `audioData` | voice فقط | اختياري — base64 |
| `audioDuration` | voice فقط | اختياري |

> **قيد:** محاولة إرسال `audioData` لملاحظة نصية (أو `content` لصوتية) ترجع `400`.

**الاستجابة الناجحة (200):**
```json
{
  "data": { "...الملاحظة المحدثة (بدون audioData)..." },
  "message": "تم تحديث الملاحظة بنجاح"
}
```

---

### DELETE /api/notes/[id]

حذف ملاحظة. يتحقق من الملكية قبل الحذف.

**الاستجابة الناجحة (200):**
```json
{ "message": "تم حذف الملاحظة بنجاح" }
```

---

## 4. إدارة المستخدم

### PUT /api/users/[id]

يخدم وظيفتين: **تعديل بيانات الملف الشخصي** أو **تغيير كلمة المرور**. يُحدد النوع بناءً على وجود `currentPassword` في الطلب.

> **قيد:** `[id]` يجب أن يطابق `_id` المستخدم الحالي في الـ token، وإلا يُرجع `403`.

**تعديل الملف الشخصي:**
```json
{
  "username": "ahmed_new",
  "email": "new@example.com",
  "displayName": "أحمد المطور",
  "language": "ar"
}
```

| الحقل | النوع | المتطلبات |
|-------|-------|----------|
| `username` | string | اختياري — 3 إلى 30 حرف |
| `email` | string | اختياري — بريد صالح |
| `displayName` | string | اختياري — حتى 50 حرف |
| `language` | `ar` \| `en` \| `unset` | اختياري |

**تغيير كلمة المرور:**
```json
{
  "currentPassword": "الكلمة_القديمة",
  "newPassword": "كلمة_جديدة_قوية",
  "confirmPassword": "كلمة_جديدة_قوية"
}
```

**الاستجابة الناجحة (200):**
```json
{
  "data": { "...كائن المستخدم المحدّث..." },
  "message": "تم تحديث البيانات بنجاح"
}
```

**الأخطاء:**
| الكود | السبب |
|-------|-------|
| `400 VALIDATION_ERROR` | بيانات غير صالحة |
| `401 UNAUTHORIZED` | كلمة المرور الحالية غير صحيحة (عند تغيير المرور) |
| `403 FORBIDDEN` | محاولة تعديل حساب آخر |
| `409 CONFLICT` | البريد أو الاسم مستخدم بالفعل |

---

### DELETE /api/users/[id]

حذف الحساب بالكامل مع جميع الملاحظات والأجهزة والاشتراكات في معاملة (transaction) واحدة.

**الطلب:**
```json
{
  "password": "كلمة_المرور_الحالية"
}
```

**الاستجابة الناجحة (200):**
```json
{ "message": "تم حذف الحساب وجميع البيانات المرتبطة بنجاح" }
```

**الأخطاء:**
| الكود | السبب |
|-------|-------|
| `400 VALIDATION_ERROR` | كلمة المرور مفقودة |
| `401 UNAUTHORIZED` | كلمة المرور غير صحيحة |
| `403 FORBIDDEN` | محاولة حذف حساب آخر |

> **تحذير:** الحذف لا رجعة فيه. يُحذف في تسلسل: الملاحظات → الاشتراكات → الأجهزة → المستخدم.

---

## 5. الأجهزة الموثوقة

الأجهزة الموثوقة هي أجهزة وافق المستخدم على استقبال إشعارات Push منها. تُحفظ في مجموعة `devices` بـ MongoDB.

### GET /api/devices

جلب قائمة الأجهزة الموثوقة للمستخدم.

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `currentDeviceId` | string | اختياري — تضاف `isCurrent: true` للجهاز المطابق |

**الاستجابة الناجحة (200):**
```json
{
  "data": [
    {
      "_id": "65f3a2b4c1e2d3f4a5b6c7da",
      "user": "65f3a2b4c1e2d3f4a5b6c7d0",
      "deviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "حاسوبي الشخصي",
      "browser": "Chrome",
      "os": "Windows 11",
      "isCurrent": true,
      "lastSeenAt": "2026-03-10T12:00:00.000Z",
      "createdAt": "2026-03-01T08:00:00.000Z"
    }
  ]
}
```

---

### POST /api/devices

الوثوق بجهاز جديد (يستلزم تأكيد كلمة المرور). إذا كان الجهاز موجودًا، يُحدَّث `lastSeenAt` (Upsert).

**الطلب:**
```json
{
  "deviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "password": "كلمة_المرور",
  "name": "حاسوبي الشخصي",
  "browser": "Chrome",
  "os": "Windows 11"
}
```

| الحقل | النوع | المتطلبات |
|-------|-------|----------|
| `deviceId` | string | إلزامي — UUID من localStorage (8+ أحرف) |
| `password` | string | إلزامي — تأكيد هوية المستخدم |
| `name` | string | اختياري |
| `browser` | string | اختياري |
| `os` | string | اختياري |

**الاستجابة الناجحة:**
- `201` — جهاز جديد: `{ "data": DeviceObject, "message": "تم الوثوق بالجهاز بنجاح" }`
- `200` — جهاز موجود: `{ "data": DeviceObject, "message": "الجهاز موثوق بالفعل" }`

---

### DELETE /api/devices

إزالة جهاز موثوق مع جميع اشتراكات Push المرتبطة به.

**الطلب:**
```json
{
  "deviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "password": "كلمة_المرور"
}
```

**الاستجابة الناجحة (200):**
```json
{ "message": "تم إزالة الجهاز بنجاح" }
```

---

## 6. الإشعارات الفورية

### POST /api/push/subscribe

تسجيل اشتراك Web Push لجهاز معين.

**الطلب:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNId3...",
    "auth": "tBHItJI5SVYc..."
  },
  "deviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "deviceInfo": "chrome|Windows 11"
}
```

**الاستجابة الناجحة (201):**
```json
{ "message": "تم تسجيل الاشتراك بنجاح" }
```

**الأخطاء:**
| الكود | السبب |
|-------|-------|
| `400 INVALID_SUBSCRIPTION` | endpoint أو keys.p256dh أو keys.auth مفقود |
| `401 UNAUTHORIZED` | token غير صالح |

---

### DELETE /api/push/subscribe

إلغاء اشتراك Web Push عبر الـ endpoint.

**الطلب:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**الاستجابة الناجحة (200):**
```json
{ "message": "تم إلغاء الاشتراك" }
```

**الأخطاء:**
| الكود | السبب |
|-------|-------|
| `400 MISSING_ENDPOINT` | endpoint مفقود |
| `401 UNAUTHORIZED` | token غير صالح |

---

### POST /api/push/send

إرسال إشعار Push لجميع اشتراكات مستخدم معين. **يُستخدم داخليًا** (من `notifyOtherDevices` في مسار login) وليس مخصصًا للاستدعاء المباشر.

**الطلب:**
```json
{
  "title": "ملاحظاتي — تسجيل دخول",
  "body": "تم تسجيل الدخول إلى حسابك من جهاز جديد",
  "url": "/ar/notes"
}
```

**الاستجابة الناجحة (200):**
```json
{
  "message": "تم إرسال الإشعارات",
  "sent": 2,
  "failed": 0
}
```

> الاشتراكات التي تُرجع `410 Gone` أو `404` تُحذف تلقائيًا من قاعدة البيانات.

---

## 7. فحص الصحة

### HEAD /api/health

فحص وصول سريع وخفيف — يُرجع `200` بدون حمولة ولا يلمس قاعدة البيانات. يُستخدم من `useOfflineStatus` لاكتشاف حالة الاتصال.

**الاستجابة:** `200` (بدون جسم)

---

### GET /api/health

فحص حالة الخادم وقاعدة البيانات وطبقة المستودعات.

**الاستجابة الناجحة (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "repositories": {
    "user": true,
    "note": true,
    "subscription": true,
    "device": true
  },
  "timestamp": "2026-03-10T12:00:00.000Z"
}
```

**إذا كانت قاعدة البيانات غير متصلة (503):**
```json
{
  "status": "degraded",
  "database": "disconnected",
  "repositories": {
    "user": false,
    "note": false,
    "subscription": false,
    "device": false
  }
}
```

---

## 8. رموز الأخطاء المشتركة

جميع ردود الأخطاء تتبع هذا الشكل:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "رسالة وصفية",
  "details": ["حقل username مطلوب", "البريد غير صالح"]
}
```

| كود HTTP | `error` | المعنى |
|---------- |---------|--------|
| `400` | `VALIDATION_ERROR` | بيانات الطلب غير صالحة |
| `400` | `INVALID_SUBSCRIPTION` | بيانات اشتراك Push غير مكتملة |
| `401` | `UNAUTHORIZED` | token مفقود أو منتهي أو غير صالح |
| `403` | `FORBIDDEN` | المستخدم لا يملك صلاحية هذا المورد |
| `404` | `NOT_FOUND` | المورد غير موجود |
| `409` | `CONFLICT` | تعارض في البيانات (بريد أو اسم مكرر) |
| `500` | `SERVER_ERROR` | خطأ داخلي غير متوقع |

---

## 9. أنواع البيانات

### User (المستخدم)

```typescript
interface User {
  _id: string
  username: string           // 3-30 حرف, فريد
  email: string              // بريد إلكتروني, فريد
  displayName?: string       // اسم العرض, حتى 50 حرف
  language: 'ar' | 'en' | 'unset'
  createdAt: string          // ISO 8601
  updatedAt: string          // ISO 8601
}
```

### Note (الملاحظة)

```typescript
interface Note {
  _id: string
  title: string              // 1-200 حرف
  content?: string           // HTML — الملاحظات النصية فقط
  audioData?: string         // Base64 — الملاحظات الصوتية فقط (في GET /notes/[id] فقط)
  audioDuration?: number     // بالثواني
  type: 'text' | 'voice'
  user: string               // User._id
  createdAt: string
  updatedAt: string
}
```

### Device (الجهاز)

```typescript
interface Device {
  _id: string
  user: string               // User._id
  deviceId: string           // UUID من localStorage
  name: string
  browser: string
  os: string
  isCurrent?: boolean        // يُضاف فقط في GET /devices مع currentDeviceId
  lastSeenAt: string
  createdAt: string
}
```

---

*للتفاصيل المعمارية: [database-abstraction.md](database-abstraction.md)*
*للدليل التعليمي عن API: [tutorials/lessons/05-api-routes.md](tutorials/lessons/05-api-routes.md)*
