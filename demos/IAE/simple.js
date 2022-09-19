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
// l1.beNotGlobal()

var state = 5

l1.onActivate(() => lively.notify("l1 A!"))

l1.activeWhile(() => state > 10)

lively.notify("result " + foo.bar())
state =  11
lively.notify("result 2: " + foo.bar())


{

  class C1 {
    m1() {
      return 3
    }
  }
  var l2 = new cop.Layer() 
  l2.refineClass(C1, {
    m1() {
      return 1 + cop.proceed()
    }
  })
  
  var o = new C1()  
  
  lively.notify("m1:" + o.m1())
  
  
  cop.withLayers([l2], () => {
    lively.notify("l2: m1:" + o.m1())
  })
  
  var o2 = {
    state: 5
  }
  
  l2.onActivate(() => lively.notify("l2 A!"))
  l2.activeWhile(() => o2.state > 10)
  
  lively.notify("before ILA m1:" + o.m1())
    
  o2.state = 11
  
  lively.notify("after ILA m1:" + o.m1())

  o2.state = 6
  
  lively.notify("update ILA m1:" + o.m1())
  
  // future work.... dispose AExprForILA
  // maybe WeakReference for the rescue....
}


