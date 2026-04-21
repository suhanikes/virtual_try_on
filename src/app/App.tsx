import { useEffect, useState } from "react";
import ColorAnalysis from "../imports/ColorAnalysis/ColorAnalysis";

export default function App() {
  const [scale, setScale] = useState(1);

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
        <ColorAnalysis />
      </div>
    </div>
  );
}