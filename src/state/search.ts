import type {
  Course,
  Assignment,
  Discussion,
  DiscussionResponse,
  Reading,
  Assessment,
  Citation,
  Note,
} from '../types';

/**
 * Global search across the student's academic data (spec R: global search / M4).
 *
 * Pure and testable (search.test.ts). Searches courses, assignments, discussions, peer
 * responses, readings, assessments, citations, and notes; ranks by where the term matched
 * (title/name weighted higher than body/notes). No fabrication — results reference real
 * records only. A `tab` hint lets the UI navigate to the right place.
 */

export type SearchEntityType =
  | 'course'
  | 'assignment'
  | 'discussion'
  | 'discussionResponse'
  | 'reading'
  | 'assessment'
  | 'citation'
  | 'note';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  snippet?: string;
  courseId?: string;
  courseCode?: string;
  score: number;
  /** Which app tab best surfaces this result. */
  tab: string;
}

export interface SearchIndexData {
  courses: Course[];
  assignments: Assignment[];
  discussions: Discussion[];
  discussionResponses: DiscussionResponse[];
  readings: Reading[];
  assessments: Assessment[];
  citations: Citation[];
  notes: Note[];
}

export interface SearchFilters {
  types?: SearchEntityType[];
  courseId?: string;
}

const TYPE_TO_TAB: Record<SearchEntityType, string> = {
  course: 'COURSES',
  assignment: 'ASSIGNMENTS',
  discussion: 'DISCUSS',
  discussionResponse: 'DISCUSS',
  reading: 'LIBRARY',
  assessment: 'COURSES',
  citation: 'LIBRARY',
  note: 'COMMAND',
};

/**
 * Score a query against a set of (text, weight) fields. Title-like fields carry the highest
 * weight. Returns 0 when nothing matches. Case-insensitive substring matching keeps behaviour
 * predictable (no fuzzy surprises).
 */
function scoreFields(query: string, fields: { text: string | undefined; weight: number }[]): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const terms = q.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const { text, weight } of fields) {
    if (!text) continue;
    const hay = text.toLowerCase();
    for (const term of terms) {
      if (!hay.includes(term)) continue;
      score += weight;
      // Bonus when a field starts with the term (stronger relevance).
      if (hay.startsWith(term)) score += Math.round(weight / 2);
    }
  }
  return score;
}

