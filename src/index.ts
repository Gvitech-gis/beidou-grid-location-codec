import Codec2D from "./codec-2d";

// console.log(
//   Codec2D.encode(
//     {
//       lngDegree: 116,
//       lngMinute: 18,
//       lngSecond: 45.37,
//       latDegree: 39,
//       latMinute: 59,
//       latSecond: 35.38
//     },
//     10
//   )
// );

// console.log(
//   Codec2D.encode(
//     {
//       lngDegree: 116,
//       lngMinute: 18,
//       lngSecond: 45.37,
//       lngDirection: "W",
//       latDegree: 39,
//       latMinute: 59,
//       latSecond: 35.38,
//       latDirection: "S"
//     },
//     10
//   )
// );

// console.log(Codec2D.decode("N50J47539b8255346152"));

// console.log(Codec2D.decode("N50J47539b8255346152", { form: "dms" }));

// console.log(Codec2D.decode("S11J47539b8255346152", { form: "dms" }));

// console.log(Codec2D.refer("S11J47539B8255346152", "S11J47539B82553461"));

console.log(Codec2D.refer("N50J47539b8255346152", "N50J4754909"));

console.log(Codec2D.refer("N50J47539b8255346152", "N50J47539b82"));

console.log(Codec2D.refer("N50J47539b82", "N50J47539b8"));

export { Codec2D };
