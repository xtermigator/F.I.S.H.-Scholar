import type { Assignment, Course } from '../types';

/**
 * Grades engine (spec R35). Computes a course's current standing from **manually-entered
 * grades only** and, separately, a clearly-labeled projection.
 *
 * Academic-integrity rules (.kiro/steering/academic-integrity.md):
 *  - We never infer a grade. Only assignments with a `grade` object count toward "current".
 *  - Projections are always labeled as projections and clearly separated from actual results.
 *  - When no grades exist, we report "no grades recorded yet" rather than a number.
 *
 * Pure and testable (grades.test.ts).
 */

export interface GradedItem {
  assignmentId: string;
  title: string;
  pointsEarned: number;
  pointsPossible: number;
  percent: number;
  weightPercent?: number;
}

export interface CourseGradeSummary {
  courseId: string;
  courseCode: string;
  /** Assignments that have a real recorded grade. */
  gradedItems: GradedItem[];
  /** Whether any grade has been recorded. */
  hasGrades: boolean;
  /** Current earned percentage across recorded grades (points-based). null when none. */
  currentPercent: number | null;
  /** True when the course uses per-item weightPercent on its graded items. */
  weighted: boolean;
  /**
   * Projected final percentage, computed from recorded grades only (assumes remaining work
   * performs like the average so far). Always treat as a PROJECTION, never a real grade.
   */
  projectedPercent: number | null;
  /** How much of the course (by count) has been graded so far. */
  gradedCount: number;
  totalCount: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function computeCourseGrade(
  course: Pick<Course, 'id' | 'code'>,
  assignments: Assignment[],
): CourseGradeSummary {
  const courseAssignments = assignments.filter((a) => a.courseId === course.id);
  const graded: GradedItem[] = courseAssignments
    .filter((a) => a.grade && a.grade.pointsPossible > 0)
    .map((a) => {
      const g = a.grade!;
      return {
        assignmentId: a.id,
        title: a.title,
        pointsEarned: g.pointsEarned,
        pointsPossible: g.pointsPossible,
        percent: round1((g.pointsEarned / g.pointsPossible) * 100),
        weightPercent: g.weightPercent,
      };
    });

  const hasGrades = graded.length > 0;
  const weighted = hasGrades && graded.every((g) => typeof g.weightPercent === 'number' && g.weightPercent! > 0);

  let currentPercent: number | null = null;
  if (hasGrades) {
    if (weighted) {
      // Weighted average across the weights actually recorded so far.
      const totalWeight = graded.reduce((s, g) => s + (g.weightPercent || 0), 0);
      const weightedSum = graded.reduce((s, g) => s + g.percent * (g.weightPercent || 0), 0);
      currentPercent = totalWeight > 0 ? round1(weightedSum / totalWeight) : null;
    } else {
      // Points-based: total earned / total possible.
      const earned = graded.reduce((s, g) => s + g.pointsEarned, 0);
      const possible = graded.reduce((s, g) => s + g.pointsPossible, 0);
      currentPercent = possible > 0 ? round1((earned / possible) * 100) : null;
    }
  }

  // Projection = current average extended to the whole course (a projection, not a grade).
  const projectedPercent = currentPercent;

  return {
    courseId: course.id,
    courseCode: course.code,
    gradedItems: graded,
    hasGrades,
    currentPercent,
    weighted,
    projectedPercent,
    gradedCount: graded.length,
    totalCount: courseAssignments.length,
  };
}

/** Map a percentage to a common US letter grade. Labeled as informational, not official. */
export function percentToLetter(percent: number): string {
  if (percent >= 93) return 'A';
  if (percent >= 90) return 'A-';
  if (percent >= 87) return 'B+';
  if (percent >= 83) return 'B';
  if (percent >= 80) return 'B-';
  if (percent >= 77) return 'C+';
  if (percent >= 73) return 'C';
  if (percent >= 70) return 'C-';
  if (percent >= 60) return 'D';
  return 'F';
}

export function summarizeGrades(
  courses: Pick<Course, 'id' | 'code'>[],
  assignments: Assignment[],
): CourseGradeSummary[] {
  return courses.map((c) => computeCourseGrade(c, assignments));
}
