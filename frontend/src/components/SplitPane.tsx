import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialSplit?: number; // percentage (e.g. 55)
  minLeft?: number; // min percentage (e.g. 30)
  maxLeft?: number; // max percentage (e.g. 75)
  layoutMode?: 'split' | 'editor-only' | 'results-only';
  onLayoutChange?: (mode: 'split' | 'editor-only' | 'results-only') => void;
  mobileActiveTab?: 'editor' | 'results';
  setMobileActiveTab?: (tab: 'editor' | 'results') => void;
  resultSuccess?: boolean | null;
  errorCount?: number;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  initialSplit = 55,
  minLeft = 30,
  maxLeft = 75,
  layoutMode = 'split',
  mobileActiveTab = 'editor',
  setMobileActiveTab,
  resultSuccess,
  errorCount = 0,
}) => {
  const [splitPercent, setSplitPercent] = useState<number>(initialSplit);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startDragging = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const totalWidth = rect.width;
      if (totalWidth <= 0) return;

      let newPercent = (currentX / totalWidth) * 100;
      if (newPercent < minLeft) newPercent = minLeft;
      if (newPercent > maxLeft) newPercent = maxLeft;

      setSplitPercent(newPercent);
    },
    [isDragging, minLeft, maxLeft]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDragging);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onDrag, stopDragging]);

  const handleDoubleClickDivider = () => {
    setSplitPercent(55);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      {/* Mobile / Tablet Segmented View Switcher (<1024px) */}
      <div className="flex lg:hidden items-center justify-between px-3 py-1.5 bg-dark-900 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-dark-950 border border-white/[0.06] text-xs font-medium w-full">
          <button
            onClick={() => setMobileActiveTab?.('editor')}
            className={`flex-1 py-1 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              mobileActiveTab === 'editor'
                ? 'bg-dark-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Source Editor (main.c)</span>
          </button>
          <button
            onClick={() => setMobileActiveTab?.('results')}
            className={`flex-1 py-1 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              mobileActiveTab === 'results'
                ? 'bg-dark-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Compiler Output</span>
            {errorCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] flex items-center justify-center font-mono">
                {errorCount}
              </span>
            )}
            {resultSuccess && errorCount === 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden relative"
      >
        {/* Left Pane (Source Editor) */}
        <div
          style={{
            width: layoutMode === 'editor-only' ? '100%' : layoutMode === 'results-only' ? '0%' : `${splitPercent}%`,
            display:
              layoutMode === 'results-only'
                ? 'none'
                : 'flex',
          }}
          className={`h-full flex-col min-h-0 overflow-hidden transition-[width] duration-75 ${
            mobileActiveTab === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {left}
        </div>

        {/* Draggable Divider (Desktop only, visible in 'split' mode) */}
        {layoutMode === 'split' && (
          <div
            onMouseDown={startDragging}
            onDoubleClick={handleDoubleClickDivider}
            className={`hidden lg:flex flex-col items-center justify-center w-[7px] -mx-[3px] z-20 cursor-col-resize select-none group transition-colors duration-150 relative ${
              isDragging ? 'bg-primary-500' : 'hover:bg-primary-500/60 bg-transparent'
            }`}
            title="Drag to resize panels (Double click to reset to 55%)"
          >
            {/* Center border line */}
            <div
              className={`w-[1px] h-full transition-colors ${
                isDragging ? 'bg-primary-400' : 'bg-white/[0.08] group-hover:bg-primary-400'
              }`}
            />
            {/* Grip Pill */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-7 rounded-sm border flex items-center justify-center shadow-md transition-all ${
                isDragging
                  ? 'bg-primary-600 border-primary-400 text-white'
                  : 'bg-dark-850 border-white/[0.12] text-slate-400 group-hover:bg-dark-800 group-hover:border-primary-500/50 group-hover:text-primary-300'
              }`}
            >
              <GripVertical className="w-2.5 h-2.5" />
            </div>
          </div>
        )}

        {/* Right Pane (Compiler Results) */}
        <div
          style={{
            width: layoutMode === 'results-only' ? '100%' : layoutMode === 'editor-only' ? '0%' : `${100 - splitPercent}%`,
            display:
              layoutMode === 'editor-only'
                ? 'none'
                : 'flex',
          }}
          className={`h-full flex-col min-h-0 overflow-hidden transition-[width] duration-75 ${
            mobileActiveTab === 'results' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {right}
        </div>
      </div>
    </div>
  );
};
