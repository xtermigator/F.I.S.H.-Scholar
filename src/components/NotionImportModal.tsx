import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  BookOpen,
  CheckSquare,
  ArrowRight,
  Database
} from 'lucide-react';
import { Course, Institution, Assignment, Citation } from '../types';

interface NotionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  institutions: Institution[];
  onImportItems: (data: {
    assignments: Assignment[];
    newCitations: Citation[];
    newTodosCount: number;
  }) => void;
}

export const NotionImportModal: React.FC<NotionImportModalProps> = ({
  isOpen,
  onClose,
  courses,
  institutions,
  onImportItems
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');
  const [content, setContent] = useState<string>('');
  const [parsing, setParsing] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<{
    assignments: any[];
    todos: any[];
    papers: any[];
  } | null>(null);

  // Selection states for preview
  const [selectedAsgIndexes, setSelectedAsgIndexes] = useState<Record<number, boolean>>({});
  const [selectedTodoIndexes, setSelectedTodoIndexes] = useState<Record<number, boolean>>({});
  const [selectedPaperIndexes, setSelectedPaperIndexes] = useState<Record<number, boolean>>({});

  // Course mappings for assignments and todos
  const [asgCourseMappings, setAsgCourseMappings] = useState<Record<number, string>>({});
  const [paperCourseMappings, setPaperCourseMappings] = useState<Record<number, string>>({});

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleNotion = () => {
    setContent(`| Task / Item Name | Type | Due Date | Course | Notes / Description |
|---|---|---|---|---|
| Complete Universal Design Lab Protocol | Assignment | March 18, 2026 | ED 9413 | Redesign laboratory curriculum guidelines for inclusive tactile access |
| Draft CUNY Disability Identity Synthesis Paper | Assignment | April 02, 2026 | DSAB 629 | Critical disability theory paper on self-advocacy and neurodiversity paradigms |
| Compile Alachua Community Transition Matrix | Assignment | April 14, 2026 | FYC 6933 | Empirical framework on community stakeholder integration and postsecondary readiness |
| Read Evans & Broido (2017) Chapters 3 & 4 | Reading / Paper | March 10, 2026 | DSAB 629 | Evans, N. J., & Broido, E. M. (2017). Disability in higher education: A social justice approach. Jossey-Bass. |
| Review Burgstahler (2021) UDL checklist | Reading / Paper | March 12, 2026 | ED 9413 | Burgstahler, S. (2021). Universal design in higher education. Journal of Postsecondary Education and Disability. |
| Email Dr. Bennett regarding SAS accommodations | To-Do | Today | ED 9413 | Clarify alternate format testing procedures |
| Gather peer reviews for thesis introduction | To-Do | Friday | DSAB 629 | Solicit feedback on methodology outline |
| Export citation library to BibTeX / APA | To-Do | Next Week | General | Verify DOI references for all primary sources |`);
  };

  const handleParse = async () => {
    if (!content.trim()) return;
    setParsing(true);

    try {
      const res = await fetch('/api/notion/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: content,
          knownCourses: courses
        })
      });

      const data = await res.json();
      if (data.success) {
        setParsedData(data);

        // Pre-select all items
        const asgSel: Record<number, boolean> = {};
        const asgMap: Record<number, string> = {};
        data.assignments?.forEach((asg: any, i: number) => {
          asgSel[i] = true;
          // Try to match courseCodeMatch with existing courses
          const match = courses.find(
            (c) =>
              c.code.toLowerCase().includes(asg.courseCodeMatch?.toLowerCase() || '') ||
              asg.title.toLowerCase().includes(c.code.toLowerCase())
          );
          asgMap[i] = match ? match.id : courses[0]?.id || '';
        });

        const todoSel: Record<number, boolean> = {};
        data.todos?.forEach((_: any, i: number) => {
          todoSel[i] = true;
        });

        const paperSel: Record<number, boolean> = {};
        const paperMap: Record<number, string> = {};
        data.papers?.forEach((_: any, i: number) => {
          paperSel[i] = true;
          paperMap[i] = courses[0]?.id || '';
        });

        setSelectedAsgIndexes(asgSel);
        setSelectedTodoIndexes(todoSel);
        setSelectedPaperIndexes(paperSel);
        setAsgCourseMappings(asgMap);
        setPaperCourseMappings(paperMap);

        setActiveTab('preview');
      }
    } catch (err) {
      console.error('Failed to parse Notion list:', err);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;

    const importedAssignments: Assignment[] = [];
    parsedData.assignments.forEach((asg: any, i: number) => {
      if (selectedAsgIndexes[i]) {
        const targetCourseId = asgCourseMappings[i] || courses[0]?.id || 'c1';
        importedAssignments.push({
          id: `asg-notion-${Date.now()}-${i}`,
          courseId: targetCourseId,
          title: asg.title || 'Notion Deliverable',
          dueDate: asg.dueDate || 'TBD',
          dueTime: '11:59 PM',
          urgency: asg.urgency || 'due_soon',
          points: 100,
          weight: asg.weight || '15% of Grade',
          estimatedMinutes: 60,
          prompt: asg.prompt || 'Imported from Notion workspace database.',
          rubric: 'Standard institutional rubrics apply.',
          requiredReadings: [],
          checklist: (asg.checklist && asg.checklist.length > 0)
            ? asg.checklist.map((c: any, idx: number) => ({
                id: `ck-notion-${Date.now()}-${i}-${idx}`,
                text: typeof c === 'string' ? c : c.text,
                completed: typeof c === 'object' ? !!c.completed : false
              }))
            : [
                { id: `ck-1-${i}`, text: 'Review Notion task notes', completed: false },
                { id: `ck-2-${i}`, text: 'Draft in Writing Studio', completed: false }
              ],
          drafts: [],
          notes: 'Synced from Notion Academic Workspace.',
          sourcesCited: [],
          currentPhase: 'outline'
        });
      }
    });

    // If there are standalone todos, attach them to the first imported assignment or active assignment checklist
    let importedTodosCount = 0;
    const standaloneTodos = parsedData.todos.filter((_, i) => selectedTodoIndexes[i]);
    if (standaloneTodos.length > 0 && importedAssignments.length > 0) {
      standaloneTodos.forEach((t: any, idx: number) => {
        importedAssignments[0].checklist.push({
          id: `ck-todo-notion-${Date.now()}-${idx}`,
          text: t.text || 'Imported To-Do Item',
          completed: !!t.completed,
          estimatedMinutes: t.estimatedMinutes || 20
        });
        importedTodosCount++;
      });
    }

    const importedCitations: Citation[] = [];
    parsedData.papers.forEach((p: any, i: number) => {
      if (selectedPaperIndexes[i]) {
        const targetCourseId = paperCourseMappings[i] || courses[0]?.id || 'c1';
        importedCitations.push({
          id: `cit-notion-${Date.now()}-${i}`,
          authors: p.authors || 'Extracted Author',
          year: p.year || '2024',
          title: p.title || 'Research Source',
          source: p.source || 'Notion Academic Database',
          doiOrUrl: p.doiOrUrl || '',
          apa7: p.apa7 || `${p.authors || 'Author'} (${p.year || '2024'}). ${p.title}. Notion Archive.`,
          inText: p.inText || `(${p.authors?.split(' ')?.[0] || 'Author'}, ${p.year || '2024'})`,
          notes: p.notes || 'Imported from Notion paper and reading database.',
          keyQuotes: p.keyQuotes || [],
          keywords: p.keywords || ['Notion', 'Academic Source'],
          coursesUsed: [targetCourseId],
          papersCitedIn: []
        });
      }
    });

    onImportItems({
      assignments: importedAssignments,
      newCitations: importedCitations,
      newTodosCount: importedTodosCount
    });

    onClose();
  };

  const totalSelected =
    Object.values(selectedAsgIndexes).filter(Boolean).length +
    Object.values(selectedTodoIndexes).filter(Boolean).length +
    Object.values(selectedPaperIndexes).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="relative w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-neutral-900">
                  Notion Academic Importer
                </h2>
                <span className="rounded-md bg-amber-100/70 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                  CSV / Markdown / JSON
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-sans">
                Import to-do items, upcoming assignment deadlines, and research paper reading lists
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
            id="close-notion-import-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 px-6 pt-3 gap-4 text-xs bg-neutral-50/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            1. Upload / Paste Notion Content
          </button>
          <button
            onClick={() => parsedData && setActiveTab('preview')}
            disabled={!parsedData}
            className={`pb-2.5 font-semibold transition-colors border-b-2 cursor-pointer disabled:opacity-40 ${
              activeTab === 'preview'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            2. Map & Confirm ({parsedData ? totalSelected : 0} items)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drag and drop upload zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="relative rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50/60 p-6 text-center hover:border-neutral-400 transition-colors"
              >
                <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <div className="text-xs font-semibold text-neutral-800">
                  Drag & Drop Notion export file here (.csv, .md, .txt, .json)
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  or click to browse your computer
                </div>
                <input
                  type="file"
                  accept=".csv,.md,.txt,.json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="notion-file-input"
                />
              </div>

              {/* Or paste text */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Or Paste Notion Table / Task List
                  </label>
                  <button
                    onClick={handleLoadSampleNotion}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 hover:underline cursor-pointer"
                  >
                    Load Sample Notion Academic Database
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste Notion database rows, exported CSV text, or markdown tables here..."
                  className="w-full rounded-xl border border-neutral-300 bg-white p-3.5 text-xs text-neutral-900 font-mono placeholder-neutral-400 focus:border-neutral-900 focus:outline-none shadow-xs"
                />
              </div>

              {/* Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleParse}
                  disabled={parsing || !content.trim()}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                  id="parse-notion-btn"
                >
                  <Sparkles className={`h-4 w-4 ${parsing ? 'animate-spin' : ''}`} />
                  <span>{parsing ? 'Parsing Notion Structure with AI...' : 'Parse & Categorize Notion List'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preview' && parsedData && (
            <div className="space-y-6">
              {/* Assignments Section */}
              {parsedData.assignments.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-amber-700" />
                      Assignments & Deliverables ({parsedData.assignments.length})
                    </span>
                    <span className="text-[11px] text-neutral-500">Assign to Course & Verify</span>
                  </div>

                  <div className="space-y-2">
                    {parsedData.assignments.map((asg: any, i: number) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-3.5 transition-all text-xs space-y-2 ${
                          selectedAsgIndexes[i]
                            ? 'border-neutral-300 bg-white shadow-xs'
                            : 'border-neutral-200 bg-neutral-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!selectedAsgIndexes[i]}
                              onChange={(e) =>
                                setSelectedAsgIndexes((prev) => ({ ...prev, [i]: e.target.checked }))
                              }
                              className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="font-serif font-bold text-neutral-900 text-sm">
                              {asg.title}
                            </span>
                          </label>

                          <div className="flex items-center gap-2">
                            <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                              Due: {asg.dueDate || 'TBD'}
                            </span>
                            <select
                              value={asgCourseMappings[i] || courses[0]?.id}
                              onChange={(e) =>
                                setAsgCourseMappings((prev) => ({ ...prev, [i]: e.target.value }))
                              }
                              className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[11px] text-neutral-800"
                            >
                              {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.code}: {c.title.slice(0, 24)}...
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {asg.prompt && (
                          <p className="text-[11px] text-neutral-600 pl-6 leading-relaxed">
                            {asg.prompt}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Papers Section */}
              {parsedData.papers.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-indigo-700" />
                      Research Papers & Reading Sources ({parsedData.papers.length})
                    </span>
                    <span className="text-[11px] text-neutral-500">Import to APA Citation Library</span>
                  </div>

                  <div className="space-y-2">
                    {parsedData.papers.map((p: any, i: number) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-3.5 transition-all text-xs space-y-1.5 ${
                          selectedPaperIndexes[i]
                            ? 'border-neutral-300 bg-white shadow-xs'
                            : 'border-neutral-200 bg-neutral-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!selectedPaperIndexes[i]}
                              onChange={(e) =>
                                setSelectedPaperIndexes((prev) => ({ ...prev, [i]: e.target.checked }))
                              }
                              className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="font-semibold text-neutral-900">{p.title}</span>
                          </label>

                          <select
                            value={paperCourseMappings[i] || courses[0]?.id}
                            onChange={(e) =>
                              setPaperCourseMappings((prev) => ({ ...prev, [i]: e.target.value }))
                            }
                            className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[11px] text-neutral-800"
                          >
                            {courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.code}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[11px] text-neutral-500 pl-6 font-mono">{p.apa7 || p.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* To-Do Items Section */}
              {parsedData.todos.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-emerald-700" />
                    Actionable To-Dos ({parsedData.todos.length})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parsedData.todos.map((t: any, i: number) => (
                      <label
                        key={i}
                        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-xs text-neutral-800 cursor-pointer hover:bg-neutral-100"
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedTodoIndexes[i]}
                          onChange={(e) =>
                            setSelectedTodoIndexes((prev) => ({ ...prev, [i]: e.target.checked }))
                          }
                          className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="truncate">{t.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Import confirmation action */}
              <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  ← Back to Source Text
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={totalSelected === 0}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                  id="confirm-import-notion-btn"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Import {totalSelected} Items to F.I.S.H. Scholar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
