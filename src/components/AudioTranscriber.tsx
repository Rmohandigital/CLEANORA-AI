import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Copy,
  Check,
  Download,
  Upload,
  Sparkles,
  FileText,
  ArrowRight,
  Loader2,
  Volume2,
  RotateCcw,
} from 'lucide-react';
import { auth, saveGenerationToFirestore } from '../lib/firebase';

interface AudioTranscriberProps {
  onUseAsPromptForVideo?: (text: string) => void;
  onUseAsPromptForImage?: (text: string) => void;
  onUseAsPromptForMusic?: (text: string) => void;
  onError: (msg: string) => void;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({
  onUseAsPromptForVideo,
  onUseAsPromptForImage,
  onUseAsPromptForMusic,
  onError,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setTranscriptionText('');
      setAudioBlob(null);
      setAudioUrl(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      setAudioMimeType(mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        setAudioUrl(URL.createObjectURL(fullBlob));

        // Stop all mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error:', err);
      onError('Microphone access denied or unavailable. You can upload an audio file directly.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      onError('Please select an audio file (MP3, WAV, WEBM, M4A).');
      return;
    }

    setAudioMimeType(file.type);
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setTranscriptionText('');
  };

  const handleTranscribe = async () => {
    if (!audioBlob) {
      onError('Please record or upload audio first.');
      return;
    }

    setIsTranscribing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      const res = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioMimeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transcribe audio.');
      }

      const text = data.transcription || '';
      setTranscriptionText(text);

      // Save to Firestore
      if (auth.currentUser) {
        saveGenerationToFirestore({
          id: `trans_${Date.now()}`,
          userId: auth.currentUser.uid,
          type: 'audio-transcribe',
          prompt: `Spoken audio recording (${recordingSeconds}s)`,
          model: 'gemini-3.5-transcribe',
          resultData: text,
          createdAt: new Date().toISOString(),
        }).catch((e) => console.warn('Firestore save warning:', e));
      }
    } catch (err: any) {
      onError(err.message || 'Audio transcription failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (!transcriptionText) return;
    navigator.clipboard.writeText(transcriptionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!transcriptionText) return;
    const blob = new Blob([transcriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-mono font-semibold text-emerald-300">
                <Mic className="h-3.5 w-3.5 text-emerald-400" />
                <span>Model: gemini-3.5-transcribe</span>
              </span>
              <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] font-mono text-neutral-400">
                Direct Microphone Input & Audio Files
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Speech-to-Text Audio Transcriber
            </h1>
            <p className="mt-2 text-sm text-neutral-400 max-w-xl">
              Record your voice with your microphone and transcribe it with gemini-3.5-transcribe. Use your voice transcripts directly as prompts for video, image, or music generation!
            </p>
          </div>
        </div>
      </div>

      {/* Main Recording Stage */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-8 shadow-2xl space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          {/* Big Interactive Microphone Button */}
          <div className="relative">
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-red-500/40 animate-ping" />
            )}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative h-28 w-28 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/40 scale-105'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-105'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="h-8 w-8 mb-1" />
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                    Stop
                  </span>
                </>
              ) : (
                <>
                  <Mic className="h-9 w-9 mb-1" />
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                    Record
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Recording Timer / Status */}
          <div>
            {isRecording ? (
              <div className="flex items-center gap-2 text-red-400 font-mono text-xl font-bold">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span>Recording... {formatTimer(recordingSeconds)}</span>
              </div>
            ) : audioBlob ? (
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
                <Check className="h-4 w-4" />
                <span>Audio captured ready for transcription ({formatTimer(recordingSeconds || 5)})</span>
              </div>
            ) : (
              <p className="text-xs text-neutral-400">
                Click the microphone to start recording speech, or upload an audio file below.
              </p>
            )}
          </div>

          {/* Audio Player Preview */}
          {audioUrl && !isRecording && (
            <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
              <audio src={audioUrl} controls className="w-full h-8" />
              <div className="flex items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Re-record</span>
                </button>

                <button
                  type="button"
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Transcribing with gemini-3.5-transcribe...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Transcribe Audio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Or File Upload Fallback */}
          {!isRecording && !audioUrl && (
            <div className="pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Or upload an audio recording file</span>
              </button>
            </div>
          )}
        </div>

        {/* Transcription Output Container */}
        {transcriptionText && (
          <div className="border-t border-neutral-800 pt-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Verbatim Transcription (gemini-3.5-transcribe)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>Save TXT</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-5 text-sm text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-emerald-500/30">
              {transcriptionText}
            </div>

            {/* Quick Actions: Use Transcribed Text directly in Other Studios! */}
            <div className="rounded-lg bg-neutral-900/40 border border-neutral-800/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-neutral-400 font-medium">Use Transcribed Speech Directly As:</span>
              <div className="flex flex-wrap items-center gap-2">
                {onUseAsPromptForVideo && (
                  <button
                    type="button"
                    onClick={() => onUseAsPromptForVideo(transcriptionText)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Veo 3 Video Prompt</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {onUseAsPromptForImage && (
                  <button
                    type="button"
                    onClick={() => onUseAsPromptForImage(transcriptionText)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Image Prompt</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {onUseAsPromptForMusic && (
                  <button
                    type="button"
                    onClick={() => onUseAsPromptForMusic(transcriptionText)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Lyria Music Prompt</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
