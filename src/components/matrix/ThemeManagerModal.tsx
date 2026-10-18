import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Edit2, Check } from 'lucide-react';
import { MatrixTheme } from '../../types/matrix';

interface ThemeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  themes: MatrixTheme[];
  onSaveThemes: (themes: MatrixTheme[]) => void;
}

export const ThemeManagerModal: React.FC<ThemeManagerModalProps> = ({
  isOpen,
  onClose,
  themes,
  onSaveThemes
}) => {
  const [localThemes, setLocalThemes] = useState<MatrixTheme[]>(themes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDesc, setNewThemeDesc] = useState('');
  const [newThemeCode, setNewThemeCode] = useState('');

  if (!isOpen) return null;

  const handleAddTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;

    const nextOrder = localThemes.length + 1;
    const code = newThemeCode.trim() || `T${nextOrder}`;

    const created: MatrixTheme = {
      id: `th-${Date.now()}`,
      code,
      name: newThemeName.trim(),
      description: newThemeDesc.trim(),
      colorKey: 'stone',
      order: nextOrder
    };

    const updated = [...localThemes, created];
    setLocalThemes(updated);
    onSaveThemes(updated);
    setNewThemeName('');
    setNewThemeDesc('');
    setNewThemeCode('');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= localThemes.length) return;

    const copy = [...localThemes];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const reordered = copy.map((t, idx) => ({ ...t, order: idx + 1 }));
    setLocalThemes(reordered);
    onSaveThemes(reordered);
  };

  const handleDelete = (id: string) => {
    if (localThemes.length <= 1) {
      alert('The dissertation matrix requires at least one literature theme.');
      return;
    }
    const updated = localThemes.filter(t => t.id !== id).map((t, idx) => ({ ...t, order: idx + 1 }));
    setLocalThemes(updated);
    onSaveThemes(updated);
  };

  const handleUpdate = (id: string, name: string, desc: string, code: string) => {
    const updated = localThemes.map(t =>
      t.id === id ? { ...t, name, description: desc, code } : t
    );
    setLocalThemes(updated);
    onSaveThemes(updated);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div 
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col bg-[#FDFDFD] border border-stone-300 shadow-2xl rounded-xs"
        role="dialog"
        aria-labelledby="theme-manager-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5 bg-[#FAF9F6]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-widest">
              <span>Literature Review Conceptual Architecture</span>
            </div>
            <h2 id="theme-manager-title" className="mt-1 font-serif text-xl font-bold text-stone-900">
              Manage Matrix Themes & Research Constructs
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              Columns in your literature matrix represent the critical synthesis themes of your dissertation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-stone-400 hover:text-stone-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* New Theme Form */}
          <form onSubmit={handleAddTheme} className="bg-stone-50 border border-stone-200 p-4 space-y-3">
            <span className="block text-xs font-mono font-semibold uppercase text-stone-700">
              Add New Synthesis Theme Column
            </span>
            <div className="grid grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Code (e.g. T5)"
                value={newThemeCode}
                onChange={(e) => setNewThemeCode(e.target.value)}
                className="col-span-1 border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none font-mono"
              />
              <input
                type="text"
                required
                placeholder="Theme Title (e.g., Epistemic Vulnerability)"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                className="col-span-3 border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Conceptual description / scope of this literature theme..."
              value={newThemeDesc}
              onChange={(e) => setNewThemeDesc(e.target.value)}
              className="w-full border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-stone-900 text-white px-4 py-1.5 text-xs font-medium hover:bg-stone-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Theme</span>
              </button>
            </div>
          </form>

          {/* Existing Themes List */}
          <div className="space-y-3">
            <span className="block text-xs font-mono uppercase text-stone-500">
              Active Theme Columns ({localThemes.length})
            </span>
            {localThemes.map((theme, index) => {
              const isEditing = editingId === theme.id;

              return (
                <div
                  key={theme.id}
                  className="border border-stone-200 bg-white p-3.5 flex items-start justify-between gap-3"
                >
                  {isEditing ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={theme.code}
                          id={`edit-code-${theme.id}`}
                          className="w-16 border border-stone-300 p-1 text-xs font-mono"
                        />
                        <input
                          type="text"
                          defaultValue={theme.name}
                          id={`edit-name-${theme.id}`}
                          className="flex-1 border border-stone-300 p-1 text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        defaultValue={theme.description}
                        id={`edit-desc-${theme.id}`}
                        className="w-full border border-stone-300 p-1 text-xs"
                      />
                      <button
                        onClick={() => {
                          const code = (document.getElementById(`edit-code-${theme.id}`) as HTMLInputElement)?.value;
                          const name = (document.getElementById(`edit-name-${theme.id}`) as HTMLInputElement)?.value;
                          const desc = (document.getElementById(`edit-desc-${theme.id}`) as HTMLInputElement)?.value;
                          handleUpdate(theme.id, name, desc, code);
                        }}
                        className="flex items-center gap-1 bg-stone-900 text-white px-3 py-1 text-xs"
                      >
                        <Check className="h-3 w-3" />
                        <span>Update</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5">
                          {theme.code}
                        </span>
                        <h4 className="font-serif text-sm font-bold text-stone-900">
                          {theme.name}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-normal">
                        {theme.description || 'No description provided.'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                      title="Move left in matrix"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={index === localThemes.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                      title="Move right in matrix"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(isEditing ? null : theme.id)}
                      className="p-1 text-stone-400 hover:text-stone-700"
                      title="Edit theme"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(theme.id)}
                      className="p-1 text-stone-400 hover:text-rose-600"
                      title="Delete theme"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-stone-200 px-6 py-4 bg-stone-50">
          <button
            onClick={onClose}
            className="bg-stone-900 text-white px-5 py-2 text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Finished
          </button>
        </div>
      </div>
    </div>
  );
};
