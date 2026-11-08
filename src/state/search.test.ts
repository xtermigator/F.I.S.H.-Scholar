import { describe, it, expect } from 'vitest';
import type {
  Course,
  Assignment,
  Discussion,
  Reading,
  Citation,
  Note,
} from '../types';
import { searchAll, type SearchIndexData } from './search';

function course(id: string, code: string, title = ''): Course {
  return {
    id,
    institutionId: 'i',
    code,
    title,
    department: '',
    credits: 3,
    semester: 'Fall 2026',
    professor: { name: '', email: '', officeHours: '', preferredCommunication: '' },
    policies: { lateWork: '', attendance: '', aiPolicy: '', accommodations: '' },
    gradingScale: [],
    color: '',
  } as Course;
}

function assignment(over: Partial<Assignment>): Assignment {
  return {
    id: 'a', courseId: 'c1', title: 'Paper', dueDate: '', dueTime: '', urgency: 'due_soon',
    points: 0, weight: '', estimatedMinutes: 30, prompt: '', rubric: '', requiredReadings: [],
    checklist: [], drafts: [], notes: '', sourcesCited: [], currentPhase: 'draft', ...over,
  } as Assignment;
}

function data(partial: Partial<SearchIndexData>): SearchIndexData {
  return {
    courses: [course('c1', 'ED 9413', 'Curriculum Leadership')],
    assignments: [],
    discussions: [],
    discussionResponses: [],
    readings: [],
    assessments: [],
    citations: [],
    notes: [],
    ...partial,
  };
}

describe('searchAll', () => {
  it('returns nothing for an empty query', () => {
    expect(searchAll('', data({}))).toEqual([]);
    expect(searchAll('   ', data({}))).toEqual([]);
  });

  it('finds an assignment by title and includes course code + tab', () => {
    const results = searchAll('literature', data({
      assignments: [assignment({ id: 'a1', title: 'Literature Review', courseId: 'c1' })],
    }));
    const hit = results.find((r) => r.id === 'a1');
    expect(hit).toBeTruthy();
    expect(hit?.type).toBe('assignment');
    expect(hit?.courseCode).toBe('ED 9413');
    expect(hit?.tab).toBe('ASSIGNMENTS');
  });

  it('ranks title matches above notes/prompt matches', () => {
    const results = searchAll('design', data({
      assignments: [
        assignment({ id: 'title-hit', title: 'Design Project' }),
        assignment({ id: 'notes-hit', title: 'Essay', notes: 'remember to design carefully' }),
      ],
    }));
    const titleIdx = results.findIndex((r) => r.id === 'title-hit');
    const notesIdx = results.findIndex((r) => r.id === 'notes-hit');
    expect(titleIdx).toBeGreaterThanOrEqual(0);
    expect(notesIdx).toBeGreaterThan(titleIdx);
  });

  it('searches across multiple entity types', () => {
    const results = searchAll('access', data({
      readings: [{ id: 'r1', courseId: 'c1', title: 'Access and Equity', required: true, status: 'not_started', createdAt: '', updatedAt: '' } as Reading],
      citations: [{ id: 'cit1', authors: 'Doe', year: '2020', title: 'Universal Access', source: '', doiOrUrl: '', apa7: '', inText: '', notes: '', keyQuotes: [], keywords: [], coursesUsed: [], papersCitedIn: [] } as Citation],
      notes: [{ id: 'n1', body: 'access notes for the week', createdAt: '', updatedAt: '' } as Note],
    }));
    const types = new Set(results.map((r) => r.type));
    expect(types.has('reading')).toBe(true);
    expect(types.has('citation')).toBe(true);
    expect(types.has('note')).toBe(true);
  });

  it('respects a type filter', () => {
    const results = searchAll('curriculum', data({
      assignments: [assignment({ id: 'a1', title: 'Curriculum plan' })],
    }), { types: ['assignment'] });
    expect(results.every((r) => r.type === 'assignment')).toBe(true);
    // The course "Curriculum Leadership" should be excluded by the filter.
    expect(results.find((r) => r.type === 'course')).toBeUndefined();
  });

  it('respects a course filter', () => {
    const results = searchAll('paper', data({
      courses: [course('c1', 'ED 9413'), course('c2', 'FYC 6234')],
      assignments: [
        assignment({ id: 'a1', title: 'Paper one', courseId: 'c1' }),
        assignment({ id: 'a2', title: 'Paper two', courseId: 'c2' }),
      ],
    }), { courseId: 'c2' });
    expect(results.map((r) => r.id)).toEqual(['a2']);
  });

  it('matches a course by code', () => {
    const results = searchAll('ED 9413', data({}));
    expect(results.find((r) => r.type === 'course')?.courseCode).toBe('ED 9413');
  });

  it('supports multi-term queries (all terms contribute)', () => {
    const results = searchAll('universal design', data({
      citations: [{ id: 'cit1', authors: 'A', year: '2020', title: 'Universal Design in Practice', source: '', doiOrUrl: '', apa7: '', inText: '', notes: '', keyQuotes: [], keywords: [], coursesUsed: [], papersCitedIn: [] } as Citation],
    }));
    expect(results[0]?.id).toBe('cit1');
  });
});
