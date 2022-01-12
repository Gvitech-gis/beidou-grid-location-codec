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
      lngDirection: "W",
      latDegree: 39,
      latMinute: 59,
      latSecond: 35.38,
      latDirection: "S"
    },
    10
  )
);

console.log(Codec2D.decode("N50J47539b8255346152"));

console.log(Codec2D.decode("N50J47539b8255346152", { form: "dms" }));

console.log(Codec2D.decode("S11J47539b8255346152", { form: "dms" }));

export { Codec2D };
