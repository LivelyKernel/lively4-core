
import {bar, barrr} from "./cycldep2.js"


export var x = 1234;
export function foo() {
  return 111
}

export function foobar() {
  return barrr() + 1
}
 
