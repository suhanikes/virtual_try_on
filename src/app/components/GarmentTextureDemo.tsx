import { useEffect } from 'react';
// @ts-expect-error Plain JS module without local type declarations.
import { init as initGarmentViewer } from './garment-viewer.js';

const DEMO_CANVAS_ID = 'garment-canvas';

export default function GarmentTextureDemo() {
  useEffect(() => {
    const viewer = initGarmentViewer(DEMO_CANVAS_ID);

    return () => {
      viewer?.dispose?.();
    };
  }, []);

  return (
    <section className="w-[360px] max-w-[92vw] rounded-2xl border border-white/20 bg-neutral-900/70 p-3 shadow-2xl backdrop-blur-sm">
      <div className="mb-2">
        <p className="text-xs font-semibold tracking-wide text-white/90">3D Fabric Switcher Demo</p>
      </div>
      <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-950">
        <canvas id={DEMO_CANVAS_ID} className="h-full w-full" />
      </div>
    </section>
  );
}
