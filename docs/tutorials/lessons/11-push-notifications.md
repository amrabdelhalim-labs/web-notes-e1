# الدرس 11: الإشعارات الفورية وإدارة الأجهزة الموثوقة

> هدف الدرس: فهم كيف يُبني نظام ثقة الأجهزة المرتبط بالإشعارات الفورية — من تحديد هوية الجهاز في المتصفح، مرورًا بكشف الاتصال بطبقتين، وصولًا إلى كشافة الحالة الجامعة `ConnectionIndicator` التي تُلخّص كل مؤشرات النظام في مكان واحد.

---

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 10: تطبيق الويب التقدمي (PWA) و Service Worker](10-pwa-service-worker.md)

---

## فهرس هذا الدرس

1. [نظرة معمارية — هرم الثقة](#1-نظرة-معمارية--هرم-الثقة)
2. [useDeviceId — بطاقة هوية الجهاز](#2-usedeviceid--بطاقة-هوية-الجهاز)
3. [useOfflineStatus — كشف الاتصال بطبقتين](#3-useofflinestatus--كشف-الاتصال-بطبقتين)
4. [useSyncStatus — مراقب طابور المزامنة](#4-usesyncstatus--مراقب-طابور-المزامنة)
5. [useDevices — دورة حياة الأجهزة الموثوقة](#5-usedevices--دورة-حياة-الأجهزة-الموثوقة)
6. [usePushNotifications — اشتراك VAPID Web Push](#6-usepushnotifications--اشتراك-vapid-web-push)
7. [DeviceTrustPrompt — حوار التوثيق بعد الدخول](#7-devicetrustprompt--حوار-التوثيق-بعد-الدخول)
8. [ConnectionIndicator — لوحة القيادة الجامعة](#8-connectionindicator--لوحة-القيادة-الجامعة)
9. [ملخص](#9-ملخص)

---

## 1. نظرة معمارية — هرم الثقة

### تشبيه: نظام بطاقة الدخول في مبنى أمني

تخيّل أن **ملاحظاتي** مبنى حكومي فيه أنظمة أمنية متداخلة:

- **كل شخص لديه هوية مميزة** — بطاقة RFID فريدة لكل موظف (= `useDeviceId`)
- **هناك كاشف رئيسي عند الباب** — يُحدّد هل الباب مفتوح أم مغلق (= `useOfflineStatus`)
- **لوحة تُعرض في المدخل** — تُبيّن كم طلب معلّق وهل الاتصال بالمقر الرئيسي يعمل (= `useSyncStatus`)
- **مكتب الأمن يُدير قائمة الموظفين الموثوقين** — من يُضاف، من يُزال (= `useDevices`)
- **نظام إشعارات** — يُرسل رسائل للموظفين على أجهزتهم الشخصية حين يحدث شيء مهم (= `usePushNotifications`)
- **شاشة الاستقبال الرئيسية** — تجمع كل المؤشرات في عرض واحد (= `ConnectionIndicator`)

---

### خريطة التبعيات

```text
ConnectionIndicator
    ├─ useOfflineStatus  // طبقة 1: online/offline events
    │       └─ pingServer()  // طبقة 2: HEAD /api/health
    ├─ useSyncStatus          ← Dexie pendingOps
    └─ usePwaStatus           ← SW state + install state (الدرس 10)

DeviceTrustPrompt
    ├─ useDevices
    │       ├─ useDeviceId  // معرّف ثابت
    │       └─ useOfflineStatus
    └─ useAuth

usePushNotifications
    └─ (مستقل — يستخدم localStorage + navigator.serviceWorker)
```

---

## 2. useDeviceId — بطاقة هوية الجهاز

**الملف:** `src/app/hooks/useDeviceId.ts` ← 57 سطرًا

### ما هو المُحدِّد الفريد للجهاز؟

الجهاز لا يملك "هوية ثابتة" يمكن قراءتها مباشرة من JavaScript لأسباب خصوصية. الحل: **إنشاء UUID عشوائية وتخزينها في `localStorage`**. هذه الهوية:
- ثابتة طوال عمر المتصفح (ما لم يُمسح localStorage)
- فريدة لكل متصفح/جهاز (UUID بـ 128 bit)
- مرتبطة بالمستخدم الحالي (localStorage لا يُشارَك بين المستخدمين)

---

### كشف المتصفح ونظام التشغيل

```typescript
function detectBrowser(): string {
  const ua = navigator.userAgent;
  // الترتيب حرج: Edge يحتوي على "Chrome" — تحقق من "Edg/" أولًا
  if (ua.includes('Edg/'))                         return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Firefox/'))                     return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  return 'Unknown';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows'))                       return 'Windows';
  if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'macOS';
  if (ua.includes('Android'))                       return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Linux'))                         return 'Linux';
  if (ua.includes('CrOS'))                          return 'ChromeOS';
  return 'Unknown';
}
```

**لماذا الترتيب مهم في `detectBrowser`؟**

User Agent strings تتضمن أسماء متصفحات أخرى للتوافق:
- Edge: `"Mozilla/5.0 ... Chrome/120 ... Edg/120"` (يحتوي "Chrome")
- Chrome: `"Mozilla/5.0 ... Chrome/120"` (لا "Edg")
- Safari: `"Mozilla/5.0 ... Safari/537"` (لكن Chrome يحتوي "Safari" أيضًا!)

التحقق من `Edg/` و `OPR/` أولًا يمنع الوضع في خانة Chrome خطًأ.

---

### الـ hook

```typescript
export interface DeviceIdInfo {
  deviceId: string;  // UUID المخزونة في localStorage
  browser: string;   // 'Chrome' | 'Firefox' | 'Edge' | ...
  os: string;        // 'Windows' | 'macOS' | 'Android' | ...
  name: string;      // 'Chrome — Windows' (لعرض اسم الجهاز)
}

export function useDeviceId(): DeviceIdInfo {
  return useMemo(() => {
    let id = localStorage.getItem(STORAGE_KEY); // STORAGE_KEY = 'device-id'
    if (!id) {
      id = crypto.randomUUID(); // UUID v4 مُولَّد بأمان
      localStorage.setItem(STORAGE_KEY, id);
    }
    const browser = detectBrowser();
    const os = detectOS();
    return { deviceId: id, browser, os, name: `${browser} — ${os}` };
  }, []); // تبعيات فارغة: UUID لا تتغير خلال الجلسة
}
```

**`useMemo` بتبعيات فارغة** — يُشغَّل مرة واحدة على الـ mount ويُعيد نفس النتيجة طوال عمر المكوّن. بديل عملي لـ `useState` + lazy initializer حين لا توجد حاجة لتحديث القيمة.

**`crypto.randomUUID()`** — API مدمجة في المتصفحات الحديثة تُولّد UUID v4 آمنة عشوائياً (128 bit). أكثر أمانًا من `Math.random()` التي تستخدم مولّد أرقام شبه عشوائية.

---

### جدول الاستخدام

| من يستخدم `useDeviceId` | لماذا |
|------------------------|-------|
| `useDevices` | ربط الجهاز بقائمة الموثوقين في الخادم |
| `usePushNotifications` | ربط اشتراك Push بهوية الجهاز |
| `ConnectionIndicator` (عبر useDevices) | عرض اسم الجهاز الحالي |
| `DeviceTrustPrompt` (عبر useDevices) | إرسال `name` و `browser` و `os` للخادم |

---

## 3. useOfflineStatus — كشف الاتصال بطبقتين

**الملف:** `src/app/hooks/useOfflineStatus.ts` ← 139 سطرًا

### المشكلة: `navigator.onLine` كاذب أحيانًا

```text
المستخدم متصل بـ WiFi الراوتر: navigator.onLine = true ✓
لكن الراوتر لا يصل للإنترنت:  navigator.onLine = true ✗ (كاذب!)
```

**الحل: طبقتان من الكشف:**

| الطبقة | الأداة | السرعة | الدقة |
|--------|--------|--------|-------|
| الفورية | `online`/`offline` browser events | فورية | منخفضة (لا تتحقق من الخادم) |
| المُتحقَّقة | HEAD /api/health | 0-5 ثوانٍ | عالية (يتحقق فعلًا) |

---

### إزالة التكرار للـ ping

```typescript
/**
 * إزالة التكرار على مستوى الـ module (خارج المكوّن):
 * لو استدعى 3 hooks pingServer() في نفس اللحظة → fetch واحد فقط يُرسَل.
 * الجميع ينتظر نفس Promise ويحصل على نفس النتيجة.
 */
let _pingInFlight: Promise<boolean> | null = null;

async function pingServer(): Promise<boolean> {
  if (_pingInFlight) return _pingInFlight; // أعد استخدام الطلب الجاري
  _pingInFlight = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS); // 5 ثوانٍ
      const res = await fetch(HEALTH_ENDPOINT, {
        method: 'HEAD',    // لا تُرجع body — أسرع
        cache: 'no-store', // لا كاش — نريد حالة الشبكة الآن
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok; // 200-299
    } catch {
      return false; // network error أو AbortError
    }
  })().finally(() => {
    _pingInFlight = null; // أعد التهيئة للطلب التالي
  });
  return _pingInFlight;
}
```

**لماذا هذا النمط مهم؟** — `ConnectionIndicator` و `OfflineBanner` و `useNotes` كلها في الـ DOM في نفس الوقت، وكلها تستخدم `useOfflineStatus`. بدون إزالة التكرار، عودة الاتصال تُطلق 3 طلبات HEAD متزامنة. المتغير `_pingInFlight` على مستوى الـ module يضمن طلبًا واحدًا فقط.

**`method: 'HEAD'`** — طلب HTTP يُعيد headers فقط بدون body — أسرع وأخف من GET. نُريد فقط معرفة هل الخادم يرد (status code)، لا نُريد البيانات.

---

### الكشف والإذاعة

```typescript
export const CONNECTIVITY_CHECK_EVENT = 'connectivity:check';   // لطلب إعادة التحقق
export const CONNECTIVITY_STATUS_EVENT = 'connectivity:status'; // لنشر النتيجة

const verify = useCallback(async () => {
  // تحسين: إذا المتصفح نفسه يعرف أننا offline — لا نُرسل طلبًا
  if (!navigator.onLine) {
    setIsOnline(false);
    window.dispatchEvent(
      new CustomEvent(CONNECTIVITY_STATUS_EVENT, { detail: { online: false } })
    );
    return;
  }

  if (pinging.current) return; // منع تكرار ping من نفس الـ hook instance
  pinging.current = true;
  const reachable = await pingServer();
  pinging.current = false;

  setIsOnline(reachable);
  window.dispatchEvent(
    new CustomEvent(CONNECTIVITY_STATUS_EVENT, { detail: { online: reachable } })
  );
}, []);
```

**`pinging.current`** — كل instance من `useOfflineStatus` له ref خاص به `pinging`. حتى لو `_pingInFlight` يمنع طلبات متعددة، ref يمنع نفس الـ hook من إضافة setState مكررة.

**إذاعة `CONNECTIVITY_STATUS_EVENT`** — يُتيح لمكوّنات غير موجودة في شجرة React (أو hooks أخرى) معرفة حالة الاتصال فور تغيّرها بدون الحاجة لاستدعاء `useOfflineStatus` مرة أخرى.

---

### useEffect — الأربعة مستمعين

```typescript
useEffect(() => {
  const handleOffline = () => {
    // المتصفح فُصل — instant, لا نحتاج ping
    setIsOnline(false);
    window.dispatchEvent(new CustomEvent(CONNECTIVITY_STATUS_EVENT, { detail: { online: false } }));
  };

  const handleOnline = () => {
    // المتصفح قال "عاد الاتصال" — تحقق فعلًا
    verify();
  };

  const handleVisibility = () => {
    // المستخدم عاد للتبويب — تحقق (قد تغيّر الاتصال أثناء غيابه)
    if (document.visibilityState === 'visible') verify();
  };

  const handleCheckRequest = () => verify();
  // ↑ يُستدعى حين أي مكوّن يُطلق CONNECTIVITY_CHECK_EVENT

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener(CONNECTIVITY_CHECK_EVENT, handleCheckRequest);

  // فحص أولي مؤجل للـ microtask — يمنع setState في render phase
  void Promise.resolve().then(() => verify());

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener(CONNECTIVITY_CHECK_EVENT, handleCheckRequest);
  };
}, [verify]);
```

**لماذا `void Promise.resolve().then(() => verify())`؟**

الاتصال الأول يُشغَّل في `useEffect` body. لكن إذا أعاد `verify()` `false` فورًا (الحالة المتزامنة):
- React StrictMode يصطاد `setState` التي تُشغَّل مباشرة داخل body الـ effect وتُنبّه في DevTools
- تأجيل في microtask يجعل `setState` تحدث بعد اكتمال setup الـ effect

---

## 4. useSyncStatus — مراقب طابور المزامنة

**الملف:** `src/app/hooks/useSyncStatus.ts` ← 52 سطرًا

```typescript
export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [hasFailures, setHasFailures] = useState(false);

  const checkPendingOps = async () => {
    try {
      setIsChecking(true);
      const hasPending = await hasPendingOps(); // Dexie: count > 0?
      if (hasPending) {
        const ops = await getPendingOps();
        setPendingCount(ops.length);
        setHasFailures(ops.some((op) => (op.failureCount ?? 0) > 0));
        // ↑ هل أي عملية فشلت مرة واحدة على الأقل؟
      } else {
        setPendingCount(0);
        setHasFailures(false);
      }
    } catch (error) {
      console.error('Error checking pending operations:', error);
      setPendingCount(0);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkPendingOps();                             // عند mount
    const interval = setInterval(checkPendingOps, 10000); // كل 10 ثوانٍ
    return () => clearInterval(interval);
  }, []);

  return {
    pendingCount,
    isChecking,
    hasPending: pendingCount > 0, // ← مشتق, لا حالة إضافية
    hasFailures,
    refresh: checkPendingOps,    // ← يُتيح التحديث الفوري
  };
}
```

**لماذا `setInterval(10000)` وليس Dexie observable؟**

Dexie يوفّر `liveQuery()` للاشتراك في تغييرات IndexedDB — لكنه:
- يزيد تعقيد الكود
- يستهلك موارد للـ subscription المستمر

Polling كل 10 ثوانٍ كافٍ: المستخدم لا يحتاج رؤية تحديث فوري للعداد — يكفي رؤيته بعد ثوانٍ من التغيير. `refresh()` يوفّر تحديثًا فوريًا لمن يحتاجه (ConnectionIndicator عند فتح القائمة).

**التمييز بين `pendingCount` و `hasPending`** — `hasPending` مشتق (`pendingCount > 0`). تجنّب إضافة `useState(false)` لـ `hasPending` لأنه قد يتعارض مع `pendingCount` — Boolean مشتق من عدد يضمن الاتساق التلقائي.

---

## 5. useDevices — دورة حياة الأجهزة الموثوقة

**الملف:** `src/app/hooks/useDevices.ts` ← 167 سطرًا

### الثوابت والأحداث

```typescript
const TRUSTED_KEY = 'device-trusted';
const TRUST_CHANGED_EVENT = 'device-trust-changed';

function publishTrustChanged(trusted: boolean) {
  window.dispatchEvent(new CustomEvent(TRUST_CHANGED_EVENT, { detail: { trusted } }));
}
```

**نمط Pub/Sub للثقة** — بدلًا من prop-drilling "هل الجهاز موثوق؟" عبر 10 مكوّنات، `localStorage` + `CustomEvent` تُتيح لأي hook أو مكوّن التحديث فورًا. `usePwaStatus` يستمع لـ `TRUST_CHANGED_EVENT` (الدرس 10) — يُرقّي `installState` من `not-installable` لـ `installable` فور توثيق الجهاز.

---

### fetchDevices — الجلب مع Fallback

```typescript
const fetchDevices = useCallback(async () => {
  try {
    setError(null);
    const res = await getDevicesApi(deviceInfo.deviceId);
    const devices = res.data;
    setDevices(devices);

    // ─── تزامن حالة الثقة مع localStorage ──────────────────────
    const wasTrusted = localStorage.getItem(TRUSTED_KEY) === 'true';
    const trusted = devices.some((d) => d.deviceId === deviceInfo.deviceId);
    if (trusted) localStorage.setItem(TRUSTED_KEY, 'true');
    else localStorage.removeItem(TRUSTED_KEY);
    publishTrustChanged(trusted);

    // ─── كشف إلغاء الثقة غيابيًا ─────────────────────────────────
    if (wasTrusted && !trusted) {
      // هذا الجهاز كان موثوقًا لكن الخادم لا يعرفه الآن
      // (مثال: أزاله المستخدم من جهاز آخر)
      window.dispatchEvent(new CustomEvent('device:trust-revoked'));
    }

    cacheDevices(devices).catch(() => {}); // Dexie للعرض offline
  } catch {
    // ─── Fallback للكاش المحلي عند فشل الشبكة ───────────────────
    const cached = await getCachedDevices();
    if (cached.length > 0) {
      setDevices(cached);
      return; // لا نُظهر خطأ — البيانات المحلية كافية
    }
    setError('فشل تحميل الأجهزة');
  } finally {
    setLoading(false);
  }
}, [deviceInfo.deviceId]);
```

**ثلاثة تحديثات في جلبة واحدة:**
1. `setDevices` — تحديث الـ state المحلي
2. `localStorage` + `publishTrustChanged` — إشعار كل مستمعي الثقة
3. `cacheDevices` — تحديث Dexie للعرض offline

**لماذا `wasTrusted && !trusted` مهم؟**

عند عودة الاتصال بعد انقطاع طويل، يُجري `fetchDevices` مقارنة:
- **قبل**: `localStorage['device-trusted'] = 'true'` (هكذا بقي أثناء الانقطاع)
- **بعد الجلب**: الخادم لا يعرف هذا الجهاز في قائمة الموثوقين

الخادم أُزيل الجهاز أثناء الانقطاع. `device:trust-revoked` يُطلق سلسلة تنظيف (راجع `PwaActivationContext` في الدرس 10).

---

### trustCurrent — توثيق الجهاز الحالي

```typescript
const trustCurrent = useCallback(
  async (password: string) => {
    try {
      setError(null);
      const res = await trustDeviceApi({
        deviceId: deviceInfo.deviceId,
        password,             // كلمة مرور المستخدم للتحقق من الهوية
        name: deviceInfo.name,   // 'Chrome — Windows'
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      });
      // أضف أو حدّث في القائمة المحلية (optimistic)
      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.deviceId === res.data.deviceId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...res.data, isCurrent: true };
          return updated;
        }
        return [...prev, { ...res.data, isCurrent: true }];
      });
      localStorage.setItem(TRUSTED_KEY, 'true');
      publishTrustChanged(true); // أطلق سلسلة تحديث
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الوثوق بالجهاز');
      throw err; // أُعِد لـ DeviceTrustPrompt لعرضه في الواجهة
    }
  },
  [deviceInfo]
);
```

**لماذا نُرسل كلمة المرور لتوثيق الجهاز؟**

توثيق الجهاز يمنح وصولًا إضافيًا:
- مزامنة offline
- استقبال Push Notifications

لو كانت بجلسة نشطة فقط (JWT)، مهاجم يستخدم جلسة مسروقة يمكنه توثيق جهاز خاص به. كلمة المرور طبقة أمان إضافية تُثبت أن هذا هو صاحب الحساب فعلًا.

---

### removeDevice — إزالة جهاز

```typescript
const removeDevice = useCallback(
  async (deviceId: string, password: string) => {
    try {
      setError(null);
      await deleteDeviceApi(deviceId, password); // كلمة المرور للتحقق
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));

      // إذا أزال المستخدم جهازه الحالي:
      if (deviceId === deviceInfo.deviceId) {
        await clearLocalPushState();   // أوقف اشتراك Push
        localStorage.removeItem(TRUSTED_KEY);
        publishTrustChanged(false);
        // لا نُلغي PWA هنا — PwaActivationContext يستمع لـ device-trust-changed
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إزالة الجهاز');
      throw err;
    }
  },
  [deviceInfo.deviceId]
);
```

**`clearLocalPushState()`** — دالة في `pushUtils.ts` تُلغي اشتراك Push المحلي (browser-side) دون الاعتماد على الخادم — تُستدعى حين نحذف الجهاز الحالي.

**لماذا لا نُلغي PWA صراحةً هنا؟** — `publishTrustChanged(false)` يُطلق `TRUST_CHANGED_EVENT`. `usePwaStatus` يستمع له ويُحدّث `isTrusted` → `installState`. `PwaActivationContext` يستمع لـ `device:trust-revoked` ويُلغي PWA. الفصل بين المسؤوليات يُبقي كل hook مُركّزًا.

---

### مراقبة الرؤية — إعادة التحقق عند العودة

```typescript
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      fetchDevices(); // تحقق من حالة الثقة مع الخادم
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, [fetchDevices]);
```

**سيناريو: المستخدم فتح جلسة من جهازين.** في جهاز 2 أزال الثقة من جهاز 1. حين يعود المستخدم لجهاز 1 (يُفعّل التبويب)، يُجري `fetchDevices` فيُكتشف أن الجهاز أُزيل → `device:trust-revoked` → تسلسل التنظيف.

---

## 6. usePushNotifications — اشتراك VAPID Web Push

**الملف:** `src/app/hooks/usePushNotifications.ts` ← 158 سطرًا

### ما هو VAPID Web Push؟

```text
VAPID = Voluntary Application Server Identification
       (تعريف اختياري لخادم التطبيق)
```

**تدفق الإشعارات:**

```text
     │                    │── endpoint ─────────►│
     │                    │                    │
     │── اشتراك ──────────►│                    │
المتصفح                خادمنا          Push Service (Google/Mozilla/Apple)
     │                    │                    │
     │                    │ (لاحقًا: حدث جديد)  │
     │                    │── رسالة VAPID ──────►│
     │                    │                    │
     │◄── push event ─────────────────────────│
     │                    │                    │
     └── SW يعرضها        │                    │
```

---

### urlBase64ToUint8Array — تحويل مفتاح VAPID

```typescript
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // إضافة padding مفقود (Base64 يحتاج طولًا يقبل القسمة على 4)
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  // URL-safe Base64 (-/_) → Standard Base64 (+/)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
```

**لماذا هذا التحويل ضروري؟**

مفتاح VAPID العام يُرسَل من الخادم كـ Base64 URL-safe (`-` و `_` بدل `+` و `/`) — أكثر أمانًا في URLs. `pushManager.subscribe()` يتوقع `Uint8Array` كـ `applicationServerKey`. التحويل:
1. يُصلح الـ padding المفقود
2. يُحوّل URL-safe Base64 لـ Standard Base64
3. يُحوّل لـ binary Uint8Array

---

### subscribe — تدفق الاشتراك الكامل

```typescript
const subscribe = useCallback(async () => {
  setStatus('loading');
  try {
    // ── الخطوة 1: طلب إذن الإشعارات ────────────────────────────────
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setStatus('denied'); // المستخدم رفض — لا نُعيد السؤال
      return;
    }

    // ── الخطوة 2: انتظر SW جاهزًا ────────────────────────────────────
    const registration = await navigator.serviceWorker.ready;

    // ── الخطوة 3: اشتراك في PushManager ──────────────────────────────
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY not set');

    const pushSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,          // يُظهر إشعارات مرئية دائمًا (مطلوب)
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });

    // ── الخطوة 4: إرسال البيانات للخادم ──────────────────────────────
    const subJson = pushSubscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    const { deviceId, deviceInfo } = getDeviceInfo();

    await fetchApi('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        deviceId,
        deviceInfo,
      }),
    });

    localStorage.setItem(STORAGE_KEY, 'true'); // 'push-subscribed'
    setStatus('subscribed');
  } catch {
    setStatus('unsubscribed');
  }
}, []);
```

**`userVisibleOnly: true`** — متطلب اتفاقية Push API: لا يمكن إرسال إشعارات "Silent" (بدون عرض للمستخدم) — يجب أن يُعرض إشعار لكل push event. يمنع التجسس الصامت.

**`navigator.serviceWorker.ready`** — Promise لا تُحلَّل حتى SW نشط بالكامل. أطول من `navigator.serviceWorker.getRegistration()` لكن أكثر أمانًا — يضمن أن SW يتحكم بالصفحة قبل إنشاء الاشتراك.

**`pushSubscription.toJSON()`** — يُعيد الـ subscription كـ plain object مع:
- `endpoint`: رابط Push Service (يختلف حسب المتصفح)
- `keys.p256dh`: مفتاح عام للتشفير
- `keys.auth`: سر للمصادقة

الخادم يحتفظ بهذه البيانات ليُرسل للـ Push Service لاحقًا.

---

### SW message listener — ربط Push بالمزامنة

```typescript
useEffect(() => {
  if (!('serviceWorker' in navigator)) return;

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'PROCESS_OFFLINE_QUEUE') {
      // ترجمة: رسالة SW → DOM event يفهمه useNotes
      window.dispatchEvent(new CustomEvent('notes:process-offline-queue'));
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}, []);
```

**هذا الـ listener يُكمل دورة Background Sync** (الدرس 10):
- SW يستقبل `sync` event → يُرسل `postMessage` لكل نوافذ
- `usePushNotifications` يستمع للـ message → يُطلق `notes:process-offline-queue`
- `useNotes` يستمع للـ DOM event → يُفرّغ الطابور

---

### جدول حالات Push

| الحالة | المعنى | الواجهة المناسبة |
|--------|--------|-----------------|
| `loading` | يتحقق من الدعم والإذن | دوّامة انتظار |
| `unsupported` | المتصفح لا يدعم Push | رسالة توضيحية |
| `denied` | المستخدم رفض الإذن | شرح كيفية التفعيل يدويًا |
| `unsubscribed` | قادر لكن غير مشترك | زر "اشترك في الإشعارات" |
| `subscribed` | مشترك ونشط | زر "إلغاء الاشتراك" |

---

## 7. DeviceTrustPrompt — حوار التوثيق بعد الدخول

**الملف:** `src/app/components/common/DeviceTrustPrompt.tsx` ← 146 سطرًا

### متى يظهر الحوار؟

```typescript
useEffect(() => {
  if (authLoading || !user) return;     // انتظر المصادقة
  if (isTrusted) return;                // الجهاز موثوق بالفعل — لا داعي
  const wasShown = sessionStorage.getItem(PROMPT_SHOWN_KEY); // 'device-trust-prompt-shown'
  if (wasShown === 'true') return;      // ظهر مرة بهذه الجلسة

  const timeout = setTimeout(() => {
    setShowPrompt(true);
    sessionStorage.setItem(PROMPT_SHOWN_KEY, 'true'); // لا يُعاد في نفس الجلسة
  }, 800); // تأخير 800ms لإتاحة UI الاستقرار أولًا

  return () => clearTimeout(timeout);
}, [authLoading, user, isTrusted]);
```

**`sessionStorage` بدل `localStorage`** — `sessionStorage` يُمسح عند إغلاق المتصفح/التبويب. `localStorage` يبقى بين الجلسات. نريد: "يُسأل مرة كل جلسة" — `sessionStorage` هو الأنسب.

**تأخير 800ms** — عند تسجيل الدخول، تحدث عدة عمليات: redirect, render قائمة الملاحظات، تحميل البيانات. عرض حوار التوثيق فورًا يكون متشوشًا. التأخير يُتيح للمستخدم رؤية الواجهة أولًا قبل الحوار.

---

### handleTrust — التوثيق مع UX

```typescript
const handleTrust = useCallback(async () => {
  if (!password) {
    setError(t('passwordRequired')); // تحقق أمامي
    return;
  }

  setTrusting(true);
  setError(null);

  try {
    await trustCurrent(password); // ← useDevices.trustCurrent
    setShowPrompt(false);
    setPassword('');
    // لا نُظهر "نجح" — الحوار يختفي يكفي
  } catch (err) {
    setError(err instanceof Error ? err.message : t('trustError'));
    // نُبقي الحوار مفتوحًا — المستخدم يُصلح كلمة المرور
  } finally {
    setTrusting(false);
  }
}, [password, trustCurrent, t]);
```

---

### دفع Enter لإرسال

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && password) {
    handleTrust();
  }
};
// ... في JSX:
<TextField onKeyDown={handleKeyDown} ... />
```

**ملاحظة**: المتحقق هو `password` (وليس `!trusting`) — لو كان يُعالج، الضغط مرة أخرى لا يُرسل طلبًا إضافيًا لأن `trustCurrent` داخليًا لن يُشغَّل مرتين (سيُعيد الخطأ).

```typescript
autoComplete="current-password"
```

**`autoComplete="current-password"`** — يُتيح لمدير كلمات المرور في المتصفح ملء الحقل تلقائيًا. تفاصيل UX صغيرة تُحسّن التجربة كثيرًا.

---

### عرض الحوار

```tsx
<Dialog
  open={showPrompt}
  onClose={handleDecline} // يُغلق عند الضغط خارجه أو Escape
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>
    <Stack direction="row" alignItems="center" gap={1.5}>
      <DevicesIcon color="primary" />
      {t('title')}
    </Stack>
  </DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ mb: 2 }}>{t('body')}</DialogContentText>
    <DialogContentText sx={{ mb: 2, color: 'text.secondary' }}>{t('benefits')}</DialogContentText>
    <TextField
      type="password"
      autoFocus
      autoComplete="current-password"
      disabled={trusting}
      error={!!error}
      helperText={error ?? t('passwordHint')}
      onKeyDown={handleKeyDown}
    />
  </DialogContent>
  <DialogActions>
    <Button
      onClick={handleDecline}
      variant="outlined"
      disabled={trusting} // يمنع الرفض أثناء المعالجة
    >
      {t('declineButton')}
    </Button>
    <Button
      onClick={handleTrust}
      variant="contained"
      disabled={trusting || !password} // كلاهما شروط
      startIcon={trusting ? <CircularProgress size={18} color="inherit" /> : <DevicesIcon />}
    >
      {trusting ? t('trusting') : t('trustButton')}
    </Button>
  </DialogActions>
</Dialog>
```

**`autoFocus`** — يضع المؤشر مباشرة في حقل كلمة المرور عند فتح الحوار — يُتيح للمستخدم بدء الكتابة فورًا.

**`disabled={trusting || !password}`** — الزر معطّل في حالتين:
1. `trusting`: طلب قيد التنفيذ — يمنع النقر المزدوج
2. `!password`: لا كلمة مرور — لا يجب الإرسال

---

## 8. ConnectionIndicator — لوحة القيادة الجامعة

**الملف:** `src/app/components/common/ConnectionIndicator.tsx` ← 802 سطرًا

### ما الذي تجمعه؟

```typescript
const isOnline = useOfflineStatus();                             // ✓ الشبكة
const { pendingCount, hasPending, hasFailures, refresh } = useSyncStatus(); // ✓ المزامنة
const { swState, installState, installCheckPending, triggerInstall } = usePwaStatus(); // ✓ PWA
const [isTrusted, setIsTrusted] = useState(() => ...);          // ✓ الثقة
```

**ConnectionIndicator هو "لوحة القيادة"** — يجمع 4 مصادر بيانات مختلفة في عرض واحد. المستخدم يرى مؤشرًا صغيرًا في AppBar وحين يضغط يحصل على تفاصيل كاملة.

---

### إدارة حالة الثقة المحلية

```typescript
const [isTrusted, setIsTrusted] = useState(
  () => localStorage.getItem(TRUSTED_KEY) === 'true'
);

useEffect(() => {
  const readTrust = () => setIsTrusted(localStorage.getItem(TRUSTED_KEY) === 'true');

  // مزامنة من تبويبات أخرى
  const handleStorage = (e: StorageEvent) => {
    if (e.key === TRUSTED_KEY) readTrust();
  };

  readTrust(); // تأكد من القيمة الحالية عند mount
  window.addEventListener(TRUST_CHANGED_EVENT, readTrust as EventListener);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(TRUST_CHANGED_EVENT, readTrust as EventListener);
    window.removeEventListener('storage', handleStorage);
  };
}, []);
```

**`StorageEvent`** — حدث يُطلق حين يُغيَّر `localStorage` من **تبويب آخر** (ليس من نفس التبويب). المزامنة بين التبويبات تعتمد عليه: لو وثّق المستخدم الجهاز في تبويب آخر، يُحدَّث `ConnectionIndicator` هنا.

**لماذا `ConnectionIndicator` يتتبع `isTrusted` بـ state منفصل بدل `useDevices`؟**

`useDevices` يجلب البيانات من الشبكة — استخدامه في AppBar معناه طلب شبكة في كل صفحة. `localStorage` كافٍ لعرض "موثوق/غير موثوق" — المعلومات الدقيقة (قائمة الأجهزة) موجودة في صفحة الملف الشخصي فقط.

---

### handleOpen — تحديث فوري عند فتح القائمة

```typescript
const handleOpen = async (e: React.MouseEvent<HTMLElement>) => {
  setAnchorEl(e.currentTarget);
  refresh();                        // تحديث عداد المعلّقة فورًا
  try {
    const ops = await getPendingOps();
    setPendingOps([...ops].reverse()); // الأحدث أولًا
  } catch {}
};
```

**`.reverse()`** — `getPendingOps()` يُعيد بترتيب id تصاعدي (FIFO — الأقدم أولًا). في الواجهة نريد الأحدث أولًا لأن المستخدم يهتم أكثر بما فعله مؤخرًا. `.reverse()` يقلب مصفوفة جديدة `[...ops]` بدون تعديل الأصلية.

---

### showBadge — شارة التنبيه

```typescript
const showBadge = hasPending && isOnline;
```

**لماذا `isOnline` شرط؟** — حين offline، عمليات معلّقة طبيعية ومتوقعة. عرض الشارة أثناء offline يُزعج. حين نعود online مع عمليات معلّقة — الشارة تُنبّه: "هناك شيء للمزامنة".

```tsx
<IconButton ...>
  {isOnline ? <WifiIcon /> : <WifiOffIcon />}
  {showBadge && (
    <Box sx={{
      position: 'absolute',
      top: 2, right: 2,
      width: 8, height: 8,
      borderRadius: '50%',
      bgcolor: 'warning.main',
      border: '1.5px solid white', // ← يمنع التداخل بصريًا مع الخلفية
    }} />
  )}
</IconButton>
```

---

### قائمة العمليات المعلّقة مع Undo

```typescript
const handleUndoOp = async (op: PendingOperation) => {
  if (op.id === undefined) return;
  try {
    await removePendingOp(op.id);          // أزل من Dexie

    // استعادة خاصة لحذف: أعد الملاحظة للكاش
    if (op.type === 'delete' && op.noteSnapshot) {
      await cacheNotes([op.noteSnapshot]); // ← op.noteSnapshot يحفظ الملاحظة قبل الحذف
    }

    // أخطر useNotes بالتراجع
    window.dispatchEvent(new CustomEvent('notes:undo-op', { detail: { op } }));

    setPendingOps((prev) => prev.filter((o) => o.id !== op.id));
    await refresh();
  } catch {}
};
```

**`noteSnapshot` في PendingOperation** (من الدرس 10) — عند إضافة عملية `delete` للطابور، تُخزَّن الملاحظة كاملة كـ snapshot. Undo يستخدمه لإعادة الملاحظة للكاش. بدون snapshot، Undo للحذف يتطلب طلب شبكة.

**حد 5 عمليات في القائمة:**
```tsx
{pendingOps.slice(0, 5).map((op) => ( ... ))}
{pendingOps.length > 5 && (
  <MenuItem disabled>
    <Typography>{t('opMore', { count: pendingOps.length - 5 })}</Typography>
  </MenuItem>
)}
```

القائمة المنسدلة ليس قائمة إدارة كاملة — هي لمحة سريعة. العمليات الكثيرة (>5) تُلخَّص برسالة.

---

### قسم حالة PWA

```tsx
<MenuItem disabled>
{/* حالة Service Worker */}
  <ListItemIcon>
    <ConstructionIcon sx={{ color: swState === 'active' ? 'success.dark' : 'text.disabled' }} />
  </ListItemIcon>
  <ListItemText
    primary={/* SW label */}
    secondary={
      swState === 'active' ? t('swActive') :
      swState === 'installing' ? t('swInstalling') :
      ...
    }
  />
</MenuItem>

{/* حالة التثبيت */}
...

{/* حالة الثقة */}
<MenuItem disabled>
  <ListItemIcon>
    {isTrusted
      ? <VerifiedUserIcon sx={{ color: 'success.dark' }} />
      : <GppBadIcon sx={{ color: 'warning.main' }} />}
  </ListItemIcon>
  <ListItemText
    primary={isTrusted ? t('trusted') : t('notTrusted')}
    secondary={!isTrusted ? <Typography>{t('notTrustedHint')}</Typography> : null}
  />
</MenuItem>
```

**`disabled` على MenuItem** — يمنع التفاعل (لا onClick) لكن يُبقي المحتوى مرئيًا. نمط MUI لعرض إحصاءات "للقراءة فقط" داخل القائمة بدون إضافة مكوّنات مخصصة.

---

### زرا المزامنة — الفرق بينهما

| الزر | `handleCheckAndSync` | `handleManualSync` |
|------|--------------------|--------------------|
| يُتحقق من الاتصال؟ | نعم (`CONNECTIVITY_CHECK_EVENT`) | لا |
| يُفرّغ الطابور؟ | نعم | نعم |
| يظهر دائمًا؟ | نعم | فقط حين `isOnline && hasPending` |
| الانتظار | 1+1.5 ثانية | 1.5 ثانية |

**لماذا زران؟**

- "تحقق ومزامن" — حين المستخدم غير متأكد من الاتصال (يُفعّل الفحص ثم يُزامن)
- "مزامن الآن" — حين الاتصال مؤكد والمستخدم يريد مزامنة سريعة

---

### زر التثبيت الشرطي

```tsx
{installState === 'installable' && triggerInstall && (
  <MenuItem onClick={() => { void triggerInstall(); handleClose(); }}>
    <ListItemIcon><InstallMobileIcon color="primary" /></ListItemIcon>
    <ListItemText primary={t('installApp')} />
  </MenuItem>
)}
```

**ثلاثة شروط ضمنية للظهور:**
1. PWA مُفعَّل (`pwaActivated = true`) — وإلا `installState = 'not-installable'`
2. الجهاز موثوق (`isTrusted = true`) — وإلا `installState != 'installable'`
3. المتصفح جاهز (`beforeinstallprompt` طُلِق) — وإلا `canInstall = false`

---

## 9. ملخص

| ما تعلمناه | الملف | النمط أو التقنية |
|------------|-------|-----------------|
| UUID ثابت لتعريف الجهاز | `useDeviceId` | crypto.randomUUID + localStorage |
| كشف المتصفح/OS من User-Agent | `useDeviceId` | includes() مع ترتيب دقيق |
| كشف الاتصال بطبقتين | `useOfflineStatus` | events + HEAD ping |
| إزالة تكرار الـ ping عبر instances | `useOfflineStatus` | _pingInFlight module-level |
| إذاعة حالة الاتصال عبر CustomEvent | `useOfflineStatus` | CONNECTIVITY_STATUS_EVENT |
| Polling كل 10 ثوانٍ لطابور Dexie | `useSyncStatus` | setInterval + refresh() |
| كشف إلغاء الثقة غيابيًا | `useDevices` | wasTrusted && !trusted |
| Fallback للكاش عند فشل الشبكة | `useDevices` | getCachedDevices() في catch |
| كلمة المرور لتوثيق الجهاز | `useDevices / API` | طبقة أمان فوق JWT |
| pub/sub للثقة عبر CustomEvent | `useDevices` | TRUST_CHANGED_EVENT |
| urlBase64ToUint8Array لـ VAPID | `usePushNotifications` | padding + replace +-/ |
| userVisibleOnly: متطلب Push API | `usePushNotifications` | pushManager.subscribe |
| ربط SW message بـ DOM event | `usePushNotifications` | Notes:process-offline-queue |
| sessionStorage لمرة واحدة للحوار | `DeviceTrustPrompt` | PROMPT_SHOWN_KEY |
| تأخير 800ms لاستقرار UI | `DeviceTrustPrompt` | setTimeout في useEffect |
| لوحة قيادة تجمع 4 مصادر | `ConnectionIndicator` | useOfflineStatus + useSyncStatus + usePwaStatus + localStorage |
| showBadge فقط حين online+pending | `ConnectionIndicator` | منطق شارة تنبيه |
| Undo بـ noteSnapshot | `ConnectionIndicator` | removePendingOp + cacheNotes |
| StorageEvent للمزامنة بين التبويبات | `ConnectionIndicator` | window.addEventListener('storage') |

---

### نقطة المراقبة

قبل الانتقال للدرس التالي، تأكد من قدرتك على الإجابة:

1. لماذا `detectBrowser` يتحقق من `'Edg/'` قبل `'Chrome/'`؟ ما المشكلة التي يحلّها الترتيب؟
2. ما دور `_pingInFlight` كمتغير على مستوى الـ module في `useOfflineStatus`؟ لماذا يكون في scope الـ module وليس داخل الـ hook؟
3. ما الفرق في سلوك `wasTrusted && !trusted` حين يعود الاتصال بعد انقطاع؟ أي حدث يُطلق وما الأثر؟
4. لماذا `usePushNotifications` يُحوّل مفتاح VAPID من URL-safe Base64 لـ Uint8Array؟ ما الذي تتوقعه `pushManager.subscribe`؟
5. لماذا يستخدم `ConnectionIndicator` `localStorage` مباشرة لـ `isTrusted` بدل `useDevices`؟

---

الدرس السابق → [الدرس 10: تطبيق الويب التقدمي (PWA) و Service Worker](10-pwa-service-worker.md) | الدرس التالي → [الدرس 12: الملف الشخصي وإعدادات الحساب](12-profile-settings.md)
