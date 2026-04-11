# 3D Garment Viewer Setup Guide

## Overview

Your Color Analysis page now includes an interactive 3D neckline testing section that can display garment models in GLB format. Users can rotate and view the garments from different angles to test how different necklines look with their color season.

## What's Been Set Up

### 1. **3D Rendering Components**
   - **GarmentViewer** (`src/app/components/GarmentViewer.tsx`)
     - Renders 3D models using React Three Fiber
     - Shows placeholder geometry when no model is loaded
     - Supports interactive rotation and zoom

   - **NecklineTesting** (`src/app/components/NecklineTesting.tsx`)
     - Integrated into the Color Analysis page
     - Displays two garment viewers side-by-side for comparison
     - Includes dropdown selectors to choose different neckline styles

### 2. **Configuration**
   - **garmentStyles.ts** (`src/app/config/garmentStyles.ts`)
     - Defines all available garment neckline styles
     - Easy to add/update model paths
     - Supports 8 different neckline types by default

### 3. **Directory Structure**
   ```
   public/
   └── models/           ← Place your GLB files here
       └── README.md     ← Instructions for adding models
   ```

## How to Add Your GLB Files

### Method 1: Local Files (Recommended)

1. **Save your GLB files** to `public/models/`
   ```
   public/models/
   ├── crew-neck.glb
   ├── v-neck.glb
   ├── scoop-neck.glb
   └── ... (other styles)
   ```

2. **Update the configuration** in `src/app/config/garmentStyles.ts`

   Uncomment and update the `modelUrl` for each style:
   ```typescript
   {
     id: 'crew-neck',
     name: 'Crew Neck',
     modelUrl: '/models/crew-neck.glb', // ← Uncomment this line
     description: 'Classic round neckline'
   }
   ```

3. **That's it!** The models will automatically load when users select them from the dropdown.

### Method 2: External URLs

If your GLB files are hosted on a CDN or external server:

```typescript
{
  id: 'crew-neck',
  name: 'Crew Neck',
  modelUrl: 'https://your-cdn.com/models/crew-neck.glb',
  description: 'Classic round neckline'
}
```

### Method 3: Import as Assets

1. Create `src/assets/models/` directory
2. Add GLB files there
3. Import in the config file:
   ```typescript
   import crewNeckModel from '../../assets/models/crew-neck.glb';

   {
     id: 'crew-neck',
     name: 'Crew Neck',
     modelUrl: crewNeckModel,
     description: 'Classic round neckline'
   }
   ```

## Available Garment Styles

The following neckline styles are pre-configured and ready for your GLB files:

1. **Crew Neck** - Classic round neckline
2. **V Neck** - V-shaped neckline
3. **Scoop Neck** - Wide, curved neckline
4. **Boat Neck** - Wide horizontal neckline
5. **Square Neck** - Square-shaped neckline
6. **Halter Neck** - Straps around the neck
7. **Off Shoulder** - Exposes shoulders
8. **Turtleneck** - High folded collar

### Adding More Styles

To add a new garment style, edit `src/app/config/garmentStyles.ts`:

```typescript
{
  id: 'cowl-neck',
  name: 'Cowl Neck',
  modelUrl: '/models/cowl-neck.glb',
  description: 'Draped, loose neckline'
}
```

## Customization

### Adjusting 3D View Settings

In `src/app/components/GarmentViewer.tsx`, you can modify:

- **Camera position**: `camera={{ position: [0, 0, 3], fov: 50 }}`
- **Lighting**: Adjust `ambientLight` and `directionalLight` intensity
- **Model scale**: Change `scale={1.5}` in the `<primitive>` component
- **Zoom limits**: Modify `minDistance` and `maxDistance` in `OrbitControls`

### Changing Placeholder Appearance

While models are loading or when no model is set, a placeholder 3D shape is shown. Customize it in the `PlaceholderGarment` function in `GarmentViewer.tsx`.

## Troubleshooting

### Models not showing up?

1. **Check file path**: Ensure the path in `modelUrl` matches the actual file location
2. **File format**: Verify files are `.glb` (binary) format, not `.gltf`
3. **File size**: Large files (>10MB) may take time to load
4. **Browser console**: Check for any loading errors

### Models appear too small/large?

Adjust the scale in `GarmentViewer.tsx`:
```tsx
<primitive object={scene} scale={2.0} /> // Increase for larger models
```

### Can't rotate models?

Make sure `OrbitControls` is enabled and the canvas has proper dimensions.

## Technical Details

### Installed Packages
- `three` - 3D rendering library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for React Three Fiber

### Performance Tips
- Keep GLB files under 5MB for fast loading
- Use compressed textures when possible
- Consider using low-poly models for better performance

## Next Steps

1. ✅ 3D viewer is set up and working
2. ✅ Configuration files are ready
3. ⏳ **Add your GLB files** to `public/models/`
4. ⏳ **Update paths** in `src/app/config/garmentStyles.ts`
5. ✅ Test the interactive neckline comparison feature!

---

If you have any questions or need to customize the setup further, the main files to edit are:
- `src/app/components/GarmentViewer.tsx` - 3D rendering logic
- `src/app/components/NecklineTesting.tsx` - UI and selection
- `src/app/config/garmentStyles.ts` - Model configuration
