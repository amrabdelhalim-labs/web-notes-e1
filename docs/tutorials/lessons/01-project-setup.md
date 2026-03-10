# الدرس 01: إعداد المشروع والبنية الأساسية

> هدف الدرس: فهم البنية العامة لمشروع Next.js مع TypeScript وكيف تتعاون ملفات الإعداد معًا لتشكيل بيئة عمل متكاملة منذ اللحظة الأولى.

[← فهرس الدروس](../README.md)

---

## جدول المحتويات

1. [هيكل المشروع — نظرة عامة](#1-هيكل-المشروع--نظرة-عامة)
2. [package.json — تعريف المشروع وتبعياته](#2-packagejson--تعريف-المشروع-وتبعياته)
3. [.env.example — المتغيرات البيئية](#3-envexample--المتغيرات-البيئية)
4. [tsconfig.json — إعدادات TypeScript](#4-tsconfigjson--إعدادات-typescript)
5. [next.config.mjs — تكوين Next.js](#5-nextconfigmjs--تكوين-nextjs)
6. [أدوات جودة الكود](#6-أدوات-جودة-الكود)
7. [next-env.d.ts — أنواع Next.js](#7-next-envdts--أنواع-nextjs)
8. [نقطة دخول التطبيق](#8-نقطة-دخول-التطبيق)
9. [globals.css — الأساس البصري](#9-globalscss--الأساس-البصري)
10. [config.ts — الثوابت المركزية](#10-configts--الثوابت-المركزية)
11. [proxy.ts — توجيه اللغة](#11-proxyts--توجيه-اللغة)
12. [instrumentation.ts — تهيئة الخادم](#12-instrumentationts--تهيئة-الخادم)
13. [vitest.config.ts — إعداد الاختبارات](#13-vitestconfigts--إعداد-الاختبارات)
14. [سكربتات المشروع — نظرة سريعة](#14-سكربتات-المشروع--نظرة-سريعة)
15. [ملخص](#15-ملخص)

---

## 1. هيكل المشروع — نظرة عامة

قبل أن نقرأ أي ملف، دعنا نفهم الصورة الكاملة. **ملاحظاتي** ليس مجرد مجلد فيه ملفات — بل هو نظام بيئي متكامل يشمل:

- **واجهة المستخدم** (Next.js + React)
- **الخادم** (Next.js API Routes)
- **قاعدة البيانات** (MongoDB عبر Mongoose)
- **التخزين المحلي** (Dexie + IndexedDB)
- **الإشعارات** (Web Push)
- **الترجمة** (next-intl)
- **الاختبارات** (Vitest + Testing Library)

### تشبيه: المشروع كمطبخ مطعم

تخيّل أن المشروع مطبخ مطعم كبير:
- `package.json` هو **قائمة المستلزمات** — كل مكوّن ومقداره
- `tsconfig.json` هو **معايير العمل** — كيف يتعامل كل طاهٍ مع المقاييس
- `next.config.mjs` هو **تخطيط المطبخ** — أين توضع كل آلة وكيف تتصل ببعضها
- ملفات `.env` هي **الأسرار والوصفات السرية** — لا تُنشر، تُحفظ عند كل طاهٍ
- `proxy.ts` هو **موظف الاستقبال** — يوجّه كل زبون للطابق الصحيح

### هيكل المجلدات على مستوى الجذر

```
web-notes-e1/              ← جذر المشروع
  src/                     ← كل كود المصدر هنا
    app/                   ← Next.js App Router
      api/                 ← مسارات API (الخادم)
      components/          ← مكوّنات React
      context/             ← سياقات (Context) المشتركة
      hooks/               ← خطّافات (Hooks) مخصصة
      lib/                 ← مكتبات مساعدة
      middlewares/         ← وسطاء المنطق
      models/              ← نماذج Mongoose
      repositories/        ← طبقة المستودعات
      tests/               ← كل الاختبارات
      utils/               ← أدوات مساعدة
      validators/          ← دوال التحقق
      [locale]/            ← صفحات مع مسار اللغة
    i18n/                  ← إعداد الترجمة
    messages/              ← ملفات الرسائل (ar/en)
    proxy.ts               ← وسيط next-intl
    sw.ts                  ← Service Worker
    instrumentation.ts     ← تهيئة الخادم
  docs/                    ← التوثيق التقني
  scripts/                 ← سكربتات المساعدة
  public/                  ← ملفات عامة (أيقونات، manifest)
  package.json             ← تعريف المشروع
  tsconfig.json            ← إعدادات TypeScript
  next.config.mjs          ← تكوين Next.js
  vitest.config.ts         ← إعداد الاختبارات
```

---

## 2. package.json — تعريف المشروع وتبعياته

ملف `package.json` هو **الوثيقة الرسمية للمشروع** — أول ما يُقرأ عند فتح أي مشروع Node.js. يُخبر npm بكل شيء: اسم المشروع، النسخة، بيئة التشغيل المطلوبة، الأوامر المتاحة، والمكتبات المستخدمة.

### ٢.١ معرّف المشروع وبيئة التشغيل

```json
{
  "name": "web-notes-e1",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=20.x",
    "npm": ">=10.x"
  }
}
```

**شرح سطرًا بسطر:**

| الحقل | القيمة | المعنى |
|-------|--------|--------|
| `name` | `"web-notes-e1"` | اسم المشروع الداخلي (لا يظهر للمستخدم) |
| `version` | `"0.1.0"` | نسخة في طور التطوير المبكر (pre-release) |
| `private` | `true` | يمنع النشر العرضي لـ npm registry |
| `engines.node` | `">=20.x"` | يشترط Node.js 20 أو أعلى |
| `engines.npm` | `">=10.x"` | يشترط npm 10 أو أعلى |

> لماذا Node.js 20؟ لأن Next.js 16 يحتاج أحدث ميزات JavaScript (مثل `globalThis` واتفاقيات ESM)، ولأن بعض مكتبات التشفير مثل `bcryptjs 3` تعتمد على تحسينات Node.js 20 في الأداء.

### ٢.٢ أوامر npm

```json
"scripts": {
  "dev":            "next dev --webpack",
  "build":          "next build --webpack",
  "start":          "next start",
  "lint":           "eslint src/",
  "test":           "vitest run",
  "test:watch":     "vitest",
  "test:coverage":  "vitest run --coverage",
  "format":         "node scripts/format.mjs",
  "format:check":   "node scripts/format.mjs --check",
  "validate":        "node scripts/validate-workflow.mjs",
  "smoke":          "node scripts/http-smoke.mjs"
}
```

**شرح الأوامر المهمة:**

- **`--webpack`** في أوامر `dev` و `build`: يجبر Next.js 16 على استخدام Webpack بدلًا من Turbopack — لأن `@serwist/next` (مكتبة PWA) لا يدعم Turbopack بالكامل بعد.
- **`vitest run`** مقابل **`vitest`**: الأول يُشغّل الاختبارات مرة واحدة وينتهي (مناسب للـ CI)، الثاني يبقى يراقب التغييرات (مناسب للتطوير).
- **`validate`**: يُشغّل lint + format:check + test في خطوة واحدة — استخدمه قبل كل `git push`.
- **`smoke`**: يُرسل طلبات HTTP حقيقية للتأكد من أن الخادم يُجيب — اختبار سريع بعد النشر.

### ٢.٣ التبعيات الرئيسية (dependencies)

هذه المكتبات تُشحَن مع التطبيق للمستخدم النهائي:

| المكتبة | الإصدار | الغرض |
|---------|---------|-------|
| `next` | 16.1.6 | إطار العمل الأساسي |
| `react` / `react-dom` | 19.2.3 | مكتبة واجهة المستخدم |
| `@mui/material` | ^7.3.8 | مكونات UI جاهزة (Material Design) |
| `@emotion/cache`, `@emotion/react`, `@emotion/styled` | ^11.x | محرك CSS-in-JS خلف MUI |
| `@mui/stylis-plugin-rtl` + `stylis-plugin-rtl` | ^7.3.8 / ^2.1.1 | عكس CSS تلقائيًا للعربية |
| `mongoose` | ^9.2.4 | التواصل مع MongoDB |
| `next-intl` | ^4.8.3 | نظام الترجمة والتعددية اللغوية |
| `@serwist/next` | ^9.5.6 | بناء Service Worker (PWA) |
| `dexie` | ^4.3.0 | قاعدة بيانات محلية (IndexedDB بشكل أبسط) |
| `jsonwebtoken` | ^9.0.3 | إنشاء والتحقق من رموز JWT |
| `bcryptjs` | ^3.0.3 | تشفير كلمات المرور |
| `web-push` | ^3.6.7 | إرسال إشعارات Web Push من الخادم |
| `@tiptap/*` | ^3.20.0 | محرر نصوص غنية (Rich Text) |

> لاحظ أن `@mui/stylis-plugin-rtl` و `stylis-plugin-rtl` معًا — الأول للإصدار الجديد من MUI، والثاني لإضافة Stylis المستخدمة خلفه. كلاهما ضروري لدعم RTL في MUI 7.

### ٢.٤ تبعيات التطوير (devDependencies)

هذه المكتبات تُستخدم فقط أثناء التطوير ولا تُشحن للمستخدم:

| المكتبة | الغرض |
|---------|-------|
| `vitest` | إطار الاختبار |
| `@testing-library/react` + `@testing-library/jest-dom` | اختبار مكونات React |
| `jsdom` | محاكاة بيئة المتصفح أثناء الاختبار |
| `@vitejs/plugin-react` | دعم React في Vitest |
| `typescript` | المُترجم TypeScript |
| `eslint` + `eslint-config-next` | فحص الكود |
| `prettier` | تنسيق الكود |
| `@types/*` | تعريفات أنواع TypeScript للمكتبات |

---

## 3. .env.example — المتغيرات البيئية

**ملف `.env.example` هو الدليل الوحيد لما يحتاجه التطبيق** لكي يعمل. الملف الحقيقي `.env` لا يُودَع في Git (موجود في `.gitignore`) لأنه يحتوي على أسرار حساسة — لكن `.env.example` يُودَع كدليل للمطورين الجُدد.

```bash
# Database
DATABASE_URL=mongodb://localhost:27017/mynotes

# Auth
JWT_SECRET=change_this_to_a_strong_secret

# Runtime
NODE_ENV=development
PORT=3000

# Web Push (VAPID)
# لتوليد مفاتيح جديدة:
# node -e "const wp=require('web-push'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"
# NEXT_PUBLIC_ يجعل المفتاح العام متاحًا للمتصفح والخادم معًا
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_EMAIL=mailto:your-email@example.com

# اجعل قيمته 'false' لتفعيل Service Worker في بيئة التطوير
# NEXT_PUBLIC_SW_DISABLED=false
```

### ٣.١ شرح كل متغير

| المتغير | الاستخدام | سري؟ |
|---------|-----------|-------|
| `DATABASE_URL` | رابط اتصال MongoDB في `instrumentation.ts` و `mongodb.ts` | نعم |
| `JWT_SECRET` | مفتاح تشفير رموز JWT في `lib/auth.ts` | نعم — لا يقل عن 32 حرفًا عشوائيًا |
| `NODE_ENV` | تُحدد سلوك Next.js (development/production) | لا |
| `PORT` | رقم المنفذ المُعروض في `instrumentation.ts` | لا |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | المفتاح العام للإشعارات (يصل للمتصفح) | لا — عام بطبيعته |
| `VAPID_PRIVATE_KEY` | المفتاح الخاص لتوقيع الإشعارات | نعم — لا يُشارَك مطلقًا |
| `VAPID_EMAIL` | بريد المسؤول (VAPID protocol) | لا |
| `NEXT_PUBLIC_SW_DISABLED` | تفعيل/تعطيل Service Worker في التطوير | لا |

### ٣.٢ قاعدة `NEXT_PUBLIC_`

أي متغير بيئي بادئته `NEXT_PUBLIC_` يصبح **متاحًا في كود المتصفح**. إذا حذفت البادئة، يبقى المتغير خادمًا فقط — وستحصل على `undefined` إذا حاولت الوصول إليه من المتصفح.

```ts
// صحيح — NEXT_PUBLIC_ يصل للعميل والخادم
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

// صحيح — بدون NEXT_PUBLIC_ يصل للخادم فقط
process.env.VAPID_PRIVATE_KEY        // لن تراه أبدًا في المتصفح
process.env.DATABASE_URL             // خادم فقط — كما ينبغي
```

---

## 4. tsconfig.json — إعدادات TypeScript

`tsconfig.json` هو **دستور TypeScript** — يحدد كيف يُترجم الكود من TypeScript إلى JavaScript وأي قواعد تسري.

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "types": ["@serwist/next/typings"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules", "src/sw.ts"]
}
```

### ٤.١ خيارات المُترجم — شرح تفصيلي

| الخيار | القيمة | المعنى العملي |
|--------|--------|---------------|
| `target` | `"ES2017"` | الكود المُترجَم يكون متوافقًا مع ES2017 (دعم `async/await` أصلي) |
| `lib` | `["dom", "dom.iterable", "esnext"]` | يوفر النوع الصحيح لـ `document`, `window`, `fetch` وما إلى ذلك |
| `allowJs` | `true` | يسمح باستيراد ملفات `.js` القديمة |
| `skipLibCheck` | `true` | يتجاهل أخطاء الأنواع في `node_modules` — يُسرّع البناء |
| `strict` | `true` | يُفعّل كل قواعد الصرامة: noImplicitAny, strictNullChecks... |
| `noEmit` | `true` | TypeScript يتحقق فقط، Next.js هو من يُخرج ملفات JS |
| `esModuleInterop` | `true` | يسمح بـ `import X from 'y'` مع مكتبات CommonJS |
| `moduleResolution` | `"bundler"` | يستخدم خوارزمية تحليل حديثة متوافقة مع Vite/Next.js |
| `resolveJsonModule` | `true` | يسمح باستيراد ملفات `.json` مباشرة |
| `isolatedModules` | `true` | كل ملف مستقل — يُمكّن التحويل الموازي السريع |
| `jsx` | `"react-jsx"` | يحوّل JSX تلقائيًا بدون `import React` في كل ملف |
| `incremental` | `true` | يخزّن نتائج التحقق لتسريع التشغيل التالي |

### ٤.٢ الخيارات الأهم للمشروع

**`strict: true`** هو أهم خيار — يعني:
```ts
// ❌ لن يُقبل:
function greet(name) {  // name ضمني any
  return 'مرحبًا ' + name;
}

// ✅ المطلوب:
function greet(name: string): string {
  return 'مرحبًا ' + name;
}
```

**`paths: { "@/*": ["./src/*"] }` — مسارات الاستيراد المختصرة:**
```ts
// بدون @/* تحتاج:
import { AuthProvider } from '../../../context/AuthContext';

// مع @/*:
import { AuthProvider } from '@/app/context/AuthContext';
```

### ٤.٣ لماذا يُستثنى `src/sw.ts`؟

```json
"exclude": ["node_modules", "src/sw.ts"]
```

Service Worker يعمل في سياق مختلف عن التطبيق — ليس له وصول لـ `window` أو `document`. `@serwist/next` يتولى ترجمة `sw.ts` بشكل منفصل بإعداداته الخاصة لضمان توليد ملف JavaScript صحيح لبيئة Service Worker.

---

## 5. next.config.mjs — تكوين Next.js

هذا الملف هو **مركز التحكم** في Next.js — يربط كل الإضافات ببعضها.

```js
import createNextIntlPlugin from 'next-intl/plugin';
import withSerwist from '@serwist/next';

// 1. إعداد next-intl بمسار ملف التكوين
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// 2. تكوين Next.js الأساسي
const nextConfig = {
  reactStrictMode: true,
};

// 3. إعداد Serwist (Service Worker)
const withSerwistConfig = withSerwist({
  swSrc: 'src/sw.ts',         // المصدر TypeScript لـ Service Worker
  swDest: 'public/sw.js',     // المخرج النهائي (يجب أن يكون في public/)
  disable:
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_SW_DISABLED !== 'false',
  register: false,            // التسجيل يدويًا فقط عبر PwaActivationContext
  reloadOnOnline: false,      // مهم جدًا — انظر الشرح أدناه
});

// 4. ترتيب التغليف مهم — Serwist خارجًا، next-intl داخلًا
export default withSerwistConfig(withNextIntl(nextConfig));
```

### ٥.١ ترتيب التغليف

```
withSerwistConfig(
  withNextIntl(
    nextConfig
  )
)
```

تخيّل هذا كطبقات بصلة — كل طبقة خارجية تلتف حول ما بداخلها وتُضيف سلوكها:
- `withNextIntl` يُضيف دعم i18n — إعادة توجيه، middleware، استيراد رسائل
- `withSerwistConfig` يُضيف دعم PWA — بناء Service Worker، تكوين الكاش

### ٥.٢ لماذا `reloadOnOnline: false`؟

هذا الخيار مهم جدًا ويستحق الفهم العميق:

```js
// إذا كانت قيمته true (الافتراضية في بعض الإعدادات):
// عند عودة الاتصال، سيُضيف Serwist:
//   window.addEventListener('online', () => location.reload())
// 
// هذا يعني: الصفحة تُعاد تحميلها قبل أن يُنهي React معالجة رتل
// العمليات المعلقة في IndexedDB — فتضيع كل التعديلات التي أجراها
// المستخدم أثناء عدم الاتصال!
//
// الحل: نُبقيه false ونتحكم بالمزامنة يدويًا عبر processQueue()
reloadOnOnline: false,
```

### ٥.٣ تعطيل Service Worker في التطوير

```js
disable:
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_SW_DISABLED !== 'false',
```

بالإعداد الافتراضي، Service Worker **مُعطَّل** في بيئة التطوير لأسباب منطقية:
- Service Worker يُخزّن الملفات في الكاش—لو كان مُفعَّلًا ستظل ترى النسخ القديمة
- Hot Reload يعمل مع الشبكة مباشرة، لكن Service Worker قد يعترض هذا
- لتفعيله في التطوير (لاختبار ميزات PWA): `NEXT_PUBLIC_SW_DISABLED=false`

---

## 6. أدوات جودة الكود

### ٦.١ eslint.config.mjs — التحليل الثابت

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,  // قواعد Next.js الأساسية + Core Web Vitals
  ...nextTs,      // قواعد TypeScript الصارمة
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
```

يستخدم **ملاحظاتي** إصدار ESLint 9 مع `eslint.config.mjs` (الصيغة الحديثة Flat Config بدلًا من `.eslintrc.json` القديمة). الإعداد يجمع:
- **`nextVitals`**: يُطبّق قواعد Next.js وCore Web Vitals — يُحذّر من `<img>` غير المُحسَّنة، الروابط بدون `next/link`، وما إلى ذلك
- **`nextTs`**: يضيف قواعد TypeScript — يتطلب أنواعًا صريحة، يمنع `any` الضمنية

تشغيل: `npm run lint`

### ٦.٢ .prettierrc.json — التنسيق الموحد

```json
{
  "semi": true,           // فاصلة منقوطة في نهاية كل سطر
  "singleQuote": true,    // علامات اقتباس مفردة '' لا ""
  "tabWidth": 2,          // مسافتان للمسافة البادئة (لا tabs)
  "trailingComma": "es5", // فاصلة نهائية فقط عند ES5 (مصفوفات وكائنات)
  "printWidth": 100,      // الحد الأقصى لطول السطر
  "bracketSpacing": true, // مسافات داخل الأقواس: { key: value }
  "arrowParens": "always",// دائمًا أقواس حول معامل الدالة السهمية: (x) => x
  "endOfLine": "lf"       // نهاية الأسطر Unix-style (LF)
}
```

> **`endOfLine: "lf"`**: هذا مهم على Windows — بالاتفاق مع `.gitattributes`، يضمن أن git وPrettier يتفقان على نهايات الأسطر ولا تظهر "تغييرات وهمية" في الـ diff.

### ٦.٣ .prettierignore — استثناءات التنسيق

```
node_modules           ← تبعيات خارجية — لا نلمسها
.next                  ← مخرجات البناء — تتغير دائمًا
public                 ← ملفات مُنشأة آليًا (sw.js، أيقونات)
package-lock.json      ← يُدار بالكامل بواسطة npm
src/app/tests/setup.ts ← تنسيقه الخاص عمد
```

### ٦.٤ .gitattributes — توحيد نهايات الأسطر

```gitattributes
# يفرض LF على كل الملفات النصية
* text=auto eol=lf

# الملفات الثنائية — لا تلمس نهاياتها
*.png binary
*.jpg binary
# ... إلخ
```

**لماذا هذا ضروري؟** Windows افتراضيًا يستخدم CRLF (حرفان: `\r\n`) بينما Linux/Mac يستخدمان LF (`\n`). في مشروع يعمل عليه فريق متعدد الأنظمة، بدون هذا الملف سيُشاهَد كل ملف كـ "مُعدَّل" في كل نظام — آلاف الأسطر تتغير بسبب حرف نهاية السطر فقط. `.gitattributes` يحل هذا نهائيًا.

### ٦.٥ .gitignore — ما لا يُودَع في Git

الملفات المُستثناة الأهم:

```gitignore
/node_modules      ← ضخم جدًا (عشرات الآلاف من الملفات)
/.next/            ← مخرجات البناء، تختلف بين الأجهزة
.env               ← الأسرار — لا تُودَع أبدًا!
!.env.example      ← استثناء: example مسموح به (لا أسرار فيه)
public/sw.js       ← يُنشأ تلقائيًا وقت البناء من src/sw.ts
```

---

## 7. next-env.d.ts — أنواع Next.js

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript
```

هذا الملف **يُنشئه ويُديره Next.js تلقائيًا** — لا تُعدّله أبدًا. مهمته:
- `/// <reference types="next" />`: يُضيف أنواع TypeScript الخاصة بـ Next.js (مثل `NextRequest`, `NextResponse`)
- `/// <reference types="next/image-types/global" />`: يُضيف أنواع مكوّن `<Image>`
- `import "./.next/types/routes.d.ts"`: يُضيف أنواع مسارات التطبيق (مولّد آليًا وقت البناء)

لهذا السبب هو في `.gitignore` — يتغير مع كل بناء ولا معنى لتتبعه في Git.

---

## 8. نقطة دخول التطبيق

### ٨.١ app/layout.tsx — التخطيط الجذري

```tsx
/**
 * التخطيط الجذري — مطلوب من Next.js App Router.
 *
 * الـ <html> و <body> الحقيقية، الخطوط، سكريبت السمة، ومزودو الحالة
 * كلها في app/[locale]/layout.tsx الذي يُغلّف كل مسارات اللغة.
 *
 * هذا الملف موجود فقط لإرضاء متطلبات Next.js من التخطيط الجذري.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### ٨.٢ لماذا التخطيط الجذري فارغ؟

في مشروع عادي، `app/layout.tsx` يحتوي `<html>` و `<body>`. لكن **ملاحظاتي** يستخدم نمط `[locale]` — كل مسار مسبوق برمز اللغة (`/ar/*` أو `/en/*`). هذا يعني أن التخطيط الفعلي في `app/[locale]/layout.tsx` هو من يُحدد اتجاه الصفحة (RTL/LTR)، الخط، ومزودو الحالة.

```
/ (جذر)
  app/layout.tsx        ← فارغ — يمرر children فقط
  app/[locale]/
    layout.tsx          ← التخطيط الحقيقي (<html lang=...>، providers، إلخ)
    ar/
      notes/            ← /ar/notes
    en/
      notes/            ← /en/notes
```

### ٨.٣ providers.tsx — سلسلة مزودي الحالة

```tsx
'use client'; // كل المزودين مكونات العميل

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProviderWrapper>         {/* 1. السمات: فاتح/داكن + RTL */}
      <PwaActivationProvider>      {/* 2. PWA: تنشيط/إلغاء Service Worker */}
        <AuthProvider>             {/* 3. المصادقة: المستخدم الحالي */}
          <PwaRuntime />           {/* 4. جسر رسائل SW ← window */}
          {children}               {/* 5. محتوى الصفحة */}
          <LocaleSwitchPromptDialog /> {/* 6. حوار اقتراح تغيير اللغة */}
        </AuthProvider>
      </PwaActivationProvider>
    </ThemeProviderWrapper>
  );
}
```

**ترتيب المزودين مُهم جدًا:**
- `ThemeProviderWrapper` يجب أن يكون الخارجي لأن كل شيء آخر قد يحتاج السمة
- `PwaActivationProvider` قبل `AuthProvider` لأن تنشيط PWA قد يحدث قبل تسجيل الدخول
- `AuthProvider` يحتاج السياق البصري (من ThemeProvider) ليدّير نمط المصادقة

### ٨.٤ PwaRuntime — الجسر الصامت

```tsx
function PwaRuntime() {
  const { isActivated } = usePwaActivation();

  useEffect(() => {
    // لا نُسجّل المستمع إلا إذا كان PWA مُفعَّلًا
    if (!isActivated || !('serviceWorker' in navigator)) return;

    const handler = (event: MessageEvent) => {
      // الرسالة تأتي من Service Worker عند انتهاء Background Sync
      if (event.data?.type === 'PROCESS_OFFLINE_QUEUE') {
        // نُحوّلها لحدث DOM يستمع عليه useNotes
        window.dispatchEvent(new CustomEvent('notes:process-offline-queue'));
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    // دالة التنظيف عند إلغاء تفعيل المكوّن
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [isActivated]);

  return null; // لا يُصيّر أي شيء مرئي
}
```

هذا المكوّن يحل مشكلة إتصال مهمة:

```
Service Worker (خيط مستقل)    ←→    React (نافذة المتصفح)

SW: "انتهيت من Background Sync"
  → postMessage({ type: 'PROCESS_OFFLINE_QUEUE' })

PwaRuntime يستمع ويُحوّل:
  → window.dispatchEvent(new CustomEvent('notes:process-offline-queue'))

useNotes في أي صفحة يستمع:
  → processQueue() — يُرسل العمليات المعلقة للخادم
```

### ٨.٥ app/page.tsx — إعادة التوجيه الجذرية

```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/ar'); // التوجيه للغة الافتراضية من جانب الخادم
}
```

بساطة خادعة — هذا السطر الواحد يتكفل بما يلي:
- المستخدم يكتب `/` في المتصفح
- الخادم يُرسل `HTTP 307 Redirect` إلى `/ar`
- `next-intl` middleware في `proxy.ts` سيتولى اللغة الصحيحة لاحقًا

> لماذا `redirect` من الخادم وليس client-side؟ لأن redirect الخادم أسرع (لا JavaScript يُنزَّل أولًا) ولا يُسبّب "وميضًا" في الصفحة قبل التوجيه.

---

## 9. globals.css — الأساس البصري

```css
/* 1. Box-sizing عالمي — يجعل حساب العرض والحشو متسقًا */
*, *::before, *::after {
  box-sizing: border-box;
}

/* 2. HTML الجذر */
html {
  min-height: 100%;
  scroll-behavior: smooth; /* تمرير ناعم عند الانتقال للأقسام */
}

/* 3. الجسم — لا ألوان هنا! */
body {
  /* الخلفية واللون يُديرهما MUI CssBaseline + ThemeProvider */
  /* لا تضع لونًا هنا — سيتعارض مع الوضع الداكن */
  font-family: var(--font-cairo), Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### ٩.١ حل مشكلة FOUC (وميض المحتوى غير المُنسَّق)

**المشكلة:** المستخدم يختار الوضع الداكن ويُخزَّن في localStorage. عند إعادة التحميل، React لم تُشغَّل بعد — فالصفحة تظهر بيضاء لحظةً قبل تطبيق الوضع الداكن (وميض مزعج).

**الحل في ملاحظاتي:**

```css
/* هذه القواعد تُطبَّق فورًا من CSS — قبل أي JavaScript */
html[data-color-scheme='dark'] body {
  background-color: #121212;
  color: #e8eaed;
}

html[data-color-scheme='light'] body,
html:not([data-color-scheme]) body {
  background-color: #f0f4f8;
  color: #1a1a2e;
}
```

والسكريبت في `[locale]/layout.tsx` يُضيف `data-color-scheme` لعنصر `<html>` **بشكل متزامن** قبل الرسم:

```html
<script>
  // يُقرأ من localStorage قبل React — لا وميض
  const saved = localStorage.getItem('theme-mode');
  if (saved) document.documentElement.setAttribute('data-color-scheme', saved);
</script>
```

### ٩.٢ أنماط CSS الأخرى

| القسم | الوظيفة |
|-------|---------|
| `a { color: inherit; }` | الروابط ترث لون النص (يُوحَّد بواسطة السمة) |
| `::-webkit-scrollbar` | شريط تمرير رفيع (6px) بتصميم هندسي |
| `:focus-visible` | حدود وصول للوحة المفاتيح — WCAG AA |
| `::selection` | لون تحديد النص بأزرق فاتح شفاف |
| `img, video { max-width: 100% }` | صور متجاوبة افتراضيًا |
| `@keyframes pulse` | رسوم تنبض — مُستخدمة في مؤشرات الحالة |

---

## 10. config.ts — الثوابت المركزية

```ts
// أسماء التطبيق بكلتا اللغتين
export const APP_NAME_AR = 'ملاحظاتي';
export const APP_NAME_EN = 'My Notes';
export const APP_DESCRIPTION =
  'تطبيق ويب تقدمي لإدارة الملاحظات النصية والصوتية مع مزامنة وإشعارات.';

// اللغات المدعومة
export const DEFAULT_LOCALE = 'ar';
export const SUPPORTED_LOCALES = ['ar', 'en'] as const; // as const يجعلها readonly tuple

// إعدادات صفحات القائمة
export const DEFAULT_PAGE_SIZE = 10; // ملاحظات في كل صفحة
export const MAX_PAGE_SIZE = 50;     // الحد الأقصى (لمنع طلبات ضخمة)

// حدود التخزين المحلي
export const MAX_CACHED_NOTES = 100; // أقصى ملاحظات في IndexedDB
```

**لماذا مركزة هنا وليس مبعثرة في الملفات؟**

لأن تغيير قيمة واحدة (مثل `DEFAULT_PAGE_SIZE`) يحتاج لتغيير مكان واحد فقط. لو كانت مكتوبة `10` في كل مكان، كنت ستبحث وتُعدّل في عشرات المواقع.

استخدام `as const` مهم للأنواع:
```ts
// بدون as const:
SUPPORTED_LOCALES // النوع: string[]

// مع as const:
SUPPORTED_LOCALES // النوع: readonly ['ar', 'en']
// TypeScript يعرف القيم الممكنة ويُحذّرك من القيم الخاطئة
```

---

## 11. proxy.ts — توجيه اللغة

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * وسيط next-intl للغة
 *
 * يقوم آليًا بـ:
 *   - إعادة توجيه الطلبات بدون لغة للغة الافتراضية (/ar)
 *   - ضبط cookie اللغة لكي تقرأها المكوّنات الخادمية
 *   - إضافة رؤوس alternateLinks لـ SEO
 */
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### ١١.١ لماذا اسم `proxy.ts` وليس `middleware.ts`؟

**ملاحظاتي** يُسمّي هذا الملف `proxy.ts` بدلًا من الاسم الافتراضي `middleware.ts` لوضوح أكبر: الملف لا يحتوي منطق أعمال — هو مجرد وسيط يُعيد توجيه الطلبات للغة الصحيحة. اسم `proxy` يعكس هذا الدور.

> Next.js يقبل الاسم الثاني `middleware.ts` أو أي اسم في الجذر يُصدّر `config.matcher`.

### ١١.٢ نمط المُطابَق (Matcher)

```ts
matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
```

يُطبَّق الوسيط على كل المسارات **إلا:**
- `/api/*` — مسارات API تُعالَج مباشرة
- `/_next/*` — موارد Next.js الداخلية (CSS، JS)
- `/_vercel/*` — موارد Vercel
- أي مسار يحتوي `.` — الملفات الثابتة (`favicon.ico`، `robots.txt`، الصور)

---

## 12. instrumentation.ts — تهيئة الخادم

```ts
function maskUrl(url: string): string {
  // يُخفي بيانات الاعتماد: mongodb://user:pass@host → mongodb://**:**@host
  return url.replace(/:\/\/([^@]+)@/, '://**:**@');
}

export async function register() {
  // يعمل فقط في بيئة Node.js (ليس Edge Runtime)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // طباعة معلومات الخادم عند الإقلاع
  const port = process.env.PORT ?? '3000';
  const env = process.env.NODE_ENV ?? 'development';
  console.log(`\n🚀  Next.js server started`);
  console.log(`    URL  : http://localhost:${port}`);
  console.log(`    ENV  : ${env}`);

  const mongoose = await import('mongoose');
  const { connectDB } = await import('./app/lib/mongodb');

  // تسجيل أحداث دورة حياة الاتصال
  const conn = mongoose.default.connection;
  conn.once('connected', () => { /* ✅ متصل */ });
  conn.on('disconnected', () => { /* ⚠️ انقطع */ });
  conn.on('reconnected', () => { /* 🔄 أُعيد الاتصال */ });
  conn.on('error', (err) => { /* ❌ خطأ */ });

  // تدفئة الاتصال — الطلب الأول لن يتأخر
  await connectDB();
}
```

### ١٢.١ ما هو Instrumentation Hook في Next.js؟

`instrumentation.ts` هو ملف خاص يُشغّله Next.js **مرة واحدة عند إقلاع الخادم** — قبل أي طلب. يُستخدم لـ:
- تهيئة الاتصالات (قاعدة البيانات، الخدمات الخارجية)
- إعداد نظام المراقبة والسجلات
- تسجيل معالجات الأحداث العالمية

### ١٢.٢ التحقق من NEXT_RUNTIME

```ts
if (process.env.NEXT_RUNTIME !== 'nodejs') return;
```

Next.js يمكن أن يُشغّل الكود في ثلاثة سياقات:
- **Node.js** — الخادم الكامل (نريد هذا فقط)
- **Edge** — وقت تشغيل محدود (بدون Node.js APIs)
- **Browser** — المتصفح

MongoDB لا يعمل إلا في Node.js — لذا نتحقق أولًا.

### ١٢.٣ Import الديناميكي (`await import()`)

```ts
// ليس: import mongoose from 'mongoose'; (في الأعلى)
// بل:
const mongoose = await import('mongoose');
const { connectDB } = await import('./app/lib/mongodb');
```

لماذا الاستيراد الديناميكي؟ لأن `register()` دالة `async`، والمكتبات تُستورَد فقط عند الحاجة — هذا يُقلّل من وقت إقلاع الخادم إذا لم يكن السياق Node.js (يعود مبكرًا قبل الاستيراد).

---

## 13. vitest.config.ts — إعداد الاختبارات

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()], // دعم JSX و React في الاختبارات
  test: {
    environment: 'jsdom', // محاكاة بيئة المتصفح (window, document)
    globals: true,         // describe/it/expect بدون استيراد في كل ملف
    setupFiles: ['./src/app/tests/setup.ts'], // تشغيل قبل كل ملف اختبار
    include: ['src/app/tests/**/*.test.{ts,tsx}'], // أين الاختبارات
    exclude: ['node_modules', '.next'],            // ما لا يُختبر
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // نفس مسار @ في tsconfig
    },
  },
});
```

### ١٣.١ `environment: 'jsdom'`

الاختبارات تعمل في Node.js، لكن كودنا يفترض وجود بيئة متصفح (`window`, `document`, `localStorage`, `navigator`). `jsdom` يُنشئ بيئة متصفح وهمية داخل Node.js تجعل الاختبارات ممكنة.

### ١٣.٢ `globals: true`

```ts
// بدون globals: true — يجب الاستيراد في كل ملف:
import { describe, it, expect } from 'vitest';

// مع globals: true — متاحة مباشرة:
describe('...', () => {
  it('...', () => {
    expect(...).toBe(...);
  });
});
```

### ١٣.٣ `setupFiles`

ملف `setup.ts` يُشغَّل **قبل كل ملف اختبار** — يستخدم لـ:
- استيراد `@testing-library/jest-dom` (matchers مثل `toBeInTheDocument()`)
- إعداد mocks عامة (مثل محاكاة `localStorage`)
- تنظيف الحالة بين الاختبارات

---

## 14. سكربتات المشروع — نظرة سريعة

في مجلد `scripts/` توجد أدوات مساعدة تُشغَّل من `package.json`:

| الملف | يُشغَّل بـ | الوظيفة |
|-------|-----------|---------|
| `format.mjs` | `npm run format` | تنسيق الكود بـ Prettier |
| `validate-workflow.mjs` | `npm run validate` | سير عمل الجودة الكامل |
| `http-smoke.mjs` | `npm run smoke` | اختبار دخان HTTP بعد النشر |
| `generate-icons.mjs` | — | توليد أيقونات PWA بأحجام مختلفة |
| `convert-icons.mjs` | — | تحويل صيغ الأيقونات |

> سكربتات الأيقونات تُشغَّل يدويًا عند تغيير شعار التطبيق فقط. باقيها جزء من سير عمل التطوير اليومي.

---

## 15. ملخص

### ما تعلمناه في هذا الدرس

| الملف | الدور | النقطة المهمة |
|-------|-------|---------------|
| `package.json` | هوية المشروع | `--webpack` إجباري مع Serwist، `validate` أمر الجودة الشامل |
| `.env.example` | دليل المتغيرات السرية | `NEXT_PUBLIC_` = متاح للعميل، بدونها = خادم فقط |
| `tsconfig.json` | قواعد TypeScript | `strict: true` إجباري، `@/*` للمسارات المختصرة |
| `next.config.mjs` | مركز التحكم | `reloadOnOnline: false` حماية من فقدان العمليات المعلّقة |
| `eslint.config.mjs` | فحص الكود | Flat Config (إصدار 9)، يجمع nextVitals + nextTs |
| `.prettierrc.json` | التنسيق الموحد | `endOfLine: lf` للتوافق بين Windows و Linux |
| `.gitattributes` | لتوحيد Git | يُجبر LF على كل الأنظمة |
| `next-env.d.ts` | أنواع Next.js | لا تُعدّله، مُدار آليًا |
| `app/layout.tsx` | التخطيط الجذري | فارغ عمدًا — التخطيط الحقيقي في `[locale]/layout.tsx` |
| `providers.tsx` | سلسلة المزودين | الترتيب مهم: Theme → PWA → Auth |
| `app/page.tsx` | إعادة التوجيه | redirect من الخادم — أسرع وبدون وميض |
| `globals.css` | الأساس البصري | حل FOUC بـ `data-color-scheme` + blocking script |
| `config.ts` | الثوابت المركزية | `as const` يُحسّن الأنواع ويُزيل القيم السحرية |
| `proxy.ts` | توجيه اللغة | matcher يستثني API والملفات الثابتة |
| `instrumentation.ts` | تهيئة الخادم | يعمل مرة واحدة عند الإقلاع، يُدفّئ اتصال MongoDB |
| `vitest.config.ts` | إعداد الاختبارات | `jsdom` لمحاكاة المتصفح، `globals` لتبسيط الاختبارات |

### نقطة المراقبة

بعد الانتهاء من هذا الدرس، يجب أن تستطيع:

- [ ] تشغيل `npm run dev` والوصول للتطبيق على `http://localhost:3000`
- [ ] فهم لماذا `/` يُوجَّه تلقائيًا لـ `/ar`
- [ ] تحديد مكان أي ثابت (constant) في المشروع
- [ ] إضافة متغير بيئي جديد بشكل صحيح (`.env` + `.env.example`)
- [ ] تشغيل `npm run validate` وفهم نتائجه

---

الدرس التالي → [الدرس 02: نماذج قاعدة البيانات](02-database-models.md)
