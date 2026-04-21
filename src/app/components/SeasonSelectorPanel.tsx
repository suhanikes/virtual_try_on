import { useCallback, useEffect, useRef, useState } from 'react';

interface SubSeason {
  name: string;
  colors: string[];
}

const ALL_SEASONS: Record<string, SubSeason[]> = {
  Spring: [
    {
      name: 'Clear Spring',
      colors: [
        '#FFF9D4', '#FFE200', '#CCE100', '#FFD05A', '#FFCB00', '#FFB400',
        '#FFA553', '#FF8565', '#FF7900', '#E920BA', '#A235C4', '#8F2AA0',
        '#005790', '#0081A8', '#008AB2', '#0091AD', '#00A899', '#59C7D8',
        '#B079CF', '#B15F00', '#CD4B00', '#766EC8', '#C7BBA4', '#EF0000',
        '#F90042', '#604526', '#493436',
      ],
    },
    {
      name: 'Warm Spring',
      colors: [
        '#FF9E85', '#FFD05A', '#FFE200', '#FFCB00', '#FFB400', '#FBB100',
        '#D8C200', '#C1D800', '#A3C30E', '#A7AD00', '#63AC41', '#47C530',
        '#00A242', '#00A899', '#00D0D5', '#3FD0B7', '#9595D8', '#A235C4',
        '#B15F00', '#C06651', '#6E4E37', '#1E3D8F', '#1261B1', '#EF0000',
        '#FF3F24', '#FF7900', '#FF8700', '#FFA553',
      ],
    },
    {
      name: 'Light Spring',
      colors: [
        '#FFF9D4', '#F2EB92', '#F9E09C', '#FFCDA3', '#FFC594', '#FFDA4B',
        '#D5EC8F', '#CDDFB7', '#93E2D3', '#95DEEA', '#8DCDEE', '#C9B3E8',
        '#E0A7E7', '#CCC7A3', '#D8BB86', '#E0B389', '#D59E70', '#C7A28F',
        '#645B54', '#857A77', '#D0C3AC', '#47C530', '#9595D8', '#FF8565',
        '#FFA553', '#FFA687', '#00D0D5', '#3FD0B7',
      ],
    },
  ],
  Summer: [
    {
      name: 'Light Summer',
      colors: [
        '#8DCDEE', '#86D9ED', '#B4CBE3', '#C1DCE8', '#F6B1CC', '#EA98E3',
        '#FF76B8', '#B295E1', '#93B9D7', '#9595D8', '#DA8FB9', '#C5BFB5',
        '#D2B4A5', '#A89280', '#818286', '#AB5ABA', '#D85ED6', '#FF6C99',
        '#5F88BB', '#2E6A95', '#60404B', '#5B5859', '#DFE6A0', '#FBEEB0',
        '#00D473', '#3FD0B7', '#0DC5EB', '#4EC8ED',
      ],
    },
    {
      name: 'Soft Summer',
      colors: [
        '#FF3F73', '#FF9EB6', '#FBBAC8', '#8DCDEE', '#3FD0B7', '#97B184',
        '#A89280', '#CAA2A8', '#818286', '#AB75A9', '#AB5ABA', '#AD5698',
        '#8C637B', '#806895', '#51738D', '#5083A8', '#6DA0B8', '#93B9D7',
        '#4EC8ED', '#A8A2C7', '#009FA8', '#E0C993', '#ECE0AB', '#CEC486',
        '#DBDDD1', '#AAAFAD', '#494A53', '#B73275',
      ],
    },
    {
      name: 'Cool Summer',
      colors: [
        '#FF90C9', '#BCBDBE', '#CAA2A8', '#FF76B8', '#F26FD2', '#D85ED6',
        '#AB75A9', '#818286', '#00A772', '#00B4BB', '#4EC8ED', '#00ADE5',
        '#0079CE', '#7D64B7', '#A235C4', '#A02892', '#BC005C', '#D1003A',
        '#F9007A', '#FF53A5', '#007883', '#007162', '#DFE6A0', '#ECE89C',
        '#BDBBD9', '#8C91AB', '#00315A', '#51738D',
      ],
    },
  ],
  Autumn: [
    {
      name: 'Warm Autumn',
      colors: [
        '#FFCB00', '#B6AA00', '#BD9C00', '#A2994F', '#8D9929', '#567F11',
        '#7C7352', '#A97200', '#B15F00', '#9D5E2D', '#AA4100', '#854A37',
        '#A8271A', '#604526', '#D45C16', '#FF3F24', '#FF6800', '#FF8600',
        '#E19800', '#E3256B', '#FF66CC', '#00A242', '#3DCDBA', '#00C3B5',
        '#00798E', '#006D32', '#005E3E', '#A2994F',
      ],
    },
    {
      name: 'Soft Autumn',
      colors: [
        '#FFD091', '#E2D1A2', '#B9C58C', '#A3AA7E', '#A2994F', '#89905E',
        '#997859', '#B68977', '#BE7E46', '#E98141', '#CF685B', '#D14725',
        '#9C6A54', '#9D5E2D', '#854A37', '#54463E', '#357C7D', '#40816F',
        '#CF8481', '#DC94A6', '#915D66', '#00A242', '#3DCDBA', '#D4A683',
        '#E0B389', '#FFA553', '#D49E41', '#F9E09C',
      ],
    },
    {
      name: 'Dark Autumn',
      colors: [
        '#E4A800', '#FF7900', '#D45C16', '#A97200', '#CF4300', '#A8271A',
        '#854A37', '#67503A', '#604526', '#5D6433', '#61832E', '#00A242',
        '#00A7AF', '#008AB2', '#0081A8', '#007883', '#005C73', '#A235C4',
        '#FF3F24', '#97005A', '#6D3134', '#871C25', '#650092', '#D391AC',
        '#B35D8F', '#9C3E6C', '#006D32', '#C1D800',
      ],
    },
  ],
  Winter: [
    {
      name: 'Bright Winter',
      colors: [
        '#F7E75B', '#00A7E8', '#0099CF', '#008AB2', '#0089DD', '#0079CE',
        '#0059BF', '#004D8C', '#003EAB', '#2A38A2', '#9400A4', '#B60094',
        '#BA0064', '#DA0082', '#F60087', '#F8006D', '#F90042', '#EEB3D5',
        '#F9ADD9', '#F9DAEA', '#E10030', '#D900B6', '#A235C4', '#009A73',
        '#005B4D', '#131413', '#FEFEFE', '#C4DAED',
      ],
    },
    {
      name: 'Cool Winter',
      colors: [
        '#FEFEFE', '#FCE48F', '#00CFED', '#00A7E8', '#0084BF', '#0089DD',
        '#0074D6', '#0059BF', '#004D8C', '#8F2AA0', '#A235C4', '#D900B6',
        '#EE0086', '#F8006D', '#E10030', '#BA0064', '#97005A', '#131313',
        '#494A53', '#818286', '#554289', '#009A73', '#00B4BB', '#93B9D7',
        '#86D9ED', '#FF90C9', '#0074D6', '#004D8C',
      ],
    },
    {
      name: 'Dark Winter',
      colors: [
        '#FEFEFE', '#FCE48F', '#B4CBE3', '#0099CF', '#0089DD', '#0081A8',
        '#006482', '#0059BF', '#004D8C', '#8F2AA0', '#A235C4', '#D900B6',
        '#EE0086', '#F8006D', '#E10030', '#BA0064', '#A8006A', '#97005A',
        '#650092', '#009A73', '#00A242', '#005B4D', '#002E76', '#001F66',
        '#131413', '#391700', '#EE0086', '#F8006D',
      ],
    },
  ],
};

