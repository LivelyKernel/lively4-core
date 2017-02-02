
import {foo} from './mymod2.js'

console.log("load mymod")
debugger
export async function bla() {
  return "X_" + await foo() 
}
