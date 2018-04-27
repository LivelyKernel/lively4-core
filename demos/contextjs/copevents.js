// Intercepts events with ContextJS

import * as cop from "src/client/ContextJS/src/contextjs.js"

cop.layer(window, "DebugEventsLayer").refineClass(HTMLElement, {

	addEventListener(eventName, cb, options) {
    return cop.proceed.call(this, eventName, (e) => {
		  var msg = "DEBUG" + this + 'add event ' + eventName
			lively.showElement(this, 1).textContent = msg
			cb(e)
		}, options)
	}
})


DebugEventsLayer.beNotGlobal()
