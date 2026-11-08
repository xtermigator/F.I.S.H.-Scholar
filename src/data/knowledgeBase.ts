import type {
  Institution,
  Course,
  Reading,
  Citation,
  Note,
  EntityBase,
  Collection,
} from '../types';
import type { Seed } from './seed';

/**
 * Literature knowledge base for F.I.S.H. Scholar.
 *
 * Seeded from the student's real EDU 810 "Grounding Research in Literature" course
 * (Gwynedd Mercy University, Fall 2026) assigned readings. Unlike buildDemoSeed(),
 * these are REAL records (isDemo: false): they are verified, openly accessible
 * scholarly articles the student was assigned, and they must NOT be removed by
 * "Remove demo data".
 *
 * What this adds (and why it makes the app better):
 *  - The four articles become searchable library records (readings + citations), so
 *    global search, Ask FISH, and the Talk-to-FISH grounding layer can cite them.
 *  - Two synthesis notes turn the readings into coaching material: Boote & Beile's
 *    literature-review quality rubric and Welsh et al.'s five phases of Scholar
 *    Transformation Theory, so the companion can coach literature-review writing
 *    against the exact frameworks the course teaches.
 *
 * Integrity rules (.kiro/steering/academic-integrity.md):
 *  - Every quotation below was verified verbatim against the article PDF.
 *  - No DOIs, page numbers, professor names, or policies are invented; unknown
 *    course fields are left blank for the student to fill in.
 *  - `verified` on readings is left unset until the student confirms metadata.
 */

const KB_TS = '2026-10-25T07:30:00.000Z';

/** Real (non-demo) record factory. */
function kb<T extends { id: string }>(entity: T): T & EntityBase {
  return { createdAt: KB_TS, updatedAt: KB_TS, isDemo: false, ...entity };
}

const SEMESTER = 'Fall 2026';
const EDU810 = 'course-gmercyu-edu810';

const institutions: (Institution & EntityBase)[] = [
  kb({
    id: 'inst-gmercyu',
    name: 'Gwynedd Mercy University',
    shortName: 'GMercyU',
    badgeColor: 'bg-emerald-950 text-emerald-100 border-emerald-800/60',
    accentColor: '#047857',
    logo: '📚',
    currentSemester: SEMESTER,
    location: '',
  }),
];

const courses: (Course & EntityBase)[] = [
  kb({
    id: EDU810,
    institutionId: 'inst-gmercyu',
    code: 'EDU 810',
    title: 'Grounding Research in Literature',
    department: '',
    credits: 3,
    semester: SEMESTER,
    color: 'border-l-emerald-600',
    professor: { name: '', email: '', officeHours: '', preferredCommunication: '' },
    policies: { lateWork: '', attendance: '', aiPolicy: '', accommodations: '' },
    gradingScale: [],
  }),
];

