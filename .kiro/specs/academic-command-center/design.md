# Design — F.I.S.H. Scholar Academic Command Center

Status: Draft · Implements: `requirements.md` · Constrained by: `.kiro/steering/*`

## 1. Overview

We evolve the existing React 19 + Vite + Tailwind prototype (see `CURRENT_STATE.md`) by adding
three things without rewriting the app:

1. A **persistence layer** behind a repository interface (IndexedDB now, backend later).
2. New **domain entities** — chiefly `Discussion` / `DiscussionResponse`, plus `WeekModule`,
   `Assessment`, `Reading`, `CalendarEvent`, `Notification`, `AIProvider`, `NotionSyncRecord`.
3. A **provider/integration seam** — AI provider abstraction (server-side) and a Notion proxy.

The existing 7-tab UI and type system are retained and extended. All changes are additive.

## 2. Architecture

```
                         ┌─────────────────────────────────────────┐
   Components (src/)     │ TodayView · CoursesView · Assignments…   │  presentational + view logic
                         └───────────────┬─────────────────────────┘
                                         │ props / callbacks
                         ┌───────────────▼─────────────────────────┐
   State (src/state/)    │ AppStore (React context + hooks)         │  orchestrates entities,
                         │  - selectors: dueToday, dueThisWeek,     │  derived views, actions
                         │    workloadByCourse, replyProgress       │
                         └───────────────┬─────────────────────────┘
                                         │ Repository interface
                         ┌───────────────▼─────────────────────────┐
   Data (src/data/)      │ Repository<T> (CRUD contract)            │  the ONLY data boundary
                         │  ├─ IndexedDbRepository (now)            │
                         │  └─ (future) ApiRepository → backend     │
                         └───────────────┬─────────────────────────┘
                                         │ HTTP /api/* (AI, Notion) — server-side keys only
                         ┌───────────────▼─────────────────────────┐
   Server (server.ts)    │ AI provider abstraction  · Notion proxy  │
                         │  ├─ GeminiAdapter                        │
                         │  └─ AnimeAiAdapter (inert placeholder)   │
                         └──────────────────────────────────────────┘
```

**Key rule:** components never touch storage or AI directly. They call the state layer; the
state layer calls the repository; AI/Notion go through `/api/*`. This keeps storage and provider
choices swappable (steering: architecture, security).

## 3. Persistence layer

### 3.1 Repository contract
A single generic interface used by the state layer:

```ts
interface Repository {
  getAll<T extends Entity>(collection: Collection): Promise<T[]>;
  get<T extends Entity>(collection: Collection, id: string): Promise<T | undefined>;
  put<T extends Entity>(collection: Collection, entity: T): Promise<T>;      // create or update
  bulkPut<T extends Entity>(collection: Collection, entities: T[]): Promise<void>;
  remove(collection: Collection, id: string): Promise<void>;
  clearDemo(): Promise<void>;   // one-click demo removal (R12)
  exportAll(): Promise<Snapshot>;
  importAll(snapshot: Snapshot): Promise<void>;
}
```

- `Collection` is an enum: `institutions | courses | weekModules | assignments | discussions |
  discussionResponses | readings | assessments | citations | notes | calendarEvents |
  notifications | notionSyncRecords | settings`.
- `Entity` base: `{ id: string; createdAt: string; updatedAt: string; isDemo?: boolean }`.

### 3.2 IndexedDB implementation
- One IndexedDB database `fish-scholar`, one object store per collection, keyed by `id`.
- A `meta` store holds `schemaVersion`. On version bump, run additive migrations; **never** drop
  user data (steering: architecture).
- Small, dependency-light wrapper (no heavy ORM) to keep the bundle lean. A thin promise-based
  helper around the native IndexedDB API.
- Writes are awaited before returning to the caller so a refresh cannot lose a just-made change
  (R1.1).

### 3.3 App bootstrap & seeding
- On first load with an empty DB, seed the Fall 2026 structure (3 courses) plus a small,
  clearly-labeled `isDemo: true` sample set so the UI has something to show. Real fields that
  aren't known (titles, professors) are left blank/editable (R2.2, R12).
- `clearDemo()` removes every `isDemo` record in one action and is exposed in Settings.

## 4. Domain model changes (`src/types.ts`)

Add (extending, not replacing, existing types):

- **Base:** add `createdAt`, `updatedAt`, optional `isDemo` to persisted entities.
- **Semester** `{ id, institutionId, name, term, year, startDate?, endDate? }`.
- **WeekModule** `{ id, courseId, index, title?, overview?, objectives?[], status }`.
- **Discussion** `{ id, courseId, weekModuleId?, title, prompt?, professorInstructions?,
  initialPostDeadline?, responseDeadline?, wordCountRequirement?, citationRequirement?,
  minResponses, status, originalPost: OriginalPost }`.
