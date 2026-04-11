import React, { useState } from 'react';
import { GarmentViewer } from './GarmentViewer';
import { garmentStyles } from '../config/garmentStyles';

/** Brand purple for all neckline preview models (#9E6AFF). */
const NECKLINE_PREVIEW_PURPLE = '#9E6AFF';

interface NecklineTestingProps {
  selectedGarmentId?: string;
  onGarmentSelect?: (garmentId: string) => void;
  garmentColor?: string;
}

export function NecklineTesting({ selectedGarmentId, onGarmentSelect }: NecklineTestingProps) {
  const [internalActiveGarment, setInternalActiveGarment] = useState(garmentStyles[0]?.id ?? '');
  const hasAnyConfiguredModel = garmentStyles.some((style) => Boolean(style.modelUrl));
  const activeGarment = selectedGarmentId ?? internalActiveGarment;

  const handleGarmentSelect = (garmentId: string) => {
    setInternalActiveGarment(garmentId);
    onGarmentSelect?.(garmentId);
  };

  return (
    <div className="absolute left-[370px] top-[656px] w-[585px] overflow-hidden rounded-[22px] border border-[rgba(226,219,239,0.82)] bg-[rgba(255,255,255,0.9)] shadow-[0_10px_22px_-18px_rgba(49,34,84,0.45)]">
      <div className="relative z-10 flex min-h-[208px] flex-col px-5 pb-4 pt-4">
        <div className="content-stretch flex h-[24px] items-center">
          <p className="font-['Cabin:Bold',sans-serif] text-[13px] font-bold leading-[20px] uppercase tracking-[0.7px] text-[#4a465f]" style={{ fontVariationSettings: "'wdth' 100" }}>
            Necklines Testing
          </p>
        </div>

        {!hasAnyConfiguredModel && (
          <p className="pt-1 text-[10px] text-[#7a7a7a] font-['Cabin',sans-serif]">
            Place GLB files in /public/models. Cards auto-populate from available files.
          </p>
        )}

        <div className="relative z-10 mt-3 overflow-x-auto overflow-y-hidden pb-1" style={{ scrollbarWidth: 'none' }}>
          <div className="flex min-w-max items-start gap-4 pr-2">
            {garmentStyles.map((style) => {
              const modelUrl = style.modelUrl;
              const isActive = style.id === activeGarment;

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleGarmentSelect(style.id)}
                  className="shrink-0"
                >
                  <div
                    className={`relative h-[100px] w-[100px] overflow-hidden rounded-[14px] border transition-all ${
                      isActive
                        ? 'border-[#9E6AFF] shadow-[0_0_0_2px_rgba(158,106,255,0.18)]'
                        : 'border-[rgba(158,106,255,0.24)] hover:border-[rgba(158,106,255,0.5)]'
                    }`}
                  >
                    <GarmentViewer
                      modelUrl={modelUrl}
                      garmentType={style.id}
                      garmentColor={NECKLINE_PREVIEW_PURPLE}
                      applyFabricTextures={false}
                      alignBottom={true}
                      autoRotate={false}
                      transparentBackground={true}
                      autoFit={true}
                      modelScale={1.16}
                      fitPadding={0.9}
                      cameraYOffset={0}
                      bottomAnchorNdc={-1.1}
                      className="absolute inset-0 h-full w-full bg-[linear-gradient(180deg,rgba(237,228,255,0.92)_0%,rgba(226,210,255,0.88)_100%)]"
                    />
                  </div>
                  <p className="mt-2 max-w-[100px] truncate text-center text-[10px] font-semibold text-[#4f4a66]">
                    {style.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
