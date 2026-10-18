import {
  DissertationProject,
  MatrixTheme,
  PeerReviewedSource,
  MatrixCell
} from '../types/matrix';
import { auditSourceApa7 } from './apa7Engine';

export const DEFAULT_DISSERTATION_PROJECT: DissertationProject = {
  id: 'proj-dissertation-01',
  title: 'Algorithmic Governance and Epistemic Diversity in Digital Public Spheres: A Mixed-Methods Synthesis',
  researchQuestion: 'How do recommendation architectures systematically structure exposure diversity, and what governance frameworks mitigate epistemic closure in civic deliberation?',
  fieldOfStudy: 'Information Science & Political Epistemology',
  targetDefenseYear: 2026,
  authorName: 'Alex Mercer, Ph.D. Candidate',
  institutionalAffiliation: 'Graduate School of Arts and Sciences',
  createdAt: '2026-01-15T09:00:00.000Z',
  updatedAt: new Date().toISOString()
};

export const DEFAULT_THEMES: MatrixTheme[] = [
  {
    id: 'th-1',
    code: 'T1',
    name: 'Theoretical Framing: Epistemic Injustice',
    description: 'Foundational epistemological models analyzing testimonial and hermeneutical harms in algorithmic curation.',
    colorKey: 'stone',
    order: 1
  },
  {
    id: 'th-2',
    code: 'T2',
    name: 'Algorithmic Homophily & Filter Dynamics',
    description: 'Empirical mechanisms driving exposure limitation, ideological sorting, and engagement loops.',
    colorKey: 'amber',
    order: 2
  },
  {
    id: 'th-3',
    code: 'T3',
    name: 'Deliberative Democratic Capacity',
    description: 'Impact of platform interfaces on civic reasoning, collective consensus, and communicative rationality.',
    colorKey: 'emerald',
    order: 3
  },
  {
    id: 'th-4',
    code: 'T4',
    name: 'Interventions & Algorithmic Audits',
    description: 'Evaluations of regulatory frameworks, model interpretability, and procedural counter-measures.',
    colorKey: 'indigo',
    order: 4
  }
];

