import { describe, it, expect } from 'vitest';
import type { Assignment, Course, Discussion } from '../types';
import type { AskContext } from './askFish';
import type { SearchIndexData } from './search';
import {
  latestUserMessage,
  buildGroundingSystemPrompt,
  composeGroundedMessages,
  type ChatMessage,
  type GroundingInputs,
} from './chatGrounding';

const NOW = new Date('2026-09-15T09:00:00');

function course(id: string, code: string, title = ''): Course {
  return {
    id, institutionId: 'i', code, title, department: '', credits: 3, semester: 'Fall 2026',
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

function inputs(over: { assignments?: Assignment[]; discussions?: Discussion[]; courses?: Course[] } = {}): GroundingInputs {
  const courses = over.courses ?? [course('c1', 'ED 9413')];
  const dash = {
    assignments: over.assignments ?? [],
    discussions: over.discussions ?? [],
    discussionResponses: [],
    readings: [],
    assessments: [],
  };
  const askCtx: AskContext = { data: dash, courses, now: NOW };
  const search: SearchIndexData = { ...dash, courses, citations: [], notes: [] };
  return { askCtx, search, courses };
}

describe('latestUserMessage', () => {
  it('returns the most recent user turn', () => {
    const msgs: ChatMessage[] = [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'reply' },
      { role: 'user', content: 'second' },
    ];
    expect(latestUserMessage(msgs)).toBe('second');
  });

  it('returns empty string when there is no user turn', () => {
    expect(latestUserMessage([{ role: 'assistant', content: 'hi' }])).toBe('');
  });
});

describe('buildGroundingSystemPrompt', () => {
  it('always includes the persona rules and a student-context section', () => {
    const prompt = buildGroundingSystemPrompt(
      [{ role: 'user', content: "what's due?" }],
      inputs({ assignments: [assignment({ id: 'a1', title: 'Essay', dueDate: '2026-09-16' })] }),
    );
    expect(prompt).toMatch(/You are "FISH"/);
    expect(prompt).toMatch(/Never invent citations/);
    expect(prompt).toMatch(/STUDENT CONTEXT/);
    expect(prompt).toMatch(/ED 9413 workload/);
  });

  it('adds the deterministic Ask FISH answer for the question', () => {
    const prompt = buildGroundingSystemPrompt(
      [{ role: 'user', content: "what's due today?" }],
      inputs({ assignments: [assignment({ id: 'a1', title: 'Essay', dueDate: '2026-09-15' })] }),
    );
    expect(prompt).toMatch(/Direct answer from their data:/);
  });

  it('surfaces relevant records via search', () => {
    const prompt = buildGroundingSystemPrompt(
      [{ role: 'user', content: 'tell me about the literature review' }],
      inputs({ assignments: [assignment({ id: 'a1', title: 'Literature Review', dueDate: '2026-09-20' })] }),
    );
    expect(prompt).toMatch(/Relevant records:/);
    expect(prompt).toMatch(/Literature Review/);
  });
});

describe('composeGroundedMessages', () => {
  it('prepends a server-built system prompt and drops client system messages', () => {
    const msgs: ChatMessage[] = [
      { role: 'system', content: 'client-injected system prompt (should be dropped)' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
      { role: 'user', content: "what's due?" },
    ];
    const composed = composeGroundedMessages(msgs, inputs());
    expect(composed[0].role).toBe('system');
    expect(composed[0].content).toMatch(/You are "FISH"/);
    // No client-provided system message survives.
    expect(composed.filter((m) => m.role === 'system')).toHaveLength(1);
    // Conversation preserved after the system prompt.
    expect(composed.some((m) => m.role === 'user' && m.content === "what's due?")).toBe(true);
  });

  it('caps the number of retained conversation turns', () => {
    const many: ChatMessage[] = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `m${i}`,
    }));
    const composed = composeGroundedMessages(many, inputs(), 6);
    // 1 system + 6 convo
    expect(composed).toHaveLength(7);
  });
});
