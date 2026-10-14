import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-dark-900/95 border-emerald-500/30 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-dark-900/95 border-rose-500/30 text-rose-200'
              : 'bg-dark-900/95 border-primary-500/30 text-indigo-200'
          }`}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-slate-100">{toast.title}</h4>
            {toast.message && (
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