- **OriginalPost** `{ status: 'not_started'|'drafting'|'ready'|'submitted', draft?, finalText?,
  submittedAt?, wordCount?, sourcesUsed?: string[] }`.
- **DiscussionResponse** `{ id, discussionId, classmateName, classmatePostTopic?, drafted,
  submitted, submittedAt?, wordCount?, citationsUsed?: string[], followUpRequired, notes? }`.
- **Assessment** (test/quiz) `{ id, courseId, weekModuleId?, name, type, date?, time?,
  coverage?[], studyStatus, score?, notes? }`.
- **Reading** `{ id, courseId, weekModuleId?, assignmentId?, title, author?, publication?, year?,
  doi?, url?, required, status, pages?, notes?, apaCitation?, verified?: boolean }`.
- **CalendarEvent** `{ id, courseId?, kind, title, date, time?, sourceEntityId? }`.
- **Notification** `{ id, ruleId?, entityId, message, dueOffsetDays?, read, createdAt }`.
- **AIProvider** `{ id, provider, model, endpoint?, enabledFeatures[], configured }` (no key on
  client).
- **NotionSyncRecord** `{ id, externalId, localEntityId?, collection, source, lastSyncedAt,
  syncDirection, conflictStatus }`.
- Extend **Assignment** with `type`, `status` (superset per R3.2), `percentComplete` (derived),
  `submittedAt?`, `grade?`, `professorFeedback?` (already partially present).

## 5. Derived selectors (state layer)

Pure functions (unit-tested with Vitest):

- `dueToday(now, entities)` → assignments/discussions/replies/readings/tests due today + overdue.
- `dueThisWeek(now, entities)` → grouped by course for the current week.
- `replyProgress(discussion, responses)` → `{ required, completed, remaining, followUps }`
  (drives "X / N", "N remaining", "may warrant follow-up" — R4.4/4.5).
- `workloadForCourse(course, entities, now)` → transparent score → Light/Moderate/Heavy/Critical
  from counts, estimated effort, due proximity, incompleteness (R5.3). The rationale is
  displayed, not hidden (steering: priority engine is transparent).
- `recommendedNextAction(entities, now)` → single Start-Here suggestion (R5.4).

## 6. UI changes

- **New Discussions view / tracker** (or a section within Courses) implementing R4: original
  post status + peer-response list + "X/N replies" + follow-up flags, all keyboard-accessible,
  status shown with text+icon (accessibility steering).
- **Quick Add** modal reachable from a persistent "+" (R6), minimal fields, type selector.
- **Today / This Week** rewired to read from persisted data and the new selectors; add workload
  indicators and a Start-Here card.
- **Settings**: demo-data removal, AI provider selection, Notion connection (read-only first),
  accessibility toggles, export/import.
- All new UI follows `accessibility.md`; status never color-only; modals trap/restore focus.

## 7. AI provider abstraction (server)

- Define a server-side `AIProviderAdapter` interface: `generate(request): Promise<AIResult>`
  plus capability flags. Route existing `/api/gemini/*` handlers through a `GeminiAdapter`.
- Add an `AnimeAiAdapter` **placeholder** that reads `ANIME_AI_BASE_URL` / `ANIME_AI_API_KEY` /
  `ANIME_AI_MODEL` but is **inert** (returns "not configured") until real API docs are provided
  — we do not invent endpoints (R8.3).
- **Integrity fix:** rework fallbacks so they never present fabricated citations/DOIs/professors
  as verified. Fallbacks either return clearly-labeled `unverified` suggestions or an honest
  "unavailable" state (R9, academic-integrity steering).
- Provider selection is server-driven from configured env vars; the client only sees
  capability/label metadata, never keys (R8.2, security steering).

## 8. Notion integration (server proxy, read-only first)

- `/api/notion/*` endpoints use a server-side `NOTION_API_KEY`. Phase: **read-only** list/preview
  → mapping config → confirmed import with dedupe via `NotionSyncRecord.externalId`.
- Conflicts are surfaced, never auto-resolved; two-way sync is opt-in and later (R7, security).
- Notion-unreachable and AI-unavailable produce the exact non-destructive messages in R7.6/R8.4.

## 9. Testing strategy

- **Vitest** unit tests for selectors (due-date math, `replyProgress`, `workloadForCourse`,
  dedupe) and the repository contract (via an in-memory fake).
- Light component tests for the discussion tracker counts and Quick Add persistence.
- `tsc --noEmit` remains the type gate. Kiro hooks add secret/`.env` scanning and type-check on
  change (see `tasks.md` / `.kiro/hooks`).

## 10. Rollout / phasing

Follows `tasks.md`. M1 = persistence + entities + discussions + Today/This Week + Quick Add +
naming/integrity fixes + tests/hooks. Notion and full Ask-FISH follow M1. Each phase is a
small, reviewable, additive commit on `feat/academic-command-center`.
