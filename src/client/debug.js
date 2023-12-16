import {Logging} from "src/client/morphic/component-loader.js"

var debugCounterByClass = new Map()
var debugPrintMap = new WeakMap() // obj -> string
var debugPrintReverseMap = new Map() // string -> obj

// for debugging WeakRefs....
// var debugReg = new FinalizationRegistry(value => console.warn('COLLECTED: ' + value))

/*globals WeakRef */

export {Logging}

function debugPrint(element) {
  var print = debugPrintMap.get(element)
  if (!print) {
    var className = element.constructor.name
    var counter = debugCounterByClass.get(className) || 0
    counter++
    debugCounterByClass.set(className, counter)
    print = className + counter
    debugPrintMap.set(element, print)
    debugSet(print, element)
  }
  return print
}

export function debugGet(name) {
  let ref = debugPrintReverseMap.get(name)
  return ref && ref.deref()
}

// debugGet("sb-block61")


// let obj = document.body

export function debugSet(name, obj) {
  let ref = new WeakRef(obj)
  // debugReg.register(obj, name)
  return debugPrintReverseMap.set(name, ref)
}

Logging.enable()

Logging.setLog((element, ...args) => {
  
  if (element  && element instanceof HTMLElement ) {
    console.log(debugPrint(element), ...args)
  }
})


