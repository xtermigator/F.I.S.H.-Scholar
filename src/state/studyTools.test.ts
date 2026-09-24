import { describe, it, expect } from 'vitest';
import type { Course, Reading, Assessment, Citation } from '../types';
import {
  buildStudyGuide,
  buildFlashcards,
  buildPracticeQuestions,
  STUDY_DISCLAIMER,
} from './studyTools';

function course(id: string, code: string): Pick<Course, 'id' | 'code'> {
  return { id, code };
}

function reading(over: Partial<Reading>): Reading {
  return {
    id: 'r', courseId: 'c1', title: 'Reading', required: true, status: 'not_started',
    createdAt: '', updatedAt: '', ...over,
  } as Reading;
}

function assessment(over: Partial<Assessment>): Assessment {
  return {
    id: 's', courseId: 'c1', name: 'Quiz', type: 'Quiz', studyStatus: 'not_started',
    createdAt: '', updatedAt: '', ...over,
  } as Assessment;
}

function citation(over: Partial<Citation>): Citation {
  return {
    id: 'cit', authors: 'Doe, J.', year: '2020', title: 'A Source', source: '', doiOrUrl: '',
    apa7: 'Doe, J. (2020). A Source.', inText: '(Doe, 2020)', notes: '', keyQuotes: [], keywords: [],
    coursesUsed: ['c1'], papersCitedIn: [], ...over,
  } as Citation;
}

describe('buildStudyGuide', () => {
  it('always carries the non-official disclaimer', () => {
    const guide = buildStudyGuide(course('c1', 'ED 9413'), [], [], []);
    expect(guide.disclaimer).toBe(STUDY_DISCLAIMER);
    expect(guide.disclaimer).toMatch(/not official/i);
  });

  it('is empty when there is no source material (never invents)', () => {
    const guide = buildStudyGuide(course('c1', 'ED 9413'), [], [], []);
    expect(guide.empty).toBe(true);
    expect(guide.sections).toHaveLength(0);
  });

  it('builds sections from the student\'s own readings, assessments, and citations', () => {
    const guide = buildStudyGuide(
      course('c1', 'ED 9413'),
      [reading({ id: 'r1', concepts: ['Universal Design'], quotations: ['A passage'] })],
      [assessment({ id: 's1', coverage: ['Module 3'] })],
      [citation({ id: 'cit1', keyQuotes: ['Access is love'] })],
    );
    const headings = guide.sections.map((s) => s.heading);
    expect(headings.some((h) => /Topics to review/.test(h))).toBe(true);
    expect(headings.some((h) => /Key concepts/.test(h))).toBe(true);
    expect(headings.some((h) => /Source highlights/.test(h))).toBe(true);
    const bullets = guide.sections.flatMap((s) => s.bullets);
    expect(bullets).toContain('Universal Design');
    expect(bullets).toContain('Module 3');
  });

  it('only uses material for the given course', () => {
    const guide = buildStudyGuide(
      course('c1', 'ED 9413'),
      [reading({ id: 'r2', courseId: 'c2', concepts: ['Other course concept'] })],
      [],
      [],
    );
    expect(guide.empty).toBe(true);
  });
});

describe('buildFlashcards', () => {
  it('makes concept prompts with a fill-in back (no fabricated definition)', () => {
    const cards = buildFlashcards(course('c1', 'ED 9413'),
      [reading({ id: 'r1', concepts: ['Scaffolding'] })], []);
    const card = cards.find((c) => c.front.includes('Scaffolding'));
    expect(card).toBeTruthy();
    expect(card?.back).toMatch(/fill this in/i);
  });

  it('makes citation recall cards from saved APA data', () => {
    const cards = buildFlashcards(course('c1', 'ED 9413'), [],
      [citation({ id: 'cit1', inText: '(Doe, 2020)', apa7: 'Doe, J. (2020). A Source.' })]);
    const card = cards.find((c) => c.front.includes('(Doe, 2020)'));
    expect(card?.back).toBe('Doe, J. (2020). A Source.');
  });
});

describe('buildPracticeQuestions', () => {
  it('creates open-ended prompts from coverage and concepts, tagged with their basis', () => {
    const qs = buildPracticeQuestions(
      course('c1', 'ED 9413'),
      [reading({ id: 'r1', concepts: ['Equity'] })],
      [assessment({ id: 's1', coverage: ['Chapter 2'] })],
    );
    expect(qs.some((q) => q.prompt.includes('Chapter 2') && /coverage/i.test(q.basedOn))).toBe(true);
    expect(qs.some((q) => q.prompt.includes('Equity') && /concept/i.test(q.basedOn))).toBe(true);
  });

  it('returns nothing when there is no material', () => {
    expect(buildPracticeQuestions(course('c1', 'ED 9413'), [], [])).toEqual([]);
  });
});
