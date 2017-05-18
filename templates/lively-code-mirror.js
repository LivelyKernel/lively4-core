import generateUUID from './../src/client/uuid.js';
import boundEval from './../src/client/code-evaluation/bound-eval.js';

import Morph from "./Morph.js"

let loadPromise = undefined;

export default class LivelyCodeMirror extends HTMLElement {

  static get codeMirrorPath() {
     return  "src/external/code-mirror/"
  }
  
  static async loadModule(path) {
    return lively.loadJavaScriptThroughDOM("codemirror_"+path.replace(/[^A-Za-z]/g,""), 
      this.codeMirrorPath + path) // 
  }
  
  static async loadCSS(path) {
    return lively.loadCSSThroughDOM("codemirror_" + path.replace(/[^A-Za-z]/g,""), 
       this.codeMirrorPath + path)
  }
  
  static async loadModules() {
    if (loadPromise) return loadPromise
    
    loadPromise = (async () => {
      await this.loadModule("lib/codemirror.js")
      await this.loadModule("mode/javascript/javascript.js")
      await this.loadModule("addon/hint/show-hint.js")
      await this.loadModule("addon/hint/javascript-hint.js")
      await this.loadModule("addon/search/searchcursor.js")
      await this.loadModule("addon/search/search.js")
      await this.loadModule("addon/search/jump-to-line.js")
      await this.loadModule("addon/dialog/dialog.js")
      
      await System.import(lively4url + '/templates/lively-code-mirror-hint.js')
  
      this.loadCSS("addon/hint/show-hint.css")
      this.loadCSS("../../../templates/lively-code-mirror.css")
    })()
    return loadPromise
  }

  initialize() {
  }
  
  async attachedCallback() {
    if (this.isLoading || this.editor ) return;
    this.isLoading = true
    this.root = this.shadowRoot // used in code mirror to find current element
    
    var text = this.childNodes[0];
    var container = this.container;
    var element = this;
      
    await LivelyCodeMirror.loadModules()

    var value = (text && text.textContent) || this.value || "no content";

    this.editor = CodeMirror(this.shadowRoot.querySelector("#code-mirror-container"), {
      value: value,
      lineNumbers: true,
      gutters: ["leftgutter", "CodeMirror-linenumbers", "rightgutter"],
      mode: {name: "javascript", globalVars: true},
    });  
    
    this.editor.setOption("extraKeys", {
      "Alt-F": "findPersistent",
      "Ctrl-F": "search",
      "Ctrl-Space": "autocomplete",
      "Ctrl-P": (cm) => {
          let text = this.getSelectionOrLine()
          this.tryBoundEval(text, true);
      },
      "Ctrl-D": (cm) => {
          let text = this.getSelectionOrLine()
          this.tryBoundEval(text, false);
      },
      "Ctrl-S": (cm) => {          
        this.doSave(this.editor.getValue());
      },
    });
    this.editor.doc.on("change", evt => this.dispatchEvent(new CustomEvent("change", {detail: evt})))
    this.isLoading = false
    this.dispatchEvent(new CustomEvent("editor-loaded"))
  };

  doSave(text) {
    this.tryBoundEval(text) // just a default implementation...
  }

  getSelectionOrLine() {
    var text = this.editor.getSelection()
    if (text.length > 0)
      return text
    else
      return this.editor.getLine(this.editor.getCursor("end").line)
  }
  
  getDoitContext() {
    return this.doitContext
  }

  setDoitContext(context) {
    return this.doitContext = context;
  }

  getTargetModule() {
    return this.targetModule;
  }

  setTargetModule(module) {
    return this.targetModule = module;
  }

  async boundEval(str, context) {
    // Ensure target module loaded (for .js files only)
    // TODO: duplicate with var recorder plugin
    const MODULE_MATCHER = /.js$/;
    if(MODULE_MATCHER.test(this.getTargetModule())) {
      await System.import(this.getTargetModule())
    }

    // src, topLevelVariables, thisReference, <- finalStatement
    return boundEval(str, this.getDoitContext(), this.getTargetModule());
  }

  printResult(result) {
    var editor = this.editor;
    var text = result
    this.editor.setCursor(this.editor.getCursor("end"))
    // don't replace existing selection
    this.editor.replaceSelection(result, "around")

  }

 async tryBoundEval(str, printResult) {
    var resp;
    resp = await this.boundEval(str, this.getDoitContext())
    if (resp.isError) {
      var e = resp.value
      console.error(e)
      if (printResult) {
        window.LastError = e
        this.printResult("" +e)
      } else {
        lively.handleError(e)
      }
      return e
    }
    var result = resp.value
    var obj2string = function(obj) {
      var s = "";
      try {
        s += obj // #HACK some objects cannot be printed any more
      } catch(e) {
        s += "UnprintableObject["+ Object.keys(e) + "]" // so we print something else
      }
      return s
    }
    
    if (printResult) {
      // alaways wait on promises.. when interactively working...
      if (result && result.then) { 
        // we will definitly return a promise on which we can wait here
        result
          .then( result => {
            this.printResult("RESOLVED: " + obj2string(result))
          })
          .catch( error => {
            console.error(error);
            // window.LastError = error;
            this.printResult("Error in Promise: \n" +error)
          })
      } else {
        this.printResult(" " + obj2string(result))
        if (result instanceof HTMLElement ) {
          lively.showElement(result)
        }
      }
    }
    return result
  }
  
  async inspectIt(str) {
    var result =  await this.boundEval(str, this.getDoitContext()) 
    if (!result.isError) {
      lively.openInspector(result.value, null, str)
    }
  }

  doSave(text) {
    this.tryBoundEval(text) // just a default implementation...
  }
  

  detachedCallback() {
    this._attached = false;
  };

  attributeChangedCallback(attr, oldVal, newVal) {
    if(!this._attached){
        return false;
    }
  }
  
  get value() {
    if (this.editor) {
      return this.editor.getValue()
    } else {
      return this._value
    }
  }

  set value(text) {
    if (this.editor) {
      this.editor.setValue(text)
    } else {
      this._value = text
    }
  }
  
  setCustomStyle(source) {
    this.shadowRoot.querySelector("#customStyle").textContent = source
  }
  
  getCustomStyle(source) {
    return this.shadowRoot.querySelector("#customStyle").textContent
  }

  async livelyMigrate(other) {
   this.addEventListener("editor-loaded", () => {
      this.value = other.value
   })
  }
}


