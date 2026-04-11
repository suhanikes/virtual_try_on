# Project Structure - 3D Garment Viewer

## File Organization

```
/tmp/sandbox/
│
├── 📄 QUICK_REFERENCE.md                    ← START HERE!
├── 📄 NECKLINE_TESTING_SUMMARY.md           ← Complete overview
├── 📄 GARMENT_VIEWER_SETUP.md               ← Detailed setup guide
├── 📄 QUICK_START_EXTERNAL_MODELS.md        ← External URL options
│
├── public/
│   └── models/                              ← PUT GLB FILES HERE
│       └── README.md                        ← Directory instructions
│
├── src/
│   ├── app/
│   │   ├── App.tsx                          ← Main app entry
│   │   │
│   │   ├── components/
│   │   │   ├── GarmentViewer.tsx            ← 3D rendering engine
│   │   │   ├── NecklineTesting.tsx          ← UI component (integrated)
│   │   │   └── SeasonSelectorPanel.tsx      ← Existing component
│   │   │
│   │   └── config/
│   │       ├── garmentStyles.ts             ← EDIT THIS TO ADD MODELS
│   │       └── garmentStyles.example.ts     ← Example configuration
│   │
│   ├── imports/
│   │   └── ColorAnalysis/
│   │       └── ColorAnalysis.tsx            ← Modified (uses NecklineTesting)
│   │
│   └── styles/
│       └── fonts.css                        ← Cabin font imports
│
└── package.json                              ← Dependencies installed
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         ColorAnalysis.tsx (Figma Import)              │ │
│  │                                                        │ │
│  │  ├── SeasonSelectorPanel (color wheels)               │ │
│  │  ├── Color Palette Grid                               │ │
│  │  ├── NecklineTesting ← YOU ARE HERE                   │ │
│  │  └── Fabric Guide                                     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              NecklineTesting.tsx                            │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  GarmentViewer   │         │  GarmentViewer   │         │
│  │  (Left Side)     │         │  (Right Side)    │         │
│  └──────────────────┘         └──────────────────┘         │
│  [Dropdown Menu ▼]            [Dropdown Menu ▼]            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              garmentStyles.ts                               │
│  [                                                          │
│    { id: 'crew-neck', modelUrl: '/models/crew-neck.glb' }, │
│    { id: 'v-neck', modelUrl: '/models/v-neck.glb' },       │
│    ...                                                      │
│  ]                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              GarmentViewer.tsx                              │
│                                                             │
│  ┌─ Has modelUrl? ────────────────────────┐                │
│  │                                         │                │
│  │  YES: Load GLB file                    │                │
│  │  └─→ useGLTF(modelUrl)                 │                │
│  │      └─→ Display 3D Model               │                │
│  │                                         │                │
│  │  NO: Show Placeholder                  │                │
│  │  └─→ PlaceholderGarment                │                │
│  │      └─→ Display 3D Boxes               │                │
│  │                                         │                │
│  └─────────────────────────────────────────┘                │
│                                                             │
│  Features:                                                  │
│  • OrbitControls (rotate/zoom)                              │
│  • Lighting (ambient + directional)                         │
│  • Suspense (loading states)                                │
│  • Error handling                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            Three.js / React Three Fiber                     │
│  • Renders 3D scene                                         │
│  • Handles WebGL                                            │
│  • Manages camera, lights, controls                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.tsx
  └── ColorAnalysis.tsx
        ├── SeasonSelectorPanel (color wheels)
        ├── Container (color palette grid)
        ├── NecklineTesting ← NEW
        │     ├── GarmentViewer (left)
        │     │     └── Canvas (Three.js)
        │     │           ├── GarmentModel or PlaceholderGarment
        │     │           ├── Lights
        │     │           └── OrbitControls
        │     │
        │     ├── GarmentViewer (right)
        │     │     └── Canvas (Three.js)
        │     │           ├── GarmentModel or PlaceholderGarment
        │     │           ├── Lights
        │     │           └── OrbitControls
        │     │
        │     ├── Dropdown (left)
        │     └── Dropdown (right)
        │
        └── FabricGuide
```

## Configuration Flow

```
1. Edit: src/app/config/garmentStyles.ts
   ↓
2. Add: modelUrl: '/models/your-file.glb'
   ↓
3. Place GLB file: public/models/your-file.glb
   ↓
4. NecklineTesting reads garmentStyles array
   ↓
5. Passes modelUrl to GarmentViewer
   ↓
6. GarmentViewer loads and displays model
   ↓
7. User sees 3D garment in browser
```

## State Management

```
NecklineTesting.tsx
  ├── selectedGarment (useState) → Left viewer
  ├── comparisonGarment (useState) → Right viewer
  └── garmentStyles (imported) → Dropdown options

GarmentViewer.tsx
  ├── Props: modelUrl, garmentType
  └── useGLTF (drei hook) → Loads 3D model
```

## Quick Edit Reference

### To Add a Model (Local File):
**File**: `src/app/config/garmentStyles.ts`
```typescript
{
  id: 'crew-neck',
  name: 'Crew Neck',
  modelUrl: '/models/crew-neck.glb', // ← Uncomment or add
}
```
**File**: Place GLB in `public/models/crew-neck.glb`

### To Add a Model (External URL):
**File**: `src/app/config/garmentStyles.ts`
```typescript
{
  id: 'crew-neck',
  name: 'Crew Neck',
  modelUrl: 'https://example.com/crew-neck.glb', // ← Add URL
}
```

### To Add a New Style:
**File**: `src/app/config/garmentStyles.ts`
```typescript
export const garmentStyles: GarmentStyle[] = [
  // ... existing styles ...
  {
    id: 'new-style',
    name: 'New Style',
    modelUrl: '/models/new-style.glb',
    description: 'Description here'
  }
];
```

## Dependencies

Installed packages (in package.json):
- `three@^0.183.2` - 3D rendering library
- `@react-three/fiber@^9.5.0` - React renderer
- `@react-three/drei@^10.7.7` - Helper components

## Next Actions

1. **Test Now**: Open app, see placeholder 3D shapes working
2. **Add Models**: When ready, use one of three methods above
3. **Customize**: Edit GarmentViewer.tsx for different lighting/camera
4. **Expand**: Add more garment styles in garmentStyles.ts

---

**Everything is connected and working!** Start with QUICK_REFERENCE.md for immediate next steps.
