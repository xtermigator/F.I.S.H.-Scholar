import { describe, it, expect } from 'vitest';
import type { Assignment, Course } from '../types';
import { computeCourseGrade, percentToLetter, summarizeGrades } from './grades';

function course(id: string, code: string): Pick<Course, 'id' | 'code'> {
  return { id, code };
}

function assignment(over: Partial<Assignment>): Assignment {
  return {
    id: 'a', courseId: 'c1', title: 'Item', dueDate: '', dueTime: '', urgency: 'due_soon',
    points: 0, weight: '', estimatedMinutes: 30, prompt: '', rubric: '', requiredReadings: [],
    checklist: [], drafts: [], notes: '', sourcesCited: [], currentPhase: 'draft', ...over,
  } as Assignment;
}

describe('computeCourseGrade', () => {
  it('reports no grades when none recorded (never invents a number)', () => {
    const s = computeCourseGrade(course('c1', 'ED 9413'), [
      assignment({ id: 'a1', courseId: 'c1' }),
    ]);
    expect(s.hasGrades).toBe(false);
    expect(s.currentPercent).toBeNull();
    expect(s.projectedPercent).toBeNull();
    expect(s.totalCount).toBe(1);
  });

  it('computes points-based current percent from recorded grades only', () => {
    const s = computeCourseGrade(course('c1', 'ED 9413'), [
      assignment({ id: 'a1', courseId: 'c1', grade: { pointsEarned: 45, pointsPossible: 50 } }),
      assignment({ id: 'a2', courseId: 'c1', grade: { pointsEarned: 40, pointsPossible: 50 } }),
      assignment({ id: 'a3', courseId: 'c1' }), // ungraded — excluded
    ]);
    expect(s.hasGrades).toBe(true);
    expect(s.weighted).toBe(false);
    // (45+40)/(50+50) = 85%
    expect(s.currentPercent).toBe(85);
    expect(s.gradedCount).toBe(2);
    expect(s.totalCount).toBe(3);
  });

  it('computes a weighted average when all graded items carry weights', () => {
    const s = computeCourseGrade(course('c1', 'ED 9413'), [
      assignment({ id: 'a1', courseId: 'c1', grade: { pointsEarned: 100, pointsPossible: 100, weightPercent: 30 } }),
      assignment({ id: 'a2', courseId: 'c1', grade: { pointsEarned: 80, pointsPossible: 100, weightPercent: 10 } }),
    ]);
    expect(s.weighted).toBe(true);
    // (100*30 + 80*10) / (30+10) = (3000+800)/40 = 95
    expect(s.currentPercent).toBe(95);
  });

  it('ignores grades with zero possible points', () => {
    const s = computeCourseGrade(course('c1', 'ED 9413'), [
      assignment({ id: 'a1', courseId: 'c1', grade: { pointsEarned: 0, pointsPossible: 0 } }),
    ]);
    expect(s.hasGrades).toBe(false);
    expect(s.currentPercent).toBeNull();
  });

  it('only counts assignments for the given course', () => {
    const s = computeCourseGrade(course('c1', 'ED 9413'), [
      assignment({ id: 'a1', courseId: 'c1', grade: { pointsEarned: 9, pointsPossible: 10 } }),
      assignment({ id: 'b1', courseId: 'c2', grade: { pointsEarned: 1, pointsPossible: 10 } }),
    ]);
    expect(s.currentPercent).toBe(90);
    expect(s.gradedCount).toBe(1);
  });
});

describe('percentToLetter', () => {
  it('maps common ranges', () => {
    expect(percentToLetter(95)).toBe('A');
    expect(percentToLetter(91)).toBe('A-');
    expect(percentToLetter(85)).toBe('B');
    expect(percentToLetter(72)).toBe('C-');
    expect(percentToLetter(50)).toBe('F');
  });
});

describe('summarizeGrades', () => {
  it('returns one summary per course', () => {
    const summaries = summarizeGrades(
      [course('c1', 'ED 9413'), course('c2', 'FYC 6234')],
      [assignment({ id: 'a1', courseId: 'c1', grade: { pointsEarned: 9, pointsPossible: 10 } })],
    );
    expect(summaries).toHaveLength(2);
    expect(summaries[0].currentPercent).toBe(90);
    expect(summaries[1].hasGrades).toBe(false);
  });
});
