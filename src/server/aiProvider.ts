/**
 * AI provider abstraction for F.I.S.H. Scholar (spec R8, security + academic-integrity steering).
 *
 * Goals:
 *  - No vendor lock-in: the app talks to a provider interface, not a specific SDK.
 *  - Keys stay server-side: adapters read process.env; keys are NEVER returned to the client.
 *  - Honest degradation: when no provider is configured, callers get a clearly-labeled
 *    "unavailable / unverified" result — we never fabricate citations, DOIs, or facts.
 *
 * This module is imported only by the Express server (server.ts). The client receives, at most,
 * provider capability metadata via /api/ai/providers — never endpoints or keys.
 */

export interface AIGenerateRequest {
  /** System instruction / role framing. */
  system?: string;
  /** User prompt. */
  prompt: string;
  /** Optional model override. */
  model?: string;
  /** When true, the adapter should request/parse JSON output. */
  json?: boolean;
}

export interface AIGenerateResult {
  /** Raw text (or JSON string when json=true). Empty when unavailable. */
  text: string;
  /** The provider that produced the result. */
  provider: string;
  model?: string;
  /**
   * True only when a real configured provider produced this. When false, the content is a
   * fallback/unavailable placeholder and MUST be treated as unverified by callers/UI.
   */
  verified: boolean;
  /** Human-readable note for unavailable/fallback cases. */
  note?: string;
}

export interface AIProviderAdapter {
  readonly id: string;
  readonly label: string;
  /** Whether required env/config is present so this provider can actually be used. */
  isConfigured(): boolean;
  /** Capability flags surfaced to the client (no secrets). */
  capabilities(): string[];
  generate(req: AIGenerateRequest): Promise<AIGenerateResult>;
}

/** Client-safe provider descriptor (no keys, no endpoints). */
export interface PublicProviderInfo {
  id: string;
  label: string;
  configured: boolean;
  capabilities: string[];
  isDefault: boolean;
}

const UNAVAILABLE_NOTE =
  'AI assistance is not configured. Your academic records remain fully accessible.';

/** A standard "unavailable" result — honest, never fabricated (academic-integrity steering). */
export function unavailableResult(provider: string): AIGenerateResult {
  return { text: '', provider, verified: false, note: UNAVAILABLE_NOTE };
}

// ---------------------------------------------------------------------------
// Gemini adapter (existing provider)
// ---------------------------------------------------------------------------

export class GeminiAdapter implements AIProviderAdapter {
  readonly id = 'gemini';
  readonly label = 'Google Gemini';
  private defaultModel: string;

  constructor(defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash') {
    this.defaultModel = defaultModel;
  }

  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  capabilities(): string[] {
    return ['chat', 'json', 'document_analysis', 'citation_extraction'];
  }

  async generate(req: AIGenerateRequest): Promise<AIGenerateResult> {
    if (!this.isConfigured()) return unavailableResult(this.id);
    // Lazy import so the server starts even if the SDK isn't installed.
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const model = req.model || this.defaultModel;
    const response = await ai.models.generateContent({
      model,
      contents: req.system ? `${req.system}\n\n${req.prompt}` : req.prompt,
      config: req.json ? { responseMimeType: 'application/json' } : undefined,
    });
    return {
      text: response.text || '',
      provider: this.id,
      model,
      verified: true,
    };
  }
}

// ---------------------------------------------------------------------------
// "Anime AI" adapter — PLACEHOLDER (spec R8.3)
// ---------------------------------------------------------------------------

/**
 * Placeholder for the student's external "Anime AI" provider. It reads the documented env
 * vars but is intentionally INERT: we do not invent endpoints or request/response formats.
 * Wire the real request once official API documentation is provided.
 *
 * Env: ANIME_AI_API_KEY, ANIME_AI_BASE_URL, ANIME_AI_MODEL
 */
export class AnimeAiAdapter implements AIProviderAdapter {
  readonly id = 'anime_ai';
  readonly label = 'Anime AI (custom)';

  isConfigured(): boolean {
    // Considered "configured" only when the operator has supplied all three values AND
    // the adapter has been enabled. Until the real API shape is known we keep it inert.
    return false;
  }

  hasEnv(): boolean {
    return !!(
      process.env.ANIME_AI_API_KEY &&
      process.env.ANIME_AI_BASE_URL &&
      process.env.ANIME_AI_MODEL
    );
  }

  capabilities(): string[] {
    return ['chat'];
  }

  async generate(_req: AIGenerateRequest): Promise<AIGenerateResult> {
    // Do NOT call an invented endpoint. Return an honest, labeled placeholder.
    return {
      text: '',
      provider: this.id,
      verified: false,
      note: this.hasEnv()
        ? 'Anime AI credentials detected, but the adapter is awaiting official API documentation before it can send requests.'
        : 'Anime AI is not configured. Set ANIME_AI_API_KEY, ANIME_AI_BASE_URL, and ANIME_AI_MODEL, then provide the API docs to finish the adapter.',
    };
  }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const adapters: AIProviderAdapter[] = [new GeminiAdapter(), new AnimeAiAdapter()];

/** The provider chosen by AI_PROVIDER env, else the first configured one, else Gemini. */
export function getActiveProvider(): AIProviderAdapter {
  const preferred = process.env.AI_PROVIDER;
  if (preferred) {
    const match = adapters.find((a) => a.id === preferred);
    if (match) return match;
  }
  return adapters.find((a) => a.isConfigured()) || adapters[0];
}

export function listProviders(): PublicProviderInfo[] {
  const active = getActiveProvider();
  return adapters.map((a) => ({
    id: a.id,
    label: a.label,
    configured: a.isConfigured(),
    capabilities: a.capabilities(),
    isDefault: a.id === active.id,
  }));
}

/**
 * Generate through the active provider. Never throws for "unconfigured" — returns an honest
 * unavailable result so one failing integration cannot crash the dashboard (architecture steering).
 */
export async function generate(req: AIGenerateRequest): Promise<AIGenerateResult> {
  const provider = getActiveProvider();
  try {
    if (!provider.isConfigured()) return unavailableResult(provider.id);
    return await provider.generate(req);
  } catch (err: any) {
    return {
      text: '',
      provider: provider.id,
      verified: false,
      note:
        'AI assistance is temporarily unavailable. Your academic records remain accessible.' +
        (err?.message ? ` (${err.message})` : ''),
    };
  }
}
