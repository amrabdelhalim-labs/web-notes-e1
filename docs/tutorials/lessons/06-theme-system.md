# الدرس 06: نظام السمات والتخطيط

> هدف الدرس: بناء نظام سمات متكامل (فاتح/داكن + RTL/LTR) وهيكل التخطيط المتجاوب، مع فهم نمط الأمان من Hydration Mismatch والحفاظ على معايير WCAG للتباين.

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 05: مسارات API](05-api-routes.md)

---

## جدول المحتويات

1. [نظرة عامة — طبقات النظام البصري](#1-نظرة-عامة--طبقات-النظام-البصري)
2. [lib/ui-constants.ts — الثوابت البصرية الموحدة](#2-libui-constantsts--الثوابت-البصرية-الموحدة)
3. [EmotionCacheProvider — تهيئة Emotion لاتجاه النص](#3-emotioncacheprovider--تهيئة-emotion-لاتجاه-النص)
4. [context/ThemeContext.tsx — قلب نظام السمة](#4-contextthemecontexttsx--قلب-نظام-السمة)
5. [hooks/useThemeMode.ts — واجهة استهلاك السياق](#5-hooksusethememodet--واجهة-استهلاك-السياق)
6. [ThemeToggle.tsx — زر التبديل](#6-themetoggletsx--زر-التبديل)
7. [AppBar.tsx — شريط التطبيق العلوي](#7-appbartsx--شريط-التطبيق-العلوي)
8. [SideBar.tsx — الشريط الجانبي المتجاوب](#8-sidebartsx--الشريط-الجانبي-المتجاوب)
9. [MainLayout.tsx — التخطيط الرئيسي](#9-mainlayouttsx--التخطيط-الرئيسي)
10. [ملخص](#10-ملخص)

---

## 1. نظرة عامة — طبقات النظام البصري

### تشبيه: شبكة كهربائية

النظام البصري كشبكة كهربائية في مبنى:
- **`ui-constants.ts`** — لوحة التحكم الرئيسية (مقاييس ثابتة: الأبعاد والأوزان والظلال)
- **`EmotionCacheProvider`** — المحول الفرعي (يُعيد توجيه CSS حسب اتجاه النص)
- **`ThemeContext`** — المحطة المركزية (تُولّد "وصفة الألوان" وتُوزّعها)
- **المكونات** — الأجهزة الكهربائية (تستهلك السمة دون معرفة مصدرها)

الاتجاه في المبنى دائمًا واحد للأعلى ← لا مكوّن يُعدّل السمة؛ الجميع يقرأ فقط.

### خريطة الملفات في هذا الدرس

```
src/app/
  lib/
    ui-constants.ts                  ← ثوابت الأبعاد والانتقالات والظلال
  components/layout/
    EmotionCacheProvider.tsx         ← تهيئة Emotion (RTL/LTR)
  context/
    ThemeContext.tsx                 ← بناء السمة وإدارتها (428 سطر)
  hooks/
    useThemeMode.ts                  ← خطاف وصول للسياق
  components/common/
    ThemeToggle.tsx                  ← زر تبديل الوضع (UI فقط)
  components/layout/
    AppBar.tsx                       ← شريط علوي ثابت (162 سطر)
    SideBar.tsx                      ← قائمة جانبية متجاوبة (165 سطر)
    MainLayout.tsx                   ← التخطيط العام + حماية المصادقة
```

### سلسلة Providers في providers.tsx

```tsx
// providers.tsx (من الدرس 01)
<EmotionCacheProvider dir={dir}>
  <ThemeProviderWrapper>     {/* ← ThemeContext */}
    <PwaActivationProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </PwaActivationProvider>
  </ThemeProviderWrapper>
</EmotionCacheProvider>
```

`EmotionCacheProvider` في الخارج لأنه يجب أن يُهيّئ Emotion **قبل** أن `ThemeProvider` يبدأ في إنشاء قواعد CSS.

---

## 2. lib/ui-constants.ts — الثوابت البصرية الموحدة

### لماذا ملف ثوابت مركزي؟

بدلًا من تكرار `240` في كل مكان يستخدم عرض الـ Drawer:

```tsx
// ❌ بدون ثوابت — تكرار وأخطاء صامتة
// SideBar.tsx
sx={{ width: 240 }}
// MainLayout.tsx
marginLeft: 240
// SomeOtherComponent.tsx  — نسي الشخص الثاني وكتب 250 !
marginLeft: 250
```

```tsx
// ✅ مع ثوابت
import { DRAWER_WIDTH } from '@/app/lib/ui-constants';
sx={{ width: DRAWER_WIDTH }}           // 240 في كل مكان
```

تغيير واحد في `ui-constants.ts` يُصحّح كل التطبيق دفعة واحدة.

### القيم المُعرَّفة

```ts
// ─── AppBar ────────────────────────────────────────────────────
// MUI Toolbar defaults: 56px mobile، 64px desktop
export const APP_BAR_HEIGHT = {
  xs: 56,
  sm: 64,
} as const;

// ─── Sidebar Drawer ────────────────────────────────────────────
export const DRAWER_WIDTH = 240; // pixel

// ─── Z-index layers ────────────────────────────────────────────
// مقياس MUI: drawer=1200، appBar≈1100
// نرفع AppBar لـ 1201 ليعلو على الـ Drawer الثابت
export const Z_INDEX = {
  appBar: 1201,
  offlineBanner: 1201, // يشارك المستوى ليبقى مرئيًا
} as const;

// ─── Transitions ───────────────────────────────────────────────
export const TRANSITIONS = {
  colorFast: 'color 0.2s ease-in-out',
  colorMedium: 'color 0.3s ease-in-out',
  bgFast: 'background-color 0.2s ease-in-out',
  bgMedium: 'background-color 0.3s ease-in-out',
  all: 'all 0.2s ease-in-out',
} as const;

// ─── Elevation / Box-shadows ───────────────────────────────────
// ظلال منفصلة للوضع الفاتح والداكن
export const SHADOWS = {
  sm: { light: '0 2px 8px rgba(0,0,0,0.15)',  dark: '0 2px 8px rgba(0,0,0,0.4)'  },
  md: { light: '0 4px 14px rgba(0,0,0,0.2)', dark: '0 4px 14px rgba(0,0,0,0.6)' },
  lg: { light: '0 5px 15px rgba(0,0,0,0.2)', dark: '0 5px 15px rgba(0,0,0,0.7)' },
} as const;
```

### لماذا `as const`؟

```ts
// بدون as const: TypeScript يستنتج أن DRAWER_WIDTH: number
// مع as const: يُستنتج أن DRAWER_WIDTH: 240 (literal type)
// المُفيد: الـ IDE يُكمل القيمة الدقيقة ويكتشف الخطأ مبكرًا

const width: typeof DRAWER_WIDTH = 241; // ❌ خطأ TypeScript فوري
```

### جدول استخدام الثوابت

| الثابت | مَن يستخدمه |
|--------|------------|
| `DRAWER_WIDTH` | `SideBar.tsx` (عرض الـ Drawer)، `MainLayout.tsx` (هامش المحتوى) |
| `Z_INDEX.appBar` | `AppBar.tsx` (ليعلو على SideBar) |
| `Z_INDEX.offlineBanner` | `OfflineBanner.tsx` |
| `TRANSITIONS.bgFast` | `SideBar.tsx` (تحريك التحديد النشط) |
| `TRANSITIONS.all` | `SideBar.tsx` (زر الخروج بالهوفر) |
| `SHADOWS.*` | `ThemeContext.tsx` (تجاوزات مكونات MUI) |

---

## 3. EmotionCacheProvider — تهيئة Emotion لاتجاه النص

### المشكلة التي يحلها

MUI يستخدم **Emotion** لتوليد CSS. عند RTL، يجب عكس الخصائص تلقائيًا:
- `margin-left: 16px` → `margin-right: 16px`
- `padding-right: 8px` → `padding-left: 8px`
- `border-radius: 4px 0 0 4px` → `border-radius: 0 4px 4px 0`

هذا العكس يُنجَز بمكوّن إضافي (plugin) لـ **stylis** (معالج CSS الذي تستخدمه Emotion). المشكلة: `stylisPlugins` ليست قابلة للتسلسل → لا يمكن تمريرها عبر حدود Server/Client.

**الحل:** `EmotionCacheProvider` مكوّن عميل (`'use client'`) يُنشئ الـ cache محليًا.

### الكود

```tsx
'use client'; // إلزامي — stylisPlugins غير قابلة للتسلسل

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

// إعدادات RTL: مفتاح 'muirtl' + prefixer + rtlPlugin
const RTL_OPTIONS = {
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
};

// إعدادات LTR: مفتاح 'mui' + prefixer فقط
const LTR_OPTIONS = {
  key: 'mui',
  stylisPlugins: [prefixer],
};

interface EmotionCacheProviderProps {
  children: ReactNode;
  dir?: 'rtl' | 'ltr';
}

export default function EmotionCacheProvider({ children, dir = 'rtl' }: EmotionCacheProviderProps) {
  return (
    <AppRouterCacheProvider options={dir === 'rtl' ? RTL_OPTIONS : LTR_OPTIONS}>
      {children}
    </AppRouterCacheProvider>
  );
}
```

### لماذا مفتاحان مختلفان؟

```ts
key: 'muirtl' // ← RTL: Emotion ينشئ cache منفصلة بهاشات مختلفة
key: 'mui'    // ← LTR: cache عادية
```

لو استخدما نفس المفتاح، عند تبديل اللغة قد يُعاد استخدام CSS من الـ cache الخاطئة.

### تدفق البيانات

```
[locale]/layout.tsx
  ↓ dir="rtl" أو "ltr"
EmotionCacheProvider (dir={dir})
  ↓ AppRouterCacheProvider options={RTL_OPTIONS أو LTR_OPTIONS}
    ↓ Emotion: كل قاعدة CSS تمر بـ stylisPlugins
      ↓ [prefixer] [rtlPlugin] → CSS مقلوب للعربية
```

---

## 4. context/ThemeContext.tsx — قلب نظام السمة

هذا الملف مركب (428 سطر) — نتناوله بأربعة أجزاء.

### الجزء أ: buildTheme — وصفة الألوان

```ts
const STORAGE_KEY = 'theme-mode'; // مفتاح localStorage

function buildTheme(mode: PaletteMode, dir: 'rtl' | 'ltr' = 'rtl') {
  const isDark = mode === 'dark';

  return responsiveFontSizes( // ← أحجام خطوط تتكيف مع حجم الشاشة تلقائيًا
    createTheme({
      direction: dir,          // ← MUI يقلب الـ layout كاملًا (margin/padding/etc.)
      palette: { mode, ... },  // ← ألوان
      typography: {
        fontFamily: 'var(--font-cairo), Arial, sans-serif',
        body1: { lineHeight: 1.7 }, // ← تباعد سطور أريح للعربية
      },
      shape: { borderRadius: 12 },  // ← حواف مدورة ناعمة
      components: { ... },          // ← تجاوزات مكونات MUI
    })
  );
}
```

### الجزء ب: لوحة الألوان مع WCAG

```ts
primary: {
  // الوضع الفاتح: أزرق داكن (#1565c0) — نسبة تباين مع الأبيض: 5.84:1 ✅ AA
  // الوضع الداكن: أزرق فاتح (#42a5f5) — لكن الأبيض عليه يُعطي 2.64:1 ❌ فشل WCAG
  //   الحل: contrastText في الوضع الداكن → كحلي داكن (#0a1929): 7.57:1 ✅ AAA
  main:         isDark ? '#42a5f5'  : '#1565c0',
  contrastText: isDark ? '#0a1929' : '#ffffff', // ← النقطة الدقيقة
},
```

**لماذا لا نستخدم الأبيض دائمًا للـ `contrastText`؟**

| اللون الرئيسي | contrastText=white | النسبة | نتيجة WCAG |
|--------------|-------------------|--------|-----------|
| `#1565c0` (فاتح) | `#ffffff` | 5.84:1 | ✅ AA |
| `#42a5f5` (داكن) | `#ffffff` | 2.64:1 | ❌ فشل |
| `#42a5f5` (داكن) | `#0a1929` | 7.57:1 | ✅ AAA |

بسit الاختيار: الأزرق الفاتح `#42a5f5` بارز على الخلفيات الداكنة، لكن النص الأبيض عليه لا يكفي. الحل: نص كحلي داكن بدلًا من الأبيض.

### تجاوزات مكونات MUI (components overrides)

```ts
components: {
  // حدود أقوى للحقول والـ Chips
  MuiOutlinedInput: {
    styleOverrides: {
      notchedOutline: () => ({
        borderWidth: '1.5px', // ← أوضح من 1px الافتراضي
        borderColor: isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)',
      }),
    },
  },

  // الأزرار: خط عريض، بدون CAPS
  MuiButton: {
    styleOverrides: {
      root: () => ({
        fontWeight: 600,
        textTransform: 'none', // ← العربية لا تحتاج uppercase
      }),
    },
  },

  // الـ Dialog: افتراضيًا fullWidth على xs
  MuiDialog: {
    defaultProps: {
      maxWidth: 'xs',
      fullWidth: true, // ← كل Dialog في التطبيق متجاوب تلقائيًا
    },
  },

  // MenuItem المُعطَّل (info items): كامل الوضوح رغم disabled
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&.Mui-disabled': {
          opacity: 1,               // ← لا يتلاشى
          color: 'inherit',
          '& .MuiTypography-root': { color: theme.palette.text.primary },
        },
      }),
    },
  },
}
```

### الجزء ج: نمط أمان Hydration (Hydration Safety Pattern)

هذا أحد أكثر الأجزاء دقة في الكود:

**المشكلة:**

```
الخادم (SSR):   يُولّد theme بـ mode='light'  → hash CSS: "abc123"
العميل:         useState يقرأ localStorage:'dark' → theme بـ dark → hash: "xyz789"
React hydration: هاشات مختلفة! → ⚠️ Hydration Mismatch Error
```

**الحل في ملاحظاتي:**

```ts
// ❌ الطريقة الخاطئة — تؤدي لـ Hydration Mismatch
const [mode, setMode] = useState<PaletteMode>(() => {
  const stored = localStorage.getItem(STORAGE_KEY); // ← localStorage غير متاح SSR!
  return stored === 'dark' ? 'dark' : 'light';
});

// ✅ الطريقة الصحيحة — نبدأ دائمًا بـ 'light' (يطابق الخادم)
const [mode, setMode] = useState<PaletteMode>('light'); // ← ثابت، يطابق SSR

// بعد الـ Hydration، نُطبّق التفضيل الحقيقي
useEffect(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved: PaletteMode =
    stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';

  startTransition(() => setMode(resolved)); // ← تحديث لا يعوق الـ UI
  document.documentElement.setAttribute('data-color-scheme', resolved);
}, []); // ← مرة واحدة، بعد الـ hydration
```

**منع وميض الشاشة (Flash Prevention):**

```tsx
// في [locale]/layout.tsx — script حاجب (blocking) يُنفَّذ قبل React
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      var stored = localStorage.getItem('theme-mode');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var mode = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';
      document.documentElement.setAttribute('data-color-scheme', mode);
    })();
  `
}} />
```

```css
/* في globals.css */
html[data-color-scheme='dark'] {
  background-color: #121212; /* ← خلفية داكنة قبل أن React يُحمَّل */
  color-scheme: dark;
}
```

**الترتيب الكامل:**

```
1. HTML يُرسَل من الخادم (mode=light)
2. <script> يُنفَّذ → يضع data-color-scheme='dark' على <html>
3. globals.css: html[data-color-scheme='dark'] → خلفية داكنة فوريًا
4. React Hydration: يبدأ بـ 'light' → يطابق الخادم ✅
5. useEffect يعمل → startTransition setMode('dark')
6. buildTheme('dark', ...) → ThemeProvider يُعيد التصيير
7. المستخدم يرى الوضع الداكن الصحيح — بدون وميض
```

### الجزء د: toggleMode وإعادة حساب السمة

```ts
const toggleMode = useCallback(() => {
  setMode((prev) => {
    const next = prev === 'light' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, next);         // ← حفظ
    document.documentElement.setAttribute('data-color-scheme', next); // ← مزامنة CSS فورية
    return next;
  });
}, []); // ← useCallback يُثبّت المرجع — لا إعادة render للمُستهلكين

// theme يُعاد حسابه عند تغيير mode أو locale (dir)
const theme = useMemo(() => buildTheme(mode, dir), [mode, dir]);
// ↑ dir مشتق من useLocale() — يتغير عند تبديل اللغة
```

**لماذا `document.documentElement.setAttribute` داخل `toggleMode` أيضًا؟**

لأن `useEffect` يعمل بعد الـ render (بتأخير). لو انتظرنا، ستكون هناك لحظة قصيرة جدًا تبدو فيها الخلفية بالوضع القديم بينما React يُعيد التصيير. `setAttribute` المباشر لا يوجد له تأخير.

### بنية Provider

```tsx
export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  // ... (state، locale، toggleMode، theme، ctxValue)

  return (
    <ThemeContext.Provider value={ctxValue}> // ← { mode, toggleMode }
      <ThemeProvider theme={theme}>          // ← MUI: كل مكوّن يرث theme
        <CssBaseline />                      // ← تطبيع CSS عالمي (margin=0، etc.)
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
```

`CssBaseline` ضروري لـ MUI — يُطبّق `box-sizing: border-box` ويُزيل هوامش المتصفح الافتراضية.

---

## 5. hooks/useThemeMode.ts — واجهة استهلاك السياق

```ts
'use client';

import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/app/context/ThemeContext';

export function useThemeMode(): ThemeContextValue {
  return useContext(ThemeContext);
}
```

15 سطرًا فقط — لكن قيمته كبيرة:

| بدون الخطاف | مع الخطاف |
|------------|----------|
| `import { useContext } from 'react'` | `import { useThemeMode } from '@/app/hooks/useThemeMode'` |
| `import { ThemeContext, ThemeContextValue } from '@/app/context/ThemeContext'` | (لا شيء) |
| `const { mode, toggleMode } = useContext(ThemeContext)` | `const { mode, toggleMode } = useThemeMode()` |

لو تغيّر التنفيذ (مثلًا: من Context لـ Zustand)، فقط `useThemeMode.ts` يتغيّر — كل المكونات تبقى كما هي.

---

## 6. ThemeToggle.tsx — زر التبديل

```tsx
'use client';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();
  const t = useTranslations('AppBar');
  const label = t('toggleTheme'); // ← نص مُترجَم لـ aria-label

  return (
    <Tooltip title={label}>
      <IconButton color="inherit" onClick={toggleMode} aria-label={label}>
        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        {/* ↑ في الداكن: أظهر أيقونة "الشمس" (للتحويل للفاتح)  */}
        {/* ↑ في الفاتح: أظهر أيقونة "القمر" (للتحويل للداكن) */}
      </IconButton>
    </Tooltip>
  );
}
```

**قاعدة الأيقونة: أظهر الحالة المستهدفة، لا الحالية:**

```
الوضع الحالي: داكن  → الزر يُظهر ☀️ (الشمس) → "اضغط للتحويل للفاتح"
الوضع الحالي: فاتح  → الزر يُظهر 🌙 (القمر) → "اضغط للتحويل للداكن"
```

هذا مبدأ UX مألوف: المستخدم يبحث عن "ما سيحدث"، لا "ما هو الآن".

---

## 7. AppBar.tsx — شريط التطبيق العلوي

### البنية الهيكلية

```tsx
<MuiAppBar position="fixed" sx={{ zIndex: Z_INDEX.appBar }}>
  {/* position="fixed" → لا يتحرك عند التمرير */}
  {/* zIndex: 1201 → يعلو على SideBar الثابت (zIndex=1200) */}

  <Toolbar sx={{ gap: 0.5, px: { xs: 1, sm: 2 } }}>

    {/* ① زر القائمة — يظهر فقط على xs/sm/md (يختفي على md+) */}
    <IconButton
      sx={{ display: { md: 'none' }, ... }}
      onClick={onMenuClick}
    >
      <MenuIcon />
    </IconButton>

    {/* ② عنوان التطبيق — يظهر من sm وما فوق */}
    <Typography
      sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
    >
      {tApp('name')} {/* ← "ملاحظاتي" من ملف الترجمة */}
    </Typography>

    {/* ③ spacer مرن على xs (يملأ المساحة بدل العنوان) */}
    <Box sx={{ flexGrow: 1, display: { sm: 'none' } }} />

    {/* ④ مجموعة أيقونات الزاوية */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.5 } }}>
      {isActivated && <ConnectionIndicator />} {/* ← فقط لو PWA مُفعَّل */}
      <ThemeToggle />
      <LanguageToggle />
      {user && <IconButton onClick={handleMenuOpen}><AccountCircleIcon /></IconButton>}
    </Box>

  </Toolbar>

  {/* ⑤ قائمة المستخدم — Portal خارج الـ DOM الطبيعي */}
  {user && (
    <Menu anchorEl={anchorEl} open={menuOpen} ...>
      <MenuItem disabled> {/* ← يعرض الاسم كمعلومة، لا كإجراء */}
        <Typography variant="subtitle2" fontWeight={700}>
          {user.displayName || user.username}
        </Typography>
        {user.displayName && (
          <Typography variant="caption" color="text.secondary">
            @{user.username}
          </Typography>
        )}
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleProfile}> ... </MenuItem>
      <Tooltip title={!isOnline ? t('logoutOfflineDisabled') : ''}>
        <span> {/* ← ضروري: Tooltip لا يعمل مباشرة على مكوّن disabled */}
          <MenuItem onClick={handleLogout} disabled={!isOnline}>
            ...
          </MenuItem>
        </span>
      </Tooltip>
    </Menu>
  )}
</MuiAppBar>
```

### خطة استجابة الشاشة في AppBar

| العنصر | xs (جوال) | sm (لوحي) | md+ (سطح) |
|--------|----------|----------|----------|
| زر القائمة | ✅ يظهر | ✅ يظهر | ❌ يختفي |
| عنوان التطبيق | ❌ يختفي | ✅ يظهر | ✅ يظهر |
| Spacer المرن | ✅ يظهر | ❌ يختفي | ❌ يختفي |
| مجموعة الأيقونات | ✅ gap=0 | ✅ gap=0.5 | ✅ gap=0.5 |

### لماذا `<span>` حول MenuItem المُعطَّل؟

```tsx
<Tooltip title="تسجيل الخروج معطَّل أثناء عدم الاتصال">
  <span>                        {/* ← لا `<div>` لكيلا يكسر تخطيط القائمة */}
    <MenuItem disabled>...</MenuItem>
  </span>
</Tooltip>
```

`Tooltip` يحتاج الاستماع لأحداث `onMouseEnter/onMouseLeave` من العنصر الابن. لكن المكوّن `disabled` لا يُطلق هذه الأحداث. `<span>` يقبل الأحداث نيابةً عنه.

---

## 8. SideBar.tsx — الشريط الجانبي المتجاوب

### نظام التحول Permanent ↔ Temporary

```tsx
<>
  {/* Mobile — Drawer مؤقت (يفتح/يُغلق) */}
  <Drawer
    variant="temporary"
    anchor="left"                      // ← MUI يعكسه لـ anchor="right" في RTL
    open={open}                        // ← يتحكم به MainLayout
    onClose={onClose}
    ModalProps={{ keepMounted: true }} // ← يحافظ على DOM للأداء
    sx={{ display: { xs: 'block', md: 'none' }, ... }}
  >
    {drawerContent}
  </Drawer>

  {/* Desktop — Drawer دائم (مرئي دائمًا) */}
  <Drawer
    variant="permanent"
    anchor="left"                      // ← نفس الـ anchor، MUI يُعكسه تلقائيًا
    sx={{ display: { xs: 'none', md: 'block' }, width: DRAWER_WIDTH, ... }}
    open                               // ← لا معنى له في permanent لكن إلزامي للتعامد الصحيح
  >
    {drawerContent}
  </Drawer>
</>
```

**لاحظ:** `anchor="left"` في كلا النوعين — لكن عند تفعيل RTL في الـ theme، MUI يعكسه تلقائيًا لـ "right" دون تغيير الكود. هذا سحر `direction: 'rtl'` في `createTheme`.

### KeepMounted — الأداء أولًا

```tsx
ModalProps={{ keepMounted: true }}
```

بدونه: كل مرة يُفتح الـ Drawer المؤقت، React يُنشئ DOM من الصفر. مع `keepMounted`: DOM موجود دائمًا في الذاكرة — الفتح أسرع وأمتع.

### نمط التحديد النشط

```tsx
items.map((item) => (
  <ListItemButton
    key={item.path}
    selected={pathname.startsWith(item.path)}
    // ↑ /notes تُحدد عند /notes، /notes/123، /notes/123/edit
    onClick={() => navigate(item.path)}
    sx={activeItemSx}
  >
```

```ts
// activeItemSx — أنماط التحديد
'&.Mui-selected': {
  bgcolor: 'primary.main',             // ← اللون الأساسي
  color: 'primary.contrastText',       // ← نص آمن (كحلي في الداكن، أبيض في الفاتح)
  '& .MuiListItemIcon-root': {
    color: 'primary.contrastText',     // ← الأيقونة تتبع النص
  },
  '&:hover': { bgcolor: 'primary.dark' }, // ← أغمق قليلًا عند الهوفر
},
```

### زر الخروج في القاع

```tsx
<List sx={{ mt: 'auto' }}>  {/* ← يُدفع للأسفل بـ flexbox */}
  <ListItemButton
    disabled={!isOnline}
    onClick={() => { logout(); router.push('/login'); }}
    sx={{
      color: 'error.main',             // ← أحمر للتحذير
      '&:hover': {
        bgcolor: 'error.main',         // ← خلفية حمراء كاملة
        color: 'error.contrastText',   // ← نص أبيض
      },
    }}
  >
```

`mt: 'auto'` في flexbox يدفع هذا العنصر لنهاية المحور — Bottom-aligned بدون تعقيد.

---

## 9. MainLayout.tsx — التخطيط الرئيسي

### حارس المصادقة + تهيئة حالة الـ Drawer

```tsx
export default function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // حارس المصادقة — يعمل عند كل تغيير في user أو loading
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login'); // replace (لا push) — لا تاريخ للصفحة المحمية
    }
  }, [loading, user, router]);

  // شاشة تحميل - أثناء التحقق من المصادقة
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null; // في طريقه للـ redirect — لا تُصيِّر شيئًا
```

**لماذا `router.replace` وليس `router.push`؟**

| `router.push('/login')` | `router.replace('/login')` |
|------------------------|---------------------------|
| يضيف `/login` لتاريخ المتصفح | يستبدل الصفحة الحالية في التاريخ |
| المستخدم يضغط "رجوع" → يعود للصفحة المحمية | ضغط "رجوع" → يذهب لما قبل الصفحة المحمية |

### هيكل التخطيط

```tsx
return (
  <Box sx={{ display: 'flex' }}>
    {/* ① AppBar ثابت (fixed) — لا يأخذ مساحة في التدفق */}
    <AppBar onMenuClick={() => setDrawerOpen((o) => !o)} />

    {/* ② SideBar — permanent على desktop، temporary على mobile */}
    <SideBar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

    {/* ③ منطقة المحتوى الرئيسي */}
    <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <Toolbar />     {/* ← spacer بارتفاع AppBar (لا يُخفي محتوى خلف الـ AppBar الثابت) */}
      <OfflineBanner />
      <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, flexGrow: 1 }}>
        {children}
      </Box>
    </Box>

    {/* ④ DeviceTrustPrompt — نافذة حوار لا تؤثر في التدفق */}
    <DeviceTrustPrompt />
  </Box>
);
```

**لماذا `minWidth: 0` في منطقة المحتوى؟**

```css
/* flexbox quirk: flex items لا يتقلصون أقل من min-content افتراضيًا */
/* بدون minWidth: 0 — محتوى طويل بدون مسافات (URL، كود) يُفيض الحاوية */
/* مع minWidth: 0 — المحتوى يلتزم بحدود الحاوية ويقطع عند الحاجة */
```

### خريطة التفاعلات

```
المستخدم يضغط زر القائمة في AppBar
  ↓ onMenuClick() → setDrawerOpen(true)
  ↓ SideBar تفتح (open={true})
  ↓ المستخدم يضغط خارج الـ Drawer
  ↓ onClose() → setDrawerOpen(false)
  ↓ SideBar تُغلق

المستخدم يختار صفحة من SideBar
  ↓ navigate(path) → router.push(path)
  ↓ onClose() → setDrawerOpen(false)  ← يُغلق على mobile تلقائيًا
```

### الثلاثي: AppBar + SideBar + Toolbar spacer

```
┌─────────────────────────────────────────────────────────┐
│  AppBar (fixed, z=1201)                                  │  64px
├──────────┬──────────────────────────────────────────────┤
│          │  <Toolbar /> ← spacer بارتفاع AppBar         │
│ SideBar  │─────────────────────────────────────────────  │
│ 240px    │  <OfflineBanner />                            │
│ (md+)    │─────────────────────────────────────────────  │
│          │  <Box p={3}> {children} </Box>                │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
```

بدون `<Toolbar />` كـ spacer، المحتوى سيبدأ من الأعلى ويختبئ خلف الـ AppBar الثابت.

---

## 10. ملخص

### جدول المكونات والمسؤوليات

| الملف | المسؤولية | يُستهلك من |
|-------|---------|-----------|
| `ui-constants.ts` | أرقام ثابتة (أبعاد، z-index، انتقالات) | جميع مكونات التخطيط |
| `EmotionCacheProvider` | تجهيز Emotion لـ RTL/LTR | `providers.tsx` |
| `ThemeContext.tsx` | بناء السمة، تبديلها، الحفظ في localStorage | `providers.tsx` |
| `useThemeMode.ts` | واجهة وصول للسياق (خطاف) | `ThemeToggle`, أي مكوّن |
| `ThemeToggle.tsx` | زر UI لتبديل الوضع | `AppBar.tsx` |
| `AppBar.tsx` | شريط علوي (logo + icons + user menu) | `MainLayout.tsx` |
| `SideBar.tsx` | تنقل جانبي (permanent + temporary) | `MainLayout.tsx` |
| `MainLayout.tsx` | يجمع كل شيء + حماية مصادقة | كل الصفحات المحمية |

### الأنماط المُستخدمة في هذا الدرس

| النمط | التطبيق |
|-------|--------|
| **Single Source of Truth** | `ui-constants.ts` للقيم المشتركة |
| **Hydration Safety** | `useState('light')` + `useEffect` بدلًا من قراءة localStorage في الـ init |
| **startTransition** | تحديثات الحالة من localStorage كـ non-urgent |
| **`as const`** | أنواع literal بدلًا من primitive types |
| **RTL Automatic** | `direction: dir` في `createTheme` يعكس التخطيط كاملًا |
| **keepMounted** | Drawer يحافظ على DOM للأداء |
| **`mt: 'auto'`** | دفع زر الخروج للقاع في flexbox |
| **`router.replace`** | إعادة توجيه بدون إضافة للتاريخ |
| **`<span>` wrapper** | Tooltip على مكوّن disabled |
| **WCAG-compliant palette** | `contrastText` مدروس لكل لون في كل وضع |

### نقطة المراقبة

بعد الانتهاء من هذا الدرس، يجب أن تستطيع:

- [ ] شرح لماذا نبدأ `useState` بـ `'light'` ونتجاهل localStorage في الـ init
- [ ] وصف الفرق بين `RTL_OPTIONS` و `LTR_OPTIONS` في `EmotionCacheProvider`
- [ ] معرفة لماذا `anchor="left"` لا يتعارض مع اللغة العربية
- [ ] شرح لماذا `ThemeToggle` يُظهر أيقونة الوضع الآخر (الهدف، لا الحالة الراهنة)
- [ ] فهم كيف `<Toolbar />` spacer يمنع اختفاء المحتوى خلف AppBar الثابت
- [ ] معرفة لماذا نستخدم `router.replace` بدلًا من `router.push` في حارس المصادقة
- [ ] شرح حالة `minWidth: 0` في منطقة المحتوى الرئيسي
- [ ] قراءة جدول WCAG للألوان وفهم لماذا `contrastText` في الداكن ليس أبيضًا

---

الدرس السابق → [الدرس 05: مسارات API](05-api-routes.md) | الدرس التالي → [الدرس 07: الترجمة وثنائية الاتجاه](07-internationalization.md)
