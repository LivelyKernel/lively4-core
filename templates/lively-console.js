import Morph from "./Morph.js"

import * as cop from "src/external/ContextJS/src/contextjs.js"


export default class Console extends Morph {

  initialize() {
    this.windowTitle = "Console"

    
    // lineNumbers: true,
    //   gutters: ["rightgutter", "CodeMirror-linenumbers", "rightgutter"],
    //   mode: {name: "javascript", globalVars: true},
    // });  
    
    lively.html.registerButtons(this)
    
    this.addEventListener("focus", evt => this.onFocus(evt))
    this.setAttribute('tabindex', 0)
    this.get("#console").addEventListener("editor-loaded", () => this.onEditorLoaded())
    this.get("#commandline").addEventListener("editor-loaded", () => this.onCommandLineLoaded())
    
    
    
    this.get("#console").setCustomStyle(`.CodeMirror pre { 
      border-bottom: 1px solid lightgrey;
      padding: 2px
    }
     
    .leftgutter {
      width: 15px;
      background-color: white;
    }
    .rightgutter {
      width: 300px;
    }
    
    `)
    
  }

  onEditorLoaded() {
    var editor = this.get('#console').editor
    editor.setValue("")

    editor.setOption("lineNumbers", false);
    editor.setOption("readOnly",  true);
    editor.setOption("gutters",  ["leftgutter"]);
  
  }
   
  onFocus() {
    this.get("#commandline").editor && this.get("#commandline").editor.focus()
  } 
  
  onCommandLineLoaded() {
    var commandLine = this.getSubmorph('#commandline');
    var editor = commandLine.editor
    editor.setValue("")

    editor.setOption("lineNumbers", false);
    editor.setOption("gutters",  []);
    editor.setOption("extraKeys", {
      "Enter": async (cm) => {
          let text = editor.getValue()
          this.logWithLeftAndRight([text], "> ")
          let result = await commandLine.tryBoundEval(text, false);
          this.logWithLeftAndRight([result], "<⋅")
      },
    })

    editor.on("beforeChange", function(instance, change) {
        var newtext = change.text.join("").replace(/\n/g, ""); // remove ALL \n !
        change.update(change.from, change.to, [newtext]);
        return true;
    });


    this.getSubmorph('#commandline').editor

    this.getSubmorph('#commandline').setCustomStyle(`
    .CodeMirror-hscrollbar {
      display: none 
    }

    .CodeMirror-scroll {
      overflow: hidden  
    }
    `)
    
    this.dispatchEvent(new CustomEvent("console-loaded"));
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
    
  log() {
    this.logWithLeftAndRight(lively.array(arguments), null, this.calledFrom(4))
  }

  logWithLeftAndRight(args, left, right ) {
    var c = this.getSubmorph('#console')
    var editor  = c.editor
    if (!editor) return
    var doc = editor.getDoc();

    var s = args.join(" ")

    editor.execCommand("goDocEnd")
    editor.replaceSelection(s);
    
    if (right) {
      editor.replaceSelection(" ")
      var from = editor.getCursor()
      editor.replaceSelection(right);
      var to = editor.getCursor()
      
      var annotation = document.createElement("a")
      annotation.style.display = "inline-block"
      annotation.textContent = "" + right
      annotation.setAttribute("href", "" + right)
      annotation.addEventListener("click", (evt) => {
        evt.preventDefault()
        lively.notify("clicked marker " + right )
        return true
      }, true) 


      var marker = editor.markText( 
        from, to,
        {
          className: "loglink",
          replacedWith: annotation,
          handleMouseEvents: false
        })
      
    }
    editor.replaceSelection("\n")

    if (left) {
      var leftAnnotation = document.createElement("div")
      leftAnnotation.style.fontSize = "8pt"
      leftAnnotation.style.whiteSpace = "nowrap"
      leftAnnotation.innerHTML = "<b>" + left +"<b>"
      
      leftAnnotation.style.color = "gray";
      leftAnnotation.style.marginTop = "2px"

      leftAnnotation.style.marginLeft = "2px"
      leftAnnotation.classList.add("errorMark")
        
      editor.setGutterMarker(editor.getCursor().line - 1, "leftgutter", leftAnnotation);
    }


      
    
      
    // session.insert({
    //     row: session.getLength(),
    //     column: 0
    //   }, "\n" + this.currentStack())
    
    // this.getSubmorph('#console').editor.scrollToRow(1000000000000)
  }

   
  calledFrom(offset) {
    try {
      throw new Error("XYZError")
    } catch(e) {
      return e.stack.split("\n")
        .filter(ea => !ea.match("src/external/ContextJS/src/Layers.js") )
        .filter(ea => !ea.match("XYZError") )
        .filter(ea => !ea.match("currentStack"))
        .slice(offset,offset + 1)
        // .map(ea => ea.replace(/\(.*?\)/,""))
        .join("")
        .replace(/.*\(/,"")
        .replace(/\).*/,"")

    }
  }
  
  livelyMigrate(other) {
    this.addEventListener("console-loaded", () => {
      this.get("#console").editor.setValue(other.get("#console").editor.getValue())
      this.get("#commandline").editor.setValue(other.get("#commandline").editor.getValue())
    })
  }
}

cop.layer(window, "ConsoleLayer").refineObject(console, {
  log() {
    var consoles = document.body.querySelectorAll("lively-console")
    try {
      consoles.forEach(ea => ea.log.apply(ea, arguments))
    } finally {    
      return cop.proceed.apply(this, arguments)
    }
  }
})

ConsoleLayer.beGlobal()

console.log("hi")



