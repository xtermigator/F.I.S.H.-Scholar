export type TabType =
  | 'COMMAND'
  | 'ASK'
  | 'SEARCH'
  | 'DISCUSS'
  | 'CALENDAR'
  | 'STUDY'
  | 'TODAY'
  | 'COURSES'
  | 'ASSIGNMENTS'
  | 'LIBRARY'
  | 'WRITE'
  | 'FOCUS'
  | 'ME'
  | 'REPORTS'
  | 'SETTINGS';

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  badgeColor: string; // Tailwind color class or hex
  accentColor: string;
  logo: string;
  currentSemester: string;
  location: string;
  canvasUrl?: string;
  portalUrl?: string;
}

export interface ProfessorInfo {
  name: string;
  email: string;
  officeHours: string;
  zoomLink?: string;
  preferredCommunication: string;
  toneNotes?: string;
}

export interface CoursePolicy {
  lateWork: string;
  attendance: string;
  aiPolicy: string;
  accommodations: string;
}

export interface GradeItem {
  id: string;
  item: string;
  percentage: number;
}

export interface Course {
  id: string;
  institutionId: string;
  code: string;
  title: string;
  department: string;
  credits: number;
  semester: string;
  professor: ProfessorInfo;
  policies: CoursePolicy;
  gradingScale: GradeItem[];
  color: string;
  syllabusSnippet?: string;
  accommodationsNotes?: string;
}

export type AssignmentUrgency = 'urgent_tonight' | 'due_soon' | 'on_track' | 'completed';

export interface AssignmentChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface DraftVersion {
  id: string;
  versionName: string; // e.g. "Draft 1 (Raw Voice)", "Draft 2 (Peer Feedback)", "Final Submission"
  timestamp: string;
  wordCount: number;
  content: string;
  notes?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  type?: AssignmentType;
  status?: WorkStatus;
  dueDate: string;
  dueTime: string;
  urgency: AssignmentUrgency;
  points: number;
  weight: string;
  estimatedMinutes: number;
  prompt: string;
  rubric: string;
  requiredReadings: string[];
  checklist: AssignmentChecklistItem[];
  drafts: DraftVersion[];
  notes: string;
  sourcesCited: string[]; // Citation IDs
  currentPhase: 'deconstruct' | 'outline' | 'sources' | 'draft' | 'review' | 'authorship';
  professorFeedback?: string;
  /**
   * Manually-entered grade for this assignment (never inferred). `pointsEarned` out of
   * `pointsPossible`; optional `weightPercent` for weighted courses. Presence of this object
   * means a real grade was recorded (academic-integrity steering).
   */
  grade?: {
    pointsEarned: number;
    pointsPossible: number;
    weightPercent?: number;
  };
}

export interface CourseAlignment {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  institutionName?: string;
  relevanceScore: number; // 0 - 100
  alignmentRationale: string;
  primaryAssignmentMatch?: string;
  suggestedUse?: string; // e.g. "Theoretical anchor", "Methodology citation", "Empirical data"
}

export interface Citation {
  id: string;
  authors: string;
  year: string;
  title: string;
  source: string; // Journal / Book / Publisher
  doiOrUrl: string;
  apa7: string;
  inText: string;
  notes: string;
  keyQuotes: string[];
  keywords: string[];
  coursesUsed: string[]; // Course IDs
  papersCitedIn: string[]; // Assignment IDs
  institutionOrigin?: string; // e.g. "CUNY SPS", "Mississippi State", "UF"
  
  // AI Categorization & Course Relevance System
  aiThematicCategory?: string; // e.g. "Universal Design & Inclusive Pedagogy", "Critical Disability Studies", "Transition Pipelines & Community Support", "Neurodiversity & Executive Function"
  aiRelevanceScore?: number; // 0 - 100
  courseAlignments?: CourseAlignment[];
  aiTaggedKeywords?: string[];
  sourceTypeClassification?: 'Empirical Study' | 'Theoretical Framework' | 'Policy & Legal Analysis' | 'First-Person Narrative' | 'Pedagogical Guide' | 'Systematic Review';
  lastCategorizedAt?: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  courseId?: string;
  docType: 'Syllabus' | 'Rubric' | 'Assignment Prompt' | 'Journal Article / Reading' | 'Student Draft' | 'Professor Feedback' | 'Originality Report';
  uploadedAt: string;
  size: string;
  summary: string;
  extractedCitations: string[];
  tags: string[];
  contentPreview: string;
}

export interface AcademicMemoryNode {
  id: string;
  concept: string; // e.g. "Universal Design in Higher Ed"
  originInstitution: string;
  originCourseCode: string;
  relevanceTags: string[];
  coreInsight: string;
  quotations: string[];
  relatedCitationIds: string[];
  priorDraftSnippets: string[];
  crossSchoolApplications: {
    targetCourseCode: string;
    suggestion: string;
  }[];
}

