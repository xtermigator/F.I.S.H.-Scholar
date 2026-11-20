import { describe, it, expect } from "vitest";
import { personalWorkspace } from "./personalWorkspace";
import type { StoreState } from "./store";

describe("personal enrollment view", () => {
  it("excludes existing GMercy enrollment and linked work without mutating stored records", () => {
    const state = {
      loading: false,
      error: null,
      institutions: [
        {
          id: "school-a",
          name: "Gwynedd Mercy University",
          shortName: "GMercyU",
        },
        { id: "school-b", name: "University of Florida", shortName: "UF" },
      ],
      courses: [
        { id: "old-course", institutionId: "school-a" },
        { id: "current-course", institutionId: "school-b" },
      ],
      assignments: [
        { id: "old-work", courseId: "old-course" },
        { id: "work", courseId: "current-course" },
      ],
      discussions: [{ id: "old-discussion", courseId: "old-course" }],
      discussionResponses: [{ id: "reply", discussionId: "old-discussion" }],
      readings: [{ id: "reading", courseId: "course-gmercyu-edu810" }],
      assessments: [{ id: "exam", courseId: "old-course" }],
      notes: [{ id: "note", body: "Keep this general research note" }],
      citations: [
        { id: "source", coursesUsed: ["old-course", "current-course"] },
      ],
      notionSyncRecords: [],
    } as unknown as StoreState;
    const visible = personalWorkspace(state);
    expect(visible.institutions.map((school) => school.id)).toEqual([
      "school-b",
    ]);
    expect(visible.courses.map((course) => course.id)).toEqual([
      "current-course",
    ]);
    expect(visible.assignments.map((item) => item.id)).toEqual(["work"]);
    expect(visible.readings).toHaveLength(0);
    expect(visible.discussionResponses).toHaveLength(0);
    expect(visible.assessments).toHaveLength(0);
    expect(visible.notes).toHaveLength(1);
    expect(visible.citations[0].coursesUsed).toEqual(["current-course"]);
    expect(state.citations[0].coursesUsed).toEqual([
      "old-course",
      "current-course",
    ]);
    expect(state.institutions).toHaveLength(2);
  });
});
