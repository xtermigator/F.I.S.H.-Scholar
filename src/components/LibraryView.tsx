import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Sparkles,
  Layers,
  Copy,
  Check,
  Plus,
  Quote,
  ExternalLink,
  Tag,
  ArrowRight,
  Filter,
  GraduationCap,
  UploadCloud,
  RefreshCw,
  SlidersHorizontal,
  FolderOpen,
  Award,
  BookMarked,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Grid,
  TableProperties,
  Info,
  X
} from 'lucide-react';
import { Citation, AcademicMemoryNode, Course, Institution, CourseAlignment } from '../types';
import { PdfCitationExtractor } from './PdfCitationExtractor';

interface LibraryViewProps {
  citations: Citation[];
  academicMemory: AcademicMemoryNode[];
  courses: Course[];
  institutions: Institution[];
  onAddCitation: (citation: Citation) => void;
  onUpdateCitations?: (updatedCitations: Citation[]) => void;
  onOpenWritingStudioWithCitation?: (citationId: string) => void;
}

export const THEMATIC_CATEGORIES = [
  'Universal Design & Inclusive Pedagogy',
  'Critical Disability Studies & Social Justice',
  'Transition Pipelines & Community Support',
  'Neurodiversity & Executive Function',
  'Institutional Policy & Compliance',
  'Research Methodologies & Data'
];

export const SOURCE_TYPES = [
  'Empirical Study',
  'Theoretical Framework',
  'Pedagogical Guide',
  'First-Person Narrative',
  'Policy & Legal Analysis',
  'Systematic Review'
];

