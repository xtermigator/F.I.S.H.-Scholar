import { describe, it, expect } from 'vitest';
import rows from './edu810SourceRegistry.json';
import { importRegistryRows, buildPromotionReadings, PROMOTION_CANDIDATES } from './registryImport';
import { buildLiteratureKnowledgeSeed } from './knowledgeBase';
import type { Reading } from '../types';

const R = rows as any[];
const seeded = (buildLiteratureKnowledgeSeed().readings ?? []) as unknown as Reading[];

describe('registry import lane', () => {
  it('never marks anything verified or read', () => {
    const out = importRegistryRows(R, seeded);
    expect(out.length).toBeGreaterThan(80);
    for (const r of out) {
      expect(r.verified).toBe(false);
      expect(r.status).toBe('not_started');
      expect(r.notes).toContain('UNVERIFIED LINK');
    }
  });
  it('skips sources already in the verified seed', () => {
    const titles = importRegistryRows(R, seeded).map((r) => r.title.toLowerCase());
    expect(titles.some((t) => t.startsWith('scholars before researchers'))).toBe(false);
    expect(titles.some((t) => t.startsWith('scholar transformation theory'))).toBe(false);
  });
  it('stages promotion candidates unverified with no invented metadata', () => {
    const p = buildPromotionReadings(R);
    expect(p.map((r) => r.id).sort()).toEqual(Object.keys(PROMOTION_CANDIDATES).map((k) => `rdg-edu810-reg-${k.toLowerCase()}`).sort());
    for (const r of p) { expect(r.verified).toBe(false); expect(r.author).toBeUndefined(); expect(r.doi).toBeUndefined(); }
    expect(p.find((r) => r.id.endsWith('079'))!.notes).toContain('DESIGN LEAD ONLY');
  });
});
