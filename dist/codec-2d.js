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
    let [lngInSec, latInSec] = this.getSecond(lngLat);
    // 记录第n级网格的定位角点经纬度
    let lngN = 0,
      latN = 0;
    // 存储结果
    let resCode = "";
    if (Math.abs(lngLat.latDegree) >= 88) {
      throw new Error("暂不支持两级地区(纬度大于等于88°)编码");
    }
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
      return [
        a * data_1.gridSizes1[n][0],
        b * data_1.gridSizes1[n][1],
        this.encodeFragment(n, a, b)
      ];
    }
  }
  /**
   *
   * @param level 当前编码层级
   * @param lngCount 经度方向网格数
   * @param latCount 纬度方向网格数
   * @returns 当前层级的编码片段
   */
  static encodeFragment(level, lngCount, latCount) {
    if (level === 3 || level === 6) {
      return (latCount * 2 + lngCount).toString();
    } else if (level > 1 && level <= 10) {
      return (
        lngCount.toString(16).toUpperCase() +
        latCount.toString(16).toUpperCase()
      );
    }
    throw new Error("非法层级level");
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
    const [lngSign, latSign] = this.getSigns(directions);
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
      if (rowCol[0] === 0) {
        throw new Error("暂不支持解码两极地区(纬度大于等于88°)编码");
      }
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
    const level = this.getCodeLevel(reference);
    if (level < 5) {
      // 因为第五级有15个网格，而参考码网格最多有8个
      throw new Error("参照网格编码必须大于等于5级");
    }
    // 获取半球信息
    const directions = this.getDirections(reference);
    const [lngSign, latSign] = this.getSigns(directions);
    const diff = this.getOffset(reference, target);
    const lngDiff = diff[0] * lngSign;
    const latDiff = diff[1] * latSign;
    if (Math.abs(lngDiff) > 7 || Math.abs(latDiff) > 7) {
      throw new Error("不可进行参考");
    }
    let c = reference + separator;
    // 对第level进行参照
    if (lngDiff >= 0) {
      c += lngDiff;
    } else {
      c += String.fromCharCode(64 + -lngDiff).toUpperCase();
    }
    if (latDiff >= 0) {
      c += latDiff;
    } else {
      c += String.fromCharCode(64 + -latDiff).toUpperCase();
    }
    const tLevel = this.getCodeLevel(target);
    // 对剩余的层级进行参照
    for (let i = level + 1; i <= tLevel; i++) {
      // a为列号，b为行号
      const [a, b] = this.getRowAndCol(this.getCodeAtLevel(target, i), i);
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
    const [lngSign, latSign] = this.getSigns(this.getDirections(split[0]));
    // 获取编码的ascii码范围
    const ascii_0 = "0".charCodeAt(0);
    const ascii_7 = "7".charCodeAt(0);
    const ascii_A = "A".charCodeAt(0);
    const ascii_G = "G".charCodeAt(0);
    let result = "";
    for (let i = rLevel; i <= tLevel; i++) {
      let offsetX, offsetY;
      const charX = split[1 + i - rLevel].charCodeAt(0);
      const charY = split[1 + i - rLevel].charCodeAt(1);
      // 计算经度方向偏移位置
      if (charX >= ascii_0 && charX <= ascii_7) {
        offsetX = (charX - ascii_0) * lngSign;
      } else if (charX >= ascii_A && charX <= ascii_G) {
        offsetX = -((charX - ascii_A + 1) * lngSign);
      } else {
        throw new Error("参照码错误, 必须在0~7、A~G之间");
      }
      // 计算纬度方向偏移位置
      if (charY >= ascii_0 && charY <= ascii_7) {
        offsetY = (charY - ascii_0) * latSign;
      } else if (charY >= ascii_A && charY <= ascii_G) {
        offsetY = -((charY - ascii_A + 1) * latSign);
      } else {
        throw new Error("参照码错误, 必须在0~7、A~G之间");
      }
      if (i === rLevel) {
        // 对level级进行还原
        result = this.getRelativeGrid(split[0], offsetX, offsetY);
      } else {
        result += this.encodeFragment(i, offsetX, offsetY);
      }
    }
    return result;
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
   * 获取一个参照位置网格的可参照范围
   * @param code 参照位置网格编码，必须大于等于5级
   * @returns [LngLat, LngLat]，西南角和东北角坐标
   */
  static getReferRange(code) {
    const level = this.getCodeLevel(code);
    if (level < 5) {
      throw new Error("参照网格编码必须大于等于5级");
    }
    const lngLat = this.decode(code, { form: "dms" });
    const lngLatInSecond = this.getSecond(lngLat);
    let westBound;
    let eastBound;
    let northBound;
    let southBound;
    // 乘数因子为8的项需要减掉一个第十级网格大小，是因为边界上并不能参照
    if (lngLatInSecond[0] >= 0) {
      westBound = lngLatInSecond[0] - 7 * data_1.gridSizes1[level][0];
      eastBound =
        lngLatInSecond[0] +
        8 * data_1.gridSizes1[level][0] -
        data_1.gridSizes1[10][0];
    } else {
      westBound =
        lngLatInSecond[0] -
        8 * data_1.gridSizes1[level][0] +
        data_1.gridSizes1[10][0];
      eastBound = lngLatInSecond[0] + 7 * data_1.gridSizes1[level][0];
    }
    if (lngLatInSecond[1] >= 0) {
      southBound = lngLatInSecond[1] - 7 * data_1.gridSizes1[level][1];
      northBound =
        lngLatInSecond[1] +
        8 * data_1.gridSizes1[level][1] -
        data_1.gridSizes1[10][1];
    } else {
      southBound =
        lngLatInSecond[1] -
        8 * data_1.gridSizes1[level][1] +
        data_1.gridSizes1[10][1];
      northBound = lngLatInSecond[1] + 7 * data_1.gridSizes1[level][1];
    }
    return [
      { lngDegree: westBound / 3600, latDegree: southBound / 3600 },
      { lngDegree: eastBound / 3600, latDegree: northBound / 3600 }
    ];
  }
  /**
   * 获取一个网格周围(包括自己)的9个相邻网格码
   * @param code 目标网格码
   * @returns string[]
   */
  static getNeighbors(code) {
    const neighbors = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        neighbors.push(this.getRelativeGrid(code, i, j));
      }
    }
    return neighbors;
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
  static getSecond(lngLat) {
    var _a, _b, _c, _d, _e, _f;
    // 计算经度，换算成秒
    const lngInSec =
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
    const latInSec =
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
    return [lngInSec, latInSec];
  }
  /**
   * 用于计算两个同级网格之间相差多少格，注意此方法不同于北斗参照网格码算法
   * @param reference 被参考位置网格码
   * @param target 目标位置网格码
   * @returns [lngDiff, latDiff]，经纬度方向分别偏差网格数量(按照半球的坐标轴方向)
   */
  static getOffset(reference, target) {
    const level = this.getCodeLevel(reference);
    target = this.shorten(target, level);
    // 如果level-1层的网格相同，直接进行减法即可
    if (
      reference.substring(0, data_1.codeLengthAtLevel[level - 1]) ===
      target.substring(0, data_1.codeLengthAtLevel[level - 1])
    ) {
      const rRowCol = this.getRowAndCol(
        this.getCodeAtLevel(reference, level),
        level
      );
      const tRowCol = this.getRowAndCol(
        this.getCodeAtLevel(target, level),
        level
      );
      return [tRowCol[0] - rRowCol[0], tRowCol[1] - rRowCol[1]];
    } else {
      // 如果level-1层不同，为了计算简单，转为经纬度计算
      // 获取目标位置和参考位置的坐标(用度分秒保证计算误差)
      const tLngLat = this.decode(target, { form: "dms" });
      const tInSecond = this.getSecond(tLngLat);
      const rLngLat = this.decode(reference, { form: "dms" });
      const rInSecond = this.getSecond(rLngLat);
      // 获取半球信息
      const directions = this.getDirections(reference);
      const [lngSign, latSign] = this.getSigns(directions);
      // 乘上符号是为了变换到东北半球计算
      // 东北半球网格的原点在左下角(西南角)，对于参考坐标系的负方向(西、南)方向取整需要补1，所以直接使用Math.floor
      // 列差
      let lngDiff =
        ((tInSecond[0] - rInSecond[0]) / data_1.gridSizes1[level][0]) * lngSign;
      lngDiff = Math.floor(lngDiff);
      // 行差
      let latDiff =
        ((tInSecond[1] - rInSecond[1]) / data_1.gridSizes1[level][1]) * latSign;
      latDiff = Math.floor(latDiff);
      return [lngDiff, latDiff];
    }
  }
  /**
   *
   * @param code 被参考的网格码
   * @param offsetX 经度方向偏移格数(按照半球的坐标轴方向)
   * @param offsetY 纬度方向偏移格数(按照半球的坐标轴方向)
   * @returns 相对位置的网格码
   */
  static getRelativeGrid(code, offsetX, offsetY) {
    const level = this.getCodeLevel(code);
    const rowCol = this.getRowAndCol(this.getCodeAtLevel(code, level), level);
    const newX = rowCol[0] + offsetX;
    const newY = rowCol[1] + offsetY;
    if (
      newX >= 0 &&
      newX < data_1.gridCount1[level][0] &&
      newY >= 0 &&
      newY < data_1.gridCount1[level][1]
    ) {
      // 如果两个网格的上一层网格相同可以直接相加得到结果
      return (
        code.substring(0, data_1.codeLengthAtLevel[level - 1]) +
        this.encodeFragment(level, newX, newY)
      );
    } else {
      // 上一层网格不相同，采用经纬度计算
      // 采用度分秒可以避免计算误差
      const lngLat = this.decode(code, { form: "dms" });
      // 半球符号lngSign与latSign各自约去(平方为1)
      lngLat.lngSecond += offsetX * data_1.gridSizes1[level][0];
      lngLat.latSecond += offsetY * data_1.gridSizes1[level][1];
      return this.encode(lngLat, level);
    }
  }
}
exports.default = Codec2D;
//# sourceMappingURL=codec-2d.js.map
