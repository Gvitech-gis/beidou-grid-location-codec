// import Codec2D from "../dist/index";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Codec2D } = require("../dist/index");
console.log("---------------------------------------");
const lngLatNE = {
  lngDegree: 116,
  lngMinute: 18,
  lngSecond: 45.37,
  lngDirection: "E",
  latDegree: 39,
  latMinute: 59,
  latSecond: 35.38,
  latDirection: "N"
};
console.log("坐标: ", lngLatNE);
const codeNE = Codec2D.encode(lngLatNE, 10);
console.log("北斗二维网格位置码: ", codeNE);
console.log("解码 => ", Codec2D.decode(codeNE));
console.log("-------------------");
console.log("参照 N50J47539B82553461");
const referNE1 = Codec2D.refer(codeNE, "N50J47539B82553461");
console.log(referNE1);
console.log("还原");
const deReferNE1 = Codec2D.deRefer(referNE1);
console.log(deReferNE1);
console.log("-------------------");
console.log("参照 N50J47539b82");
const referNE2 = Codec2D.refer(codeNE, "N50J47539b82");
console.log(referNE2);
console.log("还原");
const deReferNE2 = Codec2D.deRefer(referNE2);
console.log(deReferNE2);
console.log("-------------------");
console.log("参照 N50J4754909");
const referNE3 = Codec2D.refer(codeNE, "N50J4754909");
console.log(referNE3);
console.log("还原");
const deReferNE3 = Codec2D.deRefer(referNE3);
console.log(deReferNE3);

console.log("---------------------------------------");
const lngLatSW = {
  lngDegree: 116,
  lngMinute: 18,
  lngSecond: 45.37,
  lngDirection: "W",
  latDegree: 39,
  latMinute: 59,
  latSecond: 35.38,
  latDirection: "S"
};
console.log("坐标: ", lngLatSW);
const codeSW = Codec2D.encode(lngLatSW, 10);
console.log("北斗二维网格位置码: ", codeSW);
console.log("解码 => ", Codec2D.decode(codeSW));
console.log("-------------------");
console.log("参照 S11J47539B82553461");
const referSW1 = Codec2D.refer(codeSW, "S11J47539B82553461");
console.log(referSW1);
console.log("还原");
const deReferSW1 = Codec2D.deRefer(referSW1);
console.log(deReferSW1);
console.log("-------------------");
console.log("参照 S11J47539b82");
const referSW2 = Codec2D.refer(codeSW, "S11J47539b82");
console.log(referSW2);
console.log("还原");
const deReferSW2 = Codec2D.deRefer(referSW2);
console.log(deReferSW2);
console.log("-------------------");
console.log("参照 S11J4754909");
const referSW3 = Codec2D.refer(codeSW, "S11J4754909");
console.log(referSW3);
console.log("还原");
const deReferSW3 = Codec2D.deRefer(referSW3);
console.log(deReferSW3);

console.log("---------------------------------------");
console.log("参考特殊样例1:");
const codeTarget1 = "N50J47539b82";
const codeReference1 = "N50J47539b8";
console.log(`${codeTarget1} 参考 ${codeReference1}`);
const codeRefer1 = Codec2D.refer(codeTarget1, codeReference1);
console.log(codeRefer1);
console.log("-------------------");
console.log("参考特殊样例2:");
const codeTarget2 = "S50J4750908";
const codeReference2 = "S50J474E9E8";
console.log(`${codeTarget2} 参考 ${codeReference2}`);
const codeRefer2 = Codec2D.refer(codeTarget2, codeReference2);
console.log(codeRefer2);

console.log("---------------------------------------");
// 缩短北斗二维网格位置码
const codeToBeShorten = "N50J47539B8255346152";
console.log("需要缩短的编码:", codeToBeShorten);

for (let i = 9; i >= 2; i--) {
  console.log(`缩短到第${i}级的编码是:`, Codec2D.shorten(codeToBeShorten, i));
}

console.log("---------------------------------------");
console.log(
  "测试issue 位置码错误的判断方法 checkCodeFragmentRange 处理第一级网格时，将A60判定为错误位置码",
  Codec2D.decode("N60A")
);
