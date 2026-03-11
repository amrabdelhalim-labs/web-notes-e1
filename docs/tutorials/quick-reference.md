# مرجع سريع — مشروع ملاحظاتي ⚡

> جداول مختصرة لكل ما تحتاجه أثناء دراسة المشروع

[← العودة إلى الفهرس](README.md)

---

## جدول المحتويات

1. [خريطة الملفات](#1-خريطة-الملفات)
2. [أوامر npm](#2-أوامر-npm)
3. [مسارات API](#3-مسارات-api)
4. [روابط الدروس](#4-روابط-الدروس)
5. [مفاتيح الترجمة (Namespaces)](#5-مفاتيح-الترجمة-namespaces)
6. [نقاط فحص التعلم](#6-نقاط-فحص-التعلم)

---

## 1. خريطة الملفات

### ملفات الجذر

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `src/instrumentation.ts` | [01](lessons/01-project-setup.md) | تهيئة الخادم عند الإقلاع (اتصال MongoDB) |
| `src/proxy.ts` | [07](lessons/07-internationalization.md) | وسيط next-intl — اكتشاف اللغة وإعادة التوجيه |
| `src/sw.ts` | [10](lessons/10-pwa-service-worker.md) | Service Worker — استراتيجيات التخزين والمزامنة |

### التهيئة والأنواع (`src/app/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `config.ts` | [01](lessons/01-project-setup.md) | ثوابت التطبيق (اسم، لغات، حجم الصفحة) |
| `types.ts` | [01](lessons/01-project-setup.md) | كل أنواع TypeScript المشتركة |
| `globals.css` | [06](lessons/06-theme-system.md) | تنسيقات CSS العامة |
| `layout.tsx` | [01](lessons/01-project-setup.md) | التخطيط الجذري (يُفوّض للتخطيط المحلي) |
| `page.tsx` | [01](lessons/01-project-setup.md) | الصفحة الجذرية (إعادة توجيه) |
| `providers.tsx` | [06](lessons/06-theme-system.md) | سلسلة Providers: Theme → PWA → Auth |

### النماذج (`src/app/models/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `User.ts` | [02](lessons/02-database-models.md) | مخطط المستخدم (username, email, password, language) |
| `Note.ts` | [02](lessons/02-database-models.md) | مخطط الملاحظة (نص أو صوت) مع فهارس مركبة |
| `Device.ts` | [02](lessons/02-database-models.md) | مخطط الجهاز الموثوق |
| `Subscription.ts` | [02](lessons/02-database-models.md) | مخطط اشتراك الإشعارات (Push) |

### المستودعات (`src/app/repositories/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `repository.interface.ts` | [03](lessons/03-repository-pattern.md) | الواجهة العامة `IRepository<T>` |
| `base.repository.ts` | [03](lessons/03-repository-pattern.md) | المستودع الأساسي — تنفيذ عام لكل العمليات |
| `note.repository.ts` | [03](lessons/03-repository-pattern.md) | مستودع الملاحظات (+ بحث، ترقيم، تصفية) |
| `user.repository.ts` | [03](lessons/03-repository-pattern.md) | مستودع المستخدمين (+ حذف ذري cascade) |
| `device.repository.ts` | [03](lessons/03-repository-pattern.md) | مستودع الأجهزة (+ touch, findByDeviceId) |
| `subscription.repository.ts` | [03](lessons/03-repository-pattern.md) | مستودع اشتراكات Push |
| `index.ts` | [03](lessons/03-repository-pattern.md) | RepositoryManager — نقطة وصول Singleton |

### المكتبات (`src/app/lib/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `mongodb.ts` | [02](lessons/02-database-models.md) | اتصال Mongoose (Singleton + HMR) |
| `auth.ts` | [04](lessons/04-authentication.md) | JWT generation/verification + bcrypt |
| `api.ts` | [05](lessons/05-api-routes.md) | عميل API للمتصفح مع حقن JWT تلقائي |
| `apiErrors.ts` | [05](lessons/05-api-routes.md) | بناة استجابات الأخطاء الموحدة |
| `db.ts` | [10](lessons/10-pwa-service-worker.md) | Dexie IndexedDB — كاش محلي + رتل عمليات معلّقة |
| `navigation.ts` | [07](lessons/07-internationalization.md) | مساعدات التنقل مع مراعاة اللغة |
| `pushUtils.ts` | [11](lessons/11-push-notifications.md) | إزالة اشتراك Push (متصفح + خادم) |
| `webpush.ts` | [11](lessons/11-push-notifications.md) | VAPID + إرسال الإشعارات (خادم فقط) |
| `warmUpCache.ts` | [10](lessons/10-pwa-service-worker.md) | تسخين الكاش المحلي بعد تنشيط PWA |
| `ui-constants.ts` | [06](lessons/06-theme-system.md) | ثوابت التخطيط (ارتفاعات، عروض، ظلال) |

### الوسطاء (`src/app/middlewares/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `auth.middleware.ts` | [04](lessons/04-authentication.md) | فحص JWT وإرجاع userId أو خطأ 401 |

### السياقات (`src/app/context/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `AuthContext.tsx` | [04](lessons/04-authentication.md) | حالة المصادقة — login/register/logout + كاش محلي |
| `ThemeContext.tsx` | [06](lessons/06-theme-system.md) | السمات (فاتح/داكن) + RTL + ألوان WCAG AA+ |
| `PwaActivationContext.tsx` | [10](lessons/10-pwa-service-worker.md) | بصمة صفرية — تنشيط/إلغاء PWA برمجيًا |

### الخطّافات (`src/app/hooks/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `useAuth.ts` | [04](lessons/04-authentication.md) | واجهة وصول AuthContext |
| `useNotes.ts` | [08](lessons/08-notes-crud.md) | CRUD ملاحظات + رتل عمليات + ترقيم + بحث |
| `useDeviceId.ts` | [11](lessons/11-push-notifications.md) | UUID ثابت للجهاز في localStorage |
| `useDevices.ts` | [11](lessons/11-push-notifications.md) | إدارة الأجهزة الموثوقة |
| `useOfflineStatus.ts` | [11](lessons/11-push-notifications.md) | كشف اتصال مزدوج الطبقات |
| `usePushNotifications.ts` | [11](lessons/11-push-notifications.md) | دورة حياة اشتراك Web Push |
| `usePwaStatus.ts` | [10](lessons/10-pwa-service-worker.md) | حالة PWA — SW مُسجّل؟ قابل للتثبيت؟ |
| `useSyncStatus.ts` | [11](lessons/11-push-notifications.md) | عدد العمليات المعلّقة + كشف فشل |
| `useThemeMode.ts` | [06](lessons/06-theme-system.md) | واجهة وصول ThemeContext |

### المكونات (`src/app/components/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `auth/PrivateRoute.tsx` | [04](lessons/04-authentication.md) | حراسة المسارات — تحويل لصفحة الدخول |
| `common/ConnectionIndicator.tsx` | [11](lessons/11-push-notifications.md) | مؤشر حالة الاتصال والمزامنة |
| `common/DeviceTrustPrompt.tsx` | [11](lessons/11-push-notifications.md) | حوار طلب الوثوق بالجهاز |
| `common/LanguageToggle.tsx` | [07](lessons/07-internationalization.md) | زر تبديل اللغة (عربي ⟷ English) |
| `common/LocaleSwitchPromptDialog.tsx` | [07](lessons/07-internationalization.md) | حوار اقتراح تغيير اللغة |
| `common/OfflineBanner.tsx` | [10](lessons/10-pwa-service-worker.md) | شريط "لا يوجد اتصال" |
| `common/PwaActivationDialog.tsx` | [10](lessons/10-pwa-service-worker.md) | حوار تنشيط PWA |
| `common/ThemeToggle.tsx` | [06](lessons/06-theme-system.md) | زر تبديل الوضع الفاتح/الداكن |
| `layout/AppBar.tsx` | [06](lessons/06-theme-system.md) | شريط التطبيق العلوي |
| `layout/EmotionCacheProvider.tsx` | [06](lessons/06-theme-system.md) | كاش Emotion مع دعم RTL |
| `layout/MainLayout.tsx` | [06](lessons/06-theme-system.md) | التخطيط الرئيسي (AppBar + Sidebar + محتوى) |
| `layout/SideBar.tsx` | [06](lessons/06-theme-system.md) | القائمة الجانبية |
| `notes/NoteCard.tsx` | [08](lessons/08-notes-crud.md) | بطاقة ملاحظة واحدة |
| `notes/NoteList.tsx` | [08](lessons/08-notes-crud.md) | قائمة الملاحظات مع بحث وترقيم |
| `notes/NoteEditorForm.tsx` | [08](lessons/08-notes-crud.md) | نموذج إنشاء/تعديل ملاحظة |
| `notes/DeleteConfirmDialog.tsx` | [08](lessons/08-notes-crud.md) | حوار تأكيد حذف ملاحظة |
| `notes/RichTextEditor.tsx` | [09](lessons/09-tiptap-and-media-recorder.md) | محرر TipTap للنصوص الغنية |
| `notes/VoiceRecorder.tsx` | [09](lessons/09-tiptap-and-media-recorder.md) | واجهة التسجيل الصوتي (MediaRecorder) |
| `profile/ProfileEditor.tsx` | [12](lessons/12-profile-settings.md) | نموذج تعديل الملف الشخصي |
| `profile/DeleteAccountDialog.tsx` | [12](lessons/12-profile-settings.md) | حوار تأكيد حذف الحساب |

### الصفحات (`src/app/[locale]/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `layout.tsx` | [06](lessons/06-theme-system.md) | تخطيط اللغة — الخطوط، الاتجاه، Providers |
| `page.tsx` | [01](lessons/01-project-setup.md) | الصفحة الرئيسية — توجيه حسب حالة المصادقة |
| `not-found.tsx` | [01](lessons/01-project-setup.md) | صفحة 404 مع دعم وضع عدم الاتصال |
| `login/page.tsx` | [12](lessons/12-profile-settings.md) | صفحة تسجيل الدخول |
| `register/page.tsx` | [12](lessons/12-profile-settings.md) | صفحة إنشاء حساب |
| `notes/page.tsx` | [08](lessons/08-notes-crud.md) | قائمة الملاحظات |
| `notes/new/page.tsx` | [08](lessons/08-notes-crud.md) | إنشاء ملاحظة جديدة |
| `notes/[id]/page.tsx` | [08](lessons/08-notes-crud.md) | تفاصيل ملاحظة واحدة |
| `notes/[id]/edit/page.tsx` | [08](lessons/08-notes-crud.md) | تعديل ملاحظة |
| `profile/page.tsx` | [12](lessons/12-profile-settings.md) | الملف الشخصي والإعدادات |

### الأدوات (`src/app/utils/` + `src/app/validators/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `utils/audio.ts` | [09](lessons/09-tiptap-and-media-recorder.md) | تحويل صوت: blob↔base64, formatDuration |
| `utils/notes.ts` | [08](lessons/08-notes-crud.md) | stripHtml, formatDateShort/Long |
| `utils/sanitize.ts` | [08](lessons/08-notes-crud.md) | تنقية HTML (DOMParser, قائمة عناصر آمنة) |
| `validators/index.ts` | [05](lessons/05-api-routes.md) | دوال تحقق نقية تُرجع أخطاء عربية |

### مسارات API (`src/app/api/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `auth/register/route.ts` | [05](lessons/05-api-routes.md) | `POST` — إنشاء حساب |
| `auth/login/route.ts` | [05](lessons/05-api-routes.md) | `POST` — تسجيل دخول |
| `auth/me/route.ts` | [05](lessons/05-api-routes.md) | `GET` — بيانات المستخدم الحالي |
| `auth/logout/route.ts` | [05](lessons/05-api-routes.md) | `POST` — تسجيل خروج |
| `notes/route.ts` | [05](lessons/05-api-routes.md) | `GET` قائمة + `POST` إنشاء |
| `notes/[id]/route.ts` | [05](lessons/05-api-routes.md) | `GET` + `PUT` + `DELETE` ملاحظة واحدة |
| `users/[id]/route.ts` | [05](lessons/05-api-routes.md) | `PUT` تعديل + `DELETE` حذف حساب |
| `devices/route.ts` | [05](lessons/05-api-routes.md) | `GET` + `POST` + `DELETE` أجهزة |
| `push/subscribe/route.ts` | [05](lessons/05-api-routes.md) | `POST` + `DELETE` اشتراك Push |
| `push/send/route.ts` | [05](lessons/05-api-routes.md) | `POST` إرسال إشعار |
| `health/route.ts` | [05](lessons/05-api-routes.md) | `GET` + `HEAD` فحص الصحة |

### الترجمة (`src/i18n/` + `src/messages/`)

| الملف | الدرس | الوصف |
|-------|-------|-------|
| `i18n/routing.ts` | [07](lessons/07-internationalization.md) | إعداد اللغات والمسارات |
| `i18n/request.ts` | [07](lessons/07-internationalization.md) | تحميل ملف الرسائل حسب اللغة |
| `messages/ar.json` | [07](lessons/07-internationalization.md) | النصوص العربية (25 نطاق) |
| `messages/en.json` | [07](lessons/07-internationalization.md) | النصوص الإنجليزية |

### الاختبارات (`src/app/tests/`)

| الملف | الدرس | ما يختبره |
|-------|-------|----------|
| `setup.ts` | [13](lessons/13-testing.md) | إعداد بيئة الاختبار |
| `utils.tsx` | [13](lessons/13-testing.md) | مساعدات render مع Providers |
| `config.test.ts` | [13](lessons/13-testing.md) | ثوابت التطبيق |
| `types.test.ts` | [13](lessons/13-testing.md) | أنواع TypeScript |
| `validators.test.ts` | [13](lessons/13-testing.md) | دوال التحقق |
| `apiClient.test.ts` | [13](lessons/13-testing.md) | عميل API |
| `deviceApi.test.ts` | [13](lessons/13-testing.md) | API الأجهزة |
| `devicesRoute.test.ts` | [13](lessons/13-testing.md) | مسار API الأجهزة |
| `noteUtils.test.ts` | [13](lessons/13-testing.md) | أدوات الملاحظات |
| `audioUtils.test.ts` | [13](lessons/13-testing.md) | أدوات الصوت |
| `warmUpCache.test.ts` | [13](lessons/13-testing.md) | تسخين الكاش |
| `useAuth.test.tsx` | [13](lessons/13-testing.md) | خطّاف المصادقة |
| `useDeviceId.test.ts` | [13](lessons/13-testing.md) | خطّاف معرف الجهاز |
| `useDevices.test.ts` | [13](lessons/13-testing.md) | خطّاف الأجهزة |
| `useNotes.test.ts` | [13](lessons/13-testing.md) | خطّاف الملاحظات |
| `useOfflineStatus.test.ts` | [13](lessons/13-testing.md) | خطّاف حالة الاتصال |
| `usePwaStatus.test.ts` | [13](lessons/13-testing.md) | خطّاف حالة PWA |
| `useSyncStatus.test.ts` | [13](lessons/13-testing.md) | خطّاف حالة المزامنة |
| `login.test.tsx` | [13](lessons/13-testing.md) | صفحة تسجيل الدخول |
| `register.test.tsx` | [13](lessons/13-testing.md) | صفحة التسجيل |
| `AppBar.test.tsx` | [13](lessons/13-testing.md) | شريط التطبيق |
| `SideBar.test.tsx` | [13](lessons/13-testing.md) | القائمة الجانبية |
| `ThemeContext.test.tsx` | [13](lessons/13-testing.md) | سياق السمات |
| `ThemeToggle.test.tsx` | [13](lessons/13-testing.md) | زر تبديل السمة |
| `LanguageToggle.test.tsx` | [13](lessons/13-testing.md) | زر تبديل اللغة |
| `OfflineBanner.test.tsx` | [13](lessons/13-testing.md) | شريط عدم الاتصال |
| `ConnectionIndicator.test.tsx` | [13](lessons/13-testing.md) | مؤشر الاتصال |
| `PwaActivationDialog.test.tsx` | [13](lessons/13-testing.md) | حوار تنشيط PWA |
| `PrivateRoute.test.tsx` | [13](lessons/13-testing.md) | حراسة المسارات |
| `NoteCard.test.tsx` | [13](lessons/13-testing.md) | بطاقة ملاحظة |
| `NoteList.test.tsx` | [13](lessons/13-testing.md) | قائمة الملاحظات |
| `NoteEditorForm.test.tsx` | [13](lessons/13-testing.md) | نموذج المحرر |
| `DeleteConfirmDialog.test.tsx` | [13](lessons/13-testing.md) | حوار حذف ملاحظة |
| `NotesPage.test.tsx` | [13](lessons/13-testing.md) | صفحة الملاحظات |
| `NewNotePage.test.tsx` | [13](lessons/13-testing.md) | صفحة ملاحظة جديدة |
| `NoteDetailPage.test.tsx` | [13](lessons/13-testing.md) | صفحة تفاصيل ملاحظة |
| `EditNotePage.test.tsx` | [13](lessons/13-testing.md) | صفحة تعديل ملاحظة |
| `ProfileEditor.test.tsx` | [13](lessons/13-testing.md) | محرر الملف الشخصي |
| `ProfilePage.test.tsx` | [13](lessons/13-testing.md) | صفحة الملف الشخصي |
| `DeleteAccountDialog.test.tsx` | [13](lessons/13-testing.md) | حوار حذف الحساب |
| `offlineLogout.test.tsx` | [13](lessons/13-testing.md) | تسجيل خروج بدون اتصال |

---

## 2. أوامر npm

| الأمر | الوظيفة |
|-------|---------|
| `npm run dev` | تشغيل خادم التطوير (مع Hot Reload) |
| `npm run build` | بناء التطبيق للإنتاج |
| `npm start` | تشغيل نسخة الإنتاج |
| `npm run lint` | فحص ESLint |
| `npm test` | تشغيل 573 اختبار مرة واحدة |
| `npm run test:watch` | تشغيل الاختبارات مع المراقبة المستمرة |
| `npm run test:coverage` | تقرير تغطية الاختبارات |
| `npm run format` | تنسيق الكود بـ Prettier |
| `npm run format:check` | فحص التنسيق بدون تعديل |
| `npm run validate` | سير عمل متكامل (lint + format:check + test) |
| `npm run smoke` | اختبار دخان HTTP للتأكد من عمل الخادم |

---

## 3. مسارات API

### المصادقة

| الطريقة | المسار | المصادقة | الوصف |
|---------|--------|----------|-------|
| `POST` | `/api/auth/register` | ❌ | إنشاء حساب جديد |
| `POST` | `/api/auth/login` | ❌ | تسجيل الدخول — يُعيد JWT |
| `GET` | `/api/auth/me` | ✅ | بيانات المستخدم الحالي |
| `POST` | `/api/auth/logout` | ✅ | تسجيل الخروج (يحذف جهاز اختياريًا) |

### الملاحظات

| الطريقة | المسار | المصادقة | الوصف |
|---------|--------|----------|-------|
| `GET` | `/api/notes` | ✅ | قائمة ملاحظات (ترقيم + تصفية + بحث) |
| `POST` | `/api/notes` | ✅ | إنشاء ملاحظة (نصية أو صوتية) |
| `GET` | `/api/notes/:id` | ✅ | تفاصيل ملاحظة (مع audioData) |
| `PUT` | `/api/notes/:id` | ✅ | تعديل ملاحظة |
| `DELETE` | `/api/notes/:id` | ✅ | حذف ملاحظة |

### المستخدمين

| الطريقة | المسار | المصادقة | الوصف |
|---------|--------|----------|-------|
| `PUT` | `/api/users/:id` | ✅ | تعديل الملف الشخصي أو كلمة المرور |
| `DELETE` | `/api/users/:id` | ✅ | حذف الحساب وكل البيانات (معاملة ذرية) |

### الأجهزة

| الطريقة | المسار | المصادقة | الوصف |
|---------|--------|----------|-------|
| `GET` | `/api/devices` | ✅ | قائمة الأجهزة الموثوقة |
| `POST` | `/api/devices` | ✅ | الوثوق بجهاز جديد (يتطلب كلمة المرور) |
| `DELETE` | `/api/devices` | ✅ | إزالة جهاز موثوق |

### الإشعارات

| الطريقة | المسار | المصادقة | الوصف |
|---------|--------|----------|-------|
| `POST` | `/api/push/subscribe` | ✅ | تسجيل اشتراك Push |
| `DELETE` | `/api/push/subscribe` | ✅ | إلغاء اشتراك Push |
| `POST` | `/api/push/send` | ✅ | إرسال إشعار (داخلي) |

### الصحة

| الطريقة | المسار | المصادقة | الوصف |
|---------|--------|----------|-------|
| `GET` | `/api/health` | ❌ | فحص صحة الخادم + قاعدة البيانات |
| `HEAD` | `/api/health` | ❌ | نبض سريع (بدون جسم استجابة) |

للمرجع الكامل مع أمثلة الطلبات والاستجابات ← [api-endpoints.md](../api-endpoints.md)

---

## 4. روابط الدروس

| # | الدرس | الوصف المختصر |
|---|-------|---------------|
| 01 | [إعداد المشروع](lessons/01-project-setup.md) | ملفات التهيئة، هيكل المجلدات، المتغيرات البيئية |
| 02 | [نماذج قاعدة البيانات](lessons/02-database-models.md) | Mongoose schemas — مستخدم، ملاحظة، جهاز، اشتراك |
| 03 | [نمط المستودعات](lessons/03-repository-pattern.md) | واجهة عامة، مستودع أساسي، مستودعات متخصصة |
| 04 | [المصادقة والحماية](lessons/04-authentication.md) | JWT 7 أيام، bcrypt 12 جولة، middleware، AuthContext |
| 05 | [مسارات API](lessons/05-api-routes.md) | 19 نقطة نهاية — الطلب والاستجابة والتحقق |
| 06 | [نظام السمات](lessons/06-theme-system.md) | MUI 7، فاتح/داكن، RTL، EmotionCache |
| 07 | [الترجمة](lessons/07-internationalization.md) | next-intl 4، ملفات الرسائل، تبديل اللغة |
| 08 | [واجهة الملاحظات](lessons/08-notes-crud.md) | useNotes، نماذج، قوائم، بحث، ترقيم |
| 09 | [محرر النصوص الغني والتسجيل الصوتي](lessons/09-tiptap-and-media-recorder.md) | TipTap 3، MediaRecorder، معالجة صوت |
| 10 | [PWA و Service Worker](lessons/10-pwa-service-worker.md) | @serwist/next 9، Dexie 4، بصمة صفرية، مزامنة |
| 11 | [الإشعارات والأجهزة](lessons/11-push-notifications.md) | VAPID Web Push، أجهزة موثوقة، كشف اتصال |
| 12 | [الملف الشخصي](lessons/12-profile-settings.md) | تعديل بيانات، تغيير كلمة مرور، حذف حساب |
| 13 | [الاختبارات](lessons/13-testing.md) | Vitest 4، Testing Library 16، 573 اختبار في 39 ملف |

---

## 5. مفاتيح الترجمة (Namespaces)

ملفات الرسائل في `src/messages/ar.json` و `en.json` — 25 نطاق:

| النطاق (Namespace) | المكون | مثال على مفتاح |
|--------------------|--------|----------------|
| `App` | عام | اسم التطبيق |
| `AppBar` | شريط التطبيق | عنوان الصفحة |
| `SideBar` | القائمة الجانبية | عناصر التنقل |
| `NoteList` | قائمة الملاحظات | "لا توجد ملاحظات" |
| `NoteCard` | بطاقة ملاحظة | أزرار تعديل/حذف |
| `NoteEditorForm` | نموذج المحرر | حقول العنوان والمحتوى |
| `DeleteConfirmDialog` | حوار حذف ملاحظة | رسالة التأكيد |
| `Login` | تسجيل الدخول | حقول البريد وكلمة المرور |
| `Register` | إنشاء حساب | حقول التسجيل |
| `ProfileEditor` | محرر الملف الشخصي | حقول البيانات |
| `DeleteAccountDialog` | حوار حذف الحساب | رسالة التحذير |
| `ProfilePage` | صفحة الملف الشخصي | عناوين الأقسام |
| `PwaActivation` | تنشيط PWA | شرح المزايا |
| `NotesPage` | صفحة الملاحظات | عنوان + أزرار |
| `NewNotePage` | ملاحظة جديدة | عنوان الصفحة |
| `NoteDetailPage` | تفاصيل ملاحظة | أزرار التفاعل |
| `EditNotePage` | تعديل ملاحظة | عنوان الصفحة |
| `RichTextEditor` | شريط أدوات المحرر | تنسيق النص |
| `LocaleSwitchPrompt` | اقتراح تغيير اللغة | رسالة الاقتراح |
| `OfflineBanner` | شريط عدم الاتصال | رسالة التنبيه |
| `ConnectionStatus` | حالة الاتصال | حالة المزامنة |
| `DeviceManager` | إدارة الأجهزة | قائمة الأجهزة |
| `PushNotifications` | إعدادات الإشعارات | زر التفعيل |
| `DeviceTrustPrompt` | طلب الوثوق بالجهاز | رسالة الطلب |
| `VoiceRecorder` | التسجيل الصوتي | أزرار التسجيل |

```tsx
import { useTranslations } from 'next-intl';
// طريقة الاستخدام
const t = useTranslations('NoteList'); // اختر النطاق
return <p>{t('emptyMessage')}</p>;     // استخدم المفتاح
```

---

## 6. نقاط فحص التعلم

### الدرس 01 — إعداد المشروع والبنية الأساسية

- [ ] أفهم بنية مجلدات المشروع
- [ ] أعرف دور كل ملف تهيئة (`next.config`, `tsconfig`, `vitest.config`)
- [ ] أستطيع تشغيل `npm run dev` والوصول للتطبيق
- [ ] أفهم المتغيرات البيئية المطلوبة وكيف أضبطها

### الدرس 02 — نماذج قاعدة البيانات

- [ ] أفهم الفرق بين Schema و Model في Mongoose
- [ ] أعرف حقول كل نموذج (User, Note, Device, Subscription)
- [ ] أفهم كيف تعمل الفهارس ولماذا هي مهمة
- [ ] أعرف كيف يتصل التطبيق بـ MongoDB (Singleton)

### الدرس 03 — نمط المستودعات

- [ ] أفهم لماذا نفصل طبقة الوصول للبيانات
- [ ] أعرف واجهة `IRepository<T>` وعملياتها
- [ ] أفهم كيف يعمل `BaseRepository` مع Generics
- [ ] أعرف كيف أستخدم `RepositoryManager` للوصول لأي مستودع

### الدرس 04 — المصادقة والحماية

- [ ] أفهم دورة حياة JWT (إنشاء → إرسال → تحقق → انتهاء)
- [ ] أعرف كيف يعمل bcrypt لتأمين كلمات المرور
- [ ] أفهم وسيط المصادقة `authenticateRequest()`
- [ ] أعرف كيف يعمل `AuthContext` ولماذا يخزّن المستخدم محليًا

### الدرس 05 — مسارات API

- [ ] أفهم كيف تعمل Route Handlers في Next.js
- [ ] أعرف بنية الطلب والاستجابة لكل مسار
- [ ] أفهم كيف تعمل دوال التحقق (validators)
- [ ] أعرف كيف يعمل عميل API في المتصفح (`fetchApi`)

### الدرس 06 — نظام السمات والتخطيط

- [ ] أفهم كيف يعمل MUI ThemeProvider مع Emotion
- [ ] أعرف كيف يتبدل الوضع الفاتح/الداكن
- [ ] أفهم كيف يدعم التطبيق RTL تلقائيًا
- [ ] أعرف بنية التخطيط (AppBar + Sidebar + Content)

### الدرس 07 — الترجمة وثنائية الاتجاه

- [ ] أفهم كيف يعمل next-intl مع App Router
- [ ] أعرف بنية ملفات الرسائل والنطاقات
- [ ] أفهم كيف يكشف الوسيط لغة المستخدم ويُعيد التوجيه
- [ ] أستطيع إضافة مفتاح ترجمة جديد

### الدرس 08 — واجهة إدارة الملاحظات

- [ ] أفهم كيف يعمل `useNotes` (CRUD + رتل + ترقيم)
- [ ] أعرف بنية مكونات الملاحظات (Card, List, Form)
- [ ] أفهم Optimistic UI — لماذا الملاحظة تظهر فورًا
- [ ] أعرف كيف يعمل البحث والترقيم

### الدرس 09 — التسجيل الصوتي والمحرر النصي

- [ ] أفهم MediaRecorder API وكيف يُسجّل الصوت
- [ ] أعرف كيف يُحوّل الصوت لـ Base64 للتخزين
- [ ] أفهم مكونات TipTap (StarterKit + Extensions)
- [ ] أعرف كيف يعمل تنقية HTML (sanitize)

### الدرس 10 — PWA و Service Worker

- [ ] أفهم ما هو Service Worker وكيف يعمل بمعزل عن الصفحة
- [ ] أعرف استراتيجيات التخزين المؤقت المُستخدمة
- [ ] أفهم نمط "بصمة صفرية" ولماذا يختلف عن PWA التقليدي
- [ ] أعرف كيف يعمل `db.ts` (Dexie) لتخزين البيانات محليًا

### الدرس 11 — الإشعارات الفورية وإدارة الأجهزة

- [ ] أفهم بروتوكول VAPID وكيف تعمل الإشعارات
- [ ] أعرف دورة حياة PushSubscription
- [ ] أفهم نظام الأجهزة الموثوقة ولماذا يحتاج كلمة المرور
- [ ] أعرف كيف يتم ربط الاشتراك بالجهاز

### الدرس 12 — الملف الشخصي وإعدادات الحساب

- [ ] أفهم كيف يعمل تعديل البيانات الشخصية
- [ ] أعرف آلية تغيير كلمة المرور (القديمة + الجديدة)
- [ ] أفهم عملية حذف الحساب الذرية (Transaction)
- [ ] أعرف كيف يُنظّف المتصفح بعد حذف الحساب

### الدرس 13 — الاختبارات الشاملة

- [ ] أفهم إعداد بيئة الاختبار (Vitest + jsdom)
- [ ] أعرف نمط AAA (Arrange-Act-Assert) وأطبقه
- [ ] أفهم كيف يُحاكي Testing Library تفاعل المستخدم
- [ ] أعرف كيف أستخدم Mocking لعزل المكون عن API
- [ ] أستطيع تشغيل الاختبارات وقراءة تقرير التغطية

---

[← العودة إلى الفهرس](README.md) | [دليل المفاهيم ←](concepts-guide.md)
