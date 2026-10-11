import React, { useState } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Film, Image as ImageIcon, Box } from 'lucide-react';

interface HeroProps {
  onUploadClick: () => void;
  onExploreDemo: () => void;
  onOpenVideoStudio?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onUploadClick, onExploreDemo, onOpenVideoStudio }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section id="hero" className="relative overflow-hidden border-b border-neutral-800/80 bg-black pt-16 pb-20 md:pt-24 md:pb-28">
      {/* Subtle ambient grid pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Metadata pill-free notice */}
          <div className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 mb-6">
            <span>High-Fidelity AI Reconstruction</span>
            <span aria-hidden="true">·</span>
            <span>Zero Blur Pixel Clarity</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-semibold">3D Videos (10s–30s Duration)</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl" style={{ textWrap: 'balance' }}>
            Remove Watermarks.<br />
            Or Generate 3D Videos.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-neutral-400 sm:text-lg">
            Surgical AI watermark removal for crystal clear media without blur, plus a full 3D Spatial Video Studio with custom durations (10s, 15s, 20s, 25s, 30s), aspect ratio options, and 100% watermark-free export.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onUploadClick}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold tracking-wide text-black transition-all duration-200 hover:bg-neutral-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Upload Media to Clean</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            {onOpenVideoStudio && (
              <button
                onClick={onOpenVideoStudio}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] shadow-lg shadow-cyan-600/20"
              >
                <Box className="h-4 w-4 text-cyan-200" />
                <span>Generate 3D Videos (10s–30s)</span>
              </button>
            )}
            <button
              onClick={onExploreDemo}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-950 px-6 py-3 text-sm font-semibold text-neutral-200 transition-all duration-200 hover:border-neutral-500 hover:text-white"
            >
              <span>How It Works</span>
            </button>
          </div>

          {/* Clean trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-neutral-300" />
              User-Owned & Authorized Media
            </span>
            <span className="flex items-center gap-1.5">
              <Film className="h-4 w-4 text-neutral-300" />
              Frame-Aware Video Inpainting
            </span>
            <span className="flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-neutral-300" />
              Up to 4K Native Resolution
            </span>
          </div>
        </div>

        {/* Visual Workflow Demonstration: Original Media → AI Processing → Clean Media */}
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-3 sm:p-6 backdrop-blur-xl">
            {/* Stage Indicators */}
            <div className="mb-4 flex items-center justify-between border-b border-neutral-900 pb-3 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-neutral-400"></span>
                <span className="font-medium text-white">Interactive Pipeline Preview</span>
              </div>
              <div className="hidden sm:flex items-center gap-6">
                <span className="text-neutral-500">Original Media</span>
                <span className="text-neutral-600">→</span>
                <span className="text-neutral-300 font-mono">AI Reconstruction</span>
                <span className="text-neutral-600">→</span>
                <span className="text-white font-medium">Clean Media</span>
              </div>
            </div>

            {/* Split Screen Demonstration */}
            <div 
              className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-900 select-none cursor-ew-resize border border-neutral-800"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                setSliderPos((x / rect.width) * 100);
              }}
              onTouchMove={(e) => {
                if (e.touches[0]) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
                  setSliderPos((x / rect.width) * 100);
                }
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* After / Clean image (full width beneath) */}
              <div className="absolute inset-0 h-full w-full bg-neutral-950">
                <img
                  src="/src/assets/images/sample_clean_view_1790950881009.jpg"
                  alt="Clean media after watermark removal"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover grayscale contrast-110"
                />
                {/* Clean label */}
                <div className="absolute top-4 right-4 z-10 rounded bg-black/80 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white border border-neutral-800 backdrop-blur-sm">
                  CLEAN MEDIA
                </div>
              </div>

              {/* Before / Watermarked image clipped by slider position */}
              <div 
                className="absolute inset-0 h-full overflow-hidden border-r border-white/60 transition-none"
                style={{ width: `${sliderPos}%` }}
              >
                <div className="relative h-full w-full" style={{ width: '100%', minWidth: '100%' }}>
                  <img
                    src="/src/assets/images/sample_clean_view_1790950881009.jpg"
                    alt="Original media with visible watermark"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover grayscale contrast-110"
                    style={{ minWidth: '100%', width: '100%' }}
                  />
                  {/* Synthetic prominent watermark simulation on the BEFORE side */}
                  <div className="absolute bottom-10 right-12 z-20 flex flex-col items-end opacity-75 select-none pointer-events-none">
                    <div className="border border-white/40 bg-black/60 px-4 py-2 text-sm font-bold tracking-widest text-white backdrop-blur-xs">
                      © CLEANORA PREVIEW 2026
                    </div>
                    <span className="text-[10px] text-neutral-300 font-mono mt-1">STOCK_ID: 948201-PROTECTED</span>
                  </div>

                  <div className="absolute top-4 left-4 z-10 rounded bg-black/80 px-2.5 py-1 text-[11px] font-medium tracking-wide text-neutral-300 border border-neutral-800 backdrop-blur-sm">
                    ORIGINAL MEDIA
                  </div>
                </div>
              </div>

              {/* Slider divider line and draggable handle */}
              <div
                className="absolute top-0 bottom-0 z-30 flex items-center justify-center pointer-events-none -ml-3"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-[2px] h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
                <div className="absolute h-8 w-8 rounded-full border border-neutral-700 bg-black text-white flex items-center justify-center shadow-lg">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">◀</span>
                    <span className="text-[10px]">▶</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction footnote */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
              <span>Drag divider left/right to compare original vs processed media</span>
              <span className="hidden sm:inline font-mono">100% Client & Server Zero-Leak Processing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
