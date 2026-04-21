import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, MouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { garmentStyles } from '../config/garmentStyles';
import type { FabricOption } from '../types/fabric';
import { lassoSegmentation, uploadImage } from '../dressRecolor/dressRecolorApi';
import { b64ToUint8Mask, recolorGarmentOKLCH } from '../dressRecolor/oklchRecolor';
import { ensureMeshUv2ForAoMap } from '../utils/ensureMeshUv2';

type Point = {
  x: number;
  y: number;
};

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type UploadedImage = {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
};

type InternalState = {
  glbBuffer: ArrayBuffer | null;
  imgScale: number;
  imgRotation: number;
  imgOffsetX: number;
  imgOffsetY: number;
  /** Extra pan after Apply Garment (CSS px). */
  userPanX: number;
  userPanY: number;
  /** Multiplier on imgScale from wheel zoom. */
  userZoomMul: number;
  fitScale: number;
  fitShift: number;
  fitOpacity: number;
  modelShoulders: Point[];
};

interface TryOnPreviewCardProps {
  selectedGarmentId: string;
  garmentColor?: string;
  onGarmentColorChange?: (color: string) => void;
  selectedFabric?: FabricOption;
  isColorLiked?: boolean;
  onToggleColorLike?: () => void;
  dressRecoloringMode: boolean;
  onDressRecoloringModeChange: (next: boolean) => void;
  onFabricOverlayAppliedChange?: (applied: boolean) => void;
  onUploadedImageChange?: (imageSrc: string | null) => void;
}

const FRAME_W = 300;
const FRAME_H = 400;
const DEFAULT_RECOLOR_COLOR = '#00af9d';

type GarmentTypeOption = {
  value: string;
  label: string;
};

const GARMENT_TYPE_OPTIONS: GarmentTypeOption[] = [
  { value: 'upper-clothes', label: 'Upper Cloth / T-shirt' },
  { value: 'dress', label: 'Dress' },
  { value: 'coat', label: 'Coat / Jacket' },
  { value: 'sweater', label: 'Sweater / Hoodie' },
  { value: 'pants', label: 'Pants / Bottoms' },
  { value: 'skirt', label: 'Skirt' },
];

function suggestGarmentType(styleId: string | undefined): string {
  const id = (styleId ?? '').toLowerCase();
  if (id.includes('dress')) return 'dress';
  if (id.includes('jacket') || id.includes('coat') || id.includes('blazer')) return 'coat';
  if (id.includes('hoodie') || id.includes('sweater') || id.includes('knit')) return 'sweater';
  if (id.includes('pant') || id.includes('trouser') || id.includes('jean')) return 'pants';
  if (id.includes('skirt')) return 'skirt';
  return 'upper-clothes';
}
/** Internal GLB render resolution; higher = cleaner downscale onto FRAME_W×FRAME_H (reduces moiré on detailed models). */
const GARMENT_RENDER_PX = 1200;
const FABRIC_MESH_HINTS = [
  'fabric',
  'cloth',
  'garment',
  'shirt',
  'dress',
  'jacket',
  'top',
  'body',
  'mesh',
  'main',
  'torso',
  'panel',
  'geo',
];
const FABRIC_MESH_EXCLUDE = ['button', 'zip', 'zipper', 'buckle', 'snap', 'rivet', 'metal', 'hardware', 'logo', 'tag', 'eyelet', 'chain', 'trim_detail'];
const FABRIC_CACHE_LIMIT = 2;

type FabricTextureSet = {
  colorMap: THREE.Texture | null;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  displacementMap: THREE.Texture;
  aoMap: THREE.Texture | null;
};

const fabricTextureCache = new Map<string, FabricTextureSet>();

function isFabricMesh(mesh: THREE.Mesh): boolean {
  const meshName = (mesh.name ?? '').toLowerCase();
  const materialNames = (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
    .map((material) => {
      const withName = material as THREE.Material & { name?: string };
      return withName.name?.toLowerCase?.() ?? '';
    })
    .join(' ');

  const combined = `${meshName} ${materialNames}`;
  if (FABRIC_MESH_EXCLUDE.some((ex) => combined.includes(ex))) {
    return false;
  }

  const hasUv = Boolean(mesh.geometry?.attributes?.uv);
  if (FABRIC_MESH_HINTS.some((hint) => meshName.includes(hint) || materialNames.includes(hint))) {
    return hasUv;
  }

  return hasUv;
}

function configureTexture(texture: THREE.Texture, repeat: [number, number], isColorTexture = false) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);

  if (isColorTexture && 'colorSpace' in texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  texture.needsUpdate = true;
}

function applyRepeat(textureSet: FabricTextureSet, repeat: [number, number]) {
  textureSet.colorMap?.repeat.set(repeat[0], repeat[1]);
  textureSet.normalMap.repeat.set(repeat[0], repeat[1]);
  textureSet.roughnessMap.repeat.set(repeat[0], repeat[1]);
  textureSet.displacementMap.repeat.set(repeat[0], repeat[1]);
  textureSet.aoMap?.repeat.set(repeat[0], repeat[1]);
}

function disposeTextureSet(textureSet: FabricTextureSet) {
  textureSet.colorMap?.dispose();
  textureSet.normalMap.dispose();
  textureSet.roughnessMap.dispose();
  textureSet.displacementMap.dispose();
  textureSet.aoMap?.dispose();
}

async function loadTexture(
  loader: THREE.TextureLoader,
  url: string,
  repeat: [number, number],
  isColorTexture = false,
  optional = false,
): Promise<THREE.Texture | null> {
  const candidates = [url];
  if (url.includes('_1K-JPG_')) {
    candidates.push(url.replace('_1K-JPG_', '_2K-JPG_'));
  } else if (url.includes('_2K-JPG_')) {
    candidates.push(url.replace('_2K-JPG_', '_1K-JPG_'));
  }

  const uniqueCandidates = Array.from(new Set(candidates));
  let lastError: unknown = null;

  for (const candidateUrl of uniqueCandidates) {
    try {
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          candidateUrl,
          (loadedTexture) => {
            configureTexture(loadedTexture, repeat, isColorTexture);
            resolve(loadedTexture);
          },
          undefined,
          reject,
        );
      });

      return texture;
    } catch (error) {
      lastError = error;
    }
  }

  if (optional) {
    return null;
  }

  throw lastError;
}

async function loadFabricTextureSet(fabric: FabricOption): Promise<FabricTextureSet> {
  const loader = new THREE.TextureLoader();
  const [colorMap, normalMap, roughnessMap, displacementMap, aoMap] = await Promise.all([
    fabric.maps.colorMapUrl
      ? loadTexture(loader, fabric.maps.colorMapUrl, fabric.repeat, true, true)
      : Promise.resolve(null),
    loadTexture(loader, fabric.maps.normalMapUrl, fabric.repeat),
    loadTexture(loader, fabric.maps.roughnessMapUrl, fabric.repeat),
    loadTexture(loader, fabric.maps.displacementMapUrl, fabric.repeat),
    fabric.maps.aoMapUrl
      ? loadTexture(loader, fabric.maps.aoMapUrl, fabric.repeat, false, true)
      : Promise.resolve(null),
  ]);

  return {
    colorMap,
    normalMap: normalMap as THREE.Texture,
    roughnessMap: roughnessMap as THREE.Texture,
    displacementMap: displacementMap as THREE.Texture,
    aoMap,
  };
}

async function getOrLoadFabricTextureSet(fabric: FabricOption): Promise<FabricTextureSet | null> {
  const cached = fabricTextureCache.get(fabric.id);
  if (cached) {
    applyRepeat(cached, fabric.repeat);
    fabricTextureCache.delete(fabric.id);
    fabricTextureCache.set(fabric.id, cached);
    return cached;
  }

  try {
    const loaded = await loadFabricTextureSet(fabric);
    fabricTextureCache.set(fabric.id, loaded);

    while (fabricTextureCache.size > FABRIC_CACHE_LIMIT) {
      const lruKey = fabricTextureCache.keys().next().value as string;
      const lruTextureSet = fabricTextureCache.get(lruKey);
      if (lruTextureSet) {
        disposeTextureSet(lruTextureSet);
      }
      fabricTextureCache.delete(lruKey);
    }

    return loaded;
  } catch (error) {
    console.error(`[TryOnPreviewCard] Failed to load texture set for ${fabric.label}.`, error);
    return null;
  }
}

