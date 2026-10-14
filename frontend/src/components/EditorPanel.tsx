import React, { useState, useRef } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import {
  Play,
  Terminal,
  Trash2,
  RotateCcw,
  Sliders,
  ChevronDown,
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { CODE_EXAMPLES, CodeExample } from '../examples/codeExamples';

interface EditorPanelProps {
  sourceCode: string;
  setSourceCode: (code: string) => void;
  onCompile: (runProgram?: boolean) => void;
  isCompiling: boolean;
  selectedExampleId: string;
  onSelectExample: (example: CodeExample) => void;
  stdin: string;
  setStdin: (input: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  sourceCode,
  setSourceCode,
  onCompile,
  isCompiling,
  selectedExampleId,
  onSelectExample,
  stdin,
  setStdin,
}) => {
  const [showStdin, setShowStdin] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [monacoReady, setMonacoReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const editorRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineGutterRef = useRef<HTMLDivElement>(null);

  const lines = sourceCode.split('\n');
  const lineCount = lines.length;
  const charCount = sourceCode.length;

  const currentExample = CODE_EXAMPLES.find((ex) => ex.id === selectedExampleId) || CODE_EXAMPLES[0];
  const isModified = sourceCode !== currentExample.code;

  // Custom Monaco Editor Dark Theme definition
  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('compiler-studio-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
        { token: 'type', foreground: '38bdf8' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'identifier', foreground: 'e2e8f0' },
        { token: 'delimiter', foreground: '94a3b8' },
        { token: 'operator', foreground: 'c084fc' },
      ],
      colors: {
        'editor.background': '#0c101d',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#a5b4fc',
        'editor.lineHighlightBackground': '#141a2c',
        'editor.selectionBackground': '#2d3752',
        'editor.inactiveSelectionBackground': '#1e263c',
        'editorCursor.foreground': '#818cf8',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
        'editorBracketMatch.background': '#312e81',
        'editorBracketMatch.border': '#6366f1',
      },
    });
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setMonacoReady(true);

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column,
      });
    });

    // Add Keybinding: Cmd/Ctrl + Enter -> Compile (Analyze Phases)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onCompile(false);
    });

    // Add Keybinding: Shift + Enter -> Run Binary
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      onCompile(true);
    });

    // Prevent default browser save and trigger compilation
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onCompile(false);
    });

    editor.focus();
  };

  const handleClear = () => {
    if (sourceCode.trim().length > 0) {
      setShowClearConfirm(true);
    } else {
      setSourceCode('');
    }
  };

  const confirmClear = () => {
    setSourceCode('');
    setShowClearConfirm(false);
  };

  const handleReset = () => {
    setSourceCode(currentExample.code);
  };

  // Textarea helper for Fallback Mode
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = sourceCode.substring(0, start) + '    ' + sourceCode.substring(end);
      setSourceCode(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onCompile(false);
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onCompile(true);
    }
  };

  const handleTextareaScroll = () => {
    if (textareaRef.current && lineGutterRef.current) {
      lineGutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const updateCursorFromTextarea = () => {
    if (!textareaRef.current) return;
    const textBeforeCursor = sourceCode.substring(0, textareaRef.current.selectionStart);
    const cursorLines = textBeforeCursor.split('\n');
    setCursorPos({
      line: cursorLines.length,
      col: cursorLines[cursorLines.length - 1].length + 1,
    });
  };

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-white/[0.08] min-h-0 relative">
      {/* 1. IDE File Tab Header Bar (36px) */}
      <div className="h-9 border-b border-white/[0.08] bg-dark-950 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center h-full">
          <div className="flex items-center gap-2 px-3 py-1 bg-dark-900 border-r border-t-2 border-t-primary-500 border-r-white/[0.08] h-full text-xs font-mono text-slate-200">
            <span className="w-2 h-2 rounded-full bg-cyan-400/80" />
            <span className="font-semibold text-slate-100">main.c</span>
            {isModified && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse"
                title="Modified from preset"
              />
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-500 px-3 hidden sm:inline">
            ANSI C (Subset)
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="hidden md:inline">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">{charCount} bytes</span>
        </div>
      </div>

      {/* 2. Compact Editor Action Toolbar (40px) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-white/[0.08] bg-dark-850 shrink-0">
        {/* Left: Example Selector & Stdin Toggle */}
        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="relative">
            <select
              value={selectedExampleId}
              onChange={(e) => {
                const ex = CODE_EXAMPLES.find((item) => item.id === e.target.value);
                if (ex) onSelectExample(ex);
              }}
              className="bg-dark-900 text-slate-200 border border-white/[0.1] rounded-lg pl-2.5 pr-7 py-1 text-xs font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer hover:border-white/[0.2] transition-colors"
            >
              <optgroup label="Valid C Programs">
                {CODE_EXAMPLES.filter((ex) => ex.category === 'valid').map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Error Verification Cases">
                {CODE_EXAMPLES.filter((ex) => ex.category !== 'valid').map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Stdin Toggle */}
          <button
            onClick={() => setShowStdin(!showStdin)}
            className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-all ${
              showStdin || stdin.trim()
                ? 'bg-primary-950/60 text-primary-300 border-primary-500/40'
                : 'bg-dark-900 text-slate-400 border-white/[0.08] hover:text-slate-200 hover:border-white/[0.15]'
            }`}
            title="Toggle Program Standard Input (stdin)"
          >
            <Sliders className="w-3 h-3" />
            <span className="text-[11px]">Stdin</span>
            {stdin.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
            )}
          </button>
        </div>

        {/* Right: Reset, Clear & Compilation CTAs */}
        <div className="flex items-center gap-1.5">
          {/* Editor Engine Toggle */}
          <button
            onClick={() => setUseFallback(!useFallback)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-dark-900 hover:bg-dark-800 text-[11px] font-mono text-slate-400 hover:text-slate-200 border border-white/[0.08] transition-colors"
            title={useFallback ? 'Switch to Monaco Editor Engine' : 'Switch to Lightweight Textarea Fallback Engine'}
          >
            {useFallback ? (
              <ToggleRight className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden xl:inline">{useFallback ? 'Fallback' : 'Monaco'}</span>
          </button>

          {/* Reset Code */}
          <button
            onClick={handleReset}
            className="p-1 rounded bg-dark-900 hover:bg-dark-800 text-slate-400 hover:text-slate-200 border border-white/[0.08] transition-colors text-xs"
            title="Reset code to example preset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Clear Editor */}
          <button
            onClick={handleClear}
            className="p-1 rounded bg-dark-900 hover:bg-dark-800 text-slate-400 hover:text-rose-400 border border-white/[0.08] transition-colors text-xs"
            title="Clear editor contents"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Primary CTA: Analyze Phases */}
          <button
            onClick={() => onCompile(false)}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold text-xs transition-all shadow-sm shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={`Analyze Flex/Bison Phases (${modKey}+Enter)`}
          >
            {isCompiling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Analyze Phases</span>
            <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 rounded bg-primary-700/60 text-primary-200 text-[10px] font-mono">
              {modKey}↵
            </kbd>
          </button>

          {/* Secondary CTA: Run Binary */}
          <button
            onClick={() => onCompile(true)}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Compile with host GCC/Clang and execute (Shift+Enter)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Run Binary</span>
            <kbd className="hidden lg:inline-block ml-0.5 px-1 py-0.2 rounded bg-emerald-700/60 text-emerald-200 text-[10px] font-mono">
              ⇧↵
            </kbd>
          </button>
        </div>
      </div>

      {/* Optional Stdin Drawer */}
      {showStdin && (
        <div className="border-b border-white/[0.08] bg-dark-950 p-2.5 shrink-0 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-mono text-slate-400">
              Standard Input (stdin for scanf / getchar):
            </label>
            {stdin && (
              <button
                onClick={() => setStdin('')}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
              >
                Clear input
              </button>
            )}
          </div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Type keyboard input values here (e.g. integer 42, string input, etc.)..."
            rows={2}
            className="w-full bg-dark-900 text-slate-200 border border-white/[0.1] rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-primary-500 focus:outline-none resize-none placeholder:text-slate-600"
          />
        </div>
      )}

      {/* Clear Confirmation Prompt */}
      {showClearConfirm && (
        <div className="bg-rose-950/80 border-b border-rose-800/60 p-2.5 flex items-center justify-between gap-3 text-xs text-rose-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Are you sure you want to clear the editor?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2.5 py-1 rounded bg-dark-900 text-slate-300 hover:bg-dark-800 text-[11px] border border-white/[0.08]"
            >
              Cancel
            </button>
            <button
              onClick={confirmClear}
              className="px-2.5 py-1 rounded bg-rose-600 text-white font-medium hover:bg-rose-500 text-[11px]"
            >
              Clear Editor
            </button>
          </div>
        </div>
      )}

      {/* Main Code Editor Surface */}
      <div className="flex-1 relative min-h-0 w-full overflow-hidden bg-[#0c101d]">
        {!useFallback ? (
          <div className="h-full w-full relative">
            <Editor
              height="100%"
              width="100%"
              defaultLanguage="c"
              language="c"
              theme="compiler-studio-dark"
              value={sourceCode}
              beforeMount={handleEditorWillMount}
              onChange={(val) => setSourceCode(val || '')}
              onMount={handleEditorDidMount}
              loading={
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 bg-dark-900">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                  <span className="text-xs font-mono">Initializing Monaco Editor...</span>
                  <button
                    onClick={() => setUseFallback(true)}
                    className="mt-2 text-xs text-primary-400 hover:underline"
                  >
                    Switch to Instant Fallback Editor
                  </button>
                </div>
              }
              options={{
                fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Courier, monospace',
                fontSize: 13,
                lineHeight: 22,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'all',
                lineNumbers: 'on',
                lineNumbersMinChars: 3,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                bracketPairColorization: { enabled: true },
                wordWrap: 'on',
                padding: { top: 10, bottom: 10 },
                fontLigatures: true,
                smoothScrolling: true,
              }}
            />
          </div>
        ) : (
          /* High-Performance Textarea Fallback Editor */
          <div className="flex h-full w-full bg-[#0c101d] text-slate-100 font-mono text-xs overflow-hidden">
            {/* Line Number Gutter */}
            <div
              ref={lineGutterRef}
              className="w-12 bg-dark-950 text-slate-600 text-right pr-3 pt-2.5 select-none overflow-hidden border-r border-white/[0.08] shrink-0 font-mono text-xs leading-[22px]"
            >
              {Array.from({ length: Math.max(lineCount, 25) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input Textarea */}
            <textarea
              ref={textareaRef}
              value={sourceCode}
              onChange={(e) => {
                setSourceCode(e.target.value);
                updateCursorFromTextarea();
              }}
              onKeyDown={handleTextareaKeyDown}
              onScroll={handleTextareaScroll}
              onKeyUp={updateCursorFromTextarea}
              onClick={updateCursorFromTextarea}
              onSelect={updateCursorFromTextarea}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className="flex-1 h-full p-2.5 bg-transparent text-slate-100 focus:outline-none resize-none leading-[22px] font-mono text-xs overflow-auto whitespace-pre selection:bg-primary-500/30"
              placeholder="// Write your C program here..."
            />
          </div>
        )}
      </div>

      {/* 3. Editor Status Bar (26px) */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-white/[0.08] bg-dark-950 text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>ANSI C</span>
          <span className="text-slate-600">•</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="text-slate-600">•</span>
          <span>Spaces: 4</span>
          <span className="text-slate-600">•</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span
            className={`w-1.5 h-1.5 rounded-full inline-block ${
              useFallback ? 'bg-cyan-400' : monacoReady ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
            }`}
          />
          <span>{useFallback ? 'Fallback Engine' : monacoReady ? 'Monaco Ready' : 'Loading Monaco...'}</span>
        </div>
      </div>
    </div>
  );
};
