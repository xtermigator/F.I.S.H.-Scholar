export type PublicationType =
  | 'empirical-quantitative'
  | 'empirical-qualitative'
  | 'mixed-methods'
  | 'systematic-review'
  | 'meta-analysis'
  | 'theoretical-conceptual';

export type MatrixStance =
  | 'supports'
  | 'contradicts'
  | 'extends'
  | 'contextual'
  | 'unaddressed';

export type EvidenceWeight = 'high' | 'moderate' | 'exploratory';

export interface DissertationProject {
  id: string;
  title: string;
  researchQuestion: string;
  fieldOfStudy: string;
  targetDefenseYear: number;
  authorName: string;
  institutionalAffiliation: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatrixTheme {
  id: string;
  code: string; // e.g. T1, T2, T3
  name: string;
  description: string;
  colorKey: string;
  order: number;
}

export interface PeerReviewedSource {
  id: string;
  title: string;
  titleSentenceCase: string;
  authors: string[]; // e.g. ["Bail, C. A.", "Argyle, L. P."]
  year: number;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string; // https://doi.org/10.xxxx/...
  issn?: string;
  publicationType: PublicationType;
  sampleAndContext: string;
  keyFindings: string;
  methodologicalLimitations: string;
  dissertationContribution: string;
  isPeerReviewed: boolean;
  peerReviewConfidence: number; // 0-100
  peerReviewedStatus: 'verified' | 'unverified' | 'flagged';
  sourceProvider: string;
  abstract: string;
  apaComplianceScore: number;
  tags: string[];
  createdAt: string;
}

export interface MatrixCell {
  sourceId: string;
  themeId: string;
  stance: MatrixStance;
  synthesisNotes: string;
  directQuote: string;
  pageNumber: string;
  evidenceWeight: EvidenceWeight;
  literatureGapIdentified: boolean;
  gapNotes?: string;
  updatedAt: string;
}

export interface ApaCheckResult {
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'pass';
  fixSuggestion?: string;
}

export interface SourceValidationAudit {
  sourceId: string;
  score: number;
  isCompliant: boolean;
  checks: ApaCheckResult[];
}

export interface AnnotatedBibliographySettings {
  includeMethodology: boolean;
  includeFindings: boolean;
  includeLimitations: boolean;
  includeThemeRelevance: boolean;
  includeDirectQuotes: boolean;
  annotationParagraphs: 1 | 2 | 3;
  filterThemeId: string | null;
  sortAlphabetical: boolean;
}