function countTriangles(meshes: THREE.Mesh[]) {
  return meshes.reduce((sum, mesh) => {
    const geometry = mesh.geometry;
    if (!geometry) {
      return sum;
    }

    if (geometry.index) {
      return sum + geometry.index.count / 3;
    }

    return sum + ((geometry.attributes.position?.count ?? 0) / 3);
  }, 0);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type ContainedImageMetrics = {
  offsetX: number;
  offsetY: number;
  dispW: number;
  dispH: number;
};

function getContainedImageMetrics(img: HTMLImageElement): ContainedImageMetrics {
  const cw = img.clientWidth;
  const ch = img.clientHeight;
  const nw = Math.max(img.naturalWidth, 1);
  const nh = Math.max(img.naturalHeight, 1);
  const scale = Math.min(cw / nw, ch / nh);
  const dispW = nw * scale;
  const dispH = nh * scale;
  return {
    offsetX: (cw - dispW) / 2,
    offsetY: (ch - dispH) / 2,
    dispW,
    dispH,
  };
}

/**
 * Maps a viewport point to natural image pixels.
 * Ancestors may use CSS transform: scale() (e.g. App layout). getBoundingClientRect is then in
 * scaled viewport pixels while clientWidth/Height stay in layout pixels — mix them and clicks drift.
 */
function clientToNaturalPoint(clientX: number, clientY: number, img: HTMLImageElement): Point {
  const rect = img.getBoundingClientRect();
  const cw = img.clientWidth;
  const ch = img.clientHeight;
  const sx = cw / Math.max(rect.width, 1e-6);
  const sy = ch / Math.max(rect.height, 1e-6);
  const lx = (clientX - rect.left) * sx;
  const ly = (clientY - rect.top) * sy;

  const m = getContainedImageMetrics(img);
  const cx = clamp(lx - m.offsetX, 0, Math.max(m.dispW, 1e-6));
  const cy = clamp(ly - m.offsetY, 0, Math.max(m.dispH, 1e-6));
  const nw = Math.max(img.naturalWidth, 1);
  const nh = Math.max(img.naturalHeight, 1);
  return {
    x: (cx / Math.max(m.dispW, 1e-6)) * nw,
    y: (cy / Math.max(m.dispH, 1e-6)) * nh,
  };
}

function naturalPointToElementLocal(n: Point, img: HTMLImageElement): Point {
  const m = getContainedImageMetrics(img);
  const nw = Math.max(img.naturalWidth, 1);
  const nh = Math.max(img.naturalHeight, 1);
  return {
    x: m.offsetX + (n.x / nw) * m.dispW,
    y: m.offsetY + (n.y / nh) * m.dispH,
  };
}

function naturalRectToOverlayStyle(
  r: CropRect,
  img: HTMLImageElement,
): { left: number; top: number; width: number; height: number } {
  const tl = naturalPointToElementLocal({ x: r.x, y: r.y }, img);
  const br = naturalPointToElementLocal({ x: r.x + r.width, y: r.y + r.height }, img);
  return {
    left: tl.x,
    top: tl.y,
    width: Math.max(0, br.x - tl.x),
    height: Math.max(0, br.y - tl.y),
  };
}

function autoCropPortraitShoulderFocus(img: HTMLImageElement): UploadedImage {
  const targetAspect = FRAME_W / FRAME_H;
  const nw = Math.max(img.naturalWidth, 1);
  const nh = Math.max(img.naturalHeight, 1);

  let cropW: number;
  let cropH: number;
  if (nw / nh > targetAspect) {
    cropH = nh;
    cropW = cropH * targetAspect;
  } else {
    cropW = nw;
    cropH = cropW / targetAspect;
  }

  // Shoulder-focused portrait crop: keep aspect ratio, zoom in moderately, bias upward a bit.
  const shoulderScale = 0.86;
  cropW = Math.max(1, Math.round(cropW * shoulderScale));
  cropH = Math.max(1, Math.round(cropH * shoulderScale));

  const centerX = nw * 0.5;
  const centerY = nh * 0.44;
  const cropX = clamp(Math.round(centerX - cropW * 0.5), 0, Math.max(0, nw - cropW));
  const cropY = clamp(Math.round(centerY - cropH * 0.5), 0, Math.max(0, nh - cropH));

  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    };
  }

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return {
    src: canvas.toDataURL('image/png'),
    naturalWidth: cropW,
    naturalHeight: cropH,
  };
}

function detectAlphaBounds(canvas: HTMLCanvasElement): { x: number; y: number; width: number; height: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const { width, height } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (pixels[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function naturalCropRectFromCorners(a: Point, b: Point, nw: number, nh: number): CropRect {
  const x0 = clamp(Math.min(a.x, b.x), 0, nw);
  const y0 = clamp(Math.min(a.y, b.y), 0, nh);
  const x1 = clamp(Math.max(a.x, b.x), 0, nw);
  const y1 = clamp(Math.max(a.y, b.y), 0, nh);
  return {
    x: x0,
    y: y0,
    width: Math.max(0, x1 - x0),
    height: Math.max(0, y1 - y0),
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image data'));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta?.match(/data:(.*?);base64/)?.[1] ?? 'image/png';
  const bin = atob(b64 ?? '');
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return new File([arr], fileName, { type: mime });
}

function estimateShouldersFromGarmentCanvas(canvas: HTMLCanvasElement): Point[] | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  const w = canvas.width;
  const h = canvas.height;
  if (w < 8 || h < 8) {
    return null;
  }

  const pixels = ctx.getImageData(0, 0, w, h).data;
  const alphaAt = (x: number, y: number) => pixels[(y * w + x) * 4 + 3];

  let minY = h;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alphaAt(x, y) > 12) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minY >= maxY) {
    return null;
  }

  const scanY = Math.max(minY, Math.min(maxY, Math.round(minY + (maxY - minY) * 0.2)));
  let left = -1;
  let right = -1;
  for (let x = 0; x < w; x++) {
    if (alphaAt(x, scanY) > 12) {
      left = x;
      break;
    }
  }
  for (let x = w - 1; x >= 0; x--) {
    if (alphaAt(x, scanY) > 12) {
      right = x;
      break;
    }
  }

  if (left < 0 || right < 0 || right - left < 20) {
    return null;
  }

  return [
    { x: left + 6, y: scanY + 2 },
    { x: right - 6, y: scanY + 2 },
  ];
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error('Failed to load image dimensions'));
    img.src = src;
  });
}

function solveSimilarityFromSegments(u1: Point, u2: Point, m1: Point, m2: Point) {
  const ux = u2.x - u1.x;
  const uy = u2.y - u1.y;
  const mx = m2.x - m1.x;
  const my = m2.y - m1.y;

  const lenU = Math.hypot(ux, uy);
  const lenM = Math.hypot(mx, my);
  if (lenU < 3 || lenM < 3) {
    return null;
  }

  const theta = Math.atan2(my, mx) - Math.atan2(uy, ux);
  const scale = lenM / lenU;
  const c = Math.cos(theta);
  const s = Math.sin(theta);

  const ru1 = {
    x: scale * (c * u1.x - s * u1.y),
    y: scale * (s * u1.x + c * u1.y),
  };
  const ru2 = {
    x: scale * (c * u2.x - s * u2.y),
    y: scale * (s * u2.x + c * u2.y),
  };

  const tx = ((m1.x - ru1.x) + (m2.x - ru2.x)) * 0.5;
  const ty = ((m1.y - ru1.y) + (m2.y - ru2.y)) * 0.5;

  return { theta, scale, tx, ty };
}

