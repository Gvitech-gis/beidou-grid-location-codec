import Codec2D from "../src/codec-2d";

console.log(Codec2D.getNeighbors("N50H05142"));

console.log(
  Codec2D.getNeighbors("N50H05142", [
    [1, 1],
    [1, -1]
  ])
);

console.log(Codec2D.getAmongUs("N50H05142", "N50H05170"));

for (let i = 1; i <= 4; i++) {
  console.log(Codec2D.getGridSize("N46A71529E7", i));
}