export const DEFAULT_SOURCES: PeerReviewedSource[] = [
  {
    id: "src-bail-2023",
    title: "Algorithmic amplification and epistemic bubbles: A multi-platform empirical analysis of informational homophily",
    titleSentenceCase: "Algorithmic amplification and epistemic bubbles: A multi-platform empirical analysis of informational homophily",
    authors: ["Bail, C. A.", "Argyle, L. P.", "Brown, T. W.", "Kalluri, N."],
    year: 2023,
    journal: "Journal of Communication",
    volume: "73",
    issue: "4",
    pages: "341–356",
    doi: "https://doi.org/10.1093/joc/jqad018",
    issn: "0021-9916",
    publicationType: "empirical-quantitative",
    sampleAndContext: "N = 42,000 active participants across three major social platforms tracked longitudinally over 14 months using browser telemetry and opt-in sentiment logging.",
    keyFindings: "Recommendation engines optimized for time-on-page increased exposure to in-group ideological cues by 34%, while actively suppressing divergent cross-cutting discourse by 22%.",
    methodologicalLimitations: "Relies on platform API access endpoints that are increasingly restricted; participant demographics skewed toward North American and Western European internet users.",
    dissertationContribution: "Provides the primary quantitative empirical baseline for Chapter 2 demonstrating that exposure polarization is an architectural feature of engagement heuristics, not merely voluntary homophily.",
    isPeerReviewed: true,
    peerReviewConfidence: 99,
    peerReviewedStatus: "verified",
    sourceProvider: "OpenAlex (Oxford University Press)",
    abstract: "This study provides a multi-platform empirical evaluation of algorithmic recommendation engines across 42,000 participants, demonstrating how engagement-maximizing heuristics exacerbate epistemic divergence while reinforcing affective polarization.",
    apaComplianceScore: 100,
    tags: ["Algorithmic Amplification", "Empirical Quantitative", "Homophily", "Social Media"],
    createdAt: "2026-01-20T10:00:00.000Z"
  },
  {
    id: "src-benjamin-2022",
    title: "Epistemic injustice in automated decision systems: Measuring procedural harms in high-stakes public sector governance",
    titleSentenceCase: "Epistemic injustice in automated decision systems: Measuring procedural harms in high-stakes public sector governance",
    authors: ["Benjamin, R.", "Kroll, J. A."],
    year: 2022,
    journal: "Big Data & Society",
    volume: "9",
    issue: "2",
    pages: "1–17",
    doi: "https://doi.org/10.1177/20539517221102945",
    issn: "2053-9517",
    publicationType: "theoretical-conceptual",
    sampleAndContext: "Qualitative institutional comparative analysis across 12 automated algorithmic screening deployments in state healthcare and judicial bail determination.",
    keyFindings: "Automated classification systems systematically produce testimonial injustice when algorithm outputs preclude citizen contestation, creating hermeneutical lock-in.",
    methodologicalLimitations: "Focuses on administrative governance cases; requires translation when applied to informal digital speech and content moderation architectures.",
    dissertationContribution: "Establishes the core philosophical and normative framework for Chapter 1, anchoring the dissertation in Miranda Fricker's epistemic injustice taxonomy.",
    isPeerReviewed: true,
    peerReviewConfidence: 98,
    peerReviewedStatus: "verified",
    sourceProvider: "CrossRef (SAGE)",
    abstract: "We formulate an epistemological evaluation framework for algorithmic administrative decisions, detailing how testimonial injustice arises when marginalized subjects cannot challenge non-interpretable model weights.",
    apaComplianceScore: 100,
    tags: ["Epistemic Injustice", "Procedural Justice", "Public Governance", "Conceptual"],
    createdAt: "2026-01-22T11:30:00.000Z"
  },
  {
    id: "src-dryzek-2023",
    title: "Deliberative systems in the platform age: How social media architecture constrains democratic reasoning",
    titleSentenceCase: "Deliberative systems in the platform age: How social media architecture constrains democratic reasoning",
    authors: ["Dryzek, J. S.", "Bächtiger, A.", "Milewicz, K."],
    year: 2023,
    journal: "American Political Science Review",
    volume: "117",
    issue: "2",
    pages: "675–691",
    doi: "https://doi.org/10.1017/S0003055422000898",
    issn: "0003-0554",
    publicationType: "theoretical-conceptual",
    sampleAndContext: "Systemic democratic theory synthesis integrating 85 empirical studies across political deliberation and computational communication.",
    keyFindings: "Platform affordances fragment the communicative transmission belt between public spaces and empowered decision-making bodies, substituting reasoned consensus with hyper-salient outrage signaling.",
    methodologicalLimitations: "Normative theoretical synthesis without primary computational data generation; assumes ideal deliberative benchmarks derived from Habermasian theory.",
    dissertationContribution: "Critical bridge between political philosophy and computational architecture for Chapter 3, defining 'deliberative capacity' metrics.",
    isPeerReviewed: true,
    peerReviewConfidence: 100,
    peerReviewedStatus: "verified",
    sourceProvider: "OpenAlex (Cambridge University Press)",
    abstract: "Develops an institutional framework examining how algorithmic curation structures deliberative capacity across macro-level civic spaces, identifying systematic structural barriers to epistemic diversity.",
    apaComplianceScore: 100,
    tags: ["Deliberative Democracy", "Communicative Reason", "Platform Affordances"],
    createdAt: "2026-01-25T14:15:00.000Z"
  },
  {
    id: "src-gao-2024",
    title: "A systematic review and meta-analysis of interventions mitigating algorithmic bias in peer-review selection",
    titleSentenceCase: "A systematic review and meta-analysis of interventions mitigating algorithmic bias in peer-review selection",
    authors: ["Gao, L. X.", "van Dijk, M.", "Sorensen, H. P."],
    year: 2024,
    journal: "Nature Human Behaviour",
    volume: "8",
    issue: "1",
    pages: "88–104",
    doi: "https://doi.org/10.1038/s41562-023-01772-1",
    issn: "2397-3374",
    publicationType: "meta-analysis",
    sampleAndContext: "124 experimental trials and counterfactual evaluations across academic repositories and algorithmic matching platforms (total N = 186,400 matching decisions).",
    keyFindings: "Algorithmic exposure adjustments paired with transparent audit logs significantly reduced institutional prestige disparity (effect size d = -0.34, p < 0.001) while preserving accuracy.",
    methodologicalLimitations: "High heterogeneity among intervention designs; publication bias toward positive debiasing outcomes in academic settings.",
    dissertationContribution: "Direct evidence for Chapter 4 governance recommendations, proving that algorithmic counter-measures can actively restore epistemic balance.",
    isPeerReviewed: true,
    peerReviewConfidence: 100,
    peerReviewedStatus: "verified",
    sourceProvider: "CrossRef (Springer Nature)",
    abstract: "Analyzing 124 experimental trials across academic publishing repositories, this meta-analysis quantifies effect sizes of double-blind review and structured evaluation matrices on reducing institutional prestige bias.",
    apaComplianceScore: 100,
    tags: ["Meta-Analysis", "Algorithmic Debiasing", "Governance", "Interventions"],
    createdAt: "2026-02-01T16:00:00.000Z"
  },
  {
    id: "src-braun-2021",
    title: "Synthesizing qualitative literature in doctoral dissertations: Methodological rigor, thematic coding, and epistemic reflexivity",
    titleSentenceCase: "Synthesizing qualitative literature in doctoral dissertations: Methodological rigor, thematic coding, and epistemic reflexivity",
    authors: ["Braun, V.", "Clarke, V.", "Terry, G."],
    year: 2021,
    journal: "Qualitative Research in Psychology",
    volume: "18",
    issue: "3",
    pages: "328–352",
    doi: "https://doi.org/10.1080/14780887.2020.1769855",
    issn: "1478-0887",
    publicationType: "empirical-qualitative",
    sampleAndContext: "Content analysis of 95 doctoral dissertations across behavioral and social sciences, accompanied by in-depth semi-structured interviews with 24 dissertation advisory committee chairs.",
    keyFindings: "Doctoral candidates who employed structured literature synthesis matrices achieved 40% higher thematic coherence scores and clearer dissertation gap justifications during committee oral defenses.",
    methodologicalLimitations: "Sample restricted to English-language research universities in the UK, Australia, and New Zealand.",
    dissertationContribution: "Methodological justification for using matrix synthesis and reflexivity audit trails throughout Chapter 1 and Chapter 2.",
    isPeerReviewed: true,
    peerReviewConfidence: 99,
    peerReviewedStatus: "verified",
    sourceProvider: "OpenAlex (Taylor & Francis)",
    abstract: "A critical methodological guide for doctoral scholars conducting qualitative thematic synthesis. Details matrix coding techniques, researcher positionality tracking, and audit trail construction for defensible literature review chapters.",
    apaComplianceScore: 100,
    tags: ["Methodology", "Thematic Synthesis", "Qualitative Rigor", "Doctoral Defense"],
    createdAt: "2026-02-05T08:30:00.000Z"
  }
];

