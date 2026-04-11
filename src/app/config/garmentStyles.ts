// Configuration for neckline cards and virtual try-on garment models.
// Any .glb/.gltf file added under public/models is auto-discovered.

export interface GarmentStyle {
  id: string;
  name: string;
  modelUrl?: string;
  description?: string;
}

const discoveredModelModules = import.meta.glob('/public/models/**/*', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const MODEL_FILE_EXTENSION = /\.(glb|gltf)$/i;

function toDisplayName(baseName: string): string {
  return baseName
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toBaseId(baseName: string, index: number): string {
  const slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `garment-${index + 1}`;
}

function buildDiscoveredGarmentStyles(): GarmentStyle[] {
  const usedIds = new Map<string, number>();

  return Object.entries(discoveredModelModules)
    .filter(([filePath]) => MODEL_FILE_EXTENSION.test(filePath))
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }))
    .map(([filePath, assetUrl], index) => {
      const fileName = filePath.split('/').pop() ?? `garment-${index + 1}.glb`;
      const baseName = fileName.replace(/\.[^.]+$/, '').trim();

      const baseId = toBaseId(baseName, index);
      const nextCount = (usedIds.get(baseId) ?? 0) + 1;
      usedIds.set(baseId, nextCount);

      const uniqueId = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;

      return {
        id: uniqueId,
        name: toDisplayName(baseName),
        modelUrl: assetUrl,
        description: `Model file: ${fileName}`,
      };
    });
}

const discoveredGarmentStyles = buildDiscoveredGarmentStyles();

const fallbackGarmentStyles: GarmentStyle[] = [
  {
    id: 'crew-neck',
    name: 'Crew Neck',
    description: 'Classic round neckline',
  },
  {
    id: 'v-neck',
    name: 'V Neck',
    description: 'V-shaped neckline',
  },
  {
    id: 'scoop-neck',
    name: 'Scoop Neck',
    description: 'Wide, curved neckline',
  },
];

export const garmentStyles: GarmentStyle[] =
  discoveredGarmentStyles.length > 0 ? discoveredGarmentStyles : fallbackGarmentStyles;

// Example of how to get a garment style by ID
export function getGarmentStyle(id: string): GarmentStyle | undefined {
  return garmentStyles.find(style => style.id === id);
}