const readings: (Reading & EntityBase)[] = [
  kb({
    id: 'rdg-edu810-boote-beile-2005',
    courseId: EDU810,
    title:
      'Scholars Before Researchers: On the Centrality of the Dissertation Literature Review in Research Preparation',
    author: 'Boote, D. N., & Beile, P.',
    publication: 'Educational Researcher, 34(6)',
    year: '2005',
    doi: '10.3102/0013189X034006003',
    url: 'https://twister.caps.ou.edu/METR3334/Papers/Boote_Beile_EducationalResearcher2005.pdf',
    required: true,
    status: 'not_started',
    pages: '3-15',
    notes:
      'Assigned EDU 810 reading. Argues the dissertation literature review is the core skill of doctoral preparation and proposes a 12-item scoring rubric (see note "Literature Review Quality Rubric"). Open-access copy via University of Oklahoma course site.',
    concepts: ['Literature review', 'Doctoral education', 'Research preparation', 'Review rubric'],
    apaCitation:
      'Boote, D. N., & Beile, P. (2005). Scholars before researchers: On the centrality of the dissertation literature review in research preparation. Educational Researcher, 34(6), 3-15. https://doi.org/10.3102/0013189X034006003',
  }),
  kb({
    id: 'rdg-edu810-maxwell-2006',
    courseId: EDU810,
    title:
      'Literature Reviews of, and for, Educational Research: A Commentary on Boote and Beile\'s "Scholars Before Researchers"',
    author: 'Maxwell, J. A.',
    publication: 'Educational Researcher, 35(9)',
    year: '2006',
    url: 'https://www.jstor.org/stable/4124800',
    required: true,
    status: 'not_started',
    pages: '28-31',
    notes:
      'Assigned EDU 810 reading. Commentary arguing that relevance, not exhaustive coverage, is the essential characteristic of a dissertation literature review. Digitized copy hosted at letr.org.uk; stable record on JSTOR (4124800).',
    concepts: ['Literature review', 'Relevance', 'Research design', 'Commentary'],
    apaCitation:
      'Maxwell, J. A. (2006). Literature reviews of, and for, educational research: A commentary on Boote and Beile\'s "Scholars before Researchers." Educational Researcher, 35(9), 28-31. https://www.jstor.org/stable/4124800',
  }),
  kb({
    id: 'rdg-edu810-welsh-stt-2020',
    courseId: EDU810,
    title: 'Scholar Transformation Theory: Empowering Students to Get the Job Done Write',
    author: 'Welsh, B., Ellington, R., Shockley, K., & Prime, G.',
    publication: 'ERIC (Online Submission, ED614545)',
    year: '2020',
    url: 'https://files.eric.ed.gov/fulltext/ED614545.pdf',
    required: true,
    status: 'not_started',
    notes:
      'Assigned EDU 810 reading. NOT a journal article: an unpublished manuscript submitted to ERIC on November 11, 2020 (ED614545); cite as 2020. Introduces Scholar Transformation Theory and its five phases (see note "Five Phases of Scholar Transformation Theory").',
    concepts: ['Scholar Transformation Theory', 'Scholar identity', 'Doctoral writing', 'Positionality'],
    apaCitation:
      'Welsh, B., Ellington, R., Shockley, K., & Prime, G. (2020). Scholar transformation theory: Empowering students to get the job done write [Manuscript]. ERIC. https://files.eric.ed.gov/fulltext/ED614545.pdf',
  }),
  kb({
    id: 'rdg-edu810-grant-osanloo-2014',
    courseId: EDU810,
    title:
      'Understanding, Selecting, and Integrating a Theoretical Framework in Dissertation Research: Creating the Blueprint for Your "House"',
    author: 'Grant, C., & Osanloo, A.',
    publication: 'Administrative Issues Journal: Connecting Education, Practice, and Research, 4(2)',
    year: '2014',
    url: 'https://files.eric.ed.gov/fulltext/EJ1058505.pdf',
    required: true,
    status: 'not_started',
    pages: '12-26',
    notes:
      'Assigned EDU 810 reading. Open access. Uses the blueprint-of-a-house metaphor to show how a theoretical framework structures the topic, research questions, literature review, design, and analysis plan of a dissertation.',
    concepts: ['Theoretical framework', 'Dissertation', 'Research design', 'Blueprint metaphor'],
    apaCitation:
      'Grant, C., & Osanloo, A. (2014). Understanding, selecting, and integrating a theoretical framework in dissertation research: Creating the blueprint for your "house." Administrative Issues Journal: Connecting Education, Practice, and Research, 4(2), 12-26. https://files.eric.ed.gov/fulltext/EJ1058505.pdf',
  }),
];

