# My Notes (ملاحظاتي) — AI Project Guide

## Identity

| Property       | Value                                                   |
| -------------- | ------------------------------------------------------- |
| App Name       | My Notes (ملاحظاتي)                                    |
| Framework      | Next.js 16 (App Router)                                 |
| Language        | TypeScript (strict mode)                                |
| UI Library     | MUI 7 + Emotion (full RTL via `stylis-plugin-rtl`)      |
| Database       | MongoDB via Mongoose 9                                  |
| Auth           | JWT (7-day expiry, bcrypt 12 rounds)                    |
| API Style      | REST (Next.js Route Handlers)                           |
| Rich Text      | TipTap 3 (text notes)                                   |
| PWA            | @serwist/next 9 + Dexie 4 (IndexedDB)                  |
| Push           | VAPID Web Push (web-push library)                       |
| i18n           | next-intl 4 (Arabic + English, locale-prefixed routing) |
| Testing        | Vitest 4 + Testing Library — **573 tests** in 39 files  |
| Deployment     | Heroku (Node.js buildpack)                              |
| Node           | >= 20.x, npm >= 10.x                                   |

## AI Documentation Index

| Document                                    | Purpose                                           |
| ------------------------------------------- | ------------------------------------------------- |
| [architecture.md](architecture.md)          | Layer diagram, patterns, data flows, model schemas |
| [feature-guide.md](feature-guide.md)        | Step-by-step guide to add a new entity end-to-end |
| [../database-abstraction.md](../database-abstraction.md) | Repository Pattern deep-dive             |
| [../api-endpoints.md](../api-endpoints.md)  | All 18 REST endpoints reference                   |
| [../pwa-guide.md](../pwa-guide.md)          | Service Worker, offline sync, Web Push            |
| [../testing.md](../testing.md)              | Test architecture and patterns                    |
| [../tutorials/README.md](../tutorials/README.md) | Educational tutorials index (Arabic, 13 lessons) |

## Critical Rules

These are non-negotiable architectural constraints. **Never violate them.**

1. **All database access goes through repositories** — never import Mongoose models directly in route handlers. Use `getUserRepository()`, `getNoteRepository()`, etc.
2. **Auth via `authenticateRequest()`** — every protected route must call this function first and return early on `auth.error`.
3. **Validators return `string[]`** — empty array means valid, non-empty means the array contains Arabic error messages. Always check `.length` before proceeding.
4. **API errors via `apiErrors.ts` helpers** — use `validationError()`, `unauthorizedError()`, `notFoundError()`, etc. Never construct raw `NextResponse.json()` error bodies manually.
5. **User-facing strings are Arabic** — all error messages, validation messages, and UI text default to Arabic. The i18n system handles translations; never hardcode English user-facing strings.
6. **Singletons for repositories** — each repository file exports a `get*Repository()` function that returns a cached singleton. Never instantiate repositories with `new`.
7. **`reloadOnOnline: false` in Serwist config is critical** — enabling it causes `window.location.reload()` before React can flush the IndexedDB offline queue, silently losing pending operations.
8. **PWA activation is opt-in per device** — the Service Worker only registers on explicitly trusted devices. This is the "Zero PWA Footprint" pattern enforced by `PwaActivationContext`.
9. **`@/*` path alias maps to `./src/*`** — all imports use this alias (e.g., `@/app/types`, `@/app/lib/auth`).
10. **CJS config files** — `next.config.mjs` and `eslint.config.mjs` use `.mjs` extensions; `vitest.config.ts` uses TypeScript.

## Key File Locations

### Server

```
src/app/
├── config.ts                          # App constants (locale, pagination, offline limits)
├── types.ts                           # ALL shared TypeScript types and interfaces
├── providers.tsx                      # Provider tree: Theme → PwaActivation → Auth
├── layout.tsx                         # Root layout (minimal — delegates to [locale]/layout.tsx)
├── models/
│   ├── User.ts                        # User schema (username, email, password, displayName, language)
│   ├── Note.ts                        # Note schema (title, content, audioData, type, user)
│   ├── Device.ts                      # Device schema (user, deviceId, name, browser, os)
│   └── Subscription.ts               # Push subscription schema (user, endpoint, keys, deviceId)
├── repositories/
│   ├── repository.interface.ts        # IRepository<T> interface contract
│   ├── base.repository.ts            # BaseRepository<T> — generic CRUD (findAll, findPaginated, create, update, delete)
│   ├── user.repository.ts            # findByEmail, findByUsername, deleteUserCascade (transaction)
│   ├── note.repository.ts            # findByUser, findByUserPaginated, findByType, search
│   ├── device.repository.ts          # findByDeviceId, touch, deleteByDeviceId
│   ├── subscription.repository.ts    # findByEndpoint, deleteByEndpoint, deleteByDeviceId
│   └── index.ts                       # RepositoryManager singleton (.user, .note, .subscription)
├── validators/
│   └── index.ts                       # All 6 validators: register, login, note, updateNote, updateUser, changePassword
├── middlewares/
│   └── auth.middleware.ts             # authenticateRequest() → AuthResult (AuthSuccess | AuthFailure)
├── lib/
│   ├── mongodb.ts                     # connectDB() — singleton Mongoose connection with HMR cache
│   ├── auth.ts                        # generateToken, verifyToken, hashPassword, comparePassword
│   ├── apiErrors.ts                   # apiError, validationError, unauthorizedError, forbiddenError, notFoundError, conflictError, serverError
│   ├── api.ts                         # Client HTTP layer — fetchApi, loginApi, registerApi, getNotesApi, etc.
│   ├── db.ts                          # Dexie database — offline cache (notes, pendingOps, devices tables)
│   └── webpush.ts                     # Server-only VAPID setup + sendPushNotification()
├── api/                               # Next.js Route Handlers (REST endpoints)
│   ├── health/route.ts                # GET + HEAD /api/health
│   ├── auth/
│   │   ├── register/route.ts          # POST /api/auth/register
│   │   ├── login/route.ts             # POST /api/auth/login
│   │   ├── me/route.ts               # GET /api/auth/me
│   │   └── logout/route.ts           # POST /api/auth/logout
│   ├── notes/
│   │   ├── route.ts                   # GET + POST /api/notes
│   │   └── [id]/route.ts             # GET + PUT + DELETE /api/notes/[id]
│   ├── users/[id]/route.ts           # PUT + DELETE /api/users/[id]
│   ├── devices/route.ts              # GET + POST + DELETE /api/devices
│   └── push/
│       ├── subscribe/route.ts         # POST + DELETE /api/push/subscribe
│       └── send/route.ts             # POST /api/push/send
├── context/
│   ├── AuthContext.tsx                # AuthProvider — JWT + user state, login/register/logout
│   └── ThemeContext.tsx               # ThemeProviderWrapper — MUI dark/light + RTL
└── hooks/
    ├── useAuth.ts                     # Shortcut to AuthContext
    ├── useNotes.ts                    # Notes CRUD + offline queue + pagination
    ├── useDevices.ts                  # Device trust/removal
    ├── usePushNotifications.ts        # Push subscribe/unsubscribe
    ├── useDeviceId.ts                 # Client UUID + browser/OS detection
    ├── useOfflineStatus.ts            # Two-layer connectivity (browser events + HEAD ping)
    ├── useSyncStatus.ts               # Pending offline ops count
    └── usePwaStatus.ts                # SW state + install state
```

