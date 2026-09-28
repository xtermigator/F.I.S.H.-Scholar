# Tasks — F.I.S.H. Scholar Academic Command Center

Implements `design.md` / `requirements.md`. Tasks are ordered; **M1** = first milestone.
Each task lists the requirements it satisfies. Work happens on `feat/academic-command-center`.

## Milestone 1 — Usable command center (persistence + discussions + dashboards)

- [ ] **T1. Extend domain types** _(R2–R6, R8, R9)_
  - Add base `createdAt`/`updatedAt`/`isDemo`; add `Semester`, `WeekModule`, `Discussion`,
    `OriginalPost`, `DiscussionResponse`, `Assessment`, `Reading`, `CalendarEvent`,
    `Notification`, `AIProvider`, `NotionSyncRecord`; extend `Assignment` status/type.

- [ ] **T2. Persistence layer** _(R1)_
  - `Repository` interface + `IndexedDbRepository` + `meta`/`schemaVersion` + awaited writes.
  - `clearDemo()`, `exportAll()`, `importAll()`.
  - Unit-test against an in-memory fake repository.

- [ ] **T3. App store + selectors** _(R5)_
  - React context store that loads from the repository on boot and persists on change.
  - Pure selectors: `dueToday`, `dueThisWeek`, `replyProgress`, `workloadForCourse`,
    `recommendedNextAction`. Unit-tested.

- [ ] **T4. Seed / demo data reconciliation** _(R2, R12, R9)_
  - Fall 2026; MSU `ED 9413`, UF `FYC 6234`, CUNY `DSAB 629`; blank professor/title fields.
  - Sample records flagged `isDemo: true`; no fabricated DOIs/citations shown as verified.

- [ ] **T5. Wire existing views to persistence** _(R1–R3)_
  - Replace in-memory `useState` seeds in `App.tsx` with the store; keep current UX working.

- [ ] **T6. Discussion & peer-response tracker** _(R4)_ — highest priority
  - Create/edit discussions; original-post status; peer-response records; "X / N replies",
    "N remaining", follow-up flags; generate follow-up task. Status by text+icon.

- [ ] **T7. Today / This Week + workload + Start Here** _(R5)_
  - Rewire dashboards to selectors; per-course Light/Moderate/Heavy/Critical with visible
    rationale; single recommended next action.

- [ ] **T8. Quick Add** _(R6)_
  - Universal "+"; minimal fields; Task/Assignment/Discussion/Response/Reading/Test/Note/
    Source/Reminder; persists and appears in views.

- [ ] **T9. Naming + integrity + metadata fixes** _(R9, steering)_
  - Replace "TrueSelf Scholar" → "F.I.S.H. Scholar" everywhere; make AI fallbacks honest/labeled
    (no fake citations/DOIs/professors); fix `package.json` name/version; remove hard-coded
    personal identity from server fallbacks.

- [ ] **T10. AI provider abstraction (server) + Anime AI placeholder** _(R8)_
  - `AIProviderAdapter` seam; `GeminiAdapter`; inert `AnimeAiAdapter` reading env vars; keys
    server-side only; graceful degradation.

- [ ] **T11. Tests + Kiro hooks** _(R1, R4, R5; steering)_
  - Vitest wired (`test` script); selector + repo tests; hooks for `.env`/secret scan and
    `tsc --noEmit`.

- [ ] **T12. Verify + PR**
  - `bun run lint` + tests pass; incremental commits; push branch; open PR into `main`.

## Milestone 2 — Notion (read-only → confirmed import)

- [ ] Notion server proxy with `NOTION_API_KEY`; read-only fetch.
- [ ] Preview screen + field-mapping UI (Notion property → F.I.S.H. field).
- [ ] Confirmed import with dedupe via `NotionSyncRecord`; conflict surfacing.
- [ ] Non-destructive failure messaging; two-way sync deferred/opt-in.
  _(R7)_

## Milestone 3 — Ask FISH (database-aware assistant)

- [ ] Server route that answers from persisted data ("what's due", "replies remaining",
  "what next", "create a checklist" → editable proposal).
- [ ] Provenance labeling of sources; unverified content flagged. _(R8, R9)_

## Milestone 4 — Advanced

- [ ] Syllabus importer (preview → confirm), document knowledge base + retrieval, APA tools,
  study tools (guides/flashcards/practice, never "official"), calendar month view, global
  search, notifications rules, grades + labeled projections, workload analytics, reports/export.

## Cross-cutting (every task)

- Accessibility (WCAG 2.2 AA, keyboard, focus, non-color status, reduced motion, mobile order).
- Security/privacy (no client secrets, `.env` ignored, no hard-coded identity).
- Academic integrity (no fabrication; preview→confirm for AI-proposed records; labeled AI).
- Never silently delete/overwrite records; graceful, honest failure states.
