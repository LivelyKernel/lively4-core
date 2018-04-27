import LogPromises from "demos/contextjs/logpromises.js"
import {defereLogging} from "demos/contextjs/logpromises.js"
import * as cop  from "src/client/ContextJS/src/contextjs.js"

LogPromises.resetLogs()
LogPromisesLayer.beGlobal()

var last
try {
  new Promise(r => {
    console.log("A")
    r()
  }).then( async (resp) => {
    console.log("B")
    // await... or not
    await new Promise(async (resolve)=> {
      console.log("C1")
      setTimeout(resolve, 10)
    }).then(r => {
      console.log("C2")
    })
    return
  })
  .then( r => {
    console.log("D")
  })::defereLogging();

  new Promise(r => {
    console.log("E")
  })
} finally {
  LogPromisesLayer.beNotGlobal()
}
