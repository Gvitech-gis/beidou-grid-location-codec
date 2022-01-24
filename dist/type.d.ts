declare type LngLat = {
  lngDegree: number;
  lngMinute?: number;
  lngSecond?: number;
  lngDirection?: LngDirection;
  latDegree: number;
  latMinute?: number;
  latSecond?: number;
  latDirection?: LatDirection;
};
declare type DecodeOption = {
  form: "decimal" | "dms";
};
declare type LngDirection = "W" | "E";
declare type LatDirection = "S" | "N";
export { LngLat, DecodeOption, LngDirection, LatDirection };
