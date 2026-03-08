# دليل المساهمة — ملاحظاتي (web-notes-e1)

> **اقرأ هذا الملف قبل إجراء أي تغيير.**
> هذه القواعد غير قابلة للتفاوض وتُطبَّق عند مراجعة الكود.

---

## 1. المعمارية أولاً

### قواعد المعمارية الحرجة

| القاعدة | التفصيل |
|---------|---------|
| **API calls** | جميع طلبات الخادم في `src/app/lib/api.ts` — لا `fetch()` مباشرة في الصفحات أو المكونات |
| **Auth context** | استخدم `useAuth()` hook — لا import مباشر من `AuthContext` |
| **Theme context** | استخدم `useThemeMode()` hook — لا import مباشر من `ThemeContext` |
| **الأنواع (Types)** | جميع الأنواع المشتركة في `src/app/types.ts` — لا تعريف inline types في الصفحات |
| **معالجة الأخطاء** | استخدم `src/app/lib/apiErrors.ts` — رسائل عربية موحَّدة |
| **i18n** | جميع النصوص من ملفات `src/messages/*.json` — لا hardcoded strings |
| **التنقل** | استخدم `redirect/useRouter` من `src/app/lib/navigation.ts` — يضمن الـ locale |
| **UI constants** | الألوان وثوابت الـ UI من `src/app/lib/ui-constants.ts` |
| **Icons** | من `@mui/icons-material` — لا صور SVG خارجية |
| **لا next.js defaults** | لا تضع ملفات `next.svg` أو `vercel.svg` أو أي placeholders في `public/` |

### بنية المشروع

```
src/
├── app/
│   ├── [locale]/            # صفحات i18n (ar / en)
│   │   ├── notes/           # قائمة، جديدة، تفاصيل، تعديل
│   │   ├── profile/         # إدارة الحساب
│   │   ├── login/
│   │   └── register/
│   ├── api/                 # Next.js API routes
│   │   ├── auth/            # login, register, me
│   │   ├── notes/           # CRUD
│   │   ├── push/            # subscribe, send
│   │   ├── devices/         # إدارة الأجهزة
│   │   ├── users/           # profile, delete
│   │   └── health/          # health check لـ Heroku
│   ├── components/          # مكونات قابلة لإعادة الاستخدام
│   │   ├── auth/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── notes/
│   │   └── profile/
│   ├── context/             # AuthContext, ThemeContext
│   ├── hooks/               # useAuth, useNotes, useDevices, usePush...
│   ├── lib/                 # api.ts, apiErrors.ts, auth.ts, mongodb.ts...
│   ├── middlewares/         # JWT validation middleware
│   ├── models/              # Mongoose models
│   ├── repositories/        # Data access layer
│   ├── tests/               # Vitest test files
│   ├── utils/               # utility functions
│   └── validators/          # Zod schemas
├── messages/                # ar.json, en.json (i18n strings)
├── i18n/                    # routing.ts, request.ts
├── proxy.ts                 # middleware: auth + locale redirect
├── sw.ts                    # Service Worker source
└── instrumentation.ts       # MongoDB connection on server start
```

---

## 2. أسماء الفروع

```
main             ← كود جاهز للإنتاج؛ هيروكو يبني تلقائياً من هذا الفرع
feat/<topic>     ← ميزة جديدة  (مثال: feat/note-tags)
fix/<topic>      ← إصلاح خطأ  (مثال: fix/push-token-refresh)
docs/<topic>     ← توثيق فقط   (مثال: docs/api-endpoints)
chore/<topic>    ← أدوات، اعتماديات، إعداد (مثال: chore/update-deps)
refactor/<topic> ← إعادة هيكلة بدون تغيير في السلوك
```

> **تنبيه:** هيروكو يبني `main` تلقائياً — لا ترفع كوداً غير مكتمل إليه.

---

## 3. رسائل الإيداع (Commit Messages)

