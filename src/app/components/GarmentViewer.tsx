import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group, Material, Mesh, PerspectiveCamera } from 'three';
import { Box3, Color, MathUtils, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector2, Vector3 } from 'three';
import type { Texture } from 'three';
import type { ElementType, ErrorInfo, ReactNode } from 'react';
import { GarmentViewerSimple } from './GarmentViewerSimple';
import type { FabricOption } from '../types/fabric';
import { ensureMeshUv2ForAoMap } from '../utils/ensureMeshUv2';

const R3fGroup = 'group' as unknown as ElementType;
const R3fPrimitive = 'primitive' as unknown as ElementType;
const R3fAmbientLight = 'ambientLight' as unknown as ElementType;
const R3fDirectionalLight = 'directionalLight' as unknown as ElementType;
const R3fPointLight = 'pointLight' as unknown as ElementType;
const R3fColor = 'color' as unknown as ElementType;

interface GarmentViewerProps {
  modelUrl?: string;
  garmentType?: string;
  className?: string;
  alignBottom?: boolean;
  transparentBackground?: boolean;
  autoRotate?: boolean;
  modelScale?: number;
  modelYOffset?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  autoFit?: boolean;
  fitPadding?: number;
  cameraYOffset?: number;
  bottomAnchorNdc?: number;
  garmentColor?: string;
  selectedFabric?: FabricOption;
  /** When false, fabric maps are never applied (e.g. neckline thumbnails). Default true. */
  applyFabricTextures?: boolean;
}

interface GarmentModelProps {
  modelUrl: string;
  alignBottom?: boolean;
  autoRotate?: boolean;
  modelScale?: number;
  modelYOffset?: number;
  autoFit?: boolean;
  fitPadding?: number;
  cameraYOffset?: number;
  bottomAnchorNdc?: number;
  garmentColor?: string;
  selectedFabric?: FabricOption;
  applyFabricTextures?: boolean;
}

interface FabricTextureSet {
  colorMap: Texture | null;
  normalMap: Texture;
  roughnessMap: Texture;
  displacementMap: Texture;
  aoMap: Texture | null;
}

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
const fabricTextureCache = new Map<string, FabricTextureSet>();
const isDevMode = Boolean((import.meta as any)?.env?.DEV);

interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  state: ModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Keep quiet in UI while allowing fallback rendering.
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function isFabricMesh(mesh: Mesh): boolean {
  const meshName = (mesh.name ?? '').toLowerCase();
  const materialNames = (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
    .map((material) => material?.name?.toLowerCase?.() ?? '')
    .join(' ');

  const combined = `${meshName} ${materialNames}`;
  if (FABRIC_MESH_EXCLUDE.some((ex) => combined.includes(ex))) {
    return false;
  }

  const hasUv = Boolean(mesh.geometry?.attributes?.uv);
  if (FABRIC_MESH_HINTS.some((hint) => meshName.includes(hint) || materialNames.includes(hint))) {
    return hasUv;
  }

  // Many garment GLBs use generic node names; any primary textured surface with UVs is treated as fabric.
  return hasUv;
}

function configureTexture(texture: Texture, repeat: [number, number], isColorTexture = false) {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);

  if ('colorSpace' in texture) {
    texture.colorSpace = isColorTexture ? SRGBColorSpace : texture.colorSpace;
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
  loader: TextureLoader,
  url: string,
  repeat: [number, number],
  isColorTexture = false,
  optional = false,
): Promise<Texture | null> {
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
      const texture = await new Promise<Texture>((resolve, reject) => {
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

      if (isDevMode && candidateUrl !== url) {
        console.warn(`[GarmentViewer] Loaded fallback texture ${candidateUrl} (primary not found: ${url}).`);
      }

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
  const loader = new TextureLoader();
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
    normalMap: normalMap as Texture,
    roughnessMap: roughnessMap as Texture,
    displacementMap: displacementMap as Texture,
    aoMap,
  };
}

function rememberTextureSet(cacheKey: string, textureSet: FabricTextureSet) {
  if (fabricTextureCache.has(cacheKey)) {
    fabricTextureCache.delete(cacheKey);
  }

  fabricTextureCache.set(cacheKey, textureSet);

  while (fabricTextureCache.size > FABRIC_CACHE_LIMIT) {
    const lruKey = fabricTextureCache.keys().next().value as string;
    const lruTextureSet = fabricTextureCache.get(lruKey);
    if (lruTextureSet) {
      disposeTextureSet(lruTextureSet);
    }
    fabricTextureCache.delete(lruKey);
  }
}

function countTriangles(meshes: Mesh[]) {
  return meshes.reduce((sum, mesh) => {
    const geometry = mesh.geometry;
    if (!geometry) {
      return sum;
    }

    if (geometry.index) {
      return sum + geometry.index.count / 3;
    }

    return sum + (geometry.attributes.position?.count ?? 0) / 3;
  }, 0);
}

function applyColorToMaterial(material: Material | Material[], color: Color) {
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((entry) => {
    const colorMaterial = entry as Material & { color?: Color; needsUpdate?: boolean };
    if (colorMaterial.color) {
      colorMaterial.color.copy(color);
      colorMaterial.needsUpdate = true;
    }
  });
}

/**
 * Neckline thumbnails use `applyFabricTextures={false}` and only set `material.color`. For
 * MeshStandardMaterial / PhysicalMaterial, the renderer still multiplies albedo by `map`, so a
 * GLB with a dark or colored base-color texture (e.g. maroon puffer) never matches the UI swatch.
 */
function stripAlbedoMapsForSolidSwatch(material: Material | Material[]) {
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((entry) => {
    const m = entry as Material & {
      map?: Texture | null;
      lightMap?: Texture | null;
      emissiveMap?: Texture | null;
      emissive?: Color;
      emissiveIntensity?: number;
      needsUpdate?: boolean;
    };
    if (m.map) {
      m.map = null;
    }
    if (m.lightMap) {
      m.lightMap = null;
    }
    if (m.emissiveMap) {
      m.emissiveMap = null;
    }
    if (m.emissive) {
      m.emissive.setHex(0x000000);
    }
    if (typeof m.emissiveIntensity === 'number') {
      m.emissiveIntensity = 0;
    }
    m.needsUpdate = true;
  });
}

function computeRobustMeshBounds(root: Group): Box3 {
  const fallbackBox = new Box3().setFromObject(root);
  const candidates: Array<{ box: Box3; score: number }> = [];
  const size = new Vector3();

  root.updateWorldMatrix(true, true);

  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || !mesh.geometry || !mesh.visible) {
      return;
    }

    if (!mesh.geometry.boundingBox) {
      mesh.geometry.computeBoundingBox();
    }

    if (!mesh.geometry.boundingBox) {
      return;
    }

    const worldBox = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    worldBox.getSize(size);
    const maxExtent = Math.max(size.x, size.y, size.z);
    const footprint = Math.max(size.x * size.y, size.x * size.z, size.y * size.z);
    const score = Math.max(footprint, maxExtent * maxExtent);

    if (!Number.isFinite(score) || score <= 1e-8) {
      return;
    }

    candidates.push({ box: worldBox, score });
  });

  if (candidates.length === 0 || fallbackBox.isEmpty()) {
    return fallbackBox;
  }

  const maxScore = Math.max(...candidates.map((candidate) => candidate.score));
  const threshold = Math.max(maxScore * 0.06, 1e-8);
  const robustBox = new Box3();
  let used = 0;

  candidates.forEach((candidate) => {
    if (candidate.score < threshold) {
      return;
    }

    if (used === 0) {
      robustBox.copy(candidate.box);
    } else {
      robustBox.union(candidate.box);
    }
    used += 1;
  });

  if (used === 0) {
    const largest = candidates.reduce((prev, current) => (current.score > prev.score ? current : prev));
    return largest.box;
  }

  if (robustBox.isEmpty()) {
    return fallbackBox;
  }

  const fallbackSize = fallbackBox.getSize(new Vector3());
  const robustSize = robustBox.getSize(new Vector3());
  const fallbackMaxDim = Math.max(fallbackSize.x, fallbackSize.y, fallbackSize.z, 0.001);
  const robustMaxDim = Math.max(robustSize.x, robustSize.y, robustSize.z, 0);

  // Guard against over-filtering (causes sudden zoom/crop on some thin meshes).
  if (robustMaxDim < fallbackMaxDim * 0.35) {
    return fallbackBox;
  }

  return robustBox;
}

