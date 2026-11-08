import { describe, it, expect } from 'vitest';
import type { Assignment, Course, Discussion, DiscussionResponse, Citation } from '../types';
import {
  weeklyReport,
  discussionParticipationReport,
  sourceListReport,
  semesterSummaryReport,
  generateReport,
  type ReportData,
} from './reports';

const NOW = new Date('2026-09-15T09:00:00');

function course(id: string, code: string): Course {
  return {
    id, institutionId: 'i', code, title: '', department: '', credits: 3, semester: 'Fall 2026',
    professor: { name: '', email: '', officeHours: '', preferredCommunication: '' },
    policies: { lateWork: '', attendance: '', aiPolicy: '', accommodations: '' },
    gradingScale: [], color: '',
  } as Course;
}

function assignment(over: Partial<Assignment>): Assignment {
  return {
    id: 'a', courseId: 'c1', title: 'Paper', dueDate: '', dueTime: '', urgency: 'due_soon',
    points: 0, weight: '', estimatedMinutes: 30, prompt: '', rubric: '', requiredReadings: [],
    checklist: [], drafts: [], notes: '', sourcesCited: [], currentPhase: 'draft', ...over,
  } as Assignment;
}

function discussion(over: Partial<Discussion>): Discussion {
  return {
    id: 'd1', courseId: 'c1', title: 'Week 1', minResponses: 2, status: 'in_progress',
    originalPost: { status: 'submitted' }, createdAt: '', updatedAt: '', ...over,
  };
}

function reportData(partial: Partial<ReportData>): ReportData {
  return {
    courses: [course('c1', 'ED 9413')],
    assignments: [],
    discussions: [],
    discussionResponses: [],
    readings: [],
    assessments: [],
    citations: [],
    ...partial,
  };
}

describe('weeklyReport', () => {
  it('lists items due this week grouped by course code', () => {
    const md = weeklyReport(reportData({
      assignments: [assignment({ id: 'a1', title: 'Essay', courseId: 'c1', dueDate: '2026-09-17' })],
    }), NOW);
    expect(md).toMatch(/# Weekly Academic Report/);
    expect(md).toMatch(/## ED 9413/);
    expect(md).toMatch(/Essay/);
  });

  it('handles an empty week honestly', () => {
    const md = weeklyReport(reportData({}), NOW);
    expect(md).toMatch(/No dated items/);
  });
});

describe('discussionParticipationReport', () => {
  it('reports post status and reply progress', () => {
    const md = discussionParticipationReport(
      [discussion({ id: 'd1', minResponses: 2 })],
      [{ id: 'r1', discussionId: 'd1', classmateName: 'A', drafted: true, submitted: true, followUpRequired: false, createdAt: '', updatedAt: '' } as DiscussionResponse],
      [course('c1', 'ED 9413')],
    );
    expect(md).toMatch(/Initial post: Submitted/);
    expect(md).toMatch(/Required replies: 1\/2 complete \(1 remaining\)/);
  });

  it('handles no discussions', () => {
    expect(discussionParticipationReport([], [], [])).toMatch(/No discussions tracked/);
  });
});

describe('sourceListReport', () => {
  it('prefers APA reference and flags unverified entries', () => {
    const cites: Citation[] = [
      { id: 'c1', authors: 'Doe, J.', year: '2020', title: 'A', source: 'J', doiOrUrl: '', apa7: 'Doe, J. (2020). A. J.', inText: '', notes: '', keyQuotes: [], keywords: [], coursesUsed: [], papersCitedIn: [] } as Citation,
      { id: 'c2', authors: 'Smith', year: '2021', title: 'B', source: '', doiOrUrl: '', apa7: '', inText: '', notes: '', keyQuotes: [], keywords: [], coursesUsed: [], papersCitedIn: [] } as Citation,
    ];
    const md = sourceListReport(cites);
    expect(md).toMatch(/Doe, J\. \(2020\)\. A\. J\./);
    expect(md).toMatch(/unverified/);
  });

  it('handles empty vault', () => {
    expect(sourceListReport([])).toMatch(/No sources saved/);
  });
});

describe('semesterSummaryReport', () => {
  it('labels grade figures as projections, never official', () => {
    const md = semesterSummaryReport(reportData({
      assignments: [assignment({ id: 'a1', courseId: 'c1', grade: { pointsEarned: 9, pointsPossible: 10 } })],
    }), NOW);
    expect(md).toMatch(/# Semester Summary/);
    expect(md).toMatch(/90% recorded so far/);
    expect(md).toMatch(/not an official grade/i);
  });

  it('says no grades recorded when there are none', () => {
    const md = semesterSummaryReport(reportData({}), NOW);
    expect(md).toMatch(/no grades recorded yet/i);
  });
});

describe('generateReport', () => {
  it('dispatches by kind', () => {
    const data = reportData({});
    expect(generateReport('weekly', data, NOW)).toMatch(/Weekly Academic Report/);
    expect(generateReport('participation', data, NOW)).toMatch(/Discussion Participation Report/);
    expect(generateReport('sources', data, NOW)).toMatch(/Research Source List/);
    expect(generateReport('semester', data, NOW)).toMatch(/Semester Summary/);
  });
});
