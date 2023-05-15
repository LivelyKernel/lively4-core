## 2023-05-12*Author: @JensLincke* # Debugging BabylonianProgramming

It took a while to debug into Babylonian Programming, since its code rewriting is custom and not compatible with our Plugin Explorer. 

```javascript
import Tracker from "src/babylonian-programming-editor/utils/tracker.js"

this.tracker = new Tracker()


 const __connections = this.connections;
const __tracker = this.tracker;
__tracker.timer.start();
const __blockId = 49;
__tracker.block(__blockId);
const __iterationId = 49;
const __iterationCount = __tracker.iteration(__iterationId);
function foo() {
  __tracker.timer.check();
  const __blockId = 52;
  __tracker.block(__blockId);
  const __iterationId = 52;
  const __iterationCount = __tracker.iteration(__iterationId);
  var a = [1, 2, 3];
  a = a.map(ea => {
    debugger
    __tracker.timer.check();
    const __blockId = 72;
    __tracker.block(__blockId);
    const __iterationId = 72;
    const __iterationCount = __tracker.iteration(__iterationId);
    ea;
  });
  return __tracker.id(70, Zone.current.babylonianExampleId, __iterationId, __iterationCount, a, "return");
}
const __0 = () => null;
(async () => {
  try {
    __tracker.example("2664_b696_d611");
    const example = function () {
      ;
      foo.apply(this, []);
      ;
    };
    await runZoned(async () => {
      example.apply(await null, []);
    }, {
      zoneValues: {
        babylonianExampleId: "2664_b696_d611"
      }
    });
  } catch (e) {
    __tracker.error(e.message, "2664_b696_d611");
  }
})();;
__tracker.timer.reset();

// that.executableCode
```

But I found the issue... and it is ... a known one:  Rewriting closures is not supported, because a return statement is missing



```javascript
  a = a.map(ea => ea)
```

became

```javascript
a = a.map(ea => {
    debugger
    __tracker.timer.check();
    const __blockId = 72;
    __tracker.block(__blockId);
    const __iterationId = 72;
    const __iterationCount = __tracker.iteration(__iterationId);
    ea;
  });
```



