"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
class Codec2D {
  /**
   * 对一个经纬度坐标编码
   * @param lngLat 经纬度坐标，可以写小数形式（正负号表示方向），也可以写度分秒形式（均为正数，direction字段表示方向）
   * @param level 要编码到第几级，默认为10
   * @returns 北斗二维网格位置码
   */
  static encode(lngLat, level = 10) {
    var _a, _b, _c, _d, _e, _f;
    // 计算经度，换算成秒
    let lngInSec =
      (lngLat.lngDegree * 3600 +
        ((_a = lngLat.lngMinute) !== null && _a !== void 0
          ? _a
          : (lngLat.lngMinute = 0)) *
          60 +
        ((_b = lngLat.lngSecond) !== null && _b !== void 0
          ? _b
          : (lngLat.lngSecond = 0))) *
      (((_c = lngLat.lngDirection) !== null && _c !== void 0 ? _c : "E") === "W"
        ? -1
        : 1);
    // 计算纬度，换算成秒
    let latInSec =
      (lngLat.latDegree * 3600 +
        ((_d = lngLat.latMinute) !== null && _d !== void 0
          ? _d
          : (lngLat.latMinute = 0)) *
          60 +
        ((_e = lngLat.latSecond) !== null && _e !== void 0
          ? _e
          : (lngLat.latSecond = 0))) *
      (((_f = lngLat.latDirection) !== null && _f !== void 0 ? _f : "N") === "S"
        ? -1
        : 1);
    // 记录第n级网格的定位角点经纬度
    let lngN = 0,
      latN = 0;
    // 存储结果
    let resCode = "";
    for (let i = 0; i <= level; i++) {
      const t = this.encodeN(lngInSec, latInSec, lngN, latN, i);
      lngN += t[0];
      latN += t[1];
      resCode += t[2];
      // 从第二级开始，对称到东北半球计算，需要均取非负数计算
      if (i === 1) {
        lngInSec = Math.abs(lngInSec);
        latInSec = Math.abs(latInSec);
      }
    }
    return resCode;
  }
  /**
   * 以下坐标均以秒表示，且第2级开始所有半球均对称到东北半球处理（非负）
   * @param lngInSec 位置经度
   * @param latInSec 位置纬度
   * @param lngN 该位置所在第n级二维北斗网格的定位角点经度
   * @param latN 该位置所在第n级二维北斗网格的定位角点纬度
   * @param n 第n级
   * @returns [lngN+1, latN+1, codeN]
   */
  static encodeN(lngInSec, latInSec, lngN, latN, n) {
    if (n === 0) {
      // 南北半球标识码
      return [0, 0, latInSec > 0 ? "N" : "S"];
    } else if (n === 1) {
      // 根据国家基本比例尺地形图分幅和编号，按照1:1000000对第一级进行划分
      // 经度
      const a = Math.floor(lngInSec / data_1.gridSizes1[n][0]);
      // 前置位补零
      const aS = (a + 31).toString().padStart(2, "0");
      // 纬度
      const b = Math.floor(Math.abs(latInSec) / data_1.gridSizes1[n][1]);
      const bS = String.fromCharCode(65 + b);
      return [
        // a <0 时，需要取反并-1
        (a >= 0 ? a : -a - 1) * data_1.gridSizes1[n][0],
        b * data_1.gridSizes1[n][1],
        aS + bS
      ];
    } else {
      // 公式中需要+1，为了底下方便计算没有+1，因为之后还要-1
      const a = Math.floor((lngInSec - lngN) / data_1.gridSizes1[n][0]);
      const b = Math.floor((latInSec - latN) / data_1.gridSizes1[n][1]);
      switch (n) {
        case 2:
        case 4:
        case 5:
        case 7:
        case 8:
        case 9:
        case 10:
          return [
            a * data_1.gridSizes1[n][0],
            b * data_1.gridSizes1[n][1],
            a.toString(16).toUpperCase() + b.toString(16).toUpperCase()
          ];
        case 3:
          return [
            a * data_1.gridSizes1[n][0],
            b * data_1.gridSizes1[n][1],
            (b * 2 + a).toString()
          ];
        case 6:
          return [
            a * data_1.gridSizes1[n][0],
            b * data_1.gridSizes1[n][1],
            (b * 2 + a).toString()
          ];
      }
      throw new Error("n的大小不合格");
    }
  }
  /**
   * 对北斗二维网格位置码解码
   * @param code 需要解码的北斗二维网格位置码
   * @param decodeOption 解码选项，可不传
   * @returns 经纬度坐标
   */
  static decode(code, decodeOption = { form: "decimal" }) {
    // 层级
    const level = this.getCodeLevel(code);
    // 半球方向
    const directions = this.getDirections(code);
    // 南北半球标识
    const [latSign, lngSign] = this.getSigns(directions);
    // 用于累加结果
    let lng = 0;
    let lat = 0;
    // 对 1 ~ level 级进行解码
    for (let i = 1; i <= level; i++) {
      const pair = this.decodeN(code, i);
      lng += pair[0];
      lat += pair[1];
    }
    const result = { latDegree: 0, lngDegree: 0 };
    // 格式化输出结果
    if (decodeOption.form === "decimal") {
      // 用小数表示
      lng *= lngSign;
      lat *= latSign;
      result.lngDegree = lng / 3600;
      result.latDegree = lat / 3600;
    } else {
      // 用度分秒表示
      // 方向
      result.latDirection = latSign == -1 ? "S" : "N";
      result.lngDirection = lngSign == -1 ? "W" : "E";
      // 经度
      result.lngSecond = lng % 60;
      lng = (lng - result.lngSecond) / 60;
      result.lngMinute = lng % 60;
      lng = (lng - result.lngMinute) / 60;
      result.lngDegree = lng;
      // 纬度
      result.latSecond = lat % 60;
      lat = (lat - result.latSecond) / 60;
      result.latMinute = lat % 60;
      lat = (lat - result.latMinute) / 60;
      result.latDegree = lat;
    }
    return result;
  }
  /**
   * 对第n级进行解码
   * @param code 北斗二维网格位置码
   * @param n 层级
   * @returns [number, number] 该层级的经纬度偏移量（单位秒，且非负）
   */
  static decodeN(code, n) {
    if (n < 1 || n > 10) {
      throw new Error("层级错误");
    }
    // 获取行列号
    const rowCol = this.getRowAndCol(this.getCodeAtLevel(code, n), n);
    // 如果是第一级，需要特殊处理
    if (n === 1) {
      rowCol[0] = rowCol[0] >= 31 ? rowCol[0] - 31 : 30 - rowCol[0];
    }
    return [
      rowCol[0] * data_1.gridSizes1[n][0],
      rowCol[1] * data_1.gridSizes1[n][1]
    ];
  }
  /**
   *
   * @param target 目标区域位置
   * @param reference 参考网格位置码
   * @param separator 分隔符
   * @returns 参考网格位置码
   */
  static refer(target, reference, separator = "-") {
    if (typeof target !== "string") {
      return this.refer(this.encode(target), reference);
    }
    const tLngLat = this.decode(target);
    const rLngLat = this.decode(reference);
    const level = this.getCodeLevel(reference);
    // 获取半球信息
    const directions = this.getDirections(reference);
    const [latSign, lngSign] = this.getSigns(directions);
    // 乘上符号是为了变换到东北半球计算
    // 列差
    const lngDiff =
      (((tLngLat.lngDegree - rLngLat.lngDegree) * 3600) /
        data_1.gridSizes1[level][0]) *
      lngSign;
    // 行差
    const latDiff =
      (((tLngLat.latDegree - rLngLat.latDegree) * 3600) /
        data_1.gridSizes1[level][1]) *
      latSign;
    if (Math.abs(lngDiff) >= 8 || Math.abs(latDiff) >= 8) {
      throw new Error("不可进行参考");
    }
    let c = reference + separator;
    // 对第level进行参照
    if (lngDiff >= 0) {
      c += Math.floor(lngDiff);
    } else {
      c += String.fromCharCode(65 + Math.floor(-lngDiff)).toUpperCase();
    }
    if (latDiff >= 0) {
      c += Math.floor(latDiff);
    } else {
      c += String.fromCharCode(65 + Math.floor(-latDiff)).toUpperCase();
    }
    // a为列号，b为行号
    let a;
    let b;
    const tLevel = this.getCodeLevel(target);
    // 对剩余的层级进行参照
    for (let i = level + 1; i <= tLevel; i++) {
      if (i === 6) {
        const code = Number(target.charAt(data_1.codeLengthAtLevel[i - 1]));
        a = code % 2;
        b = (code - a) / 2;
      } else {
        a = Number(target.charAt(data_1.codeLengthAtLevel[i - 1]));
        b = Number(target.charAt(data_1.codeLengthAtLevel[i - 1] + 1));
      }
      c += separator;
      // 如果符号为负，需要取字母
      if (lngSign === 1 || a === 0) {
        c += a;
      } else {
        c += String.fromCharCode(64 + a).toUpperCase();
      }
      if (latSign === 1 || b === 0) {
        c += b;
      } else {
        c += String.fromCharCode(64 + b).toUpperCase();
      }
    }
    return c;
  }
  /**
   * 还原斗参考网格位置码
   * @param code 北斗参考网格位置码
   * @param separator 分隔符，默认是"-"
   * @returns 还原后的北斗参考网格位置码
   */
  static deRefer(code, separator = "-") {
    const split = code.split(separator);
    if (split.length === 1) {
      return code;
    }
    // 参考位置网格等级
    const rLevel = this.getCodeLevel(split[0]);
    // 目标位置网格等级
    const tLevel = rLevel + split.length - 2;
    // 采用度分秒可以避免计算误差
    let tLngLat = this.decode(split[0], { form: "dms" });
    // 获取半球信息
    const [latSign, lngSign] = this.getSigns([
      tLngLat.lngDirection,
      tLngLat.latDirection
    ]);
    for (let i = rLevel; i <= tLevel; i++) {
      tLngLat = this.deReferN(
        tLngLat,
        split[1 + i - rLevel],
        i,
        lngSign,
        latSign
      );
    }
    // 重新编码
    const result = this.encode(tLngLat, tLevel);
    return result;
  }
  /**
   * 还原当前级别网格的经纬度
   * @param lngLat 上一级的经纬度坐标
   * @param codeFragment 斗参考网格位置码片段
   * @param level 当前层级
   * @param lngSign 经度方向符号
   * @param latSign 纬度方向符号
   * @returns 当前级的经纬度坐标
   */
  static deReferN(lngLat, codeFragment, level, lngSign, latSign) {
    const a = codeFragment.charCodeAt(0);
    const b = codeFragment.charCodeAt(1);
    // 获取编码的ascii码范围
    const ascii_0 = "0".charCodeAt(0);
    const ascii_7 = "7".charCodeAt(0);
    const ascii_A = "A".charCodeAt(0);
    const ascii_G = "G".charCodeAt(0);
    // * sign 的目的是转换到东北半球计算
    if (a >= ascii_0 && a <= ascii_7) {
      lngLat.lngSecond += (a - ascii_0) * data_1.gridSizes1[level][0] * lngSign;
    } else if (a >= ascii_A && a <= ascii_G) {
      lngLat.lngSecond -=
        (a - ascii_A + 1) * data_1.gridSizes1[level][0] * lngSign;
    }
    if (b >= ascii_0 && b <= ascii_7) {
      lngLat.latSecond += (b - ascii_0) * data_1.gridSizes1[level][1] * latSign;
    } else if (b >= ascii_A && b <= ascii_G) {
      lngLat.latSecond -=
        (b - ascii_A + 1) * data_1.gridSizes1[level][1] * latSign;
    }
    return lngLat;
  }
  /**
   * 缩短一个北斗二维网格编码
   * @param code 北斗二维网格编码
   * @param level 目标层级
   * @returns 缩短后的编码
   */
  static shorten(code, level) {
    if (level < 1 || level > 10) {
      throw new Error("层级错误");
    }
    const nowLevel = this.getCodeLevel(code);
    if (nowLevel <= level) {
      return code;
    }
    return code.substring(0, data_1.codeLengthAtLevel[level]);
  }
  /**
   * 获取一个位置码的最大级别
   * @param code 位置码
   * @returns 级别
   */
  static getCodeLevel(code) {
    const level = data_1.codeLengthAtLevel.indexOf(code.length);
    if (level === -1) {
      throw new Error("编码长度错误!");
    }
    return level;
  }
  /**
   * 获取某一级别的代码片段
   * @param code 位置码
   * @param level 级别
   * @returns 该级别的位置码片段
   */
  static getCodeAtLevel(code, level) {
    if (level === 0) {
      return code.charAt(0);
    }
    return code.substring(
      data_1.codeLengthAtLevel[level - 1],
      data_1.codeLengthAtLevel[level]
    );
  }
  /**
   * 获取某一级别的网格的行列号
   * @param codeFragment 某级别位置码片段
   * @param level 级别
   * @returns [lng, lat] => [列号, 行号]
   */
  static getRowAndCol(codeFragment, level) {
    if (
      codeFragment.length !==
      data_1.codeLengthAtLevel[level] - data_1.codeLengthAtLevel[level - 1]
    ) {
      throw new Error("编码片段长度错误!");
    }
    let lng;
    let lat;
    switch (level) {
      case 0:
        return [0, 0];
      case 1:
        lng = Number(codeFragment.substring(0, 2));
        lat = codeFragment.charCodeAt(2) - 65;
        break;
      case 2:
      case 4:
      case 5:
      case 7:
      case 8:
      case 9:
      case 10:
        lng = parseInt(codeFragment.charAt(0), 16);
        lat = parseInt(codeFragment.charAt(1), 16);
        break;
      case 3:
      case 6: {
        const n = Number(codeFragment);
        lng = n % 2;
        lat = (n - lng) / 2;
        break;
      }
      default:
        throw new Error("层级错误!");
    }
    this.checkCodeFragmentRange(lng, lat, level);
    return [lng, lat];
  }
  /**
   * 检查第level级代码片段范围是否合法
   * @param lng 列号
   * @param lat 行号
   * @param level 级别
   */
  static checkCodeFragmentRange(lng, lat, level) {
    if (
      lng > data_1.gridCount1[level][0] - 1 ||
      lng < 0 ||
      lat < 0 ||
      lat > data_1.gridCount1[level][1] - 1
    ) {
      throw new Error("位置码错误");
    }
  }
  /**
   * 获取位置码的半球信息：东南、东北、西南、西北
   * @param code 位置码
   * @returns [lngDir, latDir] => [经度方向, 纬度方向]
   */
  static getDirections(code) {
    const latDir = code.charAt(0) === "N" ? "N" : "S";
    const lngDir = Number(code.substring(1, 3)) >= 31 ? "E" : "W";
    return [lngDir, latDir];
  }
  static getSigns(directions) {
    return [directions[0] === "E" ? 1 : -1, directions[1] === "N" ? 1 : -1];
  }
}
exports.default = Codec2D;
//# sourceMappingURL=codec-2d.js.map
