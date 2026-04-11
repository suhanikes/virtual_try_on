import svgPaths from "./svg-hm81edkr1l";
import imgImageStyleReference from "figma:asset/45fc320a3275a9f925304109910c78cd54ebbbee.png";
import imgContainer from "figma:asset/6a37611915d9e89681b11c69f3802138f8bbd3e3.png";
import imgContainer1 from "figma:asset/05e5f26c75ad81341e5965c5f2909f69dba8ff72.png";
import imgContainer2 from "figma:asset/c1151fe1ce32af7ce55ff9ac36d3460caf66e831.png";
import imgContainer3 from "figma:asset/ece298d0ec2c16f10310d45724b276a6035cb503.png";
import imgImage37 from "figma:asset/feb0bc35a8dca2c0c7f58d5466639dcec1d356b5.png";
import imgContainer4 from "figma:asset/015126a1c05ce5ee514507c8c0ced5ae9a7f67ae.png";
import imgContainer5 from "figma:asset/cf533f9e461ec4b23091c1aa4092a4276cf6c24f.png";
import { imgGroup, imgGroup1, imgGroup2 } from "./svg-7de81";

function Icon() {
  return (
    <div className="relative shrink-0 size-[21px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 21">
        <g id="Icon">
          <path d={svgPaths.p444d0a0} id="Vector" stroke="var(--stroke-0, #D0D0D0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
          <path d={svgPaths.p33b56700} id="Vector_2" stroke="var(--stroke-0, #D0D0D0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
        </g>
      </svg>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] size-[32px] top-0" data-name="Container">
      <Icon />
    </div>
  );
}

function Heading1() {
  return (
    <div className="absolute content-stretch flex h-[20px] items-start left-[38px] top-[6px] w-[116.711px]" data-name="Heading 3">
      <p className="font-['Cabin:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[#424242] text-[14px] tracking-[0.7px] uppercase whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        About Season
      </p>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute h-[32px] left-[24px] top-[24px] w-[290px]" data-name="Container">
      <Container4 />
      <Heading1 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[22.75px] left-[24px] top-[72px] w-[290px]" data-name="Paragraph">
      <p className="absolute font-['Cabin:Regular',sans-serif] font-normal leading-[22.75px] left-0 text-[#6a7282] text-[14px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Bright, clear colors with warm undertones
      </p>
    </div>
  );
}

function Text() {
  return (
    <div className="h-[16px] relative shrink-0 w-[60.211px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Cabin:Medium',sans-serif] font-medium leading-[16px] left-0 text-[#6a7282] text-[12px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Total Colors
        </p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[60.273px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Cabin:Bold',sans-serif] font-bold leading-[20px] left-0 text-[#d0d0d0] text-[14px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          56 shades
        </p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex h-[20px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Text />
      <Text1 />
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute content-stretch flex flex-col h-[37px] items-start left-[24px] pt-[17px] top-[110.75px] w-[290px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#e9d4ff] border-solid border-t inset-0 pointer-events-none" />
      <Container6 />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute border border-[rgba(229,218,246,0.68)] border-solid h-[173.75px] left-[7px] rounded-[24px] top-[749px] w-[340px]" data-name="Container">
      <Container3 />
      <Paragraph />
      <Container5 />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[1195.172px] left-0 top-0 w-[354.922px]" data-name="Container">
      <Container2 />
    </div>
  );
}

function Container7() {
  return <div className="absolute h-[1195.172px] left-[1061.96px] top-0 w-[1.044px]" data-name="Container" />;
}

function ImageStyleReference() {
  return (
    <div className="absolute h-[561.157px] left-0 top-0 w-[584.539px]" data-name="Image (Style reference)">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageStyleReference} />
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute bg-[#f3f4f6] h-[561.157px] left-0 top-0 w-[596.229px]" data-name="Container">
      <ImageStyleReference />
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.7)] border-[1.461px] border-[rgba(243,232,255,0.5)] border-solid h-[564.08px] left-[370px] overflow-clip rounded-[35.072px] shadow-[0px_14.613px_21.92px_-4.384px_rgba(0,0,0,0.1),0px_5.845px_8.768px_-5.845px_rgba(0,0,0,0.1)] top-0 w-[586px]" data-name="Container">
      <Container9 />
    </div>
  );
}

function Heading2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[104.922px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Cabin:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[#424242] text-[14px] tracking-[0.7px] uppercase whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          necklines Testing
        </p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute content-stretch flex h-[32px] items-center left-[24px] top-[24px] w-[310px]" data-name="Container">
      <Heading2 />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute left-[166px] size-[82px] top-[57px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 82 82">
        <g id="Container">
          <path d={svgPaths.p19217100} fill="var(--fill-0, #E5DAF6)" fillOpacity="0.38" />
          <path d={svgPaths.p23ab1980} fill="var(--fill-0, #9E6AFF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute left-[305.5px] size-[82px] top-[57px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 82 82">
        <g id="Container">
          <path d={svgPaths.p19217100} fill="var(--fill-0, #E5DAF6)" fillOpacity="0.38" />
          <path d={svgPaths.p3177ab00} fill="var(--fill-0, #9E6AFF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.7)] border border-[rgba(229,218,246,0.5)] border-solid h-[171px] left-[370px] rounded-[24px] top-[586px] w-[578px]" data-name="Container">
      <Container11 />
      <Container12 />
      <Container13 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="h-[20px] relative shrink-0 w-[104.922px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Cabin:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[#424242] text-[14px] tracking-[0.7px] uppercase whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Fabric Guide
        </p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute content-stretch flex h-[32px] items-center left-[24px] top-[24px] w-[310px]" data-name="Container">
      <Heading3 />
    </div>
  );
}

function Container17() {
  return <div className="absolute bg-[#f3f4f6] left-0 size-[74.175px] top-0" data-name="Container" />;
}

function Text2() {
  return <div className="h-[12.45px] shrink-0 w-[27.039px]" data-name="Text" />;
}

function Container18() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[74.175px] top-0" data-name="Container">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover opacity-87 size-full" src={imgContainer} />
        <div className="absolute bg-[rgba(0,0,0,0)] inset-0" />
      </div>
      <Text2 />
    </div>
  );
}

