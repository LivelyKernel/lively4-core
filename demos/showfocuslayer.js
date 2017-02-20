import * as cop  from "src/external/ContextJS/src/contextjs.js";

var counter = 0

function currentStack() {
  try {
    throw new Error("XError")
  } catch(e) {
    return e.stack
  }
}

cop.layer(window, "ShowFocusLayer").refineClass(HTMLElement, {

 focus(str, context) {
 	var text = "focus" + this + " " + counter++
 	console.log(text + "" + currentStack())
 	lively.showElement(this).innerHTML = `<div style='position:relative; top: -30px; color:red'> ${text}</div> `;
    return cop.proceed.apply(this, arguments)
 }
})


ShowFocusLayer.beGlobal()
// ShowFocusLayer.beNotGlobal()