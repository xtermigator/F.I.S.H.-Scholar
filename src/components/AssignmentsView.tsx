import React, { useState } from 'react';
import {
  CheckSquare,
  Sparkles,
  Zap,
  BookOpen,
  Feather,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  ShieldCheck,
  ChevronRight,
  Plus,
  ArrowRight,
  Filter,
  GraduationCap
} from 'lucide-react';
import { Assignment, Course, Institution, Citation } from '../types';

interface AssignmentsViewProps {
  assignments: Assignment[];
  courses: Course[];
  institutions: Institution[];
  citations: Citation[];
  selectedAssignmentId?: string | null;
  onSelectAssignment: (id: string | null) => void;
  onStartFocus: (assignmentId: string, minutes: number) => void;
  onOpenWritingStudio: (assignmentId: string) => void;
  onToggleChecklistItem: (assignmentId: string, itemId: string) => void;
  onGenerateAuthorshipDossier: (assignmentId: string) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  courses,
  institutions,
  citations,
  selectedAssignmentId,
  onSelectAssignment,
  onStartFocus,
  onOpenWritingStudio,
  onToggleChecklistItem,
  onGenerateAuthorshipDossier
}) => {
  const [filterInstId, setFilterInstId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prompt' | 'checklist' | 'readings' | 'drafts' | 'rubric'>('prompt');
  const [deconstructing, setDeconstructing] = useState(false);
  const [deconstructedData, setDeconstructedData] = useState<any | null>(null);

  // Active selected assignment
  const activeAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];
  const activeCourse = courses.find((c) => c.id === activeAssignment?.courseId);
  const activeInstitution = institutions.find((i) => i.id === activeCourse?.institutionId);

  // Filtered assignments
  const filteredAssignments = assignments.filter((asg) => {
    if (!filterInstId) return true;
    const c = courses.find((crs) => crs.id === asg.courseId);
    return c?.institutionId === filterInstId;
  });

  const handleDeconstructPrompt = async () => {
    if (!activeAssignment) return;
    setDeconstructing(true);
    try {
      const res = await fetch('/api/gemini/writing-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deconstruct_prompt',
          promptText: activeAssignment.prompt,
          rubricText: activeAssignment.rubric
        })
      });
      const data = await res.json();
      if (data.result) {
        setDeconstructedData(data.result);
      }
    } catch (err) {
      console.error('Prompt deconstruction failed:', err);
    } finally {
      setDeconstructing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            Assignment Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans">
            Permanent academic workspaces with prompt intelligence, rubrics, draft history, and source tracking
          </p>
        </div>

        {/* School Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterInstId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterInstId === null
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border border-neutral-200'
            }`}
          >
            All Workspaces ({assignments.length})
          </button>
          {institutions.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setFilterInstId(filterInstId === inst.id ? null : inst.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 border transition-all cursor-pointer ${
                filterInstId === inst.id
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold shadow-xs'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <span>{inst.logo}</span>
              <span>{inst.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Layout: Left Assignment List + Right Deep Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assignment Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-1 font-sans">
            Active Deliverables ({filteredAssignments.length})
          </div>

          {filteredAssignments.map((asg) => {
            const course = courses.find((c) => c.id === asg.courseId);
            const inst = institutions.find((i) => i.id === course?.institutionId);
            const isSelected = activeAssignment?.id === asg.id;
            const completedCount = asg.checklist.filter((i) => i.completed).length;

            return (
              <button
                key={asg.id}
                onClick={() => onSelectAssignment(asg.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80 text-neutral-800 shadow-xs'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                )}

                <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                  <span className="font-semibold text-neutral-700">
                    {inst?.shortName} • {course?.code}
                  </span>
                  <span className={`font-semibold ${
                    asg.urgency === 'urgent_tonight' ? 'text-amber-800' : 'text-neutral-500'
                  }`}>
                    {asg.dueDate}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-neutral-900 text-sm line-clamp-1">
                  {asg.title}
                </h3>
                <p className="text-xs text-neutral-600 line-clamp-2 mt-1 font-sans">
                  {asg.prompt}
                </p>

                {/* Progress Footer */}
                <div className="mt-3 pt-2.5 border-t border-neutral-200/80 flex items-center justify-between text-[11px] text-neutral-500">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>{completedCount}/{asg.checklist.length} checklist</span>
                  </div>
                  <span className="text-amber-800 font-semibold">~{asg.estimatedMinutes}m</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Deep Assignment Workspace (8 cols) */}
        {activeAssignment && (
          <div className="lg:col-span-8 space-y-4">
            {/* Top Workspace Banner */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                      {activeInstitution?.name}
                    </span>
                    <span className="text-xs text-neutral-300">•</span>
                    <span className="text-xs text-neutral-700 font-medium">{activeCourse?.code}</span>
                    <span className="text-xs text-neutral-300">•</span>
                    <span className="text-xs text-amber-800 font-semibold">{activeAssignment.dueDate} ({activeAssignment.dueTime})</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">
                    {activeAssignment.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-sans">
                    <span>{activeAssignment.points} Points</span>
                    <span>•</span>
                    <span>{activeAssignment.weight}</span>
                    <span>•</span>
                    <span>Est. Time: {activeAssignment.estimatedMinutes} Mins</span>
                  </div>
                </div>

                {/* Action Launchers */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onStartFocus(activeAssignment.id, activeAssignment.estimatedMinutes)}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-all cursor-pointer shadow-xs"
                  >
                    <Zap className="h-3.5 w-3.5 fill-neutral-950" />
                    <span>Focus Now</span>
                  </button>

                  <button
                    onClick={() => onOpenWritingStudio(activeAssignment.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
                  >
                    <Feather className="h-3.5 w-3.5 text-amber-400" />
                    <span>Writing Studio</span>
                  </button>
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="mt-6 flex items-center gap-1 border-b border-neutral-200 pb-2 text-xs overflow-x-auto">
                {[
                  { id: 'prompt', label: 'Prompt & Objectives', icon: BookOpen },
                  { id: 'checklist', label: `Checklist (${activeAssignment.checklist.length})`, icon: CheckSquare },
                  { id: 'readings', label: `Required Readings (${activeAssignment.requiredReadings.length})`, icon: FileText },
                  { id: 'drafts', label: `Draft History (${activeAssignment.drafts.length})`, icon: Feather },
                  { id: 'rubric', label: 'Grading Rubric', icon: ShieldCheck }
                ].map((t) => {
                  const Icon = t.icon;
                  const isAct = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        isAct
                          ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isAct ? 'text-amber-400' : 'text-neutral-500'}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Display */}
              <div className="mt-4">
                {/* 1. Prompt Tab */}
                {activeTab === 'prompt' && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200 text-xs leading-relaxed text-neutral-800">
                      <div className="text-neutral-500 text-[11px] font-semibold uppercase mb-1">
                        Professor's Prompt & Directions
                      </div>
                      <p className="whitespace-pre-line font-sans text-neutral-800 leading-relaxed">
                        {activeAssignment.prompt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleDeconstructPrompt}
                        disabled={deconstructing}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer shadow-xs"
                      >
                        <Sparkles className={`h-4 w-4 text-amber-700 ${deconstructing ? 'animate-spin' : ''}`} />
                        <span>{deconstructing ? 'Deconstructing with AI...' : 'AI Prompt Roadmap Deconstruction'}</span>
                      </button>

                      <button
                        onClick={() => onGenerateAuthorshipDossier(activeAssignment.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-white border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="h-4 w-4 text-emerald-700" />
                        <span>Authorship Dossier</span>
                      </button>
                    </div>

                    {/* AI Deconstruction Card */}
                    {deconstructedData && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3 text-xs">
                        <div className="font-serif font-bold text-amber-900 text-sm flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-amber-700" />
                          Deconstructed Roadmap
                        </div>
                        <div className="text-neutral-800">
                          <span className="font-semibold text-amber-900">Core Intellectual Focus: </span>
                          {deconstructedData.coreQuestion}
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-800 block mb-1">Key Actionable Requirements:</span>
                          <ul className="list-disc list-inside space-y-1 text-neutral-600">
                            {deconstructedData.keyRequirements?.map((req: string, i: number) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        </div>
                        {deconstructedData.suggestedSections && (
                          <div>
                            <span className="font-semibold text-neutral-800 block mb-1">Recommended Section Breakdown:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                              {deconstructedData.suggestedSections.map((sec: any, i: number) => (
                                <div key={i} className="rounded-lg bg-white p-2.5 border border-neutral-200 shadow-xs">
                                  <div className="font-semibold text-amber-900">{sec.heading}</div>
                                  <div className="text-[10px] text-neutral-500 mt-0.5">{sec.focus} ({sec.targetWordCount} words)</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Checklist Tab */}
                {activeTab === 'checklist' && (
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-500 mb-2">
                      Micro-milestones designed for ADHD focus. Check off items as you make progress.
                    </div>
                    {activeAssignment.checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onToggleChecklistItem(activeAssignment.id, item.id)}
                        className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-colors cursor-pointer ${
                          item.completed
                            ? 'border-emerald-200 bg-emerald-50/50 text-neutral-400 line-through'
                            : 'border-neutral-200 bg-neutral-50/60 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-neutral-400 shrink-0" />
                          )}
                          <span>{item.text}</span>
                        </div>
                        {item.estimatedMinutes && (
                          <span className="text-[10px] text-neutral-500 font-mono">
                            ~{item.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Readings Tab */}
                {activeTab === 'readings' && (
                  <div className="space-y-3">
                    <div className="text-xs text-neutral-500 mb-2">
                      Required course literature connected directly to the Master APA Citation Vault.
                    </div>
                    {activeAssignment.requiredReadings.map((reading, idx) => (
                      <div key={idx} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 text-xs">
                        <div className="font-serif text-neutral-800 leading-relaxed font-medium">
                          {reading}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-neutral-200">
                          <span className="text-amber-800 font-mono font-medium">APA 7 Reference</span>
                          <button
                            onClick={() => onOpenWritingStudio(activeAssignment.id)}
                            className="text-neutral-600 hover:text-amber-800 font-semibold cursor-pointer"
                          >
                            Cite in Draft →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Drafts Tab */}
                {activeTab === 'drafts' && (
                  <div className="space-y-3">
                    {activeAssignment.drafts.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-xs text-neutral-500">
                        No drafts composed yet. Click "Writing Studio" to begin authentic drafting.
                      </div>
                    ) : (
                      activeAssignment.drafts.map((draft) => (
                        <div key={draft.id} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-neutral-900 text-xs">{draft.versionName}</span>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-sans">
                              <span>{draft.timestamp}</span>
                              <span>•</span>
                              <span className="text-amber-800 font-mono font-semibold">{draft.wordCount} words</span>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-700 font-sans leading-relaxed line-clamp-3 bg-white p-2.5 rounded-lg border border-neutral-200">
                            {draft.content}
                          </p>
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => onOpenWritingStudio(activeAssignment.id)}
                              className="text-xs text-amber-800 hover:underline font-semibold cursor-pointer"
                            >
                              Continue Editing in Writing Studio →
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 5. Rubric Tab */}
                {activeTab === 'rubric' && (
                  <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200 text-xs">
                    <div className="text-neutral-500 text-[11px] font-semibold uppercase mb-1">
                      Evaluation Criteria & Grading Standard
                    </div>
                    <pre className="whitespace-pre-line font-sans text-neutral-800 leading-relaxed">
                      {activeAssignment.rubric}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
