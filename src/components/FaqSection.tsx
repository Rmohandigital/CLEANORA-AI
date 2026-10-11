import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What types of files are supported?',
      a: 'Cleanora AI supports standard high-resolution images (JPG, JPEG, PNG, WEBP) as well as professional video containers including MP4, MOV, AVI, MKV, and WebM encoded in H.264, ProRes, or VP9.',
    },
    {
      q: 'How large can my video be?',
      a: 'The server accepts files up to 2 GB. Our frontend utilizes a streaming chunked transfer protocol that slices large media into 2 MB packets, ensuring that files up to 2 GB never exhaust your browser memory.',
    },
    {
      q: 'Can I process a 2 GB video?',
      a: 'Yes. Unlike browser-only tools that crash on large video files, Cleanora AI connects to a dedicated server-side pipeline. The video is received in resumable chunks and processed frame-by-frame on the backend.',
    },
    {
      q: 'Does the original resolution remain?',
      a: 'Yes. By default, the "Preserve original resolution" toggle is active. If you upload a 4K UHD video (3840×2160) or 60 FPS media, the export maintains the exact native resolution, frame rate, and container aspect ratio.',
    },
    {
      q: 'Can I manually select the watermark?',
      a: 'Yes. In addition to our AI Watermark Style Presets (Text, Logo, and Timestamp), our editing workspace includes freehand Paint Brush, Rectangle bounding box, Eraser, and Pointer tools so you can customize the inpainting mask with pixel precision.',
    },
    {
      q: 'How long does video processing take?',
      a: 'Processing duration depends on the video length, resolution, and whether the watermark moves dynamically or stays static. A typical 1-minute 1080p clip processes in 15 to 30 seconds with real-time frame progress updates.',
    },
    {
      q: 'Are uploaded files stored?',
      a: 'Uploaded files and temporary frames are stored in sandboxed directories on the server and are automatically and permanently deleted 2 hours after completion. If you are signed in, your processing history links to your session, and you can delete items anytime with one click.',
    },
  ];

  return (
    <section id="faq" className="border-b border-neutral-800/80 bg-neutral-950 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Technical Details & Answers
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            Accurate answers based on our server architecture and processing pipeline.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-neutral-800/80 bg-black overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-white hover:text-neutral-200 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-neutral-400 leading-relaxed border-t border-neutral-900">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
