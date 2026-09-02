import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Course, Institution } from '../types';

interface SyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  institutions: Institution[];
  selectedCourseId?: string;
  onApplyExtractedData: (courseId: string, extractedData: any) => void;
}

export const SyllabusModal: React.FC<SyllabusModalProps> = ({
  isOpen,
  onClose,
  courses,
  institutions,
  selectedCourseId,
  onApplyExtractedData
}) => {
  const [activeCourseId, setActiveCourseId] = useState<string>(selectedCourseId || courses[0]?.id || '');
  const [syllabusText, setSyllabusText] = useState(`MISSISSIPPI STATE UNIVERSITY
Department of Educational Leadership
ED 9413: Curriculum Leadership & Universal Design
Semester: Spring 2026
Instructor: Dr. Catherine Bennett (c.bennett@msstate.edu)
Office Hours: Tuesdays 2:00 PM - 4:00 PM CST via Zoom (https://msstate.zoom.us/j/941388201)

COURSE DESCRIPTION:
This course examines the synthesis of curriculum theory and instructional accessibility through Universal Design for Learning (UDL).

GRADING & EVALUATION:
- Weekly Discussion & Peer Responses: 25%
- Curriculum Redesign Project: 35%
- Midterm Research Synthesis: 20%
- Applied Universal Design Portfolio: 20%

REQUIRED TEXTS:
1. Burgstahler, S. (2015). Universal Design in Higher Education: From Principles to Practice (2nd ed.). Harvard Education Press.
2. CAST (2018). Universal Design for Learning Guidelines version 2.2.

POLICIES:
- Late Work: 10% deduction per 24 hours. Accommodations with prior notice granted without penalty.
- AI Policy: AI may be used for idea generation and structural outlines with documented attribution in the Authorship Record. Uncited generative text is prohibited.
- Accommodations: Students with registered disabilities receive documented accommodations through SAS.`);

  const [loading, setLoading] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const currentCourse = courses.find((c) => c.id === activeCourseId);
  const currentInst = institutions.find((i) => i.id === currentCourse?.institutionId);

  const handleExtract = async () => {
    if (!syllabusText.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/extract-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusText,
          courseTitle: currentCourse?.title || 'Course',
          schoolName: currentInst?.name || 'University'
        })
      });

      const data = await res.json();
      if (data.extracted) {
        setExtractedResult(data.extracted);
      }
    } catch (err) {
      console.error('Syllabus extraction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (extractedResult && activeCourseId) {
      onApplyExtractedData(activeCourseId, extractedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-8 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-neutral-900">
                Syllabus Intelligence Engine
              </h2>
              <p className="text-xs text-neutral-500 font-sans">
                Multimodal AI extraction for assignments, deadlines, grading breakdown & policies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Target Course Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
              Target Course
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {courses.map((c) => {
                const inst = institutions.find((i) => i.id === c.institutionId);
                const isSelected = activeCourseId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCourseId(c.id)}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-neutral-50/70 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <div className={`text-[10px] ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>{inst?.shortName}</div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-900'}`}>{c.code}</div>
                    <div className={`text-[11px] truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>{c.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paste or Upload Syllabus */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Syllabus Content (PDF / Text / Canvas export)
              </label>
              <span className="text-[11px] text-neutral-500">Multimodal Text & Structure Analyzer</span>
            </div>

            <textarea
              rows={8}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste full syllabus text, assignment tables, policies, and reading lists here..."
              className="w-full rounded-xl border border-neutral-300 bg-white p-3.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none font-mono shadow-xs"
            />
          </div>

          {/* Extraction Action */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleExtract}
              disabled={loading || !syllabusText.trim()}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing Syllabus with Gemini...' : 'Extract Syllabus Intelligence'}</span>
            </button>

            {extractedResult && (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Structured Intelligence Ready
              </span>
            )}
          </div>

          {/* Extracted Preview */}
          {extractedResult && (
            <div className="space-y-4 rounded-xl border border-emerald-300 bg-emerald-50/40 p-4 shadow-xs">
              <h3 className="font-serif font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Extraction Summary
              </h3>

              {/* Professor Info */}
              {extractedResult.professor && (
                <div className="rounded-lg bg-white p-3 text-xs border border-emerald-200 shadow-xs">
                  <div className="font-semibold text-neutral-900">Instructor: {extractedResult.professor.name}</div>
                  <div className="text-neutral-500 text-[11px] mt-0.5">Email: {extractedResult.professor.email}</div>
                  <div className="text-neutral-500 text-[11px]">Office Hours: {extractedResult.professor.officeHours}</div>
                </div>
              )}

              {/* Assignments Found */}
              {extractedResult.assignments && (
                <div>
                  <div className="text-xs font-semibold text-neutral-700 mb-1.5">Extracted Assignments & Deadlines:</div>
                  <div className="space-y-1.5">
                    {extractedResult.assignments.map((asg: any, idx: number) => (
                      <div key={idx} className="rounded-md bg-white p-2 text-xs border border-neutral-200 flex items-center justify-between shadow-xs">
                        <div>
                          <div className="font-medium text-neutral-900">{asg.title}</div>
                          <div className="text-[10px] text-neutral-500">{asg.description}</div>
                        </div>
                        <div className="text-right text-[11px] shrink-0 ml-2">
                          <span className="text-amber-800 font-semibold">{asg.dueDate}</span>
                          <div className="text-neutral-400 text-[10px]">{asg.weight}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policies & Accommodations */}
              {extractedResult.policies && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2.5 border border-neutral-200 shadow-xs">
                    <div className="font-semibold text-amber-800 text-[11px]">AI Policy</div>
                    <div className="text-neutral-600 text-[11px] mt-1">{extractedResult.policies.aiPolicy}</div>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-neutral-200 shadow-xs">
                    <div className="font-semibold text-rose-800 text-[11px]">Accommodation Language</div>
                    <div className="text-neutral-600 text-[11px] mt-1">{extractedResult.policies.accommodations}</div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleApply}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                >
                  <span>Apply & Sync into Academic OS</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
