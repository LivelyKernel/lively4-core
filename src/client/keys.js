'use strict';

// Livel4 Keyboard shortcuts

// Experiments for more late bound modules... that way the expots won't get frozen!
// idea
export default class Keys {

  static getChar(evt) {
    return String.fromCharCode(evt.keyCode || evt.charCode)
  }

  static logEvent(evt) {
    console.log("key: "
      +" shift=" + evt.shiftKey
      +" ctrl=" + evt.ctrlKey
      +" alt=" + evt.altKey
      +" meta=" + evt.metaKey
      +" char=" + this.getChar(evt)
      );
  }

  static handle(evt) {
    try {
      var char = this.getChar(evt)
      // this.logEvent(evt)
      if (evt.ctrlKey && char == "K") {
        lively.openWorkspace()
        evt.preventDefault()
      }
    } catch (err) {
      console.log("Error in handleKeyEvent" +  err);
    }
  }
}
// var instance = new Keys()
// export default instance

console.log("loaded keys.js")