function AutoFitCamera({
  targetRef,
  alignBottom,
  fitPadding,
  cameraYOffset,
  bottomAnchorNdc,
}: {
  targetRef: React.RefObject<Group | null>;
  alignBottom: boolean;
  fitPadding: number;
  cameraYOffset: number;
  bottomAnchorNdc: number;
}) {
  const { camera } = useThree();

  const fitCamera = useCallback(() => {
    if (!targetRef.current) {
      return false;
    }

    const perspective = camera as PerspectiveCamera;
    const box = computeRobustMeshBounds(targetRef.current);
    if (box.isEmpty()) {
      return false;
    }

    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());

    const vFov = MathUtils.degToRad(perspective.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov * 0.5) * perspective.aspect);
    // Allow slight overscan below -1 so the garment hem can sit flush with the card edge.
    const desiredBottomNdc = MathUtils.clamp(bottomAnchorNdc, -1.2, 2);
    const fitHeight = Math.max(size.y * fitPadding, 0.001);
    const fitWidth = Math.max(size.x * fitPadding, 0.001);
    const distanceY = (fitHeight * 0.5) / Math.tan(vFov * 0.5);
    const distanceX = (fitWidth * 0.5) / Math.tan(hFov * 0.5);
    let distance = Math.max(distanceX, distanceY) + size.z * 0.65;

    let targetX = center.x;
    let eyeX = center.x;
    let targetY = alignBottom ? center.y : center.y;
    let eyeY = targetY + cameraYOffset;

    const centerSample = new Vector3();
    const projectCenterY = (nextTargetX: number, nextEyeX: number, nextTargetY: number, nextEyeY: number) => {
      perspective.position.set(nextEyeX, nextEyeY, center.z + distance);
      perspective.lookAt(nextTargetX, nextTargetY, center.z);
      perspective.updateMatrixWorld();
      perspective.updateProjectionMatrix();
      centerSample.set(center.x, center.y, center.z).project(perspective);
      return centerSample.y;
    };

    const boundsCorners = [
      new Vector3(box.min.x, box.min.y, box.min.z),
      new Vector3(box.min.x, box.min.y, box.max.z),
      new Vector3(box.min.x, box.max.y, box.min.z),
      new Vector3(box.min.x, box.max.y, box.max.z),
      new Vector3(box.max.x, box.min.y, box.min.z),
      new Vector3(box.max.x, box.min.y, box.max.z),
      new Vector3(box.max.x, box.max.y, box.min.z),
      new Vector3(box.max.x, box.max.y, box.max.z),
    ];

    const projected = new Vector3();
    const projectBounds = (nextTargetX: number, nextEyeX: number, nextTargetY: number, nextEyeY: number) => {
      perspective.position.set(nextEyeX, nextEyeY, center.z + distance);
      perspective.lookAt(nextTargetX, nextTargetY, center.z);
      perspective.updateMatrixWorld();
      perspective.updateProjectionMatrix();

      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (const corner of boundsCorners) {
        projected.copy(corner).project(perspective);
        minX = Math.min(minX, projected.x);
        maxX = Math.max(maxX, projected.x);
        minY = Math.min(minY, projected.y);
        maxY = Math.max(maxY, projected.y);
      }

      return { minX, maxX, minY, maxY, bottomY: minY };
    };

    const ensureFullyVisible = (maxIterations: number) => {
      for (let i = 0; i < maxIterations; i += 1) {
        const bounds = projectBounds(targetX, eyeX, targetY, eyeY);
        const overflowX = Math.max(0, Math.abs(bounds.minX) - 0.985, Math.abs(bounds.maxX) - 0.985);
        const overflowY = Math.max(0, Math.abs(bounds.minY) - 0.985, Math.abs(bounds.maxY) - 0.985);
        const overflow = Math.max(overflowX, overflowY);

        if (overflow <= 0.0008) {
          break;
        }

        distance *= 1 + overflow * 0.9;
      }
    };

    const lockBottom = (iterations: number, tolerance: number) => {
      for (let i = 0; i < iterations; i += 1) {
        const currentBottom = projectBounds(targetX, eyeX, targetY, eyeY).bottomY;
        const error = desiredBottomNdc - currentBottom;
        if (Math.abs(error) <= tolerance) {
          break;
        }

        const worldShiftY = -error * distance * Math.tan(vFov * 0.5);
        const shift = MathUtils.clamp(worldShiftY, -size.y * 3, size.y * 3);
        targetY += shift;
        eyeY += shift;
      }
    };

    ensureFullyVisible(12);

    if (alignBottom) {
      // For try-on cards we prioritize strict hem anchoring over full-height fitting.
      lockBottom(30, 0.0001);
    }

    // Hard lock horizontal alignment so projected bounds sit around x=0 in NDC.
    for (let i = 0; i < 8; i += 1) {
      const bounds = projectBounds(targetX, eyeX, targetY, eyeY);
      const centerXError = (bounds.minX + bounds.maxX) * 0.5;
      if (Math.abs(centerXError) < 0.0005) {
        break;
      }

      const worldShiftX = centerXError * distance * Math.tan(hFov * 0.5);
      const shift = MathUtils.clamp(worldShiftX, -size.x * 2, size.x * 2);
      targetX += shift;
      eyeX += shift;
    }

    if (alignBottom) {
      // Horizontal correction can slightly alter vertical projection, so lock bottom one last time.
      lockBottom(8, 0.0004);
      ensureFullyVisible(4);
      lockBottom(8, 0.0004);
    } else {
      // Keep model vertically centered for standard preview cards.
      for (let i = 0; i < 6; i += 1) {
        const currentCenterY = projectCenterY(targetX, eyeX, targetY, eyeY);
        const errorY = -currentCenterY;
        if (Math.abs(errorY) < 0.0025) {
          break;
        }

        const epsilonY = Math.max(size.y * 0.01, 0.002);
        const sampleCenterY = projectCenterY(targetX, eyeX, targetY + epsilonY, eyeY + epsilonY);
        const derivativeY = (sampleCenterY - currentCenterY) / epsilonY;
        if (Math.abs(derivativeY) < 1e-5) {
          break;
        }

        const shiftY = MathUtils.clamp(errorY / derivativeY, -size.y * 0.5, size.y * 0.5);
        targetY += shiftY;
        eyeY += shiftY;
      }
    }

    perspective.position.set(eyeX, eyeY, center.z + distance);
    perspective.near = Math.max(0.01, distance - Math.max(size.z, size.y, size.x) * 3);
    perspective.far = distance + Math.max(size.z, size.y, size.x) * 6;
    perspective.lookAt(targetX, targetY, center.z);
    perspective.updateProjectionMatrix();

    return true;
  }, [camera, targetRef, alignBottom, fitPadding, cameraYOffset, bottomAnchorNdc]);

  useLayoutEffect(() => {
    fitCamera();
  }, [fitCamera]);

  useEffect(() => {
    let rafId = 0;
    let retries = 0;

    const retryFit = () => {
      const fitted = fitCamera();
      retries += 1;

      if (!fitted && retries < 10) {
        rafId = requestAnimationFrame(retryFit);
      }
    };

    rafId = requestAnimationFrame(retryFit);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [fitCamera]);

  return null;
}