function Button() {
  return (
    <div className="absolute left-[10.89px] overflow-clip rounded-[12.45px] size-[74.175px] top-0" data-name="Button">
      <Container17 />
      <Container18 />
    </div>
  );
}

function Container19() {
  return <div className="absolute bg-[#f3f4f6] left-0 size-[74.182px] top-0" data-name="Container" />;
}

function Text3() {
  return <div className="h-[12.45px] shrink-0 w-[40.212px]" data-name="Text" />;
}

function Container20() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[74.182px] top-0" data-name="Container">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover opacity-87 size-full" src={imgContainer1} />
        <div className="absolute bg-[rgba(0,0,0,0)] inset-0" />
      </div>
      <Text3 />
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute left-[94.41px] overflow-clip rounded-[12.45px] size-[74.182px] top-0" data-name="Button">
      <Container19 />
      <Container20 />
    </div>
  );
}

function Container21() {
  return <div className="absolute bg-[#f3f4f6] left-0 size-[74.182px] top-0" data-name="Container" />;
}

function Text4() {
  return <div className="h-[12.45px] shrink-0 w-[34.48px]" data-name="Text" />;
}

function Container22() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 pr-[0.006px] size-[74.182px] top-0" data-name="Container">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover opacity-87 size-full" src={imgContainer2} />
        <div className="absolute bg-[rgba(0,0,0,0)] inset-0" />
      </div>
      <Text4 />
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute left-[177.92px] overflow-clip rounded-[12.45px] size-[74.182px] top-0" data-name="Button">
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
    <div className="absolute h-[74px] left-[25px] top-[77px] w-[263px]" data-name="Container">
      <Group6 />
    </div>
  );
}

function Container23() {
  return <div className="absolute bg-[#f3f4f6] left-0 size-[74.175px] top-0" data-name="Container" />;
}

function Text5() {
  return (
    <div className="absolute h-[12.45px] left-[-256.36px] top-[30.86px] w-[37.544px]" data-name="Text">
      <p className="-translate-x-1/2 absolute font-['Cabin:Bold',sans-serif] font-bold leading-[12.45px] left-[19.23px] text-[#424242] text-[9.337px] text-center top-[0.39px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Velvet
      </p>
    </div>
  );
}

function Container24() {
  return (
    <div className="absolute left-0 size-[74.175px] top-0" data-name="Container">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover opacity-30 size-full" src={imgContainer3} />
        <div className="absolute bg-[rgba(0,0,0,0)] inset-0" />
      </div>
      <Text5 />
      <div className="absolute h-[778.107px] left-[-219px] top-[-352px] w-[549.343px]" data-name="image 37">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage37} />
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute left-[288px] overflow-clip rounded-[12.45px] size-[74.175px] top-[77px]" data-name="Button">
      <Container23 />
      <Container24 />
    </div>
  );
}

function Container25() {
  return <div className="absolute bg-[#f3f4f6] left-0 size-[74.182px] top-0" data-name="Container" />;
}

function Text6() {
  return <div className="h-[12.45px] shrink-0 w-[34.182px]" data-name="Text" />;
}

