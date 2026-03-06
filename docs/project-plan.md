# خطة بناء مشروع ملاحظاتي (My Notes) 📝

> **المستودع:** `web-notes-e1`
> **نوع المشروع:** تطبيق ويب تقدمي (PWA) — Full-Stack SSR
> **الحالة:** مرحلة التخطيط

---

## جدول المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [التقنيات والأدوات](#2-التقنيات-والأدوات)
3. [البنية المعمارية](#3-البنية-المعمارية)
4. [المراجع والمصادر](#4-المراجع-والمصادر)
5. [المراحل التنفيذية](#5-المراحل-التنفيذية)
6. [تفاصيل صفحات الموقع](#6-تفاصيل-صفحات-الموقع)
7. [نماذج البيانات](#7-نماذج-البيانات)
8. [واجهة برمجة التطبيقات](#8-واجهة-برمجة-التطبيقات)
9. [معايير الجودة](#9-معايير-الجودة)

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

### ما يميز هذا المشروع عن المرجع الرئيسي (PWA)

| الجانب | المرجع الرئيسي (PWA) | ملاحظاتي (web-notes-e1) |
|--------|----------------------|-------------------------|
| الإطار | React + Vite (SPA) | Next.js App Router (SSR/SSG) |
| اللغة | JavaScript | TypeScript (صارم) |
| المكتبة | بدون مكتبة UI | Material UI (MUI) |
| المصادقة | بدون مصادقة | JWT + bcrypt |
| قاعدة البيانات | MongoDB (مباشر) | MongoDB + Mongoose + Repository Pattern |
| الملاحظات | صوتية فقط | نصية + صوتية |
| الإشعارات | إشعارات عامة | إشعارات مخصصة (تسجيل دخول من جهاز جديد) |
| التخزين المحلي | Dexie (IndexedDB) | Dexie أو idb (IndexedDB) |
| اللغات | عربي فقط | عربي + إنجليزي (i18n) |
| الوضع المظلم | غير مدعوم | مدعوم بالكامل |
| الاختبارات | بدون اختبارات | اختبارات شاملة (Vitest) |
| التوثيق | بدون توثيق | توثيق كامل |

---

## 2. التقنيات والأدوات

### الحزمة التقنية الأساسية

| الطبقة | التقنية | الإصدار (المتوقع) | السبب |
|--------|---------|-------------------|-------|
| **الإطار** | Next.js (App Router) | 15.x | SSR/SSG، API Routes مدمجة، أداء ممتاز، SEO |
| **اللغة** | TypeScript | 5.x | أمان الأنواع، توثيق ذاتي، تقليل الأخطاء |
| **واجهة المستخدم** | Material UI (MUI) | 7.x | مكتبة مكونات ناضجة، دعم RTL، بنية سمات قوية |
| **CSS-in-JS** | Emotion | 11.x | مطلوب من MUI، دعم RTL عبر stylis-plugin |
| **قاعدة البيانات** | MongoDB | 7.x | مرن، مناسب للملاحظات، متوافق مع المرجع |
| **ORM** | Mongoose | 8.x | نمذجة البيانات، التحقق، الاستعلامات المتقدمة |
| **المصادقة** | JWT + bcrypt | — | معيار المشاريع في مساحة العمل |
| **التخزين المحلي** | Dexie.js | 4.x | واجهة سهلة لـ IndexedDB، متوافق مع المرجع |
| **الإشعارات** | Web Push API + web-push | 3.x | إشعارات فورية عبر Service Worker |
| **تسجيل الصوت** | MediaRecorder API | — | واجهة أصلية للمتصفح (بدون مكتبة خارجية) |
| **الترجمة** | next-intl | 4.x | ترجمة متكاملة مع Next.js App Router |
| **PWA** | next-pwa أو @serwist/next | — | تكامل Service Worker مع Next.js |
| **الاختبارات** | Vitest + Testing Library | 4.x | سريع، متوافق مع Next.js، معيار مساحة العمل |
| **التنسيق** | Prettier | 3.x | معيار مساحة العمل |

### أدوات التطوير

| الأداة | الغرض |
|--------|-------|
| ESLint | تحليل الكود الثابت |
| Prettier | تنسيق الكود (2 مسافات، LF، فاصلة منقوطة) |
| Vitest | تشغيل الاختبارات |
| @testing-library/react | اختبار المكونات |
| GitHub Actions | CI/CD |

---

## 3. البنية المعمارية

### هيكل المجلدات المتوقع

```
web-notes-e1/
├── .github/
│   └── workflows/
│       ├── build-and-deploy.yml
│       └── README.md
├── .gitattributes
├── .gitignore
├── .env.example
├── .prettierrc.json
├── .prettierignore
├── CONTRIBUTING.md
├── format.mjs
├── LICENSE
├── next.config.js              ← ملف JS وليس TS (توافق Heroku)
├── package.json
├── tsconfig.json
├── README.md
├── validate-workflow.mjs
│
├── app/                        ← Next.js App Router
│   ├── layout.tsx              ← التخطيط الجذري (html lang, dir, Providers)
│   ├── page.tsx                ← الصفحة الرئيسية (إعادة توجيه → /notes أو /login)
│   ├── globals.css
│   ├── providers.tsx           ← ThemeProviderWrapper > AuthProvider > children
│   ├── config.ts               ← الثوابت والإعدادات المركزية
│   ├── types.ts                ← جميع واجهات TypeScript
│   │
│   ├── login/
│   │   └── page.tsx            ← صفحة تسجيل الدخول
│   ├── register/
│   │   └── page.tsx            ← صفحة إنشاء حساب
│   ├── notes/
│   │   ├── page.tsx            ← صفحة الملاحظات (قائمة + بحث + تصفية + حذف)
│   │   ├── new/
│   │   │   └── page.tsx        ← صفحة إنشاء ملاحظة جديدة
│   │   └── [id]/
│   │       ├── page.tsx        ← صفحة عرض ملاحظة (قراءة فقط)
│   │       └── edit/
│   │           └── page.tsx    ← صفحة تعديل ملاحظة
│   ├── profile/
│   │   └── page.tsx            ← صفحة الملف الشخصي (stub — المرحلة ٦)
│   │
│   ├── api/                    ← Next.js Route Handlers
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   └── me/
│   │   │       └── route.ts
│   │   ├── users/
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── notes/
│   │   │   ├── route.ts        ← GET (قائمة) + POST (إنشاء)
│   │   │   └── [id]/
│   │   │       └── route.ts    ← GET + PUT + DELETE
│   │   ├── push/
│   │   │   ├── subscribe/
│   │   │   │   └── route.ts
│   │   │   └── send/
│   │   │       └── route.ts
│   │   └── health/
│   │       └── route.ts
│   │
│   ├── components/             ← مكونات واجهة المستخدم
│   │   ├── layout/
│   │   │   ├── AppBar.tsx      ← شريط التطبيق (عنوان + سمة + قائمة مستخدم)
│   │   │   ├── SideBar.tsx     ← قائمة جانبية (responsive drawer)
│   │   │   └── MainLayout.tsx  ← تخطيط رئيسي (AppBar + SideBar + محتوى)
│   │   ├── auth/
│   │   │   └── PrivateRoute.tsx ← حماية الصفحات (redirect to /login)
│   │   ├── notes/
│   │   │   ├── NoteCard.tsx         ← بطاقة ملاحظة (عنوان + نوع + تاريخ + معاينة + تنقل)
│   │   │   ├── NoteList.tsx         ← قائمة الملاحظات (Grid + بحث + تصفية + ترقيم)
│   │   │   ├── NoteEditorForm.tsx   ← نموذج مشترك للإنشاء والتعديل (صفحة كاملة)
│   │   │   ├── RichTextEditor.tsx   ← محرر نصوص متقدم (Tiptap + تمرير داخلي)
│   │   │   ├── VoiceRecorder.tsx    ← مسجل صوتي (MediaRecorder + إيقاف/استئناف + مشغل ناتيف)
│   │   │   └── DeleteConfirmDialog.tsx ← حوار تأكيد الحذف
│   │   ├── profile/
│   │   │   ├── ProfileEditor.tsx
│   │   │   └── DeleteAccountButton.tsx
│   │   └── common/
│   │       ├── Alert.tsx
│   │       ├── Spinner.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── LanguageToggle.tsx
│   │
│   ├── context/
│   │   ├── ThemeContext.tsx     ← MUI Theme + RTL + light/dark + CacheProvider
│   │   └── AuthContext.tsx      ← AuthProvider + JWT state + login/register/logout
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          ← خطاف المصادقة
│   │   ├── useThemeMode.ts     ← خطاف تبديل السمة
│   │   ├── useNotes.ts         ← خطاف إدارة الملاحظات (CRUD + بحث + تصفية)
│   │   └── usePushNotifications.ts
│   │
│   ├── lib/
│   │   ├── api.ts              ← طبقة HTTP Client (fetchApi + typed helpers)
│   │   ├── apiErrors.ts        ← معالجة أخطاء API
│   │   ├── mongodb.ts          ← اتصال MongoDB (singleton)
│   │   ├── auth.ts             ← دوال JWT + bcrypt
│   │   └── webpush.ts          ← إعداد web-push
│   │
│   ├── models/                 ← نماذج Mongoose
│   │   ├── User.ts
│   │   ├── Note.ts             ← + pre('save') consistency guard
│   │   └── Subscription.ts
│   │
│   ├── repositories/           ← طبقة الوصول للبيانات
│   │   ├── repository.interface.ts
│   │   ├── base.repository.ts
│   │   ├── user.repository.ts
│   │   ├── note.repository.ts
│   │   ├── subscription.repository.ts
│   │   └── index.ts
│   │
│   ├── validators/
│   │   └── index.ts
│   │
│   ├── middlewares/
│   │   └── auth.middleware.ts
│   │
│   ├── utils/
│   │   ├── audio.ts            ← مساعدات تحويل الصوت (blobToBase64, createAudioUrl, formatDuration)
│   │   └── notes.ts            ← مساعدات مشتركة (stripHtml, formatDateShort, formatDateLong)
│   │
│   └── tests/
│       ├── setupTests.ts
│       ├── config.test.ts
│       ├── types.test.ts
│       ├── api.test.ts
│       ├── repositories.test.ts
│       ├── validators.test.ts
│       ├── useAuth.test.tsx
│       ├── useThemeMode.test.tsx
│       └── components.test.tsx
│
├── messages/                   ← ملفات الترجمة (next-intl — المرحلة ٧)
│   ├── ar.json
│   └── en.json
│
├── public/
│   ├── manifest.json
│   ├── robots.txt
│   ├── _redirects
│   ├── 404.html
│   ├── sw.js                   ← Service Worker (أو يُولَّد تلقائياً)
│   └── icons/
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       └── icon-512x512.png
│
├── scripts/
│   └── http-smoke.mjs          ← اختبارات HTTP محلية (smoke tests)
│
└── docs/
    ├── project-plan.md         ← هذا الملف
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
        └── lessons/            ← مجلد واحد (SSR — لا فصل server/client)
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

```
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

## 4. المراجع والمصادر

### ترتيب المراجع (بعد التحليل المعمّق)

| الترتيب | المرجع | السبب |
|---------|--------|-------|
| 🏆 **المرجع الرئيسي** | PWA | نفس الفكرة (ملاحظات صوتية + PWA + إشعارات + IndexedDB + MongoDB) |
| 🥇 **المرجع الفرعي ١** | web-learning-e1 (علمني) | نفس الإطار (Next.js + MUI + TypeScript)، نمط السمات، بنية التطبيق |
| 🥈 **المرجع الفرعي ٢** | project-chatapp-e1 (محادثتي) | نمط المستودعات مع MongoDB/Mongoose، المصادقة JWT، إدارة الحالة |
| 🥉 **المرجع الفرعي ٣** | web-booking-e1 (مناسباتي) | TypeScript كامل، نمط المستودعات مع Mongoose، بنية الاختبارات |
| 4️⃣ **المرجع الفرعي ٤** | mobile-recipes-e1 (وصفاتي) | النشر CI/CD، التخزين السحابي، الاختبارات الشاملة |

### ما نأخذ من كل مرجع

| المرجع | ما نستفيد منه | ما نختلف عنه |
|--------|---------------|-------------|
| **PWA** | فكرة التسجيل الصوتي، Dexie/IndexedDB، المزامنة، الإشعارات، Service Worker | الإطار (Next.js بدل Vite)، TypeScript، المصادقة، الاختبارات |
| **علمني** | بنية Next.js App Router، نظام السمات MUI، نمط Context+Hook، Vitest، بنية المجلدات | نوع API (MongoDB CRUD بدل OpenAI)، الترجمة، PWA |
| **محادثتي** | Repository Pattern + Mongoose، JWT auth + bcrypt، Zustand/Context | React Native (نحن Next.js)، Socket.IO (نحن Push API) |
| **مناسباتي** | TypeScript كامل، Repository Interface، بنية الاختبارات، CI/CD | GraphQL (نحن REST)، Bootstrap (نحن MUI) |
| **وصفاتي** | نمط Storage Strategy، CI/CD GitHub Actions، express-validator | PostgreSQL (نحن MongoDB)، Ionic (نحن Next.js) |

---

## 5. المراحل التنفيذية

### نظرة عامة على المراحل

```
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
المرحلة ١٢: CI/CD والنشر
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

- [ ] **٦.١** إنشاء `app/components/profile/ProfileEditor.tsx`:
  - عرض البيانات الحالية
  - تعديل: اسم العرض، البريد الإلكتروني، اسم المستخدم
  - تغيير كلمة المرور (الحالية + الجديدة + التأكيد)
  - اختيار اللغة المفضلة
- [ ] **٦.٢** إنشاء `app/components/profile/DeleteAccountButton.tsx`:
  - زر حذف الحساب مع تأكيد مزدوج
  - عرض تحذير واضح (الحذف نهائي + جميع الملاحظات ستُحذف)
  - إدخال كلمة المرور للتأكيد
- [ ] **٦.٣** إنشاء صفحة الملف الشخصي `profile/page.tsx`:
  - عرض ProfileEditor
  - عرض DeleteAccountButton
  - عرض إحصائيات (عدد الملاحظات، تاريخ الانضمام)
- [ ] **٦.٤** التحقق من عمل جميع العمليات

**الإيداع:** `feat(profile): add profile management and account deletion`

---

### المرحلة ٧: دعم اللغتين (i18n)

**الهدف:** إضافة دعم كامل للعربية والإنجليزية مع تبديل ديناميكي

#### المهام:

- [ ] **٧.١** إعداد `next-intl`:
  - تكوين `i18n.ts` مع اللغات المدعومة (ar, en)
  - تكوين middleware للتوجيه حسب اللغة
  - تحديث `next.config.js` مع إعداد `createNextIntlPlugin`
- [ ] **٧.٢** إنشاء ملفات الترجمة:
  - `messages/ar.json` — جميع النصوص بالعربية
  - `messages/en.json` — جميع النصوص بالإنجليزية
- [ ] **٧.٣** تحديث بنية المسارات لدعم `[locale]`:
  - نقل الصفحات إلى `app/[locale]/`
  - تحديث `layout.tsx` لضبط `lang` و `dir` ديناميكياً
- [ ] **٧.٤** إنشاء `app/components/common/LanguageToggle.tsx`:
  - زر تبديل اللغة في AppBar
  - حفظ تفضيل اللغة
- [ ] **٧.٥** تحديث جميع المكونات لاستخدام `useTranslations()`:
  - استبدال النصوص الثابتة بمفاتيح ترجمة
  - ضبط اتجاه الصفحة (RTL/LTR) حسب اللغة
- [ ] **٧.٦** تحديث رسائل التحقق من المدخلات لدعم اللغتين
- [ ] **٧.٧** التحقق من عمل التبديل بين اللغتين

**الإيداع:** `feat(i18n): add Arabic and English language support with next-intl`

---

### المرحلة ٨: تطبيق الويب التقدمي (PWA)

**الهدف:** تحويل الموقع إلى PWA قابل للتثبيت مع دعم العمل بدون اتصال

#### المهام:

- [ ] **٨.١** إعداد Service Worker:
  - تكوين `@serwist/next` أو `next-pwa`
  - إعداد استراتيجيات التخزين المؤقت (Cache Strategies):
    - HTML: NetworkFirst
    - CSS/JS: StaleWhileRevalidate
    - الصور والأيقونات: CacheFirst
    - API: NetworkFirst مع fallback
- [ ] **٨.٢** إنشاء `public/manifest.json`:
  - اسم التطبيق (ملاحظاتي / My Notes)
  - الأيقونات بجميع الأحجام
  - ألوان السمة
  - وضع العرض (standalone)
  - اتجاه الشاشة
- [ ] **٨.٣** إنشاء أيقونات التطبيق بجميع الأحجام المطلوبة
- [ ] **٨.٤** إعداد التخزين المحلي (IndexedDB عبر Dexie):
  - قاعدة بيانات محلية للملاحظات
  - مخزن مؤقت (offline store)
  - تتبع حالة المزامنة لكل ملاحظة
- [ ] **٨.٥** تنفيذ المزامنة الخلفية (Background Sync):
  - تسجيل أحداث المزامنة في Service Worker
  - مزامنة الملاحظات المحلية مع الخادم عند عودة الاتصال
  - معالجة التعارضات (الآخر يفوز أو إشعار المستخدم)
- [ ] **٨.٦** تحديث طبقة API لدعم Offline:
  - حفظ العمليات محلياً عند فقدان الاتصال
  - عرض حالة الاتصال للمستخدم
  - مزامنة تلقائية عند عودة الاتصال
- [ ] **٨.٧** اختبار:
  - التثبيت على الهاتف والحاسوب
  - العمل بدون اتصال (إنشاء ملاحظة + تعديل + حذف)
  - المزامنة بعد عودة الاتصال

**الإيداع:** `feat(pwa): add service worker, offline support, and background sync`

---

### المرحلة ٩: الإشعارات الفورية (Push Notifications)

**الهدف:** إضافة إشعارات فورية تُرسل عند تسجيل الدخول من جهاز جديد

#### المهام:

- [ ] **٩.١** إنشاء `app/lib/webpush.ts`:
  - إعداد web-push مع مفاتيح VAPID
  - دوال إرسال الإشعارات
- [ ] **٩.٢** إنشاء `app/api/push/subscribe/route.ts`:
  - تسجيل اشتراك الإشعارات (حفظ في قاعدة البيانات)
  - ربط الاشتراك بالمستخدم والجهاز
- [ ] **٩.٣** إنشاء `app/api/push/send/route.ts`:
  - إرسال إشعار لجميع أجهزة المستخدم
  - حذف الاشتراكات المنتهية الصلاحية
- [ ] **٩.٤** تحديث `app/api/auth/login/route.ts`:
  - عند تسجيل الدخول: إرسال إشعار لجميع أجهزة المستخدم الأخرى
  - محتوى الإشعار: "تم تسجيل الدخول إلى حسابك من جهاز جديد"
- [ ] **٩.٥** إنشاء `app/hooks/usePushNotifications.ts`:
  - طلب إذن الإشعارات
  - تسجيل الاشتراك
  - إلغاء الاشتراك
- [ ] **٩.٦** تحديث Service Worker لمعالجة أحداث push:
  - عرض الإشعار بمحتوى مخصص
  - معالجة النقر على الإشعار (فتح التطبيق)
- [ ] **٩.٧** إضافة زر تفعيل/إلغاء الإشعارات في الملف الشخصي
- [ ] **٩.٨** اختبار الإشعارات على أجهزة متعددة

**الإيداع:** `feat(push): add push notifications for login alerts on other devices`

---

### المرحلة ١٠: الاختبارات الشاملة

**الهدف:** كتابة اختبارات شاملة لجميع طبقات التطبيق

#### المهام:

- [ ] **١٠.١** إعداد Vitest:
  - تكوين `vitest.config.ts` (globals, jsdom, setupFiles, coverage)
  - إنشاء `app/tests/setupTests.ts` (localStorage mock, matchMedia mock, fetch mock)
- [ ] **١٠.٢** اختبارات الإعدادات والأنواع:
  - `config.test.ts` — الثوابت والإعدادات المركزية
  - `types.test.ts` — التحقق من شكل الأنواع
- [ ] **١٠.٣** اختبارات التحقق:
  - `validators.test.ts` — جميع دوال التحقق من المدخلات
- [ ] **١٠.٤** اختبارات طبقة API:
  - `api.test.ts` — دوال HTTP Client
- [ ] **١٠.٥** اختبارات المستودعات:
  - `repositories.test.ts` — عمليات CRUD لكل مستودع
- [ ] **١٠.٦** اختبارات الخطافات:
  - `useAuth.test.tsx` — سلوك خطاف المصادقة
  - `useThemeMode.test.tsx` — سلوك خطاف السمة
- [ ] **١٠.٧** اختبارات المكونات:
  - `components.test.tsx` — المكونات الرئيسية
- [ ] **١٠.٨** إنشاء أوامر الاختبار في `package.json`:
  - `test` — تشغيل جميع الاختبارات
  - `test:watch` — وضع المراقبة
  - `test:coverage` — التغطية
- [ ] **١٠.٩** التحقق من نجاح جميع الاختبارات

**الإيداع:** `test: add comprehensive test suite with Vitest`

---

### المرحلة ١١: جودة الكود والتنسيق

**الهدف:** إعداد أدوات جودة الكود والتنسيق الموحد

#### المهام:

- [ ] **١١.١** إنشاء `.prettierrc.json` بالتكوين المعياري:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100,
    "bracketSpacing": true,
    "arrowParens": "always",
    "endOfLine": "lf"
  }
  ```
- [ ] **١١.٢** إنشاء `.prettierignore`
- [ ] **١١.٣** إنشاء `.gitattributes` مع `* text=auto eol=lf`
- [ ] **١١.٤** إنشاء `format.mjs` (سكريبت تنسيق عبر المنصات)
- [ ] **١١.٥** إضافة أوامر التنسيق في `package.json` (`format`, `format:check`)
- [ ] **١١.٦** إنشاء `CONTRIBUTING.md` بجميع الأقسام الثمانية المطلوبة
- [ ] **١١.٧** تشغيل التنسيق على جميع الملفات (`node format.mjs`)
- [ ] **١١.٨** تشغيل `git add --renormalize .`
- [ ] **١١.٩** التحقق من نجاح جميع الاختبارات بعد التنسيق

**الإيداعات:**
1. `chore(format): add Prettier with LF normalization and format all source`
2. `docs: add CONTRIBUTING.md with commit, tag, and formatting standards`

---

### المرحلة ١٢: CI/CD والنشر

**الهدف:** إعداد خط أنابيب CI/CD للاختبار والنشر التلقائي

#### المهام:

- [ ] **١٢.١** إنشاء `.github/workflows/build-and-deploy.yml`:
  - المُشغّلات: push إلى main + workflow_dispatch
  - خدمة MongoDB (service container)
  - خطوات: checkout → setup node → npm ci → test → build → deploy
- [ ] **١٢.٢** إعداد النشر:
  - **الخادم (API):** Heroku أو Render (من فرع orphan `server`)
  - **الواجهة (Web):** Vercel أو GitHub Pages (من فرع orphan `web`)
  - ملاحظة: بما أن المشروع Next.js يمكن نشره كوحدة واحدة على Vercel
- [ ] **١٢.٣** إنشاء `validate-workflow.mjs` — فحص محلي لصحة ملف Workflow
- [ ] **١٢.٤** إنشاء `.github/workflows/README.md` — دليل إعداد CI/CD
- [ ] **١٢.٥** اختبار الخط بالكامل (push → tests → build → deploy)

**الإيداع:** `ci: add GitHub Actions workflow for testing and deployment`

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
- [ ] **١٣.١٠** تحديث التوثيقات العامة (`docs/` workspace):
  - تحديث `README.md` لإضافة المشروع الجديد
  - تحديث `environment-variables-guide.md`
  - تحديث `ai-tutorials-guide.md` (إضافة المشروع الجديد)

**الإيداعات:**
1. `docs: add comprehensive project documentation`
2. `docs(ai): add architecture, feature guide, and AI README`
3. `docs(tutorials): add complete tutorial series (13 lessons)`

---

## 6. تفاصيل صفحات الموقع

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

## 7. نماذج البيانات

### المستخدم (User)

| الحقل | النوع | الوصف | القيود |
|-------|-------|-------|--------|
| `_id` | ObjectId | المعرف الفريد | تلقائي |
| `username` | String | اسم المستخدم | فريد، مطلوب، 3-30 حرف |
| `email` | String | البريد الإلكتروني | فريد، مطلوب، صيغة صحيحة |
| `password` | String | كلمة المرور (مشفرة bcrypt) | مطلوب، 6+ أحرف |
| `displayName` | String | اسم العرض | اختياري |
| `language` | String | اللغة المفضلة | `'ar'` \| `'en'`، افتراضي `'ar'` |
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

## 8. واجهة برمجة التطبيقات (API)

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
// نجاح
{
  "data": { ... },
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
    "message": "البريد الإلكتروني مطلوب، كلمة المرور يجب أن تكون 6 أحرف على الأقل"
  }
}
```

---

## 9. معايير الجودة

### معايير عامة (من التوثيقات العامة)

- [ ] نمط المستودعات (Repository Pattern) لجميع عمليات قاعدة البيانات
- [ ] طبقة تحقق منفصلة عن منطق الأعمال
- [ ] معالجة أخطاء مركزية مع رسائل عربية للمستخدم
- [ ] TypeScript صارم في جميع الملفات
- [ ] اختبارات شاملة (وحدة + تكامل)
- [ ] تنسيق Prettier موحد مع LF
- [ ] التزامات Git بصيغة Conventional Commits (إنجليزي فقط)
- [ ] العلامات المرجعية (Tags) تحديثية فقط في النقاط المهمة
- [ ] التوثيقات التعليمية بالعربية، أسماء الملفات بالإنجليزية
- [x] استقلالية الكود: لا يُذكر أي مشروع مرجعي أو مقارنة داخل أكواد المشروع أو تعليقاته. ملف الخطة (`project-plan.md`) هو المكان الوحيد المسموح فيه بذكر المراجع
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
# قاعدة البيانات
DATABASE_URL=mongodb://localhost:27017/mynotes

# المصادقة
JWT_SECRET=your_jwt_secret_key_change_in_production

# الخادم
PORT=3000
NODE_ENV=development

# إشعارات Web Push (VAPID)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:your-email@example.com

# Next.js العامة (متاحة في المتصفح)
NEXT_PUBLIC_APP_NAME=ملاحظاتي
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

> **آخر تحديث:** مارس ٢٠٢٦
> **الإصدار:** ١.٠.٠ (خطة أولية)
