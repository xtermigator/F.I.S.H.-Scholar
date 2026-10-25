import { describe, it, expect } from 'vitest';
import {
  buildLiteratureKnowledgeSeed,
  KB_LITERATURE_SEED_IDS,
} from './knowledgeBase';
import type { Citation, EntityBase, Note, Reading } from '../types';

const seed = buildLiteratureKnowledgeSeed();

describe('literature knowledge base seed', () => {
  it('seeds the four real EDU 810 articles as citations', () => {
    const citations = (seed.citations ?? []) as (Citation & EntityBase)[];
    const ids = citations.map((c) => c.id);
    expect(ids).toEqual([
      'cit-boote-beile-2005',
      'cit-maxwell-2006',
      'cit-welsh-stt-2020',
      'cit-grant-osanloo-2014',
    ]);
    for (const c of citations) {
      expect(c.apa7).toContain(c.year);
      expect(c.inText.startsWith('(')).toBe(true);
      expect(c.doiOrUrl.startsWith('https://')).toBe(true);
      expect(c.coursesUsed).toContain('course-gmercyu-edu810');
      expect(c.keyQuotes.length).toBeGreaterThan(0);
      expect(c.isDemo).toBe(false);
    }
  });

  it('seeds matching required readings linked to the EDU 810 course', () => {
    const readings = (seed.readings ?? []) as (Reading & EntityBase)[];
    expect(readings.length).toBe(4);
    for (const r of readings) {
      expect(r.courseId).toBe('course-gmercyu-edu810');
      expect(r.required).toBe(true);
      expect(r.status).toBe('not_started'); // never fabricate progress
      expect(r.url?.startsWith('https://')).toBe(true);
      expect(r.isDemo).toBe(false);
    }
  });

  it('seeds the Gwynedd Mercy institution and EDU 810 course without invented details', () => {
    const course = (seed.courses ?? []).find(
      (e) => e.id === 'course-gmercyu-edu810',
    ) as any;
    expect(course).toBeDefined();
    expect(course.code).toBe('EDU 810');
    expect(course.institutionId).toBe('inst-gmercyu');
    // professor/policies must stay blank - nothing invented (academic-integrity)
    expect(course.professor.name).toBe('');
    expect(course.policies.lateWork).toBe('');
  });

  it('seeds synthesis notes for STT phases and the review rubric', () => {
    const notes = (seed.notes ?? []) as (Note & EntityBase)[];
    const ids = notes.map((n) => n.id);
    expect(ids).toEqual(
      expect.arrayContaining(['note-stt-five-phases', 'note-lit-review-rubric']),
    );
    const stt = notes.find((n) => n.id === 'note-stt-five-phases');
    expect(stt?.body).toContain('Active Knowledge Producer');
    for (const n of notes) expect(n.isDemo).toBe(false);
  });

  it('exposes stable ids and never marks knowledge records as demo', () => {
    expect(KB_LITERATURE_SEED_IDS.citations.length).toBe(4);
    for (const entities of Object.values(seed)) {
      for (const e of entities as EntityBase[]) {
        expect(e.isDemo).toBe(false);
        expect(e.id.length).toBeGreaterThan(0);
      }
    }
  });
});
