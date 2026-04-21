export type RGB = { r: number; g: number; b: number };
export type OKLab = { L: number; a: number; b: number };
export type OKLCH = { L: number; C: number; h: number };

export interface RecolorResult {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  previewHex?: string;
}

const MIN_CHROMA_FOR_HUE = 0.03;
const NEAR_NEUTRAL_DARK_MEAN_C_THRESHOLD = 0.06;
const NEUTRAL_TARGET_CHROMA_THRESHOLD = 0.08;
const WHITE_LIGHTNESS_THRESHOLD = 0.9;

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function srgbToLinear(value: number): number {
  const v = clamp(value, 0, 255) / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(value: number): number {
  const v = clamp(value, 0, 1);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

export function rgbToOKLab(rgb: RGB): OKLab {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function okLabToOKLCH(oklab: OKLab): OKLCH {
  const C = Math.hypot(oklab.a, oklab.b);
  let h = 0;
  if (C > 0.0001) {
    h = (Math.atan2(oklab.b, oklab.a) * 180) / Math.PI;
    if (h < 0) h += 360;
  }
  return { L: oklab.L, C, h };
}

export function rgbToOKLCH(rgb: RGB): OKLCH {
  return okLabToOKLCH(rgbToOKLab(rgb));
}

export function okLCHToOKLab(lch: OKLCH): OKLab {
  const hRad = (lch.h * Math.PI) / 180;
  return {
    L: lch.L,
    a: lch.C * Math.cos(hRad),
    b: lch.C * Math.sin(hRad),
  };
}

export function okLabToRGB(oklab: OKLab): RGB {
  const l_ = oklab.L + 0.3963377774 * oklab.a + 0.2158037573 * oklab.b;
  const m_ = oklab.L - 0.1055613458 * oklab.a - 0.0638541728 * oklab.b;
  const s_ = oklab.L - 0.0894841775 * oklab.a - 1.291485548 * oklab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: Math.round(linearToSrgb(r) * 255),
    g: Math.round(linearToSrgb(g) * 255),
    b: Math.round(linearToSrgb(b) * 255),
  };
}

export function oklchToRGB(lch: OKLCH): RGB {
  return okLabToRGB(okLCHToOKLab(lch));
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error("Hex color must be 6 chars like #ff3366");
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function b64ToUint8Mask(maskB64: string): Uint8Array {
  const binary = atob(maskB64);
  const len = binary.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function computeMaskedMeanLCH(
  srcData: Uint8ClampedArray,
  mask: Uint8Array | Uint8ClampedArray,
  pixelCount: number,
): OKLCH {
  let sumL = 0;
  let sumC = 0;
  let sumSin = 0;
  let sumCos = 0;
  let hueCount = 0;
  let count = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (mask[i] === 0) continue;
    const idx = i * 4;
    const lch = rgbToOKLCH({
      r: srcData[idx],
      g: srcData[idx + 1],
      b: srcData[idx + 2],
    });

    sumL += lch.L;
    sumC += lch.C;
    count++;

    if (lch.C >= MIN_CHROMA_FOR_HUE) {
      const rad = (lch.h * Math.PI) / 180;
      sumSin += Math.sin(rad);
      sumCos += Math.cos(rad);
      hueCount++;
    }
  }

  if (count === 0) return { L: 0, C: 0, h: 0 };

  const meanL = sumL / count;
  const meanC = sumC / count;
  let meanH = hueCount > 0 ? (Math.atan2(sumSin, sumCos) * 180) / Math.PI : 0;
  if (meanH < 0) meanH += 360;

  return { L: meanL, C: meanC, h: meanH };
}

function computeMaskedLightnessRange(
  srcData: Uint8ClampedArray,
  mask: Uint8Array | Uint8ClampedArray,
  pixelCount: number,
): { minL: number; maxL: number } {
  let minL = 1;
  let maxL = 0;
  let found = false;

  for (let i = 0; i < pixelCount; i++) {
    if (mask[i] === 0) continue;
    const idx = i * 4;
    const lch = rgbToOKLCH({
      r: srcData[idx],
      g: srcData[idx + 1],
      b: srcData[idx + 2],
    });
    if (lch.L < minL) minL = lch.L;
    if (lch.L > maxL) maxL = lch.L;
    found = true;
  }

  if (!found) {
    return { minL: 0, maxL: 0 };
  }

  return { minL, maxL };
}

export function recolorGarmentOKLCH(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  mask: Uint8Array | Uint8ClampedArray,
  target: string | RGB | OKLCH,
): RecolorResult {
  const pixelCount = width * height;
  if (srcData.length !== pixelCount * 4) throw new Error("srcData size mismatch");
  if (mask.length !== pixelCount) throw new Error("mask size mismatch");

  const isOKLCH = (v: any): v is OKLCH =>
    v && typeof v.L === "number" && typeof v.C === "number" && typeof v.h === "number";

  const targetLCH: OKLCH =
    typeof target === "string"
      ? rgbToOKLCH(hexToRgb(target))
      : isOKLCH(target)
      ? target
      : rgbToOKLCH(target);

  const targetHue = targetLCH.h;
  const targetChroma = clamp(targetLCH.C, 0, 0.4);
  const targetLightness = clamp(targetLCH.L, 0, 1);
  const neutralTarget = targetChroma <= NEUTRAL_TARGET_CHROMA_THRESHOLD;

  const sourceMeanLCH = computeMaskedMeanLCH(srcData, mask, pixelCount);
  const sourceLightnessRange = computeMaskedLightnessRange(srcData, mask, pixelCount);
  const safeRange = Math.max(sourceLightnessRange.maxL - sourceLightnessRange.minL, 1e-6);
  const isNearNeutralDarkGarment = sourceMeanLCH.C < NEAR_NEUTRAL_DARK_MEAN_C_THRESHOLD;

  const out = new Uint8ClampedArray(srcData.length);

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let garmentCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = srcData[idx];
    const g = srcData[idx + 1];
    const b = srcData[idx + 2];
    const a = srcData[idx + 3];

    if (mask[i] === 0) {
      out[idx] = r;
      out[idx + 1] = g;
      out[idx + 2] = b;
      out[idx + 3] = a;
      continue;
    }

    const lch = rgbToOKLCH({ r, g, b });

    if (neutralTarget) {
      const isWhiteLikeTarget = targetLightness >= WHITE_LIGHTNESS_THRESHOLD;
      const normalizedL = clamp((lch.L - sourceLightnessRange.minL) / safeRange, 0, 1);
      const darkestAllowed = isWhiteLikeTarget
        ? clamp(targetLightness - 0.18, 0, 1)
        : clamp(targetLightness - 0.2, 0, 1);
      lch.L = clamp(darkestAllowed + normalizedL * (targetLightness - darkestAllowed), 0, 1);
      const neutralChromaScale = isWhiteLikeTarget ? 0.12 : 0.25;
      const neutralChromaCap = isWhiteLikeTarget ? 0.018 : 0.06;
      lch.C = clamp(targetChroma * neutralChromaScale, 0, neutralChromaCap);
    } else {
      const deltaL = lch.L - sourceMeanLCH.L;
      lch.L = clamp(targetLightness + deltaL, 0, 1);

      if (isNearNeutralDarkGarment) {
        const lContrastFactor = clamp(1 + (lch.L - targetLightness) * 0.8, 0.75, 1.25);
        lch.C = clamp(targetChroma * lContrastFactor, 0, 0.4);
      } else {
        const safeMeanC = sourceMeanLCH.C > 1e-6 ? sourceMeanLCH.C : 1e-6;
        const chromaRatio = clamp(lch.C / safeMeanC, 0.55, 1.45);
        lch.C = clamp(targetChroma * chromaRatio, 0, 0.4);
      }
    }

    lch.h = targetHue;
    if (lch.C < MIN_CHROMA_FOR_HUE) lch.h = targetHue;

    const nrgb = oklchToRGB(lch);
    const nr = clamp(Math.round(nrgb.r), 0, 255);
    const ng = clamp(Math.round(nrgb.g), 0, 255);
    const nb = clamp(Math.round(nrgb.b), 0, 255);

    out[idx] = nr;
    out[idx + 1] = ng;
    out[idx + 2] = nb;
    out[idx + 3] = a;

    sumR += nr;
    sumG += ng;
    sumB += nb;
    garmentCount++;
  }

  const previewHex =
    garmentCount > 0
      ? rgbToHex({
          r: Math.round(sumR / garmentCount),
          g: Math.round(sumG / garmentCount),
          b: Math.round(sumB / garmentCount),
        })
      : undefined;

  return { data: out, width, height, previewHex };
}

export function applyDressRecolorFromPalette(
  imageData: ImageData,
  garmentMaskB64: string,
  selectedPaletteHex: string,
): ImageData {
  const mask = b64ToUint8Mask(garmentMaskB64);

  const result = recolorGarmentOKLCH(
    imageData.data,
    imageData.width,
    imageData.height,
    mask,
    selectedPaletteHex,
  );

  return new ImageData(result.data, result.width, result.height);
}

