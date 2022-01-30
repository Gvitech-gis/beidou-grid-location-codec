import { LngLatEle, DecodeOption } from "./type";
declare class Codec3D {
  /**
   * 对大地坐标进行编码
   * @param lngLatEle 大地坐标，类型为 LngLat & number
   * @param r 地球长半轴，默认取6378137m
   * @returns 32位的北斗三维网格位置码
   */
  static encode(lngLatEle: LngLatEle, r?: number): string;
  /**
   * 对高程进行编码
   * @param elevation 高程，单位米
   * @param r 地球长半轴，默认取6378137m
   * @param level 编码层级，默认10
   * @returns 高程方向编码
   */
  static encodeElevation(elevation: number, r?: number, level?: number): string;
  /**
   * 对32位北斗三维网格位置码解码
   * @param code 32位北斗三位网格位置码
   * @param decodeOption 解码选项
   * @param r 地球长半轴，默认取6378137m
   * @returns 大地坐标
   */
  static decode(
    code: string,
    decodeOption?: DecodeOption,
    r?: number
  ): LngLatEle;
  /**
   * 对高程方向编码解码
   * @param codeEle 高程方向编码
   * @param r 地球长半轴，默认取6378137m
   * @returns 高程，单位米
   */
  static decodeElevation(codeEle: string, r?: number): number;
}
export default Codec3D;
