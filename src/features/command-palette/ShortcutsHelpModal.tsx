import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/stores/useUIStore';

const SHORTCUTS_LIST = [
  { keys: ['/'], description: 'Focus Universal Search bar' },
  { keys: ['Ctrl / Cmd', 'K'], description: 'Toggle Command Palette' },
  { keys: ['N'], description: 'Create a new note (when not typing in a field)' },
  { keys: ['T'], description: 'Focus new task input (when not typing in a field)' },
  { keys: ['?'], description: 'Show this Keyboard Shortcuts dialog' },
  { keys: ['Esc'], description: 'Close active modal, drawer, or suggestions' },
  { keys: ['↑', '↓'], description: 'Navigate search suggestions or command list' },
  { keys: ['Enter'], description: 'Execute selected search or command' },
];

export const ShortcutsHelpModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.isShortcutsHelpOpen);
  const closeShortcutsHelp = useUIStore((s) => s.closeShortcutsHelp);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeShortcutsHelp}
      title="Keyboard Shortcuts"
      subtitle="Navigate Orbit effortlessly with keyboard controls"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-2.5">
        {SHORTCUTS_LIST.map((item) => (
          <div
            key={item.description}
            className="flex items-center justify-between gap-4 py-2 px-3 rounded-orbit-sm bg-orbit-secondary/60 border border-orbit-border"
          >
            <span className="text-xs text-orbit-text">{item.description}</span>
            <div className="flex items-center gap-1 shrink-0">
              {item.keys.map((k) => (
                <kbd
                  key={k}
                  className="px-2 py-0.5 text-[11px] font-mono rounded-xs bg-orbit-main border border-orbit-border text-orbit-accent"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