export const DEFAULT_CELLS: MatrixCell[] = [
  // Bail 2023 cells
  {
    sourceId: "src-bail-2023",
    themeId: "th-1",
    stance: "supports",
    synthesisNotes: "Demonstrates that feed-level sorting acts as an epistemic constraint, reinforcing Fricker's conception of structural testimonial silencing through selective exposure.",
    directQuote: "Recommender systems do not merely reflect existing user preferences; they systematically constrain the epistemic horizons of deliberating agents.",
    pageNumber: "p. 344",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-10T12:00:00.000Z"
  },
  {
    sourceId: "src-bail-2023",
    themeId: "th-2",
    stance: "supports",
    synthesisNotes: "Provides direct empirical evidence that engagement heuristics maximize emotional intensity, accelerating user sorting into non-overlapping information silos.",
    directQuote: "Our telemetry logs revealed a 34% surge in exposure to homogenous ideological clusters within 12 weeks of initial platform onboarding.",
    pageNumber: "p. 349",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-10T12:00:00.000Z"
  },
  {
    sourceId: "src-bail-2023",
    themeId: "th-3",
    stance: "contradicts",
    synthesisNotes: "Contradicts early optimistic techno-determinist claims that digital platforms inherently democratize communicative exchange; shows instead a net decline in reasoned deliberation.",
    directQuote: "Cross-ideological discourse yielded affective hardening rather than mutual consensus, challenging Habermasian communicative optimism.",
    pageNumber: "p. 352",
    evidenceWeight: "high",
    literatureGapIdentified: true,
    gapNotes: "The literature lacks long-term intervention data testing whether slow-feed interfaces reverse this affective hardening.",
    updatedAt: "2026-02-10T12:00:00.000Z"
  },
  {
    sourceId: "src-bail-2023",
    themeId: "th-4",
    stance: "unaddressed",
    synthesisNotes: "Authors do not test audit interventions, limiting their scope to diagnostic telemetry without proposing architectural counter-measures.",
    directQuote: "",
    pageNumber: "",
    evidenceWeight: "exploratory",
    literatureGapIdentified: true,
    gapNotes: "Clear dissertation gap: Needs integration with Gao et al.'s debiasing framework.",
    updatedAt: "2026-02-10T12:00:00.000Z"
  },

  // Benjamin 2022 cells
  {
    sourceId: "src-benjamin-2022",
    themeId: "th-1",
    stance: "supports",
    synthesisNotes: "The primary philosophical anchor. Formalizes the distinction between testimonial injustice (discounting human testimony) and hermeneutical injustice (precluding interpretive vocabulary).",
    directQuote: "Automated scoring mechanisms constitute a site of hermeneutical dispossession when the grounds of classification remain impenetrable to affected populations.",
    pageNumber: "p. 8",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-12T14:00:00.000Z"
  },
  {
    sourceId: "src-benjamin-2022",
    themeId: "th-2",
    stance: "extends",
    synthesisNotes: "Extends filter bubble discourse by arguing that algorithmic sorting is an active exercise of institutional epistemic power, not an incidental computational artifact.",
    directQuote: "What computer scientists term 'algorithmic bias' is fundamentally an epistemological dispute over whose knowledge claims are rendered legible.",
    pageNumber: "p. 12",
    evidenceWeight: "moderate",
    literatureGapIdentified: false,
    updatedAt: "2026-02-12T14:00:00.000Z"
  },
  {
    sourceId: "src-benjamin-2022",
    themeId: "th-3",
    stance: "contextual",
    synthesisNotes: "Provides the normative standard for deliberative legitimacy in high-stakes automated decision environments.",
    directQuote: "Procedural justice is impossible without epistemic reciprocity.",
    pageNumber: "p. 15",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-12T14:00:00.000Z"
  },
  {
    sourceId: "src-benjamin-2022",
    themeId: "th-4",
    stance: "supports",
    synthesisNotes: "Advocates for adversarial independent auditing and participatory design councils as obligatory regulatory requirements.",
    directQuote: "Auditing cannot remain a retrospective post-hoc exercise; it must be built as an ongoing institutional contestation venue.",
    pageNumber: "p. 16",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-12T14:00:00.000Z"
  },

  // Dryzek 2023 cells
  {
    sourceId: "src-dryzek-2023",
    themeId: "th-1",
    stance: "extends",
    synthesisNotes: "Situates epistemic injustice within broader macro-deliberative systems, emphasizing systemic communicative blockage.",
    directQuote: "When algorithms decouple rhetoric from epistemic grounding, the deliberative system loses its capacity for self-correction.",
    pageNumber: "p. 679",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-15T09:30:00.000Z"
  },
  {
    sourceId: "src-dryzek-2023",
    themeId: "th-2",
    stance: "supports",
    synthesisNotes: "Corroborates Bail et al. by showing how micro-targeting undermines shared public spheres necessary for collective political reasoning.",
    directQuote: "Fragmented audiences receive bespoke justifications that cannot be scrutinized in common civic assemblies.",
    pageNumber: "p. 683",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-15T09:30:00.000Z"
  },
  {
    sourceId: "src-dryzek-2023",
    themeId: "th-3",
    stance: "supports",
    synthesisNotes: "Core framework for defining 'deliberative capacity'—the degree to which an institutional space fosters non-coercive, reflective, and inclusive discourse.",
    directQuote: "A healthy deliberative system requires communicative channels capable of transmitting peripheral public insights into empowered chambers.",
    pageNumber: "p. 688",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-15T09:30:00.000Z"
  },
  {
    sourceId: "src-dryzek-2023",
    themeId: "th-4",
    stance: "extends",
    synthesisNotes: "Argues that technical audits alone are insufficient without institutional democratic anchorage like citizen juries and mini-publics.",
    directQuote: "Algorithmic transparency is sterile without organized public bodies capable of evaluating the societal stakes.",
    pageNumber: "p. 690",
    evidenceWeight: "moderate",
    literatureGapIdentified: true,
    gapNotes: "The integration between citizen assemblies and technical algorithmic auditing metrics is unstudied in doctoral literature.",
    updatedAt: "2026-02-15T09:30:00.000Z"
  },

  // Gao 2024 cells
  {
    sourceId: "src-gao-2024",
    themeId: "th-1",
    stance: "contextual",
    synthesisNotes: "Provides empirical evidence that status quo algorithms amplify Matthew effects (accumulative advantage), which directly maps to testimonial injustice.",
    directQuote: "Baseline matching systems exhibited severe prestige bias, attributing up to 45% higher weight to established institutional affiliations.",
    pageNumber: "p. 92",
    evidenceWeight: "moderate",
    literatureGapIdentified: false,
    updatedAt: "2026-02-18T11:00:00.000Z"
  },
  {
    sourceId: "src-gao-2024",
    themeId: "th-4",
    stance: "supports",
    synthesisNotes: "The key empirical paper for Chapter 4 interventions. Proves that structured evaluation matrices and exposure calibration achieve statistical debiasing.",
    directQuote: "Counterfactual exposure normalization reduced prestige disparity by d = -0.34 without compromising downstream decision quality.",
    pageNumber: "p. 99",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-18T11:00:00.000Z"
  },

  // Braun 2021 cells
  {
    sourceId: "src-braun-2021",
    themeId: "th-1",
    stance: "supports",
    synthesisNotes: "Frames literature synthesis as an epistemic intervention wherein the doctoral researcher must exercise critical reflexivity and transparent coding.",
    directQuote: "The literature review is not a passive catalog of prior texts; it is an active theoretical construction of epistemic territory.",
    pageNumber: "p. 331",
    evidenceWeight: "high",
    literatureGapIdentified: false,
    updatedAt: "2026-02-20T15:00:00.000Z"
  }
];

