import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  FileText,
  Database,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { DissertationMatrixDashboard } from './components/matrix/DissertationMatrixDashboard';
import { SourceIntegrationModal } from './components/matrix/SourceIntegrationModal';
import { ApaComplianceModal } from './components/matrix/ApaComplianceModal';
import { CitationGeneratorModal } from './components/matrix/CitationGeneratorModal';
import { CellEditorModal } from './components/matrix/CellEditorModal';
import { ThemeManagerModal } from './components/matrix/ThemeManagerModal';
import { SourceDetailModal } from './components/matrix/SourceDetailModal';
import { SupabaseAuthModal } from './components/matrix/SupabaseAuthModal';

import {
  DissertationProject,
  MatrixTheme,
  PeerReviewedSource,
  MatrixCell
} from './types/matrix';
import { MatrixStorage } from './lib/matrixStorage';
import { SupabaseService, isSupabaseConfigured } from './lib/supabase';
import { auditSourceApa7 } from './lib/apa7Engine';

type ActiveViewTab = 'matrix' | 'sources' | 'apa' | 'citations';

export default function App() {
  // Navigation & Views
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('matrix');

  // Core State
  const [project, setProject] = useState<DissertationProject>(() => MatrixStorage.loadProject());
  const [themes, setThemes] = useState<MatrixTheme[]>(() => MatrixStorage.loadThemes());
  const [sources, setSources] = useState<PeerReviewedSource[]>(() => MatrixStorage.loadSources());
  const [cells, setCells] = useState<MatrixCell[]>(() => MatrixStorage.loadCells());

  // Modals
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isApaModalOpen, setIsApaModalOpen] = useState(false);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Cell Editor Modal
  const [selectedCellTarget, setSelectedCellTarget] = useState<{
    source: PeerReviewedSource;
    theme: MatrixTheme;
    cell: MatrixCell | null;
  } | null>(null);

  // Source Detail Modal
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<PeerReviewedSource | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Auto-save debounced to localStorage & Supabase
  useEffect(() => {
    MatrixStorage.saveProject(project);
    MatrixStorage.saveThemes(themes);
    MatrixStorage.saveSources(sources);
    MatrixStorage.saveCells(cells);
  }, [project, themes, sources, cells]);

  // Sync to Supabase trigger
  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await SupabaseService.syncToSupabase({
        project,
        sources,
        themes,
        matrixCells: cells
      });
      setSyncStatus(res.message);
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      setSyncStatus('Sync notice: Preserved in local vault.');
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add newly sourced article
  const handleAddSource = (newSource: PeerReviewedSource) => {
    const updatedSources = [newSource, ...sources];
    setSources(updatedSources);

    // Prompt user with newly added source
    setSyncStatus(`Added "${newSource.title.slice(0, 36)}..." to matrix.`);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  // Update source
  const handleUpdateSource = (updatedSource: PeerReviewedSource) => {
    const audit = auditSourceApa7(updatedSource);
    const withScore = { ...updatedSource, apaComplianceScore: audit.score };
    setSources(prev => prev.map(s => s.id === withScore.id ? withScore : s));
  };

  // Batch update sources (e.g. from Auto-Fix All in APA compliance modal)
  const handleBatchUpdateSources = (updatedSources: PeerReviewedSource[]) => {
    setSources(updatedSources);
    setSyncStatus('Auto-fixed all sources to strict APA 7th standards.');
    setTimeout(() => setSyncStatus(null), 4000);
  };

  // Delete source
  const handleDeleteSource = (sourceId: string) => {
    setSources(prev => prev.filter(s => s.id !== sourceId));
    setCells(prev => prev.filter(c => c.sourceId !== sourceId));
  };

  // Save/Update Cell
  const handleSaveCell = (updatedCell: MatrixCell) => {
    setCells(prev => {
      const existingIdx = prev.findIndex(
        c => c.sourceId === updatedCell.sourceId && c.themeId === updatedCell.themeId
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = updatedCell;
        return copy;
      }
      return [...prev, updatedCell];
    });
  };

  // Save themes
  const handleSaveThemes = (updatedThemes: MatrixTheme[]) => {
    setThemes(updatedThemes);
  };

  return (
    <div className="flex h-screen flex-col bg-[#FDFDFD] text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-950 overflow-hidden">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav links) — Zone 3 (Actions) */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-6 z-30">
        {/* Zone 1: Single text element wordmark in display font */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); setActiveTab('matrix'); }}
            className="font-serif text-lg font-bold tracking-tight text-stone-900 hover:text-stone-700 transition-colors whitespace-nowrap"
          >
            Dissertation Matrix
          </a>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-stone-600">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`transition-colors hover:text-stone-900 pb-0.5 border-b-2 ${
              activeTab === 'matrix' ? 'border-stone-900 text-stone-900 font-semibold' : 'border-transparent text-stone-600'
            }`}
          >
            Matrix Dashboard
          </button>
          <button
            onClick={() => setIsSourceModalOpen(true)}
            className="transition-colors hover:text-stone-900 pb-0.5 border-b-2 border-transparent text-stone-600"
          >
            Source Integration
          </button>
          <button
            onClick={() => setIsApaModalOpen(true)}
            className="transition-colors hover:text-stone-900 pb-0.5 border-b-2 border-transparent text-stone-600"
          >
            APA 7th Compliance
          </button>
          <button
            onClick={() => setIsCitationModalOpen(true)}
            className="transition-colors hover:text-stone-900 pb-0.5 border-b-2 border-transparent text-stone-600"
          >
            Citation Generator & Bibliography
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-stone-200 hover:border-stone-400 bg-white text-stone-700 transition-colors whitespace-nowrap"
            title="Database persistence & authentication"
          >
            <Database className="h-3 w-3 text-stone-500" />
            <span>{isSupabaseConfigured ? 'Supabase Sync' : 'Local Vault'}</span>
          </button>

          <button
            onClick={() => setIsSourceModalOpen(true)}
            className="flex items-center gap-1.5 bg-stone-900 text-white px-3.5 py-1.5 text-xs font-medium hover:bg-stone-800 transition-colors whitespace-nowrap rounded-xs shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Source</span>
          </button>
        </div>
      </header>

      {/* Sync Status Banner if active */}
      {syncStatus && (
        <aside aria-label="Notification" className="bg-stone-900 text-stone-100 text-xs py-1.5 px-6 flex items-center justify-between border-b border-stone-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{syncStatus}</span>
          </div>
          <button
            onClick={() => setSyncStatus(null)}
            className="text-stone-400 hover:text-white text-[11px]"
          >
            Dismiss
          </button>
        </aside>
      )}

      {/* Main View Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <DissertationMatrixDashboard
          project={project}
          themes={themes}
          sources={sources}
          cells={cells}
          onOpenSourceIntegration={() => setIsSourceModalOpen(true)}
          onOpenApaCompliance={() => setIsApaModalOpen(true)}
          onOpenCitationGenerator={() => setIsCitationModalOpen(true)}
          onOpenThemeManager={() => setIsThemeModalOpen(true)}
          onOpenCellEditor={(source, theme, cell) => {
            setSelectedCellTarget({ source, theme, cell });
          }}
          onOpenSourceDetail={(source) => {
            setSelectedSourceDetail(source);
          }}
          onUpdateProject={(p) => setProject(p)}
        />
      </main>

      {/* MODAL 1: Source Integration Modal */}
      <SourceIntegrationModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onAddSource={handleAddSource}
      />

      {/* MODAL 2: APA 7th Compliance Audit Modal */}
      <ApaComplianceModal
        isOpen={isApaModalOpen}
        onClose={() => setIsApaModalOpen(false)}
        sources={sources}
        onUpdateSource={handleUpdateSource}
        onBatchUpdateSources={handleBatchUpdateSources}
      />

      {/* MODAL 3: Citation Generator & Annotated Bibliography Modal */}
      <CitationGeneratorModal
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
        sources={sources}
        themes={themes}
        cells={cells}
        projectTitle={project.title}
      />

      {/* MODAL 4: Matrix Themes Manager Modal */}
      <ThemeManagerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        themes={themes}
        onSaveThemes={handleSaveThemes}
      />

      {/* MODAL 5: Synthesis Cell Editor Drawer / Modal */}
      {selectedCellTarget && (
        <CellEditorModal
          isOpen={Boolean(selectedCellTarget)}
          onClose={() => setSelectedCellTarget(null)}
          cell={selectedCellTarget.cell}
          source={selectedCellTarget.source}
          theme={selectedCellTarget.theme}
          onSave={handleSaveCell}
        />
      )}

      {/* MODAL 6: Source Detail & Metadata Modal */}
      {selectedSourceDetail && (
        <SourceDetailModal
          isOpen={Boolean(selectedSourceDetail)}
          onClose={() => setSelectedSourceDetail(null)}
          source={selectedSourceDetail}
          onSaveSource={handleUpdateSource}
          onDeleteSource={handleDeleteSource}
        />
      )}

      {/* MODAL 7: Supabase Authentication & Sync Modal */}
      <SupabaseAuthModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onSyncTrigger={handleCloudSync}
        isSyncing={isSyncing}
      />
    </div>
  );
}
