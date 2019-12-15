export var b = 5


export default function m2() {
  return b
}


export function changeB() {
  b = 8
}


export function printB() {
  console.log("m2: b=" + b)
}
