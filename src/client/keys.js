'use strict';

// Livel4 Keyboard shortcuts

// Experiments for more late bound modules... that way the expots won't get frozen!
// idea

// #Duplication with shortcuts.js #TODO

import lively from "./lively.js";

export default class Keys {

  static getChar(evt) {
    return String.fromCharCode(evt.keyCode || evt.charCode);
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

  static getTextSelection() {
    return window.getSelection().toLocaleString()
  }

  static handle(evt) {
    // lively.notify("handle " + this.getChar(evt))
    try {
      var char = this.getChar(evt);
      // this.logEvent(evt)
      
      // TODO refactor it, so that there is only a single place for shortcut definition
      // see /src/client/contextmenu.js and /templates/classes/AceEditor.js
      if ((evt.ctrlKey || evt.metaKey) && char == "K") {
        lively.openWorkspace("");
        evt.preventDefault();
      } else if ((evt.ctrlKey || evt.metaKey) && evt.shiftKey &&char == "F") {
        lively.openSearchWidget(this.getTextSelection());
        evt.preventDefault();
      } else if (ect.shiftKey && (evt.ctrlKey || evt.metaKey) && char == "B") {
        lively.openBrowser(this.getTextSelection());
        evt.preventDefault();
      } else if ((evt.ctrlKey || evt.metaKey) && char == "O") {
        lively.openComponentInWindow("lively-component-bin");
        evt.preventDefault();
      }  else if ((evt.ctrlKey || evt.metaKey)  && char == "H") {
        lively.openHelpWindow(this.getTextSelection());
        evt.preventDefault();
      } else if (evt.keyCode == 27) {
        lively.hideSearchWidget();
      }
      
      if ((evt.ctrlKey || evt.metaKey) && char == "D") {
        let str = window.getSelection().toLocaleString();
        try {
          lively.boundEval(str);
        } catch(e) {
          lively.handleError(e);
        }
        evt.preventDefault();
      }
    } catch (err) {
      console.log("Error in handleKeyEvent" +  err);
    }
  }
}

console.log("loaded keys.js")