export interface AuthorshipDossier {
  id: string;
  assignmentId: string;
  title: string;
  studentName: string;
  courseCode: string;
  institutionName: string;
  createdAt: string;
  verifiedAt: string;
  draftsHistory: {
    stage: string;
    wordCount: number;
    timestamp: string;
    summaryOfEdits: string;
  }[];
  authenticVoiceScore: number;
  aiDetectorReports: {
    tool: 'GPTZero' | 'ZeroGPT' | 'Turnitin' | 'Self-Report';
    reportedHumanLikelihood: number;
    reportedAiLikelihood: number;
    notes: string;
    fileAttached?: string;
  }[];
  sourcesVerifiedCount: number;
  dossierSummary: string;
}

export interface StudentProfile {
  name: string;
  email: string;
  title: string;
  focusPreference: string;
  accessAccommodations: {
    id: string;
    institutionId: string;
    title: string;
    details: string;
    code: string;
  }[];
  authenticVoiceBaseline: string;
  byoAiProvider: 'gemini' | 'openai' | 'claude' | 'local';
  byoApiKey?: string;
  studentId?: string;
  program?: string;
}

export interface GitHubProfile {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  bio?: string;
  public_repos?: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  language?: string;
  stargazers_count?: number;
  updated_at: string;
}

export interface CoachMessage {
  id: string;
  sender: 'student' | 'coach';
  role: 'study_coach' | 'research_librarian' | 'apa_coach' | 'assignment_coach' | 'access_coach' | 'body_double';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionType: string;
    payload?: any;
  };
}


// ============================================================================
// Academic Command Center — persisted entities (spec: academic-command-center)
// Additive extension of the original prototype types above. See
// .kiro/specs/academic-command-center/design.md and .kiro/steering/architecture.md.
// ============================================================================

/** Base fields carried by every persisted entity. */
export interface EntityBase {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  /** True for clearly-labeled sample data that can be removed in one action (R12). */
  isDemo?: boolean;
}

/**
 * Shape accepted when writing an entity. Timestamps are optional on input — the repository
 * stamps `createdAt`/`updatedAt` on write — so legacy domain types (Assignment, Course, …)
 * that predate EntityBase can be persisted without modification.
 */
export interface Persistable {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
}

/** IndexedDB object stores / logical collections. */
export type Collection =
  | 'institutions'
  | 'courses'
  | 'semesters'
  | 'weekModules'
  | 'assignments'
  | 'discussions'
  | 'discussionResponses'
  | 'readings'
  | 'assessments'
  | 'citations'
  | 'notes'
  | 'calendarEvents'
  | 'notifications'
  | 'notionSyncRecords'
  | 'settings';

export interface Semester extends EntityBase {
  institutionId?: string; // optional: a semester can be global to the student
  name: string; // e.g. "Fall 2026"
  term: 'Fall' | 'Spring' | 'Summer' | 'Winter' | 'Other';
  year: number;
  startDate?: string;
  endDate?: string;
}

export type WeekModuleStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'optional';

export interface WeekModule extends EntityBase {
  courseId: string;
  index: number; // Week 1, 2, 3 ...
  title?: string;
  overview?: string;
  objectives?: string[];
  status: WeekModuleStatus;
}

/** Superset status usable across assignments and module items. */
export type WorkStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'submitted'
  | 'graded'
  | 'needs_revision'
  | 'waiting'
  | 'optional';

export type AssignmentType =
  | 'Paper'
  | 'Reflection'
  | 'Discussion'
  | 'Presentation'
  | 'Project'
  | 'Research Paper'
  | 'Quiz'
  | 'Exam'
  | 'Case Study'
  | 'Literature Review'
  | 'Group Project'
  | 'Field Assignment'
  | 'Other';

// -------------------- Discussions (highest-priority feature, R4) --------------

export type OriginalPostStatus =
  | 'not_started'
  | 'drafting'
  | 'ready'
  | 'submitted';

export interface OriginalPost {
  status: OriginalPostStatus;
  draft?: string;
  finalText?: string;
  submittedAt?: string; // ISO 8601
  wordCount?: number;
  sourcesUsed?: string[]; // Citation IDs
  lmsUrl?: string;
}

export type DiscussionStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete';

export interface Discussion extends EntityBase {
  courseId: string;
  weekModuleId?: string;
  week?: number;
  title: string;
  prompt?: string;
  professorInstructions?: string;
  initialPostDeadline?: string; // ISO 8601
  responseDeadline?: string; // ISO 8601
  wordCountRequirement?: number;
  citationRequirement?: string;
  /** Minimum number of peer responses required. */
  minResponses: number;
  status: DiscussionStatus;
  originalPost: OriginalPost;
  notes?: string;
}

