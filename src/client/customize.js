
'use strict';

export default class Customize {
  
  static async openCustomizeWorkspace(evt) {
    var comp = await lively.openWorkspace(localStorage["customLivelyCode"], evt)
    comp.doSave = function doSave(text) {
        lively.notify("store custom workspace")
        localStorage["customLivelyCode"] = text
        this.tryBoundEval(text); // just a default implementation...
    }
    window.comp = that
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
