
import {foo} from './mymod2.js'

// var a;

// seta()

export function seta() {
  a = 3
}

console.log("load mymod")

export async function bla() {
  return "X_" + await foo() 
}