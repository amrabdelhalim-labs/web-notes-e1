# Architecture

## Layer Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                               │
│                                                                             │
│  [locale] Pages ──► Hooks ──► lib/api.ts (fetchApi) ──► REST endpoints     │
│       │                │                                                    │
│       │           Context Layer                                             │
│       │       ┌───────────────────┐                                         │
│       │       │ AuthContext        │  JWT + user state                       │
│       │       │ ThemeContext       │  MUI dark/light + RTL                   │
│       │       │ PwaActivationCtx  │  Trusted device gate                    │
│       │       └───────────────────┘                                         │
│       │                                                                     │
│       │           PWA Layer (trusted devices only)                          │
│       │       ┌───────────────────┐                                         │
│       │       │ Service Worker    │  @serwist/next (sw.ts)                  │
│       │       │ Dexie (IndexedDB) │  notes, pendingOps, devices tables      │
│       │       │ Background Sync   │  Tag: 'notes-sync'                      │
│       │       │ Web Push          │  VAPID subscription management          │
│       │       └───────────────────┘                                         │
└───────┼─────────────────────────────────────────────────────────────────────┘
        │ HTTP (fetch)
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVER (Next.js Route Handlers)                     │
│                                                                             │
│  src/app/api/**/route.ts                                                    │
│       │                                                                     │
│       ├──► authenticateRequest()          Auth Middleware (JWT verify)       │
│       ├──► validate*Input()              Validators (return string[])       │
│       ├──► connectDB()                    MongoDB connection (singleton)     │
│       ├──► get*Repository()              Repository singletons              │
│       │       │                                                             │
│       │       ▼                                                             │
│       │   ┌───────────────────────────────────────────┐                     │
│       │   │         Repository Layer                   │                    │
│       │   │                                            │                    │
│       │   │  BaseRepository<T>                         │                    │
│       │   │   ├── UserRepository                       │                    │
│       │   │   ├── NoteRepository                       │                    │
│       │   │   ├── DeviceRepository                     │                    │
│       │   │   └── SubscriptionRepository               │                    │
│       │   │                                            │                    │
│       │   │  RepositoryManager (singleton)              │                    │
│       │   │   .user / .note / .subscription            │                    │
│       │   └────────────────────┬──────────────────────┘                     │
│       │                        │                                            │
│       │                        ▼                                            │
│       │   ┌───────────────────────────────────────────┐                     │
│       │   │          Model Layer (Mongoose 9)          │                    │
│       │   │                                            │                    │
│       │   │  User    Note    Device    Subscription    │                    │
│       │   └────────────────────┬──────────────────────┘                     │
│       │                        │                                            │
│       └──► apiErrors.ts        │  Standardized error responses              │
│                                ▼                                            │
│                           ┌──────────┐                                      │
│                           │ MongoDB  │                                      │
│                           └──────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Server Layers

### Entry Point — Route Handlers

Every API route is a file at `src/app/api/**/route.ts` exporting named functions (`GET`, `POST`, `PUT`, `DELETE`, `HEAD`).

Standard handler pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getNoteRepository } from '@/app/repositories/note.repository';
import { validateNoteInput } from '@/app/validators';
import { getRequestLocale, validationError, serverError } from '@/app/lib/apiErrors';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Detect locale BEFORE try{} so it is accessible in the catch block
  const locale = getRequestLocale(request);
  try {
    // 1. Auth check (protected routes only)
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    // 2. Parse and validate input
    const body = await request.json();
    const errors = validateNoteInput(body, locale);
    if (errors.length) return validationError(errors, locale);

    // 3. Connect to DB and get repository
    await connectDB();
    const noteRepo = getNoteRepository();

    // 4. Business logic via repository
    const note = await noteRepo.create({ ...body, user: auth.userId });

    // 5. Serialize and respond
    return NextResponse.json({ data: serializeNote(note), message: '...' }, { status: 201 });
  } catch (error) {
    console.error('...', error);
    return serverError(locale);
  }
}
```

### Auth Middleware

File: `src/app/middlewares/auth.middleware.ts`

```typescript
export type AuthResult = AuthSuccess | AuthFailure;

interface AuthSuccess { userId: string; error?: undefined }
interface AuthFailure { userId?: undefined; error: NextResponse<ApiResponse<null>> }

