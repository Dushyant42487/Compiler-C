import React, { useState } from 'react';
import {
  X,
  Layers,
  FileCode,
  Cpu,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { CompilerInfoResponse } from '../types/compiler';

interface SpecificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  info?: CompilerInfoResponse | null;
}

export const SpecificationsModal: React.FC<SpecificationsModalProps> = ({
  isOpen,
  onClose,
  info,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'phases' | 'specs'>('specs');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-dark-900 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-dark-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-100 tracking-tight">
                  C Compiler Studio — Specifications & Architecture
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-primary-500/15 text-primary-300 border border-primary-500/30">
                  ANSI C (Subset)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Compiler Frontend Pipeline • Flex Lexer • Bison LALR(1) Parser • Three-Address Code IR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-white/[0.08] bg-dark-850/60 overflow-x-auto shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium transition-all ${
              activeTab === 'specs'
                ? 'border-primary-500 text-primary-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Language Specs & Limits</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium transition-all ${
              activeTab === 'architecture'
                ? 'border-primary-500 text-primary-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture & Data Flow</span>
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium transition-all ${
              activeTab === 'phases'
                ? 'border-primary-500 text-primary-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Compiler Phases Deep-Dive</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-5 overflow-y-auto min-h-0 text-xs text-slate-300 space-y-5">
          {/* TAB 1: SPECS & LIMITS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-dark-850 border border-white/[0.08] space-y-2">
                <h3 className="font-semibold text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Static Capacities & Internal Compiler Limits</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-dark-900 border border-white/[0.05]">
                    <div className="text-slate-500">Max Symbols</div>
                    <div className="text-cyan-400 font-bold text-sm">300 identifiers</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-dark-900 border border-white/[0.05]">
                    <div className="text-slate-500">Max TAC Quads</div>
                    <div className="text-emerald-400 font-bold text-sm">500 instructions</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-dark-900 border border-white/[0.05]">
                    <div className="text-slate-500">Max Diagnostics</div>
                    <div className="text-rose-400 font-bold text-sm">100 records</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-dark-900 border border-white/[0.05]">
                    <div className="text-slate-500">Max Token Length</div>
                    <div className="text-amber-400 font-bold text-sm">99 bytes</div>
                  </div>
                </div>
              </div>

              {/* Supported Features vs Unsupported */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-dark-850 border border-emerald-500/20 space-y-2">
                  <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Supported C Grammar Features</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                    <li>Data Types: <code>int</code>, <code>float</code>, <code>char</code>, <code>double</code>, <code>void</code></li>
                    <li>Preprocessor: <code>#include &lt;stdio.h&gt;</code>, <code>#include &lt;stdlib.h&gt;</code></li>
                    <li>Control Flow: <code>if</code>, <code>if-else</code>, <code>while</code>, <code>for</code></li>
                    <li>Arithmetic: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>%</code> (with type casts)</li>
                    <li>Relational & Logical: <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>, <code>==</code>, <code>!=</code>, <code>&amp;&amp;</code>, <code>||</code>, <code>!</code></li>
                    <li>Pointers &amp; Addresses: unary <code>*ptr</code> and <code>&amp;var</code> operators</li>
                    <li>Compile-Time Optimization: Constant expression folding in expressions</li>
                    <li>Library Support: Whitelist of 47 standard functions (<code>printf</code>, <code>scanf</code>, etc.)</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-rose-500/20 space-y-2">
                  <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Current Language Limitations</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                    <li>Flat scope table: Inner-block variable shadowing is rejected as duplicate declaration</li>
                    <li>Single-dimensional arrays only; multi-dimensional tensor arrays not parsed</li>
                    <li><code>struct</code>, <code>union</code>, and <code>typedef</code> aggregate records not supported</li>
                    <li>Variadic argument declarations (<code>...</code>) unsupported (library calls handled natively)</li>
                    <li>Bitwise operators (<code>&amp;</code>, <code>|</code>, <code>^</code>, <code>&lt;&lt;</code>, <code>&gt;&gt;</code>) not parsed in subset grammar</li>
                  </ul>
                </div>
              </div>

              {info && (
                <div className="p-3 rounded-lg bg-dark-950 border border-white/[0.06] text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Binary: {info.binaryPath}</span>
                  <span>Version: {info.version}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Pipeline Architecture & Execution Flow</span>
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  The application is structured into a clean three-tier system: React frontend client, Node.js/Express
                  REST API controller, and native compiled binary (<code>./ccompiler</code>) executed inside an isolated
                  temporary workspace.
                </p>
              </div>

              {/* Data Flow Diagram Card */}
              <div className="p-4 rounded-xl bg-dark-850 border border-white/[0.08] font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
                <div className="text-primary-400 font-bold mb-2">// Compiler Pipeline Data Flow</div>
                <div className="text-slate-400">
                  Source Code (.c) <br />
                  &nbsp;&nbsp;│ <br />
                  &nbsp;&nbsp;▼ [Flex Scanner: lexer.l] <br />
                  Tokens Stream (type, lexeme, line) <br />
                  &nbsp;&nbsp;│ <br />
                  &nbsp;&nbsp;▼ [Bison LALR(1) Parser: parser_wrapper.y] <br />
                  Abstract Syntax Tree (AST nodes via mknode()) <br />
                  &nbsp;&nbsp;│ <br />
                  &nbsp;&nbsp;▼ [Semantic Analysis &amp; Symbol Table] <br />
                  Validated Types &amp; Scopes (symbol_table[300]) <br />
                  &nbsp;&nbsp;│ <br />
                  &nbsp;&nbsp;▼ [Intermediate Code Generation] <br />
                  Three-Address Code (TAC with temporaries t0, t1 and labels L0, L1) <br />
                  &nbsp;&nbsp;│ <br />
                  &nbsp;&nbsp;▼ [Optimization Pass] <br />
                  Constant Folding &amp; Propagation in binary_expression() <br />
                  &nbsp;&nbsp;│ <br />
                  &nbsp;&nbsp;▼ [Host Backend Execution (gcc / clang)] <br />
                  Native Machine Code Execution (stdout, stderr, exit code)
                </div>
              </div>

              {/* Component Responsibilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.06]">
                  <h4 className="font-semibold text-slate-100 flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Compiler Binary (ccompiler)</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Written in C99, Flex, and Bison. Compiles natively on macOS, Linux, and Windows. Outputs
                    structured reports, token streams, AST nodes, and TAC quadruples.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.06]">
                  <h4 className="font-semibold text-slate-100 flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Backend REST Service</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Node.js &amp; TypeScript with Express. Enforces 64KB input guards, sanitization, process isolation,
                    and executes <code>child_process.spawn()</code> with zero shell injection risk.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPILER PHASES */}
          {activeTab === 'phases' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                        Phase 1
                      </span>
                      <span>Lexical Analysis (Flex Scanner)</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">compiler/lexer.l</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Tokenizes character streams into tokens (<code>ID</code>, <code>NUM</code>, <code>KEYWORD</code>, <code>OPERATOR</code>). Tracks line numbers through comments and protects against oversized tokens.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                        Phase 2
                      </span>
                      <span>Syntax Analysis (Bison LALR Parser)</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">compiler/parser_wrapper.y</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Enforces context-free grammar rules for ANSI C constructs. Builds the Abstract Syntax Tree using <code>mknode()</code> and handles error recovery.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                        Phase 3
                      </span>
                      <span>Semantic Analysis &amp; Symbol Table</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">Symbol Table &amp; Type Checker</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Verifies variable declarations, prevents keyword shadowing, enforces type consistency, detects divide-by-zero, and populates the 300-slot symbol table.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        Phase 4
                      </span>
                      <span>Intermediate Code Generation (TAC)</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">Three-Address Code Quadruples</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Linearizes expressions and control flow into Three-Address Code with generated temporaries (<code>t0, t1</code>) and branch labels (<code>L0, L1</code>).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        Phase 5
                      </span>
                      <span>Code Optimization (Constant Folding)</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">Compile-Time Evaluation Pass</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Precomputes arithmetic and logical expressions whose operands evaluate to constants via <code>can_eval()</code>, eliminating runtime instructions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                        Phase 6
                      </span>
                      <span>Host Target Execution</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">GCC / Clang Backend</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Compiles validated C code with host GCC or Clang and executes it within process isolation, capturing stdout, stderr, and return codes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
