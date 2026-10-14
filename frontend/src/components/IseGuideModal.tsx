import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Layers,
  HelpCircle,
  FileCode,
  Cpu,
  Search,
} from 'lucide-react';
import { CompilerInfoResponse } from '../types/compiler';

interface IseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  info?: CompilerInfoResponse | null;
}

export const IseGuideModal: React.FC<IseGuideModalProps> = ({ isOpen, onClose, info }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'phases' | 'viva' | 'specs'>('architecture');
  const [vivaSearch, setVivaSearch] = useState('');
  const [selectedVivaCategory, setSelectedVivaCategory] = useState<string>('all');

  if (!isOpen) return null;

  const vivaQuestions = [
    {
      q: 'What is a compiler, and how does it fundamentally differ from an interpreter?',
      category: 'Theory',
      a: 'A compiler translates an entire source program into machine code or an intermediate representation all at once before execution, producing an independent binary executable. An interpreter reads and executes source statements line-by-line at runtime. In our ISE project, ccompiler acts as a compiler frontend: it parses full C source code, performs semantic validation, synthesizes Three-Address Code (TAC), and coordinates with host GCC/Clang for native execution.',
    },
    {
      q: 'What are the classical phases of a compiler, and which are implemented here?',
      category: 'Phases',
      a: 'The classical phases are: (1) Lexical Analysis (implemented in lexer.l via Flex), (2) Syntax Analysis (implemented in parser_wrapper.y via Bison), (3) Semantic Analysis (implemented in parser_wrapper.y), (4) Intermediate Code Generation (Three-Address Code with temporaries t0, t1 and labels L0, L1), (5) Code Optimization (Compile-time constant folding and propagation), and (6) Target Code Generation (orchestrated via host GCC/Clang).',
    },
    {
      q: 'What is the difference between a Parse Tree (CST) and an Abstract Syntax Tree (AST)?',
      category: 'Syntax',
      a: 'A Concrete Syntax Tree (Parse Tree) contains every grammatical token including punctuation (semicolons, parentheses, braces) and wrapper nonterminals. An Abstract Syntax Tree (AST) represents the semantic hierarchy where internal nodes represent operations/statements (+, =, if, while) and leaves represent operands, discarding non-semantic punctuation.',
    },
    {
      q: 'How does Flex handle tokens and comments without line number desynchronization?',
      category: 'Lexical',
      a: 'In compiler/lexer.l, Flex uses regular expressions to match tokens using Maximal Munch (longest prefix rule). Multi-line comments iterate through yytext and increment countn for every newline encountered. A 99-byte buffer guard prevents buffer overflows on oversized tokens.',
    },
    {
      q: 'What parsing algorithm does Bison use, and how are shift/reduce conflicts avoided?',
      category: 'Syntax',
      a: 'Bison generates an LALR(1) (Look-Ahead Left-to-right, Rightmost derivation with 1 token lookahead) pushdown automaton with states and ACTION/GOTO tables. Operator precedence and associativity declarations (%left, %right, %nonassoc) resolve ambiguity in arithmetic, relational, and dangling-else constructs.',
    },
    {
      q: 'What checks are performed during Semantic Analysis?',
      category: 'Semantics',
      a: 'Our semantic phase enforces: (1) Undeclared variable detection, (2) Duplicate symbol redeclaration checks, (3) Keyword shadowing prevention, (4) Scope validation, (5) Implicit and explicit type conversions, (6) Division by zero detection, and (7) Whitelisting 47 C standard library functions (printf, scanf, malloc, free, etc.).',
    },
    {
      q: 'How does Three-Address Code (TAC) work in this compiler?',
      category: 'IR',
      a: 'Three-Address Code is a linearized intermediate representation where every instruction has at most one operator and three addresses (result = arg1 op arg2). The compiler synthesizes temporaries (t0, t1, t2...) for intermediate values and jump labels (L0, L1...) for control-flow branching.',
    },
    {
      q: 'How is Constant Folding implemented in this project?',
      category: 'Optimization',
      a: 'In parser_wrapper.y, during binary_expression() reduction, if both operand subtrees evaluate to constants via can_eval(), the compiler computes the arithmetic or logical result at compile-time and substitutes an immediate numeric constant instead of emitting runtime TAC instructions.',
    },
    {
      q: 'What are the capacity limits and architectural constraints of this frontend?',
      category: 'Limits',
      a: 'The educational frontend uses static memory structures: symbol_table[300] (maximum 300 symbols), ir_instructions[500] (maximum 500 TAC entries), errors[100][100] (maximum 100 diagnostics), and 99-character maximum token length. It uses a flat scope table where inner-block shadowing is rejected as duplicate declarations.',
    },
  ];

  const filteredViva = vivaQuestions.filter((item) => {
    const matchesCategory = selectedVivaCategory === 'all' || item.category === selectedVivaCategory;
    const matchesSearch =
      item.q.toLowerCase().includes(vivaSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(vivaSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-dark-900 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-dark-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-100 tracking-tight">
                  Compiler Design ISE — Academic Guide & Specifications
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-primary-500/15 text-primary-300 border border-primary-500/30">
                  Course Project Reference
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Educational C Compiler Frontend • Flex Lexer • Bison LALR(1) Parser • TAC IR
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
          <button
            onClick={() => setActiveTab('viva')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium transition-all ${
              activeTab === 'viva'
                ? 'border-primary-500 text-primary-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Viva Preparation (35+ Q&A)</span>
          </button>
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
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-5 overflow-y-auto min-h-0 text-xs text-slate-300 space-y-5">
          {/* TAB 1: ARCHITECTURE */}
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
                  &nbsp;&nbsp;▼ [Semantic Analysis & Symbol Table] <br />
                  Validated Types & Scopes (symbol_table[300]) <br />
                  &nbsp;&nbsp;│ <br />
                  &nbsp;&nbsp;▼ [Intermediate Code Generation] <br />
                  Three-Address Code (TAC with temporaries t0, t1 and labels L0, L1) <br />
                  &nbsp;&nbsp;│ <br />
                  &nbsp;&nbsp;▼ [Optimization Pass] <br />
                  Constant Folding & Propagation in binary_expression() <br />
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
                    Node.js & TypeScript with Express. Enforces 64KB input guards, sanitization, process isolation,
                    and executes <code>child_process.spawn()</code> with zero shell injection risk.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPILER PHASES */}
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
                    Uses Thompson's NFA and Subset Construction DFA. Recognizes 30+ regex rules, keywords, identifiers,
                    constants, comments, and preprocessor includes. Protects memory with 99-character token guards.
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
                    Validates ANSI C grammar productions. Constructs an Abstract Syntax Tree using binary tree nodes
                    (<code>mknode(char *token, struct node *left, struct node *right)</code>) and displays inorder
                    traversals.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        Phase 3
                      </span>
                      <span>Semantic Analysis & Symbol Table</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">symbol_table[300]</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Maintains 300 entries tracking identifier names, data types, categories, line numbers, and
                    compile-time estimated values. Checks undeclared variables, duplicate definitions, and whitelisted
                    standard functions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/20 font-mono">
                        Phase 4
                      </span>
                      <span>Intermediate Code Generation (TAC)</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">Three-Address Code</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Translates control flow and expressions into linear quadruples with synthesized temporaries (
                    <code>t0</code>, <code>t1</code>) and branch labels (<code>L0</code>, <code>L1</code>).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        Phase 5
                      </span>
                      <span>Optimization (Constant Folding)</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">can_eval()</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    In <code>binary_expression()</code>, constant expressions like <code>10 + 20</code> or{' '}
                    <code>5 * 6</code> are evaluated at compile time, eliminating unnecessary runtime calculation
                    instructions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        Phase 6
                      </span>
                      <span>Target Code Execution</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">gcc / clang host driver</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Delegates full machine compilation to the host C compiler to produce native binaries, safely
                    capturing standard output, runtime errors, and exit codes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIVA QUESTIONS */}
          {activeTab === 'viva' && (
            <div className="space-y-4">
              {/* Search and Category Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-dark-850 p-2.5 rounded-xl border border-white/[0.06]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={vivaSearch}
                    onChange={(e) => setVivaSearch(e.target.value)}
                    placeholder="Search viva questions..."
                    className="w-full bg-dark-900 border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                  {['all', 'Theory', 'Lexical', 'Syntax', 'Semantics', 'IR', 'Optimization', 'Limits'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedVivaCategory(cat)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        selectedVivaCategory === cat
                          ? 'bg-primary-600 text-white font-medium'
                          : 'bg-dark-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {filteredViva.map((v, i) => (
                  <div key={i} className="p-4 rounded-xl bg-dark-850 border border-white/[0.08] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-slate-100 text-xs flex items-center gap-2">
                        <span className="text-primary-400 font-mono font-bold">Q{i + 1}.</span>
                        <span>{v.q}</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-dark-900 text-slate-400 border border-white/[0.06] shrink-0">
                        {v.category}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed bg-dark-900/60 p-3 rounded-lg border border-white/[0.04]">
                      <strong className="text-emerald-400 font-mono block mb-1">Model Answer:</strong>
                      {v.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LANGUAGE SPECS & LIMITS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-primary-400" />
                  <span>Grammar Capabilities & Technical Limits</span>
                </h3>
                <p className="text-slate-400 text-xs">
                  Specifications for the ANSI C subset supported by this educational frontend.
                </p>
              </div>

              {/* Backend Binary Metadata */}
              {info && (
                <div className="p-3.5 rounded-xl bg-dark-850 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Binary:</span>
                    <span className="text-slate-200">{info.name} (v{info.version})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Path:</span>
                    <span className="text-slate-300">{info.binaryPath}</span>
                  </div>
                </div>
              )}

              {/* System Limits Table */}
              <div className="p-4 rounded-xl bg-dark-850 border border-white/[0.08] space-y-3">
                <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                  Internal Capacity Limits
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-dark-900 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-mono">MAX SYMBOLS</span>
                    <p className="text-base font-bold text-cyan-400 font-mono mt-0.5">300</p>
                    <span className="text-[10px] text-slate-500">Identifiers</span>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-900 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-mono">MAX TAC ENTRIES</span>
                    <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">500</p>
                    <span className="text-[10px] text-slate-500">Quadruples</span>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-900 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-mono">MAX DIAGNOSTICS</span>
                    <p className="text-base font-bold text-rose-400 font-mono mt-0.5">100</p>
                    <span className="text-[10px] text-slate-500">Errors & Warnings</span>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-900 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-mono">MAX TOKEN LENGTH</span>
                    <p className="text-base font-bold text-primary-400 font-mono mt-0.5">99 B</p>
                    <span className="text-[10px] text-slate-500">Buffer Guard</span>
                  </div>
                </div>
              </div>

              {/* Supported Language Constructs */}
              <div className="p-4 rounded-xl bg-dark-850 border border-white/[0.08] space-y-3">
                <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                  Supported Language Constructs
                </h4>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="p-2 rounded-lg bg-dark-900 border border-white/[0.04]">
                    <strong className="text-cyan-400">Data Types:</strong> int, float, double, char, void, long,
                    short, unsigned, signed, const.
                  </div>
                  <div className="p-2 rounded-lg bg-dark-900 border border-white/[0.04]">
                    <strong className="text-emerald-400">Pointers & Arrays:</strong> int*, char*, &x, *p, 1D & 2D
                    arrays (int arr[10], int mat[3][3]).
                  </div>
                  <div className="p-2 rounded-lg bg-dark-900 border border-white/[0.04]">
                    <strong className="text-amber-400">Control Flow:</strong> if-else, switch-case, while, do-while,
                    for loops, break, continue, return.
                  </div>
                  <div className="p-2 rounded-lg bg-dark-900 border border-white/[0.04]">
                    <strong className="text-primary-400">Operators:</strong> Arithmetic (+, -, *, /, %), relational,
                    logical, bitwise (&, |, ^, ~, &lt;&lt;, &gt;&gt;), assignments, ternary (?:), casts ((int)x).
                  </div>
                  <div className="p-2 rounded-lg bg-dark-900 border border-white/[0.04]">
                    <strong className="text-indigo-400">Standard Library Whitelist:</strong> 47 C functions (printf,
                    scanf, strlen, strcpy, malloc, free, exit, sqrt, rand, etc.).
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-dark-850 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>Compiler Design ISE Evaluation Reference</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