const citations: (Citation & EntityBase)[] = [
  kb({
    id: 'cit-boote-beile-2005',
    authors: 'Boote, D. N., & Beile, P.',
    year: '2005',
    title:
      'Scholars before researchers: On the centrality of the dissertation literature review in research preparation',
    source: 'Educational Researcher, 34(6), 3-15',
    doiOrUrl: 'https://doi.org/10.3102/0013189X034006003',
    apa7: 'Boote, D. N., & Beile, P. (2005). Scholars before researchers: On the centrality of the dissertation literature review in research preparation. Educational Researcher, 34(6), 3-15. https://doi.org/10.3102/0013189X034006003',
    inText: '(Boote & Beile, 2005)',
    notes:
      'Core EDU 810 text: the dissertation literature review is the central, integrative skill of doctoral preparation. Includes a 12-item Literature Review Scoring Rubric across five categories: Coverage, Synthesis, Methodology, Significance, Rhetoric.',
    keyQuotes: [
      'A thorough, sophisticated literature review is the foundation and inspiration for substantial, useful research.',
      'Doctoral students must be scholars before they are researchers.',
    ],
    keywords: ['Literature Review', 'Dissertation', 'Doctoral Education', 'Research Preparation', 'Review Rubric'],
    coursesUsed: [EDU810],
    papersCitedIn: [],
    institutionOrigin: 'Gwynedd Mercy University',
    aiThematicCategory: 'Research Methodologies & Data',
    sourceTypeClassification: 'Empirical Study',
    aiRelevanceScore: 95,
    aiTaggedKeywords: ['Literature Review Quality', 'Doctoral Preparation', 'Scholarship Before Research'],
  }),
  kb({
    id: 'cit-maxwell-2006',
    authors: 'Maxwell, J. A.',
    year: '2006',
    title:
      'Literature reviews of, and for, educational research: A commentary on Boote and Beile\'s "Scholars before Researchers"',
    source: 'Educational Researcher, 35(9), 28-31',
    doiOrUrl: 'https://www.jstor.org/stable/4124800',
    apa7: 'Maxwell, J. A. (2006). Literature reviews of, and for, educational research: A commentary on Boote and Beile\'s "Scholars before Researchers." Educational Researcher, 35(9), 28-31. https://www.jstor.org/stable/4124800',
    inText: '(Maxwell, 2006)',
    notes:
      'Counterpoint to Boote & Beile: a dissertation review is "for" the study, not a stand-alone publication, so relevance to the research questions beats exhaustive coverage. Pair with cit-boote-beile-2005 for the full debate.',
    keyQuotes: [
      'Relevance, rather than thoroughness or comprehensiveness, is the essential characteristic of literature reviews in most scholarly work.',
    ],
    keywords: ['Literature Review', 'Relevance', 'Research Design', 'Doctoral Education', 'Commentary'],
    coursesUsed: [EDU810],
    papersCitedIn: [],
    institutionOrigin: 'Gwynedd Mercy University',
    aiThematicCategory: 'Research Methodologies & Data',
    sourceTypeClassification: 'Theoretical Framework',
    aiRelevanceScore: 92,
    aiTaggedKeywords: ['Relevance Over Coverage', 'Review For The Study', 'Boote-Beile Debate'],
  }),
  kb({
    id: 'cit-welsh-stt-2020',
    authors: 'Welsh, B., Ellington, R., Shockley, K., & Prime, G.',
    year: '2020',
    title: 'Scholar transformation theory: Empowering students to get the job done write',
    source: 'ERIC (Online Submission, ED614545)',
    doiOrUrl: 'https://files.eric.ed.gov/fulltext/ED614545.pdf',
    apa7: 'Welsh, B., Ellington, R., Shockley, K., & Prime, G. (2020). Scholar transformation theory: Empowering students to get the job done write [Manuscript]. ERIC. https://files.eric.ed.gov/fulltext/ED614545.pdf',
    inText: '(Welsh et al., 2020)',
    notes:
      'ERIC manuscript (not a journal article; cite 2020, ED614545). Scholar Transformation Theory describes five phases of doctoral identity growth, from Passive Information Gatherer to Active Knowledge Producer. The course handout "Characteristics of the Five Phases" is not publicly posted; the phases are fully described in this paper.',
    keyQuotes: [
      'This student has developed a scholar identity. He sees himself as a scholar capable of producing his own unique scholarship.',
    ],
    keywords: ['Scholar Transformation Theory', 'Scholar Identity', 'Doctoral Writing', 'Positionality', 'Five Phases'],
    coursesUsed: [EDU810],
    papersCitedIn: [],
    institutionOrigin: 'Gwynedd Mercy University',
    aiThematicCategory: 'Research Methodologies & Data',
    sourceTypeClassification: 'Theoretical Framework',
    aiRelevanceScore: 90,
    aiTaggedKeywords: ['Scholar Identity Development', 'Five Phases Of STT', 'Knowledge Producer'],
  }),
  kb({
    id: 'cit-grant-osanloo-2014',
    authors: 'Grant, C., & Osanloo, A.',
    year: '2014',
    title:
      'Understanding, selecting, and integrating a theoretical framework in dissertation research: Creating the blueprint for your "house"',
    source: 'Administrative Issues Journal: Connecting Education, Practice, and Research, 4(2), 12-26',
    doiOrUrl: 'https://files.eric.ed.gov/fulltext/EJ1058505.pdf',
    apa7: 'Grant, C., & Osanloo, A. (2014). Understanding, selecting, and integrating a theoretical framework in dissertation research: Creating the blueprint for your "house." Administrative Issues Journal: Connecting Education, Practice, and Research, 4(2), 12-26. https://files.eric.ed.gov/fulltext/EJ1058505.pdf',
    inText: '(Grant & Osanloo, 2014)',
    notes:
      'Open access. Practical guide to choosing and threading a theoretical framework through every part of a dissertation, using the blueprint-of-a-house metaphor.',
    keyQuotes: [
      'We believe the blueprint is an appropriate analogy of the theoretical framework of the dissertation.',
      'Without a theoretical framework, the structure and vision for a study is unclear, much like a house that cannot be constructed without a blueprint.',
    ],
    keywords: ['Theoretical Framework', 'Dissertation', 'Research Design', 'Doctoral Writing', 'Blueprint Metaphor'],
    coursesUsed: [EDU810],
    papersCitedIn: [],
    institutionOrigin: 'Gwynedd Mercy University',
    aiThematicCategory: 'Research Methodologies & Data',
    sourceTypeClassification: 'Pedagogical Guide',
    aiRelevanceScore: 93,
    aiTaggedKeywords: ['Theoretical Framework Selection', 'Theory Threading', 'Dissertation Blueprint'],
  }),
];

