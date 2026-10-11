export interface MediaItem {
  mediaId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  isVideo: boolean;
  mediaUrl: string;
  previewUrl: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface WatermarkRegion {
  id: string;
  label: string;
  type: 'logo' | 'text' | 'corner' | 'semi-transparent' | 'timestamp' | 'object';
  box: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    width: number;
    height: number;
  };
  confidence: number;
  description: string;
  observedShape?: {
    shapeType: 'text-typography' | 'vector-logo' | 'timestamp-digits' | 'stamp-emblem' | 'translucent-mark';
    detectedTextOrStyle: string;
    strokePixelCount: number;
    backgroundProtectedPercentage: number;
    strokeThickness: number;
    svgContourPath?: string;
  };
}

export interface ProcessingSettings {
  quality: 'standard' | 'high' | 'maximum';
  outputFormat: string;
  preserveResolution: boolean;
  timeRange: [number, number]; // in seconds for video
  tracking: 'fixed' | 'dynamic';
  // Advanced precision inpainting controls
  feather?: number; // 0 - 10px, default 3px
  maskExpansion?: number; // 0 - 10px, default 2px
  reconstructionStrength?: 'balanced' | 'high' | 'maximum';
  detailPreservation?: number; // 0 - 100%, default 85%
  textureMatch?: number; // 0 - 100%, default 90%
  edgeAware?: boolean;
  observePerfectShape?: boolean; // AI Shape Observer: isolate exact watermark strokes with 0% blur
  strokeOnlyMode?: boolean; // remove ONLY watermark strokes, preserve all background pixels
  clarityBoost?: number; // 80 - 160%, default 110% (adjust clarity & pixel vision without blur)
  crispPixelMode?: boolean; // High-frequency texture restoration with zero blur
}

export interface ProcessingJobResult {
  cleanMediaUrl: string;
  originalMediaUrl: string;
  downloadUrl: string;
  resolution: string;
  fps: number;
  duration: string;
  fileSize: number;
  originalSize: number;
  format: string;
  regionsCount: number;
  regions?: WatermarkRegion[];
  qualityScore?: number;
  qualityReport?: {
    passed: boolean;
    edgeContinuity: number;
    textureMatch: number;
    boundarySeamlessness: number;
    notes: string;
    warning?: string;
  };
}

export interface ProcessingJobState {
  jobId: string;
  mediaId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stage: string;
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  etaSeconds?: number;
  result?: ProcessingJobResult;
  error?: string;
}
