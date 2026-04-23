import { Suspense, lazy, useEffect, useState } from "react";

const LazyColorAnalysis = lazy(() => import("../imports/ColorAnalysis/ColorAnalysis"));

export default function App() {
  const [scale, setScale] = useState(1);
  const [shouldMountColorAnalysis, setShouldMountColorAnalysis] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1517;
      const scaleY = window.innerHeight / 1194;
      const newScale = Math.min(1, scaleX, scaleY);
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let canceled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const mountHeavyApp = () => {
      if (canceled) {
        return;
      }
      setShouldMountColorAnalysis(true);
      window.removeEventListener("pointerdown", mountHeavyApp);
      window.removeEventListener("touchstart", mountHeavyApp);
      window.removeEventListener("keydown", mountHeavyApp);
      if (idleId !== null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(mountHeavyApp, { timeout: 800 });
    } else {
      timeoutId = window.setTimeout(mountHeavyApp, 350);
    }

    window.addEventListener("pointerdown", mountHeavyApp, { passive: true, once: true });
    window.addEventListener("touchstart", mountHeavyApp, { passive: true, once: true });
    window.addEventListener("keydown", mountHeavyApp, { once: true });

    return () => {
      canceled = true;
      window.removeEventListener("pointerdown", mountHeavyApp);
      window.removeEventListener("touchstart", mountHeavyApp);
      window.removeEventListener("keydown", mountHeavyApp);
      if (idleId !== null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white overflow-hidden">
      <div
        className="origin-center"
        style={{
          transform: `scale(${scale})`,
          width: '1517px',
          height: '1194px'
        }}
      >
        {shouldMountColorAnalysis ? (
          <Suspense fallback={<div className="size-full bg-white" />}>
            <LazyColorAnalysis />
          </Suspense>
        ) : (
          <div className="size-full bg-white" />
        )}
      </div>
    </div>
  );
}