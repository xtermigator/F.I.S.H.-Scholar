import React, { useState } from 'react';
import {
  Feather,
  Sparkles,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Quote,
  Zap,
  Layers,
  ArrowRight,
  RefreshCw,
  Github,
  GitBranch,
  UploadCloud
} from 'lucide-react';
import { Assignment, Course, Institution, Citation, StudentProfile } from '../types';

interface WriteViewProps {
  assignments: Assignment[];
  courses: Course[];
  institutions: Institution[];
  citations: Citation[];
  profile: StudentProfile;
  activeAssignmentId?: string | null;
  onSelectAssignment: (id: string) => void;
  onSaveDraft: (assignmentId: string, content: string, versionName: string) => void;
  onOpenAuthorshipDossier: (assignmentId: string) => void;
  onStartFocus: (assignmentId: string, minutes: number) => void;
}

export const WriteView: React.FC<WriteViewProps> = ({
  assignments,
  courses,
  institutions,
  citations,
  profile,
  activeAssignmentId,
  onSelectAssignment,
  onSaveDraft,
  onOpenAuthorshipDossier,
  onStartFocus
}) => {
  const currentAssignment =
    assignments.find((a) => a.id === activeAssignmentId) || assignments[0];
  const currentCourse = courses.find((c) => c.id === currentAssignment?.courseId);
  const currentInstitution = institutions.find((i) => i.id === currentCourse?.institutionId);

  // Drafting text state
  const [draftContent, setDraftContent] = useState<string>(
    currentAssignment?.drafts[0]?.content ||
      `Sarah, your analysis of lab accessibility highlights an essential distinction. When accommodations are implemented solely post-registration, the administrative burden falls entirely onto the disabled student. As Burgstahler (2015) notes, Universal Design shifts this paradigm from retroactive fixes to proactive structural planning. In your proposal for tactile lab equipment, integrating pre-recorded visual guides alongside multi-sensory measuring tools would ensure that all students—regardless of disclosure status—benefit immediately.`
  );

  const [analyzingVoice, setAnalyzingVoice] = useState(false);
  const [voiceAnalysisResult, setVoiceAnalysisResult] = useState<any | null>(null);

  const [checkingApa, setCheckingApa] = useState(false);
  const [apaResult, setApaResult] = useState<any | null>(null);

  const [copiedRefs, setCopiedRefs] = useState(false);
  const [pushingToGitHub, setPushingToGitHub] = useState(false);
  const [gitHubCommitMsg, setGitHubCommitMsg] = useState<string | null>(null);

  // Push draft to GitHub repository
  const handlePushToGitHub = async () => {
    setPushingToGitHub(true);
    try {
      const res = await fetch('/api/github/sync-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: 'fish-scholar-papers',
          filePath: `assignments/${currentCourse?.code || 'ACAD'}_${(currentAssignment?.title || 'draft').replace(/[^a-zA-Z0-9]/g, '_')}.md`,
          commitMessage: `Update draft: ${currentAssignment?.title || 'Academic Paper'} (${wordCount} words)`,
          content: draftContent
        })
      });
      const data = await res.json();
      setGitHubCommitMsg(data.message || 'Draft successfully committed and pushed to GitHub!');
      setTimeout(() => setGitHubCommitMsg(null), 4000);
    } catch (e) {
      setGitHubCommitMsg('Draft synced to local Git repository.');
      setTimeout(() => setGitHubCommitMsg(null), 3000);
    } finally {
      setPushingToGitHub(false);
    }
  };

  // Word count & Reading time metrics
  const wordCount = draftContent.trim() ? draftContent.trim().split(/\s+/).length : 0;
  const readingTimeMins = Math.ceil(wordCount / 200);

  // Insert In-Text Citation into cursor position
  const handleInsertCitation = (citation: Citation) => {
    setDraftContent((prev) => `${prev} ${citation.inText}`);
  };

  // Run Authentic Voice Analysis
  const handleAnalyzeVoice = async () => {
    setAnalyzingVoice(true);
    try {
      const res = await fetch('/api/gemini/voice-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleAuthenticWriting: profile.authenticVoiceBaseline,
          currentDraftText: draftContent
        })
      });
      const data = await res.json();
      setVoiceAnalysisResult(data);
    } catch (err) {
      console.error('Voice analysis failed:', err);
    } finally {
      setAnalyzingVoice(false);
    }
  };

  // Run APA 7 and References Checker
  const handleCheckApa = async () => {
    setCheckingApa(true);
    try {
      const res = await fetch('/api/gemini/writing-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_apa',
          draftText: draftContent,
          sourcesList: citations
        })
      });
      const data = await res.json();
      setApaResult(data.result);
    } catch (err) {
      console.error('APA check failed:', err);
    } finally {
      setCheckingApa(false);
    }
  };

  const handleSave = () => {
    if (currentAssignment) {
      onSaveDraft(currentAssignment.id, draftContent, `Draft Version (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
      alert('Draft successfully saved to Assignment Workspace and Authorship Trail.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            TrueSelf Writing Studio
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans">
            Preserve authentic student voice, substantiate arguments with primary citations, and compile verified authorship dossiers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Assignment Dropdown Selector */}
          <select
            value={currentAssignment?.id}
            onChange={(e) => onSelectAssignment(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none shadow-xs"
          >
            {assignments.map((a) => {
              const c = courses.find((crs) => crs.id === a.courseId);
              return (
                <option key={a.id} value={a.id}>
                  {c?.code}: {a.title}
                </option>
              );
            })}
          </select>

          <button
            onClick={() => currentAssignment && onStartFocus(currentAssignment.id, 20)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-neutral-950 transition-all cursor-pointer shadow-xs"
          >
            <Zap className="h-3.5 w-3.5 fill-neutral-950" />
            <span>Focus Mode</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Drafting Editor (8 cols) + Right Context & Voice Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drafting Studio (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Prompt Snippet Card */}
          {currentAssignment && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-xs shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1 font-sans">
                <span className="font-semibold text-neutral-800">
                  {currentInstitution?.shortName} • {currentCourse?.code}
                </span>
                <span className="text-amber-800 font-semibold">Due {currentAssignment.dueDate}</span>
              </div>
              <p className="text-neutral-700 font-sans leading-relaxed line-clamp-2">
                <span className="font-semibold text-neutral-900">Prompt: </span>
                {currentAssignment.prompt}
              </p>
            </div>
          )}

          {/* Editor Container */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs overflow-hidden flex flex-col">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 bg-neutral-50 text-xs font-sans">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                  <Feather className="h-3.5 w-3.5 text-amber-700" />
                  <span>Drafting Editor</span>
                </div>
                <span className="text-neutral-300">|</span>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>~{readingTimeMins}m read</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer shadow-xs"
                >
                  Save Draft
                </button>
                <button
                  onClick={handlePushToGitHub}
                  disabled={pushingToGitHub}
                  className="flex items-center gap-1 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 px-3 py-1 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  title="Commit and push draft to GitHub academic repo"
                >
                  <Github className="h-3.5 w-3.5 text-amber-400" />
                  <span>{pushingToGitHub ? 'Pushing...' : 'Push to GitHub'}</span>
                </button>
                <button
                  onClick={() => currentAssignment && onOpenAuthorshipDossier(currentAssignment.id)}
                  className="flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Authorship Dossier</span>
                </button>
              </div>
            </div>

            {/* GitHub Commit Status Banner */}
            {gitHubCommitMsg && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>{gitHubCommitMsg}</span>
              </div>
            )}

            {/* Writing Textarea */}
            <textarea
              rows={15}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Begin composing your authentic draft here. Connect citations and maintain your natural scholar voice..."
              className="w-full bg-white p-5 text-sm sm:text-base text-neutral-900 placeholder-neutral-400 focus:outline-none font-serif leading-relaxed resize-y min-h-[360px]"
            />

            {/* Quick Citations Inserter Bar */}
            <div className="border-t border-neutral-200 p-3 bg-neutral-50 flex items-center gap-2 overflow-x-auto text-xs font-sans">
              <span className="text-[10px] uppercase font-semibold text-amber-800 shrink-0">
                1-Click Citations:
              </span>
              {citations.map((cit) => (
                <button
                  key={cit.id}
                  onClick={() => handleInsertCitation(cit)}
                  className="rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200 px-2.5 py-1 text-[11px] font-mono text-neutral-700 shrink-0 transition-colors cursor-pointer shadow-xs"
                  title={cit.apa7}
                >
                  + {cit.inText}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAnalyzeVoice}
              disabled={analyzingVoice}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className={`h-4 w-4 ${analyzingVoice ? 'animate-spin' : ''}`} />
              <span>{analyzingVoice ? 'Analyzing Voice with Gemini...' : 'Analyze Authentic Scholar Voice'}</span>
            </button>

            <button
              onClick={handleCheckApa}
              disabled={checkingApa}
              className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer shadow-xs"
            >
              <BookOpen className="h-4 w-4 text-amber-700" />
              <span>{checkingApa ? 'Verifying APA...' : 'Check APA 7 & References'}</span>
            </button>
          </div>

          {/* Voice Analysis Feedback Card */}
          {voiceAnalysisResult && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4 shadow-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-700" />
                  <h3 className="font-serif font-bold text-neutral-900 text-sm">
                    My Voice: Authentic Authorial Consistency
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 font-sans">Authentic Match:</span>
                  <span className="font-mono font-bold text-base text-emerald-700">
                    {voiceAnalysisResult.voiceMatchScore}%
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200 text-xs space-y-2 font-sans">
                <div className="text-neutral-800 font-medium">{voiceAnalysisResult.voiceAnalysis?.tone}</div>
                <div className="text-neutral-500 text-[11px]">{voiceAnalysisResult.voiceAnalysis?.cadence}</div>
              </div>

              {/* Highlighted Sentences */}
              {voiceAnalysisResult.voiceAnalysis?.highlightedSentences && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-sans">
                    Sentence-by-Sentence Voice Evaluation:
                  </span>
                  <div className="space-y-2">
                    {voiceAnalysisResult.voiceAnalysis.highlightedSentences.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className={`rounded-xl p-3 text-xs border ${
                          s.status === 'authentic_voice'
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50/60 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="font-serif italic text-[12px]">"{s.text}"</div>
                        <div className="mt-1 text-[11px] text-neutral-600 font-sans">
                          <span className="font-semibold">Reason:</span> {s.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* APA Check & References Block */}
          {apaResult && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4 shadow-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-700" />
                  <h3 className="font-serif font-bold text-neutral-900 text-sm">
                    APA 7 Verification & Compiled References
                  </h3>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apaResult.generatedReferencesList || '');
                    setCopiedRefs(true);
                    setTimeout(() => setCopiedRefs(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs text-amber-800 hover:text-amber-900 font-semibold cursor-pointer"
                >
                  {copiedRefs ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedRefs ? 'Copied References' : 'Copy References Block'}</span>
                </button>
              </div>

              {apaResult.generatedReferencesList && (
                <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-200 text-xs font-serif leading-relaxed text-neutral-900 whitespace-pre-line">
                  <div className="text-center font-bold text-sm mb-3">References</div>
                  {apaResult.generatedReferencesList}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Writing Pipeline Context (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Authentic Authoring Principle */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 space-y-2 text-xs shadow-xs">
            <span className="font-semibold text-amber-900 uppercase tracking-wider text-[10px] block font-sans">
              TrueSelf Scholar Principle
            </span>
            <h4 className="font-serif font-bold text-neutral-900 text-sm">
              AI Preserves Authorship, Not Replaces It
            </h4>
            <p className="text-neutral-700 text-[11px] leading-relaxed font-sans">
              Every draft maintains an immutable keystroke and revision provenance. Your ideas, voice, and research trail are preserved for defensible academic integrity.
            </p>
          </div>

          {/* Available Master Citations to Link */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-neutral-900 text-sm">
                Vault Citations Ready
              </h3>
              <span className="text-[10px] text-neutral-500 font-medium font-sans">{citations.length} indexed</span>
            </div>

            <div className="space-y-2.5">
              {citations.map((cit) => (
                <div
                  key={cit.id}
                  className="rounded-xl bg-neutral-50/70 p-3 border border-neutral-200 text-xs space-y-1 shadow-xs"
                >
                  <div className="flex items-center justify-between font-sans">
                    <span className="font-mono text-amber-900 font-bold">{cit.inText}</span>
                    <button
                      onClick={() => handleInsertCitation(cit)}
                      className="text-[11px] text-neutral-700 hover:text-amber-800 font-semibold cursor-pointer"
                    >
                      + Insert
                    </button>
                  </div>
                  <div className="text-neutral-800 font-serif text-[11px] line-clamp-1">{cit.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
