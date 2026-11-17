import { describe, it, expect } from "vitest";
import { parseSyllabusDocument, syllabusRecords } from "./syllabusDocument";

describe("personal syllabus intake", () => {
  it("extracts coursework types without importing administrative headings", () => {
    const candidates = parseSyllabusDocument(
      "Assignments:\nOffice hours: bring paper questions\nEssay due 2026-12-01\nDiscussion post due 2026-12-02\nReading: Chapter 4\nFinal exam due 2026-12-15",
    );
    expect(candidates.map((item) => item.kind)).toEqual([
      "assignment",
      "discussion",
      "reading",
      "assessment",
    ]);
    expect(
      syllabusRecords(candidates, "course-1", "import-1").map(
        (record) => record.collection,
      ),
    ).toEqual(["assignments", "discussions", "readings", "assessments"]);
  });
  it("requires an explicit valid year and preserves ambiguous wording for review", () => {
    const candidates = parseSyllabusDocument(
      "Essay due December 1\nProject due December 4, 2026\nQuiz due 2026-02-30\nPaper due February 30, 2026",
    );
    expect(candidates.map((item) => item.dueDate)).toEqual([
      "",
      "2026-12-04",
      "",
      "",
    ]);
    const record = syllabusRecords(candidates.slice(0, 1), "course-1", "run")[0]
      .entity as any;
    expect(record.dueDate).toBe("");
    expect(record.notes).toContain("December 1");
  });
  it("uses stable IDs on retry and respects deselection and edited dates", () => {
    const candidates = parseSyllabusDocument(
      "Essay due 2026-12-01\nFinal exam due 2026-12-15",
    );
    candidates[1].selected = false;
    candidates[0].dueDate = "2026-12-03";
    const first = syllabusRecords(candidates, "course-1", "retry-safe");
    const retry = syllabusRecords(candidates, "course-1", "retry-safe");
    expect(first).toHaveLength(1);
    expect(first[0].entity.id).toBe(retry[0].entity.id);
    expect((first[0].entity as any).dueDate).toBe("2026-12-03");
  });
});
