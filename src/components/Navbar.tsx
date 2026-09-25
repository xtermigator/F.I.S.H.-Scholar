import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckSquare,
  Library,
  Feather,
  Timer,
  User,
  Zap,
  MessageSquareQuote,
  GraduationCap,
  MessagesSquare,
  Search as SearchIcon,
  FileText,
  CalendarDays,
  Brain,
  Video,
  Menu,
  X,
  Settings as SettingsIcon,
} from 'lucide-react';
import { TabType, Institution } from '../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  institutions: Institution[];
  selectedInstitutionId: string | null;
  setSelectedInstitutionId: (id: string | null) => void;
  onOpenCompanion: () => void;
  onQuickFocus: () => void;
}

interface TabDef {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDef[] = [
  { id: 'COMMAND', label: 'COMMAND', icon: Sparkles },
  { id: 'ASK', label: 'ASK FISH', icon: MessageSquareQuote },
  { id: 'TALK', label: 'TALK', icon: Video },
  { id: 'SEARCH', label: 'SEARCH', icon: SearchIcon },
  { id: 'DISCUSS', label: 'DISCUSS', icon: MessagesSquare },
  { id: 'CALENDAR', label: 'CALENDAR', icon: CalendarDays },
  { id: 'COURSES', label: 'COURSES', icon: GraduationCap },
  { id: 'ASSIGNMENTS', label: 'ASSIGNMENTS', icon: CheckSquare },
  { id: 'LIBRARY', label: 'LIBRARY', icon: Library },
  { id: 'STUDY', label: 'STUDY', icon: Brain },
  { id: 'WRITE', label: 'WRITE', icon: Feather },
  { id: 'FOCUS', label: 'FOCUS', icon: Timer },
  { id: 'ME', label: 'ME', icon: User },
  { id: 'REPORTS', label: 'REPORTS', icon: FileText },
  { id: 'SETTINGS', label: 'SETTINGS', icon: SettingsIcon },
];

// Mobile bottom-bar priority (accessibility steering: Today→Upcoming→Quick Add→Courses→Ask).
// Quick Add is a separate FAB, so the bar surfaces the 4 most-used destinations + "More".
const MOBILE_PRIMARY: TabType[] = ['COMMAND', 'ASK', 'CALENDAR', 'COURSES'];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  institutions,
  selectedInstitutionId,
  setSelectedInstitutionId,
  onOpenCompanion,
  onQuickFocus,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the "More" sheet whenever the active tab changes.
  useEffect(() => {
    setMoreOpen(false);
  }, [activeTab]);

  const primaryTabs = TABS.filter((t) => MOBILE_PRIMARY.includes(t.id));

  const renderTabButton = (tab: TabDef, variant: 'top' | 'bottom' | 'sheet') => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    if (variant === 'bottom') {
      return (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          id={`nav-bottom-${tab.id.toLowerCase()}`}
          aria-current={isActive ? 'page' : undefined}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
            isActive ? 'text-neutral-900' : 'text-neutral-500'
          }`}
        >
          <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : 'text-neutral-500'}`} />
          <span>{tab.label === 'ASK FISH' ? 'ASK' : tab.label}</span>
        </button>
      );
    }
    if (variant === 'sheet') {
      return (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          aria-current={isActive ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
            isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          <Icon className={`h-5 w-5 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
          {tab.label}
        </button>
      );
    }
    // top (desktop)
    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        id={`nav-tab-${tab.id.toLowerCase()}`}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
          isActive ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
        <span>{tab.label}</span>
      </button>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('COMMAND')}
              className="flex items-center gap-2.5 text-left group transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 rounded-lg"
              id="brand-header-button"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-amber-400 shadow-xs group-hover:scale-105 transition-transform font-serif font-bold text-lg">
                F
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold tracking-tight text-neutral-900 text-base">
                    F.I.S.H. <span className="text-amber-700 font-sans font-semibold text-sm">Scholar</span>
                  </span>
                  <span className="hidden rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200 sm:inline">
                    Academic OS
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 font-sans hidden sm:block">
                  Focus • Integrity • Synthesis • Harmony
                </p>
              </div>
            </button>

            {/* Quick Institution Badges (desktop only) */}
            <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-neutral-200">
              <button
                onClick={() => setSelectedInstitutionId(null)}
                className={`px-2.5 py-0.5 rounded-lg text-xs transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
                  selectedInstitutionId === null
                    ? 'bg-neutral-100 text-neutral-900 font-semibold border border-neutral-200'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                }`}
                id="inst-filter-all"
              >
                All Schools
              </button>
              {institutions.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstitutionId(selectedInstitutionId === inst.id ? null : inst.id)}
                  className={`px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 transition-all border cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
                    selectedInstitutionId === inst.id
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold shadow-xs'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                  id={`inst-filter-${inst.id}`}
                  title={inst.name}
                >
                  <span>{inst.logo}</span>
                  <span className="font-medium">{inst.shortName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop tab row */}
          <nav aria-label="Primary" className="hidden items-center gap-1 overflow-x-auto py-1 scrollbar-none md:flex">
            {TABS.map((tab) => renderTabButton(tab, 'top'))}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onQuickFocus}
              id="navbar-quick-focus-btn"
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-neutral-950 shadow-xs transition-all active:scale-95 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              <Zap className="h-3.5 w-3.5 fill-neutral-950 text-neutral-950" />
              <span>Focus (20m)</span>
            </button>

            <button
              onClick={onOpenCompanion}
              id="navbar-open-companion-btn"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 transition-all cursor-pointer shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              <MessageSquareQuote className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden md:inline">AI Coach</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation bar */}
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-neutral-200 bg-white/95 backdrop-blur-md md:hidden"
      >
        {primaryTabs.map((tab) => renderTabButton(tab, 'bottom'))}
        <button
          onClick={() => setMoreOpen(true)}
          id="nav-bottom-more"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold tracking-wide text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          <Menu className="h-5 w-5 text-neutral-500" />
          <span>MORE</span>
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 md:hidden"
          onClick={() => setMoreOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setMoreOpen(false);
          }}
        >
          <div
            className="max-h-[75vh] overflow-auto rounded-t-2xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-base font-bold text-neutral-900">All sections</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TABS.map((tab) => renderTabButton(tab, 'sheet'))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
