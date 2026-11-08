# F.I.S.H. Scholar — Product Steering

> Read this first. It tells you what F.I.S.H. Scholar is, who it serves, and what "good"
> means for this product. Other steering files cover architecture, accessibility, academic
> integrity, and security.

## What it is

**F.I.S.H. Scholar** (Focus · Integrity · Synthesis · Harmony) is a **private, single-student
academic operating system**. One graduate student manages coursework across **multiple
universities** from one interface. It is *not* a generic to-do app — it is a personal academic
command center: research assistant, course database, discussion tracker, assignment manager,
study system, and AI-supported scholarly workspace.

The product name is **F.I.S.H. Scholar**. Never introduce the legacy name "TrueSelf Scholar"
into code, prompts, or UI.

## The core questions it must answer

At a glance the student should be able to answer:

- What do I need to do today / this week?
- Which discussion posts have I submitted, and which peer replies still remain?
- Have classmates responded to me, and who still needs a follow-up?
- What readings, tests, and assignments are approaching?
- What has been submitted vs. graded, and what feedback was given?
- Which course has the heaviest workload this week?
- What should I start on next, broken into a small first step?
- How can AI help me finish the next step **without taking over my academic work**?

## Current scope (Fall 2026)

Three courses across three institutions. Course **codes** are known; official titles,
professors, assignments, and dates are **NOT invented** — they are entered/imported by the
student.

- **Mississippi State University** — `ED 9413`
- **University of Florida** — `FYC 6234`
- **CUNY** — `DSAB 629`

The schema must support **unlimited** future institutions, semesters, programs, courses,
instructors, assignments, discussions, readings, quizzes, exams, research projects, and notes.

## Design principles

1. **Reduce executive-function burden.** Prefer "here is the one thing to start" over walls of
   40 unfinished items. Support Start Here, Break Into Steps, Focus Session, and Parking Lot.
2. **Never destroy academic records.** No silent deletes, no silent overwrites — of local data
   or of external systems (Notion). Confirm before anything destructive.
3. **Truth over polish.** Never fabricate citations, DOIs, quotations, page numbers, professor
   statements, grades, or requirements. Label AI-generated or unverified content clearly.
   (See `academic-integrity.md`.)
4. **Preserve working features.** Extend the existing app; do not rewrite without a clear
   technical reason. Changes should be additive and incremental.
5. **Private by default.** Personal academic records, grades, documents, API keys, and AI
   conversations are private. Secrets never reach client code. (See `security.md`.)
6. **Accessible always.** WCAG 2.2 AA is a product requirement, not a nice-to-have.
   (See `accessibility.md`.)
7. **No vendor lock-in.** AI is accessed through a provider abstraction so the student can swap
   providers (Gemini, "Anime AI", OpenAI-compatible, Bedrock, etc.).

## Priority features (in order)

1. **Persistence** — data survives refresh (the foundational gap).
2. **Discussion & peer-response tracking** — the single highest-value feature.
3. **Today / This Week dashboards** and **Quick Add**.
4. **Assignments + checklists**, readings, assessments.
5. **Notion integration** (read-only → preview → map → confirm → dedupe → optional sync).
6. **AI provider abstraction + "Ask FISH"** (database-aware first, research later).
7. Advanced: syllabus importer, knowledge bases, APA tools, study tools, workload analytics,
   reports, calendar, search, notifications.

## Demo data rule

Any sample data ships **clearly labeled `DEMO DATA`** with a one-click removal path. Never
populate fabricated assignments/dates/citations into the student's real semester.

## Definition of the first milestone

The student can: open the app; see ED 9413, FYC 6234, DSAB 629; add real weekly assignments;
add discussion prompts; track initial posts and required peer responses; see what's due today
and this week; check off completed work; import or view existing Notion tasks; and ask the AI
what to work on next — with all of this surviving a page refresh.
