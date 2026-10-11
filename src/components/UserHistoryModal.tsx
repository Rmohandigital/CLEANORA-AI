import React, { useState, useEffect } from 'react';
import { X, Clock, Download, Trash2, Film, Image as ImageIcon, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';

export interface StoredHistoryItem {
  id: string;
  userId: string;
  mediaId: string;
  filename: string;
  isVideo: boolean;
  resolution: string;
  format: string;
  fileSize: number;
  originalMediaUrl: string;
  cleanMediaUrl: string;
  downloadUrl: string;
  regionsCount: number;
  presetUsed: string;
  createdAt: number;
}

interface UserHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onSelectHistoryItem?: (item: StoredHistoryItem) => void;
}

export const UserHistoryModal: React.FC<UserHistoryModalProps> = ({
  isOpen,
  onClose,
  token,
  onSelectHistoryItem,
}) => {
  const [items, setItems] = useState<StoredHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, token]);

  const handleDeleteItem = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-neutral-900 border border-neutral-800 text-white">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Your Media History</h2>
              <p className="text-xs text-neutral-400">
                Processed clean images and videos associated with your account.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-white mb-3" />
              Loading your media history...
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 mb-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-white">No processed media in history yet</p>
              <p className="mt-1 text-xs text-neutral-400 max-w-sm mx-auto">
                Any media you upload and remove watermarks from will be securely recorded here for future downloads and review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-4 hover:border-neutral-700 hover:bg-neutral-900/70 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-black border border-neutral-800 text-white">
                        {item.isVideo ? (
                          <Film className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-[180px]">
                          {item.filename}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={deletingId === item.id}
                      className="text-neutral-500 hover:text-white transition-colors p-1"
                      title="Remove from history"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Metadata Specs */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/60 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400 font-mono">
                    <span>{item.resolution}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.format}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-neutral-300">{item.presetUsed}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <a
                      href={item.downloadUrl || item.cleanMediaUrl}
                      download
                      className="flex-1 flex items-center justify-center gap-1.5 rounded bg-white py-1.5 px-3 text-xs font-medium text-black hover:bg-neutral-200 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>

                    {onSelectHistoryItem && (
                      <button
                        onClick={() => {
                          onSelectHistoryItem(item);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 py-1.5 px-3 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-6 py-3 bg-neutral-950 flex items-center justify-between text-[11px] text-neutral-500">
          <span>{items.length} items preserved in your workspace</span>
          <span>Temporary cache prunes automatically per retention schedule</span>
        </div>
      </div>
    </div>
  );
};
