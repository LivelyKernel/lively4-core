import Morph from "./Morph.js"

import * as cop from "src/external/ContextJS/src/contextjs.js"


export default class Console extends Morph {

  initialize() {
    this.windowTitle = "Console"

    
    // lineNumbers: true,
    //   gutters: ["leftgutter", "CodeMirror-linenumbers", "rightgutter"],
    //   mode: {name: "javascript", globalVars: true},
    // });  
    
    this.setupCommandLine()
    lively.html.registerButtons(this)
    
    this.addEventListener("focus", evt => this.onFocus(evt))
    this.setAttribute('tabindex', 0)
    this.get("#console").addEventListener("editor-loaded", () => this.onEditorLoaded())
  }

  onEditorLoaded() {
    var editor = this.get('#console').editor
    editor.setOption("lineNumbers", false);
    editor.setOption("readOnly",  true);
    editor.setOption("gutters",  []);
  }
   
  onFocus() {
    lively.notify("onfocus")
    this.get("#commandline").editor.focus()
  } 
  
  setupCommandLine() {
     var editor = this.getSubmorph('#commandline').editor

    
    // from: http://stackoverflow.com/questions/32315244/single-line-ace-editor
    this.get('#commandline').editor.setOptions({
        maxLines: 1, // make it 1 line
        autoScrollEditorIntoView: true,
        highlightActiveLine: false,
        printMargin: false,
        showGutter: false,
        /* mode: "ace/mode/javascript", */
        /* theme: "ace/theme/tomorrow_night_eighties" */
    });

    // remove newlines in pasted text
    editor.on("paste", function(e) {
        e.text = e.text.replace(/[\r\n]+/g, " ");
    });
    // make mouse position clipping nicer
    editor.renderer.screenToTextCoordinates = function(x, y) {
        var pos = this.pixelToScreenCoordinates(x, y);
        return this.session.screenToDocumentPosition(
            Math.min(this.session.getScreenLength() - 1, Math.max(pos.row, 0)),
            Math.max(pos.column, 0)
        );
    };
    // disable Enter Shift-Enter keys
    editor.commands.bindKey("Enter|Shift-Enter", "null")
    this.get('#commandline').addEventListener("keyup", evt => this.onCommandLineKeyUp(evt))
    
    
    this.get('#commandline').focus()
    
  }
  
  onCommandLineKeyUp(evt) {
    if(evt.keyCode == 13) { this.evalInput() }
  }

  onClear() {
    this.getSubmorph('#console').editor.setValue("")
  }
    
  evalInput() {
    var src = this.getSubmorph('#commandline').editor.getValue()
    try { var result = eval(src) } catch(e) { result = "ERROR:" + e }
    this.log("" + src)
    this.log("// " + result)
  }
    
  log(/* varargs */) {
    var c = this.getSubmorph('#console')
    var editor  = c.editor
    if (!editor) return
    var doc = editor.getDoc();

    Array.prototype.forEach.call(arguments, function(s) {
      if (s.message) s = s.message
      if (s.stack) s += s.stack

      editor.execCommand("goDocEnd")
      editor.replaceSelection("\n" + s);
    })
    
    // session.insert({
    //     row: session.getLength(),
    //     column: 0
    //   }, "\n" + this.currentStack())
    
    
    // this.getSubmorph('#console').editor.scrollToRow(1000000000000)
  }
   
  currentStack() {
    try {
      throw new Error("XYZError")
    } catch(e) {
      return e.stack.split("\n")
        .filter(ea => !ea.match("src/external/ContextJS/src/Layers.js") )
        .filter(ea => !ea.match("XYZError") )
        .filter(ea => !ea.match("currentStack"))
        .slice(3,4)
        // .map(ea => ea.replace(/\(.*?\)/,""))
        .join("\n")
    }
  }
  
}

cop.layer(window, "ConsoleLayer").refineObject(console, {
  log() {
    var consoles = document.body.querySelectorAll("lively-console")
    try {
      consoles.forEach(ea => ea.log.apply(ea, arguments))
    } finally {    
      return cop.proceed.apply(this.arguments)
    }
  }
})

ConsoleLayer.beGlobal()

console.log("hi")



