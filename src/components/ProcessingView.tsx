import React, { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle, X, Film, Sparkles } from 'lucide-react';
import { ProcessingJobState, ProcessingJobResult } from '../types';

interface ProcessingViewProps {
  jobId: string;
  onComplete: (result: ProcessingJobResult) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  jobId,
  onComplete,
  onCancel,
  onError,
}) => {
  const [jobState, setJobState] = useState<ProcessingJobState>({
    jobId,
    mediaId: '',
    status: 'queued',
    stage: 'Uploading & Initializing Pipeline',
    progress: 5,
    etaSeconds: 15,
  });

  const pollIntervalRef = useRef<any>(null);

  const stagesList = [
    'Uploading',
    'Analyzing',
    'Detecting watermark',
    'Reconstructing background',
    'Processing frames',
    'Finalizing',
    'Complete',
  ];

  // Map backend stage to active index in stagesList
  const getActiveStageIndex = (stageString: string) => {
    const lower = stageString.toLowerCase();
    if (lower.includes('upload')) return 0;
    if (lower.includes('analyz')) return 1;
    if (lower.includes('detect')) return 2;
    if (lower.includes('reconstruct') || lower.includes('inpaint')) return 3;
    if (lower.includes('frame') || lower.includes('smooth')) return 4;
    if (lower.includes('finaliz')) return 5;
    if (lower.includes('complete')) return 6;
    return 1;
  };

  useEffect(() => {
    let failCount = 0;
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/processing/${jobId}/status`);
        if (!res.ok) {
          failCount++;
          if (failCount > 60) {
            clearInterval(pollIntervalRef.current);
            onError('Processing session expired or connection timed out.');
          }
          return;
        }

        failCount = 0;
        const data: ProcessingJobState = await res.json();
        setJobState(data);

        if (data.status === 'completed' && data.result) {
          clearInterval(pollIntervalRef.current);
          setTimeout(() => {
            onComplete(data.result!);
          }, 600);
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          onError(data.error || 'Media processing encountered an error.');
        }
      } catch (_err: any) {
        // Silently tolerate transient polling hiccups
        failCount++;
        if (failCount > 60) {
          clearInterval(pollIntervalRef.current);
          onError('Connection lost during media processing.');
        }
      }
    };

    pollIntervalRef.current = setInterval(pollStatus, 500);
    pollStatus();

    return () => clearInterval(pollIntervalRef.current);
  }, [jobId]);

  const activeIndex = getActiveStageIndex(jobState.stage);

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 animate-fade-in text-center">
      {/* Container Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 sm:p-12 shadow-2xl">
        {/* Animated Central Progress Node */}
        <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
          {/* Subtle Outer Spinner Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
          <div
            className="absolute inset-0 rounded-full border-2 border-white transition-all duration-300"
            style={{
              clipPath: `polygon(50% 50%, -50% -50%, ${jobState.progress * 2}% -50%, ${jobState.progress * 2}% 150%, -50% 150%)`,
            }}
          />
          <div className="flex flex-col items-center">
            <span className="font-mono text-3xl font-bold tracking-tight text-white">
              {jobState.progress}%
            </span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
              Inpainting
            </span>
          </div>
        </div>

        {/* Current Active Stage Description */}
        <h3 className="text-xl font-bold text-white sm:text-2xl">
          {jobState.stage}
        </h3>
        <p className="mt-2 text-xs text-neutral-400">
          Content-aware neural inpainting algorithm reconstructing underlying pixels.
        </p>

        {/* Real Frame and ETA indicators */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 rounded-lg border border-neutral-900 bg-neutral-900/60 py-3 px-6 text-xs text-neutral-300 font-mono">
          {jobState.totalFrames && jobState.totalFrames > 1 && (
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-white" />
              <span>
                Processing frame{' '}
                <strong className="text-white">
                  {(jobState.currentFrame || 0).toLocaleString()}
                </strong>{' '}
                /{' '}
                {(jobState.totalFrames || 1850).toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Estimated remaining time:</span>
            <strong className="text-white">
              {jobState.etaSeconds !== undefined && jobState.etaSeconds > 0
                ? `${jobState.etaSeconds}s`
                : 'Finalizing...'}
            </strong>
          </div>
        </div>

        {/* Sequential Stages Stepper */}
        <div className="mt-10 pt-8 border-t border-neutral-900">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {stagesList.map((stg, idx) => {
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              return (
                <div
                  key={stg}
                  className={`flex flex-col items-center p-2 rounded text-center transition-all ${
                    isCurrent
                      ? 'bg-neutral-900 border border-neutral-700 text-white'
                      : isPast
                      ? 'text-neutral-400'
                      : 'text-neutral-600'
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full mb-1.5 ${
                      isCurrent
                        ? 'bg-white shadow-[0_0_8px_white]'
                        : isPast
                        ? 'bg-neutral-400'
                        : 'bg-neutral-800'
                    }`}
                  />
                  <span className="text-[10px] font-medium leading-tight">
                    {stg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Abort / Cancel Button */}
        <div className="mt-8">
          <button
            onClick={onCancel}
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Cancel Processing Job
          </button>
        </div>
      </div>
    </div>
  );
};
