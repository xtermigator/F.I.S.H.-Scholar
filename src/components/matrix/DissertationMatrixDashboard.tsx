import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Download,
  Quote,
  Eye,
  Settings,
  Sparkles,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import {
  DissertationProject,
  MatrixTheme,
  PeerReviewedSource,
  MatrixCell,
  MatrixStance,
  PublicationType
} from '../../types/matrix';
import { formatApa7PlainText, getInTextCitations } from '../../lib/apa7Engine';

interface DissertationMatrixDashboardProps {
  project: DissertationProject;
  themes: MatrixTheme[];
  sources: PeerReviewedSource[];
  cells: MatrixCell[];
  onOpenSourceIntegration: () => void;
  onOpenApaCompliance: () => void;
  onOpenCitationGenerator: () => void;
  onOpenThemeManager: () => void;
  onOpenCellEditor: (source: PeerReviewedSource, theme: MatrixTheme, cell: MatrixCell | null) => void;
  onOpenSourceDetail: (source: PeerReviewedSource) => void;
  onUpdateProject: (project: DissertationProject) => void;
}

export const DissertationMatrixDashboard: React.FC<DissertationMatrixDashboardProps> = ({
  project,
  themes,
  sources,
  cells,
  onOpenSourceIntegration,
  onOpenApaCompliance,
  onOpenCitationGenerator,
  onOpenThemeManager,
  onOpenCellEditor,
  onOpenSourceDetail,
  onUpdateProject
}) => {
  // Search and Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodology, setSelectedMethodology] = useState<string>('all');
  const [selectedStanceFilter, setSelectedStanceFilter] = useState<string>('all');
  const [onlyGaps, setOnlyGaps] = useState<boolean>(false);
  const [densityMode, setDensityMode] = useState<'comfortable' | 'compact'>('comfortable');

  // Filter sources
  const filteredSources = useMemo(() => {
    return sources.filter(source => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = source.title.toLowerCase().includes(q);
        const matchesAuthor = source.authors.some(a => a.toLowerCase().includes(q));
        const matchesJournal = source.journal.toLowerCase().includes(q);
        const matchesFindings = source.keyFindings.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesJournal && !matchesFindings) {
          return false;
        }
      }

      // Methodology filter
      if (selectedMethodology !== 'all' && source.publicationType !== selectedMethodology) {
        return false;
      }

      // Gap filter
      if (onlyGaps) {
        const hasGap = cells.some(c => c.sourceId === source.id && c.literatureGapIdentified);
        if (!hasGap) return false;
      }

      // Stance filter
      if (selectedStanceFilter !== 'all') {
        const hasStance = cells.some(
          c => c.sourceId === source.id && c.stance === selectedStanceFilter
        );
        if (!hasStance) return false;
      }

      return true;
    });
  }, [sources, cells, searchQuery, selectedMethodology, selectedStanceFilter, onlyGaps]);

  // Aggregate Stats
  const totalIntersections = themes.length * sources.length;
  const mappedCells = cells.filter(c => c.stance !== 'unaddressed');
  const identifiedGaps = cells.filter(c => c.literatureGapIdentified).length;
  const avgApaScore = sources.length > 0
    ? Math.round(sources.reduce((sum, s) => sum + (s.apaComplianceScore || 85), 0) / sources.length)
    : 100;

  // Stance styling helper
  const getStanceBadge = (stance: MatrixStance) => {
    switch (stance) {
      case 'supports':
        return {
          label: 'Supports',
          classes: 'text-emerald-800 bg-emerald-50/90 border-emerald-300'
        };
      case 'contradicts':
        return {
          label: 'Contradicts',
          classes: 'text-rose-800 bg-rose-50/90 border-rose-300'
        };
      case 'extends':
        return {
          label: 'Extends',
          classes: 'text-amber-800 bg-amber-50/90 border-amber-300'
        };
      case 'contextual':
        return {
          label: 'Contextual',
          classes: 'text-stone-700 bg-stone-100 border-stone-300'
        };
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#FDFDFD]">
      {/* Dissertation Project Thesis Scope Bar */}
      <section aria-labelledby="dissertation-scope-title" className="border-b border-stone-200 bg-[#FAF9F6] px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-widest">
                <span>Doctoral Literature Matrix</span>
                <span aria-hidden="true">·</span>
                <span>{project.fieldOfStudy}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Target Defense: {project.targetDefenseYear}</span>
              </div>
              <h1 id="dissertation-scope-title" className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
                {project.title}
              </h1>
              <p className="text-xs text-stone-600 leading-relaxed pt-1">
                <span className="font-semibold text-stone-800 font-mono">Central Research Question:</span>{' '}
                {project.researchQuestion}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-stone-200 pt-3 md:pt-0 md:pl-6 shrink-0">
              <div className="text-left">
                <span className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider">
                  Indexed Sources
                </span>
                <span className="font-mono text-xl font-bold text-stone-900 tabular-nums">
                  {sources.length}
                </span>
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider">
                  Theme Coverage
                </span>
                <span className="font-mono text-xl font-bold text-stone-900 tabular-nums">
                  {mappedCells.length} / {totalIntersections}
                </span>
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider">
                  Literature Gaps
                </span>
                <span className={`font-mono text-xl font-bold tabular-nums ${identifiedGaps > 0 ? 'text-amber-800' : 'text-stone-700'}`}>
                  {identifiedGaps}
                </span>
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider">
                  APA Compliance
                </span>
                <span className={`font-mono text-xl font-bold tabular-nums ${avgApaScore >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {avgApaScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Matrix Controls & Filter Toolbar */}
      <div className="border-b border-stone-200 bg-white px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Search input */}
          <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter matrix by author, title, construct, or findings..."
                className="w-full border border-stone-300 bg-white pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Dropdowns and Segmented Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Methodology filter */}
            <select
              value={selectedMethodology}
              onChange={(e) => setSelectedMethodology(e.target.value)}
              className="border border-stone-300 bg-white px-2.5 py-1.5 text-stone-700 focus:outline-none text-xs"
            >
              <option value="all">All Methodologies</option>
              <option value="empirical-quantitative">Empirical Quantitative</option>
              <option value="empirical-qualitative">Empirical Qualitative</option>
              <option value="mixed-methods">Mixed-Methods</option>
              <option value="systematic-review">Systematic Review</option>
              <option value="meta-analysis">Meta-Analysis</option>
              <option value="theoretical-conceptual">Theoretical / Conceptual</option>
            </select>

            {/* Stance filter */}
            <select
              value={selectedStanceFilter}
              onChange={(e) => setSelectedStanceFilter(e.target.value)}
              className="border border-stone-300 bg-white px-2.5 py-1.5 text-stone-700 focus:outline-none text-xs"
            >
              <option value="all">All Thematic Stances</option>
              <option value="supports">Supports Theme</option>
              <option value="contradicts">Contradicts / Opposes</option>
              <option value="extends">Extends / Nuances</option>
              <option value="contextual">Contextual Baseline</option>
            </select>

            {/* Gaps Only Toggle Button */}
            <button
              onClick={() => setOnlyGaps(!onlyGaps)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs transition-colors ${
                onlyGaps
                  ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold'
                  : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-600" />
              <span>Gaps Only ({identifiedGaps})</span>
            </button>

            {/* Density switch */}
            <div className="flex items-center border border-stone-300 bg-stone-100 p-0.5">
              <button
                onClick={() => setDensityMode('comfortable')}
                className={`px-2 py-1 text-[11px] transition-colors ${
                  densityMode === 'comfortable' ? 'bg-white text-stone-900 shadow-2xs font-medium' : 'text-stone-600'
                }`}
                title="Comfortable row height"
              >
                Comfortable
              </button>
              <button
                onClick={() => setDensityMode('compact')}
                className={`px-2 py-1 text-[11px] transition-colors ${
                  densityMode === 'compact' ? 'bg-white text-stone-900 shadow-2xs font-medium' : 'text-stone-600'
                }`}
                title="Dense data grid"
              >
                Data-Dense
              </button>
            </div>

            {/* Manage Themes Button */}
            <button
              onClick={onOpenThemeManager}
              className="flex items-center gap-1 px-3 py-1.5 border border-stone-300 bg-white text-stone-700 hover:border-stone-900 transition-colors"
            >
              <Settings className="h-3 w-3 text-stone-500" />
              <span>Themes ({themes.length})</span>
            </button>

            {/* Sourcing CTA */}
            <button
              onClick={onOpenSourceIntegration}
              className="flex items-center gap-1.5 bg-stone-900 text-white px-3.5 py-1.5 text-xs font-medium hover:bg-stone-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Source</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Literature Synthesis Matrix Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto border border-stone-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[1080px]">
              {/* Matrix Column Headers */}
              <thead>
                <tr className="border-b border-stone-300 bg-[#F8F7F4]">
                  {/* Source Column Header */}
                  <th className="p-4 w-[340px] sticky left-0 z-20 bg-[#F8F7F4] border-r border-stone-300 font-mono uppercase text-[11px] text-stone-700 tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Peer-Reviewed Literature Source</span>
                      <span className="text-[10px] text-stone-500 font-normal">
                        ({filteredSources.length} of {sources.length})
                      </span>
                    </div>
                  </th>

                  {/* Methodological Context Header */}
                  <th className="p-4 w-[240px] border-r border-stone-200 font-mono uppercase text-[11px] text-stone-700 tracking-wider">
                    <span>Methodology & Empirical Context</span>
                  </th>

                  {/* Dynamic Theme Columns */}
                  {themes.map((theme) => (
                    <th
                      key={theme.id}
                      className="p-4 min-w-[280px] max-w-[340px] border-r border-stone-200 font-normal align-top bg-[#F8F7F4]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-stone-900 bg-stone-200/80 px-1.5 py-0.5">
                              {theme.code}
                            </span>
                            <span className="font-serif font-bold text-stone-900 text-sm leading-snug line-clamp-1">
                              {theme.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                            {theme.description}
                          </p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Matrix Rows (One per source) */}
              <tbody className="divide-y divide-stone-200">
                {filteredSources.map((source, sIdx) => {
                  return (
                    <tr
                      key={source.id}
                      className={`hover:bg-stone-50/60 transition-colors ${
                        sIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF9]/40'
                      }`}
                    >
                      {/* Left Frozen Column: Source Citation & Provenance */}
                      <td className="p-4 sticky left-0 z-10 bg-inherit border-r border-stone-300 align-top">
                        <div className="space-y-1.5">
                          {/* Unboxed Metadata (Zero-pill discipline) */}
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-stone-500 font-mono">
                            <span className="font-bold text-stone-900">
                              {source.authors[0] ? source.authors[0].split(',')[0] : 'Author'} ({source.year})
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{source.publicationType.replace('-', ' ')}</span>
                            <span aria-hidden="true">·</span>
                            <span className={`font-semibold ${
                              source.apaComplianceScore >= 85 ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              APA: {source.apaComplianceScore}%
                            </span>
                          </div>

                          {/* Article Title */}
                          <button
                            onClick={() => onOpenSourceDetail(source)}
                            className="font-serif text-sm font-bold text-stone-900 hover:text-stone-950 text-left leading-snug block line-clamp-2"
                          >
                            {source.title}
                          </button>

                          {/* Journal Container & Vol */}
                          <p className="text-xs text-stone-600 italic">
                            {source.journal}
                            {source.volume && `, Vol. ${source.volume}`}
                            {source.issue && `(${source.issue})`}
                            {source.pages && `, pp. ${source.pages}`}
                          </p>

                          {/* DOI Link & Actions */}
                          <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                            {source.doi && (
                              <a
                                href={source.doi}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-stone-600 hover:text-stone-900 underline flex items-center gap-0.5 truncate max-w-[180px]"
                              >
                                <span>{source.doi.replace('https://doi.org/', '')}</span>
                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                              </a>
                            )}
                            <button
                              onClick={() => onOpenSourceDetail(source)}
                              className="text-stone-700 hover:text-stone-950 font-medium underline"
                            >
                              Edit Profile
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Methodological Context & Findings Column */}
                      <td className="p-4 border-r border-stone-200 align-top text-xs text-stone-700 space-y-2">
                        {densityMode === 'comfortable' ? (
                          <>
                            <div>
                              <span className="font-mono uppercase text-[10px] text-stone-400 block">
                                Sample / Dataset:
                              </span>
                              <p className="text-stone-800 line-clamp-2 leading-relaxed">
                                {source.sampleAndContext || 'Unspecified'}
                              </p>
                            </div>

                            <div>
                              <span className="font-mono uppercase text-[10px] text-stone-400 block">
                                Core Findings:
                              </span>
                              <p className="text-stone-700 line-clamp-3 leading-relaxed">
                                {source.keyFindings || 'Awaiting researcher coding'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <p className="line-clamp-3 text-stone-800 leading-normal">
                            <span className="font-semibold">{source.sampleAndContext}:</span> {source.keyFindings}
                          </p>
                        )}
                      </td>

                      {/* Theme Intersection Cells */}
                      {themes.map((theme) => {
                        const cell = cells.find(
                          (c) => c.sourceId === source.id && c.themeId === theme.id
                        );
                        const isMapped = cell && cell.stance !== 'unaddressed';
                        const stanceBadge = cell ? getStanceBadge(cell.stance) : null;

                        return (
                          <td
                            key={theme.id}
                            onClick={() => onOpenCellEditor(source, theme, cell || null)}
                            className={`p-3 border-r border-stone-200 align-top cursor-pointer transition-all group ${
                              cell?.literatureGapIdentified
                                ? 'bg-amber-50/50 hover:bg-amber-50'
                                : isMapped
                                ? 'hover:bg-stone-50'
                                : 'hover:bg-stone-100/60'
                            }`}
                          >
                            {isMapped ? (
                              <div className="space-y-2">
                                {/* Stance tag and Weight */}
                                <div className="flex items-center justify-between gap-1 text-[11px]">
                                  {stanceBadge && (
                                    <span className={`px-2 py-0.5 border font-mono font-medium text-[10px] ${stanceBadge.classes}`}>
                                      {stanceBadge.label}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono text-stone-400 uppercase">
                                    {cell.evidenceWeight} wt
                                  </span>
                                </div>

                                {/* Synthesis Notes */}
                                <p className="text-xs text-stone-800 leading-relaxed font-sans line-clamp-3 group-hover:text-stone-950">
                                  {cell.synthesisNotes || <span className="italic text-stone-400">Click to enter synthesis analysis...</span>}
                                </p>

                                {/* Direct Quote if available */}
                                {cell.directQuote && (
                                  <div className="border-l-2 border-stone-300 pl-2 text-[11px] italic font-serif text-stone-600 line-clamp-2">
                                    "{cell.directQuote}" {cell.pageNumber && <span className="font-mono not-italic text-stone-400">({cell.pageNumber})</span>}
                                  </div>
                                )}

                                {/* Literature Gap Indicator */}
                                {cell.literatureGapIdentified && (
                                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 border border-amber-300">
                                    <Sparkles className="h-3 w-3 text-amber-700" />
                                    <span>Dissertation Literature Gap</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full min-h-[90px] flex flex-col items-center justify-center border border-dashed border-stone-200 text-stone-400 group-hover:border-stone-400 group-hover:text-stone-600 p-2">
                                <Plus className="h-3.5 w-3.5 mb-1" />
                                <span className="text-[10px] font-mono">Map Intersection</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {filteredSources.length === 0 && (
                  <tr>
                    <td colSpan={2 + themes.length} className="p-12 text-center text-xs text-stone-500">
                      <BookOpen className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                      <p className="font-semibold text-stone-700">No matching literature review sources found</p>
                      <p className="mt-1">Adjust your search query or add peer-reviewed sources using the button above.</p>
                      <button
                        onClick={onOpenSourceIntegration}
                        className="mt-4 bg-stone-900 text-white px-4 py-2 text-xs font-medium hover:bg-stone-800"
                      >
                        Search Academic Databases
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
