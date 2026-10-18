import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  Sliders,
  Share2,
  BookMarked,
  Filter
} from 'lucide-react';
import {
  PeerReviewedSource,
  MatrixTheme,
  MatrixCell,
  AnnotatedBibliographySettings
} from '../../types/matrix';
import {
  formatApa7Html,
  formatApa7PlainText,
  formatBibtex,
  formatRis,
  getInTextCitations
} from '../../lib/apa7Engine';

interface CitationGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: PeerReviewedSource[];
  themes: MatrixTheme[];
  cells: MatrixCell[];
  projectTitle: string;
}

export const CitationGeneratorModal: React.FC<CitationGeneratorModalProps> = ({
  isOpen,
  onClose,
  sources,
  themes,
  cells,
  projectTitle
}) => {
  const [activeTab, setActiveTab] = useState<'references' | 'intext' | 'annotated' | 'export'>('references');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Annotated Bibliography Configuration
  const [annotSettings, setAnnotSettings] = useState<AnnotatedBibliographySettings>({
    includeMethodology: true,
    includeFindings: true,
    includeLimitations: true,
    includeThemeRelevance: true,
    includeDirectQuotes: true,
    annotationParagraphs: 2,
    filterThemeId: null,
    sortAlphabetical: true
  });

  if (!isOpen) return null;

  // Alphabetically sort sources by first author surname
  const sortedSources = [...sources].sort((a, b) => {
    const aSurname = (a.authors[0] || '').split(',')[0].toLowerCase();
    const bSurname = (b.authors[0] || '').split(',')[0].toLowerCase();
    return aSurname.localeCompare(bSurname);
  });

  // Filter sources if a theme filter is active in annotated bib
  const displayedSources = annotSettings.filterThemeId
    ? sortedSources.filter(s =>
        cells.some(c => c.sourceId === s.id && c.themeId === annotSettings.filterThemeId && c.stance !== 'unaddressed')
      )
    : sortedSources;

  const triggerCopy = (text: string, key: string, isHtml = false) => {
    if (isHtml) {
      const blob = new Blob([text], { type: 'text/html' });
      const plainBlob = new Blob([text.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blob,
        'text/plain': plainBlob
      });
      navigator.clipboard.write([item]).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      });
    }
  };

  // Generate full Reference List Plain Text
  const fullReferenceListPlainText = sortedSources
    .map(s => formatApa7PlainText(s))
    .join('\n\n');

  // Generate full Reference List HTML
  const fullReferenceListHtml = sortedSources
    .map(s => `<p style="padding-left: 2rem; text-indent: -2rem; margin-bottom: 1.25rem;">${formatApa7Html(s)}</p>`)
    .join('');

  // Generate Annotated Bibliography Entry
  const generateAnnotation = (source: PeerReviewedSource): string => {
    const parts: string[] = [];

    // Part 1: Methodology and sample
    if (annotSettings.includeMethodology) {
      const pubTypeLabel = source.publicationType.replace('-', ' ');
      parts.push(
        `This ${pubTypeLabel} study evaluates ${source.sampleAndContext || 'relevant subject populations'}.`
      );
    }

    // Part 2: Empirical findings
    if (annotSettings.includeFindings && source.keyFindings) {
      parts.push(`Core findings reveal that ${source.keyFindings}`);
    }

    // Part 3: Limitations
    if (annotSettings.includeLimitations && source.methodologicalLimitations) {
      parts.push(`Methodological constraints include ${source.methodologicalLimitations}.`);
    }

    // Part 4: Theme relevance and synthesis notes from matrix cells
    if (annotSettings.includeThemeRelevance) {
      const sourceCells = cells.filter(c => c.sourceId === source.id && c.stance !== 'unaddressed');
      if (sourceCells.length > 0) {
        const themeMentions = sourceCells.map(c => {
          const t = themes.find(th => th.id === c.themeId);
          return `${t ? t.name : 'Theme'} (${c.stance}): ${c.synthesisNotes}`;
        }).join('; ');
        parts.push(`Regarding dissertation literature synthesis, this work directly addresses ${themeMentions}.`);
      }
    }

    // Part 5: Direct quotes
    if (annotSettings.includeDirectQuotes) {
      const cellWithQuote = cells.find(c => c.sourceId === source.id && c.directQuote);
      if (cellWithQuote) {
        parts.push(
          `As noted by the authors: "${cellWithQuote.directQuote}" (${cellWithQuote.pageNumber || 'p. n.a.'}).`
        );
      }
    }

    return parts.join(' ');
  };

  // Download File Helper
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Matrix as CSV
  const handleExportMatrixCsv = () => {
    const headers = ['Source ID', 'Authors', 'Year', 'Title', 'Journal', 'Vol', 'Issue', 'Pages', 'DOI', 'Methodology', 'Sample', 'Findings', 'Limitations', ...themes.map(t => `${t.code}: ${t.name}`)];
    
    const rows = sortedSources.map(s => {
      const themeCells = themes.map(t => {
        const c = cells.find(cell => cell.sourceId === s.id && cell.themeId === t.id);
        if (!c || c.stance === 'unaddressed') return 'Unaddressed';
        return `[${c.stance.toUpperCase()}] ${c.synthesisNotes.replace(/"/g, '""')}${c.directQuote ? ` (Quote: "${c.directQuote.replace(/"/g, '""')}", ${c.pageNumber})` : ''}`;
      });

      return [
        `"${s.id}"`,
        `"${s.authors.join('; ').replace(/"/g, '""')}"`,
        s.year,
        `"${s.title.replace(/"/g, '""')}"`,
        `"${s.journal.replace(/"/g, '""')}"`,
        `"${s.volume}"`,
        `"${s.issue}"`,
        `"${s.pages}"`,
        `"${s.doi}"`,
        `"${s.publicationType}"`,
        `"${(s.sampleAndContext || '').replace(/"/g, '""')}"`,
        `"${(s.keyFindings || '').replace(/"/g, '""')}"`,
        `"${(s.methodologicalLimitations || '').replace(/"/g, '""')}"`,
        ...themeCells.map(c => `"${c}"`)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, 'dissertation_literature_matrix.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div 
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col bg-[#FDFDFD] border border-stone-300 shadow-2xl rounded-xs"
        role="dialog"
        aria-labelledby="citation-generator-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5 bg-[#FAF9F6]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-widest">
              <span>Citation Engine & Annotated Bibliography</span>
              <span>·</span>
              <span>APA 7th Edition Standard</span>
            </div>
            <h2 id="citation-generator-title" className="mt-1 font-serif text-2xl font-bold text-stone-900">
              Reference List & Annotated Bibliography
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              Export publication-ready APA 7th citations, parenthetical in-text citations, and synthesized doctoral annotations.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-stone-400 hover:text-stone-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 px-6">
          <button
            onClick={() => setActiveTab('references')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'references'
                ? 'border-stone-900 text-stone-900 font-semibold bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            APA 7th Reference List ({sortedSources.length})
          </button>
          <button
            onClick={() => setActiveTab('intext')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'intext'
                ? 'border-stone-900 text-stone-900 font-semibold bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            In-Text Citations (Parenthetical & Narrative)
          </button>
          <button
            onClick={() => setActiveTab('annotated')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'annotated'
                ? 'border-stone-900 text-stone-900 font-semibold bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Annotated Bibliography Generator
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-stone-900 text-stone-900 font-semibold bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            BibTeX, RIS & Matrix CSV Export
          </button>
        </div>

        {/* Tab 1: APA 7th Reference List */}
        {activeTab === 'references' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <span className="text-xs text-stone-500 font-mono">
                Alphabetically sorted with APA 7th hanging indents
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => triggerCopy(fullReferenceListHtml, 'ref-html', true)}
                  className="flex items-center gap-1.5 border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 hover:border-stone-400 shadow-2xs"
                >
                  {copiedKey === 'ref-html' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Copy Formatted Rich Text (Word / Docs)</span>
                </button>
                <button
                  onClick={() => triggerCopy(fullReferenceListPlainText, 'ref-plain')}
                  className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-stone-800"
                >
                  {copiedKey === 'ref-plain' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Copy Plain Text</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-8 shadow-2xs font-sans text-xs text-stone-900 leading-relaxed space-y-6">
              <h3 className="font-serif text-center font-bold text-base text-stone-900 mb-6">
                References
              </h3>
              {sortedSources.map((source) => (
                <div
                  key={source.id}
                  className="apa-hanging-indent"
                  dangerouslySetInnerHTML={{ __html: formatApa7Html(source) }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: In-Text Citations */}
        {activeTab === 'intext' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="border border-stone-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] border-b border-stone-200 text-stone-600 font-mono uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Source / Authors</th>
                    <th className="p-3">Parenthetical Citation</th>
                    <th className="p-3">Narrative Citation</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {sortedSources.map(s => {
                    const citations = getInTextCitations(s);
                    return (
                      <tr key={s.id} className="hover:bg-stone-50/50">
                        <td className="p-3 font-semibold text-stone-900 max-w-xs">
                          {s.authors[0]} et al. ({s.year})
                          <div className="text-[11px] font-normal text-stone-500 truncate mt-0.5">{s.title}</div>
                        </td>
                        <td className="p-3 font-mono text-stone-800">
                          {citations.parenthetical}
                        </td>
                        <td className="p-3 font-mono text-stone-800">
                          {citations.narrative}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => triggerCopy(citations.parenthetical, `p-${s.id}`)}
                            className="text-stone-600 hover:text-stone-950 px-2 py-1 border border-stone-200 bg-white hover:bg-stone-50 text-[11px]"
                          >
                            {copiedKey === `p-${s.id}` ? 'Copied' : 'Copy'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Annotated Bibliography */}
        {activeTab === 'annotated' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Annotation Configuration Bar */}
            <div className="bg-[#FAF9F6] border border-stone-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-stone-700">
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Annotation Synthesis Settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-mono">Theme Scope:</span>
                  <select
                    value={annotSettings.filterThemeId || ''}
                    onChange={(e) => setAnnotSettings(s => ({ ...s, filterThemeId: e.target.value || null }))}
                    className="border border-stone-300 bg-white text-xs px-2 py-1 text-stone-800 focus:outline-none"
                  >
                    <option value="">All Themes (Full Bibliography)</option>
                    {themes.map(t => (
                      <option key={t.id} value={t.id}>{t.code}: {t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annotSettings.includeMethodology}
                    onChange={e => setAnnotSettings(s => ({ ...s, includeMethodology: e.target.checked }))}
                    className="rounded text-stone-900 border-stone-300 focus:ring-0"
                  />
                  <span>Methodology & Sample</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annotSettings.includeFindings}
                    onChange={e => setAnnotSettings(s => ({ ...s, includeFindings: e.target.checked }))}
                    className="rounded text-stone-900 border-stone-300 focus:ring-0"
                  />
                  <span>Empirical Findings</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annotSettings.includeLimitations}
                    onChange={e => setAnnotSettings(s => ({ ...s, includeLimitations: e.target.checked }))}
                    className="rounded text-stone-900 border-stone-300 focus:ring-0"
                  />
                  <span>Methodological Limitations</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annotSettings.includeThemeRelevance}
                    onChange={e => setAnnotSettings(s => ({ ...s, includeThemeRelevance: e.target.checked }))}
                    className="rounded text-stone-900 border-stone-300 focus:ring-0"
                  />
                  <span>Matrix Theme Synthesis</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annotSettings.includeDirectQuotes}
                    onChange={e => setAnnotSettings(s => ({ ...s, includeDirectQuotes: e.target.checked }))}
                    className="rounded text-stone-900 border-stone-300 focus:ring-0"
                  />
                  <span>Verbatim Quotations</span>
                </label>
              </div>
            </div>

            {/* Formatted Output */}
            <div className="bg-white border border-stone-200 p-8 font-sans text-xs text-stone-900 space-y-8">
              <div className="text-center mb-6">
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Annotated Bibliography
                </h3>
                <p className="text-xs text-stone-500 italic mt-0.5">
                  {projectTitle}
                </p>
              </div>

              {displayedSources.map(source => (
                <div key={source.id} className="space-y-2">
                  <div
                    className="apa-hanging-indent leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatApa7Html(source) }}
                  />
                  <div className="pl-8 text-stone-700 leading-relaxed text-justify">
                    {generateAnnotation(source)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Export Formats */}
        {activeTab === 'export' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto">
            <div className="border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Academic Interoperability & Data Export
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Download formatted files for reference managers (Zotero, Mendeley, EndNote) or spreadsheet analysis.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BibTeX */}
              <div className="border border-stone-200 p-4 bg-white flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs font-mono uppercase">
                    BibTeX Reference File (.bib)
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Standard citation format for LaTeX, Overleaf, and Typst dissertation manuscripts.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const bib = sortedSources.map(s => formatBibtex(s)).join('\n\n');
                      downloadFile(bib, 'dissertation_references.bib', 'application/x-bibtex');
                    }}
                    className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-stone-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .bib</span>
                  </button>
                </div>
              </div>

              {/* RIS */}
              <div className="border border-stone-200 p-4 bg-white flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs font-mono uppercase">
                    Research Information Systems (.ris)
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Direct import into Zotero, Mendeley, Citavi, and Thomson Reuters EndNote.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const ris = sortedSources.map(s => formatRis(s)).join('\n\n');
                      downloadFile(ris, 'dissertation_references.ris', 'application/x-research-info-systems');
                    }}
                    className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-stone-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .ris</span>
                  </button>
                </div>
              </div>

              {/* Full Matrix CSV */}
              <div className="border border-stone-200 p-4 bg-white flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs font-mono uppercase">
                    Dissertation Matrix Dataset (.csv)
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Complete multi-theme matrix mapping including methodology, findings, gaps, and cell synthesis.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleExportMatrixCsv}
                    className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-stone-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Matrix CSV</span>
                  </button>
                </div>
              </div>

              {/* Formatted Word Document */}
              <div className="border border-stone-200 p-4 bg-white flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs font-mono uppercase">
                    Annotated Bibliography (.doc / HTML)
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Formatted text with hanging indents and APA italics for Microsoft Word or Google Docs.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Annotated Bibliography</title><style>body{font-family: Georgia, serif; line-height: 1.6; margin: 40px;} .entry{margin-bottom: 24px;} .ref{padding-left: 2rem; text-indent: -2rem;} .annot{margin-top: 6px; padding-left: 2rem;}</style></head><body><h1>Annotated Bibliography</h1><p><em>${projectTitle}</em></p>${displayedSources.map(s => `<div class="entry"><div class="ref">${formatApa7Html(s)}</div><div class="annot">${generateAnnotation(s)}</div></div>`).join('')}</body></html>`;
                      downloadFile(content, 'annotated_bibliography.html', 'text/html');
                    }}
                    className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-stone-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Document</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4 bg-stone-50">
          <span className="text-xs text-stone-500 font-mono">
            {sortedSources.length} sources indexed in current dissertation project
          </span>
          <button
            onClick={onClose}
            className="bg-stone-900 text-white px-5 py-2 text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Close Generator
          </button>
        </div>
      </div>
    </div>
  );
};
