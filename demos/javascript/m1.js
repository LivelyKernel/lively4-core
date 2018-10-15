import {b} from "./m2.js"

export var a = 4

export default function m1() {
  
  return b + a
}

console.log("m1: " + m1())

export function change() {
  a = 6 
}