function Container26() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[74.182px] top-0" data-name="Container">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover opacity-87 size-full" src={imgContainer4} />
        <div className="absolute bg-[rgba(0,0,0,0)] inset-0" />
      </div>
      <Text6 />
    </div>
  );
}

function Button4() {
  return (
    <div className="absolute left-[371.51px] overflow-clip rounded-[12.45px] size-[74.182px] top-[77px]" data-name="Button">
      <Container25 />
      <Container26 />
    </div>
  );
}

function Container27() {
  return <div className="absolute bg-[#f3f4f6] left-0 size-[74.182px] top-0" data-name="Container" />;
}

function Text7() {
  return <div className="h-[12.45px] shrink-0 w-[39.44px]" data-name="Text" />;
}

function Container28() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 pr-[0.006px] size-[74.182px] top-0" data-name="Container">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgba(229, 218, 246, 0.3) 0%, rgba(229, 218, 246, 0.3) 100%)" }} />
        <img alt="" className="absolute max-w-none object-cover opacity-87 size-full" src={imgContainer5} />
      </div>
      <Text7 />
    </div>
  );
}

function Button5() {
  return (
    <div className="absolute left-[455.03px] overflow-clip rounded-[12.45px] size-[74.182px] top-[77px]" data-name="Button">
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
      <p className="relative shrink-0" style={{ fontVariationSettings: "'wdth' 100" }}>
        Silk
      </p>
      <p className="relative shrink-0" style={{ fontVariationSettings: "'wdth' 100" }}>
        Cotton
      </p>
      <p className="relative shrink-0" style={{ fontVariationSettings: "'wdth' 100" }}>
        Linen
      </p>
      <p className="relative shrink-0" style={{ fontVariationSettings: "'wdth' 100" }}>
        Velvet
      </p>
      <p className="relative shrink-0" style={{ fontVariationSettings: "'wdth' 100" }}>
        Wool
      </p>
      <p className="relative shrink-0" style={{ fontVariationSettings: "'wdth' 100" }}>
        Denim
      </p>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.7)] border border-[rgba(229,218,246,0.5)] border-solid h-[194px] left-[371px] rounded-[24px] top-[773px] w-[585px]" data-name="Container">
      <Container15 />
      <Group16 />
      <Frame1 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute h-[1065px] left-[32px] top-[129px] w-[956px]" data-name="Container">
      <Container1 />
      <Container7 />
      <Container8 />
      <Container10 />
      <Container14 />
    </div>
  );
}

function Heading4() {
  return (
    <div className="h-[20px] relative shrink-0 w-[118.094px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Cabin:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[#424242] text-[14px] tracking-[0.7px] uppercase whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Select Season
        </p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="absolute content-stretch flex h-[32px] items-center left-[24px] top-[24px] w-[290px]" data-name="Container">
      <Heading4 />
    </div>
  );
}

function Frame() {
  return <div className="absolute h-[148px] left-[15px] top-[82px] w-[308px]" />;
}

