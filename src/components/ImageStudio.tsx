import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Upload,
  Download,
  Wand2,
  Film,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { auth, saveGenerationToFirestore } from '../lib/firebase';
import { MediaItem } from '../types';

interface ImageStudioProps {
  onSendToWatermarkRemover: (media: MediaItem) => void;
  onSendToVeoVideo: (imageBase64: string, promptText?: string) => void;
  onError: (msg: string) => void;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  onSendToWatermarkRemover,
  onSendToVeoVideo,
  onError,
}) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [inputImageMime, setInputImageMime] = useState('image/jpeg');
  const [fileName, setFileName] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCreationPrompts = [
    'Ultra-detailed futuristic Tokyo street with rain reflections and neon signs, 8k resolution, cinematic.',
    'Studio product photo of a sleek minimalist smartwatch on a dark marble pedestal, dramatic rim lighting.',
    'Whimsical digital art illustration of a tiny steampunk hedgehog wearing goggles in an enchanted clockwork forest.',
  ];

  const sampleEditPrompts = [
    'Add a vibrant glowing aurora borealis across the night sky background.',
    'Change the lighting to warm sunset golden hour with long soft shadows.',
    'Add cinematic lens flare and subtle film grain to give a retro vintage camera look.',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setFileName(file.name);
    setInputImageMime(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setInputImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      onError('Please enter a description or editing instructions.');
      return;
    }

    if (mode === 'edit' && !inputImage) {
      onError('Please upload an image to edit.');
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl(null);

    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          base64InputImage: mode === 'edit' ? inputImage : undefined,
          mimeType: inputImageMime,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate/edit image.');
      }

      setGeneratedImageUrl(data.imageUrl);
      setGeneratedDataUrl(data.dataUrl);

      // Save to Firestore if signed in
      if (auth.currentUser) {
        saveGenerationToFirestore({
          id: `gen_img_${Date.now()}`,
          userId: auth.currentUser.uid,
          type: mode === 'create' ? 'image-create' : 'image-edit',
          prompt: prompt.trim(),
          model: 'gemini-3.1-flash-image-preview',
          mediaUrl: data.imageUrl,
          aspectRatio,
          createdAt: new Date().toISOString(),
        }).catch((e) => console.warn('Firestore save warning:', e));
      }
    } catch (err: any) {
      onError(err.message || 'Image generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToWatermark = () => {
    const targetUrl = generatedDataUrl || generatedImageUrl;
    if (!targetUrl) return;

    onSendToWatermarkRemover({
      mediaId: `img_gen_${Date.now()}`,
      filename: `generated_image_${aspectRatio.replace(':', 'x')}.png`,
      fileSize: 1500000,
      mimeType: 'image/png',
      isVideo: false,
      mediaUrl: targetUrl,
      previewUrl: targetUrl,
    });
  };

  const handleSendToVeo = () => {
    const targetBase64 = generatedDataUrl || inputImage;
    if (!targetBase64) return;
    onSendToVeoVideo(targetBase64, prompt);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-fade-in">
      {/* Studio Header */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-mono font-semibold text-cyan-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Model: gemini-3.1-flash-image-preview</span>
              </span>
              <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] font-mono text-neutral-400">
                1K HD · Text to Image & Image Editing
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Image Studio (Create & Edit)
            </h1>
            <p className="mt-2 text-sm text-neutral-400 max-w-xl">
              Synthesize brand new images from detailed text prompts, or edit and reimagine existing photos with natural language instructions.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setGeneratedImageUrl(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'create'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Create Image</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('edit');
                setGeneratedImageUrl(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'edit'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Edit Image</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 space-y-5 shadow-xl">
            {/* If Edit Mode: Image Uploader */}
            {mode === 'edit' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Photo to Edit:</span>
                  {inputImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputImage(null);
                        setFileName('');
                      }}
                      className="text-[11px] text-neutral-400 hover:text-red-400"
                    >
                      Clear
                    </button>
                  )}
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {inputImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-neutral-700 aspect-video group">
                    <img
                      src={inputImage}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-medium"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 rounded-xl p-6 text-center cursor-pointer transition-colors bg-neutral-900/40"
                  >
                    <Upload className="h-8 w-8 text-neutral-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-neutral-200">
                      Upload image to edit with AI
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      PNG, JPG, or WEBP up to 20 MB
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Prompt Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>
                  {mode === 'create' ? 'Image Prompt Description:' : 'Editing Instructions:'}
                </span>
                <span className="text-neutral-500 font-mono text-[11px]">
                  {prompt.length}/2000
                </span>
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'create'
                    ? 'A photorealistic portrait of an astronaut floating in a nebula, vibrant lighting, ultra detailed...'
                    : 'Can you add a glowing cyberpunk neon sign in the background and change the jacket color to red?'
                }
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">
                Aspect Ratio:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 px-1 rounded-lg border text-xs font-mono font-bold transition-all text-center ${
                      aspectRatio === ratio
                        ? 'border-cyan-500 bg-cyan-950/30 text-white shadow-md'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Inspiration Prompts */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-neutral-400 font-medium">Quick Creative Starters:</span>
              <div className="flex flex-col gap-1.5">
                {(mode === 'create' ? sampleCreationPrompts : sampleEditPrompts).slice(0, 2).map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sample)}
                    className="text-left text-[11px] text-neutral-400 hover:text-cyan-300 hover:bg-neutral-900 p-2 rounded border border-neutral-900 transition-colors truncate"
                  >
                    ✨ {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold text-white transition-all shadow-xl ${
                isGenerating
                  ? 'bg-neutral-800 cursor-not-allowed opacity-75'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>Generating with gemini-3.1-flash-image-preview...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {mode === 'create' ? 'Create Image' : 'Apply AI Edit'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Canvas / Output Column */}
        <div className="lg:col-span-7 flex flex-col justify-start">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl flex flex-col items-center justify-center min-h-[460px] relative">
            {/* Loading Spinner */}
            {isGenerating && (
              <div className="text-center space-y-4 py-12 animate-fade-in">
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-950 animate-ping opacity-25" />
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                  <ImageIcon className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Generating High-Fidelity Image
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Model: gemini-3.1-flash-image-preview
                  </p>
                </div>
              </div>
            )}

            {/* Generated Image Result */}
            {!isGenerating && generatedImageUrl && (
              <div className="w-full space-y-4 animate-fade-in">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-white">AI Image Generated</span>
                    <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                      {aspectRatio}
                    </span>
                  </div>
                  <span className="text-neutral-500 text-[11px]">1K HD Resolution</span>
                </div>

                {/* Image Stage Container */}
                <div className="relative mx-auto rounded-xl overflow-hidden bg-black border border-neutral-800 shadow-2xl flex items-center justify-center max-h-[500px]">
                  <img
                    src={generatedDataUrl || generatedImageUrl}
                    alt="Generated output"
                    className="max-h-[460px] w-auto object-contain rounded-lg"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={generatedDataUrl || generatedImageUrl}
                      download={`gemini_image_${Date.now()}.png`}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PNG</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendToVeo}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-colors"
                      title="Animate this image into video with Veo 3"
                    >
                      <Film className="h-3.5 w-3.5" />
                      <span>Animate with Veo 3</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendToWatermark}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-colors"
                      title="Open in watermark removal canvas"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>Clean / Remove Watermarks</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Standby State */}
            {!isGenerating && !generatedImageUrl && (
              <div className="text-center p-8 max-w-sm space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto shadow-inner">
                  <ImageIcon className="h-7 w-7 text-neutral-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Image Canvas Standby</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {mode === 'create'
                      ? 'Enter a prompt on the left and select aspect ratio to synthesize an image.'
                      : 'Upload a photo and describe desired changes to edit with Gemini.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 font-mono">
                  <span>gemini-3.1-flash-image-preview</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
