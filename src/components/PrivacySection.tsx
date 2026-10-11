import React, { useState } from 'react';
import { Shield, Trash2, CheckCircle2, Lock, EyeOff, Server } from 'lucide-react';

interface PrivacySectionProps {
  currentMediaId?: string | null;
  onClearSessionMedia?: () => void;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  currentMediaId,
  onClearSessionMedia,
}) => {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleInstantDelete = async () => {
    if (!currentMediaId) return;
    setClearing(true);
    try {
      const res = await fetch(`/api/media/${currentMediaId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCleared(true);
        if (onClearSessionMedia) onClearSessionMedia();
        setTimeout(() => setCleared(false), 4000);
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <section className="border-b border-neutral-800/80 bg-black py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 sm:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                <Shield className="h-4 w-4" />
                <span>Zero-Retention Architecture</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Your media belongs to you.
              </h2>
              <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                All uploaded images and videos are written directly to temporary, sandboxed workspaces on the server. In accordance with our strict data retention policy, files are automatically and permanently purged within 2 hours of upload. We do not use your media for model retraining.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-400 font-mono">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-white" />
                  <span>Encrypted in transit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-white" />
                  <span>2-hour retention limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="h-3.5 w-3.5 text-white" />
                  <span>No model training</span>
                </div>
              </div>
            </div>

            {/* Instant Manual Purge Card */}
            <div className="w-full md:w-auto shrink-0 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 text-center">
              <span className="text-xs font-semibold text-white block mb-1">
                Active Session Storage
              </span>
              <p className="text-[11px] text-neutral-400 max-w-[200px] mb-4 mx-auto">
                {currentMediaId
                  ? 'Active file currently in temporary workspace'
                  : 'No active session files on disk'}
              </p>

              {currentMediaId && (
                <button
                  onClick={handleInstantDelete}
                  disabled={clearing || cleared}
                  className="w-full flex items-center justify-center gap-2 rounded bg-neutral-800 hover:bg-neutral-700 py-2 px-4 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  {cleared ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      <span>Files Purged</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{clearing ? 'Shredding...' : 'Purge Session Now'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
