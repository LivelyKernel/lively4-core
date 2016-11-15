import {proceed, create as layer}  from "src/external/ContextJS.js"
import * as cop  from "src/external/ContextJS.js"


.refineClass(Promise, {
  then(defFunc) {
    console.log("define promise " + defFunc.toString().slice(0,100))
    return proceed.apply(arguments)
  } 
})
