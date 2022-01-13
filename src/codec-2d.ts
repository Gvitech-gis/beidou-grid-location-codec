import { LngLat, DecodeOption, LngDirection, LatDirection } from "./type";
import { gridSizes1, gridCount1, codeLengthAtLevel } from "./data";

class Codec2D {
  static encode(lngLat: LngLat, level = 10): string {
    // 计算经度，换算成秒
    let lngInSec =
      (lngLat.lngDegree * 3600 +
        (lngLat.lngMinute ??= 0) * 60 +
        (lngLat.lngSecond ??= 0)) *
      ((lngLat.lngDirection ?? "E") === "W" ? -1 : 1);
    // 计算纬度，换算成秒
    let latInSec =
      (lngLat.latDegree * 3600 +
        (lngLat.latMinute ??= 0) * 60 +
        (lngLat.latSecond ??= 0)) *
      ((lngLat.latDirection ?? "N") === "S" ? -1 : 1);
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
  private static encodeN(
    lngInSec: number,
    latInSec: number,
    lngN: number,
    latN: number,
    n: number
  ): [number, number, string] {
    if (n === 0) {
      // 南北半球标识码
      return [0, 0, latInSec > 0 ? "N" : "S"];
    } else if (n === 1) {
      // 根据国家基本比例尺地形图分幅和编号，按照1:1000000对第一级进行划分
      // 经度
      const a = Math.floor(lngInSec / gridSizes1[n][0]);
      // 前置位补零
      const aS = (a + 31).toString().padStart(2, "0");
      // 纬度
      const b = Math.floor(Math.abs(latInSec) / gridSizes1[n][1]);
      const bS = String.fromCharCode(65 + b);
      return [
        // a <0 时，需要取反并-1
        (a >= 0 ? a : -a - 1) * gridSizes1[n][0],
        b * gridSizes1[n][1],
        aS + bS
      ];
    } else {
      // 公式中需要+1，为了底下方便计算没有+1，因为之后还要-1
      const a = Math.floor((lngInSec - lngN) / gridSizes1[n][0]);
      const b = Math.floor((latInSec - latN) / gridSizes1[n][1]);
      switch (n) {
        case 2:
        case 4:
        case 5:
        case 7:
        case 8:
        case 9:
        case 10:
          return [
            a * gridSizes1[n][0],
            b * gridSizes1[n][1],
            a.toString(16).toUpperCase() + b.toString(16).toUpperCase()
          ];
        case 3:
          return [
            a * gridSizes1[n][0],
            b * gridSizes1[n][1],
            (b * 2 + a).toString()
          ];
        case 6:
          return [
            a * gridSizes1[n][0],
            b * gridSizes1[n][1],
            (b * 2 + a).toString()
          ];
      }
      throw new Error("n的大小不合格");
    }
  }

  static decode(
    code: string,
    decodeOption: DecodeOption = { form: "decimal" }
  ): LngLat {
    if (code.length < 4 || code.length > 20) {
      throw new Error("位置码长度有误");
    }
    if (code.charAt(0) !== "N" && code.charAt(0) !== "S") {
      throw new Error("位置码错误");
    }
    // 如果不足20位就用0补全
    code = code.padEnd(20, "0");
    // 南北半球标识
    const latSign = code.charAt(0) === "N" ? 1 : -1;
    // 第一级
    const lngCode1 = Number(code.substring(1, 3));
    const b1 = code.charCodeAt(3) - 65;
    if (lngCode1 > 60 || lngCode1 < 0 || b1 < 0 || b1 > 21) {
      throw new Error("位置码错误");
    }
    const lngSign = lngCode1 >= 31 ? 1 : -1;
    const a1 = lngCode1 >= 31 ? lngCode1 - 31 : 30 - lngCode1;
    let lng = a1 * gridSizes1[1][0];
    let lat = b1 * gridSizes1[1][1];
    // 对2~10级进行解码
    for (let i = 2; i <= 10; i++) {
      const pair = this.decodeN(code, i);
      lng += pair[0];
      lat += pair[1];
    }
    const result: LngLat = { latDegree: 0, lngDegree: 0 };
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

  static decodeN(code: string, n: number): [number, number] {
    if (n < 2 || n > 10) {
      throw new Error("层级错误");
    }
    // a为第n级的网格列号，b为行号，temp为临时变量，用于计算
    let a = 0;
    let b = 0;
    let temp: number;
    switch (n) {
      case 2:
        a = parseInt(code.charAt(4), 16);
        b = parseInt(code.charAt(5));
        if (a > 11 || b > 7) {
          throw new Error("位置码错误");
        }
        break;
      case 3:
        temp = parseInt(code.charAt(6));
        if (temp > 5) {
          throw new Error("位置码错误");
        }
        a = temp % 2;
        // JavaScript除法有余数
        b = (temp - a) / 2;
        break;
      case 4:
      case 5:
        a = parseInt(code.charAt(7 + (n - 4) * 2), 16);
        b = parseInt(code.charAt(8 + (n - 4) * 2), 16);
        if (a > 14 || b > 14 || (n == 4 && b > 9)) {
          throw new Error("位置码错误");
        }
        break;
      case 6:
        temp = parseInt(code.charAt(11));
        if (temp > 3) {
          throw new Error("位置码错误");
        }
        a = temp % 2;
        b = (temp - a) / 2;
        break;
      default:
        a = parseInt(code.charAt(12 + (n - 7) * 2));
        b = parseInt(code.charAt(13 + (n - 7) * 2));
        if (a > 7 || b > 7) {
          throw new Error("位置码错误");
        }
    }
    return [a * gridSizes1[n][0], b * gridSizes1[n][1]];
  }

  /**
   *
   * @param target 目标区域位置
   * @param reference 参考网格位置码
   * @param separator 分隔符
   * @returns 参考网格位置码
   */
  static refer(
    target: string | LngLat,
    reference: string,
    separator = "-"
  ): string {
    if (typeof target !== "string") {
      return this.refer(this.encode(target), reference);
    }
    const tLngLat = this.decode(target);
    const rLngLat = this.decode(reference);
    const level = this.getCodeLevel(reference);
    // 列差
    const lngDiff =
      ((tLngLat.lngDegree - rLngLat.lngDegree) * 3600) / gridSizes1[level][0];
    // 行差
    const latDiff =
      ((tLngLat.latDegree - rLngLat.latDegree) * 3600) / gridSizes1[level][1];
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
    // 获取半球信息
    const directions = this.getDirections(reference);
    const lngSign = directions[0] === "E" ? 1 : -1;
    const latSign = directions[1] === "N" ? 1 : -1;
    // a为列号，b为行号
    let a: number;
    let b: number;
    const tLevel = this.getCodeLevel(target);
    // 对剩余的层级进行参照
    for (let i = level + 1; i <= tLevel; i++) {
      if (i === 6) {
        const code = Number(target.charAt(codeLengthAtLevel[i - 1]));
        a = code % 2;
        b = (code - a) / 2;
      } else {
        a = Number(target.charAt(codeLengthAtLevel[i - 1]));
        b = Number(target.charAt(codeLengthAtLevel[i - 1] + 1));
      }
      c += separator;
      // 如果符号为负，需要取字母
      if (lngSign === 1) {
        c += a;
      } else {
        c += String.fromCharCode(65 + a).toUpperCase();
      }
      if (latSign === 1) {
        c += b;
      } else {
        c += String.fromCharCode(65 + b).toUpperCase();
      }
    }
    return c;
  }

  static deRefer(code: string, separator = "-"): string {
    const split = code.split(separator);
    if (split.length === 1) {
      return code;
    }
    return "";
  }

  /**
   * 获取一个位置码的级别
   * @param code 位置码
   * @returns 级别
   */
  private static getCodeLevel(code: string): number {
    const level = codeLengthAtLevel.indexOf(code.length);
    if (level === -1) {
      throw new Error("编码长度错误!");
    }
    return level;
  }

  /**
   *
   * @param code 位置码
   * @param level 级别
   * @returns 该级别的位置码片段
   */
  private static getCodeAtLevel(code: string, level: number) {
    if (level === 0) {
      return code.charAt(0);
    }
    return code.substring(
      codeLengthAtLevel[level - 1],
      codeLengthAtLevel[level]
    );
  }

  /**
   *
   * @param codeFragment 某级别位置码片段
   * @param level 级别
   * @returns [lng, lat] => [列号, 行号]
   */
  private static getRowAndCol(
    codeFragment: string,
    level: number
  ): [number, number] {
    if (
      codeFragment.length !==
      codeLengthAtLevel[level] - codeLengthAtLevel[level - 1]
    ) {
      throw new Error("编码片段长度错误!");
    }
    let lng: number;
    let lat: number;
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
    this.checkCodeRange(lng, lat, level);
    return [lng, lat];
  }

  /**
   *
   * @param lng 列号
   * @param lat 行号
   * @param level 级别
   */
  private static checkCodeRange(lng: number, lat: number, level: number) {
    if (
      lng > gridCount1[level][0] - 1 ||
      lng < 0 ||
      lat < 0 ||
      lat > gridCount1[level][1] - 1
    ) {
      throw new Error("位置码错误");
    }
  }

  /**
   *
   * @param code 位置码
   * @returns [lngDir, latDir] => [经度方向, 纬度方向]
   */
  private static getDirections(code: string): [LngDirection, LatDirection] {
    const latDir = code.charAt(0) === "N" ? "N" : "S";
    const lngDir = Number(code.substring(1, 3)) >= 31 ? "E" : "W";
    return [lngDir, latDir];
  }
}

export default Codec2D;
