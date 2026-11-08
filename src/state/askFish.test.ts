import { describe, it, expect } from 'vitest';
import type { Assignment, Course, Discussion, DiscussionResponse } from '../types';
import type { DashboardData } from './selectors';
import {
  detectIntent,
  answerQuestion,
  matchCourse,
  buildGroundingFacts,
  type AskContext,
} from './askFish';

const NOW = new Date('2026-09-15T09:00:00'); // Tuesday

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
    id: 'a',
    courseId: 'c1',
    title: 'Paper',
    dueDate: '',
    dueTime: '',
    urgency: 'due_soon',
    points: 0,
    weight: '',
    estimatedMinutes: 60,
    prompt: '',
    rubric: '',
    requiredReadings: [],
    checklist: [],
    drafts: [],
    notes: '',
    sourcesCited: [],
    currentPhase: 'draft',
    ...over,
  } as Assignment;
}

function discussion(over: Partial<Discussion>): Discussion {
  return {
    id: 'd1',
    courseId: 'c1',
    title: 'Week 1 Discussion',
    minResponses: 2,
    status: 'in_progress',
    originalPost: { status: 'submitted' },
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

function response(over: Partial<DiscussionResponse>): DiscussionResponse {
  return {
    id: `r-${Math.random()}`,
    discussionId: 'd1',
    classmateName: 'Peer',
    drafted: false,
    submitted: false,
    followUpRequired: false,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

function ctx(partial: Partial<DashboardData>, courses: Course[] = [course('c1', 'ED 9413')]): AskContext {
  return {
    data: {
      assignments: [],
      discussions: [],
      discussionResponses: [],
      readings: [],
      assessments: [],
      ...partial,
    },
    courses,
    now: NOW,
  };
}

describe('detectIntent', () => {
  it('classifies common questions', () => {
    expect(detectIntent("What's due today?")).toBe('due_today');
    expect(detectIntent("What's due this week?")).toBe('due_week');
    expect(detectIntent('What discussion replies do I still owe?')).toBe('replies_remaining');
    expect(detectIntent('What is overdue?')).toBe('overdue');
    expect(detectIntent('What should I work on next?')).toBe('next_action');
    expect(detectIntent('Which course has the heaviest workload?')).toBe('workload');
    expect(detectIntent('help')).toBe('help');
    expect(detectIntent("What's due for ED 9413?")).toBe('course_status');
  });
});

describe('answerQuestion — grounded in data, never fabricated', () => {
  it('due today includes overdue and today, and always cites the source', () => {
    const a = answerQuestion("what's due today", ctx({
      assignments: [
        assignment({ id: 'today', dueDate: '2026-09-15' }),
        assignment({ id: 'overdue', dueDate: '2026-09-10' }),
        assignment({ id: 'later', dueDate: '2026-09-25' }),
      ],
    }));
    expect(a.intent).toBe('due_today');
    expect(a.items.map((i) => i.id).sort()).toEqual(['overdue', 'today']);
    expect(a.source).toMatch(/F\.I\.S\.H\. Scholar data/);
  });

  it('reports an empty state honestly when nothing is due', () => {
    const a = answerQuestion("what's due today", ctx({}));
    expect(a.items).toHaveLength(0);
    expect(a.summary).toMatch(/nothing.*due today/i);
  });

  it('computes replies remaining from real discussion data', () => {
    const a = answerQuestion('what replies do I owe', ctx({
      discussions: [discussion({ id: 'd1', minResponses: 2 })],
      discussionResponses: [response({ discussionId: 'd1', submitted: true })],
    }));
    expect(a.intent).toBe('replies_remaining');
    expect(a.summary).toMatch(/1 required repl/i);
    expect(a.items[0].detail).toMatch(/1 repl.*remaining \(1\/2\)/);
  });

  it('surfaces incoming classmate replies and follow-ups', () => {
    const a = answerQuestion('who replied to me', ctx({
      discussions: [discussion({ id: 'd1', minResponses: 1, originalPost: { status: 'submitted' } })],
      discussionResponses: [
        response({ discussionId: 'd1', submitted: true }),
        response({ discussionId: 'd1', direction: 'incoming', submitted: false }),
        response({ discussionId: 'd1', submitted: true, followUpRequired: true }),
      ],
    }));
    expect(a.summary).toMatch(/classmate repl/i);
  });

  it('next action prioritizes overdue', () => {
    const a = answerQuestion('what should I start', ctx({
      assignments: [
        assignment({ id: 'later', dueDate: '2026-09-25' }),
        assignment({ id: 'overdue', dueDate: '2026-09-09' }),
      ],
    }));
    expect(a.intent).toBe('next_action');
    expect(a.items[0].id).toBe('overdue');
  });

  it('workload ranks the heaviest course', () => {
    const courses = [course('c1', 'ED 9413'), course('c2', 'FYC 6234')];
    const a = answerQuestion('which course is busiest', ctx({
      assignments: [
        assignment({ id: 'o1', courseId: 'c2', dueDate: '2026-09-09' }),
        assignment({ id: 'o2', courseId: 'c2', dueDate: '2026-09-10' }),
      ],
    }, courses));
    expect(a.intent).toBe('workload');
    expect(a.summary).toMatch(/FYC 6234/);
  });

  it('course status matches by code and reports outstanding items', () => {
    const a = answerQuestion("what's due for ED 9413", ctx({
      assignments: [assignment({ id: 'x', courseId: 'c1', dueDate: '2026-09-16' })],
    }));
    expect(a.intent).toBe('course_status');
    expect(a.summary).toMatch(/ED 9413/);
    expect(a.items).toHaveLength(1);
  });

  it('help lists example questions', () => {
    const a = answerQuestion('help', ctx({}));
    expect(a.intent).toBe('help');
    expect((a.suggestions ?? []).length).toBeGreaterThan(2);
  });
});

describe('matchCourse', () => {
  const courses = [course('c1', 'ED 9413', 'Curriculum'), course('c2', 'FYC 6234')];
  it('matches by code with or without space', () => {
    expect(matchCourse('due for ED 9413', courses)?.id).toBe('c1');
    expect(matchCourse('fyc6234 status', courses)?.id).toBe('c2');
  });
  it('returns undefined when no course referenced', () => {
    expect(matchCourse('what is due', courses)).toBeUndefined();
  });
});

describe('buildGroundingFacts', () => {
  it('summarizes counts and per-course workload as plain facts (for optional AI rephrasing)', () => {
    const facts = buildGroundingFacts(ctx({
      assignments: [assignment({ id: 'a1', dueDate: '2026-09-15' })],
      discussions: [discussion({ id: 'd1', minResponses: 2 })],
      discussionResponses: [response({ discussionId: 'd1', submitted: true })],
    }));
    expect(facts).toMatch(/Due today or overdue: 1/);
    expect(facts).toMatch(/ED 9413 workload:/);
    expect(facts).toMatch(/replies 1\/2/);
  });
});