export function authenticateRequest(request: NextRequest): AuthResult
```

Uses discriminated union pattern — check `auth.error` to narrow the type. After the check, `auth.userId` is a guaranteed `string`.

Token extraction: `Authorization: Bearer <jwt>` → `verifyToken(token)` → `{ id: string }`.

### Validators

File: `src/app/validators/index.ts`

All 6 validators follow the same contract:

```typescript
function validateXxxInput(input: XxxInput, locale: SupportedLocale = 'ar'): string[]
// Empty array → valid
// Non-empty → array of locale-aware error messages (Arabic by default, English when locale = 'en')
// Messages are resolved from src/messages/{locale}.json ServerErrors namespace
```

Available validators:
- `validateRegisterInput` — username (3–30 chars), email, password (≥ 6 chars)
- `validateLoginInput` — email, password
- `validateNoteInput` — title, type, content/audioData consistency
- `validateUpdateNoteInput` — partial fields
- `validateUpdateUserInput` — optional displayName, language
- `validateChangePasswordInput` — currentPassword + newPassword

### Repository Layer

See [../database-abstraction.md](../database-abstraction.md) for the full Repository Pattern reference.

**Hierarchy:**

```text
IRepository<T>                    (repository.interface.ts)
  └── BaseRepository<T>           (base.repository.ts)
        ├── UserRepository        (user.repository.ts)
        ├── NoteRepository        (note.repository.ts)
        ├── DeviceRepository      (device.repository.ts)
        └── SubscriptionRepository (subscription.repository.ts)
