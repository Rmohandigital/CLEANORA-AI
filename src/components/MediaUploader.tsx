import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileVideo, Image as ImageIcon, AlertCircle, Play, Pause, X, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaUploaderProps {
  onMediaUploaded: (media: MediaItem) => void;
  onError: (msg: string) => void;
  onUseSampleMedia: (type?: 'image' | 'video') => void;
}

const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB per chunk to ensure minimal browser memory footprint
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onMediaUploaded,
  onError,
  onUseSampleMedia,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pauseRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);
  const activeSessionRef = useRef<{
    uploadId: string;
    totalChunks: number;
    chunkIndex: number;
    uploadedChunks: Set<number>;
  } | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      onError('File exceeds the configured limit of 2 GB. Please choose a smaller file.');
      return false;
    }

    const acceptedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm',
    ];

    const isImageOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (!isImageOrVideo && !acceptedTypes.includes(file.type)) {
      onError('Unsupported file format. Supported formats: JPG, PNG, WEBP, MP4, MOV, AVI, MKV, WEBM.');
      return false;
    }

    return true;
  };

  // Perform chunked streaming upload
  const uploadFileInChunks = async (file: File) => {
    try {
      setUploading(true);
      setIsPaused(false);
      pauseRef.current = false;
      isCancelledRef.current = false;
      setCurrentFile(file);
      setTotalBytes(file.size);
      setUploadedBytes(0);
      setProgress(0);

      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      abortControllerRef.current = new AbortController();

      const isVideo =
        file.type.startsWith('video/') ||
        /\.(mp4|mov|webm|avi|mkv|m4v|wmv|flv)$/i.test(file.name);
      const detectedMime = file.type || (isVideo ? 'video/mp4' : 'image/jpeg');

      // Step 1: Initialize upload session on backend
      const initRes = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          mimeType: detectedMime,
          totalChunks,
          chunkSize: CHUNK_SIZE,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!initRes.ok) {
        const errorData = await initRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initialize chunked upload');
      }

      const { uploadId } = await initRes.json();
      activeSessionRef.current = {
        uploadId,
        totalChunks,
        chunkIndex: 0,
        uploadedChunks: new Set(),
      };

      // Step 2: Stream chunk by chunk using file.slice (Zero 2GB RAM buffering)
      let bytesTransferred = 0;
      let lastTime = Date.now();
      let lastBytes = 0;

      for (let i = 0; i < totalChunks; i++) {
        // Check for cancellation
        if (isCancelledRef.current) {
          throw new Error('Upload cancelled by user');
        }

        // Handle pause: wait in loop
        while (pauseRef.current) {
          if (isCancelledRef.current) throw new Error('Upload cancelled by user');
          await new Promise((r) => setTimeout(r, 200));
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunkBlob = file.slice(start, end);

        let attempt = 0;
        let success = false;
        const maxRetries = 3;

        while (!success && attempt < maxRetries) {
          try {
            attempt++;
            const chunkRes = await fetch(
              `/api/upload/chunk?uploadId=${encodeURIComponent(uploadId)}&chunkIndex=${i}&offset=${start}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/octet-stream',
                },
                body: chunkBlob,
                signal: abortControllerRef.current?.signal,
              }
            );

            if (!chunkRes.ok) {
              throw new Error(`Chunk ${i} upload failed`);
            }

            success = true;
          } catch (chunkErr: any) {
            if (isCancelledRef.current) throw new Error('Upload cancelled');
            if (attempt >= maxRetries) {
              throw new Error(`Failed to upload chunk ${i} after ${maxRetries} retries.`);
            }
            await new Promise((r) => setTimeout(r, 600));
          }
        }

        bytesTransferred += end - start;
        setUploadedBytes(bytesTransferred);
        const currentProgress = Math.round((bytesTransferred / file.size) * 100);
        setProgress(currentProgress);

        // Calculate transfer speed
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        if (timeDiff >= 0.5) {
          const speed = (bytesTransferred - lastBytes) / timeDiff; // bytes/sec
          setUploadSpeed(`${(speed / (1024 * 1024)).toFixed(1)} MB/s`);
          lastTime = now;
          lastBytes = bytesTransferred;
        }
      }

      // Step 3: Complete upload on server
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
        signal: abortControllerRef.current?.signal,
      });

      if (!completeRes.ok) {
        const completeError = await completeRes.json().catch(() => ({}));
        throw new Error(completeError.error || 'Failed to complete media assembly');
      }

      const mediaData = await completeRes.json();
      setUploading(false);
      setProgress(100);

      // Create a local blob URL for instant, reliable browser display
      const localBlobUrl = URL.createObjectURL(file);

      onMediaUploaded({
        mediaId: mediaData.mediaId,
        filename: file.name,
        fileSize: file.size,
        mimeType: detectedMime,
        isVideo: isVideo,
        mediaUrl: localBlobUrl,
        previewUrl: localBlobUrl,
      });
    } catch (err: any) {
      setUploading(false);
      if (err.name === 'AbortError' || err.message === 'Upload cancelled by user') {
        onError('Upload cancelled');
      } else {
        console.error('Upload error:', err);
        onError(err.message || 'Upload interrupted. Please try again.');
      }
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (validateFile(file)) {
      uploadFileInChunks(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      pauseRef.current = false;
      setIsPaused(false);
    } else {
      pauseRef.current = true;
      setIsPaused(true);
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    abortControllerRef.current?.abort();
    setUploading(false);
    setIsPaused(false);
    setCurrentFile(null);
    setProgress(0);
  };

  return (
    <section id="uploader" className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Upload Your Media
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          Upload images or videos to detect and eliminate watermarks with AI.
        </p>
      </div>

      {/* Main Drag-and-Drop Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-14 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-white bg-neutral-900/80 scale-[1.01]'
            : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />

        {!uploading ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white border border-neutral-800 mb-5">
              <UploadCloud className="h-8 w-8" />
            </div>

            <p className="text-base font-semibold text-white sm:text-lg">
              Drop your image or video here
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              or <span className="text-white underline underline-offset-4 font-medium">click to browse</span>
            </p>

            {/* Supported formats specification */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
                <span>Images: JPG, JPEG, PNG, WEBP</span>
              </div>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5">
                <FileVideo className="h-3.5 w-3.5 text-neutral-400" />
                <span>Videos: MP4, MOV, AVI, MKV, WEBM</span>
              </div>
            </div>

            {/* Maximum file size badge & Chunking architecture notification */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="font-mono text-neutral-300 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                Maximum file size: 2 GB
              </span>
              <span className="text-neutral-500 hidden sm:inline">
                Chunked resumable transfer engine
              </span>
            </div>

            {/* Quick Demo Sample Action */}
            <div className="mt-8 pt-6 border-t border-neutral-900 w-full max-w-md">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 text-center mb-3">
                Or test instantly with sample media
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUseSampleMedia('image');
                  }}
                  className="flex items-center justify-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
                  <span>4K Photo Sample</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUseSampleMedia('video');
                  }}
                  className="flex items-center justify-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                >
                  <FileVideo className="h-3.5 w-3.5 text-neutral-400" />
                  <span>1080p Video Sample</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Active Chunked Upload Progress State */
          <div className="w-full max-w-md py-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span className="font-medium text-white truncate max-w-[200px]">
                {currentFile?.name}
              </span>
              <span className="font-mono text-white">{progress}%</span>
            </div>

            {/* Progress Bar in strict monochrome */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-900 border border-neutral-800">
              <div
                className="h-full bg-white transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 font-mono">
              <span>
                {formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}
              </span>
              {uploadSpeed && <span>{uploadSpeed}</span>}
            </div>

            {/* Controls: Pause / Resume / Cancel */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePauseResume}
                className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-800"
              >
                {isPaused ? (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-950 px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:border-neutral-700"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            </div>

            <p className="mt-4 text-[11px] text-neutral-500">
              Streaming chunks to server directly. No browser memory saturation.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
