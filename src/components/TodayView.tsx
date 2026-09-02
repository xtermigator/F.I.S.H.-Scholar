import React from 'react';
import {
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText,
  Calendar,
  Layers,
  Compass,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import {
  Institution,
  Course,
  Assignment,
  Citation,
  AcademicMemoryNode,
  StudentProfile,
  TabType
} from '../types';

interface TodayViewProps {
  institutions: Institution[];
  courses: Course[];
  assignments: Assignment[];
  citations: Citation[];
  academicMemory: AcademicMemoryNode[];
  profile: StudentProfile;
  onNavigateTab: (tab: TabType) => void;
  onStartFocus: (assignmentId: string, minutes: number) => void;
  onOpenAssignment: (assignmentId: string) => void;
  onAskCoach: (contextPrompt: string) => void;
  onOpenSyllabusIntelligence: (courseId?: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  institutions,
  courses,
  assignments,
  citations,
  academicMemory,
  profile,
  onNavigateTab,
  onStartFocus,
  onOpenAssignment,
  onAskCoach,
  onOpenSyllabusIntelligence
}) => {
  // Determine urgent item
  const urgentAssignment = assignments.find((a) => a.urgency === 'urgent_tonight') || assignments[0];
  const upcomingAssignments = assignments.filter((a) => a.id !== urgentAssignment?.id);

  // Group courses by institution
  const getCourseForInst = (instId: string) => courses.filter((c) => c.institutionId === instId);
  const getAssignmentForCourse = (courseId: string) => assignments.find((a) => a.courseId === courseId);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Personalized Master Header & Salutation */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider text-amber-800 uppercase font-sans">
                TrueSelf Command Center
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs text-neutral-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
              Good afternoon, {profile.name.split(' ')[0]}.
            </h1>
            <p className="mt-1 text-sm text-neutral-600 max-w-2xl font-sans leading-relaxed">
              Your multi-university academic operating system is in sync. 3 institutions, {courses.length} active courses, {citations.length} indexed APA citations, and cross-course academic memory linked.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('FOCUS')}
              className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
            >
              <Zap className="h-4 w-4 text-amber-700" />
              <span>Daily Check-In</span>
            </button>
            <button
              onClick={() => onOpenSyllabusIntelligence()}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Syllabus AI</span>
            </button>
          </div>
        </div>

        {/* Multi-College Live Pulse Cards (The Triad: MSU, CUNY SPS, UF) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {institutions.map((inst) => {
            const instCourses = getCourseForInst(inst.id);
            const primaryCourse = instCourses[0];
            const courseAsg = primaryCourse ? getAssignmentForCourse(primaryCourse.id) : null;

            return (
              <div
                key={inst.id}
                className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 transition-all hover:border-neutral-300 hover:bg-white hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{inst.logo}</span>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                        {inst.name}
                      </h3>
                    </div>
                    <span className="text-[10px] text-neutral-500">{inst.currentSemester}</span>
                  </div>

                  {primaryCourse && (
                    <div className="mt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-neutral-900 text-sm">
                          {primaryCourse.code}
                        </span>
                        <span className="text-[11px] text-neutral-600 font-sans truncate max-w-[140px]">
                          {primaryCourse.title}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="mt-3">
                    {courseAsg ? (
                      <div className="flex items-center gap-2">
                        {courseAsg.urgency === 'urgent_tonight' && (
                          <div className="flex items-center gap-1.5 rounded-md bg-amber-100 border border-amber-300 px-2 py-1 text-xs text-amber-900 font-medium">
                            <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                            <span>Peer response due tonight</span>
                          </div>
                        )}
                        {courseAsg.urgency === 'due_soon' && (
                          <div className="flex items-center gap-1.5 rounded-md bg-sky-50 border border-sky-200 px-2 py-1 text-xs text-sky-900 font-medium">
                            <span className="h-2 w-2 rounded-full bg-sky-600" />
                            <span>Discussion due Thursday</span>
                          </div>
                        )}
                        {courseAsg.urgency === 'on_track' && (
                          <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs text-emerald-900 font-medium">
                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                            <span>No immediate deadline</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs text-emerald-900 font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                        <span>All deliverables on track</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-200/80 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Prof. {primaryCourse?.professor.name.split(' ').slice(-1)[0]}</span>
                  <button
                    onClick={() => {
                      if (courseAsg) onOpenAssignment(courseAsg.id);
                      else onNavigateTab('COURSES');
                    }}
                    className="text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BEST NEXT ACTION (HERO COMPONENT) */}
      {urgentAssignment && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex h-6 items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-neutral-950">
                  <Zap className="h-3 w-3 fill-neutral-950" />
                  Recommended Best Next Step
                </span>
                <span className="text-xs text-amber-900 font-medium">
                  Mississippi State • ED 9413
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">
                Finish ED 9413 peer response — approximately {urgentAssignment.estimatedMinutes} minutes.
              </h2>

              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-sans">
                {urgentAssignment.prompt}
              </p>

              {/* Progress checklist preview */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  1/4 tasks completed
                </span>
                <span>•</span>
                <span className="text-neutral-700">
                  Next micro-step: Draft 250-word response connecting Burgstahler UDL framework
                </span>
              </div>
            </div>

            {/* 3 Core Action Buttons requested */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 min-w-[220px]">
              <button
                onClick={() => onStartFocus(urgentAssignment.id, urgentAssignment.estimatedMinutes)}
                id="today-start-focus-btn"
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="h-4 w-4 fill-neutral-950" />
                <span>START FOCUS ({urgentAssignment.estimatedMinutes}m)</span>
              </button>

              <button
                onClick={() => onOpenAssignment(urgentAssignment.id)}
                id="today-open-assignment-btn"
                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-800 transition-all cursor-pointer shadow-xs"
              >
                <BookOpen className="h-4 w-4 text-amber-700" />
                <span>OPEN ASSIGNMENT</span>
              </button>

              <button
                onClick={() => onAskCoach(`I need to finish my ED 9413 peer response due tonight. Can you help me organize the 250-word synthesis using Burgstahler (2015)?`)}
                id="today-ask-coach-btn"
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-100 hover:bg-amber-200/80 px-4 py-2.5 text-xs font-semibold text-amber-900 transition-all cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-amber-700" />
                <span>ASK MY COACH</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Academic Knowledge & Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Academic Memory Knowledge Graph Cross-School Discovery */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-neutral-900 text-sm">
                    Cross-School Academic Memory
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Synergies discovered across CUNY SPS, UF, and Mississippi State
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('LIBRARY')}
                className="text-xs text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Knowledge Graph</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3">
              {academicMemory.map((node) => (
                <div
                  key={node.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 hover:border-neutral-300 hover:bg-white transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-neutral-900 text-xs font-serif">
                      {node.concept}
                    </h4>
                    <span className="text-[10px] rounded-md bg-neutral-200/70 px-2 py-0.5 text-neutral-700 shrink-0 font-medium">
                      {node.originInstitution}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed font-sans">
                    {node.coreInsight}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1 text-neutral-500">
                      <span className="text-amber-800 font-semibold">Relevance:</span>
                      <span>{node.crossSchoolApplications[0]?.targetCourseCode}</span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('WRITE')}
                      className="text-amber-800 hover:underline font-semibold text-[11px] cursor-pointer"
                    >
                      Use in Active Draft →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Citation Vault Preview */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-neutral-900 text-sm">
                    Master APA 7 Citation Vault
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {citations.length} verified scholarly references ready to cite
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('LIBRARY')}
                className="text-xs text-amber-800 hover:text-amber-950 font-semibold cursor-pointer"
              >
                Browse All ({citations.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {citations.slice(0, 4).map((cit) => (
                <div
                  key={cit.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 flex flex-col justify-between hover:bg-white hover:border-neutral-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-amber-800 mb-1">
                      <span className="font-mono font-bold">{cit.inText}</span>
                      <span className="text-neutral-500">{cit.institutionOrigin || 'Multi-course'}</span>
                    </div>
                    <p className="text-xs font-serif text-neutral-900 line-clamp-2 font-medium">
                      {cit.title}
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] text-neutral-500 truncate">
                    {cit.source}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Accommodations, Daily Habits & Upcoming */}
        <div className="space-y-4">
          {/* Active SAS Accommodations */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-rose-600" />
              <h3 className="font-serif font-bold text-neutral-900 text-sm">
                Active Accommodations
              </h3>
            </div>
            <div className="space-y-2.5">
              {profile.accessAccommodations.map((acc) => (
                <div
                  key={acc.id}
                  className="rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-neutral-900">
                    <span>{acc.title}</span>
                    <span className="font-mono text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">{acc.code}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-600 leading-relaxed">{acc.details}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigateTab('ME')}
              className="mt-3 w-full rounded-xl border border-neutral-200 py-2 text-center text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-semibold cursor-pointer transition-colors"
            >
              Generate Professor Notice Email
            </button>
          </div>

          {/* Upcoming Schedule */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-amber-700" />
              <h3 className="font-serif font-bold text-neutral-900 text-sm">
                Upcoming Deadlines
              </h3>
            </div>
            <div className="space-y-2.5">
              {upcomingAssignments.map((asg) => (
                <div
                  key={asg.id}
                  onClick={() => onOpenAssignment(asg.id)}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-xs hover:border-neutral-300 hover:bg-white cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900 truncate pr-2">{asg.title}</span>
                    <span className="text-[10px] text-amber-800 font-semibold shrink-0">{asg.dueDate}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>{asg.weight}</span>
                    <span>~{asg.estimatedMinutes} mins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
