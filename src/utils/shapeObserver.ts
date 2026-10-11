import { WatermarkRegion } from '../types';

export interface ObservedWatermarkShape {
  regionId: string;
  shapeType: 'text-typography' | 'vector-logo' | 'timestamp-digits' | 'stamp-emblem' | 'translucent-mark';
  detectedTextOrStyle: string;
  strokePixelCount: number;
  totalBoxPixels: number;
  backgroundProtectedPercentage: number;
  strokeThickness: number; // estimated stroke thickness in px
  averageDeviance: number;
  svgContourPath: string; // SVG path data (d="M ... Z") for rendering exact contours
  strokeMask: Float32Array; // rw * rh float mask (1.0 = watermark stroke, 0.0 = untouched background)
}

/**
 * AI Watermark Shape Observer:
 * Analyzes marked watermark regions to observe the EXACT shape, strokes, and contours of the watermark.
 * 
 * Ensures ONLY the watermark strokes and glyphs are targeted, while protecting 100% of background
 * pixels (surrounding areas, letter cavities 'o','a','p','e', and spaces between words) with 0% box blur.
 */
export function observeWatermarkShape(
  sourceCanvasOrData: HTMLCanvasElement | ImageData,
  region: WatermarkRegion,
  width: number,
  height: number,
  contrastSensitivity: number = 1.0 // 1.0 = standard, higher = tighter stroke isolation
): ObservedWatermarkShape {
  const rx = Math.max(0, Math.floor((region.box.x / 100) * width));
  const ry = Math.max(0, Math.floor((region.box.y / 100) * height));
  const rw = Math.min(width - rx, Math.ceil((region.box.width / 100) * width));
  const rh = Math.min(height - ry, Math.ceil((region.box.height / 100) * height));

  let data: Uint8ClampedArray;
  if ('data' in sourceCanvasOrData) {
    data = sourceCanvasOrData.data;
  } else {
    const ctx = sourceCanvasOrData.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not get 2d context for shape observation');
    }
    data = ctx.getImageData(0, 0, width, height).data;
  }

  const totalPixels = rw * rh;
  const strokeMask = new Float32Array(totalPixels);

  if (rw <= 2 || rh <= 2) {
    return {
      regionId: region.id,
      shapeType: 'vector-logo',
      detectedTextOrStyle: 'Target Watermark',
      strokePixelCount: 0,
      totalBoxPixels: totalPixels,
      backgroundProtectedPercentage: 100,
      strokeThickness: 2,
      averageDeviance: 0,
      svgContourPath: '',
      strokeMask,
    };
  }

  // 1. Compute Local Smooth Neighborhood (5x5 local background model)
  // Watermark text and logos are high-frequency features that deviate from their IMMEDIATE neighborhood (radius 2-3px),
  // NOT a flat interpolation across the entire box (which caused the box-shaped blur)!
  const localSmooth = new Float32Array(rw * rh * 3);
  const rad = 2; // 5x5 window
  for (let y = 0; y < rh; y++) {
    const absY = ry + y;
    for (let x = 0; x < rw; x++) {
      const absX = rx + x;
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let dy = -rad; dy <= rad; dy++) {
        const ny = Math.max(0, Math.min(height - 1, absY + dy));
        for (let dx = -rad; dx <= rad; dx++) {
          const nx = Math.max(0, Math.min(width - 1, absX + dx));
          const idx = (ny * width + nx) * 4;
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
          count++;
        }
      }
      const sIdx = (y * rw + x) * 3;
      localSmooth[sIdx] = sumR / count;
      localSmooth[sIdx + 1] = sumG / count;
      localSmooth[sIdx + 2] = sumB / count;
    }
  }

  // 2. High-Frequency Local Contrast & Laplacian Isolation
  let strokePixelCount = 0;
  let devianceSum = 0;
  const binaryGrid: boolean[][] = Array.from({ length: rh }, () => new Array(rw).fill(false));
  const baseThreshold = 18 / Math.max(0.5, contrastSensitivity);

  for (let y = 0; y < rh; y++) {
    const absY = ry + y;
    for (let x = 0; x < rw; x++) {
      const absX = rx + x;
      const idx = (absY * width + absX) * 4;
      const sIdx = (y * rw + x) * 3;

      const curR = data[idx];
      const curG = data[idx + 1];
      const curB = data[idx + 2];

      const meanR = localSmooth[sIdx];
      const meanG = localSmooth[sIdx + 1];
      const meanB = localSmooth[sIdx + 2];

      // Difference from immediate local background
      const localDiff = Math.sqrt(
        Math.pow(curR - meanR, 2) +
        Math.pow(curG - meanG, 2) +
        Math.pow(curB - meanB, 2)
      );

      // Local Laplacian high-pass acutance
      let lap = 0;
      if (x > 0 && x < rw - 1 && y > 0 && y < rh - 1) {
        const up = ((absY - 1) * width + absX) * 4;
        const down = ((absY + 1) * width + absX) * 4;
        const left = (absY * width + (absX - 1)) * 4;
        const right = (absY * width + (absX + 1)) * 4;

        const lapR = Math.abs(4 * curR - data[up] - data[down] - data[left] - data[right]);
        const lapG = Math.abs(4 * curG - data[up + 1] - data[down + 1] - data[left + 1] - data[right + 1]);
        const lapB = Math.abs(4 * curB - data[up + 2] - data[down + 2] - data[left + 2] - data[right + 2]);
        lap = (lapR + lapG + lapB) / 3;
      }

      // ONLY actual watermark text strokes or logo edges qualify
      // Flat background, smooth textures, and cavities stay 0.0 (100% protected)
      const isStroke = localDiff > baseThreshold || (lap > 22 && localDiff > 10);

      if (isStroke) {
        const strokeStrength = Math.min(1.0, (localDiff / 32) + (lap / 50));
        strokeMask[y * rw + x] = strokeStrength;
        binaryGrid[y][x] = true;
        strokePixelCount++;
        devianceSum += localDiff;
      } else {
        strokeMask[y * rw + x] = 0.0;
        binaryGrid[y][x] = false;
      }
    }
  }

  // 3. Remove stray isolated noise pixels: Watermarks are cohesive character strokes or logo segments
  const refinedMask = new Float32Array(totalPixels);
  for (let y = 1; y < rh - 1; y++) {
    for (let x = 1; x < rw - 1; x++) {
      if (!binaryGrid[y][x]) continue;

      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (binaryGrid[y + dy][x + dx]) neighbors++;
        }
      }
      // Watermark glyphs have at least 2 connected stroke neighbors in a 3x3 window
      if (neighbors >= 3) {
        refinedMask[y * rw + x] = strokeMask[y * rw + x];
      } else {
        refinedMask[y * rw + x] = 0.0;
        binaryGrid[y][x] = false;
        strokePixelCount = Math.max(0, strokePixelCount - 1);
      }
    }
  }

  // 4. Generate SVG Contour Path for live silhouette preview
  const svgPathParts: string[] = [];
  const step = Math.max(1, Math.floor(Math.min(rw, rh) / 28));

  for (let y = 1; y < rh - 1; y += step) {
    let inStroke = false;
    let startX = 0;

    for (let x = 0; x < rw; x += step) {
      const isStroke = refinedMask[y * rw + x] > 0.15;
      if (isStroke && !inStroke) {
        inStroke = true;
        startX = x;
      } else if (!isStroke && inStroke) {
        inStroke = false;
        const normStartX = (startX / rw) * 100;
        const normEndX = (x / rw) * 100;
        const normY = (y / rh) * 100;
        svgPathParts.push(`M ${normStartX.toFixed(2)} ${normY.toFixed(2)} L ${normEndX.toFixed(2)} ${normY.toFixed(2)}`);
      }
    }
    if (inStroke) {
      const normStartX = (startX / rw) * 100;
      const normEndX = 100;
      const normY = (y / rh) * 100;
      svgPathParts.push(`M ${normStartX.toFixed(2)} ${normY.toFixed(2)} L ${normEndX.toFixed(2)} ${normY.toFixed(2)}`);
    }
  }

  const backgroundProtectedPercentage = Math.max(
    0,
    Math.min(99, Math.round(((totalPixels - strokePixelCount) / totalPixels) * 100))
  );

  let shapeType: ObservedWatermarkShape['shapeType'] = 'vector-logo';
  if (region.type === 'text' || region.label.toLowerCase().includes('text') || region.label.toLowerCase().includes('copyright')) {
    shapeType = 'text-typography';
  } else if (region.type === 'timestamp' || region.label.toLowerCase().includes('time')) {
    shapeType = 'timestamp-digits';
  } else if (region.type === 'semi-transparent') {
    shapeType = 'translucent-mark';
  }

  return {
    regionId: region.id,
    shapeType,
    detectedTextOrStyle: strokePixelCount > 0 ? `${shapeType === 'text-typography' ? 'Text Glyph' : 'Watermark Mark'} (${strokePixelCount} px strokes)` : 'Clear Area',
    strokePixelCount,
    totalBoxPixels: totalPixels,
    backgroundProtectedPercentage,
    strokeThickness: Math.max(1, Math.min(6, Math.round(Math.sqrt(strokePixelCount / Math.max(1, rw))))),
    averageDeviance: strokePixelCount > 0 ? Math.round(devianceSum / strokePixelCount) : 0,
    svgContourPath: svgPathParts.join(' '),
    strokeMask: refinedMask,
  };
}
