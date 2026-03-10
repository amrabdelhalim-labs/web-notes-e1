# الدرس 07: الترجمة وثنائية الاتجاه (i18n)

> هدف الدرس: بناء نظام ترجمة متكامل بالعربية والإنجليزية مع تبديل RTL/LTR تلقائي، باستخدام مكتبة `next-intl` في Next.js App Router.

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 06: نظام السمات والتخطيط](06-theme-system.md)

---

## جدول المحتويات

1. [نظرة عامة — طبقات i18n في ملاحظاتي](#1-نظرة-عامة--طبقات-i18n-في-ملاحظاتي)
2. [i18n/routing.ts — تعريف اللغات والافتراضية](#2-i18nroutingts--تعريف-اللغات-والافتراضية)
3. [i18n/request.ts — تحميل الرسائل من الخادم](#3-i18nrequestts--تحميل-الرسائل-من-الخادم)
4. [proxy.ts — middleware تحويل المسارات تلقائيًا](#4-proxyts--middleware-تحويل-المسارات-تلقائيا)
5. [lib/navigation.ts — التنقل الواعي باللغة](#5-libnavigationts--التنقل-الواعي-باللغة)
6. [[locale]/layout.tsx — الغلاف متعدد اللغات](#6-localelayouttsx--الغلاف-متعدد-اللغات)
7. [[locale]/page.tsx — نقطة الدخول](#7-localepagetsxنقطة-الدخول)
8. [[locale]/not-found.tsx — صفحة 404 ثنائية اللغة](#8-localenot-foundtsx--صفحة-404-ثنائية-اللغة)
9. [LanguageToggle.tsx — زر تبديل اللغة](#9-languagetoggletsx--زر-تبديل-اللغة)
10. [LocaleSwitchPromptDialog.tsx — اقتراح اللغة عند الدخول](#10-localeswitchpromptdialog--اقتراح-اللغة-عند-الدخول)
11. [ملفات messages/ — قواميس الترجمة](#11-ملفات-messages--قواميس-الترجمة)
12. [ملخص](#12-ملخص)

---

## 1. نظرة عامة — طبقات i18n في ملاحظاتي

### تشبيه: فندق دولي

التطبيق المتعدد اللغات كفندق دولي:
- **`routing.ts`** — لائحة اللغات المقبولة في الفندق
- **`proxy.ts`** — موظف الاستقبال (يوجّه كل زائر للجناح الصحيح)
- **`request.ts`** — مخزن الكتيبات (يُحضر الكتيب المناسب لكل نزيل)
- **`messages/*.json`** — الكتيبات نفسها (عربية / إنجليزية)
- **`lib/navigation.ts`** — مصعد ذكي (يضيف رقم الطابق تلقائيًا لكل وجهة)
- **`[locale]/layout.tsx`** — الجناح نفسه (يُضبط الاتجاه والخط حسب اللغة)

### بنية المسارات مع اللغة

```
/                   → middleware يُعيد التوجيه لـ /ar
/ar                 → [locale=ar]/page.tsx
/ar/notes           → [locale=ar]/notes/page.tsx
/en/notes           → [locale=en]/notes/page.tsx
/ar/notes/123       → [locale=ar]/notes/[id]/page.tsx
```

كل صفحة محاطة بـ `locale` صريح في URL — لا غموض في اللغة المطلوبة.

### خريطة الملفات في هذا الدرس

```
src/
  i18n/
    routing.ts                                  ← اللغات المدعومة
    request.ts                                  ← تحميل القاموس (سيرفر)
  proxy.ts                                      ← middleware
  app/
    lib/
      navigation.ts                             ← تنقل واعٍ باللغة
    [locale]/
      layout.tsx                                ← غلاف اللغة (html, dir, خطوط)
      page.tsx                                  ← نقطة دخول → تحويل حسب المصادقة
      not-found.tsx                             ← 404 ثنائي اللغة
    components/common/
      LanguageToggle.tsx                        ← زر تبديل اللغة
      LocaleSwitchPromptDialog.tsx              ← اقتراح اللغة بعد الدخول
  messages/
    ar.json                                     ← قاموس عربي (~350 مفتاح)
    en.json                                     ← قاموس إنجليزي (~350 مفتاح)
```

---

## 2. i18n/routing.ts — تعريف اللغات والافتراضية

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'] as const,  // اللغات المدعومة
  defaultLocale: 'ar' as const,    // اللغة الافتراضية ← العربية
});

// نوع مشتق: 'ar' | 'en'
export type Locale = (typeof routing.locales)[number];
```

**لماذا `as const`؟**

```ts
// بدون as const: locales: string[] — أي string مقبول
// مع as const: locales: readonly ['ar', 'en']
// النوع المشتق Locale = 'ar' | 'en' — TypeScript يكتشف خطأ 'fr' مثلًا
```

**لماذا العربية هي الافتراضية؟**

```
/       → middleware → /ar (الافتراضي)
/notes  → middleware → /ar/notes
/en     → يبقى كما هو (locale صريح)
```

الجمهور المستهدف عرب — العربية هي التجربة الأولى بدون حاجة لتحديد اللغة في URL.

### النوع `Locale` في التطبيق

```ts
// يُستخدم في:
// - [locale]/layout.tsx: (locale as Locale)
// - types.ts: SupportedLocale = Locale
// - ProfileEditor: يحفظ تفضيل اللغة كـ 'ar' | 'en'
```

---

## 3. i18n/request.ts — تحميل الرسائل من الخادم

```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale; // ← اللغة من URL (يمكن أن تكون undefined)

  // التحقق + الرجوع للافتراضي
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale; // ← 'ar' إذا كانت اللغة غير معروفة
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // ↑ Dynamic import — يُحضر الملف المناسب فقط (ar.json أو en.json)
  };
});
```

### Dynamic Import مقابل Static Import

```ts
// ❌ Static import — يُحمّل كلا الملفين دائمًا
import arMessages from '../messages/ar.json';
import enMessages from '../messages/en.json';

// ✅ Dynamic import — يُحمّل الملف المطلوب فقط في كل طلب
const messages = (await import(`../messages/${locale}.json`)).default;
```

كل طلب HTTP يحمل قاموسه فقط — أسرع تحميلًا وأقل استهلاكًا للذاكرة.

### أين يُسجَّل هذا الملف؟

```ts
// في next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
// ↑ يخبر next-intl: "ملف تكوين الطلبات هنا"
```

بدون هذا التسجيل، `next-intl` لا يعرف من أين يُحضر الرسائل.

---

## 4. proxy.ts — middleware تحويل المسارات تلقائيًا

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
  // ↑ يُطابق كل المسارات عدا:
  //   /api/...       → مسارات API (لا تحتاج locale)
  //   /_next/...     → ملفات Next.js الداخلية
  //   /.*\\..*       → الملفات الثابتة (favicon.ico، manifest.json، ...)
};
```

### ما يفعله middleware تلقائيًا

```
طلب: GET /
  → locale غير محدد → تحويل إلى GET /ar

طلب: GET /notes
  → locale غير محدد → تحويل إلى GET /ar/notes

طلب: GET /en/notes
  → locale = 'en' → يمر كما هو

طلب: GET /api/notes
  → matcher لا يطابقه → يمر مباشرة إلى API handler

طلب: GET /favicon.ico
  → الملف له نقطة (.*\\..*) → يمر مباشرة → لا تحويل
```

### لماذا الملف اسمه `proxy.ts` وليس `middleware.ts`؟

```ts
// Next.js يبحث عن middleware في ملف محدد:
// - src/middleware.ts (أو /middleware.ts في الجذر)
// لكن الاتفاقية هنا لتجنب التعارض اسم الملف proxy.ts
// وفي next.config.mjs يُشار إليه بصراحة:
// وفي الواقع next-intl يعمل كـ middleware عادي عبر export config.matcher
```

---

## 5. lib/navigation.ts — التنقل الواعي باللغة

```ts
/**
 * استورد من هنا بدلًا من 'next/navigation'
 * هذه المُصدَّرات تُضيف locale تلقائيًا لكل مسار
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

### الفرق العملي

```tsx
// ❌ next/navigation — لا يعرف اللغة
import { useRouter } from 'next/navigation';
router.push('/notes');   // → يذهب إلى /notes (بدون locale)

// ✅ @/app/lib/navigation — واعٍ باللغة
import { useRouter } from '@/app/lib/navigation';
router.push('/notes');   // → يذهب إلى /ar/notes أو /en/notes (حسب الجلسة)
```

### usePathname — بدون locale prefix

```ts
// المسار الحقيقي في URL: /ar/notes/123
const pathname = usePathname(); // ← '/notes/123' (بدون /ar)

// يمكن الاستخدام مباشرة:
pathname.startsWith('/notes') // ← true ✅ بدون قلق من locale prefix
```

هذا التجريد يجعل الكود مستقلًا عن اللغة — نفس المقارنات تعمل لـ `ar` و `en`.

### جدول المُصدَّرات

| المُصدَّر | البديل الأصلي | الفرق |
|----------|--------------|-------|
| `Link` | `next/link` | يُضيف locale لـ href |
| `redirect` | `next/navigation redirect` | يُضيف locale للمسار |
| `usePathname` | `next/navigation usePathname` | يُعيد المسار بدون locale |
| `useRouter` | `next/navigation useRouter` | يُضيف locale لكل push/replace |

---

## 6. [locale]/layout.tsx — الغلاف متعدد اللغات

هذا الملف هو قلب تجربة المستخدم متعدد اللغات:

### تحميل الخطوط والتحقق من locale

```tsx
import { Cairo, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

// خط Cairo: يدعم العربية واللاتينية
const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'], // ← كلا الاتجاهين
});

// خط Geist Mono: للكود والأرقام الثابتة
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params; // ← await لأن params وعد في Next.js 15+

  // رفض أي locale غير معروف → 404 (وحماية من injection)
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr'; // ← اشتقاق الاتجاه
  const messages = await getMessages();          // ← القاموس من request.ts
```

### بنية HTML الناتج

```tsx
<html lang={locale} dir={dir} suppressHydrationWarning>
  {/*
    lang="ar" أو lang="en" → للمتصفح ولقارئات الشاشة
    dir="rtl" أو dir="ltr" → يؤثر على:
      - ترتيب نص HTML الخام
      - اتجاه MUI layout (مع direction: dir في createTheme)
      - هوامش وحاشية CSS تتقلب تلقائيًا
    suppressHydrationWarning → يتجاهل فارق data-color-scheme بين SSR والعميل
  */}
  <head>
    {/* Script حاجب لمنع وميض السمة — من الدرس 06 */}
    <script dangerouslySetInnerHTML={{ __html: `...` }} />
  </head>
  <body className={`${cairo.variable} ${geistMono.variable}`} suppressHydrationWarning>
    <NextIntlClientProvider messages={messages} locale={locale}>
      {/* ← يُتيح useTranslations() في كل مكون عميل */}
      <EmotionCacheProvider dir={dir}>
        {/* ← يُهيّئ Emotion بالاتجاه الصحيح */}
        <Providers>{children}</Providers>
      </EmotionCacheProvider>
    </NextIntlClientProvider>
  </body>
</html>
```

### لماذا `suppressHydrationWarning` على body؟

```tsx
// الخادم يُولّد: <body class="..." data-*="value">
// العميل: React يُلاحظ فارقًا في data-* بسبب script الـ theme
// suppressHydrationWarning: "أعرف هذا الفارق — تجاهله"
// بدونه: تحذيرات hydration في console كثيرة
```

### تسلسل الاستدعاء عند تغيير اللغة

```
1. المستخدم يضغط LanguageToggle
2. router.replace(pathname, { locale: 'en' })
3. URL يتغير: /ar/notes → /en/notes
4. Next.js يُعيد تصيير [locale]/layout.tsx مع locale='en'
5. dir='ltr'، getMessages() يُحضر en.json
6. html lang="en" dir="ltr"
7. EmotionCacheProvider يُعيد init Emotion بـ LTR
8. buildTheme(mode, 'ltr') → theme.direction='ltr'
9. MUI يعكس التخطيط تلقائيًا
```

**لاحظ:** كل هذا يحدث بدون reload للصفحة — مجرد تغيير URL وNext.js يتولى الباقي.

---

## 7. [locale]/page.tsx — نقطة الدخول

```tsx
'use client';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter(); // ← من lib/navigation (واعٍ باللغة)

  useEffect(() => {
    if (!loading) {
      // بمجرد انتهاء التحقق من المصادقة → التوجيه الفوري
      router.replace(user ? '/notes' : '/login');
      //              ↑ مُسجَّل → الملاحظات
      //                          ↑ غير مُسجَّل → تسجيل الدخول
    }
  }, [loading, user, router]);

  // شاشة تحميل أثناء التحقق (لا يراها المستخدم عادةً)
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}
```

هذه الصفحة **شاشة توجيه فقط** — لا تعرض محتوى. مهمتها الوحيدة: قرار المنطق → أين يذهب المستخدم؟

```
/ar      → Home → user=true  → /ar/notes
/ar      → Home → user=false → /ar/login
/en      → Home → user=true  → /en/notes
```

`router.replace` (لا `push`) — لكيلا يُضيف `/ar` لتاريخ التنقل؛ الضغط على رجوع لا يعود لنقطة التوجيه.

---

## 8. [locale]/not-found.tsx — صفحة 404 ثنائية اللغة

### السيناريوهان المدعومان

```tsx
'use client';

export default function NotFound() {
  const isOnline = useOfflineStatus();
  const locale = useLocale(); // ← من next-intl
  const isAr = locale === 'ar';

  // الحالة 1: متصل لكن الصفحة غير موجودة
  const title = isOnline
    ? isAr ? '٤٠٤ — الصفحة غير موجودة' : '404 — Page Not Found'
    : isAr ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection';
  //                          ↑ الحالة 2: غير متصل (offline 404)
```

ملاحظة: لاحظ `٤٠٤` (أرقام عربية) في النص العربي مقابل `404` (أرقام لاتينية) في الإنجليزي. تفصيل دقيق لتجربة مستخدم أصيلة.

### لماذا لا يستخدم `useTranslations`؟

```tsx
// هذه الصفحة تظهر حتى لو فشل تحميل الرسائل
// لو استخدم useTranslations والرسائل غير متاحة → خطأ داخل صفحة الخطأ!
// الحل: نصوص مباشرة (inline) مع isAr للتحقق من اللغة
const t = useLocale(); // بدلًا من useTranslations

const backLabel = isAr ? 'العودة إلى الملاحظات' : 'Back to Notes';
const retryLabel = isAr ? 'إعادة المحاولة' : 'Retry';
```

### زر الرجوع في حالة عدم الاتصال

```tsx
<Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
  <Button variant="contained" onClick={() => router.push('/notes')}>
    {backLabel}                            {/* دائمًا موجود */}
  </Button>

  {!isOnline && (                          {/* فقط عند عدم الاتصال */}
    <Button variant="outlined" onClick={() => router.back()}>
      {retryLabel}
    </Button>
  )}
</Stack>
```

عند عدم الاتصال: المستخدم ربما يرى هذه الصفحة لأن ملاحظة معينة غير محفوظة محليًا. `router.back()` يُعيده لآخر صفحة عمل فيها — أكثر فائدة من الرجوع للقائمة.

---

## 9. LanguageToggle.tsx — زر تبديل اللغة

```tsx
'use client';

export default function LanguageToggle() {
  const locale = useLocale();               // 'ar' أو 'en' — من next-intl
  const router = useRouter();               // من lib/navigation
  const pathname = usePathname();           // المسار بدون locale

  const nextLocale = locale === 'ar' ? 'en' : 'ar'; // اللغة المستهدفة
  const label = locale === 'ar' ? 'English' : 'العربية'; // tooltip

  const handleToggle = () => {
    router.replace(pathname, { locale: nextLocale });
    // ↑ نفس الصفحة لكن بـ locale مختلف
    // /ar/notes/123 → /en/notes/123 (pathname='/notes/123' ثابت)
  };

  return (
    <Tooltip title={label}>
      <IconButton color="inherit" onClick={handleToggle} aria-label={label}>
        <Typography variant="button" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
          {locale === 'ar' ? 'EN' : 'ع'}
          {/* ↑ أظهر الاختصار المستهدف (EN للتحويل للإنجليزية، ع للعربية) */}
        </Typography>
      </IconButton>
    </Tooltip>
  );
}
```

**لاحظ:** اللغة لا تُخزَّن في `localStorage` — هي في URL. الرابط `/en/notes` دائمًا يعطي إنجليزي، `/ar/notes` دائمًا عربي. هذا يجعل الروابط قابلة للمشاركة بلغة محددة.

### قاعدة UX: أظهر الوجهة لا الحالة

```
الوضع الحالي: عربية  → الزر يُظهر: "EN" (التحويل للإنجليزية)
الوضع الحالي: إنجليزي → الزر يُظهر: "ع" (التحويل للعربية)
```

نفس مبدأ `ThemeToggle` — أظهر ما سيحدث لو ضغطت، لا ما هو الآن.

---

## 10. LocaleSwitchPromptDialog — اقتراح اللغة عند الدخول

### السياق الكامل

```
1. المستخدم يفتح التطبيق من متصفح بـ locale='ar'
2. يُسجّل دخوله
3. أثناء login: AuthContext يقرأ user.languagePref من API
4. لو user.languagePref = 'en' والمستخدم الآن في /ar/...
   → pendingLocaleSuggestion = 'en'
5. LocaleSwitchPromptDialog يظهر تلقائيًا
```

### الكود

```tsx
export default function LocaleSwitchPromptDialog() {
  const { pendingLocaleSuggestion, clearLocaleSuggestion } = useAuth();
  const t = useTranslations('LocaleSwitchPrompt');
  const router = useRouter();
  const pathname = usePathname();

  const open = pendingLocaleSuggestion !== null; // ← يفتح تلقائيًا
  const targetLocale = pendingLocaleSuggestion as SupportedLocale;

  // المستخدم وافق على التبديل
  const handleSwitch = () => {
    clearLocaleSuggestion();                               // ← لا يظهر مرة ثانية
    router.replace(pathname, { locale: targetLocale });   // ← نفس الصفحة بلغة جديدة
  };

  // المستخدم رفض التبديل
  const handleKeep = () => {
    clearLocaleSuggestion();                               // ← لا يظهر مرة ثانية
    // URL لا يتغير — يبقى بالـ locale الحالي
  };

  const langLabel = targetLocale === 'ar' ? t('arabic') : t('english');

  return (
    <Dialog open={open} onClose={handleKeep}>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('body', { lang: langLabel })}
          {/* ← ICU interpolation: "تفضيلك هو لغة الإنجليزية" */}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleKeep} variant="outlined">{t('keepCurrent')}</Button>
        <Button onClick={handleSwitch} variant="contained">{t('switchNow')}</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### تفاصيل السلوك

| الحالة | النتيجة |
|--------|--------|
| وافق على التبديل | URL يتغير → كل التطبيق يتبدل للغة المفضلة |
| رفض التبديل | يبقى بالـ locale الحالي، Dialog لا يظهر مرة أخرى في هذه الجلسة |
| أغلق الـ Dialog | نفس رفض التبديل |
| languagePref غير محدد | `pendingLocaleSuggestion = null` → Dialog لا يظهر أبدًا |

الفكرة: **المستخدم يملك القرار** — مجرد اقتراح، لا إجبار.

---

## 11. ملفات messages/ — قواميس الترجمة

### البنية الهرمية

القاموس مُنظَّم في مجموعات (namespaces) حسب المكوّن:

```json
// ar.json
{
  "App": { "name": "ملاحظاتي" },
  "AppBar": { "menu": "القائمة", "toggleTheme": "تبديل السمة", ... },
  "SideBar": { "notes": "الملاحظات", ... },
  "NoteList": { "searchPlaceholder": "بحث في الملاحظات...", ... },
  "NoteCard": { "edit": "تعديل", "delete": "حذف", ... },
  "Login": { "submit": "تسجيل الدخول", ... },
  "LocaleSwitchPrompt": { "title": "تبديل لغة الجلسة", ... }
}
```

### كيفية الاستخدام في المكونات

```tsx
// مكوّن عميل
import { useTranslations } from 'next-intl';

function AppBar() {
  const t = useTranslations('AppBar'); // ← namespace
  return <span>{t('menu')}</span>;    // ← "القائمة" أو "Menu"
}
```

```tsx
// مكوّن خادم
import { getTranslations } from 'next-intl/server';

async function ServerComponent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'NoteList' });
  return <h1>{t('emptyTitle')}</h1>;
}
```

### Interpolation — القيم الديناميكية

```json
// في القاموس
"noteCount": "{count} ملاحظة"
"body": "تفضيلك المحفوظ هو لغة ال{lang}. هل تريد التبديل إليها الآن؟"
"deleteBody": "هل أنت متأكد من حذف الملاحظة \"{noteTitle}\"؟"
```

```tsx
// في الكود
t('noteCount', { count: 42 })             // "42 ملاحظة"
t('body', { lang: 'إنجليزية' })           // "تفضيلك هو لغة الإنجليزية..."
t('deleteBody', { noteTitle: 'ملاحظتي' }) // "هل أنت متأكد من حذف الملاحظة "ملاحظتي"؟"
```

### ICU Plural — الجمع في الإنجليزية

```json
// en.json — الجمع يختلف بين اللغتين
"noteCount": "{count} {count, plural, one {note} other {notes}}"
```

```tsx
t('noteCount', { count: 1 })  // "1 note"
t('noteCount', { count: 5 })  // "5 notes"
```

```json
// ar.json — العربية لا تحتاج plural complex
"noteCount": "{count} ملاحظة"
// ← "42 ملاحظة" (كافي في السياق العربي)
```

### مقارنة القاموسين في مناطق مختارة

| المفتاح | ar.json | en.json |
|--------|---------|---------|
| `App.name` | ملاحظاتي | MyNotes |
| `AppBar.menu` | القائمة | Menu |
| `NoteList.all` | الكل | All |
| `NoteCard.edit` | تعديل | Edit |
| `Login.submit` | تسجيل الدخول | Sign in |
| `DeleteConfirmDialog.cancel` | إلغاء | Cancel |
| `LocaleSwitchPrompt.keepCurrent` | لا، أبقِها | Keep current |

---

## 12. ملخص

### الطريق الكامل لطلب "GET /ar/notes"

```
1. المتصفح: GET /ar/notes
2. proxy.ts (middleware): locale='ar' ✅ في القائمة → يمر
3. Next.js: يُطابق src/app/[locale]/notes/page.tsx
4. i18n/request.ts: يُحضر ar.json ديناميكيًا
5. [locale]/layout.tsx:
   - locale='ar' → dir='rtl'
   - html lang="ar" dir="rtl"
   - NextIntlClientProvider messages={arMessages}
   - EmotionCacheProvider dir="rtl"
6. ThemeContext.buildTheme(mode, 'rtl') → theme.direction='rtl'
7. MUI: يعكس التخطيط (padding/margin) تلقائيًا
8. المكوّنات: useTranslations('NoteList') → يُعيد النصوص العربية
```

### جدول المكونات والمسؤوليات

| الملف | المسؤولية | نوعه |
|-------|---------|------|
| `i18n/routing.ts` | قائمة اللغات المدعومة | تكوين |
| `i18n/request.ts` | تحميل القاموس المناسب لكل طلب | خادم |
| `proxy.ts` | توجيه المسارات بدون locale | middleware |
| `lib/navigation.ts` | تنقل واعٍ باللغة | أدوات |
| `[locale]/layout.tsx` | غلاف HTML مع lang/dir/خطوط | خادم |
| `[locale]/page.tsx` | شاشة توجيه (notes/login) | عميل |
| `[locale]/not-found.tsx` | 404 ثنائي اللغة + offline | عميل |
| `LanguageToggle.tsx` | زر تبديل URL locale | عميل |
| `LocaleSwitchPromptDialog.tsx` | اقتراح لغة بعد الدخول | عميل |
| `messages/ar.json` | قاموس عربي (~350 مفتاح) | بيانات |
| `messages/en.json` | قاموس إنجليزي (~350 مفتاح) | بيانات |

### الأنماط المُستخدمة في هذا الدرس

| النمط | التطبيق |
|-------|--------|
| **Locale in URL** | اللغة في المسار (`/ar/`) لا في cookie — روابط قابلة للمشاركة |
| **Dynamic Import** | `import(\`../messages/${locale}.json\`)` — تحميل القاموس المطلوب فقط |
| **Namespace Groups** | `useTranslations('AppBar')` — يعزل كل مكوّن عن الآخر |
| **ICU Plural** | `{count, plural, one {...} other {...}}` في الإنجليزية |
| **Inline Text for 404** | بدون `useTranslations` في صفحة 404 لحماية من تسلسل الأخطاء |
| **URL as Language Store** | اللغة في URL — لا localStorage للغة |
| **Suggestion not Force** | `LocaleSwitchPrompt` يقترح، لا يُجبر |
| **router.replace for locale** | `router.replace(pathname, { locale })` لا يُضيف للتاريخ |

### نقطة المراقبة

بعد الانتهاء من هذا الدرس، يجب أن تستطيع:

- [ ] شرح لماذا العربية هي الـ `defaultLocale` وتأثير ذلك على URL
- [ ] فهم لماذا `request.ts` يستخدم Dynamic Import وليس Static
- [ ] معرفة لماذا نستخدم `@/app/lib/navigation` وليس `next/navigation`
- [ ] شرح ما يفعله `suppressHydrationWarning` في `[locale]/layout.tsx`
- [ ] وصف السيناريوهين اللذين تُغطيهما `not-found.tsx` (standard 404 و offline 404)
- [ ] تفسير لماذا `not-found.tsx` لا يستخدم `useTranslations`
- [ ] فهم متى يظهر `LocaleSwitchPromptDialog` وما الفرق بين "وافق" و"رفض"
- [ ] كتابة مفتاح ترجمة جديد في `ar.json` و `en.json` واستخدامه في مكوّن

---

الدرس السابق → [الدرس 06: نظام السمات والتخطيط](06-theme-system.md) | الدرس التالي → [الدرس 08: واجهة إدارة الملاحظات](08-notes-crud.md)
