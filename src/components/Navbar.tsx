import React from 'react';
import {
  Sparkles,
  BookOpen,
  CheckSquare,
  Library,
  Feather,
  Timer,
  User,
  Zap,
  MessageSquareQuote,
  Layers,
  GraduationCap
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

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  institutions,
  selectedInstitutionId,
  setSelectedInstitutionId,
  onOpenCompanion,
  onQuickFocus
}) => {
  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'TODAY', label: 'TODAY', icon: Sparkles },
    { id: 'COURSES', label: 'COURSES', icon: GraduationCap },
    { id: 'ASSIGNMENTS', label: 'ASSIGNMENTS', icon: CheckSquare },
    { id: 'LIBRARY', label: 'LIBRARY', icon: Library },
    { id: 'WRITE', label: 'WRITE', icon: Feather },
    { id: 'FOCUS', label: 'FOCUS', icon: Timer },
    { id: 'ME', label: 'ME', icon: User }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('TODAY')}
            className="flex items-center gap-2.5 text-left group transition-all cursor-pointer"
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
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                  Academic OS
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 font-sans hidden sm:block">
                Focus • Integrity • Synthesis • Harmony
              </p>
            </div>
          </button>

          {/* Quick Institution Badges */}
          <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-neutral-200">
            <button
              onClick={() => setSelectedInstitutionId(null)}
              className={`px-2.5 py-0.5 rounded-lg text-xs transition-colors cursor-pointer ${
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
                className={`px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 transition-all border cursor-pointer ${
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

        {/* Primary 7 Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                id={`nav-tab-${tab.id.toLowerCase()}`}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onQuickFocus}
            id="navbar-quick-focus-btn"
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-neutral-950 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 fill-neutral-950 text-neutral-950" />
            <span>Focus (20m)</span>
          </button>

          <button
            onClick={onOpenCompanion}
            id="navbar-open-companion-btn"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 transition-all cursor-pointer shadow-xs"
          >
            <MessageSquareQuote className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden md:inline">AI Coach</span>
          </button>
        </div>
      </div>
    </header>
  );
};