// ── SVG wheel helpers ──────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(
  cx: number, cy: number, r: number, startAngle: number, endAngle: number
): string {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

// ── Color Wheel Card ───────────────────────────────────────────────────────────

interface ColorWheelFrameProps {
  season: SubSeason;
  isSelected: boolean;
  onClick: () => void;
  uploadedImageSrc?: string | null;
  avatarZoom: number;
  avatarOffsetX: number;
  avatarOffsetY: number;
  onAvatarPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
}

function ColorWheelFrame({
  season,
  isSelected,
  onClick,
  uploadedImageSrc,
  avatarZoom,
  avatarOffsetX,
  avatarOffsetY,
  onAvatarPointerDown,
}: ColorWheelFrameProps) {
  const W = 308;
  const H = 185;
  const rx = 16;
  const cx = W / 2;
  const cy = H / 2;
  const outerR = 220;
  const innerR = 54;
  const n = season.colors.length;
  const step = 360 / n;
  const startOffset = -90;

  const clipId = `clip-${season.name.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={onClick}
        className="relative cursor-pointer"
        style={{
          width: W,
          height: H,
          borderRadius: rx,
          overflow: 'hidden',
          boxShadow: isSelected
            ? '0px 0px 0px 2px white, 0px 0px 0px 5px #9e6aff, 0px 20px 25px -5px rgba(0,0,0,0.1)'
            : '0px 0px 0px 1px rgba(158,106,255,0.35)',
        }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={W} height={H} rx={rx} ry={rx} />
            </clipPath>
            <mask id={`mask-${clipId}`}>
              <rect x={0} y={0} width={W} height={H} fill="white" />
              <circle cx={cx} cy={cy} r={innerR} fill="black" />
            </mask>
          </defs>

          {/* Color wheel segments */}
          <g clipPath={`url(#${clipId})`} mask={`url(#mask-${clipId})`}>
            {season.colors.map((color, i) => {
              const a1 = startOffset + i * step;
              const a2 = startOffset + (i + 1) * step;
              return <path key={i} d={sectorPath(cx, cy, outerR, a1, a2)} fill={color} />;
            })}
          </g>

          {/* White center */}
          <circle cx={cx} cy={cy} r={innerR} fill="rgba(255,255,255,0.92)" clipPath={`url(#${clipId})`} />

          {!uploadedImageSrc && (
            <>
              {/* Person silhouette */}
              <circle cx={cx} cy={cy - 10} r={14} fill="#c8c0cc" clipPath={`url(#${clipId})`} />
              <ellipse cx={cx} cy={cy + 32} rx={22} ry={16} fill="#c8c0cc" clipPath={`url(#${clipId})`} />
            </>
          )}

          {/* Ring border */}
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={2} clipPath={`url(#${clipId})`} />

          {/* Sub-season label */}
          <text
            x={W - 10}
            y={H - 10}
            textAnchor="end"
            fontFamily="Cabin, sans-serif"
            fontSize={11.5}
            fontWeight={500}
            fill="#424242"
          >
            {season.name}
          </text>
        </svg>

        {uploadedImageSrc && (
          <div
            className="absolute overflow-hidden rounded-full border border-[rgba(255,255,255,0.85)] shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
            style={{
              left: cx - innerR,
              top: cy - innerR,
              width: innerR * 2,
              height: innerR * 2,
              touchAction: 'none',
              cursor: 'grab',
            }}
            onPointerDown={onAvatarPointerDown}
          >
            <img
              src={uploadedImageSrc}
              alt="Uploaded preview"
              draggable={false}
              className="h-full w-full object-cover select-none"
              style={{
                transform: `translate(${avatarOffsetX}px, ${avatarOffsetY}px) scale(${avatarZoom})`,
                transformOrigin: '50% 50%',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface SeasonSelectorPanelProps {
  mainSeason?: string;
  selectedSeason?: string;
  onSeasonChange?: (season: string) => void;
  uploadedImageSrc?: string | null;
}

export function SeasonSelectorPanel({
  mainSeason = 'Spring',
  selectedSeason,
  onSeasonChange,
  uploadedImageSrc,
}: SeasonSelectorPanelProps) {
  const subSeasons = ALL_SEASONS[mainSeason] ?? ALL_SEASONS['Spring'];
  const defaultSelected = selectedSeason ?? subSeasons[0].name;
  const [selected, setSelected] = useState(defaultSelected);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
  }, [uploadedImageSrc]);

  // Reset selected sub-season when main season changes
  const currentSubSeasons = ALL_SEASONS[mainSeason] ?? ALL_SEASONS['Spring'];
  const validSelected = currentSubSeasons.some(s => s.name === selected)
    ? selected
    : currentSubSeasons[0].name;

  const handleSelect = (name: string) => {
    setSelected(name);
    onSeasonChange?.(name);
  };

  const handleAvatarPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!uploadedImageSrc) {
      return;
    }
    event.preventDefault();
    dragRef.current = {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  }, [uploadedImageSrc]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current.active) {
        return;
      }
      const dx = event.clientX - dragRef.current.lastX;
      const dy = event.clientY - dragRef.current.lastY;
      dragRef.current.lastX = event.clientX;
      dragRef.current.lastY = event.clientY;
      setAvatarOffsetX((prev) => prev + dx);
      setAvatarOffsetY((prev) => prev + dy);
    };

    const stopDrag = () => {
      dragRef.current.active = false;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, []);

  return (
    <div
      className="absolute bg-[rgba(255,255,255,0.7)] border border-[rgba(243,232,255,0.5)] border-solid rounded-[24px]"
      style={{ left: 39, top: 129, width: 340, height: 719 }}
    >
      {/* Heading */}
      <div className="absolute left-[24px] top-[24px] flex items-center h-[32px]">
        <p
          className="text-[#424242] text-[14px] tracking-[0.7px] uppercase whitespace-nowrap"
          style={{
            fontFamily: "'Cabin', sans-serif",
            fontWeight: 700,
            fontVariationSettings: "'wdth' 100",
          }}
        >
          Select Season
        </p>
      </div>

      {uploadedImageSrc && (
        <div className="absolute right-[18px] top-[24px] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAvatarZoom((prev) => Math.min(3, prev + 0.08))}
            className="h-7 w-7 rounded-[8px] border border-[rgba(6,43,63,0.32)] bg-white text-[16px] leading-none text-[#1f3342]"
            aria-label="Zoom in season image"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setAvatarZoom((prev) => Math.max(0.65, prev - 0.08))}
            className="h-7 w-7 rounded-[8px] border border-[rgba(6,43,63,0.32)] bg-white text-[16px] leading-none text-[#1f3342]"
            aria-label="Zoom out season image"
            title="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => {
              setAvatarZoom(1);
              setAvatarOffsetX(0);
              setAvatarOffsetY(0);
            }}
            className="rounded-[8px] border border-[rgba(6,43,63,0.32)] bg-white px-2 py-1 text-[11px] font-semibold text-[#1f3342]"
            aria-label="Reset season image position"
            title="Reset"
          >
            Reset
          </button>
        </div>
      )}

      {/* Sub-season wheel cards */}
      <div className="absolute left-[16px] flex flex-col gap-[14px]" style={{ top: 72 }}>
        {currentSubSeasons.map((season) => (
          <ColorWheelFrame
            key={season.name}
            season={season}
            isSelected={validSelected === season.name}
            onClick={() => handleSelect(season.name)}
            uploadedImageSrc={uploadedImageSrc}
            avatarZoom={avatarZoom}
            avatarOffsetX={avatarOffsetX}
            avatarOffsetY={avatarOffsetY}
            onAvatarPointerDown={handleAvatarPointerDown}
          />
        ))}
      </div>
    </div>
  );
}
