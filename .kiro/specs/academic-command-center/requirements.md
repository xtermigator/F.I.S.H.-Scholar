# Requirements — F.I.S.H. Scholar Academic Command Center

Status: Draft · Owner: single student user · Related: `.kiro/steering/*`, `CURRENT_STATE.md`

## Introduction

F.I.S.H. Scholar is a private, single-student academic operating system for managing coursework
across multiple universities. This spec defines the requirements to evolve the existing React
prototype into a usable command center, prioritizing **data persistence**, **discussion &
peer-response tracking**, and the **Today / This Week / Quick Add** experience that together
constitute the first production-usable milestone.

Acceptance criteria use EARS phrasing ("WHEN … THE SYSTEM SHALL …"). Requirements are grouped;
the **M1** tag marks those in scope for the first milestone.

---

## R1 — Data persistence (M1)

**User story:** As the student, I want my data to survive page refreshes and browser restarts,
so that I never lose academic records I entered.

1. WHEN the student creates, edits, or deletes any entity (course, assignment, task, discussion,
   response, reading, note), THE SYSTEM SHALL persist the change to durable local storage
   before the session ends.
2. WHEN the student reloads the app, THE SYSTEM SHALL restore all previously persisted entities
   exactly as last saved.
3. THE SYSTEM SHALL access all persistent data exclusively through a repository interface, so
   the storage implementation can be replaced (e.g. with a server database) without changing UI
   code.
4. WHEN a persistence operation fails, THE SYSTEM SHALL surface a clear, non-destructive error
   and SHALL NOT silently discard the student's data.
5. THE SYSTEM SHALL record `createdAt` and `updatedAt` on every stored entity and carry a
   `schemaVersion` so future migrations never silently drop data.

## R2 — Institutions, courses, semesters (M1)

**User story:** As the student, I want to manage my universities and courses, so that all my
coursework lives in one place.

1. WHEN the app first loads with no data, THE SYSTEM SHALL provide the Fall 2026 starting
   structure: Mississippi State `ED 9413`, University of Florida `FYC 6234`, CUNY `DSAB 629`.
2. THE SYSTEM SHALL NOT invent official course titles, professor names, or contact details;
   unknown fields SHALL remain empty and editable.
3. THE SYSTEM SHALL allow the student to add, edit, and remove institutions, semesters, and
   courses without limit.
4. WHEN the student edits a course title, professor, or other field, THE SYSTEM SHALL persist
   it (per R1).

## R3 — Assignments & checklists (M1 for core; AI checklist later)

**User story:** As the student, I want to track assignments with editable checklists, so I can
break work into steps and see progress.

1. THE SYSTEM SHALL let the student create an assignment with at least: title, course, due
   date/time, type, status, and notes; other fields are optional.
2. THE SYSTEM SHALL support assignment statuses including Not Started, In Progress, Completed,
   Submitted, Graded, Needs Revision, Waiting, and Optional.
3. WHEN the student toggles a checklist item, THE SYSTEM SHALL persist the change and update the
   assignment's completion percentage.
4. THE SYSTEM SHALL allow the student to add, edit, reorder, and delete checklist items.
5. WHERE an AI checklist is proposed from instructions, THE SYSTEM SHALL present it as editable
   suggestions the student must accept, and SHALL NOT auto-commit it.

## R4 — Discussion & peer-response tracking (M1, highest priority)

**User story:** As the student, I want to track discussion posts and my required peer replies,
so I always know who I still need to respond to and whether I've met requirements.

1. THE SYSTEM SHALL let the student create a discussion with: university, course, week, title,
   prompt, initial-post deadline, response deadline, minimum required responses, and status.
2. THE SYSTEM SHALL track the original post separately with status (Not Started, Drafting,
   Ready, Submitted), draft/final text, submission date/time, word count, and sources used.
3. THE SYSTEM SHALL let the student add individual peer-response records with: classmate name,
   their post/topic, whether the response is drafted/submitted, submission date, word count,
   follow-up-required flag, and notes.
4. WHEN peer responses are recorded, THE SYSTEM SHALL compute and display "Completed Replies:
   X / N required" and "N − X remaining".
5. WHEN required replies are not yet complete OR a follow-up is flagged, THE SYSTEM SHALL show a
   clear visual status (using text/icon, not color alone) such as "1 response remaining" or
   "1 reply may warrant follow-up".
6. THE SYSTEM SHALL let the student generate a follow-up task/reminder from a discussion.

## R5 — Today & This Week dashboards (M1)

**User story:** As the student, I want to see what's due today and this week across all courses,
so I can plan without checking each LMS.

1. THE SYSTEM SHALL show a **Today** view listing items due today and overdue, including
   assignments, discussion posts, discussion replies due, readings, and approaching tests.
2. THE SYSTEM SHALL show a **This Week** view aggregating workload across all courses for the
   current week.
3. THE SYSTEM SHALL show a per-course **workload indicator** with status Light / Moderate /
   Heavy / Critical, computed transparently from task count, estimated effort, due-date
   proximity, and incomplete work.
