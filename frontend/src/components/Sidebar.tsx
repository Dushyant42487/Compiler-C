import React, { useState } from 'react';
import {
  FileCode,
  FolderOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
} from 'lucide-react';
import { CODE_EXAMPLES, CodeExample } from '../examples/codeExamples';
import { ActivityView } from './ActivityBar';
import { CompileResponse } from '../types/compiler';

interface SidebarProps {
  activeView: ActivityView;
  selectedExampleId: string;
  onSelectExample: (example: CodeExample) => void;
  result: CompileResponse | null;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  selectedExampleId,
  onSelectExample,
  result,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState({
    files: true,
    valid: true,
    errors: true,
    capacities: true,
  });

  if (activeView === 'none') return null;

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredExamples = CODE_EXAMPLES.filter(
    (ex) =>
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.description.toLowerCase().includes(search.toLowerCase())
  );

  const validExamples = filteredExamples.filter((ex) => ex.category === 'valid');
  const errorExamples = filteredExamples.filter((ex) => ex.category !== 'valid');

  return (
    <div className="hidden md:flex w-64 bg-[#0a0e18] border-r border-white/[0.08] flex-col h-full min-h-0 select-none shrink-0 z-10 animate-in slide-in-from-left-2 duration-150">
      {/* Sidebar Header */}
      <div className="px-3.5 py-2.5 border-b border-white/[0.08] flex items-center justify-between bg-dark-900/60">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {activeView === 'explorer' ? 'Explorer' : 'Examples Library'}
        </span>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-xs px-1 rounded transition-colors"
          title="Collapse Sidebar (⌘B)"
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs..."
            className="w-full bg-[#111728] text-slate-200 border border-white/[0.08] rounded-md pl-7 pr-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
          />
        </div>
      </div>

      {/* Scrollable Tree Sections */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
        {/* Section 1: Project Files */}
        {activeView === 'explorer' && (
          <div>
            <button
              onClick={() => toggleSection('files')}
              className="w-full flex items-center gap-1.5 px-1 py-1 text-slate-400 hover:text-slate-200 font-semibold text-[11px] uppercase tracking-wider transition-colors"
            >
              {openSections.files ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <FolderOpen className="w-3.5 h-3.5 text-primary-400" />
              <span>Workspace Files</span>
            </button>

            {openSections.files && (
              <div className="mt-1 ml-3 space-y-0.5 border-l border-white/[0.06] pl-2 font-mono">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary-600/15 border border-primary-500/30 text-white font-medium">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">main.c</span>
                  <span className="text-[10px] text-primary-300 ml-auto font-sans">Active</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded text-slate-400 hover:text-slate-300 transition-colors">
                  <span className="w-3.5 h-3.5 rounded bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center font-bold">
                    H
                  </span>
                  <span className="truncate">stdio.h (stdlib)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Valid Programs */}
        <div>
          <button
            onClick={() => toggleSection('valid')}
            className="w-full flex items-center gap-1.5 px-1 py-1 text-slate-400 hover:text-slate-200 font-semibold text-[11px] uppercase tracking-wider transition-colors"
          >
            {openSections.valid ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Valid Programs ({validExamples.length})</span>
          </button>

          {openSections.valid && (
            <div className="mt-1 ml-3 space-y-0.5 border-l border-white/[0.06] pl-1">
              {validExamples.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onSelectExample(ex)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors truncate block ${
                    selectedExampleId === ex.id
                      ? 'bg-primary-600/20 text-primary-300 font-medium border border-primary-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                  title={ex.description}
                >
                  <span className="truncate">{ex.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Error Cases */}
        <div>
          <button
            onClick={() => toggleSection('errors')}
            className="w-full flex items-center gap-1.5 px-1 py-1 text-slate-400 hover:text-slate-200 font-semibold text-[11px] uppercase tracking-wider transition-colors"
          >
            {openSections.errors ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Diagnostic Tests ({errorExamples.length})</span>
          </button>

          {openSections.errors && (
            <div className="mt-1 ml-3 space-y-0.5 border-l border-white/[0.06] pl-1">
              {errorExamples.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onSelectExample(ex)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors truncate block ${
                    selectedExampleId === ex.id
                      ? 'bg-rose-950/40 text-rose-300 font-medium border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                  title={ex.description}
                >
                  <span className="truncate">{ex.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Live Compiler Capacities */}
        <div>
          <button
            onClick={() => toggleSection('capacities')}
            className="w-full flex items-center gap-1.5 px-1 py-1 text-slate-400 hover:text-slate-200 font-semibold text-[11px] uppercase tracking-wider transition-colors"
          >
            {openSections.capacities ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Capacity Gauges</span>
          </button>

          {openSections.capacities && (
            <div className="mt-1 ml-3 p-2.5 rounded-lg bg-dark-900 border border-white/[0.06] space-y-2 font-mono text-[11px]">
              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Symbols:</span>
                  <span className="text-cyan-400 font-semibold">
                    {result?.symbolTable?.length || 0} / 300
                  </span>
                </div>
                <div className="w-full bg-dark-950 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (((result?.symbolTable?.length || 0) / 300) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400">
                  <span>TAC Quads:</span>
                  <span className="text-emerald-400 font-semibold">
                    {result?.intermediateCode?.instructions?.length || 0} / 500
                  </span>
                </div>
                <div className="w-full bg-dark-950 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (((result?.intermediateCode?.instructions?.length || 0) / 500) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
