import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/formatting/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  widthClass = 'max-w-md',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full h-full orbit-surface border-l border-orbit-border shadow-orbit flex flex-col',
          widthClass
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border bg-orbit-secondary/60">
          <div>
            <h2 className="text-base font-semibold text-orbit-text">{title}</h2>
            {subtitle && <p className="text-xs text-orbit-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-1.5 rounded-orbit-sm text-orbit-muted hover:text-orbit-text hover:bg-orbit-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-orbit-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
