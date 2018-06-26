import { promisedEvent, through, uuid as generateUUID } from 'utils';
import boundEval from 'src/client/bound-eval.js';
import Morph from "src/components/widgets/lively-morph.js"
import diff from 'src/external/diff-match-patch.js';
import SyntaxChecker from 'src/client/syntax.js';
import { debounce } from "utils";
import Preferences from 'src/client/preferences.js';
import {pt, rect} from 'src/client/graphics.js';
import 'src/client/stablefocus.js';
import Strings from 'src/client/strings.js';
import { letsScript } from 'src/client/vivide/vivide.js';
import { TernCodeMirrorWrapper } from 'src/client/reactive/tern-spike/tern-wrapper.js';
import { babel } from 'systemjs-babel-build';
import LivelyCodeMirrorWidgetImport from 'src/components/widgets/lively-code-mirror-widget-import.js';

import * as spellCheck from "src/external/codemirror-spellcheck.js"

import {isSet} from 'utils'

let loadPromise = undefined;

function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}

// BEGIN #copied from emacs.js
function repeated(cmd) {
  var f = typeof cmd == "string" ? function(cm) { cm.execCommand(cmd); } : cmd;
  return function(cm) {
    var prefix = getPrefix(cm);
    f(cm);
    for (var i = 1; i < prefix; ++i) f(cm);
  };
}

function getPrefix(cm, precise) {
  var digits = cm.state.emacsPrefix;
  if (!digits) return precise ? null : 1;
  clearPrefix(cm);
  return digits == "-" ? -1 : Number(digits);
}

function operateOnWord(cm, op) {
  var start = cm.getCursor(), end = cm.findPosH(start, 1, "word");
  cm.replaceRange(op(cm.getRange(start, end)), start, end);
  cm.setCursor(end);
}
// END


export default class LivelyCodeMirror extends HTMLElement {

  get mode() {
    return this.getAttribute('mode');
  }
  set mode(val) {
    return this.setAttribute('mode', val);
  }

  static get codeMirrorPath() {
     return  lively4url + "/src/external/code-mirror/"
  }

  static async loadModule(path, force) {
    return lively.loadJavaScriptThroughDOM("codemirror_"+path.replace(/[^A-Za-z]/g,""),
      this.codeMirrorPath + path, force)
  }

  static async loadCSS(path) {
    return lively.loadCSSThroughDOM("codemirror_" + path.replace(/[^A-Za-z]/g,""),
       this.codeMirrorPath + path)
  }

