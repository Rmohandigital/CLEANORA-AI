import React from 'react';
import { Sparkles, Image as ImageIcon, Film, HardDrive, SplitSquareVertical, ShieldCheck } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'AI Watermark Removal',
      description: 'Remove unwanted logos, text and visual marks.',
      details: 'Neural contour segmentation isolates watermarks without damaging adjoining scene gradients or fine line textures.',
    },
    {
      icon: ImageIcon,
      title: 'Image Processing',
      description: 'Clean photos while preserving important visual details.',
      details: 'Supports high-dynamic-range photos up to 4K resolution across JPG, PNG, and WebM formats with pixel-level precision.',
    },
    {
      icon: Film,
      title: 'Video Processing',
      description: 'Process long videos with frame-aware processing.',
      details: 'Temporal consistency engine matches motion vectors between frames to eliminate jitter, flickering, or edge bleeding.',
    },
    {
      icon: HardDrive,
      title: 'Large File Support',
      description: 'Designed for large media uploads with resumable transfers.',
      details: 'Chunked binary stream architecture handles uploads up to 2 GB with pause, resume, and auto-retry capabilities.',
    },
    {
      icon: SplitSquareVertical,
      title: 'Before & After Preview',
      description: 'Compare your original and processed media.',
      details: 'Interactive split-screen wiper and dual synchronized video players allow immediate quality verification before downloading.',
    },
    {
      icon: ShieldCheck,
      title: 'Privacy Focused',
      description: 'Keep media processing secure and transparent.',
      details: 'Encrypted ephemeral workspaces delete media automatically after 2 hours. One-click instant manual file shredding.',
    },
  ];

  return (
    <section id="features" className="border-b border-neutral-800/80 bg-black py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            <span>Engineering & Capabilities</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Engineered for Production Media
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            Advanced inpainting algorithms tailored for legitimate content creators, editors, and photographers.
          </p>
        </div>

        {/* 6 Professional Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-xl border border-neutral-800 bg-neutral-950 p-6 transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-900/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-white transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-neutral-300">
                  {feature.description}
                </p>
                <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
                  {feature.details}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
