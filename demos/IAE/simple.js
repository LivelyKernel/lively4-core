"enable aexpr"

import * as cop  from "src/client/ContextJS/src/contextjs.js";

var b 
var a = 0

var ae1
if (ae1) ae1.dispose();

ae1 = aexpr(() => a).onChange(() => b = a + 1)
a = 1
lively.notify("b: " + b)




const foo = {
  bar() { // bar is a layered method
    return 17;
  }
};


var l1 = cop.layer("l1")
l1.refineObject(foo, {
  bar() { 
    return 42 + cop.proceed(); 
  }
})


var state = 5
// l1.beNotGlobal()

l1.activeWhile(() => state > 10)


lively.notify("result " + foo.bar())

state =  11

lively.notify("result 2: " + foo.bar())