  static async loadModules(force) {
    console.log("loadModules", loadPromise);
    if (loadPromise && !force) return loadPromise
    loadPromise = (async () => {

      await this.loadModule("lib/codemirror.js")

      await this.loadModule("addon/fold/foldcode.js")

      await this.loadModule("mode/javascript/javascript.js")
      await this.loadModule("mode/xml/xml.js")
      await this.loadModule("mode/css/css.js")
      await this.loadModule("mode/diff/diff.js")

      await this.loadModule("mode/markdown/markdown.js")
      await this.loadModule("mode/htmlmixed/htmlmixed.js")
      await this.loadModule("addon/mode/overlay.js")
      await this.loadModule("mode/gfm/gfm.js")
      await this.loadModule("mode/stex/stex.js")
      await this.loadModule("mode/jsx/jsx.js")
      await this.loadModule("mode/python/python.js")
      await this.loadModule("mode/clike/clike.js")

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

      //await System.import("https://raw.githubusercontent.com/jshint/jshint/master/dist/jshint.js");
      //await lively.loadJavaScriptThroughDOM("jshintAjax", "https://ajax.aspnetcdn.com/ajax/jshint/r07/jshint.js");
      //await lively.loadJavaScriptThroughDOM("eslint", "http://eslint.org/js/app/eslint.js");
      await this.loadModule("addon/lint/lint.js");
      await this.loadModule("addon/lint/javascript-lint.js");
      await this.loadModule("../eslint.js");
      await this.loadModule("../eslint-lint.js", force);

      await this.loadModule("addon/merge/merge.js")
      await this.loadModule("addon/selection/mark-selection.js")
      await this.loadModule("keymap/sublime.js")
      await System.import(lively4url + '/src/components/widgets/lively-code-mirror-hint.js')
      
      this.loadCSS("addon/hint/show-hint.css")
      this.loadCSS("addon/lint/lint.css")
      lively.loadCSSThroughDOM("CodeMirrorCSS", lively4url + "/src/components/widgets/lively-code-mirror.css")
    })()
    return loadPromise
  }

  
  static async loadTernModules() {
    if (this.ternIsLoaded) return;

    await this.loadModule("addon/tern/tern.js")

    var terndir = lively4url + '/src/external/tern/'
    await lively.loadJavaScriptThroughDOM("tern_acorn", terndir + 'acorn.js')
    await lively.loadJavaScriptThroughDOM("tern_acorn_loose", terndir + 'acorn_loose.js')
    await lively.loadJavaScriptThroughDOM("tern_walk", terndir + 'walk.js')
    await lively.loadJavaScriptThroughDOM("tern_polyfill", terndir + 'polyfill.js')
    await lively.loadJavaScriptThroughDOM("tern_signal", terndir + 'signal.js')
    await lively.loadJavaScriptThroughDOM("tern_tern", terndir + 'tern.js')
    await lively.loadJavaScriptThroughDOM("tern_def", terndir + 'def.js')
    await lively.loadJavaScriptThroughDOM("tern_comment", terndir + 'comment.js')
    await lively.loadJavaScriptThroughDOM("tern_infer", terndir + 'infer.js')
    await lively.loadJavaScriptThroughDOM("tern_plugin_modules", terndir + 'modules.js')
    await lively.loadJavaScriptThroughDOM("tern_plugin_esmodules", terndir + 'es_modules.js')
    this.ternIsLoaded = true;
  }
  
