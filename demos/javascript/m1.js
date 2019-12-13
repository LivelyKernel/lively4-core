import {b, changeB, printB} from "./m2.js"


export function myPrintB() {
  console.log("m1: b=" + b)
}

// 

myPrintB()

// change it here

// b = 8 // #Native m1.js:14 Uncaught TypeError: Assignment to constant variable.
// so we are fine, that it cannot be change from the outside.. only from the inside
printB()

// change in in their module...

changeB()
printB()


myPrintB()