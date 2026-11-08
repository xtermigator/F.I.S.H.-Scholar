/**
 * Pure helpers for reading, updating, and masking `.env` content (spec: in-app key entry).
 *
 * Security posture (.kiro/steering/security.md):
 *  - These functions only manipulate `.env` TEXT + read masked previews. They never return raw
 *    secret values to any caller that would send them to the client.
 *  - `upsertEnvVar` preserves unrelated lines/comments and only rewrites the target key.
 *
 * Pure and testable (envFile.test.ts) — no filesystem access here; the server module does I/O.
 */

/** Parse `.env` text into a key→value map (ignores comments/blank lines; strips quotes). */
export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    let value = line.slice(eq + 1).trim();
    // Strip a single pair of surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Insert or update `KEY="value"` in `.env` text, preserving all other lines and comments.
 * If the key already exists (even commented as `KEY=`), its line is replaced in place; else it
 * is appended. Values are always double-quoted.
 */
export function upsertEnvVar(text: string, key: string, value: string): string {
  const line = `${key}="${value}"`;
  const lines = text.split(/\r?\n/);
  // Match an existing assignment line for this key (allow leading spaces; not a comment).
  const idx = lines.findIndex((l) => {
    const t = l.trim();
    if (!t || t.startsWith('#')) return false;
    const eq = t.indexOf('=');
    return eq !== -1 && t.slice(0, eq).trim() === key;
  });
  if (idx !== -1) {
    lines[idx] = line;
    return lines.join('\n');
  }
  // Append; ensure a trailing newline separation.
  const base = text.length && !text.endsWith('\n') ? text + '\n' : text;
  return `${base}${line}\n`;
}

/**
 * Mask a secret for display: keep at most the last `visible` chars, prefix with bullets.
 * Empty/absent values return '' (caller shows "not set").
 */
export function maskSecret(value: string | undefined, visible = 4): string {
  if (!value) return '';
  if (value.length <= visible) return '•'.repeat(value.length);
  return `${'•'.repeat(Math.min(8, value.length - visible))}${value.slice(-visible)}`;
}

/** Basic validation: a key name must be UPPER_SNAKE and known/allowed by the caller. */
export function isValidEnvKeyName(key: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(key);
}
