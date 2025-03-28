// import {Logging} from "src/client/morphic/component-loader.js"

var debugCounterByClass = new Map()
var debugPrintMap = new WeakMap() // obj -> string
var debugPrintReverseMap = new Map() // string -> obj

// for debugging WeakRefs....
// var debugReg = new FinalizationRegistry(value => console.warn('COLLECTED: ' + value))

/*globals WeakRef */

// export {Logging}

export function debugPrint(element) {
  if (!element) return
  var print = debugPrintMap.get(element)
  if (!print  && element  && element.constructor) {
    var className = element.constructor.name
    var counter = debugCounterByClass.get(className) || 0
    counter++
    debugCounterByClass.set(className, counter)
    print = className + counter
    try {
      debugPrintMap.set(element, print)
      debugSet(print, element)
    } catch(e) {
      return "" + element
    }
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


// if (false) {
//   Logging.enable()

//   Logging.setLog((element, ...args) => {

//     if (element  && element instanceof HTMLElement ) {
//       console.log(debugPrint(element), ...args)
//     }
//   })  
// }

export function printStack(offset=2) {
  return lively.stack().frames.map(ea => ea._desc.replace(lively4url,"")).slice(offset,-1).join("\n")
}


export function busyLogFocus(forTime=10, start, lastFocusedElement) {
  start = start || performance.now()
  let element = lively.activeElement()
  
  let delta =  performance.now() - start
  if (delta < forTime) {
    let focused = lively.activeElement()
    if (focused !== lastFocusedElement) {
      console.log(Math.round(performance.now() - window.timeStart) + " active " + debugPrint(focused))
    }
    
    
    setTimeout(() => busyLogFocus(forTime, start, focused), 0)
  }
  
}

/*MD # Some Interesting Debug Scripts... MD*/

/*

// TODO make funcition for it

lively.removeEventListener("devfocus",  document.body)
                        
lively.addEventListener("devfocus", document.body, "focusin", (evt) => {
  console.log(Math.round(performance.now() - window.timeStart)  + "ms focus in " + debugPrint(evt.target) + " active " + debugPrint(lively.activeElement())  + "\n"+ printStack(3) )
})


lively.addEventListener("devfocus", document.body, "focusout", (evt) => {
  console.log(Math.round(performance.now() - window.timeStart) + "ms focus out " + debugPrint(evt.target) + " active " + debugPrint(lively.activeElement()) + "\n" + printStack(3))
})


*/

/*

import * as cop  from "src/client/ContextJS/src/contextjs.js";


cop.layer(window, "ShowFocus").refineClass(HTMLElement, {

    focus(...args) {
      console.log(( performance.now() - window.timeStart) + " " + lively.debug.debugPrint(this) + ".focus" + lively.stack().frames.map(ea => ea._desc.replace(lively4url,"")).slice(4,-1).join("\n"))
      return cop.proceed(...args)
    },

    blur(...args) {
      console.log(( performance.now() - window.timeStart) +  " " + lively.debug.debugPrint(this) + ".blur" + lively.stack().frames.map(ea => ea._desc.replace(lively4url,"")).slice(4,-1).join("\n"))

      return cop.proceed(...args)
    }

  
})

ShowFocus.beGlobal()

ShowFocus.beNotGlobal()

*/



