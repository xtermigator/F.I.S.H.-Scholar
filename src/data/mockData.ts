import {
  Institution,
  Course,
  Assignment,
  Citation,
  DocumentRecord,
  AcademicMemoryNode,
  AuthorshipDossier,
  StudentProfile,
} from '../types';

export const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-msu',
    name: 'Mississippi State University',
    shortName: 'MSU',
    badgeColor: 'bg-red-950 text-red-200 border-red-800/60',
    accentColor: '#660000',
    logo: '🏛️',
    currentSemester: 'Spring 2026',
    location: 'Starkville, MS',
    canvasUrl: 'https://msstate.instructure.com',
    portalUrl: 'https://my.msstate.edu'
  },
  {
    id: 'inst-cuny',
    name: 'CUNY School of Professional Studies',
    shortName: 'CUNY SPS',
    badgeColor: 'bg-blue-950 text-blue-200 border-blue-800/60',
    accentColor: '#1d4ed8',
    logo: '🎓',
    currentSemester: 'Spring 2026',
    location: 'New York, NY',
    canvasUrl: 'https://cuny-sps.brightspace.com',
    portalUrl: 'https://home.cunyfirst.cuny.edu'
  },
  {
    id: 'inst-uf',
    name: 'University of Florida',
    shortName: 'UF',
    badgeColor: 'bg-amber-950 text-amber-200 border-amber-800/60',
    accentColor: '#ea580c',
    logo: '🐊',
    currentSemester: 'Spring 2026',
    location: 'Gainesville, FL',
    canvasUrl: 'https://ufl.instructure.com',
    portalUrl: 'https://one.uf.edu'
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-msu-ed9413',
    institutionId: 'inst-msu',
    code: 'ED 9413',
    title: 'Curriculum Leadership & Universal Design',
    department: 'Department of Educational Leadership',
    credits: 3,
    semester: 'Spring 2026',
    color: 'border-l-red-600',
    professor: {
      name: 'Dr. Catherine Bennett',
      email: 'c.bennett@msstate.edu',
      officeHours: 'Tuesdays 2:00 PM – 4:00 PM CST via Zoom',
      zoomLink: 'https://msstate.zoom.us/j/941388201',
      preferredCommunication: 'Canvas Inbox or Email (responds within 24h)',
      toneNotes: 'Values empirical evidence, clear thesis statements, and proactive student communication.'
    },
    policies: {
      lateWork: '10% deduction per 24 hours. Extensions readily granted with 24-hour advance notice under SAS accommodations.',
      attendance: 'Weekly synchronous seminar participation or asynchronous synthesis post.',
      aiPolicy: 'Generative AI may be utilized for idea generation and structural outlines with documented attribution in the Authorship Record.',
      accommodations: 'Accommodations honored through Student Support Services including 1.5x time and flexible deadlines.'
    },
    gradingScale: [
      { id: 'g1', item: 'Weekly Discussion & Peer Responses', percentage: 25 },
      { id: 'g2', item: 'Curriculum Redesign Project', percentage: 35 },
      { id: 'g3', item: 'Midterm Research Synthesis', percentage: 20 },
      { id: 'g4', item: 'Applied Universal Design Portfolio', percentage: 20 }
    ],
    accommodationsNotes: 'Documented flexible submission window for major milestone writing projects.'
  },
  {
    id: 'course-cuny-dsab629',
    institutionId: 'inst-cuny',
    code: 'DSAB 629',
    title: 'Disability Studies & Higher Education Advocacy',
    department: 'Disability Studies Graduate Program',
    credits: 3,
    semester: 'Spring 2026',
    color: 'border-l-blue-600',
    professor: {
      name: 'Dr. Marcus Vance',
      email: 'marcus.vance@sps.cuny.edu',
      officeHours: 'Wednesdays 6:00 PM – 7:30 PM EST',
      zoomLink: 'https://cuny.zoom.us/my/drmarcusvance',
      preferredCommunication: 'Blackboard Messages or Email',
      toneNotes: 'Deeply supportive of lived-experience scholarship and critical disability theory.'
    },
    policies: {
      lateWork: 'No late penalty when negotiated before deadline. Emphasizes Universal Design principles.',
      attendance: 'Flexible asynchronous forum engagement with active weekly dialogue.',
      aiPolicy: 'Critical engagement with AI bias is encouraged. Disclose AI assistance and preserve authentic student voice.',
      accommodations: 'CUNY SPS Office of Student Accessibility fully integrated. Flexible pacing supported.'
    },
    gradingScale: [
      { id: 'g5', item: 'Bi-weekly Seminar Discussions', percentage: 30 },
      { id: 'g6', item: 'Policy Critique Essay', percentage: 30 },
      { id: 'g7', item: 'Capstone Accessibility Blueprint', percentage: 40 }
    ],
    accommodationsNotes: 'Extended response windows and multimodal submission options active.'
  },
  {
    id: 'course-uf-fyc',
    institutionId: 'inst-uf',
    code: 'FYC 6933',
    title: 'Family, Youth & Community Transition Systems',
    department: 'Department of Family, Youth and Community Sciences',
    credits: 3,
    semester: 'Spring 2026',
    color: 'border-l-amber-600',
    professor: {
      name: 'Dr. Elena Alvarez',
      email: 'e.alvarez@ufl.edu',
      officeHours: 'Thursdays 10:00 AM – 12:00 PM EST (McCarty Hall B / Zoom)',
      zoomLink: 'https://ufl.zoom.us/j/883192019',
      preferredCommunication: 'UFL Email with [FYC 6933] in subject line',
      toneNotes: 'Encourages cross-institutional collaboration and pragmatic community frameworks.'
    },
    policies: {
      lateWork: 'Standard 5% daily deduction without documented DRC approval.',
      attendance: 'Hybrid attendance; async reflection logs accepted for missed sessions.',
      aiPolicy: 'Use of AI for reference formatting and readability checks permitted. Core intellectual argumentation must be student-authored.',
      accommodations: 'UF Disability Resource Center (DRC) accommodation letter on file.'
    },
    gradingScale: [
      { id: 'g8', item: 'Community Needs Assessment', percentage: 35 },
      { id: 'g9', item: 'Field Observations & Interviews', percentage: 25 },
      { id: 'g10', item: 'Policy Recommendation Brief', percentage: 40 }
    ]
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-msu-peer',
    courseId: 'course-msu-ed9413',
    title: 'Module 3 Peer Response: Universal Design in Curriculum',
    dueDate: 'Tonight',
    dueTime: '11:59 PM CST',
    urgency: 'urgent_tonight',
    points: 25,
    weight: '5% of final grade',
    estimatedMinutes: 20,
    prompt: 'Provide substantive peer feedback to at least two classmates on their curriculum accommodation proposals. Integrate at least one peer-reviewed citation (e.g., Burgstahler or CAST) contrasting reactive accommodations with proactive Universal Design for Learning (UDL). Minimum 250 words per response.',
    rubric: 'Criteria:\n1. Scholarly integration of UDL principles (10 pts)\n2. Actionable, constructive peer critique (10 pts)\n3. APA 7 citation format & academic voice (5 pts)',
    requiredReadings: [
      'Burgstahler, S. (2015). Universal Design in Higher Education: From Principles to Practice.',
      'CAST (2018). Universal Design for Learning Guidelines version 2.2.'
    ],
    checklist: [
      { id: 'chk-1', text: 'Read classmate Sarah Miller’s post on graduate STEM lab accommodations', completed: true, estimatedMinutes: 5 },
      { id: 'chk-2', text: 'Draft 250-word response connecting Burgstahler UDL framework', completed: false, estimatedMinutes: 10 },
      { id: 'chk-3', text: 'Insert APA in-text citation (Burgstahler, 2015)', completed: false, estimatedMinutes: 2 },
      { id: 'chk-4', text: 'Post to MSU Canvas discussion board', completed: false, estimatedMinutes: 3 }
    ],
    drafts: [
      {
        id: 'draft-1',
        versionName: 'Working Draft (Response to Sarah M.)',
        timestamp: '2026-08-31 14:15',
        wordCount: 195,
        content: `Sarah, your analysis of lab accessibility highlights an essential distinction. When accommodations are implemented solely post-registration, the administrative burden falls entirely onto the disabled student. As Burgstahler (2015) notes, Universal Design shifts this paradigm from retroactive fixes to proactive structural planning. In your proposal for tactile lab equipment, integrating pre-recorded visual guides alongside multi-sensory measuring tools would ensure that all students—regardless of disclosure status—benefit immediately.`
      }
    ],
    notes: 'Remember to mention that CUNY SPS has an open-access lab model we discussed in DSAB 629 last semester.',
    sourcesCited: ['cit-burgstahler', 'cit-cast'],
    currentPhase: 'draft'
  },
  {
    id: 'asg-cuny-disc',
    courseId: 'course-cuny-dsab629',
    title: 'Discussion 4: Student Voice in Accommodation Policies',
    dueDate: 'Thursday, Sep 3',
    dueTime: '11:59 PM EST',
    urgency: 'due_soon',
    points: 40,
    weight: '10% of final grade',
    estimatedMinutes: 45,
    prompt: 'Examine how the "medical model" of disability continues to influence university accommodation pipelines. Drawing on Wong (2020) and Evans et al. (2017), analyze how institutional gatekeeping silences student self-advocacy. How can university accessibility offices shift toward student-led access protocols?',
    rubric: 'Criteria:\n1. Theoretical critique of medical model vs social model (15 pts)\n2. Direct citation of Wong (2020) and Evans et al. (2017) (15 pts)\n3. Coherent proposed policy shifts (10 pts)',
    requiredReadings: [
      'Wong, A. (2020). Disability Visibility: First-Person Stories.',
      'Evans, N. J., et al. (2017). Disability in Higher Education: A Social Justice Perspective.'
    ],
    checklist: [
      { id: 'chk-5', text: 'Re-read Chapter 3 of Evans et al. on institutional barriers', completed: true, estimatedMinutes: 15 },
      { id: 'chk-6', text: 'Synthesize quote from Alice Wong regarding non-compliance resistance', completed: true, estimatedMinutes: 10 },
      { id: 'chk-7', text: 'Write 400-word initial discussion post', completed: false, estimatedMinutes: 20 }
    ],
    drafts: [
      {
        id: 'draft-cuny-1',
        versionName: 'Initial Outline & Key Quotations',
        timestamp: '2026-08-30 19:40',
        wordCount: 142,
        content: `Thesis: The traditional higher education accommodation workflow forces disabled students to authenticate their impairment through medicalized surveillance before granting basic instructional access (Evans et al., 2017). Drawing on Wong (2020), true access requires institutions to honor lived expertise rather than prioritizing liability avoidance.`
      }
    ],
    notes: 'Can also connect this with my UF FYC transition barrier notes regarding high school to college drop-offs.',
    sourcesCited: ['cit-wong', 'cit-evans'],
    currentPhase: 'outline'
  },
  {
    id: 'asg-uf-fyc',
    courseId: 'course-uf-fyc',
    title: 'Community Accessibility Assessment Draft',
    dueDate: 'Next Friday, Sep 11',
    dueTime: '5:00 PM EST',
    urgency: 'on_track',
    points: 100,
    weight: '25% of final grade',
    estimatedMinutes: 180,
    prompt: 'Develop a 6-to-8 page preliminary assessment plan evaluating community college transition pipelines for youth with neurodevelopmental disabilities in Alachua County. Include methodology, literature review (min 6 sources), and stakeholder interview protocols.',
    rubric: 'Criteria:\n1. Literature Review & Theoretical Framework (30 pts)\n2. Community Assessment Methodology (30 pts)\n3. Stakeholder Survey/Interview Instruments (25 pts)\n4. APA 7 Format & Authorship Dossier (15 pts)',
    requiredReadings: [
      'Dolmage, J. T. (2017). Academic Ableism: Disability and Higher Education.',
      'Burgstahler, S. (2015). Universal Design in Higher Education.'
    ],
    checklist: [
      { id: 'chk-8', text: 'Select 6 peer-reviewed citations from Master Citation Vault', completed: true, estimatedMinutes: 15 },
      { id: 'chk-9', text: 'Synthesize CUNY DSAB 629 insights into lit review', completed: false, estimatedMinutes: 45 },
      { id: 'chk-10', text: 'Draft Methodology & Alachua County demographics section', completed: false, estimatedMinutes: 60 },
      { id: 'chk-11', text: 'Run APA 7 and Authorship Verification Dossier', completed: false, estimatedMinutes: 20 }
    ],
    drafts: [],
    notes: 'Huge opportunity for cross-school synergy: borrow theoretical foundation from CUNY SPS and applied leadership metrics from Mississippi State.',
    sourcesCited: ['cit-dolmage', 'cit-burgstahler', 'cit-evans'],
    currentPhase: 'deconstruct'
  }
];

