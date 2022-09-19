## 2022-01-31 Transformations
*Author: @JensLincke*


Just cheching if our graphics package works

```javascript

import {pt, rect, Point, Line, Transform} from "src/client/graphics.js"

// identity
var t1 = new Transform(pt(0,0), 0, pt(1,1))
t1.transformPoint(pt(100,0)).toString() // pt(100,0)

// translation
var t1 = new Transform(pt(100,0), 0, pt(1,1))
t1.transformPoint(pt(100,0)).toString() // pt(200,0)

// rotation
var t1 = new Transform(pt(0,0), 90 * Math.PI / 180, pt(1,1))
t1.transformPoint(pt(100,0)).toString() //  pt(6.123233995736766e-15,100)


```

It seems to get the basics right