```

**BaseRepository methods** (inherited by all):

| Method            | Signature                                                   | Description                       |
| ----------------- | ----------------------------------------------------------- | --------------------------------- |
| `findAll`         | `(filter?, options?) → Promise<T[]>`                        | Find documents matching filter    |
| `findOne`         | `(filter, options?) → Promise<T \| null>`                   | Find single document              |
| `findById`        | `(id, options?) → Promise<T \| null>`                       | Find by MongoDB `_id`             |
| `findPaginated`   | `(page, limit, filter?, options?) → Promise<PaginatedResult<T>>` | Paginated query with safe bounds |
| `create`          | `(data) → Promise<T>`                                       | Create new document               |
| `update`          | `(id, data) → Promise<T \| null>`                           | Update by `_id`                   |
| `updateWhere`     | `(filter, data) → Promise<number>`                          | Bulk update, returns count        |
| `delete`          | `(id) → Promise<T \| null>`                                 | Delete by `_id`                   |
| `deleteWhere`     | `(filter) → Promise<number>`                                | Bulk delete, returns count        |
| `exists`          | `(filter) → Promise<boolean>`                               | Check existence                   |
| `count`           | `(filter?) → Promise<number>`                               | Count documents                   |
| `getModel`        | `() → Model<T>`                                             | Access underlying Mongoose model  |

**Entity-specific methods:**

| Repository             | Method                     | Description                                  |
| ---------------------- | -------------------------- | -------------------------------------------- |
| `UserRepository`       | `findByEmail(email)`       | Find user by email                           |
|                        | `findByUsername(username)`  | Find user by username                        |
|                        | `emailExists(email)`       | Check email uniqueness                       |
|                        | `usernameExists(username)` | Check username uniqueness                    |
|                        | `deleteUserCascade(userId)` | Transactional delete: user + notes + devices + subscriptions |
| `NoteRepository`       | `findByUser(userId)`       | All user notes (newest first)                |
|                        | `findByUserPaginated(userId, page, limit)` | Paginated user notes          |
|                        | `findByType(userId, type, page, limit)` | Filter by text/voice            |
|                        | `search(userId, term, page, limit)` | Regex search in title + content    |
|                        | `deleteByUser(userId)`     | Delete all user notes                        |
| `DeviceRepository`     | `findByUser(userId)`       | All trusted devices (by lastSeenAt)          |
|                        | `findByDeviceId(userId, deviceId)` | Find specific device             |
|                        | `touch(userId, deviceId)`  | Update `lastSeenAt`                          |
|                        | `deleteByDeviceId(userId, deviceId)` | Remove specific device         |
|                        | `deleteByUser(userId)`     | Delete all user devices                      |
| `SubscriptionRepository` | `findByUser(userId)`     | All user push subscriptions                  |
|                        | `findByEndpoint(endpoint)` | Find by push endpoint URL                    |
|                        | `deleteByEndpoint(endpoint)` | Remove by endpoint                         |
|                        | `deleteByDeviceId(deviceId)` | Cascade: remove subs for deleted device    |
|                        | `deleteByUser(userId)`     | Delete all user subscriptions                |

**Singleton access:**

```typescript
import { getUserRepository } from '@/app/repositories/user.repository';
import { getNoteRepository } from '@/app/repositories/note.repository';
import { getDeviceRepository } from '@/app/repositories/device.repository';
import { getSubscriptionRepository } from '@/app/repositories/subscription.repository';
import { getRepositoryManager } from '@/app/repositories';
```

### API Error Helpers

File: `src/app/lib/apiErrors.ts`

All return `NextResponse<ApiResponse<null>>`:

| Function | HTTP Status | Error Code |
| -------- | ----------- | ---------- |
| `apiError(code, msg, status?)` | varies | Custom code |
| `validationError(msgs, locale?)` | 400 | `VALIDATION_ERROR` |
| `unauthorizedError(locale?, key?)` | 401 | `UNAUTHORIZED` |
| `forbiddenError(locale?)` | 403 | `FORBIDDEN` |
| `notFoundError(locale?, key?)` | 404 | `NOT_FOUND` |
| `conflictError(locale?, key?)` | 409 | `CONFLICT` |
| `serverError(locale?)` | 500 | `SERVER_ERROR` |

Locale helpers:

| Function | Description |
| -------- | ----------- |
| `getRequestLocale(request)` | Reads `x-locale` header; defaults to `'ar'` |
| `serverMsg(locale, key)` | Resolves a `ServerErrorKey` from `ar.json`/`en.json` |

All message strings live in the `ServerErrors` namespace of `src/messages/{ar,en}.json`. The `locale` param defaults to `'ar'` in every helper, so callers must explicitly pass the locale returned by `getRequestLocale()` to support English clients.

### Auth Utilities

File: `src/app/lib/auth.ts`

| Function             | Description                              |
| -------------------- | ---------------------------------------- |
| `generateToken(userId)` | Creates JWT with `{ id }` payload, 7d expiry |
| `verifyToken(token)` | Returns `JwtPayload { id: string }` or throws |
| `hashPassword(password)` | bcrypt hash with 12 salt rounds       |
| `comparePassword(password, hash)` | bcrypt compare               |

### Database Connection

File: `src/app/lib/mongodb.ts`

`connectDB()` returns a cached Mongoose connection. Uses `globalThis.__mongoose` for HMR persistence in development. Options: `bufferCommands: false`, `serverSelectionTimeoutMS: 5000`.

### Web Push

File: `src/app/lib/webpush.ts`

- `sendPushNotification(subscription, payload)` → `true` on success, `false` on 410/404 (expired subscription)
- `getVapidPublicKey()` → raw VAPID public key string
- Lazy initialization — VAPID keys only checked when actually sending

---

## Client Layers

### HTTP Client

File: `src/app/lib/api.ts`

Central HTTP layer. `fetchApi<T>(path, options?)` auto-injects the JWT from `localStorage('auth-token')` into the `Authorization` header. Throws descriptive errors on non-2xx responses.

All API functions (`loginApi`, `getNotesApi`, `createNoteApi`, etc.) are thin wrappers around `fetchApi`.

### Auth Context

File: `src/app/context/AuthContext.tsx`

```typescript
interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login(email: string, password: string): Promise<void>
  register(username: string, email: string, password: string): Promise<void>
  updateUser(updated: User): void
  logout(): void
  pendingLocaleSuggestion: SupportedLocale | null
  clearLocaleSuggestion(): void
}
```

**Storage keys:** `'auth-token'` (JWT), `'auth-user-cache'` (serialized User for offline bootstrap).

`logout()` clears: auth tokens, PWA flags, IndexedDB data, and Service Worker registrations.

### Theme Context

File: `src/app/context/ThemeContext.tsx`

- Light/dark mode with system preference detection
- RTL support via `@mui/stylis-plugin-rtl` + `stylis-plugin-rtl`
- Emotion cache with RTL-aware `stylisPlugins`
- WCAG AA/AAA contrast compliance
- **Storage key:** `'theme-mode'`

### Provider Tree

File: `src/app/providers.tsx`

```text
ThemeProviderWrapper
  └── PwaActivationProvider
        └── AuthProvider
              ├── PwaRuntime  (bridges SW postMessage → custom DOM events)
              ├── children
              └── LocaleSwitchPromptDialog
