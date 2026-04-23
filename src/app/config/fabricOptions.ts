import type { FabricOption } from "../types/fabric";

const textureFiles = Object.keys(
  import.meta.glob("/public/texture/**/*.{png,jpg,jpeg,webp,exr}", {
    eager: false,
  }),
);

const LABEL_OVERRIDES: Record<string, string> = {
  cotton: "Cotton",
  vest: "Puffer",
  plaid: "Plaid Tartan",
  denim: "Denim",
  "crepe_satin_4k.blend": "Satin",
  "curly_teddy_natural_4k.blend": "Fur",
  "velour_velvet_4k.blend": "Velvet",
};

const REPEAT_OVERRIDES: Record<string, [number, number]> = {
  cotton: [4, 4],
  vest: [2, 2],
  plaid: [1, 1],
  denim: [3, 3],
};

const DEFAULT_NORMAL_MAP = "/texture/cotton/Fabric060_1K-JPG_NormalGL.jpg";
const DEFAULT_ROUGHNESS_MAP = "/texture/cotton/Fabric060_1K-JPG_Roughness.jpg";
const DEFAULT_DISPLACEMENT_MAP = "/texture/cotton/Fabric060_1K-JPG_Displacement.jpg";

function toTitleCase(input: string): string {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sanitizeId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripTextureFolderDecorators(input: string): string {
  return input
    .replace(/\.blend$/i, "")
    .replace(/_?4k$/i, "")
    .replace(/_?2k$/i, "")
    .trim();
}

function folderKeyFromPath(filePath: string): string | null {
  const parts = filePath.split("/").filter(Boolean);
  const textureIdx = parts.indexOf("texture");
  if (textureIdx < 0 || textureIdx + 1 >= parts.length) {
    return null;
  }

  // We only treat first-level subfolders in /public/texture as fabric sets.
  return parts[textureIdx + 1];
}

function fileNameFromPath(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? "";
}

function hasToken(fileName: string, token: string): boolean {
  return fileName.includes(`${token}.`) || fileName.includes(`${token}_`);
}

type FileSet = {
  preview: string | null;
  color: string | null;
  normal: string | null;
  roughness: string | null;
  displacement: string | null;
};

function createEmptyFileSet(): FileSet {
  return {
    preview: null,
    color: null,
    normal: null,
    roughness: null,
    displacement: null,
  };
}

const grouped = new Map<string, FileSet>();

for (const filePath of textureFiles) {
  const folderKey = folderKeyFromPath(filePath);
  if (!folderKey) {
    continue;
  }

  const current = grouped.get(folderKey) ?? createEmptyFileSet();
  const fileName = fileNameFromPath(filePath).toLowerCase();
  const publicPath = filePath.replace(/^\/public/, "");

  if (hasToken(fileName, "_color") || hasToken(fileName, "_diff")) {
    current.color = publicPath;
    // Keep card preview aligned with the true fabric color/diffuse map.
    current.preview = publicPath;
  } else if (
    (fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".webp"))
    && !current.preview
  ) {
    current.preview = publicPath;
  } else if (
    hasToken(fileName, "_normalgl")
    || hasToken(fileName, "_normaldx")
    || hasToken(fileName, "_normal")
    || hasToken(fileName, "_nor_gl")
    || hasToken(fileName, "_nor")
  ) {
    current.normal = publicPath;
  } else if (
    hasToken(fileName, "_roughness")
    || hasToken(fileName, "_rough")
    || hasToken(fileName, "_spec_ior")
    || hasToken(fileName, "_specular")
  ) {
    current.roughness = publicPath;
  } else if (hasToken(fileName, "_displacement") || hasToken(fileName, "_disp") || hasToken(fileName, "_height")) {
    current.displacement = publicPath;
  }

  grouped.set(folderKey, current);
}

const discovered = Array.from(grouped.entries())
  .filter(([, fileSet]) => {
    // Must at least have a preview and color source; missing maps fall back to defaults.
    return Boolean(fileSet.preview && fileSet.color);
  })
  .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }))
  .map(([folderKey, fileSet]) => ({
    id: sanitizeId(folderKey),
    label: LABEL_OVERRIDES[folderKey] ?? toTitleCase(stripTextureFolderDecorators(folderKey)),
    previewUrl: fileSet.preview as string,
    repeat: REPEAT_OVERRIDES[folderKey] ?? [4, 4],
    maps: {
      colorMapUrl: fileSet.color as string,
      normalMapUrl: fileSet.normal ?? DEFAULT_NORMAL_MAP,
      roughnessMapUrl: fileSet.roughness ?? DEFAULT_ROUGHNESS_MAP,
      displacementMapUrl: fileSet.displacement ?? DEFAULT_DISPLACEMENT_MAP,
    },
  })) satisfies FabricOption[];

const fallback: FabricOption[] = [
  {
    id: "cotton",
    label: "Cotton",
    previewUrl: "/texture/cotton/Fabric060.png",
    repeat: [4, 4],
    maps: {
      colorMapUrl: "/texture/cotton/Fabric060_1K-JPG_Color.jpg",
      normalMapUrl: "/texture/cotton/Fabric060_1K-JPG_NormalGL.jpg",
      roughnessMapUrl: "/texture/cotton/Fabric060_1K-JPG_Roughness.jpg",
      displacementMapUrl: "/texture/cotton/Fabric060_1K-JPG_Displacement.jpg",
    },
  },
];

export const FABRIC_OPTIONS: FabricOption[] = discovered.length > 0 ? discovered : fallback;
