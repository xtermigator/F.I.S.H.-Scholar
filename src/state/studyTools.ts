import type { Course, Reading, Assessment, Citation } from '../types';

/**
 * Study tools (spec R9 study aids). Generates study guides, flashcards, and practice prompts
 * **only by recombining the student's own entered data** — reading concepts/notes, saved
 * citation quotes, and assessment coverage.
 *
 * Academic-integrity rules (.kiro/steering/academic-integrity.md):
 *  - We NEVER fabricate facts, definitions, quotations, or answers.
 *  - Nothing here is presented as "official exam questions" — outputs are clearly self-made
 *    study aids derived from the student's materials.
 *  - When there's no source material, we say so instead of inventing content.
 *
 * Pure and testable (studyTools.test.ts).
 */

export interface StudyGuideSection {
  heading: string;
  bullets: string[];
}

export interface StudyGuide {
  courseCode: string;
  /** Always-present provenance note shown in the UI. */
  disclaimer: string;
  sections: StudyGuideSection[];
  empty: boolean;
}

export const STUDY_DISCLAIMER =
  'Study aid generated from your own notes, readings, and saved sources — not official course or exam material.';

function forCourse<T extends { courseId?: string }>(items: T[], courseId: string): T[] {
  return items.filter((i) => i.courseId === courseId);
}

/** Build a study-guide outline for a course from its readings, assessments, and citations. */
export function buildStudyGuide(
  course: Pick<Course, 'id' | 'code'>,
  readings: Reading[],
  assessments: Assessment[],
  citations: Citation[],
): StudyGuide {
  const cReadings = forCourse(readings, course.id);
  const cAssessments = forCourse(assessments, course.id);
  // Citations are linked to courses via coursesUsed.
  const cCitations = citations.filter((c) => (c.coursesUsed || []).includes(course.id));

  const sections: StudyGuideSection[] = [];

  // Assessment coverage → what to focus on.
  const coverage = cAssessments.flatMap((a) => a.coverage || []).filter(Boolean);
  if (coverage.length) {
    sections.push({ heading: 'Topics to review (from your tests/quizzes)', bullets: unique(coverage) });
  }

  // Reading concepts → key ideas.
  const concepts = cReadings.flatMap((r) => r.concepts || []).filter(Boolean);
  if (concepts.length) {
    sections.push({ heading: 'Key concepts (from your readings)', bullets: unique(concepts) });
  }

  // Reading quotations / notes.
  const readingQuotes = cReadings.flatMap((r) => r.quotations || []).filter(Boolean);
  if (readingQuotes.length) {
    sections.push({ heading: 'Notable passages (from your readings)', bullets: readingQuotes });
  }

  // Citation key quotes.
  const citationQuotes = cCitations.flatMap((c) =>
    (c.keyQuotes || []).map((q) => `${q}${c.inText ? ` ${c.inText}` : ''}`),
  );
  if (citationQuotes.length) {
    sections.push({ heading: 'Source highlights (from your citation vault)', bullets: citationQuotes });
  }

  // Reading list for reference.
  if (cReadings.length) {
    sections.push({
      heading: 'Readings to revisit',
      bullets: cReadings.map((r) => `${r.title}${r.author ? ` — ${r.author}` : ''} (${labelReadingStatus(r.status)})`),
    });
  }

  return {
    courseCode: course.code,
    disclaimer: STUDY_DISCLAIMER,
    sections,
    empty: sections.length === 0,
  };
}

function labelReadingStatus(status: Reading['status']): string {
  switch (status) {
    case 'completed': return 'completed';
    case 'reading': return 'in progress';
    case 'review_again': return 'review again';
    default: return 'not started';
  }
}

export interface Flashcard {
  front: string;
  back: string;
  source: string;
}

/**
 * Build flashcards from the student's own material:
 *  - a reading concept -> "Explain <concept> (from <reading>)" prompt (back is the student's
 *    to fill; we do NOT invent a definition).
 *  - a citation -> in-text citation on the front, full APA reference on the back (a factual
 *    recall card built from data the student already saved).
 */
export function buildFlashcards(
  course: Pick<Course, 'id'>,
  readings: Reading[],
  citations: Citation[],
): Flashcard[] {
  const cards: Flashcard[] = [];

  for (const r of forCourse(readings, course.id)) {
    for (const concept of r.concepts || []) {
      cards.push({
        front: `Explain in your own words: “${concept}”`,
        back: '(Your answer — fill this in from your notes.)',
        source: r.title,
      });
    }
  }

  for (const c of citations.filter((x) => (x.coursesUsed || []).includes(course.id))) {
    if (c.inText && c.apa7) {
      cards.push({
        front: `Which source is ${c.inText}?`,
        back: c.apa7,
        source: c.title,
      });
    }
    for (const q of c.keyQuotes || []) {
      cards.push({
        front: `Who/what is the source of this idea?\n\n“${q}”`,
        back: `${c.inText || c.authors} — ${c.title}`,
        source: c.title,
      });
    }
  }

  return cards;
}

export interface PracticeQuestion {
  prompt: string;
  basedOn: string;
}

/**
 * Build open-ended practice prompts from assessment coverage and reading concepts. These are
 * reflection/self-quiz prompts — explicitly NOT official exam questions and with no answer key
 * fabricated.
 */
export function buildPracticeQuestions(
  course: Pick<Course, 'id'>,
  readings: Reading[],
  assessments: Assessment[],
): PracticeQuestion[] {
  const questions: PracticeQuestion[] = [];

  const coverage = unique(forCourse(assessments, course.id).flatMap((a) => a.coverage || []));
  for (const topic of coverage) {
    questions.push({
      prompt: `Summarize the main ideas of “${topic}” and why they matter.`,
      basedOn: 'Test/quiz coverage you entered',
    });
  }

  const concepts = unique(forCourse(readings, course.id).flatMap((r) => r.concepts || []));
  for (const concept of concepts) {
    questions.push({
      prompt: `How does “${concept}” connect to the other ideas in this course? Give an example.`,
      basedOn: 'A concept from your readings',
    });
  }

  return questions;
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}
