# الدرس 04: المصادقة والحماية

> هدف الدرس: بناء نظام مصادقة آمن من الألف إلى الياء — من تشفير كلمة المرور وإصدار JWT، مرورًا بالتحقق من المدخلات وحماية مسارات API، وصولًا إلى إدارة الجلسة في الواجهة وحماية الصفحات.

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 03: نمط المستودعات](03-repository-pattern.md)

---

## جدول المحتويات

1. [نظرة عامة: دورة حياة المصادقة](#1-نظرة-عامة-دورة-حياة-المصادقة)
2. [lib/auth.ts — JWT وتشفير كلمات المرور](#2-libauthts--jwt-وتشفير-كلمات-المرور)
3. [lib/apiErrors.ts — ردود الخطأ الموحّدة](#3-libapierrorsts--ردود-الخطأ-الموحّدة)
4. [validators/index.ts — التحقق من المدخلات](#4-validatorsindexts--التحقق-من-المدخلات)
5. [middlewares/auth.middleware.ts — بوابة الحماية](#5-middlewaresauthmiddlewarets--بوابة-الحماية)
6. [api/auth/register — مسار إنشاء الحساب](#6-apiauthregister--مسار-إنشاء-الحساب)
7. [api/auth/login — مسار تسجيل الدخول](#7-apiauthlogin--مسار-تسجيل-الدخول)
8. [api/auth/me — مسار هوية الجلسة](#8-apiauthme--مسار-هوية-الجلسة)
9. [api/auth/logout — مسار إنهاء الجلسة](#9-apiauthlogout--مسار-إنهاء-الجلسة)
10. [api/users/[id] — تحديث الحساب وحذفه](#10-apiusersid--تحديث-الحساب-وحذفه)
11. [context/AuthContext.tsx — إدارة الجلسة في الواجهة](#11-contextauthcontexttsx--إدارة-الجلسة-في-الواجهة)
12. [hooks/useAuth.ts وPrivateRoute.tsx](#12-hooksusea authts-وprivateroutetsx)
13. [ملخص](#13-ملخص)

---

## 1. نظرة عامة: دورة حياة المصادقة

### تشبيه: النادي الخاص والبطاقة الذهبية

تخيّل **ناديًا خاصًا** يتحقق من الهوية عند كل باب:

1. **التسجيل**: تملأ استمارة (validators) ← يتحقق الموظف من هويتك ← يمنحك **بطاقة ذهبية** (JWT token)
2. **الدخول**: تُبرز البطاقة عند كل باب (Authorization header) ← الحارس يتحقق منها (middleware) ← تدخل
3. **الخروج**: تُسلّم البطاقة ← تُمحى من السجل

في **ملاحظاتي** لا توجد بطاقة فعلية — بل JWT مُشفَّر يُخزَّن في `localStorage` ويُرسَل مع كل طلب.

### خريطة التدفق الكاملة

```
المتصفح                        الخادم (Next.js API)
────────                        ──────────────────────────────────────────
POST /api/auth/register
  { username, email, password }
      ↓
                        validators → إعادة أخطاء فورية إن وجدت
                        userRepo.emailExists / usernameExists
                        hashPassword(password, 12 rounds)
                        userRepo.create(...)
                        generateToken(userId)
                        ← { token, user }
      ↓
localStorage.setItem('auth-token', token)
AuthContext.setUser(user)

─── في كل طلب مقيَّد لاحق ─────────────────────────────────────────────

GET /api/notes
  Authorization: Bearer <token>
      ↓
                        authenticateRequest(request)
                          → Bearer موجود؟
                          → verifyToken(token) صالح؟
                          → { userId }
                        userRepo / noteRepo ...
                        ← { data }
```

---

## 2. lib/auth.ts — JWT وتشفير كلمات المرور

### الثوابت والإعدادات

```ts
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_EXPIRES_IN = '7d';      // صلاحية الرمز 7 أيام
const BCRYPT_SALT_ROUNDS = 12;    // 12 جولة تشفير لـ bcrypt
```

**لماذا 12 جولة bcrypt؟**

bcrypt يُطبّق وظيفة التشفير `2^rounds` مرة. مع كل جولة إضافية يتضاعف الوقت:

| الجولات | الوقت التقريبي | الأمان |
|---------|----------------|--------|
| 8 | ~6ms | منخفض (قديم) |
| 10 | ~25ms | مقبول |
| 12 | ~100ms | موصى به ✅ |
| 14 | ~400ms | عالٍ جدًا — تجربة مستخدم سيئة |

12 جولة يُوازن بين الأمان وسرعة الاستجابة — 100ms مقبولة عند تسجيل الدخول بينما تجعل الهجوم بالقوة الغاشمة مُكلفًا جدًا.

### دوال JWT

```ts
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/app/types';

/** تُولّد رمزًا يحمل فقط userId — لا بيانات حساسة */
export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** تتحقق من الرمز وتُعيد الـ payload أو تُلقي استثناءً */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
```

**ما يحمله JWT:**

```json
{
  "header": { "alg": "HS256", "typ": "JWT" },
  "payload": {
    "id": "507f1f77bcf86cd799439011",
    "iat": 1741564800,
    "exp": 1742169600
  },
  "signature": "HMAC-SHA256(header + payload, JWT_SECRET)"
}
```

> لاحظ: الـ `payload` **غير مُشفَّر** — يمكن قراءته. لهذا لا نضع فيه كلمة المرور أو بيانات حساسة. الأمان يأتي من **التوقيع** `signature` الذي يضمن عدم التلاعب بالرمز.

### دوال bcrypt

```ts
import bcrypt from 'bcryptjs';

/** تُشفّر كلمة المرور — تُستدعى مرة واحدة عند التسجيل/تغيير الكلمة */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/** تقارن كلمة المرور بالـ hash المُخزَّن */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**الـ Salt في bcrypt:**

```
bcrypt.hash("password123", 12)
  1. يُولّد salt عشوائيًا: "$2b$12$X9mQp..."
  2. يُشفّر: password + salt → 2^12 دورة
  3. الناتج: "$2b$12$X9mQp...A1B2C3D4E5F6"
               ↑ النتيجة تحمل الـ salt مُدمجًا

bcrypt.compare("password123", storedHash)
  1. يستخرج الـ salt من storedHash
  2. يُعيد التشفير بنفس الـ salt
  3. يُقارن بالثابت الزمني (لمنع timing attacks)
```

---

## 3. lib/apiErrors.ts — ردود الخطأ الموحّدة

### الدالة الأساسية

```ts
export function apiError(
  code: string,    // كود آلي: 'NOT_FOUND', 'UNAUTHORIZED'
  message: string, // رسالة بالعربية للمستخدم
  status: number = 400
): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ error: { code, message } }, { status });
}
```

### جدول دوال المساعدة

| الدالة | كود HTTP | كود الخطأ | الاستخدام |
|--------|---------|-----------|-----------|
| `validationError(messages[])` | 400 | `VALIDATION_ERROR` | مدخلات غير صالحة |
| `unauthorizedError(msg?)` | 401 | `UNAUTHORIZED` | رمز مفقود/منتهي |
| `forbiddenError(msg?)` | 403 | `FORBIDDEN` | محاولة وصول لبيانات شخص آخر |
| `notFoundError(msg?)` | 404 | `NOT_FOUND` | سجل غير موجود |
| `conflictError(msg)` | 409 | `CONFLICT` | بريد/اسم مكرر |
| `serverError(msg?)` | 500 | `SERVER_ERROR` | خطأ غير متوقع |

```ts
/** 400 — يجمع رسائل الخطأ بـ ، */
export function validationError(messages: string[]): NextResponse<ApiResponse<null>> {
  return apiError('VALIDATION_ERROR', messages.join('، '), 400);
}

/** 401 — رمز مفقود أو غير صالح */
export function unauthorizedError(
  message: string = 'غير مصرح — يرجى تسجيل الدخول'
): NextResponse<ApiResponse<null>> {
  return apiError('UNAUTHORIZED', message, 401);
}

/** 403 — المستخدم موثَّق لكن لا يملك صلاحية */
export function forbiddenError(
  message: string = 'ليس لديك صلاحية لتنفيذ هذا الإجراء'
): NextResponse<ApiResponse<null>> {
  return apiError('FORBIDDEN', message, 403);
}

/** 409 — بيانات مكررة (email أو username موجود مسبقًا) */
export function conflictError(message: string): NextResponse<ApiResponse<null>> {
  return apiError('CONFLICT', message, 409);
}
```

**لماذا الفصل بين 401 و403؟**

```
401 Unauthorized: لا تعرف من أنت  → سجّل دخولك أولًا
403 Forbidden:    نعرف من أنت، لكن هذا ليس ملكك → لا يُسمح لك

مثال:
GET /api/users/abc123 بدون token   → 401 (لا رمز)
GET /api/users/abc123 برمز userId=xyz → 403 (رمز صالح لكن ليس ملكك)
```

---

## 4. validators/index.ts — التحقق من المدخلات

### مبدأ: التحقق الخالص (Pure Validation)

دوال التحقق في **ملاحظاتي** هي **دوال نقية** — لا تُعدّل قاعدة البيانات، لا ترمي استثناءات، فقط تُعيد مصفوفة أخطاء:

```ts
function validate(input): string[] {
  // مصفوفة فارغة = الإدخال صالح
  // مصفوفة بعناصر = الأخطاء بالاسم
}
```

### دالة validateRegisterInput

```ts
import { serverMsg } from '@/app/lib/apiErrors';
import type { SupportedLocale } from '@/app/types';

export function validateRegisterInput(
  input: RegisterInput,
  locale: SupportedLocale = 'ar'
): string[] {
  const errors: string[] = [];

  if (!input.username || input.username.trim().length < 3)
    errors.push(serverMsg(locale, 'validUsernameTooShort'));
  if (input.username && input.username.trim().length > 30)
    errors.push(serverMsg(locale, 'validUsernameTooLong'));

  if (!input.email || !isValidEmail(input.email))
    errors.push(serverMsg(locale, 'validEmailInvalid'));

  if (!input.password || input.password.trim().length < 6)
    errors.push(serverMsg(locale, 'validPasswordTooShort'));

  return errors;
}
```

**دالة isPossibleEmail المساعدة:**

```ts
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
// يتحقق: لا مسافات | @ موجود | نقطة بعد @ | لا مسافات بعد النقطة
// لا يتحقق من الوجود الفعلي — ذلك يتطلب إرسال بريد تحقق
```

### validateChangePasswordInput — الأكثر تعقيدًا

```ts
export function validateChangePasswordInput(
  input: ChangePasswordInput,
  locale: SupportedLocale = 'ar'
): string[] {
  const errors: string[] = [];

  if (!input.currentPassword || input.currentPassword.trim().length < 1)
    errors.push(serverMsg(locale, 'validCurrentPasswordRequired'));

  if (!input.newPassword || input.newPassword.trim().length < 6)
    errors.push(serverMsg(locale, 'validNewPasswordTooShort'));

  if (input.newPassword !== input.confirmPassword)
    errors.push(serverMsg(locale, 'validPasswordMismatch'));

  if (input.currentPassword && input.newPassword && input.currentPassword === input.newPassword)
    errors.push(serverMsg(locale, 'validPasswordSameAsCurrent'));

  return errors;
}
```

الرسائل تأتي من `ServerErrors` في `ar.json`/`en.json` — لا نصوص مُرمَّزة في الكود.

### جدول دوال التحقق

جميعها تقبل معاملاً ثانيًا اختياريًا `locale: SupportedLocale = 'ar'`:

| الدالة | المدخل | ما تتحقق منه |
|--------|--------|-------------|
| `validateRegisterInput` | `RegisterInput, locale?` | username (3-30)، email، password (6+) |
| `validateLoginInput` | `LoginInput, locale?` | email valid، password (6+) |
| `validateNoteInput` | `NoteInput, locale?` | title (1-200)، type، content/audio بحسب النوع |
| `validateUpdateNoteInput` | `UpdateNoteInput, locale?` | title إن وُجد، audioDuration موجب |
| `validateUpdateUserInput` | `UpdateUserInput, locale?` | username/email/displayName/language إن وُجدت |
| `validateChangePasswordInput` | `ChangePasswordInput, locale?` | الحالية، الجديدة (6+)، التطابق، التغيير |

---

## 5. middlewares/auth.middleware.ts — بوابة الحماية

### المشكلة التي يحلّها

بدون middleware، كل route يكتب منطق التحقق يدويًا:

```ts
// ❌ في كل route — 50+ سطر مُكرَّر
const header = request.headers.get('authorization');
if (!header || !header.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const token = header.slice(7);
try {
  const payload = jwt.verify(token, secret);
  // ...
} catch {
  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}
```

مع `authenticateRequest`:

```ts
// ✅ سطران في كل route محمي
const auth = authenticateRequest(request);
if (auth.error) return auth.error;
const userId = auth.userId; // مضمون string هنا
```

### التحليل الكامل

```ts
export type AuthResult = AuthSuccess | AuthFailure;

export function authenticateRequest(request: NextRequest): AuthResult {
  // 1. هل هناك Authorization header؟
  const header = request.headers.get('authorization');

  if (!header || !header.startsWith('Bearer ')) {
    return { error: unauthorizedError('رمز المصادقة مفقود') };
    // ↑ يُعيد NextResponse جاهزة للإرجاع فورًا من route
  }

  // 2. استخراج الرمز (إزالة "Bearer ")
  const token = header.slice(7);

  try {
    // 3. التحقق من الرمز
    const payload = verifyToken(token);
    return { userId: payload.id }; // ← الرمز صالح
  } catch {
    // verifyToken تُلقي جملة JsonWebTokenError أو TokenExpiredError
    return { error: unauthorizedError('رمز المصادقة غير صالح أو منتهي الصلاحية') };
  }
}
```

### نمط التمييز (Discriminated Union)

```ts
interface AuthSuccess {
  userId: string;
  error?: undefined; // ← غائبة دائمًا
}

interface AuthFailure {
  userId?: undefined; // ← غائبة دائمًا
  error: NextResponse<ApiResponse<null>>;
}

type AuthResult = AuthSuccess | AuthFailure;
```

هذا النمط يُمكّن TypeScript من التمييز التلقائي:

```ts
const auth = authenticateRequest(request);

if (auth.error) return auth.error;
// هنا TypeScript يعلم أن auth.userId = string (وليس undefined)
// لأن AuthFailure له `userId?: undefined` وقد استُبعد بالشرط

const userId = auth.userId; // ← string بدون ? بدون !
```

---

## 6. api/auth/register — مسار إنشاء الحساب

### تسلسل العمليات

```ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // ── الطبقة 1: التحقق من المدخلات ─────────────────────────────────
    const errors = validateRegisterInput(body);
    if (errors.length > 0) return validationError(errors); // ← رجوع فوري

    await connectDB();
    const userRepo = getUserRepository();

    // ── الطبقة 2: التحقق من التكرار ──────────────────────────────────
    const [emailTaken, usernameTaken] = await Promise.all([
      userRepo.emailExists(body.email),
      userRepo.usernameExists(body.username),
    ]); // ← استعلامان متوازيان

    if (emailTaken) return conflictError('البريد الإلكتروني مستخدم بالفعل');
    if (usernameTaken) return conflictError('اسم المستخدم مستخدم بالفعل');

    // ── إنشاء المستخدم ───────────────────────────────────────────────
    const hashedPassword = await hashPassword(body.password);
    const newUser = await userRepo.create({
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      password: hashedPassword,          // ← المُشفَّر فقط
      displayName: body.username.trim(), // ← افتراضي = اسم المستخدم
      language: 'ar',                    // ← لغة افتراضية
    });

    const token = generateToken(newUser._id.toString());

    // ── تحويل IUser ← User (حذف password، تحويل Date→string) ────────
    const user: User = {
      _id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName,
      language: newUser.language,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
      // password: غائبة تمامًا ← لا تُرسَل للمتصفح أبدًا
    };

    return NextResponse.json(
      { data: { token, user }, message: 'تم إنشاء الحساب بنجاح' },
      { status: 201 } // ← 201 Created (وليس 200 OK)
    );
  } catch (error) {
    console.error('Register error:', error);
    return serverError(); // ← خطأ عام (قاعدة بيانات أو غيرها)
  }
}
```

### قاعدة التحويل: IUser → User

| حقل IUser | حقل User | التحويل |
|-----------|----------|---------|
| `_id` (ObjectId) | `_id` (string) | `.toString()` |
| `password` (hash) | — | **محذوف** |
| `createdAt` (Date) | `createdAt` (string) | `.toISOString()` |
| `updatedAt` (Date) | `updatedAt` (string) | `.toISOString()` |

هذا التحويل يتكرر في كل route — ولهذا `PUT /api/users/[id]` يُعرّف `serializeUser()` كدالة مساعدة.

---

## 7. api/auth/login — مسار تسجيل الدخول

### تسلسل العمليات

```ts
// 1. التحقق من المدخلات
const errors = validateLoginInput(body);
if (errors.length > 0) return validationError(errors);

// 2. البحث بالبريد الإلكتروني
const foundUser = await userRepo.findByEmail(body.email.trim().toLowerCase());
if (!foundUser) {
  return unauthorizedError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  // ↑ رسالة موحّدة — لا نُفصح هل البريد مسجل أم لا (User Enumeration)
}

// 3. مقارنة كلمة المرور
const isMatch = await comparePassword(body.password, foundUser.password);
if (!isMatch) {
  return unauthorizedError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  // ↑ نفس الرسالة — منع User Enumeration
}

// 4. توليد الرمز والرد
const token = generateToken(foundUser._id.toString());
```

### أمان: User Enumeration

```ts
// ❌ رسالتان مختلفتان — تُكشف أن البريد مسجل
if (!foundUser) return error('البريد الإلكتروني غير مسجل');
if (!isMatch)   return error('كلمة المرور خاطئة');

// ✅ رسالة موحّدة — لا معلومات إضافية
if (!foundUser || !isMatch)
  return error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
```

المهاجم بالرسالتين المختلفتين يستطيع **معرفة ما إذا كان البريد مسجلًا** — ثم يُركّز هجوم القاموس على كلمة المرور فقط. الرسالة الموحّدة تمنع هذا.

### إشعار الأجهزة الأخرى (Fire-and-Forget)

```ts
// بعد نجاح تسجيل الدخول — يُرسَل إشعار لباقي الأجهزة
notifyOtherDevices(foundUser._id.toString()).catch((err) =>
  console.warn('Push notification after login failed (non-fatal):', err)
);
// .catch → لا يُجمَّد الطلب إذا فشل الإشعار
// الإشعار ليس حرجًا → وظيفة خلفية لا تُؤثر على استجابة المستخدم
```

**لماذا `Promise.allSettled` في notifyOtherDevices؟**

```ts
await Promise.allSettled(
  subscriptions.map(async (sub) => { ... })
);
// Promise.allSettled يُكمل حتى بعد فشل بعض الإشعارات
// Promise.all يتوقف عند أول فشل — غير مناسب هنا
// إشعار فاشل (endpoint تالف) → نحذفه، لا نوقف باقي الإشعارات
```

---

## 8. api/auth/me — مسار هوية الجلسة

### أقصر مسار محمي

```ts
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. التحقق من الرمز — سطران كافيان
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    await connectDB();
    const userRepo = getUserRepository();

    // 2. جلب المستخدم من قاعدة البيانات
    const foundUser = await userRepo.findById(auth.userId);
    if (!foundUser) return notFoundError('المستخدم غير موجود');

    // 3. تسلسل الاستجابة
    const user: User = { /* IUser → User */ };

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (error) {
    return serverError();
  }
}
```

**لماذا نجلب المستخدم من قاعدة البيانات ولا نثق بمحتوى JWT؟**

```ts
// لو خزّنا username في JWT:
const token = jwt.sign({ id, username, email }, secret);

// مشكلة: المستخدم غيّر username
// JWT القديم لا يزال يحمل الاسم القديم
// نتيجة: التطبيق يعرض اسمًا قديمًا
```

JWT يحمل فقط `id` — **الحقيقة المرجعية** هي دائمًا قاعدة البيانات. `/api/auth/me` يُحوّل الـ `id` لبيانات محدّثة.

---

## 9. api/auth/logout — مسار إنهاء الجلسة

### تسلسل الخروج

```ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. التحقق من الرمز
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    // 2. قراءة deviceId من الـ body (اختياري)
    const body = await request.json().catch(() => ({})) as { deviceId?: string };
    const { deviceId } = body;

    if (!deviceId || typeof deviceId !== 'string') {
      // لا جهاز مُعرَّف — خروج نظيف بدون حذف
      return NextResponse.json({ message: 'تم تسجيل الخروج' });
    }

    await connectDB();

    // 3. حذف سجل الجهاز (لا يتطلب كلمة مرور — JWT يُثبت الهوية)
    await deviceRepo.deleteByDeviceId(auth.userId, deviceId);

    // 4. حذف الاشتراكات المرتبطة بالجهاز (cascade)
    const subs = await subRepo.findByUser(auth.userId);
    await Promise.all(
      subs
        .filter(
          (s) =>
            s.deviceId === deviceId ||
            (s.deviceInfo && s.deviceInfo.startsWith(`${deviceId}|`)) // ← توافق legacy
        )
        .map((s) => subRepo.deleteByEndpoint(s.endpoint))
    );

    return NextResponse.json({ message: 'تم تسجيل الخروج وإزالة الجهاز' });
  }
}
```

### لماذا لا يتطلب كلمة مرور؟

**logout: JWT يكفي** — المستخدم يُنهي جلسته بنفسه؛ لا خطر أمني في حذف سجل جهازه الخاص.

**DELETE /api/devices: يتطلب كلمة مرور** — لأنه قد يُستخدم لإزالة جهاز غائب (مفقود/مسروق) من جهاز آخر؛ نريد تأكيدًا إضافيًا.

### التوافق مع السجلات القديمة (Legacy Support)

```ts
// السجلات الجديدة: { deviceId: "abc-123" }
s.deviceId === deviceId

// السجلات القديمة: { deviceInfo: "abc-123|Android|Chrome" }
s.deviceInfo && s.deviceInfo.startsWith(`${deviceId}|`)
```

التطبيق طوَّر نموذج Subscription بمرور الوقت — `deviceId` حقل جديد؛ الحقل القديم `deviceInfo` يحتوي المعلومات في سلسلة دمجت عدة قيم. الشرط يدعم كلا الصيغتين لضمان عمل الحذف مع السجلات القديمة.

---

## 10. api/users/[id] — تحديث الحساب وحذفه

### دالة serializeUser المساعدة

```ts
function serializeUser(doc: { _id, username, email, displayName?, language, createdAt, updatedAt }): User {
  return {
    _id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    displayName: doc.displayName,
    language: doc.language,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
// مركزية التحويل بدلًا من نسخه في كل مسار
```

### PUT — ثنائي المهام

```ts
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // 1. المصادقة
  const auth = authenticateRequest(request);
  if (auth.error) return auth.error;

  // 2. التحقق من الملكية — لا يمكن تعديل حساب شخص آخر
  const { id } = await params;
  if (auth.userId !== id) return forbiddenError();
  //  ↑ auth.userId = من JWT | id = من URL
  //  إذا اختلفا → 403 Forbidden

  const body = await request.json();

  // 3. تحديد نوع الطلب: تغيير كلمة المرور أم تحديث الملف الشخصي؟
  if (body.currentPassword || body.newPassword || body.confirmPassword) {
    // ─── تغيير كلمة المرور ─────────────────────────────────────────────
    const pwErrors = validateChangePasswordInput(body);
    if (pwErrors.length > 0) return validationError(pwErrors);

    const currentUser = await userRepo.findById(id);
    if (!currentUser) return notFoundError('المستخدم غير موجود');

    const isMatch = await comparePassword(body.currentPassword, currentUser.password);
    if (!isMatch) return unauthorizedError('كلمة المرور الحالية غير صحيحة');

    const hashed = await hashPassword(body.newPassword);
    const updated = await userRepo.update(id, { password: hashed });

    return NextResponse.json({ data: serializeUser(updated!), message: 'تم تغيير كلمة المرور بنجاح' });
  }

  // ─── تحديث الملف الشخصي ───────────────────────────────────────────────
  const profileErrors = validateUpdateUserInput(body);
  if (profileErrors.length > 0) return validationError(profileErrors);

  // 4. التحقق من التكرار (للبريد واسم المستخدم فقط إذا تغيّرا)
  if (body.email) {
    const emailTaken = await userRepo.findByEmail(body.email.trim().toLowerCase());
    if (emailTaken && emailTaken._id.toString() !== id)
      return conflictError('البريد الإلكتروني مستخدم بالفعل');
  }

  // 5. بناء كائن التحديث (فقط الحقول المُرسَلة)
  const updateData: Record<string, unknown> = {};
  if (body.username !== undefined) updateData.username = body.username.trim();
  if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
  if (body.displayName !== undefined) updateData.displayName = body.displayName.trim();
  if (body.language !== undefined) updateData.language = body.language;

  const updated = await userRepo.update(id, updateData);
  if (!updated) return notFoundError('المستخدم غير موجود');

  return NextResponse.json({ data: serializeUser(updated), message: 'تم تحديث البيانات بنجاح' });
}
```

### DELETE — حذف الحساب مع تأكيد إضافي

```ts
export async function DELETE(...): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  if (auth.userId !== id) return forbiddenError();

  // حذف الحساب يتطلب تأكيد كلمة المرور
  const body = await request.json().catch(() => ({}));
  if (!body.password) {
    return validationError(['كلمة المرور مطلوبة لتأكيد حذف الحساب']);
  }

  const currentUser = await userRepo.findById(id);
  const isMatch = await comparePassword(body.password, currentUser.password);
  if (!isMatch) return unauthorizedError('كلمة المرور غير صحيحة');

  // الحذف المتسلسل داخل Transaction
  await userRepo.deleteUserCascade(id);

  return NextResponse.json({ message: 'تم حذف الحساب وجميع البيانات المرتبطة بنجاح' });
}
```

**لماذا تأكيد كلمة المرور عند الحذف؟** 

حتى لو سُرق JWT، لا يستطيع المهاجم حذف الحساب بدون كلمة المرور. هذا حماية إضافية ضد **سرقة الجلسة (Session Hijacking)**.

---

## 11. context/AuthContext.tsx — إدارة الجلسة في الواجهة

### ما يُوفّره السياق

```ts
export interface AuthContextValue {
  user: User | null;        // المستخدم الحالي (null = غير مسجّل)
  token: string | null;     // JWT في الذاكرة
  loading: boolean;         // هل يجري تحميل الجلسة الأولية؟
  login: (email, password) => Promise<void>;
  register: (username, email, password) => Promise<void>;
  updateUser: (updated: User) => void; // بعد تحديث الملف الشخصي
  logout: () => void;
  pendingLocaleSuggestion: SupportedLocale | null; // اقتراح تبديل اللغة
  clearLocaleSuggestion: () => void;
}
```

### تهيئة الجلسة عند التحميل

```ts
const [token, setToken] = useState<string | null>(() => {
  if (typeof window === 'undefined') return null; // SSR — لا localStorage
  return localStorage.getItem('auth-token');       // استعادة فورية من الذاكرة
});
const didInit = useRef(false);

useEffect(() => {
  if (didInit.current) return; // ← يمنع الاستدعاء المزدوج (React StrictMode)
  didInit.current = true;

  if (token) {
    loadUser(token).finally(() => setLoading(false));
  } else {
    setLoading(false); // لا رمز = لا حاجة لانتظار
  }
}, []); // ← يعمل مرة واحدة فقط عند التحميل
```

### loadUser — الذكاء الأساسي

```ts
const loadUser = useCallback(async (jwt: string) => {
  try {
    const res = await apiFetch<{ data: User }>('/api/auth/me', {}, jwt);
    setUser(res.data);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data)); // ← تحديث الكاش
  } catch (err) {
    const is401 = err instanceof Error && (
      err.message.includes('401') ||
      err.message.includes('غير مصرح')
    );

    if (is401) {
      // الرمز غير صالح فعلًا → خروج كامل
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
      setToken(null);
      setUser(null);
    } else {
      // خطأ شبكة → إعادة المستخدم المُخزَّن مؤقتًا (وضع بلا إنترنت)
      const raw = localStorage.getItem(USER_CACHE_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    }
  }
}, []);
```

**منطق التمييز بين 401 وأخطاء الشبكة:**

```
NetworkError / TimeoutError:
  → المستخدم بلا إنترنت
  → لا يجب تسجيل الخروج
  → نستعيد USER_CACHE_KEY لإبقاء التطبيق يعمل

401 Unauthorized:
  → الرمز منتهي أو مُخترق
  → يجب تسجيل الخروج وحذف الرمز
```

### login — بعد نجاح تسجيل الدخول

```ts
const login = useCallback(async (email: string, password: string) => {
  const res = await apiFetch<{ data: { token: string; user: User } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(TOKEN_KEY, res.data.token);
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data.user));
  setToken(res.data.token);
  setUser(res.data.user);

  // اقتراح تبديل اللغة إن كان تفضيل المستخدم مختلفًا عن URL الحالي
  const pref = res.data.user.language;
  if (pref !== 'unset' && pref !== locale) {
    setPendingLocaleSuggestion(pref);
  }
}, [locale]);
```

### logout — التنظيف الشامل

```ts
const logout = useCallback(async () => {
  const currentJwt = localStorage.getItem(TOKEN_KEY);
  const deviceId = localStorage.getItem('device-id');

  // 1. مسح الحالة المحلية فورًا (المستخدم لا ينتظر الخادم)
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_CACHE_KEY);
  localStorage.removeItem('push-subscribed');
  localStorage.removeItem('device-trusted');
  localStorage.removeItem('pwa-enabled'); // ← مهم: منع Bug إعادة التفعيل
  setToken(null);
  setUser(null);

  // 2. إشعار الخادم (fire-and-forget)
  if (currentJwt && deviceId) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${currentJwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    }).catch(() => {}); // ← لا نُجمّد إذا كانت الشبكة غائبة
  }

  // 3. إلغاء الاشتراك من الإشعارات (بدون جولة خادم)
  clearLocalPushState().catch(() => {});

  // 4. مسح قاعدة البيانات المحلية (IndexedDB)
  db.notes.clear().catch(() => {});
  db.pendingOps.clear().catch(() => {});
  db.devices.clear().catch(() => {});

  // 5. إلغاء تسجيل Service Worker ومسح الكاش
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) reg.unregister();
    });
  }
}, []);
```

**لماذا حذف `pwa-enabled` عند الخروج؟**

```
سيناريو Bug بدون حذف pwa-enabled:
1. المستخدم يُسجّل خروجًا
2. device-trusted يُحذف ✅
3. pwa-enabled يبقى = 'true' ❌
4. المستخدم يُعيد فتح التطبيق
5. PwaActivationContext يرى: pwa-enabled=true AND device-trusted=false
   → يُطلق clearOfflineData() + يُلغي SW
   → قاعدة البيانات المحلية تُمسح دون سبب!
