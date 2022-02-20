import { LngLat, DecodeOption } from "./type";
declare class Codec2D {
  /**
   * 对一个经纬度坐标编码
   * @param lngLat 经纬度坐标，可以写小数形式（正负号表示方向），也可以写度分秒形式（均为正数，direction字段表示方向）
   * @param level 要编码到第几级，默认为10
   * @returns 北斗二维网格位置码
   */
  static encode(lngLat: LngLat, level?: number): string;
  /**
   * 以下坐标均以秒表示，且第2级开始所有半球均对称到东北半球处理（非负）
   * @param lngInSec 位置经度
   * @param latInSec 位置纬度
   * @param lngN 该位置所在第n级二维北斗网格的定位角点经度
   * @param latN 该位置所在第n级二维北斗网格的定位角点纬度
   * @param n 第n级
   * @returns [lngN+1, latN+1, codeN]
   */
  private static encodeN;
  /**
   *
   * @param level 当前编码层级
   * @param lngCount 经度方向网格数
   * @param latCount 纬度方向网格数
   * @returns 当前层级的编码片段
   */
  private static encodeFragment;
  /**
   * 对北斗二维网格位置码解码
   * @param code 需要解码的北斗二维网格位置码
   * @param decodeOption 解码选项，可不传
   * @returns 经纬度坐标
   */
  static decode(code: string, decodeOption?: DecodeOption): LngLat;
  /**
   * 对第n级进行解码
   * @param code 北斗二维网格位置码
   * @param n 层级
   * @returns [number, number] 该层级的经纬度偏移量（单位秒，且非负）
   */
  private static decodeN;
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
    separator?: string
  ): string;
  /**
   * 还原斗参考网格位置码
   * @param code 北斗参考网格位置码
   * @param separator 分隔符，默认是"-"
   * @returns 还原后的北斗参考网格位置码
   */
  static deRefer(code: string, separator?: string): string;
  /**
   * 缩短一个北斗二维网格编码
   * @param code 北斗二维网格编码
   * @param level 目标层级
   * @returns 缩短后的编码
   */
  static shorten(code: string, level: number): string;
  /**
   * 获取一个位置码的最大级别
   * @param code 位置码
   * @returns 级别
   */
  static getCodeLevel(code: string): number;
  /**
   * 获取一个参照位置网格的可参照范围
   * @param code 参照位置网格编码，必须大于等于5级
   * @returns [LngLat, LngLat]，西南角和东北角坐标
   */
  static getReferRange(code: string): [LngLat, LngLat];
  /**
   * 获取一个网格周围(包括自己)的9个相邻网格码
   * @param code 目标网格码
   * @returns string[]
   */
  static getNeighbors(code: string): string[];
  /**
   * 获取某一级别的代码片段
   * @param code 位置码
   * @param level 级别
   * @returns 该级别的位置码片段
   */
  private static getCodeAtLevel;
  /**
   * 获取某一级别的网格的行列号
   * @param codeFragment 某级别位置码片段
   * @param level 级别
   * @returns [lng, lat] => [列号, 行号]
   */
  private static getRowAndCol;
  /**
   * 检查第level级代码片段范围是否合法
   * @param lng 列号
   * @param lat 行号
   * @param level 级别
   */
  private static checkCodeFragmentRange;
  /**
   * 获取位置码的半球信息：东南、东北、西南、西北
   * @param code 位置码
   * @returns [lngDir, latDir] => [经度方向, 纬度方向]
   */
  private static getDirections;
  private static getSigns;
  private static getSecond;
  /**
   * 用于计算两个同级网格之间相差多少格，注意此方法不同于北斗参照网格码算法
   * @param reference 被参考位置网格码
   * @param target 目标位置网格码
   * @returns [lngDiff, latDiff]，经纬度方向分别偏差网格数量(按照半球的坐标轴方向)
   */
  private static getOffset;
  /**
   *
   * @param code 被参考的网格码
   * @param offsetX 经度方向偏移格数(按照半球的坐标轴方向)
   * @param offsetY 纬度方向偏移格数(按照半球的坐标轴方向)
   * @returns 相对位置的网格码
   */
  private static getRelativeGrid;
}
export default Codec2D;
