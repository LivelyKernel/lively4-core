import foobar from "./foobar.js"

var me = 4 + Math.random()

export default function foo(a) {
  return  21 + a + foobar()
}



console.log("LOADED foo.js - " + me)
