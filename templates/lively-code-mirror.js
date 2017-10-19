import generateUUID from './../src/client/uuid.js';
import boundEval from './../src/client/bound-eval.js';
import Morph from "./Morph.js"
import diff from 'src/external/diff-match-patch.js';
import SyntaxChecker from 'src/client/syntax.js';
import { debounce } from "utils";
import Preferences from 'src/client/preferences.js';
import {pt, rect} from 'src/client/graphics.js';
import 'src/client/stablefocus.js';

let loadPromise = undefined;

export default class LivelyCodeMirror extends HTMLElement {

  static get codeMirrorPath() {
     return  lively4url + "/src/external/code-mirror/"
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

      await this.loadModule("addon/tern/tern.js")

      await lively.loadJavaScriptThroughDOM("tern_acorn", '//ternjs.net/node_modules/acorn/dist/acorn.js')
      await lively.loadJavaScriptThroughDOM("tern_acorn_loose", '//ternjs.net/node_modules/acorn/dist/acorn_loose.js')
      await lively.loadJavaScriptThroughDOM("tern_walk",'//ternjs.net/node_modules/acorn/dist/walk.js')
      await lively.loadJavaScriptThroughDOM("tern_polyfill",'//ternjs.net/doc/demo/polyfill.js')
      await lively.loadJavaScriptThroughDOM("tern_signal",'//ternjs.net/lib/signal.js')
      await lively.loadJavaScriptThroughDOM("tern_tern",'//ternjs.net/lib/tern.js')
      await lively.loadJavaScriptThroughDOM("tern_def",'//ternjs.net/lib/def.js')
      await lively.loadJavaScriptThroughDOM("tern_comment",'//ternjs.net/lib/comment.js')
      await lively.loadJavaScriptThroughDOM("tern_infer",'//ternjs.net/lib/infer.js')
      await lively.loadJavaScriptThroughDOM("tern_plugin_modules",'//ternjs.net/plugin/modules.js')
      await lively.loadJavaScriptThroughDOM("tern_plugin_esmodules",'//ternjs.net/plugin/es_modules.js')

      
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
    this.setupEditorOptions(editor)
    // edit addons
    // editor.setOption("showTrailingSpace", true)
    // editor.setOption("matchTags", true)

    editor.on("change", evt => this.dispatchEvent(new CustomEvent("change", {detail: evt})))
    editor.on("change", (() => this.checkSyntax())::debounce(500))
    
		// apply attributes 
    _.map(this.attributes, ea => ea.name).forEach(ea => this.applyAttribute(ea));
    
    if(Preferences.get('UseTernInCodeMirror')) {
      this.enableTern();
    }
  }
  
