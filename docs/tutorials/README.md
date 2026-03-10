# توثيقات تعليمية — مشروع ملاحظاتي 📝

> شروحات تفصيلية سطرًا بسطر لكل أجزاء المشروع — من إعداد البيئة إلى الاختبارات الشاملة

---

## لمحة عن المشروع

| الخاصية | القيمة |
|---------|--------|
| **اسم التطبيق** | ملاحظاتي (My Notes) |
| **الإطار** | Next.js 16 (App Router) |
| **اللغة** | TypeScript (strict) |
| **واجهة المستخدم** | MUI 7 + Emotion (RTL كامل) |
| **قاعدة البيانات** | MongoDB + Mongoose 9 |
| **المصادقة** | JWT (7 أيام) + bcrypt (12 جولة) |
| **التخزين المحلي** | Dexie 4 (IndexedDB) |
| **الإشعارات** | Web Push (VAPID) |
| **الترجمة** | next-intl 4 (عربي + إنجليزي) |
| **PWA** | @serwist/next 9 — بصمة صفرية (Zero Footprint) |
| **المحرر** | TipTap 3 (نصوص غنية) |
| **الاختبارات** | Vitest 4 + Testing Library — **573 اختبار** في 39 ملف |
| **النشر** | Heroku |

---

## فهرس الدروس

### الدروس (`lessons/`)

| # | العنوان | الوصف المختصر | الرابط |
|---|---------|---------------|--------|
| 01 | إعداد المشروع والبنية الأساسية | ملفات التهيئة، هيكل المجلدات، الأوامر، المتغيرات البيئية | [lessons/01-project-setup.md](lessons/01-project-setup.md) |
| 02 | نماذج قاعدة البيانات | Mongoose schemas للمستخدم، الملاحظة، الجهاز، الاشتراك | [lessons/02-database-models.md](lessons/02-database-models.md) |
| 03 | نمط المستودعات | Repository Pattern — الواجهة العامة، المستودع الأساسي، المستودعات المتخصصة | [lessons/03-repository-pattern.md](lessons/03-repository-pattern.md) |
| 04 | المصادقة والحماية | JWT، bcrypt، middleware المصادقة، حماية المسارات، AuthContext | [lessons/04-authentication.md](lessons/04-authentication.md) |
| 05 | مسارات API | Route Handlers في Next.js، الطلب والاستجابة، معالجة الأخطاء، المُدققات | [lessons/05-api-routes.md](lessons/05-api-routes.md) |
| 06 | نظام السمات والتخطيط | MUI ThemeProvider، الوضع الفاتح/الداكن، RTL، تخطيط الصفحة | [lessons/06-theme-system.md](lessons/06-theme-system.md) |
| 07 | الترجمة وثنائية الاتجاه | next-intl، ملفات الرسائل، توجيه اللغة، تبديل ديناميكي | [lessons/07-internationalization.md](lessons/07-internationalization.md) |
| 08 | واجهة إدارة الملاحظات | useNotes hook، النماذج، القوائم، البطاقات، البحث، الترقيم | [lessons/08-notes-crud.md](lessons/08-notes-crud.md) |
| 09 | التسجيل الصوتي والمحرر النصي | MediaRecorder API، TipTap، معالجة الصوت | [lessons/09-voice-recording.md](lessons/09-voice-recording.md) |
| 10 | تطبيق الويب التقدمي و Service Worker | @serwist/next، Dexie، رتل العمليات المعلّقة، المزامنة الخلفية | [lessons/10-pwa-service-worker.md](lessons/10-pwa-service-worker.md) |
| 11 | الإشعارات الفورية وإدارة الأجهزة | VAPID Web Push، الأجهزة الموثوقة، كشف الاتصال | [lessons/11-push-notifications.md](lessons/11-push-notifications.md) |
| 12 | الملف الشخصي وإعدادات الحساب | تعديل البيانات، تغيير كلمة المرور، حذف الحساب | [lessons/12-profile-settings.md](lessons/12-profile-settings.md) |
| 13 | الاختبارات الشاملة | Vitest، Testing Library، أنماط الاختبار، 573 اختبار في 39 ملف | [lessons/13-testing.md](lessons/13-testing.md) |

### المراجع

| الملف | الغرض |
|-------|-------|
| [concepts-guide.md](concepts-guide.md) | شرح كل المفاهيم التقنية من الصفر للمبتدئ |
| [quick-reference.md](quick-reference.md) | مرجع سريع — جداول الأوامر، مسارات API، خريطة الملفات |

---

## مسار التعلم المقترح

### مبتدئ كامل — ابدأ من البداية

```
الدرس 01 (إعداد المشروع)
  └──► الدرس 02 (قاعدة البيانات)
        └──► الدرس 03 (المستودعات)
              └──► الدرس 04 (المصادقة)
                    └──► الدرس 05 (مسارات API)
                          └──► الدرس 06 (السمات)
                                └──► الدرس 07 (الترجمة)
                                      └──► الدرس 08 (الملاحظات)
                                            └──► الدرس 09 (الصوت)
                                                  └──► الدرس 10 (PWA)
                                                        └──► الدرس 11 (الإشعارات)
                                                              └──► الدرس 12 (الملف الشخصي)
                                                                    └──► الدرس 13 (الاختبارات)
```

### مطور يريد فهم PWA والعمل بدون اتصال

```
الدرس 01 (إعداد) → الدرس 02 (قاعدة البيانات) → الدرس 04 (المصادقة)
  └──► الدرس 10 (PWA و Service Worker) ← ابدأ هنا
        └──► الدرس 11 (الإشعارات والأجهزة)
              └──► الدرس 13 (الاختبارات)
```

### مطور يريد فهم الاختبارات فقط

```
الدرس 01 (إعداد — قسم Vitest فقط) → الدرس 13 (الاختبارات الشاملة)
  └──► اقرأ الدرس المتعلق بأي ملف اختبار تريد فهمه
```

---

## ملاحظات عامة

- **جميع الشروحات بالعربية** — أسماء الملفات بالإنجليزية
- **الكود كما هو** من المصدر مع تعليقات عربية توضيحية
- **كل درس مستقل** — يمكن قراءته منفردًا، لكن الترتيب المقترح أعلاه يعطي أفضل تجربة
- **اصطلاح الرموز:** في النثر العربي نستخدم الرموز العربية (`،` `؛` `؟`)، وفي كتل الكود نستخدم الرموز اللاتينية (`,` `;` `?`) والأرقام الغربية (`0-9`) — راجع [concepts-guide.md § اصطلاحات الترقيم](concepts-guide.md#اصطلاحات-الترقيم-في-التوثيق) للتفاصيل

---

## التوثيقات التقنية المكمّلة

| الملف | الغرض |
|-------|-------|
| [../api-endpoints.md](../api-endpoints.md) | مرجع API الكامل (18 نقطة نهاية) |
| [../database-abstraction.md](../database-abstraction.md) | نمط المستودعات — معمارية طبقة البيانات |
| [../repository-quick-reference.md](../repository-quick-reference.md) | كل عمليات المستودعات مع أمثلة |
| [../pwa-guide.md](../pwa-guide.md) | دليل PWA التقني |
| [../testing.md](../testing.md) | منظومة الاختبارات |
| [../deployment.md](../deployment.md) | دليل النشر على Heroku |
| [../ai/README.md](../ai/README.md) | فهرس توثيقات AI (إنجليزي) |
