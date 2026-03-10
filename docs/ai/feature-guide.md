# Feature Guide — Adding a New Entity End-to-End

This guide walks through the complete process of adding a new entity to the project, using **Tag** as a concrete example. A Tag can be attached to notes for categorization.

Follow all 8 steps in order. Each step specifies the exact file path, the code pattern, and critical notes.

---

## Step 1: Mongoose Model

**File:** `src/app/models/Tag.ts`

```typescript
/**
 * Tag Model
 *
 * Mongoose schema for note tags / categories.
 */

import mongoose, { Schema } from 'mongoose';
import type { ITag } from '@/app/types';

const tagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    color: {
      type: String,
      trim: true,
      default: '#1976d2',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
tagSchema.index({ user: 1 });
tagSchema.index({ user: 1, name: 1 }, { unique: true });

/**
 * Prevent model recompilation during HMR in Next.js development.
 */
export default mongoose.models.Tag ?? mongoose.model<ITag>('Tag', tagSchema);
```

**Critical notes:**
- Always define the HMR guard (`mongoose.models.X ?? mongoose.model(...)`) — without it, Next.js dev mode throws `OverwriteModelError`.
- Add `user` field as `ObjectId` ref for user-scoped data.
- Define indexes explicitly — Mongoose does not auto-create compound indexes.

---

## Step 2: TypeScript Types

**File:** `src/app/types.ts`

Add to the appropriate sections:

```typescript
// ─── Server-Side (Mongoose Document) ─────────────────────────────────────────

export interface ITag extends Document {
  name: string;
  color: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Client-Side (Serializable) ──────────────────────────────────────────────

export interface Tag {
  _id: string;
  name: string;
  color: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface TagInput {
  name: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}
```

**Critical notes:**
- Server interface (`ITag`) extends `Document` and uses `Types.ObjectId` for refs.
- Client interface (`Tag`) uses `string` for `_id`, `user`, and ISO date strings.
- Keep server and client types separated — they serve different layers.

---

## Step 3: Repository

**File:** `src/app/repositories/tag.repository.ts`

```typescript
/**
 * Tag Repository
 *
 * Extends BaseRepository with tag-specific data access methods.
 */

import { BaseRepository } from './base.repository';
import Tag from '@/app/models/Tag';
import type { ITag } from '@/app/types';

class TagRepository extends BaseRepository<ITag> {
  constructor() {
    super(Tag);
  }

  /** Find all tags belonging to a user, sorted alphabetically. */
  async findByUser(userId: string): Promise<ITag[]> {
    return this.findAll({ user: userId }, { sort: { name: 1 } });
  }

  /** Find a tag by user + name (for uniqueness checks). */
  async findByName(userId: string, name: string): Promise<ITag | null> {
    return this.findOne({ user: userId, name });
  }

  /** Delete all tags belonging to a user (cascade). */
  async deleteByUser(userId: string): Promise<number> {
    return this.deleteWhere({ user: userId });
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
let instance: TagRepository | null = null;

export function getTagRepository(): TagRepository {
  if (!instance) instance = new TagRepository();
  return instance;
}

export { TagRepository };
```

**Critical notes:**
- Extend `BaseRepository<ITag>` — this gives you all CRUD methods for free.
- Export both the class and a `get*Repository()` singleton accessor.
- Follow the singleton pattern exactly — `let instance: T | null = null`.
- Add entity-specific methods only (user-scoped queries, search, etc.).

**Optional — Register in RepositoryManager:**

If the entity needs health-checking, add it to `src/app/repositories/index.ts`:

```typescript
import { getTagRepository, TagRepository } from './tag.repository';

// Inside RepositoryManager class:
get tag(): TagRepository {
  return getTagRepository();
}
```

---

## Step 4: Validators

**File:** `src/app/validators/index.ts`

Add new validation functions:

```typescript
import { serverMsg } from '@/app/lib/apiErrors';
import type { SupportedLocale } from '@/app/types';

export function validateTagInput(input: TagInput, locale: SupportedLocale = 'ar'): string[] {
  const errors: string[] = [];

  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push(serverMsg(locale, 'validNoteTitleRequired')); // use nearest matching key or add a new ServerErrors key
  } else if (input.name.trim().length > 50) {
    errors.push(serverMsg(locale, 'validNoteTitleTooLong'));
  }

  return errors;
}

export function validateUpdateTagInput(input: UpdateTagInput, locale: SupportedLocale = 'ar'): string[] {
  const errors: string[] = [];

  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      errors.push(serverMsg(locale, 'validNoteTitleRequired'));
    } else if (input.name.trim().length > 50) {
      errors.push(serverMsg(locale, 'validNoteTitleTooLong'));
    }
  }

  return errors;
}
```

