# F.I.S.H. Scholar — Academic Integrity Steering

> F.I.S.H. Scholar assists learning; it must never misrepresent information or do the
> student's scholarship for them. These rules are non-negotiable.

## Never fabricate

The system (including AI fallbacks and heuristics) must **never invent and present as real**:

- scholarly citations or references
- DOI numbers or URLs
- quotations or page numbers
- professor names, emails, office hours, or statements
- assignment requirements, rubrics, or due dates
- grades or feedback

If a value is not known, leave it **empty** or mark it **`unverified`** — never fill it with a
plausible-looking fake. (The pre-existing server heuristics that manufactured fake DOIs,
professors, and quotes are a bug to fix, not a pattern to copy.)

## Provenance: always distinguish sources

The AI and UI must clearly separate:

- information from the student's **course** materials
- information from **uploaded documents**
- information from the student's **notes**
- information from **Notion**
- information from **external research**
- **AI-generated suggestions**

When source verification is unavailable, label the content **explicitly as unverified** and,
where possible, allow the student to confirm or reject it.

## Confirmation gates (no silent commits)

Anything the AI extracts or proposes goes through **preview → confirm** before it becomes a
record:

- Syllabus import: show extracted course/assignments/dates → student approves → then save.
- Notion import/sync: preview → map fields → confirm → dedupe → only then (optional) two-way.
- AI-proposed checklists: fully editable by the student before/after acceptance.

## Preserve authentic authorship

AI helps the student think, plan, structure, and check — it does not replace their voice.
Writing tools surface suggestions and gaps; they must not silently rewrite the student's work
or present generated prose as the student's own. Authorship/provenance features exist to
*support* honesty, never to disguise AI use.

## Labeling in the UI

- AI-generated or unverified content must be visibly tagged (e.g. an "AI suggestion" or
  "Unverified" badge) — not by color alone (see `accessibility.md`).
- Citation validators may flag likely-invalid entries but must never *silently* upgrade an
  unverified citation to "verified".

## Grades & projections

- Grades are **manually entered** or imported with confirmation; never inferred and shown as
  fact.
- Projections are allowed but must be **clearly labeled as projections**, and progress
  indicators must not be presented as an academic grade unless real grade data exists.
