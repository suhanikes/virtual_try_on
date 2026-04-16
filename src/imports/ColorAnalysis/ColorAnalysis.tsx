import svgPaths from "./svg-6yqrwznnmc";
import { imgGroup, imgGroup1, imgGroup2 } from "./svg-ujm6c";
import { SeasonSelectorPanel } from "../../app/components/SeasonSelectorPanel";
import { NecklineTesting } from "../../app/components/NecklineTesting";
import { TryOnPreviewCard } from "../../app/components/TryOnPreviewCard";
import { garmentStyles } from "../../app/config/garmentStyles";
import type { FabricOption } from "../../app/types/fabric";
import { useCallback, useEffect, useState } from "react";

const PALETTE_COLORS = [
  "#fffffa", "#fffff0", "#f0eada", "#e3dac9", "#c7bba4", "#d7d2cb", "#cac1b4", "#c0b5aa",
  "#a09998", "#8d918d", "#4f3835", "#5a3e36", "#3d4849", "#262e2f", "#000080", "#191970",
  "#3399ff", "#4169e1", "#8c00fa", "#766ec8", "#5a4fcf", "#7df9ff", "#00f0f0", "#3fe0d0",
  "#00af9d", "#009473", "#149c88", "#008381", "#9acd32", "#32cd32", "#4cbb17", "#0b6623",
  "#fff44f", "#ffff31", "#ffd662", "#ffc66e", "#f6c324", "#f5b31e", "#cc7722", "#d18e54",
  "#ff6e6e", "#f96714", "#f94d00", "#e74a33", "#ff6347", "#ff4040", "#ff0800", "#b93a32",
  "#f3bbca", "#f6909d", "#e35c7d", "#ee6d8a", "#ff66cc", "#e0218a", "#e3256b", "#e30b5d",
] as const;

function normalizeColor(color: string) {
  return color.trim().toLowerCase();
}

const RECOMMENDED_SHADES_STORAGE_KEY = "recommended-shades";

const FABRIC_OPTIONS: FabricOption[] = [
  {
    id: "fabric060",
    label: "Cotton",
    previewUrl: "/texture/cotton/Fabric060.png",
    repeat: [4, 4],
    maps: {
      colorMapUrl: "/texture/cotton/Fabric060_1K-JPG_Color.jpg",
      normalMapUrl: "/texture/cotton/Fabric060_1K-JPG_NormalGL.jpg",
      roughnessMapUrl: "/texture/cotton/Fabric060_1K-JPG_Roughness.jpg",
      displacementMapUrl: "/texture/cotton/Fabric060_1K-JPG_Displacement.jpg",
      aoMapUrl: "/texture/cotton/Fabric060_1K-JPG_AmbientOcclusion.jpg",
    },
  },
  {
    id: "fabric048",
    label: "Quilted Puffer",
    previewUrl: "/texture/vest/Fabric048.png",
    repeat: [2, 2],
    maps: {
      colorMapUrl: "/texture/vest/Fabric048_1K-JPG_Color.jpg",
      normalMapUrl: "/texture/vest/Fabric048_1K-JPG_NormalGL.jpg",
      roughnessMapUrl: "/texture/vest/Fabric048_1K-JPG_Roughness.jpg",
      displacementMapUrl: "/texture/vest/Fabric048_1K-JPG_Displacement.jpg",
      aoMapUrl: "/texture/vest/Fabric048_1K-JPG_AmbientOcclusion.jpg",
    },
  },
  {
    id: "fabric045",
    label: "Boucle",
    previewUrl: "/texture/pile/Fabric045.png",
    repeat: [4, 4],
    maps: {
      colorMapUrl: "/texture/pile/Fabric045_1K-JPG_Color.jpg",
      normalMapUrl: "/texture/pile/Fabric045_1K-JPG_NormalGL.jpg",
      roughnessMapUrl: "/texture/pile/Fabric045_1K-JPG_Roughness.jpg",
      displacementMapUrl: "/texture/pile/Fabric045_1K-JPG_Displacement.jpg",
      aoMapUrl: "/texture/pile/Fabric045_1K-JPG_AmbientOcclusion.jpg",
    },
  },
  {
    id: "fabric080",
    label: "Plaid Tartan",
    previewUrl: "/texture/plaid/Fabric080.png",
    repeat: [1, 1],
    maps: {
      colorMapUrl: "/texture/plaid/Fabric080_1K-JPG_Color.jpg",
      normalMapUrl: "/texture/plaid/Fabric080_1K-JPG_NormalGL.jpg",
      roughnessMapUrl: "/texture/plaid/Fabric080_1K-JPG_Roughness.jpg",
      displacementMapUrl: "/texture/plaid/Fabric080_1K-JPG_Displacement.jpg",
    },
  },
  {
    id: "fabric061",
    label: "Panama Weave",
    previewUrl: "/texture/wool/Fabric061.png",
    repeat: [5, 5],
    maps: {
      colorMapUrl: "/texture/wool/Fabric061_1K-JPG_Color.jpg",
      normalMapUrl: "/texture/wool/Fabric061_1K-JPG_NormalGL.jpg",
      roughnessMapUrl: "/texture/wool/Fabric061_1K-JPG_Roughness.jpg",
      displacementMapUrl: "/texture/wool/Fabric061_1K-JPG_Displacement.jpg",
      aoMapUrl: "/texture/wool/Fabric061_1K-JPG_AmbientOcclusion.jpg",
    },
  },
  {
    id: "fabric077",
    label: "Denim",
    previewUrl: "/texture/denim/Fabric077.png",
    repeat: [3, 3],
    maps: {
      colorMapUrl: "/texture/denim/Fabric077_1K-JPG_Color.jpg",
      normalMapUrl: "/texture/denim/Fabric077_1K-JPG_NormalGL.jpg",
      roughnessMapUrl: "/texture/denim/Fabric077_1K-JPG_Roughness.jpg",
      displacementMapUrl: "/texture/denim/Fabric077_1K-JPG_Displacement.jpg",
    },
  },
];

const DEFAULT_FABRIC_ID = "fabric060";
const DEFAULT_FABRIC = FABRIC_OPTIONS.find((fabric) => fabric.id === DEFAULT_FABRIC_ID) ?? FABRIC_OPTIONS[0];

function loadRecommendedShadesFromStorage() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(RECOMMENDED_SHADES_STORAGE_KEY);
    if (!raw) {
      return [] as string[];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [] as string[];
    }

    const deduped: string[] = [];
    const seen = new Set<string>();

    for (const value of parsed) {
      if (typeof value !== "string") {
        continue;
      }

      const normalized = normalizeColor(value);
      if (!normalized || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      deduped.push(value);
    }

    return deduped;
  } catch {
    return [] as string[];
  }
}