function Group1() {
  return (
    <div className="mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[359.385px_197.354px] mask-size-[308px_185.745px] relative size-full" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 580.453 1026.67">
        <g id="Group">
          <path d={svgPaths.p1452cff0} fill="var(--fill-0, #FFF9D4)" id="Vector" />
          <path d={svgPaths.p219bbe80} fill="var(--fill-0, #FFE200)" id="Vector_2" />
          <path d={svgPaths.p1bd832c0} fill="var(--fill-0, #CCE100)" id="Vector_3" />
          <path d={svgPaths.p3b53ff00} fill="var(--fill-0, #FFD05A)" id="Vector_4" />
          <path d={svgPaths.p2e7bee00} fill="var(--fill-0, #FFCB00)" id="Vector_5" />
          <path d={svgPaths.p37709600} fill="var(--fill-0, #FFB400)" id="Vector_6" />
          <path d={svgPaths.p2b574f00} fill="var(--fill-0, #FFA553)" id="Vector_7" />
          <path d={svgPaths.p2f9c0900} fill="var(--fill-0, #FF8565)" id="Vector_8" />
          <path d={svgPaths.p25617500} fill="var(--fill-0, #FF7900)" id="Vector_9" />
          <path d={svgPaths.p1d89a400} fill="var(--fill-0, #E920BA)" id="Vector_10" />
          <path d={svgPaths.p39224a00} fill="var(--fill-0, #A235C4)" id="Vector_11" />
          <path d={svgPaths.p21029000} fill="var(--fill-0, #8F2AA0)" id="Vector_12" />
          <path d={svgPaths.p2e975f00} fill="var(--fill-0, #005790)" id="Vector_13" />
          <path d={svgPaths.p2f82d180} fill="var(--fill-0, #0081A8)" id="Vector_14" />
          <path d={svgPaths.p2bdaec00} fill="var(--fill-0, #008AB2)" id="Vector_15" />
          <path d={svgPaths.p271c0170} fill="var(--fill-0, #0091AD)" id="Vector_16" />
          <path d={svgPaths.pfad4800} fill="var(--fill-0, #00A899)" id="Vector_17" />
          <path d={svgPaths.p2db2bf40} fill="var(--fill-0, #59C7D8)" id="Vector_18" />
          <path d={svgPaths.p314def30} fill="var(--fill-0, #B079CF)" id="Vector_19" />
          <path d={svgPaths.p3113c900} fill="var(--fill-0, #B15F00)" id="Vector_20" />
          <path d={svgPaths.p1e6f3c00} fill="var(--fill-0, #B15F00)" id="Vector_21" />
          <path d={svgPaths.p1faf2bf0} fill="var(--fill-0, #CD4B00)" id="Vector_22" />
          <path d={svgPaths.p2b7b3880} fill="var(--fill-0, #766EC8)" id="Vector_23" />
          <path d={svgPaths.p2da9c900} fill="var(--fill-0, #C7BBA4)" id="Vector_24" />
          <path d={svgPaths.pf04bf00} fill="var(--fill-0, #C0B5AA)" id="Vector_25" />
          <path d={svgPaths.p348bae80} fill="var(--fill-0, #EF0000)" id="Vector_26" />
          <path d={svgPaths.p39ba0b00} fill="var(--fill-0, #F90042)" id="Vector_27" />
          <path d={svgPaths.p300e1100} fill="var(--fill-0, #604526)" id="Vector_28" />
          <path d={svgPaths.p10566900} fill="var(--fill-0, #493436)" id="Vector_29" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[43.66%_-100.97%_-24.39%_-101%]" data-name="Group">
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
    <div className="absolute contents inset-[71.11%_4.71%_3.06%_4.71%]" data-name="Mask group">
      <Group />
    </div>
  );
}

