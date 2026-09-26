import fs from 'fs';
import path from 'path';
import { parseEnv, upsertEnvVar, maskSecret } from './envFile';

/**
 * Server-side API key store (spec: in-app key entry).
 *
 * Lets the app show which integration keys are configured and accept new values, WITHOUT ever
 * exposing raw secrets to the client (.kiro/steering/security.md):
 *  - `getKeyStatus()` returns only { configured, masked } per key — never the real value.
 *  - `setKey()` accepts a value from a trusted local/self-hosted context, writes it to the
 *    server's `.env` (git-ignored), and applies it to `process.env` immediately.
 *  - Only keys on the MANAGED allowlist can be read or written.
 */

export type KeyGroup = 'AI brain' | 'anam.ai avatar' | 'Notion' | 'GitHub' | 'App' | 'Custom AI';

export interface ManagedKey {
  key: string;
  label: string;
  group: KeyGroup;
  /** Secret values are masked; non-secret config (model/url/provider) shows in full. */
  secret: boolean;
  hint?: string;
}

export const MANAGED_KEYS: ManagedKey[] = [
  // AI brain
  { key: 'AI_PROVIDER', label: 'Active AI provider', group: 'AI brain', secret: false, hint: 'gemini | anime_ai' },
  { key: 'GEMINI_API_KEY', label: 'Gemini API key', group: 'AI brain', secret: true },
  { key: 'GEMINI_MODEL', label: 'Gemini model', group: 'AI brain', secret: false, hint: 'e.g. gemini-2.5-flash' },
  { key: 'PRIVATE_API_TOKEN', label: 'Private API token (guards /api/ai/generate)', group: 'AI brain', secret: true },
  // anam.ai avatar
  { key: 'ANAM_API_KEY', label: 'anam.ai API key', group: 'anam.ai avatar', secret: true },
  { key: 'ANAM_PERSONA_ID', label: 'anam persona ID (optional)', group: 'anam.ai avatar', secret: false },
  { key: 'ANAM_AVATAR_ID', label: 'anam avatar ID', group: 'anam.ai avatar', secret: false },
  { key: 'ANAM_VOICE_ID', label: 'anam voice ID', group: 'anam.ai avatar', secret: false },
  { key: 'ANAM_LLM_ID', label: 'anam custom LLM ID', group: 'anam.ai avatar', secret: false, hint: 'points at /api/anam/llm' },
  // Notion
  { key: 'NOTION_API_KEY', label: 'Notion integration token', group: 'Notion', secret: true },
  // Custom AI (Anime AI placeholder)
  { key: 'ANIME_AI_API_KEY', label: 'Anime AI key', group: 'Custom AI', secret: true },
  { key: 'ANIME_AI_BASE_URL', label: 'Anime AI base URL', group: 'Custom AI', secret: false },
  { key: 'ANIME_AI_MODEL', label: 'Anime AI model', group: 'Custom AI', secret: false },
  // GitHub
  { key: 'GITHUB_CLIENT_ID', label: 'GitHub OAuth client ID', group: 'GitHub', secret: false },
  { key: 'GITHUB_CLIENT_SECRET', label: 'GitHub OAuth client secret', group: 'GitHub', secret: true },
  // App
  { key: 'APP_URL', label: 'App URL (OAuth / anam callbacks)', group: 'App', secret: false },
];

const MANAGED_MAP = new Map(MANAGED_KEYS.map((k) => [k.key, k]));

export interface KeyStatus {
  key: string;
  label: string;
  group: KeyGroup;
  secret: boolean;
  hint?: string;
  configured: boolean;
  /** Masked preview for secrets, or the plain value for non-secret config. '' when unset. */
  display: string;
}

/** Absolute path to the server-side .env (repo root = process.cwd()). */
function envPath(): string {
  return path.join(process.cwd(), '.env');
}

/** Read masked status for every managed key. Never returns raw secret values. */
export function getKeyStatus(): KeyStatus[] {
  return MANAGED_KEYS.map((mk) => {
    const value = process.env[mk.key] || '';
    const configured = value.trim().length > 0;
    const display = !configured ? '' : mk.secret ? maskSecret(value) : value;
    return { ...mk, configured, display };
  });
}

export interface SetKeyResult {
  ok: boolean;
  error?: string;
  status?: KeyStatus[];
}

/**
 * Persist a managed key to `.env` and apply it live. Rejects unknown keys. An empty value
 * clears the variable (both in `.env` and process.env) so a key can be removed.
 */
export function setKey(key: string, value: string): SetKeyResult {
  const managed = MANAGED_MAP.get(key);
  if (!managed) {
    return { ok: false, error: `"${key}" is not a managed setting.` };
  }
  const trimmed = (value ?? '').trim();

  try {
    const file = envPath();
    let current = '';
    try {
      current = fs.readFileSync(file, 'utf8');
    } catch {
      current = ''; // no .env yet — we'll create it
    }
    const updated = upsertEnvVar(current, key, trimmed);
    fs.writeFileSync(file, updated, { encoding: 'utf8', mode: 0o600 });

    // Apply immediately so features pick it up without a restart.
    if (trimmed) process.env[key] = trimmed;
    else delete process.env[key];

    return { ok: true, status: getKeyStatus() };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Could not write the .env file.' };
  }
}

/** Re-read managed keys from the current .env into process.env (used by parseEnv consumers). */
export function reloadEnv(): void {
  try {
    const parsed = parseEnv(fs.readFileSync(envPath(), 'utf8'));
    for (const mk of MANAGED_KEYS) {
      if (parsed[mk.key] != null) process.env[mk.key] = parsed[mk.key];
    }
  } catch {
    /* no .env; nothing to reload */
  }
}
