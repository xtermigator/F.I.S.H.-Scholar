# F.I.S.H. Scholar — Repository Audit (`CURRENT_STATE.md`)

> **Phase 1 deliverable.** A factual snapshot of the codebase as it exists today, before
> any architectural change. Nothing in the application has been modified to produce this
> document. Recommendations are listed but **not yet applied**.

_Audit date: 2026-09-15 · Branch audited: `main` · Commits in history: 2_

---

## 1. Executive Summary

F.I.S.H. Scholar is a **client-heavy single-page React application** with a thin Express
backend that exists almost entirely to proxy **Google Gemini** AI calls and a
**GitHub OAuth** flow. It was scaffolded as a **Google AI Studio applet**
(`metadata.json` → `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`).

It is visually polished and demonstrates a strong product vision (multi-university academic
OS, citation vault, writing studio, AI coaching, authorship provenance). However, **it is a
prototype**: all data lives in React `useState` and is **lost on page refresh**. There is
**no database, no real authentication, and no persistence**. Much of what looks like "real"
data is **AI-generated demo content presented as if it were the student's actual semester.**

**Bottom line:** the UI shell, component structure, AI proxy pattern, and type system are
genuinely worth preserving. The data layer, persistence, auth, and the "fake-real" demo
content are the areas that need real work — and they are exactly what the master build
instruction (persistence, Notion, discussions, provider abstraction, auth) is asking for.

---

## 2. Technology Stack (as-is)

| Layer | Technology | Notes |
|---|---|---|
| Build tool | **Vite 6** | `@vitejs/plugin-react`, custom HMR handling for AI Studio |
| UI framework | **React 19** | `StrictMode`, function components, hooks only |
| Language | **TypeScript 5.8** | `noEmit`, bundler resolution, `@/*` path alias → repo root |
| Styling | **Tailwind CSS 4** | via `@tailwindcss/vite`; single `@import "tailwindcss"` in `index.css` |
| Backend | **Express 4** | `server.ts`, run through `tsx` in dev, bundled via `esbuild` for prod |
| AI | **`@google/genai` (Gemini)** | model string used: `gemini-3.7-flash` |
| Icons / motion | `lucide-react`, `motion`, `canvas-confetti` | |
| Package manager | **bun** | `bun.lock` present |
| Tests | **none** | only `lint` = `tsc --noEmit` |

### Notable stack observations
- **`package.json` `name` is still `"react-example"`** and version `0.0.0` — leftover from a template.
- The AI model string **`gemini-3.7-flash` is not a currently known public Gemini model name**
  (real families are `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-2.5-flash`, etc.). This
  should be verified — with no API key it silently uses fallbacks, so the wrong model name is
  currently invisible.
- No linter/formatter beyond the TypeScript compiler. No ESLint, no Prettier config.

---

## 3. Application Architecture (as-is)

### 3.1 Frontend
Single root `App.tsx` holds **all application state** in `useState`:
`institutions`, `courses`, `assignments`, `citations`, `academicMemory`, `profile`, plus UI
selection/drawer/modal state. State is threaded down to seven tab views by props (no context,
no store, no router). Navigation is a `useState<TabType>` string, not URL-based routing.

**Seven top-level tabs** (`src/components/`):
| Tab | Component | Purpose |
|---|---|---|
| TODAY | `TodayView.tsx` | Dashboard / "what's due" landing |
| COURSES | `CoursesView.tsx` | Course cards per institution |
| ASSIGNMENTS | `AssignmentsView.tsx` | Assignment list + checklist + detail |
| LIBRARY | `LibraryView.tsx` (1,276 LOC) | Citation vault + PDF extractor + academic memory |
| WRITE | `WriteView.tsx` | Writing studio / drafts |
| FOCUS | `FocusView.tsx` | Pomodoro-style focus sessions |
| ME | `MeView.tsx` (724 LOC) | Profile, accommodations, GitHub, AI provider |

**Cross-cutting UI:** `Navbar.tsx`, `CompanionDrawer.tsx` (AI coach with 6 roles),
`SyllabusModal.tsx`, `AuthorshipModal.tsx`, `PdfCitationExtractor.tsx`.

### 3.2 Backend (`server.ts`, 1,412 LOC)
Express app on port 3000; serves the Vite app in dev (middleware mode) and static `dist/` in
prod. **All AI endpoints have a heuristic fallback** so the app works with no API key.

