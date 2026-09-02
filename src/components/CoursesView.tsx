import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Mail,
  Video,
  Clock,
  ShieldCheck,
  Plus,
  ArrowRight,
  FileText,
  ExternalLink,
  ChevronRight,
  Scale,
  Bot
} from 'lucide-react';
import { Course, Institution, Assignment } from '../types';

interface CoursesViewProps {
  institutions: Institution[];
  courses: Course[];
  assignments: Assignment[];
  onOpenSyllabusModal: (courseId: string) => void;
  onOpenAssignment: (assignmentId: string) => void;
  onAddCourse: (newCourse: Course) => void;
  onAskCoach: (prompt: string) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  institutions,
  courses,
  assignments,
  onOpenSyllabusModal,
  onOpenAssignment,
  onAddCourse,
  onAskCoach
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);

  // Active selected course
  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const activeInstitution = institutions.find((i) => i.id === activeCourse?.institutionId);
  const courseAssignments = assignments.filter((a) => a.courseId === activeCourse?.id);

  // New course state
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newInstId, setNewInstId] = useState(institutions[0]?.id || '');
  const [newProfName, setNewProfName] = useState('');
  const [newProfEmail, setNewProfEmail] = useState('');

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newTitle) return;

    const created: Course = {
      id: `course-${Date.now()}`,
      institutionId: newInstId,
      code: newCode,
      title: newTitle,
      department: 'Academic Department',
      credits: 3,
      semester: 'Spring 2026',
      color: 'border-l-amber-500',
      professor: {
        name: newProfName || 'Dr. Professor',
        email: newProfEmail || 'prof@university.edu',
        officeHours: 'TBA via Zoom',
        preferredCommunication: 'Canvas Inbox or Email'
      },
      policies: {
        lateWork: 'Standard institutional policy.',
        attendance: 'Weekly participation required.',
        aiPolicy: 'AI allowed for research with documented attribution.',
        accommodations: 'Accommodations honored through disability services.'
      },
      gradingScale: [
        { id: 'g-new-1', item: 'Coursework & Projects', percentage: 70 },
        { id: 'g-new-2', item: 'Final Evaluation', percentage: 30 }
      ]
    };

    onAddCourse(created);
    setSelectedCourseId(created.id);
    setShowAddModal(false);
    setNewCode('');
    setNewTitle('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            My Colleges & Courses
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans">
            Unified multi-institution curriculum directory with automated syllabus intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSyllabusModal(selectedCourseId)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-amber-700" />
            <span>Syllabus Intelligence</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4 text-amber-400" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Left Sidebar of Courses + Right Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Course Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-1 font-sans">
            Enrolled Courses ({courses.length})
          </div>

          {courses.map((c) => {
            const inst = institutions.find((i) => i.id === c.institutionId);
            const isSelected = selectedCourseId === c.id;
            const asgCount = assignments.filter((a) => a.courseId === c.id).length;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
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
                  <div className="flex items-center gap-1.5">
                    <span>{inst?.logo}</span>
                    <span className="font-semibold text-neutral-700">{inst?.shortName}</span>
                  </div>
                  <span>{c.semester}</span>
                </div>

                <div className="font-serif font-bold text-neutral-900 text-base">
                  {c.code}
                </div>
                <div className="text-xs text-neutral-600 line-clamp-1 mt-0.5 font-sans">
                  {c.title}
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-200/80 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Prof. {c.professor.name.split(' ').slice(-1)[0]}</span>
                  <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-neutral-700 font-medium border border-neutral-200">
                    {asgCount} assignments
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Course Detail & Deep Intelligence (8 cols) */}
        {activeCourse && (
          <div className="lg:col-span-8 space-y-5">
            {/* Header Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                      {activeInstitution?.name}
                    </span>
                    <span className="text-xs text-neutral-300">•</span>
                    <span className="text-xs text-neutral-500">{activeCourse.semester}</span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-neutral-900">
                    {activeCourse.code}: {activeCourse.title}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1 font-sans">
                    {activeCourse.department} • {activeCourse.credits} Credits
                  </p>
                </div>

                <button
                  onClick={() => onOpenSyllabusModal(activeCourse.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-neutral-950 transition-all cursor-pointer shrink-0 shadow-xs"
                >
                  <Sparkles className="h-4 w-4 fill-neutral-950" />
                  <span>Update from Syllabus</span>
                </button>
              </div>

              {/* Professor Contact Banner */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-neutral-200">
                <div className="rounded-xl bg-neutral-50/70 p-3.5 border border-neutral-200">
                  <div className="flex items-center gap-2 text-neutral-700 text-xs font-medium mb-1">
                    <Mail className="h-3.5 w-3.5 text-amber-700" />
                    <span>Instructor</span>
                  </div>
                  <div className="font-semibold text-neutral-900 text-xs">{activeCourse.professor.name}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 truncate">{activeCourse.professor.email}</div>
                  <div className="text-[10px] text-neutral-400 mt-1">{activeCourse.professor.preferredCommunication}</div>
                </div>

                <div className="rounded-xl bg-neutral-50/70 p-3.5 border border-neutral-200">
                  <div className="flex items-center gap-2 text-neutral-700 text-xs font-medium mb-1">
                    <Video className="h-3.5 w-3.5 text-sky-700" />
                    <span>Office Hours & Communication</span>
                  </div>
                  <div className="text-xs text-neutral-800 font-medium">{activeCourse.professor.officeHours}</div>
                  {activeCourse.professor.zoomLink && (
                    <a
                      href={activeCourse.professor.zoomLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-amber-800 hover:underline mt-1 font-medium"
                    >
                      <span>Join Zoom Meeting</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Grading Breakdown & Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Grading Weights */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="h-4 w-4 text-amber-700" />
                  <h3 className="font-serif font-bold text-neutral-900 text-sm">
                    Grading Structure & Weighting
                  </h3>
                </div>
                <div className="space-y-3">
                  {activeCourse.gradingScale.map((grade) => (
                    <div key={grade.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-700 font-medium">{grade.item}</span>
                        <span className="font-mono font-semibold text-amber-800">{grade.percentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${grade.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies & Accommodation Directives */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <h3 className="font-serif font-bold text-neutral-900 text-sm">
                    Course Policies & Integrity
                  </h3>
                </div>

                <div className="rounded-xl bg-neutral-50/70 p-3 border border-neutral-200 text-xs">
                  <span className="font-semibold text-neutral-900 text-[11px] block">AI & Authorship Policy</span>
                  <p className="text-neutral-600 text-[11px] mt-1 leading-relaxed">
                    {activeCourse.policies.aiPolicy}
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50/40 p-3 border border-rose-100 text-xs">
                  <span className="font-semibold text-rose-900 text-[11px] block">Accommodations & Extensions</span>
                  <p className="text-rose-800 text-[11px] mt-1 leading-relaxed">
                    {activeCourse.policies.accommodations}
                  </p>
                </div>
              </div>
            </div>

            {/* Assignments linked to this course */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-sky-700" />
                  <h3 className="font-serif font-bold text-neutral-900 text-sm">
                    Assignments & Milestones ({courseAssignments.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {courseAssignments.map((asg) => (
                  <div
                    key={asg.id}
                    onClick={() => onOpenAssignment(asg.id)}
                    className="group rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer transition-all flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 text-xs">{asg.title}</span>
                        {asg.urgency === 'urgent_tonight' && (
                          <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-semibold border border-amber-300">
                            Due Tonight
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{asg.prompt}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <div className="text-right text-[11px]">
                        <div className="text-amber-800 font-semibold">{asg.dueDate}</div>
                        <div className="text-neutral-500 text-[10px]">{asg.weight}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-serif font-bold text-neutral-900">Add New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">University / College</label>
                <select
                  value={newInstId}
                  onChange={(e) => setNewInstId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.shortName})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Course Code (e.g. ED 9413)</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="ED 9413"
                    className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Credits</label>
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Curriculum Leadership & Universal Design"
                  className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Professor Name</label>
                  <input
                    type="text"
                    value={newProfName}
                    onChange={(e) => setNewProfName(e.target.value)}
                    placeholder="Dr. Bennett"
                    className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Professor Email</label>
                  <input
                    type="email"
                    value={newProfEmail}
                    onChange={(e) => setNewProfEmail(e.target.value)}
                    placeholder="prof@university.edu"
                    className="w-full rounded-xl border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-neutral-600 hover:bg-neutral-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-neutral-950 hover:bg-amber-400 cursor-pointer shadow-xs"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
