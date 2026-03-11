# الدرس 09: محرر النصوص الغني والتسجيل الصوتي — Tiptap وMediaRecorder

> هدف الدرس: فهم كيف نبني محرر نصوص غني وكامل مع دعم RTL/LTR ثنائي داخل نفس الملاحظة، وكيف ننفّذ مسجل صوتي مبني على `MediaRecorder` مع آلة حالة واضحة تتعامل مع الإيقاف المؤقت والاستئناف وإدارة URLs بشكل خالٍ من تسرب الذاكرة.

---

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 08: واجهة إدارة الملاحظات](08-notes-crud.md)

---

## فهرس هذا الدرس

1. [نظرة معمارية — ملاحظة نصية أم صوتية؟](#1-نظرة-معمارية--ملاحظة-نصية-أم-صوتية)
2. [أدوات الصوت — utils/audio.ts](#2-أدوات-الصوت--utilsaudiotss)
3. [المحرر النصي — RichTextEditor.tsx](#3-المحرر-النصي--richtexteditortssx)
4. [المسجّل الصوتي — VoiceRecorder.tsx](#4-المسجّل-الصوتي--voicerecordertsx)
5. [آلة الحالة والمؤقت الدقيق](#5-آلة-الحالة-والمؤقت-الدقيق)
6. [إدارة URLs ومنع تسرب الذاكرة](#6-إدارة-urls-ومنع-تسرب-الذاكرة)
7. [RTL داخل المحرر — تفاصيل دقيقة](#7-rtl-داخل-المحرر--تفاصيل-دقيقة)
8. [ملخص](#8-ملخص)

---

## 1. نظرة معمارية — ملاحظة نصية أم صوتية؟

### تشبيه: دفتر ملاحظات ذكي

تخيّل دفتر ملاحظات ذكيًا فيه نوعان من الصفحات:

- **صفحة مكتوبة (نوع: text):** فيها محرر مع أدوات تنسيق — تغيير الخط، العناوين، القوائم، التمييز
- **صفحة مسجّلة (نوع: voice):** فيها زر تسجيل يلتقط صوتك ويحفظه بدلًا من النص

الدفتر لا يخلط بينهما — عند إنشاء الملاحظة تختار النوع وهو لا يتغير لاحقًا. هذا بالضبط كيف يعمل `NoteEditorForm` — يُظهر `RichTextEditor` لنوع `text` أو `VoiceRecorder` لنوع `voice`.

---

### موقع الملفات في المعمارية

```text
NoteEditorForm.tsx
    ├── RichTextEditor.tsx  // للملاحظات النصية (type='text')
    └── VoiceRecorder.tsx  // للملاحظات الصوتية (type='voice')
            ↓ (كلاهما يستخدمان)
        utils/audio.ts  // أدوات التحويل والتنسيق
```

**`utils/audio.ts`** ملف مشترك أيضًا بين:
- `VoiceRecorder.tsx` — يستخدم `blobToBase64` و `formatDuration`
- `NoteCard.tsx` — يستخدم `formatDuration` لعرض مدة الملاحظة الصوتية
- `[locale]/notes/[id]/page.tsx` — يستخدم `createAudioUrl` و `formatDuration` لتشغيل الصوت في صفحة التفاصيل

---

## 2. أدوات الصوت — utils/audio.ts

**الملف:** `src/app/utils/audio.ts` ← 43 سطرًا

هذا الملف مكتبة دوال نقية تُعالج التحويل بين تنسيقات الصوت المختلفة التي يتعامل معها التطبيق.

### لماذا نحتاج التحويل؟

```text
MediaRecorder  // ينتج: Blob (ثنائي في الذاكرة)
قاعدة البيانات (MongoDB)  // تخزّن: Buffer/Binary (على الخادم)
واجهة REST API  // تنقل: Base64 string (نص JSON آمن)
HTML <audio> element  // يستهلك: Blob URL (رابط مؤقت)
```

المشكلة: كل طبقة تتحدث لغة ثنائية مختلفة. `audio.ts` يوفر "المترجمين" بين هذه اللغات.

---

### blobToBase64 — المسجّل إلى API

```typescript
/** Convert a Blob (from MediaRecorder) to a Base64 string. */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // احذف بادئة data URL مثل: "data:audio/webm;base64,"
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

**سطرًا بسطر:**

| السطر | الشرح |
|-------|-------|
| `return new Promise(…)` | `FileReader` غير متزامن — نلفّه في Promise للاستخدام مع `await` |
| `new FileReader()` | API مدمجة في المتصفح لقراءة الملفات والـ blobs |
| `reader.readAsDataURL(blob)` | يبدأ القراءة — ينتج نصًا بصيغة `data:MIME;base64,XXX` |
| `result.split(',')[1]` | يُزيل الجزء `data:audio/webm;base64,` ويُبقى Base64 الخالص |
| `?? result` | إن لم يكن هناك فاصلة (حالة نادرة) — أعد النص كاملًا |
| `reader.onerror = reject` | تحويل أي خطأ في القراءة إلى رفض للـ Promise |

**لماذا Base64 للتخزين؟** — MongoDB لا يخزن Blob مباشرة في حقل JSON. Base64 هو تمثيل نصي للبيانات الثنائية — زيادة الحجم ~33% لكن الاتساق مع JSON يستحق ذلك.

---

### base64ToBlob — من API إلى تشغيل

```typescript
/** Convert a Base64 string back to a Blob. */
export function base64ToBlob(base64: string, mimeType = 'audio/webm'): Blob {
  const bytes = atob(base64);                    // فكّ Base64 إلى سلسلة bytes خام
  const buffer = new Uint8Array(bytes.length);   // مصفوفة ثمانية بتات
  for (let i = 0; i < bytes.length; i++) {
    buffer[i] = bytes.charCodeAt(i);             // تحويل كل حرف إلى كوده الرقمي
  }
  return new Blob([buffer], { type: mimeType }); // إعادة تجميع كـ Blob
}
```

**`atob()` هي عكس `btoa()`** — `atob` = ASCII To Binary، تحوّل Base64 إلى نص بايتات خام. `charCodeAt(i)` يحوّل كل حرف إلى رقمه في جدول ASCII/Unicode.

**لماذا `Uint8Array` وليس Uint16Array؟** — الصوت بيانات ثنائية خام — كل بايت = 8 bits. استخدام `Uint8Array` يضمن عدم تغيير القيم للأعداد التي تتجاوز 255.

---

### createAudioUrl — من Base64 إلى عنصر `<audio>`

```typescript
/** Create a temporary object URL from a Base64 string for playback. */
export function createAudioUrl(base64: string, mimeType = 'audio/webm'): string {
  const blob = base64ToBlob(base64, mimeType);
  return URL.createObjectURL(blob);
}
```

`URL.createObjectURL(blob)` يُنشئ رابطًا مؤقتًا بالصيغة `blob:http://localhost:3000/UUID` — يصلح مباشرة كقيمة لـ `<audio src=...>`. لكن هذا الرابط يستهلك ذاكرة حتى تُلغي تسجيله بـ `URL.revokeObjectURL(url)` — وهذا سبب الاهتمام الكبير بإدارة دورة حياة هذه URLs في VoiceRecorder.

---

### formatDuration — عرض المدة

```typescript
/** Format seconds to mm:ss display. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
```

**أمثلة:**
- `formatDuration(0)` → `"00:00"`
- `formatDuration(75.3)` → `"01:15"` (يتجاهل الكسور)
- `formatDuration(3600)` → `"60:00"` (لا حدود للدقائق)

**`padStart(2, '0')`** — يُضيف صفرًا في البداية إذا كان الرقم أقل من 10، لضمان صيغة ثابتة `MM:SS`.

---

## 3. المحرر النصي — RichTextEditor.tsx

**الملف:** `src/app/components/notes/RichTextEditor.tsx` ← 423 سطرًا

### ما هو Tiptap؟

**Tiptap** مكتبة محرر نصوص غني (Rich Text Editor) مبنية على **ProseMirror** — المكتبة التي تعتمدها أدوات مثل Notion وGitHub لمحررات النصوص. تيبتاب تُبسّط ProseMirror بنموذج إضافات (Extensions) وخطاف React.

في **ملاحظاتي**، Tiptap يُولِّد محتوى HTML خام يُخزَّن في حقل `content` في قاعدة البيانات ويُعرض لاحقًا عبر `dangerouslySetInnerHTML` (مع `sanitizeHtml` كما تعلمنا في الدرس 08).

---

### الإضافات المُستخدمة

```typescript
import StarterKit from '@tiptap/starter-kit';      // حزمة أساسية: bold, italic, headings, lists…
import Underline from '@tiptap/extension-underline'; // تسطير
import TextAlign from '@tiptap/extension-text-align'; // محاذاة النص
import Placeholder from '@tiptap/extension-placeholder'; // نص بديل عند فراغ المحرر
import Highlight from '@tiptap/extension-highlight'; // تمييز النص باللون
```

**لماذا `StarterKit` وليس كل إضافة منفردة؟** — `StarterKit` حزمة شائعة تجمع ~15 إضافة أساسية في واحدة: bold, italic, strike, code, heading, bulletList, orderedList, blockquote, horizontalRule, history (Ctrl+Z). توفّر وقت الإعداد وتضمن توافقًا داخليًا.

---

### واجهة المكوّن

```typescript
interface RichTextEditorProps {
  content: string;          // HTML الحالي
  onChange: (html: string) => void; // يُستدعى عند كل تعديل
  placeholder?: string;     // النص البديل (افتراضي: 'ابدأ بالكتابة...')
  minHeight?: number;       // ارتفاع أدنى بالبكسل (افتراضي: 200)
  maxHeight?: number | string; // ارتفاع أقصى قبل الإلتفاف الداخلي
  readOnly?: boolean;       // لوضع القراءة (يُخفي شريط الأدوات)
}
```

**`maxHeight` مرن النوع** — يقبل `400` (بكسل كعدد) أو `'60vh'` (كنص CSS) لأن MUI `sx` يُحوّل الأعداد إلى بكسل لكن يُبقي النصوص كما هي.

---

### إنشاء المحرر — useEditor

```typescript
const editor = useEditor({
  immediatelyRender: false, // آمن للـ SSR: يمنع Hydration Mismatch في Tiptap
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] }, // H2 و H3 فقط (لا H1 — هو العنوان الرئيسي للملاحظة)
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      defaultAlignment: contentDir === 'rtl' ? 'right' : 'left', // محاذاة افتراضية حسب اللغة
    }),
    Placeholder.configure({ placeholder }),
    Highlight,
  ],
  content,             // المحتوى الأولي
  editable: !readOnly, // وضع التحرير أو القراءة
  editorProps: {
    attributes: {
      dir: contentDir,     // RTL أو LTR للـ HTML element
      spellcheck: 'true',  // تفعيل التدقيق الإملائي
    },
  },
  onUpdate: ({ editor: e }) => {
    onChangeRef.current(e.getHTML()); // استدعاء onChange عند كل تعديل
  },
});
```

**`immediatelyRender: false`** — Tiptap يُهيئ افتراضيًا شجرة DOM أثناء الـ render — وهذا يتعارض مع Next.js SSR لأن شجرة Server تختلف عن Client مما يُسبب Hydration Mismatch. الحل: أجّل الـ rendering حتى يكتمل الـ hydration في المتصفح.

---

### إدارة onChange بـ useRef

```typescript
const onChangeRef = useRef(onChange);
// مرجع ثابت لـ onChange لمنع stale closure داخل Tiptap
useEffect(() => {
  onChangeRef.current = onChange; // تحديث المرجع عند كل render
});
```

**المشكلة:** `useEditor` ينشئ `onUpdate` مرة واحدة عند mount — تبقى الـ closure تُشير لأول نسخة من `onChange`. لو تغيّرت `onChange` لاحقًا (وهي تتغير كلما تغيّرت `fields` في NoteEditorForm)، ستُستدعى النسخة القديمة.

**الحل:** `onChangeRef.current` يشير دائمًا لآخر نسخة. `useEffect()` بدون تبعيات يوفّر "after-render" لتحديث المرجع بعد كل render — نمط يُسمى "الـ ref كـ callback المحدَّث".

---

### مزامنة المحتوى من الخارج

```typescript
const prevContentRef = useRef(content);
useEffect(() => {
  if (!editor) return;
  if (content === prevContentRef.current) return; // لا تغيير — تجاهل
  prevContentRef.current = content;

  const editorHtml = editor.getHTML();
  const isEmpty = (h: string) => !h || h === '<p></p>';

  if (isEmpty(content) && isEmpty(editorHtml)) return; // كلاهما فارغ
  if (content === editorHtml) return;                   // متطابقان

  editor.commands.setContent(content, { emitUpdate: false }); // ضبط المحتوى بدون إطلاق onChange
}, [content, editor]);
```

**لماذا هذا التعقيد؟** — لو استدعينا `setContent` عند كل تغيير في `content`، وكان `onUpdate` يستدعي `onChange` الذي يُحدّث `content`، ستحدث حلقة لانهائية:

```text
setContent → onUpdate → onChange → content يتغيّر → useEffect → setContent → ...
```

الحل بثلاث طبقات:
1. `prevContentRef` — يتتبع آخر قيمة عالجناها، يتجاهل التكرار
2. `isEmpty()` — يُساوي `''` و `'<p></p>'` لأن Tiptap يُحوّل الفراغ فورًا
3. `emitUpdate: false` — يُجبر `setContent` على عدم إطلاق `onUpdate`

---

### مزامنة اتجاه المحتوى

```typescript
const isFirstDirSync = useRef(true);
useEffect(() => {
  if (!editor) return;
  // تطبيق الاتجاه على DOM مباشرة (Tiptap لا يُعيد تطبيق editorProps بعد mount)
  editor.view.dom.setAttribute('dir', contentDir);

  if (isFirstDirSync.current) {
    isFirstDirSync.current = false;
    return; // لا تُغيّر المحاذاة في أول تحميل — احترم محتوى المحرر المخزون
  }
  // عند تبديل المستخدم اليدوي: طبّق المحاذاة المناسبة
  editor.commands.setTextAlign(contentDir === 'rtl' ? 'right' : 'left');
}, [contentDir, editor]);
```

**`isFirstDirSync`** — عند تحميل ملاحظة موجودة، محتواها المخزون قد يحتوي محاذاة يسار (تحديد LTR سابق). لو طبّقنا `setTextAlign('right')` فورًا عند mount سنُلغي هذه المحاذاة الصريحة. `isFirstDirSync` يضمن المرور الأول بدون تعديل محاذاة.

**`editor.view.dom.setAttribute('dir', contentDir)`** — Tiptap يُطبّق `editorProps.attributes` فقط عند الإنشاء. لو أردنا تغيير `dir` لاحقًا، يجب تعديل DOM مباشرة عبر `editor.view.dom`.

---

### شريط الأدوات — EditorToolbar

```typescript
interface EditorToolbarProps {
  editor: Editor | null;
  contentDir: 'rtl' | 'ltr';
  onDirChange: (dir: 'rtl' | 'ltr') => void;
}

function EditorToolbar({ editor, contentDir, onDirChange }: EditorToolbarProps) {
  if (!editor) return null; // المحرر لم يُهيَّأ بعد

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1, borderBottom: 1, borderColor: 'divider' }}>
      {/* زر تبديل الاتجاه RTL ↔ LTR */}
      <Tooltip title={contentDir === 'rtl' ? t('switchToLTR') : t('switchToRTL')}>
        <ToggleButton
          value="dir"
          selected={contentDir === 'rtl'}
          onChange={() => onDirChange(contentDir === 'rtl' ? 'ltr' : 'rtl')}
        >
          {contentDir === 'rtl'
            ? <FormatTextdirectionRToLIcon fontSize="small" />
            : <FormatTextdirectionLToRIcon fontSize="small" />
          }
        </ToggleButton>
      </Tooltip>

      {/* التنسيق المضمّن: Bold, Italic, Underline, Strikethrough, Highlight */}
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="bold"
          selected={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FormatBoldIcon fontSize="small" />
        </ToggleButton>
        {/* ... italic, underline, strike, highlight */}
      </ToggleButtonGroup>

      {/* العناوين: H2, H3 */}
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="h2"
          selected={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <TitleIcon fontSize="small" />
        </ToggleButton>
        {/* ... h3 */}
      </ToggleButtonGroup>

      {/* القوائم: نقطية ومرقّمة */}
      {/* المحاذاة: يمين, وسط, يسار */}
    </Box>
  );
}
```

**نمط `editor.chain().focus().toggleBold().run()`** — نمط Tiptap لسلسلة الأوامر:
1. `chain()` — ابدأ دفعة أوامر
2. `focus()` — أعد التركيز للمحرر أولًا (بعد الضغط على الزر خرج التركيز)
3. `toggleBold()` — الأمر المطلوب
4. `run()` — نفّذ الدفعة

**`editor.isActive('bold')`** — يُعيد `true` إذا كان المؤشر داخل نص عريض حاليًا — يُحدّد حالة `selected` للزر لإظهاره محددًا بصريًا.

---

### أنماط CSS مع RTL — تفاصيل حرجة

```typescript
// ── Placeholder ──────────────────────────────────────────────────────────
'& p.is-empty:first-of-type::before': {
  content: 'attr(data-placeholder)',
  color: theme.palette.text.disabled,
  float: 'left',   // ← stylis-plugin-rtl يُحوّله → float: right
  height: 0,
  pointerEvents: 'none',
},
```

**لماذا `float: 'left'` وليس `float: 'right'`؟**

مكتبة `stylis-plugin-rtl` تُحوّل تلقائيًا كل خصائص CSS المادية:
- `padding-left` → `padding-right`
- `margin-left` → `margin-right`
- `border-left` → `border-right`
- `float: left` → `float: right`

القاعدة: **اكتب الكود كأنك في LTR — المكتبة تقلبه تلقائيًا للـ RTL**.

لذا `float: 'left'` في الكود → `float: right` في CSS المُولَّد → الـ placeholder يظهر على اليمين (بداية النص العربي) ✅.

```typescript
// ── Lists ──────────────────────────────────────────────────────────────
'& ul, & ol': { pl: 3, pr: 0 }, // pl يُحوَّل → padding-right في RTL
'& li': { mb: 0.25 },

// ── Blockquote ─────────────────────────────────────────────────────────
'& blockquote': {
  borderLeft: `4px solid ${theme.palette.divider}`, // يُحوَّل → border-right في RTL
  pl: 2,  // يُحوَّل → padding-right في RTL
  ml: 0,
  color: theme.palette.text.secondary,
},
```

في الواجهة العربية، الاقتباس (blockquote) يجب أن يكون حدّه الجانبي على اليمين (جهة البداية في RTL) — وهذا بالضبط ما يحدث بعد قلب `border-left` → `border-right`.

---

### عرض المحرر وتأثير التركيز

```tsx
<Paper
  variant="outlined"
  sx={{
    overflow: 'hidden',
    borderWidth: '1.5px',
    '&:focus-within': {
      borderColor: 'primary.main', // إطار ملون عند التركيز
      borderWidth: '2px',
    },
  }}
>
  {!readOnly && (
    <EditorToolbar editor={editor} contentDir={contentDir} onDirChange={setContentDir} />
  )}
  <Box
    sx={(theme) => ({
      '& .tiptap': {
        minHeight,
        ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}),
        p: 2,
        outline: 'none',  // يُخفي outline الافتراضي للمتصفح (نُعوّضه بإطار الـ Paper)
        // لا نضبط direction هنا — dir attribute على HTML element يكفي
        fontFamily: 'inherit',
        fontSize: '1rem',
        lineHeight: 1.8,
      },
    })}
  >
    <EditorContent editor={editor} />
  </Box>
</Paper>
```

**`'&:focus-within'`** — CSS pseudo-class يُطابق العنصر حين يكون له أو أحد أبنائه التركيزُ. حين يكتب المستخدم في المحرر، يظهر الإطار الملون.

**لماذا لا `direction: rtl` في CSS؟** — الخاصية `direction` تتعارض مع `stylis-plugin-rtl` الذي يقلب CSS globally. وضع `direction: rtl` في CSS يُسبب "قلب مزدوج" لبعض الخصائص. **HTML `dir` attribute وحده يكفي** لتوجيه المحرر.

---

## 4. المسجّل الصوتي — VoiceRecorder.tsx

**الملف:** `src/app/components/notes/VoiceRecorder.tsx` ← 333 سطرًا

### آلة MediaRecorder

**`MediaRecorder` API** واجهة متصفح أصلية تمكّن التسجيل من الميكروفون أو الشاشة. تعمل على مراحل:

```text
getUserMedia()  // يحصل على إذن الميكروفون وتيار الصوت
new MediaRecorder(stream)  // يُنشئ مسجّلًا
mediaRecorder.start(250)  // يبدأ التسجيل (250ms = حجم chunk)
mediaRecorder.ondataavailable  // حدث با chunk جديد كل 250ms
mediaRecorder.stop()  // يُنهي التسجيل
mediaRecorder.onstop  // حدث بعد الإنهاء (بعد آخر chunk)
```

**لماذا `start(250)` وليس `start()`?**  
`start()` بدون وسيط يُنتج chunk واحدًا ضخمًا عند `stop()` — المستخدم لا يرى تحديثًا للمؤقت إذ لا بيانات تصل. `start(250)` يُنتج chunk كل 250ms مما يُبقي المؤقت حيًا ويُتيح إيقافًا نظيفًا في أي لحظة.

---

### واجهة المكوّن

```typescript
interface VoiceRecorderProps {
  /** يُستدعى عند انتهاء التسجيل: Base64 + المدة الصافية */
  onRecorded: (base64: string, duration: number) => void;
  /** صوت أولي (عند تعديل ملاحظة صوتية موجودة) */
  initialAudio?: string;
  /** المدة الأولية بالثواني */
  initialDuration?: number;
}
```

**الثنائي المهم:** المكوّن يتعامل مع حالتين:
1. **إنشاء جديد** — `initialAudio` غير موجود، يبدأ في حالة `idle`
2. **تعديل موجود** — `initialAudio` موجود، يبدأ في حالة `done` مع مشغل الصوت

---

## 5. آلة الحالة والمؤقت الدقيق

### آلة الحالة (State Machine)

```typescript
/**
 * مراحل التسجيل الداخلية:
 *   idle      — لا تسجيل, لا صوت (أو بعد إعادة التعيين)
 *   recording — MediaRecorder نشط
 *   paused    — MediaRecorder.pause() استُدعي؛ المؤقت متجمّد
 *   done      — التسجيل انتهى؛ audioUrl جاهز للتشغيل
 */
type Phase = 'idle' | 'recording' | 'paused' | 'done';
```

**انتقالات الحالة:**

```text
idle
  └─ [زر تسجيل] startRecording() ──────────────→ recording
                                                      │
                                     pauseRecording() │⟵──── [زر إيقاف مؤقت]
                                                      ↓
                                                   paused
                                                      │
                                    resumeRecording() │⟵──── [زر استئناف]
                                                      │
                                     stopRecording() │⟵──── [زر إيقاف]
                                                      ↓
recording ──── stopRecording() ──────────────────→ done
paused ──────── stopRecording() ─────────────────→ done

done ─────── resetRecording() ───────────────────→ idle
```

**لماذا آلة حالة وليس مجرد `isRecording: boolean`؟** — ثلاث أزرار (Pause/Resume/Stop) تتغير معروضاتها حسب الحالة. مع boolean واحد ستحتاج: `isRecording && !isPaused && showPause`، `isRecording && isPaused && showResume`... — ثلاثة booleans تُولّد 8 حالات أكثرها مستحيلة. حالة ذرية واحدة (`Phase`) تضمن أن المكوّن دائمًا في حالة محدودة صحيحة.

---

### المؤقت الدقيق

التحدي: المؤقت يجب أن يُحسب المدة **الصافية** (بدون وقت الإيقاف المؤقت).

```typescript
// accumulatedRef: ثواني من المقاطع المكتملة
const accumulatedRef = useRef(0);
// segmentStartRef: Date.now() عند بدء المقطع الحالي
const segmentStartRef = useRef(0);
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const [elapsed, setElapsed] = useState(initialDuration ?? 0);
```

**منطق المؤقت:**

```typescript
const startTimer = useCallback(() => {
// بدء مقطع جديد
  segmentStartRef.current = Date.now();    // سجّل وقت البدء
  timerRef.current = setInterval(() => {
    const segSec = (Date.now() - segmentStartRef.current) / 1000; // مدة المقطع الحالي
    setElapsed(accumulatedRef.current + segSec); // مجموع + حالي
  }, 100); // تحديث كل 100ms للسلاسة
}, []);

// تجميد المؤقت (عند إيقاف مؤقت)
const freezeTimer = useCallback(() => {
  stopTimer();
  // أضف مدة المقطع المنتهي للمجموع
  accumulatedRef.current += (Date.now() - segmentStartRef.current) / 1000;
  setElapsed(accumulatedRef.current);
}, [stopTimer]);
```

**مثال على التتبع:**

```text
0:00 → startTimer()         segmentStartRef = T0, accumulated = 0
0:10 → setInterval يُحدّث elapsed = 10s
0:15 → pauseRecording()
       freezeTimer():
         accumulated = 0 + 15 = 15, segmentStart = --
0:25 → resumeRecording()    segmentStartRef = T1, accumulated = 15
0:30 → setInterval: elapsed = 15 + (T-T1)/1000 = 20s
0:35 → stopRecording()      elapsed ثابت = 20s
```

المدة الصافية = 20 ثانية (تسجيل فعلي)، بدون الـ 10 ثواني المتوقفة.

**`setInterval(fn, 100)` وليس 1000:** تحديث كل 100ms يُعطي انسيابية أفضل مرئيًا. `setElapsed` React يُحسن الـ re-renders بحيث التحديثات الصغيرة لا تُسبب خللًا.

---

### startRecording — التنفيذ الكامل

```typescript
const startRecording = useCallback(async () => {
  setError(null);
  try {
    // 1. طلب إذن الميكروفون وفتح تيار الصوت
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 2. إنشاء MediaRecorder مع اختيار ترميز أفضل إذا كان مدعومًا
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'  // Opus: ضغط أفضل, مدعوم في Chrome/Firefox
        : 'audio/webm',             // fallback أساسي
    });

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];         // مصفوفة جديدة لـ chunks
    accumulatedRef.current = 0;     // إعادة ضبط التراكم

    // 3. تجميع الـ chunks أثناء التسجيل
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    // 4. معالجة اكتمال التسجيل
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); // أوقف الميكروفون (مصباح الميكروفون يطفأ)
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // دمج الـ chunks
      const base64 = await blobToBase64(blob);  // تحويل للتخزين
      const netDuration = accumulatedRef.current; // المدة الصافية المحسوبة

      // 5. إدارة الـ URL (يُزيل القديم إن وُجد)
      if (ownedUrlRef.current) URL.revokeObjectURL(ownedUrlRef.current);
      const url = URL.createObjectURL(blob);
      ownedUrlRef.current = url;

      setAudioUrl(url);
      setElapsed(netDuration);
      setPhase('done');
      onRecorded(base64, netDuration); // أبلغ الأب (NoteEditorForm)
    };

    mediaRecorder.start(250); // بدء التسجيل بـ chunks كل 250ms
    setPhase('recording');
    startTimer();
  } catch {
    setError(t('microphoneError')); // رسالة خطأ إذا رُفض إذن الميكروفون
  }
}, [onRecorded, startTimer, t]);
```

**`stream.getTracks().forEach((t) => t.stop())`** — هذا السطر حاسم. بدونه، مصباح الميكروفون يبقى مضيئًا في المتصفح حتى بعد انتهاء التسجيل — المتصفح يعتبر التيار ما زال نشطًا. إيقاف كل `track` يُغلق التيار ويُطفئ المصباح.

**`audio/webm;codecs=opus`** — Opus ترميز صوتي مفتوح طوّرته Xiph.Org وتعتمده Google. يُعطي جودة عالية على معدل بت منخفض (~96kbps مقابل ~256kbps لـ AAC بنفس الجودة). لكنه ليس مدعومًا في كل المتصفحات — `isTypeSupported` يفحص قبل الاستخدام.

---

### الإيقاف والاستئناف والإيقاف

```typescript
const pauseRecording = useCallback(() => {
// الإيقاف المؤقت
  if (mediaRecorderRef.current?.state === 'recording') {
    mediaRecorderRef.current.pause(); // يوقف تدفق الـ chunks
  }
  freezeTimer();     // يُجمّد المؤقت ويجمع المقطع
  setPhase('paused');
}, [freezeTimer]);

// الاستئناف
const resumeRecording = useCallback(() => {
  if (mediaRecorderRef.current?.state === 'paused') {
    mediaRecorderRef.current.resume(); // يستأنف تدفق الـ chunks
  }
  setPhase('recording');
  startTimer();      // يبدأ مقطع جديد
}, [startTimer]);

// الإيقاف الكامل
const stopRecording = useCallback(() => {
  if (mediaRecorderRef.current?.state === 'recording') {
    freezeTimer(); // اجمع المقطع الأخير قبل stop()
  } else {
    stopTimer();   // في حالة paused: فقط أوقف المؤقت
  }
  mediaRecorderRef.current?.stop(); // يُطلق onstop بعد آخر chunk
}, [freezeTimer, stopTimer]);
```

**ترتيب العمليات في stopRecording حرج:**
1. `freezeTimer()` أو `stopTimer()` أولًا — يُجمّد `accumulatedRef` قبل اكتمال `onstop`
2. `stop()` يُطلق `ondataavailable` (آخر chunk) ثم `onstop`
3. في `onstop`: `accumulatedRef.current` جاهز بالمدة الصحيحة

لو عكسنا الترتيب (`stop()` ثم `freezeTimer()`): `onstop` قد يُشغَّل قبل تحديث `accumulatedRef` — نحصل على مدة خاطئة.

---

### إعادة التعيين — resetRecording

```typescript
const resetRecording = useCallback(() => {
  stopTimer();                        // أوقف المؤقت
  if (ownedUrlRef.current) {
    URL.revokeObjectURL(ownedUrlRef.current); // أطلق الـ URL المملوك
    ownedUrlRef.current = null;
  }
  accumulatedRef.current = 0;
  setAudioUrl(null);
  setElapsed(0);
  setPhase('idle');                   // عُد للبداية
}, [stopTimer]);
```

**ملاحظة:** `resetRecording` يُلغي `ownedUrlRef` لكن لا يُلغي `initialBlobUrlRef` — هذا الأخير يُلغى فقط عند unmount المكوّن بالكامل (راجع القسم التالي).

---

## 6. إدارة URLs ومنع تسرب الذاكرة

هذا أعقد جانب في `VoiceRecorder` — يتعامل مع نوعين من Blob URLs:

### تصنيف URLs

```typescript
// URL أُنشئ من الـ prop الأولي (التعديل) — المكوّن لا "يملكه" منطقيًا
const initialBlobUrlRef = useRef<string | null>(_precomputedUrl);

// URL أُنشئ من تسجيل جديد — المكوّن "يملكه" ومسؤول عنه
const ownedUrlRef = useRef<string | null>(null);
```

**لماذا التفريق؟**

| الحالة | من يُنشئ URL | من يُلغيه |
|--------|-------------|----------|
| تعديل ملاحظة صوتية | هذا المكوّن (في pre-compute) | عند unmount فقط |
| تسجيل جديد | هذا المكوّن (في onstop) | عند reset + عند unmount |

**تسلسل الإلغاء:**
- عند **reset** → نُلغي `ownedUrlRef` (التسجيل الجديد)، نُبقي `initialBlobUrlRef` (الصوت القديم لا يزال يُعرض)
- عند **unmount** → نُلغي كليهما

---

### pre-compute URL خارج useState

```typescript
const _precomputedUrl = initialAudio ? createAudioUrl(initialAudio) : null;
// ننشئ URL قبل useState لإشباع React
const initialBlobUrlRef = useRef<string | null>(_precomputedUrl);

const [audioUrl, setAudioUrl] = useState<string | null>(_precomputedUrl);
```

**لماذا لاننشئ URL داخل useState lazy initializer؟**

```typescript
const [audioUrl, setAudioUrl] = useState<string | null>(
// ❌ خاطئ — side effect داخل render phase
  () => initialAudio ? createAudioUrl(initialAudio) : null
);
// مشكلة: ننشئ URL لكن لن نُخزّنه في ref → لا نستطيع إلغاءه لاحقًا
```

الحل: نُنشئ URL قبل useState — نُخزّنه في ref — نُمرّره لـ useState. هكذا الـ ref يحمل نفس الـ URL التي يطبعها الـ state.

---

### دورة حياة URLs الكاملة

```typescript
useEffect(() => {
  const initialUrl = initialBlobUrlRef.current; // التقاط قبل الـ effect

  return () => {
    // cleanup عند unmount
    if (timerRef.current) clearInterval(timerRef.current);
    if (ownedUrlRef.current) URL.revokeObjectURL(ownedUrlRef.current);
    if (initialUrl) URL.revokeObjectURL(initialUrl);
  };
}, []); // يشتغل مرة واحدة عند mount
```

**لماذا `const initialUrl = initialBlobUrlRef.current` قبل الـ return؟**

حين يُشغَّل الـ cleanup (عند unmount)، الـ closure تُنشئ مرجعًا ثابتًا للقيمة وقت تشغيل الـ effect. لو أشرنا مباشرة لـ `initialBlobUrlRef.current` داخل الـ cleanup، ستقرأ القيمة وقت التنظيف الذي قد تكون تغيّرت — التقاط مسبق يضمن الاتساق.

---

### عرض المكوّن — ربط الحالات بالواجهة

```tsx
return (
  <Paper variant="outlined" sx={{ p: 2 }}>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

    <Stack spacing={2} alignItems="center">
      {/* عداد الوقت */}
      <Typography
        variant="h4"
        fontFamily="monospace"
        color={phase === 'recording' ? 'error.main' : 'text.secondary'}
        sx={{ transition: 'color 0.3s' }} // انتقال لوني سلس
      >
        {formatDuration(elapsed)}
      </Typography>

      {/* أزرار التحكم — تتغير حسب الحالة */}
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">

        {/* idle  // زر واحد: البدء */}
        {phase === 'idle' && (
          <Button variant="contained" color="error" startIcon={<MicIcon />} onClick={startRecording} size="large">
            {t('startRecording')}
          </Button>
        )}

        {/* recording  // زرّان: توقف مؤقت + إيقاف */}
        {phase === 'recording' && (
          <>
            <Button variant="outlined" color="warning" startIcon={<PauseIcon />} onClick={pauseRecording}>
              {t('pause')}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopRecording}
              sx={{ animation: 'pulse 1.5s infinite' }} // نبض للفت الانتباه
            >
              {t('stop')}
            </Button>
          </>
        )}

        {/* paused  // زرّان: استئناف + إيقاف */}
        {phase === 'paused' && (
          <>
            <Button variant="contained" color="error" startIcon={<MicIcon />} onClick={resumeRecording}>
              {t('resume')}
            </Button>
            <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={stopRecording}>
              {t('stop')}
            </Button>
          </>
        )}

        {/* done  // زر إعادة التسجيل */}
        {phase === 'done' && (
          <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={resetRecording}>
            {t('reRecord')}
          </Button>
        )}
      </Stack>

      {/* مشغل الصوت الأصلي — يظهر فقط بعد انتهاء التسجيل */}
      {phase === 'done' && audioUrl && (
        <Box component="audio" controls src={audioUrl} sx={{ width: '100%', borderRadius: 1 }} />
      )}

      {/* مؤشر التسجيل — نقطة حمراء نابضة */}
      {phase === 'recording' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 12, height: 12, borderRadius: '50%',
            bgcolor: 'error.main',
            animation: 'pulse 1s infinite',
          }} />
          <Typography variant="body2" color="error">{t('recording')}</Typography>
        </Box>
      )}

      {/* مؤشر الإيقاف المؤقت */}
      {phase === 'paused' && (
        <Typography variant="body2" color="warning.main">{t('pausedHint')}</Typography>
      )}
    </Stack>
  </Paper>
);
```

**`Box component="audio"`** — MUI `Box` يصير `<audio>` element بينما يحتفظ بقدرة sx للتنسيق. أنظف من `<audio style={{...}}>`.

**`animation: 'pulse 1s infinite'`** — هذا `@keyframes pulse` مُعرَّف عالميًا (عادةً في الـ theme أو globals.css). في **ملاحظاتي** يُستخدم لكل مؤشرات "نشط": نقطة الميكروفون وزر الإيقاف أثناء التسجيل.

---

## 7. RTL داخل المحرر — تفاصيل دقيقة

### لماذا `dir` بدلًا من CSS `direction`؟

HTML `dir` attribute يُوجّه:
1. **اتجاه النص** (text direction) — من أين تبدأ الحروف
2. **اتجاه الكتابة** (inline direction) — يمين لليسار أم العكس
3. **محاذاة الكتل الافتراضية** (block alignment)

CSS `direction: rtl` يُوجّه فقط جانب الـ CSS مما قد يتعارض مع `stylis-plugin-rtl`.

**القاعدة الذهبية:** في Next.js مع MUI وstylis:
- `dir` attribute على `<html>` أو أي element للاتجاه
- **لا** `direction: rtl` في CSS إلا باحتياط شديد

---

### تبديل الاتجاه داخل ملاحظة عربية

المستخدم يمكنه كتابة:
```text
This English sentence goes left to right
هذا نص عربي يسير من اليمين لليسار
وهذا عودة للعربية
```

باستخدام زر تبديل الاتجاه (RTL ↔ LTR)، يمكن الكتابة بالعربية والإنجليزية في نفس الملاحظة. `contentDir` حالة محلية تعيش في الجلسة الحالية فقط — لا تُحفَظ في قاعدة البيانات.

```typescript
const [contentDir, setContentDir] = useState<'rtl' | 'ltr'>(() =>
  locale === 'ar' ? 'rtl' : 'ltr' // افتراضي حسب لغة التطبيق
);
```

حين يُغيّر المستخدم الاتجاه:
1. `setContentDir('ltr')` يُحدّث الـ state
2. `useEffect([contentDir])` يُشغَّل
3. `editor.view.dom.setAttribute('dir', 'ltr')` يُغيّر الـ dir في DOM
4. `editor.commands.setTextAlign('left')` يضبط محاذاة افتراضية للنص الجديد

---

### جدول مقارنة التنسيق RTL/LTR

| الخاصية CSS المكتوبة | RTL (بعد stylis) | LTR |
|---------------------|-----------------|-----|
| `float: left` | `float: right` | `float: left` |
| `padding-left: 24px` | `padding-right: 24px` | `padding-left: 24px` |
| `border-left: 4px solid` | `border-right: 4px solid` | `border-left: 4px solid` |
| `margin-left: 0` | `margin-right: 0` | `margin-left: 0` |
| `text-align: left` | `text-align: right` | `text-align: left` |

**القاعدة:** اكتب كأنك في LTR — stylis يُقلب تلقائيًا. الاستثناء: `text-align` و `direction` قد يحتاجان معالجة يدوية حسب السياق.

---

## 8. ملخص

| ما تعلمناه | الملف المسؤول | النمط المستخدم |
|------------|--------------|---------------|
| تحويل Blob ↔ Base64 ↔ Blob URL | `utils/audio.ts` | FileReader + atob + URL.createObjectURL |
| تنسيق المدة `mm:ss` | `utils/audio.ts` | Math.floor + padStart |
| تهيئة Tiptap آمنة للـ SSR | `RichTextEditor.tsx` | immediatelyRender: false |
| onChange بدون stale closure | `RichTextEditor.tsx` | onChangeRef + useEffect بلا تبعيات |
| مزامنة محتوى الأب بدون حلقة | `RichTextEditor.tsx` | prevContentRef + emitUpdate: false |
| مزامنة dir بعد mount | `RichTextEditor.tsx` | editor.view.dom.setAttribute + isFirstDirSync |
| RTL مع stylis: اكتب LTR تُقلَب | `RichTextEditor.tsx` | `float: left`, `pl`, `borderLeft` |
| آلة حالة للتسجيل (4 حالات) | `VoiceRecorder.tsx` | Phase type + انتقالات واضحة |
| مؤقت دقيق مع دعم الإيقاف | `VoiceRecorder.tsx` | accumulatedRef + segmentStartRef |
| إدارة نوعين من Blob URLs | `VoiceRecorder.tsx` | initialBlobUrlRef + ownedUrlRef |
| إيقاف تيار الميكروفون | `VoiceRecorder.tsx` | stream.getTracks().forEach(t => t.stop()) |
| cleanup كامل عند unmount | `VoiceRecorder.tsx` | useEffect return + revokeObjectURL |

---

### نقطة المراقبة

قبل الانتقال للدرس التالي، تأكد من قدرتك على الإجابة:

1. لماذا يُنشئ `VoiceRecorder` الـ `_precomputedUrl` خارج `useState` ويُخزّنه في ref؟
2. ما الفرق العملي بين `ownedUrlRef` و `initialBlobUrlRef` وما سبب التمييز؟
3. لماذا نستدعي `freezeTimer()` قبل `mediaRecorder.stop()` وليس بعده؟
4. ما الفائدة من `onChangeRef` في `RichTextEditor` وما المشكلة التي تحلّها؟
5. لماذا نكتب `float: 'left'` في sx لنصل إلى `float: right` في RTL؟ وما المكتبة المسؤولة؟

---

الدرس السابق → [الدرس 08: واجهة إدارة الملاحظات](08-notes-crud.md) | الدرس التالي → [الدرس 10: تطبيق الويب التقدمي (PWA) و Service Worker](10-pwa-service-worker.md)
