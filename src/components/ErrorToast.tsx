import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in">
      <div className="flex items-start gap-3 rounded-lg border border-neutral-700 bg-neutral-900 p-4 shadow-2xl">
        <AlertCircle className="h-5 w-5 shrink-0 text-white mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white">Notice</p>
          <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-neutral-400 hover:text-white transition-colors"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
