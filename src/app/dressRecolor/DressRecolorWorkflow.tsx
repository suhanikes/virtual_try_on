import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DressRecolorLassoCanvas } from './DressRecolorLassoCanvas';
import { DRESS_RECOLOR_API_BASE, uploadImage, lassoSegmentation, type LassoPoint } from './dressRecolorApi';
import { recolorGarmentOKLCH, rgbToOKLCH, rgbToHex, oklchToRGB, type OKLCH } from './oklchRecolor';

function parseHexToRgb(color: string): { r: number; g: number; b: number } {
  const s = color.trim();
  if (!s.startsWith('#')) {
    return { r: 160, g: 153, b: 152 };
  }
  const h = s.slice(1);
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) {
    return { r: 160, g: 153, b: 152 };
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

type Props = {
  active: boolean;
  sourceFile: File | null;
  sourceObjectUrl: string | null;
  garmentColor: string;
};

export function DressRecolorWorkflow({
  active,
  sourceFile,
  sourceObjectUrl,
  garmentColor,
}: Props) {
  const [imageId, setImageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [maskPreview, setMaskPreview] = useState<string | null>(null);
  const [lastLassoPoints, setLastLassoPoints] = useState<LassoPoint[] | null>(null);
  const [recolorPreviewUrl, setRecolorPreviewUrl] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recolorRequestIdRef = useRef(0);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageDataRef = useRef<ImageData | null>(null);
  const uploadSeqRef = useRef(0);

  const targetOKLCH = useMemo<OKLCH>(() => rgbToOKLCH(parseHexToRgb(garmentColor)), [garmentColor]);

  useEffect(() => {
    if (active) {
      return;
    }
    setImageId(null);
    setMaskPreview(null);
    setLastLassoPoints(null);
    setRecolorPreviewUrl(null);
    setWorkflowError(null);
    baseImageDataRef.current = null;
    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
      colorDebounceRef.current = null;
    }
  }, [active]);

  useEffect(() => {
    if (!active || !sourceFile || !sourceObjectUrl) {
      return;
    }

    const seq = ++uploadSeqRef.current;
    setImageId(null);
    setRecolorPreviewUrl(null);
    setLastLassoPoints(null);
    setMaskPreview(null);
    baseImageDataRef.current = null;
    setWorkflowError(null);

    setIsUploading(true);
    void uploadImage(sourceFile)
      .then((data) => {
        if (seq !== uploadSeqRef.current) {
          return;
        }
        setWorkflowError(null);
        setImageId(data.imageId);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (seq !== uploadSeqRef.current) {
            return;
          }
          const canvas = baseCanvasRef.current;
          if (!canvas) {
            return;
          }
          canvas.width = data.width;
          canvas.height = data.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return;
          }
          ctx.drawImage(img, 0, 0, data.width, data.height);
          baseImageDataRef.current = ctx.getImageData(0, 0, data.width, data.height);
        };
        img.src = sourceObjectUrl;
      })
      .catch((err: unknown) => {
        if (seq !== uploadSeqRef.current) {
          return;
        }
        console.error(err);
        const ax = err as {
          code?: string;
          response?: { data?: { error?: string; details?: string } };
          message?: string;
        };
        const isNetwork =
          ax.code === 'ERR_NETWORK' ||
          (typeof ax.message === 'string' && ax.message.toLowerCase().includes('network'));
        const detail =
          ax.response?.data?.error ?? ax.response?.data?.details ?? ax.message ?? 'Upload failed';
        const hint = isNetwork
          ? `Cannot reach ${DRESS_RECOLOR_API_BASE}. Start the dress recolor backend: cd "dress-recolor-backend" then npm run start. Also start the ML service on port 8000. Or set VITE_DRESS_RECOLOR_API_URL in .env and restart Vite.`
          : '';
        setWorkflowError(hint ? `${detail}. ${hint}` : detail);
        setImageId(null);
      })
      .finally(() => {
        if (seq === uploadSeqRef.current) {
          setIsUploading(false);
        }
      });
  }, [active, sourceFile, sourceObjectUrl]);

  const runRecolor = useCallback(
    async (lassoPoints: LassoPoint[], lch: OKLCH) => {
      if (!imageId || !lassoPoints || lassoPoints.length < 3) {
        return;
      }
      const requestId = ++recolorRequestIdRef.current;
      setIsProcessing(true);
      try {
        const res = await lassoSegmentation({
          imageId,
          lassoPoints,
          selectedColor: rgbToHex(oklchToRGB(lch)),
        });
        if (requestId !== recolorRequestIdRef.current) {
          return;
        }
        if (res.mask_preview) {
          setMaskPreview(res.mask_preview);
        }

        const baseImageData = baseImageDataRef.current;
        if (!baseImageData) {
          console.warn('No base image data available for recolor.');
          return;
        }

        const b64ToUint8 = (b64: string) => {
          const binary = atob(b64);
          const len = binary.length;
          const arr = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            arr[i] = binary.charCodeAt(i);
          }
          return arr;
        };

        const { garment_mask_b64, height, width } = res;
        if (!garment_mask_b64 || height == null || width == null) {
          console.warn('Missing garment mask from backend response.');
          return;
        }
        const maskArr = b64ToUint8(garment_mask_b64);

        const result = recolorGarmentOKLCH(
          baseImageData.data,
          baseImageData.width,
          baseImageData.height,
          maskArr,
          lch,
        );

        const canvas = baseCanvasRef.current;
        if (!canvas) {
          return;
        }
        canvas.width = result.width;
        canvas.height = result.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return;
        }
        const outImageData = new ImageData(result.data, result.width, result.height);
        ctx.putImageData(outImageData, 0, 0);
        const url = canvas.toDataURL('image/png');
        setRecolorPreviewUrl(url);
        setWorkflowError(null);
      } catch (err: unknown) {
        if (requestId !== recolorRequestIdRef.current) {
          return;
        }
        console.error(err);
        const ax = err as {
          code?: string;
          response?: { status?: number; data?: { error?: string; details?: string } };
        };
        const msg = ax.response?.data?.error ?? (err instanceof Error ? err.message : 'Recolor failed.');
        const details = ax.response?.data?.details;
        const isNetwork =
          ax.code === 'ERR_NETWORK' ||
          (err instanceof Error && err.message.toLowerCase().includes('network'));
        const extra = isNetwork
          ? ` Check that the API is running (${DRESS_RECOLOR_API_BASE}) and the ML service is on port 8000.`
          : '';
        setWorkflowError(details ? `${msg} — ${details}${extra}` : `${msg}${extra}`);
      } finally {
        if (requestId === recolorRequestIdRef.current) {
          setIsProcessing(false);
        }
      }
    },
    [imageId],
  );

  const handleLassoComplete = useCallback(
    async (lassoPoints: LassoPoint[]) => {
      setLastLassoPoints(lassoPoints);
      await runRecolor(lassoPoints, targetOKLCH);
    },
    [runRecolor, targetOKLCH],
  );

  useEffect(() => {
    if (!lastLassoPoints || !imageId) {
      return;
    }
    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
    }
    colorDebounceRef.current = setTimeout(() => {
      void runRecolor(lastLassoPoints, targetOKLCH);
      colorDebounceRef.current = null;
    }, 400);
    return () => {
      if (colorDebounceRef.current) {
        clearTimeout(colorDebounceRef.current);
      }
    };
    // Intentionally omit lastLassoPoints: only re-run when panel color (targetOKLCH) or API id changes, matching ai model app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentColor, imageId, runRecolor, targetOKLCH]);

  const displayUrl = recolorPreviewUrl ?? sourceObjectUrl;

  return (
    <div className="absolute inset-0 z-[8] flex flex-col bg-[#faf9fc]">
      <canvas ref={baseCanvasRef} className="hidden" aria-hidden />
      <div className="min-h-0 flex-1 overflow-hidden rounded-[12px] border border-[rgba(158,106,255,0.2)] bg-[#f4f1fc]">
        <DressRecolorLassoCanvas
          imageUrl={displayUrl}
          onLassoComplete={handleLassoComplete}
          maskPreview={maskPreview}
          isProcessing={isProcessing}
        />
      </div>
      <div className="shrink-0 px-1 pt-2">
        {isUploading && (
          <p className="text-center font-['Cabin:Semibold',sans-serif] text-[10px] text-[#6e5a9a]">
            Uploading…
          </p>
        )}
        {isProcessing && !isUploading && (
          <p className="text-center font-['Cabin:Semibold',sans-serif] text-[10px] text-[#6e5a9a]">
            Recoloring…
          </p>
        )}
        {!sourceObjectUrl && (
          <p className="text-center font-['Cabin',sans-serif] text-[10px] leading-snug text-[#8a849e]">
            Upload an image, lasso the dress, then pick a shade in the palette on the right.
          </p>
        )}
        {workflowError && (
          <p
            role="alert"
            className="text-center font-['Cabin',sans-serif] text-[10px] leading-snug text-[#b45309]"
          >
            {workflowError}
          </p>
        )}
      </div>
    </div>
  );
}
