import { describe, it, expect } from 'vitest';
import {
  parsePastedSyllabus,
  normalizeExtracted,
  confirmToRecords,
} from './syllabusImport';

const NOW = new Date('2026-09-15T09:00:00');

describe('parsePastedSyllabus', () => {
  it('turns each non-empty line into a candidate and strips bullets', () => {
    const preview = parsePastedSyllabus('- Essay one\n* Reflection two\n1. Project three', NOW);
    expect(preview.candidates.map((c) => c.title)).toEqual([
      'Essay one',
      'Reflection two',
      'Project three',
    ]);
  });

  it('extracts a parseable "(due ISO)" date and normalizes it', () => {
    const preview = parsePastedSyllabus('Literature Review (due 2026-10-01)', NOW);
    const c = preview.candidates[0];
    expect(c.title).toBe('Literature Review');
    expect(c.dueDate).toBe('2026-10-01');
    expect(c.dateParsed).toBe(true);
  });

  it('extracts a trailing ISO date after a dash', () => {
    const preview = parsePastedSyllabus('Final Paper — 2026-12-05', NOW);
    expect(preview.candidates[0].title).toBe('Final Paper');
    expect(preview.candidates[0].dueDate).toBe('2026-12-05');
  });

  it('keeps unparseable due text as rawDue and does NOT fabricate a date', () => {
    const preview = parsePastedSyllabus('Discussion post (due end of week 3)', NOW);
    const c = preview.candidates[0];
    expect(c.dateParsed).toBe(false);
    expect(c.dueDate).toBe('');
    expect(c.rawDue).toMatch(/end of week 3/);
  });

  it('carries a preview note about not guessing dates', () => {
    const preview = parsePastedSyllabus('Essay', NOW);
    expect(preview.note).toMatch(/Nothing is saved until you confirm/i);
  });
});

describe('normalizeExtracted', () => {
  it('maps AI assignments into candidates and keeps readings + professor', () => {
    const preview = normalizeExtracted({
      professor: { name: 'Dr. X' },
      assignments: [
        { title: 'Case Study', dueDate: '2026-10-10', description: 'analyze', weight: '15%' },
        { title: '', dueDate: '2026-01-01' }, // dropped (no title)
      ],
      readings: ['Source A', ''],
    }, NOW);
    expect(preview.candidates).toHaveLength(1);
    expect(preview.candidates[0].title).toBe('Case Study');
    expect(preview.candidates[0].dueDate).toBe('2026-10-10');
    expect(preview.candidates[0].weight).toBe('15%');
    expect(preview.readings).toEqual(['Source A']);
    expect(preview.professorName).toBe('Dr. X');
  });

  it('does not fabricate a date for an unparseable extracted due value', () => {
    const preview = normalizeExtracted({
      assignments: [{ title: 'Reflection', dueDate: 'sometime in October' }],
    }, NOW);
    expect(preview.candidates[0].dateParsed).toBe(false);
    expect(preview.candidates[0].dueDate).toBe('');
    expect(preview.candidates[0].rawDue).toMatch(/October/);
  });
});

describe('confirmToRecords', () => {
  it('only converts selected candidates with a title', () => {
    const preview = parsePastedSyllabus('Essay one (due 2026-10-01)\nEssay two', NOW);
    // Deselect the second one.
    preview.candidates[1].selected = false;
    const records = confirmToRecords(preview.candidates, 'course-1');
    expect(records).toHaveLength(1);
    expect(records[0].title).toBe('Essay one');
    expect(records[0].courseId).toBe('course-1');
    expect(records[0].dueDate).toBe('2026-10-01');
    expect(records[0].status).toBe('not_started');
  });

  it('preserves raw due text when no ISO date was parsed (never invents)', () => {
    const preview = parsePastedSyllabus('Post (due end of week)', NOW);
    const records = confirmToRecords(preview.candidates, 'course-1');
    expect(records[0].dueDate).toMatch(/end of week/);
  });

  it('returns nothing when nothing is selected', () => {
    const preview = parsePastedSyllabus('A\nB', NOW);
    preview.candidates.forEach((c) => (c.selected = false));
    expect(confirmToRecords(preview.candidates, 'course-1')).toEqual([]);
  });
});
