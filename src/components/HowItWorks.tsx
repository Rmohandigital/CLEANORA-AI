import React from 'react';
import { UploadCloud, Crosshair, Cpu, Download } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Upload',
      subtitle: 'Streaming transfer up to 2 GB',
      description: 'Drag & drop your images or videos. Large files stream in manageable chunks without browser memory bottlenecks.',
      icon: UploadCloud,
    },
    {
      num: '02',
      title: 'Select',
      subtitle: 'Style presets or manual bounding',
      description: 'Use intelligent style presets (Text, Logo, Timestamp) for automatic detection or paint over unwanted marks with the brush.',
      icon: Crosshair,
    },
    {
      num: '03',
      title: 'AI Processing',
      subtitle: 'Content-aware inpainting',
      description: 'Neural models analyze surrounding textures, reconstruct background pixels, and track video motion vectors frame by frame.',
      icon: Cpu,
    },
    {
      num: '04',
      title: 'Download',
      subtitle: 'Original resolution preserved',
      description: 'Review the before & after comparison slider or synchronized video player, then export your clean media in native fidelity.',
      icon: Download,
    },
  ];

  return (
    <section id="how-it-works" className="border-b border-neutral-800/80 bg-neutral-950 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            <span>Workflow Overview</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            A seamless four-step pipeline from upload to clean export.
          </p>
        </div>

        {/* Horizontal Timeline on Desktop / Vertical on Mobile */}
        <div className="relative">
          {/* Connector line for desktop */}
          <div
            className="hidden lg:block absolute top-1/2 left-0 right-0 h-[1px] bg-neutral-800 -translate-y-8 pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="relative flex flex-col rounded-xl border border-neutral-800/80 bg-black p-6 transition-all duration-200 hover:border-neutral-600"
                >
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-bold text-white tracking-tight">
                      {step.num}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs font-mono text-neutral-400 mt-0.5">
                    {step.subtitle}
                  </p>
                  <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
