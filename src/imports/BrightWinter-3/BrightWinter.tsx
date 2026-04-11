import svgPaths from "./svg-hijv7ur67e";
import { imgGroup } from "./svg-xuoyr";

function Group1() {
  return (
    <div className="mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[361.668px_157.25px] mask-size-[310px_148px] relative size-full" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 462.5 1033.33">
        <g id="Group">
          <path d={svgPaths.p16f9ae00} fill="var(--fill-0, #F7E75B)" id="Vector" />
          <path d={svgPaths.p37c1bc00} fill="var(--fill-0, #00A7E8)" id="Vector_2" />
          <path d={svgPaths.p3f7c3f80} fill="var(--fill-0, #0099CF)" id="Vector_3" />
          <path d={svgPaths.p1fb96100} fill="var(--fill-0, #008AB2)" id="Vector_4" />
          <path d={svgPaths.p36a33100} fill="var(--fill-0, #0089DD)" id="Vector_5" />
          <path d={svgPaths.p3fa31580} fill="var(--fill-0, #0079CE)" id="Vector_6" />
          <path d={svgPaths.pa0b6e80} fill="var(--fill-0, #0059BF)" id="Vector_7" />
          <path d={svgPaths.p3a7bfe80} fill="var(--fill-0, #004D8C)" id="Vector_8" />
          <path d={svgPaths.p31c57e00} fill="var(--fill-0, #003EAB)" id="Vector_9" />
          <path d={svgPaths.p16840f00} fill="var(--fill-0, #2A38A2)" id="Vector_10" />
          <path d={svgPaths.p211b1380} fill="var(--fill-0, #9400A4)" id="Vector_11" />
          <path d={svgPaths.pebfbe00} fill="var(--fill-0, #B60094)" id="Vector_12" />
          <path d={svgPaths.p29756780} fill="var(--fill-0, #BA0064)" id="Vector_13" />
          <path d={svgPaths.p1c3d0140} fill="var(--fill-0, #DA0082)" id="Vector_14" />
          <path d={svgPaths.p11b47e00} fill="var(--fill-0, #F60087)" id="Vector_15" />
          <path d={svgPaths.p31075900} fill="var(--fill-0, #F8006D)" id="Vector_16" />
          <path d={svgPaths.p2ec80170} fill="var(--fill-0, #F90042)" id="Vector_17" />
          <path d={svgPaths.p35b17c00} fill="var(--fill-0, #EEB3D5)" id="Vector_18" />
          <path d={svgPaths.p1273bb00} fill="var(--fill-0, #F9ADD9)" id="Vector_19" />
          <path d={svgPaths.p15080500} fill="var(--fill-0, #F9DAEA)" id="Vector_20" />
          <path d={svgPaths.p705c000} fill="var(--fill-0, #E10030)" id="Vector_21" />
          <path d={svgPaths.p2a07d100} fill="var(--fill-0, #D900B6)" id="Vector_22" />
          <path d={svgPaths.pf3f5700} fill="var(--fill-0, #A235C4)" id="Vector_23" />
          <path d={svgPaths.p1b9bab00} fill="var(--fill-0, #009A73)" id="Vector_24" />
          <path d={svgPaths.p2bca0c00} fill="var(--fill-0, #005B4D)" id="Vector_25" />
          <path d={svgPaths.p29861500} fill="var(--fill-0, #131413)" id="Vector_26" />
          <path d={svgPaths.p39d41c00} fill="var(--fill-0, #FEFEFE)" id="Vector_27" />
          <path d={svgPaths.p33d57cb0} fill="var(--fill-0, #C4DAED)" id="Vector_28" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[-106.25%_-116.67%]" data-name="Group">
      <div className="absolute flex inset-[-106.25%_-116.67%] items-center justify-center">
        <div className="flex-none h-[1033.333px] rotate-90 w-[462.5px]">
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
    <div className="absolute h-[148px] left-0 top-0 w-[310px]">
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

export default function BrightWinter() {
  return (
    <div className="relative size-full" data-name="Bright winter">
      <Frame1 />
    </div>
  );
}