import React, { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  BookOpen,
} from "lucide-react";
import { useStore } from "../state/store";
import { readSyllabusFile } from "../lib/syllabusFile";
import {
  parseSyllabusDocument,
  syllabusRecords,
  type DocumentCandidate,
  type SyllabusKind,
} from "../state/syllabusDocument";
import type { EntityBase, Persistable } from "../types";

const KINDS: { value: SyllabusKind; label: string }[] = [
  { value: "assignment", label: "Assignment" },
  { value: "discussion", label: "Discussion" },
  { value: "reading", label: "Reading" },
  { value: "assessment", label: "Exam / quiz" },
];

export const SyllabusPanel: React.FC = () => {
  const store = useStore();
  const [courseId, setCourseId] = useState("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [candidates, setCandidates] = useState<DocumentCandidate[] | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const operation = useRef(false);
  const importId = useRef("");
  const savedKeys = useRef(new Set<string>());
  const savedSyllabus = store.notes.find(
    (note) => note.id === `syllabus-source-${courseId}`,
  );

  useEffect(() => {
    if (!store.courses.some((course) => course.id === courseId))
      setCourseId(store.courses[0]?.id ?? "");
  }, [store.courses, courseId]);

  const readFile = async (file?: File) => {
    if (!file || operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const extracted = await readSyllabusFile(file);
      setText(extracted);
      setFileName(file.name);
      setCandidates(null);
      setMessage(
        `Text extracted from ${file.name}. Check the text, then find coursework.`,
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The document could not be read. Try pasting its text.",
      );
    } finally {
      operation.current = false;
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const preview = () => {
    importId.current = `syllabus-${crypto.randomUUID()}`;
    savedKeys.current.clear();
    setCandidates(parseSyllabusDocument(text));
    setError("");
    setMessage("");
  };
  const update = (key: string, patch: Partial<DocumentCandidate>) =>
    setCandidates(
      (previous) =>
        previous?.map((candidate) =>
          candidate.key === key ? { ...candidate, ...patch } : candidate,
        ) ?? null,
    );
  const selected =
    candidates?.filter(
      (candidate) => candidate.selected && candidate.title.trim(),
    ).length ?? 0;

  const confirm = async () => {
    if (!candidates || !courseId || operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const planned = syllabusRecords(candidates, courseId, importId.current);
      const existing: Record<string, unknown[]> = {
        assignments: store.assignments,
        readings: store.readings,
        discussions: store.discussions,
        assessments: store.assessments,
      };
      let imported = 0;
      let duplicates = 0;
      for (const record of planned) {
        if (savedKeys.current.has(record.entity.id)) continue;
        const entity = record.entity as EntityBase & {
          title?: string;
          name?: string;
          courseId: string;
          dueDate?: string;
          date?: string;
          initialPostDeadline?: string;
        };
        const title = (entity.title || entity.name || "").trim().toLowerCase();
        const due =
          entity.dueDate || entity.date || entity.initialPostDeadline || "";
        const duplicate = existing[record.collection].some(
          (item: any) =>
            item.courseId === courseId &&
            (item.title || item.name || "").trim().toLowerCase() === title &&
            (item.dueDate || item.date || item.initialPostDeadline || "") ===
              due,
        );
        if (duplicate) {
          duplicates++;
          continue;
        }
        await store.save(record.collection, entity as Persistable, { throwOnError: true });
        existing[record.collection] = [...existing[record.collection], entity];
        savedKeys.current.add(entity.id);
        imported++;
      }
      const timestamp = new Date().toISOString();
      await store.save("notes", {
        id: `syllabus-source-${courseId}`,
        courseId,
        title: `Syllabus · ${fileName || "pasted text"}`,
        body: text,
        tags: ["syllabus"],
        createdAt: savedSyllabus?.createdAt ?? timestamp,
        updatedAt: timestamp,
      }, { throwOnError: true });
      setMessage(
        `Saved syllabus and imported ${imported} item${imported === 1 ? "" : "s"}.${duplicates ? ` Skipped ${duplicates} existing item${duplicates === 1 ? "" : "s"}.` : ""}`,
      );
      setCandidates(null);
    } catch {
      setError(
        "The import could not finish. Already saved items are retained. Retry to save the remaining items.",
      );
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="syllabus-heading"
      className="mx-auto max-w-5xl space-y-6"
    >
      <header>
        <p className="workspace-eyebrow">Course preparation</p>
        <h1 id="syllabus-heading" className="workspace-title">
          A clear plan starts here.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Bring in a syllabus. Turn its requirements into coursework you can
          review, edit, and follow through.
        </p>
      </header>
      {message && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <div className="workspace-card space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="syll-course"
              className="mb-2 block text-xs font-semibold text-neutral-600"
            >
              Course
            </label>
            <select
              id="syll-course"
              value={courseId}
              disabled={busy || candidates !== null}
              onChange={(event) => {
                setCourseId(event.target.value);
                setMessage("");
              }}
              className="workspace-input max-w-lg"
            >
              <option value="" disabled>
                Choose a course
              </option>
              {store.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code}
                  {course.title ? ` · ${course.title}` : ""}
                </option>
              ))}
            </select>
          </div>
          {savedSyllabus && (
            <button
              className="workspace-button"
              disabled={busy}
              onClick={() => {
                setText(savedSyllabus.body);
                setFileName(
                  savedSyllabus.title?.replace(/^Syllabus · /, "") ?? "",
                );
                setCandidates(null);
                setMessage("Loaded your saved syllabus text.");
              }}
            >
              <BookOpen className="h-4 w-4" />
              Load saved syllabus
            </button>
          )}
        </div>
        {!store.courses.length && (
          <p className="text-sm text-neutral-600">
            Add a course in Courses to start importing.
          </p>
        )}
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="sr-only"
          aria-label="Choose syllabus file"
          disabled={busy}
          onChange={(event) => void readFile(event.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
          className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-[#bacdc2] bg-[#f4f8f2] px-5 py-9 text-center transition-colors hover:border-teal-600 hover:bg-teal-50 disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle className="mb-3 h-7 w-7 animate-spin text-teal-800" />
          ) : (
            <UploadCloud className="mb-3 h-7 w-7 text-teal-800" />
          )}
          <span className="font-semibold text-[#193e37]">
            {busy ? "Processing your syllabus…" : "Upload a course syllabus"}
          </span>
          <span className="mt-2 text-xs text-neutral-600">
            PDF, Word (.docx), TXT, or Markdown · up to 15 MB
          </span>
        </button>
        <p className="text-xs leading-5 text-neutral-500">
          Files are read on your device. Scanned PDFs need OCR. Tables and
          formatting may change during extraction.
        </p>
        <div>
          <label
            htmlFor="syll-text"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700"
          >
            <FileText className="h-4 w-4" />
            {fileName || "Paste syllabus text"}
          </label>
          <textarea
            id="syll-text"
            value={text}
            disabled={busy || candidates !== null}
            onChange={(event) => {
              setText(event.target.value);
              setMessage("");
            }}
            rows={9}
            placeholder={
              "Paste your syllabus or upload a document above.\n\nEssay due 2026-12-01\nDiscussion post due 2026-12-03\nReading: Chapter 4\nFinal exam due 2026-12-15"
            }
            className="workspace-input text-sm leading-6"
          />
        </div>
        {candidates === null && (
          <button
            onClick={preview}
            disabled={!text.trim() || !courseId || busy}
            className="workspace-button workspace-button-primary"
          >
            Find coursework <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
      {candidates !== null && (
        <div className="workspace-card space-y-5" aria-busy={busy}>
          <div>
            <h2 className="font-serif text-2xl text-[#193e37]">
              Review your coursework
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Check each title, type, and date against the original. Dates
              without an explicit year stay blank. Set peer-reply requirements
              in Discussions after import.
            </p>
          </div>
          {!candidates.length && (
            <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
              No coursework lines found. Add assignment, reading, discussion, or
              exam lines to the text and try again.
            </p>
          )}
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <fieldset
                key={candidate.key}
                disabled={busy}
                className="rounded-xl border border-neutral-200 p-4"
              >
                <legend className="sr-only">Review {candidate.title}</legend>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={candidate.selected}
                    onChange={(event) =>
                      update(candidate.key, { selected: event.target.checked })
                    }
                    aria-label={`Import ${candidate.title}`}
                    className="mt-3 h-5 w-5 accent-teal-800"
                  />
                  <div className="min-w-0 flex-1 space-y-3">
                    <label className="block text-xs font-semibold text-neutral-500">
                      Title
                      <input
                        value={candidate.title}
                        onChange={(event) =>
                          update(candidate.key, { title: event.target.value })
                        }
                        className="workspace-input mt-1"
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-semibold text-neutral-500">
                        Type
                        <select
                          value={candidate.kind}
                          onChange={(event) =>
                            update(candidate.key, {
                              kind: event.target.value as SyllabusKind,
                            })
                          }
                          className="workspace-input mt-1"
                        >
                          {KINDS.map((kind) => (
                            <option key={kind.value} value={kind.value}>
                              {kind.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-semibold text-neutral-500">
                        {candidate.kind === "reading"
                          ? "Due date (tracked for other item types)"
                          : "Due date"}
                        <input
                          type="date"
                          value={candidate.dueDate}
                          disabled={candidate.kind === "reading"}
                          onChange={(event) =>
                            update(candidate.key, {
                              dueDate: event.target.value,
                              dateParsed: Boolean(event.target.value),
                            })
                          }
                          className="workspace-input mt-1"
                        />
                      </label>
                    </div>
                    <p className="break-words text-xs leading-5 text-neutral-500">
                      Original wording — {candidate.description}
                    </p>
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => void confirm()}
              className="workspace-button workspace-button-primary"
            >
              {busy
                ? "Saving…"
                : selected
                  ? `Save syllabus & import ${selected} items`
                  : "Save syllabus text"}
            </button>
            <button
              disabled={busy}
              onClick={() => setCandidates(null)}
              className="workspace-button"
            >
              Back to text
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
