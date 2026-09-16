import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { TodayView } from './components/TodayView';
import { CoursesView } from './components/CoursesView';
import { AssignmentsView } from './components/AssignmentsView';
import { LibraryView } from './components/LibraryView';
import { WriteView } from './components/WriteView';
import { FocusView } from './components/FocusView';
import { MeView } from './components/MeView';
import { CompanionDrawer } from './components/CompanionDrawer';
import { SyllabusModal } from './components/SyllabusModal';
import { AuthorshipModal } from './components/AuthorshipModal';
import { CommandCenterView } from './components/CommandCenterView';
import { DiscussionsView } from './components/DiscussionsView';
import { SettingsView } from './components/SettingsView';
import { QuickAddButton } from './components/QuickAdd';
import { StoreProvider } from './state/store';

import {
  INITIAL_INSTITUTIONS,
  INITIAL_COURSES,
  INITIAL_ASSIGNMENTS,
  INITIAL_CITATIONS,
  INITIAL_ACADEMIC_MEMORY,
  INITIAL_STUDENT_PROFILE,
  INITIAL_AUTHORSHIP_DOSSIER
} from './data/mockData';

import {
  TabType,
  Institution,
  Course,
  Assignment,
  Citation,
  AcademicMemoryNode,
  StudentProfile,
  AuthorshipDossier
} from './types';

