import * as cop  from "src/client/ContextJS/src/contextjs.js";

var counter = 0

function currentStack() {
  try {
    throw new Error("XYZError")
  } catch(e) {
    return e.stack.split("\n")
      .filter(ea => !ea.match("src/external/ContextJS/src/Layers.js") )
      .filter(ea => !ea.match("XYZError") )
      .filter(ea => !ea.match("currentStack") )
      .map(ea => ea.replace(/\(.*?\)/,""))
      .join("\n")
  }
}

cop.layer(window, "ShowFocusLayer").refineClass(HTMLElement, {

 focus(str, context) {
  // console.log("document.hasFocus() " +  document.hasFocus())
 	var text = "focus" + this + " " + counter++ + ":\n"
 	console.log(text + "" + currentStack())
 	// lively.showElement(this).innerHTML = `<div style='position:relative; top: -30px; color:red'> ${text}</div> `;
		// return cop.withoutLayers([ShowFocusLayer], () => {
		// lively.focusWithoutScroll(this)
		// })
    return cop.proceed.apply(this, arguments)
 }
})


ShowFocusLayer.beGlobal()
// ShowFocusLayer.beNotGlobal()
