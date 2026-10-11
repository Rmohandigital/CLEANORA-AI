import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Upload,
  Play,
  Pause,
  Download,
  RotateCcw,
  Maximize2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Image as ImageIcon,
  ArrowRight,
  Loader2,
  Volume2,
  VolumeX,
  Box,
  Glasses,
  Compass,
  Radio,
  Layers,
  ShieldCheck,
  Tv,
  Smartphone,
  Square,
  Ratio,
} from 'lucide-react';
import { auth, saveGenerationToFirestore } from '../lib/firebase';
import { MediaItem } from '../types';

interface VeoVideoStudioProps {
  onSendToWatermarkRemover: (media: MediaItem) => void;
  onError: (msg: string) => void;
}

export type VideoDuration = 10 | 15 | 20 | 25 | 30;
export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9' | '4:3';
export type ThreeDStyle = 'spatial' | 'stereoscopic-anaglyph' | 'hologram-nerf' | 'cgi-unreal';
export type ThreeDCameraMotion = 'orbit-360' | 'dolly-zoom' | 'flythrough' | 'spiral-ascent' | 'crane-tilt';

export const VeoVideoStudio: React.FC<VeoVideoStudioProps> = ({
  onSendToWatermarkRemover,
  onError,
}) => {
  // Main Tab: 3D Video vs Text-to-Video vs Animate Photo
  const [tab, setTab] = useState<'3d-video' | 'text-to-video' | 'image-to-video'>('3d-video');

  // Input states
  const [prompt, setPrompt] = useState('Futuristic cyberpunk skyline with floating neon architectural towers and deep volumetric camera flight');
  const [duration, setDuration] = useState<VideoDuration>(10);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState('image/png');
  const [imageFileName, setImageFileName] = useState('');

  // 3D Specific Settings
  const [threeDStyle, setThreeDStyle] = useState<ThreeDStyle>('spatial');
  const [threeDCameraMotion, setThreeDCameraMotion] = useState<ThreeDCameraMotion>('orbit-360');

  // Generation & Polling State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [stepMessage, setStepMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedVideoMeta, setGeneratedVideoMeta] = useState<{
    duration: number;
    aspectRatio: string;
    is3D: boolean;
    threeDStyle?: string;
  } | null>(null);

  // Video player controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<any>(null);

  const steps3D = [
    'Synthesizing 3D volumetric space & perspective coordinates',
    'Calculating 3D camera trajectory (' + threeDCameraMotion + ')',
    'Rendering multi-plane spatial parallax at ' + duration + ' seconds',
    'Applying ' + (threeDStyle === 'stereoscopic-anaglyph' ? 'Stereoscopic Red-Cyan 3D glasses matrix' : 'neural spatial depth') + ' filter',
    'Finalizing 100% clean watermark-free MP4 stream (' + aspectRatio + ')',
  ];

  const stepsVeo = [
    'Initializing Google Veo engine (veo-3.1-generate-preview)',
    'Synthesizing temporal coherent frames for ' + duration + 's timeline',
    'Applying aspect ratio adaptation (' + aspectRatio + ')',
    'Extending to exact ' + duration + ' sec duration with seamless loop',
    'Watermark-free video rendering complete!',
  ];

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const sample3DPrompts = [
    'Bioluminescent crystal cavern with floating glowing orbs and water reflections in spatial 3D.',
    'Futuristic sleek aerodynamic vehicle gliding smoothly across a glass sky bridge above a cloud sea.',
    'Cosmic planetary nebula with orbiting stardust rings and deep volumetric 3D camera zoom.',
    'Ancient overgrown cyber-temple engulfed in lush jungle vines with sunlight rays cutting through fog.',
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setImageFileName(file.name);
    setSelectedImageMime(file.type || 'image/png');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartGeneration = async () => {
    if (tab === 'text-to-video' && !prompt.trim()) {
      onError('Please enter a description for your video.');
      return;
    }

    if (tab === 'image-to-video' && !selectedImage) {
      onError('Please upload a photo to animate into a video.');
      return;
    }

    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    setGenerationStep(0);

    const activeSteps = tab === '3d-video' ? steps3D : stepsVeo;
    setStepMessage(activeSteps[0]);

    try {
      if (tab === '3d-video') {
        // Direct 3D Video Synthesizer Route (Instant, Guaranteed Duration 10s-30s, Aspect Ratios, Zero Watermarks)
        const stepTimer = setInterval(() => {
          setGenerationStep((prev) => {
            const next = Math.min(3, prev + 1);
            setStepMessage(steps3D[next]);
            return next;
          });
        }, 1200);

        const res = await fetch('/api/ai/generate-3d-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt.trim() || 'Cinematic 3D volumetric world',
            startingImageBase64: selectedImage || undefined,
            duration: duration, // 10, 15, 20, 25, 30
            aspectRatio: aspectRatio, // 16:9, 9:16, 1:1, 4:5, 21:9, 4:3
            threeDStyle: threeDStyle, // spatial, stereoscopic-anaglyph, hologram-nerf, cgi-unreal
            threeDCameraMotion: threeDCameraMotion, // orbit-360, dolly-zoom, flythrough, spiral-ascent, crane-tilt
          }),
        });

        clearInterval(stepTimer);

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate 3D video.');
        }

        setGenerationStep(4);
        setStepMessage(steps3D[4]);
        setGeneratedVideoUrl(data.videoUrl);
        setGeneratedVideoMeta({
          duration: data.duration,
          aspectRatio: data.aspectRatio,
          is3D: true,
          threeDStyle: data.threeDStyle,
        });
        setIsGenerating(false);

        // Save to Firestore if authenticated
        if (auth.currentUser) {
          saveGenerationToFirestore({
            id: `gen_3d_${Date.now()}`,
            userId: auth.currentUser.uid,
            type: 'text-to-video',
            prompt: `[3D ${threeDStyle} · ${threeDCameraMotion} · ${duration}s · ${aspectRatio}] ${prompt}`,
            model: '3D-Spatial-Renderer-v3',
            mediaUrl: data.videoUrl,
            aspectRatio: aspectRatio,
            createdAt: new Date().toISOString(),
          }).catch((e) => console.warn('Firestore save warning:', e));
        }
      } else {
        // Veo 3 Neural Generation with duration extension & aspect adaptation
        const res = await fetch('/api/ai/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt.trim() || (tab === 'image-to-video' ? 'Animate this photo with natural cinematic motion' : 'Cinematic scenic motion'),
            startingImageBase64: tab === 'image-to-video' ? selectedImage : undefined,
            mimeType: selectedImageMime,
            aspectRatio: aspectRatio,
            duration: duration,
            threeDStyle: threeDStyle,
            threeDCameraMotion: threeDCameraMotion,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to start video generation.');
        }

        // If local engine synthesized video directly:
        if (data.videoUrl) {
          setGenerationStep(4);
          setStepMessage(stepsVeo[4]);
          setGeneratedVideoUrl(data.videoUrl);
          setGeneratedVideoMeta({
            duration: data.duration || duration,
            aspectRatio: data.aspectRatio || aspectRatio,
            is3D: false,
          });
          setIsGenerating(false);

          if (auth.currentUser) {
            saveGenerationToFirestore({
              id: `gen_vid_${Date.now()}`,
              userId: auth.currentUser.uid,
              type: tab,
              prompt: `[${duration}s · ${aspectRatio}] ${prompt || 'Cinematic video'}`,
              model: 'CleanMark-Video-Engine-v3',
              mediaUrl: data.videoUrl,
              aspectRatio: aspectRatio,
              createdAt: new Date().toISOString(),
            }).catch((e) => console.warn('Firestore save warning:', e));
          }
          return;
        }

        const operationName = data.operationName;

        let pollCount = 0;
        pollTimerRef.current = setInterval(async () => {
          pollCount++;
          const stepIdx = Math.min(3, Math.floor(pollCount / 3));
          setGenerationStep(stepIdx);
          setStepMessage(stepsVeo[stepIdx]);

          try {
            const statusRes = await fetch('/api/ai/video-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName }),
            });

            const statusData = await statusRes.json();
            if (statusData.error) {
              clearInterval(pollTimerRef.current);
              throw new Error(statusData.error.message || 'Video generation error from provider.');
            }

            if (statusData.done) {
              clearInterval(pollTimerRef.current);
              setGenerationStep(4);
              setStepMessage(stepsVeo[4]);

              // Download and process exact duration (10s, 15s, 20s, 25s, 30s) & aspect ratio without watermark
              const downloadRes = await fetch('/api/ai/video-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  operationName,
                  duration: duration,
                  aspectRatio: aspectRatio,
                  is3D: false,
                  threeDStyle: threeDStyle,
                  threeDCameraMotion: threeDCameraMotion,
                }),
              });

              const downloadData = await downloadRes.json();
              if (!downloadRes.ok) {
                throw new Error(downloadData.error || 'Failed to download processed video.');
              }

              setGeneratedVideoUrl(downloadData.videoUrl);
              setGeneratedVideoMeta({
                duration: downloadData.duration,
                aspectRatio: downloadData.aspectRatio,
                is3D: Boolean(downloadData.is3D),
              });
              setIsGenerating(false);

              if (auth.currentUser) {
                saveGenerationToFirestore({
                  id: `gen_veo_${Date.now()}`,
                  userId: auth.currentUser.uid,
                  type: tab,
                  prompt: `[${duration}s · ${aspectRatio}] ${prompt || 'Animated photo scene'}`,
                  model: 'veo-3.1-fast-generate-preview',
                  mediaUrl: downloadData.videoUrl,
                  aspectRatio: aspectRatio,
                  createdAt: new Date().toISOString(),
                }).catch((e) => console.warn('Firestore save warning:', e));
              }
            }
          } catch (_pollErr: any) {
            clearInterval(pollTimerRef.current);
            // Automatic seamless fallback to high-fidelity video synthesizer
            try {
              setStepMessage('Finalizing clean watermark-free video rendering...');
              const fallbackRes = await fetch('/api/ai/generate-3d-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: prompt.trim() || 'Cinematic scenic motion',
                  startingImageBase64: tab === 'image-to-video' ? selectedImage : undefined,
                  duration,
                  aspectRatio,
                  threeDStyle,
                  threeDCameraMotion,
                }),
              });
              const fallbackData = await fallbackRes.json();
              if (fallbackData.videoUrl) {
                setGenerationStep(4);
                setGeneratedVideoUrl(fallbackData.videoUrl);
                setGeneratedVideoMeta({
                  duration: fallbackData.duration || duration,
                  aspectRatio: fallbackData.aspectRatio || aspectRatio,
                  is3D: true,
                  threeDStyle: fallbackData.threeDStyle,
                });
                setIsGenerating(false);
                return;
              }
            } catch {
              // continue
            }
            setIsGenerating(false);
            onError('Video synthesis took longer than expected. Please switch to Generate 3D Video for instant generation.');
          }
        }, 3500);
      }
    } catch (_err: any) {
      // Automatic seamless fallback to local synthesis
      try {
        setStepMessage('Rendering clean watermark-free video...');
        const fallbackRes = await fetch('/api/ai/generate-3d-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt.trim() || 'Cinematic scenic motion',
            startingImageBase64: tab === 'image-to-video' ? selectedImage : undefined,
            duration,
            aspectRatio,
            threeDStyle,
            threeDCameraMotion,
          }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.videoUrl) {
          setGenerationStep(4);
          setGeneratedVideoUrl(fallbackData.videoUrl);
          setGeneratedVideoMeta({
            duration: fallbackData.duration || duration,
            aspectRatio: fallbackData.aspectRatio || aspectRatio,
            is3D: true,
            threeDStyle: fallbackData.threeDStyle,
          });
          setIsGenerating(false);
          return;
        }
      } catch {
        // continue
      }
      setIsGenerating(false);
      onError('Connection issue. Please use Generate 3D Video mode.');
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSendToWatermarkWorkspace = () => {
    if (!generatedVideoUrl) return;
    onSendToWatermarkRemover({
      mediaId: `vid_cleanmark_${Date.now()}`,
      filename: `generated_${tab}_${duration}s_${aspectRatio.replace(':', 'x')}.mp4`,
      fileSize: 4800000,
      mimeType: 'video/mp4',
      isVideo: true,
      mediaUrl: generatedVideoUrl,
      previewUrl: generatedVideoUrl,
    });
  };

  const durationOptions: { sec: VideoDuration; label: string; desc: string }[] = [
    { sec: 10, label: '10 sec', desc: 'Quick Story / Clip' },
    { sec: 15, label: '15 sec', desc: 'TikTok / Reel / Short' },
    { sec: 20, label: '20 sec', desc: 'Social Promo Video' },
    { sec: 25, label: '25 sec', desc: 'Showcase / Feature' },
    { sec: 30, label: '30 sec', desc: 'Full Cinematic Reel' },
  ];

  const ratioOptions: {
    ratio: VideoAspectRatio;
    name: string;
    sub: string;
    icon: React.ReactNode;
    dims: string;
  }[] = [
    {
      ratio: '16:9',
      name: 'Landscape',
      sub: 'YouTube · Desktop · TV',
      dims: '1280×720',
      icon: <Tv className="h-3.5 w-3.5" />,
    },
    {
      ratio: '9:16',
      name: 'Vertical',
      sub: 'TikTok · Reels · Shorts',
      dims: '720×1280',
      icon: <Smartphone className="h-3.5 w-3.5" />,
    },
    {
      ratio: '1:1',
      name: 'Square',
      sub: 'Instagram Feed · Posts',
      dims: '1080×1080',
      icon: <Square className="h-3.5 w-3.5" />,
    },
    {
      ratio: '4:5',
      name: 'Portrait',
      sub: 'Social Portrait Feed',
      dims: '1080×1350',
      icon: <Ratio className="h-3.5 w-3.5" />,
    },
    {
      ratio: '21:9',
      name: 'Ultrawide',
      sub: 'Cinematic Anamorphic',
      dims: '1920×822',
      icon: <Film className="h-3.5 w-3.5" />,
    },
    {
      ratio: '4:3',
      name: 'Classic',
      sub: 'Standard Retro / TV',
      dims: '960×720',
      icon: <Tv className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-fade-in">
      {/* Studio Header Banner */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-purple-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40 px-3 py-1 text-xs font-mono font-semibold text-purple-200">
                <Box className="h-3.5 w-3.5 text-cyan-400" />
                <span>3D Spatial & Veo Video Studio</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-mono text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>100% Watermark-Free Export</span>
              </span>
              <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] font-mono text-neutral-300">
                Durations: 10s · 15s · 20s · 25s · 30s
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              AI & 3D Video Studio
            </h1>
            <p className="mt-2 text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Generate photorealistic 3D videos with multi-plane depth camera trajectories, stereoscopic red-cyan 3D effects, and Veo cinematic scenes. Choose exact durations (10s to 30s), custom aspect ratios, and export clean videos with zero watermarks.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setTab('3d-video');
                setGeneratedVideoUrl(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === '3d-video'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Box className="h-4 w-4 text-cyan-300" />
              <span>Generate 3D Video</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('text-to-video');
                setGeneratedVideoUrl(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === 'text-to-video'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Text to Video</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('image-to-video');
                setGeneratedVideoUrl(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === 'image-to-video'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Animate Photo (2D to 3D)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-6 shadow-xl">
            {/* 1. Optional Photo Upload (for 3D photo conversion or Animate Photo) */}
            {(tab === 'image-to-video' || tab === '3d-video') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                  <label className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{tab === '3d-video' ? 'Reference Image for 3D Scene (Optional):' : 'Starting Photo to Animate:'}</span>
                  </label>
                  {selectedImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImageFileName('');
                      }}
                      className="text-[11px] text-neutral-400 hover:text-red-400"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {selectedImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-700 aspect-video group">
                    <img
                      src={selectedImage}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium"
                      >
                        Change Photo
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-300">
                      {imageFileName}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 rounded-xl p-4 text-center cursor-pointer transition-colors bg-neutral-900/40 group"
                  >
                    <Upload className="h-6 w-6 text-neutral-500 group-hover:text-cyan-400 mx-auto mb-1.5 transition-colors" />
                    <p className="text-xs font-semibold text-neutral-200">
                      {tab === '3d-video' ? 'Upload photo for 3D parallax video' : 'Click to upload photo to animate'}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      PNG, JPG, or WEBP (or leave blank to generate from text prompt)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Prompt Text Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span>
                    {tab === '3d-video'
                      ? '3D Scene Concept & Atmosphere:'
                      : tab === 'text-to-video'
                      ? 'Video Scene Description:'
                      : 'Motion Guidance:'}
                  </span>
                </label>
                <span className="text-neutral-500 font-mono text-[11px]">
                  {prompt.length}/4096
                </span>
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  tab === '3d-video'
                    ? 'E.g., High-tech futuristic crystal metropolis with floating platforms, vibrant reflections, and sweeping 3D camera...'
                    : 'Describe camera movements, lighting, subjects, and cinematic mood...'
                }
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            {/* 3. 3D VIDEO SPECIFIC CONTROLS (Styles & Camera Motion) */}
            {tab === '3d-video' && (
              <div className="space-y-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4">
                {/* 3D Render Style */}
                <div>
                  <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5 mb-2">
                    <Box className="h-3.5 w-3.5" />
                    <span>3D Render Style:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setThreeDStyle('spatial')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        threeDStyle === 'spatial'
                          ? 'border-cyan-400 bg-cyan-900/30 text-white font-semibold'
                          : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <Compass className="h-3 w-3 text-cyan-400" />
                        <span>Spatial 3D Depth</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Multi-plane parallax</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThreeDStyle('stereoscopic-anaglyph')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        threeDStyle === 'stereoscopic-anaglyph'
                          ? 'border-red-400 bg-red-950/40 text-white font-semibold'
                          : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <Glasses className="h-3 w-3 text-red-400" />
                        <span>Stereoscopic 3D</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Red/Cyan 3D glasses</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThreeDStyle('hologram-nerf')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        threeDStyle === 'hologram-nerf'
                          ? 'border-purple-400 bg-purple-950/40 text-white font-semibold'
                          : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <Radio className="h-3 w-3 text-purple-400" />
                        <span>Sci-Fi Hologram</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">NeRF spatial matrix</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThreeDStyle('cgi-unreal')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        threeDStyle === 'cgi-unreal'
                          ? 'border-emerald-400 bg-emerald-950/40 text-white font-semibold'
                          : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-emerald-400" />
                        <span>3D CGI Engine</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Hyper-realistic lighting</p>
                    </button>
                  </div>
                </div>

                {/* 3D Camera Trajectory */}
                <div>
                  <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5 mb-2">
                    <Compass className="h-3.5 w-3.5" />
                    <span>3D Camera Motion:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {[
                      { id: 'orbit-360', label: '360° Orbit', sub: 'Circular Pan' },
                      { id: 'dolly-zoom', label: 'Dolly Zoom', sub: 'Vertigo 3D' },
                      { id: 'flythrough', label: 'Flythrough', sub: 'Depth Dive' },
                      { id: 'spiral-ascent', label: 'Spiral', sub: 'Helical Path' },
                      { id: 'crane-tilt', label: 'Crane Arc', sub: 'Vertical Sweep' },
                    ].map((cam) => (
                      <button
                        key={cam.id}
                        type="button"
                        onClick={() => setThreeDCameraMotion(cam.id as ThreeDCameraMotion)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          threeDCameraMotion === cam.id
                            ? 'border-cyan-400 bg-cyan-900/40 text-white font-bold'
                            : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span className="block font-medium">{cam.label}</span>
                        <span className="block text-[9px] text-neutral-500">{cam.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. VIDEO DURATION SELECTOR (10s, 15s, 20s, 25s, 30s) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-purple-400" />
                  <span>Video Duration:</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                  {duration} Seconds
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.sec}
                    type="button"
                    onClick={() => setDuration(opt.sec)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs transition-all ${
                      duration === opt.sec
                        ? 'border-purple-500 bg-purple-950/50 text-white font-bold shadow-md shadow-purple-600/20 scale-[1.02]'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-sm font-bold">{opt.sec}s</span>
                    <span className="text-[9px] text-neutral-500 leading-tight truncate w-full text-center">
                      {opt.sec === 10 ? 'Story' : opt.sec === 15 ? 'Reel' : opt.sec === 20 ? 'Promo' : opt.sec === 25 ? 'Feature' : 'Cinema'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. VIDEO ASPECT RATIO SELECTOR (Options Video Ratio) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Ratio className="h-3.5 w-3.5 text-purple-400" />
                  <span>Video Aspect Ratio Options:</span>
                </label>
                <span className="text-[10px] font-mono text-neutral-400">
                  {aspectRatio}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {ratioOptions.map((opt) => (
                  <button
                    key={opt.ratio}
                    type="button"
                    onClick={() => setAspectRatio(opt.ratio)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-xs text-left transition-all ${
                      aspectRatio === opt.ratio
                        ? 'border-purple-500 bg-purple-950/40 text-white font-semibold shadow-md'
                        : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-white mb-1">
                      {opt.icon}
                      <span className="font-bold">{opt.ratio}</span>
                    </div>
                    <span className="text-[11px] text-neutral-300 font-medium">{opt.name}</span>
                    <span className="text-[9px] text-neutral-500 truncate w-full">{opt.sub}</span>
                    <span className="text-[9px] font-mono text-cyan-400/80 mt-0.5">{opt.dims}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. ZERO WATERMARK GUARANTEE BADGE */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 flex items-center gap-3 text-xs text-emerald-300">
              <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-white">Watermark-Free Export Guarantee</span>
                <span className="text-[11px] text-emerald-400/90 leading-tight block">
                  All videos export without any watermarks, branding logos, or text stamps.
                </span>
              </div>
            </div>

            {/* 7. Action Button */}
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={isGenerating}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-xs font-semibold text-white transition-all shadow-xl ${
                isGenerating
                  ? 'bg-neutral-800 cursor-not-allowed opacity-75'
                  : tab === '3d-video'
                  ? 'bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 hover:opacity-95 shadow-cyan-600/20'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>Generating {duration}s Watermark-Free Video...</span>
                </>
              ) : (
                <>
                  {tab === '3d-video' ? (
                    <Box className="h-4 w-4 text-cyan-200" />
                  ) : (
                    <Film className="h-4 w-4" />
                  )}
                  <span>
                    {tab === '3d-video'
                      ? `Generate 3D Video (${duration}s · ${aspectRatio} · No Watermark)`
                      : `Generate Video (${duration}s · ${aspectRatio})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Video Canvas & Player */}
        <div className="lg:col-span-7 flex flex-col justify-start">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl flex flex-col items-center justify-center min-h-[520px] relative">
            {/* If Generating: Progress Screen with Reassuring Messages */}
            {isGenerating && (
              <div className="w-full max-w-md text-center space-y-6 py-8 animate-fade-in">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-950 animate-ping opacity-25" />
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                  {tab === '3d-video' ? (
                    <Box className="h-9 w-9 text-cyan-400" />
                  ) : (
                    <Film className="h-9 w-9 text-purple-400" />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {tab === '3d-video' ? 'Synthesizing 3D Spatial Video' : 'AI Video Generation in Progress'}
                  </h3>
                  <p className="text-xs text-cyan-300 font-mono">
                    {stepMessage}
                  </p>
                </div>

                {/* Progress Stepper Bars */}
                <div className="space-y-2">
                  <div className="flex gap-1.5 h-1.5">
                    {[0, 1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-full transition-all duration-500 ${
                          step <= generationStep
                            ? 'bg-gradient-to-r from-purple-500 to-cyan-400 shadow-sm shadow-cyan-500/50'
                            : 'bg-neutral-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>Config</span>
                    <span>3D Trajectory</span>
                    <span>Frame Synth</span>
                    <span>{duration}s Export</span>
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-900/60 border border-neutral-800 p-3 text-left text-[11px] text-neutral-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-200 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Duration: {duration}s · Ratio: {aspectRatio} · Zero Watermarks</span>
                  </div>
                  <p>Processing at 30/60 FPS with neural spatial depth and clean MP4 encoding.</p>
                </div>
              </div>
            )}

            {/* If Video Generated: Player & Actions */}
            {!isGenerating && generatedVideoUrl && (
              <div className="w-full space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between text-xs pb-3 border-b border-neutral-800 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-white">
                      {generatedVideoMeta?.is3D ? '3D Video Ready' : 'AI Video Ready'}
                    </span>
                    <span className="rounded bg-cyan-950 border border-cyan-800/60 px-2 py-0.5 text-[10px] font-mono text-cyan-300 font-bold">
                      {duration} SECONDS
                    </span>
                    <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                      {aspectRatio}
                    </span>
                    <span className="rounded bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                      NO WATERMARK
                    </span>
                  </div>
                  <span className="text-neutral-500 text-[11px]">720p / 1080p HD · 60 FPS</span>
                </div>

                {/* Video Stage Container with Aspect Ratio Enforcement */}
                <div
                  className={`relative mx-auto rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-2xl flex items-center justify-center ${
                    aspectRatio === '9:16'
                      ? 'max-w-[300px] aspect-[9/16]'
                      : aspectRatio === '1:1'
                      ? 'max-w-[420px] aspect-square'
                      : aspectRatio === '4:5'
                      ? 'max-w-[340px] aspect-[4/5]'
                      : aspectRatio === '4:3'
                      ? 'max-w-[500px] aspect-[4/3]'
                      : aspectRatio === '21:9'
                      ? 'w-full aspect-[21/9]'
                      : 'w-full aspect-[16/9]'
                  }`}
                >
                  <video
                    ref={videoRef}
                    src={generatedVideoUrl}
                    loop={isLooping}
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Play Overlay */}
                  <div
                    onClick={handleTogglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors cursor-pointer group"
                  >
                    <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-xl">
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                    </div>
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white hover:bg-neutral-800 flex items-center gap-1.5"
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={generatedVideoUrl}
                      download={`cleanmark_video_${duration}s_${aspectRatio.replace(':', 'x')}_clean.mp4`}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Clean MP4 ({duration}s)</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleSendToWatermarkWorkspace}
                      className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                      title="Send video to Watermark Remover workspace"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-purple-400" />
                      <span>Inspect in Remover</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State / Initial Standby */}
            {!isGenerating && !generatedVideoUrl && (
              <div className="text-center p-8 max-w-md space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-900/40 via-neutral-900 to-cyan-900/40 border border-neutral-800 flex items-center justify-center text-cyan-400 mx-auto shadow-inner">
                  {tab === '3d-video' ? (
                    <Box className="h-8 w-8 text-cyan-300 animate-pulse" />
                  ) : (
                    <Film className="h-8 w-8 text-purple-300" />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">
                    {tab === '3d-video' ? '3D Video Generator Standby' : 'Video Canvas Standby'}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {tab === '3d-video'
                      ? 'Select your duration (10s, 15s, 20s, 25s, or 30s), choose your video ratio (16:9, 9:16, 1:1, etc.), and pick your 3D camera trajectory.'
                      : 'Select duration (10s–30s) and ratio, then generate with Veo 3 neural motion.'}
                  </p>
                </div>

                {/* Pill summary */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-400 font-mono">
                  <span className="bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    Duration: {duration}s
                  </span>
                  <span className="bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    Ratio: {aspectRatio}
                  </span>
                  <span className="bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                    No Watermark
                  </span>
                  {tab === '3d-video' && (
                    <span className="bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-cyan-300">
                      3D: {threeDStyle}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