4. THE SYSTEM SHALL surface a single **recommended next action** ("Start Here") rather than only
   an undifferentiated list.
5. WHEN dates or statuses change, THE SYSTEM SHALL recompute the Today/This Week/workload views.

## R6 — Quick Add (M1)

**User story:** As the student, I want a universal "+" to quickly capture items, so I can add
things with minimal friction and fill details later.

1. THE SYSTEM SHALL provide a Quick Add action that can create a Task, Assignment, Discussion,
   Response, Reading, Test, Note, Source, or Reminder.
2. THE SYSTEM SHALL require only minimal fields at capture time and allow later completion.
3. WHEN an item is quick-added, THE SYSTEM SHALL persist it (per R1) and reflect it in the
   relevant views.

## R7 — Notion integration (post-M1; read-only view is part of M1 goal #10)

**User story:** As the student, I want to connect my existing Notion task database, so I don't
re-enter work I already track.

1. THE SYSTEM SHALL first support a **read-only** Notion connection using a server-side token.
2. WHEN Notion data is fetched, THE SYSTEM SHALL show a **preview** of imported records and a
   **field-mapping** screen (Notion property → F.I.S.H. field) before any import.
3. THE SYSTEM SHALL require **manual confirmation** before creating records from Notion and
   SHALL deduplicate using stable sync identifiers.
4. THE SYSTEM SHALL track `source`, `lastSyncedAt`, `syncDirection`, and `conflictStatus` per
   synced record.
5. THE SYSTEM SHALL NOT overwrite or delete Notion records without explicit confirmation, and
   two-way sync SHALL be opt-in only.
6. WHEN Notion is unreachable, THE SYSTEM SHALL show "Notion could not be reached. Your
   F.I.S.H. Scholar data is safe." and SHALL keep all local data accessible.

## R8 — AI provider abstraction & Ask FISH (post-M1; "ask what's next" is M1 goal #11)

**User story:** As the student, I want an AI assistant that understands my academic data and
isn't locked to one vendor.

1. THE SYSTEM SHALL access AI through a provider abstraction (provider, model, endpoint, key,
   enabled features) so providers can be swapped.
2. THE SYSTEM SHALL keep all AI keys server-side; the client SHALL NEVER receive a key.
3. THE SYSTEM SHALL include a Gemini adapter and an "Anime AI" adapter **placeholder** whose
   endpoints are not invented; the placeholder SHALL be inert until real documentation is
   provided.
4. WHEN an AI provider fails or is unconfigured, THE SYSTEM SHALL degrade gracefully so the
   dashboard keeps working, and SHALL NOT present fabricated results as verified.
5. THE SYSTEM SHALL answer database-aware questions ("What's due this week?", "What replies
   remain?", "What should I work on next?") from persisted data.

## R9 — Academic integrity (cross-cutting, always in force)

1. THE SYSTEM SHALL NOT fabricate citations, DOIs, quotations, page numbers, professor
   statements, requirements, or grades and present them as real.
2. WHERE content is AI-generated or unverified, THE SYSTEM SHALL label it explicitly (not by
   color alone).
3. WHEN the AI proposes records (checklists, extracted syllabus/Notion data), THE SYSTEM SHALL
   route them through preview → confirm before persisting.
4. THE SYSTEM SHALL distinguish information sources (course, uploaded docs, notes, Notion,
   external research, AI suggestion) in the UI.

## R10 — Accessibility (cross-cutting, always in force)

1. THE SYSTEM SHALL target WCAG 2.2 AA: keyboard operability, visible focus, semantic HTML,
   AA contrast, and status conveyed by more than color.
2. THE SYSTEM SHALL honor `prefers-reduced-motion`.
3. THE SYSTEM SHALL work on phone, tablet, laptop, and desktop, prioritizing on mobile:
   Today → Upcoming → Quick Add → Courses → Ask FISH.
4. Modals/drawers SHALL trap focus while open, close on `Esc`, and restore focus on close.

## R11 — Security & privacy (cross-cutting, always in force)

1. THE SYSTEM SHALL keep secrets out of client code and out of version control (`.env`
   ignored; only `.env.example` committed).
2. THE SYSTEM SHALL NOT hard-code personal identity or credentials in source.
3. THE SYSTEM SHALL treat all academic records as private by default and structure data so
   multi-user auth can be added later without a rewrite.

## R12 — Demo data (cross-cutting)

1. WHERE sample data is provided, THE SYSTEM SHALL flag it `isDemo: true` and label it clearly
   in the UI.
2. THE SYSTEM SHALL provide a one-click action to remove all demo data.
3. THE SYSTEM SHALL NOT mix fabricated assignments/dates/citations into the student's real
   records.

## Out of scope for this iteration

Full backend + managed auth, real two-way Notion sync, LMS API integrations, syllabus importer,
document knowledge base / retrieval, APA validator, study-tool generation, calendar month view,
reports/exports. These are captured for later phases in `tasks.md` and the steering docs.