export const MatrixStorage = {
  loadProject(): DissertationProject {
    const raw = localStorage.getItem('dissertation_matrix_project');
    if (!raw) return DEFAULT_DISSERTATION_PROJECT;
    try {
      return { ...DEFAULT_DISSERTATION_PROJECT, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_DISSERTATION_PROJECT;
    }
  },

  saveProject(project: DissertationProject): void {
    localStorage.setItem('dissertation_matrix_project', JSON.stringify(project));
  },

  loadThemes(): MatrixTheme[] {
    const raw = localStorage.getItem('dissertation_matrix_themes');
    if (!raw) return DEFAULT_THEMES;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_THEMES;
    } catch {
      return DEFAULT_THEMES;
    }
  },

  saveThemes(themes: MatrixTheme[]): void {
    localStorage.setItem('dissertation_matrix_themes', JSON.stringify(themes));
  },

  loadSources(): PeerReviewedSource[] {
    const raw = localStorage.getItem('dissertation_matrix_sources');
    if (!raw) {
      // Run initial APA score check on default sources
      return DEFAULT_SOURCES.map(s => {
        const audit = auditSourceApa7(s);
        return { ...s, apaComplianceScore: audit.score };
      });
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(s => {
          const audit = auditSourceApa7(s);
          return { ...s, apaComplianceScore: audit.score };
        });
      }
      return DEFAULT_SOURCES;
    } catch {
      return DEFAULT_SOURCES;
    }
  },

  saveSources(sources: PeerReviewedSource[]): void {
    localStorage.setItem('dissertation_matrix_sources', JSON.stringify(sources));
  },

  loadCells(): MatrixCell[] {
    const raw = localStorage.getItem('dissertation_matrix_cells');
    if (!raw) return DEFAULT_CELLS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CELLS;
    } catch {
      return DEFAULT_CELLS;
    }
  },

  saveCells(cells: MatrixCell[]): void {
    localStorage.setItem('dissertation_matrix_cells', JSON.stringify(cells));
  },

  resetToDefault(): void {
    localStorage.removeItem('dissertation_matrix_project');
    localStorage.removeItem('dissertation_matrix_themes');
    localStorage.removeItem('dissertation_matrix_sources');
    localStorage.removeItem('dissertation_matrix_cells');
  }
};
