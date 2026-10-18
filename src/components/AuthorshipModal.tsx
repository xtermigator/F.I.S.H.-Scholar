import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  FileCheck,
  Upload,
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers
} from 'lucide-react';
import { AuthorshipDossier, Assignment, Course, Institution, Citation } from '../types';

interface AuthorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: Assignment | null;
  course?: Course | null;
  institution?: Institution | null;
  dossier: AuthorshipDossier;
  citations: Citation[];
}

export const AuthorshipModal: React.FC<AuthorshipModalProps> = ({
  isOpen,
  onClose,
  assignment,
  course,
  institution,
  dossier,
  citations
}) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'reports_upload' | 'keystroke_trail'>('dossier');
  const [gptZeroScore, setGptZeroScore] = useState(96);
  const [zeroGptScore, setZeroGptScore] = useState(98);
  const [detectorNotes, setDetectorNotes] = useState('High burstiness, natural academic vocabulary variance.');

  // Live GPTZero Scan State
  const [gptZeroApiKey, setGptZeroApiKey] = useState<string>(
    localStorage.getItem('gptzero_api_key_custom') || ''
  );
  const [isScanningGptZero, setIsScanningGptZero] = useState(false);
  const [gptZeroLiveResult, setGptZeroLiveResult] = useState<any | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleRunLiveGptZeroScan = async () => {
    const draftText =
      assignment?.drafts[0]?.content ||
      'Universal Design for Learning establishes proactive pedagogical scaffolding that eliminates retrofitted accommodations.';

    setIsScanningGptZero(true);
    setScanMessage(null);

    try {
      if (gptZeroApiKey) {
        localStorage.setItem('gptzero_api_key_custom', gptZeroApiKey);
      }

      const res = await fetch('/api/gptzero/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: draftText,
          apiKey: gptZeroApiKey || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setGptZeroLiveResult(data);
        setGptZeroScore(data.humanPercentage);
        setDetectorNotes(
          `GPTZero Scan (${data.mode}): ${data.humanPercentage}% Human, ${data.aiPercentage}% AI. Burstiness index: ${data.burstinessScore}. ${data.feedback || ''}`
        );
        setScanMessage(`Scan complete: ${data.humanPercentage}% Human Authenticity confirmed.`);
      } else {
        setScanMessage(`Scan error: ${data.error || 'Check API key or draft content'}`);
      }
    } catch (err: any) {
      setScanMessage(`Connection failed: ${err.message}`);
    } finally {
      setIsScanningGptZero(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-6 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-neutral-900">
                  Authorship & Academic Provenance Record
                </h2>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  Verified Scholar Dossier
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-sans">
                Transparent intellectual development trail, revision history, and detector evidence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="flex border-b border-neutral-200 px-6 pt-3 gap-4 text-xs bg-neutral-50/50">
          <button
            onClick={() => setActiveTab('dossier')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'dossier'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Verified Authorship Dossier
          </button>
          <button
            onClick={() => setActiveTab('reports_upload')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'reports_upload'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Upload GPTZero / ZeroGPT Reports
          </button>
          <button
            onClick={() => setActiveTab('keystroke_trail')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'keystroke_trail'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Revision Timeline & Source Trail
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'dossier' && (
            <div className="space-y-5">
              {/* Dossier Certificate Header */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-semibold">
                      OFFICIAL SCHOLAR INTEGRITY CERTIFICATE
                    </span>
                    <h3 className="text-xl font-serif font-bold text-neutral-900 mt-1">
                      {assignment?.title || dossier.title}
                    </h3>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Student: <span className="text-neutral-900 font-semibold">{dossier.studentName}</span> • {institution?.name || dossier.institutionName} ({course?.code || dossier.courseCode})
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-center rounded-xl bg-neutral-50 border border-neutral-200 p-2.5 min-w-[100px] shadow-xs">
                      <div className="text-2xl font-bold font-mono text-emerald-700">{dossier.authenticVoiceScore}%</div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Voice Match</div>
                    </div>
                    <div className="text-center rounded-xl bg-neutral-50 border border-neutral-200 p-2.5 min-w-[100px] shadow-xs">
                      <div className="text-2xl font-bold font-mono text-amber-700">{dossier.sourcesVerifiedCount}</div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">APA Sources</div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-700 leading-relaxed font-sans italic bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200">
                  "{dossier.dossierSummary}"
                </p>

                {/* 3-Stage Development Progression */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                    Documented Intellectual Progression:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {dossier.draftsHistory.map((stg, i) => (
                      <div key={i} className="rounded-xl bg-neutral-50/70 p-3 border border-neutral-200 text-xs space-y-1 shadow-xs">
                        <div className="flex items-center justify-between text-[10px] text-amber-800 font-medium">
                          <span>Stage {i + 1}</span>
                          <span>{stg.wordCount} words</span>
                        </div>
                        <div className="font-semibold text-neutral-900 text-xs">{stg.stage}</div>
                        <p className="text-[11px] text-neutral-600 font-sans">{stg.summaryOfEdits}</p>
                        <div className="text-[10px] text-neutral-400 font-mono pt-1">{stg.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detector Reports Embedded */}
                <div className="pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-2">
                    Attached Originality & AI Detector Evidence:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dossier.aiDetectorReports.map((rep, idx) => (
                      <div key={idx} className="rounded-xl bg-neutral-50/70 p-3.5 border border-neutral-200 text-xs space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900">{rep.tool} Report</span>
                          <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                            {rep.reportedHumanLikelihood}% Human Authored
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 font-sans">{rep.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports_upload' && (
            <div className="space-y-5">
              {/* Live GPTZero Integration Panel */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs">
                      Z
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-neutral-900 text-sm">
                        Live GPTZero Account & Authenticity Scan
                      </h4>
                      <p className="text-[11px] text-neutral-600">
                        Connect to GPTZero API for verified burstiness, perplexity, and AI/Human score
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRunLiveGptZeroScan}
                    disabled={isScanningGptZero}
                    className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shadow-xs"
                    id="run-gptzero-live-scan-btn"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isScanningGptZero ? 'animate-spin' : ''}`} />
                    <span>{isScanningGptZero ? 'Scanning Draft with GPTZero...' : 'Run Live GPTZero Scan'}</span>
                  </button>
                </div>

                {/* API Key Input (Optional custom override) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      GPTZero API Key (Optional custom key; server environment key used by default)
                    </label>
                    <input
                      type="password"
                      value={gptZeroApiKey}
                      onChange={(e) => setGptZeroApiKey(e.target.value)}
                      placeholder="Paste your GPTZero API key or leave blank to use server environment..."
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 font-mono focus:border-neutral-900 focus:outline-none"
                    />
                  </div>
                  <div className="text-[11px] text-neutral-500 pt-3">
                    Scans: <span className="font-semibold text-neutral-800">"{assignment?.title || 'Current Paper Draft'}"</span>
                  </div>
                </div>

                {/* Live Scan Results Display */}
                {gptZeroLiveResult && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <span className="font-bold text-xs text-emerald-900">
                          GPTZero Scan Verification Complete ({gptZeroLiveResult.mode})
                        </span>
                      </div>
                      <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {gptZeroLiveResult.predictedClass} Authorship
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white rounded-lg p-2 border border-emerald-200">
                        <div className="text-xl font-bold font-mono text-emerald-700">
                          {gptZeroLiveResult.humanPercentage}%
                        </div>
                        <div className="text-[10px] text-neutral-500">Human Authenticity</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-emerald-200">
                        <div className="text-xl font-bold font-mono text-amber-700">
                          {gptZeroLiveResult.burstinessScore}
                        </div>
                        <div className="text-[10px] text-neutral-500">Burstiness Index</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-emerald-200">
                        <div className="text-xl font-bold font-mono text-neutral-600">
                          {gptZeroLiveResult.aiPercentage}%
                        </div>
                        <div className="text-[10px] text-neutral-500">AI Probability</div>
                      </div>
                    </div>

                    {gptZeroLiveResult.feedback && (
                      <p className="text-[11px] text-neutral-700 italic">
                        "{gptZeroLiveResult.feedback}"
                      </p>
                    )}
                  </div>
                )}

                {scanMessage && !gptZeroLiveResult && (
                  <div className="rounded-lg bg-amber-100/80 p-2.5 text-xs text-amber-900">
                    {scanMessage}
                  </div>
                )}
              </div>

              {/* Manual Report Attachment */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-neutral-900 text-base">
                  Upload Additional AI Detector Evidence (ZeroGPT / Turnitin / PDF Export)
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                  Instead of attempting to manipulate AI detectors with "humanizer" tools, upload your authentic originality reports to establish a transparent academic record that protects your scholarship.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-5 text-center space-y-2">
                    <Upload className="h-6 w-6 text-amber-700 mx-auto" />
                    <div className="text-xs font-semibold text-neutral-900">Recorded Human Score</div>
                    <div className="text-[10px] text-neutral-500">Auto-filled by GPTZero live scan or edit manually</div>
                    <input
                      type="number"
                      value={gptZeroScore}
                      onChange={(e) => setGptZeroScore(Number(e.target.value))}
                      placeholder="Human Score % (e.g. 96)"
                      className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-xs text-neutral-900 text-center focus:border-neutral-900 focus:outline-none shadow-xs"
                    />
                  </div>

                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-5 text-center space-y-2">
                    <Upload className="h-6 w-6 text-blue-700 mx-auto" />
                    <div className="text-xs font-semibold text-neutral-900">Upload ZeroGPT / Turnitin Report</div>
                    <div className="text-[10px] text-neutral-500">Drag and drop report files or click to browse</div>
                    <input
                      type="number"
                      value={zeroGptScore}
                      onChange={(e) => setZeroGptScore(Number(e.target.value))}
                      placeholder="Human Score % (e.g. 98)"
                      className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-xs text-neutral-900 text-center focus:border-neutral-900 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Notes on Detector Findings & Burstiness
                  </label>
                  <textarea
                    rows={3}
                    value={detectorNotes}
                    onChange={(e) => setDetectorNotes(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none shadow-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Evidence attaches directly to permanent Dossier
                  </span>
                  <button
                    onClick={() => {
                      // Update dossier reports
                      dossier.aiDetectorReports = [
                        {
                          tool: 'GPTZero',
                          reportedHumanLikelihood: gptZeroScore,
                          reportedAiLikelihood: 100 - gptZeroScore,
                          notes: detectorNotes
                        },
                        {
                          tool: 'ZeroGPT',
                          reportedHumanLikelihood: zeroGptScore,
                          reportedAiLikelihood: 100 - zeroGptScore,
                          notes: 'Corroborating originality report.'
                        }
                      ];
                      dossier.authenticVoiceScore = Math.round((gptZeroScore + zeroGptScore) / 2);
                      setActiveTab('dossier');
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white cursor-pointer shadow-xs"
                  >
                    Save Reports into Dossier
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keystroke_trail' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-neutral-900 text-base">
                  Audit Trail of Cited References & Academic Memory
                </h3>
                <p className="text-xs text-neutral-600 font-sans">
                  Every citation in this paper is linked to primary literature indexed in your master vault:
                </p>

                <div className="space-y-2.5">
                  {citations.map((cit) => (
                    <div key={cit.id} className="rounded-xl bg-neutral-50/70 p-3 border border-neutral-200 text-xs shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{cit.inText}</span>
                        <span className="text-[10px] text-neutral-500">{cit.institutionOrigin}</span>
                      </div>
                      <div className="text-neutral-800 mt-1 font-serif">{cit.apa7}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