function truncate(text: string | undefined, max = 120): string | undefined {
  if (!text) return undefined;
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * Run a global search. Returns results sorted by descending relevance. An empty/whitespace
 * query returns no results (the UI shows suggestions instead).
 */
export function searchAll(
  query: string,
  data: SearchIndexData,
  filters: SearchFilters = {},
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const courseCode = (courseId?: string) =>
    courseId ? data.courses.find((c) => c.id === courseId)?.code : undefined;

  const typeAllowed = (t: SearchEntityType) => !filters.types || filters.types.includes(t);
  const courseAllowed = (courseId?: string) => !filters.courseId || filters.courseId === courseId;

  const results: SearchResult[] = [];
  const push = (r: SearchResult) => {
    if (r.score > 0 && typeAllowed(r.type) && courseAllowed(r.courseId)) results.push(r);
  };

  if (typeAllowed('course')) {
    for (const c of data.courses) {
      const score = scoreFields(q, [
        { text: c.code, weight: 10 },
        { text: c.title, weight: 8 },
        { text: c.department, weight: 3 },
        { text: c.professor?.name, weight: 3 },
      ]);
      push({
        id: c.id,
        type: 'course',
        title: `${c.code}${c.title ? ` · ${c.title}` : ''}`,
        snippet: truncate(c.department || c.professor?.name),
        courseId: c.id,
        courseCode: c.code,
        score,
        tab: TYPE_TO_TAB.course,
      });
    }
  }

  if (typeAllowed('assignment')) {
    for (const a of data.assignments) {
      const score = scoreFields(q, [
        { text: a.title, weight: 10 },
        { text: a.prompt, weight: 4 },
        { text: a.notes, weight: 3 },
      ]);
      push({
        id: a.id,
        type: 'assignment',
        title: a.title,
        snippet: truncate(a.prompt || a.notes),
        courseId: a.courseId,
        courseCode: courseCode(a.courseId),
        score,
        tab: TYPE_TO_TAB.assignment,
      });
    }
  }

  if (typeAllowed('discussion')) {
    for (const d of data.discussions) {
      const score = scoreFields(q, [
        { text: d.title, weight: 10 },
        { text: d.prompt, weight: 4 },
        { text: d.notes, weight: 3 },
      ]);
      push({
        id: d.id,
        type: 'discussion',
        title: d.title,
        snippet: truncate(d.prompt || d.notes),
        courseId: d.courseId,
        courseCode: courseCode(d.courseId),
        score,
        tab: TYPE_TO_TAB.discussion,
      });
    }
  }

  if (typeAllowed('discussionResponse')) {
    for (const r of data.discussionResponses) {
      const parentCourseId = data.discussions.find((d) => d.id === r.discussionId)?.courseId;
      const score = scoreFields(q, [
        { text: r.classmateName, weight: 9 },
        { text: r.classmatePostTopic, weight: 4 },
        { text: r.notes, weight: 3 },
      ]);
      push({
        id: r.id,
        type: 'discussionResponse',
        title: `Reply: ${r.classmateName}`,
        snippet: truncate(r.classmatePostTopic || r.notes),
        courseId: parentCourseId,
        courseCode: courseCode(parentCourseId),
        score,
        tab: TYPE_TO_TAB.discussionResponse,
      });
    }
  }

  if (typeAllowed('reading')) {
    for (const r of data.readings) {
      const score = scoreFields(q, [
        { text: r.title, weight: 10 },
        { text: r.author, weight: 6 },
        { text: r.publication, weight: 3 },
        { text: r.notes, weight: 2 },
      ]);
      push({
        id: r.id,
        type: 'reading',
        title: r.title,
        snippet: truncate(r.author || r.publication),
        courseId: r.courseId,
        courseCode: courseCode(r.courseId),
        score,
        tab: TYPE_TO_TAB.reading,
      });
    }
  }

  if (typeAllowed('assessment')) {
    for (const s of data.assessments) {
      const score = scoreFields(q, [
        { text: s.name, weight: 10 },
        { text: (s.coverage || []).join(' '), weight: 4 },
        { text: s.notes, weight: 2 },
      ]);
      push({
        id: s.id,
        type: 'assessment',
        title: s.name,
        snippet: truncate((s.coverage || []).join(', ') || s.notes),
        courseId: s.courseId,
        courseCode: courseCode(s.courseId),
        score,
        tab: TYPE_TO_TAB.assessment,
      });
    }
  }

  if (typeAllowed('citation')) {
    for (const c of data.citations) {
      const score = scoreFields(q, [
        { text: c.title, weight: 10 },
        { text: c.authors, weight: 7 },
        { text: c.source, weight: 3 },
        { text: (c.keywords || []).join(' '), weight: 3 },
        { text: c.notes, weight: 2 },
      ]);
      push({
        id: c.id,
        type: 'citation',
        title: c.title,
        snippet: truncate(c.authors || c.source),
        score,
        tab: TYPE_TO_TAB.citation,
      });
    }
  }

  if (typeAllowed('note')) {
    for (const n of data.notes) {
      const score = scoreFields(q, [
        { text: n.title, weight: 9 },
        { text: n.body, weight: 5 },
        { text: (n.tags || []).join(' '), weight: 3 },
      ]);
      push({
        id: n.id,
        type: 'note',
        title: n.title || truncate(n.body, 40) || 'Note',
        snippet: truncate(n.body),
        courseId: n.courseId,
        courseCode: courseCode(n.courseId),
        score,
        tab: TYPE_TO_TAB.note,
      });
    }
  }

  results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return results;
}

export const SEARCH_TYPE_LABELS: Record<SearchEntityType, string> = {
  course: 'Course',
  assignment: 'Assignment',
  discussion: 'Discussion',
  discussionResponse: 'Peer reply',
  reading: 'Reading',
  assessment: 'Test / quiz',
  citation: 'Source',
  note: 'Note',
};
