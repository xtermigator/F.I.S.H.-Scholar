import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  GeminiAdapter,
  AnimeAiAdapter,
  listProviders,
  generate,
  getActiveProvider,
} from './aiProvider';

/**
 * AI provider abstraction: no vendor lock-in, keys stay server-side, honest degradation
 * (spec R8; security + academic-integrity steering).
 */
describe('AI provider abstraction', () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.ANIME_AI_API_KEY;
    delete process.env.ANIME_AI_BASE_URL;
    delete process.env.ANIME_AI_MODEL;
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it('reports Gemini unconfigured without a key', () => {
    expect(new GeminiAdapter().isConfigured()).toBe(false);
  });

  it('reports Gemini configured when a key is present', () => {
    process.env.GEMINI_API_KEY = 'test-key';
    expect(new GeminiAdapter().isConfigured()).toBe(true);
  });

  it('keeps the Anime AI adapter inert (no invented endpoints) until docs are provided', () => {
    const adapter = new AnimeAiAdapter();
    expect(adapter.isConfigured()).toBe(false);
  });

  it('Anime AI generate() never calls an endpoint and returns an honest, unverified note', async () => {
    const adapter = new AnimeAiAdapter();
    const result = await adapter.generate({ prompt: 'hi' });
    expect(result.verified).toBe(false);
    expect(result.text).toBe('');
    expect(result.note).toMatch(/not configured|awaiting official API documentation/i);
  });

  it('generate() degrades honestly when no provider is configured (never fabricates)', async () => {
    const result = await generate({ prompt: 'What is due this week?' });
    expect(result.verified).toBe(false);
    expect(result.text).toBe('');
    expect(result.note).toBeTruthy();
  });

  it('listProviders() exposes capability metadata but never keys or endpoints', () => {
    const providers = listProviders();
    const ids = providers.map((p) => p.id).sort();
    expect(ids).toEqual(['anime_ai', 'gemini']);
    for (const p of providers) {
      expect(p).not.toHaveProperty('apiKey');
      expect(p).not.toHaveProperty('endpoint');
      expect(Array.isArray(p.capabilities)).toBe(true);
    }
  });

  it('honors AI_PROVIDER selection when set', () => {
    process.env.AI_PROVIDER = 'anime_ai';
    expect(getActiveProvider().id).toBe('anime_ai');
  });
});
