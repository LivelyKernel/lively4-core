import foobar from "./foobar.js"


var me = Math.random()

export default function foo(a) {
  return  a + foobar()
}

console.log("LOADED foo.js " + me)
