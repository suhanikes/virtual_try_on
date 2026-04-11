import svgPaths from "./svg-geeqtgrff4";
import { imgGroup } from "./svg-w9enn";

function Group1() {
  return (
    <div className="mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[362.834px_157.25px] mask-size-[311px_148px] relative size-full" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 462.5 1036.67">
        <g id="Group">
          <path d={svgPaths.p29364e00} fill="var(--fill-0, #FEFEFE)" id="Vector" />
          <path d={svgPaths.p12489e00} fill="var(--fill-0, #FCE48F)" id="Vector_2" />
          <path d={svgPaths.pb7d8800} fill="var(--fill-0, #FEFEFE)" id="Vector_3" />
          <path d={svgPaths.pb2e4300} fill="var(--fill-0, #B4CBE3)" id="Vector_4" />
          <path d={svgPaths.p1fbf0a70} fill="var(--fill-0, #0099CF)" id="Vector_5" />
          <path d={svgPaths.p2ba1d580} fill="var(--fill-0, #0089DD)" id="Vector_6" />
          <path d={svgPaths.p376a0680} fill="var(--fill-0, #0081A8)" id="Vector_7" />
          <path d={svgPaths.p318c0680} fill="var(--fill-0, #006482)" id="Vector_8" />
          <path d={svgPaths.p3ce86400} fill="var(--fill-0, #0059BF)" id="Vector_9" />
          <path d={svgPaths.p3c5d4a00} fill="var(--fill-0, #004D8C)" id="Vector_10" />
          <path d={svgPaths.p2f780d00} fill="var(--fill-0, #8F2AA0)" id="Vector_11" />
          <path d={svgPaths.pc94cb00} fill="var(--fill-0, #A235C4)" id="Vector_12" />
          <path d={svgPaths.p105f86c0} fill="var(--fill-0, #D900B6)" id="Vector_13" />
          <path d={svgPaths.pcf3e700} fill="var(--fill-0, #EE0086)" id="Vector_14" />
          <path d={svgPaths.p24758f00} fill="var(--fill-0, #F8006D)" id="Vector_15" />
          <path d={svgPaths.p166a3e00} fill="var(--fill-0, #F8006D)" id="Vector_16" />
          <path d={svgPaths.p4c8a950} fill="var(--fill-0, #E10030)" id="Vector_17" />
          <path d={svgPaths.p3ce78200} fill="var(--fill-0, #BA0064)" id="Vector_18" />
          <path d={svgPaths.p1f37b700} fill="var(--fill-0, #A8006A)" id="Vector_19" />
          <path d={svgPaths.p1c1489f0} fill="var(--fill-0, #97005A)" id="Vector_20" />
          <path d={svgPaths.p3a9f0300} fill="var(--fill-0, #650092)" id="Vector_21" />
          <path d={svgPaths.p111b2500} fill="var(--fill-0, #009A73)" id="Vector_22" />
          <path d={svgPaths.p18466300} fill="var(--fill-0, #00A242)" id="Vector_23" />
          <path d={svgPaths.p2310f600} fill="var(--fill-0, #005B4D)" id="Vector_24" />
          <path d={svgPaths.p11b51080} fill="var(--fill-0, #002E76)" id="Vector_25" />
          <path d={svgPaths.p4866d00} fill="var(--fill-0, #001F66)" id="Vector_26" />
          <path d={svgPaths.p148f6a00} fill="var(--fill-0, #131413)" id="Vector_27" />
          <path d={svgPaths.p1e318300} fill="var(--fill-0, #391700)" id="Vector_28" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[-54.61%_-167.22%_-6%_-143.89%]" data-name="Group">
      <div className="absolute flex inset-[-54.61%_-167.21%_-6%_-143.89%] items-center justify-center">
        <div className="flex-none h-[1036.667px] rotate-90 w-[462.5px]">
          <Group1 />
        </div>
      </div>
    </div>
  );
}

function MaskGroup() {
  return (
    <div className="absolute contents inset-[0_-23.33%_48.6%_0]" data-name="Mask group">
      <Group />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute h-[287.961px] left-0 top-0 w-[252.169px]">
      <MaskGroup />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute h-[288px] left-0 top-0 w-[252px]">
      <Frame />
    </div>
  );
}

export default function DarkWinter() {
  return (
    <div className="relative size-full" data-name="Dark winter">
      <Frame1 />
    </div>
  );
}