```

الحل: مسح `pwa-enabled` مع `device-trusted` معًا يُبطل هذا التوليف الخطأ.

### مراقبة إزالة الجهاز عن بُعد

```ts
useEffect(() => {
  if (!token) return;
  const POLL_INTERVAL = 30_000; // كل 30 ثانية

  const checkTrust = async () => {
    const deviceId = localStorage.getItem('device-id');
    const wasTrusted = localStorage.getItem('device-trusted') === 'true';
    if (!deviceId || !wasTrusted) return;

    const res = await apiFetch<{ data: Array<{ deviceId: string }> }>(
      `/api/devices?currentDeviceId=${encodeURIComponent(deviceId)}`,
      {}, token
    );
    const stillInList = res.data.some((d) => d.deviceId === deviceId);
    if (!stillInList) {
      // جهازي أُزيل من جلسة أخرى → خروج إجباري
      logoutRef.current();
    }
  };

  checkTrust();
  const interval = setInterval(checkTrust, POLL_INTERVAL);

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') checkTrust(); // ← عند العودة للتبويب
  };
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}, [token]);
```

---

## 12. hooks/useAuth.ts وPrivateRoute.tsx

### useAuth — بساطة متعمّدة

```ts
'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/app/context/AuthContext';

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
```

الملف كله 15 سطرًا — قوته في **ما يُعيده** (كل قيمة AuthContext) وأين يُستخدم (أي مكوّن يحتاج بيانات الجلسة).

مثال على الاستخدام في مكوّن:

```tsx
function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  // user: بيانات المستخدم الحالي
  // logout: دالة الخروج
  // updateUser: تحديث الحالة بعد PUT /api/users/[id]
}
```

### PrivateRoute — حماية الصفحات

```tsx
export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login'); // ← إعادة توجيه بدون إضافة للتاريخ
    }
  }, [loading, user, router]);

  // أثناء تحميل الجلسة — اعرض Spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // إذا تأكّد أنه غير مسجّل — لا تعرض أي شيء
  if (!user) return null;

  // مسجّل → اعرض المحتوى
  return <>{children}</>;
}
```

**دورة الحالات الثلاث:**

```
loading = true           → <CircularProgress /> (لا نعرف بعد)
loading = false, !user   → null + router.replace('/login')
loading = false, !!user  → <>{children}</>
```

**لماذا `return null` قبل توجيه router؟**

```tsx
// useEffect يعمل بعد الرسم — React يحتاج إعادة رسم بعد تحميل
// الفجوة بين المسار والتوجيه: المكوّن قد يُرسَم للحظة بدون user