export interface DiscussionResponse extends EntityBase {
  discussionId: string;
  /** 'peer' = a reply I owe/made to a classmate; 'incoming' = a classmate replied to me. */
  direction?: 'peer' | 'incoming' | 'instructor';
  classmateName: string;
  classmatePostTopic?: string;
  drafted: boolean;
  submitted: boolean;
  submittedAt?: string; // ISO 8601
  wordCount?: number;
  citationsUsed?: string[]; // Citation IDs
  followUpRequired: boolean;
  followUpTaskId?: string;
  notes?: string;
}

/** Derived reply-progress summary for a discussion (computed, not stored). */
export interface ReplyProgress {
  required: number;
  completed: number;
  remaining: number;
  followUps: number;
  incomingUnanswered: number;
}

// -------------------- Assessments / readings / calendar / notifications -------

export type AssessmentType = 'Quiz' | 'Test' | 'Exam' | 'Practical' | 'Other';

export type StudyStatus =
  | 'not_started'
  | 'studying'
  | 'ready'
  | 'completed';

export interface Assessment extends EntityBase {
  courseId: string;
  weekModuleId?: string;
  name: string;
  type: AssessmentType;
  date?: string; // ISO 8601
  time?: string;
  coverage?: string[]; // chapters / modules covered
  studyMaterials?: string[];
  professorGuidance?: string;
  studyStatus: StudyStatus;
  score?: { earned: number; possible: number };
  notes?: string;
}

export type ReadingStatus =
  | 'not_started'
  | 'reading'
  | 'completed'
  | 'review_again';

export interface Reading extends EntityBase {
  courseId: string;
  weekModuleId?: string;
  assignmentId?: string;
  title: string;
  author?: string;
  publication?: string;
  year?: string;
  doi?: string;
  url?: string;
  required: boolean;
  status: ReadingStatus;
  pages?: string;
  notes?: string;
  quotations?: string[];
  concepts?: string[];
  apaCitation?: string;
  /** Whether citation metadata is verified. Never silently set true (academic-integrity). */
  verified?: boolean;
}

export type CalendarEventKind =
  | 'assignment'
  | 'discussion_post'
  | 'discussion_response'
  | 'test'
  | 'quiz'
  | 'presentation'
  | 'deadline'
  | 'meeting'
  | 'other';

export interface CalendarEvent extends EntityBase {
  courseId?: string;
  kind: CalendarEventKind;
  title: string;
  date: string; // ISO 8601
  time?: string;
  /** Links back to the entity that generated this event, if any. */
  sourceEntityId?: string;
}

export interface Note extends EntityBase {
  courseId?: string;
  weekModuleId?: string;
  assignmentId?: string;
  title?: string;
  body: string;
  tags?: string[];
  /** Parking-lot notes are captured without scheduling (executive-function support). */
  parkingLot?: boolean;
}

export interface Notification extends EntityBase {
  ruleId?: string;
  entityId: string;
  message: string;
  dueOffsetDays?: number;
  read: boolean;
}

// -------------------- AI provider abstraction (R8) ---------------------------

export type AIProviderKind =
  | 'gemini'
  | 'anime_ai'
  | 'openai_compatible'
  | 'anthropic_compatible'
  | 'bedrock'
  | 'local';

/**
 * Client-visible provider metadata only. Keys and endpoints live server-side and are
 * NEVER included here (security steering).
 */
export interface AIProvider extends EntityBase {
  provider: AIProviderKind;
  label: string;
  model?: string;
  enabledFeatures: string[];
  /** Whether the server reports this provider as configured/usable. */
  configured: boolean;
}

// -------------------- Notion sync bookkeeping (R7) ---------------------------

export type SyncDirection = 'import' | 'export' | 'two_way';
export type ConflictStatus = 'none' | 'conflict' | 'resolved_local' | 'resolved_remote';

export interface NotionSyncRecord extends EntityBase {
  externalId: string; // Notion page/row id (stable dedupe key)
  localEntityId?: string;
  collection: Collection;
  source: 'notion';
  lastSyncedAt?: string;
  syncDirection: SyncDirection;
  conflictStatus: ConflictStatus;
}

// -------------------- Persistence contracts ----------------------------------

export interface Snapshot {
  schemaVersion: number;
  exportedAt: string;
  collections: Partial<Record<Collection, EntityBase[]>>;
}

/**
 * The single boundary through which the app reads/writes durable data.
 * Implementations: IndexedDbRepository (now), ApiRepository (future backend).
 * See design.md §3.
 */
export interface Repository {
  getAll<T extends EntityBase>(collection: Collection): Promise<T[]>;
  get<T extends EntityBase>(collection: Collection, id: string): Promise<T | undefined>;
  put<T extends Persistable>(collection: Collection, entity: T): Promise<T & EntityBase>;
  bulkPut<T extends Persistable>(collection: Collection, entities: T[]): Promise<void>;
  remove(collection: Collection, id: string): Promise<void>;
  /** Remove every entity flagged isDemo across all collections (R12). */
  clearDemo(): Promise<void>;
  exportAll(): Promise<Snapshot>;
  importAll(snapshot: Snapshot): Promise<void>;
}
