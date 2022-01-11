import Codec2D from "./codec-2d";

console.log(
  Codec2D.encode(
    {
      lngDegree: 116,
      lngMinute: 18,
      lngSecond: 45.37,
      latDegree: 39,
      latMinute: 59,
      latSecond: 35.38
    },
    10
  )
);

console.log(
  Codec2D.encode(
    {
      lngDegree: 116,
      lngMinute: 18,
      lngSecond: 45.37,
      lngDirection: "S",
      latDegree: 39,
      latMinute: 59,
      latSecond: 35.38,
      latDirection: "W"
    },
    10
  )
);

export { Codec2D };
