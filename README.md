# ملاحظاتي — تطبيق ويب تقدمي للملاحظات 📝

> **الإصدار:** `v0.2.3` — تطبيق ويب تقدمي (PWA) كامل، يعمل بدون اتصال، مع مزامنة تلقائية وإشعارات فورية
> **الحالة:** ٥٨١ اختبار ✅ — النشر على Heroku و Docker (GHCR) — مكتمل التطوير

---

## لمحة عامة

**ملاحظاتي** تطبيق ويب تقدمي (PWA) لتخزين وإدارة الملاحظات الشخصية. يدعم نوعين من الملاحظات: نصية مع محرر نصوص غني، وصوتية عبر تسجيل مباشر من المتصفح.

يعمل التطبيق بشكل كامل **بدون اتصال بالإنترنت** — الملاحظات تُحفظ محليًا في IndexedDB وتُزامَن في الخلفية فور عودة الاتصال. يمكن تثبيته على أي جهاز (هاتف، جهاز لوحي، حاسوب) كتطبيق أصلي.

---

## الميزات الرئيسية

| الميزة | التفاصيل |
|--------|---------|
| **نظام مستخدمين كامل** | تسجيل حساب، تسجيل دخول، تعديل البيانات، حذف الحساب |
| **إدارة الملاحظات (CRUD)** | إنشاء، قراءة، تعديل، حذف — نصية وصوتية |
| **محرر نصوص غني** | Tiptap مع تنسيق كامل، RTL، ألوان، تمييز |
| **تسجيل صوتي** | MediaRecorder API — إيقاف/استئناف — حفظ Base64 |
| **PWA — يعمل بدون اتصال** | تثبيت على الجهاز، تخزين IndexedDB، مزامنة خلفية |
| **إشعارات فورية** | Web Push عند تسجيل دخول جديد على أجهزة موثوقة |
| **ثنائية اللغة** | العربية (RTL) والإنجليزية (LTR) — تبديل ديناميكي |
| **وضع فاتح/داكن** | كشف تفضيل النظام + حفظ الاختيار |
| **تصميم متجاوب** | يعمل على جميع أحجام الشاشات |

---

## الحزمة التقنية

| الطبقة | التقنية | الإصدار |
|--------|---------|---------|
| **الإطار** | Next.js (App Router) | 16.x |
| **اللغة** | TypeScript | 5.x |
| **واجهة المستخدم** | Material UI (MUI) | 7.x |
| **CSS-in-JS** | Emotion | 11.x |
| **قاعدة البيانات** | MongoDB + Mongoose | 7.x / 9.x |
| **المصادقة** | JWT + bcryptjs | — |
| **تخزين محلي** | Dexie.js (IndexedDB) | 4.x |
| **إشعارات فورية** | Web Push API + web-push | 3.x |
| **تسجيل صوتي** | MediaRecorder API (أصلي) | — |
| **الترجمة** | next-intl | 4.x |
| **PWA / Service Worker** | @serwist/next | 9.x |
| **محرر النصوص** | Tiptap | 3.x |
| **الاختبارات** | Vitest + Testing Library | 4.x |
| **التنسيق** | Prettier | 3.x |
| **النشر** | Heroku و Docker (GHCR) | — |

---

## التثبيت والتشغيل المحلي

### المتطلبات المسبقة

- Node.js ≥ 20.x
- npm ≥ 10.x
- MongoDB (محلي أو عبر MongoDB Atlas)
- مفاتيح VAPID (لتفعيل الإشعارات — اختياري)

### الاستنساخ والتثبيت

```bash
git clone <رابط-المستودع>
cd web-notes-e1
npm install
```

### إعداد المتغيرات البيئية

```bash
cp .env.example .env.local
```

افتح `.env.local` وأسند القيم:

```env
DATABASE_URL=mongodb://localhost:27017/mynotes
JWT_SECRET=سر_قوي_وطويل_هنا
NODE_ENV=development
PORT=3000

# مفاتيح VAPID (لتوليدها: node -e "const wp=require('web-push'); console.log(JSON.stringify(wp.generateVAPIDKeys()))")
NEXT_PUBLIC_VAPID_PUBLIC_KEY=مفتاحك_العام
VAPID_PRIVATE_KEY=مفتاحك_الخاص
VAPID_EMAIL=mailto:بريدك@مثال.com
```

### تشغيل خادم التطوير

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في متصفحك.

---

## هيكل المجلدات

```text
web-notes-e1/
├── .env.example  // نموذج المتغيرات البيئية
├── next.config.mjs  // إعداد Next.js + @serwist/next
├── README.md
│
├── src/
│   ├── app/
│   │   ├── layout.tsx  // التخطيط الجذري
│   │   ├── providers.tsx  // تغليف Theme + Auth Providers
│   │   ├── config.ts  // ثوابت مركزية
│   │   ├── types.ts  // أنواع TypeScript المشتركة
│   │   │
│   │   ├── [locale]/  // توجيه حسب اللغة (ar | en)
│   │   │   ├── login/  // تسجيل الدخول
│   │   │   ├── register/  // إنشاء حساب
│   │   │   ├── notes/  // قائمة + عرض + إنشاء + تعديل
│   │   │   └── profile/  // الملف الشخصي
│   │   │
│   │   ├── api/              ← Route Handlers (Next.js API)
│   │   │   ├── auth/         ← login, register, me, logout
│   │   │   ├── notes/        ← CRUD للملاحظات
│   │   │   ├── devices/  // إدارة الأجهزة الموثوقة
│   │   │   ├── push/         ← subscribe + send
│   │   │   └── health/  // فحص الصحة
│   │   │
│   │   ├── components/  // مكونات React (layout, notes, profile, common, auth)
│   │   ├── context/          ← ThemeContext + AuthContext + PwaActivationContext
│   │   ├── hooks/            ← useNotes, usePushNotifications, useDevices, usePwaStatus, …
│   │   ├── lib/              ← api.ts, auth.ts, db.ts, mongodb.ts, webpush.ts, …
│   │   ├── models/           ← Mongoose Models (User, Note, Device, Subscription)
│   │   ├── repositories/     ← Repository Pattern (base + user + note + device + sub)
│   │   ├── validators/  // التحقق من المدخلات
│   │   ├── middlewares/      ← auth.middleware.ts
│   │   └── utils/            ← audio.ts, notes.ts, sanitize.ts
│   │
│   ├── i18n/  // إعداد next-intl (routing + request)
│   ├── messages/  // ملفات الترجمة (ar.json + en.json)
│   ├── sw.ts                 ← Service Worker المصدري (@serwist)
│   ├── proxy.ts  // توجيه اللغة (next-intl middleware)
│   └── instrumentation.ts  // خطاف بدء الخادم
│
├── public/
│   ├── manifest.json         ← PWA Manifest
│   └── icons/  // أيقونات التطبيق (72×72 → 512×512)
│
├── scripts/
│   ├── validate-workflow.mjs  // فحص شامل قبل الدفع
│   ├── http-smoke.mjs  // اختبارات HTTP دخانية
│   ├── format.mjs  // تنسيق Prettier
│   ├── generate-icons.mjs  // توليد أيقونات PWA
│   └── convert-icons.mjs  // تحويل SVG → PNG
│
└── docs/
    ├── plans/  // خطط المشروع
    ├── api-endpoints.md  // مرجع API الكامل
    ├── database-abstraction.md
    ├── repository-quick-reference.md
    ├── testing.md
    ├── deployment.md
    ├── pwa-guide.md
    ├── ai/  // توثيقات لأدوات AI (إنجليزي)
    └── tutorials/  // توثيقات تعليمية (عربي) — 13 درسًا
```

---