export const LibraryView: React.FC<LibraryViewProps> = ({
  citations,
  academicMemory,
  courses,
  institutions,
  onAddCitation,
  onUpdateCitations
}) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'matrix' | 'pdf_extract' | 'cross_query' | 'memory'>('vault');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string | null>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'authors' | 'title'>('relevance');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Expandable alignments per card
  const [expandedAlignments, setExpandedAlignments] = useState<Record<string, boolean>>({});

  // AI Batch Categorization State
  const [isCategorizingBatch, setIsCategorizingBatch] = useState(false);
  const [categorizingSingleId, setCategorizingSingleId] = useState<string | null>(null);
  const [categorizationNotification, setCategorizationNotification] = useState<{
    count: number;
    message: string;
  } | null>(null);

  // Cross-school query state
  const [queryInput, setQueryInput] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);

  // Add Citation Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAuthors, setNewAuthors] = useState('');
  const [newYear, setNewYear] = useState('2024');
  const [newTitle, setNewTitle] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newDoi, setNewDoi] = useState('');
  const [newThematicCategory, setNewThematicCategory] = useState(THEMATIC_CATEGORIES[0]);

  // Collect all unique keywords
  const allKeywords = Array.from(
    new Set(
      citations.flatMap((c) => [
        ...(c.keywords || []),
        ...(c.aiTaggedKeywords || [])
      ])
    )
  );

  // Handle toggle alignment drawer
  const toggleAlignmentDrawer = (citationId: string) => {
    setExpandedAlignments((prev) => ({
      ...prev,
      [citationId]: !prev[citationId]
    }));
  };

  // Run AI Categorization on All Citations
  const handleBatchAutoCategorize = async () => {
    setIsCategorizingBatch(true);
    setCategorizationNotification(null);

    try {
      const res = await fetch('/api/gemini/categorize-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citations,
          courses
        })
      });

      const data = await res.json();
      if (data.success && data.categorizedCitations) {
        if (onUpdateCitations) {
          onUpdateCitations(data.categorizedCitations);
        }
        setCategorizationNotification({
          count: data.updatedCount || citations.length,
          message: `Successfully categorized ${data.updatedCount || citations.length} citations with AI thematic classifications, course relevance mappings, and granular content tags.`
        });
      }
    } catch (err) {
      console.error('Batch categorization failed:', err);
    } finally {
      setIsCategorizingBatch(false);
    }
  };

  // Run AI Categorization on a Single Citation
  const handleCategorizeSingle = async (citationId: string) => {
    setCategorizingSingleId(citationId);
    try {
      const res = await fetch('/api/gemini/categorize-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citations,
          courses,
          singleCitationId: citationId
        })
      });

      const data = await res.json();
      if (data.success && data.categorizedCitations) {
        if (onUpdateCitations) {
          onUpdateCitations(data.categorizedCitations);
        }
        // Auto expand alignment drawer to show new findings
        setExpandedAlignments((prev) => ({ ...prev, [citationId]: true }));
      }
    } catch (err) {
      console.error('Single citation categorization failed:', err);
    } finally {
      setCategorizingSingleId(null);
    }
  };

  // Filter & Sort Citations
  const filteredCitations = citations
    .filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.apa7.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.keywords && c.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (c.aiTaggedKeywords && c.aiTaggedKeywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesTag =
        selectedTag === null ||
        (c.keywords && c.keywords.includes(selectedTag)) ||
        (c.aiTaggedKeywords && c.aiTaggedKeywords.includes(selectedTag));

      const matchesCategory =
        selectedCategory === null ||
        c.aiThematicCategory === selectedCategory;

      const matchesSourceType =
        selectedSourceType === null ||
        c.sourceTypeClassification === selectedSourceType;

      const matchesCourse =
        selectedCourseFilter === null ||
        (c.courseAlignments &&
          c.courseAlignments.some(
            (ca) => ca.courseId === selectedCourseFilter && ca.relevanceScore >= 60
          ));

      return matchesSearch && matchesTag && matchesCategory && matchesSourceType && matchesCourse;
    })
    .sort((a, b) => {
      if (sortBy === 'relevance') {
        const getScore = (c: Citation) => {
          if (selectedCourseFilter && c.courseAlignments) {
            const align = c.courseAlignments.find((ca) => ca.courseId === selectedCourseFilter);
            return align ? align.relevanceScore : 0;
          }
          return c.aiRelevanceScore || (c.courseAlignments && c.courseAlignments[0]?.relevanceScore) || 50;
        };
        return getScore(b) - getScore(a);
      }
      if (sortBy === 'year') {
        return (b.year || '').localeCompare(a.year || '');
      }
      if (sortBy === 'authors') {
        return (a.authors || '').localeCompare(b.authors || '');
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

  const handleCopyApa = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunCrossQuery = async (queryText: string) => {
    setQueryInput(queryText);
    setQueryLoading(true);
    try {
      const res = await fetch('/api/gemini/academic-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          knowledgeBase: { citations, academicMemory, courses }
        })
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err) {
      console.error('Academic memory query failed:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSaveCitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthors || !newTitle) return;

    const formattedApa = `${newAuthors} (${newYear}). ${newTitle}. ${newSource}.${newDoi ? ` ${newDoi}` : ''}`;
    const authorLast = newAuthors.split(',')[0].trim();
    const formattedInText = `(${authorLast}, ${newYear})`;

    const newCit: Citation = {
      id: `cit-${Date.now()}`,
      authors: newAuthors,
      year: newYear,
      title: newTitle,
      source: newSource,
      doiOrUrl: newDoi,
      apa7: formattedApa,
      inText: formattedInText,
      notes: 'Added to master citation vault.',
      keyQuotes: [],
      keywords: ['Scholarly Source'],
      coursesUsed: [],
      papersCitedIn: [],
      institutionOrigin: 'Universal',
      aiThematicCategory: newThematicCategory,
      sourceTypeClassification: 'Theoretical Framework',
      aiRelevanceScore: 85,
      lastCategorizedAt: new Date().toISOString()
    };

    onAddCitation(newCit);
    setShowAddModal(false);
    setNewAuthors('');
    setNewTitle('');
    setNewSource('');
    setNewDoi('');
  };

  const getInstitutionColor = (courseCode: string) => {
    if (courseCode.includes('ED 9413')) return 'border-red-600/60 text-red-950 bg-red-50/70 dark:bg-red-950/20';
    if (courseCode.includes('DSAB 629')) return 'border-blue-600/60 text-blue-950 bg-blue-50/70 dark:bg-blue-950/20';
    if (courseCode.includes('FYC 6933')) return 'border-amber-600/60 text-amber-950 bg-amber-50/70 dark:bg-amber-950/20';
    return 'border-neutral-300 text-neutral-800 bg-neutral-50';
  };

  const getRelevanceBadgeStyle = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-800 border-emerald-300 font-bold';
    if (score >= 75) return 'bg-amber-500/10 text-amber-900 border-amber-300 font-semibold';
    return 'bg-neutral-100 text-neutral-600 border-neutral-200';
  };

  const getCategoryBadgeStyle = (category?: string) => {
    switch (category) {
      case 'Universal Design & Inclusive Pedagogy':
        return 'bg-amber-500/15 text-amber-900 border-amber-300';
      case 'Critical Disability Studies & Social Justice':
        return 'bg-blue-500/15 text-blue-900 border-blue-300';
      case 'Transition Pipelines & Community Support':
        return 'bg-emerald-500/15 text-emerald-900 border-emerald-300';
      case 'Neurodiversity & Executive Function':
        return 'bg-purple-500/15 text-purple-900 border-purple-300';
      case 'Institutional Policy & Compliance':
        return 'bg-rose-500/15 text-rose-900 border-rose-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  // Stats
  const totalCategorized = citations.filter((c) => c.aiThematicCategory).length;
  const highRelevanceCount = citations.filter((c) =>
    c.courseAlignments && c.courseAlignments.some((ca) => ca.relevanceScore >= 90)
  ).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
              APA Citation Vault & Academic Memory
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-300 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
              <BrainCircuit className="h-3 w-3 text-amber-700" />
              AI Categorization Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-0.5">
            AI-powered taxonomy and course relevance mapping connecting sources across Mississippi State, CUNY SPS, and UF
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleBatchAutoCategorize}
            disabled={isCategorizingBatch}
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-3.5 py-2 text-xs font-bold text-neutral-950 transition-all cursor-pointer shadow-xs disabled:opacity-60"
            title="Auto-tag and map all citations against current course syllabi"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCategorizingBatch ? 'animate-spin' : ''}`} />
            <span>{isCategorizingBatch ? 'Analyzing Vault...' : 'AI Auto-Categorize All'}</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf_extract')}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 px-3.5 py-2 text-xs font-semibold text-neutral-800 transition-all cursor-pointer shadow-xs"
          >
            <UploadCloud className="h-3.5 w-3.5 text-neutral-700" />
            <span>Extract PDF</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4 text-amber-400" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Categorization Feedback Notification Toast */}
      {categorizationNotification && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 text-xs text-emerald-950 flex items-start justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block text-emerald-900">AI Knowledge Alignment Updated</span>
              <p className="text-[11px] text-emerald-800 font-sans mt-0.5">
                {categorizationNotification.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCategorizationNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 5 Library Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <BookOpen className={`h-3.5 w-3.5 ${activeTab === 'vault' ? 'text-amber-400' : 'text-neutral-500'}`} />
          <span>Categorized Vault ({citations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <TableProperties className={`h-3.5 w-3.5 ${activeTab === 'matrix' ? 'text-amber-400' : 'text-neutral-500'}`} />
          <span className="flex items-center gap-1">
            <span>Course Alignment Matrix</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
              3 Colleges
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pdf_extract')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === 'pdf_extract'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <UploadCloud className={`h-3.5 w-3.5 ${activeTab === 'pdf_extract' ? 'text-amber-400' : 'text-amber-700'}`} />
          <span>PDF Citation Extractor</span>
        </button>

        <button
          onClick={() => setActiveTab('cross_query')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === 'cross_query'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Sparkles className={`h-3.5 w-3.5 ${activeTab === 'cross_query' ? 'text-amber-400' : 'text-neutral-500'}`} />
          <span>Cross-School Query Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === 'memory'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Layers className={`h-3.5 w-3.5 ${activeTab === 'memory' ? 'text-amber-400' : 'text-neutral-500'}`} />
          <span>Academic Knowledge Graph ({academicMemory.length})</span>
        </button>
      </div>

      {/* 1. CITATION VAULT WITH AI CATEGORIZATION & RELEVANCE FILTERS */}
      {activeTab === 'vault' && (
        <div className="space-y-5">
          {/* AI Intelligence Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Total Indexed</span>
                <div className="text-xl font-serif font-bold text-neutral-900 mt-0.5">{citations.length} Sources</div>
              </div>
              <BookMarked className="h-6 w-6 text-amber-600 opacity-80" />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-800 uppercase tracking-wider font-semibold">AI Categorized</span>
                <div className="text-xl font-serif font-bold text-amber-950 mt-0.5">{totalCategorized} / {citations.length}</div>
              </div>
              <BrainCircuit className="h-6 w-6 text-amber-700 opacity-80" />
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 uppercase tracking-wider font-semibold">High-Yield Course Fit</span>
                <div className="text-xl font-serif font-bold text-emerald-950 mt-0.5">{highRelevanceCount} Sources</div>
              </div>
              <Award className="h-6 w-6 text-emerald-700 opacity-80" />
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-800 uppercase tracking-wider font-semibold">Cross-College Links</span>
                <div className="text-xl font-serif font-bold text-blue-950 mt-0.5">3 Universities</div>
              </div>
              <GraduationCap className="h-6 w-6 text-blue-700 opacity-80" />
            </div>
          </div>

          {/* Search, Course Filter, and Categorization Toolbar */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs space-y-3.5">
            {/* Top row: Search and Sort */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by author, title, abstract quote, APA string, or AI topic tag..."
                  className="w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-neutral-500 whitespace-nowrap">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-800 focus:border-neutral-900 focus:outline-none shadow-xs cursor-pointer w-full sm:w-auto"
                >
                  <option value="relevance">Highest Course Match %</option>
                  <option value="year">Publication Year (Newest)</option>
                  <option value="authors">Author Last Name (A-Z)</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Course Relevance Filter Strip */}
            <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-sans shrink-0 flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-neutral-500" /> Course Relevance:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedCourseFilter(null)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border cursor-pointer ${
                    selectedCourseFilter === null
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  All Courses
                </button>
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() =>
                      setSelectedCourseFilter(
                        selectedCourseFilter === course.id ? null : course.id
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border cursor-pointer flex items-center gap-1 ${
                      selectedCourseFilter === course.id
                        ? 'bg-amber-500/20 text-neutral-950 border-amber-400 font-bold shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{course.code}</span>
                    <span className="text-[10px] text-neutral-500 font-normal truncate max-w-[120px]">
                      ({course.title.split(' ')[0]})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Thematic Taxonomy Pills */}
            <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-sans shrink-0 flex items-center gap-1">
                <BrainCircuit className="h-3.5 w-3.5 text-amber-700" /> AI Taxonomy:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border cursor-pointer ${
                    selectedCategory === null
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  All Categories
                </button>
                {THEMATIC_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat ? null : cat)
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Granular Keywords & Content Tags */}
            <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-sans shrink-0 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-neutral-500" /> Content Tags:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border cursor-pointer ${
                    selectedTag === null
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  All Tags
                </button>
                {allKeywords.slice(0, 10).map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setSelectedTag(selectedTag === kw ? null : kw)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border cursor-pointer ${
                      selectedTag === kw
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    #{kw}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filter Badges Counter */}
          {(selectedCourseFilter || selectedCategory || selectedTag || searchQuery) && (
            <div className="flex items-center justify-between text-xs text-neutral-600 bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">Showing {filteredCitations.length} matching sources</span>
                {selectedCourseFilter && (
                  <span className="rounded-md bg-white border border-neutral-200 px-2 py-0.5 text-[10px] text-neutral-800 flex items-center gap-1">
                    Course: {courses.find((c) => c.id === selectedCourseFilter)?.code}
                    <button onClick={() => setSelectedCourseFilter(null)} className="hover:text-neutral-950">×</button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="rounded-md bg-white border border-neutral-200 px-2 py-0.5 text-[10px] text-neutral-800 flex items-center gap-1">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory(null)} className="hover:text-neutral-950">×</button>
                  </span>
                )}
                {selectedTag && (
                  <span className="rounded-md bg-white border border-neutral-200 px-2 py-0.5 text-[10px] text-neutral-800 flex items-center gap-1">
                    Tag: #{selectedTag}
                    <button onClick={() => setSelectedTag(null)} className="hover:text-neutral-950">×</button>
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedCourseFilter(null);
                  setSelectedCategory(null);
                  setSelectedTag(null);
                  setSearchQuery('');
                }}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 font-semibold cursor-pointer underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Citations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCitations.map((cit) => {
              const isExpanded = !!expandedAlignments[cit.id];
              const isAnalyzingThis = categorizingSingleId === cit.id;

              return (
                <div
                  key={cit.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3.5 hover:border-neutral-300 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    {/* Header Row: Category Badge & Source Type & Origin */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cit.aiThematicCategory && (
                          <span
                            className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${getCategoryBadgeStyle(
                              cit.aiThematicCategory
                            )}`}
                          >
                            {cit.aiThematicCategory}
                          </span>
                        )}
                        {cit.sourceTypeClassification && (
                          <span className="rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 text-[10px] font-medium">
                            {cit.sourceTypeClassification}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-neutral-500 font-medium">
                        {cit.institutionOrigin || 'Universal'}
                      </span>
                    </div>

                    {/* Title & Bibliographic Core */}
                    <h3 className="font-serif font-bold text-neutral-900 text-sm sm:text-base mt-2.5 leading-snug">
                      {cit.title}
                    </h3>
                    <div className="text-xs text-neutral-600 mt-1 font-sans">
                      <span className="font-medium text-neutral-800">{cit.authors}</span> ({cit.year}).{' '}
                      <span className="italic">{cit.source}</span>
                    </div>

                    {/* In-Text Citation and DOI */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {cit.inText}
                      </span>
                      {cit.doiOrUrl && (
                        <a
                          href={cit.doiOrUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-neutral-500 hover:text-amber-800 flex items-center gap-1 font-mono truncate max-w-[200px]"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{cit.doiOrUrl}</span>
                        </a>
                      )}
                    </div>

                    {/* Key Quotation Snippet */}
                    {cit.keyQuotes && cit.keyQuotes.length > 0 && (
                      <div className="mt-3 rounded-xl bg-neutral-50/80 p-3 border border-neutral-200 text-xs text-neutral-700 flex items-start gap-2">
                        <Quote className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <p className="italic text-[11px] leading-relaxed">
                          "{cit.keyQuotes[0]}"
                        </p>
                      </div>
                    )}

                    {/* Course Relevance Mapping Badges Strip */}
                    {cit.courseAlignments && cit.courseAlignments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-sans flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 text-amber-700" />
                            Course Alignment Relevance:
                          </span>
                          <button
                            onClick={() => toggleAlignmentDrawer(cit.id)}
                            className="text-[10px] text-amber-800 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                Hide Rationale <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                View Rationale & Assignments <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>

                        {/* Interactive Course Relevance Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {cit.courseAlignments.map((ca, idx) => (
                            <button
                              key={idx}
                              onClick={() => toggleAlignmentDrawer(cit.id)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-all ${getInstitutionColor(
                                ca.courseCode
                              )}`}
                            >
                              <span className="font-bold font-serif">{ca.courseCode}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] border ${getRelevanceBadgeStyle(
                                  ca.relevanceScore
                                )}`}
                              >
                                {ca.relevanceScore}%
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Expanded Alignment Drawer */}
                        {isExpanded && (
                          <div className="mt-2 rounded-xl bg-neutral-50 p-3.5 border border-neutral-200 space-y-3 animate-fadeIn text-xs">
                            {cit.courseAlignments.map((ca, idx) => (
                              <div
                                key={idx}
                                className="border-b last:border-b-0 border-neutral-200/70 pb-2.5 last:pb-0 space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-serif font-bold text-neutral-900 text-xs">
                                      {ca.courseCode}: {ca.courseTitle}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] border ${getRelevanceBadgeStyle(
                                      ca.relevanceScore
                                    )}`}
                                  >
                                    {ca.relevanceScore}% syllabus fit
                                  </span>
                                </div>

                                <p className="text-[11px] text-neutral-700 font-sans leading-relaxed">
                                  <span className="font-semibold text-neutral-900">Pedagogical Rationale: </span>
                                  {ca.alignmentRationale}
                                </p>

                                {ca.primaryAssignmentMatch && (
                                  <div className="text-[10px] text-neutral-600 flex items-center gap-1 mt-1 font-mono">
                                    <span className="font-bold text-amber-900">Target Deliverable:</span>{' '}
                                    {ca.primaryAssignmentMatch}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Tagged Keywords */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {cit.aiTaggedKeywords && cit.aiTaggedKeywords.length > 0
                        ? cit.aiTaggedKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded-md bg-amber-500/10 text-neutral-800 px-2 py-0.5 text-[10px] border border-amber-200/80 font-medium flex items-center gap-0.5"
                            >
                              <Sparkles className="h-2.5 w-2.5 text-amber-700" />
                              {kw}
                            </span>
                          ))
                        : cit.keywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 border border-neutral-200"
                            >
                              {kw}
                            </span>
                          ))}
                    </div>
                  </div>

                  {/* Copy Actions & Individual AI Re-Categorize Footer */}
                  <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyApa(cit.id, cit.apa7)}
                        className="flex items-center gap-1.5 text-neutral-700 hover:text-amber-800 font-medium transition-colors cursor-pointer"
                      >
                        {copiedId === cit.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Copied APA 7</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy APA 7</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopyApa(`intext-${cit.id}`, cit.inText)}
                        className="text-amber-800 hover:underline font-mono text-[11px] font-semibold cursor-pointer"
                      >
                        {copiedId === `intext-${cit.id}` ? 'Copied!' : 'In-Text'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleCategorizeSingle(cit.id)}
                      disabled={isAnalyzingThis}
                      className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-amber-900 bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 transition-all cursor-pointer disabled:opacity-50"
                      title="Re-run AI categorization for this source"
                    >
                      <RefreshCw className={`h-3 w-3 ${isAnalyzingThis ? 'animate-spin text-amber-700' : ''}`} />
                      <span>{isAnalyzingThis ? 'Categorizing...' : 'AI Re-Tag'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. COURSE ALIGNMENT MATRIX TAB */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif font-bold text-neutral-900 text-lg sm:text-xl">
                  Cross-Curricular Course Alignment Matrix
                </h2>
                <p className="text-xs text-neutral-600 font-sans mt-0.5">
                  Visualizes how citations in your vault map against all active courses across Mississippi State, CUNY SPS, and University of Florida.
                </p>
              </div>

              <button
                onClick={handleBatchAutoCategorize}
                disabled={isCategorizingBatch}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-neutral-950 transition-all cursor-pointer shrink-0 shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isCategorizingBatch ? 'animate-spin' : ''}`} />
                <span>Re-Calculate Matrix</span>
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="p-3.5 font-serif font-bold text-neutral-900 w-1/3">Citation & Primary Author</th>
                    <th className="p-3.5 font-serif font-bold text-neutral-900">Thematic Category</th>
                    {courses.map((c) => (
                      <th key={c.id} className="p-3.5 font-serif font-bold text-neutral-900 text-center">
                        <div>{c.code}</div>
                        <div className="text-[10px] font-sans font-normal text-neutral-500">
                          {c.institutionId.includes('msu') ? 'MSU' : c.institutionId.includes('cuny') ? 'CUNY' : 'UF'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-sans">
                  {citations.map((cit) => (
                    <tr key={cit.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="font-serif font-bold text-neutral-900 text-xs">{cit.title}</div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{cit.inText}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${getCategoryBadgeStyle(
                            cit.aiThematicCategory
                          )}`}
                        >
                          {cit.aiThematicCategory || 'General Academic'}
                        </span>
                      </td>
                      {courses.map((course) => {
                        const match = cit.courseAlignments?.find((ca) => ca.courseId === course.id);
                        const score = match?.relevanceScore || 0;

                        return (
                          <td key={course.id} className="p-3.5 text-center">
                            {score > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className={`px-2 py-1 rounded-md text-[11px] border font-bold ${getRelevanceBadgeStyle(
                                    score
                                  )}`}
                                >
                                  {score}%
                                </span>
                                {score >= 90 && (
                                  <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider mt-0.5">
                                    High Fit
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-neutral-300 font-mono text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PDF CITATION EXTRACTOR TAB */}
      {activeTab === 'pdf_extract' && (
        <div className="space-y-6 animate-fadeIn">
          <PdfCitationExtractor
            courses={courses}
            institutions={institutions}
            onAddCitation={onAddCitation}
          />
        </div>
      )}

      {/* 4. CROSS-SCHOOL QUERY ENGINE TAB */}
      {activeTab === 'cross_query' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-700" />
              <h2 className="font-serif font-bold text-neutral-900 text-lg">
                Cross-College Academic Memory Synthesizer
              </h2>
            </div>
            <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed font-sans">
              Ask natural queries across your entire multi-school academic history. Discover how sources you explored at CUNY or UF can substantiate your current Mississippi State coursework.
            </p>

            {/* 3 Concrete Prompt Presets requested by user */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-sans">
                Recommended Memory Inquiries:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  "Show me everything I already have on Universal Design",
                  "Which sources from CUNY can support my UF project?",
                  "Build the references section for this assignment using only sources actually cited in the paper"
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => handleRunCrossQuery(preset)}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 text-left text-xs text-neutral-800 hover:border-neutral-300 hover:bg-neutral-100 transition-all cursor-pointer font-serif flex flex-col justify-between shadow-xs"
                  >
                    <span>"{preset}"</span>
                    <span className="mt-2 text-[10px] text-amber-800 font-sans font-semibold flex items-center gap-1">
                      Execute Query <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Query Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask your cross-college academic memory graph..."
                className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none shadow-xs"
              />
              <button
                onClick={() => handleRunCrossQuery(queryInput)}
                disabled={queryLoading || !queryInput.trim()}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-xs"
              >
                {queryLoading ? 'Synthesizing...' : 'Query Memory'}
              </button>
            </div>
          </div>

          {/* Query Results Display */}
          {queryResult && (
            <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-700" />
                <h3 className="font-serif font-bold text-neutral-900 text-base">
                  Synthesis Intelligence Result
                </h3>
              </div>

              <div className="rounded-xl bg-neutral-50/80 p-4 border border-neutral-200 text-xs text-neutral-800 leading-relaxed font-sans">
                <span className="font-semibold text-emerald-800 block mb-1">Knowledge Graph Insight:</span>
                {queryResult.relevanceSummary}
              </div>

              {queryResult.connectedNodes && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-800 font-sans">Connected Cross-School Sources:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {queryResult.connectedNodes.map((node: any, idx: number) => (
                      <div key={idx} className="rounded-xl bg-neutral-50/70 p-3.5 border border-neutral-200 text-xs space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-neutral-900 text-xs">{node.title}</span>
                          <span className="text-[10px] text-amber-800 font-mono font-semibold">{node.relevanceScore}% match</span>
                        </div>
                        <div className="text-[10px] text-neutral-500">{node.origin} • {node.relationType}</div>
                        <p className="text-[11px] text-neutral-700 font-sans italic">"{node.snippet}"</p>
                        <div className="text-[10px] text-neutral-500 font-mono pt-1 truncate">{node.citationApa}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {queryResult.synthesisRecommendation && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900">
                  <span className="font-semibold block mb-0.5">Authorial Action Recommendation:</span>
                  {queryResult.synthesisRecommendation}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. ACADEMIC KNOWLEDGE GRAPH TAB */}
      {activeTab === 'memory' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
            <h2 className="font-serif font-bold text-neutral-900 text-base mb-1">
              Active Knowledge Graph Nodes
            </h2>
            <p className="text-xs text-neutral-500 mb-4 font-sans">
              Concepts synthesized across semesters so nothing you learn disappears when a term ends.
            </p>

            <div className="space-y-4">
              {academicMemory.map((node) => (
                <div key={node.id} className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-amber-800 tracking-wider font-sans">
                        Concept Node
                      </span>
                      <h3 className="font-serif font-bold text-neutral-900 text-base">
                        {node.concept}
                      </h3>
                    </div>
                    <span className="rounded-md bg-white border border-neutral-200 px-3 py-1 text-xs text-neutral-700 font-medium">
                      Origin: {node.originInstitution} ({node.originCourseCode})
                    </span>
                  </div>

                  <p className="text-xs text-neutral-800 leading-relaxed font-sans bg-white p-3 rounded-xl border border-neutral-200">
                    {node.coreInsight}
                  </p>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-neutral-600 font-sans">Relevant Quotes Indexed:</span>
                    {node.quotations.map((q, i) => (
                      <div key={i} className="text-[11px] text-neutral-700 italic pl-3 border-l-2 border-amber-500">
                        "{q}"
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-neutral-200 flex flex-wrap gap-2 text-xs">
                    <span className="font-semibold text-neutral-600 font-sans">Cross-School Applications:</span>
                    {node.crossSchoolApplications.map((app, i) => (
                      <div key={i} className="rounded-md bg-white border border-neutral-200 px-2 py-1 text-[11px] text-neutral-700">
                        <span className="text-amber-800 font-semibold">{app.targetCourseCode}:</span> {app.suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Citation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-serif font-bold text-neutral-900">Add to Master Citation Vault</h2>
            <form onSubmit={handleSaveCitation} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Authors (e.g. Burgstahler, S. or Evans, N. J., et al.)</label>
                <input
                  type="text"
                  required
                  value={newAuthors}
                  onChange={(e) => setNewAuthors(e.target.value)}
                  placeholder="Burgstahler, S."
                  className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Publication Year</label>
                  <input
                    type="text"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="2024"
                    className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">DOI or URL (Optional)</label>
                  <input
                    type="text"
                    value={newDoi}
                    onChange={(e) => setNewDoi(e.target.value)}
                    placeholder="https://doi.org/..."
                    className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Thematic Taxonomy Classification</label>
                <select
                  value={newThematicCategory}
                  onChange={(e) => setNewThematicCategory(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  {THEMATIC_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Article / Book Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Universal Design in Higher Education..."
                  className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Source / Journal / Publisher</label>
                <input
                  type="text"
                  required
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="Harvard Education Press"
                  className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-neutral-600 hover:bg-neutral-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-neutral-950 hover:bg-amber-400 cursor-pointer shadow-xs"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