```

### Config & Constants

File: `src/app/config.ts`

| Constant            | Value        | Description                    |
| ------------------- | ------------ | ------------------------------ |
| `APP_NAME_AR`       | `'ملاحظاتي'` | Arabic app name               |
| `APP_NAME_EN`       | `'My Notes'` | English app name               |
| `DEFAULT_LOCALE`    | `'ar'`       | Default locale                 |
| `SUPPORTED_LOCALES` | `['ar','en']`| Supported locales              |
| `DEFAULT_PAGE_SIZE` | `10`         | Default pagination size        |
| `MAX_PAGE_SIZE`     | `50`         | Maximum items per page         |
| `MAX_CACHED_NOTES`  | `100`        | IndexedDB cache limit          |

### TypeScript Types

File: `src/app/types.ts`

Core types used everywhere:

| Type / Interface   | Usage                                             |
| ------------------ | ------------------------------------------------- |
| `SupportedLocale`  | `'ar' \| 'en'`                                    |
| `UserLanguagePref` | `SupportedLocale \| 'unset'`                      |
| `NoteType`         | `'text' \| 'voice'`                               |
| `User`             | Client-side user (serialized, `_id` is string)    |
| `Note`             | Client-side note (serialized dates, base64 audio) |
| `Device`           | Client-side device                                |
| `IUser`            | Mongoose document (extends `Document`)             |
| `INote`            | Mongoose document                                  |
| `IDevice`          | Mongoose document                                  |
| `ISubscription`    | Mongoose document                                  |
| `ApiError`         | `{ code: string; message: string }`               |
| `ApiResponse<T>`   | `{ data?: T; message?: string; error?: ApiError }` |
| `PaginatedResult<T>` | `{ rows: T[]; count; page; totalPages }`        |
| `JwtPayload`       | `{ id: string }`                                  |

Input types: `RegisterInput`, `LoginInput`, `NoteInput`, `UpdateNoteInput`, `UpdateUserInput`, `ChangePasswordInput`.

### Offline Database (Dexie)

File: `src/app/lib/db.ts`

Three IndexedDB tables:

| Table        | Schema                                  | Purpose                          |
| ------------ | --------------------------------------- | -------------------------------- |
| `notes`      | `_id, _cachedAt`                        | Cached notes for offline reading |
| `pendingOps` | `++id, type, tempId, noteId, timestamp` | Offline mutation queue           |
| `devices`    | `_id, _cachedAt`                        | Cached trusted devices           |

Key functions:

| Function               | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `cacheNotes(notes)`    | Bulk cache notes into IndexedDB                 |
| `getCachedNotes()`     | Retrieve all cached notes                       |
| `enqueuePendingOp(op)` | Add operation to offline queue, returns `number` (ID) |
| `getPendingOps()`      | Get all pending operations                      |
| `removePendingOp(id)`  | Remove completed operation                      |
| `hasPendingOps()`      | Check if queue is non-empty                     |
| `incrementPendingOpFailure(id)` | Increment failure counter             |
| `removeCachedNote(id)` | Remove single note from cache                   |
| `cleanStaleNotes()`    | Remove notes beyond `MAX_CACHED_NOTES` limit    |
| `cacheDevices(devices)` | Bulk cache devices                             |
| `getCachedDevices()`   | Retrieve cached devices                         |
| `clearOfflineData()`   | Wipe all 3 tables (called on logout)            |

### Hooks

| Hook                    | File                       | Returns                                   |
| ----------------------- | -------------------------- | ----------------------------------------- |
| `useAuth()`             | `hooks/useAuth.ts`         | `AuthContextValue` (user, token, login, register, logout) |
| `useNotes(options?)`    | `hooks/useNotes.ts`        | Notes CRUD, pagination, offline queue + `processQueue()` |
| `useDevices()`          | `hooks/useDevices.ts`      | `devices[]`, `isTrusted`, `trustCurrent()`, `removeDevice()` |
| `usePushNotifications()` | `hooks/usePushNotifications.ts` | `PushStatus`, `subscribe()`, `unsubscribe()` |
| `useDeviceId()`         | `hooks/useDeviceId.ts`     | `DeviceIdInfo` (deviceId UUID, browser, os, name) |
| `useOfflineStatus()`    | `hooks/useOfflineStatus.ts` | `boolean` (true = online, verified via HEAD ping) |
| `useSyncStatus()`       | `hooks/useSyncStatus.ts`   | `pendingCount`, `hasPending`, `hasFailures`, `refresh()` |
| `usePwaStatus()`        | `hooks/usePwaStatus.ts`    | `SwState`, `InstallState`, `isReady`, `triggerInstall()` |

---

## Models / Schema Reference

### User (`users` collection)

| Field         | Type     | Constraints                          |
| ------------- | -------- | ------------------------------------ |
| `username`    | String   | Required, unique, trim, 3–30 chars   |
| `email`       | String   | Required, unique, trim, lowercase    |
| `password`    | String   | Required, min 6 chars (bcrypt hash)  |
| `displayName` | String   | Optional, trim, max 50 chars         |
| `language`    | String   | Enum: `'ar'`, `'en'`, `'unset'` (default: `'unset'`) |
| `createdAt`   | Date     | Auto (timestamps)                    |
| `updatedAt`   | Date     | Auto (timestamps)                    |

### Note (`notes` collection)

| Field          | Type       | Constraints                                        |
| -------------- | ---------- | -------------------------------------------------- |
| `title`        | String     | Required, trim, 1–200 chars                        |
| `content`      | String     | Optional, trim (text notes)                        |
| `audioData`    | Buffer     | Optional (voice notes — base64 encode for API)     |
| `audioDuration` | Number    | Optional, min 0 (voice notes)                      |
| `type`         | String     | Required, enum: `'text'`, `'voice'`                |
| `user`         | ObjectId   | Required, ref: User                                |
| `createdAt`    | Date       | Auto (timestamps)                                  |
| `updatedAt`    | Date       | Auto (timestamps)                                  |

**Indexes:** `{ user: 1, createdAt: -1 }`, `{ user: 1, type: 1 }`, `{ title: 'text', content: 'text' }`

**Pre-save hook:** Validates type/audioData consistency — voice notes must have audioData, text notes must not.

### Device (`devices` collection)

| Field        | Type     | Constraints                                  |
| ------------ | -------- | -------------------------------------------- |
| `user`       | ObjectId | Required, ref: User                          |
| `deviceId`   | String   | Required (client-generated UUID)             |
| `name`       | String   | Optional, trim (human-readable device name)  |
| `browser`    | String   | Optional, trim (auto-detected)               |
| `os`         | String   | Optional, trim (auto-detected)               |
| `lastSeenAt` | Date     | Default: `Date.now`                          |
| `createdAt`  | Date     | Auto (timestamps, `updatedAt: false`)        |

**Indexes:** `{ user: 1 }`, `{ user: 1, deviceId: 1 }` (unique)

### Subscription (`subscriptions` collection)

| Field        | Type     | Constraints                          |
| ------------ | -------- | ------------------------------------ |
| `user`       | ObjectId | Required, ref: User                  |
| `endpoint`   | String   | Required, unique                     |
| `keys.p256dh` | String  | Required                             |
| `keys.auth`  | String   | Required                             |
| `deviceId`   | String   | Optional, indexed (link to Device)   |
| `deviceInfo` | String   | Optional, trim                       |
| `createdAt`  | Date     | Auto (timestamps, `updatedAt: false`)|

**Indexes:** `{ user: 1 }`, `endpoint` (unique)

---

## Testing Architecture

All 573 tests live in `src/app/tests/` (flat structure — no subdirectories).

Config: `vitest.config.ts` — jsdom environment, `@vitejs/plugin-react`, setup at `src/app/tests/setup.ts`.

| Test File                        | Strategy           | Targets                                    |
| -------------------------------- | ------------------ | ------------------------------------------ |
| `apiClient.test.ts`             | Unit               | `lib/api.ts` fetch wrapper + all API fns   |
| `deviceApi.test.ts`             | Unit               | Device API client functions                |
| `devicesRoute.test.ts`          | Integration        | `/api/devices` route handler               |
| `validators.test.ts`            | Unit               | All 6 validators                           |
| `types.test.ts`                 | Unit               | Type guards / type consistency             |
| `config.test.ts`                | Unit               | Config constants                           |
| `noteUtils.test.ts`             | Unit               | Note utility functions                     |
| `audioUtils.test.ts`            | Unit               | Audio encoding/decoding utilities          |
| `warmUpCache.test.ts`           | Unit               | Cache warming logic                        |
| `useAuth.test.tsx`              | Hook               | Auth hook (login, register, logout flows)  |
| `useNotes.test.ts`              | Hook               | Notes CRUD + offline queue + pagination    |
| `useDevices.test.ts`            | Hook               | Device trust/removal                       |
| `useDeviceId.test.ts`           | Hook               | UUID generation + browser/OS detection     |
| `useOfflineStatus.test.ts`      | Hook               | Connectivity detection                     |
| `useSyncStatus.test.ts`         | Hook               | Pending ops tracking                       |
| `usePwaStatus.test.ts`          | Hook               | SW state + install state                   |
| `ThemeContext.test.tsx`          | Context            | Theme provider + dark/light mode           |
| `login.test.tsx`                | Component          | Login page form + validation               |
| `register.test.tsx`             | Component          | Register page form + validation            |
| `NotesPage.test.tsx`            | Component          | Notes list page (pagination, filter)       |
| `NewNotePage.test.tsx`          | Component          | Create note form                           |
| `NoteDetailPage.test.tsx`       | Component          | Note detail view                           |
| `EditNotePage.test.tsx`         | Component          | Edit note form                             |
| `NoteCard.test.tsx`             | Component          | Note card display                          |
| `NoteList.test.tsx`             | Component          | Notes list rendering                       |
| `NoteEditorForm.test.tsx`       | Component          | Rich text editor form                      |
| `ProfilePage.test.tsx`          | Component          | Profile page                               |
| `ProfileEditor.test.tsx`        | Component          | Profile editor form                        |
| `AppBar.test.tsx`               | Component          | App bar navigation                         |
| `SideBar.test.tsx`              | Component          | Sidebar navigation                         |
| `PrivateRoute.test.tsx`         | Component          | Auth route guard                           |
| `DeleteConfirmDialog.test.tsx`  | Component          | Delete confirmation dialog                 |
| `DeleteAccountDialog.test.tsx`  | Component          | Account deletion dialog                    |
| `ConnectionIndicator.test.tsx`  | Component          | Online/offline indicator                   |
| `OfflineBanner.test.tsx`        | Component          | Offline mode banner                        |
| `LanguageToggle.test.tsx`       | Component          | AR/EN language switch                      |
| `ThemeToggle.test.tsx`          | Component          | Dark/light theme toggle                    |
| `PwaActivationDialog.test.tsx`  | Component          | PWA activation prompt                      |
| `offlineLogout.test.tsx`        | Integration        | Logout while offline                       |

Support files: `setup.ts` (global test setup), `utils.tsx` (test utilities / render helpers).

---

## Data Flow Examples

### 1. Create Note (Online)

```text
User types note in <NoteEditorForm> → clicks Save
    │
    ▼
