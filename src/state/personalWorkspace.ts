import type { StoreState } from "./store";

/** Keep excluded enrollment out of every personal view without deleting saved records. */
export function personalWorkspace(state: StoreState): StoreState {
  const excludedInstitutions = new Set(
    state.institutions
      .filter((school) =>
        /gmercy|gwynedd/i.test(
          `${school.id} ${school.name} ${school.shortName}`,
        ),
      )
      .map((school) => school.id),
  );
  const excludedCourses = new Set(
    state.courses
      .filter(
        (course) =>
          excludedInstitutions.has(course.institutionId) ||
          /gmercy/i.test(course.id),
      )
      .map((course) => course.id),
  );
  excludedCourses.add("course-gmercyu-edu810");
  const visibleCourse = (item: { courseId?: string }) =>
    !item.courseId || !excludedCourses.has(item.courseId);
  const discussions = state.discussions.filter(visibleCourse);
  const excludedDiscussions = new Set(
    state.discussions
      .filter((item) => !visibleCourse(item))
      .map((item) => item.id),
  );
  return {
    ...state,
    institutions: state.institutions.filter(
      (school) => !excludedInstitutions.has(school.id),
    ),
    courses: state.courses.filter((course) => !excludedCourses.has(course.id)),
    assignments: state.assignments.filter(visibleCourse),
    readings: state.readings.filter(visibleCourse),
    assessments: state.assessments.filter(visibleCourse),
    discussions,
    discussionResponses: state.discussionResponses.filter(
      (reply) => !excludedDiscussions.has(reply.discussionId),
    ),
    notes: state.notes.filter(visibleCourse),
    citations: state.citations.map((citation) => ({
      ...citation,
      coursesUsed: citation.coursesUsed.filter(
        (id) => !excludedCourses.has(id),
      ),
    })),
  };
}
