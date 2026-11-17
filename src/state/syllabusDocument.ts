import {
  parsePastedSyllabus,
  confirmToRecords,
  type SyllabusCandidate,
} from "./syllabusImport";
import type {
  Collection,
  EntityBase,
  Assignment,
  Discussion,
  Reading,
  Assessment,
} from "../types";

export type SyllabusKind =
  | "assignment"
  | "discussion"
  | "reading"
  | "assessment";
export interface DocumentCandidate extends SyllabusCandidate {
  kind: SyllabusKind;
}

function explicitDate(raw: string | undefined): string {
  if (!raw) return "";
  const iso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const [, year, month, day] = iso;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
      ? iso[0]
      : "";
  }
  const named = raw.match(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4}\b/i,
  );
  if (!named) return "";
  const parsed = new Date(named[0]);
  if (Number.isNaN(parsed.getTime())) return "";
  const day = Number(named[0].match(/\s(\d{1,2})/)?.[1]);
  if (parsed.getDate() !== day) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

/** Full documents retain administrative prose as context rather than creating tasks for it. */
export function parseSyllabusDocument(text: string): DocumentCandidate[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.flatMap((line, index) => {
    if (
      !/\b(assignments?|essays?|papers?|projects?|exams?|quizzes?|discussion|reflection|presentation|report|read(?:ing)?|due|deadline)\b/i.test(
        line,
      )
    )
      return [];
    if (
      /^(?:assignments?|readings?|course schedule|discussion|assessment|exams?|quizzes?)\s*:?$/i.test(
        line,
      )
    )
      return [];
    if (
      /^(?:learning outcomes?|objectives?|office hours?|contact|email|academic integrity|late (?:work|policy)|policy)\s*:/i.test(
        line,
      )
    )
      return [];
    if (
      line.length > 600 ||
      /^[\w\s&]+(?:assignments|readings|schedule|policies)\s*:$/i.test(line)
    )
      return [];
    const base = parsePastedSyllabus(line).candidates[0];
    if (!base) return [];
    const rawDue = base.rawDue || line.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
    const date = explicitDate(rawDue) || explicitDate(line);
    let kind: SyllabusKind = "assignment";
    if (/\b(?:exam|quiz|quizzes|test|midterm)\b/i.test(line))
      kind = "assessment";
    else if (/\bdiscussion\b/i.test(line)) kind = "discussion";
    else if (/^(?:[-*•]\s*)?(?:required\s+)?(?:reading|read)\b/i.test(line))
      kind = "reading";
    return [
      {
        ...base,
        key: `document-${index}`,
        kind,
        description: line,
        rawDue,
        dueDate: date,
        dateParsed: Boolean(date),
      },
    ];
  });
}

export function syllabusRecords(
  candidates: DocumentCandidate[],
  courseId: string,
  importId: string,
): { collection: Collection; entity: EntityBase }[] {
  return candidates
    .filter((candidate) => candidate.selected && candidate.title.trim())
    .map((candidate) => {
      const base = confirmToRecords(
        [{ ...candidate, rawDue: undefined }],
        courseId,
      )[0];
      base.id = `${importId}-${candidate.key}`;
      base.notes =
        candidate.rawDue && !candidate.dueDate
          ? `Original due wording: ${candidate.rawDue}`
          : "";
      if (candidate.kind === "reading") {
        const entity: Reading = {
          id: base.id,
          createdAt: base.createdAt,
          updatedAt: base.updatedAt,
          courseId,
          title: candidate.title,
          required: true,
          status: "not_started",
          notes: candidate.description,
        };
        return { collection: "readings", entity };
      }
      if (candidate.kind === "discussion") {
        const entity: Discussion = {
          id: base.id,
          createdAt: base.createdAt,
          updatedAt: base.updatedAt,
          courseId,
          title: candidate.title,
          prompt: candidate.description,
          initialPostDeadline: candidate.dueDate || undefined,
          minResponses: 0,
          status: "not_started",
          originalPost: { status: "not_started" },
          notes:
            "Set the required peer-reply count from your syllabus. " +
            base.notes,
        };
        return { collection: "discussions", entity };
      }
      if (candidate.kind === "assessment") {
        const entity: Assessment = {
          id: base.id,
          createdAt: base.createdAt,
          updatedAt: base.updatedAt,
          courseId,
          name: candidate.title,
          type: /quiz/i.test(candidate.title) ? "Quiz" : "Exam",
          date: candidate.dueDate || undefined,
          studyStatus: "not_started",
          notes: candidate.description,
        };
        return { collection: "assessments", entity };
      }
      return {
        collection: "assignments",
        entity: base as Assignment & EntityBase,
      };
    });
}