  initialize() {
  	this._attrObserver = new MutationObserver(mutations => {
	    mutations.forEach(mutation => {  
        if(mutation.type == "attributes") {
          // console.log("observation", mutation.attributeName,mutation.target.getAttribute(mutation.attributeName));
          this.attributeChangedCallback(
            mutation.attributeName,
            mutation.oldValue,
            mutation.target.getAttribute(mutation.attributeName)
          )
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
    console.log("[editor] #dispatch editor-loaded")   
    this.dispatchEvent(new CustomEvent("editor-loaded"))
    this["editor-loaded"] = true // event can sometimes already be fired
  };
  
  async editorLoaded() {
    if(!this["editor-loaded"]) {
      return promisedEvent(this, "editor-loaded");
    }
  }
  
  editView(value) {
    if (!value) value = this.value || "";
    var container = this.shadowRoot.querySelector("#code-mirror-container")
    container.innerHTML = ""
    this.setEditor(CodeMirror(container, {
      value: value,
      lineNumbers: true,
      gutters: ["leftgutter", "CodeMirror-linenumbers", "rightgutter", "CodeMirror-lint-markers"],
      lint: true
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
    
    // if(Preferences.get('UseTernInCodeMirror')) {
    //   this.enableTern();
    // }
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
      // #KeyboardShortcut Ctrl-H search and replace
      "Ctrl-H": (cm) => {
        setTimeout(() => {
            editor.execCommand("replace");
            this.shadowRoot.querySelector(".CodeMirror-search-field").focus();
        }, 10)
      },
      // #KeyboardShortcut Ctrl-F search
      "Ctrl-F": (cm) => {
		    // something immediately grabs the "focus" and we close the search dialog..
        // #Hack... 
        setTimeout(() => {
            editor.execCommand("findPersistent");
            this.shadowRoot.querySelector(".CodeMirror-search-field").focus();
        }, 10)
        // editor.execCommand("find")
      },
      // #KeyboardShortcut Ctrl-Space auto complete
      "Ctrl-Space": cm => {
        this.fixHintsPosition()
        cm.execCommand("autocomplete")
      },
      // #KeyboardShortcut Ctrl-Alt-Space auto complete
      "Ctrl-Alt-Space": cm => {
        this.fixHintsPosition()
        cm.execCommand("autocomplete")
      },
      // #KeyboardShortcut Ctrl-P eval and print selelection or line
      "Ctrl-P": (cm) => {
          let text = this.getSelectionOrLine()
          this.tryBoundEval(text, true);
      },
      // #KeyboardShortcut Ctrl-I eval and inspect selection or line 
      "Ctrl-I": (cm) => {
        let text = this.getSelectionOrLine()
        this.inspectIt(text)
      },
      // #KeyboardShortcut Ctrl-I eval selection or line (do it) 
      "Ctrl-D": (cm, b, c) => {
        	let text = this.getSelectionOrLine();
          this.tryBoundEval(text, false);
        	return true
      },
      // #KeyboardShortcut Ctrl-Alt-Right multiselect next 
      "Ctrl-Alt-Right": "selectNextOccurrence", 
      // #KeyboardShortcut Ctrl-Alt-Right undo multiselect
  		"Ctrl-Alt-Left": "undoSelection", 
      
      // #KeyboardShortcut Ctrl-/ indent slelection
      "Ctrl-/": "toggleCommentIndented",
      // #KeyboardShortcut Ctrl-# indent slelection
      "Ctrl-#": "toggleCommentIndented",
      // #KeyboardShortcut Tab insert tab or soft indent 
      'Tab': (cm) => {
        if (cm.somethingSelected()) {
    			cm.indentSelection("add");
  			} else {
        	cm.execCommand('insertSoftTab')
        }
      },
      // #KeyboardShortcut Ctrl-S save content
      "Ctrl-S": (cm) => {          
        this.doSave(cm.getValue());
      },
      // #KeyboardShortcut Ctrl-Alt-V eval and open in vivide
      "Ctrl-Alt-V": async cm => {          
        let text = this.getSelectionOrLine();
        let result = await this.tryBoundEval(text, false);
        letsScript(result);
      },
      // #KeyboardShortcut Ctrl-Alt-C show type using tern      
      "Ctrl-Alt-I": cm => {
        TernCodeMirrorWrapper.showType(cm, this);
      },
      // #KeyboardShortcut Alt-. jump to definition using tern
      "Alt-.": cm => {
        lively.notify("try to JUMP TO DEFINITION")
        TernCodeMirrorWrapper.jumpToDefinition(cm, this);
      },
      // #KeyboardShortcut Alt-, jump back from definition using tern
      "Alt-,": cm => {
        TernCodeMirrorWrapper.jumpBack(cm, this);
      },
      // #KeyboardShortcut Shift-Alt-. show references using tern
      "Shift-Alt-.": cm => {
        TernCodeMirrorWrapper.showReferences(cm, this);
      },
      // #TODO
      // #KeyboardShortcut Alt-Right inverse code folding (indent)
      "Alt-Right": cm => {
        lively.warn('Inverse Code Folding not yet implemented')
      },
      // #TODO
      // #KeyboardShortcut Alt-Left inverse code folding (dedent)
      "Alt-Left": cm => {
        lively.warn('Inverse Code Folding not yet implemented')
      },      
      // #KeyboardShortcut Alt-C capitalize letter      
      // #copied from keymap/emacs.js
      "Alt-C": repeated(function(cm) {
      operateOnWord(cm, function(w) {
        var letter = w.search(/\w/);
        if (letter == -1) return w;
        return w.slice(0, letter) + w.charAt(letter).toUpperCase() + w.slice(letter + 1).toLowerCase();
      });
    }),
    });
    editor.on("cursorActivity", cm => TernCodeMirrorWrapper.updateArgHints(cm, this));
    // http://bl.ocks.org/jasongrout/5378313#fiddle.js
    editor.on("cursorActivity", cm => {
      // TernCodeMirrorWrapper.updateArgHints(cm, this);
      const widgetEnter = cm.widgetEnter;
      cm.widgetEnter = undefined;
      if (widgetEnter) {
        // check to see if movement is purely navigational, or if it
        // doing something like extending selection
        var cursorHead = cm.getCursor('head');
        var cursorAnchor = cm.getCursor('anchor');
        if (posEq(cursorHead, cursorAnchor)) {
          widgetEnter();
        }
        debugger
      }
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
      case "mode":
          this.editor.setOption('mode', newVal);
          break;
      // case "fontsize":
      //     this.editor.setFontSize( newVal );
      //     break;
      // case "softtabs":
      //     this.editor.getSession().setUseSoftTabs( newVal );
      //     break;
      // case "tern":
      //   if (newVal)
      // this.enableTern()
      //   break;
      
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
    // lazily initialize a target module name as fallback
    return this.targetModule || (this.targetModule = 'unnamed_module_' + generateUUID().replace(/-/g, '_'));
  }

  setTargetModule(module) {
    return this.targetModule = module;
  }

  async boundEval(str) {
    // console.log("bound eval " + str)
    
    // Ensure target module loaded (for .js files only)
    // TODO: duplicate with var recorder plugin
    const MODULE_MATCHER = /.js$/;
    if(MODULE_MATCHER.test(this.getTargetModule())) {
      await System.import(this.getTargetModule())
    } 
    console.log("EVAL (CM)", this.getTargetModule());
    // src, topLevelVariables, thisReference, <- finalStatement
    return boundEval(str, this.getDoitContext(), this.getTargetModule());
  }
  
  printWidget(name) {
    return this.wrapWidget(name, this.editor.getCursor(true), this.editor.getCursor(false))
  }
  
  wrapWidget(name, from, to) {
    var widget = document.createElement("span")
    widget.style.whiteSpace = "normal"
    var promise = lively.create(name, widget)
    promise.then(comp => {
      comp.style.display = "inline"
      comp.style.backgroundColor = "rgb(250,250,250)"
      comp.style.display = "inline-block"
      comp.style.minWidth = "20px"
      comp.style.minHeight = "20px"
    })
    // #TODO, we assume that it will keep the first widget, and further replacements do not work.... and get therefore thrown away
    var marker = this.editor.doc.markText(from, to, {
      replacedWith: widget
    }); 
    promise.then(comp => comp.marker = marker)
    
    return promise
  }
  
  
  async printResult(result, obj, isPromise) {
    var editor = this.editor;
    var text = result
    var isAsync = false
    this.editor.setCursor(this.editor.getCursor("end"))
    // don't replace existing selection
    this.editor.replaceSelection(result, "around")
    if (obj && obj.__asyncresult__) {
      obj = obj.__asyncresult__; // should be handled in bound-eval.js #TODO
      isAsync = true
    }
    var promisedWidget
    var objClass = (obj && obj.constructor && obj.constructor.name) || (typeof obj)
    if (isSet.call(obj)) {
      obj = Array.from(obj)
    }

    if (_.isMap(obj)) {
      var mapObj = {}
      Array.from(obj.keys()).sort().forEach(key => mapObj[key] = obj.get(key))
      obj = mapObj
    }
    if (Array.isArray(obj)) {
      if (typeof obj[0] == 'object') {
        promisedWidget = this.printWidget("lively-table").then( table => {
          table.setFromJSO(obj)      
          table.style.maxHeight = "300px"
          table.style.overflow = "auto"
          return table
        })
      } else {
        promisedWidget = this.printWidget("lively-table").then( table => {
          table.setFromJSO(obj.map((ea,index) => { return {index:index, value: ea}}))      
          table.style.maxHeight = "300px"
          table.style.overflow = "auto"
          return table
        })
      }
    } else if ((typeof obj == 'object') && (obj !== null)) {
      promisedWidget = this.printWidget("lively-inspector").then( inspector => {
        inspector.inspect(obj)
        inspector.hideWorkspace()
        return inspector
      })
    }
    if (promisedWidget) {
        var widget = await promisedWidget;
        var span = <span style="border-top:2px solid darkgray;color:darkblue">
          {isPromise ? "PROMISED" : ""} <u>:{objClass}</u> </span>
        widget.parentElement.insertBefore(span, widget)
        span.appendChild(widget)
        if (isAsync && promisedWidget) {
          if (widget) widget.style.border = "2px dashed blue"
        }
      
    } 
  }
    

  async tryBoundEval(str, printResult) {
    var resp = await this.boundEval(str);
    if (resp.isError) {
      var e = resp.value;
      console.error(e);
      if (printResult) {
        window.LastError = e;
        this.printResult("" + e);
      } else {
        lively.handleError(e);
      }
      return e;
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
      if (result && result.then && result instanceof Promise) { 
        // we will definitly return a promise on which we can wait here
        result
          .then( result => {
            this.printResult("RESOLVED: " + obj2string(result), result, true)
          })
          .catch( error => {
            console.error(error);
            // window.LastError = error;
            this.printResult("Error in Promise: \n" +error)
          })
      } else {
        this.printResult(" " + obj2string(result), result)
        if (result instanceof HTMLElement ) {
          lively.showElement(result)
        }
      }
    }
    return result
  }
  
  async inspectIt(str) {
    var result =  await this.boundEval(str);
    if (!result.isError) {
      result = result.value 
    }
    if (result.then) {
      result = await result; // wait on any promise
    }
    lively.openInspector(result, undefined, str) 
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
    let mode = this.editor.getOption("mode");
    return mode === "javascript" || mode === 'text/jsx';
  }
  
  get isMarkdown() {
    if (!this.editor) return false;
    return this.editor.getOption("mode") == "gfm";
  }
  
  get isHTML() {
    if (!this.editor) return false;
    return this.editor.getOption("mode") == "text/html";
  }
  
  
  async changeModeForFile(filename) {
    if (!this.editor) return;
    
    var mode = "text"
    // #TODO there must be some kind of automatching?
    if (filename.match(/\.html$/)) {
      mode = "text/html"
    } else if (filename.match(/\.md$/)) {
      mode = "gfm"
    } else if (filename.match(/\.tex$/)) {
      mode = "text/x-stex"
    } else if (filename.match(/\.css$/)) {
      mode = "css"
    } else if (filename.match(/\.xml$/)) {
      mode = "xml"
    } else if (filename.match(/\.json$/)) {
      mode = "javascript"
    } else if (filename.match(/\.js$/)) {
      mode = "text/jsx"
    } else if (filename.match(/\.py$/)) {
      mode = "text/x-python"
    } else if (filename.match(/\.c$/)) {
      mode = "text/x-csrc"
    } else if (filename.match(/\.cpp$/)) {
      mode = "text/x-c++src"
    } else if (filename.match(/\.h$/)) {
      mode = "text/x-c++src"
    }
    this.mode = mode
    this.editor.setOption("mode", mode)
    
    if (mode == "gfm") {
      // #TODO make language customizable
      spellCheck.startSpellCheck(this.editor, await spellCheck.current())
    }
    
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
  
  
//   async enableTern() {
//     await LivelyCodeMirror.loadTernModules()
    
//     var ecmascriptdefs = await fetch(lively4url + "/src/external/tern/ecmascript.json").then(r => r.json())
//     var browserdefs = await fetch(lively4url + "/src/external/tern/browser.json").then(r => r.json())
//     // var chaidefs = await fetch(lively4url + "/src/external/tern/chai.json").then(r => r.json())
    
//     // Options supported (all optional):
//     // * defs: An array of JSON definition data structures.
//     // * plugins: An object mapping plugin names to configuration
//     //   options.
//     // * getFile: A function(name, c) that can be used to access files in
//     //   the project that haven't been loaded yet. Simply do c(null) to
//     //   indicate that a file is not available.
//     // * fileFilter: A function(value, docName, doc) that will be applied
//     //   to documents before passing them on to Tern.
//     // * switchToDoc: A function(name, doc) that should, when providing a
//     //   multi-file view, switch the view or focus to the named file.
//     // * showError: A function(editor, message) that can be used to
//     //   override the way errors are displayed.
//     // * completionTip: Customize the content in tooltips for completions.
//     //   Is passed a single argument the completion's data as returned by
//     //   Tern and may return a string, DOM node, or null to indicate that
//     //   no tip should be shown. By default the docstring is shown.
//     // * typeTip: Like completionTip, but for the tooltips shown for type
//     //   queries.
//     // * responseFilter: A function(doc, query, request, error, data) that
//     //   will be applied to the Tern responses before treating them

//     // It is possible to run the Tern server in a web worker by specifying
//     // these additional options:
//     // * useWorker: Set to true to enable web worker mode. You'll probably
//     //   want to feature detect the actual value you use here, for example
//     //   !!window.Worker.
//     // * workerScript: The main script of the worker. Point this to
//     //   wherever you are hosting worker.js from this directory.
//     // * workerDeps: An array of paths pointing (relative to workerScript)
//     //   to the Acorn and Tern libraries and any Tern plugins you want to
//     //   load. Or, if you minified those into a single script and included
//     //   them in the workerScript, simply leave this undefined.
    
//     this.ternServer = new CodeMirror.TernServer({
//       defs: [ecmascriptdefs, browserdefs], // chaidefs  
//       plugins: {
//         es_modules: {}
//       },
//       getFile: (name, c) => {
//         lively.notify("get file " + name)
//         c(null)
//       },
//       // responseFilter: (doc, query, request, error, data) => {
//       //  return data
//       // }
      
//     });
    
//     this.editor.setOption("extraKeys", Object.assign({},
//       this.editor.getOption("extraKeys"), 
//       {
//         "Ctrl-Space": (cm) => { 
//           this.fixHintsPosition();
//           this.ternServer.complete(cm); 
//         },
//         "Ctrl-Alt-I": (cm) => { this.ternServer.showType(cm); },
//         "Ctrl-O": (cm) => { this.ternServer.showDocs(cm); },
//         "Alt-.": (cm) => { this.ternServer.jumpToDef(cm); },
//         "Alt-,": (cm) => { this.ternServer.jumpBack(cm); },
//         "Ctrl-Q": (cm) => { this.ternServer.rename(cm); },
//         "Ctrl-.": (cm) => { this.ternServer.selectName(cm); } 
//       }))
    
//     this.editor.on("cursorActivity", (cm) => { this.ternServer.updateArgHints(cm); });
//   }
  
  
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
      lineWrapping: true,
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
  
  async hideDataURLs() {
    var regEx = new RegExp("[\"\'](data:[^\"\']*)[\"\']", "g");
    do {
      var m = regEx.exec(this.value);
      if (m) {
        var from = m.index 
        var to = m.index + m[0].length 
        await this.wrapWidget("span", this.editor.posFromIndex(from), 
                              this.editor.posFromIndex(to)).then( div => {
          div.style.backgroundColor = "rgb(240,240,240)"
          
          if (m[1].match(/^data:image/)) {
            var img = document.createElement("img")
            img.src = m[1]
            img.title = m[1].slice(0,50) + "..."
            img.style.maxHeight = "100px"

            div.appendChild(document.createTextNode("\""))
            div.appendChild(img)
            div.appendChild(document.createTextNode("\""))            
          } else {
            div.innerHTML = "\""+ m[1].slice(0,50) + "..." + "\""            
          }
        })

      }
    } while (m);
  }
  
  async wrapImports() {
    // dev mode alternative to #DevLayers, a #S3Pattern: add code the scopes your dev example inline while developing
    if(this.id !== 'spike') {
      // lively.warn('skip because id is not spike')
      return;
    }
    lively.success('wrap imports in spike')
    
    const getImportDeclarationRegex = () => {
      const LiteralString = `(["][^"\\n\\r]*["]|['][^'\\n\\r]*['])`;
      const JavaScriptIdentifier = '([a-zA-Z$_][a-zA-Z0-9$_]*)'

      const ImportSpecifierPartSimple = `(${JavaScriptIdentifier})`;
      const ImportSpecifierPartRename = `(${JavaScriptIdentifier}\\s+as\\s+${JavaScriptIdentifier})`;
      const ImportSpecifierPart = `(${ImportSpecifierPartSimple}|${ImportSpecifierPartRename})`;
      // ImportSpecifier: {foo} or {foo as bar}
      const ImportSpecifier = `({\\s*((${ImportSpecifierPart}\\s*\\,\\s*)*${ImportSpecifierPart}\\,?)?\\s*})`;
      // ImportDefaultSpecifier: foo
      const ImportDefaultSpecifier = `(${JavaScriptIdentifier})`;
      // ImportNamespaceSpecifier: * as foo
      const ImportNamespaceSpecifier = `(\\*\\s*as\\s+${JavaScriptIdentifier})`;
      const anySpecifier = `(${ImportSpecifier}|${ImportDefaultSpecifier}|${ImportNamespaceSpecifier})`;
      // ImportDeclaration: import [any] from Literal
      const ImportDeclaration = `import\\s*(${anySpecifier}\\s*\\,\\s*)*${anySpecifier}\\s*from\\s*${LiteralString}\\s*\\;?`;
      
      return ImportDeclaration;
    };

    var regEx = new RegExp(getImportDeclarationRegex(), 'g');

    do {
      var m = regEx.exec(this.value);
      if (m) {
        await LivelyCodeMirrorWidgetImport.importWidgetForRange(this, m);
      }
    } while (m);
  }
  
   async wrapLinks() {
    // dev mode
    if(this !== window.that) {
      return;
    }
    var regEx = new RegExp("\<([a-zA-Z0-9]+\:\/\/[^ ]+)\>", "g");
    do {
      var m = regEx.exec(this.value);
      if (m) {
        lively.warn("wrap link: " + m[0])
        var from = m.index 
        var to = m.index + m[0].length 
        var link = m[1]
        // #TODO check for an existing widget and reuse / update it...
        await this.wrapWidget("span", this.editor.posFromIndex(from), 
                              this.editor.posFromIndex(to)).then(widget => {
          window.lastWidget = widget
          
          widget.style.backgroundColor = "rgb(120,120, 240)"
          var input = <input></input>
          input.value = m[0]  
          
          lively.warn("new input " + input)
          
          
          input.addEventListener("keydown", evt => {
            var range = widget.marker.find()
            if (evt.keyCode == 13) { // ENTER
              // #TODO how to replace // update text without replacing widgets
              this.editor.replaceRange(input.value, range.from, range.to) // @Stefan, your welcome! ;-)
              this.wrapLinks() // don't wait and do what you can now
            }
            if (evt.keyCode == 37) { // Left
              if (input.selectionStart == 0) {
                that.editor.setSelection(range.from, range.from)
                this.focus()
              }
            }
            
            if (evt.keyCode == 39) { // Right
              if (input.selectionStart == input.value.length) {
                that.editor.setSelection(range.to, range.to)
                this.focus()
              }
            }
          })
          
          widget.appendChild(input)
          // widget.appendChild(<button click={e => {
          //   lively.openBrowser(link)  // #TODO fix browse and open browser...    
          // }}>browse</button>)
        })

      }
    } while (m);
  }
  
  checkSyntax() {
    if (this.isJavaScript) {
      SyntaxChecker.checkForSyntaxErrors(this.editor);
      this.wrapImports();
      this.wrapLinks();
    }
    if (this.isMarkdown || this.isHTML) {
      this.hideDataURLs() 
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
  
  unsavedChanges() {
    if (this.editor.getValue() === "") return false
    return  true // workspaces should be treated carefully
  }

  
}

// LivelyCodeMirror.loadModules()