**Critical notes:**
- Every validator returns `string[]` — empty = valid, non-empty = error messages.
- Accept `locale: SupportedLocale = 'ar'` as the second parameter — route handlers pass `getRequestLocale(request)` here.
- Use `serverMsg(locale, key)` for all error messages — never hardcode string literals.
- If you need a new error key, add it to **both** `src/messages/ar.json` and `src/messages/en.json` under `ServerErrors` before using it.
- Create both `validateXxxInput` and `validateUpdateXxxInput` (update allows partial input).

export function validateUpdateTagInput(input: UpdateTagInput, locale: SupportedLocale = 'ar'): string[] {
  const errors: string[] = [];

  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      errors.push(serverMsg(locale, 'validNoteTitleRequired'));
    } else if (input.name.trim().length > 50) {
      errors.push(serverMsg(locale, 'validNoteTitleTooLong'));
    }
  }

  return errors;
}
```

**Critical notes:**
- Every validator returns `string[]` — empty = valid, non-empty = Arabic error messages.
- Error messages are **always in Arabic** (they are user-facing).
- Validate all fields defensively: check type, check presence, check bounds.
- Create both `validateXxxInput` and `validateUpdateXxxInput` (update allows partial input).

---

## Step 5: API Route

**File:** `src/app/api/tags/route.ts` (list + create)

```typescript
/**
 * GET  /api/tags — List the authenticated user's tags
 * POST /api/tags — Create a new tag
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getTagRepository } from '@/app/repositories/tag.repository';
import { validateTagInput } from '@/app/validators';
import {
  getRequestLocale,
  validationError,
  conflictError,
  serverError,
  serverMsg,
} from '@/app/lib/apiErrors';
import type { ITag, Tag } from '@/app/types';

function serializeTag(doc: ITag): Tag {
  return {
    _id: (doc._id as Types.ObjectId).toString(),
    name: doc.name,
    color: doc.color,
    user: doc.user.toString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const locale = getRequestLocale(request);
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    await connectDB();
    const tagRepo = getTagRepository();
    const tags = await tagRepo.findByUser(auth.userId);

    return NextResponse.json({ data: tags.map(serializeTag) }, { status: 200 });
  } catch (error) {
    console.error('Tags list error:', error);
    return serverError(locale);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const locale = getRequestLocale(request);
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const errors = validateTagInput(body, locale);
    if (errors.length) return validationError(errors, locale);

    await connectDB();
    const tagRepo = getTagRepository();

    // Check uniqueness
    const existing = await tagRepo.findByName(auth.userId, body.name.trim());
    if (existing) return conflictError(locale, 'conflict'); // add a specific key if needed

    const tag = await tagRepo.create({
      name: body.name.trim(),
      color: body.color?.trim() || '#1976d2',
      user: new Types.ObjectId(auth.userId),
    });

    return NextResponse.json(
      { data: serializeTag(tag as ITag), message: serverMsg(locale, 'conflict') },
      { status: 201 }
    );
  } catch (error) {
    console.error('Tag create error:', error);
    return serverError(locale);
  }
}
```

**File:** `src/app/api/tags/[id]/route.ts` (get, update, delete)

Follow the same pattern as `src/app/api/notes/[id]/route.ts`:
1. `authenticateRequest()` → early return on error
2. Parse body / validate
3. `connectDB()` + `getTagRepository()`
4. Repository call + ownership check (`tag.user.toString() !== auth.userId`)
5. Serialize + respond

**Critical notes:**
- Always call `authenticateRequest()` first for protected endpoints.
- Always call `connectDB()` before any repository operation.
- Declare `const locale = getRequestLocale(request)` **before** `try{}` so it is accessible in the `catch` block.
- Pass `locale` to validators and all `apiErrors.ts` helpers — never hardcode string literals.
- Use `apiErrors.ts` helpers for consistent error responses — never construct `NextResponse.json()` error bodies manually.
- Serialize Mongoose documents before sending (dates → ISO strings, ObjectIds → strings).
- Add a `serialize*` helper at the top of the route file.
- Document endpoints in the JSDoc comment at the top of each file.

See [../api-endpoints.md](../api-endpoints.md) for the full endpoint reference and response schemas.

---

## Step 6: Client API Functions + Hook

**File:** `src/app/lib/api.ts`

Add API client functions:

```typescript
// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getTagsApi(): Promise<{ data: Tag[] }> {
  return fetchApi('/api/tags');
}

export async function createTagApi(input: TagInput): Promise<{ data: Tag; message: string }> {
  return fetchApi('/api/tags', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTagApi(
  id: string,
  input: UpdateTagInput
): Promise<{ data: Tag; message: string }> {
  return fetchApi(`/api/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteTagApi(id: string): Promise<{ message: string }> {
  return fetchApi(`/api/tags/${id}`, { method: 'DELETE' });
}
```

**File:** `src/app/hooks/useTags.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getTagsApi, createTagApi, updateTagApi, deleteTagApi } from '@/app/lib/api';
import type { Tag, TagInput, UpdateTagInput } from '@/app/types';

export interface UseTagsReturn {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  createTag: (input: TagInput) => Promise<Tag>;
  updateTag: (id: string, input: UpdateTagInput) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTagsApi();
      setTags(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTag = useCallback(async (input: TagInput): Promise<Tag> => {
    const res = await createTagApi(input);
    setTags((prev) => [...prev, res.data]);
    return res.data;
  }, []);

  const updateTag = useCallback(async (id: string, input: UpdateTagInput): Promise<Tag> => {
    const res = await updateTagApi(id, input);
    setTags((prev) => prev.map((t) => (t._id === id ? res.data : t)));
    return res.data;
  }, []);

  const deleteTag = useCallback(async (id: string): Promise<void> => {
    await deleteTagApi(id);
    setTags((prev) => prev.filter((t) => t._id !== id));
  }, []);

  return { tags, loading, error, createTag, updateTag, deleteTag, refresh };
}
```

**Critical notes:**
- All API functions go through `fetchApi()` — never use raw `fetch()`.
- Hooks follow the pattern: state (`useState`) + fetch on mount (`useEffect`) + CRUD callbacks (`useCallback`).
- Optimistic UI updates: modify local state after successful API call.
- Error handling: catch errors and set `error` state for the UI to display.

---

## Step 7: i18n Messages

**File:** `src/messages/ar.json`

Add keys under a new section:

```json
{
  "tags": {
    "title": "الوسوم",
    "create": "إنشاء وسم",
    "edit": "تعديل الوسم",
    "delete": "حذف الوسم",
    "name": "اسم الوسم",
    "color": "لون الوسم",
    "empty": "لا توجد وسوم بعد",
    "confirmDelete": "هل أنت متأكد من حذف هذا الوسم؟",
    "created": "تم إنشاء الوسم بنجاح",
    "updated": "تم تحديث الوسم بنجاح",
    "deleted": "تم حذف الوسم بنجاح"
  }
}
```

**File:** `src/messages/en.json`

```json
{
  "tags": {
    "title": "Tags",
    "create": "Create Tag",
    "edit": "Edit Tag",
    "delete": "Delete Tag",
    "name": "Tag Name",
    "color": "Tag Color",
    "empty": "No tags yet",
    "confirmDelete": "Are you sure you want to delete this tag?",
    "created": "Tag created successfully",
    "updated": "Tag updated successfully",
    "deleted": "Tag deleted successfully"
  }
}
```

**Critical notes:**
- Both `ar.json` and `en.json` must have identical key structures — missing keys cause runtime errors.
- Use `useTranslations('tags')` in components to access these messages.
- Default locale is Arabic — Arabic messages are the primary translation.

---

## Step 8: Tests

**File:** `src/app/tests/useTags.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTags } from '@/app/hooks/useTags';

// Mock the API module
vi.mock('@/app/lib/api', () => ({
  getTagsApi: vi.fn(),
  createTagApi: vi.fn(),
  updateTagApi: vi.fn(),
  deleteTagApi: vi.fn(),
}));

import { getTagsApi, createTagApi, updateTagApi, deleteTagApi } from '@/app/lib/api';

const mockTag = {
  _id: '1',
  name: 'Work',
  color: '#1976d2',
  user: 'user1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('useTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getTagsApi as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [mockTag] });
  });

  it('fetches tags on mount', async () => {
    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tags).toEqual([mockTag]);
    expect(getTagsApi).toHaveBeenCalledOnce();
  });

  it('creates a tag', async () => {
    const newTag = { ...mockTag, _id: '2', name: 'Personal' };
    (createTagApi as ReturnType<typeof vi.fn>).mockResolvedValue({ data: newTag });

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createTag({ name: 'Personal' });
    });

    expect(result.current.tags).toHaveLength(2);
    expect(createTagApi).toHaveBeenCalledWith({ name: 'Personal' });
  });

  // ... additional tests for update, delete, error handling
});
```

**File:** `src/app/tests/validators.test.ts` — add tag validator tests to the existing file:

```typescript
describe('validateTagInput', () => {
  it('returns empty array for valid input', () => {
    expect(validateTagInput({ name: 'Work' })).toEqual([]);
  });

  it('requires name', () => {
    const errors = validateTagInput({ name: '' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects name over 50 chars', () => {
    const errors = validateTagInput({ name: 'a'.repeat(51) });
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

**Critical notes:**
- All tests go in `src/app/tests/` (flat structure — no subdirectories).
- File naming: `useTags.test.ts` for hook tests, `TagsPage.test.tsx` for component tests.
- Mock API functions with `vi.mock('@/app/lib/api', ...)`.
- Use `renderHook` + `waitFor` for hook tests.
- Use `render` + `screen` from Testing Library for component tests.
- Add validator tests to the existing `validators.test.ts` file.
- Run `npm test` after writing tests to verify they pass.

---

## Checklists

### Server Changes

- [ ] Model file in `src/app/models/` with HMR guard
- [ ] Server interface (`IXxx extends Document`) in `types.ts`
- [ ] Client interface (`Xxx` with string IDs/dates) in `types.ts`
- [ ] Input types (`XxxInput`, `UpdateXxxInput`) in `types.ts`
- [ ] Repository in `src/app/repositories/` extending `BaseRepository`
- [ ] Singleton accessor `get*Repository()` exported
- [ ] Validators in `src/app/validators/index.ts` (accept `locale: SupportedLocale = 'ar'`, use `serverMsg(locale, key)`)
- [ ] Error keys in `ServerErrors` namespace of `ar.json` + `en.json` if new keys needed
- [ ] API routes use `getRequestLocale(request)` before `try{}` and pass locale to validators + error helpers
- [ ] API routes in `src/app/api/<entity>/route.ts` and `[id]/route.ts`
- [ ] Auth check (`authenticateRequest`) in all protected routes
- [ ] Serializer function in route file for Mongoose → JSON conversion
- [ ] Cascade delete in `UserRepository.deleteUserCascade()` if needed

### Client Changes

- [ ] API functions in `src/app/lib/api.ts` using `fetchApi()`
- [ ] Custom hook in `src/app/hooks/use<Entity>.ts`
- [ ] Page components in `src/app/[locale]/<entity>/` directory
- [ ] i18n messages in both `src/messages/ar.json` and `src/messages/en.json`
- [ ] Navigation links added to sidebar/appbar if applicable
- [ ] IndexedDB table in `src/app/lib/db.ts` if offline support needed

### Tests

- [ ] Hook tests in `src/app/tests/use<Entity>.test.ts`
- [ ] Validator tests added to `src/app/tests/validators.test.ts`
- [ ] Component tests in `src/app/tests/<Component>.test.tsx`
- [ ] API route tests if complex logic (e.g., `src/app/tests/<entity>Route.test.ts`)
- [ ] All tests pass: `npm test`

---

## Git Commit Convention

After completing all changes for a feature, commit following the workspace convention:

```bash
# Server-only changes
git add -A
git commit -m "feat(server): add Tag model, repository, and API routes"

# Full-stack feature
git add -A
git commit -m "feat: add tag management (model, API, hook, UI)"

# Tests only
git add -A
git commit -m "test: add Tag hook and validator tests"

# Combined (if done in one pass)
git add -A
git commit -m "feat: add tag management with full test coverage"
```

Commit message format: `<type>(<scope>): <description>`

Common types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`.