## الأوامر المتاحة

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل خادم التطوير (Webpack) على المنفذ 3000 |
| `npm run build` | بناء نسخة الإنتاج (Webpack) |
| `npm start` | تشغيل نسخة الإنتاج المبنية |
| `npm test` | تشغيل الاختبارات (Vitest run) |
| `npm run test:watch` | تشغيل الاختبارات في وضع المراقبة |
| `npm run test:coverage` | تقرير تغطية الاختبارات |
| `npm run format` | تنسيق الكود بـ Prettier |
| `npm run format:check` | فحص التنسيق (بدون تغيير) |
| `npm run validate` | فحص شامل: tsc + اختبارات + متغيرات بيئية + ملفات |
| `npm run smoke` | اختبارات HTTP لنقاط API الحية |

---

## الاختبارات

| الإحصائية | القيمة |
|-----------|--------|
| **إجمالي الاختبارات** | **٥٨١ اختبار** |
| **ملفات الاختبار** | **٣٩ ملفًا** |
| **إطار الاختبار** | Vitest + @testing-library/react |
| **بيئة الاختبار** | jsdom |

**تشغيل الاختبارات:**

```bash
npm test                    # تنفيذ كامل
npm run test:watch          # وضع المراقبة للتطوير
npm run test:coverage       # تقرير التغطية
```

تُغطي الاختبارات: المكونات، الخطافات (hooks)، مسارات API، المستودعات، المدققات، الأدوات المساعدة، وتدفقات التكامل.

---

## النشر

التطبيق مُعدٌّ للنشر على **Heroku** عبر النشر التلقائي من الفرع الرئيسي، أو عبر **Docker** (بناء + نشر على GHCR عبر `docker-publish.yml`).

```bash
npm run validate
# التحقق قبل النشر

# اختبار التطوير الكامل
npm run build
```

**المتغيرات البيئية المطلوبة (Heroku / Docker):**

| المتغير | الوصف |
|---------|-------|
| `DATABASE_URL` | رابط اتصال MongoDB Atlas |
| `JWT_SECRET` | مفتاح سري قوي (≥ 32 حرف) |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | مفتاح VAPID العام |
| `VAPID_PRIVATE_KEY` | مفتاح VAPID الخاص |
| `VAPID_EMAIL` | بريد إلكتروني لـ VAPID |

للتفاصيل الكاملة: [docs/deployment.md](docs/deployment.md)

**Docker Compose:** يتضمن `mongo` مع فحص صحة (`mongosh ping`) وانتظار التطبيق حتى تصبح قاعدة البيانات جاهزة (`depends_on` + `service_healthy`)؛ راجع [docs/deployment.md](docs/deployment.md) **القسم 9** لشرح `HEALTHCHECK`، سير عمل **GHCR**، أوامر `docker pull` / `docker run`، وملاحظات PowerShell.

---

## التوثيق

### التوثيقات الانتاجية

| الملف | الوصف |
|-------|-------|
| [docs/api-endpoints.md](docs/api-endpoints.md) | جميع مسارات API مع أمثلة الطلبات والاستجابات |
| [docs/database-abstraction.md](docs/database-abstraction.md) | نماذج Mongoose ونمط المستودعات |
| [docs/repository-quick-reference.md](docs/repository-quick-reference.md) | مرجع سريع لعمليات المستودعات |
| [docs/pwa-guide.md](docs/pwa-guide.md) | دليل PWA: Service Worker، IndexedDB، المزامنة، الإشعارات |
| [docs/testing.md](docs/testing.md) | استراتيجية الاختبار والأوامر والتغطية |
| [docs/deployment.md](docs/deployment.md) | دليل النشر على Heroku وDocker والمتغيرات البيئية |

### توثيقات AI

| الملف | الوصف |
|-------|-------|
| [docs/ai/README.md](docs/ai/README.md) | بطاقة هوية المشروع والقواعد الحاسمة |
| [docs/ai/architecture.md](docs/ai/architecture.md) | مخطط الطبقات وتدفق البيانات |
| [docs/ai/feature-guide.md](docs/ai/feature-guide.md) | دليل إضافة ميزة جديدة (8 خطوات) |

### التوثيقات التعليمية