export const INITIAL_CITATIONS: Citation[] = [
  {
    id: 'cit-burgstahler',
    authors: 'Burgstahler, S.',
    year: '2015',
    title: 'Universal design in higher education: From principles to practice (2nd ed.)',
    source: 'Harvard Education Press',
    doiOrUrl: 'https://www.hepg.org/hep-home/books/universal-design-in-higher-education-(1)',
    apa7: 'Burgstahler, S. (2015). Universal design in higher education: From principles to practice (2nd ed.). Harvard Education Press.',
    inText: '(Burgstahler, 2015)',
    notes: 'Foundational text on shifting accommodations from retroactive triage to proactive curriculum architecture.',
    keyQuotes: [
      'Universal design does not lower academic standards; rather, it provides multiple pathways for students to demonstrate competence (p. 34).',
      'Retrofitting accommodations is both more costly and pedagogically inferior to inclusive initial design (p. 78).'
    ],
    keywords: ['Universal Design', 'Curriculum', 'Higher Education', 'Instructional Access', 'Pedagogy', 'Proactive UDL Architecture'],
    coursesUsed: ['course-msu-ed9413', 'course-cuny-dsab629', 'course-uf-fyc'],
    papersCitedIn: ['asg-msu-peer', 'asg-uf-fyc'],
    institutionOrigin: 'Mississippi State & CUNY SPS',
    aiThematicCategory: 'Universal Design & Inclusive Pedagogy',
    sourceTypeClassification: 'Pedagogical Guide',
    aiRelevanceScore: 98,
    aiTaggedKeywords: ['Proactive UDL Architecture', 'Instructional Scaffolding', 'Cognitive Access Pathways', 'Curriculum Equity'],
    lastCategorizedAt: '2026-08-31T20:00:00.000Z',
    courseAlignments: [
      {
        courseId: 'course-msu-ed9413',
        courseCode: 'ED 9413',
        courseTitle: 'Curriculum Leadership & Universal Design',
        institutionName: 'Mississippi State University',
        relevanceScore: 98,
        alignmentRationale: 'Core theoretical foundation directly supporting the Module 3 Peer Response and the 35% Curriculum Redesign Project.',
        primaryAssignmentMatch: 'Module 3 Peer Response & Curriculum Redesign Project',
        suggestedUse: 'Primary architectural framework contrasting reactive accommodations with proactive design'
      },
      {
        courseId: 'course-cuny-dsab629',
        courseCode: 'DSAB 629',
        courseTitle: 'Disability Studies & Higher Education Advocacy',
        institutionName: 'CUNY SPS',
        relevanceScore: 91,
        alignmentRationale: 'Provides the practical implementation model needed for the Capstone Accessibility Blueprint.',
        primaryAssignmentMatch: 'Capstone Accessibility Blueprint',
        suggestedUse: 'Operational blueprint for campus-wide accessibility systems'
      },
      {
        courseId: 'course-uf-fyc',
        courseCode: 'FYC 6933',
        courseTitle: 'Family, Youth & Community Transition Systems',
        institutionName: 'University of Florida',
        relevanceScore: 86,
        alignmentRationale: 'Establishes the educational transition standards required in the Alachua County Community Assessment.',
        primaryAssignmentMatch: 'Community Accessibility Assessment Draft',
        suggestedUse: 'Postsecondary transition accessibility benchmarks'
      }
    ]
  },
  {
    id: 'cit-evans',
    authors: 'Evans, N. J., Broido, E. M., Brown, K. R., & Wilke, A. K.',
    year: '2017',
    title: 'Disability in higher education: A social justice perspective',
    source: 'Jossey-Bass / Wiley',
    doiOrUrl: 'https://doi.org/10.1002/9781118015490',
    apa7: 'Evans, N. J., Broido, E. M., Brown, K. R., & Wilke, A. K. (2017). Disability in higher education: A social justice perspective. Jossey-Bass.',
    inText: '(Evans et al., 2017)',
    notes: 'Examines systemic barriers, accommodation policies, and campus climate through a critical social justice lens.',
    keyQuotes: [
      'Accommodation compliance models often protect the institution from legal liability rather than centering student educational access (p. 112).',
      'The administrative burden of proving disability status each semester constitutes a distinct barrier to retention (p. 154).'
    ],
    keywords: ['Social Justice', 'Disability Services', 'Higher Education', 'Retention', 'Policy', 'Institutional Gatekeeping'],
    coursesUsed: ['course-cuny-dsab629', 'course-uf-fyc'],
    papersCitedIn: ['asg-cuny-disc', 'asg-uf-fyc'],
    institutionOrigin: 'CUNY SPS',
    aiThematicCategory: 'Critical Disability Studies & Social Justice',
    sourceTypeClassification: 'Theoretical Framework',
    aiRelevanceScore: 97,
    aiTaggedKeywords: ['Institutional Gatekeeping', 'Administrative Burden', 'Liability Compliance vs Justice', 'Student Retention'],
    lastCategorizedAt: '2026-08-31T20:00:00.000Z',
    courseAlignments: [
      {
        courseId: 'course-cuny-dsab629',
        courseCode: 'DSAB 629',
        courseTitle: 'Disability Studies & Higher Education Advocacy',
        institutionName: 'CUNY SPS',
        relevanceScore: 97,
        alignmentRationale: 'Essential required reading for Discussion 4 examining medicalized gatekeeping and student self-advocacy.',
        primaryAssignmentMatch: 'Discussion 4: Student Voice in Accommodation Policies',
        suggestedUse: 'Theoretical critique of medical compliance models'
      },
      {
        courseId: 'course-uf-fyc',
        courseCode: 'FYC 6933',
        courseTitle: 'Family, Youth & Community Transition Systems',
        institutionName: 'University of Florida',
        relevanceScore: 89,
        alignmentRationale: 'Explains why neurodivergent youth experience retention drop-offs during high school to college transitions.',
        primaryAssignmentMatch: 'Community Accessibility Assessment Draft',
        suggestedUse: 'Literature review on systemic postsecondary retention barriers'
      },
      {
        courseId: 'course-msu-ed9413',
        courseCode: 'ED 9413',
        courseTitle: 'Curriculum Leadership & Universal Design',
        institutionName: 'Mississippi State University',
        relevanceScore: 83,
        alignmentRationale: 'Provides the critical policy critique required to justify leadership investment in UDL.',
        primaryAssignmentMatch: 'Curriculum Redesign Project',
        suggestedUse: 'Contextual policy rationale'
      }
    ]
  },
  {
    id: 'cit-wong',
    authors: 'Wong, A.',
    year: '2020',
    title: 'Disability visibility: First-person stories from the twenty-first century',
    source: 'Vintage Books / Random House',
    doiOrUrl: 'https://disabilityvisibilityproject.com/book/',
    apa7: 'Wong, A. (Ed.). (2020). Disability visibility: First-person stories from the twenty-first century. Vintage Books.',
    inText: '(Wong, 2020)',
    notes: 'Anthology of lived experiences emphasizing agency, culture, and resistance against ableist structures.',
    keyQuotes: [
      'Access is love. Not an afterthought, not an accommodation granted out of pity (p. 21).',
      'Disabled people have always been the pioneers of creative navigation in hostile institutional architectures (p. xiv).'
    ],
    keywords: ['Disability Identity', 'Student Voice', 'First-Person Narrative', 'Culture', 'Lived Experience'],
    coursesUsed: ['course-cuny-dsab629'],
    papersCitedIn: ['asg-cuny-disc'],
    institutionOrigin: 'CUNY SPS',
    aiThematicCategory: 'Critical Disability Studies & Social Justice',
    sourceTypeClassification: 'First-Person Narrative',
    aiRelevanceScore: 95,
    aiTaggedKeywords: ['Lived Experience Epistemology', 'First-Person Resistance', 'Cultural Visibility', 'Student Self-Advocacy'],
    lastCategorizedAt: '2026-08-31T20:00:00.000Z',
    courseAlignments: [
      {
        courseId: 'course-cuny-dsab629',
        courseCode: 'DSAB 629',
        courseTitle: 'Disability Studies & Higher Education Advocacy',
        institutionName: 'CUNY SPS',
        relevanceScore: 95,
        alignmentRationale: 'Required anchor for Discussion 4 to substantiate lived-experience critique against university gatekeeping.',
        primaryAssignmentMatch: 'Discussion 4: Student Voice in Accommodation Policies',
        suggestedUse: 'First-person testimony and theoretical critique'
      },
      {
        courseId: 'course-uf-fyc',
        courseCode: 'FYC 6933',
        courseTitle: 'Family, Youth & Community Transition Systems',
        institutionName: 'University of Florida',
        relevanceScore: 78,
        alignmentRationale: 'Provides authentic youth perspectives on community support navigation.',
        primaryAssignmentMatch: 'Policy Recommendation Brief',
        suggestedUse: 'Qualitative experiential evidence'
      },
      {
        courseId: 'course-msu-ed9413',
        courseCode: 'ED 9413',
        courseTitle: 'Curriculum Leadership & Universal Design',
        institutionName: 'Mississippi State University',
        relevanceScore: 72,
        alignmentRationale: 'Illustrates user friction when instructional accommodations are treated as charity.',
        primaryAssignmentMatch: 'Applied Universal Design Portfolio',
        suggestedUse: 'Student-centered case study evidence'
      }
    ]
  },
  {
    id: 'cit-cast',
    authors: 'CAST',
    year: '2018',
    title: 'Universal design for learning guidelines version 2.2',
    source: 'CAST, Inc.',
    doiOrUrl: 'http://udlguidelines.cast.org',
    apa7: 'CAST. (2018). Universal design for learning guidelines version 2.2. http://udlguidelines.cast.org',
    inText: '(CAST, 2018)',
    notes: 'The three UDL pillars: multiple means of Engagement, Representation, and Action/Expression.',
    keyQuotes: [
      'Provide multiple means of engagement (the why of learning), representation (the what of learning), and action & expression (the how of learning).'
    ],
    keywords: ['UDL', 'Instructional Design', 'Multi-modal', 'Learning Sciences', 'Engagement Scaffolds'],
    coursesUsed: ['course-msu-ed9413'],
    papersCitedIn: ['asg-msu-peer'],
    institutionOrigin: 'Mississippi State University',
    aiThematicCategory: 'Universal Design & Inclusive Pedagogy',
    sourceTypeClassification: 'Pedagogical Guide',
    aiRelevanceScore: 99,
    aiTaggedKeywords: ['Tripartite UDL Matrix', 'Multiple Means of Representation', 'Executive Function Scaffolding', 'Multimodal Assessment'],
    lastCategorizedAt: '2026-08-31T20:00:00.000Z',
    courseAlignments: [
      {
        courseId: 'course-msu-ed9413',
        courseCode: 'ED 9413',
        courseTitle: 'Curriculum Leadership & Universal Design',
        institutionName: 'Mississippi State University',
        relevanceScore: 99,
        alignmentRationale: 'Definitive framework specified in MSU ED 9413 syllabus; mandatory for Module 3 Peer Response and Capstone Portfolio.',
        primaryAssignmentMatch: 'Module 3 Peer Response: Universal Design in Curriculum',
        suggestedUse: 'Foundational rubric metric for curriculum evaluation'
      },
      {
        courseId: 'course-cuny-dsab629',
        courseCode: 'DSAB 629',
        courseTitle: 'Disability Studies & Higher Education Advocacy',
        institutionName: 'CUNY SPS',
        relevanceScore: 84,
        alignmentRationale: 'Offers an evidence-based structural taxonomy for the Capstone Accessibility Blueprint.',
        primaryAssignmentMatch: 'Capstone Accessibility Blueprint',
        suggestedUse: 'Curricular taxonomy standard'
      },
      {
        courseId: 'course-uf-fyc',
        courseCode: 'FYC 6933',
        courseTitle: 'Family, Youth & Community Transition Systems',
        institutionName: 'University of Florida',
        relevanceScore: 80,
        alignmentRationale: 'Applies UDL to community college orientation and youth workplace training programs.',
        primaryAssignmentMatch: 'Community Accessibility Assessment Draft',
        suggestedUse: 'Community program design standard'
      }
    ]
  },
  {
    id: 'cit-dolmage',
    authors: 'Dolmage, J. T.',
    year: '2017',
    title: 'Academic ableism: Disability and higher education',
    source: 'University of Michigan Press',
    doiOrUrl: 'https://doi.org/10.3998/mpub.9708722',
    apa7: 'Dolmage, J. T. (2017). Academic ableism: Disability and higher education. University of Michigan Press.',
    inText: '(Dolmage, 2017)',
    notes: 'Critiques the historical architecture of higher education as an exclusionary steep staircase and argues for universal design.',
    keyQuotes: [
      'Higher education has historically conceptualized disability as the antithesis of academic rigor (p. 42).',
      'The retrofit is an apology, an afterthought, a bandage over an exclusionary design (p. 71).'
    ],
    keywords: ['Academic Ableism', 'Critical Theory', 'Institutional Architecture', 'Pedagogy', 'Retrofit Critique'],
    coursesUsed: ['course-cuny-dsab629', 'course-uf-fyc'],
    papersCitedIn: ['asg-uf-fyc'],
    institutionOrigin: 'CUNY SPS & UF',
    aiThematicCategory: 'Critical Disability Studies & Social Justice',
    sourceTypeClassification: 'Theoretical Framework',
    aiRelevanceScore: 96,
    aiTaggedKeywords: ['Steep Staircase Metaphor', 'Retrofit Critique', 'Rigor vs Access', 'Institutional Hegemony'],
    lastCategorizedAt: '2026-08-31T20:00:00.000Z',
    courseAlignments: [
      {
        courseId: 'course-cuny-dsab629',
        courseCode: 'DSAB 629',
        courseTitle: 'Disability Studies & Higher Education Advocacy',
        institutionName: 'CUNY SPS',
        relevanceScore: 96,
        alignmentRationale: 'High-impact theoretical critique of the "retrofit" paradigm for CUNY policy critique and seminar discussions.',
        primaryAssignmentMatch: 'Policy Critique Essay',
        suggestedUse: 'Central theoretical critique of retrofit accommodations'
      },
      {
        courseId: 'course-uf-fyc',
        courseCode: 'FYC 6933',
        courseTitle: 'Family, Youth & Community Transition Systems',
        institutionName: 'University of Florida',
        relevanceScore: 92,
        alignmentRationale: 'Directly cited in UF FYC 6933 literature review on physical and digital transition barriers in Alachua County.',
        primaryAssignmentMatch: 'Community Accessibility Assessment Draft',
        suggestedUse: 'Literature review on institutional exclusionary architecture'
      },
      {
        courseId: 'course-msu-ed9413',
        courseCode: 'ED 9413',
        courseTitle: 'Curriculum Leadership & Universal Design',
        institutionName: 'Mississippi State University',
        relevanceScore: 90,
        alignmentRationale: 'Provides the philosophical argument for why educational leaders must move beyond reactive compliance.',
        primaryAssignmentMatch: 'Curriculum Redesign Project',
        suggestedUse: 'Ethical leadership rationale'
      }
    ]
  }
];

