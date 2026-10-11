import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  onUploadClick: () => void;
  onNavigate: (sectionId: string) => void;
  user: { id: string; name: string; email: string } | null;
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  onLogout: () => void;
  onOpenVideoStudio: () => void;
  onOpenCreations?: () => void;
  currentStep?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onUploadClick,
  onNavigate,
  user,
  onOpenAuth,
  onOpenHistory,
  onLogout,
  onOpenVideoStudio,
  onOpenCreations,
  currentStep,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Home', target: 'hero' },
    { label: 'Remove Watermark', target: 'uploader' },
    { label: 'How It Works', target: 'how-it-works' },
    { label: 'Features', target: 'features' },
    { label: 'FAQ', target: 'faq' },
  ];

  const handleLinkClick = (target: string) => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    onNavigate(target);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Minimal white geometric mark + Logo */}
        <button
          onClick={() => handleLinkClick('hero')}
          className="group flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-white text-black transition-transform duration-200 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-wider text-white uppercase sm:text-lg">
            Cleanora AI
          </span>
        </button>

        {/* Center: Navigation Links */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main Navigation">
          <button
            onClick={() => handleLinkClick('hero')}
            className={`text-sm font-medium transition-colors hover:text-white ${
              currentStep === 'landing' ? 'text-white' : 'text-neutral-400'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleLinkClick('uploader')}
            className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
          >
            Remove Watermark
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenVideoStudio();
            }}
            className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              currentStep === 'video-studio'
                ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-cyan-500/50 text-cyan-300 shadow-md'
                : 'text-cyan-400 hover:text-cyan-300 hover:bg-neutral-900 border border-cyan-500/30'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>3D & AI Video Studio</span>
            <span className="rounded bg-cyan-950 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300 font-bold">
              10s–30s
            </span>
          </button>
          {onOpenCreations && user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreations();
              }}
              className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
            >
              My Creations
            </button>
          )}
          <button
            onClick={() => handleLinkClick('how-it-works')}
            className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
          >
            How It Works
          </button>
          <button
            onClick={() => handleLinkClick('faq')}
            className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
          >
            FAQ
          </button>
        </nav>

        {/* Right: Actions & User Authentication */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={onOpenVideoStudio}
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
          >
            <span>Generate 3D Video</span>
          </button>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-700 hover:text-white transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-bold text-[10px]">
                  {getInitials(user.name)}
                </div>
                <span className="max-w-[120px] truncate font-medium">{user.name}</span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-neutral-800 bg-neutral-950 p-2 shadow-xl animate-fade-in z-50">
                  <div className="px-3 py-2 border-b border-neutral-900">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 rounded transition-colors"
                  >
                    Media History
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-xs font-medium text-neutral-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
          )}

          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-xs font-semibold tracking-wide text-black transition-all duration-200 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span>Upload Media</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <button
              onClick={onOpenHistory}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black font-bold text-[10px]"
            >
              {getInitials(user.name)}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-neutral-400 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-neutral-800 bg-neutral-950 px-4 py-6 md:hidden">
          <nav className="flex flex-col space-y-4">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenVideoStudio();
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-cyan-500/40 text-cyan-300 font-semibold text-sm"
            >
              <span>3D & AI Video Studio</span>
              <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-700">
                10s–30s · No Watermark
              </span>
            </button>
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => handleLinkClick(link.target)}
                className="text-left text-sm font-medium text-neutral-300 transition-colors hover:text-white"
              >
                {link.label}
              </button>
            ))}

            <div className="pt-4 border-t border-neutral-800 space-y-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2.5 text-center text-xs font-semibold text-white"
                  >
                    View Media History
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-center text-xs text-neutral-400 py-1"
                  >
                    Sign Out ({user.name})
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2.5 text-center text-xs font-semibold text-white"
                >
                  Sign In
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onUploadClick();
                }}
                className="w-full rounded-md bg-white py-2.5 text-center text-xs font-semibold text-black hover:bg-neutral-200 transition-colors"
              >
                Upload Media
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
