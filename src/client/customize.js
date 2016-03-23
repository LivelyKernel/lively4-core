
'use strict';

export default class Customize {
  
 
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
