import { useCallback, useEffect, useRef, useState } from 'react';
import { DressRecolorLassoCanvas } from './DressRecolorLassoCanvas';
import {
  DRESS_RECOLOR_API_BASE,
  uploadImage,
  lassoSegmentation,
  type LassoPoint,
} from './dressRecolorApi';
import { b64ToUint8Mask, recolorGarmentOKLCH } from './oklchRecolor';

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
  const previewHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [historyVersion, setHistoryVersion] = useState(0);

  const canUndo = historyVersion >= 0 && historyIndexRef.current > 0;
  const canRedo =
    historyVersion >= 0 &&
    historyIndexRef.current >= 0 &&
    historyIndexRef.current < previewHistoryRef.current.length - 1;

  const pushHistory = useCallback((nextUrl: string) => {
    const current = previewHistoryRef.current[historyIndexRef.current] ?? null;
    if (current === nextUrl) {
      return;
    }
    const trimmed = previewHistoryRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push(nextUrl);
    previewHistoryRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
    setHistoryVersion((v) => v + 1);
  }, []);

  const undoPreview = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      return;
    }
    historyIndexRef.current -= 1;
    setRecolorPreviewUrl(previewHistoryRef.current[historyIndexRef.current] ?? null);
    setHistoryVersion((v) => v + 1);
  }, []);

  const redoPreview = useCallback(() => {
    if (historyIndexRef.current >= previewHistoryRef.current.length - 1) {
      return;
    }
    historyIndexRef.current += 1;
    setRecolorPreviewUrl(previewHistoryRef.current[historyIndexRef.current] ?? null);
    setHistoryVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (active) {
      return;
    }
    setImageId(null);
    setMaskPreview(null);
    setLastLassoPoints(null);
    setRecolorPreviewUrl(null);
    setWorkflowError(null);
    previewHistoryRef.current = [];
    historyIndexRef.current = -1;
    setHistoryVersion((v) => v + 1);
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
    previewHistoryRef.current = [];
    historyIndexRef.current = -1;
    setHistoryVersion((v) => v + 1);
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
          ? `Cannot reach ${DRESS_RECOLOR_API_BASE}. Start the dress recolor backend: cd "dress-recolor-backend" then npm run start. If needed, set VITE_DRESS_RECOLOR_API_URL in .env and restart Vite.`
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
    async (lassoPoints: LassoPoint[], selectedPaletteHex: string) => {
      if (!imageId || !lassoPoints || lassoPoints.length < 3) {
        return;
      }
      const requestId = ++recolorRequestIdRef.current;
      setIsProcessing(true);
      try {
        const res = await lassoSegmentation({
          imageId,
          lassoPoints,
          selectedColor: selectedPaletteHex,
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

        const { garment_mask_b64, height, width } = res;
        if (!garment_mask_b64 || height == null || width == null) {
          console.warn('Missing garment mask from backend response.');
          return;
        }
        if (height !== baseImageData.height || width !== baseImageData.width) {
          throw new Error(
            `Mask dimensions (${width}x${height}) do not match image dimensions (${baseImageData.width}x${baseImageData.height}).`,
          );
        }
        const maskArr = b64ToUint8Mask(garment_mask_b64);

        const result = recolorGarmentOKLCH(
          baseImageData.data,
          baseImageData.width,
          baseImageData.height,
          maskArr,
          selectedPaletteHex,
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
        pushHistory(url);
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
          ? ` Check that the API is running (${DRESS_RECOLOR_API_BASE}).`
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

  useEffect(() => {
    if (!active) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undoPreview();
        return;
      }
      if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        redoPreview();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [active, redoPreview, undoPreview]);

  const handleLassoComplete = useCallback(
    async (lassoPoints: LassoPoint[]) => {
      setLastLassoPoints(lassoPoints);
      await runRecolor(lassoPoints, garmentColor);
    },
    [garmentColor, runRecolor],
  );

  useEffect(() => {
    if (!lastLassoPoints || !imageId) {
      return;
    }
    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
    }
    colorDebounceRef.current = setTimeout(() => {
      void runRecolor(lastLassoPoints, garmentColor);
      colorDebounceRef.current = null;
    }, 400);
    return () => {
      if (colorDebounceRef.current) {
        clearTimeout(colorDebounceRef.current);
      }
    };
    // Intentionally omit lastLassoPoints: only re-run when panel color or API id changes, matching ai model app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentColor, imageId, runRecolor]);

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
        <div className="mb-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={undoPreview}
            disabled={!canUndo}
            className="rounded-full border border-[rgba(158,106,255,0.45)] bg-white px-3 py-1 text-[10px] font-['Cabin:Semibold',sans-serif] text-[#6e5a9a] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redoPreview}
            disabled={!canRedo}
            className="rounded-full border border-[rgba(158,106,255,0.45)] bg-white px-3 py-1 text-[10px] font-['Cabin:Semibold',sans-serif] text-[#6e5a9a] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Redo
          </button>
        </div>
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
