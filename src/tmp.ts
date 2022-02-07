import { Codec3D } from ".";

const h = -8888;
const code = Codec3D.encodeElevation(h);
console.log(code);

console.log(Codec3D.decodeElevation(code));
