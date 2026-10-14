import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      keys: [`${modKey}`, 'Enter'],
      description: 'Analyze Compiler Phases (Flex, Bison, Semantics, TAC)',
      category: 'Compilation',
    },
    {
      keys: ['Shift', 'Enter'],
      description: 'Compile & Execute Native Binary (Host GCC/Clang)',
      category: 'Compilation',
    },
    {
      keys: [`${modKey}`, 'S'],
      description: 'Save / Trigger Compilation (prevents browser save)',
      category: 'Compilation',
    },
    {
      keys: ['1 - 8'],
      description: 'Switch between Results tabs (Overview, Tokens, AST, TAC, etc.)',
      category: 'Navigation',
    },
    {
      keys: [`${modKey}`, 'K'],
      description: 'Open this Keyboard Shortcuts cheat sheet',
      category: 'General',
    },
    {
      keys: ['Escape'],
      description: 'Close active dialog or modal',
      category: 'General',
    },
    {
      keys: ['Tab'],
      description: 'Indent 4 spaces (in both Monaco and Fallback mode)',
      category: 'Editor',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-dark-900 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-dark-850">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-100">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-slate-400">Fast IDE navigation and compilation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-dark-850 border border-white/[0.05] hover:border-white/[0.1] transition-colors"
            >
              <span className="text-xs text-slate-300 font-medium">{sc.description}</span>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                {sc.keys.map((k, kidx) => (
                  <kbd
                    key={kidx}
                    className="px-2 py-0.5 rounded-md bg-dark-950 text-slate-200 border border-white/[0.12] font-mono text-[11px] shadow-sm font-semibold"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-dark-850 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Command className="w-3.5 h-3.5 text-primary-400" />
            <span>Power User tip: Press <strong>Escape</strong> anytime to dismiss</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-200 font-medium text-xs border border-white/[0.08] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
