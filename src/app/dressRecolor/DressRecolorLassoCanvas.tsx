import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';

function useImage(url: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.src = url;
  }, [url]);

  return image;
}

type LassoPoint = { x: number; y: number };

type Props = {
  imageUrl: string | null;
  onLassoComplete: (points: LassoPoint[]) => void;
  maskPreview: string | null;
  isProcessing: boolean;
};

export function DressRecolorLassoCanvas({
  imageUrl,
  onLassoComplete,
  maskPreview,
  isProcessing,
}: Props) {
  const image = useImage(imageUrl);
  const [points, setPoints] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 360, height: 520 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight || Math.round(w * 1.5);
      setStageSize({ width: Math.max(80, w), height: Math.max(80, h) });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handlePointerDown = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!image || isProcessing) {
        return;
      }
      const stage = e.target.getStage();
      if (!stage) {
        return;
      }
      const pos = stage.getPointerPosition();
      if (!pos) {
        return;
      }
      setIsDrawing(true);
      setPoints([pos.x, pos.y]);
    },
    [image, isProcessing],
  );

  const handlePointerMove = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDrawing || !image || isProcessing) {
        return;
      }
      const stage = e.target.getStage();
      if (!stage) {
        return;
      }
      const pos = stage.getPointerPosition();
      if (!pos) {
        return;
      }
      setPoints((prev) => [...prev, pos.x, pos.y]);
    },
    [isDrawing, image, isProcessing],
  );

  const finishStroke = useCallback(() => {
    if (!isDrawing || !image) {
      return;
    }
    setIsDrawing(false);
    setPoints((prev) => {
      if (prev.length < 6) {
        return [];
      }

      const stage = stageRef.current;
      if (!stage) {
        return [];
      }

      const scaleX = image.width / stage.width();
      const scaleY = image.height / stage.height();

      const lassoPoints: LassoPoint[] = [];
      for (let i = 0; i < prev.length; i += 2) {
        lassoPoints.push({
          x: prev[i] * scaleX,
          y: prev[i + 1] * scaleY,
        });
      }
      onLassoComplete(lassoPoints);
      return [];
    });
  }, [image, isDrawing, onLassoComplete]);

  const maskPreviewImage = useImage(maskPreview);

  const scaledImageProps = useMemo(() => {
    if (!image) {
      return null;
    }
    const aspect = image.width / image.height;
    let width = stageSize.width;
    let height = width / aspect;
    if (height > stageSize.height) {
      height = stageSize.height;
      width = height * aspect;
    }
    const offsetX = (stageSize.width - width) / 2;
    const offsetY = (stageSize.height - height) / 2;
    return { width, height, x: offsetX, y: offsetY };
  }, [image, stageSize.height, stageSize.width]);

  return (
    <div className="relative h-full min-h-[200px] w-full">
      <div ref={containerRef} className="relative h-full min-h-[200px] w-full overflow-hidden rounded-[12px]">
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          ref={stageRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={finishStroke}
          onMouseLeave={finishStroke}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={finishStroke}
        >
          <Layer>
            {image && scaledImageProps && <KonvaImage image={image} {...scaledImageProps} />}
            {maskPreviewImage && scaledImageProps && (
              <KonvaImage image={maskPreviewImage} {...scaledImageProps} opacity={0.45} />
            )}
            {points.length > 0 && (
              <Line
                points={points}
                stroke="#7c3aed"
                strokeWidth={2}
                tension={0.4}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </Layer>
        </Stage>
      </div>
      {!image && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center font-['Cabin',sans-serif] text-[11px] text-[#8a849e]">
          Upload an image, then drag a lasso around the garment.
        </div>
      )}
    </div>
  );
}