useNotes().createNote({ title, content, type: 'text' })
    │
    ├── isOnline? YES
    │       │
    │       ▼
    │   createNoteApi(input)                   [lib/api.ts]
    │       │
    │       ▼
    │   fetchApi('/api/notes', { method: 'POST', body })
    │       │  Authorization: Bearer <jwt>
    │       ▼
    │   POST /api/notes                        [api/notes/route.ts]
    │       │
    │       ├── authenticateRequest(req) → { userId }
    │       ├── validateNoteInput(body) → [] (valid)
    │       ├── connectDB()
    │       ├── getNoteRepository().create({ ...body, user: userId })
    │       │       │
    │       │       ▼
    │       │   NoteRepository.create()        [base.repository.ts]
    │       │       │
    │       │       ▼
    │       │   new Note(data).save()          [Mongoose → MongoDB]
    │       │
    │       └── NextResponse.json({ data: serializedNote }, { status: 201 })
    │
    ▼
useNotes updates local state → UI re-renders with new note
```

### 2. Create Note (Offline → Sync)

```text
User types note in <NoteEditorForm> → clicks Save
    │
    ▼
useNotes().createNote({ title, content, type: 'text' })
    │
    ├── isOnline? NO
    │       │
    │       ▼
    │   Generate tempId (crypto.randomUUID)
    │   enqueuePendingOp({                     [lib/db.ts → Dexie]
    │     type: 'create',
    │     tempId,
    │     payload: { title, content, type },
    │     noteTitle: title,
    │     timestamp: Date.now()
    │   })
    │       │
    │       ▼
    │   Add optimistic note to local state (with tempId as _id)
    │   SW registers Background Sync tag 'notes-sync'
    │
    ▼