function AppShell() {
  // Navigation — defaults to the store-backed Command Center (first-milestone experience).
  const [activeTab, setActiveTab] = useState<TabType>('COMMAND');

  // Academic Knowledge Graph State
  const [institutions, setInstitutions] = useState<Institution[]>(INITIAL_INSTITUTIONS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [citations, setCitations] = useState<Citation[]>(INITIAL_CITATIONS);
  const [academicMemory, setAcademicMemory] = useState<AcademicMemoryNode[]>(INITIAL_ACADEMIC_MEMORY);
  const [profile, setProfile] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);

  // Active selections
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(assignments[0]?.id || null);
  const [focusAssignmentId, setFocusAssignmentId] = useState<string | null>(null);
  const [focusMinutes, setFocusMinutes] = useState<number>(20);

  // Modals & Drawers
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [syllabusTargetCourseId, setSyllabusTargetCourseId] = useState<string | undefined>(undefined);
  const [isAuthorshipModalOpen, setIsAuthorshipModalOpen] = useState(false);
  const [authorshipTargetAsgId, setAuthorshipTargetAsgId] = useState<string | null>(null);

  // Handlers
  const handleStartFocus = (assignmentId?: string, minutes?: number) => {
    if (assignmentId) {
      setFocusAssignmentId(assignmentId);
      setSelectedAssignmentId(assignmentId);
    }
    if (minutes) setFocusMinutes(minutes);
    setActiveTab('FOCUS');
  };

  const handleOpenAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setActiveTab('ASSIGNMENTS');
  };

  const handleOpenWritingStudio = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setActiveTab('WRITE');
  };

  const handleAskCoach = (contextPrompt: string) => {
    setIsCompanionOpen(true);
  };

  const handleOpenSyllabusModal = (courseId?: string) => {
    setSyllabusTargetCourseId(courseId);
    setIsSyllabusModalOpen(true);
  };

  const handleOpenAuthorshipDossier = (assignmentId: string) => {
    setAuthorshipTargetAsgId(assignmentId);
    setIsAuthorshipModalOpen(true);
  };

  const handleApplySyllabusData = (courseId: string, extracted: any) => {
    // Update course policies and professor if extracted
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          professor: {
            ...c.professor,
            name: extracted.professor?.name || c.professor.name,
            email: extracted.professor?.email || c.professor.email,
            officeHours: extracted.professor?.officeHours || c.professor.officeHours
          },
          policies: {
            ...c.policies,
            aiPolicy: extracted.policies?.aiPolicy || c.policies.aiPolicy,
            accommodations: extracted.policies?.accommodations || c.policies.accommodations
          }
        };
      })
    );

    // If new assignments extracted, add them
    if (extracted.assignments && Array.isArray(extracted.assignments)) {
      const newAsgs: Assignment[] = extracted.assignments.map((asg: any, i: number) => ({
        id: `asg-extracted-${Date.now()}-${i}`,
        courseId,
        title: asg.title || 'Extracted Deliverable',
        prompt: asg.description || 'Deliverable synthesized from syllabus.',
        dueDate: asg.dueDate || 'TBD',
        dueTime: '11:59 PM',
        urgency: 'due_soon',
        points: 100,
        weight: asg.weight || '15% of Final Grade',
        estimatedMinutes: 45,
        requiredReadings: [],
        checklist: [
          { id: 'ck-1', text: 'Review syllabus guidelines', completed: false },
          { id: 'ck-2', text: 'Draft in Writing Studio', completed: false }
        ],
        drafts: [],
        rubric: 'Standard institutional criteria.'
      }));

      setAssignments((prev) => [...newAsgs, ...prev]);
    }
  };

  const handleAddCourse = (newCourse: Course) => {
    setCourses((prev) => [newCourse, ...prev]);
  };

  const handleAddCitation = (newCitation: Citation) => {
    setCitations((prev) => [newCitation, ...prev]);
  };

  const handleUpdateCitations = (updatedCitations: Citation[]) => {
    setCitations(updatedCitations);
  };

  const handleToggleChecklistItem = (assignmentId: string, itemId: string) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        return {
          ...a,
          checklist: a.checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
        };
      })
    );
  };

  const handleSaveDraft = (assignmentId: string, content: string, versionName: string) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        const newDraft = {
          id: `draft-${Date.now()}`,
          versionName,
          content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          wordCount: content.trim() ? content.trim().split(/\s+/).length : 0
        };
        return {
          ...a,
          drafts: [newDraft, ...a.drafts]
        };
      })
    );
  };

  const handleUpdateProfile = (updated: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  // Selected assignment / course context for companion
  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];
  const currentCourse = courses.find((c) => c.id === currentAssignment?.courseId);
  const currentInstitution = institutions.find((i) => i.id === currentCourse?.institutionId);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Universal Academic Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        institutions={institutions}
        selectedInstitutionId={null}
        setSelectedInstitutionId={() => {}}
        onOpenCompanion={() => setIsCompanionOpen(!isCompanionOpen)}
        onQuickFocus={() => handleStartFocus(undefined, 20)}
      />

      {/* Main Content View Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {activeTab === 'COMMAND' && <CommandCenterView />}

        {activeTab === 'DISCUSS' && <DiscussionsView />}

        {activeTab === 'SETTINGS' && <SettingsView />}

        {activeTab === 'TODAY' && (
          <TodayView
            institutions={institutions}
            courses={courses}
            assignments={assignments}
            citations={citations}
            academicMemory={academicMemory}
            profile={profile}
            onNavigateTab={setActiveTab}
            onStartFocus={handleStartFocus}
            onOpenAssignment={handleOpenAssignment}
            onAskCoach={handleAskCoach}
            onOpenSyllabusIntelligence={handleOpenSyllabusModal}
          />
        )}

        {activeTab === 'COURSES' && (
          <CoursesView
            institutions={institutions}
            courses={courses}
            assignments={assignments}
            onOpenSyllabusModal={handleOpenSyllabusModal}
            onOpenAssignment={handleOpenAssignment}
            onAddCourse={handleAddCourse}
            onAskCoach={handleAskCoach}
          />
        )}

        {activeTab === 'ASSIGNMENTS' && (
          <AssignmentsView
            assignments={assignments}
            courses={courses}
            institutions={institutions}
            citations={citations}
            selectedAssignmentId={selectedAssignmentId}
            onSelectAssignment={setSelectedAssignmentId}
            onStartFocus={handleStartFocus}
            onOpenWritingStudio={handleOpenWritingStudio}
            onToggleChecklistItem={handleToggleChecklistItem}
            onGenerateAuthorshipDossier={handleOpenAuthorshipDossier}
          />
        )}

        {activeTab === 'LIBRARY' && (
          <LibraryView
            citations={citations}
            academicMemory={academicMemory}
            courses={courses}
            institutions={institutions}
            onAddCitation={handleAddCitation}
            onUpdateCitations={handleUpdateCitations}
          />
        )}

        {activeTab === 'WRITE' && (
          <WriteView
            assignments={assignments}
            courses={courses}
            institutions={institutions}
            citations={citations}
            profile={profile}
            activeAssignmentId={selectedAssignmentId}
            onSelectAssignment={setSelectedAssignmentId}
            onSaveDraft={handleSaveDraft}
            onOpenAuthorshipDossier={handleOpenAuthorshipDossier}
            onStartFocus={handleStartFocus}
          />
        )}

        {activeTab === 'FOCUS' && (
          <FocusView
            assignments={assignments}
            courses={courses}
            initialAssignmentId={focusAssignmentId || selectedAssignmentId}
            initialMinutes={focusMinutes}
            onOpenWritingStudio={handleOpenWritingStudio}
            onOpenCompanionWithRole={(role) => setIsCompanionOpen(true)}
          />
        )}

        {activeTab === 'ME' && (
          <MeView
            profile={profile}
            courses={courses}
            institutions={institutions}
            onUpdateProfile={handleUpdateProfile}
            onOpenCompanionWithRole={(role) => setIsCompanionOpen(true)}
          />
        )}
      </main>

      {/* AI Companion Role-Based Coaching Drawer */}
      <CompanionDrawer
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        currentAssignment={currentAssignment}
        currentCourse={currentCourse}
        citations={citations}
        onStartFocus={handleStartFocus}
        onOpenWritingStudio={handleOpenWritingStudio}
      />

      {/* Syllabus Intelligence Modal */}
      <SyllabusModal
        isOpen={isSyllabusModalOpen}
        onClose={() => setIsSyllabusModalOpen(false)}
        courses={courses}
        institutions={institutions}
        selectedCourseId={syllabusTargetCourseId}
        onApplyExtractedData={handleApplySyllabusData}
      />

      {/* Authorship Evidence & Provenance Dossier Modal */}
      <AuthorshipModal
        isOpen={isAuthorshipModalOpen}
        onClose={() => setIsAuthorshipModalOpen(false)}
        assignment={currentAssignment}
        course={currentCourse}
        institution={currentInstitution}
        dossier={INITIAL_AUTHORSHIP_DOSSIER}
        citations={citations}
      />

      {/* Universal Quick Add (persists through the store) */}
      <QuickAddButton />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
