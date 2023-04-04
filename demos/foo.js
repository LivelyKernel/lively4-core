"enable aexpr"

function f() {return 3}

let x = do {
    let tmp = f();
    tmp * tmp + 1
  };

lively.notify('x ' + x)


var a = 3


var b = 0

aexpr(() => a).onChange(() => { 
  b = {z: {x: 4}}
  lively.notify("b", b?.z?.x)  
})

a ++


import foobar from "./foobar.js"

var me = 4 + Math.random()

export default function foo(a) {
  return  12 + a + foobar()
}

export var a=3, b=4;

export var c = 3
c = 5

/*MD # Hello World MD*/

class Foo5 {
  
  // #important
  bar2 () {
    
  }
  
  // #FOO2
  get blue() {
    
  }
  
  // #TAG
  set blue(b) {
    
  }
  /*MD
  # Here come methods
  
  
  MD*/
  // #private
  m5() {
    
  }
   
  // #3
  // #TagMe
  m11() {
    
  }
  
 // #deprecated
  hello() {
    
  }
  /*MD
  ## and other
  
  
  MD*/
  // #p
  dosomthing() {
    
  }
  
  
  static m2() {
    
  }
  
  
  
}


console.log("LOADED foo.js - " + me)