الصيغة: **[Conventional Commits](https://www.conventionalcommits.org/) — بالإنجليزية فقط**.

```
<type>(<scope>): <short description>

- change 1
- change 2
```

### الأنواع

| النوع | متى تستخدمه |
|-------|------------|
| `feat` | ميزة جديدة |
| `fix` | إصلاح خطأ |
| `docs` | توثيق فقط |
| `test` | إضافة أو تحديث اختبارات |
| `refactor` | إعادة هيكلة بدون تغيير في السلوك |
| `chore` | أدوات، إعداد، اعتماديات |
| `style` | تنسيق Prettier فقط (بدون تغيير منطقي) |
| `security` | إصلاح ثغرة أمنية |

### النطاقات (Scopes)

| النطاق | ينطبق على |
|--------|----------|
| `auth` | تسجيل دخول، تسجيل، JWT |
| `notes` | ملاحظات CRUD + محرر Tiptap |
| `profile` | إدارة الحساب |
| `offline` | IndexedDB (Dexie) + مزامنة |
| `pwa` | Service Worker + manifest |
| `push` | إشعارات Web Push |
| `devices` | إدارة الأجهزة المسجَّلة |
| `api` | API routes في `src/app/api/` |
| `i18n` | ترجمات، locale routing |
| `ui` | مكونات MUI، ثيم |
| `test` | ملفات `src/app/tests/` |
| `docs` | توثيق |
| `security` | إصلاحات أمنية |

### أمثلة

```bash
# ✅ صحيح
git commit -m "feat(notes): add note pinning feature

- Add isPinned field to Note model
- Update notes list to show pinned notes first
- Add pin/unpin button in note detail toolbar
- Add Zod validation for isPinned field"

# ✅ صحيح
git commit -m "fix(push): retry failed push subscriptions on token refresh"

# ✅ صحيح
git commit -m "security(notes): sanitize Rich HTML before rendering

- Add sanitizeHtml() in src/app/utils/sanitize.ts
- Strip dangerous tags/attributes from note.content
- Update note detail page to use sanitized output"

# ✅ صحيح (patch)
git commit -m "chore(deps): update @mui/material to v7.3.9"

# ❌ خاطئ — عربي
git commit -m "إضافة ميزة تثبيت الملاحظات"

# ❌ خاطئ — بدون نطاق في تغيير غير تافه
git commit -m "feat: add pinning"

# ❌ خاطئ — مخلوط
git commit -m "feat: add pinning and fix push bug"
```

---

## 4. التاجات (Tags)

| رفع الإصدار | المحفّز |
|------------|---------|
| `v1.0.0` (major) | أول إصدار إنتاجي، أو breaking change |
| `v1.X.0` (minor) | ميزة رئيسية مكتملة |
| `v1.X.Y` (patch) | إصلاح خطأ أو تحديث ثانوي |

```bash
# annotated tags فقط — لا lightweight tags
git tag -a v1.1.0 -m "v1.1.0 - Add note pinning and push retry

- isPinned field in Note model
- pinned notes shown first in list
- push token refresh with retry logic"

git push origin v1.1.0
```

---

## 5. معايير الكود

### TypeScript
- **لا `any`** — استخدم أنواعاً صحيحة أو `unknown` مع type guard
- **لا `// @ts-ignore`** — أصلح المشكلة
- **لا تعريف types مكررة** — استخدم ما في `src/app/types.ts`
- تشغيل `npx tsc --noEmit` يجب أن ينتهي بـ 0 أخطاء

### الأمان
- **XSS** — أي محتوى HTML من المستخدم يمر على `sanitizeHtml()` في `src/app/utils/sanitize.ts` قبل `dangerouslySetInnerHTML`
- **لا JWT في localStorage** — يُخزَّن في httpOnly cookies
- **لا env vars في الكود** — استخدم `process.env.VAR` ولا تضع القيم مباشرة
- جميع متغيرات البيئة الجديدة تُضاف فوراً إلى `.env.example`

### الاختبارات
- ملفات الاختبار في `src/app/tests/`
- `npm test` (Vitest) يجب أن يمر بالكامل قبل كل push
- أضف اختبارات لأي hook أو utility جديد

---

## 6. سير العمل قبل الرفع (Pre-push Checklist)

```bash
# 1. تحقق من TypeScript
npx tsc --noEmit

# 2. شغّل الاختبارات
npm test

# 3. نسّق الكود
npm run format

# 4. تحقق من صحة الـ workflow
npm run validate

# 5. تأكد أن البناء يعمل
npm run build
```

أو اجمعها دفعة واحدة:

```bash
npx tsc --noEmit && npm test && npm run format && npm run validate && npm run build
```

---

## 7. متغيرات البيئة

انسخ `.env.example` إلى `.env.local` وأضف القيم الحقيقية:

```bash
cp .env.example .env.local
```

| المتغير | الوصف |
|---------|-------|
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | ≥ 32 حرف عشوائياً |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | مفتاح VAPID العام — متاح في الخادم والمتصفح معاً (من `web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | مفتاح VAPID الخاص — **لا تُودِعه في Git** |
| `VAPID_EMAIL` | بريد إلكتروني (مطلوب لـ VAPID) |

> كل متغير جديد **يُضاف فوراً** إلى `.env.example` مع قيمة placeholder.

---

## 8. النشر على هيروكو

- هيروكو يبني تلقائياً من فرع `main`
- لا توجد GitHub Actions workflows للنشر — هيروكو يتولى ذلك مباشرة
- متغيرات البيئة تُضبط في **Heroku Config Vars** فقط — لا `.env`

```bash
# تأكد من وجود engines في package.json
"engines": { "node": ">=20.x", "npm": ">=10.x" }

# تأكد من وجود Procfile إذا احتجت تخصيص الأمر
web: npm start
```
