# Quick Start: Using External 3D Models

Since you can't upload GLB files directly right now, here are temporary solutions to get 3D garment models working immediately.

## Option 1: Use External URLs

You can use GLB files hosted on external servers. Here are some sources:

### Free 3D Model Sources

1. **Sketchfab** (https://sketchfab.com)
   - Search for "clothing", "shirt", "dress", etc.
   - Download free models with CC license
   - Look for "Download 3D Model" button → Choose "glTF 2.0" format

2. **Poly Pizza** (https://poly.pizza)
   - Free 3D models in glTF format
   - Search for fashion/clothing items

3. **GitHub Raw URLs**
   - If you have GLB files in a GitHub repo
   - Use raw.githubusercontent.com URLs

### Example Configuration with External URLs

Edit `src/app/config/garmentStyles.ts`:

```typescript
export const garmentStyles: GarmentStyle[] = [
  {
    id: 'crew-neck',
    name: 'Crew Neck',
    modelUrl: 'https://example.com/models/crew-neck.glb',
    description: 'Classic round neckline'
  },
  {
    id: 'v-neck',
    name: 'V Neck',
    modelUrl: 'https://example.com/models/v-neck.glb',
    description: 'V-shaped neckline'
  },
  // ... more styles
];
```

## Option 2: Use Google Drive / Dropbox (with CORS workaround)

1. Upload your GLB files to Google Drive or Dropbox
2. Get a shareable link
3. Convert to direct download link:

   **Google Drive:**
   ```
   Original: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
   Direct:   https://drive.google.com/uc?export=download&id=FILE_ID
   ```

   **Dropbox:**
   ```
   Original: https://www.dropbox.com/s/FILE_ID/file.glb?dl=0
   Direct:   https://www.dropbox.com/s/FILE_ID/file.glb?dl=1
   ```

⚠️ **Note**: Some services have CORS restrictions. If models don't load, you may need to use a CORS proxy.

## Option 3: Base64 Encoding (Small Files Only)

For very small GLB files (<500KB):

1. Convert GLB to Base64 string
2. Use data URL in configuration:

```typescript
modelUrl: 'data:model/gltf-binary;base64,YOUR_BASE64_STRING_HERE'
```

This method is not recommended for production but works for testing.

## Option 4: Clone and Extend the Project

If you have access to the project repository:

1. Clone the repository to your local machine
2. Add GLB files to `public/models/`
3. Update the configuration file
4. Commit and push changes
5. Or run locally with `pnpm dev`

## Testing Right Now (No Models Needed!)

The viewer is already working with **placeholder 3D shapes**. You can:

1. Open the application
2. Go to the "Necklines Testing" section
3. Use the dropdowns to select different garment styles
4. See placeholder 3D geometry that you can rotate and interact with

The placeholders will automatically be replaced once you add real GLB model URLs.

## Recommended Next Steps

1. **Search for free clothing GLB models** on Sketchfab or Poly Pizza
2. **Test with one external URL** first to verify it works
3. **Prepare your actual garment models** for final upload
4. **Use placeholders** in the meantime - they're fully functional!

## Need Custom GLB Models?

If you need to create custom garment models:

### 3D Modeling Software (Free)
- **Blender** (https://www.blender.org) - Most popular, free and open source
- **CLO 3D** - Specialized for clothing (has free trial)
- **Marvelous Designer** - Professional garment design (has free trial)

### Export Settings for GLB
- Format: glTF 2.0 Binary (.glb)
- Include textures embedded
- Optimize for file size
- Center the model at origin
- Scale appropriately (1 unit = 1 meter typically)

---

**Remember**: The 3D viewer is fully functional right now with placeholders. You can continue developing other features while working on getting the actual GLB files ready!
