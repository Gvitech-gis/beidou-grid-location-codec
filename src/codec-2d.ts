import { LngLat, HemisphereCode } from "./type";

class Codec2D {
  static encode(lngLat: LngLat): string {
    const resCode = "";
    return resCode;
  }

  private static encodeN(
    lngLat: LngLat,
    lngN: number,
    latN: number,
    n: number
  ): string {
    if (n === 0) {
      // 南北半球标识码
      return latN > 0 ? HemisphereCode.north : HemisphereCode.south;
    } else if (n === 1) {
      // 第一级
      const a1 = Math.floor(lngN / 6) + 31;
      const a1s = String.fromCharCode(64 + a1);
      const b1 = Math.floor(Math.abs(latN) / 4) + 1;
      // 前置位补零
      const b1s = b1.toString().padStart(2, "0");
      return a1s + b1s;
    } else {
      return "";
    }
  }

  static decode(code: string): LngLat {
    return { latitude: 1, longitude: 0 };
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
