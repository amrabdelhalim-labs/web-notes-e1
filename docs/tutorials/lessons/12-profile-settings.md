# الدرس 12: الملف الشخصي وإعدادات الحساب

> هدف الدرس: بناء دورة حياة المستخدم الكاملة — من التسجيل وتسجيل الدخول، مرورًا بصفحة الملف الشخصي التي تجمع المعلومات والتفضيلات وإدارة الأجهزة والإشعارات، وصولًا إلى حذف الحساب بحماية مزدوجة.

---

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 11: الإشعارات الفورية وإدارة الأجهزة الموثوقة](11-push-notifications.md)

---

## فهرس هذا الدرس

1. [نظرة معمارية — دورة حياة المستخدم](#1-نظرة-معمارية--دورة-حياة-المستخدم)
2. [صفحة التسجيل — register/page.tsx](#2-صفحة-التسجيل--registerpagesx)
3. [صفحة تسجيل الدخول — login/page.tsx](#3-صفحة-تسجيل-الدخول--loginpagesx)
4. [صفحة الملف الشخصي — profile/page.tsx](#4-صفحة-الملف-الشخصي--profilepagetsx)
5. [ProfileEditor — تحرير الحقول منفردةً](#5-profileeditor--تحرير-الحقول-منفردةً)
6. [EditableField — المكوّن المساعد للتحرير المضمّن](#6-editablefield--المكوّن-المساعد-للتحرير-المضمّن)
7. [إدارة الأجهزة وإشعارات Push في ProfileEditor](#7-إدارة-الأجهزة-وإشعارات-push-في-profileeditor)
8. [DeleteAccountDialog — حذف الحساب بحماية مزدوجة](#8-deleteaccountdialog--حذف-الحساب-بحماية-مزدوجة)
9. [ملخص](#9-ملخص)

---

## 1. نظرة معمارية — دورة حياة المستخدم

### تشبيه: دورة عضوية في نادٍ

تخيّل أن **ملاحظاتي** نادٍ اجتماعي له نظام عضوية:

- **مكتب التسجيل** — يملأ الزائر بيانات العضوية ويحصل على بطاقة (= `register/page.tsx`)
- **بوابة الدخول** — يُريها عند كل زيارة (= `login/page.tsx`)
- **لوحة معلومات العضو** — تُعرض عند طلبها: عدد الزيارات، تاريخ الانضمام، الخدمات المفعّلة (= `profile/page.tsx`)
- **نموذج تحديث البيانات** — كل حقل يُحدَّث منفردًا: الاسم بدون توقف العمل، الهاتف بدون مس الاسم (= `ProfileEditor`)
- **إجراء إلغاء العضوية** — يتطلب توقيعًا + كلمة مرور + تأكيد مزدوج (= `DeleteAccountDialog`)

---

### خريطة الملفات

```
[locale]/register/page.tsx       ← إنشاء حساب جديد
[locale]/login/page.tsx          ← دخول الحساب
[locale]/profile/page.tsx        ← نقطة التجميع (orchestrator)
components/profile/
  ProfileEditor.tsx               ← تحرير وإدارة (932 سطرًا)
  DeleteAccountDialog.tsx         ← حذف الحساب
```

**تدفق التنقل:**

```
/register ──(نجح التسجيل)──► /notes
/login ────(نجح الدخول)────► /notes
   ↑                           │
   └──(موثّق مسبقًا)──redirect─┘

/profile → ProfileEditor + DeleteAccountDialog + PwaActivationDialog
```

---

## 2. صفحة التسجيل — register/page.tsx

**الملف:** `src/app/[locale]/register/page.tsx` ← 161 سطرًا

### البنية العامة

```tsx
'use client';

export default function RegisterPage() {
  const t = useTranslations('Register');
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── إعادة توجيه المستخدم الموثّق مسبقًا ──────────────────────────
  useEffect(() => {
    if (!authLoading && user) router.replace('/notes');
  }, [authLoading, user, router]);

  if (authLoading || user) return null; // لا نعرض النموذج للمستخدم الموثّق
  // ...
}
```

---

### redirect vs replace في useRouter

```typescript
router.replace('/notes');  // يستبدل الإدخال في سجل التاريخ
router.push('/notes');     // يُضيف إدخالًا جديدًا في سجل التاريخ
```

عند redirect المستخدم الموثّق:
- `replace` — يمنع الضغط "رجوع" من إعادته لصفحة تسجيل لا معنى لها
- `push` — يستخدم بعد التسجيل/الدخول الناجح: المستخدم قد يريد الضغط "رجوع" للتلكؤات

---

### التحقق قبيل الإرسال

```typescript
const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError('');

  // ─── تحقق أمامي (client-side) ─────────────────────────────────────
  if (!username.trim() || username.trim().length < 3) {
    setError(t('errors.usernameTooShort'));
    return; // أوقف الإرسال فورًا
  }
  if (!email.trim()) {
    setError(t('errors.emailRequired'));
    return;
  }
  if (password.length < 6) {
    setError(t('errors.passwordTooShort'));
    return;
  }
  if (password !== confirmPassword) {
    setError(t('errors.passwordMismatch'));
    return;
  }

  // ─── إرسال للخادم ──────────────────────────────────────────────────
  setSubmitting(true);
  try {
    await register(username.trim(), email.trim(), password);
    router.push('/notes');
  } catch (err) {
    setError(err instanceof Error ? err.message : t('errors.failed'));
  } finally {
    setSubmitting(false);
  }
};
```

**`SyntheticEvent<HTMLFormElement>`** — نوع TypeScript لحدث submit من نموذج HTML. يُتيح الوصول لـ `e.target` المكتوب، ويضمن أن `e.preventDefault()` تعمل على حدث النموذج وليس غيره.

**`username.trim()`** — التحقق بعد مسح المسافات: مستخدم يُدخل `"  ab  "` (مسافات) سيجتاز فحص `length >= 3` ظاهريًا. `trim()` يُزيل هذه الحالة الزائفة.

**لماذا التحقق الأمامي قبل الخادم؟**

| التحقق الأمامي | التحقق في الخادم |
|---------------|-----------------|
| فوري بدون شبكة | يتطلب رحلة شبكية |
| يُوفّر طلبات API | حتمي للأمان |
| UX أفضل (رسالة فورية) | يصطاد حالات تجاوز JS |
| قابل للتحايل (DevTools) | لا يمكن تجاوزه |

**الاثنان مطلوبان** — الأمامي لتجربة المستخدم، والخلفي للأمان.

---

### حقول النموذج والـ autoComplete

```tsx
<TextField
  label={t('username')}
  autoComplete="username"      // ← يُفعّل مدير كلمات المرور
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  disabled={submitting}        // ← يمنع التعديل أثناء الإرسال
/>
<TextField
  label={t('password')}
  type="password"
  autoComplete="new-password"  // ← يميّز بين حقل إنشاء وإدخال
  ...
/>
<TextField
  label={t('confirmPassword')}
  type="password"
  autoComplete="new-password"  // ← نفس القيمة: المتصفح يعرف أنه تأكيد
  ...
/>
```

**`autoComplete="new-password"`** بدل `"current-password"`:
- `new-password`: مدير كلمات المرور يعرض اقتراح كلمة مرور جديدة قوية
- `current-password`: يعرض كلمة المرور المحفوظة للحساب الحالي

الفرق يُحسّن تجربة مدير كلمات المرور بشكل ملحوظ.

**`<Box component="form" onSubmit={handleSubmit} noValidate>`**

`noValidate` يُعطّل HTML5 native validation (فقاعات المتصفح الافتراضية) لصالح منطق React المخصص. يُتيح تحكمًا كاملًا في شكل رسائل الخطأ وموضعها.

---

### if (authLoading || user) return null

```typescript
// ← بعد الـ hooks وقبل الـ render
if (authLoading || user) return null;
```

**لماذا `return null` وليس redirect في الـ render؟**

- Redirect في render يُسبّب تحديثًا أثناء render (لا يُسمح به في React)
- `useEffect` يُشغَّل بعد أول render — بعد `return null` لا يكون هناك أي JSX يُعرض
- فترة `authLoading = true` (عادةً مئات milliseconds): لا نُريد إظهار النموذج ثم إخفاءه — `return null` يُعطي render فارغ فورًا

---

## 3. صفحة تسجيل الدخول — login/page.tsx

**الملف:** `src/app/[locale]/login/page.tsx` ← 131 سطرًا

### نفس النمط — أبسط

Login يشترك مع Register في نفس النمط مع اختلافات:

| الجانب | Register | Login |
|--------|---------|-------|
| عدد الحقول | 4 (username, email, password, confirm) | 2 (email, password) |
| autoComplete كلمة المرور | `new-password` | `current-password` |
| التحقق الأمامي | 4 شروط | شرطان فقط |
| بعد النجاح | `router.push('/notes')` | `router.push('/notes')` |

```typescript
const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError('');

  if (!email.trim()) {
    setError(t('errors.emailRequired'));
    return;
  }
  if (password.length < 6) {
    setError(t('errors.passwordTooShort'));
    return;
  }

  setSubmitting(true);
  try {
    await login(email.trim(), password);
    router.push('/notes');
  } catch (err) {
    setError(err instanceof Error ? err.message : t('errors.failed'));
  } finally {
    setSubmitting(false);
  }
};
```

**لماذا التحقق على طول `password` وليس وجوده؟**

`password.length < 6` يصطاد كلاهما: الحقل الفارغ (length = 0) وكلمة المرور القصيرة جدًا. تحقق واحد يغني عن اثنين.

**بيانات المصادقة من الخادم:**

```typescript
// useAuth.login() يُرسل للخادم
await login(email.trim(), password);
// ← email.trim(): نُزيل مسافات — لكن password لا نُزيله
//   المستخدم قد يقصد مسافة في كلمة المرور (على رغم أن ذلك غير شائع)
```

---

## 4. صفحة الملف الشخصي — profile/page.tsx

**الملف:** `src/app/[locale]/profile/page.tsx` ← 187 سطرًا

### الصفحة كـ Orchestrator

`profile/page.tsx` لا تحتوي منطق أعمال معقدًا — هي تُجمّع مكوّنات:

```
ProfilePage
├─ بطاقة الإحصاءات (noteCount + joinDate)
├─ <ProfileEditor />           ← القسم الرئيسي
├─ قسم PWA (activate/deactivate)
├─ منطقة الخطر <DeleteAccountDialog />
└─ <PwaActivationDialog />     ← حوار التفعيل
```

---

### عداد الملاحظات مع Fallback للكاش

```typescript
useEffect(() => {
  let cancelled = false; // ← يمنع setState بعد unmount

  getNotesApi({ page: 1, limit: 1 })
    .then((res) => {
      if (!cancelled) setNoteCount(res.data.count); // العدد الإجمالي من الخادم
    })
    .catch(async () => {
      // ─── Fallback: الخادم غير متاح — استخدم الكاش المحلي ────────
      if (!cancelled) {
        try {
          const cached = await getCachedNotes();
          setNoteCount(cached.length); // قد تكون قديمة أو ناقصة
        } catch {
          setNoteCount(null); // أُعرض '...' في الواجهة
        }
      }
    });

  return () => {
    cancelled = true; // تنظيف: لو unmount قبل الاستجابة
  };
}, []);
```

**متغير `cancelled`** — بديل بسيط لـ `AbortController` في حالات الاستجابة البسيطة:

```typescript
// بدون cancelled:
// 1. useEffect يُشغَّل → طلب API يبدأ
// 2. المستخدم ينتقل لصفحة أخرى → unmount
// 3. الطلب ينجح → setState على مكوّن unmounted → تحذير React

// مع cancelled:
return () => { cancelled = true; };
// الاستجابة تأتي لكن التحقق if (!cancelled) يمنع setState
```

**`{ page: 1, limit: 1 }`** — نُرسل طلبًا بـ limit=1 ولكن نستخدم `res.data.count` (العدد الإجمالي من الـ pagination metadata). نريد العدد الكلي، لا حاجة لجلب كل الملاحظات.

---

### إحصاءات المستخدم مع toLocaleDateString

```typescript
const joinDate = user?.createdAt
  ? new Date(user.createdAt).toLocaleDateString(
      locale === 'ar' ? 'ar-EG' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    )
  : '—';
```

**`locale === 'ar' ? 'ar-EG' : 'en-US'`:**
- `ar-EG`: العربية المصرية — الأرقام عربية (١٢ يناير ٢٠٢٥)
- `en-US`: الإنجليزية الأمريكية — January 12, 2025

`toLocaleDateString` يُعيد نصًا مناسبًا للقارئ حسب اللغة بدون مكتبات خارجية.

---

### حالات قسم PWA الثلاث

```tsx
{/* الحالة 1: الجهاز موثوق + PWA غير مفعّل → زر التفعيل */}
{!isActivated && isTrusted && (
  <Button
    variant="contained"
    startIcon={<WifiOffIcon />}
    onClick={() => setActivationDialogOpen(true)}
  >
    {t('pwaActivateButton')}
  </Button>
)}

{/* الحالة 2: PWA مفعّل → عرض الحالة + خيار الإلغاء */}
{isActivated && (
  <Stack direction="row" spacing={2} alignItems="center">
    <Chip icon={<CheckCircleIcon />} label={t('pwaActiveLabel')} color="success" variant="outlined" />
    <Button
      size="small"
      color="error"
      onClick={() => deactivate()}
      disabled={isDeactivating}
    >
      {t('pwaDeactivateButton')}
    </Button>
  </Stack>
)}

{/* الحالة 3: الجهاز غير موثوق + PWA غير مفعّل → توجيه للتوثيق */}
{!isTrusted && !isActivated && (
  <Typography variant="body2" color="text.secondary">
    {t('pwaTrustRequired')}
  </Typography>
)}
```

**جدول الحالات:**

| `isActivated` | `isTrusted` | ما يُعرض |
|--------------|------------|---------|
| false | true | زر "فعّل وضع Offline" |
| true | أي | Chip نجاح + زر إلغاء |
| false | false | رسالة "وثّق جهازك أولًا" |

**ملاحظة: الحالة الثانية (`isActivated=true`) تُهيمن** — لو PWA مفعّل فلا حاجة لعرض حالة الثقة.

---

### isTrusted في ProfilePage — نفس نمط ConnectionIndicator

```typescript
const [isTrusted, setIsTrusted] = useState(false);

useEffect(() => {
  const readTrusted = () => setIsTrusted(localStorage.getItem('device-trusted') === 'true');
  readTrusted();

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'device-trusted') readTrusted();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener('device-trust-changed', readTrusted);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('device-trust-changed', readTrusted);
  };
}, []);
```

نفس النمط في `ConnectionIndicator` (الدرس 11): localStorage + StorageEvent للتبويبات الأخرى + custom event للتبويب الحالي. الزر يظهر/يختفي فور منح الثقة بدون reload.

---

## 5. ProfileEditor — تحرير الحقول منفردةً

**الملف:** `src/app/components/profile/ProfileEditor.tsx` ← 932 سطرًا

### فلسفة التحرير: كل حقل كيان مستقل

```
النمط المعتاد (Save All):              النمط المستخدم هنا (Per-Field):
┌──────────────────────────┐           ┌──────────────────────────┐
│ username: [John_doe    ] │           │ username: John_doe  [✏️] │
│ email:    [john@...    ] │           │ email:    john@...  [✏️] │
│ display:  [John        ] │           │ display:  John      [✏️] │
│                          │           │                          │
│     [حفظ الكل]           │           │   (كل حقل يُحفظ فورًا)   │
└──────────────────────────┘           └──────────────────────────┘
         ⚠️ خطر:                               ✅ آمن:
   تغيير 1 حقل → حفظ الكل                تغيير 1 حقل → حفظ 1 حقل
   خطأ في API → ضياع كل التغييرات        خطأ في API → حقل واحد متأثر
```

**`saveField` — حفظ حقل واحد:**

```typescript
const saveField = useCallback(
  async (field: 'username' | 'email' | 'displayName', val: string) => {
    if (!user) return;
    // نُرسل الكل لـ API لكن نُغيّر حقلًا واحدًا فقط
    const res = await updateUserApi(user._id, {
      username:    field === 'username'    ? val : user.username,
      email:       field === 'email'       ? val : user.email,
      displayName: field === 'displayName' ? val || undefined : user.displayName,
    });
    updateUser(res.data); // تحديث AuthContext
  },
  [user, updateUser]
);
```

**لماذا نُرسل باقي الحقول رغم أننا لا نُغيّرها؟**

`updateUserApi` يستخدم `PUT` (أو `PATCH`) للمستخدم الكامل — الخادم يتوقع الكائن الكامل. نُرسل الحقل المُغيَّر ونحتفظ بالباقي من `user` الحالي. بديل أنظف هو استخدام `PATCH` مع الحقل الواحد فقط — لكن `PUT` يُبسّط API الخادم.

---

### validateUsername — تحقق مشترك

```typescript
type TFunc = (key: string) => string;

function validateUsername(val: string, t: TFunc): string | null {
  if (val.length < 3)           return t('usernameErrors.tooShort');
  if (/\s/.test(val))           return t('usernameErrors.hasSpaces');
  if (!/^[a-z0-9._-]+$/.test(val)) return t('usernameErrors.invalidChars');
  return null; // صالح
}
```

**تعريف `TFunc`** — بديل بسيط لاستيراد نوع `useTranslations` كاملًا. يُجرّد دالة الترجمة لاستخدام `validateUsername` خارج سياق React (في tests مثلًا) بتمرير دالة بسيطة `(key) => key`.

**`/^[a-z0-9._-]+$/`** — يسمح بـ lowercase + أرقام + نقطة + شرطة سفلية + شرطة. يمنع Unicode والمسافات والرموز الخاصة في أسماء المستخدمين.

---

### تغيير كلمة المرور — نموذج مجمّع

```typescript
const handlePasswordSubmit = useCallback(
  async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMsg(null);

    // ─── 4 تحققات مرتّبة حسب الأولوية ──────────────────────────────
    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: t('passwordErrors.currentRequired') });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: t('passwordErrors.newTooShort') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: t('passwordErrors.mismatch') });
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordMsg({ type: 'error', text: t('passwordErrors.sameAsCurrent') });
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await changePasswordApi(user._id, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordMsg({ type: 'success', text: res.message || t('passwordErrors.success') });
      // إفراغ الحقول بعد النجاح
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : t('passwordErrors.failed') });
    } finally {
      setPasswordSubmitting(false);
    }
  },
  [user, currentPassword, newPassword, confirmPassword]
);
```

**لماذا كلمة المرور نموذج مجمّع (وليس per-field)?**

حقول كلمة المرور مترابطة منطقيًا:
- `confirmPassword` لا معنى له بدون `newPassword`
- `currentPassword` كله أو لا شيء للتحقق من الهوية
- التحقق من `newPassword !== confirmPassword` يحتاج الحقلين معًا

Per-field للحقول المستقلة (اسم، بريد) — نموذج مجمّع للحقول المترابطة (كلمة المرور).

**`currentPassword === newPassword`** — شرط إضافي يمنع "تغيير" كلمة المرور لنفسها. مفيد لكن الخادم يجب أن يتحقق أيضًا.

---

### تفضيل اللغة — حفظ فوري بدون تأكيد

```tsx
<RadioGroup
  value={langPref}
  onChange={(e) => {
    const val = e.target.value as UserLanguagePref;
    setLangPref(val); // optimistic update فوري
    saveLangPref(val); // ثم حفظ في الخادم
  }}
>
  <FormControlLabel value="ar" control={<Radio />} label={t('languageAr')} />
  <FormControlLabel value="en" control={<Radio />} label={t('languageEn')} />
  <FormControlLabel value="unset" control={<Radio />} label={t('languageUnset')} />
</RadioGroup>
```

**لماذا لا يوجد تأكيد لتغيير اللغة؟**

| العملية | تأكيد مطلوب؟ | السبب |
|---------|-------------|-------|
| تغيير اسم المستخدم | نعم | يؤثر على كيف يُمثّل المستخدم للآخرين |
| تغيير البريد | نعم | بيانات حساسة تؤثر على الدخول |
| تغيير اللغة | لا | سهل التغيير، لا مخاطر، بديهي |
| تغيير كلمة المرور | نعم | إجراء أمني |
| حذف الحساب | نعم (مزدوج) | لا رجعة |

اللغة انعكاسي — المستخدم يُغيّرها ويرى النتيجة فورًا، يُغيّرها مجددًا إن لم تعجبه.

---

## 6. EditableField — المكوّن المساعد للتحرير المضمّن

**مكوّن داخلي** في `ProfileEditor.tsx` (لا يُصدَّر)

### حالات EditableField

```
[text]  [✏️]         ← وضع القراءة (isEditing = false)
[input] [✓] [✗]      ← وضع التحرير (isEditing = true)
[text]  ✅ تم الحفظ  ← رسالة النجاح (successMsg، تختفي خلال 3 ثوانٍ)
```

### خطوتا الحفظ (two-step confirmation)

```typescript
// الخطوة 1: المستخدم يضغط ✓ → تحقق ثم افتح حوار تأكيد
const handleConfirm = () => {
  const trimmed = draft.trim();
  if (trimmed === value.trim()) {
    setEditing(false); // لم يتغير → أغلق بدون حوار
    return;
  }

  if (validate) {
    const err = validate(trimmed);
    if (err) {
      setError(err); // أُبلّغ الخطأ في مكانه
      return;
    }
  }

  // كل شيء صحيح → اسأل المستخدم تأكيد التغيير
  setPendingVal(trimmed);
};

// الخطوة 2: المستخدم يضغط "تأكيد" في الحوار → احفظ فعلًا
const handleDialogConfirm = async () => {
  if (pendingVal === null) return;
  setSaving(true);
  setPendingVal(null); // أغلق الحوار فورًا
  try {
    await onSave(pendingVal);      // ← استدعاء saveField
    setEditing(false);
    setSuccessMsg(t('saveSuccess', { label }));
  } catch (err) {
    setError(err instanceof Error ? err.message : t('saveFailed'));
    // نُبقي الحقل مفتوحًا ليُصلح المستخدم
  } finally {
    setSaving(false);
  }
};
```

**لماذا حوار التأكيد قبل الحفظ؟**

تغيير اسم المستخدم أو البريد الإلكتروني يؤثر على الدخول المستقبلي — خطأ طباعي قد يُضيّع وصول المستخدم. الحوار يُريه "من" و"إلى":

```
تغيير البريد الإلكتروني
━━━━━━━━━━━━━━━━━━━━━━━━
  john_old@example.com  →  john_new@example.com
        [إلغاء]                [تأكيد]
```

---

### successMsg — إشعار النجاح المؤقت

```typescript
const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

// Auto-dismiss بعد 3 ثوانٍ
useEffect(() => {
  if (successMsg) {
    successTimer.current = setTimeout(() => setSuccessMsg(null), 3000);
  }
  return () => {
    if (successTimer.current) clearTimeout(successTimer.current); // تنظيف
  };
}, [successMsg]);
```

**لماذا `useRef` للـ timer؟**

`setTimeout` يُعيد معرّفًا (رقمًا). لو خزّنّاه في `useState`, كل تحديث لـ state يُعيد render المكوّن. `useRef` يخزن القيمة بدون إطلاق re-render عند التغيير — مثالي للمؤقتات والمراجع المتغيّرة.

**`role="status" aria-live="polite"`** على رسالة النجاح:

```tsx
<Typography role="status" aria-live="polite" ...>
  {successMsg}
</Typography>
```

يُخطر قارئات الشاشة بالتغيير بشكل "مهذّب" (لا يقاطع ما يُقرأ حاليًا). إضافة بسيطة تُحسّن Accessibility بشكل كبير.

---

### handleKeyDown — تجربة مستخدم الكيبورد

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter')  handleConfirm(); // ← تأكيد
  if (e.key === 'Escape') handleCancel();  // ← إلغاء
};
```

المستخدم لا يحتاج الوصول للأزرار — يمكنه تحرير الحقل والضغط Enter لتأكيد أو Escape للإلغاء.

---

### الحوار يعرض التغيير بصريًا

```tsx
<Stack direction={{ xs: 'column', sm: 'row' }} ...>
  <Box component="span" sx={{ color: 'error.main' }}>
    {type === 'password' ? '••••••' : value || '—'}  {/* القيمة القديمة */}
  </Box>
  <Box component="span" sx={{ color: 'text.secondary' }}>→</Box>
  <Box component="span" sx={{ color: 'success.main' }}>
    {type === 'password' ? '••••••' : pendingVal}     {/* القيمة الجديدة */}
  </Box>
</Stack>
```

**`type === 'password' ? '••••••' : value`** — حقول كلمة المرور لا تُعرض بشكل نصي حتى في حوار التأكيد. هذا يمنع عرض كلمة المرور في نص واضح على الشاشة.

---

## 7. إدارة الأجهزة وإشعارات Push في ProfileEditor

### قسم Trusted Devices

```typescript
const {
  devices,
  loading: devicesLoading,
  error: devicesError,
  isTrusted: isCurrentDeviceTrusted,
  trustCurrent,
  removeDevice,
} = useDevices(); // ← Hook الدرس 11
```

**قائمة الأجهزة — أيقونة ذكية:**

```tsx
{device.os === 'Android' || device.os === 'iOS'
  ? <PhoneAndroidIcon color="action" />   // ← جوال
  : <LaptopIcon color="action" />          // ← حاسوب
}
```

المعلومات من `useDeviceId` (browser, os) تُستخدم لتحسين العرض المرئي.

---

### حوار توثيق الجهاز مع كلمة المرور

```typescript
// state التحكم
const [showTrustDialog, setShowTrustDialog] = useState(false);
const [trustPassword, setTrustPassword] = useState('');
const [trustPasswordError, setTrustPasswordError] = useState<string | null>(null);
const [trustingDevice, setTrustingDevice] = useState(false);

const handleTrustConfirm = useCallback(async () => {
  if (!trustPassword) return;
  setTrustingDevice(true);
  setTrustPasswordError(null);
  try {
    await trustCurrent(trustPassword);
    setShowTrustDialog(false);
    setTrustPassword('');
  } catch (err) {
    setTrustPasswordError(err instanceof Error ? err.message : td('loadError'));
    // ← الحوار يبقى مفتوحًا لتصحيح كلمة المرور
  } finally {
    setTrustingDevice(false);
  }
}, [trustPassword, trustCurrent, td]);
```

**حوار الإزالة مشابه لكن بـ `confirmRemoveId` بدل `showTrustDialog`:**

```typescript
const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
```

`confirmRemoveId = null` → الحوار مغلق  
`confirmRemoveId = deviceId` → الحوار مفتوح للجهاز المحدد

**لماذا نُميّز بين أجهزة مختلفة بمتغير واحد؟**

المستخدم يضغط "إزالة" على جهاز محدد — نحتاج معرفة أي جهاز. بدلًا من حوار لكل جهاز (`showRemove_<id>`) — متغير واحد يحمل الـ ID يُغطي كل الحالات.

---

### قسم Push Notifications — 3 حراس متتابعة

```typescript
const swNotReady = swState !== 'active'; // الحارس الأول: SW غير جاهز

// useEffect effect 1 — فحص الدعم والحالة (شُرح في الدرس 11)
```

```tsx
{/* الحارس 1: SW غير جاهز */}
{swNotReady && (
  <Alert severity="info">
    {tp('requiresServiceWorker')}
    {/* حالة SW الحالية للتوضيح */}
    {swState === 'unsupported' ? tp('swUnsupported')
     : swState === 'checking'  ? tp('swChecking')
     : swState === 'installing' ? tp('swInstalling')
     : tp('swInactive')}
  </Alert>
)}

{/* الحارس 2: الجهاز غير موثوق */}
{!swNotReady && !isCurrentDeviceTrusted && (
  <Alert severity="warning">{tp('requiresTrust')}</Alert>
)}

{/* الحارس 3: pushStatus (unsupported/denied/unsubscribed/subscribed) */}
{!swNotReady && isCurrentDeviceTrusted && pushStatus === 'unsupported' && (
  <Typography>{tp('unsupported')}</Typography>
)}
{!swNotReady && isCurrentDeviceTrusted && pushStatus === 'denied' && (
  <Typography color="error">{tp('denied')}</Typography>
)}
{!swNotReady && isCurrentDeviceTrusted && (pushStatus === 'unsubscribed' || pushStatus === 'subscribed') && (
  <Button
    variant={pushStatus === 'subscribed' ? 'outlined' : 'contained'}
    onClick={pushStatus === 'subscribed' ? pushUnsubscribe : pushSubscribe}
    disabled={!isOnline} // ← لا مزامنة offline للاشتراك
  >
    {pushStatus === 'subscribed' ? tp('unsubscribe') : tp('subscribe')}
  </Button>
)}
```

**الزر المزدوج (اشترك/ألغِ):**

```typescript
variant={pushStatus === 'subscribed' ? 'outlined' : 'contained'}
// ← outlined للإجراء الثانوي (إلغاء)، contained للإجراء الرئيسي (اشتراك)
```

نفس الزر يؤدي عملتين حسب الحالة — يوفّر مساحة ويجعل الحالة الحالية واضحة.

---

## 8. DeleteAccountDialog — حذف الحساب بحماية مزدوجة

**الملف:** `src/app/components/profile/DeleteAccountDialog.tsx` ← 161 سطرًا

### لماذا "حماية مزدوجة"؟

```
التأكيد الأول:  زر "احذف حسابي" يفتح الحوار (المستخدم ينتبه)
التأكيد الثاني: كلمة المرور في الحوار (المستخدم يُثبت هويته)
```

لحذف الحساب:
1. المستخدم يضغط الزر → يرى تحذيرًا واضحًا
2. يُدخل كلمة المرور → الخادم يتحقق من هويته
3. نجح → `logout()` + redirect للـ `/login`

---

### الزر مُعطَّل حين offline مع Tooltip

```tsx
<Tooltip
  title={!isOnline ? t('offlineDisabled') : ''}
  arrow
  disableHoverListener={isOnline}    // ← لا tooltip حين online
  disableFocusListener={isOnline}
  disableTouchListener={isOnline}
>
  {/* <span> ضرورية: Tooltip لا يعمل على عنصر disabled مباشرة */}
  <span>
    <Button
      color="error"
      onClick={handleOpen}
      disabled={!isOnline}
      aria-disabled={!isOnline}      // ← للـ accessibility
    >
      {t('openButton')}
    </Button>
  </span>
</Tooltip>
```

**`<span>` حول الـ Button المعطَّل:**

MUI `Tooltip` يحتاج الـ child أن يُمرّر props (onMouseEnter etc.). العนصر `disabled` في HTML يمنع هذه الأحداث. `<span>` يُلتقط الأحداث ويُمرّرها للـ Tooltip.

```
بدون span:  hover على زر disabled → Tooltip لا يظهر
مع span:    hover على span → Tooltip يظهر عادةً
```

**`disableHoverListener/FocusListener/TouchListener`** — يُعطّل الـ Tooltip حين online. يمنع ظهور tooltip فارغ (`title=""`) عند hover حين لا توجد رسالة للعرض.

---

### handleClose يمنع الإغلاق أثناء الإرسال

```typescript
const handleClose = useCallback(() => {
  if (submitting) return; // ← إن كان الخادم يُعالج → لا إغلاق
  setOpen(false);
}, [submitting]);
```

لو أغلق المستخدم الحوار أثناء الإرسال:
- الطلب لا يُلغى (لا `AbortController` هنا)
- قد يُحذف الحساب ثم لا يحدث `logout()` + redirect
- مشكلة UX وأمان معًا

تعطيل الإغلاق يضمن انتظار استجابة الخادم قبل التنظيف.

---

### تسلسل الحذف الكامل

```typescript
const handleConfirm = useCallback(
  async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    if (!password) {
      setError(t('errors.passwordRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await deleteUserApi(user._id, password);
      logout();            // ← مسح AuthContext + localStorage
      router.push('/login'); // ← إعادة توجيه
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.failed'));
    } finally {
      setSubmitting(false);
    }
  },
  [user, password, logout, router]
);
```

**تسلسل ما يحدث عند نجاح الحذف:**

```
deleteUserApi(id, password)         ← حذف من قاعدة البيانات
    → logout()                      ← مسح jwt من localStorage + setState(null)
        → user = null في AuthContext
        → PrivateRoute يكتشف user=null → redirect /login
    → router.push('/login')         ← redirect صريح (أسرع من انتظار PrivateRoute)
```

---

### Warning Alert واضح

```tsx
<Alert severity="warning" sx={{ mb: 2 }}>
  {t('warning')}  {/* "هذا الإجراء لا يمكن التراجع عنه. ستُحذف جميع ملاحظاتك نهائيًا." */}
</Alert>
```

التحذير يُعرض **داخل الحوار** (ليس قبل فتحه). المستخدم لا بد أن يقرأه ويتجاوزه للوصول لحقل كلمة المرور.

---

### وضع disabled على كلا الزرين

```tsx
<DialogActions>
  <Button onClick={handleClose} disabled={submitting}>
    {t('cancel')}
  </Button>
  <Button
    type="submit"
    color="error"
    disabled={submitting || !password}
  >
    {submitting ? <CircularProgress size={22} color="inherit" /> : t('confirm')}
  </Button>
</DialogActions>
```

حين `submitting`:
- زر الإغلاق: لا يغلق الحوار (مدعوم بـ `handleClose` أيضًا)
- زر التأكيد: يُعرض دوّامة بدلًا من النص

حين `!password`:
- زر التأكيد: معطَّل — لا يُرسَل طلب فارغ

---

## 9. ملخص

| ما تعلمناه | الملف | التفصيل |
|------------|-------|---------|
| `router.replace` بدل `push` لـ redirect الموثّق | `register/login` | يمنع الرجوع لصفحة تسجيل |
| `if (authLoading || user) return null` | `register/login` | عرض فارغ بدل نموذج ثم إخفاء |
| `SyntheticEvent<HTMLFormElement>` | جميع النماذج | نوع TypeScript لحدث submit |
| `noValidate` على النموذج | جميع النماذج | تعطيل native validation لصالح React |
| التحقق الأمامي + الخلفي كلاهما مطلوب | `register/login/ProfileEditor` | UX + أمان |
| `autoComplete` يُميّز بين `new-password` و `current-password` | جميع النماذج | تحسين مدير كلمات المرور |
| cancelled ref لـ async في useEffect | `profile/page.tsx` | يمنع setState بعد unmount |
| `limit: 1` لجلب العداد فقط | `profile/page.tsx` | كفاءة: count من metadata لا من البيانات |
| toLocaleDateString مع locale | `profile/page.tsx` | تنسيق التاريخ حسب اللغة |
| 3 حالات PWA (trusted/activated/neither) | `profile/page.tsx` | منطق عرض شرطي متسلسل |
| Per-field saving بدل Save All | `ProfileEditor` | كل حقل يُحفظ مستقلًا |
| تحقق مشترك في `validateUsername` | `ProfileEditor` | دالة نقية قابلة للاختبار |
| نموذج مجمّع لكلمة المرور (الحقول مترابطة) | `ProfileEditor` | الفصل عن per-field للاستقلالية |
| تفضيل اللغة يُحفظ فورًا بدون تأكيد | `ProfileEditor` | إجراء منخفض الخطورة |
| Two-step confirmation في EditableField | `EditableField` | validate → pendingVal → Dialog → save |
| successMsg auto-dismiss بـ useRef timer | `EditableField` | لا re-render للتحديث |
| `handleKeyDown` للـ Enter/Escape | `EditableField` | UX الكيبورد |
| عرض القيم في حوار التأكيد | `EditableField` | من → إلى بصريًا |
| `<span>` حول Button disabled للـ Tooltip | `DeleteAccountDialog` | حل MUI معروف |
| `handleClose` يحظر الإغلاق حين submitting | `DeleteAccountDialog` | يضمن تنفيذ logout بعد الحذف |
| `disableHoverListener` لتعطيل Tooltip | `DeleteAccountDialog` | يمنع tooltip فارغًا |
| confirmRemoveId بدل boolean للأجهزة | `ProfileEditor` | حوار واحد لأجهزة متعددة |
| 3 حراس Push (SW + Trust + pushStatus) | `ProfileEditor` | تسلسل منطقي وضوح الحالة |

---

### نقطة المراقبة

قبل الانتقال للدرس التالي، تأكد من قدرتك على الإجابة:

1. لماذا تستخدم صفحتا register و login `router.replace` لـ redirect المستخدم الموثّق and `router.push` بعد النجاح؟ ما الفرق في سجل التاريخ؟
2. ما الهدف من نمط `let cancelled = false` في useEffect لجلب `noteCount`؟ ما المشكلة التي يحلّها؟
3. لماذا يستخدم `EditableField` خطوتين للحفظ (handleConfirm ثم handleDialogConfirm)؟ ما القيمة التي يُضيفها الحوار الوسيط؟
4. لماذا تغيير كلمة المرور نموذج مجمّع بينما الاسم والبريد per-field؟ ما الفرق المنطقي؟
5. لماذا يحتاج حوار DeleteAccountDialog لـ `<span>` حول الزر المعطَّل؟ ماذا يحدث بدونها عند hover؟

---

الدرس السابق → [الدرس 11: الإشعارات الفورية وإدارة الأجهزة الموثوقة](11-push-notifications.md) | الدرس التالي → [الدرس 13: الاختبارات الشاملة](13-testing.md)