export const INITIAL_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc-1',
    name: 'MSU_ED9413_Syllabus_Spring2026.pdf',
    courseId: 'course-msu-ed9413',
    docType: 'Syllabus',
    uploadedAt: '2026-01-12',
    size: '1.4 MB',
    summary: 'Comprehensive curriculum leadership syllabus detailing weekly modules, UDL projects, grading breakdown, and SAS policies.',
    extractedCitations: ['cit-burgstahler', 'cit-cast'],
    tags: ['Syllabus', 'Universal Design', 'MSU', 'Curriculum'],
    contentPreview: 'Mississippi State University - Department of Educational Leadership. ED 9413: Curriculum Leadership & Universal Design. Instructor: Dr. Catherine Bennett.'
  },
  {
    id: 'doc-2',
    name: 'CUNY_DSAB629_Week4_Discussion_Prompt.pdf',
    courseId: 'course-cuny-dsab629',
    docType: 'Assignment Prompt',
    uploadedAt: '2026-08-28',
    size: '420 KB',
    summary: 'Prompt for Discussion 4 centering the medical model vs social model of disability in university accommodation pipelines.',
    extractedCitations: ['cit-wong', 'cit-evans'],
    tags: ['Prompt', 'Disability Studies', 'CUNY', 'Accommodations'],
    contentPreview: 'Prompt: Analyze how institutional gatekeeping silences student self-advocacy using Wong (2020) and Evans et al. (2017).'
  },
  {
    id: 'doc-3',
    name: 'UF_FYC_Transition_Barriers_FieldNotes.docx',
    courseId: 'course-uf-fyc',
    docType: 'Student Draft',
    uploadedAt: '2026-08-25',
    size: '890 KB',
    summary: 'Observational data and interview synthesis regarding high school to community college transition gaps for neurodivergent youth.',
    extractedCitations: ['cit-dolmage'],
    tags: ['Field Notes', 'Transition', 'UF', 'Research Data'],
    contentPreview: 'Interview Note: 68% of surveyed students did not register with disability services during their first semester due to complex documentation rules.'
  }
];

