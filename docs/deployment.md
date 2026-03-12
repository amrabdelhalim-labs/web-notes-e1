# دليل النشر على Heroku 🚀

> **الغرض:** خطوات نشر **ملاحظاتي** على Heroku من الصفر حتى الإنتاج
> **البيئة المستهدفة:** Heroku + MongoDB Atlas + VAPID Push

---

## جدول المحتويات

1. [المتطلبات الأساسية](#1-المتطلبات-الأساسية)
2. [متغيرات البيئة](#2-متغيرات-البيئة)
3. [إعداد Heroku](#3-إعداد-heroku)
4. [النشر الأول](#4-النشر-الأول)
5. [التحقق من النشر](#5-التحقق-من-النشر)
6. [التحديثات اللاحقة (CD)](#6-التحديثات-اللاحقة-cd)
7. [المراقبة وتشخيص المشاكل](#7-المراقبة-وتشخيص-المشاكل)
8. [ملاحظات أمان](#8-ملاحظات-أمان)

---

## 1. المتطلبات الأساسية

قبل البدء، تأكد من توفر:

- [ ] حساب Heroku (مجاني أو مدفوع)
- [ ] Heroku CLI مثبّت: `npm install -g heroku`
- [ ] MongoDB Atlas cluster جاهز (مجاني كافٍ للبداية)
- [ ] مفاتيح VAPID جاهزة (لإشعارات Push)
- [ ] Git مثبّت وتهيئته

### توليد مفاتيح VAPID

```bash
npx web-push generate-vapid-keys
# الناتج:
# Public Key:  BJ7G...Qk=    ← NEXT_PUBLIC_VAPID_PUBLIC_KEY
# Private Key: wP7G...Zm=    ← VAPID_PRIVATE_KEY
```

---

## 2. متغيرات البيئة

### المتغيرات المطلوبة

| المتغير | مثال | الوصف |
|---------|------|-------|
| `DATABASE_URL` | `mongodb+srv://user:pass@cluster.mongodb.net/mynotes` | رابط الاتصال بـ MongoDB Atlas |
| `JWT_SECRET` | `مفتاح-عشوائي-طويل-جداً` | مفتاح توقيع JWT (≥ 32 حرف) |
| `NODE_ENV` | `production` | بيئة التشغيل |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BJ7G...Qk=` | المفتاح العام لـ Web Push |
| `VAPID_PRIVATE_KEY` | `wP7G...Zm=` | المفتاح الخاص لـ Web Push (سري!) |
| `VAPID_EMAIL` | `mailto:admin@example.com` | البريد المسؤول عن Push |

### المتغيرات الاختيارية

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `PORT` | `3000` | المنفذ (Heroku يعيّنه تلقائياً) |
| `NEXT_PUBLIC_SW_DISABLED` | `false` | تعطيل Service Worker كلياً |

### تحديد قيمة JWT_SECRET

```bash
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
# توليد مفتاح عشوائي آمن (PowerShell)

# أو عبر Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **تحذير:** لا تستخدم مفاتيح ضعيفة مثل `mysecret` أو `123456` في الإنتاج.

---

## 3. إعداد Heroku

### تسجيل الدخول وإنشاء التطبيق

```bash
heroku login
# تسجيل الدخول

# إنشاء التطبيق (اختر اسماً فريداً)
heroku create my-notes-app

# أو بدون اسم (Heroku يختار)
heroku create
```

### تعيين متغيرات البيئة

```bash
heroku config:set DATABASE_URL="mongodb+srv://..." --app my-notes-app
heroku config:set JWT_SECRET="مفتاح-طويل-جداً"
heroku config:set NODE_ENV="production"
heroku config:set NEXT_PUBLIC_VAPID_PUBLIC_KEY="BJ7G..."
heroku config:set VAPID_PRIVATE_KEY="wP7G..."
heroku config:set VAPID_EMAIL="mailto:admin@example.com"
```

### التحقق من المتغيرات

```bash
heroku config --app my-notes-app
# يعرض جميع المتغيرات المعيّنة (VAPID_PRIVATE_KEY يظهر كـ ***)
```

### إعداد Heroku Buildpack

```bash
# Heroku يكتشف Next.js تلقائياً عبر package.json
# لا إعداد يدوي مطلوب إذا وُجد package.json في الجذر
```

### Procfile

يجب وجود `Procfile` في جذر المشروع:

```text
web: npm start
```

---

## 4. النشر الأول

### قبل النشر — التحقق من الجاهزية

```bash
npm run validate
# التحقق من عدم وجود أخطاء

# بناء محلي للتأكد
npm run build
```

**سكريبت `validate` يتحقق من:**
- عدم وجود أخطاء TypeScript
- عدم وجود أخطاء ESLint
- صحة ملفات التهيئة

### نشر عبر Git

```bash
heroku git:remote -a my-notes-app
# إضافة remote الـ Heroku (إذا لم يُضَف تلقائياً)

# النشر
git push heroku main

# أو من فرع مختلف
git push heroku my-branch:main
```

### ما يحدث أثناء النشر

```text
Counting objects...
Compressing objects...
Writing objects...

remote: -----> Node.js app detected
remote: -----> Installing dependencies
remote: -----> Building application
remote:        npm run build → next build
remote: -----> Launching
remote:        Released v1
remote:        https://my-notes-app.herokuapp.com/ deployed!
```

---

## 5. التحقق من النشر

### فحص الصحة الأساسي

```bash
heroku open --app my-notes-app
# عبر الـ CLI

# أو مباشرةً
curl https://my-notes-app.herokuapp.com/api/health
```

**ناتج `/api/health` الصحيح:**
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
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### مشاهدة السجلات

```bash
heroku logs --tail --app my-notes-app
# السجلات الحية

# آخر 200 سطر
heroku logs -n 200 --app my-notes-app

# سجلات محددة
heroku logs --source app --app my-notes-app
```

### التحقق من المتغيرات داخل dyno

```bash
heroku run env --app my-notes-app | grep DATABASE
```

---

## 6. التحديثات اللاحقة (CD)

### نشر تحديث

```bash
git add .
git commit -m "feat: إضافة ميزة جديدة"
git push heroku main
```

### التراجع عن نشر

```bash
heroku releases --app my-notes-app
# عرض الإصدارات السابقة

# التراجع لإصدار محدد
heroku rollback v5 --app my-notes-app
```

### إعادة التشغيل

```bash
heroku restart --app my-notes-app
```

---

## 7. المراقبة وتشخيص المشاكل

### مشكلة: التطبيق لا يبدأ

```bash
heroku logs --tail
# تحقق من السجلات

# تحقق من الـ Procfile
cat Procfile
# يجب أن يكون: web: npm start

# تحقق من package.json scripts
# يجب وجود: "start": "next start"
```

### مشكلة: خطأ قاعدة البيانات

```bash
heroku config:get DATABASE_URL
# تحقق من DATABASE_URL

# تحقق من إمكانية الوصول من Heroku إلى Atlas
# في Atlas: Network Access  // أضف 0.0.0.0/0 (كل العناوين)
```

### مشكلة: إشعارات Push لا تصل

```bash
heroku config | grep VAPID
# تحقق من VAPID keys

# تأكد من أن NEXT_PUBLIC_VAPID_PUBLIC_KEY هو المفتاح العام, وليس الخاص
```

### مشكلة: بناء فاشل (Build Error)

```bash
npm run build
# البناء محلياً للكشف عن الأخطاء

# إذا نجح محلياً, تحقق من إصدار Node
heroku stack --app my-notes-app
# يجب أن يتطابق مع engines في package.json
```

### عرض معلومات dyno

```bash
heroku ps --app my-notes-app
# web.1: up 2025/01/01 12:00:00 +0000 (~ 1h ago)
```

---

## 8. ملاحظات أمان

### متغيرات البيئة

- ❌ لا تضع أسراراً في `.env` وترفعها لـ Git
- ✅ استخدم `heroku config:set` دائماً للأسرار
- ✅ أضف `.env.local` و `.env` إلى `.gitignore`

### MongoDB Atlas

- ✅ استخدم مستخدم قاعدة بيانات منفصل مع صلاحيات محدودة (readWrite فقط)
- ✅ لا تستخدم مستخدم admin في الإنتاج
- ✅ فعّل التشفير على مستوى الـ Cluster

### JWT Secret

- ✅ ≥ 32 حرف عشوائي
- ✅ مختلف بين بيئة التطوير والإنتاج
- ❌ لا تعيد استخدام مفاتيح أو تشاركها

### HTTPS

Heroku يوفر HTTPS تلقائياً على النطاقات `*.herokuapp.com`. عند استخدام نطاق مخصص:

```bash
heroku certs:auto:enable --app my-notes-app
# تفعيل SSL المُدار تلقائياً
```

### VAPID Private Key

- ❌ لا تُرسله أبداً للعميل (لا يبدأ بـ `NEXT_PUBLIC_`)
- ✅ يبقى في متغيرات بيئة الخادم فقط

---

## الملخص — قائمة التحقق قبل كل نشر

```bash
npm run validate
# 1. تحقق من صحة الكود

# 2. شغّل الاختبارات
npm run test

# 3. بناء محلي
npm run build

# 4. ادفع للـ Heroku
git push heroku main

# 5. تحقق من الصحة
curl https://my-notes-app.herokuapp.com/api/health

# 6. راقب السجلات
heroku logs --tail --app my-notes-app
```

---

*لإعداد متغيرات البيئة المحلية: انسخ [.env.example](../.env.example) إلى `.env.local` وعدّل القيم*  
*لقائمة endpoints لاختبار النشر: [api-endpoints.md](api-endpoints.md)*
