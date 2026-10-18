export type TabType = 'TODAY' | 'COURSES' | 'ASSIGNMENTS' | 'LIBRARY' | 'WRITE' | 'FOCUS' | 'CHAT' | 'ME';

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
