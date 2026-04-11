import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, MouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { garmentStyles } from '../config/garmentStyles';
import type { FabricOption } from '../types/fabric';

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

/** Upload modal: optional crop first, then shoulder marks (workflow order). */
type UserPhotoWorkflowStep = 'crop-or-skip' | 'mark-shoulders';

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
  selectedFabric?: FabricOption;
  isColorLiked?: boolean;
  onToggleColorLike?: () => void;
}

const FRAME_W = 300;
const FRAME_H = 400;
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

function ensureUv2(mesh: THREE.Mesh) {
  const geometry = mesh.geometry;
  if (!geometry || !('attributes' in geometry) || geometry.attributes.uv2 || !geometry.attributes.uv) {
    return;
  }

  geometry.setAttribute('uv2', geometry.attributes.uv.clone());
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
  const markerViewportRef = useRef<HTMLDivElement>(null);
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

  const [hintText, setHintText] = useState('Click LEFT then RIGHT garment shoulder in this card.');
  const [isMarkingGarment, setIsMarkingGarment] = useState(true);
  const [hasGarmentShoulders, setHasGarmentShoulders] = useState(false);
  const [hasUserImage, setHasUserImage] = useState(false);

  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [showUserMarkerModal, setShowUserMarkerModal] = useState(false);
  const [userNaturalPoints, setUserNaturalPoints] = useState<Point[]>([]);
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropRectNatural, setCropRectNatural] = useState<CropRect | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [layoutTick, setLayoutTick] = useState(0);
  const [shoulderOverlayPoints, setShoulderOverlayPoints] = useState<Point[]>([]);
  const [userPhotoStep, setUserPhotoStep] = useState<UserPhotoWorkflowStep>('crop-or-skip');

  useLayoutEffect(() => {
    const img = markerImageRef.current;
    if (
      !showUserMarkerModal ||
      userPhotoStep !== 'mark-shoulders' ||
      !img ||
      userNaturalPoints.length === 0 ||
      img.naturalWidth < 1
    ) {
      setShoulderOverlayPoints([]);
      return;
    }

    setShoulderOverlayPoints(userNaturalPoints.map((n) => naturalPointToElementLocal(n, img)));
  }, [userNaturalPoints, layoutTick, uploadedImage?.src, showUserMarkerModal, userPhotoStep]);

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
    if (!el || !hasUserImage || showUserMarkerModal || isMarkingGarment) {
      return;
    }

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const st = stateRef.current;
      const next = st.userZoomMul * Math.exp(-ev.deltaY * 0.0012);
      st.userZoomMul = clamp(next, 0.2, 5);
      applyImageTransform();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [hasUserImage, showUserMarkerModal, isMarkingGarment, applyImageTransform]);

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
    off.width = 900;
    off.height = 900;

    const renderer = new THREE.WebGLRenderer({
      canvas: off,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });

    renderer.setPixelRatio(1);
    renderer.setSize(900, 900);
    renderer.setClearColor(0xffffff, 0);

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
              ensureUv2(mesh);
              if (isFabricMesh(mesh)) {
                namedFabricMeshes.push(mesh);
              }
            });

            const fabricMeshes = namedFabricMeshes.length > 0 ? namedFabricMeshes : allMeshes;
            const fabricMeshSet = new Set(fabricMeshes);
            const textureSet = activeFabric ? await getOrLoadFabricTextureSet(activeFabric) : null;
            const lowPoly = countTriangles(fabricMeshes) < 10000;

            fallbackMaterial = new THREE.MeshStandardMaterial({
              color: tintColor,
              roughness: 0.42,
              metalness: 0.04,
              side: THREE.DoubleSide,
              transparent: opacity < 1,
              opacity,
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
                aoMap: textureSet.aoMap,
                aoMapIntensity: textureSet.aoMap ? 1.0 : 0,
                metalness: 0.05,
                color: tintColor,
                side: THREE.DoubleSide,
                transparent: opacity < 1,
                opacity,
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

            const drawW = FRAME_W * scaleMul;
            const drawH = drawW;
            const drawX = (FRAME_W - drawW) / 2;
            const drawY = (FRAME_H - drawH) + shiftMul * FRAME_H;

            ctx.drawImage(off, drawX, drawY, drawW, drawH);
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
      setHintText('GLB loaded. Click LEFT then RIGHT garment shoulder in this card.');
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
        setUploadedImage({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        });
        setUserNaturalPoints([]);
        setIsCropMode(false);
        setCropRectNatural(null);
        setUserPhotoStep('crop-or-skip');
        setShowUserMarkerModal(true);
        setHintText('Step 1: Crop your photo (optional), or use the full image. Then mark shoulders.');
      };
      img.src = loaded;
    };

    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    state.modelShoulders = [];
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

    setIsMarkingGarment(true);
    setHasGarmentShoulders(false);
    setHasUserImage(false);
    setUploadedImage(null);
    setShowUserMarkerModal(false);
    setUserNaturalPoints([]);
    setIsCropMode(false);
    setCropRectNatural(null);
    setUserPhotoStep('crop-or-skip');

    const personImg = personImgRef.current;
    if (personImg) {
      personImg.style.display = 'none';
      personImg.style.clipPath = 'none';
      personImg.removeAttribute('src');
    }

    drawPickOverlay([], false);

    const modelUrl = selectedStyle?.modelUrl;
    if (!modelUrl) {
      state.glbBuffer = null;
      setHintText('Model missing. Choose another neckline style or upload GLB by dropping it on card.');
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
        setHintText('Click LEFT then RIGHT garment shoulder in this card.');
      } catch (error) {
        console.error(error);
        if (!canceled) {
          stateRef.current.glbBuffer = null;
          renderGarment();
          setHintText('Could not auto-load garment GLB. Drop a GLB file into the card.');
        }
      }
    };

    void loadDefaultModel();

    return () => {
      canceled = true;
    };
  }, [drawPickOverlay, renderGarment, selectedStyle?.modelUrl]);

  useEffect(() => {
    garmentColorRef.current = garmentColor ?? '#a09998';
    selectedFabricRef.current = selectedFabric;

    if (stateRef.current.glbBuffer) {
      renderGarment();
    }
  }, [garmentColor, renderGarment, selectedFabric]);

  const handleFrameClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isMarkingGarment) {
      return;
    }

    const state = stateRef.current;
    if (!state.glbBuffer) {
      setHintText('Upload or load a garment GLB first.');
      return;
    }

    const p = clientToFramePoint(event.clientX, event.clientY);

    if (state.modelShoulders.length >= 2) {
      state.modelShoulders.length = 0;
    }

    state.modelShoulders.push({ x: p.x, y: p.y });
    drawPickOverlay(state.modelShoulders, true);

    if (state.modelShoulders.length === 2) {
      setIsMarkingGarment(false);
      setHasGarmentShoulders(true);
      drawPickOverlay([], false);
      setHintText('Garment shoulders captured. Upload your photo: crop or use full image, then mark your shoulders.');
    }
  };

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

  const handleMarkGarment = () => {
    if (!stateRef.current.glbBuffer) {
      setHintText('Model missing. Drop a GLB file on the card, then mark garment shoulders.');
      return;
    }

    const st = stateRef.current;
    st.userPanX = 0;
    st.userPanY = 0;
    st.userZoomMul = 1;
    st.modelShoulders = [];
    setIsMarkingGarment(true);
    setHasGarmentShoulders(false);
    setHintText('Click LEFT then RIGHT garment shoulder in this card.');
    drawPickOverlay([], true);

    const personImg = personImgRef.current;
    if (personImg) {
      personImg.style.display = 'none';
      personImg.style.clipPath = 'none';
    }
    setHasUserImage(false);
  };

  const handleUserMarkerClick = (event: MouseEvent<HTMLImageElement>) => {
    if (
      isCropMode ||
      userPhotoStep !== 'mark-shoulders' ||
      !markerImageRef.current ||
      !uploadedImage
    ) {
      return;
    }

    const naturalPoint = clientToNaturalPoint(event.clientX, event.clientY, markerImageRef.current);
    setUserNaturalPoints((prev) => (prev.length >= 2 ? [naturalPoint] : [...prev, naturalPoint]));
  };

  const handleCropPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isCropMode || !markerImageRef.current) {
      return;
    }

    event.preventDefault();
    const img = markerImageRef.current;
    const start = clientToNaturalPoint(event.clientX, event.clientY, img);
    cropDragStartNaturalRef.current = start;
    cropPointerDownRef.current = true;
    setCropRectNatural({ x: start.x, y: start.y, width: 0, height: 0 });
  };

  useEffect(() => {
    if (!isCropMode) {
      cropPointerDownRef.current = false;
      cropDragStartNaturalRef.current = null;
      return;
    }

    const onMove = (e: PointerEvent) => {
      if (!cropPointerDownRef.current || !cropDragStartNaturalRef.current || !markerImageRef.current) {
        return;
      }

      const img = markerImageRef.current;
      const cur = clientToNaturalPoint(e.clientX, e.clientY, img);
      const nw = Math.max(uploadedImage?.naturalWidth ?? img.naturalWidth, 1);
      const nh = Math.max(uploadedImage?.naturalHeight ?? img.naturalHeight, 1);
      setCropRectNatural(naturalCropRectFromCorners(cropDragStartNaturalRef.current, cur, nw, nh));
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
  }, [isCropMode, uploadedImage?.naturalWidth, uploadedImage?.naturalHeight]);

  useEffect(() => {
    if (!showUserMarkerModal) {
      return;
    }

    const el = markerViewportRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }

    const ro = new ResizeObserver(() => {
      setLayoutTick((t) => t + 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [showUserMarkerModal]);

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

    const nw = Math.max(uploadedImage.naturalWidth, 1);
    const nh = Math.max(uploadedImage.naturalHeight, 1);
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
      setHintText('Crop area is too small. Drag a larger area and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      setHintText('Crop failed. Please try again.');
      return;
    }

    context.drawImage(previewImage, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const croppedSource = canvas.toDataURL('image/png');

    setUploadedImage({
      src: croppedSource,
      naturalWidth: cropWidth,
      naturalHeight: cropHeight,
    });
    setUserNaturalPoints([]);
    setIsCropMode(false);
    setCropRectNatural(null);
    setUserPhotoStep('mark-shoulders');
    setHintText('Step 2: Tap LEFT shoulder, then RIGHT on the photo. Then Apply Garment on the card.');
  };

  const skipCropUseFullImage = () => {
    if (!uploadedImage) {
      return;
    }

    setIsCropMode(false);
    setCropRectNatural(null);
    setUserNaturalPoints([]);
    setUserPhotoStep('mark-shoulders');
    setHintText('Step 2: Tap LEFT shoulder, then RIGHT on your photo. Then Apply Garment.');
  };

  const handleCropButtonClick = () => {
    if (!uploadedImage) {
      return;
    }

    if (!isCropMode) {
      setIsCropMode(true);
      setCropRectNatural(null);
      setUserNaturalPoints([]);
      setHintText('Drag on the photo to select the crop box, then tap Apply Crop again.');
      return;
    }

    if (!cropRectNatural || cropRectNatural.width < 8 || cropRectNatural.height < 8) {
      setIsCropMode(false);
      setCropRectNatural(null);
      setHintText(
        userPhotoStep === 'mark-shoulders'
          ? 'Crop canceled. Mark LEFT then RIGHT shoulder.'
          : 'Crop canceled. Use full image or try cropping again.',
      );
      return;
    }

    void applyCropSelection();
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage || isRemovingBackground) {
      return;
    }

    setIsRemovingBackground(true);
    setHintText('Removing background...');
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

        setUploadedImage({
          src: outputDataUrl,
          naturalWidth: width,
          naturalHeight: height,
        });
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      setUserNaturalPoints([]);
      setIsCropMode(false);
      setCropRectNatural(null);
      setUserPhotoStep('crop-or-skip');
      setHintText('Background removed. Crop if needed, or use full image, then mark shoulders.');
    } catch (error) {
      const isAbortError = error instanceof DOMException && error.name === 'AbortError';
      const detail = isAbortError
        ? 'Request timed out while waiting for backend/ML service.'
        : error instanceof Error
          ? error.message
          : 'Background removal failed.';

      setHintText(`Background removal failed: ${detail}`);
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
      setHintText('Mark garment shoulders on the card, then your shoulders in the popup, then apply.');
      return;
    }

    if (userPhotoStep !== 'mark-shoulders') {
      setHintText('Finish photo setup: use full image or apply a crop, then mark your shoulders.');
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
        setHintText('Points are too close. Please re-mark shoulders.');
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

      const m1 = state.modelShoulders[0];
      const m2 = state.modelShoulders[1];
      const shoulderY = (m1.y + m2.y) * 0.5;
      const clipPct = clamp(((shoulderY + 28) / FRAME_H) * 100, 15, 97);
      personImg.style.clipPath = `polygon(0 0, 100% 0, 100% ${clipPct}%, 0 ${clipPct}%)`;

      setShowUserMarkerModal(false);
      setHasUserImage(true);
      setHintText(
        'Applied. Drag on the card to move your photo; scroll to zoom. Mark Garment to recalibrate.',
      );
    });
  };

  return (
    <div className="absolute left-[452px] top-0 w-[420px]" data-name="Container">
      <div className="viewer-wrap">
        <div
          id="tryon-frame"
          ref={frameRef}
          className="frame"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleFrameDrop}
        >
          <div id="hint" className="hint">
            {hintText}
          </div>

          <div className="drop-note" style={{ opacity: hasUserImage ? 0 : 1 }}>
            Drop image here or upload
          </div>

          <img id="person-img" ref={personImgRef} alt="User" />
          <canvas id="garment-canvas" ref={garmentCanvasRef} width={FRAME_W} height={FRAME_H} />
          <canvas id="pick-canvas" ref={pickCanvasRef} width={FRAME_W} height={FRAME_H} />

          {hasUserImage && !showUserMarkerModal && !isMarkingGarment && (
            <div
              ref={tryOnInteractRef}
              className="tryon-user-adjust-layer absolute inset-0 z-[3]"
              onPointerDown={handleTryOnPointerDown}
              onPointerMove={handleTryOnPointerMove}
              onPointerUp={handleTryOnPointerUp}
              onPointerCancel={handleTryOnPointerUp}
              aria-hidden
            />
          )}

          {isMarkingGarment && (
            <div className="absolute inset-0 z-[6] cursor-crosshair" onClick={handleFrameClick} />
          )}

          {onToggleColorLike && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleColorLike();
              }}
              className="tryon-like-btn"
              aria-label={isColorLiked ? 'Remove selected shade from recommended shades' : 'Add selected shade to recommended shades'}
              title={isColorLiked ? 'Saved to recommended shades' : 'Save selected shade'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 21s-6.5-4.35-9.33-8.04C0.29 9.86 1.05 5.5 4.82 4.21c2.24-.77 4.1.17 5.18 1.68 1.08-1.51 2.94-2.45 5.18-1.68 3.77 1.29 4.53 5.65 2.15 8.75C18.5 16.65 12 21 12 21z"
                  fill={isColorLiked ? '#f9739b' : 'none'}
                  stroke={isColorLiked ? '#f9739b' : '#ffffff'}
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {showUserMarkerModal && uploadedImage && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(17,16,25,0.55)] p-4">
              <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-[20px] border border-[rgba(158,106,255,0.22)] bg-white p-5 shadow-[0_20px_44px_-22px_rgba(26,14,53,0.55)]">
                <p className="px-1 text-center font-['Cabin:Bold',sans-serif] text-[13px] leading-snug text-[#4b4662]">
                  {isCropMode
                    ? 'Drag across your photo to select the region, then tap Apply Crop.'
                    : userPhotoStep === 'crop-or-skip'
                      ? 'Step 1 of 2: Optionally crop. Tap Crop, drag a box, then Apply Crop — or use the full image.'
                      : 'Step 2 of 2: Tap your LEFT shoulder, then your RIGHT shoulder (same order as on the garment).'}
                </p>

                <div
                  ref={markerViewportRef}
                  className="mx-auto flex w-full max-w-[320px] justify-center rounded-[14px] border border-[rgba(158,106,255,0.28)] bg-[#f4f1fc] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                >
                  <div className="relative w-fit max-w-full">
                    <img
                      ref={markerImageRef}
                      src={uploadedImage.src}
                      alt="User preview for shoulder marks"
                      draggable={false}
                      className={`block max-h-[min(38vh,280px)] max-w-full select-none object-contain ${
                        isCropMode
                          ? 'cursor-crosshair'
                          : userPhotoStep === 'mark-shoulders'
                            ? 'cursor-pointer'
                            : 'cursor-default'
                      }`}
                      onLoad={() => setLayoutTick((t) => t + 1)}
                      onClick={handleUserMarkerClick}
                    />

                    <div className="pointer-events-none absolute inset-0 z-10">
                      {cropOverlayStyle && (
                        <div
                          className="absolute z-30 border-2 border-dashed border-[#9e6aff] bg-[rgba(158,106,255,0.14)]"
                          style={{
                            left: cropOverlayStyle.left,
                            top: cropOverlayStyle.top,
                            width: cropOverlayStyle.width,
                            height: cropOverlayStyle.height,
                            boxSizing: 'border-box',
                          }}
                        />
                      )}

                      {shoulderOverlayPoints.length > 0 && !isCropMode && (
                        <ShoulderMarkers points={shoulderOverlayPoints} lineColor="rgba(120,88,200,0.95)" />
                      )}
                    </div>

                    {isCropMode && (
                      <div
                        className="absolute inset-0 z-20 cursor-crosshair touch-none"
                        style={{ touchAction: 'none' }}
                        onPointerDown={handleCropPointerDown}
                        aria-hidden
                      />
                    )}
                  </div>
                </div>

                {userPhotoStep === 'crop-or-skip' && !isCropMode && (
                  <button
                    type="button"
                    onClick={skipCropUseFullImage}
                    className="w-full rounded-full border border-[rgba(158,106,255,0.55)] bg-[rgba(158,106,255,0.08)] py-2.5 font-['Cabin:Semibold',sans-serif] text-[11px] text-[#5c4a8a] shadow-sm"
                  >
                    Use full image (skip crop)
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    disabled={!uploadedImage || isCropMode || isRemovingBackground}
                    className="w-full rounded-full border border-[rgba(158,106,255,0.4)] bg-white py-2.5 font-['Cabin:Semibold',sans-serif] text-[11px] text-[#6e5a9a] shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isRemovingBackground ? 'Removing...' : 'Remove Background'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCropButtonClick}
                    disabled={isRemovingBackground}
                    className="w-full rounded-full border border-[rgba(158,106,255,0.5)] bg-white py-2.5 font-['Cabin:Semibold',sans-serif] text-[11px] text-[#6e5a9a] shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isCropMode ? 'Apply Crop' : 'Crop'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMarkerModal(false);
                      setIsCropMode(false);
                      setCropRectNatural(null);
                    }}
                    className="w-full rounded-full border border-[rgba(158,106,255,0.4)] bg-white py-2.5 font-['Cabin:Semibold',sans-serif] text-[11px] text-[#6e5a9a] shadow-sm"
                  >
                    Cancel
                  </button>
                    <button
                      type="button"
                      onClick={applyGarmentAlignment}
                      disabled={
                        isRemovingBackground ||
                        isCropMode ||
                        userPhotoStep !== 'mark-shoulders' ||
                        userNaturalPoints.length !== 2 ||
                        !hasGarmentShoulders
                      }
                      className="w-full rounded-full bg-[#9e6aff] py-2.5 font-['Cabin:Semibold',sans-serif] text-[11px] text-white shadow-[0_6px_14px_-8px_rgba(120,80,200,0.65)] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Apply Garment
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadImage}
      />

      <div className="absolute left-0 top-[578px] z-40 flex w-[420px] items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleMarkGarment}
          className="rounded-full border border-[rgba(64,58,92,0.26)] bg-[rgba(245,245,249,0.95)] px-4 py-2 font-['Cabin:Semibold',sans-serif] text-[11px] tracking-[0.2px] text-[#46425e] shadow-[0_6px_14px_-10px_rgba(21,16,42,0.55)]"
        >
          Mark Garment
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!hasGarmentShoulders}
          className="rounded-full border border-[rgba(64,58,92,0.26)] bg-[rgba(245,245,249,0.95)] px-4 py-2 font-['Cabin:Semibold',sans-serif] text-[11px] tracking-[0.2px] text-[#46425e] shadow-[0_6px_14px_-10px_rgba(21,16,42,0.55)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Upload User Image
        </button>
      </div>
    </div>
  );
}
