import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Library,
  Feather,
  Timer,
  User,
  MessageSquareQuote,
  GraduationCap,
  MessagesSquare,
  Search,
  FileText,
  CalendarDays,
  Brain,
  Video,
  MessageSquare,
  BookOpen,
  Download,
  UploadCloud,
  Menu,
  X,
  Settings,
  FileUp,
  ChevronRight,
  Database,
} from "lucide-react";
import type { TabType, Institution } from "../types";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  institutions: Institution[];
  selectedInstitutionId: string | null;
  setSelectedInstitutionId: (id: string | null) => void;
  onOpenCompanion: () => void;
  onQuickFocus: () => void;
  onOpenAnamAvatar?: () => void;
  onOpenNotionImport?: () => void;
  onExportArchive?: () => void;
  onImportArchiveClick?: () => void;
  lastSavedTime?: string;
  isSaving?: boolean;
}

const GROUPS: {
  label: string;
  tabs: { id: TabType; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: "My workspace",
    tabs: [
      { id: "COMMAND", label: "Overview", icon: LayoutDashboard },
      { id: "COURSES", label: "Courses", icon: GraduationCap },
      { id: "SYLLABUS", label: "Syllabus intake", icon: FileUp },
      { id: "ASSIGNMENTS", label: "Assignments", icon: CheckSquare },
      { id: "DISCUSS", label: "Discussions", icon: MessagesSquare },
      { id: "CALENDAR", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Research & writing",
    tabs: [
      { id: "LIBRARY", label: "Source library", icon: Library },
      { id: "MATRIX", label: "Literature matrix", icon: BookOpen },
      { id: "WRITE", label: "Writing studio", icon: Feather },
      { id: "STUDY", label: "Study tools", icon: Brain },
      { id: "SEARCH", label: "Search workspace", icon: Search },
    ],
  },
  {
    label: "Support & progress",
    tabs: [
      { id: "ASK", label: "Ask FISH", icon: MessageSquareQuote },
      { id: "TALK", label: "Talk to FISH", icon: Video },
      { id: "FOCUS", label: "Focus session", icon: Timer },
      { id: "CHAT", label: "Study chat", icon: MessageSquare },
      { id: "REPORTS", label: "Reports", icon: FileText },
      { id: "ME", label: "My profile", icon: User },
      { id: "SETTINGS", label: "Settings", icon: Settings },
    ],
  },
];
const TABS = GROUPS.flatMap((group) => group.tabs);
const MOBILE = ["COMMAND", "COURSES", "SYLLABUS", "FOCUS"];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  institutions,
  onOpenCompanion,
  onQuickFocus,
  onOpenAnamAvatar,
  onOpenNotionImport,
  onExportArchive,
  onImportArchiveClick,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => setMoreOpen(false), [activeTab]);
  useEffect(() => {
    if (!moreOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheet.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.body.style.overflow = previous;
      moreButton.current?.focus();
    };
  }, [moreOpen]);

  const navigation = (mobile = false) =>
    GROUPS.map((group) => (
      <div key={group.label} className="mt-5 first:mt-0">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
          {group.label}
        </p>
        <div className={mobile ? "grid grid-cols-2 gap-1" : "space-y-0.5"}>
          {group.tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`${mobile ? "mobile" : "nav-tab"}-${id.toLowerCase()}`}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={`workspace-nav-link ${activeTab === id ? "is-active" : ""}`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span>{label}</span>
              {activeTab === id && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-700" />
              )}
            </button>
          ))}
        </div>
      </div>
    ));

  const tools = (
    <>
      {onExportArchive && (
        <button onClick={onExportArchive} className="workspace-button">
          <Download className="h-4 w-4" />
          Backup
        </button>
      )}
      {onImportArchiveClick && (
        <button onClick={onImportArchiveClick} className="workspace-button">
          <UploadCloud className="h-4 w-4" />
          Restore
        </button>
      )}
      {onOpenNotionImport && (
        <button
          onClick={() => {
            setMoreOpen(false);
            onOpenNotionImport();
          }}
          className="workspace-button"
        >
          <Database className="h-4 w-4" />
          Notion
        </button>
      )}
      {onOpenAnamAvatar && (
        <button
          onClick={() => {
            setMoreOpen(false);
            onOpenAnamAvatar();
          }}
          className="workspace-button"
        >
          <Video className="h-4 w-4" />
          Live avatar
        </button>
      )}
    </>
  );

  return (
    <>
      <a
        href="#workspace-main"
        className="sr-only z-[70] rounded-lg bg-white p-3 text-teal-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#dfe6df] bg-[#fdfefb] lg:flex">
        <button
          onClick={() => setActiveTab("COMMAND")}
          id="brand-header-button"
          aria-label="F.I.S.H. Scholar home"
          className="mx-5 mt-5 rounded-xl text-left"
        >
          <img
          src="/assets/fish-edu-logo.webp"
            alt="F.I.S.H. EDU — Removing barriers. Revealing potential. A F.I.S.H. Access Lab initiative."
          width={576}
          height={384}
            className="mx-auto h-auto w-36 rounded-lg"
          />
          <span className="mt-3 block font-serif text-2xl font-semibold text-[#193e37]">
            FISH Scholar<span className="text-teal-600">.</span>
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Personal academic workspace
          </span>
        </button>
        <nav
          aria-label="Primary"
          className="mt-6 flex-1 overflow-y-auto px-3 pb-6"
        >
          {navigation()}
        </nav>
        <div className="border-t border-[#dfe6df] px-6 py-4 text-xs text-neutral-500">
          Your ideas. Your voice.
        </div>
      </aside>
      <header className="sticky top-0 z-30 border-b border-[#dfe6df] bg-[#fdfefb]/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("COMMAND")}
              className="rounded-lg lg:hidden"
              aria-label="F.I.S.H. Scholar home"
            >
              <img
              src="/assets/fish-edu-logo.webp"
                alt="F.I.S.H. EDU"
              width={576}
              height={384}
                className="h-auto w-20 rounded-lg"
              />
            </button>
            <div>
              <p className="hidden items-center gap-2 text-xs text-neutral-500 lg:flex">
                My workspace{" "}
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <span className="text-[#193e37]">
                  {TABS.find((tab) => tab.id === activeTab)?.label ??
                    "Overview"}
                </span>
              </p>
              <p className="font-serif text-xl text-[#193e37] lg:hidden">
                FISH Scholar
              </p>
              <div
                className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-500"
                aria-label="My universities"
              >
                {institutions.map((school) => (
                  <span key={school.id}>{school.shortName}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden items-center gap-1.5 text-[11px] text-neutral-500 xl:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
              Saved on this device
            </span>
            <button
              onClick={onQuickFocus}
              className="workspace-button hidden sm:inline-flex"
            >
              <Timer className="h-4 w-4" aria-hidden="true" />
              Focus
            </button>
            <button
              onClick={onOpenCompanion}
              className="workspace-button workspace-button-primary"
            >
              <MessageSquareQuote className="h-4 w-4" aria-hidden="true" />
              Ask FISH
            </button>
          </div>
        </div>
      </header>
      <div className="hidden border-b border-[#dfe6df] bg-white/40 lg:block">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-8 py-2">
          {tools}
        </div>
      </div>
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#dfe6df] bg-[#fdfefb] px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {TABS.filter((tab) => MOBILE.includes(tab.id)).map(
          ({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${activeTab === id ? "text-teal-800" : "text-neutral-500"}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {id === "SYLLABUS"
                ? "Syllabus"
                : id === "FOCUS"
                  ? "Focus"
                  : label}
            </button>
          ),
        )}
        <button
          ref={moreButton}
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-neutral-500"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          More
        </button>
      </nav>
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[#102c26]/40 lg:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            ref={sheet}
            role="dialog"
            aria-modal="true"
            aria-label="All workspace sections"
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-[#fdfefb] p-5"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") setMoreOpen(false);
              if (event.key !== "Tab") return;
              const buttons: HTMLButtonElement[] = Array.from(
                sheet.current?.querySelectorAll<HTMLButtonElement>("button") ??
                  [],
              );
              const first = buttons[0];
              const last = buttons[buttons.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
              }
              if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
              }
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#193e37]">
                Your workspace
              </h2>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close navigation"
                className="workspace-button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navigation(true)}
            <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
              {tools}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
