## lib/number.js

Utility functions for JS Numbers.


- [num](#num)
  - [random](#num-random)
  - [normalRandom](#num-normalRandom)
  - [humanReadableByteSize](#num-humanReadableByteSize)
  - [average](#num-average)
  - [median](#num-median)
  - [between](#num-between)
  - [sort](#num-sort)
  - [parseLength](#num-parseLength)
  - [roundTo](#num-roundTo)
  - [detent](#num-detent)
  - [toDegrees](#num-toDegrees)
  - [toRadians](#num-toRadians)

#### <a name="num-random"></a>num.random(min, max)

 random number between (and including) `min` and `max`

#### <a name="num-normalRandom"></a>num.normalRandom(mean, stdDev)

 returns randomized numbers in a normal distribution that can be
 controlled ising the `mean` and `stdDev` parameters

#### <a name="num-humanReadableByteSize"></a>num.humanReadableByteSize(n)

 interpret `n` as byte size and print a more readable version
 

```js
num.humanReadableByteSize(Math.pow(2,32)) // => "4096MB"
```

#### <a name="num-average"></a>num.average(numbers)



#### <a name="num-median"></a>num.median(numbers)



#### <a name="num-between"></a>num.between(x, a, b, eps)

 is `a` <= `x` <= `y`?

#### <a name="num-sort"></a>num.sort(arr)

 numerical sort, JavaScript native `sort` function is lexical by default.

#### <a name="num-parseLength"></a>num.parseLength(string, toUnit)

 This converts the length value to pixels or the specified `toUnit`.
 length converstion, supported units are: mm, cm, in, px, pt, pc
 

```js
num.parseLength('3cm') // => 113.38582677165354
num.parseLength('3cm', "in") // => 1.1811023622047243
```

#### <a name="toCm"></a>toCm(n, unit)

 as defined in http://www.w3.org/TR/css3-values/#absolute-lengths

#### <a name="num-roundTo"></a>num.roundTo(n, quantum)

 `quantum` is something like 0.01,

#### <a name="num-detent"></a>num.detent(n, detent, grid, snap)

 This function is useful to implement smooth transitions and snapping.
 Map all values that are within detent/2 of any multiple of grid to
 that multiple. Otherwise, if snap is true, return self, meaning that
 the values in the dead zone will never be returned. If snap is
 false, then expand the range between dead zone so that it covers the
 range between multiples of the grid, and scale the value by that
 factor.
 

```js
// With snapping:
num.detent(0.11, 0.2, 0.5, true) // => 0.11
num.detent(0.39, 0.2, 0.5, true) // => 0.39
num.detent(0.55, 0.2, 0.5, true)  // => 0.5
num.detent(0.61, 0.2, 0.5, true)   // => 0.61
// Smooth transitions without snapping:
num.detent(0.1,  0.2, 0.5) // => 0
num.detent(0.11,  0.2, 0.5) // => 0.0166666
num.detent(0.34,  0.2, 0.5)  // => 0.4
num.detent(0.39,  0.2, 0.5) // => 0.4833334
num.detent(0.4,  0.2, 0.5) // => 0.5
num.detent(0.6,  0.2, 0.5) // => 0.5
```

#### <a name="num-toDegrees"></a>num.toDegrees(n)

 

```js
num.toDegrees(Math.PI/2) // => 90
```

#### <a name="num-toRadians"></a>num.toRadians(n)

 

```js
num.toRadians(180) // => 3.141592653589793
```