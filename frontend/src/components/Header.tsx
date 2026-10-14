import React from 'react';
import {
  BookOpen,
  Keyboard,
  Columns,
  SquareCode,
  PanelRight,
  RefreshCw,
  Sliders,
  Terminal,
} from 'lucide-react';
import { HealthResponse } from '../types/compiler';

interface HeaderProps {
  health: HealthResponse | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
  onOpenIseGuide: () => void;
  onOpenSpecs: () => void;
  onOpenShortcuts: () => void;
  layoutMode: 'split' | 'editor-only' | 'results-only';
  setLayoutMode: (mode: 'split' | 'editor-only' | 'results-only') => void;
  activeNavTab: 'compiler' | 'phases';
  setActiveNavTab: (tab: 'compiler' | 'phases') => void;
  isCompiling: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  healthLoading,
  onRefreshHealth,
  onOpenIseGuide,
  onOpenSpecs,
  onOpenShortcuts,
  layoutMode,
  setLayoutMode,
  activeNavTab,
  setActiveNavTab,
  isCompiling,
}) => {
  return (
    <header className="h-[54px] border-b border-white/[0.08] bg-dark-900/95 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-4 flex items-center shrink-0 select-none">
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Left Side: Brand, Version & Nav */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Custom Minimal Compiler Icon & Title */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-lg bg-dark-800 border border-white/[0.12] flex items-center justify-center transition-all ${
                  isCompiling
                    ? 'border-primary-500 text-primary-400 shadow-glow-sm animate-pulse'
                    : 'text-primary-400 hover:border-primary-500/40'
                }`}
              >
                {/* Custom Minimalist Compiler SVG Glyph */}
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
              </div>
              {isCompiling && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary-400 animate-ping" />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs sm:text-sm text-slate-100 tracking-tight font-sans">
                  C Compiler Studio
                </span>
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded font-mono bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                  ISE 2026
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 border-l border-white/[0.08] pl-3 ml-1 text-xs">
            <button
              onClick={() => setActiveNavTab('compiler')}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
                activeNavTab === 'compiler'
                  ? 'bg-dark-800 text-white shadow-sm border border-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-primary-400" />
              <span>Compiler</span>
            </button>

            <button
              onClick={onOpenIseGuide}
              className="px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-dark-850 transition-colors font-medium flex items-center gap-1.5"
              title="Open ISE Study Guide & Viva Reference"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>ISE Guide</span>
            </button>

            <button
              onClick={onOpenSpecs}
              className="px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-dark-850 transition-colors font-medium flex items-center gap-1.5"
              title="Grammar Subset & Internal Limits"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Specifications</span>
            </button>
          </nav>
        </div>

        {/* Right Side: Health, Layout Switcher & Shortcuts */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Real Backend Connection Badge */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
              healthLoading
                ? 'bg-dark-850 border-white/[0.08] text-slate-400'
                : health?.compilerBinaryReady
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : health
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            }`}
            title={
              health
                ? `Backend: healthy | Compiler: ${health.compilerBinaryReady ? 'Ready' : 'Missing'} | Uptime: ${health.uptimeSeconds}s`
                : 'Backend offline or unreachable'
            }
          >
            {healthLoading ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping" />
                <span className="hidden sm:inline">Connecting</span>
              </>
            ) : health?.compilerBinaryReady ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                <span className="hidden sm:inline">Compiler Ready</span>
              </>
            ) : health ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="hidden sm:inline">Binary Missing</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="hidden sm:inline">Backend Offline</span>
              </>
            )}

            <button
              onClick={onRefreshHealth}
              disabled={healthLoading}
              className="hover:text-white transition-colors ml-0.5 opacity-70 hover:opacity-100"
              title="Refresh connection status"
            >
              <RefreshCw className={`w-3 h-3 ${healthLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Desktop Layout Switcher */}
          <div className="hidden lg:flex items-center p-0.5 rounded-lg bg-dark-850 border border-white/[0.08]">
            <button
              onClick={() => setLayoutMode('editor-only')}
              className={`p-1 rounded transition-colors ${
                layoutMode === 'editor-only'
                  ? 'bg-dark-750 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Editor View (Maximize code editor)"
            >
              <SquareCode className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('split')}
              className={`p-1 rounded transition-colors ${
                layoutMode === 'split'
                  ? 'bg-dark-750 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View (Editor + Results side by side)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('results-only')}
              className={`p-1 rounded transition-colors ${
                layoutMode === 'results-only'
                  ? 'bg-dark-750 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Results View (Maximize output inspector)"
            >
              <PanelRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Keyboard Shortcuts Trigger Button */}
          <button
            onClick={onOpenShortcuts}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-slate-200 border border-white/[0.08] transition-colors text-xs"
            title="Keyboard Shortcuts (⌘K)"
          >
            <Keyboard className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline text-[11px] font-mono">⌘K</span>
          </button>
        </div>
      </div>
    </header>
  );
};
