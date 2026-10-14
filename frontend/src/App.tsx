import React, { useState, useEffect, useCallback } from 'react';
import { ActivityBar, ActivityView } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PhasePipeline } from './components/PhasePipeline';
import { EditorPanel } from './components/EditorPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { SplitPane } from './components/SplitPane';
import { IseGuideModal } from './components/IseGuideModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { CODE_EXAMPLES, CodeExample } from './examples/codeExamples';
import { CompilerApiService } from './services/api';
import { CompileResponse, HealthResponse, CompilerInfoResponse } from './types/compiler';
import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [sourceCode, setSourceCode] = useState<string>(CODE_EXAMPLES[0].code);
  const [selectedExampleId, setSelectedExampleId] = useState<string>(CODE_EXAMPLES[0].id);
  const [stdin, setStdin] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeActivityView, setActiveActivityView] = useState<ActivityView>('explorer');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [compilerInfo, setCompilerInfo] = useState<CompilerInfoResponse | null>(null);
  const [showIseGuide, setShowIseGuide] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'split' | 'editor-only' | 'results-only'>('split');
  const [mobileActiveTab, setMobileActiveTab] = useState<'editor' | 'results'>('editor');
  const [activeNavTab, setActiveNavTab] = useState<'compiler' | 'phases'>('compiler');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Poll backend health
  const checkBackend = useCallback(async () => {
    setHealthLoading(true);
    try {
      const healthData = await CompilerApiService.getHealth();
      setHealth(healthData);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 20000);

    CompilerApiService.getCompilerInfo()
      .then((info) => setCompilerInfo(info))
      .catch(() => {});

    return () => clearInterval(interval);
  }, [checkBackend]);

  const handleSelectExample = (example: CodeExample) => {
    setSelectedExampleId(example.id);
    setSourceCode(example.code);
    setResult(null);
    setGlobalError(null);
    addToast('info', `Loaded example: ${example.name}`);
  };

  const handleCompile = async (runProgram: boolean = false) => {
    if (!sourceCode.trim()) {
      setGlobalError('Please enter some C code before compiling.');
      return;
    }

    setIsCompiling(true);
    setGlobalError(null);

    try {
      const compileRes = await CompilerApiService.compile({
        sourceCode,
        runProgram,
        stdin: stdin.trim() ? stdin : undefined,
      });

      setResult(compileRes);

      if (runProgram) {
        setActiveTab('target');
        addToast(
          compileRes.targetExecution.exitCode === 0 ? 'success' : 'error',
          'Execution Finished',
          `Exit code: ${compileRes.targetExecution.exitCode}`
        );
      } else if (!compileRes.success) {
        setActiveTab('diagnostics');
        addToast('error', 'Diagnostics Reported', `${compileRes.errors.length} error(s) found`);
      } else {
        setActiveTab('overview');
        addToast('success', 'Analysis Succeeded', 'All phases validated cleanly');
      }

      // If on mobile, switch to results view on completion so user sees output immediately
      setMobileActiveTab('results');
    } catch (err: any) {
      setGlobalError(err.message || 'An error occurred while communicating with the compiler service.');
      addToast('error', 'Compilation Request Failed', err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSelectPipelinePhase = (phaseId: string) => {
    setActiveTab(phaseId);
    if (layoutMode === 'editor-only') {
      setLayoutMode('split');
    }
    setMobileActiveTab('results');
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K -> Shortcuts modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
      // Cmd/Ctrl + B -> Toggle Sidebar
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setActiveActivityView((prev) => (prev === 'none' ? 'explorer' : 'none'));
      }
      // Escape -> close modals
      else if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowIseGuide(false);
      }
      // 1 - 8 to switch results tabs if not focused inside input/textarea
      else if (
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) &&
        Number(e.key) >= 1 &&
        Number(e.key) <= 8
      ) {
        const tabList = [
          'overview',
          'lexical',
          'syntax',
          'semantic',
          'ir',
          'optimization',
          'target',
          'diagnostics',
        ];
        const selected = tabList[Number(e.key) - 1];
        if (selected) {
          setActiveTab(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070a12] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Header (54px) */}
      <Header
        health={health}
        healthLoading={healthLoading}
        onRefreshHealth={checkBackend}
        onOpenIseGuide={() => setShowIseGuide(true)}
        onOpenSpecs={() => setShowIseGuide(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        activeNavTab={activeNavTab}
        setActiveNavTab={setActiveNavTab}
        isCompiling={isCompiling}
      />

      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-rose-950/90 border-b border-rose-800 text-rose-200 px-4 py-1.5 text-xs flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            className="p-1 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Compiler Phase Pipeline Ribbon (40px) */}
      <PhasePipeline
        phases={result?.phases || null}
        isCompiling={isCompiling}
        onSelectPhase={handleSelectPipelinePhase}
        selectedTab={activeTab}
        tokensCount={result?.tokens?.length}
        symbolsCount={result?.symbolTable?.length}
        tacCount={result?.intermediateCode?.instructions?.length}
        foldedCount={result?.optimization?.foldedLines?.length}
      />

      {/* 3. Main Workspace: Activity Bar + Collapsible Sidebar + Draggable Split Pane */}
      <div className="flex-1 flex flex-row min-h-0 w-full overflow-hidden relative">
        <ActivityBar
          activeView={activeActivityView}
          setActiveView={setActiveActivityView}
          onOpenIseGuide={() => setShowIseGuide(true)}
          onOpenSpecs={() => setShowIseGuide(true)}
          onOpenShortcuts={() => setShowShortcuts(true)}
          health={health}
          healthLoading={healthLoading}
          onRefreshHealth={checkBackend}
          isCompiling={isCompiling}
        />

        <Sidebar
          activeView={activeActivityView}
          selectedExampleId={selectedExampleId}
          onSelectExample={handleSelectExample}
          result={result}
          onClose={() => setActiveActivityView('none')}
        />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          <SplitPane
            left={
              <EditorPanel
                sourceCode={sourceCode}
                setSourceCode={setSourceCode}
                onCompile={handleCompile}
                isCompiling={isCompiling}
                selectedExampleId={selectedExampleId}
                onSelectExample={handleSelectExample}
                stdin={stdin}
                setStdin={setStdin}
              />
            }
            right={
              <ResultsPanel
                result={result}
                isCompiling={isCompiling}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onOpenSpecs={() => setShowIseGuide(true)}
                onRunBinary={() => handleCompile(true)}
              />
            }
            initialSplit={56}
            minLeft={28}
            maxLeft={75}
            layoutMode={layoutMode}
            onLayoutChange={setLayoutMode}
            mobileActiveTab={mobileActiveTab}
            setMobileActiveTab={setMobileActiveTab}
            resultSuccess={result?.success}
            errorCount={result?.errors?.length || 0}
          />
        </main>
      </div>

      {/* ISE Guide & Specifications Modal */}
      <IseGuideModal
        isOpen={showIseGuide}
        onClose={() => setShowIseGuide(false)}
        info={compilerInfo}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
