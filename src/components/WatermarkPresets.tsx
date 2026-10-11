import React from 'react';
import { Type, Shield, Clock, Layers, SlidersHorizontal, Sparkles } from 'lucide-react';

export type WatermarkPresetType = 'all' | 'text' | 'logo' | 'timestamp' | 'custom';

interface WatermarkPresetsProps {
  activePreset: WatermarkPresetType;
  onSelectPreset: (preset: WatermarkPresetType) => void;
  onTriggerScan: (preset: WatermarkPresetType) => void;
  isScanning: boolean;
  sensitivity: 'low' | 'standard' | 'high';
  onSensitivityChange: (s: 'low' | 'standard' | 'high') => void;
}

export const WatermarkPresets: React.FC<WatermarkPresetsProps> = ({
  activePreset,
  onSelectPreset,
  onTriggerScan,
  isScanning,
  sensitivity,
  onSensitivityChange,
}) => {
  const presets = [
    {
      id: 'all' as WatermarkPresetType,
      label: 'All Watermarks',
      icon: Layers,
      description: 'Comprehensive scan for text, emblems, and corner marks',
    },
    {
      id: 'text' as WatermarkPresetType,
      label: 'Text Watermark',
      icon: Type,
      description: 'Captions, copyright lines, translucent author handles',
    },
    {
      id: 'logo' as WatermarkPresetType,
      label: 'Logo & Emblems',
      icon: Shield,
      description: 'Corner channel bugs, brand stamps, broadcaster watermarks',
    },
    {
      id: 'timestamp' as WatermarkPresetType,
      label: 'Timestamp Overlay',
      icon: Clock,
      description: 'Camera date/time codes, security footage timecodes',
    },
  ];

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Watermark Style Presets</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Target specific mark structures or switch between detection models.
          </p>
        </div>

        {/* Sensitivity segmented control */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded border border-neutral-800 self-start sm:self-auto">
          <span className="text-[10px] text-neutral-500 uppercase px-1.5">Sensitivity:</span>
          {(['low', 'standard', 'high'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onSensitivityChange(lvl)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors uppercase ${
                sensitivity === lvl
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isSelected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                onSelectPreset(preset.id);
              }}
              className={`flex flex-col items-start p-2.5 rounded-md border text-left transition-all ${
                isSelected
                  ? 'border-white bg-neutral-900 text-white'
                  : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-neutral-500'}`} />
                <span className="text-xs font-semibold">{preset.label}</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Trigger Rescan Action */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-[11px]">
        <span className="text-neutral-400">
          Preset: <strong className="text-white capitalize">{activePreset}</strong> detection active
        </span>
        <button
          type="button"
          onClick={() => onTriggerScan(activePreset)}
          disabled={isScanning}
          className="flex items-center gap-1.5 text-xs text-white hover:text-neutral-200 transition-colors disabled:opacity-50"
        >
          <Sparkles className="h-3 w-3" />
          <span>{isScanning ? 'Analyzing with AI...' : 'Re-scan with this Preset'}</span>
        </button>
      </div>
    </div>
  );
};