const notes: (Note & EntityBase)[] = [
  kb({
    id: 'note-stt-five-phases',
    courseId: EDU810,
    title: 'Five Phases of Scholar Transformation Theory (Welsh et al., 2020)',
    body: [
      'Summarized from Welsh, Ellington, Shockley, & Prime (2020), ERIC ED614545. The course handout "Characteristics of the Five Phases of Scholar Transformation Theory" is not publicly available; the phases below are taken from the paper itself.',
      '',
      'Phase 1 - Passive Information Gatherer: consumes information without questioning it; work is mainly collecting and pasting what others produced, aimed at satisfying an external requirement.',
      'Phase 2 - Active Information Gatherer: employs active reading strategies and some personal agency, but the main intention is still to satisfy an external objective (e.g., getting the grade or the instructor\'s approval).',
      'Phase 3 - Active Knowledge Gatherer: begins questioning authors\' intentions and assumptions; gathers knowledge critically rather than just collecting information.',
      'Phase 4 - Active Knowledge Consumer: evaluates and uses knowledge with a developing sense of positionality and scholarly judgment.',
      'Phase 5 - Active Knowledge Producer: has developed a scholar identity; "sees himself as a scholar capable of producing his own unique scholarship," engages scholarly conversations as an equal, and creates original research authentic to who they are as a scholar.',
      '',
      'Use: locate which phase a piece of your own writing is in, then revise toward the next phase - e.g., turn summary (Phase 1-2) into critique and positioning (Phase 3-4), then into original contribution (Phase 5).',
    ].join('\n'),
    tags: ['EDU 810', 'Scholar Transformation Theory', 'literature review', 'scholar identity'],
  }),
  kb({
    id: 'note-lit-review-rubric',
    courseId: EDU810,
    title: 'Literature Review Quality Rubric (Boote & Beile, 2005) + Maxwell\'s relevance test',
    body: [
      'Boote & Beile (2005) developed a 12-item Literature Review Scoring Rubric grouped into five categories:',
      '',
      '1. Coverage - justified criteria for inclusion and exclusion from the review.',
      '2. Synthesis - distinguishes what has been done from what needs to be done; places the topic in historical and scholarly context; articulates what is gained from the review.',
      '3. Methodology - critiques the methods of the reviewed studies and identifies strengths and weaknesses.',
      '4. Significance - justifies the study\'s practical and scholarly significance.',
      '5. Rhetoric - the review is written coherently and supports its claims.',
      '',
      'Maxwell (2006) adds the counterweight: "Relevance, rather than thoroughness or comprehensiveness, is the essential characteristic of literature reviews in most scholarly work." A dissertation review is written FOR the study - cover what the research questions require, do not summarize the whole field.',
      '',
      'Practical check before submitting a review: (a) Can I state my inclusion/exclusion criteria? (b) Does every section earn its place against my research questions (Maxwell)? (c) Do I critique methods, not just findings? (d) Do I state what is still unknown - the gap my study fills? (e) Does my theoretical framework act as the "blueprint" threading the whole dissertation (Grant & Osanloo, 2014)?',
    ].join('\n'),
    tags: ['EDU 810', 'literature review', 'rubric', 'theoretical framework', 'writing checklist'],
  }),
];

/**
 * Build the literature knowledge-base seed. All records are real (isDemo: false),
 * so they survive "Remove demo data". Apply once, guarded by a settings marker.
 */
export function buildLiteratureKnowledgeSeed(): Seed {
  return {
    institutions: institutions as EntityBase[],
    courses: courses as EntityBase[],
    readings: readings as unknown as EntityBase[],
    citations: citations as unknown as EntityBase[],
    notes: notes as EntityBase[],
  };
}

/** Stable IDs so the store can guard one-time application. */
export const KB_LITERATURE_SEED_IDS = {
  institutions: institutions.map((e) => e.id),
  courses: courses.map((e) => e.id),
  readings: readings.map((e) => e.id),
  citations: citations.map((e) => e.id),
  notes: notes.map((e) => e.id),
} as const;

/** Collection type re-export for callers iterating the seed. */
export type { Collection };
