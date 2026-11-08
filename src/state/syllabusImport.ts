import type { Assignment, Persistable } from '../types';
import { parseDueDate } from './selectors';

/**
 * Syllabus importer (spec R21). Pure and testable (syllabusImport.test.ts).
 *
 * Two entry points feed the SAME preview/confirm pipeline:
 *   1. parsePastedSyllabus(text)  — parse the student's pasted lines.
 *   2. normalizeExtracted(payload) — normalize the AI /api/gemini/extract-syllabus shape.
 *
 * Academic-integrity rules (.kiro/steering/academic-integrity.md):
 *   - Preview -> confirm ONLY. Nothing is committed to records until the student confirms.
 *   - We NEVER fabricate a due date. If a date can't be parsed we keep the raw text (so the
 *     student sees exactly what was found) and leave the normalized ISO date empty.
 *   - Extracted data is a starting point the student edits/approves, never presented as fact.
 */

export interface SyllabusCandidate {
  /** Stable within one parse run, used as a selection key. */
  key: string;
  title: string;
  /** Normalized ISO date when we could parse one, else ''. */
  dueDate: string;
  /** The raw due text as found (shown to the student for transparency). */
  rawDue?: string;
  description?: string;
  weight?: string;
  /** True only when a date was confidently parsed. */
  dateParsed: boolean;
  selected: boolean;
}

export interface SyllabusPreview {
  candidates: SyllabusCandidate[];
  /** Non-assignment context the student may want to record elsewhere (not auto-saved). */
  readings: string[];
  professorName?: string;
  note: string;
}

const PREVIEW_NOTE =
  'Review and edit below. Nothing is saved until you confirm — dates that could not be read are left blank rather than guessed.';

// Line prefixes we strip when parsing pasted rows like "- Essay (due 2026-10-01)".
const BULLET_RE = /^\s*(?:[-*•]|\d+[.)])\s*/;
// Common "due …" patterns inside a line.
const DUE_RE = /\b(?:due|deadline)\b[:\s]*([^)|,;]+?)(?:$|[)|,;])/i;

function makeCandidate(
  key: string,
  title: string,
  rawDue: string | undefined,
  now: Date,
  extras: { description?: string; weight?: string } = {},
): SyllabusCandidate {
  const parsed = rawDue ? parseDueDate(rawDue, now) : null;
  return {
    key,
    title: title.trim(),
    dueDate: parsed ? toIsoDate(parsed) : '',
    rawDue: rawDue?.trim() || undefined,
    description: extras.description?.trim() || undefined,
    weight: extras.weight?.trim() || undefined,
    dateParsed: parsed != null,
    selected: title.trim().length > 0,
  };
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse pasted syllabus text line-by-line. Each non-empty line becomes a candidate; a trailing
 * "(due …)" / "due: …" / a bare date is pulled out as the due date. Unparseable dates are
 * preserved as rawDue and left un-normalized.
 */
export function parsePastedSyllabus(text: string, now: Date = new Date()): SyllabusPreview {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const candidates: SyllabusCandidate[] = [];
  lines.forEach((line, idx) => {
    const cleaned = line.replace(BULLET_RE, '').trim();
    if (!cleaned) return;

    let title = cleaned;
    let rawDue: string | undefined;

    // "Title (due 2026-10-01)" or "Title - due: Friday"
    const dueMatch = cleaned.match(DUE_RE);
    if (dueMatch) {
      rawDue = dueMatch[1].trim();
      title = cleaned.slice(0, dueMatch.index).replace(/[\s\-–—(]+$/, '').trim() || cleaned;
    } else {
      // "Title — 2026-10-01" (trailing ISO date)
      const isoTail = cleaned.match(/^(.*?)[\s\-–—:]+(\d{4}-\d{2}-\d{2})\s*$/);
      if (isoTail) {
        title = isoTail[1].trim();
        rawDue = isoTail[2];
      }
    }

    candidates.push(makeCandidate(`paste-${idx}`, title, rawDue, now));
  });

  return { candidates, readings: [], note: PREVIEW_NOTE };
}

/** The subset of the AI extract-syllabus payload we consume. */
export interface ExtractedSyllabus {
  professor?: { name?: string };
  assignments?: Array<{
    title?: string;
    dueDate?: string;
    description?: string;
    weight?: string;
  }>;
  readings?: string[];
}

/** Normalize the AI extraction payload into the same preview shape (no auto-commit). */
export function normalizeExtracted(payload: ExtractedSyllabus, now: Date = new Date()): SyllabusPreview {
  const candidates: SyllabusCandidate[] = (payload.assignments || [])
    .filter((a) => (a.title || '').trim().length > 0)
    .map((a, idx) =>
      makeCandidate(`ai-${idx}`, a.title || '', a.dueDate, now, {
        description: a.description,
        weight: a.weight,
      }),
    );

  return {
    candidates,
    readings: (payload.readings || []).filter((r) => (r || '').trim().length > 0),
    professorName: payload.professor?.name?.trim() || undefined,
    note: PREVIEW_NOTE,
  };
}

/**
 * Convert the confirmed, selected candidates into Assignment records for a course. Only
 * selected candidates with a title are converted. Never auto-selects; the caller passes the
 * final selection after the student reviews the preview.
 */
export function confirmToRecords(
  candidates: SyllabusCandidate[],
  courseId: string,
  now: string = new Date().toISOString(),
): Array<Assignment & Persistable> {
  return candidates
    .filter((c) => c.selected && c.title.trim().length > 0)
    .map((c, idx) => ({
      id: `asg-syll-${Date.now()}-${idx}`,
      courseId,
      title: c.title,
      type: 'Other',
      status: 'not_started',
      // Use the normalized ISO date; if we couldn't parse one, keep the raw text so the
      // student still sees what the syllabus said (we never invent a date).
      dueDate: c.dueDate || c.rawDue || '',
      dueTime: '',
      urgency: 'on_track',
      points: 0,
      weight: c.weight || '',
      estimatedMinutes: 30,
      prompt: c.description || '',
      rubric: '',
      requiredReadings: [],
      checklist: [],
      drafts: [],
      notes: '',
      sourcesCited: [],
      currentPhase: 'deconstruct',
      createdAt: now,
      updatedAt: now,
    })) as Array<Assignment & Persistable>;
}