function Group11() {
  return (
    <div className="absolute contents inset-[71.11%_4.71%_3.06%_4.71%]">
      <MaskGroup />
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

function Group9() {
  return (
    <div className="absolute contents left-[15px] top-[510px]">
      <Group8 />
    </div>
  );
}

function Group10() {
  return (
    <div className="absolute contents left-[15px] top-[510px]">
      <Group9 />
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute contents left-[14px] top-[509px]">
      <Group11 />
      <Group10 />
      <p className="-translate-x-1/2 absolute font-['Cabin:Medium',sans-serif] font-medium h-[28.866px] leading-[24px] left-[267.5px] text-[#424242] text-[12px] text-center top-[644.29px] w-[71px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Light Spring
      </p>
    </div>
  );
}

function Group3() {
  return (
    <div className="mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[361.644px_198.4px] mask-size-[310px_186.729px] relative size-full" data-name="Group" style={{ maskImage: `url('${imgGroup1}')` }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 583.528 1033.33">
        <g id="Group">
          <path d={svgPaths.p33dffa00} fill="var(--fill-0, #FF9E85)" id="Vector" />
          <path d={svgPaths.p2e02f280} fill="var(--fill-0, #FFD05A)" id="Vector_2" />
          <path d={svgPaths.p396fdf70} fill="var(--fill-0, #FFE200)" id="Vector_3" />
          <path d={svgPaths.p26073630} fill="var(--fill-0, #FFCB00)" id="Vector_4" />
          <path d={svgPaths.p1e2c1b00} fill="var(--fill-0, #FFB400)" id="Vector_5" />
          <path d={svgPaths.p34561e00} fill="var(--fill-0, #FBB100)" id="Vector_6" />
          <path d={svgPaths.p3a0c3bc0} fill="var(--fill-0, #D8C200)" id="Vector_7" />
          <path d={svgPaths.p128c4a00} fill="var(--fill-0, #C1D800)" id="Vector_8" />
          <path d={svgPaths.p11e1ba80} fill="var(--fill-0, #A3C30E)" id="Vector_9" />
          <path d={svgPaths.p155b2080} fill="var(--fill-0, #A7AD00)" id="Vector_10" />
          <path d={svgPaths.p1f25ec00} fill="var(--fill-0, #63AC41)" id="Vector_11" />
          <path d={svgPaths.p60cb280} fill="var(--fill-0, #47C530)" id="Vector_12" />
          <path d={svgPaths.p18abcb00} fill="var(--fill-0, #00A242)" id="Vector_13" />
          <path d={svgPaths.p34324300} fill="var(--fill-0, #00A899)" id="Vector_14" />
          <path d={svgPaths.p3fb2bc00} fill="var(--fill-0, #00D0D5)" id="Vector_15" />
          <path d={svgPaths.p23925480} fill="var(--fill-0, #3FD0B7)" id="Vector_16" />
          <path d={svgPaths.p2f683600} fill="var(--fill-0, #9595D8)" id="Vector_17" />
          <path d={svgPaths.p1684da00} fill="var(--fill-0, #A235C4)" id="Vector_18" />
          <path d={svgPaths.p12c64480} fill="var(--fill-0, #B15F00)" id="Vector_19" />
          <path d={svgPaths.p10d76f00} fill="var(--fill-0, #C06651)" id="Vector_20" />
          <path d={svgPaths.p3ee4d080} fill="var(--fill-0, #6E4E37)" id="Vector_21" />
          <path d={svgPaths.p7712540} fill="var(--fill-0, #1E3D8F)" id="Vector_22" />
          <path d={svgPaths.p14e0da80} fill="var(--fill-0, #1261B1)" id="Vector_23" />
          <path d={svgPaths.p20328500} fill="var(--fill-0, #EF0000)" id="Vector_24" />
          <path d={svgPaths.p3f59a380} fill="var(--fill-0, #FF3F24)" id="Vector_25" />
          <path d={svgPaths.p39d59000} fill="var(--fill-0, #FF7900)" id="Vector_26" />
          <path d={svgPaths.p238f3f00} fill="var(--fill-0, #FF8700)" id="Vector_27" />
          <path d={svgPaths.p12507b80} fill="var(--fill-0, #FFA553)" id="Vector_28" />
        </g>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents inset-[14.72%_-101.97%_4.12%_-101.95%]" data-name="Group">
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
    <div className="absolute contents inset-[42.32%_4.41%_31.71%_4.41%]" data-name="Mask group">
      <Group2 />
    </div>
  );
}

function Text8() {
  return <div className="h-[16.8px] shrink-0 w-[85.427px]" data-name="Text" />;
}

function Container32() {
  return (
    <div className="absolute content-stretch flex h-[16.8px] items-center left-[16.8px] top-[46.2px] w-[270.9px]" data-name="Container">
      <Text8 />
    </div>
  );
}

function Container31() {
  return (
    <div className="-translate-x-1/2 absolute h-[100.682px] left-[calc(50%+2.25px)] top-[391.32px] w-[304.5px]" data-name="Container">
      <p className="-translate-x-1/2 absolute font-['Cabin:Medium',sans-serif] font-medium h-[23px] leading-[24px] left-[251.5px] text-[#424242] text-[12px] text-center top-[43px] w-[71px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Warm Spring
      </p>
      <Container32 />
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

function Group13() {
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
    <div className="mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[359.317px_201px] mask-size-[308px_189px] relative size-full" data-name="Group" style={{ maskImage: `url('${imgGroup2}')` }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 590.812 1026.67">
        <g id="Group">
          <path d={svgPaths.p1f6a900} fill="var(--fill-0, #FFF9D4)" id="Vector" />
          <path d={svgPaths.p12d9480} fill="var(--fill-0, #F2EB92)" id="Vector_2" />
          <path d={svgPaths.p24a6f000} fill="var(--fill-0, #F9E09C)" id="Vector_3" />
          <path d={svgPaths.p14c64df0} fill="var(--fill-0, #FFCDA3)" id="Vector_4" />
          <path d={svgPaths.p26625080} fill="var(--fill-0, #FFC594)" id="Vector_5" />
          <path d={svgPaths.p212ba300} fill="var(--fill-0, #FFDA4B)" id="Vector_6" />
          <path d={svgPaths.p3963b080} fill="var(--fill-0, #D5EC8F)" id="Vector_7" />
          <path d={svgPaths.p12e74000} fill="var(--fill-0, #CDDFB7)" id="Vector_8" />
          <path d={svgPaths.p2b4e500} fill="var(--fill-0, #93E2D3)" id="Vector_9" />
          <path d={svgPaths.p2108280} fill="var(--fill-0, #95DEEA)" id="Vector_10" />
          <path d={svgPaths.p2904cf00} fill="var(--fill-0, #8DCDEE)" id="Vector_11" />
          <path d={svgPaths.p213d8900} fill="var(--fill-0, #C9B3E8)" id="Vector_12" />
          <path d={svgPaths.p15e70b00} fill="var(--fill-0, #E0A7E7)" id="Vector_13" />
          <path d={svgPaths.p2d442600} fill="var(--fill-0, #CCC7A3)" id="Vector_14" />
          <path d={svgPaths.p5eaa680} fill="var(--fill-0, #D8BB86)" id="Vector_15" />
          <path d={svgPaths.p34b5ac80} fill="var(--fill-0, #E0B389)" id="Vector_16" />
          <path d={svgPaths.p1d081000} fill="var(--fill-0, #D59E70)" id="Vector_17" />
          <path d={svgPaths.p17d18800} fill="var(--fill-0, #C7A28F)" id="Vector_18" />
          <path d={svgPaths.p3e5fc080} fill="var(--fill-0, #645B54)" id="Vector_19" />
          <path d={svgPaths.p1fab6b80} fill="var(--fill-0, #857A77)" id="Vector_20" />
          <path d={svgPaths.p616f780} fill="var(--fill-0, #D0C3AC)" id="Vector_21" />
          <path d={svgPaths.p18e6c00} fill="var(--fill-0, #47C530)" id="Vector_22" />
          <path d={svgPaths.p21801180} fill="var(--fill-0, #9595D8)" id="Vector_23" />
          <path d={svgPaths.p34eac200} fill="var(--fill-0, #FF8565)" id="Vector_24" />
          <path d={svgPaths.p18b2de00} fill="var(--fill-0, #FFA553)" id="Vector_25" />
          <path d={svgPaths.p3a593c00} fill="var(--fill-0, #FFA687)" id="Vector_26" />
          <path d={svgPaths.p2f9c1c00} fill="var(--fill-0, #00D0D5)" id="Vector_27" />
          <path d={svgPaths.p117ddc80} fill="var(--fill-0, #3FD0B7)" id="Vector_28" />
        </g>
      </svg>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents inset-[-106.35%_-116.67%_-106.25%_-116.66%]" data-name="Group">
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
    <div className="absolute contents inset-0" data-name="Mask group">
      <Group4 />
    </div>
  );
}

function LightSpring() {
  return (
    <div className="absolute h-[189px] left-[18px] top-[94px] w-[308px]" data-name="light Spring">
      <MaskGroup2 />
    </div>
  );
}

function Group14() {
  return (
    <div className="absolute contents left-[18px] top-[94px]">
      <LightSpring />
    </div>
  );
}

function Button6() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[189px] left-[18px] overflow-clip rounded-[16px] shadow-[0px_0px_0px_2px_white,0px_0px_0px_6px_#9e6aff,0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] top-[94px] w-[305px]" data-name="Button">
      <p className="absolute font-['Cabin:Medium',sans-serif] font-medium inset-[73.54%_7.21%_14.29%_72.46%] leading-[24px] text-[#424242] text-[12px] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
        Clear Spring
      </p>
    </div>
  );
}

function Group15() {
  return (
    <div className="absolute contents left-[17px] top-[93px]">
      <Group14 />
      <Button6 />
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.7)] border border-[rgba(243,232,255,0.5)] border-solid h-[719px] left-0 rounded-[24px] top-0 w-[340px]" data-name="Container">
      <Container30 />
      <Frame />
      <Group12 />
      <Group13 />
      <Group15 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute h-[719px] left-[39px] top-[129px] w-[340px]">
      <Container29 />
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[26.401px] relative shrink-0 w-full" data-name="Heading 2">
      <p className="absolute font-['Cabin:Bold',sans-serif] font-bold leading-[26.401px] left-0 text-[#424242] text-[19.801px] top-[0.83px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Color Palette
      </p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[16.501px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Cabin:Regular',sans-serif] font-normal leading-[16.501px] left-0 text-[#6a7282] text-[11.551px] top-[0.41px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        7 × 8 color matrix
      </p>
    </div>
  );
}

function Container35() {
  return (
    <div className="h-[46.202px] relative shrink-0 w-[130.95px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[3.3px] items-start relative size-full">
        <Heading />
        <Paragraph1 />
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="bg-[#9e6aff] h-[26.401px] relative rounded-[13841910px] shadow-[0px_3.3px_4.95px_0px_rgba(0,0,0,0.1),0px_1.65px_3.3px_0px_rgba(0,0,0,0.1)] shrink-0 w-[118.142px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Cabin:Bold',sans-serif] font-bold leading-[13.201px] left-[16.5px] text-[9.901px] text-white top-[7.01px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Your perfect match
        </p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute content-stretch flex gap-[178px] h-[46.202px] items-center left-[26.4px] top-[26.4px] w-[453.774px]" data-name="Container">
      <Container35 />
      <Container36 />
    </div>
  );
}

function Container40() {
  return <div className="absolute bg-[#fffffa] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container41() {
  return <div className="absolute bg-[#fffff0] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container42() {
  return <div className="absolute bg-[#f0eada] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container43() {
  return <div className="absolute bg-[#e3dac9] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container44() {
  return <div className="absolute bg-[#c7bba4] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container45() {
  return <div className="absolute bg-[#d7d2cb] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container46() {
  return <div className="absolute bg-[#cac1b4] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container47() {
  return <div className="absolute bg-[#c0b5aa] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container39() {
  return (
    <div className="absolute h-[44.282px] left-0 top-0 w-[405.921px]" data-name="Container">
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
  return <div className="absolute bg-[#a09998] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container50() {
  return <div className="absolute bg-[#8d918d] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container51() {
  return <div className="absolute bg-[#4f3835] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container52() {
  return <div className="absolute bg-[#5a3e36] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container53() {
  return <div className="absolute bg-[#3d4849] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container54() {
  return <div className="absolute bg-[#262e2f] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container55() {
  return <div className="absolute bg-[#000080] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container56() {
  return <div className="absolute bg-[#191970] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container48() {
  return (
    <div className="absolute h-[44.282px] left-0 top-[51.66px] w-[405.921px]" data-name="Container">
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
  return <div className="absolute bg-[#39f] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container59() {
  return <div className="absolute bg-[#4169e1] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container60() {
  return <div className="absolute bg-[#8c00fa] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container61() {
  return <div className="absolute bg-[#766ec8] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container62() {
  return <div className="absolute bg-[#5a4fcf] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container63() {
  return <div className="absolute bg-[#7df9ff] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container64() {
  return <div className="absolute bg-[#00f0f0] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container65() {
  return <div className="absolute bg-[#3fe0d0] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container57() {
  return (
    <div className="absolute h-[44.282px] left-0 top-[103.33px] w-[405.921px]" data-name="Container">
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
  return <div className="absolute bg-[#00af9d] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container68() {
  return <div className="absolute bg-[#009473] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container69() {
  return <div className="absolute bg-[#149c88] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container70() {
  return <div className="absolute bg-[#008381] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container71() {
  return <div className="absolute bg-[#9acd32] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container72() {
  return <div className="absolute bg-[#32cd32] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container73() {
  return <div className="absolute bg-[#4cbb17] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container74() {
  return <div className="absolute bg-[#0b6623] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container66() {
  return (
    <div className="absolute h-[44.282px] left-0 top-[154.99px] w-[405.921px]" data-name="Container">
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
  return <div className="absolute bg-[#fff44f] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container77() {
  return <div className="absolute bg-[#ffff31] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container78() {
  return <div className="absolute bg-[#ffd662] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container79() {
  return <div className="absolute bg-[#ffc66e] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container80() {
  return <div className="absolute bg-[#f6c324] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container81() {
  return <div className="absolute bg-[#f5b31e] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container82() {
  return <div className="absolute bg-[#c72] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container83() {
  return <div className="absolute bg-[#d18e54] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container75() {
  return (
    <div className="absolute h-[44.282px] left-0 top-[206.65px] w-[405.921px]" data-name="Container">
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
  return <div className="absolute bg-[#ff6e6e] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container86() {
  return <div className="absolute bg-[#f96714] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container87() {
  return <div className="absolute bg-[#f94d00] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container88() {
  return <div className="absolute bg-[#e74a33] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container89() {
  return <div className="absolute bg-[#ff6347] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container90() {
  return <div className="absolute bg-[#ff4040] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container91() {
  return <div className="absolute bg-[#ff0800] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container92() {
  return <div className="absolute bg-[#b93a32] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container84() {
  return (
    <div className="absolute h-[44.282px] left-0 top-[258.31px] w-[405.921px]" data-name="Container">
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
  return <div className="absolute bg-[#f3bbca] left-0 shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container95() {
  return <div className="absolute bg-[#f6909d] left-[51.66px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container96() {
  return <div className="absolute bg-[#e35c7d] left-[103.33px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container97() {
  return <div className="absolute bg-[#ee6d8a] left-[154.99px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container98() {
  return <div className="absolute bg-[#f6c] left-[206.65px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container99() {
  return <div className="absolute bg-[#e0218a] left-[258.31px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container100() {
  return <div className="absolute bg-[#e3256b] left-[309.98px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container101() {
  return <div className="absolute bg-[#e30b5d] left-[361.64px] shadow-[0px_2.952px_4.428px_0px_rgba(0,0,0,0.1),0px_1.476px_2.952px_0px_rgba(0,0,0,0.1)] size-[44.282px] top-0" data-name="Container" />;
}

function Container93() {
  return (
    <div className="absolute h-[44.282px] left-0 top-[309.98px] w-[405.921px]" data-name="Container">
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
    <div className="-translate-x-1/2 absolute bg-[#9e6aff] h-[32.633px] left-[calc(50%+0.05px)] rounded-[17109008px] shadow-[0px_4.079px_6.119px_0px_rgba(0,0,0,0.1),0px_2.04px_4.079px_0px_rgba(0,0,0,0.1)] top-[404px] w-[146.026px]" data-name="Container">
      <p className="absolute font-['Cabin:Bold',sans-serif] font-bold leading-[16.316px] left-[26.51px] text-[12.237px] text-white top-[8.16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Refresh the Pallet
      </p>
    </div>
  );
}

function Heading5() {
  return (
    <div className="h-[20px] relative shrink-0 w-[104.922px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Cabin:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[#424242] text-[14px] tracking-[0.7px] uppercase whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Recommended shades
        </p>
      </div>
    </div>
  );
}

function Container104() {
  return (
    <div className="absolute content-stretch flex h-[32px] items-center left-[24px] top-[24px] w-[310px]" data-name="Container">
      <Heading5 />
    </div>
  );
}

function Button7() {
  return <div className="absolute bg-[#ff8c00] left-0 rounded-[2.507px] shadow-[0px_3.381px_5.071px_0px_rgba(0,0,0,0.1),0px_1.69px_3.381px_0px_rgba(0,0,0,0.1)] size-[57.894px] top-0" data-name="Button" />;
}

function Button8() {
  return <div className="absolute bg-[#be5400] left-[68.04px] rounded-[2.507px] shadow-[0px_3.381px_5.071px_0px_rgba(0,0,0,0.1),0px_1.69px_3.381px_0px_rgba(0,0,0,0.1)] size-[57.894px] top-0" data-name="Button" />;
}

function Button9() {
  return <div className="absolute bg-[#149c88] left-[136.07px] rounded-[2.507px] shadow-[0px_3.381px_5.071px_0px_rgba(0,0,0,0.1),0px_1.69px_3.381px_0px_rgba(0,0,0,0.1)] size-[57.894px] top-0" data-name="Button" />;
}

function Button10() {
  return <div className="absolute bg-[#ffff31] h-[57.471px] left-[201.15px] rounded-[2.507px] shadow-[0px_3.381px_3.381px_0px_rgba(0,0,0,0.11)] top-0 w-[60.852px]" data-name="Button" />;
}

function Frame2() {
  return (
    <div className="absolute h-[57.894px] left-0 top-0 w-[262px]">
      <Button7 />
      <Button8 />
      <Button9 />
      <Button10 />
    </div>
  );
}

function Container105() {
  return (
    <div className="-translate-x-1/2 absolute h-[57.894px] left-1/2 top-[83px] w-[262px]" data-name="Container">
      <Frame2 />
    </div>
  );
}

function Container103() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.7)] border border-[rgba(229,218,246,0.5)] border-solid h-[167px] left-0 rounded-[24px] top-[444px] w-[406px]" data-name="Container">
      <Container104 />
      <Container105 />
    </div>
  );
}

function Container38() {
  return (
    <div className="-translate-x-1/2 absolute h-[732.134px] left-[calc(50%-14.15px)] top-[24.77px] w-[405.921px]" data-name="Container">
      <Container39 />
      <Container48 />
      <Container57 />
      <Container66 />
      <Container75 />
      <Container84 />
      <Container93 />
      <Container102 />
      <Container103 />
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute h-[818.443px] left-[26.4px] top-[92.4px] w-[453.774px]" data-name="Container">
      <Container38 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[13.201px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Cabin:SemiBold',sans-serif] font-semibold leading-[13.201px] left-[calc(50%-0.39px)] text-[#9e9e9e] text-[9.901px] text-center top-[0.41px] tracking-[0.2475px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        www.Silsett.com
      </p>
    </div>
  );
}

function Container106() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.4px] pt-[14.026px] top-[960.65px] w-[453.774px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#f3e8ff] border-solid border-t-[0.825px] inset-0 pointer-events-none" />
      <Paragraph2 />
    </div>
  );
}

function Container33() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.7)] border-[0.825px] border-[rgba(243,232,255,0.5)] border-solid h-[1006px] left-[1014px] rounded-[19.801px] top-[130px] w-[481px]" data-name="Container">
      <Container34 />
      <Container37 />
      <Container106 />
    </div>
  );
}

function Ty() {
  return (
    <div className="absolute h-[1194px] left-0 top-0 w-[1517px]" data-name="TY">
      <Container />
      <Frame3 />
      <Container33 />
    </div>
  );
}

export default function Body() {
  return (
    <div className="relative size-full" data-name="Body">
      <Ty />
    </div>
  );
}