import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/formatting/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = 'max-w-lg',
  hideCloseButton = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="orbit-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full orbit-surface rounded-orbit-lg shadow-orbit overflow-hidden flex flex-col max-h-[90vh]',
          maxWidthClass
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border bg-orbit-secondary/50">
          <div>
            <h2 id="orbit-modal-title" className="text-base font-semibold text-orbit-text">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-orbit-muted mt-0.5">{subtitle}</p>}
          </div>
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-orbit-sm text-orbit-muted hover:text-orbit-text hover:bg-orbit-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-orbit-accent"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
