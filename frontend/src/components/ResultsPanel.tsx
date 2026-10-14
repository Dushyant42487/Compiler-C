import React, { useState } from 'react';
import {
  FileText,
  Scan,
  GitBranch,
  ShieldCheck,
  Cpu,
  Zap,
  Terminal,
  AlertOctagon,
  Copy,
  Check,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code,
  Flame,
  Play,
} from 'lucide-react';
import { CompileResponse } from '../types/compiler';

interface ResultsPanelProps {
  result: CompileResponse | null;
  isCompiling: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSpecs: () => void;
  onRunBinary?: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  result,
  isCompiling,
  activeTab,
  setActiveTab,
  onOpenSpecs,
  onRunBinary,
}) => {
  const [tokenSearch, setTokenSearch] = useState('');
  const [tokenTypeFilter, setTokenTypeFilter] = useState<string>('all');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [symbolKindFilter, setSymbolKindFilter] = useState<string>('all');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [astViewMode, setAstViewMode] = useState<'pills' | 'raw'>('pills');

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'lexical', label: 'Tokens', icon: Scan, badge: result?.tokens.length },
    { id: 'syntax', label: 'Parse Tree', icon: GitBranch },
    { id: 'semantic', label: 'Symbols', icon: ShieldCheck, badge: result?.symbolTable.length },
    {
      id: 'ir',
      label: '3-Address Code',
      icon: Cpu,
      badge: result?.intermediateCode?.instructions?.length,
    },
    {
      id: 'optimization',
      label: 'Optimizer',
      icon: Zap,
      badge:
        result?.optimization?.foldedLines && result.optimization.foldedLines.length > 0
          ? result.optimization.foldedLines.length
          : undefined,
    },
    {
      id: 'target',
      label: 'Terminal',
      icon: Terminal,
      badge: result?.targetExecution?.executed ? (result.targetExecution.exitCode === 0 ? '✓' : '!') : undefined,
    },
    {
      id: 'diagnostics',
      label: 'Diagnostics',
      icon: AlertOctagon,
      badge: result?.errors?.length ? result.errors.length : undefined,
      isErrorBadge: true,
    },
  ];

  // Token filtering
  const filteredTokens = result?.tokens.filter((t) => {
    const matchesSearch =
      t.lexeme.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      t.type.toLowerCase().includes(tokenSearch.toLowerCase());
    const matchesFilter =
      tokenTypeFilter === 'all'
        ? true
        : tokenTypeFilter === 'identifiers'
        ? t.type === 'ID'
        : tokenTypeFilter === 'keywords'
        ? ['INT', 'FLOAT', 'DOUBLE', 'CHAR', 'VOID', 'RETURN', 'IF', 'ELSE', 'WHILE', 'FOR', 'SWITCH', 'CASE'].includes(
            t.type
          )
        : tokenTypeFilter === 'operators'
        ? ['ASSIGN', 'PLUS', 'MINUS', 'MUL', 'DIV', 'MOD', 'LT', 'GT', 'EQ', 'NEQ'].includes(t.type)
        : true;
    return matchesSearch && matchesFilter;
  });

  // Symbol filtering
  const filteredSymbols = result?.symbolTable.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      s.dataType.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      s.type.toLowerCase().includes(symbolSearch.toLowerCase());
    const matchesKind =
      symbolKindFilter === 'all'
        ? true
        : symbolKindFilter === 'variable'
        ? s.type.toLowerCase() === 'variable'
        : symbolKindFilter === 'constant'
        ? s.type.toLowerCase() === 'constant'
        : symbolKindFilter === 'header'
        ? s.dataType.toLowerCase() === 'header'
        : true;
    return matchesSearch && matchesKind;
  });

  // AST Tokens Parser
  const parseTreeItems = (result?.parseTree || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const getTokenTypeColor = (type: string) => {
    if (['INT', 'FLOAT', 'DOUBLE', 'CHAR', 'VOID', 'RETURN', 'IF', 'ELSE', 'WHILE', 'FOR'].includes(type)) {
      return 'bg-indigo-950/70 text-indigo-300 border-indigo-500/30';
    }
    if (type === 'ID') {
      return 'bg-cyan-950/70 text-cyan-300 border-cyan-500/30';
    }
    if (['NUM', 'FLOAT_NUM'].includes(type)) {
      return 'bg-amber-950/70 text-amber-300 border-amber-500/30';
    }
    if (['ASSIGN', 'PLUS', 'MINUS', 'MUL', 'DIV', 'MOD', 'LT', 'GT'].includes(type)) {
      return 'bg-purple-950/70 text-purple-300 border-purple-500/30';
    }
    if (type === 'INCLUDE') {
      return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30';
    }
    return 'bg-dark-800 text-slate-300 border-white/[0.08]';
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e18] overflow-hidden relative">
      {/* 1. Results Navigation Tab Bar (38px) */}
      <div className="flex items-center gap-1 px-2.5 border-b border-white/[0.08] bg-[#070b13] overflow-x-auto shrink-0 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-primary-500 text-white bg-white/[0.04] font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive
                    ? 'text-primary-400'
                    : tab.isErrorBadge && tab.badge
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                    tab.isErrorBadge
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : isActive
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                      : 'bg-dark-800 text-slate-400 border border-white/[0.06]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Main Tab Content Area */}
      <div className="flex-1 p-4 overflow-y-auto min-h-0 text-slate-200 flex flex-col">
        {isCompiling ? (
          /* High-Fidelity Pipeline Compilation Progress */
          <div className="flex flex-col items-center justify-center my-auto py-12 text-slate-400 gap-4 max-w-sm mx-auto text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-dark-850 border border-primary-500/40 flex items-center justify-center shadow-glow-md">
              <Cpu className="w-6 h-6 text-primary-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Compiling Source Program...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Executing Flex Scanner, Bison LALR Parser, Semantic Analyzer, and TAC Generator.
              </p>
            </div>
            <div className="w-full bg-dark-850 rounded-full h-1.5 border border-white/[0.08] overflow-hidden">
              <div className="h-full w-full animate-pipeline-shimmer bg-primary-500" />
            </div>
          </div>
        ) : !result ? (
          /* Clean IDE Empty State */
          <div className="flex flex-col items-center justify-center my-auto py-12 text-center text-slate-400 max-w-md mx-auto p-4 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-dark-850 border border-white/[0.08] flex items-center justify-center text-primary-400 mb-3.5 shadow-sm">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm tracking-tight">Ready to Compile</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5 leading-relaxed">
              Select a program preset or write C code on the left, then click <strong>Analyze Phases</strong> (<code>⌘+Enter</code>) to inspect tokens, the AST tree, symbol tables, and Three-Address Code.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left text-xs mb-5">
              <div className="p-3 rounded-xl bg-dark-850/80 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <span className="text-primary-300 font-semibold flex items-center gap-1.5 mb-1">
                  <Play className="w-3.5 h-3.5 text-primary-400" />
                  <span>Analyze Phases</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Performs frontend lexical, syntax, semantic, and TAC analysis.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-dark-850/80 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5 mb-1">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Run Binary</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Orchestrates host GCC/Clang to compile and run with standard I/O.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenSpecs}
              className="text-xs text-slate-400 hover:text-primary-300 flex items-center gap-1.5 transition-colors font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5 text-primary-400" />
              <span>View Supported C Grammar & Limitations</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Result Header Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all shadow-sm ${
                    result.success
                      ? 'bg-gradient-to-r from-emerald-950/30 to-dark-900 border-emerald-500/30 text-emerald-200'
                      : 'bg-gradient-to-r from-rose-950/30 to-dark-900 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3 className="font-semibold text-sm tracking-tight text-slate-100">
                        {result.success
                          ? 'Frontend Verification Completed (0 Errors)'
                          : `Compilation Diagnostics Reported (${result.errors.length} Error${
                              result.errors.length === 1 ? '' : 's'
                            })`}
                      </h3>
                      <p className="text-xs mt-0.5 text-slate-300 leading-relaxed">
                        {result.success
                          ? 'Grammar validated via Bison LALR(1), symbol table populated, and 3-Address Code synthesized.'
                          : 'Review the diagnostics tab for precise source line numbers and compiler feedback.'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-400 shrink-0">
                    <div className="text-slate-200 font-semibold">{result.executionTimeMs}ms total</div>
                    <div className="text-[10px] text-slate-400 font-sans">Native ccompiler</div>
                  </div>
                </div>

                {/* Metric Summary Bento Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div
                    onClick={() => setActiveTab('lexical')}
                    className="p-3.5 rounded-xl bg-dark-850/90 border border-white/[0.08] hover:border-primary-500/40 transition-all cursor-pointer group shadow-sm hover:shadow-glow-sm"
                  >
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium group-hover:text-slate-200 transition-colors">
                        Tokens Scanned
                      </span>
                      <Scan className="w-3.5 h-3.5 text-primary-400" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-primary-400">
                      {result.tokens.length}
                    </p>
                    <span className="text-[10px] text-slate-500">Flex Lexer Stream</span>
                  </div>

                  <div
                    onClick={() => setActiveTab('semantic')}
                    className="p-3.5 rounded-xl bg-dark-850/90 border border-white/[0.08] hover:border-cyan-500/40 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium group-hover:text-slate-200 transition-colors">
                        Symbols Tracked
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-cyan-400">
                      {result.symbolTable.length}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {Math.round((result.symbolTable.length / 300) * 100)}% of 300 max
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('ir')}
                    className="p-3.5 rounded-xl bg-dark-850/90 border border-white/[0.08] hover:border-emerald-500/40 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium group-hover:text-slate-200 transition-colors">
                        3-Address Code
                      </span>
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-emerald-400">
                      {result.intermediateCode.instructions.length}
                    </p>
                    <span className="text-[10px] text-slate-500">TAC Instructions</span>
                  </div>

                  <div
                    onClick={() => setActiveTab('optimization')}
                    className="p-3.5 rounded-xl bg-dark-850/90 border border-white/[0.08] hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium group-hover:text-slate-200 transition-colors">
                        Constant Folding
                      </span>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-amber-400">
                      {result.optimization.foldedLines?.length || 0}
                    </p>
                    <span className="text-[10px] text-slate-500">Precomputed lines</span>
                  </div>
                </div>

                {/* Phase Verification Matrix */}
                <div className="p-4 rounded-xl bg-dark-850/90 border border-white/[0.08]">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                    <span>Compiler Phase Verification Checklist</span>
                    <span className="text-[10px] font-mono text-slate-500">6 Phases Evaluated</span>
                  </h4>
                  <div className="space-y-1.5">
                    {result.phases.map((phase) => (
                      <div
                        key={phase.id}
                        onClick={() => setActiveTab(phase.id)}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-dark-900 border border-white/[0.05] hover:border-white/[0.12] transition-colors cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {phase.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : phase.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                              -
                            </div>
                          )}
                          <span className="font-medium text-slate-200">{phase.name}</span>
                        </div>
                        <span className="text-slate-400 text-[11px] font-mono">{phase.summary}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LEXICAL TOKENS */}
            {activeTab === 'lexical' && (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                {/* Search & Category Filter */}
                <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tokenSearch}
                      onChange={(e) => setTokenSearch(e.target.value)}
                      placeholder="Search tokens or lexemes..."
                      className="w-full bg-dark-850 border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-dark-850 p-1 rounded-lg border border-white/[0.06] text-[11px]">
                      {['all', 'identifiers', 'keywords', 'operators'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setTokenTypeFilter(cat)}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            tokenTypeFilter === cat
                              ? 'bg-dark-750 text-white font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        handleCopy(
                          result.tokens.map((t) => `Line ${t.line}\t${t.type}\t${t.lexeme}`).join('\n'),
                          'tokens'
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 text-xs border border-white/[0.08] transition-colors"
                      title="Copy tokens as TSV"
                    >
                      {copiedSection === 'tokens' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                {/* Tokens Table */}
                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-dark-850 flex-1 flex flex-col min-h-0">
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#070b13] text-slate-400 font-mono sticky top-0 border-b border-white/[0.08] z-10">
                        <tr>
                          <th className="p-2.5 w-16 text-slate-500">Line</th>
                          <th className="p-2.5 w-36">Token Type</th>
                          <th className="p-2.5">Matched Lexeme</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] font-mono">
                        {filteredTokens && filteredTokens.length > 0 ? (
                          filteredTokens.map((t, idx) => (
                            <tr key={idx} className="hover:bg-dark-800/40 transition-colors">
                              <td className="p-2.5 text-slate-500">{t.line}</td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getTokenTypeColor(
                                    t.type
                                  )}`}
                                >
                                  {t.type}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-200 break-all">{t.lexeme}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-slate-500 font-sans">
                              No tokens found matching search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SYNTAX / PARSE TREE */}
            {activeTab === 'syntax' && (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100">
                      Abstract Syntax Tree (AST) & Grammatical Reduction
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Constructed via Bison LALR(1) parser using <code>mknode()</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center p-0.5 rounded-lg bg-dark-850 border border-white/[0.06] text-[11px]">
                      <button
                        onClick={() => setAstViewMode('pills')}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          astViewMode === 'pills'
                            ? 'bg-dark-750 text-white font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Visual Nodes
                      </button>
                      <button
                        onClick={() => setAstViewMode('raw')}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          astViewMode === 'raw'
                            ? 'bg-dark-750 text-white font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Raw Traversal
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopy(result.parseTree, 'ast')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 text-xs border border-white/[0.08] transition-colors"
                    >
                      {copiedSection === 'ast' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-dark-850 border border-white/[0.08] font-mono text-xs text-slate-300 overflow-y-auto flex-1">
                  {parseTreeItems.length > 0 ? (
                    astViewMode === 'pills' ? (
                      <div className="flex flex-wrap gap-2">
                        {parseTreeItems.map((token, i) => (
                          <span
                            key={i}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                              token.includes('declaration')
                                ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40'
                                : token.includes('statements')
                                ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40'
                                : token.includes('=')
                                ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                                : token.includes('return')
                                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                                : 'bg-dark-900 text-slate-300 border-white/[0.08]'
                            }`}
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono text-xs">
                        {result.parseTree}
                      </pre>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-500 font-sans text-xs">
                      <span>No parse tree generated (syntax error interrupted grammatical reduction).</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SEMANTIC & SYMBOL TABLE */}
            {activeTab === 'semantic' && (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={symbolSearch}
                      onChange={(e) => setSymbolSearch(e.target.value)}
                      placeholder="Search identifier name, data type, or category..."
                      className="w-full bg-dark-850 border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-dark-850 p-1 rounded-lg border border-white/[0.06] text-[11px]">
                      {['all', 'variable', 'constant', 'header'].map((k) => (
                        <button
                          key={k}
                          onClick={() => setSymbolKindFilter(k)}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            symbolKindFilter === k
                              ? 'bg-dark-750 text-white font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        handleCopy(
                          result.symbolTable
                            .map((s) => `${s.name}\t${s.dataType}\t${s.type}\t${s.line}\t${s.value}`)
                            .join('\n'),
                          'symbols'
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 text-xs border border-white/[0.08] transition-colors"
                    >
                      {copiedSection === 'symbols' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-dark-850 flex-1 flex flex-col min-h-0">
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#070b13] text-slate-400 font-mono sticky top-0 border-b border-white/[0.08] z-10">
                        <tr>
                          <th className="p-2.5">Identifier</th>
                          <th className="p-2.5">Data Type</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5 w-16 text-slate-500">Line</th>
                          <th className="p-2.5">Compile-Time Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] font-mono">
                        {filteredSymbols && filteredSymbols.length > 0 ? (
                          filteredSymbols.map((sym, idx) => (
                            <tr key={idx} className="hover:bg-dark-800/40 transition-colors">
                              <td className="p-2.5 font-bold text-slate-200">{sym.name}</td>
                              <td className="p-2.5 text-slate-400">{sym.dataType || '-'}</td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    sym.type === 'Variable'
                                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/20'
                                      : sym.type === 'Constant'
                                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/20'
                                      : sym.type === 'Function'
                                      ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/20'
                                      : 'bg-dark-800 text-slate-300 border-white/[0.08]'
                                  }`}
                                >
                                  {sym.type}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-500">{sym.line ?? '-'}</td>
                              <td className="p-2.5 text-emerald-400 font-mono">{sym.value || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                              No symbols registered in the symbol table matching filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: THREE-ADDRESS CODE (IR) */}
            {activeTab === 'ir' && (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100">
                      Three-Address Code (TAC) Quadruples
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Linear intermediate representation with synthesized temporaries (<code>t0, t1</code>) and branch labels (<code>L0, L1</code>)
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(result.intermediateCode.raw, 'ir')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 text-xs border border-white/[0.08] transition-colors"
                  >
                    {copiedSection === 'ir' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Copy TAC</span>
                  </button>
                </div>

                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-dark-950 p-3 font-mono text-xs flex-1 overflow-y-auto">
                  {result.intermediateCode.instructions.length > 0 ? (
                    <div className="space-y-1">
                      {result.intermediateCode.instructions.map((inst, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 hover:bg-dark-900/80 py-0.5 px-1.5 rounded transition-colors"
                        >
                          <span className="w-8 text-right text-slate-600 select-none text-[11px]">
                            {idx + 1}
                          </span>
                          <span
                            className={
                              inst.includes('LABEL')
                                ? 'text-amber-400 font-bold'
                                : inst.includes('GOTO') || inst.includes('JUMP') || inst.includes('IF')
                                ? 'text-cyan-400 font-semibold'
                                : inst.includes('RETURN')
                                ? 'text-emerald-400 font-semibold'
                                : 'text-slate-200'
                            }
                          >
                            {inst}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 py-6 text-center font-sans text-xs">
                      No intermediate code emitted for this program.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: OPTIMIZATION */}
            {activeTab === 'optimization' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-sm text-slate-100">
                      Compile-Time Constant Folding & Propagation Pass
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Our educational compiler evaluates arithmetic and logical constant expressions at compile-time.
                    In <code>binary_expression()</code>, if both operands satisfy <code>can_eval()</code>, the compiler calculates the value directly, saving CPU registers and runtime instructions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-dark-850 border border-white/[0.08] space-y-3">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Detected Constant Folding Records:
                  </h4>
                  {result.optimization.foldedLines && result.optimization.foldedLines.length > 0 ? (
                    <div className="space-y-2">
                      {result.optimization.foldedLines.map((line, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-dark-900 border border-amber-500/20 font-mono text-xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="text-amber-300 font-semibold">{line}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-dark-950 border border-white/[0.08]">
                            Folded Constant
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-dark-900 border border-white/[0.05] text-slate-400 text-xs leading-relaxed italic">
                      No constant expressions folded in this compilation. (Try writing expressions like <code>10 + 20</code> or <code>5 * 6</code> to trigger constant folding!).
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: PROGRAM EXECUTION CONSOLE (FULL-HEIGHT DEVELOPER TERMINAL) */}
            {activeTab === 'target' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100">
                      Runtime Execution Terminal
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Host backend: {result.targetExecution.delegatedHost}
                    </p>
                  </div>
                  {result.targetExecution.executed && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                        result.targetExecution.exitCode === 0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      Exit Code: {result.targetExecution.exitCode}
                    </span>
                  )}
                </div>

                {/* Simulated Full-Height Developer Terminal Surface */}
                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#070b13] flex-1 flex flex-col min-h-0 shadow-lg">
                  {/* Terminal Header Bar */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#0c111d] border-b border-white/[0.08] text-[11px] font-mono text-slate-400 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 text-slate-300 font-semibold">terminal ~ ./a.out</span>
                    </div>
                    {result.targetExecution.executed && (
                      <span className="text-emerald-400">Duration: {result.executionTimeMs}ms</span>
                    )}
                  </div>

                  {/* Terminal Output Body (Fills Available Height) */}
                  <div className="p-4 font-mono text-xs text-slate-200 flex-1 overflow-y-auto">
                    {result.targetExecution.executed ? (
                      <div className="space-y-2">
                        <div className="text-slate-500 text-[11px]">
                          $ ./ccompiler --run main.c
                        </div>
                        {result.targetExecution.output ? (
                          <pre className="whitespace-pre-wrap leading-relaxed text-emerald-300 font-mono text-xs">
                            {result.targetExecution.output}
                          </pre>
                        ) : (
                          <div className="text-slate-500 italic">
                            [Process exited with code 0 - no stdout emitted]
                          </div>
                        )}
                        <div className="pt-2 text-[11px] text-slate-500">
                          Execution completed in {result.executionTimeMs}ms.
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-2.5 py-12">
                        <Terminal className="w-8 h-8 text-slate-600 mb-1" />
                        <p className="text-xs text-slate-300 font-medium">Binary Not Executed Yet</p>
                        <p className="text-[11px] text-slate-500 max-w-xs">
                          Compile and run natively using the host C backend compiler (GCC/Clang).
                        </p>
                        {onRunBinary && (
                          <button
                            onClick={onRunBinary}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                            <span>Run Binary Now</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: COMPILER DIAGNOSTICS */}
            {activeTab === 'diagnostics' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-100">
                    Compiler Diagnostics & Error Feedback
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {result.errors.length} diagnostic{result.errors.length === 1 ? '' : 's'} recorded
                  </span>
                </div>

                {result.errors.length > 0 ? (
                  <div className="space-y-2">
                    {result.errors.map((err, idx) => {
                      const isSyntax = err.toLowerCase().includes('syntax');
                      const isSemantic =
                        err.toLowerCase().includes('undeclared') ||
                        err.toLowerCase().includes('redeclaration') ||
                        err.toLowerCase().includes('semantic') ||
                        err.toLowerCase().includes('zero');
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs font-mono text-rose-200 flex items-start gap-3"
                        >
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-rose-100">{err}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-sans">
                              <span className="px-1.5 py-0.2 rounded bg-dark-900 border border-white/[0.08] font-mono text-[10px]">
                                Phase: {isSyntax ? 'Bison LALR Parser' : isSemantic ? 'Semantic Analyzer' : 'Flex Scanner'}
                              </span>
                              <span>•</span>
                              <span>Check line declaration and grammar syntax</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Clean compilation! No lexical, syntax, or semantic diagnostics recorded.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
