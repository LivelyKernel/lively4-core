import generateUUID from './../src/client/uuid.js';
import boundEval from './../src/client/bound-eval.js';
import Morph from "./Morph.js"
import diff from 'src/external/diff-match-patch.js';

import 'src/client/stablefocus.js';



let loadPromise = undefined;

export default class LivelyCodeMirror extends HTMLElement {

  static get codeMirrorPath() {
     return  "src/external/code-mirror/"
  }

  static async loadModule(path) {
    return lively.loadJavaScriptThroughDOM("codemirror_"+path.replace(/[^A-Za-z]/g,""),
      this.codeMirrorPath + path)
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
      await this.loadModule("mode/xml/xml.js")
      await this.loadModule("mode/css/css.js")

      await this.loadModule("mode/markdown/markdown.js")
      await this.loadModule("mode/htmlmixed/htmlmixed.js")
      await this.loadModule("addon/mode/overlay.js")
      await this.loadModule("mode/gfm/gfm.js")

      await this.loadModule("addon/edit/matchbrackets.js")
      await this.loadModule("addon/edit/closetag.js")
      await this.loadModule("addon/edit/closebrackets.js")
      await this.loadModule("addon/edit/continuelist.js")
      await this.loadModule("addon/edit/matchtags.js")
      await this.loadModule("addon/edit/trailingspace.js")
      await this.loadModule("addon/hint/show-hint.js")
      await this.loadModule("addon/hint/javascript-hint.js")
      await this.loadModule("addon/search/searchcursor.js")
      await this.loadModule("addon/search/search.js")
      await this.loadModule("addon/search/jump-to-line.js")
 			await this.loadModule("addon/search/matchesonscrollbar.js")
 			await this.loadModule("addon/search/match-highlighter.js")
      await this.loadModule("addon/scroll/annotatescrollbar.js")
      await this.loadModule("addon/comment/comment.js")
      await this.loadModule("addon/dialog/dialog.js")
      await this.loadModule("addon/scroll/simplescrollbars.js")

      await this.loadModule("addon/merge/merge.js")
      await this.loadModule("addon/selection/mark-selection.js")

      await this.loadModule("keymap/sublime.js")
      await System.import(lively4url + '/templates/lively-code-mirror-hint.js')

      this.loadCSS("addon/hint/show-hint.css")
      this.loadCSS("../../../templates/lively-code-mirror.css")
    })()
    return loadPromise
  }

  initialize() {
  	this._attrObserver = new MutationObserver((mutations) => {
	  mutations.forEach((mutation) => {  
        if(mutation.type == "attributes") {
          // console.log("observation", mutation.attributeName,mutation.target.getAttribute(mutation.attributeName));
          this.attributeChangedCallback(
            mutation.attributeName,
            mutation.oldValue,
            mutation.target.getAttribute(mutation.attributeName))
        }
      });
    });
    this._attrObserver.observe(this, { attributes: true });
  }
  
  applyAttribute(attr) {
    var value = this.getAttribute(attr)
    if (value !== undefined) {
      this.setAttribute(attr, value)
    }
  }
  
  async attachedCallback() {
    if (this.isLoading || this.editor ) return;
    this.isLoading = true
    this.root = this.shadowRoot // used in code mirror to find current element
    await LivelyCodeMirror.loadModules(); // lazy load modules...

    if (this.textContent) {
      var value = this.decodeHTML(this.textContent);
    } else {
      value = this.value || "";
    }
  	this.editView(value)
    this.isLoading = false
    this.dispatchEvent(new CustomEvent("editor-loaded"))
  };
  
  editView(value) {
    if (!value) value = this.value || "";
    var container = this.shadowRoot.querySelector("#code-mirror-container")
    container.innerHTML = ""
    this.setEditor(CodeMirror(container, {
      value: value,
      lineNumbers: true,
      gutters: ["leftgutter", "CodeMirror-linenumbers", "rightgutter"]
    }));  
  }
  
  setEditor(editor) {
    this.editor = editor
		this.setupEditor()
  }
  
	setupEditor() {
  	var editor = this.editor;
    if (this.mode) {
      editor.setOption("mode", this.mode);
    }

    // edit addons
    // editor.setOption("showTrailingSpace", true)
    // editor.setOption("matchTags", true)
    editor.setOption("matchBrackets", true)
    editor.setOption("styleSelectedText", true)
    editor.setOption("autoCloseBrackets", true)
    editor.setOption("autoCloseTags", true)
		editor.setOption("scrollbarStyle", "simple")

    editor.setOption("tabSize", 2)

    editor.setOption("highlightSelectionMatches", {showToken: /\w/, annotateScrollbar: true})

    editor.setOption("keyMap",  "sublime")
		editor.setOption("extraKeys", {
      "Alt-F": "findPersistent",
      // "Ctrl-F": "search",
      "Ctrl-F": (cm) => {
		// something immediately grabs the "focus" and we close the search dialog..
        // #Hack... 
        setTimeout(() => {
            editor.execCommand("findPersistent");
            this.shadowRoot.querySelector(".CodeMirror-search-field").focus();
        }, 10)
        // editor.execCommand("find")
      },
      "Ctrl-Space": "autocomplete",
      "Ctrl-P": (cm) => {
          let text = this.getSelectionOrLine()
          this.tryBoundEval(text, true);
      },
      "Ctrl-I": (cm) => {
        let text = this.getSelectionOrLine()
        this.inspectIt(text)
      },
      "Ctrl-D": (cm, b, c) => {
        	
        	lively.notify("doit " + Date.now())
          let text = this.getSelectionOrLine()
          this.tryBoundEval(text, false);
        	debugger
        	return true
      },
  		"Ctrl-Alt-Right": "selectNextOccurrence", 
  		"Ctrl-Alt-Left": "undoSelection", 
      "Ctrl-/": "toggleCommentIndented",
      "Ctrl-S": (cm) => {          
        this.doSave(editor.getValue());
      },
    });
    editor.setOption("hintOptions", {
      container: this.shadowRoot.querySelector("#code-mirror-hints")
    });

    editor.on("change", evt => this.dispatchEvent(new CustomEvent("change", {detail: evt})))

		// apply attributes 
    _.map(this.attributes, ea => ea.name).forEach(ea => this.applyAttribute(ea)) 
  }
  
  
  // Fires when an attribute was added, removed, or updated
  attributeChangedCallback(attr, oldVal, newVal) {
    if(!this.editor){
        return false;
    }
    switch(attr){
      // case "theme":
      //     this.editor.setTheme( newVal );
      //     break;
      // case "mode":
      //     this.changeMode( newVal );
      //     break;
      // case "fontsize":
      //     this.editor.setFontSize( newVal );
      //     break;
      // case "softtabs":
      //     this.editor.getSession().setUseSoftTabs( newVal );
      //     break;
      case "tabsize":
		this.setOption("tabSize", newVal)
        break;
      // case "readonly":
      //     this.editor.setReadOnly( newVal );
      //     break;
      case "wrapmode":
        this.setOption("lineWrapping", newVal)
      	break;
    }
  }
  
  
  setOption(name, value) {
    if (!this.editor) return; // we loose...
    this.editor.setOption(name, value)
  } 
  
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
      result = result.value 
    }
    if (result.then) {
      result = await result; // wait on any promise
    }
    lively.openInspector(result, null, str) 
  }
  

  doSave(text) {
    this.tryBoundEval(text) // just a default implementation...
  }
  

  detachedCallback() {
    this._attached = false;
  };
  
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
   
  encodeHTML(s) {
    return s.replace("&", "&amp;").replace("<", "&lt;") 
  }
  
  decodeHTML(s) {
    return s.replace("&lt;", "<").replace("&amp;", "&") 
  }
    
  resize() {
    // #ACE Component compatiblity
  }
    
  enableAutocompletion() {
    // #ACE Component compatiblity
  }
  
  changeModeForFile(filename) {
    if (!this.editor) return;
    
    var mode = "text"
    // #TODO there must be some kind of automatching?
    if (filename.match(/\.html$/)) {
      mode = "text/html"
    } else if (filename.match(/\.md$/)) {
      mode = "gfm"
    } else if (filename.match(/\.css$/)) {
      mode = "css"
    } else if (filename.match(/\.xml$/)) {
      mode = "xml"
    } else if (filename.match(/\.json$/)) {
      mode = "javascript"
    } else if (filename.match(/\.js$/)) {
      mode = "javascript"
    }
    this.mode = mode
    this.editor.setOption("mode", mode)
  }

  livelyPrepareSave() {
    this.textContent = this.encodeHTML(this.editor.getValue())
  }

  livelyPreMigrate() {
    if (this.editor) {
      this.lastScrollInfo = this.editor.getScrollInfo(); // #Example #PreserveContext
    }
  }
  
  isFocused(doc) {
    doc = doc || document
    if (doc.activeElement === this) return true
    // search recursively in shadowDoms  
    if (doc.activeElement && doc.activeElement.shadowRoot) {
			return this.isFocused(doc.activeElement.shadowRoot)      
    }
    return false
  }
  
  async livelyMigrate(other) {
    this.addEventListener("editor-loaded", () => {
      this.value = other.value;
      if (other.lastScrollInfo) {
      	this.editor.scrollTo(other.lastScrollInfo.left, other.lastScrollInfo.top)        
      }
    })
  }
  
  mergeView(originalText, originalLeftText) {
    var target = this.shadowRoot.querySelector("#code-mirror-container")
    target.innerHTML = "";
    this._mergeView =  CodeMirror.MergeView(target, {
      value: this.value,
      origLeft: originalLeftText,
      orig: originalText,
      lineNumbers: true,
      mode: this.editor.getOption('mode'),
      scrollbarStyle: this.editor.getOption('scrollbarStyle'),
      highlightDifferences: true,
      connect: "align",
      collapseIdentical: false
    });
    // if (this._mergeView.right) {
    // this.setEditor(this._mergeView.right.edit)
    // }
    this.setEditor(this._mergeView.editor())
    // this.resizeMergeView(this._mergeView)
  }
  
  resizeMergeView(mergeView) {
    function editorHeight(editor) {
      if (!editor) return 0;
      return editor.getScrollInfo().height;
    }

    function mergeViewHeight(mergeView) {
      return Math.max(editorHeight(mergeView.leftOriginal()),
                      editorHeight(mergeView.editor()),
                      editorHeight(mergeView.rightOriginal()));
    }  
    var height = mergeViewHeight(mergeView);
    for(;;) {
      if (mergeView.leftOriginal())
        mergeView.leftOriginal().setSize(null, height);
      mergeView.editor().setSize(null, height);
      if (mergeView.rightOriginal())
        mergeView.rightOriginal().setSize(null, height);

      var newHeight = mergeViewHeight(mergeView);
      if (newHeight >= height) break;
      else height = newHeight;
    }
    mergeView.wrap.style.height = height + "px";
  }

  find(name) {
    // #TODO this is horrible... Why is there not a standard method for this?
	if (!this.editor) return;
    var found = false;
  	this.value.split("\n").forEach((ea, index) => {
      if (!found && (ea.indexOf(name) != -1)) {
	    this.editor.setCursor(index, 10000);// line end ;-)
        this.editor.focus()
        found = ea;
  	  }
    })
  }
}


// LivelyCodeMirror.loadModules()

