// EXAMPLE CONFIGURATION with free 3D models from CDN
// Copy this content to garmentStyles.ts to test with real 3D models

export interface GarmentStyle {
  id: string;
  name: string;
  modelUrl?: string;
  description?: string;
}

// Example using free models from various CDNs
// Replace these with your actual garment model URLs when ready
export const garmentStyles: GarmentStyle[] = [
  {
    id: 'crew-neck',
    name: 'Crew Neck',
    // Example: Replace with your crew neck model URL
    // modelUrl: 'https://cdn.example.com/models/crew-neck.glb',
    description: 'Classic round neckline'
  },
  {
    id: 'v-neck',
    name: 'V Neck',
    // Example: Replace with your v-neck model URL
    // modelUrl: 'https://cdn.example.com/models/v-neck.glb',
    description: 'V-shaped neckline'
  },
  {
    id: 'scoop-neck',
    name: 'Scoop Neck',
    // modelUrl: 'https://cdn.example.com/models/scoop-neck.glb',
    description: 'Wide, curved neckline'
  },
  {
    id: 'boat-neck',
    name: 'Boat Neck',
    // modelUrl: 'https://cdn.example.com/models/boat-neck.glb',
    description: 'Wide horizontal neckline'
  },
  {
    id: 'square-neck',
    name: 'Square Neck',
    // modelUrl: 'https://cdn.example.com/models/square-neck.glb',
    description: 'Square-shaped neckline'
  },
  {
    id: 'halter-neck',
    name: 'Halter Neck',
    // modelUrl: 'https://cdn.example.com/models/halter-neck.glb',
    description: 'Straps around the neck'
  },
  {
    id: 'off-shoulder',
    name: 'Off Shoulder',
    // modelUrl: 'https://cdn.example.com/models/off-shoulder.glb',
    description: 'Exposes shoulders'
  },
  {
    id: 'turtleneck',
    name: 'Turtleneck',
    // modelUrl: 'https://cdn.example.com/models/turtleneck.glb',
    description: 'High folded collar'
  },
];

export function getGarmentStyle(id: string): GarmentStyle | undefined {
  return garmentStyles.find(style => style.id === id);
}

/*
 * EXAMPLE SOURCES FOR FREE 3D CLOTHING MODELS:
 *
 * 1. Sketchfab (https://sketchfab.com)
 *    - Search: "t-shirt", "dress", "clothing"
 *    - Filter: Downloadable, Free
 *    - Download format: glTF Binary (.glb)
 *
 * 2. Poly Pizza (https://poly.pizza)
 *    - Simple, free 3D models
 *    - Already in glTF format
 *
 * 3. GitHub Three.js Examples
 *    - https://github.com/mrdoob/three.js/tree/master/examples/models
 *    - Use raw.githubusercontent.com URLs
 *
 * HOW TO USE EXTERNAL MODELS:
 *
 * 1. Find/create your GLB model
 * 2. Host it on:
 *    - Your own CDN
 *    - GitHub (use raw URL)
 *    - Cloud storage (Dropbox, Google Drive with direct link)
 * 3. Uncomment and add the URL to modelUrl property above
 * 4. The 3D viewer will automatically load and display it
 *
 * TESTING TIP:
 * Even without models, the viewer shows interactive placeholder geometry.
 * This lets you test the interface while preparing your actual models.
 */