... time passes, device comes back online ...
    │
    ▼
useNotes().processQueue()              (triggered by online event)
    │
    ├── getPendingOps()                        [lib/db.ts]
    │       │
    │       ▼
    │   For each op where op.type === 'create':
    │       ├── createNoteApi(op.payload)      [lib/api.ts → POST /api/notes]
    │       ├── On success → removePendingOp(op.id)
    │       └── On failure → incrementPendingOpFailure(op.id)
    │
    ▼
fetchNotes() → refresh full list from server → update local state
```

### 3. Login → Push Notification

```text
User submits login form
    │
    ▼
useAuth().login(email, password)
    │
    ▼
loginApi({ email, password })                  [lib/api.ts]
    │
    ▼
POST /api/auth/login                           [api/auth/login/route.ts]
    │
    ├── validateLoginInput(body) → [] (valid)
    ├── connectDB()
    ├── getUserRepository().findByEmail(email)
    ├── comparePassword(password, hash)
    ├── generateToken(userId) → jwt
    │
    ├── Fire-and-forget: notifyOtherDevices(userId)
    │       │
    │       ▼
    │   getSubscriptionRepository().findByUser(userId)
    │   For each subscription (excluding current device):
    │       sendPushNotification(sub, {        [lib/webpush.ts]
    │         title: 'تسجيل دخول جديد',
    │         body: 'تم تسجيل الدخول من جهاز آخر'
    │       })
    │       If sendPush returns false (410) → deleteByEndpoint(sub.endpoint)
    │
    └── NextResponse.json({ data: { token, user } })
    │
    ▼