function ColorPaletteInteractionOverlay({
  selectedColor,
  onColorSelect,
}: {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}) {
  return (
    <div className="absolute left-0 top-0 z-20 h-[354.262px] w-[405.921px]">
      {PALETTE_COLORS.map((color, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const left = col * 51.66;
        const top = row * 51.66;
        const isSelected = selectedColor.toLowerCase() === color.toLowerCase();

        return (
          <button
            key={`${color}-${index}`}
            type="button"
            aria-label={`Select color ${color}`}
            onClick={() => onColorSelect(color)}
            className="absolute h-[44.282px] w-[44.282px] rounded-[2px]"
            style={{
              left,
              top,
              boxShadow: isSelected
                ? "0 0 0 2px rgba(158,106,255,0.95), 0 0 0 4px rgba(255,255,255,0.95)"
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function Icon() {
  return (
    <div
      className="relative shrink-0 size-[21px]"
      data-name="Icon"
    >
      <svg
        className="absolute block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 21 21"
      >
        <g id="Icon">
          <path
            d={svgPaths.p444d0a0}
            id="Vector"
            stroke="var(--stroke-0, #D0D0D0)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
          <path
            d={svgPaths.p33b56700}
            id="Vector_2"
            stroke="var(--stroke-0, #D0D0D0)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </g>
      </svg>
    </div>
  );
}

function Container4() {
  return (
    <div
      className="absolute content-stretch flex items-center justify-center left-0 rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] size-[32px] top-0"
      data-name="Container"
    >
      <Icon />
    </div>
  );
}

function Heading1() {
  return (
    <div
      className="absolute content-stretch flex h-[20px] items-start left-[38px] top-[6px] w-[116.711px]"
      data-name="Heading 3"
    >
      <p
        className="font-['Cabin:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[#424242] text-[14px] tracking-[0.7px] uppercase whitespace-nowrap"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        About Season
      </p>
    </div>
  );
}

function Container3() {
  return (
    <div
      className="absolute h-[32px] left-[24px] top-[24px] w-[290px]"
      data-name="Container"
    >
      <Container4 />
      <Heading1 />
    </div>
  );
}

function Paragraph() {
  return (
    <div
      className="absolute h-[22.75px] left-[24px] top-[72px] w-[290px]"
      data-name="Paragraph"
    >
      <p
        className="absolute font-['Cabin:Regular',sans-serif] font-normal leading-[22.75px] left-0 text-[#6a7282] text-[14px] top-[0.5px] whitespace-nowrap"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Bright, clear colors with warm undertones
      </p>
    </div>
  );
}

function Text() {
  return (
    <div
      className="h-[16px] relative shrink-0 w-[60.211px]"
      data-name="Text"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p
          className="absolute font-['Cabin:Medium',sans-serif] font-medium leading-[16px] left-0 text-[#6a7282] text-[12px] top-[0.5px] whitespace-nowrap"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Total Colors
        </p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div
      className="h-[20px] relative shrink-0 w-[60.273px]"
      data-name="Text"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p
          className="absolute font-['Cabin:Bold',sans-serif] font-bold leading-[20px] left-0 text-[#d0d0d0] text-[14px] top-[0.5px] whitespace-nowrap"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          56 shades
        </p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div
      className="content-stretch flex h-[20px] items-center justify-between relative shrink-0 w-full"
      data-name="Container"
    >
      <Text />
      <Text1 />
    </div>
  );
}

function Container5() {
  return (
    <div
      className="absolute content-stretch flex flex-col h-[37px] items-start left-[24px] pt-[17px] top-[110.75px] w-[290px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[#e9d4ff] border-solid border-t inset-0 pointer-events-none"
      />
      <Container6 />
    </div>
  );
}

function Container2() {
  return (
    <div
      className="absolute border border-[rgba(229,218,246,0.68)] border-solid h-[173.75px] left-[7px] rounded-[24px] top-[749px] w-[340px]"
      data-name="Container"
    >
      <Container3 />
      <Paragraph />
      <Container5 />
    </div>
  );
}

function Container1() {
  return (
    <div
      className="absolute h-[1195.172px] left-0 top-0 w-[354.922px]"
      data-name="Container"
    >
      <Container2 />
    </div>
  );
}

function Container7() {
  return (
    <div
      className="absolute h-[1195.172px] left-[1061.96px] top-0 w-[1.044px]"
      data-name="Container"
    />
  );
}

function ImageStyleReference() {
  return (
    <div
      className="absolute h-[561.157px] left-0 top-0 w-[584.539px]"
      data-name="Image (Style reference)"
    />
  );
}

function Container9() {
  return (
    <div
      className="absolute bg-[#f3f4f6] h-[561.157px] left-0 top-0 w-[596.229px]"
      data-name="Container"
    >
      <ImageStyleReference />
    </div>
  );
}

function Container8({
  selectedGarmentId,
  selectedColor,
  selectedFabricTexture,
  isSelectedColorRecommended,
  onToggleSelectedColorRecommendation,
  dressRecoloringMode,
  onDressRecoloringModeChange,
}: {
  selectedGarmentId: string;
  selectedColor: string;
  selectedFabricTexture?: FabricOption;
  isSelectedColorRecommended: boolean;
  onToggleSelectedColorRecommendation: () => void;
  dressRecoloringMode: boolean;
  onDressRecoloringModeChange: (next: boolean) => void;
}) {
  return (
    <TryOnPreviewCard
      selectedGarmentId={selectedGarmentId}
      garmentColor={selectedColor}
      selectedFabric={selectedFabricTexture}
      isColorLiked={isSelectedColorRecommended}
      onToggleColorLike={onToggleSelectedColorRecommendation}
      dressRecoloringMode={dressRecoloringMode}
      onDressRecoloringModeChange={onDressRecoloringModeChange}
    />
  );
}

// Neckline testing section now handled by NecklineTesting component

function Heading3() {
  return (
    <div
      className="h-[20px] relative shrink-0 w-[104.922px]"
      data-name="Heading 3"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p
          className="font-['Cabin:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[#4a465f] text-[13px] tracking-[0.7px] uppercase whitespace-nowrap"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Fabric Guide
        </p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div
      className="absolute content-stretch flex h-[32px] items-center left-[24px] top-[24px] w-[310px]"
      data-name="Container"
    >
      <Heading3 />
    </div>
  );
}

function Container17() {
  return (
    <div
      className="absolute bg-[#f3f4f6] left-0 size-[74.175px] top-0"
      data-name="Container"
    />
  );
}

function Text2() {
  return (
    <div
      className="h-[12.45px] shrink-0 w-[27.039px]"
      data-name="Text"
    />
  );
}

function Container18() {
  return (
    <div
      className="absolute bg-[rgba(0,0,0,0)] content-stretch flex items-center justify-center left-0 size-[74.175px] top-0"
      data-name="Container"
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img
          alt=""
          className="absolute max-w-none object-cover opacity-90 size-full"
          src="/fabrics/silk.jpg"
        />
      </div>
      <Text2 />
    </div>
  );
}

function Button() {
  return (
    <div
      className="absolute left-[10.89px] overflow-clip rounded-[12.45px] size-[74.175px] top-0"
      data-name="Button"
    >
      <Container17 />
      <Container18 />
    </div>
  );
}

function Container19() {
  return (
    <div
      className="absolute bg-[#f3f4f6] left-0 size-[74.182px] top-0"
      data-name="Container"
    />
  );
}

function Text3() {
  return (
    <div
      className="h-[12.45px] shrink-0 w-[40.212px]"
      data-name="Text"
    />
  );
}

function Container20() {
  return (
    <div
      className="absolute bg-[rgba(0,0,0,0)] content-stretch flex items-center justify-center left-0 size-[74.182px] top-0"
      data-name="Container"
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img
          alt=""
          className="absolute max-w-none object-cover opacity-90 size-full"
          src="/fabrics/cotton.jpg"
        />
      </div>
      <Text3 />
    </div>
  );
}

function Button1() {
  return (
    <div
      className="absolute left-[94.41px] overflow-clip rounded-[12.45px] size-[74.182px] top-0"
      data-name="Button"
    >
      <Container19 />
      <Container20 />
    </div>
  );
}

function Container21() {
  return (
    <div
      className="absolute bg-[#f3f4f6] left-0 size-[74.182px] top-0"
      data-name="Container"
    />
  );
}

function Text4() {
  return (
    <div
      className="h-[12.45px] shrink-0 w-[34.48px]"
      data-name="Text"
    />
  );
}

function Container22() {
  return (
    <div
      className="absolute bg-[rgba(0,0,0,0)] content-stretch flex items-center justify-center left-0 pr-[0.006px] size-[74.182px] top-0"
      data-name="Container"
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img
          alt=""
          className="absolute max-w-none object-cover opacity-90 size-full"
          src="/fabrics/leather.jpg"
        />
      </div>
      <Text4 />
    </div>
  );
}

function Button2() {
  return (
    <div
      className="absolute left-[177.92px] overflow-clip rounded-[12.45px] size-[74.182px] top-0"
      data-name="Button"
    >
      <Container21 />
      <Container22 />
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents left-[10.89px] top-0">
      <Button />
      <Button1 />
      <Button2 />
    </div>
  );
}

function Container16() {
  return (
    <div
      className="absolute h-[74px] left-[25px] top-[77px] w-[263px]"
      data-name="Container"
    >
      <Group6 />
    </div>
  );
}

function Container23() {
  return (
    <div
      className="absolute bg-[#f3f4f6] left-0 size-[74.175px] top-0"
      data-name="Container"
    />
  );
}

function Text5() {
  return (
    <div
      className="absolute h-[12.45px] left-[-256.36px] top-[30.86px] w-[37.544px]"
      data-name="Text"
    >
      <p
        className="-translate-x-1/2 absolute font-['Cabin:Bold',sans-serif] font-bold leading-[12.45px] left-[19.23px] text-[#424242] text-[9.337px] text-center top-[0.39px] whitespace-nowrap"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Velvet
      </p>
    </div>
  );
}

function Container24() {
  return (
    <div
      className="absolute left-0 size-[74.175px] top-0"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      >
        <img
          alt=""
          className="absolute max-w-none object-cover opacity-90 size-full"
          src="/fabrics/velvet.jpg"
        />
        <div className="absolute bg-[rgba(0,0,0,0)] inset-0" />
      </div>
      <Text5 />
      <div
        className="absolute h-[778.107px] left-[-219px] top-[-352px] w-[549.343px]"
        data-name="image 37"
      />
    </div>
  );
}

function Button3() {
  return (
    <div
      className="absolute left-[288px] overflow-clip rounded-[12.45px] size-[74.175px] top-[77px]"
      data-name="Button"
    >
      <Container23 />
      <Container24 />
    </div>
  );
}

function Container25() {
  return (
    <div
      className="absolute bg-[#f3f4f6] left-0 size-[74.182px] top-0"
      data-name="Container"
    />
  );
}

function Text6() {
  return (
    <div
      className="h-[12.45px] shrink-0 w-[34.182px]"
      data-name="Text"
    />
  );
}

function Container26() {
  return (
    <div
      className="absolute bg-[rgba(0,0,0,0)] content-stretch flex items-center justify-center left-0 size-[74.182px] top-0"
      data-name="Container"
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img
          alt=""
          className="absolute max-w-none object-cover opacity-90 size-full"
          src="/fabrics/wool.jpg"
        />
      </div>
      <Text6 />
    </div>
  );
}

function Button4() {
  return (
    <div
      className="absolute left-[371.51px] overflow-clip rounded-[12.45px] size-[74.182px] top-[77px]"
      data-name="Button"
    >
      <Container25 />
      <Container26 />
    </div>
  );
}

function Container27() {
  return (
    <div
      className="absolute bg-[#f3f4f6] left-0 size-[74.182px] top-0"
      data-name="Container"
    />
  );
}

function Text7() {
  return (
    <div
      className="h-[12.45px] shrink-0 w-[39.44px]"
      data-name="Text"
    />
  );
}

function Container28() {
  return (
    <div
      className="absolute content-stretch flex items-center justify-center left-0 pr-[0.006px] size-[74.182px] top-0"
      data-name="Container"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgba(229, 218, 246, 0.3) 0%, rgba(229, 218, 246, 0.3) 100%)",
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img
          alt=""
          className="absolute max-w-none object-cover opacity-90 size-full"
          src="/fabrics/denim-texture.jpg"
        />
      </div>
      <Text7 />
    </div>
  );
}

function Button5() {
  return (
    <div
      className="absolute left-[455.03px] overflow-clip rounded-[12.45px] size-[74.182px] top-[77px]"
      data-name="Button"
    >
      <Container27 />
      <Container28 />
    </div>
  );
}

function Group16() {
  return (
    <div className="absolute contents left-[24px] top-[76px]">
      <Container16 />
      <Button3 />
      <Button4 />
      <Button5 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute content-stretch flex font-['Cabin:Bold',sans-serif] font-bold gap-[60px] items-center leading-[12.45px] left-[64px] text-[#424242] text-[9.337px] text-center top-[160px] whitespace-nowrap">
      <p
        className="relative shrink-0"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Silk
      </p>
      <p
        className="relative shrink-0"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Cotton
      </p>
      <p
        className="relative shrink-0"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Leather
      </p>
      <p
        className="relative shrink-0"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Velvet
      </p>
      <p
        className="relative shrink-0"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Wool
      </p>
      <p
        className="relative shrink-0"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Denim
      </p>
    </div>
  );
}

function FabricCardScroller({
  selectedFabricTexture,
  onFabricSelect,
}: {
  selectedFabricTexture?: FabricOption;
  onFabricSelect: (fabric: FabricOption) => void;
}) {
  return (
    <div className="absolute left-[24px] right-[24px] top-[62px] z-20">
      <div
        className="flex gap-[14px] overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {FABRIC_OPTIONS.map((fabric) => {
          const isSelected = selectedFabricTexture?.id === fabric.id;

          return (
            <button
              key={fabric.id}
              type="button"
              aria-label={`Select ${fabric.label} fabric`}
              title={`Apply ${fabric.label} fabric`}
              onClick={() => onFabricSelect(fabric)}
              className="shrink-0 flex flex-col items-center"
            >
              <div
                className={`h-[82px] w-[82px] rounded-[14px] p-[3px] transition-all ${
                  isSelected
                    ? "bg-[#9E6AFF] shadow-[0_0_0_2px_rgba(158,106,255,0.18),0_7px_16px_-8px_rgba(71,52,122,0.45)]"
                    : "bg-[rgba(158,106,255,0.2)] hover:bg-[rgba(158,106,255,0.42)]"
                }`}
              >
                <div className="h-full w-full overflow-hidden rounded-[11px] border border-[rgba(255,255,255,0.78)] bg-[rgba(245,243,252,0.8)]">
                  <img
                    src={fabric.maps.colorMapUrl}
                    alt={`${fabric.label} fabric texture`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== fabric.previewUrl) {
                        target.src = fabric.previewUrl;
                      }
                    }}
                  />
                </div>
              </div>
              <p
                className="pt-1.5 text-[9.8px] font-['Cabin:Bold',sans-serif] font-bold leading-[12.6px] text-[#4f4a66]"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {fabric.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Container14({
  selectedFabricTexture,
  onFabricSelect,
}: {
  selectedFabricTexture?: FabricOption;
  onFabricSelect: (fabric: FabricOption) => void;
}) {
  return (
    <div
      className="absolute border border-[rgba(226,219,239,0.82)] border-solid h-[206px] left-[371px] rounded-[22px] top-[892px] w-[585px] bg-[rgba(255,255,255,0.9)] shadow-[0_10px_22px_-18px_rgba(49,34,84,0.45)]"
      data-name="Container"
    >
      <Container15 />
      <FabricCardScroller
        selectedFabricTexture={selectedFabricTexture}
        onFabricSelect={onFabricSelect}
      />
    </div>
  );
}

function Container({
  selectedGarmentId,
  onGarmentSelect,
  selectedColor,
  selectedFabricTexture,
  onFabricSelect,
  isSelectedColorRecommended,
  onToggleSelectedColorRecommendation,
  dressRecoloringMode,
  onDressRecoloringModeChange,
}: {
  selectedGarmentId: string;
  onGarmentSelect: (garmentId: string) => void;
  selectedColor: string;
  selectedFabricTexture?: FabricOption;
  onFabricSelect: (fabric: FabricOption) => void;
  isSelectedColorRecommended: boolean;
  onToggleSelectedColorRecommendation: () => void;
  dressRecoloringMode: boolean;
  onDressRecoloringModeChange: (next: boolean) => void;
}) {
  return (
    <div
      className="absolute h-[1195px] left-[32px] top-[129px] w-[970px]"
      data-name="Container"
    >
      <Container1 />
      <Container7 />
      <Container8
        selectedGarmentId={selectedGarmentId}
        selectedColor={selectedColor}
        selectedFabricTexture={selectedFabricTexture}
        isSelectedColorRecommended={isSelectedColorRecommended}
        onToggleSelectedColorRecommendation={onToggleSelectedColorRecommendation}
        dressRecoloringMode={dressRecoloringMode}
        onDressRecoloringModeChange={onDressRecoloringModeChange}
      />
      <NecklineTesting
        selectedGarmentId={selectedGarmentId}
        onGarmentSelect={onGarmentSelect}
        garmentColor={selectedColor}
      />
      <Container14
        selectedFabricTexture={selectedFabricTexture}
        onFabricSelect={onFabricSelect}
      />
    </div>
  );
}

function Heading4() {
  return (
    <div
      className="h-[20px] relative shrink-0 w-[118.094px]"
      data-name="Heading 3"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p
          className="font-['Cabin:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[#424242] text-[14px] tracking-[0.7px] uppercase whitespace-nowrap"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Select Season
        </p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div
      className="absolute content-stretch flex h-[32px] items-center left-[24px] top-[24px] w-[290px]"
      data-name="Container"
    >
      <Heading4 />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute h-[148px] left-[15px] top-[82px] w-[308px]" />
  );
}

function Group1() {
  return (
    <div
      className="mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[359.385px_197.354px] mask-size-[308px_185.745px] relative size-full"
      data-name="Group"
      style={{ maskImage: `url('${imgGroup}')` }}
    >
      <svg
        className="absolute block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 580.453 1026.67"
      >
        <g id="Group">
          <path
            d={svgPaths.p1452cff0}
            fill="var(--fill-0, #FFF9D4)"
            id="Vector"
          />
          <path
            d={svgPaths.p219bbe80}
            fill="var(--fill-0, #FFE200)"
            id="Vector_2"
          />
          <path
            d={svgPaths.p1bd832c0}
            fill="var(--fill-0, #CCE100)"
            id="Vector_3"
          />
          <path
            d={svgPaths.p3b53ff00}
            fill="var(--fill-0, #FFD05A)"
            id="Vector_4"
          />
          <path
            d={svgPaths.p2e7bee00}
            fill="var(--fill-0, #FFCB00)"
            id="Vector_5"
          />
          <path
            d={svgPaths.p37709600}
            fill="var(--fill-0, #FFB400)"
            id="Vector_6"
          />
          <path
            d={svgPaths.p2b574f00}
            fill="var(--fill-0, #FFA553)"
            id="Vector_7"
          />
          <path
            d={svgPaths.p2f9c0900}
            fill="var(--fill-0, #FF8565)"
            id="Vector_8"
          />
          <path
            d={svgPaths.p25617500}
            fill="var(--fill-0, #FF7900)"
            id="Vector_9"
          />
          <path
            d={svgPaths.p1d89a400}
            fill="var(--fill-0, #E920BA)"
            id="Vector_10"
          />
          <path
            d={svgPaths.p39224a00}
            fill="var(--fill-0, #A235C4)"
            id="Vector_11"
          />
          <path
            d={svgPaths.p21029000}
            fill="var(--fill-0, #8F2AA0)"
            id="Vector_12"
          />
          <path
            d={svgPaths.p2e975f00}
            fill="var(--fill-0, #005790)"
            id="Vector_13"
          />
          <path
            d={svgPaths.p2f82d180}
            fill="var(--fill-0, #0081A8)"
            id="Vector_14"
          />
          <path
            d={svgPaths.p2bdaec00}
            fill="var(--fill-0, #008AB2)"
            id="Vector_15"
          />
          <path
            d={svgPaths.p271c0170}
            fill="var(--fill-0, #0091AD)"
            id="Vector_16"
          />
          <path
            d={svgPaths.pfad4800}
            fill="var(--fill-0, #00A899)"
            id="Vector_17"
          />
          <path
            d={svgPaths.p2db2bf40}
            fill="var(--fill-0, #59C7D8)"
            id="Vector_18"
          />
          <path
            d={svgPaths.p314def30}
            fill="var(--fill-0, #B079CF)"
            id="Vector_19"
          />
          <path
            d={svgPaths.p3113c900}
            fill="var(--fill-0, #B15F00)"
            id="Vector_20"
          />
          <path
            d={svgPaths.p1e6f3c00}
            fill="var(--fill-0, #B15F00)"
            id="Vector_21"
          />
          <path
            d={svgPaths.p1faf2bf0}
            fill="var(--fill-0, #CD4B00)"
            id="Vector_22"
          />
          <path
            d={svgPaths.p2b7b3880}
            fill="var(--fill-0, #766EC8)"
            id="Vector_23"
          />
          <path
            d={svgPaths.p2da9c900}
            fill="var(--fill-0, #C7BBA4)"
            id="Vector_24"
          />
          <path
            d={svgPaths.pf04bf00}
            fill="var(--fill-0, #C0B5AA)"
            id="Vector_25"
          />
          <path
            d={svgPaths.p348bae80}
            fill="var(--fill-0, #EF0000)"
            id="Vector_26"
          />
          <path
            d={svgPaths.p39ba0b00}
            fill="var(--fill-0, #F90042)"
            id="Vector_27"
          />
          <path
            d={svgPaths.p300e1100}
            fill="var(--fill-0, #604526)"
            id="Vector_28"
          />
          <path
            d={svgPaths.p10566900}
            fill="var(--fill-0, #493436)"
            id="Vector_29"
          />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div
      className="absolute contents inset-[43.66%_-100.97%_-24.39%_-101%]"
      data-name="Group"
    >
      <div className="absolute flex inset-[43.66%_-100.97%_-24.39%_-101%] items-center justify-center">
        <div className="flex-none h-[1026.667px] rotate-90 w-[580.453px]">
          <Group1 />
        </div>
      </div>
    </div>
  );
}

function MaskGroup() {
  return (
    <div
      className="absolute contents inset-[71.11%_4.71%_3.06%_4.71%]"
      data-name="Mask group"
    >
      <Group />
    </div>
  );
}

function Group9() {
  return (
    <div className="-translate-x-1/2 absolute bottom-[8.34%] left-1/2 top-[76.08%] w-[110px]">
      <svg
        className="absolute block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 110 112"
      >
        <g id="Group 82">
          <g id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group11() {
  return (
    <div className="absolute bottom-[3.06%] contents left-[16px] top-[71.11%]">
      <MaskGroup />
      <Group9 />
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute contents left-[15px] top-[510px]">
      <div className="absolute border border-[#9e6aff] border-solid h-[187px] left-[15px] rounded-[16px] top-[510px] w-[310px]" />
    </div>
  );
}

function Group13() {
  return (
    <div className="absolute contents left-[15px] top-[510px]">
      <Group8 />
    </div>
  );
}

function Group10() {
  return (
    <div className="absolute contents left-[15px] top-[510px]">
      <Group13 />
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute contents left-[14px] top-[509px]">
      <Group11 />
      <Group10 />
      <p
        className="-translate-x-1/2 absolute font-['Cabin:Medium',sans-serif] font-medium h-[28.866px] leading-[24px] left-[267.5px] text-[#424242] text-[12px] text-center top-[644.29px] w-[71px]"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Light Spring
      </p>
    </div>
  );
}

function Group3() {
  return (
    <div
      className="mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[361.644px_198.4px] mask-size-[310px_186.729px] relative size-full"
      data-name="Group"
      style={{ maskImage: `url('${imgGroup1}')` }}
    >
      <svg
        className="absolute block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 583.528 1033.33"
      >
        <g id="Group">
          <path
            d={svgPaths.p33dffa00}
            fill="var(--fill-0, #FF9E85)"
            id="Vector"
          />
          <path
            d={svgPaths.p2e02f280}
            fill="var(--fill-0, #FFD05A)"
            id="Vector_2"
          />
          <path
            d={svgPaths.p396fdf70}
            fill="var(--fill-0, #FFE200)"
            id="Vector_3"
          />
          <path
            d={svgPaths.p26073630}
            fill="var(--fill-0, #FFCB00)"
            id="Vector_4"
          />
          <path
            d={svgPaths.p1e2c1b00}
            fill="var(--fill-0, #FFB400)"
            id="Vector_5"
          />
          <path
            d={svgPaths.p34561e00}
            fill="var(--fill-0, #FBB100)"
            id="Vector_6"
          />
          <path
            d={svgPaths.p3a0c3bc0}
            fill="var(--fill-0, #D8C200)"
            id="Vector_7"
          />
          <path
            d={svgPaths.p128c4a00}
            fill="var(--fill-0, #C1D800)"
            id="Vector_8"
          />
          <path
            d={svgPaths.p11e1ba80}
            fill="var(--fill-0, #A3C30E)"
            id="Vector_9"
          />
          <path
            d={svgPaths.p155b2080}
            fill="var(--fill-0, #A7AD00)"
            id="Vector_10"
          />
          <path
            d={svgPaths.p1f25ec00}
            fill="var(--fill-0, #63AC41)"
            id="Vector_11"
          />
          <path
            d={svgPaths.p60cb280}
            fill="var(--fill-0, #47C530)"
            id="Vector_12"
          />
          <path
            d={svgPaths.p18abcb00}
            fill="var(--fill-0, #00A242)"
            id="Vector_13"
          />
          <path
            d={svgPaths.p34324300}
            fill="var(--fill-0, #00A899)"
            id="Vector_14"
          />
          <path
            d={svgPaths.p3fb2bc00}
            fill="var(--fill-0, #00D0D5)"
            id="Vector_15"
          />
          <path
            d={svgPaths.p23925480}
            fill="var(--fill-0, #3FD0B7)"
            id="Vector_16"
          />
          <path
            d={svgPaths.p2f683600}
            fill="var(--fill-0, #9595D8)"
            id="Vector_17"
          />
          <path
            d={svgPaths.p1684da00}
            fill="var(--fill-0, #A235C4)"
            id="Vector_18"
          />
          <path
            d={svgPaths.p12c64480}
            fill="var(--fill-0, #B15F00)"
            id="Vector_19"
          />
          <path
            d={svgPaths.p10d76f00}
            fill="var(--fill-0, #C06651)"
            id="Vector_20"
          />
          <path
            d={svgPaths.p3ee4d080}
            fill="var(--fill-0, #6E4E37)"
            id="Vector_21"
          />
          <path
            d={svgPaths.p7712540}
            fill="var(--fill-0, #1E3D8F)"
            id="Vector_22"
          />
          <path
            d={svgPaths.p14e0da80}
            fill="var(--fill-0, #1261B1)"
            id="Vector_23"
          />
          <path
            d={svgPaths.p20328500}
            fill="var(--fill-0, #EF0000)"
            id="Vector_24"
          />
          <path
            d={svgPaths.p3f59a380}
            fill="var(--fill-0, #FF3F24)"
            id="Vector_25"
          />
          <path
            d={svgPaths.p39d59000}
            fill="var(--fill-0, #FF7900)"
            id="Vector_26"
          />
          <path
            d={svgPaths.p238f3f00}
            fill="var(--fill-0, #FF8700)"
            id="Vector_27"
          />
          <path
            d={svgPaths.p12507b80}
            fill="var(--fill-0, #FFA553)"
            id="Vector_28"
          />
        </g>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <div
      className="absolute contents inset-[14.72%_-101.97%_4.12%_-101.95%]"
      data-name="Group"
    >
      <div className="absolute flex inset-[14.72%_-101.97%_4.12%_-101.95%] items-center justify-center">
        <div className="flex-none h-[1033.333px] rotate-90 w-[583.528px]">
          <Group3 />
        </div>
      </div>
    </div>
  );
}

function MaskGroup1() {
  return (
    <div
      className="absolute contents inset-[42.32%_4.41%_31.71%_4.41%]"
      data-name="Mask group"
    >
      <Group2 />
    </div>
  );
}

function Text8() {
  return (
    <div
      className="h-[16.8px] shrink-0 w-[85.427px]"
      data-name="Text"
    />
  );
}

function Container32() {
  return (
    <div
      className="absolute content-stretch flex h-[16.8px] items-center left-[16.8px] top-[46.2px] w-[270.9px]"
      data-name="Container"
    >
      <Text8 />
    </div>
  );
}

function Container31() {
  return (
    <div
      className="-translate-x-1/2 absolute h-[100.682px] left-[calc(50%+2.25px)] top-[391.32px] w-[304.5px]"
      data-name="Container"
    >
      <p
        className="-translate-x-1/2 absolute font-['Cabin:Medium',sans-serif] font-medium h-[23px] leading-[24px] left-[251.5px] text-[#424242] text-[12px] text-center top-[43px] w-[71px]"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Warm Spring
      </p>
      <Container32 />
      <div
        className="-translate-x-1/2 absolute bottom-[37.74%] left-[calc(50%-0.25px)] top-[-48.98%] w-[110px]"
        data-name="Vector"
      >
        <svg
          className="absolute block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 32 32"
        >
          <g id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="-translate-x-1/2 absolute contents left-[calc(50%+2.25px)] top-[391.32px]">
      <Container31 />
    </div>
  );
}

function Group14() {
  return (
    <div className="absolute contents left-[14px] top-[302px]">
      <MaskGroup1 />
      <div className="absolute border border-[#9e6aff] border-solid h-[187.991px] left-[15px] rounded-[16px] top-[303px] w-[310px]" />
      <Group7 />
    </div>
  );
}

function Group5() {
  return (
    <div
      className="mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[359.317px_201px] mask-size-[308px_189px] relative size-full"
      data-name="Group"
      style={{ maskImage: `url('${imgGroup2}')` }}
    >
      <svg
        className="absolute block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 590.812 1026.67"
      >
        <g id="Group">
          <path
            d={svgPaths.p1f6a900}
            fill="var(--fill-0, #FFF9D4)"
            id="Vector"
          />
          <path
            d={svgPaths.p12d9480}
            fill="var(--fill-0, #F2EB92)"
            id="Vector_2"
          />
          <path
            d={svgPaths.p24a6f000}
            fill="var(--fill-0, #F9E09C)"
            id="Vector_3"
          />
          <path
            d={svgPaths.p14c64df0}
            fill="var(--fill-0, #FFCDA3)"
            id="Vector_4"
          />
          <path
            d={svgPaths.p26625080}
            fill="var(--fill-0, #FFC594)"
            id="Vector_5"
          />
          <path
            d={svgPaths.p212ba300}
            fill="var(--fill-0, #FFDA4B)"
            id="Vector_6"
          />
          <path
            d={svgPaths.p3963b080}
            fill="var(--fill-0, #D5EC8F)"
            id="Vector_7"
          />
          <path
            d={svgPaths.p12e74000}
            fill="var(--fill-0, #CDDFB7)"
            id="Vector_8"
          />
          <path
            d={svgPaths.p2b4e500}
            fill="var(--fill-0, #93E2D3)"
            id="Vector_9"
          />
          <path
            d={svgPaths.p2108280}
            fill="var(--fill-0, #95DEEA)"
            id="Vector_10"
          />
          <path
            d={svgPaths.p2904cf00}
            fill="var(--fill-0, #8DCDEE)"
            id="Vector_11"
          />
          <path
            d={svgPaths.p213d8900}
            fill="var(--fill-0, #C9B3E8)"
            id="Vector_12"
          />
          <path
            d={svgPaths.p15e70b00}
            fill="var(--fill-0, #E0A7E7)"
            id="Vector_13"
          />
          <path
            d={svgPaths.p2d442600}
            fill="var(--fill-0, #CCC7A3)"
            id="Vector_14"
          />
          <path
            d={svgPaths.p5eaa680}
            fill="var(--fill-0, #D8BB86)"
            id="Vector_15"
          />
          <path
            d={svgPaths.p34b5ac80}
            fill="var(--fill-0, #E0B389)"
            id="Vector_16"
          />
          <path
            d={svgPaths.p1d081000}
            fill="var(--fill-0, #D59E70)"
            id="Vector_17"
          />
          <path
            d={svgPaths.p17d18800}
            fill="var(--fill-0, #C7A28F)"
            id="Vector_18"
          />
          <path
            d={svgPaths.p3e5fc080}
            fill="var(--fill-0, #645B54)"
            id="Vector_19"
          />
          <path
            d={svgPaths.p1fab6b80}
            fill="var(--fill-0, #857A77)"
            id="Vector_20"
          />
          <path
            d={svgPaths.p616f780}
            fill="var(--fill-0, #D0C3AC)"
            id="Vector_21"
          />
          <path
            d={svgPaths.p18e6c00}
            fill="var(--fill-0, #47C530)"
            id="Vector_22"
          />
          <path
            d={svgPaths.p21801180}
            fill="var(--fill-0, #9595D8)"
            id="Vector_23"
          />
          <path
            d={svgPaths.p34eac200}
            fill="var(--fill-0, #FF8565)"
            id="Vector_24"
          />
          <path
            d={svgPaths.p18b2de00}
            fill="var(--fill-0, #FFA553)"
            id="Vector_25"
          />
          <path
            d={svgPaths.p3a593c00}
            fill="var(--fill-0, #FFA687)"
            id="Vector_26"
          />
          <path
            d={svgPaths.p2f9c1c00}
            fill="var(--fill-0, #00D0D5)"
            id="Vector_27"
          />
          <path
            d={svgPaths.p117ddc80}
            fill="var(--fill-0, #3FD0B7)"
            id="Vector_28"
          />
        </g>
      </svg>
    </div>
  );
}

function Group4() {
  return (
    <div
      className="absolute contents inset-[-106.35%_-116.67%_-106.25%_-116.66%]"
      data-name="Group"
    >
      <div className="absolute flex inset-[-106.35%_-116.67%_-106.25%_-116.66%] items-center justify-center">
        <div className="flex-none h-[1026.667px] rotate-90 w-[590.813px]">
          <Group5 />
        </div>
      </div>
    </div>
  );
}

function MaskGroup2() {
  return (
    <div
      className="absolute contents inset-0"
      data-name="Mask group"
    >
      <Group4 />
    </div>
  );
}

function LightSpring() {
  return (
    <div
      className="absolute h-[189px] left-[18px] top-[94px] w-[308px]"
      data-name="light Spring"
    >
      <MaskGroup2 />
    </div>
  );
}

function Group17() {
  return (
    <div className="absolute contents left-[18px] top-[94px]">
      <LightSpring />
    </div>
  );
}

function Button6() {
  return (
    <div
      className="absolute bg-[rgba(255,255,255,0)] h-[189px] left-[18px] overflow-clip rounded-[16px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_6px_#9e6aff,0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] top-[94px] w-[305px]"
      data-name="Button"
    >
      <div
        className="-translate-x-1/2 absolute bottom-[14.29%] left-[calc(50%+0.5px)] top-[16.4%] w-[130px]"
        data-name="Vector"
      >
        <svg
          className="absolute block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 32 32"
        >
          <g id="Vector" />
        </svg>
      </div>
      <p
        className="absolute font-['Cabin:Medium',sans-serif] font-medium inset-[73.54%_7.21%_14.29%_72.46%] leading-[24px] text-[#424242] text-[12px] text-center"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Clear Spring
      </p>
    </div>
  );
}

function Group15() {
  return (
    <div className="absolute contents left-[17px] top-[93px]">
      <Group17 />
      <Button6 />
    </div>
  );
}

function Container29() {
  return (
    <div
      className="absolute bg-[rgba(255,255,255,0.7)] border border-[rgba(243,232,255,0.5)] border-solid h-[719px] left-[39px] rounded-[24px] top-[129px] w-[340px]"
      data-name="Container"
    >
      <Container30 />
      <Frame />
      <Group12 />
      <Group14 />
      <Group15 />
    </div>
  );
}

function Heading() {
  return (
    <div
      className="h-[26.401px] relative shrink-0 w-full"
      data-name="Heading 2"
    >
      <p
        className="absolute font-['Cabin:Bold',sans-serif] font-bold leading-[26.401px] left-0 text-[#424242] text-[19.801px] top-[0.83px] whitespace-nowrap"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Color Palette
      </p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div
      className="h-[16.501px] relative shrink-0 w-full"
      data-name="Paragraph"
    >
      <p
        className="absolute font-['Cabin:Regular',sans-serif] font-normal leading-[16.501px] left-0 text-[#6a7282] text-[11.551px] top-[0.41px] whitespace-nowrap"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        7 × 8 color matrix
      </p>
    </div>
  );
}

function Container35() {
  return (
    <div
      className="h-[46.202px] relative shrink-0 w-[130.95px]"
      data-name="Container"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[3.3px] items-start relative size-full">
        <Heading />
        <Paragraph1 />
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div
      className="bg-[#9e6aff] h-[26.401px] relative rounded-[13841910px] shadow-[0px_3.3px_4.95px_0px_rgba(0,0,0,0.1),0px_1.65px_3.3px_0px_rgba(0,0,0,0.1)] shrink-0 w-[118.142px]"
      data-name="Container"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p
          className="absolute font-['Cabin:Bold',sans-serif] font-bold leading-[13.201px] left-[16.5px] text-[9.901px] text-white top-[7.01px] whitespace-nowrap"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Your perfect match
        </p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div
      className="absolute content-stretch flex gap-[178px] h-[46.202px] items-center left-[26.4px] top-[26.4px] w-[453.774px]"
      data-name="Container"
    >
      <Container35 />
      <Container36 />
    </div>
  );
}

function Container40() {
  return (
    <div
      className="absolute bg-[#fffffa] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container41() {
  return (
    <div
      className="absolute bg-[#fffff0] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container42() {
  return (
    <div
      className="absolute bg-[#f0eada] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container43() {
  return (
    <div
      className="absolute bg-[#e3dac9] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container44() {
  return (
    <div
      className="absolute bg-[#c7bba4] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container45() {
  return (
    <div
      className="absolute bg-[#d7d2cb] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container46() {
  return (
    <div
      className="absolute bg-[#cac1b4] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container47() {
  return (
    <div
      className="absolute bg-[#c0b5aa] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container39() {
  return (
    <div
      className="absolute h-[44.282px] left-0 top-0 w-[405.921px]"
      data-name="Container"
    >
      <Container40 />
      <Container41 />
      <Container42 />
      <Container43 />
      <Container44 />
      <Container45 />
      <Container46 />
      <Container47 />
    </div>
  );
}

function Container49() {
  return (
    <div
      className="absolute bg-[#a09998] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container50() {
  return (
    <div
      className="absolute bg-[#8d918d] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container51() {
  return (
    <div
      className="absolute bg-[#4f3835] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container52() {
  return (
    <div
      className="absolute bg-[#5a3e36] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container53() {
  return (
    <div
      className="absolute bg-[#3d4849] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container54() {
  return (
    <div
      className="absolute bg-[#262e2f] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container55() {
  return (
    <div
      className="absolute bg-[#000080] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container56() {
  return (
    <div
      className="absolute bg-[#191970] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container48() {
  return (
    <div
      className="absolute h-[44.282px] left-0 top-[51.66px] w-[405.921px]"
      data-name="Container"
    >
      <Container49 />
      <Container50 />
      <Container51 />
      <Container52 />
      <Container53 />
      <Container54 />
      <Container55 />
      <Container56 />
    </div>
  );
}

function Container58() {
  return (
    <div
      className="absolute bg-[#39f] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container59() {
  return (
    <div
      className="absolute bg-[#4169e1] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container60() {
  return (
    <div
      className="absolute bg-[#8c00fa] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container61() {
  return (
    <div
      className="absolute bg-[#766ec8] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container62() {
  return (
    <div
      className="absolute bg-[#5a4fcf] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container63() {
  return (
    <div
      className="absolute bg-[#7df9ff] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container64() {
  return (
    <div
      className="absolute bg-[#00f0f0] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container65() {
  return (
    <div
      className="absolute bg-[#3fe0d0] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container57() {
  return (
    <div
      className="absolute h-[44.282px] left-0 top-[103.33px] w-[405.921px]"
      data-name="Container"
    >
      <Container58 />
      <Container59 />
      <Container60 />
      <Container61 />
      <Container62 />
      <Container63 />
      <Container64 />
      <Container65 />
    </div>
  );
}

function Container67() {
  return (
    <div
      className="absolute bg-[#00af9d] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container68() {
  return (
    <div
      className="absolute bg-[#009473] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container69() {
  return (
    <div
      className="absolute bg-[#149c88] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container70() {
  return (
    <div
      className="absolute bg-[#008381] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container71() {
  return (
    <div
      className="absolute bg-[#9acd32] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container72() {
  return (
    <div
      className="absolute bg-[#32cd32] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container73() {
  return (
    <div
      className="absolute bg-[#4cbb17] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container74() {
  return (
    <div
      className="absolute bg-[#0b6623] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container66() {
  return (
    <div
      className="absolute h-[44.282px] left-0 top-[154.99px] w-[405.921px]"
      data-name="Container"
    >
      <Container67 />
      <Container68 />
      <Container69 />
      <Container70 />
      <Container71 />
      <Container72 />
      <Container73 />
      <Container74 />
    </div>
  );
}

function Container76() {
  return (
    <div
      className="absolute bg-[#fff44f] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container77() {
  return (
    <div
      className="absolute bg-[#ffff31] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container78() {
  return (
    <div
      className="absolute bg-[#ffd662] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container79() {
  return (
    <div
      className="absolute bg-[#ffc66e] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container80() {
  return (
    <div
      className="absolute bg-[#f6c324] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container81() {
  return (
    <div
      className="absolute bg-[#f5b31e] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container82() {
  return (
    <div
      className="absolute bg-[#c72] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container83() {
  return (
    <div
      className="absolute bg-[#d18e54] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container75() {
  return (
    <div
      className="absolute h-[44.282px] left-0 top-[206.65px] w-[405.921px]"
      data-name="Container"
    >
      <Container76 />
      <Container77 />
      <Container78 />
      <Container79 />
      <Container80 />
      <Container81 />
      <Container82 />
      <Container83 />
    </div>
  );
}

function Container85() {
  return (
    <div
      className="absolute bg-[#ff6e6e] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container86() {
  return (
    <div
      className="absolute bg-[#f96714] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container87() {
  return (
    <div
      className="absolute bg-[#f94d00] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container88() {
  return (
    <div
      className="absolute bg-[#e74a33] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container89() {
  return (
    <div
      className="absolute bg-[#ff6347] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container90() {
  return (
    <div
      className="absolute bg-[#ff4040] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container91() {
  return (
    <div
      className="absolute bg-[#ff0800] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container92() {
  return (
    <div
      className="absolute bg-[#b93a32] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container84() {
  return (
    <div
      className="absolute h-[44.282px] left-0 top-[258.31px] w-[405.921px]"
      data-name="Container"
    >
      <Container85 />
      <Container86 />
      <Container87 />
      <Container88 />
      <Container89 />
      <Container90 />
      <Container91 />
      <Container92 />
    </div>
  );
}

function Container94() {
  return (
    <div
      className="absolute bg-[#f3bbca] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container95() {
  return (
    <div
      className="absolute bg-[#f6909d] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container96() {
  return (
    <div
      className="absolute bg-[#e35c7d] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container97() {
  return (
    <div
      className="absolute bg-[#ee6d8a] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container98() {
  return (
    <div
      className="absolute bg-[#f6c] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container99() {
  return (
    <div
      className="absolute bg-[#e0218a] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container100() {
  return (
    <div
      className="absolute bg-[#e3256b] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container101() {
  return (
    <div
      className="absolute bg-[#e30b5d] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0"
      data-name="Container"
    />
  );
}

function Container93() {
  return (
    <div
      className="absolute h-[44.282px] left-0 top-[309.98px] w-[405.921px]"
      data-name="Container"
    >
      <Container94 />
      <Container95 />
      <Container96 />
      <Container97 />
      <Container98 />
      <Container99 />
      <Container100 />
      <Container101 />
    </div>
  );
}

function Container102() {
  return (
    <div
      className="-translate-x-1/2 absolute bg-[#9e6aff] h-[32.633px] left-[calc(50%+0.05px)] rounded-[17109008px] shadow-[0px_4.079px_6.119px_0px_rgba(0,0,0,0.1),0px_2.04px_4.079px_0px_rgba(0,0,0,0.1)] top-[404px] w-[146.026px]"
      data-name="Container"
    >
      <p
        className="absolute font-['Cabin:Bold',sans-serif] font-bold leading-[16.316px] left-[26.51px] text-[12.237px] text-white top-[8.16px] whitespace-nowrap"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        Refresh the Pallet
      </p>
    </div>
  );
}

function Heading5() {
  return (
    <div
      className="h-[20px] relative shrink-0 w-[104.922px]"
      data-name="Heading 3"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p
          className="font-['Cabin:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[#424242] text-[14px] tracking-[0.7px] uppercase whitespace-nowrap"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Recommended shades
        </p>
      </div>
    </div>
  );
}

function Container104({
  shadeCount,
  onClear,
}: {
  shadeCount: number;
  onClear: () => void;
}) {
  return (
    <div
      className="absolute content-stretch flex h-[32px] items-center left-[24px] top-[24px] w-[310px]"
      data-name="Container"
    >
      <Heading5 />
      {shadeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="absolute font-['Cabin:Semibold',sans-serif] font-semibold leading-[16px] right-[58px] rounded-full border border-[rgba(158,106,255,0.35)] px-2 py-[1px] text-[#8b80a8] text-[10px]"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Clear
        </button>
      )}
      <p
        className="absolute font-['Cabin:Semibold',sans-serif] font-semibold leading-[16px] right-0 text-[#8b80a8] text-[11px] top-[8px] whitespace-nowrap"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        {shadeCount} saved
      </p>
    </div>
  );
}

function Container105({ recommendedShades }: { recommendedShades: string[] }) {
  return (
    <div
      className="-translate-x-1/2 absolute h-[57.894px] left-1/2 top-[83px] w-[262px]"
      data-name="Container"
    >
      {recommendedShades.length > 0 ? (
        <div
          className="flex h-full w-full items-center gap-[10px] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          title="Scroll horizontally to view all saved shades"
        >
          {recommendedShades.map((shade) => (
            <div
              key={`${shade}-${normalizeColor(shade)}`}
              className="h-[57.894px] w-[57.894px] shrink-0 rounded-[2.507px] shadow-[0px_3.381px_5.071px_0px_rgba(0,0,0,0.1),0px_1.69px_3.381px_0px_rgba(0,0,0,0.1)]"
              style={{ backgroundColor: shade }}
              title={shade}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[8px] border border-dashed border-[rgba(158,106,255,0.4)] bg-[rgba(255,255,255,0.78)] px-3">
          <p
            className="font-['Cabin:Regular',sans-serif] text-[11px] text-[#8b80a8]"
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            Tap the heart on the try-on card to save shades
          </p>
        </div>
      )}
    </div>
  );
}

function Container103({
  recommendedShades,
  onClearRecommendedShades,
}: {
  recommendedShades: string[];
  onClearRecommendedShades: () => void;
}) {
  return (
    <div
      className="absolute bg-[rgba(255,255,255,0.7)] border border-[rgba(229,218,246,0.5)] border-solid h-[167px] left-0 rounded-[24px] top-[444px] w-[406px]"
      data-name="Container"
    >
      <Container104
        shadeCount={recommendedShades.length}
        onClear={onClearRecommendedShades}
      />
      <Container105 recommendedShades={recommendedShades} />
    </div>
  );
}

function Container38({
  recommendedShades,
  onClearRecommendedShades,
}: {
  recommendedShades: string[];
  onClearRecommendedShades: () => void;
}) {
  return (
    <div
      className="-translate-x-1/2 absolute h-[732.134px] left-[calc(50%-14.15px)] top-[24.77px] w-[405.921px]"
      data-name="Container"
    >
      <Container39 />
      <Container48 />
      <Container57 />
      <Container66 />
      <Container75 />
      <Container84 />
      <Container93 />
      <Container102 />
      <Container103
        recommendedShades={recommendedShades}
        onClearRecommendedShades={onClearRecommendedShades}
      />
    </div>
  );
}

function Container37({
  recommendedShades,
  onClearRecommendedShades,
}: {
  recommendedShades: string[];
  onClearRecommendedShades: () => void;
}) {
  return (
    <div
      className="absolute h-[818.443px] left-[26.4px] top-[92.4px] w-[453.774px]"
      data-name="Container"
    >
      <Container38
        recommendedShades={recommendedShades}
        onClearRecommendedShades={onClearRecommendedShades}
      />
    </div>
  );
}

function Paragraph2() {
  return (
    <div
      className="h-[13.201px] relative shrink-0 w-full"
      data-name="Paragraph"
    >
      <p
        className="-translate-x-1/2 absolute font-['Cabin:SemiBold',sans-serif] font-semibold leading-[13.201px] left-[calc(50%-0.39px)] text-[#9e9e9e] text-[9.901px] text-center top-[0.41px] tracking-[0.2475px] whitespace-nowrap"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        www.Silsett.com
      </p>
    </div>
  );
}

function Container106() {
  return (
    <div
      className="absolute content-stretch flex flex-col items-start left-[26.4px] pt-[14.026px] top-[960.65px] w-[453.774px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-[#f3e8ff] border-solid border-t-[0.825px] inset-0 pointer-events-none"
      />
      <Paragraph2 />
    </div>
  );
}

function Container33({
  selectedColor,
  onColorSelect,
  recommendedShades,
  onClearRecommendedShades,
}: {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  recommendedShades: string[];
  onClearRecommendedShades: () => void;
}) {
  return (
    <div
      className="absolute bg-[rgba(255,255,255,0.7)] border-[0.825px] border-[rgba(243,232,255,0.5)] border-solid h-[1006px] left-[1014px] rounded-[19.801px] top-[130px] w-[481px]"
      data-name="Container"
    >
      <Container34 />
      <Container37
        recommendedShades={recommendedShades}
        onClearRecommendedShades={onClearRecommendedShades}
      />
      <Container106 />
      <div className="absolute left-[36.18px] top-[117.17px]">
        <ColorPaletteInteractionOverlay
          selectedColor={selectedColor}
          onColorSelect={onColorSelect}
        />
      </div>
    </div>
  );
}

function Ty({
  mainSeason,
  selectedGarmentId,
  onGarmentSelect,
  selectedColor,
  selectedFabricTexture,
  onFabricSelect,
  onColorSelect,
  isSelectedColorRecommended,
  onToggleSelectedColorRecommendation,
  recommendedShades,
  onClearRecommendedShades,
  dressRecoloringMode,
  onDressRecoloringModeChange,
}: {
  mainSeason: string;
  selectedGarmentId: string;
  onGarmentSelect: (garmentId: string) => void;
  selectedColor: string;
  selectedFabricTexture?: FabricOption;
  onFabricSelect: (fabric: FabricOption) => void;
  onColorSelect: (color: string) => void;
  isSelectedColorRecommended: boolean;
  onToggleSelectedColorRecommendation: () => void;
  recommendedShades: string[];
  onClearRecommendedShades: () => void;
  dressRecoloringMode: boolean;
  onDressRecoloringModeChange: (next: boolean) => void;
}) {
  return (
    <div
      className="absolute h-[1194px] left-0 top-0 w-[1517px]"
      data-name="TY"
    >
      <Container
        selectedGarmentId={selectedGarmentId}
        onGarmentSelect={onGarmentSelect}
        selectedColor={selectedColor}
        selectedFabricTexture={selectedFabricTexture}
        onFabricSelect={onFabricSelect}
        isSelectedColorRecommended={isSelectedColorRecommended}
        onToggleSelectedColorRecommendation={onToggleSelectedColorRecommendation}
        dressRecoloringMode={dressRecoloringMode}
        onDressRecoloringModeChange={onDressRecoloringModeChange}
      />
      <SeasonSelectorPanel mainSeason={mainSeason} />
      <Container33
        selectedColor={selectedColor}
        onColorSelect={onColorSelect}
        recommendedShades={recommendedShades}
        onClearRecommendedShades={onClearRecommendedShades}
      />
    </div>
  );
}

function Body({
  mainSeason,
  selectedGarmentId,
  onGarmentSelect,
  selectedColor,
  selectedFabricTexture,
  onFabricSelect,
  onColorSelect,
  isSelectedColorRecommended,
  onToggleSelectedColorRecommendation,
  recommendedShades,
  onClearRecommendedShades,
  dressRecoloringMode,
  onDressRecoloringModeChange,
}: {
  mainSeason: string;
  selectedGarmentId: string;
  onGarmentSelect: (garmentId: string) => void;
  selectedColor: string;
  selectedFabricTexture?: FabricOption;
  onFabricSelect: (fabric: FabricOption) => void;
  onColorSelect: (color: string) => void;
  isSelectedColorRecommended: boolean;
  onToggleSelectedColorRecommendation: () => void;
  recommendedShades: string[];
  onClearRecommendedShades: () => void;
  dressRecoloringMode: boolean;
  onDressRecoloringModeChange: (next: boolean) => void;
}) {
  return (
    <div
      className="absolute h-[1194px] left-0 top-0 w-[1517px]"
      data-name="Body"
    >
      <Ty
        mainSeason={mainSeason}
        selectedGarmentId={selectedGarmentId}
        onGarmentSelect={onGarmentSelect}
        selectedColor={selectedColor}
        selectedFabricTexture={selectedFabricTexture}
        onFabricSelect={onFabricSelect}
        onColorSelect={onColorSelect}
        isSelectedColorRecommended={isSelectedColorRecommended}
        onToggleSelectedColorRecommendation={onToggleSelectedColorRecommendation}
        recommendedShades={recommendedShades}
        onClearRecommendedShades={onClearRecommendedShades}
        dressRecoloringMode={dressRecoloringMode}
        onDressRecoloringModeChange={onDressRecoloringModeChange}
      />
    </div>
  );
}

function Icon1() {
  return (
    <div
      className="relative shrink-0 size-[20px]"
      data-name="Icon"
    >
      <svg
        className="absolute block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 20 20"
      >
        <g id="Icon">
          <path
            d="M12.5 15L7.5 10L12.5 5"
            id="Vector"
            stroke="var(--stroke-0, #6A7282)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.66667"
          />
        </g>
      </svg>
    </div>
  );
}

function Text9() {
  return (
    <div
      className="flex-[1_0_0] h-[20px] min-h-px min-w-px relative"
      data-name="Text"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p
          className="-translate-x-1/2 absolute font-['Cabin:SemiBold',sans-serif] font-semibold leading-[20px] left-[49.5px] text-[#6a7282] text-[14px] text-center top-[0.5px] whitespace-nowrap"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Back to Seasons
        </p>
      </div>
    </div>
  );
}

function Button11() {
  return (
    <div
      className="h-[20px] relative shrink-0 w-[125.016px]"
      data-name="Button"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Icon1 />
        <Text9 />
      </div>
    </div>
  );
}

function Text10() {
  return (
    <div
      className="h-[28px] relative shrink-0 w-[177px]"
      data-name="Text"
    >
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p
          className="absolute font-['Cabin:Bold',sans-serif] font-bold leading-[28px] left-0 text-[#424242] text-[20px] top-[-0.5px] whitespace-nowrap"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Clear Spring Styling
        </p>
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div
      className="relative shrink-0 size-[20px]"
      data-name="Icon"
    >
      <svg
        className="absolute block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 20 20"
      >
        <g id="Icon">
          <path
            d="M5 7.5L10 12.5L15 7.5"
            id="Vector"
            stroke="var(--stroke-0, #9E6AFF)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.66667"
          />
        </g>
      </svg>
    </div>
  );
}

function Container108() {
  return (
    <div
      className="h-[56px] relative rounded-[16px] shrink-0 w-[276px]"
      data-name="Container"
    >
      <div
        aria-hidden="true"
        className="absolute border-2 border-[rgba(229,218,246,0.5)] border-solid inset-0 pointer-events-none rounded-[16px]"
      />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center px-[34px] py-[2px] relative size-full">
        <Text10 />
        <Icon2 />
      </div>
    </div>
  );
}

function Container109() {
  return (
    <div
      className="h-0 shrink-0 w-[140px]"
      data-name="Container"
    />
  );
}

function SeasonDropdown({
  mainSeason,
  setMainSeason,
}: {
  mainSeason: string;
  setMainSeason: (s: string) => void;
}) {
  const seasons = ["Spring", "Summer", "Autumn", "Winter"];
  const icons: Record<string, string> = {
    Spring: "🌸",
    Summer: "☀️",
    Autumn: "🍂",
    Winter: "❄️",
  };
  return (
    <div className="h-[56px] relative rounded-[16px] shrink-0 w-[276px]">
      <div
        aria-hidden="true"
        className="absolute border-2 border-[rgba(229,218,246,0.5)] border-solid inset-0 pointer-events-none rounded-[16px]"
      />
      <div className="flex items-center justify-center size-full gap-[10px] px-[20px]">
        <span className="text-[22px] select-none leading-none">
          {icons[mainSeason]}
        </span>
        <select
          value={mainSeason}
          onChange={(e) => setMainSeason(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[#424242] text-[18px] cursor-pointer"
          style={{
            fontFamily: "'Cabin', sans-serif",
            fontWeight: 700,
          }}
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <svg
          width="18"
          height="18"
          fill="none"
          stroke="#9E6AFF"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="pointer-events-none shrink-0"
        >
          <path
            d="M6 9l6 6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function Container107({
  mainSeason,
  setMainSeason,
}: {
  mainSeason: string;
  setMainSeason: (s: string) => void;
}) {
  return (
    <div
      className="h-[96px] relative shrink-0 w-full"
      data-name="Container"
    >
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[32px] relative size-full">
          <Button11 />
          <SeasonDropdown
            mainSeason={mainSeason}
            setMainSeason={setMainSeason}
          />
          <Container109 />
        </div>
      </div>
    </div>
  );
}

function Header({
  mainSeason,
  setMainSeason,
}: {
  mainSeason: string;
  setMainSeason: (s: string) => void;
}) {
  return (
    <div
      className="absolute bg-[rgba(255,255,255,0.95)] content-stretch flex flex-col h-[97px] items-start left-0 pb-px top-0 w-[1517px]"
      data-name="Header"
    >
      <div
        aria-hidden="true"
        className="absolute border-[rgba(243,232,255,0.5)] border-b border-solid inset-0 pointer-events-none shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]"
      />
      <Container107
        mainSeason={mainSeason}
        setMainSeason={setMainSeason}
      />
    </div>
  );
}

export default function ColorAnalysis() {
  const [mainSeason, setMainSeason] = useState("Spring");
  const [selectedGarmentId, setSelectedGarmentId] = useState(garmentStyles[0]?.id ?? "");
  const [dressRecoloringMode, setDressRecoloringMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#a09998");
  const [selectedFabricTexture, setSelectedFabricTexture] = useState<FabricOption | undefined>(DEFAULT_FABRIC);
  const [recommendedShades, setRecommendedShades] = useState<string[]>(loadRecommendedShadesFromStorage);

  const handleGarmentSelect = useCallback((garmentId: string) => {
    setSelectedGarmentId(garmentId);
    setDressRecoloringMode(false);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      RECOMMENDED_SHADES_STORAGE_KEY,
      JSON.stringify(recommendedShades),
    );
  }, [recommendedShades]);

  const isSelectedColorRecommended = recommendedShades.some(
    (shade) => normalizeColor(shade) === normalizeColor(selectedColor),
  );

  const handleToggleSelectedColorRecommendation = () => {
    const normalizedSelectedColor = normalizeColor(selectedColor);

    setRecommendedShades((previous) => {
      const alreadyRecommended = previous.some(
        (shade) => normalizeColor(shade) === normalizedSelectedColor,
      );

      if (alreadyRecommended) {
        return previous.filter(
          (shade) => normalizeColor(shade) !== normalizedSelectedColor,
        );
      }

      return [selectedColor, ...previous];
    });
  };

  const handleClearRecommendedShades = () => {
    setRecommendedShades([]);
  };

  return (
    <div
      className="bg-white relative"
      style={{ width: "1517px", height: "1194px" }}
      data-name="color analysis"
    >
      <Body
        mainSeason={mainSeason}
        selectedGarmentId={selectedGarmentId}
        onGarmentSelect={handleGarmentSelect}
        selectedColor={selectedColor}
        selectedFabricTexture={selectedFabricTexture}
        onFabricSelect={setSelectedFabricTexture}
        onColorSelect={setSelectedColor}
        isSelectedColorRecommended={isSelectedColorRecommended}
        onToggleSelectedColorRecommendation={handleToggleSelectedColorRecommendation}
        recommendedShades={recommendedShades}
        onClearRecommendedShades={handleClearRecommendedShades}
        dressRecoloringMode={dressRecoloringMode}
        onDressRecoloringModeChange={setDressRecoloringMode}
      />
      <Header
        mainSeason={mainSeason}
        setMainSeason={setMainSeason}
      />
    </div>
  );
}