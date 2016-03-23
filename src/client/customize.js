
'use strict';

export default class Customize {
  
  static openCustomizeWorkspace(evt) {
    lively.openWorkspace(localStorage["customLivelyCode"], evt).then( comp => {
      comp.doSave = function doSave(text) {
          lively.notify("store custom workspace")
          localStorage["customLivelyCode"] = text
          this.tryBoundEval(text); // just a default implementation...
      }
    })
  }
 
  static customizePage() {
    var code = localStorage["customLivelyCode"]
    if (code) {
      try {
        lively.boundEval(code)  
      } catch(e) {
        lively.notify("Error executing local code: " + code +"\n error:" + e)
      }
    }
  }
}
console.log("loadedc customize.js")