  setupEditorOptions(editor) {
    editor.setOption("matchBrackets", true)
    editor.setOption("styleSelectedText", true)
    editor.setOption("autoCloseBrackets", true)
    editor.setOption("autoCloseTags", true)
		editor.setOption("scrollbarStyle", "simple")
		editor.setOption("scrollbarStyle", "simple")

    editor.setOption("tabSize", 2)
    editor.setOption("indentWithTabs", false)

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
      "Ctrl-Space": cm => {
        this.fixHintsPosition()
        cm.execCommand("autocomplete")
      },
      "Ctrl-Alt-Space": cm => {
        this.fixHintsPosition()
        cm.execCommand("autocomplete")
      },
      "Ctrl-P": (cm) => {
          let text = this.getSelectionOrLine()
          this.tryBoundEval(text, true);
      },
      "Ctrl-I": (cm) => {
        let text = this.getSelectionOrLine()
        this.inspectIt(text)
      },
      "Ctrl-D": (cm, b, c) => {
        	let text = this.getSelectionOrLine()
          this.tryBoundEval(text, false);
        	return true
      },
  		"Ctrl-Alt-Right": "selectNextOccurrence", 
  		"Ctrl-Alt-Left": "undoSelection", 
      "Ctrl-/": "toggleCommentIndented",
    	'Tab': (cm) => {
        if (cm.somethingSelected()) {
    			cm.indentSelection("add");
  			} else {
        	cm.execCommand('insertSoftTab')
        }
      },
      "Ctrl-S": (cm) => {          
        this.doSave(editor.getValue());
      },
    });
    editor.setOption("hintOptions", {
      container: this.shadowRoot.querySelector("#code-mirror-hints"),
      codemirror: this,
      closeCharacters: /\;/ // we want to keep the hint open when typing spaces and "{" in imports...
    });
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
      case "tern":
        if (newVal)
				  this.enableTern()
        break;
      
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
  
  get isJavaScript() {
    if (!this.editor) return false;
    return this.editor.getOption("mode") == "javascript";
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
    if(!this.editor) { return; }
    this.textContent = this.encodeHTML(this.editor.getValue())
  }

  livelyPreMigrate() {
    if (this.editor) {
      this.lastScrollInfo = this.editor.getScrollInfo(); // #Example #PreserveContext
    }
  }
  
  focus() {
    if(this.editor) this.editor.focus()
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
  
  fixHintsPosition() {
    lively.setPosition(this.shadowRoot.querySelector("#code-mirror-hints"),
      pt(-document.scrollingElement.scrollLeft,-document.scrollingElement.scrollTop).subPt(lively.getGlobalPosition(this)))
  }
  
  
  async enableTern() {
    var ecmascriptdefs = await fetch("//ternjs.net/defs/ecmascript.json").then(r => r.json())
    var browserdefs = await fetch("//ternjs.net/defs/browser.json").then(r => r.json())
    // var chaidefs = await fetch("//ternjs.net/defs/chai.json").then(r => r.json())
    
    // Options supported (all optional):
    // * defs: An array of JSON definition data structures.
    // * plugins: An object mapping plugin names to configuration
    //   options.
    // * getFile: A function(name, c) that can be used to access files in
    //   the project that haven't been loaded yet. Simply do c(null) to
    //   indicate that a file is not available.
    // * fileFilter: A function(value, docName, doc) that will be applied
    //   to documents before passing them on to Tern.
    // * switchToDoc: A function(name, doc) that should, when providing a
    //   multi-file view, switch the view or focus to the named file.
    // * showError: A function(editor, message) that can be used to
    //   override the way errors are displayed.
    // * completionTip: Customize the content in tooltips for completions.
    //   Is passed a single argument the completion's data as returned by
    //   Tern and may return a string, DOM node, or null to indicate that
    //   no tip should be shown. By default the docstring is shown.
    // * typeTip: Like completionTip, but for the tooltips shown for type
    //   queries.
    // * responseFilter: A function(doc, query, request, error, data) that
    //   will be applied to the Tern responses before treating them

    // It is possible to run the Tern server in a web worker by specifying
    // these additional options:
    // * useWorker: Set to true to enable web worker mode. You'll probably
    //   want to feature detect the actual value you use here, for example
    //   !!window.Worker.
    // * workerScript: The main script of the worker. Point this to
    //   wherever you are hosting worker.js from this directory.
    // * workerDeps: An array of paths pointing (relative to workerScript)
    //   to the Acorn and Tern libraries and any Tern plugins you want to
    //   load. Or, if you minified those into a single script and included
    //   them in the workerScript, simply leave this undefined.
    
    this.ternServer = new CodeMirror.TernServer({
      defs: [ecmascriptdefs, browserdefs], // chaidefs  
      plugins: {
        es_modules: {}
      },
      getFile: (name, c) => {
        lively.notify("get file " + name)
        c(null)
      },
      // responseFilter: (doc, query, request, error, data) => {
      //  return data
      // }
      
    });
    
    this.editor.setOption("extraKeys", Object.assign({},
      this.editor.getOption("extraKeys"), 
      {
        "Ctrl-Space": (cm) => { 
          this.fixHintsPosition();
          this.ternServer.complete(cm); 
        },
        "Ctrl-Alt-I": (cm) => { this.ternServer.showType(cm); },
        "Ctrl-O": (cm) => { this.ternServer.showDocs(cm); },
        "Alt-.": (cm) => { this.ternServer.jumpToDef(cm); },
        "Alt-,": (cm) => { this.ternServer.jumpBack(cm); },
        "Ctrl-Q": (cm) => { this.ternServer.rename(cm); },
        "Ctrl-.": (cm) => { this.ternServer.selectName(cm); } 
      }))
    
    this.editor.on("cursorActivity", (cm) => { this.ternServer.updateArgHints(cm); });
  }
  
  
  async addTernFile(name, url, text) {
    if (!this.ternServer) return 
    url = url || name; 
    text = text || await fetch(url).then(r => r.text())
    this.ternServer.server.addFile(name, text)  
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
  
  checkSyntax() {
    if (this.isJavaScript) {
       SyntaxChecker.checkForSyntaxErrors(this.editor);
    }
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

