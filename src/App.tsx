import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MediaUploader } from './components/MediaUploader';
import { WatermarkWorkspace } from './components/WatermarkWorkspace';
import { ProcessingView } from './components/ProcessingView';
import { ResultViewer } from './components/ResultViewer';
import { FeaturesSection } from './components/FeaturesSection';
import { HowItWorks } from './components/HowItWorks';
import { PrivacySection } from './components/PrivacySection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { UserHistoryModal, StoredHistoryItem } from './components/UserHistoryModal';
import { CloudCreationsModal } from './components/CloudCreationsModal';
import { VeoVideoStudio } from './components/VeoVideoStudio';
import { ErrorToast } from './components/ErrorToast';
import { MediaItem, WatermarkRegion, ProcessingSettings, ProcessingJobResult } from './types';

export default function App() {
  const [currentStep, setCurrentStep] = useState<'landing' | 'video-studio' | 'workspace' | 'processing' | 'result'>('landing');
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingJobResult | null>(null);
  const [lastRegions, setLastRegions] = useState<WatermarkRegion[]>([]);

  // Authentication state
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [creationsModalOpen, setCreationsModalOpen] = useState(false);

  // Error notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing session token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('cleanora_token') || localStorage.getItem('cleanmark_token');
    if (savedToken) {
      setToken(savedToken);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then((data) => {
          if (data.user) setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('cleanora_token');
          localStorage.removeItem('cleanmark_token');
          setToken(null);
          setUser(null);
        });
    }
  }, []);

  const handleAuthSuccess = (authedUser: { id: string; name: string; email: string }, newToken: string) => {
    setUser(authedUser);
    setToken(newToken);
    localStorage.setItem('cleanora_token', newToken);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('cleanora_token');
    localStorage.removeItem('cleanmark_token');
  };

  const handleMediaUploaded = (media: MediaItem) => {
    setActiveMedia(media);
    setCurrentStep('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUseSampleMedia = async (type: 'image' | 'video' = 'image') => {
    try {
      const res = await fetch('/api/media/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('Failed to load sample media');
      const sampleMedia: MediaItem = await res.json();
      setActiveMedia(sampleMedia);
      setCurrentStep('workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage('Could not load sample media. You can upload any image or video directly.');
    }
  };

  const handleStartProcessing = async (regions: WatermarkRegion[], settings: ProcessingSettings) => {
    if (!activeMedia) return;

    setLastRegions(regions);

    try {
      const res = await fetch(`/api/processing/${activeMedia.mediaId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regions,
          settings,
          mediaUrl: activeMedia.mediaUrl,
          filename: activeMedia.filename,
          isVideo: activeMedia.isVideo,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to start watermark removal');
      }

      const data = await res.json();
      setActiveJobId(data.jobId);
      setCurrentStep('processing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Processing failed to initiate.');
    }
  };

  const handleProcessingComplete = (result: ProcessingJobResult) => {
    if (!result.regions || result.regions.length === 0) {
      result.regions = lastRegions;
    }
    setProcessingResult(result);
    setCurrentStep('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto save to user history if logged in
    if (user && token && activeMedia) {
      fetch('/api/user/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item: {
            mediaId: activeMedia.mediaId,
            filename: activeMedia.filename,
            isVideo: activeMedia.isVideo,
            resolution: result.resolution,
            format: result.format,
            fileSize: result.fileSize,
            originalMediaUrl: result.originalMediaUrl,
            cleanMediaUrl: result.cleanMediaUrl,
            downloadUrl: result.downloadUrl,
            regionsCount: result.regionsCount,
            presetUsed: 'AI Inpainting',
          },
        }),
      }).catch((err) => console.error('Failed to auto-save history:', err));
    }
  };

  const handleSaveToHistory = async (resultToSave: ProcessingJobResult) => {
    if (!token || !activeMedia) return;
    try {
      await fetch('/api/user/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item: {
            mediaId: activeMedia.mediaId,
            filename: activeMedia.filename,
            isVideo: activeMedia.isVideo,
            resolution: resultToSave.resolution,
            format: resultToSave.format,
            fileSize: resultToSave.fileSize,
            originalMediaUrl: resultToSave.originalMediaUrl,
            cleanMediaUrl: resultToSave.cleanMediaUrl,
            downloadUrl: resultToSave.downloadUrl,
            regionsCount: resultToSave.regionsCount,
            presetUsed: 'AI Inpainting',
          },
        }),
      });
    } catch (err) {
      console.error('Save to history error:', err);
    }
  };

  const handleProcessAnother = () => {
    setActiveMedia(null);
    setActiveJobId(null);
    setProcessingResult(null);
    setCurrentStep('landing');
    setTimeout(() => {
      const uploaderElem = document.getElementById('uploader');
      if (uploaderElem) {
        uploaderElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleInspectHistoryItem = (historyItem: StoredHistoryItem) => {
    const mediaItem: MediaItem = {
      mediaId: historyItem.mediaId,
      filename: historyItem.filename,
      fileSize: historyItem.fileSize,
      mimeType: historyItem.isVideo ? 'video/mp4' : 'image/jpeg',
      isVideo: historyItem.isVideo,
      mediaUrl: historyItem.originalMediaUrl,
      previewUrl: historyItem.originalMediaUrl,
    };
    const resItem: ProcessingJobResult = {
      cleanMediaUrl: historyItem.cleanMediaUrl,
      originalMediaUrl: historyItem.originalMediaUrl,
      downloadUrl: historyItem.downloadUrl,
      resolution: historyItem.resolution,
      fps: historyItem.isVideo ? 60 : 0,
      duration: historyItem.isVideo ? '01:25' : 'N/A',
      fileSize: historyItem.fileSize,
      originalSize: historyItem.fileSize,
      format: historyItem.format,
      regionsCount: historyItem.regionsCount,
    };
    setActiveMedia(mediaItem);
    setProcessingResult(resItem);
    setCurrentStep('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (sectionId: string) => {
    if (currentStep !== 'landing') {
      setCurrentStep('landing');
      setTimeout(() => {
        const elem = document.getElementById(sectionId);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const elem = document.getElementById(sectionId);
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Header */}
      <Header
        onUploadClick={() => {
          if (currentStep !== 'landing') {
            setCurrentStep('landing');
            setTimeout(() => {
              document.getElementById('uploader')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            document.getElementById('uploader')?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenHistory={() => setHistoryModalOpen(true)}
        onLogout={handleLogout}
        onOpenVideoStudio={() => {
          setCurrentStep('video-studio');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCreations={() => setCreationsModalOpen(true)}
        currentStep={currentStep}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentStep === 'landing' && (
          <>
            <Hero
              onUploadClick={() => {
                document.getElementById('uploader')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreDemo={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenVideoStudio={() => {
                setCurrentStep('video-studio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <MediaUploader
              onMediaUploaded={handleMediaUploaded}
              onError={(msg) => setErrorMessage(msg)}
              onUseSampleMedia={handleUseSampleMedia}
            />

            <FeaturesSection />

            <HowItWorks />

            <PrivacySection
              currentMediaId={activeMedia?.mediaId}
              onClearSessionMedia={() => setActiveMedia(null)}
            />

            <FaqSection />
          </>
        )}

        {currentStep === 'video-studio' && (
          <div className="py-6">
            <VeoVideoStudio
              onSendToWatermarkRemover={(media) => {
                setActiveMedia(media);
                setCurrentStep('workspace');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onError={(msg) => setErrorMessage(msg)}
            />
          </div>
        )}

        {currentStep === 'workspace' && activeMedia && (
          <WatermarkWorkspace
            media={activeMedia}
            onStartProcessing={handleStartProcessing}
            onCancel={() => {
              setActiveMedia(null);
              setCurrentStep('landing');
            }}
            onError={(msg) => setErrorMessage(msg)}
          />
        )}

        {currentStep === 'processing' && activeJobId && (
          <ProcessingView
            jobId={activeJobId}
            onComplete={handleProcessingComplete}
            onCancel={() => {
              setActiveJobId(null);
              setCurrentStep('workspace');
            }}
            onError={(msg) => {
              setErrorMessage(msg);
              setCurrentStep('workspace');
            }}
          />
        )}

        {currentStep === 'result' && activeMedia && processingResult && (
          <ResultViewer
            media={activeMedia}
            result={processingResult}
            onProcessAnother={handleProcessAnother}
            isLoggedIn={Boolean(user)}
            onSaveToHistory={handleSaveToHistory}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Modals & Toasts */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <UserHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        token={token}
        onSelectHistoryItem={handleInspectHistoryItem}
      />

      <CloudCreationsModal
        isOpen={creationsModalOpen}
        onClose={() => setCreationsModalOpen(false)}
        onSelectMedia={(url, isVideo) => {
          setCreationsModalOpen(false);
          const item: MediaItem = {
            mediaId: `creation_${Date.now()}`,
            filename: isVideo ? 'creation_video.mp4' : 'creation_image.png',
            fileSize: 4500000,
            mimeType: isVideo ? 'video/mp4' : 'image/png',
            isVideo,
            mediaUrl: url,
            previewUrl: url,
          };
          setActiveMedia(item);
          setCurrentStep('workspace');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <ErrorToast
        message={errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />
    </div>
  );
}