function GarmentModel({
  modelUrl,
  alignBottom = false,
  autoRotate = true,
  modelScale,
  modelYOffset,
  autoFit = true,
  fitPadding = 1.4,
  cameraYOffset = 0,
  bottomAnchorNdc = -0.78,
  garmentColor = '#a09998',
  selectedFabric,
  applyFabricTextures = true,
}: GarmentModelProps) {
  const effectiveFabric = applyFabricTextures ? selectedFabric : undefined;
  const { scene } = useGLTF(modelUrl);
  const [fabricTextureSet, setFabricTextureSet] = useState<FabricTextureSet | null>(null);
  const runtimeFabricMaterialRef = useRef<MeshStandardMaterial | null>(null);
  const warnedLowPolyRef = useRef(false);

  const normalizedScene = useMemo(() => {
    const root = scene.clone(true);

    root.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) {
        return;
      }

      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((material) => material.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
        mesh.userData.originalMaterial = mesh.material;
      }

      ensureMeshUv2ForAoMap(mesh);
    });

    const box = computeRobustMeshBounds(root);
    const fullBounds = new Box3().setFromObject(root);
    if (!box.isEmpty()) {
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);

      if (alignBottom) {
        // Keep horizontal centering while pinning the true mesh base to y=0.
        root.position.x -= center.x;
        const baseY = fullBounds.isEmpty() ? box.min.y : fullBounds.min.y;
        root.position.y -= baseY;
        root.position.z -= center.z;
      } else {
        root.position.sub(center);
      }

      root.scale.setScalar(1 / maxDim);
    }
    return root;
  }, [scene, alignBottom]);

  const meshSelection = useMemo(() => {
    const allMeshes: Mesh[] = [];
    const namedFabricMeshes: Mesh[] = [];

    normalizedScene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) {
        return;
      }

      allMeshes.push(mesh);
      if (isFabricMesh(mesh)) {
        namedFabricMeshes.push(mesh);
      }
    });

    const fabricMeshes = namedFabricMeshes.length > 0 ? namedFabricMeshes : allMeshes;

    return {
      allMeshes,
      fabricMeshes,
      fabricTriangleCount: countTriangles(fabricMeshes),
      usedFallbackSelection: namedFabricMeshes.length === 0,
    };
  }, [normalizedScene]);

  useEffect(() => {
    let cancelled = false;

    if (!effectiveFabric) {
      setFabricTextureSet(null);
      return;
    }

    const cached = fabricTextureCache.get(effectiveFabric.id);
    if (cached) {
      applyRepeat(cached, effectiveFabric.repeat);
      fabricTextureCache.delete(effectiveFabric.id);
      fabricTextureCache.set(effectiveFabric.id, cached);
      setFabricTextureSet(cached);
      return;
    }

    loadFabricTextureSet(effectiveFabric)
      .then((loadedTextureSet) => {
        if (cancelled) {
          disposeTextureSet(loadedTextureSet);
          return;
        }

        rememberTextureSet(effectiveFabric.id, loadedTextureSet);
        setFabricTextureSet(loadedTextureSet);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(`[GarmentViewer] Failed to load texture set for ${effectiveFabric.label}.`, error);
          setFabricTextureSet(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveFabric]);

  useEffect(() => {
    const tintColor = new Color(garmentColor);

    meshSelection.allMeshes.forEach((mesh) => {
      const originalMaterial = mesh.userData.originalMaterial as Material | Material[] | undefined;
      if (originalMaterial) {
        applyColorToMaterial(originalMaterial, tintColor);
        if (!effectiveFabric) {
          stripAlbedoMapsForSolidSwatch(originalMaterial);
        }
      }
    });

    if (runtimeFabricMaterialRef.current) {
      runtimeFabricMaterialRef.current.dispose();
      runtimeFabricMaterialRef.current = null;
    }

    if (!effectiveFabric || !fabricTextureSet) {
      meshSelection.fabricMeshes.forEach((mesh) => {
        const originalMaterial = mesh.userData.originalMaterial as Material | Material[] | undefined;
        if (originalMaterial) {
          mesh.material = originalMaterial;
        }
      });
      return;
    }

    const lowPoly = meshSelection.fabricTriangleCount < 10000;
    if (isDevMode && meshSelection.usedFallbackSelection) {
      console.warn('[GarmentViewer] No fabric mesh names matched, so fabric material is applied to all meshes.');
    }
    if (isDevMode && lowPoly && !warnedLowPolyRef.current) {
      console.warn('[GarmentViewer] Low poly garment detected (<10k triangles). Displacement map is disabled for stability.');
      warnedLowPolyRef.current = true;
    }

    meshSelection.fabricMeshes.forEach((m) => ensureMeshUv2ForAoMap(m));

    const missingUv2 = meshSelection.fabricMeshes.some((m) => !m.geometry?.attributes?.uv2);
    const aoTex = missingUv2 ? null : fabricTextureSet.aoMap;

    const material = new MeshStandardMaterial({
      // Albedo from fabric color map, tinted by garment swatch (map × color in Three.js).
      map: fabricTextureSet.colorMap,
      normalMap: fabricTextureSet.normalMap,
      normalScale: new Vector2(1.5, 1.5),
      roughnessMap: fabricTextureSet.roughnessMap,
      roughness: 1.0,
      displacementMap: lowPoly ? null : fabricTextureSet.displacementMap,
      displacementScale: lowPoly ? 0 : 0.02,
      aoMap: aoTex,
      aoMapIntensity: aoTex ? 1.0 : 0,
      metalness: 0.05,
      color: tintColor,
    });

    material.name = `fabric-material-${effectiveFabric.id}`;
    runtimeFabricMaterialRef.current = material;

    meshSelection.fabricMeshes.forEach((mesh) => {
      mesh.material = material;
    });

    return () => {
      material.dispose();
      if (runtimeFabricMaterialRef.current === material) {
        runtimeFabricMaterialRef.current = null;
      }
    };
  }, [meshSelection, effectiveFabric, fabricTextureSet, garmentColor]);

  useEffect(() => {
    return () => {
      if (runtimeFabricMaterialRef.current) {
        runtimeFabricMaterialRef.current.dispose();
        runtimeFabricMaterialRef.current = null;
      }
    };
  }, []);

  const groupRef = useRef<Group>(null);
  const resolvedScale = modelScale ?? 1;
  const resolvedYOffset = modelYOffset ?? 0;

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.55;
    }
  });

  return (
    <>
      <R3fGroup ref={groupRef} position={[0, resolvedYOffset, 0]}>
        <R3fPrimitive object={normalizedScene} scale={resolvedScale} />
      </R3fGroup>
      {autoFit && (
        <AutoFitCamera
          targetRef={groupRef}
          alignBottom={alignBottom}
          fitPadding={fitPadding}
          cameraYOffset={cameraYOffset}
          bottomAnchorNdc={bottomAnchorNdc}
        />
      )}
    </>
  );
}

