/**
 * Server-side anam.ai adapter (avatar / "Talk to FISH").
 *
 * anam.ai renders a real-time video avatar; the ANSWERS come from an LLM. We mint short-lived
 * SESSION TOKENS server-side so the API key never reaches the browser (per anam's docs:
 * "The session token endpoint must be called from your server ... would expose your API key").
 *
 * Auth model (.kiro/steering/security.md): ANAM_API_KEY lives only in server env; the client
 * only ever receives the 1-hour session token.
 *
 * Persona config is EPHEMERAL by default (avatar/voice/LLM chosen at run time) so it works
 * without pre-creating a persona; set ANAM_PERSONA_ID to use a saved persona instead.
 */

const ANAM_BASE = 'https://api.anam.ai/v1';

export function isAnamConfigured(): boolean {
  return !!process.env.ANAM_API_KEY;
}

/**
 * Result envelope. Single interface with optional fields (not a discriminated union) so callers
 * can read `.error`/`.unconfigured` after checking `.ok` without cross-module narrowing issues.
 */
export interface AnamResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  unconfigured?: boolean;
}

export interface SessionTokenResult {
  sessionToken: string;
}

/**
 * Persona config sent to anam. Two shapes:
 *  - { personaId } to use a saved persona (ANAM_PERSONA_ID), or
 *  - an ephemeral config with avatarId/voiceId/llmId (+ optional systemPrompt).
 *
 * For a knowledge-base chat, llmId should be your registered custom LLM (ANAM_LLM_ID) that
 * points at our /api/anam/llm bridge; the bridge does the grounding.
 */
function buildPersonaConfig(): Record<string, unknown> {
  const personaId = process.env.ANAM_PERSONA_ID;
  if (personaId) {
    return { personaId };
  }
  // Ephemeral persona. Defaults are safe placeholders the operator overrides via env; anam
  // validates these, so an unconfigured avatar/voice/llm will surface a clear error rather
  // than silently doing the wrong thing.
  const config: Record<string, unknown> = {
    name: 'FISH Scholar Companion',
    avatarId: process.env.ANAM_AVATAR_ID || '',
    voiceId: process.env.ANAM_VOICE_ID || '',
    llmId: process.env.ANAM_LLM_ID || '',
  };
  if (process.env.ANAM_SYSTEM_PROMPT) {
    config.systemPrompt = process.env.ANAM_SYSTEM_PROMPT;
  }
  return config;
}

/** True when an ephemeral config is missing the pieces anam requires. */
export function ephemeralConfigIncomplete(): boolean {
  if (process.env.ANAM_PERSONA_ID) return false;
  return !(process.env.ANAM_AVATAR_ID && process.env.ANAM_VOICE_ID && process.env.ANAM_LLM_ID);
}

/**
 * Mint a short-lived anam session token. Never returns the API key. Honest failures: unconfigured
 * key, incomplete ephemeral config, or an upstream/network error.
 */
export async function createSessionToken(
  clientLabel = 'fish-scholar',
): Promise<AnamResult<SessionTokenResult>> {
  const key = process.env.ANAM_API_KEY;
  if (!key) {
    return { ok: false, unconfigured: true, error: 'anam.ai is not configured. Set ANAM_API_KEY on the server.' };
  }
  if (ephemeralConfigIncomplete()) {
    return {
      ok: false,
      unconfigured: true,
      error:
        'anam.ai avatar is not fully configured. Set ANAM_PERSONA_ID, or all of ANAM_AVATAR_ID, ANAM_VOICE_ID, and ANAM_LLM_ID.',
    };
  }

  try {
    const res = await fetch(`${ANAM_BASE}/auth/session-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientLabel, personaConfig: buildPersonaConfig() }),
    });
    const json = (await res.json()) as any;
    if (!res.ok) {
      return { ok: false, error: json?.message || `anam session-token error (HTTP ${res.status}).` };
    }
    if (!json?.sessionToken) {
      return { ok: false, error: 'anam did not return a session token.' };
    }
    return { ok: true, data: { sessionToken: json.sessionToken } };
  } catch (err: any) {
    return {
      ok: false,
      error:
        'anam.ai could not be reached. Your F.I.S.H. Scholar data is safe.' +
        (err?.message ? ` (${err.message})` : ''),
    };
  }
}
