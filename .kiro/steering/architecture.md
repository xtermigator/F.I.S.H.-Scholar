# F.I.S.H. Scholar — Architecture Steering

> How the code is organized and the rules for changing it. See `CURRENT_STATE.md` at the repo
> root for the full audit that motivated this architecture.

## Stack (retain — do not rewrite)

- **Frontend:** React 19 + TypeScript 5.8, built with **Vite 6**, styled with **Tailwind CSS 4**
  (`@tailwindcss/vite`). Icons via `lucide-react`, animation via `motion`.
- **Backend:** a thin **Express 4** server (`server.ts`) that (a) serves the Vite app and
  (b) proxies AI calls so provider API keys stay server-side. Run via `tsx` in dev; bundled
  with `esbuild` for prod.
- **Package manager:** `bun`.
- **Path alias:** `@/*` → repo root (see `tsconfig.json`).

The React 19 + Vite + Tailwind + Express-AI-proxy foundation is modern and healthy. Work is
**additive**: data layer, entities, integrations, auth. Do not migrate frameworks without a
documented, compelling reason.

## Layering

```
UI components (src/components/*)      ← presentational + view logic, no direct storage/AI calls
        │  props / callbacks
App state + hooks (src/state/*)       ← orchestrates entities, selection, derived views
        │
Repository interface (src/data/repo) ← the ONLY way the app reads/writes persistent data
        │                               (swap the implementation, not the callers)
Persistence adapter                   ← IndexedDB now; a backend DB + auth later
        │
Server API (server.ts /api/*)         ← AI provider proxy, Notion proxy, (future) auth
        │
AI provider abstraction (server)      ← Gemini adapter, Anime AI adapter, others
```

### Rules
- **Never call storage or fetch AI directly from a component.** Go through the repository /
  state layer (data) and the server API (AI/Notion). This keeps the persistence and provider
  choices swappable — a core product requirement (no lock-in, future backend).
- **The repository interface is the contract.** The first implementation is IndexedDB-backed
  and runs entirely client-side (private, zero hosting cost, survives refresh). It must be
  replaceable by a server + real DB implementation **without changing UI code**.
- **All AI access is server-side** through `/api/*`. Client code never holds an AI key. Every
  AI endpoint must keep a graceful fallback so one failing integration cannot crash the
  dashboard (see `security.md` and `academic-integrity.md`).
- **One failing integration must not crash the app.** Notion down, AI down, or a bad response
  must degrade gracefully with a clear, non-destructive message.

## Data model (target)

Core entities (implement only what a phase needs; don't create empty tables):

```
Institution ─< Course ─< WeekModule ─< { Assignment, Discussion, Reading, Assessment }
Course  >── Semester
Course  >── Instructor
Assignment ─< AssignmentTask (checklist) ─< DraftVersion
Assignment >──< ResearchSource / Citation   (many-to-many)
Discussion ─< DiscussionResponse             (peers, required vs completed replies, follow-up)
Assessment ── Grade (optional)
CalendarEvent · Notification · Note · Document
Integration ─< NotionSyncRecord              (source, lastSynced, direction, conflict)
AIProvider · AIConversation
```

Existing types in `src/types.ts` (`Institution`, `Course`, `Assignment`, `Citation`,
`AcademicMemoryNode`, `AuthorshipDossier`, `StudentProfile`) are sound — extend them, don't
replace them.

## Persistence conventions

- Every stored entity carries a stable `id`, plus `createdAt` / `updatedAt`.
- Entities that can originate from an external system (e.g. Notion) carry sync metadata:
  `source`, `externalId`, `lastSyncedAt`, `syncDirection`, `conflictStatus`.
- Demo/sample records carry an explicit `isDemo: true` flag so they can be listed and removed
  in one action.
- Migrations: bump a `schemaVersion`; never silently drop user data on a schema change.

## Testing & tooling

- `bun run lint` = `tsc --noEmit` (type safety is the baseline check).
- Add **Vitest** for pure logic (due-date math, discussion-reply counts, workload scoring,
  dedupe). Keep DOM tests light and focused on critical flows.
- Kiro hooks guard the repo (secret/`.env` scan, type-check). See `.kiro/hooks`.

## Naming & metadata hygiene

- Product name is **F.I.S.H. Scholar** everywhere (UI, prompts, comments). Remove all
  "TrueSelf Scholar" references.
- Fix placeholder project metadata (`package.json` `name`/`version`) when convenient.
