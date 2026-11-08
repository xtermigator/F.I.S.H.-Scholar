import React, { useState, useEffect } from 'react';
import { X, Check, Quote, AlertCircle, Bookmark, Sparkles } from 'lucide-react';
import { MatrixCell, MatrixStance, EvidenceWeight, PeerReviewedSource, MatrixTheme } from '../../types/matrix';

interface CellEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cell: MatrixCell | null;
  source: PeerReviewedSource | null;
  theme: MatrixTheme | null;
  onSave: (updatedCell: MatrixCell) => void;
}

export const CellEditorModal: React.FC<CellEditorModalProps> = ({
  isOpen,
  onClose,
  cell,
  source,
  theme,
  onSave
}) => {
  const [stance, setStance] = useState<MatrixStance>('supports');
  const [synthesisNotes, setSynthesisNotes] = useState('');
  const [directQuote, setDirectQuote] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [evidenceWeight, setEvidenceWeight] = useState<EvidenceWeight>('high');
  const [literatureGapIdentified, setLiteratureGapIdentified] = useState(false);
  const [gapNotes, setGapNotes] = useState('');

  useEffect(() => {
    if (cell) {
      setStance(cell.stance || 'supports');
      setSynthesisNotes(cell.synthesisNotes || '');
      setDirectQuote(cell.directQuote || '');
      setPageNumber(cell.pageNumber || '');
      setEvidenceWeight(cell.evidenceWeight || 'high');
      setLiteratureGapIdentified(Boolean(cell.literatureGapIdentified));
      setGapNotes(cell.gapNotes || '');
    } else {
      setStance('supports');
      setSynthesisNotes('');
      setDirectQuote('');
      setPageNumber('');
      setEvidenceWeight('high');
      setLiteratureGapIdentified(false);
      setGapNotes('');
    }
  }, [cell, isOpen]);

  if (!isOpen || !source || !theme) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MatrixCell = {
      sourceId: source.id,
      themeId: theme.id,
      stance,
      synthesisNotes: synthesisNotes.trim(),
      directQuote: directQuote.trim(),
      pageNumber: pageNumber.trim(),
      evidenceWeight,
      literatureGapIdentified,
      gapNotes: gapNotes.trim(),
      updatedAt: new Date().toISOString()
    };
    onSave(updated);
    onClose();
  };

  const stanceOptions: { value: MatrixStance; label: string; desc: string; borderClass: string }[] = [
    { value: 'supports', label: 'Supports Theme', desc: 'Corroborates hypothesis or provides empirical proof', borderClass: 'border-emerald-600 bg-emerald-50/50 text-emerald-900' },
    { value: 'contradicts', label: 'Contradicts / Opposes', desc: 'Disputes consensus or challenges theoretical assumptions', borderClass: 'border-rose-600 bg-rose-50/50 text-rose-900' },
    { value: 'extends', label: 'Extends / Nuances', desc: 'Adds boundary conditions, mediators, or secondary mechanisms', borderClass: 'border-amber-600 bg-amber-50/50 text-amber-900' },
    { value: 'contextual', label: 'Contextual / Methodological', desc: 'Provides institutional baseline or methodological foundation', borderClass: 'border-stone-600 bg-stone-100 text-stone-900' },
    { value: 'unaddressed', label: 'Unaddressed in Source', desc: 'Source does not speak to this literature construct', borderClass: 'border-stone-300 bg-transparent text-stone-500' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div 
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col bg-[#FDFDFD] border border-stone-300 shadow-2xl rounded-xs"
        role="dialog"
        aria-labelledby="cell-editor-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5 bg-[#FAF9F6]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-widest">
              <span>Matrix Synthesis Intersection</span>
              <span>·</span>
              <span>{theme.code}</span>
            </div>
            <h2 id="cell-editor-title" className="mt-1 font-serif text-xl font-bold text-stone-900">
              {theme.name}
            </h2>
            <p className="mt-1 text-xs text-stone-600 line-clamp-1">
              Source: <span className="font-semibold">{source.authors[0]} ({source.year})</span> — {source.title}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Stance Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-2">
              Thematic Stance & Theoretical Alignment
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {stanceOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStance(opt.value)}
                  className={`flex flex-col text-left p-3 border transition-all text-xs ${
                    stance === opt.value
                      ? `${opt.borderClass} ring-1 ring-stone-900`
                      : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                  }`}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-[11px] text-stone-500 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Critical Synthesis Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="synthesis-notes" className="text-xs font-mono uppercase tracking-wider text-stone-700 font-semibold">
                Researcher Synthesis Notes
              </label>
              <span className="text-[11px] text-stone-500">Your analysis for Chapter 2 synthesis</span>
            </div>
            <textarea
              id="synthesis-notes"
              rows={4}
              value={synthesisNotes}
              onChange={(e) => setSynthesisNotes(e.target.value)}
              placeholder="Critique how this source addresses this theme. How does it link to other authors in your matrix? What theoretical claims does it substantiate or weaken?"
              className="w-full border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:border-stone-800 focus:outline-none placeholder:text-stone-400 font-sans"
            />
          </div>

          {/* Verbatim Academic Quote & Page Number */}
          <div className="border-t border-stone-200 pt-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-700 font-semibold">
              <Quote className="h-3.5 w-3.5 text-stone-500" />
              <span>Verbatim Excerpt for Dissertation Citation</span>
            </div>
            <textarea
              id="direct-quote"
              rows={2}
              value={directQuote}
              onChange={(e) => setDirectQuote(e.target.value)}
              placeholder='"Paste exact quotation from the article for direct evidence..."'
              className="w-full border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:border-stone-800 focus:outline-none placeholder:text-stone-400 italic font-serif"
            />
            <div className="flex items-center gap-3">
              <label htmlFor="page-number" className="text-xs text-stone-600 shrink-0 font-mono">
                Exact Page / Locator:
              </label>
              <input
                id="page-number"
                type="text"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="e.g., p. 348 or pp. 350–352"
                className="w-48 border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-stone-800 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Evidence Weight & Literature Gap */}
          <div className="border-t border-stone-200 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-2">
                Evidence Weight / Rigor
              </label>
              <div className="flex gap-2">
                {(['high', 'moderate', 'exploratory'] as EvidenceWeight[]).map(wt => (
                  <button
                    key={wt}
                    type="button"
                    onClick={() => setEvidenceWeight(wt)}
                    className={`flex-1 py-1.5 text-xs capitalize border transition-all ${
                      evidenceWeight === wt
                        ? 'border-stone-900 bg-stone-900 text-white font-medium'
                        : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {wt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={literatureGapIdentified}
                  onChange={(e) => setLiteratureGapIdentified(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0"
                />
                <span className="text-xs font-medium text-stone-800">
                  Identifies Dissertation Literature Gap
                </span>
              </label>
              <p className="text-[11px] text-stone-500 mt-1">
                Flag this intersection as unaddressed or conflicting to substantiate your doctoral study contribution.
              </p>
            </div>
          </div>

          {literatureGapIdentified && (
            <div className="bg-amber-50/60 border border-amber-200 p-3 space-y-2">
              <label htmlFor="gap-notes" className="text-xs font-mono text-amber-900 uppercase tracking-wider block font-semibold">
                Literature Gap Statement
              </label>
              <textarea
                id="gap-notes"
                rows={2}
                value={gapNotes}
                onChange={(e) => setGapNotes(e.target.value)}
                placeholder="Explicitly describe what prior literature fails to explain, resolve, or test regarding this theme..."
                className="w-full border border-amber-300 bg-white p-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t border-stone-200 pt-5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-stone-900 text-white px-5 py-2 text-xs font-medium hover:bg-stone-800 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>Save Synthesis to Matrix</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