| الملف | الوصف |
|-------|-------|
| [docs/tutorials/README.md](docs/tutorials/README.md) | فهرس الدروس ومسارات التعلم |
| [docs/tutorials/concepts-guide.md](docs/tutorials/concepts-guide.md) | شرح كل مفهوم تقني من الصفر |
| [docs/tutorials/quick-reference.md](docs/tutorials/quick-reference.md) | مرجع سريع وجداول أوامر وروابط |
| [docs/tutorials/lessons/](docs/tutorials/lessons/) | ١٣ درسًا تعليميًا تفصيليًا بالعربية |

---

## سجل التغييرات

### v0.2.1 — رسائل خطأ الخادم حسب لغة المستخدم (الإصدار الحالي)

- **إصلاح:** جميع رسائل خطأ الخادم كانت نصوصًا عربية مُرمَّزة — مستخدمو الإنجليزية يتلقون أخطاء عربية
  - أُضيف namespace جديد `ServerErrors` في `ar.json` و`en.json` (40 مفتاحاً شاملاً للأخطاء والتحقق)
  - أُعيدت كتابة `apiErrors.ts`: `getRequestLocale()` تقرأ `x-locale` header؛ `serverMsg(locale, key)` تحل الرسالة بالترجمة الصحيحة
  - جميع دوال المساعدة (`validationError`، `unauthorizedError`، …) تقبل `locale` كمعامل
- **إصلاح:** `api.ts` لم يكن يُرسل اللغة إلى الخادم — أُضيف `x-locale` header مشتق من مسار URL
- **إصلاح:** دوال التحقق (`validators/index.ts`) كانت تُعيد نصوصًا عربية ثابتة — الآن تقبل `locale` وتستخدم `serverMsg()`
- **إصلاح:** `auth.middleware.ts` كانت رسائل tokenMissing/tokenInvalid عربية ثابتة — الآن locale-aware
- **إصلاح:** جميع route handlers (login، register، me، notes، users، devices، push) تستخرج اللغة بـ `getRequestLocale(request)` قبل `try{}` وتُمررها لجميع دوال الخطأ
- **إصلاح:** خطأ مطبعيان في `ar.json`: «جارِس» ← «جارٍ»، «للتثيت» ← «للتثبيت»
- **إصلاح:** رسائل الخطأ الاحتياطية في `api.ts` و`AuthContext.tsx` استُبدلت بنص إنجليزي محايد
- **إصلاح:** لغة المستخدم عند التسجيل تُحفظ الآن بشكل صحيح (`'ar'` | `'en'` | `'unset'`)
- **توحيد:** مسارات push تستخدم `validationError()` بدلاً من بناء الاستجابة يدويًا
- **اختبارات:** إصلاح اختبار `apiClient.test.ts` المعطوب (رسالة fallback عربية ← إنجليزية)؛ إضافة اختبار `x-locale` header؛ إصلاح mock في `devicesRoute.test.ts`؛ إضافة 7 اختبارات locale EN في `validators.test.ts` — **5٨١ اختبار** (+8)
- **توثيق:** تحديث `ai/README.md`، `ai/architecture.md`، `ai/feature-guide.md`، `CONTRIBUTING.md`، ودرس `04-authentication.md`

### v0.2.0 — التوثيق التعليمي الكامل

- ١٣ درسًا تعليميًا بالعربية (دروس 01–13) مع مفاهيم Next.js، MongoDB، PWA، وإدارة الحالة
- ملفات مرجعية وشاملة: concepts-guide، quick-reference، tutorials/README

### v0.1.0 — الإصدار الأولي

- تطبيق PWA كامل: CRUD الملاحظات، تسجيل مستخدمين، وضع بلا إنترنت، إشعارات Push
- ٥٧٣ اختبار — نشر على Heroku

---

## المساهمة

اقرأ [CONTRIBUTING.md](CONTRIBUTING.md) للاطلاع على معايير المساهمة، أسلوب الإيداعات (Conventional Commits)، متطلبات الجودة، ودليل المعمارية.

---

## الترخيص

[MIT](LICENSE)