function ShoulderMarkers({ points, lineColor }: { points: Point[]; lineColor: string }) {
  const lineLength = points.length === 2
    ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
    : 0;
  const lineAngle = points.length === 2
    ? Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x)
    : 0;

  return (
    <>
      {points.length === 2 && (
        <div
          className="pointer-events-none absolute z-30 h-0 border-t-2 border-dashed"
          style={{
            left: points[0].x,
            top: points[0].y,
            width: lineLength,
            borderColor: lineColor,
            transform: `translateY(-50%) rotate(${lineAngle}rad)`,
            transformOrigin: '0 50%',
          }}
        />
      )}
      {points.map((point, index) => (
        <div
          key={`${point.x}-${point.y}-${index}`}
          className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2"
          style={{ left: point.x, top: point.y }}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#9e6aff] text-[10px] font-bold text-white shadow">
            {index === 0 ? 'L' : 'R'}
          </div>
        </div>
      ))}
    </>
  );
}

export function TryOnPreviewCard({
  selectedGarmentId,
  garmentColor,
  selectedFabric,
  isColorLiked = false,
  onToggleColorLike,
  dressRecoloringMode,
  onDressRecoloringModeChange,
  onFabricOverlayAppliedChange,
  onUploadedImageChange,
}: TryOnPreviewCardProps) {
  const selectedStyle = useMemo(
    () => garmentStyles.find((style) => style.id === selectedGarmentId) ?? garmentStyles[0],
    [selectedGarmentId],
  );

  const frameRef = useRef<HTMLDivElement>(null);
  const personImgRef = useRef<HTMLImageElement>(null);
  const garmentCanvasRef = useRef<HTMLCanvasElement>(null);
  const pickCanvasRef = useRef<HTMLCanvasElement>(null);
  const markerImageRef = useRef<HTMLImageElement>(null);
  const recolorImageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropDragStartNaturalRef = useRef<Point | null>(null);
  const cropPointerDownRef = useRef(false);
  const tryOnInteractRef = useRef<HTMLDivElement>(null);
  const tryOnDraggingRef = useRef(false);
  const tryOnLastRef = useRef({ x: 0, y: 0 });

  const stateRef = useRef<InternalState>({
    glbBuffer: null,
    imgScale: 1,
    imgRotation: 0,
    imgOffsetX: 0,
    imgOffsetY: 0,
    userPanX: 0,
    userPanY: 0,
    userZoomMul: 1,
    fitScale: 100,
    fitShift: 0,
    fitOpacity: 100,
    modelShoulders: [],
  });
  const garmentColorRef = useRef(garmentColor ?? '#a09998');
  const selectedFabricRef = useRef<FabricOption | undefined>(selectedFabric);

  const [hasGarmentShoulders, setHasGarmentShoulders] = useState(false);
  const [hasUserImage, setHasUserImage] = useState(false);

  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [baseUploadedImage, setBaseUploadedImage] = useState<UploadedImage | null>(null);
  const [hasFabricOnlyCrop, setHasFabricOnlyCrop] = useState(false);
  const [userNaturalPoints, setUserNaturalPoints] = useState<Point[]>([]);
  const [isMarkingUserShoulders, setIsMarkingUserShoulders] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropRectNatural, setCropRectNatural] = useState<CropRect | null>(null);
  const [isSelectingRecolorArea, setIsSelectingRecolorArea] = useState(false);
  const [recolorRectNatural, setRecolorRectNatural] = useState<CropRect | null>(null);
  const [selectedGarmentType, setSelectedGarmentType] = useState<string>(() => suggestGarmentType(selectedGarmentId));
  const [recolorMaskPreview, setRecolorMaskPreview] = useState<string | null>(null);
  const [hasAppliedRecolorOnce, setHasAppliedRecolorOnce] = useState(false);
  const [isRecoloring, setIsRecoloring] = useState(false);
  const [isMoveEnabled, setIsMoveEnabled] = useState(true);
  const [isFabricOverlayApplied, setIsFabricOverlayApplied] = useState(false);
  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [layoutTick, setLayoutTick] = useState(0);
  const [shoulderOverlayPoints, setShoulderOverlayPoints] = useState<Point[]>([]);
  const [canLoadDefaultModel, setCanLoadDefaultModel] = useState(false);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const recolorCacheRef = useRef<{
    baseData: Uint8ClampedArray;
    mask: Uint8Array;
    width: number;
    height: number;
  } | null>(null);
  const lastAppliedRecolorHexRef = useRef<string | null>(null);

  const setFabricOverlayApplied = useCallback((next: boolean) => {
    setIsFabricOverlayApplied(next);
    onFabricOverlayAppliedChange?.(next);
  }, [onFabricOverlayAppliedChange]);

  useEffect(() => {
    onUploadedImageChange?.(uploadedImage?.src ?? null);
  }, [onUploadedImageChange, uploadedImage?.src]);

  useEffect(() => {
    if (canLoadDefaultModel || typeof window === 'undefined') {
      return;
    }

    const enableModelLoading = () => {
      setCanLoadDefaultModel(true);
      window.removeEventListener('pointerdown', enableModelLoading);
      window.removeEventListener('keydown', enableModelLoading);
      window.removeEventListener('touchstart', enableModelLoading);
    };

    window.addEventListener('pointerdown', enableModelLoading, { passive: true, once: true });
    window.addEventListener('keydown', enableModelLoading, { once: true });
    window.addEventListener('touchstart', enableModelLoading, { passive: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', enableModelLoading);
      window.removeEventListener('keydown', enableModelLoading);
      window.removeEventListener('touchstart', enableModelLoading);
    };
  }, []);

  useEffect(() => {
    setSelectedGarmentType(suggestGarmentType(selectedGarmentId));
  }, [selectedGarmentId]);

  useEffect(() => {
    if (dressRecoloringMode && hasFabricOnlyCrop && baseUploadedImage) {
      // Fabric crop is mode-local; AI recolor should always start from the uncropped source image.
      setUploadedImage(baseUploadedImage);
      setHasFabricOnlyCrop(false);
      recolorCacheRef.current = null;
      lastAppliedRecolorHexRef.current = null;
      setHasAppliedRecolorOnce(false);
      setRecolorMaskPreview(null);
    }

    setIsCropMode(false);
    setIsSelectingRecolorArea(false);
    setIsMarkingUserShoulders(false);
    setUserNaturalPoints([]);
    setHasUserImage(false);
    setIsMoveEnabled(true);
    setFabricOverlayApplied(false);

    const personImg = personImgRef.current;
    if (personImg) {
      personImg.style.display = 'none';
    }
  }, [dressRecoloringMode]);

  useLayoutEffect(() => {
    const img = markerImageRef.current;
    if (
      !isMarkingUserShoulders ||
      !img ||
      userNaturalPoints.length === 0 ||
      img.naturalWidth < 1
    ) {
      setShoulderOverlayPoints([]);
      return;
    }

    setShoulderOverlayPoints(userNaturalPoints.map((n) => naturalPointToElementLocal(n, img)));
  }, [userNaturalPoints, layoutTick, uploadedImage?.src, isMarkingUserShoulders]);

  const cropOverlayStyle = useMemo(() => {
    const img = markerImageRef.current;
    if (!cropRectNatural || !img || img.naturalWidth < 1) {
      return null;
    }

    return naturalRectToOverlayStyle(cropRectNatural, img);
  }, [cropRectNatural, layoutTick, uploadedImage?.src]);

  const applyImageTransform = useCallback(() => {
    const personImg = personImgRef.current;
    if (!personImg) {
      return;
    }

    const state = stateRef.current;
    const tx = state.imgOffsetX + state.userPanX;
    const ty = state.imgOffsetY + state.userPanY;
    const sc = state.imgScale * state.userZoomMul;
    personImg.style.transform =
      'translate(' + tx + 'px, ' + ty + 'px) ' +
      'rotate(' + state.imgRotation + 'rad) ' +
      'scale(' + sc + ')';
  }, []);

  const applyAnchoredZoom = useCallback((nextZoomMul: number) => {
    const st = stateRef.current;
    const clampedNext = clamp(nextZoomMul, 0.2, 5);
    if (Math.abs(clampedNext - st.userZoomMul) < 1e-6) {
      return;
    }

    // Keep image center fixed while zooming so position does not appear to shift.
    const img = personImgRef.current;
    const centerX = Math.max(img?.naturalWidth ?? 0, 1) * 0.5;
    const centerY = Math.max(img?.naturalHeight ?? 0, 1) * 0.5;

    const oldScale = st.imgScale * st.userZoomMul;
    const newScale = st.imgScale * clampedNext;
    const deltaScale = oldScale - newScale;
    const cosT = Math.cos(st.imgRotation);
    const sinT = Math.sin(st.imgRotation);

    st.userPanX += deltaScale * (centerX * cosT - centerY * sinT);
    st.userPanY += deltaScale * (centerX * sinT + centerY * cosT);
    st.userZoomMul = clampedNext;
    applyImageTransform();
  }, [applyImageTransform]);

  const handleTryOnPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) {
      return;
    }

    tryOnDraggingRef.current = true;
    tryOnLastRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleTryOnPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!tryOnDraggingRef.current) {
        return;
      }

      const dx = e.clientX - tryOnLastRef.current.x;
      const dy = e.clientY - tryOnLastRef.current.y;
      tryOnLastRef.current = { x: e.clientX, y: e.clientY };
      const el = tryOnInteractRef.current;
      const rect = el?.getBoundingClientRect();
      const sx = el && rect ? el.clientWidth / Math.max(rect.width, 1e-6) : 1;
      const sy = el && rect ? el.clientHeight / Math.max(rect.height, 1e-6) : 1;
      const st = stateRef.current;
      st.userPanX += dx * sx;
      st.userPanY += dy * sy;
      applyImageTransform();
    },
    [applyImageTransform],
  );

  const handleTryOnPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    tryOnDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Not capturing
    }
  }, []);

  useEffect(() => {
    const el = tryOnInteractRef.current;
    if (!el || !hasUserImage || dressRecoloringMode || !isFabricOverlayApplied || !isMoveEnabled) {
      return;
    }

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const st = stateRef.current;
      const next = st.userZoomMul * Math.exp(-ev.deltaY * 0.0012);
      applyAnchoredZoom(next);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [hasUserImage, dressRecoloringMode, isFabricOverlayApplied, isMoveEnabled, applyAnchoredZoom]);

  /** Maps viewport click to internal try-on frame coords (FRAME_W × FRAME_H), accounting for CSS scale on ancestors. */
  const clientToFramePoint = useCallback((clientX: number, clientY: number) => {
    const frame = frameRef.current;
    if (!frame) {
      return { x: 0, y: 0 };
    }

    const rect = frame.getBoundingClientRect();
    const cw = frame.clientWidth;
    const ch = frame.clientHeight;
    const vx = cw / Math.max(rect.width, 1e-6);
    const vy = ch / Math.max(rect.height, 1e-6);
    const lx = (clientX - rect.left) * vx;
    const ly = (clientY - rect.top) * vy;

    return {
      x: clamp((lx / Math.max(cw, 1e-6)) * FRAME_W, 0, FRAME_W),
      y: clamp((ly / Math.max(ch, 1e-6)) * FRAME_H, 0, FRAME_H),
    };
  }, []);

  const drawPickOverlay = useCallback((points: Point[], active: boolean) => {
    const pickCanvas = pickCanvasRef.current;
    if (!pickCanvas) {
      return;
    }

    const ctx = pickCanvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, FRAME_W, FRAME_H);
    if (!active) {
      return;
    }

    const colors = ['#63e39b', '#77b2ff'];
    const labels = ['L', 'R'];

    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.fill();

      ctx.fillStyle = colors[i];
      ctx.font = '700 11px sans-serif';
      ctx.fillText(labels[i], p.x + 12, p.y + 4);
    });

    if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.setLineDash([7, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, []);

  const renderGarment = useCallback((onDone?: () => void) => {
    const garmentCanvas = garmentCanvasRef.current;
    if (!garmentCanvas) {
      if (onDone) {
        onDone();
      }
      return;
    }

    const state = stateRef.current;
    if (!state.glbBuffer) {
      const clearCtx = garmentCanvas.getContext('2d');
      if (clearCtx) {
        clearCtx.clearRect(0, 0, FRAME_W, FRAME_H);
      }

      if (onDone) {
        onDone();
      }
      return;
    }

    const scaleMul = state.fitScale / 100;
    const shiftMul = state.fitShift / 100;
    const opacity = state.fitOpacity / 100;

    const off = document.createElement('canvas');
    off.width = GARMENT_RENDER_PX;
    off.height = GARMENT_RENDER_PX;

    const renderer = new THREE.WebGLRenderer({
      canvas: off,
      antialias: true,
      // Keep transparent background so garment can overlay user photo like Dressika.
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
    });

    renderer.setPixelRatio(1);
    renderer.setSize(GARMENT_RENDER_PX, GARMENT_RENDER_PX);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.86);
    d1.position.set(1, 1, 1.6);
    scene.add(d1);

    const d2 = new THREE.DirectionalLight(0xffffff, 0.3);
    d2.position.set(-1, -0.6, -1);
    scene.add(d2);

    const loader = new GLTFLoader();
    loader.parse(
      state.glbBuffer.slice(0),
      '',
      (gltf) => {
        const model = gltf.scene;
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);

        model.position.sub(center);
        model.scale.setScalar(1 / maxDim);
        model.rotation.x = -0.035;

        model.updateMatrixWorld(true);
        const normalizedBounds = new THREE.Box3().setFromObject(model);
        const targetBottom = -0.48;
        model.position.y += targetBottom - normalizedBounds.min.y;

        const applyMaterialsAndRender = async () => {
          let fallbackMaterial: THREE.MeshStandardMaterial | null = null;
          let fabricMaterial: THREE.MeshStandardMaterial | null = null;

          try {
            const tintColor = new THREE.Color(garmentColorRef.current || '#a09998');
            const activeFabric = selectedFabricRef.current;
            const allMeshes: THREE.Mesh[] = [];
            const namedFabricMeshes: THREE.Mesh[] = [];

            model.traverse((obj) => {
              const mesh = obj as THREE.Mesh;
              if (!mesh.isMesh) {
                return;
              }

              allMeshes.push(mesh);
              ensureMeshUv2ForAoMap(mesh);
              if (isFabricMesh(mesh)) {
                namedFabricMeshes.push(mesh);
              }
            });

            const fabricMeshes = namedFabricMeshes.length > 0 ? namedFabricMeshes : allMeshes;
            const fabricMeshSet = new Set(fabricMeshes);
            const textureSet = activeFabric ? await getOrLoadFabricTextureSet(activeFabric) : null;
            const lowPoly = countTriangles(fabricMeshes) < 10000;

            fabricMeshes.forEach((m) => ensureMeshUv2ForAoMap(m));
            const missingUv2 = fabricMeshes.some((m) => !m.geometry?.attributes?.uv2);
            const aoTex = missingUv2 ? null : textureSet?.aoMap ?? null;

            fallbackMaterial = new THREE.MeshStandardMaterial({
              color: tintColor,
              roughness: 0.42,
              metalness: 0.04,
              // DoubleSide + thin/quilted geometry causes z-fighting (static sparkle/noise); card shows front only.
              side: THREE.FrontSide,
              transparent: opacity < 1,
              opacity,
              polygonOffset: true,
              polygonOffsetFactor: 1,
              polygonOffsetUnits: 1,
            });

            if (activeFabric && textureSet) {
              fabricMaterial = new THREE.MeshStandardMaterial({
                map: textureSet.colorMap,
                normalMap: textureSet.normalMap,
                normalScale: new THREE.Vector2(1.5, 1.5),
                roughnessMap: textureSet.roughnessMap,
                roughness: 1.0,
                displacementMap: lowPoly ? null : textureSet.displacementMap,
                displacementScale: lowPoly ? 0 : 0.02,
                aoMap: aoTex,
                aoMapIntensity: aoTex ? 1.0 : 0,
                metalness: 0.05,
                color: tintColor,
                side: THREE.FrontSide,
                transparent: opacity < 1,
                opacity,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1,
              });
            }

            allMeshes.forEach((mesh) => {
              if (fabricMaterial && fabricMeshSet.has(mesh)) {
                mesh.material = fabricMaterial;
                return;
              }

              mesh.material = fallbackMaterial as THREE.MeshStandardMaterial;
            });

            scene.add(model);

            model.updateMatrixWorld(true);
            const fittedBounds = new THREE.Box3().setFromObject(model);
            const fittedCenter = fittedBounds.getCenter(new THREE.Vector3());
            const fittedSize = fittedBounds.getSize(new THREE.Vector3());

            const halfFov = (camera.fov * Math.PI) / 360;
            const fitHeight = Math.max(fittedSize.y * 1.08, 0.62);
            const fitWidth = Math.max(fittedSize.x * 1.12, 0.62);
            const camDistanceFromHeight = (fitHeight * 0.5) / Math.tan(halfFov);
            const camDistanceFromWidth = ((fitWidth * 0.5) / Math.tan(halfFov)) / Math.max(camera.aspect, 0.001);
            const camDistance = Math.max(camDistanceFromHeight, camDistanceFromWidth) + fittedSize.z * 0.75;
            const lookY = fittedCenter.y + fittedSize.y * 0.05;

            camera.position.set(fittedCenter.x, lookY + 0.01, camDistance);
            camera.lookAt(fittedCenter.x, lookY, fittedCenter.z);
            camera.updateProjectionMatrix();

            renderer.render(scene, camera);

            const ctx = garmentCanvas.getContext('2d');
            if (!ctx) {
              return;
            }

            ctx.clearRect(0, 0, FRAME_W, FRAME_H);

            const alphaBounds = detectAlphaBounds(off);
            const srcX = alphaBounds?.x ?? 0;
            const srcY = alphaBounds?.y ?? 0;
            const srcW = Math.max(alphaBounds?.width ?? off.width, 1);
            const srcH = Math.max(alphaBounds?.height ?? off.height, 1);

            // Keep top 70% of garment overlay (cut 30% from bottom).
            const keptSrcH = Math.max(1, Math.round(srcH * 0.7));

            // Fill card width and align overlay base to the bottom edge of the card.
            const dressikaLikeFillScale = 1.4;
            const drawW = FRAME_W * Math.max(scaleMul, 1) * dressikaLikeFillScale;
            const drawH = drawW * (keptSrcH / srcW);
            const drawX = (FRAME_W - drawW) * 0.5;
            const drawY = FRAME_H - drawH + shiftMul * FRAME_H;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(off, srcX, srcY, srcW, keptSrcH, drawX, drawY, drawW, drawH);

            const estimatedShoulders = estimateShouldersFromGarmentCanvas(garmentCanvas);
            if (estimatedShoulders && estimatedShoulders.length === 2) {
              stateRef.current.modelShoulders = estimatedShoulders;
              setHasGarmentShoulders(true);
            }
          } catch (error) {
            console.error(error);
          } finally {
            if (fabricMaterial) {
              fabricMaterial.dispose();
            }
            if (fallbackMaterial) {
              fallbackMaterial.dispose();
            }
            renderer.dispose();

            if (onDone) {
              onDone();
            }
          }
        };

        void applyMaterialsAndRender();
      },
      (err) => {
        console.error(err);
        renderer.dispose();

        if (onDone) {
          onDone();
        }
      },
    );
  }, []);

  const loadGLB = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const loaded = reader.result;
      if (!(loaded instanceof ArrayBuffer)) {
        return;
      }

      stateRef.current.glbBuffer = loaded;
      renderGarment();
    };

    reader.readAsArrayBuffer(file);
  }, [renderGarment]);

  const loadPhoto = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const loaded = reader.result;
      if (typeof loaded !== 'string') {
        return;
      }

      const img = new Image();
      img.onload = () => {
        const autoCropped = autoCropPortraitShoulderFocus(img);
        recolorCacheRef.current = null;
        lastAppliedRecolorHexRef.current = null;
        setUploadedImage(autoCropped);
        setBaseUploadedImage(autoCropped);
        setHasFabricOnlyCrop(false);
        setIsBackgroundRemoved(false);
        setFabricOverlayApplied(false);
        setHasUserImage(false);
        setHasAppliedRecolorOnce(false);
        setRecolorMaskPreview(null);
        setIsCropMode(false);
        setCropRectNatural(null);
        setIsSelectingRecolorArea(false);
        setRecolorRectNatural(null);
        setUserNaturalPoints([]);
        setIsMarkingUserShoulders(false);
      };
      img.src = loaded;
    };

    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    state.fitScale = 100;
    state.fitShift = 0;
    state.fitOpacity = 100;
    state.imgScale = 1;
    state.imgRotation = 0;
    state.imgOffsetX = 0;
    state.imgOffsetY = 0;
    state.userPanX = 0;
    state.userPanY = 0;
    state.userZoomMul = 1;

    const modelUrl = selectedStyle?.modelUrl;
    if (!modelUrl) {
      state.glbBuffer = null;
      renderGarment();
      return;
    }

    if (!canLoadDefaultModel) {
      state.glbBuffer = null;
      renderGarment();
      return;
    }

    let canceled = false;

    const loadDefaultModel = async () => {
      try {
        const response = await fetch(modelUrl);
        if (!response.ok) {
          throw new Error(`Model fetch failed (${response.status})`);
        }

        const buffer = await response.arrayBuffer();
        if (canceled) {
          return;
        }

        stateRef.current.glbBuffer = buffer;
        renderGarment();
      } catch (error) {
        console.error(error);
        if (!canceled) {
          stateRef.current.glbBuffer = null;
          renderGarment();
        }
      }
    };

    void loadDefaultModel();

    return () => {
      canceled = true;
    };
  }, [renderGarment, selectedStyle?.modelUrl, canLoadDefaultModel]);

  useEffect(() => {
    garmentColorRef.current = garmentColor ?? '#a09998';
    selectedFabricRef.current = selectedFabric;

    if (stateRef.current.glbBuffer) {
      renderGarment();
    }
  }, [garmentColor, renderGarment, selectedFabric]);

  const handleFrameDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const files = event.dataTransfer.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (file.type.startsWith('image/')) {
      loadPhoto(file);
      return;
    }

    if (file.name.toLowerCase().endsWith('.glb')) {
      loadGLB(file);
    }
  };

  const handleUploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    loadPhoto(file);
    event.target.value = '';
  };

  const handleUserMarkerClick = (event: MouseEvent<HTMLImageElement>) => {
    if (
      isCropMode ||
      !markerImageRef.current ||
      !uploadedImage ||
      !isMarkingUserShoulders
    ) {
      return;
    }

    const naturalPoint = clientToNaturalPoint(event.clientX, event.clientY, markerImageRef.current);
    setUserNaturalPoints((prev) => (prev.length >= 2 ? [naturalPoint] : [...prev, naturalPoint]));
  };

  const handleCropPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const imageRef = dressRecoloringMode ? recolorImageRef.current : markerImageRef.current;
    const isSelecting = dressRecoloringMode ? isSelectingRecolorArea : isCropMode;

    if (!isSelecting || !imageRef) {
      return;
    }

    event.preventDefault();
    const start = clientToNaturalPoint(event.clientX, event.clientY, imageRef);
    cropDragStartNaturalRef.current = start;
    cropPointerDownRef.current = true;
    const nextRect = { x: start.x, y: start.y, width: 0, height: 0 };
    if (dressRecoloringMode) {
      setRecolorRectNatural(nextRect);
    } else {
      setCropRectNatural(nextRect);
    }
  };

  useEffect(() => {
    if (!isCropMode && !isSelectingRecolorArea) {
      cropPointerDownRef.current = false;
      cropDragStartNaturalRef.current = null;
      return;
    }

    const onMove = (e: PointerEvent) => {
      const img = dressRecoloringMode ? recolorImageRef.current : markerImageRef.current;
      if (!cropPointerDownRef.current || !cropDragStartNaturalRef.current || !img) {
        return;
      }

      const cur = clientToNaturalPoint(e.clientX, e.clientY, img);
      const nw = Math.max(img.naturalWidth, 1);
      const nh = Math.max(img.naturalHeight, 1);
      const nextRect = naturalCropRectFromCorners(cropDragStartNaturalRef.current, cur, nw, nh);
      if (dressRecoloringMode) {
        setRecolorRectNatural(nextRect);
      } else {
        setCropRectNatural(nextRect);
      }
    };

    const endDrag = () => {
      cropPointerDownRef.current = false;
      cropDragStartNaturalRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [isCropMode, isSelectingRecolorArea, dressRecoloringMode]);

  const applyCropSelection = async () => {
    if (!uploadedImage || !cropRectNatural || !markerImageRef.current) {
      return;
    }

    const previewImage = markerImageRef.current;
    try {
      if ('decode' in previewImage) {
        await previewImage.decode();
      }
    } catch {
      // Continue; drawImage may still work.
    }

    const nw = Math.max(previewImage.naturalWidth, 1);
    const nh = Math.max(previewImage.naturalHeight, 1);
    const r = cropRectNatural;

    const x0 = clamp(Math.round(r.x), 0, nw);
    const y0 = clamp(Math.round(r.y), 0, nh);
    const x1 = clamp(Math.round(r.x + r.width), 0, nw);
    const y1 = clamp(Math.round(r.y + r.height), 0, nh);
    const cropX = Math.min(x0, x1);
    const cropY = Math.min(y0, y1);
    const cropWidth = Math.max(1, Math.abs(x1 - x0));
    const cropHeight = Math.max(1, Math.abs(y1 - y0));

    if (cropWidth < 8 || cropHeight < 8) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(previewImage, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const croppedSource = canvas.toDataURL('image/png');

    recolorCacheRef.current = null;
    lastAppliedRecolorHexRef.current = null;
    setUploadedImage({
      src: croppedSource,
      naturalWidth: cropWidth,
      naturalHeight: cropHeight,
    });
    setHasFabricOnlyCrop(true);
    setUserNaturalPoints([]);
    setIsMarkingUserShoulders(false);
    setHasUserImage(false);
    setFabricOverlayApplied(false);
    setIsCropMode(false);
    setCropRectNatural(null);
  };

  const handleCropButtonClick = () => {
    if (!uploadedImage) {
      return;
    }

    if (!isCropMode) {
      setIsCropMode(true);
      setCropRectNatural(null);
      setUserNaturalPoints([]);
      setIsMarkingUserShoulders(false);
      return;
    }

    if (!cropRectNatural || cropRectNatural.width < 8 || cropRectNatural.height < 8) {
      setIsCropMode(false);
      setCropRectNatural(null);
      return;
    }

    void applyCropSelection();
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage || isRemovingBackground) {
      return;
    }

    setIsRemovingBackground(true);
    let timeoutId: number | null = null;

    try {
      const inputBlob = await (await fetch(uploadedImage.src)).blob();

      const formData = new FormData();
      formData.append('image', inputBlob, 'user-image.png');

      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 330000);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (!response.ok) {
        let detail = `Request failed with ${response.status}`;
        let requestId = response.headers.get('X-Request-Id');
        try {
          const payload = await response.json();
          detail = payload?.detail || payload?.error || detail;
          requestId = requestId || payload?.reqId || null;
        } catch {
          // Keep default detail if response is not JSON.
        }

        throw new Error(requestId ? `${detail} (reqId: ${requestId})` : detail);
      }

      const outputBlob = await response.blob();
      const objectUrl = URL.createObjectURL(outputBlob);

      try {
        const { width, height } = await getImageDimensions(objectUrl);
        const outputDataUrl = await blobToDataUrl(outputBlob);

        recolorCacheRef.current = null;
        lastAppliedRecolorHexRef.current = null;
        setUploadedImage({
          src: outputDataUrl,
          naturalWidth: width,
          naturalHeight: height,
        });
        setBaseUploadedImage({
          src: outputDataUrl,
          naturalWidth: width,
          naturalHeight: height,
        });
        setHasFabricOnlyCrop(false);
        setIsBackgroundRemoved(true);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      setUserNaturalPoints([]);
      setIsMarkingUserShoulders(false);
      setHasUserImage(false);
      setFabricOverlayApplied(false);
      setIsCropMode(false);
      setCropRectNatural(null);
    } catch (error) {
      const isAbortError = error instanceof DOMException && error.name === 'AbortError';
      const detail = isAbortError
        ? 'Request timed out while waiting for backend/ML service.'
        : error instanceof Error
          ? error.message
          : 'Background removal failed.';

      console.error('Background removal failed:', detail);
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      setIsRemovingBackground(false);
    }
  };

  const applyGarmentAlignment = () => {
    const state = stateRef.current;
    if (!uploadedImage || state.modelShoulders.length !== 2 || userNaturalPoints.length !== 2) {
      return;
    }

    renderGarment(() => {
      // Map user shoulder segment (natural image px) onto garment shoulder segment (internal FRAME_W×H),
      // then express CSS transform in the frame's layout pixel space (matches #person-img positioning).
      const solved = solveSimilarityFromSegments(
        userNaturalPoints[0],
        userNaturalPoints[1],
        state.modelShoulders[0],
        state.modelShoulders[1],
      );

      if (!solved) {
        return;
      }

      const frameEl = frameRef.current;
      const cw = frameEl && frameEl.clientWidth > 4 ? frameEl.clientWidth : FRAME_W;
      const ch = frameEl && frameEl.clientHeight > 4 ? frameEl.clientHeight : FRAME_H;
      const sx = cw / FRAME_W;
      const sy = ch / FRAME_H;
      const su = (sx + sy) * 0.5;

      state.imgRotation = solved.theta;
      state.imgScale = solved.scale * su;
      state.imgOffsetX = solved.tx * sx;
      state.imgOffsetY = solved.ty * sy;
      state.userPanX = 0;
      state.userPanY = 0;
      state.userZoomMul = 1;

      const personImg = personImgRef.current;
      if (!personImg) {
        return;
      }

      personImg.src = uploadedImage.src;
      personImg.style.width = `${uploadedImage.naturalWidth}px`;
      personImg.style.height = `${uploadedImage.naturalHeight}px`;
      personImg.style.display = 'block';
      personImg.style.clipPath = 'none';
      applyImageTransform();

      setIsMarkingUserShoulders(false);
      setHasUserImage(true);
      setFabricOverlayApplied(true);
    });
  };

  const handleApplyRecolor = async () => {
    if (!uploadedImage || isRecoloring) {
      return;
    }

    const selectedRect = recolorRectNatural ?? {
      x: 0,
      y: 0,
      width: uploadedImage.naturalWidth,
      height: uploadedImage.naturalHeight,
    };
    setIsSelectingRecolorArea(false);
    setRecolorRectNatural(null);

    const sourceFile = dataUrlToFile(uploadedImage.src, 'recolor-source.png');
    const targetHex = (garmentColor ?? DEFAULT_RECOLOR_COLOR).toLowerCase();
    const nw = Math.max(uploadedImage.naturalWidth, 1);
    const nh = Math.max(uploadedImage.naturalHeight, 1);
    const x0 = clamp(Math.round(selectedRect.x), 0, nw - 1);
    const y0 = clamp(Math.round(selectedRect.y), 0, nh - 1);
    const x1 = clamp(Math.round(selectedRect.x + selectedRect.width), x0 + 1, nw);
    const y1 = clamp(Math.round(selectedRect.y + selectedRect.height), y0 + 1, nh);

    setIsRecoloring(true);

    try {
      const uploadData = await uploadImage(sourceFile);
      const lassoPoints = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ];

      const seg = await lassoSegmentation({
        imageId: uploadData.imageId,
        lassoPoints,
        selectedColor: targetHex,
        garmentType: selectedGarmentType,
      });

      if (seg.mask_preview) {
        setRecolorMaskPreview(seg.mask_preview);
      }

      if (!seg.garment_mask_b64 || !seg.width || !seg.height) {
        return;
      }

      const canvas = baseCanvasRef.current;
      if (!canvas) {
        return;
      }

      canvas.width = seg.width;
      canvas.height = seg.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const img = new Image();
      img.src = uploadedImage.src;
      await img.decode();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const baseImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const mask = b64ToUint8Mask(seg.garment_mask_b64);
      recolorCacheRef.current = {
        baseData: new Uint8ClampedArray(baseImage.data),
        mask: new Uint8Array(mask),
        width: baseImage.width,
        height: baseImage.height,
      };

      const recolorResult = recolorGarmentOKLCH(
        baseImage.data,
        baseImage.width,
        baseImage.height,
        mask,
        targetHex,
      );

      const imageDataBuffer = new Uint8ClampedArray(recolorResult.data.length);
      imageDataBuffer.set(recolorResult.data);
      const out = new ImageData(imageDataBuffer, recolorResult.width, recolorResult.height);
      ctx.putImageData(out, 0, 0);
      const resultUrl = canvas.toDataURL('image/png');

      setUploadedImage({
        src: resultUrl,
        naturalWidth: recolorResult.width,
        naturalHeight: recolorResult.height,
      });
      setBaseUploadedImage({
        src: resultUrl,
        naturalWidth: recolorResult.width,
        naturalHeight: recolorResult.height,
      });
      setHasFabricOnlyCrop(false);
      setHasAppliedRecolorOnce(true);
      lastAppliedRecolorHexRef.current = targetHex;
    } catch (error) {
      console.error('Recolor apply failed:', error);
    } finally {
      setIsRecoloring(false);
    }
  };

  useEffect(() => {
    if (!dressRecoloringMode || !hasAppliedRecolorOnce || !garmentColor || isRecoloring) {
      return;
    }

    const cache = recolorCacheRef.current;
    if (!cache) {
      return;
    }

    const targetHex = garmentColor.toLowerCase();
    if (lastAppliedRecolorHexRef.current === targetHex) {
      return;
    }

    const canvas = baseCanvasRef.current;
    if (!canvas) {
      return;
    }

    setIsRecoloring(true);
    try {
      canvas.width = cache.width;
      canvas.height = cache.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const recolorResult = recolorGarmentOKLCH(
        new Uint8ClampedArray(cache.baseData),
        cache.width,
        cache.height,
        cache.mask,
        targetHex,
      );

      const imageDataBuffer = new Uint8ClampedArray(recolorResult.data.length);
      imageDataBuffer.set(recolorResult.data);
      const out = new ImageData(imageDataBuffer, recolorResult.width, recolorResult.height);
      ctx.putImageData(out, 0, 0);
      const resultUrl = canvas.toDataURL('image/png');

      setUploadedImage({
        src: resultUrl,
        naturalWidth: recolorResult.width,
        naturalHeight: recolorResult.height,
      });
      setBaseUploadedImage({
        src: resultUrl,
        naturalWidth: recolorResult.width,
        naturalHeight: recolorResult.height,
      });
      setHasFabricOnlyCrop(false);
      lastAppliedRecolorHexRef.current = targetHex;
    } finally {
      setIsRecoloring(false);
    }
  }, [dressRecoloringMode, garmentColor, hasAppliedRecolorOnce, isRecoloring]);

  const zoomUserImage = (direction: 1 | -1) => {
    const st = stateRef.current;
    const next = st.userZoomMul * (direction > 0 ? 1.08 : 1 / 1.08);
    applyAnchoredZoom(next);
  };

  const resetToInitialUploadState = useCallback(() => {
    recolorCacheRef.current = null;
    lastAppliedRecolorHexRef.current = null;

    setUploadedImage(null);
    setBaseUploadedImage(null);
    setHasFabricOnlyCrop(false);
    setHasUserImage(false);
    setUserNaturalPoints([]);
    setIsMarkingUserShoulders(false);
    setIsCropMode(false);
    setCropRectNatural(null);
    setIsSelectingRecolorArea(false);
    setRecolorRectNatural(null);
    setRecolorMaskPreview(null);
    setHasAppliedRecolorOnce(false);
    setIsBackgroundRemoved(false);
    setIsMoveEnabled(true);
    setFabricOverlayApplied(false);

    const personImg = personImgRef.current;
    if (personImg) {
      personImg.src = '';
      personImg.style.display = 'none';
      personImg.style.transform = '';
    }
  }, [setFabricOverlayApplied]);

  return (
    <div className="absolute left-[452px] top-0 w-[420px]" data-name="Container">
      <div className="mb-3 flex items-center justify-center rounded-[8px] border border-[#0e3d56] bg-white p-[2px] shadow-sm">
        <button
          type="button"
          onClick={() => onDressRecoloringModeChange(true)}
          className={`min-w-[136px] rounded-[6px] px-3 py-1.5 text-[11px] font-semibold ${
            dressRecoloringMode ? 'bg-[#041b2a] text-white' : 'bg-white text-[#2f3e4a]'
          }`}
        >
          AI Outfit Recoloring
        </button>
        <button
          type="button"
          onClick={() => onDressRecoloringModeChange(false)}
          className={`min-w-[122px] rounded-[6px] px-3 py-1.5 text-[11px] font-semibold ${
            !dressRecoloringMode ? 'bg-[#041b2a] text-white' : 'bg-white text-[#2f3e4a]'
          }`}
        >
          Fabric Overlay
        </button>
      </div>

      <div className="viewer-wrap">
        <div
          id="tryon-frame"
          ref={frameRef}
          className="frame"
          onClick={() => {
            if (!uploadedImage) {
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleFrameDrop}
        >
          {uploadedImage && dressRecoloringMode && (
            <img
              ref={recolorImageRef}
              src={uploadedImage.src}
              alt="Recolor source"
              className="absolute inset-0 z-[1] h-full w-full object-contain"
              onLoad={() => setLayoutTick((t) => t + 1)}
              draggable={false}
            />
          )}

          {uploadedImage && !dressRecoloringMode && !hasUserImage && (
            <img
              ref={markerImageRef}
              src={uploadedImage.src}
              alt="Uploaded user"
              className="absolute inset-0 z-[1] h-full w-full object-contain"
              onLoad={() => setLayoutTick((t) => t + 1)}
              onClick={handleUserMarkerClick}
              draggable={false}
            />
          )}

          <img
            id="person-img"
            ref={personImgRef}
            alt="Your try-on photo"
            onLoad={() => {
              const el = personImgRef.current;
              if (!el || el.naturalWidth < 1) {
                return;
              }
              el.style.width = `${el.naturalWidth}px`;
              el.style.height = `${el.naturalHeight}px`;
              applyImageTransform();
            }}
          />

          <canvas
            id="garment-canvas"
            ref={garmentCanvasRef}
            width={FRAME_W}
            height={FRAME_H}
            style={{ opacity: dressRecoloringMode || !isFabricOverlayApplied ? 0 : 1 }}
          />
          <canvas id="pick-canvas" ref={pickCanvasRef} width={FRAME_W} height={FRAME_H} />

          {(isCropMode || isSelectingRecolorArea) && (
            <div
              className="absolute inset-0 z-[20] cursor-crosshair touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={handleCropPointerDown}
              aria-hidden
            />
          )}

          {cropOverlayStyle && !dressRecoloringMode && (
            <div
              className="pointer-events-none absolute z-[25] border-2 border-dashed border-[#9e6aff] bg-[rgba(158,106,255,0.14)]"
              style={{
                left: cropOverlayStyle.left,
                top: cropOverlayStyle.top,
                width: cropOverlayStyle.width,
                height: cropOverlayStyle.height,
              }}
            />
          )}

          {dressRecoloringMode && recolorRectNatural && recolorImageRef.current && (
            <div
              className="pointer-events-none absolute z-[25] border-2 border-dashed border-[#00af9d] bg-[rgba(0,175,157,0.15)]"
              style={naturalRectToOverlayStyle(recolorRectNatural, recolorImageRef.current)}
            />
          )}

          {isMarkingUserShoulders && shoulderOverlayPoints.length > 0 && !dressRecoloringMode && (
            <div className="pointer-events-none absolute inset-0 z-[30]">
              <ShoulderMarkers points={shoulderOverlayPoints} lineColor="rgba(120,88,200,0.95)" />
            </div>
          )}

          {recolorMaskPreview && dressRecoloringMode && (isRecoloring || isSelectingRecolorArea) && (
            <img
              src={recolorMaskPreview}
              alt="Mask preview"
              className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-contain opacity-30"
            />
          )}

          {!dressRecoloringMode && hasUserImage && isFabricOverlayApplied && isMoveEnabled && (
            <div
              ref={tryOnInteractRef}
              className="tryon-user-adjust-layer absolute inset-0 z-[4]"
              onPointerDown={handleTryOnPointerDown}
              onPointerMove={handleTryOnPointerMove}
              onPointerUp={handleTryOnPointerUp}
              onPointerCancel={handleTryOnPointerUp}
              aria-hidden
            />
          )}

          {!uploadedImage && (
            <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center gap-2 bg-[linear-gradient(180deg,rgba(251,251,254,0.98)_0%,rgba(243,246,250,0.98)_100%)] text-[#5b6070]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(91,96,112,0.28)] bg-white shadow-sm">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 16V8M8.5 11.5 12 8l3.5 3.5" stroke="#435066" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16.5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3" stroke="#435066" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-['Cabin:Semibold',sans-serif] text-[12px]">Upload image</p>
            </div>
          )}

          {onToggleColorLike && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleColorLike();
              }}
              className="tryon-like-btn"
              data-liked={isColorLiked ? 'true' : 'false'}
              aria-label={isColorLiked ? 'Remove selected shade from recommended shades' : 'Add selected shade to recommended shades'}
              title={isColorLiked ? 'Saved to recommended shades' : 'Save selected shade'}
            >
              <svg width="22" height="22" viewBox="0 -2 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g transform="translate(-3)">
                  <path
                    d="M26,4c2.757,0,5,2.692,5,6,0,6.308-7.637,11.425-12,13.6C14.632,21.422,7,16.307,7,10c0-3.308,2.243-6,5-6a5.033,5.033,0,0,1,3.765,2.353l1.618,1.772a2,2,0,0,0,3.234,0l1.618-1.772A5.033,5.033,0,0,1,26,4m0-4a8.961,8.961,0,0,0-7,4,8.961,8.961,0,0,0-7-4C7.029,0,3,4.477,3,10,3,21.438,19,28,19,28s16-6.562,16-18c0-5.523-4.029-10-9-10Z"
                    fill={isColorLiked ? '#dc2626' : 'none'}
                    stroke={isColorLiked ? 'none' : '#0a0a0a'}
                    strokeWidth={isColorLiked ? 0 : 1.15}
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </button>
          )}
        </div>

        {!dressRecoloringMode && isFabricOverlayApplied && (
          <div className="pointer-events-auto absolute right-[-42px] top-[210px] z-[60] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setIsMoveEnabled((v) => !v)}
              className={`h-8 w-8 rounded-[6px] border ${
                isMoveEnabled ? 'border-[#062b3f] bg-white text-[#062b3f]' : 'border-[#9fb0ba] bg-white text-[#2f3e4a]'
              }`}
              title="Move"
              aria-label="Move image"
            >
              <img src="/svg/move.svg" alt="" className="mx-auto h-4 w-4" draggable={false} />
            </button>
            <button
              type="button"
              onClick={() => zoomUserImage(1)}
              className="h-8 w-8 rounded-[6px] border border-[#062b3f] bg-white text-[18px] leading-none text-[#062b3f]"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <img src="/svg/zoom%20in.svg" alt="" className="mx-auto h-4 w-4" draggable={false} />
            </button>
            <button
              type="button"
              onClick={() => zoomUserImage(-1)}
              className="h-8 w-8 rounded-[6px] border border-[#062b3f] bg-white text-[18px] leading-none text-[#062b3f]"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <img src="/svg/zoom%20out.svg" alt="" className="mx-auto h-4 w-4" draggable={false} />
            </button>
          </div>
        )}
      </div>

      <canvas ref={baseCanvasRef} className="hidden" aria-hidden />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadImage}
      />

      <div className="mt-4 flex w-[420px] flex-wrap items-center justify-center gap-2 px-1 pb-1">
        {!dressRecoloringMode ? (
          <>
            <button
              type="button"
              onClick={handleRemoveBackground}
              disabled={!uploadedImage || isRemovingBackground || isBackgroundRemoved}
              className="rounded-[8px] border border-[rgba(6,43,63,0.42)] bg-[#071d2a] px-4 py-2 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b7bcc2]"
            >
              {isRemovingBackground ? 'Removing...' : isBackgroundRemoved ? 'Background Removed' : 'Remove BG'}
            </button>

            <button
              type="button"
              onClick={handleCropButtonClick}
              disabled={!uploadedImage || isRemovingBackground}
              className="rounded-[8px] border border-[rgba(6,43,63,0.42)] bg-white px-4 py-2 text-[11px] font-semibold text-[#243848] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isCropMode ? 'Apply Crop' : 'Crop'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!uploadedImage) {
                  return;
                }
                setIsMarkingUserShoulders((prev) => !prev);
                setIsCropMode(false);
                setCropRectNatural(null);
                if (isMarkingUserShoulders) {
                  setUserNaturalPoints([]);
                }
              }}
              disabled={!uploadedImage || isRemovingBackground}
              className={`rounded-[8px] border px-3 py-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${
                isMarkingUserShoulders
                  ? 'border-[#062b3f] bg-[#062b3f] text-white'
                  : 'border-[rgba(6,43,63,0.42)] bg-white text-[#243848]'
              }`}
              title="Mark user shoulder points"
            >
              <img src="/svg/pointer.svg" alt="" className="mx-auto h-4 w-4" draggable={false} />
            </button>

            <button
              type="button"
              onClick={applyGarmentAlignment}
              disabled={!uploadedImage || userNaturalPoints.length !== 2 || !hasGarmentShoulders}
              className="rounded-[8px] border border-[rgba(6,43,63,0.42)] bg-[#071d2a] px-5 py-2 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b7bcc2]"
            >
              Apply
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRemoveBackground}
              disabled={!uploadedImage || isRemovingBackground || isBackgroundRemoved}
              className="rounded-[8px] border border-[rgba(6,43,63,0.42)] bg-[#071d2a] px-4 py-2 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b7bcc2]"
            >
              {isRemovingBackground ? 'Removing...' : isBackgroundRemoved ? 'Background Removed' : 'Remove BG'}
            </button>

            <div className="rounded-[8px] border border-[rgba(6,43,63,0.42)] bg-white px-2 py-1.5">
              <select
                value={selectedGarmentType}
                onChange={(event) => setSelectedGarmentType(event.target.value)}
                disabled={!uploadedImage}
                className="min-w-[150px] bg-transparent text-[11px] font-semibold text-[#243848] outline-none disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Select garment type"
              >
                {GARMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleApplyRecolor}
              disabled={!uploadedImage || isRecoloring}
              className="rounded-[8px] border border-[rgba(6,43,63,0.42)] bg-[#071d2a] px-5 py-2 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b7bcc2]"
            >
              {isRecoloring ? 'Applying...' : 'Apply'}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={resetToInitialUploadState}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-[rgba(6,43,63,0.34)] bg-white"
          title="Reset and upload new image"
          aria-label="Reset and upload new image"
        >
          <img src="/svg/reupload.svg" alt="" className="h-4 w-4" draggable={false} />
        </button>
      </div>
    </div>
  );
}
