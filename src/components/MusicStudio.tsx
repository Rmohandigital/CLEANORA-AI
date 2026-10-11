import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Sparkles,
  Play,
  Pause,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Clock,
  Layers,
  FileText,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { auth, saveGenerationToFirestore } from '../lib/firebase';

interface MusicStudioProps {
  onError: (msg: string) => void;
}

export const MusicStudio: React.FC<MusicStudioProps> = ({ onError }) => {
  const [modelType, setModelType] = useState<'clip' | 'pro'>('clip');
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lyricsText, setLyricsText] = useState('');
  const [durationLabel, setDurationLabel] = useState('30s Clip');

  // Player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isMuted, setIsMuted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const genreChips = [
    'Cinematic Orchestral',
    'Lo-Fi Chillhop Beats',
    'Synthwave Retro 80s',
    'Cyberpunk Dark Electronic',
    'Ambient Piano & Strings',
    'Upbeat Electro Pop',
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    setReferenceImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReferenceImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImage) {
      onError('Please provide a music prompt or upload a reference image.');
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);
    setLyricsText('');

    try {
      const res = await fetch('/api/ai/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          modelType,
          base64Image: referenceImage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate music.');
      }

      setAudioUrl(data.audioUrl);
      setLyricsText(data.lyrics || '');
      setDurationLabel(data.duration || (modelType === 'pro' ? 'Full Track' : '30s Clip'));

      // Save to Firestore
      if (auth.currentUser) {
        saveGenerationToFirestore({
          id: `mus_${Date.now()}`,
          userId: auth.currentUser.uid,
          type: 'music-generate',
          prompt: prompt || 'Soundtrack inspired by image',
          model: modelType === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview',
          mediaUrl: data.audioUrl,
          resultData: data.lyrics || '',
          createdAt: new Date().toISOString(),
        }).catch((e) => console.warn('Firestore save warning:', e));
      }
    } catch (err: any) {
      onError(err.message || 'Music generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-fade-in">
      {/* Studio Header */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-mono font-semibold text-amber-300">
                <Music className="h-3.5 w-3.5 text-amber-400" />
                <span>Lyria Models ({modelType === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview'})</span>
              </span>
              <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] font-mono text-neutral-400">
                High-Fidelity Audio Generation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Music Studio with Lyria 3
            </h1>
            <p className="mt-2 text-sm text-neutral-400 max-w-xl">
              Compose custom original music tracks from text prompts or visual artwork. Generate punchy 30-second clips or full-length studio compositions.
            </p>
          </div>

          {/* Model Type Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setModelType('clip')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                modelType === 'clip'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Lyria Clip (30s)</span>
            </button>
            <button
              type="button"
              onClick={() => setModelType('pro')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                modelType === 'pro'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Lyria Pro (Full Track)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 space-y-5 shadow-xl">
            {/* Prompt Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">
                Music Style & Mood Description:
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A warm and nostalgic acoustic guitar track with soft cello harmonies, gentle campfire mood, gentle reverb..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            {/* Genre Inspiration Chips */}
            <div className="space-y-2">
              <span className="text-[11px] text-neutral-400 font-medium">Quick Genres & Vibes:</span>
              <div className="flex flex-wrap gap-1.5">
                {genreChips.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setPrompt((prev) => (prev ? `${prev}, ${genre}` : genre))}
                    className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:text-amber-300 text-[11px] text-neutral-300 transition-colors"
                  >
                    + {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Reference Artwork */}
            <div className="space-y-2 pt-2 border-t border-neutral-900">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300">Reference Image (Optional):</span>
                {referenceImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceImage(null);
                      setReferenceImageName('');
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
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {referenceImage ? (
                <div className="flex items-center gap-3 p-2 bg-neutral-900 rounded-lg border border-neutral-800">
                  <img
                    src={referenceImage}
                    alt="Ref"
                    className="h-10 w-10 object-cover rounded"
                  />
                  <div className="flex-1 truncate text-xs text-neutral-300">
                    {referenceImageName || 'Attached Image'}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-lg border border-dashed border-neutral-800 hover:border-neutral-600 bg-neutral-900/40 text-xs text-neutral-400 hover:text-neutral-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Attach image to inspire soundtrack</span>
                </button>
              )}
            </div>

            {/* Generate Action */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold text-white transition-all shadow-xl ${
                isGenerating
                  ? 'bg-neutral-800 cursor-not-allowed opacity-75'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  <span>Generating Audio with Lyria 3...</span>
                </>
              ) : (
                <>
                  <Music className="h-4 w-4" />
                  <span>
                    Generate {modelType === 'pro' ? 'Full Track (Lyria Pro)' : '30s Clip (Lyria Clip)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Player / Result Column */}
        <div className="lg:col-span-7 flex flex-col justify-start">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl flex flex-col items-center justify-center min-h-[460px] relative">
            {/* Loading Animation */}
            {isGenerating && (
              <div className="text-center space-y-4 py-12 animate-fade-in">
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-950 animate-ping opacity-25" />
                  <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
                  <Music className="h-8 w-8 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Composing Neural Soundtrack
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Model: {modelType === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview'}
                  </p>
                </div>
              </div>
            )}

            {/* Generated Music Track Player */}
            {!isGenerating && audioUrl && (
              <div className="w-full space-y-6 animate-fade-in">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-semibold text-white">Music Track Generated</span>
                  </div>
                  <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                    {durationLabel}
                  </span>
                </div>

                {/* Animated Waveform Visualizer & Central Audio Stage */}
                <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-8 space-y-6 shadow-2xl">
                  {/* Waveform Bars */}
                  <div className="flex items-center justify-center gap-1.5 h-20">
                    {[35, 60, 45, 90, 75, 40, 85, 95, 60, 40, 70, 80, 50, 65, 85, 45, 90, 70, 30, 60, 80, 50, 95, 40, 70].map((h, i) => (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-200 ${
                          isPlaying
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-neutral-700'
                        }`}
                        style={{
                          height: isPlaying ? `${Math.max(15, (h * (0.6 + Math.random() * 0.4)))}%` : `${h * 0.4}%`,
                          animationDelay: `${i * 40}ms`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Audio Element Hidden */}
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                  />

                  {/* Scrubber & Time */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max={duration || 30}
                      step="0.1"
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        className="h-12 w-12 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform hover:scale-105"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.muted = !isMuted;
                            setIsMuted(!isMuted);
                          }
                        }}
                        className="p-2.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    </div>

                    <a
                      href={audioUrl}
                      download={`lyria_track_${Date.now()}.wav`}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 border border-neutral-700 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Audio</span>
                    </a>
                  </div>
                </div>

                {/* Lyrics / Metadata if available */}
                {lyricsText && (
                  <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                      <FileText className="h-3.5 w-3.5 text-amber-400" />
                      <span>Generated Lyrics / Composition Notes:</span>
                    </div>
                    <p className="text-xs text-neutral-400 whitespace-pre-line leading-relaxed font-mono">
                      {lyricsText}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Standby Canvas */}
            {!isGenerating && !audioUrl && (
              <div className="text-center p-8 max-w-sm space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto shadow-inner">
                  <Music className="h-7 w-7 text-neutral-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Music Synthesizer Standby</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Describe an atmosphere or genre to compose with Lyria 3 ({modelType === 'pro' ? 'Full Track' : '30s Clip'}).
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 font-mono">
                  <span>Lyria 3 Audio Engine</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
