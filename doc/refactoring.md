# babel5 -> babel6/more vanilla refactoring

## Steps

[X] branch babel6 is booting
[X] workspace evals
[ ] workspace keeps variables
[ ] workspace can import modules
[ ] modules can be replaced
[ ] modules can be inspected

## Issues


```
graphics.js:1170 Uncaught ReferenceError: Point is not defined
    at pt (https://lively-kernel.org/lively4/lively4-jens/src/client/graphics.js!transpiled:20:16)
    at Object.globalPosition (https://lively-kernel.org/lively4/lively4-jens/src/client/morphic/event-helpers.js!transpiled:6:12)
    at lively.html.findAllNodes.filter.filter.ea (https://lively-kernel.org/lively4/lively4-jens/templates/lively-halo.js!transpiled:61:30)
    at Array.filter (native)
    at HTMLElement.onBodyMouseDown (https://lively-kernel.org/lively4/lively4-jens/templates/lively-halo.js!transpiled:58:136)
    at HTMLElement.onMouseDown (https://lively-kernel.org/lively4/lively4-jens/templates/lively-container.js!transpiled:313:55)
    at HTMLElement.lively.addEventListener.evt (https://lively-kernel.org/lively4/lively4-jens/templates/lively-container.js!transpiled:41:79)
```

```
  function pt(x, y) {
    return new Point(x, y);
  }

  _export("pt", pt);
```

```
  return {
    setters: [],
    execute: function () {
      // import { num, string, grid } from "lively.lang";
      // import { cssLengthToPixels } from "./convert-css-length.js";

      /* copied from lively.graphics and removed dependency to lively.lang */

      class Point {
```