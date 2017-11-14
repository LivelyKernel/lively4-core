'use strict';

// Livel4 Keyboard shortcuts

// Experiments for more late bound modules... that way the expots won't get frozen!
// idea

// #Duplication with shortcuts.js #TODO

// import lively from "./lively.js"; #TODO does not work anymore...

import GraphControl from "templates/graph-control.js";

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
    // #Hack, fix a little but in ContextMenu movement...
    lively.lastScrollTop = document.scrollingElement.scrollTop;
    lively.lastScrollLeft = document.scrollingElement.scrollLeft;
    
    try {
      const char = this.getChar(evt);
      const ctrl = evt.ctrlKey || evt.metaKey;
      const { shiftKey, altKey, keyCode, charCode } = evt;
      
      const keyHandlers = [
        ["Open Workspace", ctrl && char == "K", evt => {
          lively.openWorkspace("")
        }],
        ["Search", ctrl && shiftKey && char == "F", evt => {
          lively.openSearchWidget(this.getTextSelection(), null, evt.path[0]);
        }],
        ["Search Graph", ctrl && altKey && char == "F", evt => {
          GraphControl.fullTextSearch(this.getTextSelection());
        }],
        ["Open Container", shiftKey && ctrl && char == "B", evt => {
          lively.openBrowser(this.getTextSelection());
        }],
        ["Open Sync Tool", shiftKey && ctrl && char == "G", evt => {
          // this does not work up on #Jens' windows machine
          lively.openComponentInWindow("lively-sync");
        }],
        ["Open Component Bin", ctrl && char == "O", evt => {
          lively.openComponentInWindow("lively-component-bin");
        }],
        // #TODO: does this work?
        ["Open Console", !shiftKey && ctrl && char == "J", evt => {
          lively.openComponentInWindow("lively-console");
        }],
        ["Open DevDocs", ctrl && char == "H", evt => {
          lively.openHelpWindow(this.getTextSelection());
        }],
        ["Open Graph COntrol", ctrl && altKey && char == "G", evt => {
          lively.openComponentInWindow("graph-control");
        }],
        ["Hide Search Widget", keyCode == 27, evt => {
          lively.hideSearchWidget();
        }], 
        ["Do It", ctrl && char == "D", evt => {
          if (evt.path.find(ea => ea.tagName == "LIVELY-CODE-MIRROR")) {
            // lively.notify("codemirror handles itself " )
            return; // code mirror does not stop it's propagation
          }
          let str = window.getSelection().toLocaleString();
          lively.notify("eval: " + str)
          try {
            lively.boundEval(str);
          } catch(e) {
            lively.handleError(e);
          }
        }],
      ];
      
      const [name, match, callback] = keyHandlers.find(([name, match]) => match) || [];
      if(callback) {
        callback(evt);
        evt.preventDefault();
      }
    } catch (err) {
      console.log("Error in handleKeyEvent" +  err);
    }
  }
}