export const INITIAL_ACADEMIC_MEMORY: AcademicMemoryNode[] = [
  {
    id: 'mem-1',
    concept: 'Universal Design vs Retrofitted Accommodations',
    originInstitution: 'Mississippi State & CUNY SPS',
    originCourseCode: 'ED 9413 & DSAB 629',
    relevanceTags: ['Universal Design', 'Accommodations', 'Higher Ed Policy', 'Instructional Architecture'],
    coreInsight: 'Accommodations are individual exceptions negotiated post-facto with high friction; Universal Design builds accessible pathways into the baseline curriculum so disclosure is not a barrier.',
    quotations: [
      'Retrofitting accommodations is both more costly and pedagogically inferior to inclusive initial design (Burgstahler, 2015, p. 78).',
      'The retrofit is an apology, an afterthought, a bandage over an exclusionary design (Dolmage, 2017, p. 71).'
    ],
    relatedCitationIds: ['cit-burgstahler', 'cit-cast', 'cit-dolmage'],
    priorDraftSnippets: [
      'In our CUNY DSAB 629 analysis, we demonstrated that when syllabi provide multimodal submission options by default, SAS accommodation requests drop by 40% while student completion rates rise.'
    ],
    crossSchoolApplications: [
      {
        targetCourseCode: 'ED 9413 (MSU)',
        suggestion: 'Use the DSAB 629 policy analysis to substantiate your critique of rigid test-center policies in Module 3.'
      },
      {
        targetCourseCode: 'FYC 6933 (UF)',
        suggestion: 'Frame the youth transition assessment through Burgstahler UDL framework rather than standard ADA compliance.'
      }
    ]
  },
  {
    id: 'mem-2',
    concept: 'Student Self-Advocacy & Administrative Burden',
    originInstitution: 'CUNY SPS',
    originCourseCode: 'DSAB 629',
    relevanceTags: ['Student Voice', 'Bureaucracy', 'Agency', 'Disability Identity'],
    coreInsight: 'The psychological and time cost of repeatedly justifying accommodation needs to multiple professors creates an exhaustion barrier that negatively impacts GPA and retention.',
    quotations: [
      'The administrative burden of proving disability status each semester constitutes a distinct barrier to retention (Evans et al., 2017, p. 154).',
      'Access is love. Not an afterthought, not an accommodation granted out of pity (Wong, 2020, p. 21).'
    ],
    relatedCitationIds: ['cit-evans', 'cit-wong'],
    priorDraftSnippets: [
      'Student interviews at CUNY revealed an average of 14 separate email exchanges required to activate basic extended time permissions.'
    ],
    crossSchoolApplications: [
      {
        targetCourseCode: 'FYC 6933 (UF)',
        suggestion: 'Directly cite this administrative fatigue metric in your Alachua County community college assessment.'
      }
    ]
  }
];

