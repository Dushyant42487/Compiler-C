import React from 'react';
import {
  Scan,
  GitBranch,
  ShieldCheck,
  Cpu,
  Zap,
  Terminal,
  CheckCircle2,
  XCircle,
  Minus,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { CompilerPhase, PhaseStatus } from '../types/compiler';

interface PhasePipelineProps {
  phases: CompilerPhase[] | null;
  isCompiling: boolean;
  onSelectPhase: (phaseId: string) => void;
  selectedTab: string;
  tokensCount?: number;
  symbolsCount?: number;
  tacCount?: number;
  foldedCount?: number;
}

export const PhasePipeline: React.FC<PhasePipelineProps> = ({
  phases,
  isCompiling,
  onSelectPhase,
  selectedTab,
  tokensCount,
  symbolsCount,
  tacCount,
  foldedCount,
}) => {
  const defaultPhases = [
    {
      id: 'lexical',
      tabId: 'lexical',
      name: '1. Lexical',
      fullName: 'Lexical Analysis',
      icon: Scan,
      desc: 'Flex Scanner • Token Stream',
    },
    {
      id: 'syntax',
      tabId: 'syntax',
      name: '2. Syntax',
      fullName: 'Syntax Analysis',
      icon: GitBranch,
      desc: 'Bison LALR(1) • AST Tree',
    },
    {
      id: 'semantic',
      tabId: 'semantic',
      name: '3. Semantic',
      fullName: 'Semantic Analysis',
      icon: ShieldCheck,
      desc: 'Type Checking • Symbol Table',
    },
    {
      id: 'ir',
      tabId: 'ir',
      name: '4. TAC IR',
      fullName: 'Intermediate Code',
      icon: Cpu,
      desc: 'Three-Address Code & Labels',
    },
    {
      id: 'optimization',
      tabId: 'optimization',
      name: '5. Optimizer',
      fullName: 'Code Optimization',
      icon: Zap,
      desc: 'Compile-Time Constant Folding',
    },
    {
      id: 'target',
      tabId: 'target',
      name: '6. Execution',
      fullName: 'Native Execution',
      icon: Terminal,
      desc: 'Host Backend Driver (gcc/clang)',
    },
  ];

  const getMetricBadge = (id: string, status: PhaseStatus) => {
    if (status !== 'completed') return null;
    if (id === 'lexical' && tokensCount !== undefined) {
      return `${tokensCount} tok`;
    }
    if (id === 'semantic' && symbolsCount !== undefined) {
      return `${symbolsCount} sym`;
    }
    if (id === 'ir' && tacCount !== undefined) {
      return `${tacCount} tac`;
    }
    if (id === 'optimization' && foldedCount !== undefined && foldedCount > 0) {
      return `${foldedCount} folded`;
    }
    return null;
  };

  return (
    <div className="h-10 border-b border-white/[0.08] bg-dark-900/90 px-3 flex items-center overflow-x-auto shrink-0 select-none no-scrollbar">
      <div className="flex items-center gap-1.5 w-full min-w-max">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-1 hidden xl:inline">
          Phases
        </span>

        {defaultPhases.map((phaseDef, idx) => {
          const actualPhase = phases?.find((p) => p.id === phaseDef.id);
          const status: PhaseStatus = isCompiling
            ? 'running'
            : actualPhase?.status || 'skipped';

          const IconComponent = phaseDef.icon;
          const isSelected = selectedTab === phaseDef.tabId;
          const metric = getMetricBadge(phaseDef.id, status);

          let pillStyles = 'bg-dark-850/80 text-slate-400 border-white/[0.06] hover:border-white/[0.15] hover:text-slate-200';
          let iconColor = 'text-slate-400';

          if (isCompiling) {
            pillStyles = 'bg-primary-950/40 text-primary-300 border-primary-500/40 animate-pulse';
            iconColor = 'text-primary-400';
          } else if (status === 'completed') {
            pillStyles = 'bg-emerald-950/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50';
            iconColor = 'text-emerald-400';
          } else if (status === 'failed') {
            pillStyles = 'bg-rose-950/30 text-rose-300 border-rose-500/40 hover:border-rose-500/60';
            iconColor = 'text-rose-400';
          }

          return (
            <React.Fragment key={phaseDef.id}>
              <button
                onClick={() => onSelectPhase(phaseDef.tabId)}
                className={`group flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs transition-all cursor-pointer ${pillStyles} ${
                  isSelected ? 'ring-1 ring-primary-500 bg-dark-800 font-semibold shadow-sm' : ''
                }`}
                title={`${phaseDef.fullName} — ${actualPhase?.summary || phaseDef.desc}`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${iconColor} shrink-0 transition-transform group-hover:scale-105`} />
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                  {phaseDef.name}
                </span>

                {metric && (
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {metric}
                  </span>
                )}

                {/* Status Dot / Icon */}
                {isCompiling ? (
                  <Loader2 className="w-3 h-3 animate-spin text-primary-400 shrink-0" />
                ) : status === 'completed' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : status === 'failed' ? (
                  <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                ) : (
                  <Minus className="w-3 h-3 text-slate-600 shrink-0" />
                )}
              </button>

              {idx < defaultPhases.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-700/80 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