### Client Pages

```
src/app/[locale]/
├── layout.tsx                         # Locale layout (HTML lang/dir, fonts, MUI Emotion cache, Providers)
├── page.tsx                           # Landing / dashboard
├── not-found.tsx                      # 404 page
├── login/page.tsx                     # Login form
├── register/page.tsx                  # Register form
├── profile/page.tsx                   # Profile editor
└── notes/
    ├── page.tsx                       # Notes list (with search, filter, pagination)
    ├── new/page.tsx                   # Create note (text or voice)
    └── [id]/
        ├── page.tsx                   # View note detail
        └── edit/page.tsx              # Edit note
```

## REST Operations Reference

| #  | Method   | Endpoint                | Auth | Description                    |
| -- | -------- | ----------------------- | ---- | ------------------------------ |
| 1  | `POST`   | `/api/auth/register`    | No   | Register new user              |
| 2  | `POST`   | `/api/auth/login`       | No   | Login, get JWT                 |
| 3  | `GET`    | `/api/auth/me`          | Yes  | Get current user profile       |
| 4  | `POST`   | `/api/auth/logout`      | Yes  | Logout (client-side cleanup)   |
| 5  | `GET`    | `/api/notes`            | Yes  | List notes (paginated, filterable) |
| 6  | `POST`   | `/api/notes`            | Yes  | Create note (text or voice)    |
| 7  | `GET`    | `/api/notes/[id]`       | Yes  | Get single note                |
| 8  | `PUT`    | `/api/notes/[id]`       | Yes  | Update note                    |
| 9  | `DELETE` | `/api/notes/[id]`       | Yes  | Delete note                    |
| 10 | `PUT`    | `/api/users/[id]`       | Yes  | Update user profile            |
| 11 | `DELETE` | `/api/users/[id]`       | Yes  | Delete account (cascade)       |
| 12 | `GET`    | `/api/devices`          | Yes  | List trusted devices           |
| 13 | `POST`   | `/api/devices`          | Yes  | Trust current device           |
| 14 | `DELETE` | `/api/devices`          | Yes  | Remove a trusted device        |
| 15 | `POST`   | `/api/push/subscribe`   | Yes  | Save push subscription         |
| 16 | `DELETE` | `/api/push/subscribe`   | Yes  | Remove push subscription       |
| 17 | `POST`   | `/api/push/send`        | Yes  | Send push to user's devices    |
| 18 | `GET`    | `/api/health`           | No   | Health check (+ `HEAD`)        |

See [../api-endpoints.md](../api-endpoints.md) for full request/response schemas.

## Test Commands

```bash
npm test               # Run all 573 tests once
npm run test:watch     # Run in watch mode
npm run test:coverage  # Run with coverage report
npm run lint           # ESLint check (src/)
npm run format:check   # Prettier check
npm run validate       # Full validation workflow
npm run smoke          # HTTP smoke tests against running server
```

Test configuration: `vitest.config.ts` — jsdom environment, `@vitejs/plugin-react`, setup file at `src/app/tests/setup.ts`, all tests in `src/app/tests/**/*.test.{ts,tsx}`.

## Environment Variables

| Variable                         | Required | Default                              | Description                          |
| -------------------------------- | -------- | ------------------------------------ | ------------------------------------ |
| `DATABASE_URL`                   | Yes      | `mongodb://localhost:27017/mynotes`  | MongoDB connection string            |
| `JWT_SECRET`                     | Yes      | `default_secret_change_in_production`| Secret for JWT signing               |
| `NODE_ENV`                       | No       | `development`                        | `development` / `production` / `test`|
| `PORT`                           | No       | `3000`                               | Server port                          |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`   | For Push | —                                    | VAPID EC public key (URL-safe base64)|
| `VAPID_PRIVATE_KEY`              | For Push | —                                    | VAPID EC private key                 |
| `VAPID_EMAIL`                    | For Push | `mailto:admin@example.com`           | Contact email for push service       |
| `NEXT_PUBLIC_SW_DISABLED`        | No       | —                                    | Set `false` to enable SW in dev      |

See `.env.example` for a copy-paste template.
