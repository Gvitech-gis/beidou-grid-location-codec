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
declare type LngLatEle = LngLat & {
  elevation: number;
};
declare type DecodeOption = {
  form: "decimal" | "dms";
};
declare type LngDirection = "W" | "E";
declare type LatDirection = "S" | "N";
declare type PoleGrid = {
  isPoint: boolean;
  lngSize?: number;
  latSize: number;
};
export {
  LngLat,
  DecodeOption,
  LngDirection,
  LatDirection,
  LngLatEle,
  PoleGrid
};
