# F.I.S.H. Scholar — Security & Privacy Steering

> This app holds personal academic records, grades, documents, API keys, AI conversations,
> and Notion data. It is **private by default**.

## Secrets

- **API keys and secrets never appear in client-side code or the bundle.** All provider keys
  (Gemini, "Anime AI", Notion token, GitHub secret) are read from server-side environment
  variables and used only in `server.ts` / server modules.
- Standard env var names: `GEMINI_API_KEY`, `ANIME_AI_API_KEY`, `ANIME_AI_BASE_URL`,
  `ANIME_AI_MODEL`, `NOTION_API_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `APP_URL`.
- **Never commit real secrets.** `.env` is git-ignored; only `.env.example` (with placeholder
  values) is committed. A Kiro hook scans for accidental secret/`.env` commits.
- Do not hard-code personal identity (name, email, GitHub handle) or credentials in source or
  server fallbacks. Profile data is user-entered and stored, not baked in.

## Authentication (roadmap)

- Current state: no real auth; a single shared in-memory GitHub token. Treat this as a
  prototype gap, not a pattern.
- Target: **private-by-default** auth. If it stays single-user, don't over-engineer multi-
  tenancy — but structure sessions/records so multi-user could be added later.
- OAuth flows must validate `state`; tokens must be per-session, not global module variables.

## API surface

- Server API endpoints handling user data must (in the backend phase) require auth and apply
  reasonable input limits and rate limiting, especially large uploads (base64 PDFs).
- Validate and size-limit request bodies; don't trust client input.

## External systems — never destructive without confirmation

- **Notion:** start read-only. Import/sync only after explicit preview + confirmation. Never
  overwrite or delete Notion records without the student choosing that outcome. Track
  `source`, `lastSyncedAt`, `syncDirection`, `conflictStatus`; surface conflicts, don't
  auto-resolve.
- **GitHub / any write integration:** confirm before pushing/committing on the student's
  behalf.

## Failure states (graceful, honest, non-destructive)

- Notion unreachable: "Notion could not be reached. Your F.I.S.H. Scholar data is safe."
- AI unavailable: "AI assistance is temporarily unavailable. Your academic records remain
  accessible."
- Sync conflict: "This record changed in both systems. Choose which version to keep."
- **Never silently delete or overwrite academic records.** No hidden errors — surface them.

## Data handling

- Uploaded documents and notes are private to the student.
- Deletion is explicit and confirmed; provide export before destructive bulk operations where
  feasible.
