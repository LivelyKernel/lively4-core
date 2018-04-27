import * as cop  from "src/client/ContextJS/src/contextjs.js";
import {pt} from 'src/client/graphics.js';

export default class ShowPerformance {

  static measure(classObj, methodName, uiselector) {
    console.log("PERF Hello 2")
    var layeredMethods = {}

    layeredMethods[methodName]  = function() {
      var start = performance.now()
      var bounds = this.getBoundingClientRect()

      var ui = document.body.querySelector("#performanceLayer")
      if (!ui) {
        ui = document.createElement("div")
        ui.id = "performanceLayer"
        ui.position = "absolute"
      }
      ui.innerHTML = ""

      var start = performance.now()
      var result = cop.proceed.apply(this, arguments)
      if (result.then) {
        result.then(() => {
        // lively.notify("Hi! 2")

        var label = document.createElement("div")
        label.textContent = "" + Math.round(performance.now() - start) + "ms"
        label.style.color = "red"
        ui.appendChild(label)
        lively.setPosition(ui, pt(bounds.right - 150,bounds.bottom - 30))

        })
      }
      return result
    }
    // HAHA

    // #TODO I don't trust the module to be a singleton.... yet

    var layer = cop.layer(window, "ShowPerformanceLayer")

    // Object.keys(layer).filter(ea => {
  	 // return !ea.match("_")
    // }).forEach(ea => {
	   // delete layer[ea]
    // })

    layer.refineClass(classObj, layeredMethods)

    layer.beGlobal()
    // ShowPerformanceLayer.beNotGlobal()
  }

}



window.ShowPerformance1 = ShowPerformance
