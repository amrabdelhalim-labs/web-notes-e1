# خطة التوثيق الشامل — مشروع ملاحظاتي 📝

> **المستودع:** `web-notes-e1`
> **الإصدار:** `v0.1.0` — الإصدار المستقر الأول (Offline-First PWA)
> **الحالة:** ٥٧٣ اختبار ✅ — ٣٩ ملف اختبار — التطوير مكتمل بالكامل
> **تاريخ الإنشاء:** مارس ٢٠٢٦

---

## جدول المحتويات

1. [الرؤية والأهداف](#1-الرؤية-والأهداف)
2. [أنواع التوثيق](#2-أنواع-التوثيق)
3. [البنية المستهدفة](#3-البنية-المستهدفة)
4. [التوثيقات الانتاجية — التفاصيل والترتيب](#4-التوثيقات-الانتاجية--التفاصيل-والترتيب)
5. [التوثيقات التعليمية — التفاصيل والترتيب](#5-التوثيقات-التعليمية--التفاصيل-والترتيب)
6. [الجرد الكامل لملفات المشروع](#6-الجرد-الكامل-لملفات-المشروع)
7. [توزيع الملفات على الدروس التعليمية](#7-توزيع-الملفات-على-الدروس-التعليمية)
8. [استراتيجية الربط التبادلي](#8-استراتيجية-الربط-التبادلي)
9. [معايير الجودة والمراجعة](#9-معايير-الجودة-والمراجعة)
10. [خطة التنفيذ والإيداعات](#10-خطة-التنفيذ-والإيداعات)

---

## 1. الرؤية والأهداف

### المبدأ التوجيهي

> تخيل نفسك في مقام مدرّس ذي خبرة عالية تساعد مبتدئًا يتعامل مع هذا المشروع لأول مرة، وتعطيه مفاهيم عميقة مستنبطة من الكود.

### الأهداف

| الهدف | الوصف |
|-------|-------|
| **شمولية كاملة** | توثيق كل ملف في المشروع سطرًا بسطر، بترتيب منطقي مبني على المعمارية وتدفق التنفيذ |
| **نوعان متكاملان** | توثيقات تعليمية (للتعلم) + توثيقات انتاجية (للمرجعية والنشر) |
| **ربط سلس** | كل وثيقة تربط بالوثائق ذات العلاقة ذهابًا وإيابًا |
| **استقلالية** | لا مقارنات مع مشاريع أخرى — كل وثيقة مكتفية بذاتها |
| **ثنائية اللغة المنهجية** | النثر بالعربية، أسماء الملفات بالإنجليزية، الكود كما هو مع تعليقات عربية |

### الجمهور المستهدف

| النوع | الجمهور | مستوى الخبرة |
|-------|---------|-------------|
| **التعليمي** | مطور مبتدئ يتعلم بناء تطبيقات ويب حقيقية | مبتدئ → متوسط |
| **الانتاجي** | مطور يريد فهم المشروع أو المساهمة فيه أو نشره | متوسط → متقدم |
| **AI** | أدوات الذكاء الاصطناعي التي تعدل الكود | — |

---

## 2. أنواع التوثيق

### ٢.١ التوثيقات الانتاجية (Production Documentation)

توثيقات مرجعية تقنية تخدم المطور الذي يريد فهم المشروع بسرعة، المساهمة فيه، أو نشره.

| الملف | الغرض | اللغة |
|-------|-------|-------|
| `README.md` (جذر المشروع) | بطاقة المشروع + التثبيت + الأوامر + البنية | عربي + إنجليزي |
| `docs/api-endpoints.md` | جميع مسارات API مع أمثلة | عربي |
| `docs/database-abstraction.md` | شرح نمط المستودعات وطبقة البيانات | عربي |
| `docs/repository-quick-reference.md` | مرجع سريع لعمليات المستودعات | عربي |
| `docs/testing.md` | استراتيجية الاختبار + الأوامر + التغطية | عربي |
| `docs/deployment.md` | خطوات النشر على Heroku وDocker + المتغيرات البيئية | عربي |
| `docs/pwa-guide.md` | دليل PWA: Service Worker، التخزين المحلي، المزامنة، الإشعارات | عربي |
| `docs/ai/README.md` | بطاقة هوية المشروع + القواعد الحاسمة + مواقع الملفات | إنجليزي |
| `docs/ai/architecture.md` | مخطط الطبقات + الأنماط + تدفق البيانات الكامل | إنجليزي |
| `docs/ai/feature-guide.md` | دليل إضافة ميزة جديدة خطوة بخطوة | إنجليزي |

### ٢.٢ التوثيقات التعليمية (Educational Tutorials)

دروس تفصيلية تشرح كل ملف في المشروع سطرًا بسطر، مرتبة ترتيبًا منطقيًا (الأساسيات ثم الطبقات ثم سيناريوهات التشغيل ثم الاختبارات).

| الملف | الغرض |
|-------|-------|
| `docs/tutorials/README.md` | فهرس الدروس + لمحة تقنية + مسارات التعلم |
| `docs/tutorials/concepts-guide.md` | شرح كل مفهوم تقني من الصفر للمبتدئ |
| `docs/tutorials/quick-reference.md` | مرجع سريع + جداول الأوامر + روابط لكل درس |
| `docs/tutorials/lessons/01-*.md` → `13-*.md` | ١٣ درسًا تعليميًا (تفاصيل في القسم ٥) |

---

## 3. البنية المستهدفة

```text
web-notes-e1/
├── README.md  // بطاقة المشروع (يُحدَّث)
├── CONTRIBUTING.md  // موجود (لا تغيير)
│
├── docs/
│   ├── plans/
│   │   ├── project-plan.md  // خطة البناء (موجود — نُقل إلى هنا)
│   │   └── documentation-plan.md  // هذا الملف (خطة التوثيق)
│   │
│   ├── api-endpoints.md  // مرجع API كامل
│   ├── database-abstraction.md  // شرح طبقة البيانات
│   ├── repository-quick-reference.md  // مرجع سريع للمستودعات
│   ├── testing.md  // استراتيجية الاختبار
│   ├── deployment.md  // دليل النشر
│   ├── pwa-guide.md  // دليل PWA الشامل
│   │
│   ├── ai/  // توثيقات لأدوات AI (إنجليزي)
│   │   ├── README.md
│   │   ├── architecture.md
│   │   └── feature-guide.md
│   │
│   └── tutorials/  // التوثيقات التعليمية (عربي)
│       ├── README.md
│       ├── concepts-guide.md
│       ├── quick-reference.md
│       └── lessons/  // مجلد واحد (مشروع SSR — لا فصل server/client)
│           ├── 01-project-setup.md
│           ├── 02-database-models.md
│           ├── 03-repository-pattern.md
│           ├── 04-authentication.md
│           ├── 05-api-routes.md
│           ├── 06-theme-system.md
│           ├── 07-internationalization.md
│           ├── 08-notes-crud.md
│           ├── 09-voice-recording.md
│           ├── 10-pwa-service-worker.md
│           ├── 11-push-notifications.md
│           ├── 12-offline-sync.md
│           └── 13-testing.md
```

> **ملاحظة بنيوية:** هذا مشروع SSR (Next.js) — نستخدم مجلد `lessons/` واحدًا وليس فصل `server/` و`client/` (وفق القسم 3.2 من `ai-tutorials-guide.md`).

---

## 4. التوثيقات الانتاجية — التفاصيل والترتيب

### مرحلة ٤-أ: `README.md` (جذر المشروع)

**المحتوى المطلوب:**

```markdown
# ملاحظاتي — تطبيق ويب تقدمي للملاحظات 📝

## لمحة عامة
## الميزات الرئيسية
## الحزمة التقنية (جدول)
## التثبيت والتشغيل المحلي
  - المتطلبات المسبقة
  - الاستنساخ والتثبيت
  - إعداد المتغيرات البيئية
  - تشغيل خادم التطوير
## هيكل المجلدات (شجرة مبسطة)
## الأوامر المتاحة (جدول: test, format, validate, smoke, build, dev)
## الاختبارات (573 اختبار — 39 ملف)
## النشر (Heroku وDocker)
## التوثيق (روابط لكل ملف في docs/)
## المساهمة (رابط CONTRIBUTING.md)
## الترخيص
```

### مرحلة ٤-ب: التوثيقات التقنية

**ترتيب الكتابة** (من الأعلى تأثيرًا إلى الأقل — كل وثيقة تبني على سابقتها):

| الترتيب | الملف | يغطي | يعتمد على |
|---------|-------|-------|-----------|
| 1 | `api-endpoints.md` | ١٢ مسار API + أمثلة الطلبات والاستجابات + رموز الأخطاء | — |
| 2 | `database-abstraction.md` | ٤ نماذج + نمط المستودعات + الطبقات | `api-endpoints.md` |
| 3 | `repository-quick-reference.md` | جميع عمليات المستودعات مع أمثلة كود | `database-abstraction.md` |
| 4 | `pwa-guide.md` | SW + Dexie + المزامنة + الإشعارات + بصمة صفرية | — |
| 5 | `testing.md` | استراتيجية + إعداد Vitest + أعداد + أوامر | — |
| 6 | `deployment.md` | Heroku وDocker + المتغيرات البيئية + الإعداد + المراقبة | `testing.md` |

### مرحلة ٤-ج: توثيقات AI (`docs/ai/`)

| الملف | المحتوى |
|-------|---------|
| `README.md` | اسم المشروع، الحزمة التقنية، القواعد الحاسمة (لا أيقونات Next.js، CJS config، LF)، مواقع الملفات الأساسية، أوامر الاختبار، المتغيرات البيئية، عدد الاختبارات |
| `architecture.md` | مخطط الطبقات الكامل (ASCII)، كل طبقة مع أنماطها، تدفق البيانات لـ: إنشاء ملاحظة online، إنشاء ملاحظة offline + مزامنة، تسجيل دخول + إشعار |
| `feature-guide.md` | ٨ خطوات لإضافة كيان جديد: نموذج → مستودع → تحقق → API Route → خطاف → مكون → ترجمة → اختبار |

---

## 5. التوثيقات التعليمية — التفاصيل والترتيب

### ٥.١ المبادئ الأساسية للدروس

هذه المبادئ مستمدة من `ai-tutorials-guide.md` (القسمان ٢ و ٤):

| المبدأ | التفصيل |
|--------|---------|
| **هدف الدرس** | كل درس يبدأ بـ blockquote واحد: `> هدف الدرس: ...` |
| **من البسيط إلى المعقد** | كل قسم يبدأ بالمفهوم ثم التنفيذ ثم الحالات الحدية |
| **تشبيه واحد على الأقل** | لكل نمط مجرد تشبيه محلي طبيعي يقرب المفهوم |
| **جدول واحد على الأقل** | كل درس يحتوي جدولًا واحدًا على الأقل (ملخص، مقارنة، أو مرجع) |
| **الكود كما هو** | كتل الكود تُنسخ من المصدر مع تعليقات عربية |
| **ملخص** | كل درس ينتهي بقسم "ملخص" فيه جدول ما تعلمناه |
| **لا مقارنات** | لا يُذكر أي مشروع آخر — التوثيق مكتفٍ بذاته |
| **الاختبار آخرًا** | درس الاختبار هو الأخير دائمًا (درس ١٣) |

### ٥.٢ قالب الدرس (Template)

```markdown
# الدرس XX: [عنوان الدرس بالعربية]

> هدف الدرس: [جملة واحدة تصف ما سيتعلمه القارئ]

---

## 1. [المفهوم الأول]
### ١.١ [الفكرة]
[شرح نثري + تشبيه]
### ١.٢ [التنفيذ في ملاحظاتي]
```
// تعليق عربي يشرح ما يفعله هذا السطر
const example = 'code';
‎```
### ١.٣ [شرح الكود سطرًا بسطر]

## 2. [المفهوم الثاني]
...

## X. ملخص

| ما تعلمناه | الملف المسؤول |
|------------|--------------|
| ... | ... |

---
*الدرس التالي → [رابط]*
```text

#### `docs/tutorials/README.md`

ملاحظة: الترتيب يتبع المنطق المعماري (كما في خطة البناء), و**داخل كل درس** يكون التسلسل: نقطة الدخول/التهيئة  // منطق المجال  // طبقة التكامل  // عناصر العرض/الاستهلاك.

| # | عنوان الدرس | الملفات المشمولة | إجمالي الأسطر |
|---|------------|-----------------|--------------|
| 01 | إعداد المشروع والبنية الأساسية | `next.config.mjs`, `tsconfig.json`, `package.json`, `eslint.config.mjs`, `.env.example`, `.prettierrc.json`, `vitest.config.ts`, `.gitignore`, `.gitattributes`, `.prettierignore`, `next-env.d.ts`, `layout.tsx`, `page.tsx`, `globals.css`, `config.ts`, `providers.tsx`, `instrumentation.ts`, `proxy.ts`, `i18n/*` | ~٥٥٠ سطر |
| 02 | نماذج قاعدة البيانات | `Note.ts`, `Device.ts`, `User.ts`, `Subscription.ts`, `mongodb.ts`, `types.ts` | ~٤٦٠ سطر |
| 03 | نمط المستودعات | `base.repository.ts`, `index.ts`, `user.repository.ts`, `device.repository.ts`, `subscription.repository.ts`, `note.repository.ts`, `repository.interface.ts` | ~٥١٥ سطر |
| 04 | المصادقة والحماية | `AuthContext.tsx`, `auth.ts`, `auth.middleware.ts`, `PrivateRoute.tsx`, `api/auth/login/route.ts`, `api/auth/register/route.ts`, `api/auth/me/route.ts`, `api/auth/logout/route.ts`, `api/users/[id]/route.ts`, `validators/index.ts`, `apiErrors.ts` | ~١,١٦٠ سطر |
| 05 | مسارات API | `api/devices/route.ts`, `api/notes/route.ts`, `api/notes/[id]/route.ts`, `api/push/subscribe/route.ts`, `api/push/send/route.ts`, `api/health/route.ts`, `api.ts`, `pushUtils.ts`, `webpush.ts` | ~١,٠٢٠ سطر |
| 06 | نظام السمات والتخطيط | `ThemeContext.tsx`, `AppBar.tsx`, `SideBar.tsx`, `MainLayout.tsx`, `EmotionCacheProvider.tsx`, `ThemeToggle.tsx`, `ui-constants.ts` | ~٩٥٠ سطر |
| 07 | الترجمة وثنائية الاتجاه | `ar.json`, `en.json`, `[locale]/layout.tsx`, `[locale]/page.tsx`, `[locale]/not-found.tsx`, `navigation.ts`, `routing.ts`, `request.ts`, `LanguageToggle.tsx`, `LocaleSwitchPromptDialog.tsx` | ~١,١١٠ سطر |
| 08 | واجهة إدارة الملاحظات (CRUD) | `useNotes.ts`, `NoteEditorForm.tsx`, `NoteList.tsx`, `NoteCard.tsx`, `DeleteConfirmDialog.tsx`, `notes/page.tsx`, `notes/new/page.tsx`, `notes/[id]/page.tsx`, `notes/[id]/edit/page.tsx`, `notes.ts (utils)`, `sanitize.ts` | ~١,٩٥٠ سطر |
| 09 | التسجيل الصوتي والمحرر النصي | `RichTextEditor.tsx`, `VoiceRecorder.tsx`, `audio.ts` | ~٨٠٠ سطر |
| 10 | تطبيق الويب التقدمي (PWA) و Service Worker | `PwaActivationContext.tsx`, `PwaActivationDialog.tsx`, `usePwaStatus.ts`, `sw.ts`, `db.ts`, `OfflineBanner.tsx` | ~١,٢٣٠ سطر |
| 11 | الإشعارات الفورية وإدارة الأجهزة | `usePushNotifications.ts`, `useDevices.ts`, `DeviceTrustPrompt.tsx`, `ConnectionIndicator.tsx`, `useDeviceId.ts`, `useOfflineStatus.ts`, `useSyncStatus.ts` | ~١,٥٢٠ سطر |
| 12 | الملف الشخصي وإعدادات الحساب | `ProfileEditor.tsx`, `DeleteAccountDialog.tsx`, `profile/page.tsx`, `register/page.tsx`, `login/page.tsx` | ~١,٥٧٠ سطر |
| 13 | الاختبارات الشاملة | جميع ملفات `tests/*.test.{ts,tsx}` (٣٩ ملف) + `setup.ts` + `utils.tsx` | ~٨,٩٠٠ سطر |

### ٥.٤ الملفات المساندة

### ٥.٣ فهرس الدروس (١٣ درسًا)

```
# توثيقات تعليمية — مشروع ملاحظاتي 📝
> شروحات تفصيلية سطرًا بسطر لكل أجزاء المشروع

## لمحة عن المشروع
[جدول: الحزمة التقنية]

## فهرس الدروس
### الدروس (lessons/)
[جدول: رقم + عنوان + وصف مختصر + رابط]

### المراجع
| الملف | الغرض |
|-------|-------|
| `concepts-guide.md` | شرح كل المفاهيم من الصفر |
| `quick-reference.md` | مرجع سريع وجداول أوامر |

## مسار التعلم المقترح
[مسار ASCII لثلاثة أهداف مختلفة: مبتدئ كامل / مطور يريد فهم PWA / مطور يريد فهم الاختبارات]

*جميع الشروحات بالعربية — أسماء الملفات بالإنجليزية*
```text

#### `docs/tutorials/concepts-guide.md`

يشرح كل مفهوم تقني مُستخدم في المشروع من الصفر. الأقسام المطلوبة:

| القسم | المفاهيم |
|-------|---------|
| **أطر العمل** | Next.js App Router, SSR vs CSR vs SSG, API Routes |
| **اللغات والأنواع** | TypeScript, الأنواع الصارمة, Generics, Type Guards |
| **واجهة المستخدم** | React, MUI (Material UI), Emotion CSS-in-JS, RTL |
| **قاعدة البيانات** | MongoDB, Mongoose, Schema/Model, التفهرس (Indexing), المعاملات (Transactions) |
| **نمط المستودعات** | Repository Pattern, Singleton, واجهة عامة (Generic Interface) |
| **المصادقة** | JWT, bcrypt, Middleware, Protected Routes |
| **التخزين المحلي** | IndexedDB, Dexie.js, Cache API |
| **PWA** | Service Worker, Manifest, استراتيجيات التخزين, بصمة صفرية |
| **المزامنة** | Background Sync, معالجة التعارضات, processQueue |
| **الإشعارات** | Web Push API, VAPID, Push Subscription |
| **الترجمة** | next-intl, الرسائل (Messages), RTL/LTR |
| **الاختبار** | Vitest, Testing Library, Mocking, AAA Pattern |
| **أنماط التصميم** | Context + Hook, Optimistic UI, Mutex, State Machine |
| **جودة الكود** | Prettier, ESLint, Conventional Commits, Annotated Tags |
| **النشر** | Heroku وDocker, المتغيرات البيئية, CI/CD |

#### `docs/tutorials/quick-reference.md`

مرجع سريع يحتوي:

- **خريطة الملفات**: جدول بكل ملف مصدري ودرسه التعليمي ووصفه المختصر
- **الأوامر**: جدول أوامر npm (dev, build, test, format, validate, smoke)
- **مسارات API**: جدول سريع (method + path + auth)
- **روابط الدروس**: ١٣ رابطًا مع وصف سطر واحد
- **مفاتيح الترجمة**: قائمة النطاقات (Namespaces) مع أمثلة
- **نقاط فحص التعلم**: قائمة تحقق (checklist) لكل درس

---

## 6. الجرد الكامل لملفات المشروع

### ٦.١ ملفات المصدر (مرتبة منطقيًا حسب الطبقات)

> هذا الجرد يُستخدم للتخطيط والربط فقط. أولوية الشرح تكون حسب المنطق المعماري وتدفق البيانات, وليس حسب حجم الملف.

#### المكونات (Components) — ٢٠ ملف

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `components/profile/ProfileEditor.tsx` | 932 | 12 |
| 2 | `components/common/ConnectionIndicator.tsx` | 802 | 11 |
| 3 | `components/notes/RichTextEditor.tsx` | 423 | 09 |
| 4 | `components/notes/VoiceRecorder.tsx` | 333 | 09 |
| 5 | `components/notes/NoteEditorForm.tsx` | 246 | 08 |
| 6 | `components/common/PwaActivationDialog.tsx` | 228 | 10 |
| 7 | `components/notes/NoteList.tsx` | 184 | 08 |
| 8 | `components/layout/SideBar.tsx` | 165 | 06 |
| 9 | `components/layout/AppBar.tsx` | 162 | 06 |
| 10 | `components/profile/DeleteAccountDialog.tsx` | 161 | 12 |
| 11 | `components/common/DeviceTrustPrompt.tsx` | 146 | 11 |
| 12 | `components/notes/NoteCard.tsx` | 126 | 08 |
| 13 | `components/common/OfflineBanner.tsx` | 80 | 10 |
| 14 | `components/layout/MainLayout.tsx` | 79 | 06 |
| 15 | `components/common/LocaleSwitchPromptDialog.tsx` | 73 | 07 |
| 16 | `components/notes/DeleteConfirmDialog.tsx` | 67 | 08 |
| 17 | `components/common/LanguageToggle.tsx` | 47 | 07 |
| 18 | `components/auth/PrivateRoute.tsx` | 47 | 04 |
| 19 | `components/layout/EmotionCacheProvider.tsx` | 40 | 06 |
| 20 | `components/common/ThemeToggle.tsx` | 29 | 06 |

#### الخطافات (Hooks) — ٩ ملفات

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `hooks/useNotes.ts` | 617 | 08 |
| 2 | `hooks/usePwaStatus.ts` | 275 | 10 |
| 3 | `hooks/useDevices.ts` | 167 | 11 |
| 4 | `hooks/usePushNotifications.ts` | 158 | 11 |
| 5 | `hooks/useOfflineStatus.ts` | 139 | 11 |
| 6 | `hooks/useDeviceId.ts` | 57 | 11 |
| 7 | `hooks/useSyncStatus.ts` | 52 | 11 |
| 8 | `hooks/useAuth.ts` | 15 | 04 |
| 9 | `hooks/useThemeMode.ts` | 15 | 06 |

#### السياقات (Contexts) — ٣ ملفات

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `context/ThemeContext.tsx` | 428 | 06 |
| 2 | `context/AuthContext.tsx` | 357 | 04 |
| 3 | `context/PwaActivationContext.tsx` | 267 | 10 |

#### المكتبات (Libraries) — ١٠ ملفات

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `lib/db.ts` | 225 | 10 |
| 2 | `lib/api.ts` | 177 | 05 |
| 3 | `utils/sanitize.ts` | 143 | 08 |
| 4 | `lib/warmUpCache.ts` | 134 | 10 |
| 5 | `lib/webpush.ts` | 82 | 05 |
| 6 | `lib/mongodb.ts` | 79 | 02 |
| 7 | `lib/pushUtils.ts` | 69 | 05 |
| 8 | `lib/apiErrors.ts` | 56 | 04 |
| 9 | `lib/ui-constants.ts` | 51 | 06 |
| 10 | `lib/auth.ts` | 39 | 04 |

#### المدخلات والتحقق (Validators + Utils) — ٣ ملفات

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `validators/index.ts` | 163 | 04 |
| 2 | `utils/notes.ts` | 64 | 08 |
| 3 | `utils/audio.ts` | 43 | 09 |

#### النماذج (Models) — ٤ ملفات

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `models/Note.ts` | 65 | 02 |
| 2 | `models/Device.ts` | 54 | 02 |
| 3 | `models/User.ts` | 52 | 02 |
| 4 | `models/Subscription.ts` | 46 | 02 |

#### المستودعات (Repositories) — ٧ ملفات

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `repositories/base.repository.ts` | 107 | 03 |
| 2 | `repositories/note.repository.ts` | 93 | 03 |
| 3 | `repositories/index.ts` | 80 | 03 |
| 4 | `repositories/user.repository.ts` | 79 | 03 |
| 5 | `repositories/device.repository.ts` | 54 | 03 |
| 6 | `repositories/subscription.repository.ts` | 53 | 03 |
| 7 | `repositories/repository.interface.ts` | 49 | 03 |

#### مسارات API — ١٢ ملفًا

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `api/devices/route.ts` | 179 | 05 |
| 2 | `api/users/[id]/route.ts` | 168 | 04 |
| 3 | `api/notes/[id]/route.ts` | 165 | 05 |
| 4 | `api/notes/route.ts` | 125 | 05 |
| 5 | `api/auth/login/route.ts` | 100 | 04 |
| 6 | `api/push/subscribe/route.ts` | 98 | 05 |
| 7 | `api/push/send/route.ts` | 80 | 05 |
| 8 | `api/auth/register/route.ts` | 69 | 04 |
| 9 | `api/auth/logout/route.ts` | 66 | 04 |
| 10 | `api/health/route.ts` | 48 | 05 |
| 11 | `api/auth/me/route.ts` | 43 | 04 |
| 12 | `middlewares/auth.middleware.ts` | 51 | 04 |

#### صفحات الموقع — ١٢ ملفًا

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `[locale]/notes/[id]/page.tsx` | 211 | 08 |
| 2 | `[locale]/profile/page.tsx` | 187 | 12 |
| 3 | `[locale]/register/page.tsx` | 161 | 12 |
| 4 | `[locale]/login/page.tsx` | 131 | 12 |
| 5 | `[locale]/not-found.tsx` | 123 | 07 |
| 6 | `[locale]/notes/page.tsx` | 121 | 08 |
| 7 | `[locale]/notes/[id]/edit/page.tsx` | 116 | 08 |
| 8 | `[locale]/layout.tsx` | 98 | 07 |
| 9 | `[locale]/notes/new/page.tsx` | 54 | 08 |
| 10 | `[locale]/page.tsx` | 31 | 07 |
| 11 | `app/layout.tsx` | 12 | 01 |
| 12 | `app/page.tsx` | 13 | 01 |

#### الأنواع والإعدادات — ٣ ملفات

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `types.ts` | 161 | 02 |
| 2 | `globals.css` | 95 | 01 |
| 3 | `config.ts` | 13 | 01 |

#### ملفات i18n — ٤ ملفات

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `messages/ar.json` | 350 | 07 |
| 2 | `messages/en.json` | 350 | 07 |
| 3 | `i18n/request.ts` | 16 | 07 |
| 4 | `i18n/routing.ts` | 8 | 07 |

#### ملفات البنية التحتية — ٥ ملفات

| # | الملف | الأسطر | الدرس |
|---|-------|--------|-------|
| 1 | `sw.ts` | 153 | 10 |
| 2 | `providers.tsx` | 57 | 01 |
| 3 | `instrumentation.ts` | 52 | 01 |
| 4 | `proxy.ts` | 20 | 07 |
| 5 | `lib/navigation.ts` | 15 | 07 |

#### الاختبارات — ٣٩ ملف اختبار + ٢ ملف إعداد

| # | الملف | الأسطر |
|---|-------|--------|
| 1 | `tests/useNotes.test.ts` | 1146 |
| 2 | `tests/ProfileEditor.test.tsx` | 740 |
| 3 | `tests/ConnectionIndicator.test.tsx` | 520 |
| 4 | `tests/usePwaStatus.test.ts` | 505 |
| 5 | `tests/useDevices.test.ts` | 471 |
| 6 | `tests/warmUpCache.test.ts` | 304 |
| 7 | `tests/devicesRoute.test.ts` | 288 |
| 8 | `tests/register.test.tsx` | 278 |
| 9 | `tests/apiClient.test.ts` | 269 |
| 10 | `tests/login.test.tsx` | 276 |
| 11 | `tests/DeleteAccountDialog.test.tsx` | 266 |
| 12 | `tests/validators.test.ts` | 268 |
| 13 | `tests/ProfilePage.test.tsx` | 234 |
| 14 | `tests/useSyncStatus.test.ts` | 272 |
| 15 | `tests/NoteEditorForm.test.tsx` | 226 |
| 16 | `tests/PwaActivationDialog.test.tsx` | 187 |
| 17 | `tests/types.test.ts` | 168 |
| 18 | `tests/AppBar.test.tsx` | 168 |
| 19 | `tests/NoteDetailPage.test.tsx` | 165 |
| 20 | `tests/EditNotePage.test.tsx` | 162 |
| 21 | `tests/NoteList.test.tsx` | 155 |
| 22 | `tests/offlineLogout.test.tsx` | 154 |
| 23 | `tests/deviceApi.test.ts` | 145 |
| 24 | `tests/useOfflineStatus.test.ts` | 130 |
| 25 | `tests/NotesPage.test.tsx` | 118 |
| 26 | `tests/useDeviceId.test.ts` | 122 |
| 27 | `tests/ThemeContext.test.tsx` | 114 |
| 28 | `tests/NoteCard.test.tsx` | 110 |
| 29 | `tests/NewNotePage.test.tsx` | 106 |
| 30 | `tests/useAuth.test.tsx` | 98 |
| 31 | `tests/SideBar.test.tsx` | 100 |
| 32 | `tests/PrivateRoute.test.tsx` | 89 |
| 33 | `tests/DeleteConfirmDialog.test.tsx` | 87 |
| 34 | `tests/noteUtils.test.ts` | 88 |
| 35 | `tests/setup.ts` | 64 |
| 36 | `tests/LanguageToggle.test.tsx` | 62 |
| 37 | `tests/audioUtils.test.ts` | 69 |
| 38 | `tests/ThemeToggle.test.tsx` | 51 |
| 39 | `tests/config.test.ts` | 52 |
| 40 | `tests/OfflineBanner.test.tsx` | 44 |
| 41 | `tests/utils.tsx` | 34 |

#### ملفات الجذر (Root Config) — ١٤ ملفًا

| # | الملف | الأسطر |
|---|-------|--------|
| 1 | `CONTRIBUTING.md` | 199 |
| 2 | `package.json` | 68 |
| 3 | `.gitignore` | 41 |
| 4 | `tsconfig.json` | 35 |
| 5 | `next.config.mjs` | 30 |
| 6 | `README.md` | 23 |
| 7 | `.gitattributes` | 20 |
| 8 | `vitest.config.ts` | 18 |
| 9 | `eslint.config.mjs` | 16 |
| 10 | `.env.example` | 15 |
| 11 | `.prettierrc.json` | 10 |
| 12 | `next-env.d.ts` | 5 |
| 13 | `.prettierignore` | 5 |
| 14 | `LICENSE` | 17 |

#### السكربتات (Scripts) — ٥ ملفات

| # | الملف | الأسطر |
|---|-------|--------|
| 1 | `scripts/validate-workflow.mjs` | 159 |
| 2 | `scripts/http-smoke.mjs` | 141 |
| 3 | `scripts/generate-icons.mjs` | 107 |
| 4 | `scripts/format.mjs` | 37 |
| 5 | `scripts/convert-icons.mjs` | 30 |

### ٦.٢ ملخص الإحصائيات

| الفئة | عدد الملفات | إجمالي الأسطر (تقريبًا) |
|-------|------------|----------------------|
| المكونات | 20 | ~٤,٦٠٠ |
| الخطافات | 9 | ~١,٥٠٠ |
| السياقات | 3 | ~١,٠٥٠ |
| المكتبات والأدوات | 13 | ~١,٣٢٥ |
| النماذج | 4 | ~٢١٧ |
| المستودعات | 7 | ~٥١٥ |
| مسارات API | 12 | ~١,١٩٠ |
| الصفحات | 12 | ~١,٢٥٨ |
| الأنواع والإعدادات | 3 | ~٢٦٩ |
| الترجمة (i18n) | 4 | ~٧٢٤ |
| البنية التحتية | 5 | ~٢٩٧ |
| **الاختبارات** | **41** | **~٨,٩٠٠** |
| ملفات الجذر | 14 | ~٥٠٠ |
| السكربتات | 5 | ~٤٧٤ |
| **الإجمالي** | **~١٥٢ ملفًا** | **~٢٢,٨٠٠ سطر** |

---

## 7. توزيع الملفات على الدروس التعليمية

### الدرس 01: إعداد المشروع والبنية الأساسية

> هدف الدرس: فهم البنية الأساسية لمشروع Next.js مع TypeScript و MUI وكيف تترابط ملفات الإعداد.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `package.json` | 68 | تعريف المشروع, الأوامر, التبعيات, وبيئة التشغيل |
| 2 | `.env.example` | 15 | المتغيرات البيئية المطلوبة قبل أي تشغيل |
| 3 | `tsconfig.json` | 35 | إعدادات TypeScript ومسارات الاستيراد |
| 4 | `next.config.mjs` | 30 | تكوين Next.js وإضافات PWA/i18n |
| 5 | `eslint.config.mjs` | 16 | قواعد الجودة والتحقق الثابت |
| 6 | `.prettierrc.json` | 10 | معيار التنسيق الموحد |
| 7 | `.prettierignore` | 5 | استثناءات التنسيق |
| 8 | `.gitattributes` | 20 | توحيد نهايات الأسطر LF عبر الأنظمة |
| 9 | `next-env.d.ts` | 5 | أنواع Next.js الأساسية |
| 10 | `app/layout.tsx` | 12 | نقطة دخول غلاف التطبيق |
| 11 | `providers.tsx` | 57 | ربط مزودي الحالة والسياق |
| 12 | `app/page.tsx` | 13 | إعادة التوجيه للجذر حسب سياسة اللغة |
| 13 | `globals.css` | 95 | الأساس البصري العام للتطبيق |
| 14 | `config.ts` | 13 | الثوابت المركزية المشتركة |
| 15 | `proxy.ts` | 20 | توجيه اللغة على مستوى الطلب |
| 16 | `instrumentation.ts` | 52 | تهيئة مراقبة الخادم والاتصال |
| 17 | `vitest.config.ts` | 18 | تهيئة الاختبارات من البداية |

**المكمّلات:** نظرة سريعة على `scripts/` (بدون شرح سطر-بسطر — تُوثق في `quick-reference.md`).

---

### الدرس 02: نماذج قاعدة البيانات

> هدف الدرس: فهم كيف نصمم نماذج البيانات باستخدام Mongoose ونربطها مع TypeScript.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `types.ts` | 161 | تعريف عقود البيانات أولاً قبل التنفيذ |
| 2 | `lib/mongodb.ts` | 79 | تأسيس الاتصال قبل تعريف النماذج |
| 3 | `models/User.ts` | 52 | كيان الهوية المستخدم كنقطة ربط لباقي النماذج |
| 4 | `models/Device.ts` | 54 | كيان الأجهزة الموثوقة المرتبط بالمستخدم |
| 5 | `models/Subscription.ts` | 46 | كيان اشتراكات الإشعارات المرتبط بالمستخدم |
| 6 | `models/Note.ts` | 65 | كيان الملاحظات (النص/الصوت) وعلاقات التشغيل الأساسية |

---

### الدرس 03: نمط المستودعات (Repository Pattern)

> هدف الدرس: فهم لماذا ومتى نستخدم نمط المستودعات وكيف ننفذه عمليًا.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `repositories/repository.interface.ts` | 49 | العقد العام أولاً (ماذا يجب أن يوفر أي مستودع) |
| 2 | `repositories/base.repository.ts` | 107 | التطبيق المعياري للعقد على مستوى CRUD |
| 3 | `repositories/user.repository.ts` | 79 | التخصصات المرتبطة بالمستخدم |
| 4 | `repositories/device.repository.ts` | 54 | التخصصات المرتبطة بوثوق الأجهزة |
| 5 | `repositories/subscription.repository.ts` | 53 | التخصصات المرتبطة بالاشتراكات |
| 6 | `repositories/note.repository.ts` | 93 | التخصصات المرتبطة بالملاحظات |
| 7 | `repositories/index.ts` | 80 | واجهة التجميع النهائية (Repository Manager) |

---

### الدرس 04: المصادقة والحماية

> هدف الدرس: بناء نظام مصادقة آمن بالكامل من JWT إلى حماية الصفحات.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `lib/auth.ts` | 39 | الأساس الأمني: JWT + bcrypt |
| 2 | `validators/index.ts` | 163 | التحقق من المدخلات قبل أي منطق أعمال |
| 3 | `middlewares/auth.middleware.ts` | 51 | بوابة الحماية المشتركة لمسارات API |
| 4 | `api/auth/register/route.ts` | 69 | مسار إنشاء الحساب |
| 5 | `api/auth/login/route.ts` | 100 | مسار تسجيل الدخول وإدارة الجهاز |
| 6 | `api/auth/me/route.ts` | 43 | مسار قراءة هوية الجلسة الحالية |
| 7 | `api/auth/logout/route.ts` | 66 | مسار إنهاء الجلسة وتنظيف الحالة |
| 8 | `api/users/[id]/route.ts` | 168 | تحديث/حذف الحساب والعمليات المتسلسلة |
| 9 | `lib/apiErrors.ts` | 56 | توحيد شكل الأخطاء الراجعة |
| 10 | `context/AuthContext.tsx` | 357 | إسقاط قواعد المصادقة على الواجهة |
| 11 | `hooks/useAuth.ts` | 15 | واجهة استهلاك السياق في المكونات |
| 12 | `components/auth/PrivateRoute.tsx` | 47 | حماية الواجهات على مستوى التنقل |

---

### الدرس 05: مسارات API

> هدف الدرس: فهم كيف تُبنى مسارات API في Next.js وكيف تتكامل مع طبقة المستودعات.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `api/health/route.ts` | 48 | نقطة تحقق البنية قبل بقية المسارات |
| 2 | `api/notes/route.ts` | 125 | CRUD التجميعي للملاحظات (list/create) |
| 3 | `api/notes/[id]/route.ts` | 165 | CRUD المفرد (read/update/delete) |
| 4 | `api/devices/route.ts` | 179 | إدارة الأجهزة الموثوقة |
| 5 | `lib/webpush.ts` | 82 | إعداد الإرسال الفعلي للإشعارات |
| 6 | `lib/pushUtils.ts` | 69 | أدوات تحويل وتجهيز بيانات الإشعار |
| 7 | `api/push/subscribe/route.ts` | 98 | تسجيل اشتراكات المتصفح |
| 8 | `api/push/send/route.ts` | 80 | إرسال الإشعار للمشتركين |
| 9 | `lib/api.ts` | 177 | كيف يستهلك العميل كل المسارات السابقة |

---

### الدرس 06: نظام السمات والتخطيط

> هدف الدرس: بناء نظام سمات متكامل (فاتح/داكن + RTL/LTR) وهيكل التخطيط المتجاوب.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `lib/ui-constants.ts` | 51 | ثوابت التخطيط المشتركة كأساس بصري |
| 2 | `components/layout/EmotionCacheProvider.tsx` | 40 | تهيئة Cache الخاصة باتجاه النص |
| 3 | `context/ThemeContext.tsx` | 428 | بناء السمة وإدارتها وربطها بالاتجاه والوضع |
| 4 | `hooks/useThemeMode.ts` | 15 | واجهة استهلاك تبديل السمة في المكونات |
| 5 | `components/common/ThemeToggle.tsx` | 29 | عنصر التحكم UI لتبديل الوضع |
| 6 | `components/layout/AppBar.tsx` | 162 | دمج عناصر التحكم في رأس التطبيق |
| 7 | `components/layout/SideBar.tsx` | 165 | التنقل الجانبي المتجاوب |
| 8 | `components/layout/MainLayout.tsx` | 79 | تجميع الهيكل النهائي للواجهة |

---

### الدرس 07: الترجمة وثنائية الاتجاه (i18n)

> هدف الدرس: تنفيذ دعم كامل للعربية والإنجليزية مع تبديل ديناميكي واتجاه نص تلقائي.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `i18n/routing.ts` | 8 | تعريف اللغات واللغة الافتراضية |
| 2 | `i18n/request.ts` | 16 | تحميل الرسائل حسب اللغة في كل طلب |
| 3 | `proxy.ts` | 20 | تحويل المسارات تلقائيًا إلى locale صحيح |
| 4 | `lib/navigation.ts` | 15 | أدوات التنقل المعرّبة (Link/Router) |
| 5 | `[locale]/layout.tsx` | 98 | غلاف الواجهة متعدد اللغات والاتجاه |
| 6 | `[locale]/page.tsx` | 31 | نقطة الدخول داخل كل لغة |
| 7 | `[locale]/not-found.tsx` | 123 | معالجة 404 ضمن سياق اللغة |
| 8 | `components/common/LanguageToggle.tsx` | 47 | تبديل اللغة يدويًا من الواجهة |
| 9 | `components/common/LocaleSwitchPromptDialog.tsx` | 73 | اقتراح تبديل اللغة بعد تسجيل الدخول |
| 10 | `messages/ar.json` | 350 | قاموس الرسائل العربية |
| 11 | `messages/en.json` | 350 | قاموس الرسائل الإنجليزية |

---

### الدرس 08: واجهة إدارة الملاحظات (CRUD)

> هدف الدرس: بناء نظام كامل لإنشاء وعرض وتعديل وحذف الملاحظات مع بحث وتصفية.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `utils/notes.ts` | 64 | أدوات العرض الأساسية للنص والتاريخ |
| 2 | `utils/sanitize.ts` | 143 | الحماية قبل عرض HTML |
| 3 | `hooks/useNotes.ts` | 617 | منطق CRUD + Offline + Optimistic UI |
| 4 | `components/notes/NoteEditorForm.tsx` | 246 | واجهة إدخال/تعديل الملاحظة |
| 5 | `components/notes/DeleteConfirmDialog.tsx` | 67 | تأكيد الحذف قبل التنفيذ |
| 6 | `components/notes/NoteCard.tsx` | 126 | تمثيل الملاحظة كوحدة عرض |
| 7 | `components/notes/NoteList.tsx` | 184 | تجميع البطاقات مع البحث والتصفية |
| 8 | `[locale]/notes/page.tsx` | 121 | صفحة القائمة الرئيسية للملاحظات |
| 9 | `[locale]/notes/new/page.tsx` | 54 | صفحة إنشاء ملاحظة جديدة |
| 10 | `[locale]/notes/[id]/page.tsx` | 211 | صفحة عرض التفاصيل |
| 11 | `[locale]/notes/[id]/edit/page.tsx` | 116 | صفحة تعديل ملاحظة موجودة |

---

### الدرس 09: التسجيل الصوتي والمحرر النصي

> هدف الدرس: بناء محرر نصوص متقدم ومسجل صوتي باستخدام واجهات المتصفح الأصلية.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `components/notes/RichTextEditor.tsx` | 423 | محرر Tiptap مع شريط أدوات MUI + RTL كامل |
| 2 | `components/notes/VoiceRecorder.tsx` | 333 | MediaRecorder + state machine + إيقاف/استئناف + مؤقت |
| 3 | `utils/audio.ts` | 43 | blobToBase64, createAudioUrl, formatDuration |

---

### الدرس 10: تطبيق الويب التقدمي (PWA) و Service Worker

> هدف الدرس: تحويل الموقع إلى تطبيق قابل للتثبيت مع تخزين محلي وبصمة PWA صفرية.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `sw.ts` | 153 | منطق Service Worker واستراتيجيات الكاش |
| 2 | `context/PwaActivationContext.tsx` | 267 | بوابة التفعيل/الإلغاء الديناميكي (Zero Footprint) |
| 3 | `hooks/usePwaStatus.ts` | 275 | اشتقاق حالة PWA على الواجهة |
| 4 | `components/common/PwaActivationDialog.tsx` | 228 | تجربة تفعيل المستخدم متعددة المراحل |
| 5 | `lib/db.ts` | 225 | التخزين المحلي وعمليات الطابور |
| 6 | `lib/warmUpCache.ts` | 134 | تحسين التجربة بعد التفعيل |
| 7 | `components/common/OfflineBanner.tsx` | 80 | إظهار الحالة للمستخدم أثناء الانقطاع |

---

### الدرس 11: الإشعارات الفورية وإدارة الأجهزة

> هدف الدرس: تنفيذ نظام إشعارات فورية مرتبط بالأجهزة الموثوقة مع مؤشرات حالة.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `hooks/useDeviceId.ts` | 57 | تعريف هوية الجهاز كأساس الثقة |
| 2 | `hooks/useOfflineStatus.ts` | 139 | كشف حالة الاتصال كأساس قرارات الشبكة |
| 3 | `hooks/useSyncStatus.ts` | 52 | تتبع طابور المزامنة |
| 4 | `hooks/useDevices.ts` | 167 | إدارة قائمة الأجهزة الموثوقة |
| 5 | `hooks/usePushNotifications.ts` | 158 | ربط الجهاز بالإشعارات |
| 6 | `components/common/DeviceTrustPrompt.tsx` | 146 | تدفق توثيق الجهاز من الواجهة |
| 7 | `components/common/ConnectionIndicator.tsx` | 802 | تجميع وعرض كل مؤشرات الحالة للمستخدم |

---

### الدرس 12: الملف الشخصي وإعدادات الحساب

> هدف الدرس: بناء صفحة ملف شخصي متقدمة مع تحرير مضمّن وحذف حساب آمن.

**الملفات (ترتيب منطقي للتعلّم والتنفيذ):**

| الترتيب | الملف | الأسطر | ما يُشرح |
|---------|-------|--------|----------|
| 1 | `[locale]/register/page.tsx` | 161 | بداية دورة الحياة: إنشاء الحساب |
| 2 | `[locale]/login/page.tsx` | 131 | الدخول وإدارة الجلسة |
| 3 | `[locale]/profile/page.tsx` | 187 | نقطة التجميع لواجهة الملف الشخصي |
| 4 | `components/profile/ProfileEditor.tsx` | 932 | تحرير البيانات والتفضيلات بشكل تفصيلي |
| 5 | `components/profile/DeleteAccountDialog.tsx` | 161 | الإجراء الحساس (حذف الحساب) مع حماية متعددة |

---

### الدرس 13: الاختبارات الشاملة

> هدف الدرس: فهم كيف نختبر كل طبقة في التطبيق باستخدام Vitest و Testing Library.

**الهيكل:**

1. **إعداد بيئة الاختبار** — `setup.ts` + `utils.tsx` + `vitest.config.ts`
2. **اختبارات الأدوات والتحقق** — `config.test.ts`, `types.test.ts`, `validators.test.ts`, `noteUtils.test.ts`, `audioUtils.test.ts`
3. **اختبارات طبقة API** — `apiClient.test.ts`, `devicesRoute.test.ts`, `deviceApi.test.ts`
4. **اختبارات الخطافات** — `useAuth.test.tsx`, `useNotes.test.ts`, `useDevices.test.ts`, `usePwaStatus.test.ts`, `useOfflineStatus.test.ts`, `useSyncStatus.test.ts`, `useDeviceId.test.ts`
5. **اختبارات السياقات** — `ThemeContext.test.tsx`, `warmUpCache.test.ts`
6. **اختبارات المكونات** — `AppBar.test.tsx`, `SideBar.test.tsx`, `ThemeToggle.test.tsx`, `LanguageToggle.test.tsx`, `OfflineBanner.test.tsx`, `ConnectionIndicator.test.tsx`, `NoteCard.test.tsx`, `NoteList.test.tsx`, `NoteEditorForm.test.tsx`, `DeleteConfirmDialog.test.tsx`, `DeleteAccountDialog.test.tsx`, `ProfileEditor.test.tsx`, `PwaActivationDialog.test.tsx`, `PrivateRoute.test.tsx`
7. **اختبارات الصفحات** — `login.test.tsx`, `register.test.tsx`, `NotesPage.test.tsx`, `NoteDetailPage.test.tsx`, `NewNotePage.test.tsx`, `EditNotePage.test.tsx`, `ProfilePage.test.tsx`
8. **اختبارات تكاملية** — `offlineLogout.test.tsx`

**داخل كل قسم** تُشرح الملفات بحسب دورة الاختبار الطبيعية: setup أولًا, ثم unit, ثم integration, ثم component/page, ثم سيناريوهات التكامل النهائي.

---

## 8. استراتيجية الربط التبادلي (Cross-Linking Strategy)

### ٨.١ الربط بين التوثيقات التعليمية

| من | إلى | النوع |
|----|-----|-------|
| كل درس | `README.md` | رابط "  // العودة إلى الفهرس" في الأعلى |
| كل درس | الدرس السابق والتالي | "  // الدرس السابق" + "الدرس التالي →" في الأسفل |
| كل درس يذكر مفهومًا | `concepts-guide.md#القسم` | رابط مضمّن داخل النص |
| `README.md` | كل درس | جدول فهرس الدروس |
| `quick-reference.md` | كل درس | خريطة الملفات + روابط الدروس |

### ٨.٢ الربط بين التوثيقات الانتاجية

| من | إلى | النوع |
|----|-----|-------|
| `README.md` | كل ملف في `docs/` | قسم "التوثيق" مع روابط |
| `api-endpoints.md` | `database-abstraction.md` | عند ذكر النماذج |
| `database-abstraction.md` | `repository-quick-reference.md` | "لمرجع سريع ←" |
| `pwa-guide.md` | `deployment.md` | عند ذكر المتغيرات البيئية |
| `testing.md` | الملفات الأخرى | عند ذكر ما يُختبر |

### ٨.٣ الربط بين التعليمي والانتاجي

| من (تعليمي) | إلى (انتاجي) | متى |
|-------------|-------------|-----|
| درس ٠٥ (API) | `api-endpoints.md` | "للمرجع الكامل ←" |
| درس ٠٣ (Repository) | `database-abstraction.md` + `repository-quick-reference.md` | "للمرجع التقني ←" |
| درس ١٠ (PWA) | `pwa-guide.md` | "للدليل التقني ←" |
| درس ١٣ (Testing) | `testing.md` | "لاستراتيجية الاختبار ←" |
| أي درس | `CONTRIBUTING.md` | عند ذكر معايير الكود أو الإيداعات |

### ٨.٤ الربط من AI docs إلى التوثيقات الأخرى

| من | إلى | متى |
|----|-----|-----|
| `ai/README.md` | `tutorials/README.md` | قسم "Tutorials" |
| `ai/architecture.md` | `database-abstraction.md` | عند ذكر طبقة البيانات |
| `ai/feature-guide.md` | `api-endpoints.md` | عند ذكر إضافة مسار جديد |

---

## 9. معايير الجودة والمراجعة

### ٩.١ قائمة التحقق لكل ملف توثيق

- [ ] النثر بالعربية, الكود بالإنجليزية مع تعليقات عربية
- [ ] لا ذكر لأي مشروع آخر (لا مقارنات)
- [ ] **توافق الرموز العربية واللاتينية** — القاعدة الكاملة:
  - في **النثر العربي**: استخدم `,` و`؛` و`؟` (الرموز العربية)
  - في **كتل الكود** (```` ``` ````): استخدم `,` و`;` و`?` و`%` والأرقام الغربية `0-9` (حتى داخل التعليقات العربية التي تحتوي أسماء تقنية أو أرقام)
  - **الاستثناء الوحيد**: نصوص المستخدم العربية الحرفية داخل الكود (مثل رسائل الخطأ `'البريد غير صالح'`) تبقى بترقيمها العربي الأصلي
  - الأرقام الهندية-العربية (`٠١٢٣٤٥٦٧٨٩`) تُستخدم في النثر العربي فقط — داخل الكود دائمًا `0123456789`
- [ ] اسم التطبيق **ملاحظاتي** في النثر (وليس `web-notes-e1`)
- [ ] جميع الروابط التبادلية تعمل
- [ ] مسافات بادئة ٢ (تتوافق مع Prettier)
- [ ] لا كتل كود بدون سياق عربي

### ٩.٢ قائمة التحقق للدروس التعليمية (إضافة على ٩.١)

- [ ] يبدأ بـ `> هدف الدرس: ...`
- [ ] يحتوي تشبيهًا واحدًا على الأقل
- [ ] يحتوي جدولًا واحدًا على الأقل
- [ ] ينتهي بقسم "ملخص" مع جدول
- [ ] الأقسام مرقمة تسلسليًّا (لا ثغرات)
- [ ] الملفات مشروحة وفق التسلسل المنطقي (تهيئة  // منطق الأعمال  // التكامل  // العرض  // التحقق)
- [ ] رابط "الدرس السابق" و"الدرس التالي" في الأسفل
- [ ] تحديث `README.md` بعد إضافة الدرس
- [ ] تحديث `quick-reference.md` بعد إضافة الدرس

### ٩.٣ قائمة التحقق لتوثيقات AI (إضافة على ٩.١)

- [ ] مكتوبة بالإنجليزية بالكامل
- [ ] تحتوي عدد الاختبارات الحالي (573)
- [ ] تحتوي أوامر التشغيل والاختبار
- [ ] تحتوي مسارات الملفات الحرجة

---

## 10. خطة التنفيذ والإيداعات

### مراحل التنفيذ

```
المرحلة أ: التوثيقات الانتاجية
    ├── أ.١  README.md (تحديث شامل)
    ├── أ.٢  docs/api-endpoints.md
    ├── أ.٣  docs/database-abstraction.md
    ├── أ.٤  docs/repository-quick-reference.md
    ├── أ.٥  docs/pwa-guide.md
    ├── أ.٦  docs/testing.md
    └── أ.٧  docs/deployment.md
    ↓
المرحلة ب: توثيقات AI
    ├── ب.١  docs/ai/README.md
    ├── ب.٢  docs/ai/architecture.md
    └── ب.٣  docs/ai/feature-guide.md
    ↓
المرحلة ج: التوثيقات التعليمية — البنية
    ├── ج.١  docs/tutorials/README.md
    ├── ج.٢  docs/tutorials/concepts-guide.md
    └── ج.٣  docs/tutorials/quick-reference.md
    ↓
المرحلة د: التوثيقات التعليمية — الدروس
    ├── د.١  lessons/01-project-setup.md
    ├── د.٢  lessons/02-database-models.md
    ├── د.٣  lessons/03-repository-pattern.md
    ├── د.٤  lessons/04-authentication.md
    ├── د.٥  lessons/05-api-routes.md
    ├── د.٦  lessons/06-theme-system.md
    ├── د.٧  lessons/07-internationalization.md
    ├── د.٨  lessons/08-notes-crud.md
    ├── د.٩  lessons/09-voice-recording.md
    ├── د.١٠ lessons/10-pwa-service-worker.md
    ├── د.١١ lessons/11-push-notifications.md
    ├── د.١٢ lessons/12-offline-sync.md
    └── د.١٣ lessons/13-testing.md
```text

| 1 | `docs: update README and add production documentation` | المرحلة أ |

| الإيداع | الرسالة | النطاق |
|---------|---------|--------|
### إيداعات Git المتوقعة
| 2 | `docs(ai): add architecture, feature guide, and AI README` | المرحلة ب |
| 3 | `docs(tutorials): add tutorial index, concepts guide, and quick reference` | المرحلة ج |
| 4 | `docs(tutorials): add lessons 01-07 (setup through i18n)` | المرحلة د (النصف الأول) |
| 5 | `docs(tutorials): add lessons 08-13 (CRUD through testing)` | المرحلة د (النصف الثاني) |

### العلامة المرجعية (Tag)

بعد اكتمال جميع المراحل:

```
git tag -a v0.2.0 -m "Release v0.2.0 — Comprehensive Documentation"
git push origin v0.2.0
```text

---

*هذه الخطة تعيش في `docs/plans/documentation-plan.md` وتُستخدم كمرجع أثناء تنفيذ المرحلة ١٣ من خطة البناء.*
