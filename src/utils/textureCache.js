import * as THREE from "three";

const MAX_CACHE_SIZE = 2;
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

const TEXTURE_FILES = {
  map: "Color.jpg",
  normalMap: "NormalGL.jpg",
  roughnessMap: "Roughness.jpg",
  displacementMap: "Displacement.jpg",
  aoMap: "AmbientOcclusion.jpg",
};

const FABRIC_TEXTURE_KEYS = Object.keys(TEXTURE_FILES);
let cachePressureLogged = false;

function configureTexture(texture, isColorTexture) {
  // All fabric maps tile, so wrapping must be enabled on both axes.
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;

  if (isColorTexture) {
    if ("colorSpace" in texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    } else {
      texture.encoding = THREE.sRGBEncoding;
    }
  }

  texture.needsUpdate = true;
}

async function loadTexture(url, isColorTexture = false) {
  const texture = await textureLoader.loadAsync(url);
  configureTexture(texture, isColorTexture);
  return texture;
}

function markAsRecentlyUsed(cacheKey, textureSet) {
  textureCache.delete(cacheKey);
  textureCache.set(cacheKey, textureSet);
}

function isTextureInCache(texture) {
  for (const textureSet of textureCache.values()) {
    for (const key of FABRIC_TEXTURE_KEYS) {
      if (textureSet[key] === texture) {
        return true;
      }
    }
  }

  return false;
}

export function disposeTextureSet(textureSet) {
  if (!textureSet) {
    return;
  }

  FABRIC_TEXTURE_KEYS.forEach((key) => {
    const texture = textureSet[key];
    if (texture && typeof texture.dispose === "function") {
      texture.dispose();
    }
  });
}

function evictLeastRecentlyUsedTextureSet() {
  while (textureCache.size > MAX_CACHE_SIZE) {
    const lruKey = textureCache.keys().next().value;
    const lruTextureSet = textureCache.get(lruKey);

    disposeTextureSet(lruTextureSet);
    textureCache.delete(lruKey);

    if (import.meta.env.DEV) {
      console.warn(
        `[TextureCache] Evicted ${lruKey} from GPU cache. Only the most recent ${MAX_CACHE_SIZE} fabrics are kept.`
      );
    }
  }
}

function logCachePressureIfNeeded() {
  if (!import.meta.env.DEV) {
    return;
  }

  if (textureCache.size >= MAX_CACHE_SIZE && !cachePressureLogged) {
    console.warn(
      `[TextureCache] Cache reached ${MAX_CACHE_SIZE} fabrics. Loading another set will evict the least recently used textures.`
    );
    cachePressureLogged = true;
  }

  if (textureCache.size < MAX_CACHE_SIZE) {
    cachePressureLogged = false;
  }
}

export async function getOrLoadTextureSet(texturePath) {
  // Fast path: reuse already uploaded GPU textures for this fabric.
  const cached = textureCache.get(texturePath);
  if (cached) {
    markAsRecentlyUsed(texturePath, cached);
    return cached;
  }

  const entries = await Promise.all(
    Object.entries(TEXTURE_FILES).map(async ([key, fileName]) => {
      const texture = await loadTexture(`${texturePath}/${fileName}`, key === "map");
      return [key, texture];
    })
  );

  const textureSet = Object.fromEntries(entries);

  // Keep an LRU cache of the last two fabrics to reduce re-load stutter.
  markAsRecentlyUsed(texturePath, textureSet);
  evictLeastRecentlyUsedTextureSet();
  logCachePressureIfNeeded();

  return textureSet;
}

export function applyTextureRepeat(textureSet, repeatX, repeatY) {
  FABRIC_TEXTURE_KEYS.forEach((key) => {
    const texture = textureSet[key];
    if (!texture) {
      return;
    }

    texture.repeat.set(repeatX, repeatY);
    texture.needsUpdate = true;
  });
}

export function disposeMaterial(material, { disposeTextures = false } = {}) {
  if (!material) {
    return;
  }

  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((entry) => {
    if (!entry) {
      return;
    }

    if (disposeTextures) {
      // Only free textures that are not managed by the shared cache.
      [
        "map",
        "normalMap",
        "roughnessMap",
        "displacementMap",
        "aoMap",
        "metalnessMap",
        "alphaMap",
      ].forEach((textureKey) => {
        const texture = entry[textureKey];
        if (texture && !isTextureInCache(texture)) {
          texture.dispose();
        }
      });
    }

    entry.dispose();
  });
}

export function disposeTextureCache() {
  for (const textureSet of textureCache.values()) {
    disposeTextureSet(textureSet);
  }

  textureCache.clear();
  cachePressureLogged = false;
}

export function getTextureCacheDebugInfo() {
  return {
    size: textureCache.size,
    keys: Array.from(textureCache.keys()),
    maxSize: MAX_CACHE_SIZE,
  };
}
