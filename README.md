# beidou-grid-location-codec

## Install

Using npm:

```sh
$ npm i beidou-grid-location-codec
```

## Usage

Import two main classes(`Codec2D` and `Codec3D`) and some types(`LngLat` and `LngLatEle`).

```typescript
import { LngLat, Codec2D, Codec3D, LngLatEle } from "../dist";
```

### LngLat

Data structure representing longitude and latitude coordinates.

```typescript
type LngLat = {
  lngDegree: number;
  lngMinute?: number;
  lngSecond?: number;
  lngDirection?: LngDirection;
  latDegree: number;
  latMinute?: number;
  latSecond?: number;
  latDirection?: LatDirection;
};
```

You can use this type in two ways:

- In decimal form: Accept a signed number for field `lngDegree` and `latDegree`. Make sure `lngDirection` and `latDirection` undefined.

  ```typescript
  const lngLat: LngLat = {
    lngDegree: 116.31,
    latDegree: 39.99
  };
  ```

- In the form of degrees, minutes and seconds: Accept non-negative numbers for all fields of number type, use `lngDirection` and `latDirection` to indicate the directions.
  ```typescript
  const lngLat: LngLat = {
    lngDegree: 116,
    lngMinute: 18,
    lngSecond: 45.37,
    lngDirection: "E",
    latDegree: 39,
    latMinute: 59,
    latSecond: 35.38,
    latDirection: "N"
  };
  const code = Codec2D.encode(lngLat);
  ```
  Definition of `LngDirection` and `LatDirection`:
  ```typescript
  type LngDirection = "W" | "E";
  type LatDirection = "S" | "N";
  ```

### LngLatEle

Data structure of geodetic coordinates.

```typescript
type LngLatEle = LngLat & { elevation: number };
```

Field `elevation` are added to the type `LngLat`.

```typescript
const lngLatEle: LngLatEle = {
  lngDegree: 86.9,
  latDegree: 27.9,
  elevation: h
};
```

### Codec2D

Class of Beidou two-dimensional grid location code.

- `encode(lngLat: LngLat, level = 10): string`: encode a longitude and latitude coordinates

  ```typescript
  const code = Codec2D.encode(lngLat);

  // Specify coding level
  const code = Codec2D.encode(lngLat, 5);
  ```

- `decode( code: string, decodeOption: DecodeOption = { form: "decimal" } ): LngLat`: decode the code into object `LngLat`

  ```typescript
  const lngLat: LngLat = Codec2D.decode(code);

  // Specify the decode option
  const lngLat: LngLat = Codec2D.decode(code, { form: "dms" });
  ```

  Definition of `DecodeOption`:

  ```typescript
  type DecodeOption = {
    form: "decimal" | "dms";
  };
  ```

- `refer( target: string | LngLat, reference: string, separator = "-" ): string`: generate Beidou reference grid code

  ```typescript
  const refer1 = Codec2D.refer(code, "N50J47539b82"); // input a grid location code
  // or
  const refer2 = Codec2D.refer(lngLat, "N50J47539b82"); // input a coordinates

  // Specify the separator
  const refer1 = Codec2D.refer(code, "N50J47539b82", "~");
  ```

- `deRefer(code: string, separator = "-"): string`: restore reference code

  ```typescript
  const deRefer = Codec2D.deRefer(refer1);

  // Specify the separator
  const deRefer = Codec2D.deRefer(refer1, "~");
  ```

- `shorten(code: string, level: number): string`: shorten a grid location code

  ```typescript
  Codec2D.shorten(codeToBeShorten, 5);
  ```

### Codec3D

Class of Beidou three-dimensional grid location code.

- `encodeElevation(elevation: number, r = 6378137, level = 10): string`: get elevation direction code, `r` represents "long half axis of the earth"

  ```typescript
  const h = 8848.86;
  const code = Codec3D.encodeElevation(h);

  // Specify r and level
  const code = Codec3D.encodeElevation(h, 6378000, 5);
  ```

- `decodeElevation(codeEle: string, r = 6378137): number`: decode elevation direction code

  ```typescript
  const h = Codec3D.decodeElevation(code);

  // Specify r
  const h = Codec3D.decodeElevation(code, 6378000);
  ```

- `encode(lngLatEle: LngLatEle, r = 6378137): string`: encode a geodetic coordinate

  ```typescript
  const code3d = Codec3D.encode(lngLatEle);

  // Specify r
  const code3d = Codec3D.encode(lngLatEle, 6378000);
  ```

- `decode( code: string, decodeOption: DecodeOption = { form: "decimal" }, r = 6378137 ): LngLatEle`: decode the code to object `LngLatEle`

  ```typescript
  const lngLatEle: LngLatEle = Codec3D.decode(code3d);

  // Specify decodeOption and r
  const lngLatEle: LngLatEle = Codec3D.decode(code3d, { form: "dms" }, 6378000);
  ```
