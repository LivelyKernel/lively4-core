/* Works around a Workaround in CodeMirror triggered a document.body.focus...
  that moved our world */

import * as cop  from "src/client/ContextJS/src/contextjs.js";

var StableFocusLayer = cop.layer(window, "StableFocusLayer").refineObject(document.body, {

 focus() {
	 // call a special focus that will call the native focus...
   return cop.withoutLayers([StableFocusLayer], () => {
	  	lively.focusWithoutScroll(this)
  })
 }
})

StableFocusLayer.beGlobal();

export default StableFocusLayer;