if (!user) return null; // ← يمنع ظهور المحتوى الخاص لأي لحظة
// router.replace يمشي في الخلفية عبر useEffect
```

---

## 13. ملخص

### خريطة ملفات الدرس

| الملف | الطبقة | الوظيفة |
|-------|--------|---------|
| `lib/auth.ts` | أدوات أمان | JWT (توليد/تحقق) + bcrypt (تشفير/مقارنة) |
| `lib/apiErrors.ts` | أدوات API | ردود خطأ موحّدة — رسائل من `ServerErrors` في `ar.json`/`en.json` |
| `validators/index.ts` | تحقق المدخلات | دوال نقية → مصفوفة أخطاء حسب locale، بدون جانب ضمني |
| `middlewares/auth.middleware.ts` | حماية API | استخراج JWT + التحقق → AuthResult موحَّد |
| `api/auth/register/route.ts` | مسار API | التسجيل: تحقق → تكرار → hash → إنشاء → JWT |
| `api/auth/login/route.ts` | مسار API | الدخول: تحقق → بحث → مقارنة → JWT + إشعار |
| `api/auth/me/route.ts` | مسار API | هوية الجلسة: JWT → userId → بيانات محدّثة |
| `api/auth/logout/route.ts` | مسار API | الخروج: JWT → حذف جهاز → cascade اشتراكات |
| `api/users/[id]/route.ts` | مسار API | PUT (ملف+كلمة مرور) / DELETE (cascade+تأكيد) |
| `context/AuthContext.tsx` | واجهة — حالة | JWT في localStorage، loadUser، polling الثقة |
| `hooks/useAuth.ts` | واجهة — hook | وصول AuthContext في أي مكوّن |
| `components/auth/PrivateRoute.tsx` | واجهة — حماية | Spinner → null+redirect → children |

### أنماط الأمان المُطبَّقة

| النمط | الموقع | الغرض |
|-------|--------|-------|
| **bcrypt + 12 جولة** | `lib/auth.ts` | مقاومة هجوم القوة الغاشمة |
| **موحّدة رسالة خطأ** | `api/auth/login` | منع User Enumeration |
| **Discriminated Union** | `auth.middleware.ts` | أمان نوع TypeScript عند التحقق |
| **تأكيد كلمة المرور** | `DELETE /api/users/[id]` | حماية من Session Hijacking |
| **Ownership Check** | `PUT/DELETE /api/users/[id]` | منع الوصول لبيانات الآخرين |
| **Timing-safe compare** | `bcrypt.compare()` | مقاومة Timing Attacks |
| **فصل 401 عن أخطاء الشبكة** | `AuthContext.loadUser` | وضع بلا إنترنت بدون خروج خاطئ |

### نقطة المراقبة

بعد الانتهاء من هذا الدرس، يجب أن تستطيع:

- [ ] شرح لماذا نختار 12 جولة bcrypt وليس 6 أو 20
- [ ] شرح لماذا رسالة "البريد أو كلمة المرور غير صحيحة" موحّدة (User Enumeration)
- [ ] قراءة `Discriminated Union` في `auth.middleware.ts` وفهم كيف يُضمن `auth.userId: string`
- [ ] فهم لماذا لا نخزّن `username` في JWT ونعتمد `/api/auth/me`
- [ ] شرح الفرق بين خطأ 401 وخطأ 403 وأين يظهر كل منهما
- [ ] فهم لماذا `logout` يحذف `pwa-enabled` مع `device-trusted`
- [ ] وصف دورة الحالات الثلاث في `PrivateRoute`

---

الدرس السابق → [الدرس 03: نمط المستودعات](03-repository-pattern.md) | الدرس التالي → [الدرس 05: مسارات API](05-api-routes.md)
