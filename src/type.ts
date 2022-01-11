type LngLat = {
  lngDegree: number;
  lngMinute?: number;
  lngSecond?: number;
  lngDirection?: string;
  latDegree: number;
  latMinute?: number;
  latSecond?: number;
  latDirection?: string;
};

enum HemisphereCode {
  south = "S",
  north = "N"
}

export { LngLat, HemisphereCode };