| Endpoint | Function |
|---|---|
| `GET /api/health` | health + reports whether a Gemini key is present |
| `POST /api/gemini/extract-syllabus` | syllabus → structured course data |
| `POST /api/gemini/document-intelligence` | classify/summarize an uploaded doc |
| `POST /api/gemini/extract-citation-pdf` | PDF → APA 7 citation metadata |
| `POST /api/gemini/categorize-citations` | thematic + per-course relevance scoring |
| `POST /api/gemini/writing-coach` | prompt deconstruction, rubric check, APA check |
| `POST /api/gemini/voice-analysis` | "authentic voice" vs AI-drift analysis |
| `POST /api/gemini/academic-memory` | cross-course knowledge-graph synthesis |
| `POST /api/gemini/companion-chat` | 6 role-based AI coach personas |
| `GET /api/auth/github/url` | build GitHub OAuth authorize URL |
| `GET /auth/github/callback` | OAuth callback + `postMessage` to opener |
| `GET /api/github/status` · `/repos` · `POST /sync-paper` · `/disconnect` | GitHub repo sync |

---

## 4. What Already Exists & Works

- ✅ **Polished, responsive, accessible-leaning UI** with a clear scholarly design identity
  (serif display fonts, amber/neutral palette, icon system).
- ✅ **Coherent domain type system** (`src/types.ts`): `Institution`, `Course`, `Assignment`,
  `Citation` (with `CourseAlignment`), `DocumentRecord`, `AcademicMemoryNode`,
  `AuthorshipDossier`, `StudentProfile`, `CoachMessage`.
- ✅ **Server-side AI key handling** — the Gemini key is read from `process.env` on the server
  and **never shipped to the client**. This is the correct pattern.
- ✅ **Graceful AI degradation** — every AI endpoint returns a structured heuristic fallback
  when no key is configured, so the app never hard-crashes on a missing/failed AI call.
- ✅ **Citation vault + AI categorization** with per-course relevance scoring is genuinely
  functional (heuristic + Gemini paths).
- ✅ **Focus mode, writing studio drafts, authorship dossier, syllabus modal** all render and
  are wired to handlers.

---

## 5. What Is Incomplete / Missing (vs. the product vision)

- ❌ **No persistence.** All state is in-memory React state. **Refreshing the page wipes every
  edit** (new courses, checklist toggles, drafts, imported citations). This is the single most
  important gap.
- ❌ **No database.** None of the entities in the master spec (WeekModule, Discussion,
  DiscussionResponse, Assessment, Reading, ResearchSource persistence, CalendarEvent,
  Notification, Notion sync records) exist as stored data.
- ❌ **No real authentication.** "Auth" is a single in-memory GitHub token variable
  (`activeGitHubToken`) shared across all requests — not user auth, and not private-by-default.
- ❌ **No Discussion / DiscussionResponse tracking** — the #1 high-priority feature in the
  brief. There is no discussion entity, no peer-response tracking, no "1/2 replies" logic.
- ❌ **No Notion integration** of any kind.
- ❌ **No AI provider abstraction** — hard-wired to Gemini. `StudentProfile.byoAiProvider`
  exists as a field but nothing consumes it; there is no "Anime AI" adapter.
- ❌ **No weekly module system, no assessments/quizzes entity, no reading tracker entity,
  no calendar, no global search, no Quick Add, no notifications, no grades store.**
- ❌ **No tests** and no CI.

---

## 6. Data Model & Demo Data — ⚠ Important Integrity Finding

The seed data in `src/data/mockData.ts` is **fabricated demo content presented as real**, and
it **conflicts with the master build instruction** in several concrete ways:

| Field | In the repo (demo data) | Master instruction says | Action |
|---|---|---|---|
| UF course code | **FYC 6933** | **FYC 6234** | Reconcile with user |
| Semester | **Spring 2026** | **Fall 2026** | Update to Fall 2026 |
| Course titles | AI-invented (e.g. "Curriculum Leadership & Universal Design") | "Do not invent official course titles" | Blank/editable, confirm |
| Professors | Invented (Dr. Bennett, Dr. Vance, Dr. Alvarez) + fake emails/Zoom | not provided by user | Treat as demo, do not present as real |
| Assignments | Invented titles, prompts, due dates, drafts | "Do not fabricate assignment dates" | Treat as demo, must be removable |
| Citations | 5 sources, some with **fabricated DOIs** (server fallbacks invent DOIs like `10.1000/182`) | "Never fabricate citations / DOI numbers" | Flag; must be labeled unverified |
| Student identity | Hard-codes **"Eric Fishon"**, email, GitHub `ericfishon` | — | Confirm / make configurable |

