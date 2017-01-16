import * as cop  from "src/external/ContextJS/src/contextjs.js";
import aceEditor from 'templates/juicy-ace-editor.js'


// System.import('demos/devlayer.js')

// fall back to simple eval while we are working on the real code....
cop.layer(window, "DevLayer").refineClass(aceEditor, {

 async boundEval(str, context) {
    return new Promise((resolve) => {
      var result = (function() {
      	return eval(str)
      }).bind(context)()
      resolve({value: result})
    })
  }
})


DevLayer.beGlobal()