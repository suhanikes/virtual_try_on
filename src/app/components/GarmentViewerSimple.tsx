import React from 'react';

interface GarmentViewerSimpleProps {
  garmentType?: string;
  className?: string;
}

// Simple SVG-based garment viewer (fallback when 3D doesn't work)
export function GarmentViewerSimple({ garmentType = 'tshirt', className }: GarmentViewerSimpleProps) {
  return (
    <div className={`${className} flex items-center justify-center relative overflow-hidden`}>
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        {/* Simple SVG illustration of a garment */}
        <svg
          viewBox="0 0 100 100"
          className="w-20 h-20 opacity-40"
          fill="none"
          stroke="#9E6AFF"
          strokeWidth="2"
        >
          {/* T-shirt outline */}
          <path d="M 30 20 L 20 35 L 20 90 L 80 90 L 80 35 L 70 20 L 60 25 L 60 30 L 40 30 L 40 25 Z" />
          <line x1="30" y1="20" x2="40" y2="25" />
          <line x1="70" y1="20" x2="60" y2="25" />
        </svg>

        <p className="text-[10px] text-[#9E6AFF] font-['Cabin',sans-serif] text-center">
          {garmentType.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </p>

        <p className="text-[8px] text-[#9E9E9E] font-['Cabin',sans-serif] text-center px-4">
          3D preview ready for GLB models
        </p>
      </div>
    </div>
  );
}
