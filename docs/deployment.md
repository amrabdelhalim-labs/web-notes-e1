# دليل النشر (Heroku وDocker) 🚀

> **الغرض:** خطوات نشر **ملاحظاتي** على Heroku وDocker من الصفر حتى الإنتاج
> **البيئة المستهدفة:** Heroku/Docker + MongoDB Atlas + VAPID Push

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
9. [النشر عبر Docker و GHCR](#9-النشر-عبر-docker-و-ghcr)

---

## 1. المتطلبات الأساسية

قبل البدء، تأكد من توفر:

- [ ] حساب Heroku (مجاني أو مدفوع)
- [ ] Heroku CLI مثبّت: `npm install -g heroku`
- [ ] Docker (للإعداد المحلي عبر `docker compose`)
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

---

## 9. النشر عبر Docker و GHCR

### 9.1 الملفات ذات الصلة

| الملف | الدور |
|-------|--------|
| `Dockerfile` | مرحلتان: `builder` (`npm ci` + `npm run build`) ثم `runner` (نسخة **Next standalone**، مستخدم غير جذر `nextjs`، بدون `npm` في الصورة النهائية) |
| `docker-compose.yml` | تطبيق + **MongoDB 7**؛ حجم `mongo_data` لبيانات DB؛ حجم `uploads` على `/app/uploads` عند `STORAGE_TYPE=local` |
| `.dockerignore` | يستثني `node_modules`، `.next`، `docs`، `*.md`، ملفات البيئة الحساسة — يقلل سياق البناء |
| `.env.docker.example` | قالب المتغيرات لبيئة الحاوية (انسخه إلى `.env` في جذر المشروع إذا استخدمت `docker compose` مع `--env-file`) |
| `.github/workflows/docker-publish.yml` | CI: جودة الكود + اختبارات + `npm run build` + بناء صورة + **Trivy** (HIGH/CRITICAL) ثم دفع إلى GHCR |

### 9.2 التشغيل المحلي (التطبيق + MongoDB)

```bash
docker compose up --build
curl -fsS http://localhost:3000/api/health
```

- غيّر الأسرار في `docker-compose.yml` أو مرّر ملف بيئة حسب حاجتك (لا تُودع كلمات المرور في Git).
- `DATABASE_URL` الافتراضي داخل Compose: `mongodb://mongo:27017/mynotes`.

### 9.3 جاهزية MongoDB وفحص صحة التطبيق

- خدمة **`mongo`**: `healthcheck` عبر `mongosh` و`db.adminCommand('ping')` مع `interval` / `timeout` / `retries` / `start_period`.
- خدمة **`app`**: `depends_on` + `condition: service_healthy` على `mongo`.
- **`Dockerfile` `HEALTHCHECK`**: `curl -fsS http://127.0.0.1:${PORT}/api/health` (يُثبَّت `curl` بعد `apk upgrade`).

### 9.4 سير عمل GitHub Actions (`docker-publish.yml`)

1. **التحفّز:** دفع **وسم** يطابق `v*` (مثل `v0.2.3`)، أو تشغيل يدوي **workflow_dispatch** (خيار `publish`: نعم/لا).
2. **البوابات:** `format:check`، `lint`، `typecheck`، `npm test`، **`npm run docker:check`**، **`npm run build`**.
3. **الأمان:** بناء صورة محلية ثم **Trivy** على الصورة مع `trivyignores: '.trivyignore'`.
4. **الدفع:** تسجيل الدخول إلى `ghcr.io` بـ `GITHUB_TOKEN`؛ اسم الصورة **بأحرف صغيرة**: `ghcr.io/<owner>/web-notes-e1` حيث `<owner>` هو مالك المستودع على GitHub.
5. **الوسوم على السجل:** اسم وسم Git (مثل `v0.2.3`)، ووسم **`sha-<commit>`**، ووسم **`latest`** عند التحفّز بحدث `push` (أي عند دفع وسم `v*`).
6. **التزامن (`concurrency`):** `cancel-in-progress: false` لتفادي إلغاء نشر قيد التنفيذ وحالات «manifest not found» على GHCR.
7. **التنظيف:** job لاحق يستخدم `actions/delete-package-versions` لحذف نسخ **غير الموسومة** فقط مع الإبقاء على **20** نسخة كحد أدنى.

### 9.5 سحب وتشغيل الصورة من GHCR

استبدل `OWNER` باسم المستخدم أو المنظمة على GitHub (أحرف صغيرة في عنوان الصورة)، والوسم بـ `latest` أو إصدار `v*` أو `sha-…` الظاهر في صفحة الحزمة على GitHub.

```bash
docker pull ghcr.io/OWNER/web-notes-e1:latest
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="mongodb+srv://USER:PASS@cluster.mongodb.net/mynotes" \
  -e JWT_SECRET="long-random-secret" \
  -e NEXT_PUBLIC_VAPID_PUBLIC_KEY="..." \
  -e VAPID_PRIVATE_KEY="..." \
  -e VAPID_EMAIL="mailto:you@example.com" \
  ghcr.io/OWNER/web-notes-e1:latest
```

- **حزمة خاصة:** نفّذ `docker login ghcr.io` باستخدام اسم مستخدم GitHub و**PAT** بصلاحية `read:packages` (أو `write:packages` للدفع).
- **PowerShell (Windows):** لا تستخدم `\` لاستمرار السطر؛ إمّا أمر `docker run` في **سطر واحد**، أو ضع `` ` `` (backtick) في نهاية كل سطر للاستمرار بدل `\`.
- **المنفذ مشغول:** إن كان `3000` مستخدمًا، استخدم مثلًا `-p 3001:3000` وافتح `http://localhost:3001`.
- **JWT cookie في الإنتاج:** مع `NODE_ENV=production` قد تُضبط كوكي الجلسة بخاصية `Secure`؛ يُفضّل HTTPS في الإنتاج أو تجربة محلية عبر `localhost` حسب سلوك المتصفح.

### 9.6 استكشاف أخطاء السحب من GHCR

| العرض | سبب محتمل |
|--------|------------|
| `manifest … not found` | وسم قديم أو غير مرفوع؛ استخدم `latest` أو وسم إصدار من صفحة **Packages** في GitHub، أو أعد نشر وسم `v*` بعد نجاح الـ workflow. |
| `port is already allocated` | خدمة أخرى (أو `docker compose`) تستخدم المنفذ 3000. |

### 9.7 التحقق المحلي من إعداد Docker (بدون بناء تشغيل كامل)

```bash
npm run docker:check
```

يستدعي `scripts/check-docker-config.mjs` للتحقق من وجود الملفات والعلامات الأساسية في `Dockerfile` و`docker-compose.yml` والـ workflow.
