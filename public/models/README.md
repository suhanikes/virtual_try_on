# 3D Garment Models (GLB Files)

This directory is for storing your 3D garment models in GLB format.

## How to Add Your GLB Files

1. **Save your GLB files** to this directory (`public/models/`)

   Example structure:
   ```
   public/models/
   ├── crew-neck.glb
   ├── v-neck.glb
   ├── scoop-neck.glb
   ├── boat-neck.glb
   ├── square-neck.glb
   └── halter-neck.glb
   ```

2. **Update the ColorAnalysis component** to use your models:

   Open `src/imports/ColorAnalysis/ColorAnalysis.tsx` and update the `modelUrl` prop:

   ```tsx
   <GarmentViewer
     modelUrl="/models/crew-neck.glb"
     garmentType="crew-neck"
     className="w-full h-full rounded-lg bg-[rgba(229,218,246,0.2)]"
   />
   ```

## Alternative: Using External URLs

If your GLB files are hosted elsewhere, you can use external URLs:

```tsx
<GarmentViewer
  modelUrl="https://your-cdn.com/models/crew-neck.glb"
  garmentType="crew-neck"
  className="w-full h-full rounded-lg bg-[rgba(229,218,246,0.2)]"
/>
```

## Supported Formats

- `.glb` (Binary glTF) - Recommended
- `.gltf` (Text glTF) - Also supported

## Tips

- Keep file sizes reasonable (< 5MB per model) for faster loading
- Ensure models are properly centered and scaled
- You can adjust the scale in GarmentViewer.tsx if needed
- Models will be interactive (users can rotate with mouse)
