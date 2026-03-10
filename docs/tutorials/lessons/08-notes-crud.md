# الدرس 08: واجهة إدارة الملاحظات (CRUD)

> هدف الدرس: بناء نظام كامل لإنشاء وعرض وتعديل وحذف الملاحظات مع بحث وتصفية وتشغيل كامل في وضع عدم الاتصال، بفهم عميق لأنماط Optimistic UI وإدارة الحالة عبر الخطافات.

---

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 07: الترجمة وثنائية الاتجاه](07-internationalization.md)

---

## فهرس هذا الدرس

1. [نظرة معمارية — طبقات CRUD في ملاحظاتي](#1-نظرة-معمارية--طبقات-crud-في-ملاحظاتي)
2. [أدوات العرض — utils/notes.ts](#2-أدوات-العرض--utilsnotests)
3. [الحماية من XSS — utils/sanitize.ts](#3-الحماية-من-xss--utilssanitizets)
4. [قلب النظام — hooks/useNotes.ts](#4-قلب-النظام--hooksusenotests)
5. [نموذج الإدخال — NoteEditorForm.tsx](#5-نموذج-الإدخال--noteeditorformtsx)
6. [حوار الحذف — DeleteConfirmDialog.tsx](#6-حوار-الحذف--deleteconfirmdialogtsx)
7. [بطاقة الملاحظة — NoteCard.tsx](#7-بطاقة-الملاحظة--notecardsxt)
8. [قائمة الملاحظات — NoteList.tsx](#8-قائمة-الملاحظات--notelisttsx)
9. [الصفحات الأربع — من القائمة إلى التعديل](#9-الصفحات-الأربع--من-القائمة-إلى-التعديل)
10. [Optimistic UI وإدارة التراجع](#10-optimistic-ui-وإدارة-التراجع)
11. [تدفق وضع عدم الاتصال كاملاً](#11-تدفق-وضع-عدم-الاتصال-كاملاً)
12. [ملخص](#12-ملخص)

---

## 1. نظرة معمارية — طبقات CRUD في ملاحظاتي

### تشبيه: مطعم ذكي بخاصية الطلبات المحفوظة

تخيّل مطعمًا ذكيًا فيه:

- **طاولة العرض (NoteCard / NoteList)** — ما يراه العميل من قائمة الأطباق والأوصاف
- **النادل الذكي (useNotes)** — يستقبل طلباتك، يعرضها فورًا على الطاولة (Optimistic UI)، ويُرسلها للمطبخ
- **المطبخ (API Layer)** — يُنفّذ الطلب الفعلي ويُرسل الطبق الحقيقي
- **دفتر الطلبات المؤجلة (IndexedDB/Dexie)** — إذا انقطع الاتصال يُكتب الطلب هنا ليُنفَّذ حين يعود الإنترنت
- **نموذج الطلب (NoteEditorForm)** — قائمة الطلب التي تملأها قبل تقديمه

الفرق الجوهري: في المطعم الذكي، حين تطلب طبقًا، يُوضع صحن فارغ فورًا على طاولتك (Optimistic UI) — فإذا جاء الطبق الحقيقي حُلَّ محله، وإذا فشل الطلب رُفع الصحن.

---

### الطبقات المتسلسلة

```
صفحة notes/page.tsx           ← التنسيق والتوجيه
    ↓
NoteList.tsx + NoteCard.tsx    ← عرض الملاحظات + البحث + التصفية
    ↓
useNotes.ts                    ← إدارة الحالة + CRUD + Offline + Optimistic UI
    ↓
lib/api.ts                     ← طلبات HTTP (getNotesApi, createNoteApi, …)
    ↓
api/notes/route.ts             ← API Handler (Next.js App Router)
    ↓
NoteRepository                 ← طبقة البيانات (تمت تغطيتها في الدرس 03)
    ↓
MongoDB                        ← قاعدة البيانات
```

وبشكل موازٍ للمسار الرئيسي:

```
useNotes.ts  ←→  lib/db.ts (IndexedDB)   ← التخزين المحلي في وضع Offline
useNotes.ts  ←→  utils/sanitize.ts       ← الحماية قبل عرض HTML
useNotes.ts  ←→  utils/notes.ts          ← أدوات التنسيق
```

---

### الأنواع الأساسية (من types.ts)

```typescript
// نوع الملاحظة — نصية أو صوتية
export type NoteType = 'text' | 'voice';

// الملاحظة كما تصل من الخادم (JSON آمن)
export interface Note {
  _id: string;
  title: string;
  content?: string;       // للملاحظات النصية
  audioData?: string;     // Base64 للملاحظات الصوتية
  audioDuration?: number; // بالثواني
  type: NoteType;
  user: string;
  createdAt: string;      // ISO Date string
  updatedAt: string;
}

// مدخلات الإنشاء — ترسل للخادم
export interface NoteInput {
  title: string;
  content?: string;
  audioData?: string;
  audioDuration?: number;
  type: NoteType;
}

// مدخلات التحديث — كلها اختيارية
export interface UpdateNoteInput {
  title?: string;
  content?: string;
  audioData?: string;
  audioDuration?: number;
}
```

**لماذا نوعان (`Note` و `INote`)؟** — `Note` هو النوع المتسلسل (JSON) المستخدم في الواجهة الأمامية، أما `INote extends Document` فهو نوع Mongoose يعيش فقط على الخادم ويحمل حقولًا إضافية مثل `_doc` وكائن `Types.ObjectId`.

---

## 2. أدوات العرض — utils/notes.ts

**الملف:** `src/app/utils/notes.ts` ← 64 سطرًا

### الغرض والموقع المعماري

ملف المساعدات مصمم كـ **دوال نقية (Pure Functions)** مشتركة بين المكونات الثلاثة:
- `NoteCard.tsx` — يستخدم `stripHtml` و `formatDateShort`
- `notes/[id]/page.tsx` — يستخدم `formatDateLong`
- أي مكون مستقبلي يحتاج تنسيق التاريخ أو استخراج نص خالص

```typescript
/**
 * Strip HTML tags and return plain text suitable for card previews.
 *
 * IMPORTANT: A naive `textContent` read on <p>A</p><p>B</p> gives "AB".
 * We insert a space before every closing block tag so adjacent paragraphs,
 * headings and list items are separated by whitespace in the preview.
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  // إضافة مسافة قبل كل وسم إغلاق كتلي لمنع التصاق الفقرات بعضها
  const spaced = html.replace(/<\/(p|h[1-6]|li|dt|dd|div|tr|td|th|blockquote)>/gi, ' ');

  if (typeof document !== 'undefined') {
    // بيئة المتصفح: نستخدم DOM الحقيقي لأدق تجريد
    const tmp = document.createElement('div');
    tmp.innerHTML = spaced;
    return (tmp.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  // SSR fallback: إزالة كل الوسوم ثم تقليص الفراغات المتعددة
  return spaced
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

**سطرًا بسطر:**

| السطر | ما يفعله |
|-------|---------|
| `if (!html) return ''` | حماية سريعة من null/undefined |
| `html.replace(/<\/(p\|h[1-6]\|…)>/gi, ' ')` | يضيف مسافة قبل كل وسم إغلاق كتلي |
| `typeof document !== 'undefined'` | يكشف بيئة التشغيل — في Next.js قد يشتغل على الخادم |
| `document.createElement('div').innerHTML = spaced` | يوظّف محلل HTML الحقيقي للمتصفح |
| `.replace(/\s+/g, ' ').trim()` | يُوحّد الفراغات ويُزيل ما في الطرفين |
| `spaced.replace(/<[^>]*>/g, '')` | SSR fallback: Regex بسيط لحذف كل وسوم HTML |

**لماذا استدعاء DOM وليس Regex فقط؟** — بعض الحالات الحدية مثل `<p>كلمة<br>أخرى</p>` أو وسوم متداخلة تعطي نتائج خاطئة مع Regex. استخدام `document.createElement('div')` يُعطي نفس النتيجة التي يراها المتصفح.

---

### دوال التنسيق الزمني

```typescript
// للبطاقات المختصرة — مثال: "٦ مارس ٢٠٢٦، ٠٩:٣٠ م"
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// لصفحة التفاصيل — مثال: "السبت، ٦ مارس ٢٠٢٦، ٠٩:٣٠ م"
export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

**لماذا `'ar-EG'` تحديدًا؟** — الأرقام العربية (`٠١٢٣…`) وأسماء الأشهر والأيام بالعربية. هذا الاختيار منسجم مع هوية التطبيق حتى للمستخدمين الذين يفضلون الواجهة بالإنجليزية — التاريخ يبقى بالعربية دومًا.

---

## 3. الحماية من XSS — utils/sanitize.ts

**الملف:** `src/app/utils/sanitize.ts` ← 143 سطرًا

### لماذا التعقيد؟

الملاحظات النصية في **ملاحظاتي** تُحفَظ كـ HTML خام (من محرر Tiptap). حين نعرضها بـ `dangerouslySetInnerHTML` بأي محتوى غير منقّى، فتحنا بابًا لهجوم **XSS (Cross-Site Scripting)** — مهاجم يمكنه حقن `<script>alert('hack')</script>` في محتوى ملاحظة يشاركها.

### قائمتا السماح

```typescript
const ALLOWED_TAGS = new Set([
  // وسوم كتلية
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code', 'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  // وسوم مضمّنة
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark', 'span', 'a',
  // الصور — مسموح بها فقط لـ data-URI أو مسار نفس الأصل
  'img',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['class', 'style', 'dir']),       // خصائص عالمية
  a:   new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
  th:  new Set(['colspan', 'rowspan']),
  td:  new Set(['colspan', 'rowspan']),
  span: new Set(['style']),
  code: new Set(['class']),  // لأسماء classes إبراز الكود
};
```

**الفلسفة: Allowlist لا Denylist** — بدلًا من حظر وسوم خطرة معروفة (يسهل تجاوزها)، نحدد وسومًا مسموحًا بها فقط — كل ما عداها يُحذف.

---

### دالة فحص URL

```typescript
const SAFE_PROTOCOLS = /^(https?|mailto|data):/i;
const FORBIDDEN_PROTOCOL = /^javascript:/i;

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (FORBIDDEN_PROTOCOL.test(trimmed)) return false;        // javascript: محظور دائمًا
  return SAFE_PROTOCOLS.test(trimmed)                        // https: / http: / mailto: / data:
    || trimmed.startsWith('/') || trimmed.startsWith('#');   // مسارات نسبية
}
```

**لماذا فحص URL منفصل؟** — `href="javascript:void(0)"` ووسم `<a>` مسموح به، لكن القيمة خطرة. القاعدة: **السماح بالوسم + التحقق من القيمة**.

---

### آلية التعقيم (الدالة الرئيسية)

```typescript
function sanitizeNode(node: Element): void {
  const tag = node.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) {
    // ① استبدال الوسم غير المسموح بنصه الخالص فقط
    node.replaceWith(document.createTextNode(node.textContent ?? ''));
    return;
  }

  // ② حذف الخصائص غير المسموحة
  const attrsToRemove: string[] = [];
  for (const attr of Array.from(node.attributes)) {
    const name = attr.name.toLowerCase();
    const globalAllowed = ALLOWED_ATTRS['*'] ?? new Set();
    const tagAllowed = ALLOWED_ATTRS[tag] ?? new Set();

    if (!globalAllowed.has(name) && !tagAllowed.has(name)) {
      attrsToRemove.push(attr.name);
      continue;
    }
    // ③ فحص أمان URL في href و src
    if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) {
      attrsToRemove.push(attr.name);
    }
    // ④ حذف معالجات الأحداث (onclick، onmouseover، …)
    if (name.startsWith('on')) {
      attrsToRemove.push(attr.name);
    }
  }
  for (const name of attrsToRemove) node.removeAttribute(name);

  // ⑤ إضافة rel="noopener noreferrer" للروابط الخارجية
  if (tag === 'a') {
    const href = node.getAttribute('href') ?? '';
    if (href.startsWith('http')) {
      node.setAttribute('rel', 'noopener noreferrer');
      node.setAttribute('target', '_blank');
    }
  }

  // ⑥ تكرار على الأبناء (نسخة snapshot لتجنب مشاكل التعديل أثناء التكرار)
  for (const child of Array.from(node.children)) {
    sanitizeNode(child as Element);
  }
}
```

**الخطوات الست بالترتيب:**

| الخطوة | الهدف |
|--------|------|
| ① `replaceWith(createTextNode)` | الوسوم غير المسموحة تُحوَّل لنص عادي — لا تُحذف كليًا (لا يُضيّع المحتوى) |
| ② `attrsToRemove` | كل خاصية خارج القائمة الحمراء تُحذف |
| ③ `isSafeUrl` | فحص إضافي لـ `href` و `src` |
| ④ `name.startsWith('on')` | يحذف `onclick`، `onerror`، وأي معالج حدث |
| ⑤ `rel="noopener noreferrer"` | يمنع Window Hijacking في الروابط الخارجية |
| ⑥ `Array.from(node.children)` | المرور على snapshot وليس المصفوفة الحية — لأن `replaceWith` تغيّر DOM أثناء التكرار |

---

### دالة sanitizeHtml (نقطة الدخول)

```typescript
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, 'text/html');

  for (const child of Array.from(doc.body.children)) {
    sanitizeNode(child as Element);
  }

  return doc.body.innerHTML;
}
```

**الاستخدام في كود الإنتاج:**
```tsx
// في notes/[id]/page.tsx
<Box dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content ?? '') }} />
```

**ملاحظة هامة:** `sanitize.ts` موسوم `'use client'` — يعتمد على `DOMParser` و `document` وهي APIs للمتصفح فقط. لا تستدعها في Server Components أو API Routes.

---

## 4. قلب النظام — hooks/useNotes.ts

**الملف:** `src/app/hooks/useNotes.ts` ← 617 سطرًا

هذا أضخم خطاف في المشروع ويحوي أعقد منطق. نفهمه طبقة طبقة.

### واجهة الخطاف (Contract)

```typescript
interface UseNotesReturn {
  // الحالة
  notes: Note[];           // الملاحظات المعروضة حاليًا
  loading: boolean;        // جارٍ التحميل؟
  error: string | null;    // رسالة خطأ أو null
  page: number;            // الصفحة الحالية
  totalPages: number;      // إجمالي الصفحات
  count: number;           // إجمالي الملاحظات
  typeFilter: NoteType | ''; // فلتر النوع ('' = الكل)
  searchQuery: string;     // نص البحث
  isOnline: boolean;       // هل الجهاز متصل؟

  // الإجراءات
  setPage: (p: number) => void;
  setTypeFilter: (t: NoteType | '') => void;
  setSearchQuery: (q: string) => void;
  fetchNotes: () => Promise<void>;
  createNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, input: UpdateNoteInput) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Promise<Note>;
  processQueue: () => Promise<void>;  // لمعالجة الطابور المؤجل
}
```

**لاحظ أن `isOnline` مُكشوفة** — الصفحات والمكونات تستطيع قراءتها مباشرة دون استيراد خطاف آخر.

---

### تهيئة الحالة والمراجع

```typescript
export function useNotes(options: UseNotesOptions = {}): UseNotesReturn {
  const { pageSize = DEFAULT_PAGE_SIZE, autoFetch = true } = options;

  // ── الحالة الرئيسية ──────────────────────
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<NoteType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const isOnline = useOfflineStatus(); // خطاف الاتصال (الدرس 11)

  // ── المراجع (Refs) ──────────────────────
  const notesRef = useRef<Note[]>([]);
  notesRef.current = notes;    // نسخة حالية دون re-render لآليات الـ rollback

  const didMount = useRef(false);      // هل تم أول mount؟

  const prevOnline = useRef(true);     // حالة الاتصال في الدورة السابقة
  // يُستخدم لاكتشاف انتقال offline→online فقط (لا نريد processQueue عند كل render)

  const processingRef = useRef(false); // mutex لمنع تشغيل processQueue متزامنًا
```

**لماذا `notesRef` بدلًا من قراءة `notes` مباشرة؟** — في دوال `useCallback` المعرَّفة بدون `notes` في تبعياتها (لمنع إعادة الإنشاء عند كل تغيير)، `notes` ستكون قيمة قديمة (stale closure). `notesRef.current` دائمًا يحمل أحدث قيمة بدون إضافة `notes` للتبعيات.

---

### استراتيجية fetchNotes (Offline-First)

```typescript
const fetchNotes = useCallback(async () => {
  setLoading(true);
  setError(null);

  // فقط على الأجهزة الموثوقة يُفعَّل التخزين المحلي
  const offlineEnabled = localStorage.getItem('device-trusted') === 'true';

  // الخطوة 1: تحميل من الكاش فورًا (عرض فوري)
  let cachedData: typeof notes = [];
  if (offlineEnabled) {
    try {
      const allCached = await getCachedNotes();
      // استثناء الملاحظات المؤقتة (tmp_*) — لا معرّف خادم لها بعد
      cachedData = allCached.filter((n) => !n._id.startsWith('tmp_'));
      if (cachedData.length > 0) {
        // تطبيق الفلتر والبحث محليًا (يعمل offline أيضًا)
        const filtered = applyLocalFilter(cachedData, typeFilter, searchQuery);
        const pageSlice = filtered.slice((page - 1) * pageSize, page * pageSize);
        setNotes(pageSlice);
        setCount(filtered.length);
        setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      }
    } catch { /* الكاش ليس حرجًا */ }
  }

  // الخطوة 2: تحديث من الخادم في الخلفية (إذا كنا متصلين)
  if (isOnline) {
    try {
      const res = await getNotesApi({ page, limit: pageSize, type: typeFilter || undefined, q: searchQuery || undefined });
      setNotes(res.data.notes);
      setCount(res.data.count);
      setTotalPages(res.data.totalPages);
      // تحديث الكاش في الخلفية (fire and forget)
      if (offlineEnabled) cacheNotes(res.data.notes).catch(() => {});
    } catch (err) {
      // إظهار الخطأ فقط إذا لم يكن هناك بيانات كاش
      if (cachedData.length === 0) {
        setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الملاحظات');
      }
    }
  } else if (cachedData.length === 0) {
    // غير متصل + لا كاش = رسالة خطأ صريحة
    setError('لا يوجد اتصال بالإنترنت ولا توجد ملاحظات محفوظة للعرض');
  }

  setLoading(false);
}, [page, pageSize, typeFilter, searchQuery, isOnline]);
```

**الثلاثة سيناريوهات:**

| الحالة | السلوك |
|--------|--------|
| متصل + كاش | عرض الكاش فورًا ← تحديث من الخادم في الخلفية |
| متصل + لا كاش | spinner ← جلب من الخادم |
| غير متصل + كاش | عرض الكاش — لا رسالة خطأ (OfflineBanner تكفي) |
| غير متصل + لا كاش | رسالة خطأ صريحة |

---

### دالة الفلترة المحلية

```typescript
function applyLocalFilter(notes: Note[], type: NoteType | '', query: string): Note[] {
  let result = notes;
  if (type) {
    result = result.filter((n) => n.type === type);
  }
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (typeof n.content === 'string' && n.content.toLowerCase().includes(q))
    );
  }
  return result;
}
```

**لماذا هذه الدالة خارج `useNotes`؟** — دالة نقية لا تعتمد على حالة الخطاف — أسهل للاختبار وأوضح في القراءة. وهي ليست exported لأنها تفصيل تنفيذي داخلي.

---

### createNote — مع Optimistic UI وطابور Offline

```typescript
const createNote = useCallback(
  async (input: NoteInput): Promise<Note> => {
    // إنشاء معرّف مؤقت — يعيش فقط أثناء انتظار رد الخادم
    const tempId = `tmp_${crypto.randomUUID()}`;
    const tempNote: Note = {
      _id: tempId,
      title: input.title,
      content: input.content,
      audioData: input.audioData,
      audioDuration: input.audioDuration,
      type: input.type,
      user: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!isOnline) {
      // ── وضع Offline ──────────────────────────────────────────
      if (localStorage.getItem('device-trusted') !== 'true') {
        throw new Error('لا يمكن إنشاء ملاحظات بدون اتصال على جهاز غير موثوق…');
      }
      // تسجيل العملية في الطابور المحلي
      await enqueuePendingOp({ type: 'create', tempId, payload: input, … });
      // حفظ الملاحظة المؤقتة في Dexie (تبقى بعد reload الصفحة)
      cacheNotes([tempNote]).catch(() => {});
      // تسجيل Background Sync tag للـ Service Worker
      if ('serviceWorker' in navigator && 'sync' in …) {
        navigator.serviceWorker.ready
          .then((reg) => reg.sync?.register('notes-sync'))
          .catch(() => {});
      }
      return tempNote; // لا يُضاف للـ UI — ConnectionIndicator يُظهر العدد
    }

    // ── وضع Online: Optimistic Update ───────────────────────
    setNotes((prev) => [tempNote, ...prev]);
    setCount((c) => c + 1);

    try {
      const res = await createNoteApi(input);
      // استبدال الملاحظة المؤقتة بالحقيقية
      setNotes((prev) => prev.map((n) => (n._id === tempId ? res.data : n)));
      cacheNotes([res.data]).catch(() => {});
      return res.data;
    } catch (err) {
      // تراجع عن الـ Optimistic Update عند الفشل
      setNotes((prev) => prev.filter((n) => n._id !== tempId));
      setCount((c) => Math.max(0, c - 1));
      throw err;
    }
  },
  [isOnline]
);
```

**نمط `tmp_` المؤقت:** المعرّف المؤقت يبدأ بـ `tmp_` — هذا المعيار يُستخدم في `fetchNotes` لاستثناء الملاحظات المؤجلة من القائمة (تجنّب التنقل لصفحة تفاصيل بمعرّف غير موجود على الخادم).

---

### deleteNote — مع Rollback أنيق

```typescript
const deleteNote = useCallback(
  async (id: string): Promise<void> => {
    // احفظ snapshot قبل الحذف للـ rollback
    const noteToDelete = notesRef.current.find((n) => n._id === id);

    // Optimistic: احذف فورًا من الـ UI
    setNotes((prev) => prev.filter((n) => n._id !== id));
    setCount((c) => Math.max(0, c - 1));

    if (!isOnline) {
      // ... (نفس نمط createNote: طابور + Background Sync)
      // removeCachedNote: يحذف من Dexie حتى لا يعود عند أول fetchNotes
      removeCachedNote(id).catch(() => {});
      await enqueuePendingOp({ type: 'delete', noteId: id, … });
      return;
    }

    try {
      await deleteNoteApi(id);
      removeCachedNote(id).catch(() => {});
    } catch (err) {
      // Rollback: أعد الملاحظة للقائمة
      if (noteToDelete) {
        setNotes((prev) => [noteToDelete, ...prev]);
        setCount((c) => c + 1);
      }
      throw err;
    }
  },
  [isOnline]
);
```

---

### processQueue — معالج الطابور المؤجل

هذا أعقد جزء في `useNotes`. يُشغَّل في حالتين:
1. عند العودة للاتصال (`isOnline` ينتقل من `false` إلى `true`)
2. حين يُطلق Service Worker حدث `notes:process-offline-queue`

```typescript
const processQueue = useCallback(async () => {
  // الحارس 1: Mutex — منع التشغيل المتزامن
  if (processingRef.current) return;
  processingRef.current = true;

  try {
    // الحارس 2: فحص سريع من localStorage
    if (localStorage.getItem('device-trusted') !== 'true') return;

    const ops = await getPendingOps();
    if (ops.length === 0) return;

    // الحارس 3: التحقق من الثقة مع الخادم (قد تغيّرت أثناء الـ offline)
    const currentDeviceId = localStorage.getItem('device-id');
    if (!currentDeviceId) return;

    const { data: trustedDevices } = await getDevicesApi(currentDeviceId);
    const isStillTrusted = Array.isArray(trustedDevices)
      && trustedDevices.some((d) => d.deviceId === currentDeviceId);

    if (!isStillTrusted) {
      // الجهاز سُحبت ثقته أثناء الـ offline — أطلق حدث التنظيف
      window.dispatchEvent(new CustomEvent('device:trust-revoked'));
      return;
    }

    // معالجة العمليات بالترتيب
    for (const op of ops) {
      try {
        if (op.type === 'create' && op.payload) {
          const res = await createNoteApi(op.payload as NoteInput);
          if (op.tempId) removeCachedNote(op.tempId).catch(() => {});
          cacheNotes([res.data]).catch(() => {});
        } else if (op.type === 'update' && op.noteId && !op.noteId.startsWith('tmp_')) {
          const res = await updateNoteApi(op.noteId, op.payload as UpdateNoteInput);
          setNotes((prev) => prev.map((n) => (n._id === op.noteId ? res.data : n)));
          cacheNotes([res.data]).catch(() => {});
        } else if (op.type === 'delete' && op.noteId && !op.noteId.startsWith('tmp_')) {
          await deleteNoteApi(op.noteId);
          removeCachedNote(op.noteId).catch(() => {});
        }
        if (op.id !== undefined) await removePendingOp(op.id);
      } catch {
        // الإبقاء على العملية في الطابور وتسجيل الفشل
        if (op.id !== undefined) await incrementPendingOpFailure(op.id);
      }
    }
    // تنظيف أي tmp_* متبقية في Dexie
    await cleanStaleNotes().catch(() => {});
    await fetchNotes();
  } finally {
    processingRef.current = false; // إطلاق المانع دائمًا
  }
}, [fetchNotes]);
```

**الحراس الثلاثة يعملون معًا:**

```
Mutex (processingRef)   ← يمنع التشغيل المزدوج (التوازي)
localStorage check      ← فحص سريع بدون شبكة
Server check (getDevicesApi) ← تحقق حقيقي من الحالة الحالية
```

---

### useEffects الحيوية

```typescript
// 1. إعادة الجلب عند تغيير الصفحة أو الفلتر أو البحث
useEffect(() => {
  if (autoFetch) fetchNotes();
}, [page, typeFilter, searchQuery]);

// 2. معالجة الطابور عند استعادة الاتصال (offline → online فقط)
useEffect(() => {
  if (isOnline && !prevOnline.current) processQueue();
  prevOnline.current = isOnline;
}, [isOnline, processQueue]);

// 3. استجابة لحدث Service Worker
useEffect(() => {
  const handler = () => processQueue();
  window.addEventListener('notes:process-offline-queue', handler);
  return () => window.removeEventListener('notes:process-offline-queue', handler);
}, [processQueue]);

// 4. التراجع عن عملية مؤجلة (Undo من ConnectionIndicator)
useEffect(() => {
  const handleUndoOp = (e: Event) => {
    const op = (e as CustomEvent<{ op: PendingOperation }>).detail?.op;
    if (!op) return;
    if (op.type === 'create' && op.tempId) {
      setNotes((prev) => prev.filter((n) => n._id !== op.tempId));
    } else if (op.type === 'update' && op.noteId && op.noteSnapshot) {
      setNotes((prev) => prev.map((n) => (n._id === op.noteId ? op.noteSnapshot! : n)));
    } else if (op.type === 'delete' && op.noteId && op.noteSnapshot) {
      setNotes((prev) => [op.noteSnapshot!, ...prev]);
      setCount((c) => c + 1);
    }
  };
  window.addEventListener('notes:undo-op', handleUndoOp);
  return () => window.removeEventListener('notes:undo-op', handleUndoOp);
}, []);
```

**لماذا `[page, typeFilter, searchQuery]` بدون `fetchNotes`؟** — إضافة `fetchNotes` ستُسبب حلقة لانهائية أو re-renders مفرطة لأن `fetchNotes` نفسها تعتمد على هذه القيم. التعليق `// eslint-disable-next-line` يُشير لهذا القرار المقصود.

---

## 5. نموذج الإدخال — NoteEditorForm.tsx

**الملف:** `src/app/components/notes/NoteEditorForm.tsx` ← 246 سطرًا

### نمط المكوّن المشترك

`NoteEditorForm` يخدم **نمطين** مختلفين بـ prop واحد (`mode`):

```
mode='create'   ←  notes/new/page.tsx     ← بدون initialData
mode='edit'     ←  notes/[id]/edit/page.tsx  ← مع initialData
```

**المسؤوليات المفصولة بوضوح:**

| جهة | مسؤوليتها |
|-----|-----------|
| `NoteEditorForm` | حالة النموذج، التحقق، العرض |
| الصفحة الأم | استدعاء API، التنقل بعد النجاح |

```typescript
interface NoteEditorFormProps {
  mode: 'create' | 'edit';
  initialData?: NoteEditorInitialData; // لحالة التعديل فقط
  onSubmit: (data: NoteInput | UpdateNoteInput) => Promise<void>; // الصفحة الأم تُنفّذ API
  onCancel: () => void;                // الصفحة الأم تتنقل
}
```

---

### حل مشكلة الحقول المتعددة

```typescript
// نمط: حقن كل الحقول في كائن واحد
type Fields = {
  title: string;
  noteType: NoteType;
  content: string;
  audioData: string | undefined;
  audioDuration: number | undefined;
};

// تحويل initialData إلى Fields
function makeFields(d?: NoteEditorInitialData): Fields {
  return {
    title: d?.title ?? '',
    noteType: d?.type ?? 'text',
    content: d?.content ?? '',
    audioData: d?.audioData,
    audioDuration: d?.audioDuration,
  };
}

// استخدام useState بدالة التهيئة الكسولة
const [fields, setFields] = useState<Fields>(() => makeFields(initialData));
```

**لماذا كائن `Fields` بدلًا من 5 `useState` منفصلة؟** — React Compiler يتطلب ألا تكون هناك "cascading setState" — أي `setState` يُسبب `setState` آخر. تجميع الحقول يسمح بتحديث كل شيء دفعة واحدة:

```typescript
const handleRecorded = useCallback((base64: string, dur: number) => {
  setFields((f) => ({ ...f, audioData: base64, audioDuration: dur })); // تحديث واحد
}, []);
```

---

### التحقق من صحة المدخلات

```typescript
const validate = (): string | null => {
  if (!title.trim()) return t('errors.titleRequired');
  if (title.trim().length > 200) return t('errors.titleTooLong');
  if (noteType === 'text' && !content.trim()) return t('errors.contentRequired');
  if (noteType === 'voice' && !audioData) return t('errors.voiceRequired');
  return null;
};
```

**تحقق على مستوى نوع الملاحظة** — ملاحظة صوتية لا تحتاج `content`، ونصية لا تحتاج `audioData`. هذا يمنع إرسال بيانات خاطئة قبل وصولها للخادم.

---

### منطق الإرسال

```typescript
const handleSubmit = async () => {
  const validationError = validate();
  if (validationError) { setError(validationError); return; }

  setLoading(true);
  setError(null);
  try {
    if (mode === 'create') {
      const input: NoteInput = {
        title: title.trim(),
        type: noteType,
        ...(noteType === 'text' ? { content } : { audioData, audioDuration }),
      };
      await onSubmit(input);
    } else {
      // التعديل: أرسل فقط ما تغيّر
      const input: UpdateNoteInput = { title: title.trim() };
      if (noteType === 'text') input.content = content;
      if (noteType === 'voice' && audioData) {
        input.audioData = audioData;
        input.audioDuration = audioDuration;
      }
      await onSubmit(input);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : t('errors.saveFailed'));
    setLoading(false);
    // `setLoading(false)` فقط عند الخطأ — عند النجاح الصفحة الأم تتنقل فتُفصل المكوّن
  }
};
```

**سرّ `setLoading(false)` عند الخطأ فقط:** حين ينجح الـ submit، الصفحة الأم تُنفّذ `router.push('/notes')` — وهذا يُفصل المكوّن فلا داعي لإعادة `loading` إلى `false`. إبقاء الزر في حالة التحميل يمنع المستخدم من الضغط مرتين.

---

### عرض المكوّن

```tsx
return (
  <Paper sx={{ p: { xs: 2, sm: 3 } }}>
    <Stack spacing={3}>
      {/* رسالة الخطأ */}
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* تنبيه وضع Offline */}
      {!isOnline && <Alert severity="info" variant="outlined">{t('offlineHint')}</Alert>}

      {/* اختيار النوع — فقط عند الإنشاء */}
      {!isEdit && (
        <ToggleButtonGroup value={noteType} exclusive onChange={(_, v) => …} fullWidth>
          <ToggleButton value="text"><StickyNote2Icon />{t('text')}</ToggleButton>
          <ToggleButton value="voice"><MicIcon />{t('voice')}</ToggleButton>
        </ToggleButtonGroup>
      )}

      {/* حقل العنوان */}
      <TextField label={t('titleLabel')} value={title} … />

      {/* المحتوى — محرر نصي أو مسجل صوتي */}
      {noteType === 'text'
        ? <RichTextEditor content={content} onChange={…} />
        : <VoiceRecorder onRecorded={handleRecorded} initialAudio={…} />
      }

      {/* أزرار الإجراءات */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button startIcon={<CancelIcon />} onClick={onCancel}>{t('cancel')}</Button>
        <Button variant="contained" startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />} …>
          {isEdit ? t('saveEdit') : t('create')}
        </Button>
      </Stack>
    </Stack>
  </Paper>
);
```

**نمط `key={note._id}` في صفحة التعديل:**

```tsx
{/* في EditNotePage — عندما يتغير note._id تُعاد تهيئة المكوّن بالكامل */}
<NoteEditorForm
  key={note._id}
  mode="edit"
  initialData={{ title: note.title, type: note.type, … }}
  …
/>
```

هذا بديل نظيف عن `useEffect` يُراقب تغيّر الـ `id` ويستدعي `setState` يدويًا.

---

## 6. حوار الحذف — DeleteConfirmDialog.tsx

**الملف:** `src/app/components/notes/DeleteConfirmDialog.tsx` ← 67 سطرًا

### مبدأ: الإجراءات الحساسة تحتاج تأكيدًا

```typescript
interface DeleteConfirmDialogProps {
  open: boolean;        // هل الحوار مفتوح؟
  title: string;        // عنوان الملاحظة المراد حذفها
  onClose: () => void;  // إغلاق الحوار (لا حذف)
  onConfirm: () => Promise<void>; // الحذف الفعلي
}
```

```typescript
const handleConfirm = async () => {
  setLoading(true);
  try {
    await onConfirm();
    onClose(); // إغلاق تلقائي عند النجاح
  } catch {
    // الخطأ يُعالَج من الصفحة الأم التي تملك useNotes
  } finally {
    setLoading(false); // دائمًا أرجع الزر لحالته
  }
};
```

**لماذا `try/catch` بجسم فارغ؟** — `onConfirm` هي `deleteNote` من `useNotes` التي تُلقي الخطأ وتُدير الـ rollback داخليًا. `DeleteConfirmDialog` لا يحتاج إعادة عرض الخطأ — مهمته فقط: تأكيد → إغلاق أو بقاء مفتوحًا.

---

## 7. بطاقة الملاحظة — NoteCard.tsx

**الملف:** `src/app/components/notes/NoteCard.tsx` ← 126 سطرًا

### البنية المرئية

```
┌─────────────────────────────────────────────┐
│ [CardActionArea — ينقل لصفحة التفاصيل]     │
│                                              │
│   العنوان ← → [نوع: نصية/صوتية] (Chip)    │
│                                              │
│   معاينة المحتوى (3 أسطر مقطوعة)            │
│                                              │
│   التاريخ                                   │
│                                              │
├──────────────────────── [✏️Edit] [🗑️Delete]─┤
└─────────────────────────────────────────────┘
```

```tsx
export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const router = useRouter();
  const isVoice = note.type === 'voice';

  // للملاحظات الصوتية: عرض المدة بدلًا من النص
  const preview = isVoice
    ? t('voicePreview', { duration: formatDuration(note.audioDuration ?? 0) })
    : stripHtml(note.content ?? '');
```

**لماذا `stripHtml` وليس عرض HTML مباشرة؟** — المعاينة في البطاقة نص خالص محدود 3 أسطر — عرض HTML في `Typography` MUI يُعطي نصًا خامًا مع الوسوم. `stripHtml` تُعطي نصًا نظيفًا قابلًا للقطع.

---

### تأثير Hover والانسجام مع السمة

```tsx
<Card
  variant="outlined"
  sx={{
    transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
    '&:hover': {
      boxShadow: (t) =>
        t.palette.mode === 'dark'
          ? '0 4px 20px rgba(0,0,0,0.6)'   // ظل أغمق للوضع الداكن
          : '0 4px 20px rgba(0,0,0,0.15)', // ظل خفيف للوضع الفاتح
      borderColor: 'primary.main',
      transform: 'translateY(-2px)',        // رفع طفيف عند المرور
    },
  }}
>
```

**`t.palette.mode`** داخل `sx` callback يتيح الوصول لمتغيرات السمة المحسوبة — نفس المنطق الذي رأيناه في الدرس 06.

---

### منع انتشار الحدث (e.stopPropagation)

```tsx
<IconButton
  onClick={(e) => {
    e.stopPropagation(); // ← حاسم
    onEdit(note);
  }}
>
```

بدون `stopPropagation()`، الضغط على زر التعديل سيُطلق أيضًا `CardActionArea.onClick` — وهذا سيُنقل للتفاصيل بدلًا من التعديل. `stopPropagation` يوقف الحدث عند `IconButton` فلا يصل للـ `CardActionArea`.

---

## 8. قائمة الملاحظات — NoteList.tsx

**الملف:** `src/app/components/notes/NoteList.tsx` ← 184 سطرًا

### الفصل الذكي للحالة

`NoteList` يحمل **حالة محلية** لمربع البحث (`searchInput`) مستقلة عن **الحالة العامة** (`searchQuery` في `useNotes`):

```typescript
const [searchInput, setSearchInput] = useState(searchQuery); // تزامن أولي

// البحث يُنفَّذ عند Enter أو blur — ليس عند كل حرف
const commitSearch = () => {
  if (searchInput.trim() !== searchQuery) {
    onSearchChange(searchInput.trim()); // ← هذا يُطلق fetchNotes
  }
};
```

**لماذا التمييز؟** — لو استدعينا `onSearchChange` عند كل حرف مكتوب، سيُطلق طلب API عند كل ضغطة مفتاح. الحالة المحلية تجمع المدخل وتُرسله فقط عند Enter أو فقدان التركيز.

---

### شبكة البطاقات (MUI Grid v2)

```tsx
<Grid container spacing={2}>
  {notes.map((note) => (
    <Grid key={note._id} size={{ xs: 12, sm: 6, md: 4 }}>
      <NoteCard note={note} onEdit={onEdit} onDelete={onDelete} />
    </Grid>
  ))}
</Grid>
```

**MUI Grid الإصدار 2:** استخدام `size` بدلًا من `item` + `xs`/`sm`/`md` — الصيغة الحديثة أكثر وضوحًا. خانة `xs:12` (عرض كامل في الموبايل)، `sm:6` (نصف في التابلت)، `md:4` (ثلث في الديسكتوب).

---

### الحالات الفارغة

```tsx
{!loading && notes.length === 0 && (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <InboxIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
    <Typography variant="h6" color="text.secondary">
      {t('emptyTitle')}
    </Typography>
    <Typography variant="body2" color="text.disabled">
      {/* رسالة مختلفة: فلتر نشط أم لا توجد ملاحظات بعد */}
      {searchQuery || typeFilter ? t('emptyFilterHint') : t('emptyCreateHint')}
    </Typography>
  </Box>
)}
```

**تفريق الحالتين الفارغتين:** "لا توجد ملاحظات" (الحالة الافتراضية) يختلف عن "لا نتائج لبحثك" (فلتر نشط) — رسالتان مختلفتان تُرشدان المستخدم بشكل أدق.

---

## 9. الصفحات الأربع — من القائمة إلى التعديل

### 9.1 صفحة قائمة الملاحظات — notes/page.tsx

**الهدف:** التنسيق بين `useNotes` و `NoteList` و `DeleteConfirmDialog` مع FAB للإنشاء.

```typescript
export default function NotesPage() {
  const router = useRouter();
  const {
    notes, loading, error,
    page, totalPages, count,
    typeFilter, searchQuery,
    setPage, setTypeFilter, setSearchQuery,
    deleteNote,
  } = useNotes(); // autoFetch=true (افتراضي) — يجلب عند mount

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
```

**تدفق الحذف من القائمة:**
1. المستخدم يضغط 🗑️ في `NoteCard` → `handleDeleteClick(note)` يُخزن الهدف ويفتح الحوار
2. المستخدم يؤكد → `handleDelete` يستدعي `deleteNote(deleteTarget._id)`
3. `useNotes.deleteNote` يُطبّق Optimistic UI (يحذف فورًا من القائمة)

```tsx
{/* FAB ثابت في الزاوية */}
<Fab
  variant="extended"
  color="primary"
  onClick={() => router.push('/notes/new')}
  sx={{
    position: 'fixed',
    bottom: { xs: 20, md: 32 },
    right: { xs: 16, md: 32 },
    // الموبايل: دائرة فقط بلا نص
    width: { xs: 56, sm: 'auto' },
    borderRadius: { xs: '50%', sm: '24px' },
  }}
>
  <AddIcon />
  <Typography sx={{ display: { xs: 'none', sm: 'inline' } }}>
    {t('newNote')}
  </Typography>
</Fab>
```

**الـ FAB التكيفي:** في الموبايل (xs) يُظهر أيقونة فقط بشكل دائري — في الشاشات الأكبر (sm+) يُظهر النص أيضًا. `pb: 10` في الـ `Box` يمنع تغطية آخر بطاقة بالـ FAB.

---

### 9.2 صفحة إنشاء ملاحظة — notes/new/page.tsx

```typescript
export default function NewNotePage() {
  const router = useRouter();
  // autoFetch: false — نحتاج فقط createNote، لا حاجة لجلب القائمة
  const { createNote } = useNotes({ autoFetch: false });

  const handleSubmit = useCallback(
    async (data: NoteInput | UpdateNoteInput) => {
      await createNote(data as NoteInput);
      router.push('/notes'); // ← التنقل بعد النجاح (مسؤولية الصفحة الأم)
    },
    [createNote, router]
  );
```

**`autoFetch: false`** — حين تكون الصفحة مخصصة للإنشاء فقط، لا داعي لاستدعاء API لجلب قائمة الملاحظات. هذا يوفر طلب شبكة غير ضروري.

---

### 9.3 صفحة تفاصيل الملاحظة — notes/[id]/page.tsx

```typescript
export default function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = use(params); // React 19: فك تغليف Promise للـ params
  const { getNote, deleteNote } = useNotes({ autoFetch: false });

  const [note, setNote] = useState<Note | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null }>({
    loading: true, error: null,
  });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // حارس لمنع setState بعد unmount

    getNote(id)
      .then((data) => {
        if (cancelled) return;
        setNote(data);
        if (data.type === 'voice' && data.audioData) {
          setAudioUrl(createAudioUrl(data.audioData)); // Base64 → Blob URL
        }
        setStatus({ loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus({ loading: false, error: err.message });
        }
      });

    return () => { cancelled = true; }; // cleanup عند التنقل بعيدًا
  }, [id]); // eslint-disable-line

  // تنظيف Blob URL لتجنب تسرب الذاكرة
  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);
```

**`use(params)` في React 19:** Next.js 15+ يُمرّر `params` كـ `Promise` لدعم بنية Server/Client المختلطة. `use()` يُحوّله لقيمة مباشرة داخل المكوّن.

**Blob URL lifecycle:** `createAudioUrl(data.audioData)` يُحوّل Base64 إلى `blob:` URL مؤقت. لو لم نستدعِ `URL.revokeObjectURL` عند unmount، يظل المتصفح يحتفظ بالبيانات في الذاكرة حتى إغلاق التبويب.

---

### عرض محتوى HTML مع الأمان

```tsx
{note.type === 'text' ? (
  <Box
    dir="rtl"
    sx={(theme) => ({
      lineHeight: 1.8,
      '& h2': { fontSize: '1.5rem', fontWeight: 700, mt: 2, mb: 1 },
      '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
      '& ul, & ol': { pl: 3, pr: 0 },
      '& blockquote': {
        borderLeft: `4px solid ${theme.palette.divider}`,
        pl: 2, ml: 0,
        color: theme.palette.text.secondary,
      },
      '& mark': {
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255,213,79,0.30)'  // تمييز داكن شفاف
          : 'rgba(255,213,79,0.55)', // تمييز فاتح معتم نسبيًا
      },
    })}
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content ?? '') }}
  />
) : (
  // ملاحظة صوتية — مشغل HTML5 audio
  <audio controls src={audioUrl} style={{ width: '100%', maxWidth: 500 }} />
)}
```

**`dir="rtl"` ثابت على الصندوق:** محتوى الملاحظات عربي دائمًا (حتى لو الواجهة بالإنجليزية) — `dir="rtl"` يضمن عرض النص الصحيح بغض النظر عن إعداد اللغة.

---

### 9.4 صفحة التعديل — notes/[id]/edit/page.tsx

```typescript
export default function EditNotePage({ params }: EditNotePageProps) {
  const { id } = use(params);
  const { getNote, updateNote } = useNotes({ autoFetch: false });

  const [note, setNote] = useState<Note | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null }>({ … });

  // نفس نمط fetchNotes بحارس cancelled
  useEffect(() => {
    let cancelled = false;
    getNote(id).then((data) => {
      if (!cancelled) { setNote(data); setStatus({ loading: false, error: null }); }
    }).catch((err) => {
      if (!cancelled) setStatus({ loading: false, error: err.message });
    });
    return () => { cancelled = true; };
  }, [id]);

  const handleSubmit = useCallback(
    async (data: NoteInput | UpdateNoteInput) => {
      await updateNote(id, data as UpdateNoteInput);
      router.push(`/notes/${id}`); // ← عودة للتفاصيل بعد الحفظ
    },
    [id, updateNote, router]
  );
```

**نمط التجميع الكامل:**

```
useEffect (getNote) → note state → NoteEditorForm (key={note._id})
                                         ↓
                                   handleSubmit (updateNote)
                                         ↓
                                   router.push('/notes/{id}')
```

```tsx
{/* key={note._id} يُعيد mount المكوّن عند تغيير note._id */}
{note && !loading && (
  <NoteEditorForm
    key={note._id}
    mode="edit"
    initialData={{
      title: note.title,
      type: note.type,
      content: note.content,
      audioData: note.audioData,
      audioDuration: note.audioDuration,
    }}
    onSubmit={handleSubmit}
    onCancel={handleCancel}
  />
)}
```

---

## 10. Optimistic UI وإدارة التراجع

### ما هو Optimistic UI؟

**تشبيه إضافي:** في الدردشة الفورية، رسالتك تظهر فورًا بجانب ساعة رمادية — لو نجح الإرسال تُستبدل الساعة بعلامة صح، ولو فشل تُستبدل بـ ✗ مع زر إعادة الإرسال. هذا هو Optimistic UI.

في **ملاحظاتي**:

| العملية | الفوري (Optimistic) | عند النجاح | عند الفشل |
|---------|---------------------|-----------|----------|
| إنشاء | إضافة `tempNote` للقائمة | استبدال بالملاحظة الحقيقية | حذف `tempNote` |
| تعديل | تحديث الملاحظة فورًا | استبدال بالبيانات الأحدث | استعادة القديمة |
| حذف | إزالة الملاحظة فورًا | تأكيد الحذف + تنظيف cache | إعادة الملاحظة |

### الـ Snapshot للـ Rollback

```typescript
// في updateNote:
const currentNote = notesRef.current.find((n) => n._id === id);
// تعديل Optimistic فوري
setNotes((prev) => prev.map((n) => (n._id === id ? optimisticNote : n)));
try {
  const res = await updateNoteApi(id, input);
  setNotes((prev) => prev.map((n) => (n._id === id ? res.data : n))); // البيانات الحقيقية
} catch {
  // استعادة الـ snapshot
  if (currentNote) setNotes((prev) => prev.map((n) => (n._id === id ? currentNote : n)));
}
```

**`notesRef.current` بدلًا من `notes`:** إقرأ التفسير في القسم 4 — المرجع يُعطي دائمًا الحالة الأحدث حتى داخل closure.

---

## 11. تدفق وضع عدم الاتصال كاملاً

### سيناريو: إنشاء ملاحظة في وضع Offline

```
1. المستخدم يضغط "إنشاء" في NoteEditorForm
        ↓
2. handleSubmit تستدعي createNote(input)
        ↓
3. useNotes.createNote تكتشف !isOnline
        ↓
4. فحص device-trusted من localStorage
   └─ غير موثوق → throw Error (ينتهي هنا)
   └─ موثوق  ↓
        ↓
5. enqueuePendingOp → حفظ في Dexie
   cacheNotes([tempNote]) → حفظ الملاحظة محليًا
        ↓
6. navigator.serviceWorker.ready → sync.register('notes-sync')
        ↓
7. العودة بـ tempNote (لا يُضاف للـ UI)
        ↓
8. router.push('/notes') → القائمة بدون الملاحظة المؤجلة
   (ConnectionIndicator يُظهر: "1 عملية معلقة")
        ↓
9. عند عودة الاتصال:
   isOnline يصبح true → useEffect يُطلق processQueue()
        ↓
10. processQueue:
    - فحص localStorage (سريع)
    - فحص الخادم (getDevicesApi) — هل الجهاز لا يزال موثوقًا؟
    - createNoteApi(op.payload) → ملاحظة حقيقية
    - removeCachedNote(op.tempId)
    - cacheNotes([realNote])
    - removePendingOp(op.id)
    - fetchNotes() → تحديث القائمة
```

### لماذا لا يُعرض `tmp_` في القائمة؟

```typescript
// في fetchNotes:
cachedData = allCached.filter((n) => !n._id.startsWith('tmp_'));
```

لو أضفنا `tempNote` للقائمة:
- المستخدم يضغط عليها → التنقل لـ `/notes/tmp_XXXX`
- صفحة التفاصيل تحاول `getNote('tmp_XXXX')` → 404 خطأ من الخادم
- تجربة مستخدم سيئة

بدلاً من ذلك: ConnectionIndicator يُظهر عدد العمليات المعلقة مع خيار التراجع عن كل عملية.

---

## 12. ملخص

| ما تعلمناه | الملف المسؤول | النمط المستخدم |
|------------|--------------|---------------|
| استخراج نص خالص من HTML مع SSR fallback | `utils/notes.ts` | Pure Functions + DOM API |
| تعقيم HTML بـ Allowlist لمنع XSS | `utils/sanitize.ts` | DOMParser + Recursive Walk |
| استراتيجية Offline-First لجلب البيانات | `hooks/useNotes.ts` | Cache-first + Background Update |
| Optimistic UI مع Rollback عند الفشل | `hooks/useNotes.ts` | Snapshot + setState |
| معالجة الطابور المؤجل مع mutex | `hooks/useNotes.ts` | processingRef + Guards |
| نموذج مشترك للإنشاء والتعديل | `NoteEditorForm.tsx` | mode prop + onSubmit |
| حقول مجمّعة لتجنب cascading setState | `NoteEditorForm.tsx` | Fields object |
| فصل حالة البحث المحلية عن العامة | `NoteList.tsx` | commitSearch on blur/Enter |
| بطاقة متجاوبة مع Hover + RTL | `NoteCard.tsx` | MUI sx callbacks |
| stopPropagation لعزل الأحداث | `NoteCard.tsx` | Event Bubbling Control |
| use(params) مع cleanup عند unmount | صفحات notes/[id]/ | React 19 + cancelled flag |
| Blob URL lifecycle + revokeObjectURL | `notes/[id]/page.tsx` | URL API |
| autoFetch: false لصفحات الإنشاء | `notes/new/page.tsx` | useNotes options |

---

### نقطة المراقبة

قبل الانتقال للدرس التالي، تأكد من قدرتك على الإجابة:

1. ما الفرق بين `searchInput` (حالة `NoteList`) و `searchQuery` (حالة `useNotes`)؟ ولماذا الفصل؟
2. لماذا لا تُعرض ملاحظات `tmp_` في القائمة وإن كانت محفوظة في Dexie؟
3. ما الحراس الثلاثة التي تحمي `processQueue` من التشغيل الخاطئ؟
4. لماذا `setLoading(false)` يُستدعى عند الخطأ فقط في `handleSubmit`؟
5. ما وظيفة `cancelled = true` في `useEffect` وما المشكلة التي تحلها؟

---

الدرس السابق → [الدرس 07: الترجمة وثنائية الاتجاه](07-internationalization.md) | الدرس التالي → [الدرس 09: محرر النصوص الغني والتسجيل الصوتي — Tiptap وMediaRecorder](09-tiptap-and-media-recorder.md)
