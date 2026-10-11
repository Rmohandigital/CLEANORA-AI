import React, { useState, useEffect } from 'react';
import {
  X,
  Film,
  Image as ImageIcon,
  Music,
  FileText,
  Wand2,
  Trash2,
  Download,
  Play,
  Layers,
  Sparkles,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { auth, fetchUserGenerations, deleteGenerationFromFirestore, StoredGeneration } from '../lib/firebase';

interface CloudCreationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (url: string, isVideo: boolean) => void;
}

export const CloudCreationsModal: React.FC<CloudCreationsModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
}) => {
  const [filter, setFilter] = useState<'all' | 'video' | 'image' | 'music' | 'transcription'>('all');
  const [items, setItems] = useState<StoredGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreview, setActivePreview] = useState<StoredGeneration | null>(null);

  useEffect(() => {
    if (isOpen && auth.currentUser) {
      loadItems();
    }
  }, [isOpen]);

  const loadItems = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const data = await fetchUserGenerations(auth.currentUser.uid);
      setItems(data || []);
    } catch (e) {
      console.warn('Load creations error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteGenerationFromFirestore(auth.currentUser.uid, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (activePreview?.id === id) setActivePreview(null);
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'video') return item.type === 'text-to-video' || item.type === 'image-to-video';
    if (filter === 'image') return item.type === 'image-create' || item.type === 'image-edit';
    if (filter === 'music') return item.type === 'music-generate';
    if (filter === 'transcription') return item.type === 'audio-transcribe';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">My Cloud Creations & History</h2>
              <p className="text-xs text-neutral-400">
                Persistent assets saved securely to your Firebase Firestore cloud database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-neutral-900 bg-neutral-900/40 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'video', label: 'Veo 3 Videos', icon: Film },
            { id: 'image', label: 'AI Images', icon: ImageIcon },
            { id: 'music', label: 'Lyria Music', icon: Music },
            { id: 'transcription', label: 'Transcriptions', icon: FileText },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === f.id
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center text-neutral-400">
              <Sparkles className="h-8 w-8 animate-spin mx-auto text-purple-400 mb-2" />
              <p className="text-xs font-mono">Loading your Firestore creations...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 space-y-2">
              <Layers className="h-10 w-10 mx-auto text-neutral-600" />
              <p className="text-sm font-semibold text-neutral-400">No creations found in this category</p>
              <p className="text-xs text-neutral-500">
                Generate videos, images, music, or audio transcriptions to store them in your cloud library!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActivePreview(item)}
                  className="group rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-neutral-600 p-3.5 space-y-3 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Media Thumbnail or Type Icon */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-neutral-800 flex items-center justify-center">
                      {item.type.includes('video') && item.mediaUrl ? (
                        <video src={item.mediaUrl} className="w-full h-full object-cover" />
                      ) : item.type.includes('image') && item.mediaUrl ? (
                        <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                      ) : item.type.includes('music') ? (
                        <div className="flex flex-col items-center justify-center text-amber-400">
                          <Music className="h-8 w-8 mb-1" />
                          <span className="text-[10px] font-mono">Lyria Soundtrack</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-emerald-400 p-3 text-center">
                          <FileText className="h-6 w-6 mb-1" />
                          <span className="text-[10px] font-mono line-clamp-2">
                            {item.resultData || 'Audio Transcript'}
                          </span>
                        </div>
                      )}

                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white border border-neutral-700 capitalize">
                        {item.type.replace(/-/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-200 line-clamp-2 font-medium">
                      {item.prompt || item.resultData || 'Untitled Creation'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/80 font-mono">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                      title="Delete from Firestore"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer / Active Preview details */}
        {activePreview && (
          <div className="border-t border-neutral-800 bg-neutral-900 p-4 flex flex-wrap items-center justify-between gap-4 text-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white capitalize">
                {activePreview.type.replace(/-/g, ' ')}
              </span>
              <span className="text-neutral-400 truncate max-w-md font-mono text-[11px]">
                {activePreview.prompt}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activePreview.mediaUrl && (
                <a
                  href={activePreview.mediaUrl}
                  download
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              )}
              {activePreview.mediaUrl && onSelectMedia && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectMedia(activePreview.mediaUrl!, activePreview.type.includes('video'));
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>Open in Watermark Remover</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