export function GarmentViewer({
  modelUrl,
  garmentType = 'tshirt',
  className,
  alignBottom = false,
  transparentBackground = false,
  autoRotate = true,
  modelScale,
  modelYOffset,
  cameraPosition = [0, 1, 3],
  cameraFov = 45,
  autoFit = true,
  fitPadding = 1.4,
  cameraYOffset = 0,
  bottomAnchorNdc = -0.78,
  garmentColor,
  selectedFabric,
  applyFabricTextures = true,
}: GarmentViewerProps) {
  if (!modelUrl) {
    return <GarmentViewerSimple garmentType={garmentType} className={className} />;
  }

  const resolvedModelUrl = modelUrl;
  useGLTF.preload(resolvedModelUrl);

  return (
    <ModelErrorBoundary fallback={<GarmentViewerSimple garmentType={garmentType} className={className} />}>
      <div className={`${className ?? ''} overflow-hidden rounded-lg h-full w-full`}>
        <Canvas
          camera={{ position: cameraPosition, fov: cameraFov }}
          dpr={1}
          gl={{ antialias: false, powerPreference: 'low-power' }}
        >
          <R3fAmbientLight intensity={0.4} />
          <R3fDirectionalLight position={[5, 10, 5]} intensity={1.2} />
          <R3fDirectionalLight position={[-5, 5, -5]} intensity={0.4} />
          <R3fPointLight position={[0, 5, 3]} intensity={0.6} color={0xfff5e0} />

          <Suspense fallback={null}>
            <GarmentModel
              modelUrl={resolvedModelUrl}
              alignBottom={alignBottom}
              autoRotate={autoRotate}
              modelScale={modelScale}
              modelYOffset={modelYOffset}
              autoFit={autoFit}
              fitPadding={fitPadding}
              cameraYOffset={cameraYOffset}
              bottomAnchorNdc={bottomAnchorNdc}
              garmentColor={garmentColor}
              selectedFabric={selectedFabric}
              applyFabricTextures={applyFabricTextures}
            />
          </Suspense>

          {!transparentBackground && <R3fColor attach="background" args={["#f4f1f8"]} />}
        </Canvas>
      </div>
    </ModelErrorBoundary>
  );
}
