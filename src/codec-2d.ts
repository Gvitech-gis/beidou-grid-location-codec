import { LngLat, HemisphereCode } from "./type";
import { gridSizes1 } from "./data";

class Codec2D {
  static encode(lngLat: LngLat, level = 10): string {
    // 计算经度，换算成秒
    let lngInSec =
      (lngLat.lngDegree * 3600 +
        (lngLat.lngMinute ??= 0) * 60 +
        (lngLat.lngSecond ??= 0)) *
      ((lngLat.lngDirection ?? "N") === "S" ? -1 : 1);
    // 计算纬度，换算成秒
    let latInSec =
      (lngLat.latDegree * 3600 +
        (lngLat.latMinute ??= 0) * 60 +
        (lngLat.latSecond ??= 0)) *
      ((lngLat.latDirection ?? "E") === "W" ? -1 : 1);
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
      return [0, 0, latInSec > 0 ? HemisphereCode.north : HemisphereCode.south];
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
            a.toString(16) + b.toString(16)
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

  static decode(code: string): LngLat {
    return { latDegree: 1, lngDegree: 0 };
  }

  static shorten(code: string, reference: string | LngLat): string {
    if (typeof reference !== "string") {
      return this.shorten(code, this.encode(reference));
    } else {
      return "";
    }
  }

  static expand(
    code: string,
    reference: string | LngLat,
    separator = "-"
  ): string {
    if (typeof reference !== "string") {
      return this.expand(code, this.encode(reference), separator);
    } else {
      return "" + separator + "";
    }
  }
}

export default Codec2D;
