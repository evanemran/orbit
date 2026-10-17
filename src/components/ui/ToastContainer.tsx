import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, RotateCcw } from 'lucide-react';
import { useUIStore, ToastMessage } from '@/stores/useUIStore';

const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const removeToast = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const Icon =
    toast.type === 'success'
      ? CheckCircle2
      : toast.type === 'error'
      ? AlertCircle
      : Info;

  const iconColor =
    toast.type === 'success'
      ? 'text-emerald-400'
      : toast.type === 'error'
      ? 'text-rose-400'
      : 'text-orbit-accent';

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 px-4 py-3 rounded-orbit orbit-elevated shadow-orbit min-w-[280px] max-w-sm border border-orbit-border"
    >
      <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-orbit-text truncate">{toast.title}</p>
        {toast.description && (
          <p className="text-[11px] text-orbit-muted mt-0.5 line-clamp-2">
            {toast.description}
          </p>
        )}
      </div>
      {toast.undoAction && (
        <button
          type="button"
          onClick={() => {
            toast.undoAction?.();
            removeToast(toast.id);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-orbit-sm bg-orbit-accent/15 text-orbit-accent hover:bg-orbit-accent/25 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Undo
        </button>
      )}
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
        className="p-1 text-orbit-muted hover:text-orbit-text rounded-orbit-sm"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
};
