import svgPaths from "./svg-qmw9x774o7";
import { imgGroup } from "./svg-1t2co";

function Group1() {
  return (
    <div className="mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[361.668px_177.438px] mask-size-[310px_167px] relative size-full" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 521.875 1033.33">
        <g id="Group">
          <path d={svgPaths.p22472700} fill="var(--fill-0, #FEFEFE)" id="Vector" />
          <path d={svgPaths.pa4bba00} fill="var(--fill-0, #FCE48F)" id="Vector_2" />
          <path d={svgPaths.p3bcc3780} fill="var(--fill-0, #00CFED)" id="Vector_3" />
          <path d={svgPaths.p37ca5400} fill="var(--fill-0, #00A7E8)" id="Vector_4" />
          <path d={svgPaths.p1e023270} fill="var(--fill-0, #0084BF)" id="Vector_5" />
          <path d={svgPaths.p3f9d9380} fill="var(--fill-0, #0089DD)" id="Vector_6" />
          <path d={svgPaths.p2042df00} fill="var(--fill-0, #0074D6)" id="Vector_7" />
          <path d={svgPaths.p20be6d00} fill="var(--fill-0, #0059BF)" id="Vector_8" />
          <path d={svgPaths.p18835a80} fill="var(--fill-0, #004D8C)" id="Vector_9" />
          <path d={svgPaths.pd04b180} fill="var(--fill-0, #8F2AA0)" id="Vector_10" />
          <path d={svgPaths.p1490a00} fill="var(--fill-0, #A235C4)" id="Vector_11" />
          <path d={svgPaths.p1add5100} fill="var(--fill-0, #D900B6)" id="Vector_12" />
          <path d={svgPaths.p1e32c400} fill="var(--fill-0, #D900B6)" id="Vector_13" />
          <path d={svgPaths.p39dbf880} fill="var(--fill-0, #EE0086)" id="Vector_14" />
          <path d={svgPaths.p1241d300} fill="var(--fill-0, #F8006D)" id="Vector_15" />
          <path d={svgPaths.p2a1cac00} fill="var(--fill-0, #F8006D)" id="Vector_16" />
          <path d={svgPaths.p15fee600} fill="var(--fill-0, #E10030)" id="Vector_17" />
          <path d={svgPaths.pfb15300} fill="var(--fill-0, #BA0064)" id="Vector_18" />
          <path d={svgPaths.p3b93cc00} fill="var(--fill-0, #97005A)" id="Vector_19" />
          <path d={svgPaths.p1cd50f80} fill="var(--fill-0, #131313)" id="Vector_20" />
          <path d={svgPaths.p1954d600} fill="var(--fill-0, #494A53)" id="Vector_21" />
          <path d={svgPaths.pe1c3a00} fill="var(--fill-0, #818286)" id="Vector_22" />
          <path d={svgPaths.p1555a700} fill="var(--fill-0, #554289)" id="Vector_23" />
          <path d={svgPaths.p2e6bd8f0} fill="var(--fill-0, #009A73)" id="Vector_24" />
          <path d={svgPaths.p30aba600} fill="var(--fill-0, #00B4BB)" id="Vector_25" />
          <path d={svgPaths.p1475580} fill="var(--fill-0, #93B9D7)" id="Vector_26" />
          <path d={svgPaths.p3de38f80} fill="var(--fill-0, #86D9ED)" id="Vector_27" />
          <path d={svgPaths.p1421b800} fill="var(--fill-0, #FF90C9)" id="Vector_28" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[-106.25%_-116.67%]" data-name="Group">
      <div className="absolute flex inset-[-106.25%_-116.67%] items-center justify-center">
        <div className="flex-none h-[1033.333px] rotate-90 w-[521.875px]">
          <Group1 />
        </div>
      </div>
    </div>
  );
}

function MaskGroup() {
  return (
    <div className="absolute contents inset-0" data-name="Mask group">
      <Group />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute h-[167px] left-0 top-0 w-[310px]">
      <MaskGroup />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute h-[148px] left-0 top-0 w-[310px]">
      <Frame />
    </div>
  );
}

export default function CoolWinter() {
  return (
    <div className="relative size-full" data-name="Cool winter">
      <Frame1 />
    </div>
  );
}