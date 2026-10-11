import React from 'react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-neutral-800 bg-black py-12 text-xs text-neutral-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-black">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-wider text-white uppercase">
              Cleanora AI
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-neutral-400">
            <button
              onClick={() => onNavigate('hero')}
              className="hover:text-white transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('uploader')}
              className="hover:text-white transition-colors"
            >
              Remove Watermark
            </button>
            <button
              onClick={() => onNavigate('how-it-works')}
              className="hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('features')}
              className="hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => onNavigate('faq')}
              className="hover:text-white transition-colors"
            >
              FAQ
            </button>
          </nav>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="max-w-xl text-[11px] text-neutral-500 leading-relaxed">
            Cleanora AI is intended for authorized, user-owned, or licensed media. Watermark removal results may vary based on visual complexity and underlying pixel detail.
          </p>
          <div className="text-[11px] font-mono text-neutral-500 whitespace-nowrap">
            © 2026 Cleanora AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
