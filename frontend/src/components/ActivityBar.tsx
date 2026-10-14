import React from 'react';
import {
  Files,
  BookOpen,
  Keyboard,
  Cpu,
  Layers,
  Sliders,
} from 'lucide-react';
import { HealthResponse } from '../types/compiler';

export type ActivityView = 'explorer' | 'examples' | 'symbols' | 'none';

interface ActivityBarProps {
  activeView: ActivityView;
  setActiveView: (view: ActivityView) => void;
  onOpenIseGuide: () => void;
  onOpenSpecs: () => void;
  onOpenShortcuts: () => void;
  health: HealthResponse | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
  isCompiling: boolean;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  setActiveView,
  onOpenIseGuide,
  onOpenSpecs,
  onOpenShortcuts,
  health,
  healthLoading,
  onRefreshHealth,
  isCompiling,
}) => {
  const toggleView = (view: ActivityView) => {
    setActiveView(activeView === view ? 'none' : view);
  };

  return (
    <aside className="hidden md:flex w-12 bg-[#080b12] border-r border-white/[0.08] flex-col items-center justify-between py-2 shrink-0 select-none z-20">
      {/* Top Group: Brand + Views */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Studio Logo Icon */}
        <div
          className={`w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 mb-2 transition-all ${
            isCompiling ? 'animate-pulse shadow-glow-sm border-primary-400 text-white' : ''
          }`}
          title="C Compiler Studio IDE"
        >
          <Cpu className="w-4 h-4" />
        </div>

        {/* Explorer / Files View */}
        <button
          onClick={() => toggleView('explorer')}
          className={`relative p-2.5 rounded-lg transition-colors group ${
            activeView === 'explorer'
              ? 'text-white bg-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
          title="Project Explorer (Files & Examples)"
        >
          <Files className="w-4 h-4" />
          {activeView === 'explorer' && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary-500" />
          )}
        </button>

        {/* Examples Library View */}
        <button
          onClick={() => toggleView('examples')}
          className={`relative p-2.5 rounded-lg transition-colors group ${
            activeView === 'examples'
              ? 'text-white bg-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
          title="C Code Examples Library"
        >
          <Layers className="w-4 h-4" />
          {activeView === 'examples' && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary-500" />
          )}
        </button>

        {/* ISE Academic Guide */}
        <button
          onClick={onOpenIseGuide}
          className="p-2.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/[0.04] transition-colors"
          title="ISE Guide & Architecture Reference"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Compiler Specifications */}
        <button
          onClick={onOpenSpecs}
          className="p-2.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/[0.04] transition-colors"
          title="Grammar & Compiler Limits"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Group: Shortcuts & Backend Connection Dot */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Keyboard Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
          title="Keyboard Shortcuts (⌘K)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Health Status Indicator Dot */}
        <button
          onClick={onRefreshHealth}
          className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.04] transition-colors group relative"
          title={
            healthLoading
              ? 'Checking backend compiler...'
              : health?.compilerBinaryReady
              ? 'Compiler Ready (Click to re-ping)'
              : 'Compiler Offline (Click to retry)'
          }
        >
          <span
            className={`w-2.5 h-2.5 rounded-full block transition-all ${
              healthLoading
                ? 'bg-amber-400 animate-ping'
                : health?.compilerBinaryReady
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
            }`}
          />
        </button>
      </div>
    </aside>
  );
};