AuthContext stores token in localStorage('auth-token')
AuthContext stores user in localStorage('auth-user-cache')
    │
    ▼
If device is trusted (usePwaStatus.isReady):
    usePushNotifications().subscribe()
        │
        ▼
    SW: self.registration.pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC })
        │
        ▼
    subscribePushApi(subscription)             [POST /api/push/subscribe]
        │
        ▼
    getSubscriptionRepository().create({ user, endpoint, keys, deviceId })
```

---

## Deployment and container runtime

Runtime is a **Next.js standalone** Node server (`node server.js`, port `3000` by default). The production image is built from the multi-stage `Dockerfile` at the repo root (`output: 'standalone'` in `next.config.mjs`).

| Mode | What runs | Notes |
| ---- | --------- | ----- |
| **Docker Compose** | `app` service (image built from `Dockerfile`) + **MongoDB 7** | `DATABASE_URL` points at `mongo` service; optional `uploads` volume for `STORAGE_TYPE=local`. |
| **GHCR image** | Same standalone server in a minimal Alpine-based image | Supply MongoDB (e.g. Atlas) and all secrets via `-e` / orchestrator env; health: `GET /api/health`. |
| **Heroku** | `npm start` on the platform | No container registry involved; config vars only. |

CI publishes the container image with **`.github/workflows/docker-publish.yml`**: lint, tests, `docker:check`, full `next build`, **Trivy** image scan, then push to **`ghcr.io/<lowercase-github-owner>/web-notes-e1`** with tags `v*`, `sha-*`, and `latest` on tag pushes. Operational detail (pull/run, PowerShell, troubleshooting) lives in **[../deployment.md](../deployment.md)** (section 9).
