import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wand2,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { PeerReviewedSource } from '../../types/matrix';
import {
  auditSourceApa7,
  autoFixSourceToApa7,
  formatApa7Html,
  formatApa7PlainText
} from '../../lib/apa7Engine';

interface ApaComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: PeerReviewedSource[];
  onUpdateSource: (source: PeerReviewedSource) => void;
  onBatchUpdateSources: (sources: PeerReviewedSource[]) => void;
}

export const ApaComplianceModal: React.FC<ApaComplianceModalProps> = ({
  isOpen,
  onClose,
  sources,
  onUpdateSource,
  onBatchUpdateSources
}) => {
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(sources[0]?.id || null);

  if (!isOpen) return null;

  // Run audit on all sources
  const audits = sources.map(source => ({
    source,
    audit: auditSourceApa7(source)
  }));

  const totalChecks = audits.reduce((sum, item) => sum + item.audit.checks.length, 0);
  const totalPassed = audits.reduce(
    (sum, item) => sum + item.audit.checks.filter(c => c.passed).length,
    0
  );
  const matrixCompliancePercent = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 100;
  const nonCompliantSourcesCount = audits.filter(item => !item.audit.isCompliant).length;

  const handleFixSingleSource = (source: PeerReviewedSource) => {
    const fixed = autoFixSourceToApa7(source);
    onUpdateSource(fixed);
  };

  const handleFixAllSources = () => {
    const allFixed = sources.map(s => autoFixSourceToApa7(s));
    onBatchUpdateSources(allFixed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div 
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col bg-[#FDFDFD] border border-stone-300 shadow-2xl rounded-xs"
        role="dialog"
        aria-labelledby="apa-compliance-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5 bg-[#FAF9F6]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-widest">
              <span>APA 7th Edition Compliance Engine</span>
              <span>·</span>
              <span>Manual of the American Psychological Association</span>
            </div>
            <h2 id="apa-compliance-title" className="mt-1 font-serif text-2xl font-bold text-stone-900">
              Automated Formatting & Provenance Audit
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              Real-time validation against the APA 7th style manual: author inversion, sentence casing, DOI URLs, italicization, and pagination.
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

        {/* Aggregate Status Scorecard */}
        <div className="border-b border-stone-200 bg-stone-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="block text-[11px] font-mono uppercase text-stone-500">
                Matrix APA Compliance
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono tabular-nums ${
                  matrixCompliancePercent >= 90 ? 'text-emerald-700' : matrixCompliancePercent >= 75 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {matrixCompliancePercent}%
                </span>
                <span className="text-xs text-stone-600">
                  ({totalPassed} of {totalChecks} rules passed)
                </span>
              </div>
            </div>

            <div className="hidden sm:block border-l border-stone-200 pl-6">
              <span className="block text-[11px] font-mono uppercase text-stone-500">
                Sources Reviewed
              </span>
              <span className="text-sm font-semibold text-stone-900 font-mono">
                {sources.length} Peer-Reviewed Articles
              </span>
            </div>

            <div className="hidden sm:block border-l border-stone-200 pl-6">
              <span className="block text-[11px] font-mono uppercase text-stone-500">
                Action Required
              </span>
              <span className={`text-sm font-semibold font-mono ${
                nonCompliantSourcesCount === 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {nonCompliantSourcesCount === 0 ? 'All 100% Compliant' : `${nonCompliantSourcesCount} Sources with warnings`}
              </span>
            </div>
          </div>

          {nonCompliantSourcesCount > 0 && (
            <button
              onClick={handleFixAllSources}
              className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 text-xs font-medium hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Wand2 className="h-3.5 w-3.5 text-amber-300" />
              <span>Auto-Fix All to APA 7th</span>
            </button>
          )}
        </div>

        {/* Scrollable Audit List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {audits.map(({ source, audit }) => {
            const isExpanded = expandedSourceId === source.id;
            const hasErrors = audit.checks.some(c => !c.passed && c.severity === 'error');
            const hasWarnings = audit.checks.some(c => !c.passed && c.severity === 'warning');

            return (
              <div
                key={source.id}
                className={`border transition-all ${
                  audit.isCompliant
                    ? 'border-stone-200 bg-white'
                    : hasErrors
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-amber-300 bg-amber-50/20'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedSourceId(isExpanded ? null : source.id)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-stone-50/70"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                        <span className="font-semibold text-stone-900">
                          {source.authors[0] || 'Unknown'} ({source.year})
                        </span>
                        <span>·</span>
                        <span>{source.journal}</span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-stone-900 truncate mt-0.5">
                        {source.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-stone-500">Score:</span>
                      <span className={`font-bold ${
                        audit.score >= 85 ? 'text-emerald-700' : audit.score >= 70 ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {audit.score}%
                      </span>
                    </div>

                    {!audit.isCompliant && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFixSingleSource(source);
                        }}
                        className="flex items-center gap-1 bg-stone-900 text-white px-3 py-1 text-xs hover:bg-stone-800 transition-colors"
                      >
                        <Wand2 className="h-3 w-3 text-amber-300" />
                        <span>Fix</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-stone-200 p-4 space-y-4 bg-[#FAF9F7]">
                    {/* Live APA 7th Reference Preview */}
                    <div>
                      <span className="block text-[11px] font-mono uppercase text-stone-500 mb-1">
                        Formatted APA 7th Reference Entry:
                      </span>
                      <div 
                        className="bg-white border border-stone-200 p-3 text-xs text-stone-800 font-sans leading-relaxed apa-hanging-indent"
                        dangerouslySetInnerHTML={{ __html: formatApa7Html(source) }}
                      />
                    </div>

                    {/* Rule-by-rule Checklist */}
                    <div>
                      <span className="block text-[11px] font-mono uppercase text-stone-500 mb-2">
                        Rule Compliance Breakdown:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {audit.checks.map((check, cIdx) => (
                          <div
                            key={cIdx}
                            className={`flex items-start gap-2.5 p-2.5 text-xs border ${
                              check.passed
                                ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                                : check.severity === 'error'
                                ? 'border-rose-200 bg-rose-50 text-rose-950'
                                : 'border-amber-200 bg-amber-50 text-amber-950'
                            }`}
                          >
                            {check.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : check.severity === 'error' ? (
                              <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            )}

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold font-mono text-[11px]">
                                  {check.rule}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider font-mono">
                                  {check.passed ? 'PASSED' : check.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="mt-0.5 text-stone-700 leading-normal">
                                {check.message}
                              </p>
                              {check.fixSuggestion && !check.passed && (
                                <p className="mt-1 text-[11px] text-stone-500 italic">
                                  Recommendation: {check.fixSuggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4 bg-stone-50">
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>Complies with Section 9.1–9.51 of the Publication Manual of the APA (7th ed.)</span>
          </div>
          <button
            onClick={onClose}
            className="bg-stone-900 text-white px-5 py-2 text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