export const INITIAL_AUTHORSHIP_DOSSIER: AuthorshipDossier = {
  id: 'auth-101',
  assignmentId: 'asg-msu-peer',
  title: 'Authorship Provenance Dossier: ED 9413 Module 3 Peer Response',
  studentName: 'Eric Fishon',
  courseCode: 'ED 9413',
  institutionName: 'Mississippi State University',
  createdAt: '2026-08-31 14:00',
  verifiedAt: '2026-08-31 15:10',
  draftsHistory: [
    {
      stage: 'Initial Outline & Key Idea Brainstorming',
      wordCount: 85,
      timestamp: '2026-08-31 14:05',
      summaryOfEdits: 'Outlined critique of reactive accommodations and mapped to Burgstahler (2015).'
    },
    {
      stage: 'Draft 1: Authentic Voice Synthesis',
      wordCount: 195,
      timestamp: '2026-08-31 14:30',
      summaryOfEdits: 'Composed core response with authentic voice, grounding the argument in multi-sensory lab design.'
    },
    {
      stage: 'Final Scholarly Polish & Citation Verification',
      wordCount: 220,
      timestamp: '2026-08-31 15:05',
      summaryOfEdits: 'Verified APA 7 citation format, eliminated passive phrasing, confirmed rubric compliance.'
    }
  ],
  authenticVoiceScore: 94,
  aiDetectorReports: [
    {
      tool: 'GPTZero',
      reportedHumanLikelihood: 96,
      reportedAiLikelihood: 4,
      notes: 'High burstiness, natural academic vocabulary variance, distinct student perspective.'
    },
    {
      tool: 'ZeroGPT',
      reportedHumanLikelihood: 98,
      reportedAiLikelihood: 2,
      notes: 'No repetitive formulaic AI transition syntax detected.'
    }
  ],
  sourcesVerifiedCount: 2,
  dossierSummary: 'This document certifies that the attached assignment was authentically authored through a transparent 3-stage intellectual progression. The argument directly builds upon the student’s prior research at CUNY and Mississippi State, with full source provenance.'
};

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
  name: 'Eric Fishon',
  email: 'ericfishon@gmail.com',
  title: 'Graduate Scholar & Educational Accessibility Researcher',
  focusPreference: '20m Focused Sprint + 5m Gentle Transition',
  accessAccommodations: [
    {
      id: 'acc-1',
      institutionId: 'inst-msu',
      title: '1.5x Time & Flexible Submission Window',
      details: 'Approved for up to 48 hours flexible milestone buffer upon prior email notification with instructor.',
      code: 'SAS-FLX-2026'
    },
    {
      id: 'acc-2',
      institutionId: 'inst-cuny',
      title: 'Multimodal Submission & Distraction-Reduced Testing',
      details: 'Permission to submit written seminar artifacts with audio/visual synthesis accompaniments.',
      code: 'OSA-MM-881'
    },
    {
      id: 'acc-3',
      institutionId: 'inst-uf',
      title: 'Priority Registration & Ergonomic Assistive Tech',
      details: 'Electronic text format and speech-to-text transcription permissions for all course syllabi.',
      code: 'DRC-AT-404'
    }
  ],
  authenticVoiceBaseline: 'I examine how institutional accommodation protocols function in practice. In my analysis of student records, documentation barriers consistently create unnecessary delays and cognitive fatigue. Rather than treating access as an individual favor, higher education must embed universal design directly into course architectures from day one.',
  byoAiProvider: 'gemini'
};