The server's heuristic fallbacks **actively invent scholarly-looking citations, DOIs, and
professor details** (e.g. `getFallbackCitation()` returns plausible-but-fake DOIs and quotes).
Per the master rules ("never fabricate citations/DOIs; label unverified"), this is a
**correctness/academic-integrity risk** that must be addressed: fallbacks should be clearly
marked *unverified / demo*, never presented as confirmed sources.

**Existing entities worth preserving** (they map cleanly onto the target schema):
`Institution → Course → Assignment → (checklist) AssignmentTask`, plus `Citation`
(with many-to-many `coursesUsed` / `papersCitedIn`) and `AcademicMemoryNode`.

---

## 7. Security Review

| Finding | Severity | Detail |
|---|---|---|
| AI key server-side only | ✅ Good | Gemini key never reaches client |
| Single shared in-memory auth token | 🔴 High | `activeGitHubToken` is global; no per-user session, no cookie/JWT, no CSRF/state validation on OAuth |
| No auth on AI/data endpoints | 🔴 High | Every `/api/*` route is unauthenticated and world-callable |
| Fabricated data as fact | 🟠 Med | Fallbacks invent citations/DOIs/professors (integrity risk) |
| `50mb` JSON body limit | 🟠 Med | Large base64 PDF uploads accepted with no auth/rate limit |
| No `.env` committed | ✅ Good | `.env.example` only; real secrets not in repo |
| OAuth `state` not verified | 🟠 Med | `state` is generated but never checked on callback |
| Hard-coded personal identity | 🟠 Med | Real-looking name/email/avatar baked into server fallbacks |

---

## 8. Dependencies — Health Notes

- React 19 + Vite 6 + Tailwind 4 are all **current-generation** — no reason to downgrade.
- `@google/genai ^2.4.0` is the newer unified SDK (good), but the **model name should be
  verified** (see §2).
- No test/lint tooling installed beyond `tsc`.
- `package.json` metadata (`name`, `version`) is placeholder and should be corrected.

---

## 9. Recommended Next Steps (proposed — not yet done)

Ordered to match the master build instruction's phases and the "first milestone" (§47):

1. **Reconcile demo data with reality** (Fall 2026; FYC 6234; blank professor/title fields;
   clearly label all seed content as `DEMO DATA` with one-click removal). *Confirm with user.*
2. **Add a persistence layer** so nothing is lost on refresh. Recommend starting with a typed
   local/IndexedDB store behind a repository interface, designed so it can be swapped for a
   real backend DB + auth later without touching the UI.
3. **Introduce the missing core entities** — `WeekModule`, `Discussion`, `DiscussionResponse`,
   `Assessment`, `Reading`, `ResearchSource`, `CalendarEvent`, `Notification` — as types +
   store, prioritizing **Discussions & DiscussionResponses** (highest-priority feature).
4. **Build the AI provider abstraction** (`AIProvider` interface + Gemini adapter + Anime AI
   adapter placeholder) so the app is not vendor-locked; keep all keys server-side.
5. **Add real, private-by-default auth** structured for future multi-user.
6. **Notion integration** — read-only first: connect → preview → map → confirm → dedupe →
   (optional) two-way sync. Never overwrite Notion without confirmation.
7. **Fix integrity issues** — never present AI fallbacks as verified citations/DOIs/facts;
   label unverified content explicitly.
8. **Add tests + CI + Kiro hooks** (secret-scanning, type-check, discussion-count logic).
9. **Correct project metadata** (`package.json` name/version) and resolve the
   `F.I.S.H. Scholar` vs `TrueSelf Scholar` naming inconsistency in `server.ts`.

**Architecture recommendation: retain and extend, do not rewrite.** The React 19 + Vite +
Tailwind + Express-AI-proxy foundation is modern and healthy. The work is *additive* (data
layer, entities, integrations, auth), which respects the "preserve working code" rule.

---

## 10. Naming Inconsistency (flagged)

The product is branded **F.I.S.H. Scholar** in `metadata.json`, `index.html`, and the UI, but
**`server.ts` refers to it internally as "TrueSelf Scholar"** in ~8 AI system prompts, and the
second git commit is `feat: initialize TrueSelf Scholar project`. This should be unified to
**F.I.S.H. Scholar** to avoid leaking the wrong product name into AI responses.
