import type {
  Institution,
  Course,
  Assignment,
  Discussion,
  DiscussionResponse,
  EntityBase,
  Collection,
} from '../types';

/**
 * Demo seed for F.I.S.H. Scholar.
 *
 * IMPORTANT (academic-integrity + product steering):
 *  - The three courses reflect the student's real Fall 2026 enrollment CODES only:
 *      Mississippi State ED 9413 · University of Florida FYC 6234 · CUNY DSAB 629.
 *  - Official course TITLES, professor names, emails, and office hours are NOT invented.
 *    They are left blank for the student to fill in.
 *  - A small number of clearly-labeled sample records (an assignment + a discussion) are
 *    included ONLY to demonstrate the tracker. Every record here carries `isDemo: true`
 *    and can be removed in one action from Settings ("Remove demo data").
 *  - No fabricated citations, DOIs, or grades are presented as real anywhere in this seed.
 */

const TS = '2026-08-25T12:00:00.000Z';

function base(id: string): EntityBase {
  return { id, createdAt: TS, updatedAt: TS, isDemo: true };
}

const SEMESTER = 'Fall 2026';

const institutions: (Institution & EntityBase)[] = [
  {
    ...base('inst-msu'),
    name: 'Mississippi State University',
    shortName: 'MSU',
    badgeColor: 'bg-red-950 text-red-100 border-red-800/60',
    accentColor: '#660000',
    logo: '🏛️',
    currentSemester: SEMESTER,
    location: '',
  },
  {
    ...base('inst-uf'),
    name: 'University of Florida',
    shortName: 'UF',
    badgeColor: 'bg-orange-950 text-orange-100 border-orange-800/60',
    accentColor: '#ea580c',
    logo: '🐊',
    currentSemester: SEMESTER,
    location: '',
  },
  {
    ...base('inst-cuny'),
    name: 'CUNY',
    shortName: 'CUNY',
    badgeColor: 'bg-blue-950 text-blue-100 border-blue-800/60',
    accentColor: '#1d4ed8',
    logo: '🎓',
    currentSemester: SEMESTER,
    location: '',
  },
];

/** Blank, editable professor record — nothing invented. */
const blankProfessor = {
  name: '',
  email: '',
  officeHours: '',
  preferredCommunication: '',
};

const blankPolicies = {
  lateWork: '',
  attendance: '',
  aiPolicy: '',
  accommodations: '',
};

const courses: (Course & EntityBase)[] = [
  {
    ...base('course-msu-ed9413'),
    institutionId: 'inst-msu',
    code: 'ED 9413',
    title: '', // student to fill in official title
    department: '',
    credits: 3,
    semester: SEMESTER,
    color: 'border-l-red-600',
    professor: { ...blankProfessor },
    policies: { ...blankPolicies },
    gradingScale: [],
  },
  {
    ...base('course-uf-fyc6234'),
    institutionId: 'inst-uf',
    code: 'FYC 6234',
    title: '',
    department: '',
    credits: 3,
    semester: SEMESTER,
    color: 'border-l-orange-600',
    professor: { ...blankProfessor },
    policies: { ...blankPolicies },
    gradingScale: [],
  },
  {
    ...base('course-cuny-dsab629'),
    institutionId: 'inst-cuny',
    code: 'DSAB 629',
    title: '',
    department: '',
    credits: 3,
    semester: SEMESTER,
    color: 'border-l-blue-600',
    professor: { ...blankProfessor },
    policies: { ...blankPolicies },
    gradingScale: [],
  },
];

// A single clearly-labeled sample assignment so the dashboards aren't empty on first run.
// Title is generic and marked (DEMO); it is not a real course requirement.
const assignments: (Assignment & EntityBase)[] = [
  {
    ...base('asg-demo-1'),
    courseId: 'course-msu-ed9413',
    title: '(DEMO) Example assignment — edit or delete me',
    type: 'Other',
    status: 'not_started',
    dueDate: '',
    dueTime: '',
    urgency: 'on_track',
    points: 0,
    weight: '',
    estimatedMinutes: 30,
    prompt: 'This is sample data to show how assignments work. Replace it with a real assignment, or remove all demo data from Settings.',
    rubric: '',
    requiredReadings: [],
    checklist: [
      { id: 'demo-chk-1', text: 'Read the instructions', completed: false },
      { id: 'demo-chk-2', text: 'Draft the response', completed: false },
      { id: 'demo-chk-3', text: 'Submit', completed: false },
    ],
    drafts: [],
    notes: '',
    sourcesCited: [],
    currentPhase: 'deconstruct',
  },
];

// A single clearly-labeled sample discussion demonstrating the peer-response tracker.
const discussions: Discussion[] = [
  {
    ...base('disc-demo-1'),
    courseId: 'course-cuny-dsab629',
    week: 1,
    title: '(DEMO) Example discussion — edit or delete me',
    prompt: 'Sample discussion prompt. Replace with your real prompt or remove demo data.',
    minResponses: 2,
    status: 'in_progress',
    originalPost: { status: 'not_started' },
    notes: 'Demonstrates the "initial post + required replies" tracker.',
  },
];

const discussionResponses: DiscussionResponse[] = [
  {
    ...base('disc-demo-1-r1'),
    discussionId: 'disc-demo-1',
    direction: 'peer',
    classmateName: '(DEMO) Classmate A',
    drafted: true,
    submitted: true,
    followUpRequired: false,
  },
];

export type Seed = Partial<Record<Collection, EntityBase[]>>;

/** Build the demo seed. Every record is flagged isDemo and removable in one action. */
export function buildDemoSeed(): Seed {
  return {
    institutions: institutions as EntityBase[],
    courses: courses as EntityBase[],
    assignments: assignments as EntityBase[],
    discussions: discussions as unknown as EntityBase[],
    discussionResponses: discussionResponses as unknown as EntityBase[],
  };
}
