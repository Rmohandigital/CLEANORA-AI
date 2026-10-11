import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      group: 'Editing & History',
      items: [
        { keys: ['Ctrl', 'Z'], macKeys: ['⌘', 'Z'], description: 'Undo last stroke or region' },
        { keys: ['Ctrl', 'Y'], macKeys: ['⌘', 'Y'], description: 'Redo previously undone action' },
        { keys: ['Del'], macKeys: ['⌫'], description: 'Delete currently selected watermark box' },
        { keys: ['Esc'], macKeys: ['Esc'], description: 'Deselect box or close dialogs' },
      ],
    },
    {
      group: 'Workspace Tools',
      items: [
        { keys: ['V'], description: 'Pointer / Select tool' },
        { keys: ['R'], description: 'Rectangle bounding box tool' },
        { keys: ['B'], description: 'Freehand Paint Brush tool' },
        { keys: ['E'], description: 'Mask Eraser tool' },
        { keys: ['['], description: 'Decrease brush radius' },
        { keys: [']'], description: 'Increase brush radius' },
      ],
    },
    {
      group: 'Playback & Preview',
      items: [
        { keys: ['Space'], description: 'Run / Pause video playback' },
        { keys: ['P'], description: 'Toggle client-side inpainting preview' },
        { keys: ['S'], description: 'Toggle AI Watermark Shape Observer (0% Blur)' },
        { keys: ['M'], description: 'Mute / Unmute video audio' },
      ],
    },
    {
      group: 'Viewport Navigation',
      items: [
        { keys: ['+'], description: 'Zoom into media canvas' },
        { keys: ['-'], description: 'Zoom out of media canvas' },
        { keys: ['0'], description: 'Reset zoom level to 100%' },
        { keys: ['?'], description: 'Toggle keyboard shortcuts help' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-neutral-900 border border-neutral-800 text-white">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-neutral-400">
                Speed up your watermark removal workflow with global hotkeys.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcut Groups Grid */}
        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {shortcutGroups.map((group) => (
            <div key={group.group}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
                {group.group}
              </h3>
              <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 divide-y divide-neutral-800/60">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                  >
                    <span className="text-neutral-300 font-medium">{item.description}</span>
                    <div className="flex items-center gap-1 font-mono shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded border border-neutral-700 bg-neutral-900 text-[11px] font-semibold text-white shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>Shortcuts are active whenever the workspace is open.</span>
          <span>Press [Esc] to exit</span>
        </div>
      </div>
    </div>
  );
};
