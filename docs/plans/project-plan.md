# خطة بناء مشروع ملاحظاتي (My Notes) 📝

> **المستودع:** `web-notes-e1`
> **نوع المشروع:** تطبيق ويب تقدمي (PWA) — Full-Stack SSR
> **الحالة:** المراحل ٠-١١ مكتملة — جودة الكود، تنسيق Prettier، إصلاح XSS، CONTRIBUTING.md، حذف أيقونات Next.js الافتراضية — ٥٧٣ اختبار ✅

---

## جدول المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [التقنيات والأدوات](#2-التقنيات-والأدوات)
3. [البنية المعمارية](#3-البنية-المعمارية)
4. [المراحل التنفيذية](#4-المراحل-التنفيذية)
5. [تفاصيل صفحات الموقع](#5-تفاصيل-صفحات-الموقع)
6. [نماذج البيانات](#6-نماذج-البيانات)
7. [واجهة برمجة التطبيقات](#7-واجهة-برمجة-التطبيقات)
8. [معايير الجودة](#8-معايير-الجودة)
9. [تحديثات حديثة (مارس ٢٠٢٦)](#9-تحديثات-حديثة-مارس-٢٠٢٦)

---

## 1. نظرة عامة على المشروع

### الفكرة

**ملاحظاتي** هو تطبيق ويب تقدمي (PWA) لتخزين وإدارة الملاحظات الشخصية. يدعم التطبيق نوعين من الملاحظات:

| النوع | الوصف |
|-------|-------|
| **ملاحظات نصية** | ملاحظات نصية عادية مع عنوان ومحتوى |
| **ملاحظات صوتية** | تسجيلات صوتية مع عنوان وملف صوتي |

### الميزات الرئيسية

1. **نظام مستخدمين كامل** — تسجيل حساب، تسجيل دخول، تعديل البيانات، حذف الحساب
2. **إدارة الملاحظات** — إنشاء، قراءة، تعديل، حذف (CRUD) للملاحظات النصية والصوتية
3. **تطبيق ويب تقدمي (PWA)** — قابل للتثبيت، يعمل بدون اتصال (Offline-first)، مزامنة تلقائية
4. **إشعارات فورية (Push Notifications)** — إشعار عند تسجيل الدخول من جهاز جديد على الأجهزة المسجلة
5. **الوضع الفاتح والداكن** — دعم كامل مع حفظ التفضيل وكشف تفضيل النظام
6. **دعم ثنائي اللغة** — العربية (RTL) والإنجليزية (LTR) مع تبديل ديناميكي
7. **دعم العمل بدون اتصال** — تخزين محلي (IndexedDB) مع مزامنة خلفية (Background Sync)
8. **تصميم متجاوب** — يعمل على جميع أحجام الشاشات (هاتف، جهاز لوحي، حاسوب)

---

## 2. التقنيات والأدوات

### الحزمة التقنية الأساسية

| الطبقة | التقنية | الإصدار (المتوقع) | السبب |
|--------|---------|-------------------|-------|
| **الإطار** | Next.js (App Router) | 15.x | SSR/SSG، API Routes مدمجة، أداء ممتاز، SEO |
| **اللغة** | TypeScript | 5.x | أمان الأنواع، توثيق ذاتي، تقليل الأخطاء |
| **واجهة المستخدم** | Material UI (MUI) | 7.x | مكتبة مكونات ناضجة، دعم RTL، بنية سمات قوية |
| **CSS-in-JS** | Emotion | 11.x | مطلوب من MUI، دعم RTL عبر stylis-plugin |
| **قاعدة البيانات** | MongoDB | 7.x | مرن، مناسب للملاحظات، يدعم التضمين والمراجع |
| **ORM** | Mongoose | 8.x | نمذجة البيانات، التحقق، الاستعلامات المتقدمة |
| **المصادقة** | JWT + bcrypt | — | مصادقة بدون حالة (Stateless)، تشفير آمن |
| **التخزين المحلي** | Dexie.js | 4.x | واجهة سهلة لـ IndexedDB، دعم ممتاز للأوفلاين |
| **الإشعارات** | Web Push API + web-push | 3.x | إشعارات فورية عبر Service Worker |
| **تسجيل الصوت** | MediaRecorder API | — | واجهة أصلية للمتصفح (بدون مكتبة خارجية) |
| **الترجمة** | next-intl | 4.x | ترجمة متكاملة مع Next.js App Router |
| **PWA** | next-pwa أو @serwist/next | — | تكامل Service Worker مع Next.js |
| **الاختبارات** | Vitest + Testing Library | 4.x | سريع، متوافق مع Next.js، دعم TypeScript أصلي |
| **التنسيق** | Prettier | 3.x | تنسيق تلقائي موحد للكود |

### أدوات التطوير

| الأداة | الغرض |
|--------|-------|
| ESLint | تحليل الكود الثابت |
| Prettier | تنسيق الكود (2 مسافات، LF، فاصلة منقوطة) |
| Vitest | تشغيل الاختبارات |
| @testing-library/react | اختبار المكونات |
| Heroku | نشر تلقائي من الفرع الرئيسي |

---

## 3. البنية المعمارية

### هيكل المجلدات المتوقع

```text
web-notes-e1/
├── .github/
│   └── workflows/
│       ├── build-and-deploy.yml
│       └── README.md
├── .gitattributes              ← LF enforcement لجميع ملفات النص
├── .gitignore
├── .env.example
├── .prettierrc.json  // تكوين Prettier (singleQuote, LF, tabWidth:2)
├── .prettierignore
├── CONTRIBUTING.md  // معايير المساهمة والـ commits والمعمارية
├── LICENSE
├── next.config.js              ← CJS (لا .mjs) — متوافق مع Heroku
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.mjs
├── README.md
│
├── src/  // مصدر التطبيق (بنية src/ — المرحلة ٧)
│   ├── app/                    ← Next.js App Router
│   │   ├── layout.tsx  // التخطيط الجذري (html lang, dir, Providers)
│   │   ├── page.tsx  // الصفحة الرئيسية (redirect → /[locale])
│   │   ├── globals.css
│   │   ├── providers.tsx           ← ThemeProviderWrapper > AuthProvider > children
│   │   ├── config.ts  // الثوابت والإعدادات المركزية
│   │   ├── types.ts  // جميع واجهات TypeScript
│   │   │
│   │   ├── [locale]/  // التوجيه حسب اللغة (ar | en)
│   │   │   ├── layout.tsx  // تخطيط اللغة (lang + dir + NextIntlClientProvider)
│   │   │   ├── login/
│   │   │   │   └── page.tsx  // صفحة تسجيل الدخول
│   │   │   ├── register/
│   │   │   │   └── page.tsx  // صفحة إنشاء حساب
│   │   │   ├── notes/
│   │   │   │   ├── page.tsx  // صفحة الملاحظات (قائمة + بحث + تصفية + حذف)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  // صفحة إنشاء ملاحظة جديدة
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx  // صفحة عرض ملاحظة (قراءة فقط)
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  // صفحة تعديل ملاحظة
│   │   │   └── profile/
│   │   │       └── page.tsx  // صفحة الملف الشخصي
│   │   │
│   │   ├── api/                    ← Next.js Route Handlers
│   │   │   ├── auth/
│   │   │   │   ├── register/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   └── me/
│   │   │   │       └── route.ts
│   │   │   ├── users/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── notes/
│   │   │   │   ├── route.ts        ← GET (قائمة) + POST (إنشاء)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    ← GET + PUT + DELETE
│   │   │   ├── push/
│   │   │   │   ├── subscribe/
│   │   │   │   │   └── route.ts
│   │   │   │   └── send/
│   │   │   │       └── route.ts
│   │   │   └── health/
│   │   │       └── route.ts
│   │   │
│   │   ├── components/  // مكونات واجهة المستخدم
│   │   │   ├── layout/
│   │   │   │   ├── AppBar.tsx  // شريط التطبيق (عنوان + سمة + لغة + قائمة مستخدم)
│   │   │   │   ├── SideBar.tsx  // قائمة جانبية (responsive drawer)
│   │   │   │   ├── MainLayout.tsx  // تخطيط رئيسي (AppBar + SideBar + محتوى)
│   │   │   │   └── EmotionCacheProvider.tsx ← CacheProvider مع دعم RTL/LTR ديناميكي
│   │   │   ├── auth/
│   │   │   │   └── PrivateRoute.tsx  // حماية الصفحات (redirect to /[locale]/login)
│   │   │   ├── notes/
│   │   │   │   ├── NoteCard.tsx  // بطاقة ملاحظة (عنوان + نوع + تاريخ + معاينة)
│   │   │   │   ├── NoteList.tsx  // قائمة الملاحظات (Grid + بحث + تصفية + ترقيم)
│   │   │   │   ├── NoteEditorForm.tsx  // نموذج مشترك للإنشاء والتعديل (صفحة كاملة)
│   │   │   │   ├── RichTextEditor.tsx  // محرر نصوص متقدم (Tiptap + RTL كامل)
│   │   │   │   ├── VoiceRecorder.tsx  // مسجل صوتي (MediaRecorder + إيقاف/استئناف)
│   │   │   │   └── DeleteConfirmDialog.tsx  // حوار تأكيد الحذف
│   │   │   ├── profile/
│   │   │   │   ├── ProfileEditor.tsx
│   │   │   │   └── DeleteAccountDialog.tsx
│   │   │   └── common/
│   │   │       ├── LanguageToggle.tsx  // زر تبديل اللغة (المرحلة ٧)
│   │   │       ├── LocaleSwitchPromptDialog.tsx  // حوار اقتراح تبديل اللغة بعد تسجيل الدخول
│   │   │       ├── ThemeToggle.tsx  // زر تبديل السمة (مستخرج من AppBar)
│   │   │       ├── OfflineBanner.tsx  // شريط تنبيه حالة الاتصال (في تدفق الصفحة)
│   │   │       └── ConnectionIndicator.tsx  // مؤشر حالة الاتصال والمزامنة (AppBar)
│   │   │
│   │   ├── context/
│   │   │   ├── ThemeContext.tsx     ← MUI Theme + RTL/LTR + light/dark
│   │   │   └── AuthContext.tsx      ← AuthProvider + JWT state + login/register/logout
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts  // خطاف المصادقة
│   │   │   ├── useThemeMode.ts  // خطاف تبديل السمة
│   │   │   ├── useNotes.ts  // خطاف إدارة الملاحظات (CRUD + بحث + تصفية + offline)
│   │   │   ├── useOfflineStatus.ts  // خطاف حالة الاتصال (online/offline)
│   │   │   ├── useSyncStatus.ts  // خطاف حالة المزامنة (Dexie pending ops)
│   │   │   └── usePushNotifications.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts  // طبقة HTTP Client (fetchApi + typed helpers)
│   │   │   ├── apiErrors.ts  // معالجة أخطاء API
│   │   │   ├── mongodb.ts  // اتصال MongoDB (singleton)
│   │   │   ├── auth.ts  // دوال JWT + bcrypt
│   │   │   ├── navigation.ts  // غلاف createNavigation من next-intl (المرحلة ٧)
│   │   │   ├── webpush.ts  // إعداد web-push
│   │   │   ├── db.ts               ← IndexedDB عبر Dexie (التخزين المحلي offline)
│   │   │   └── ui-constants.ts  // ثوابت التخطيط المركزية (DRAWER_WIDTH, Z_INDEX, TRANSITIONS, SHADOWS)
│   │   │
│   │   ├── models/  // نماذج Mongoose
│   │   │   ├── User.ts
│   │   │   ├── Note.ts             ← + pre('save') consistency guard
│   │   │   ├── Device.ts  // إدارة الأجهزة الموثوقة
│   │   │   └── Subscription.ts
│   │   │
│   │   ├── repositories/  // طبقة الوصول للبيانات
│   │   │   ├── repository.interface.ts
│   │   │   ├── base.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── note.repository.ts
│   │   │   ├── subscription.repository.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── validators/
│   │   │   └── index.ts
│   │   │
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── audio.ts  // مساعدات تحويل الصوت (blobToBase64, createAudioUrl, formatDuration)
│   │   │   ├── notes.ts  // مساعدات مشتركة (stripHtml, formatDateShort, formatDateLong)
│   │   │   └── sanitize.ts  // تعقيم HTML (XSS protection) قبل dangerouslySetInnerHTML
│   │   │
│   │   └── tests/
│   │       ├── setup.ts
│   │       ├── utils.tsx
│   │       └── *.test.{ts,tsx}    ← 37 ملف اختبار — 476 اختبار ✅
│   │
│   ├── i18n/  // إعداد next-intl (المرحلة ٧)
│   │   ├── request.ts              ← getRequestConfig (تحميل ملفات الترجمة حسب اللغة)
│   │   └── routing.ts  // تعريف المسارات (locales: ['ar','en'], defaultLocale: 'ar')
│   │
│   ├── messages/  // ملفات الترجمة (المرحلة ٧)
│   │   ├── ar.json
│   │   └── en.json
│   │
│   ├── sw.ts                      ← Service Worker المصدري (@serwist — يُجمّع إلى public/sw.js)
│   ├── proxy.ts                   ← proxy التوجيه حسب اللغة (next-intl) — تمت إعادة التسمية من middleware.ts (Next.js 16)
│   └── instrumentation.ts  // خطاف بدء الخادم (port + MongoDB status)
│
├── public/
│   ├── manifest.json
│   ├── sw.js                   ← Service Worker (مولَّد بـ @serwist/next)
│   └── icons/  // أيقونات التطبيق فقط (لا أيقونات Next.js الافتراضية)
│       ├── badge-96x96.png
│       ├── icon.png
│       ├── icon.svg
│       ├── icon-72x72.png (+.svg)
│       ├── icon-96x96.png (+.svg)
│       ├── icon-128x128.png (+.svg)
│       ├── icon-144x144.png (+.svg)
│       ├── icon-152x152.png (+.svg)
│       ├── icon-192x192.png (+.svg)
│       ├── icon-384x384.png (+.svg)
│       └── icon-512x512.png (+.svg)
│
├── scripts/
│   ├── convert-icons.mjs  // تحويل أيقونات SVG → PNG
│   ├── format.mjs  // تنسيق Prettier عبر المنصات (--check للـ CI)
│   ├── generate-icons.mjs  // توليد أيقونات PWA بجميع الأحجام
│   ├── http-smoke.mjs  // اختبارات HTTP محلية (smoke tests)
│   └── validate-workflow.mjs  // فحص شامل قبل الدفع (tsc + tests + env + files)
│
└── docs/
    ├── project-plan.md  // هذا الملف
    ├── api-endpoints.md
    ├── database-abstraction.md
    ├── repository-quick-reference.md
    ├── testing.md
    ├── deployment.md
    ├── pwa-guide.md
    ├── ai/
    │   ├── README.md
    │   ├── architecture.md
    │   └── feature-guide.md
    └── tutorials/
        ├── README.md
        ├── concepts-guide.md
        ├── quick-reference.md
        └── lessons/  // مجلد واحد (SSR — لا فصل server/client)
            ├── 01-project-setup.md
            ├── 02-database-models.md
            ├── 03-repository-pattern.md
            ├── 04-authentication.md
            ├── 05-api-routes.md
            ├── 06-theme-system.md
            ├── 07-internationalization.md
            ├── 08-notes-crud.md
            ├── 09-voice-recording.md
            ├── 10-pwa-service-worker.md
            ├── 11-push-notifications.md
            ├── 12-offline-sync.md
            └── 13-testing.md
```

### مخطط الطبقات المعمارية

```text
┌─────────────────────────────────────────────────────┐
│                    العميل (Client)                   │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ الصفحات   │  │ المكونات │  │ السياقات والخطافات│  │
│  │ [locale]/ │→ │components│→ │context/ + hooks/  │  │
│  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│        │              │                 │             │
│        └──────────────┴────────┬────────┘             │
│                                ↓                      │
│                     ┌──────────────────┐              │
│                     │  lib/api.ts      │              │
│                     │  (HTTP Client)   │              │
│                     └────────┬─────────┘              │
├──────────────────────────────┼────────────────────────┤
│                    الخادم (Server)                    │
│                              ↓                        │
│                     ┌──────────────────┐              │
│                     │  app/api/        │              │
│                     │  (Route Handlers)│              │
│                     └────────┬─────────┘              │
│                              ↓                        │
│              ┌───────────────┼───────────────┐        │
│              ↓               ↓               ↓        │
│     ┌──────────────┐ ┌────────────┐ ┌──────────────┐ │
│     │ middlewares/  │ │ validators │ │   lib/auth   │ │
│     │ auth.middle  │ │            │ │   lib/push   │ │
│     └──────┬───────┘ └─────┬──────┘ └──────┬───────┘ │
│            └───────────────┼───────────────┘          │
│                            ↓                          │
│                   ┌──────────────────┐                │
│                   │  repositories/   │                │
│                   │  (Data Access)   │                │
│                   └────────┬─────────┘                │
│                            ↓                          │
│                   ┌──────────────────┐                │
│                   │  models/         │                │
│                   │  (Mongoose)      │                │
│                   └────────┬─────────┘                │
│                            ↓                          │
│                   ┌──────────────────┐                │
│                   │    MongoDB       │                │
│                   └──────────────────┘                │
├─────────────────────────────────────────────────────  │
│                    PWA Layer                          │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │Service Worker│  │ IndexedDB   │  │ Web Push   │  │
│  │  (Workbox)   │  │  (Dexie)    │  │   API      │  │
│  └──────────────┘  └─────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────  ┘
```

---

## 4. المراحل التنفيذية

### نظرة عامة على المراحل

```text
المرحلة ٠: تهيئة المشروع والبنية الأساسية
    ↓
المرحلة ١: طبقة البيانات (Models + Repositories + MongoDB)
    ↓
المرحلة ٢: المصادقة (Auth API + JWT + bcrypt)
    ↓
المرحلة ٣: واجهة برمجة الملاحظات (Notes CRUD API)
    ↓
المرحلة ٤: واجهة المستخدم الأساسية (Layout + Theme + Auth Pages)
    ↓
المرحلة ٥: صفحات الملاحظات (Notes UI + Voice Recording)
    ↓
المرحلة ٦: الملف الشخصي وإدارة الحساب
    ↓
المرحلة ٧: دعم اللغتين (i18n — العربية والإنجليزية)
    ↓
المرحلة ٨: تطبيق الويب التقدمي (PWA + Offline + Sync)
    ↓
المرحلة ٩: الإشعارات الفورية (Push Notifications)
    ↓
المرحلة ١٠: الاختبارات الشاملة
    ↓
المرحلة ١١: جودة الكود والتنسيق
    ↓
المرحلة ١٢: النشر (تلقائي عبر Heroku)
    ↓
المرحلة ١٣: التوثيق الشامل
```

---

### المرحلة ٠: تهيئة المشروع والبنية الأساسية

**الهدف:** إعداد مشروع Next.js مع TypeScript و MUI وجميع التبعيات الأساسية

#### المهام:

- [x] **٠.١** تهيئة مشروع Next.js باستخدام `create-next-app` مع TypeScript و App Router
- [x] **٠.٢** تثبيت التبعيات الأساسية:
  - MUI (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@emotion/cache`)
  - RTL (`stylis-plugin-rtl`, `@mui/stylis-plugin-rtl`)
  - MongoDB (`mongoose`)
  - Auth (`bcryptjs`, `jsonwebtoken`)
  - PWA (`@serwist/next` أو `next-pwa`)
  - i18n (`next-intl`)
  - IndexedDB (`dexie`)
  - Push (`web-push`)
  - Dev (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `prettier`)
- [x] **٠.٣** إعداد `tsconfig.json` مع مسارات الاختصار (`@/*`)
- [x] **٠.٤** إعداد `next.config.js` (ملف JS وليس TS — توافق Heroku)
- [x] **٠.٥** إنشاء ملف `.env.example` مع جميع المتغيرات البيئية المطلوبة
- [x] **٠.٦** إنشاء ملف `.gitignore` شامل
- [x] **٠.٧** إنشاء ملف `app/config.ts` مع الثوابت المركزية
- [x] **٠.٨** إنشاء ملف `app/types.ts` مع الأنواع الأساسية
- [x] **٠.٩** إنشاء `app/globals.css` مع الأنماط الأساسية
- [x] **٠.١٠** إنشاء `app/layout.tsx` مع إعدادات HTML الأساسية
- [x] **٠.١١** إنشاء `app/providers.tsx` (هيكل فارغ مبدئياً)
- [x] **٠.١٢** التحقق من تشغيل المشروع بنجاح (`npm run dev`)

**الحالة:** ✅ منفذة

**الإيداع:** `feat: initialize Next.js project with TypeScript and core dependencies`

---

### المرحلة ١: طبقة البيانات (Models + Repositories)

**الهدف:** بناء نماذج قاعدة البيانات ونمط المستودعات للوصول للبيانات

#### المهام:

- [x] **١.١** إنشاء `app/lib/mongodb.ts` — اتصال MongoDB (singleton مع connection pooling)
- [x] **١.٢** إنشاء نموذج المستخدم `app/models/User.ts`:
  - الحقول: `email`, `username`, `password` (مشفر), `displayName`, `language`, `createdAt`, `updatedAt`
  - المؤشرات: `email` (فريد)، `username` (فريد)
- [x] **١.٣** إنشاء نموذج الملاحظة `app/models/Note.ts`:
  - الحقول: `title`, `content` (نصي)، `audioData` (صوتي)، `type` (text/voice)، `user` (مرجع)، `createdAt`, `updatedAt`
  - المؤشرات: `user`، `type`، `createdAt`
- [x] **١.٤** إنشاء نموذج الاشتراك `app/models/Subscription.ts`:
  - الحقول: `user` (مرجع)، `endpoint`, `keys` (p256dh, auth)، `deviceInfo`, `createdAt`
  - المؤشرات: `user`، `endpoint` (فريد)
- [x] **١.٥** إنشاء واجهة المستودع `app/repositories/repository.interface.ts`
- [x] **١.٦** إنشاء المستودع الأساسي `app/repositories/base.repository.ts`
  - تنفيذ جميع عمليات CRUD المعيارية
  - ترقيم الصفحات الآمن (حدود max/min)
- [x] **١.٧** إنشاء مستودع المستخدم `app/repositories/user.repository.ts`
  - `findByEmail()`, `findByUsername()`, `emailExists()`, `usernameExists()`
  - `deleteUserCascade()` — حذف المستخدم مع ملاحظاته واشتراكاته
- [x] **١.٨** إنشاء مستودع الملاحظات `app/repositories/note.repository.ts`
  - `findByUser()`, `findByUserPaginated()`, `findByType()`
  - `search()` — بحث نصي في العنوان والمحتوى
  - `deleteByUser()` — حذف جميع ملاحظات مستخدم
- [x] **١.٩** إنشاء مستودع الاشتراكات `app/repositories/subscription.repository.ts`
  - `findByUser()`, `findByEndpoint()`, `deleteByUser()`
- [x] **١.١٠** إنشاء مدير المستودعات `app/repositories/index.ts` (RepositoryManager + singleton)
- [x] **١.١١** إنشاء طبقة التحقق `app/validators/index.ts`
  - `validateRegisterInput()`, `validateLoginInput()`
  - `validateNoteInput()`, `validateUpdateNoteInput()`
  - `validateUpdateUserInput()`, `validateChangePasswordInput()`

**الحالة:** ✅ منفذة

**الإيداع:** `feat(db): add Mongoose models, repository pattern, and validators`

---

### المرحلة ٢: المصادقة (Auth API)

**الهدف:** بناء نظام مصادقة كامل عبر API Routes

#### المهام:

- [x] **٢.١** إنشاء `app/lib/auth.ts` — دوال JWT (توليد، التحقق) + تشفير كلمة المرور (bcrypt)
- [x] **٢.٢** إنشاء `app/middlewares/auth.middleware.ts` — التحقق من الرمز المميز في طلبات API
- [x] **٢.٣** إنشاء `app/api/auth/register/route.ts`:
  - التحقق من المدخلات (بريد إلكتروني، اسم مستخدم، كلمة مرور)
  - التحقق من عدم وجود بريد/اسم مستخدم مكرر
  - تشفير كلمة المرور + إنشاء المستخدم + إرجاع JWT
- [x] **٢.٤** إنشاء `app/api/auth/login/route.ts`:
  - التحقق من البريد + كلمة المرور
  - إرجاع JWT + بيانات المستخدم
- [x] **٢.٥** إنشاء `app/api/auth/me/route.ts`:
  - GET: إرجاع بيانات المستخدم الحالي (يتطلب JWT)
- [x] **٢.٦** إنشاء `app/api/users/[id]/route.ts`:
  - PUT: تحديث البيانات الشخصية
  - DELETE: حذف الحساب (cascade مع MongoDB Transactions)
- [x] **٢.٧** إنشاء `app/api/health/route.ts` — فحص صحة التطبيق وقاعدة البيانات
- [x] **٢.٨** اختبار جميع مسارات المصادقة (HTTP Local Smoke Tests)

**الحالة:** ✅ منفذة بالكامل

**المهام الإضافية المنفذة:**
- إضافة `app/lib/apiErrors.ts` — معالجة أخطاء مركزية
- إصلاح `deleteUserCascade()` مع MongoDB Transactions
- فعلية Replica Set محلي للتطوير

**الإيداع:** `feat(auth): implement Phase 2 - Authentication API with JWT, session management, and transactional deletion`

---

### المرحلة ٣: واجهة برمجة الملاحظات (Notes CRUD API)

**الهدف:** بناء API كامل لعمليات CRUD على الملاحظات

#### المهام:

- [x] **٣.١** إنشاء `app/api/notes/route.ts`:
  - GET: جلب ملاحظات المستخدم الحالي (مع ترقيم الصفحات + تصفية حسب النوع + بحث)
  - POST: إنشاء ملاحظة جديدة (نصية أو صوتية)
- [x] **٣.٢** إنشاء `app/api/notes/[id]/route.ts`:
  - GET: جلب ملاحظة واحدة (التحقق من ملكية المستخدم)
  - PUT: تحديث ملاحظة (التحقق من الملكية)
  - DELETE: حذف ملاحظة (التحقق من الملكية)
- [x] **٣.٣** معالجة ملفات الصوت:
  - قبول البيانات الصوتية كـ Base64 أو Buffer في الطلب
  - تخزين البيانات الصوتية في MongoDB (حقل Buffer) أو كعنوان URL خارجي
- [x] **٣.٤** تنفيذ البحث في الملاحظات:
  - بحث نصي في العنوان والمحتوى
  - تصفية حسب النوع (نصي/صوتي)
  - ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
- [x] **٣.٥** اختبار جميع مسارات الملاحظات يدوياً (HTTP smoke tests — جميع 7 مسارات نجحت)

**الحالة:** ✅ منفذة بالكامل

**الإيداع:** `feat(api): add notes CRUD API with search, filter, and pagination`

---

### المرحلة ٤: واجهة المستخدم الأساسية (Layout + Theme + Auth)

**الهدف:** بناء الهيكل العام للواجهة مع نظام السمات وصفحات المصادقة

#### المهام:

- [x] **٤.١** إنشاء `app/context/ThemeContext.tsx` — إعداد MUI Theme مع الوضع الفاتح/الداكن:
  - كشف تفضيل النظام (`prefers-color-scheme`)
  - حفظ التفضيل في `localStorage`
  - دعم RTL عبر `stylis-plugin-rtl` + `CacheProvider`
- [x] **٤.٢** إنشاء `app/hooks/useThemeMode.ts` — خطاف مخصص لتبديل السمة
- [x] **٤.٣** إنشاء `app/context/AuthContext.tsx` (AuthProvider مدمج في نفس الملف):
  - إدارة حالة المصادقة (token, user)
  - دوال `login()`, `logout()`, `register()`
  - حفظ/استرجاع الرمز من `localStorage`
- [x] **٤.٤** إنشاء `app/hooks/useAuth.ts` — خطاف مخصص للمصادقة
- [x] **٤.٥** تحديث `app/providers.tsx` — تكوين جميع Providers:
  - `ThemeProviderWrapper` > `AuthProvider` > `{children}`
- [x] **٤.٦** إنشاء `app/lib/api.ts` — طبقة HTTP Client:
  - دوال `fetchApi()` مع حقن JWT تلقائي
  - معالجة أخطاء مركزية
  - دوال مخصوصة: `loginApi()`, `registerApi()`, `getNotesApi()`, إلخ
- [x] **٤.٧** إنشاء مكونات التخطيط:
  - `AppBar.tsx` — شريط التطبيق (عنوان + زر السمة + قائمة المستخدم)
  - `SideBar.tsx` — القائمة الجانبية (responsive drawer — permanent desktop, temporary mobile)
  - `MainLayout.tsx` — التخطيط الرئيسي (AppBar + SideBar + محتوى)
- [x] **٤.٨** إنشاء `app/components/auth/PrivateRoute.tsx` — حماية الصفحات
- [x] **٤.٩** إنشاء صفحة تسجيل الدخول `login/page.tsx`:
  - نموذج (بريد إلكتروني + كلمة مرور)
  - التحقق من المدخلات
  - رابط لإنشاء حساب
- [x] **٤.١٠** إنشاء صفحة إنشاء حساب `register/page.tsx`:
  - نموذج (اسم مستخدم + بريد إلكتروني + كلمة مرور + تأكيد كلمة المرور)
  - التحقق من المدخلات
  - رابط لتسجيل الدخول
- [x] **٤.١١** إنشاء الصفحة الرئيسية `page.tsx` — إعادة توجيه إلى `/notes` أو `/login`
- [x] **٤.١٢** التحقق من عمل النظام كاملاً (smoke tests: ROOT + LOGIN + REGISTER pages = 200)

**الحالة:** ✅ منفذة بالكامل

**الإيداع:** `feat(ui): add layout, theme system, auth context, and login/register pages`

---

### المرحلة ٥: صفحات الملاحظات (Notes UI)

**الهدف:** بناء واجهة مستخدم كاملة لإدارة الملاحظات

#### المهام:

- [x] **٥.١** إنشاء `app/components/notes/NoteCard.tsx`:
  - عرض بطاقة ملاحظة (عنوان، نوع، تاريخ، معاينة المحتوى)
  - أيقونة مختلفة للملاحظات النصية والصوتية
  - أزرار تعديل وحذف
  - `CardActionArea` للتنقل إلى `/notes/[id]` عند النقر على البطاقة
  - معاينة النص باستخدام `stripHtml()` مع مسافة مناسبة بين الكلمات
  - تاريخ مقروء (لون `text.secondary` + خط غامق)
- [x] **٥.٢** إنشاء `app/components/notes/NoteList.tsx`:
  - عرض قائمة الملاحظات بتخطيط شبكي (Grid)
  - شريط بحث + تصفية حسب النوع
  - ترقيم الصفحات
  - حالة فارغة (لا توجد ملاحظات)
- [x] **٥.٣** إنشاء `app/components/notes/RichTextEditor.tsx`:
  - محرر نصوص متقدم باستخدام **Tiptap** (ProseMirror)
  - شريط أدوات MUI: عريض، مائل، تسطير، يتوسطه خط، تمييز
  - عناوين (H2, H3)، قوائم نقطية ومرقمة، محاذاة نص
  - دعم RTL كامل عبر `editorProps: { attributes: { dir: 'rtl' } }` (cursor + caret صحيح)
  - CSS متوافق مع stylis-plugin-rtl (للتعداد مع القلب)
  - prop اختياري `maxHeight` لتمرير داخلي (بدلاً من تمرير الصفحة كاملة)
  - المحتوى يُحفظ كـ HTML
- [x] **٥.٤** إنشاء `app/components/notes/VoiceRecorder.tsx`:
  - تسجيل صوتي باستخدام `MediaRecorder API`
  - Phase state machine: `idle → recording → paused → done`
  - إيقاف مؤقت / استئناف باستخدام `MediaRecorder.pause()` / `.resume()`
  - مؤقت صحيح (segments متراكمة بدون احتساب وقت الإيقاف المؤقت)
  - مشغل `<audio>` ناتيف يظهر فور الضغط على إنهاء التسجيل
  - إدارة الذاكرة متقنة (blob URL revocation)
- [x] **٥.٥** إنشاء `app/components/notes/NoteEditorForm.tsx` (بدلاً من NoteForm.tsx المستند-إلى-Dialog):
  - نموذج مشترك للإنشاء (`mode='create'`) والتعديل (`mode='edit'`)
  - اختيار نوع الملاحظة (مخفي عند التعديل)
  - حقل العنوان (مشترك)
  - `RichTextEditor` أو `VoiceRecorder` حسب النوع
  - بدون Dialog — يُعرض كصفحة كاملة
- [x] **٥.٥.١** إنشاء `app/components/notes/DeleteConfirmDialog.tsx`:
  - حوار تأكيد حذف ملاحظة
- [x] **٥.٦** إنشاء `app/hooks/useNotes.ts`:
  - جلب الملاحظات مع إدارة الحالة
  - إنشاء، تعديل، حذف ملاحظة
  - بحث وتصفية مع إعادة تعيين الصفحة تلقائياً
  - خيار `autoFetch: false` للصفحات التي لا تحتاج جلب القائمة
- [x] **٥.٧** إنشاء صفحة الملاحظات `notes/page.tsx`:
  - عرض NoteList
  - زر إنشاء ملاحظة جديدة (FAB) يتنقل إلى `/notes/new`
  - زر التعديل يتنقل إلى `/notes/[id]/edit`
  - DeleteConfirmDialog للحذف فقط (بدون ديالوج إنشاء/تعديل)
- [x] **٥.٨** إنشاء صفحة إنشاء ملاحظة `notes/new/page.tsx`:
  - تستخدم `NoteEditorForm` بـ `mode='create'`
  - بعد الحفظ تنتقل إلى `/notes`
- [x] **٥.٩** إنشاء صفحة عرض ملاحظة `notes/[id]/page.tsx`:
  - عرض تفاصيل الملاحظة (Rich HTML أو مشغل صوت)
  - قراءة فقط — هيئة عرض نظيفة
  - زر التعديل يتنقل إلى `/notes/[id]/edit`
  - زر حذف مع تأكيد
- [x] **٥.٩.١** إنشاء صفحة تعديل ملاحظة `notes/[id]/edit/page.tsx`:
  - تجلب بيانات الملاحظة (نمط إلغاء في حالة unmount)
  - تستخدم `NoteEditorForm` بـ `mode='edit'`
  - بعد الحفظ تنتقل إلى `/notes/[id]`
- [x] **٥.١٠** إنشاء `app/utils/audio.ts` — مساعدات تحويل الصوت:
  - تحويل Blob إلى Base64
  - تحويل Base64 إلى Blob URL
  - إنشاء عنوان URL مؤقت للصوت
  - تنسيق المدة (mm:ss)
- [x] **٥.١١** إنشاء `app/utils/notes.ts` — مساعدات مشتركة:
  - `stripHtml()` — يدرك block tags ويضيف مسافات بين الفقرات
  - `formatDateShort()` — تنسيق قصير للبطاقات (ar-EG)
  - `formatDateLong()` — تنسيق طويل لصفحة التفاصيل (ar-EG + يوم الأسبوع)
- [x] **٥.١٢** تحسينات إضافية شاملة:
  - تحسين WCAG-AA للتباين اللوني
  - إصلاح التميف بتطبيق blocking script في layout.tsx
  - إصلاح setState أثناء Render في صفحتي Login / Register
  - استخراج EmotionCacheProvider منفصل لصيانة Separation of Concerns
- [x] **٥.١٣** التحقق من عمل جميع العمليات (smoke tests + `npx tsc --noEmit` → لا أخطاء)

**الحالة:** ✅ منفذة بالكامل

**الإيداع:** `feat(notes): add full notes UI with page navigation, RTL editor, voice pause/resume, and UX improvements`

---

### المرحلة ٦: الملف الشخصي وإدارة الحساب

**الهدف:** بناء صفحة الملف الشخصي مع تعديل البيانات وحذف الحساب

#### المهام:

- [x] **٦.١** إنشاء `app/components/profile/ProfileEditor.tsx`:
  - عرض البيانات الحالية
  - تعديل: اسم العرض، البريد الإلكتروني، اسم المستخدم
  - تغيير كلمة المرور (الحالية + الجديدة + التأكيد)
  - اختيار اللغة المفضلة
- [x] **٦.٢** إنشاء `app/components/profile/DeleteAccountDialog.tsx`:
  - زر حذف الحساب مع تأكيد مزدوج
  - عرض تحذير واضح (الحذف نهائي + جميع الملاحظات ستُحذف)
  - إدخال كلمة المرور للتأكيد
- [x] **٦.٣** إنشاء صفحة الملف الشخصي `profile/page.tsx`:
  - عرض ProfileEditor
  - عرض DeleteAccountDialog
  - عرض إحصائيات (عدد الملاحظات، تاريخ الانضمام)
- [x] **٦.٤** التحقق من عمل جميع العمليات
- [x] **٦.٥** تحسينات ما بعد المرحلة ٦:
  - **`instrumentation.ts`** (جديد): خطاف بدء خادم Next.js — يسجّل المنفذ + البيئة + رابط MongoDB (مُقنَّع)، ومستمعي أحداث Mongoose (`connected / disconnected / reconnected / error`) ويُدفئ الاتصال عند الإقلاع
  - **`app/lib/mongodb.ts`**: إضافة `serverSelectionTimeoutMS: 5000`، إزالة console (تجنب الآثار الجانبية في مكتبات)، تحذير بيئة dev إن غاب `DATABASE_URL`
  - **`app/context/ThemeContext.tsx`**: إصلاح تباين WCAG — `primary.contrastText` في الوضع الداكن من `#ffffff` (نسبة 2.64:1 ❌) إلى `#0a1929` (نسبة 7.57:1 ✅ AAA)
  - **`app/components/layout/AppBar.tsx`**: عرض `displayName` بخط غامق + `@username` بخط `caption` في قائمة المستخدم عند توفرهما
  - **`app/components/profile/ProfileEditor.tsx`** (إعادة كتابة كاملة):
    - نمط تعديل مضمّن لكل حقل على حِدة (`EditableField`): قيمة نصية + أيقونة قلم عند العرض، تتحول إلى `TextField` + ✓ + ✗ عند الضغط
    - التحقق من صحة اسم المستخدم عميلياً: حروف صغيرة `a-z` وأرقام ورموز `. _ -` فقط، لا مسافات، 3 أحرف حداً أدنى
    - رسالة نجاح خضراء تُعرض 3 ثوانٍ بعد الحفظ (`role="status"`, `aria-live="polite"`)
    - **نافذة تأكيد** قبل الحفظ: تعرض القيمة القديمة ← الجديدة (ملوّنة)، مع زري "تأكيد التغيير" و"إلغاء" — الإلغاء يُبقي الحقل مفتوحاً
    - يدعم Enter للتأكيد و Escape للإلغاء
    - قسم كلمة المرور يبقى كنموذج مجمّع (الحقول مترابطة منطقياً)
  - **`app/profile/page.tsx`**: تقييد عرض العمود بـ `maxWidth: 680` ومركزته (`mx: 'auto'`) للشاشات الكبيرة

**الحالة:** ✅ منفذة بالكامل

**الإيداع:** `feat(profile): add profile management and account deletion`
**الإيداع (تحسينات):** `feat(profile): inline per-field editing, confirmation dialog, username validation, and UX improvements`

---

### المرحلة ٧: دعم اللغتين (i18n)

**الهدف:** إضافة دعم كامل للعربية والإنجليزية مع تبديل ديناميكي

#### المهام:

- [x] **٧.١** إعداد `next-intl`:
  - إنشاء `src/i18n/routing.ts` — تعريف `locales: ['ar', 'en']` و `defaultLocale: 'ar'`
  - إنشاء `src/i18n/request.ts` — `getRequestConfig` لتحميل ملفات الترجمة
  - إنشاء `src/proxy.ts` — proxy التوجيه التلقائي حسب اللغة (أُعيد تسميته من `middleware.ts` متوافقاً مع Next.js 16)
  - تحديث `next.config.js` باستخدام `createNextIntlPlugin('./src/i18n/request.ts')`
- [x] **٧.٢** إنشاء ملفات الترجمة:
  - `src/messages/ar.json` — جميع النصوص بالعربية (150+ مفتاح)
  - `src/messages/en.json` — جميع النصوص بالإنجليزية (150+ مفتاح)
  - النطاقات: AppBar، SideBar، NoteList، NoteCard، NoteEditorForm، DeleteConfirmDialog، ProfileEditor، DeleteAccountDialog، RegisterPage، LoginPage
- [x] **٧.٣** تحديث بنية المسارات لدعم `[locale]`:
  - نقل الصفحات إلى `src/app/[locale]/` (login، register، notes، profile)
  - إنشاء `src/app/[locale]/layout.tsx` — يضبط `lang` و `dir` ديناميكياً + `NextIntlClientProvider`
  - حذف الصفحات الجذرية القديمة (app/login، app/register، app/notes، app/profile)
- [x] **٧.٤** إنشاء خدمات التنقل والتبديل:
  - `src/app/lib/navigation.ts` — غلاف `createNavigation` لتغليف `useRouter`، `usePathname`، `Link`، `redirect` بدعم اللغة
  - `src/app/components/common/LanguageToggle.tsx` — زر تبديل اللغة في AppBar (تسلسل `/ar/...` ↔ `/en/...`)
- [x] **٧.٥** تحديث جميع المكونات التسعة لاستخدام `useTranslations()`:
  - `AppBar.tsx` — أضاف `<LanguageToggle />` + `useTranslations('AppBar')`
  - `SideBar.tsx` — `useTranslations('SideBar')` + `useRouter` من `navigation.ts`
  - `NoteList.tsx` — `useTranslations('NoteList')`
  - `NoteCard.tsx` — `useTranslations('NoteCard')` + `useRouter` من `navigation.ts`
  - `NoteEditorForm.tsx` — `useTranslations('NoteEditorForm')`
  - `DeleteConfirmDialog.tsx` — `useTranslations('DeleteConfirmDialog')`
  - `ProfileEditor.tsx` — `useTranslations('ProfileEditor')` + `validateUsername(val, t)` مع `TFunc`
  - `DeleteAccountDialog.tsx` — `useTranslations('DeleteAccountDialog')` + `useRouter`
  - `PrivateRoute.tsx` — `useRouter` من `navigation.ts`
- [x] **٧.٦** تحديث `ThemeContext.tsx` لدعم RTL/LTR ديناميكياً:
  - `useLocale()` لتحديد اتجاه النص تلقائياً
  - `EmotionCacheProvider` يقبل `dir` prop مع خيارات `RTL_OPTIONS`/`LTR_OPTIONS` منفصلة
  - `buildTheme(mode, dir)` — تمرير الاتجاه للسمة
- [x] **٧.٧** إعادة هيكلة المشروع إلى `src/` (أفضل الممارسات):
  - نقل `app/` → `src/app/`، `messages/` → `src/messages/`، `i18n/` → `src/i18n/`
  - نقل `middleware.ts` و `instrumentation.ts` إلى `src/`
  - تحديث `tsconfig.json`: `"@/*": ["./src/*"]`
  - تحديث `vitest.config.ts`: مسارات الـ alias وملفات الاختبارات إلى `src/`
  - ملفات الإعداد تبقى في الجذر: `next.config.js`، `tsconfig.json`، `package.json`
- [x] **٧.٨** تحديث البنية التحتية للاختبارات:
  - `tests/setup.ts` — `vi.mock('@/app/lib/navigation', ...)` عالمياً + `import React`
  - `tests/utils.tsx` — تغليف `AllProviders` بـ `NextIntlClientProvider`
  - تحديث 11 ملف اختبار: استبدال `vi.mock('next/navigation')` بـ `vi.mock('@/app/lib/navigation')`
  - تحديث 7 ملفات: مسارات الاستيراد من `@/app/[locale]/...`
  - إضافة `vi.mock('next-intl', ...)` في `ThemeContext.test.tsx`
  - إصلاح `MainLayout.tsx`: `useRouter` من `navigation.ts` بدلاً من `next/navigation`
- [x] **٧.٩** التحقق من اكتمال التنفيذ:
  - `npx tsc --noEmit` → لا أخطاء TypeScript (exit code 0)
  - `npx vitest run` → **271 اختبار ✅** جميعها ناجحة (أصبحت **278** بعد مكملات UX)

**الحالة:** ✅ منفذة بالكامل

**الإيداعات:**
1. `feat(i18n): add next-intl routing, locale layout, and LanguageToggle`
2. `feat(i18n): translate all components with useTranslations and update navigation`
3. `refactor(structure): move source files to src/ directory`
4. `fix(i18n+tests): resolve TypeScript errors and test failures after Phase 7 migration`

---

### مكملات مرحلة 7: تحسينات UX ثنائية الاتجاه ونظام تفضيل اللغة

**الهدف:** تحسينات تجربة المستخدم بعد إكمال الدعم الثنائي

#### المهام:

- [x] **٢٧.1** ترجمة اسم التطبيق في `AppBar`:
  - حذف `APP_NAME_AR` الثابت
  - `const tApp = useTranslations('App')` + `{tApp('name')}` — يظهر "ملاحظاتي" بالعربية و"MyNotes" بالإنجليزية
- [x] **٢٧.2** أيقونات الرجوع مدركة للاتجاه:
  - في 3 صفحات: `notes/new`، `notes/[id]`، `notes/[id]/edit`
  - استبدال `ArrowForwardIcon` → `ArrowBackIcon` + `sx={(theme) => ({ transform: theme.direction === 'rtl' ? 'scaleX(-1)' : undefined })}`
  - في RTL: السهم يشير لليمين (← مقلوب) بما يتوافق مع مبدأ "الرجوع" في القراءة العربية
- [x] **٢٧.3** `RichTextEditor` — تحويل كامل لتaتجاه ثنائي:
  - حالة `contentDir` (`'rtl'|'ltr'`) مهيّأة من `useLocale()`
  - زر تبديل اتجاه المحتوى في شريط الأدوات (`FormatTextdirectionRToLIcon` / `LToRIcon`)
  - جميع تلميحات شريط الأدوات (12 مفتاح) تُترجم عبر `useTranslations('RichTextEditor')`
  - نطاق `RichTextEditor` أضيف إلى `ar.json` + `en.json` (14 مفتاح)
- [x] **٢٧.4** نظام تفضيل اللغة — طبقات ثلاث:
  - **نوع `UserLanguagePref`**: `'ar' | 'en' | 'unset'` (افتراضي `'unset'`) في `types.ts`
  - **نموذج `User`**: تحديث enum `language` ليشمل `'unset'`
  - **`AuthContext`**: إضافة `pendingLocaleSuggestion` + `clearLocaleSuggestion`
    - بعد تسجيل الدخول: إذا كان `user.language ≠ 'unset' && ≠ locale` تُطلق الاقتراح
  - **`LocaleSwitchPromptDialog`** (مكون جديد): حوار يسأل المستخدم عند تسجيل الدخول
    - "نعم، بدّل" → `router.replace` باللغة المفضلة (جلسة فقط، لا يحفظ في DB)
    - "لا، أبقِها" → إغلاق الحوار فقط
  - **`providers.tsx`**: إضافة `<LocaleSwitchPromptDialog />` داخل `AuthProvider`
  - **`ProfileEditor`**: بطاقة "تفضيلات اللغة" بعد بيانات المستخدم
    - خيارات Radio: العربية / الإنجليزية / تلقائي (unset)
    - تحفظ فورياً في DB عبر `updateUserApi`
  - **الترجمات**: نطاقا جديدان `LocaleSwitchPrompt` + مفاتيح لغة في `ProfileEditor`

**الحالة:** ✅ منفذة بالكامل

**الإيداعات:**
1. `docs(plan): update project-plan for Phase 7 completion`
2. `feat(ux): RTL-aware icons, translatable app name, bidirectional editor`
3. `feat(i18n): user language preference with browser detection and login prompt`

---

### إصلاحات ما بعد المرحلة ٧: Routing + Next.js 16 Proxy

**الهدف:** معالجة أخطاء 404 في التوجيه وتحديث الملفات وفق Next.js 16

#### المهام:

- [x] **ب٧.١** إصلاح `src/app/page.tsx` — الصفحة الجذرية:
  - **المشكلة:** كانت `'use client'` تستخدم `useRouter` من `next/navigation` (غير مدرك للغة) وتعيد التوجيه إلى `/notes` (مسار غير موجود — الصحيح `/ar/notes`)
  - **الإصلاح:** تحويلها إلى Server Component بسيط يستدعي `redirect('/ar')` كحاجز احتياطي خلف middleware الـ next-intl الذي يتولى `/ → /ar` أصلاً
  - النتيجة: `GET /` يُرجع `307 → /ar` ✅
- [x] **ب٧.٢** إعادة تسمية `src/middleware.ts` → `src/proxy.ts`:
  - **السبب:** Next.js 16 رفع تحذير deprecation: `"The middleware file convention is deprecated. Please use proxy instead."`
  - المحتوى مطابق (نفس `createMiddleware(routing)` + نفس config.matcher)
  - تحديث الشجرة وقسم 7.1 في ملف الخطط وفق الاسم الجديد
- [x] **ب٧.٣** حذف `app/` الفارغ من جذر المشروع:
  - كان يحتوي فقط على مجلدات فارغة (`components/auth/`, `components/layout/`, `components/notes/`, `context/`, `tests/`) بلا أي ملفات
  - حذف كامل بلا أثر على الكود

**الحالة:** ✅ منفذة بالكامل

**الاختبارات:** 278/278 ✅ — `tsc --noEmit`: 0 أخطاء ✅

**الإيداع:** `fix(routing): replace broken root page redirect + rename middleware to proxy`

---

### المرحلة ٨: تطبيق الويب التقدمي (PWA)

**الهدف:** تحويل الموقع إلى PWA قابل للتثبيت مع دعم العمل بدون اتصال

#### المهام:

- [x] **٨.١** إعداد Service Worker:
  - تكوين `@serwist/next`
  - إعداد استراتيجيات التخزين المؤقت (Cache Strategies):
    - HTML: NetworkFirst
    - CSS/JS: StaleWhileRevalidate
    - الصور والأيقونات: CacheFirst
    - API: NetworkOnly
- [x] **٨.٢** إنشاء `public/manifest.json`:
  - اسم التطبيق (ملاحظاتي / My Notes)
  - الأيقونات بجميع الأحجام
  - ألوان السمة
  - وضع العرض (standalone)
  - اتجاه الشاشة
- [x] **٨.٣** إنشاء أيقونات التطبيق بجميع الأحجام المطلوبة
- [x] **٨.٤** إعداد التخزين المحلي (IndexedDB عبر Dexie):
  - قاعدة بيانات محلية للملاحظات
  - مخزن مؤقت (offline store)
  - تتبع حالة المزامنة لكل ملاحظة
- [x] **٨.٥** تنفيذ المزامنة الخلفية (Background Sync):
  - تسجيل أحداث المزامنة في Service Worker
  - مزامنة الملاحظات المحلية مع الخادم عند عودة الاتصال
  - معالجة التعارضات (الآخر يفوز أو إشعار المستخدم)
- [x] **٨.٦** تحديث طبقة API لدعم Offline:
  - حفظ العمليات محلياً عند فقدان الاتصال
  - عرض حالة الاتصال للمستخدم (OfflineBanner — في تدفق الصفحة)
  - إنشاء `ConnectionIndicator.tsx` في AppBar (قائمة + حالة اتصال + حالة مزامنة)
  - إنشاء `useSyncStatus.ts` — خطاف Dexie لعدد العمليات المعلقة
  - إنشاء `lib/ui-constants.ts` — ثوابت التخطيط المركزية (DRAWER_WIDTH، Z_INDEX، TRANSITIONS، SHADOWS)
  - تحسين نظام الألوان في `ThemeContext.tsx` (WCAG AAA لجميع النصوص)
  - مزامنة تلقائية عند عودة الاتصال
- [x] **٨.٧** اختبار:
  - التثبيت على الهاتف والحاسوب
  - العمل بدون اتصال (إنشاء ملاحظة + تعديل + حذف)
  - المزامنة بعد عودة الاتصال

**الإيداع:** `feat(pwa): add service worker, offline support, and background sync`

---

### المرحلة ٩: الإشعارات الفورية (Push Notifications)

**الهدف:** إضافة إشعارات فورية تُرسل عند تسجيل الدخول من جهاز جديد

#### المهام:

- [x] **٩.١** إنشاء `app/lib/webpush.ts`:
  - إعداد web-push مع مفاتيح VAPID
  - دوال إرسال الإشعارات
- [x] **٩.٢** إنشاء `app/api/push/subscribe/route.ts`:
  - تسجيل اشتراك الإشعارات (حفظ في قاعدة البيانات)
  - ربط الاشتراك بالمستخدم والجهاز
- [x] **٩.٣** إنشاء `app/api/push/send/route.ts`:
  - إرسال إشعار لجميع أجهزة المستخدم
  - حذف الاشتراكات المنتهية الصلاحية
- [x] **٩.٤** تحديث `app/api/auth/login/route.ts`:
  - عند تسجيل الدخول: إرسال إشعار لجميع أجهزة المستخدم الأخرى
  - محتوى الإشعار: "تم تسجيل الدخول إلى حسابك من جهاز جديد"
- [x] **٩.٥** إنشاء `app/hooks/usePushNotifications.ts`:
  - طلب إذن الإشعارات
  - تسجيل الاشتراك
  - إلغاء الاشتراك
- [x] **٩.٦** تحديث Service Worker لمعالجة أحداث push:
  - عرض الإشعار بمحتوى مخصص
  - معالجة النقر على الإشعار (فتح التطبيق)
- [x] **٩.٧** إضافة زر تفعيل/إلغاء الإشعارات في الملف الشخصي
- [x] **٩.٨** اختبار الإشعارات على أجهزة متعددة

**الإيداع:** `feat(push): add push notifications for login alerts on other devices`

---

### المرحلة ١٠: الاختبارات الشاملة

**الهدف:** كتابة اختبارات شاملة لجميع طبقات التطبيق

#### المهام:

- [x] **١٠.١** إعداد Vitest:
  - تكوين `vitest.config.ts` (globals, jsdom, setupFiles, coverage)
  - إنشاء `app/tests/setupTests.ts` (localStorage mock, matchMedia mock, fetch mock)
- [x] **١٠.٢** اختبارات الإعدادات والأنواع:
  - `config.test.ts` — الثوابت والإعدادات المركزية
  - `types.test.ts` — التحقق من شكل الأنواع
- [x] **١٠.٣** اختبارات التحقق:
  - `validators.test.ts` — جميع دوال التحقق من المدخلات
- [x] **١٠.٤** اختبارات طبقة API:
  - `apiClient.test.ts` — دوال HTTP Client
- [x] **١٠.٥** اختبارات الخطافات:
  - `useAuth.test.tsx` — سلوك خطاف المصادقة
  - `ThemeContext.test.tsx` — سياق السمة
  - `useNotes.test.ts` — خطاف الملاحظات
  - `useOfflineStatus.test.ts` — خطاف حالة الاتصال
  - `useSyncStatus.test.ts` — خطاف حالة المزامنة (Dexie pending ops)
- [x] **١٠.٦** اختبارات المكونات:
  - `AppBar.test.tsx` — شريط التطبيق
  - `SideBar.test.tsx` — القائمة الجانبية
  - `ThemeToggle.test.tsx` — زر تبديل السمة
  - `LanguageToggle.test.tsx` — زر تبديل اللغة
  - `OfflineBanner.test.tsx` — شريط حالة الاتصال
  - `ConnectionIndicator.test.tsx` — مؤشر حالة الاتصال والمزامنة (AppBar)
  - `NoteCard.test.tsx`, `NoteList.test.tsx`, `NoteEditorForm.test.tsx`
  - `DeleteConfirmDialog.test.tsx`, `DeleteAccountDialog.test.tsx`
  - `ProfileEditor.test.tsx`, `ProfilePage.test.tsx`
  - `PrivateRoute.test.tsx`
  - صفحات: `NotesPage`, `NoteDetailPage`, `EditNotePage`, `NewNotePage`, `login`, `register`
- [x] **١٠.٧** إنشاء أوامر الاختبار في `package.json`:
  - `test` — تشغيل جميع الاختبارات
  - `test:watch` — وضع المراقبة
  - `test:coverage` — التغطية
- [x] **١٠.٨** التحقق من نجاح جميع الاختبارات

**الاختبارات:** 523/523 ✅ — 38 ملف اختبار

**الإيداع:** `test: add comprehensive test suite with Vitest`

---

### المرحلة ١١: جودة الكود والتنسيق

**الهدف:** إعداد أدوات جودة الكود والتنسيق الموحد

#### المهام:

- [x] **١١.١** إنشاء `.prettierrc.json` بالتكوين المعياري (singleQuote، tabWidth:2، LF، printWidth:100)
- [x] **١١.٢** إنشاء `.prettierignore` (node_modules، .next، public، package-lock.json)
- [x] **١١.٣** إنشاء `.gitattributes` مع `* text=auto eol=lf` + علامات ثنائية للصور والخطوط
- [x] **١١.٤** إنشاء `scripts/format.mjs` (سكريبت تنسيق عبر المنصات — cwd مُصحَّح إلى جذر المشروع)
- [x] **١١.٥** إنشاء `scripts/validate-workflow.mjs` — فحص شامل قبل الدفع:
  - التحقق من الملفات الإلزامية (14 ملف)
  - فحص `package.json` (engines + scripts)
  - تشغيل `tsc --noEmit`
  - تشغيل `vitest run`
  - فحص تغطية `.env.example` للمتغيرات الحرجة
  - فحص غياب أيقونات Next.js الافتراضية
- [x] **١١.٦** إضافة أوامر في `package.json`: `test`, `test:watch`, `test:coverage`, `format`, `format:check`, `validate`, `smoke`
- [x] **١١.٧** إضافة `engines: { node: ">=20.x", npm: ">=10.x" }` في `package.json` (مطلوب لـ Heroku)
- [x] **١١.٨** إنشاء `CONTRIBUTING.md` بثمانية أقسام: المعمارية، الفروع، Commits، Tags، معايير الكود، قائمة ما قبل الدفع، المتغيرات البيئية، النشر على Heroku
- [x] **١١.٩** حذف `next.config.mjs` المكرر (الجذر يحتفظ بـ `next.config.js` فقط — CJS متوافق مع Heroku)
- [x] **١١.١٠** حذف أيقونات Next.js الافتراضية من `public/`: `file.svg`، `globe.svg`، `next.svg`، `vercel.svg`، `window.svg`
- [x] **١١.١١** إنشاء `src/app/utils/sanitize.ts` — تعقيم HTML بـ DOMParser قبل `dangerouslySetInnerHTML` (حماية XSS)
- [x] **١١.١٢** تطبيق `sanitizeHtml()` في صفحة تفاصيل الملاحظة (`notes/[id]/page.tsx`)
- [x] **١١.١٣** تشغيل Prettier على جميع الملفات (121 ملف) — جميعها مُنسَّقة
- [x] **١١.١٤** إصلاح 6 أخطاء TypeScript في `useNotes.test.ts` (_cachedAt، enqueuePendingOp return type، resolveCreate type)
- [x] **١١.١٥** إصلاح timeout في `ProfilePage.test.tsx` (أضيف `{ timeout: 15000 }` للاختبار الأول)
- [x] **١١.١٦** التحقق النهائي: `tsc --noEmit` → 0 أخطاء، `vitest run` → 523/523 ✅، `validate-workflow.mjs` → 29/29 ✅

**الحالة:** ✅ منفذة بالكامل

**الإيداعات:**
1. `chore(quality): add Prettier, gitattributes, engines, and validate script`
2. `security(notes): sanitize Rich HTML before rendering with custom DOMParser sanitizer`
3. `docs: add CONTRIBUTING.md with architecture rules, commit standards, and Heroku notes`
4. `chore(cleanup): remove duplicate next.config.mjs and default Next.js placeholder SVGs`
5. `style: run Prettier across all source files (121 files formatted)`
6. `fix(tests): fix TypeScript errors and ProfilePage timeout in test suite`

---

### المرحلة ١٢: النشر

**الهدف:** نشر التطبيق على Heroku

> **ملاحظة:** النشر يتم تلقائياً عبر Heroku من الفرع الرئيسي (main) — لا يحتاج إعداد GitHub Actions.
> عند دفع الكود إلى الفرع الرئيسي، يقوم Heroku بالبناء والنشر تلقائياً.

#### المهام:

- [x] **١٢.١** ربط المستودع بتطبيق Heroku
- [x] **١٢.٢** إعداد متغيرات البيئة على Heroku (MONGODB_URI, JWT_SECRET, VAPID keys)
- [x] **١٢.٣** إنشاء `validate-workflow.mjs` — فحص محلي لصحة المشروع

**الإيداع:** `deploy: configure Heroku auto-deploy from main branch`

---

### المرحلة ١٣: التوثيق الشامل

**الهدف:** إنشاء توثيق كامل للمشروع

#### المهام:

- [ ] **١٣.١** إنشاء/تحديث `README.md`:
  - وصف المشروع والميزات
  - خطوات التثبيت والتشغيل
  - شجرة المجلدات
  - أوامر الاختبار
  - شارات CI/CD
- [ ] **١٣.٢** إنشاء `docs/api-endpoints.md`:
  - جميع مسارات API مع الأمثلة
  - رموز الحالة والأخطاء
- [ ] **١٣.٣** إنشاء `docs/database-abstraction.md`:
  - شرح نمط المستودعات
  - مخطط الطبقات
- [ ] **١٣.٤** إنشاء `docs/repository-quick-reference.md`:
  - مرجع سريع لجميع عمليات المستودعات
- [ ] **١٣.٥** إنشاء `docs/testing.md`:
  - استراتيجية الاختبار
  - أوامر التشغيل
  - أعداد الاختبارات
- [ ] **١٣.٦** إنشاء `docs/deployment.md`:
  - خطوات النشر
  - المتغيرات البيئية
- [ ] **١٣.٧** إنشاء `docs/pwa-guide.md`:
  - شرح PWA والتخزين المحلي
  - Service Worker والمزامنة
  - الإشعارات الفورية
- [ ] **١٣.٨** إنشاء `docs/ai/`:
  - `README.md` — بطاقة هوية المشروع + قواعد حاسمة
  - `architecture.md` — مخطط طبقات + تدفق البيانات
  - `feature-guide.md` — دليل إضافة ميزة جديدة
- [ ] **١٣.٩** إنشاء `docs/tutorials/`:
  - `README.md` — فهرس الدروس
  - `concepts-guide.md` — شرح المفاهيم للمبتدئين
  - `quick-reference.md` — مرجع سريع
  - دروس `lessons/` (١٣ درساً كما في البنية أعلاه)

**الإيداعات:**
1. `docs: add comprehensive project documentation`
2. `docs(ai): add architecture, feature guide, and AI README`
3. `docs(tutorials): add complete tutorial series (13 lessons)`

---

## 5. تفاصيل صفحات الموقع

| الصفحة | المسار | الوصف | حالة المصادقة |
|--------|--------|-------|--------------|
| **الرئيسية** | `/` | إعادة توجيه إلى `/notes` أو `/login` | — |
| **تسجيل الدخول** | `/login` | نموذج تسجيل الدخول | عام (ضيف) |
| **إنشاء حساب** | `/register` | نموذج إنشاء حساب جديد | عام (ضيف) |
| **ملاحظاتي** | `/notes` | قائمة الملاحظات + بحث + تصفية + إنشاء | خاص (مسجل) |
| **تفاصيل ملاحظة** | `/notes/[id]` | عرض/تعديل ملاحظة واحدة | خاص (مسجل + مالك) |
| **الملف الشخصي** | `/profile` | تعديل البيانات + حذف الحساب + إعدادات | خاص (مسجل) |

> ملاحظة: جميع المسارات أعلاه ستكون تحت `[locale]/` (مثال: `/ar/notes`، `/en/login`)

---

## 6. نماذج البيانات

### المستخدم (User)

| الحقل | النوع | الوصف | القيود |
|-------|-------|-------|--------|
| `_id` | ObjectId | المعرف الفريد | تلقائي |
| `username` | String | اسم المستخدم | فريد، مطلوب، 3-30 حرف |
| `email` | String | البريد الإلكتروني | فريد، مطلوب، صيغة صحيحة |
| `password` | String | كلمة المرور (مشفرة bcrypt) | مطلوب، 6+ أحرف |
| `displayName` | String | اسم العرض | اختياري |
| `language` | String | تفضيل اللغة | `'ar'` \| `'en'` \| `'unset'`، افتراضي `'unset'` |
| `createdAt` | Date | تاريخ الإنشاء | تلقائي |
| `updatedAt` | Date | تاريخ آخر تحديث | تلقائي |

### الملاحظة (Note)

| الحقل | النوع | الوصف | القيود |
|-------|-------|-------|--------|
| `_id` | ObjectId | المعرف الفريد | تلقائي |
| `title` | String | عنوان الملاحظة | مطلوب، 1-200 حرف |
| `content` | String | المحتوى النصي | مطلوب للملاحظات النصية |
| `audioData` | Buffer | البيانات الصوتية | مطلوب للملاحظات الصوتية |
| `audioDuration` | Number | مدة التسجيل (ثواني) | اختياري |
| `type` | String | نوع الملاحظة | `'text'` \| `'voice'`، مطلوب |
| `user` | ObjectId | المستخدم المالك | مرجع لـ User، مطلوب |
| `createdAt` | Date | تاريخ الإنشاء | تلقائي |
| `updatedAt` | Date | تاريخ آخر تحديث | تلقائي |

### اشتراك الإشعارات (Subscription)

| الحقل | النوع | الوصف | القيود |
|-------|-------|-------|--------|
| `_id` | ObjectId | المعرف الفريد | تلقائي |
| `user` | ObjectId | المستخدم المالك | مرجع لـ User، مطلوب |
| `endpoint` | String | عنوان نقطة الاشتراك | فريد، مطلوب |
| `keys` | Object | مفاتيح التشفير | `{ p256dh, auth }` |
| `deviceInfo` | String | معلومات الجهاز | اختياري (user-agent) |
| `createdAt` | Date | تاريخ الإنشاء | تلقائي |

---

## 7. واجهة برمجة التطبيقات (API)

### مسارات المصادقة

| الطريقة | المسار | الوصف | المصادقة |
|---------|--------|-------|----------|
| POST | `/api/auth/register` | إنشاء حساب جديد | ❌ |
| POST | `/api/auth/login` | تسجيل الدخول | ❌ |
| GET | `/api/auth/me` | بيانات المستخدم الحالي | ✅ JWT |

### مسارات المستخدم

| الطريقة | المسار | الوصف | المصادقة |
|---------|--------|-------|----------|
| PUT | `/api/users/[id]` | تحديث بيانات المستخدم | ✅ JWT (المالك) |
| DELETE | `/api/users/[id]` | حذف الحساب (cascade) | ✅ JWT (المالك) |

### مسارات الملاحظات

| الطريقة | المسار | الوصف | المصادقة |
|---------|--------|-------|----------|
| GET | `/api/notes` | قائمة ملاحظات المستخدم | ✅ JWT |
| POST | `/api/notes` | إنشاء ملاحظة جديدة | ✅ JWT |
| GET | `/api/notes/[id]` | جلب ملاحظة واحدة | ✅ JWT (المالك) |
| PUT | `/api/notes/[id]` | تحديث ملاحظة | ✅ JWT (المالك) |
| DELETE | `/api/notes/[id]` | حذف ملاحظة | ✅ JWT (المالك) |

### مسارات الإشعارات

| الطريقة | المسار | الوصف | المصادقة |
|---------|--------|-------|----------|
| POST | `/api/push/subscribe` | تسجيل اشتراك إشعارات | ✅ JWT |
| POST | `/api/push/send` | إرسال إشعار (داخلي) | ✅ JWT |

### مسارات النظام

| الطريقة | المسار | الوصف | المصادقة |
|---------|--------|-------|----------|
| GET | `/api/health` | فحص صحة التطبيق | ❌ |

### معلمات الاستعلام لقائمة الملاحظات

| المعلمة | النوع | الافتراضي | الوصف |
|---------|-------|-----------|-------|
| `page` | number | 1 | رقم الصفحة |
| `limit` | number | 10 | عدد العناصر (حد أقصى 50) |
| `type` | string | — | تصفية حسب النوع (`text` \| `voice`) |
| `search` | string | — | بحث في العنوان والمحتوى |
| `sort` | string | `-createdAt` | الترتيب (الأحدث افتراضياً) |

### صيغة الاستجابة

```typescript
  "data": { ... },
{
// نجاح
  "message": "تم بنجاح"
}

// نجاح مع ترقيم صفحات
{
  "data": {
    "rows": [...],
    "count": 100,
    "page": 1,
    "totalPages": 10
  }
}

// خطأ
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "البريد الإلكتروني مطلوب, كلمة المرور يجب أن تكون 6 أحرف على الأقل"
  }
}
```

---

## 8. معايير الجودة

### معايير عامة

- [ ] نمط المستودعات (Repository Pattern) لجميع عمليات قاعدة البيانات
- [ ] طبقة تحقق منفصلة عن منطق الأعمال
- [ ] معالجة أخطاء مركزية مع رسائل عربية للمستخدم
- [ ] TypeScript صارم في جميع الملفات
- [ ] اختبارات شاملة (وحدة + تكامل)
- [ ] تنسيق Prettier موحد مع LF
- [ ] التزامات Git بصيغة Conventional Commits (إنجليزي فقط)
- [ ] العلامات المرجعية (Tags) تحديثية فقط في النقاط المهمة
- [ ] التوثيقات التعليمية بالعربية، أسماء الملفات بالإنجليزية
- [x] استقلالية الكود: لا يُذكر أي مشروع خارجي أو مقارنة داخل أكواد المشروع أو تعليقاته أو وثائقه — المشروع مستقل تماماً
- [x] استخدام MongoDB Transactions في عمليات الحذف التسلسلي (Cascade Delete) لتجنب Partial Failure

### معايير الأداء

- [ ] تحميل الصفحة الأولى < 3 ثوان
- [ ] حجم Service Worker محسّن
- [ ] تخزين مؤقت ذكي (Cache Strategy)
- [ ] تحميل كسول (Lazy Loading) للمكونات الثقيلة

### معايير الأمان

- [ ] تشفير كلمات المرور بـ bcrypt (12 جولة)
- [ ] JWT مع انتهاء صلاحية (7 أيام)
- [ ] مفاتيح VAPID لإشعارات Web Push
- [ ] التحقق من ملكية الملاحظات قبل أي عملية
- [ ] تطهير المدخلات (XSS prevention)
- [ ] CORS مُعدّ بشكل صحيح
- [ ] المتغيرات الحساسة في `.env` فقط (ليس في الكود)

### معايير إمكانية الوصول

- [ ] دعم لوحة المفاتيح للتنقل
- [ ] تسميات ARIA للعناصر التفاعلية
- [ ] ألوان ذات تباين كافٍ (WCAG AA)
- [ ] نصوص بديلة للأيقونات

---

## المتغيرات البيئية المتوقعة

```env
DATABASE_URL=mongodb://localhost:27017/mynotes
# قاعدة البيانات

# المصادقة
JWT_SECRET=your_jwt_secret_key_change_in_production

# الخادم
PORT=3000
NODE_ENV=development

# إشعارات Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:your-email@example.com

# Next.js العامة (متاحة في المتصفح)
```

---

## 9. تحديثات حديثة (مارس ٢٠٢٦)

### مرحلة الأجهزة الموثوقة والإشعارات (٢٠٢٦/٠٣/٠١)

- إضافة نموذج `Device` ومستودع `device.repository` وواجهة `/api/devices` (GET/POST/DELETE) لإدارة الأجهزة الموثوقة.
- اشتراط كلمة المرور لتأكيد إجراءات الوثوق بالجهاز وإزالته (خادم + عميل + واجهة).
- ربط تفعيل الإشعارات والتثبيت بحالة الوثوق بالجهاز مع رسائل واضحة في الواجهة.
- إضافة مراقبة لحظية للوثوق في `AuthContext` (polling كل 30 ثانية + عند العودة للتبويب) مع تسجيل خروج إجباري إذا أُزيل الجهاز من جلسة أخرى.
- تحسين منطق `usePwaStatus` وفق أفضل الممارسات: فصل "قابلية المتصفح للتثبيت" عن "سماحية الوثوق" ثم اشتقاق الحالة النهائية تفاعليًا.
- إضافة حدث موحّد `device-trust-changed` لضمان تحديث حالة التثبيت فورًا بعد الوثوق/إلغاء الوثوق دون انتظار إعادة تحميل.
- توسيع الاختبارات لتغطية السيناريوهات الجديدة (devices route/hook/profile, trust-gated install state, logout/offline cleanup).
- الحالة الحالية للاختبارات: **413/413** ناجح.

### مرحلة العمليات المعلقة والتجاوب (٢٠٢٦/٠٣/٠٨)

#### تحسينات الـ Offline وعمليات CRUD:
- **Optimistic UI:** تطبيق التحديثات على الواجهة فوريًا (create/update/delete) مع rollback تلقائي عند فشل الـ API.
- **إصلاح قائمة المزامنة:** العمليات الفاشلة تبقى في القائمة (`incrementPendingOpFailure`) بدلاً من حذفها، ما يجعل مؤشر المزامنة دقيقًا.
- **Offline Filter/Search:** تطبيق الفلترة والبحث على البيانات المحلية (Dexie) في وضع offline بدلاً من إظهار كل الكاش بدون تصفية — عبر دالة `applyLocalFilter` مُضمّنة في `fetchNotes`.
- **Re-inject pending creates:** بعد تحديث الكاش من الخادم تُعاد إضافة الملاحظات المُنشأة locally وغير المُزامنة إلى القائمة.

#### قائمة العمليات المعلقة في قائمة الاتصال:
- **5 عمليات آخر ما تمت** تظهر داخل قائمة `ConnectionIndicator` (أحدث أولاً).
- كل عملية لها أيقونة نوع (إنشاء/تعديل/حذف)، عنوان الملاحظة، وعداد فشل مرئي.
- **زر تراجع** (Undo) لكل عملية: يُزيلها من queue، يُعيد الـ snapshot، ويُطلق حدث `notes:undo-op`.
- مؤشر تحذير `hasFailures` يظهر عند وجود عمليات فشلت.
- `useSyncStatus` أضافت حقل `hasFailures`.

#### تحسينات التجاوب (Responsive):
- **AppBar:** زر القائمة ثابت على حافة البداية، باقي الأيقونات مجمّعة في `Box` مرن على الحافة المعاكسة — يعمل صحيحًا على xs/sm/md/lg.
- **AppBar:** عنوان التطبيق يختفي على `xs` ويُستبدل بـ spacer لضمان توازن التخطيط.
- **NoteList Toolbar:** الفلتر والبحث مُحسَّنان — استُخدم `Box` داخلي لضم ToggleButtonGroup مع عداد الملاحظات حتى لا يفيضا على xs.
- **ConnectionIndicator Menu:** أُضيف `maxWidth: '95vw'` للقائمة لمنع فيضانها خارج الشاشة على الهواتف.

#### جودة الكود:
- `db.ts`: إضافة حقول `noteTitle`, `noteSnapshot`, `failureCount` لـ `PendingOperation` + helpers جديدة.
- الاختبارات: تغطية لـ `@/app/lib/db` في `useNotes.test.ts` و`ConnectionIndicator.test.tsx`.
- البناء `npm run build` ناجح بدون أخطاء TypeScript.
- الحالة الحالية للاختبارات: **423/423** ناجح.

### مرحلة تعطيل العمليات التدميرية عند انعدام الاتصال (٢٠٢٦/٠٣/٠٨)

#### مبدأ التصميم:
أي عملية تؤدي إلى حذف بيانات دائمة من قاعدة البيانات (حذف الحساب، تسجيل الخروج الذي يمسح بيانات الجهاز ويلغي الاشتراك من قاعدة البيانات) تستوجب اتصالاً فعالاً بالخادم. لذلك تعطّل هذه العمليات تلقائياً عند انعدام الاتصال.

#### التغييرات المنفذة:

- **تسجيل الخروج** — `AppBar.tsx` و `SideBar.tsx`:
  - زر تسجيل الخروج يعطّل تلقائياً ويظهر `Tooltip` توضيحي عند الأوف-لاين.
  - السبب: تسجيل الخروج يحذف بيانات الجهاز من قاعدة البيانات، ويلغي اشتراك الإشعارات، ويمسح كاش IndexedDB — كلها تتطلب خادماً حياً.

- **حذف الحساب** — `DeleteAccountDialog.tsx`:
  - زر الحذف يعطّل مع `Tooltip` عند الأوف-لاين.
  - السبب: لا يمكن حذف الحساب دون مزامنة وحذف بياناته أولاً من الخادم.

- **نموذج تحرير الملاحظة** — `NoteEditorForm.tsx`:
  - رسالة `Alert severity="info"` تظهر أعلى النموذج عند الأوف-لاين تخبر المستخدم أن التعديل سيحفظ محلياً ويُزامن عند عودة الاتصال.

- **الترجمات**: أُضيف مفتاح `logoutOfflineDisabled` في قسمي `AppBar` و `SideBar`، و`offlineDisabled` في `DeleteAccountDialog`، و`offlineHint` في `NoteEditorForm` — بكلا ملفي `ar.json` و `en.json`.

#### الاختبارات:
- إصلاح `DeleteAccountDialog.test.tsx`: إضافة `let mockIsOnline` + `vi.mock('@/app/hooks/useOfflineStatus')` المفقودين (14 فشل كانت معلقة).
- `AppBar.test.tsx`: موك `useOfflineStatus` + اختبار جديد "لوجوت عند الأوف-لاين".
- `SideBar.test.tsx`: موك `useOfflineStatus` + اختبار جديد "لوجوت عند الأوف-لاين".
- `offlineLogout.test.tsx`: اختبارات تكاملية شاملة لسيناريوهات الأوف-لاين.
- **الحالة الحالية للاختبارات: 523/523** ناجح — 38 ملف اختبار.

### مرحلة بصمة PWA الصفرية (Zero PWA Footprint) (٢٠٢٦/٠٣/١٠)

**الهدف:** منع المتصفح من اكتشاف أن التطبيق PWA حتى يقوم المستخدم بتفعيل وضع عدم الاتصال يدوياً من صفحة الملف الشخصي — للأجهزة الموثوقة فقط.

#### التغييرات المنفذة:

- **`context/PwaActivationContext.tsx`** (جديد):
  - تصدير: `PWA_ENABLED_KEY = 'pwa-enabled'`، `PWA_ACTIVATION_EVENT = 'pwa:activation-changed'`
  - `activate()`: حقن `<link rel="manifest">` ديناميكياً + تسجيل Service Worker برمجياً + حفظ localStorage
  - `deactivate()`: إزالة manifest + إلغاء تسجيل SW + `clearOfflineData()` + حذف المفتاح من localStorage
  - استماع لـ `device:trust-revoked` → استدعاء `deactivate()` تلقائياً
  - إرسال `pwa:activation-changed` CustomEvent عند كل تغيير لإخطار `usePwaStatus`

- **`components/common/PwaActivationDialog.tsx`** (جديد):
  - حوار متعدد المراحل: `info` → `activating` → `done` | `error`
  - Stepper عمودي بثلاث خطوات: تسجيل هوية التطبيق (400ms) → تثبيت SW (async حقيقي) → تجهيز قاعدة البيانات (300ms)
  - لا يمكن إغلاقه أثناء مرحلة التفعيل
  - مرحلة الخطأ: رسالة تحذير + زر إعادة المحاولة

- **`next.config.js`**: `register: true` → `register: false` (تسجيل SW برمجياً بدلاً من التلقائي)
- **`layout.tsx`**: حذف `manifest` و `appleWebApp` من البيانات الوصفية الثابتة (تُضاف ديناميكياً عند التفعيل)
- **`providers.tsx`**: إضافة `PwaActivationProvider` يلفّ `AuthProvider`؛ مكوّن `PwaRuntime` يجسر رسائل SW فقط عند التفعيل
- **`usePwaStatus.ts`**: إضافة gate على مفتاح `pwa-enabled`؛ تقسيم `useEffect` إلى اثنين (مستمع أحداث دائم + فحص SW مشروط)
- **`AppBar.tsx`**: `{isActivated && <ConnectionIndicator />}` — إخفاء المؤشر حتى يُفعَّل PWA
- **`profile/page.tsx`**: إضافة قسم تفعيل PWA (زر تفعيل للأجهزة الموثوقة غير المفعّلة، أو شريحة نشط + زر إلغاء تفعيل، أو رسالة «يتطلب جهازاً موثوقاً»)
- **الترجمات** (`en.json` + `ar.json`): إضافة namespace `PwaActivation` (16 مفتاح) + مفاتيح `ProfilePage.pwa*` (6 مفاتيح)

#### الاختبارات:
- **`usePwaStatus.test.ts`**: إضافة describe block `pwa-enabled gate` (4 اختبارات جديدة)؛ تحديث `beforeEach` لضبط `localStorage['pwa-enabled']`
- **`AppBar.test.tsx`**: موك لـ `PwaActivationContext` (يشمل الثوابت)؛ اختبار جديد «يُخفي ConnectionIndicator عند عدم تفعيل PWA»
- **`tests/PwaActivationDialog.test.tsx`** (جديد): 8 اختبارات (مرحلة المعلومات، الميزات، الإلغاء، Stepper، النجاح، الخطأ، إعادة المحاولة، تعطيل الزر أثناء التفعيل)

**الاختبارات:** 523/523 ✅ — 38 ملف اختبار (+13 اختباراً جديداً)

**الإيداع:** `feat(pwa): implement Zero PWA Footprint with explicit user activation`

---

### إصلاحات ما بعد التنفيذ (٢٠٢٦/٠٣/٠٩)

**السبب:** ظهور ChunkLoadError (HTTP 500) عند الضغط على زر «إلغاء التفعيل» في الملف الشخصي، بالإضافة إلى تحذير ExperimentalWarning في البناء وأخطاء linter من استدعاء setState داخل effect.

#### التغييرات المنفذة:

**١ — إصلاح ChunkLoadError عند إلغاء التفعيل:**
- **`context/PwaActivationContext.tsx`**:
  - `deactivate()` تستدعي `window.location.reload()` بعد إتمام التنظيف بدلاً من `setIsActivated(false)`.  
    السبب: إلغاء تسجيل SW أثناء الجلسة يجعل dynamic imports تصطدم بذاكرة SW المحذوفة وتعود بـ HTTP 500؛ إعادة التحميل تجلب chunk hashes جديدة مباشرةً من الخادم.
  - `deactivatingRef` يمنع استدعاء `deactivate()` مرتين (نقر مزدوج).
  - `isDeactivating` (حالة جديدة) مُصدَّرة من السياق.

**٢ — إصلاح حالات إلغاء الوثوق عن بعد:**
- معالج `device:trust-revoked` أصبح خفيفاً: يزيل manifest + localStorage فقط + `setIsActivated(false)`، ولا يستدعي `deactivate()` الكاملة.  
  السبب: `AuthContext.logout()` يتولى إلغاء تسجيل SW والتنقل؛ استدعاء `reload()` داخل `deactivate()` كان يتعارض مع التوجيه.
- **عند الإقلاع:** إذا كان `pwa-enabled=true` ولكن `device-trusted=false` (علامة متقادمة من جلسة أوف-لاين)، تُحذف فوراً لضمان بدء الجلسة التالية بصمة صفرية.

**٣ — تحسين التفعيل:**
- `activate()` تستدعي `removeManifest()` قبل إعادة رمي الخطأ إذا فشل `registerSW()`، لضمان خلو `<head>` من أي manifest عند الفشل.

**٤ — إصلاح `profile/page.tsx`:**
- `isTrusted` أصبح يستمع لـ `storage` events و `device-trust-changed` لتحديث الواجهة فوراً دون إعادة تحميل.
- زر «إلغاء التفعيل» يُعطَّل ويعرض `CircularProgress` أثناء `isDeactivating`.
- الشرط المنطقي لرسالة «يتطلب جهازاً موثوقاً»: أصبح `!isTrusted && !isActivated` (كانت تظهر حتى مع الجهاز النشط).

**٥ — إصلاح تحذير البناء (CJS/ESM):**
- `next.config.js` أُعيدت تسميته إلى `next.config.mjs` وتحويل `require()` إلى `import`.  
  السبب: `@serwist/next` حزمة ESM نقية؛ تحميلها بـ `require()` أنتج `ExperimentalWarning` في كل بناء.

**٦ — إصلاح أخطاء Linter (setState في effect):**
- **`PwaActivationContext.tsx`**: `isActivated` تُحسب بـ lazy initializer من localStorage بدلاً من `setIsActivated(true)` داخل effect.
- **`usePwaStatus.ts`**: حذف `setSwState('inactive')` و `setSwState('unsupported')` و `setSwState('checking')` المتزامنة من body الـ effect — الـ lazy initializer والـ callbacks غير المتزامنة تحدد الحالة مباشرةً.

#### تحديث الاختبارات:
- `AppBar.test.tsx`, `PwaActivationDialog.test.tsx`, `ProfilePage.test.tsx`: إضافة `isDeactivating: false` لموكات `usePwaActivation`
- `ProfilePage.test.tsx`: إضافة موك لـ `PwaActivationContext` المفقود

**الاختبارات:** 523/523 ✅ — 38 ملف اختبار

**الإيداعات:**
1. `fix(pwa): robust deactivation, ESM config, and lint cleanup`

---

> **آخر تحديث:** ٩ مارس ٢٠٢٦
> **الإصدار:** ١.٤.١ (خطة محدثة)
