import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, Check, Trash2 } from 'lucide-react';
import { PeerReviewedSource, PublicationType } from '../../types/matrix';
import { formatApa7Html } from '../../lib/apa7Engine';

interface SourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: PeerReviewedSource | null;
  onSaveSource: (source: PeerReviewedSource) => void;
  onDeleteSource: (sourceId: string) => void;
}

export const SourceDetailModal: React.FC<SourceDetailModalProps> = ({
  isOpen,
  onClose,
  source,
  onSaveSource,
  onDeleteSource
}) => {
  if (!isOpen || !source) return null;

  const [title, setTitle] = useState(source.title);
  const [journal, setJournal] = useState(source.journal);
  const [year, setYear] = useState(source.year);
  const [volume, setVolume] = useState(source.volume);
  const [issue, setIssue] = useState(source.issue);
  const [pages, setPages] = useState(source.pages);
  const [doi, setDoi] = useState(source.doi);
  const [pubType, setPubType] = useState<PublicationType>(source.publicationType);
  const [sample, setSample] = useState(source.sampleAndContext);
  const [findings, setFindings] = useState(source.keyFindings);
  const [limitations, setLimitations] = useState(source.methodologicalLimitations);
  const [contribution, setContribution] = useState(source.dissertationContribution);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PeerReviewedSource = {
      ...source,
      title,
      journal,
      year: Number(year),
      volume,
      issue,
      pages,
      doi,
      publicationType: pubType,
      sampleAndContext: sample,
      keyFindings: findings,
      methodologicalLimitations: limitations,
      dissertationContribution: contribution
    };
    onSaveSource(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div 
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col bg-[#FDFDFD] border border-stone-300 shadow-2xl rounded-xs"
        role="dialog"
        aria-labelledby="source-detail-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5 bg-[#FAF9F6]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-widest">
              <span>Peer-Reviewed Source Profile</span>
              <span>·</span>
              <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified ({source.peerReviewConfidence}%)
              </span>
            </div>
            <h2 id="source-detail-title" className="mt-1 font-serif text-xl font-bold text-stone-900">
              {source.title}
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              {source.authors.join('; ')} ({source.year})
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

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* APA Formatted Display */}
          <div className="bg-stone-50 border border-stone-200 p-3 text-xs text-stone-800 leading-relaxed apa-hanging-indent font-sans">
            <span className="font-mono uppercase text-[10px] text-stone-500 block mb-1">
              APA 7th Reference Entry
            </span>
            <div dangerouslySetInnerHTML={{ __html: formatApa7Html(source) }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
                Journal / Periodical
              </label>
              <input
                type="text"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="w-full border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
                Methodology Type
              </label>
              <select
                value={pubType}
                onChange={(e) => setPubType(e.target.value as PublicationType)}
                className="w-full border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none"
              >
                <option value="empirical-quantitative">Empirical Quantitative</option>
                <option value="empirical-qualitative">Empirical Qualitative</option>
                <option value="mixed-methods">Mixed-Methods</option>
                <option value="systematic-review">Systematic Review</option>
                <option value="meta-analysis">Meta-Analysis</option>
                <option value="theoretical-conceptual">Theoretical / Conceptual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
                Volume
              </label>
              <input
                type="text"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full border border-stone-300 bg-white p-2 text-xs font-mono text-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
                Issue
              </label>
              <input
                type="text"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="w-full border border-stone-300 bg-white p-2 text-xs font-mono text-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
                Pages
              </label>
              <input
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="w-full border border-stone-300 bg-white p-2 text-xs font-mono text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
              DOI URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                className="flex-1 border border-stone-300 bg-white p-2 text-xs font-mono text-stone-900 focus:outline-none"
              />
              {doi && (
                <a
                  href={doi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-stone-300 text-stone-700 hover:text-stone-950 flex items-center justify-center"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
              Sample, Context & Experimental Dataset
            </label>
            <textarea
              rows={2}
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              className="w-full border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
              Major Empirical Findings
            </label>
            <textarea
              rows={2}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              className="w-full border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
              Methodological Limitations & Caveats
            </label>
            <textarea
              rows={2}
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              className="w-full border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-1">
              Contribution to Dissertation Chapters
            </label>
            <input
              type="text"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              className="w-full border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove "${source.title}" from your Dissertation Matrix?`)) {
                  onDeleteSource(source.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-rose-700 hover:text-rose-900 text-xs px-2 py-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete from Matrix</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-stone-900 text-white px-5 py-2 text-xs font-medium hover:bg-stone-800"
              >
                <Check className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
