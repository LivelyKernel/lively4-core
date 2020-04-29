import Morph from "src/components/widgets/lively-morph.js"
import * as cop from "src/client/ContextJS/src/contextjs.js"
import Files from "src/client/files.js"

export default class Console extends Morph {

  initialize() {
    this.windowTitle = "Console"

    // lineNumbers: true,
    //   gutters: ["rightgutter", "CodeMirror-linenumbers", "rightgutter"],
    //   mode: {name: "javascript", globalVars: true},
    // });

    this.registerButtons();

    this.addEventListener("focus", evt => this.onFocus(evt))
    this.setAttribute('tabindex', 0)
    this.get("#console").addEventListener("editor-loaded", () => this.onEditorLoaded())
    this.get("#commandline").addEventListener("editor-loaded", () => this.onCommandLineLoaded())

    this.get("#console").setCustomStyle(`
      .CodeMirror pre { 
        border-bottom: 1px solid lightgrey;
        padding: 2px;
        padding-left: 20px
      }

      .leftgutter {
        width: 0px;
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
    editor.setOption("lineWrapping", true)
    editor.setOption("readOnly",  true);
    editor.setOption("gutters",  ["leftgutter"]);
    editor.setOption("mode",  null);


  }

  onFocus() {
    this.get("#commandline").editor && this.get("#commandline").editor.focus()
  }

  onCommandLineLoaded() {
    var commandLine = this.getSubmorph('#commandline');
    var editor = commandLine.editor
    editor.setValue("")

    editor.setOption("lineNumbers", false);
    editor.setOption("lineWrapping", true);

    editor.setOption("gutters",  []);
    editor.setOption("extraKeys", {
      "Enter": async (cm) => {
          let text = editor.getValue()
          this.logWithLeftAndRight([text], "> ")
          let result = await commandLine.tryBoundEval(text, false);
          this.logWithLeftAndRight([result], "< ")
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

  printError(editor, err) {
    let from = editor.getCursor()
    // editor.replaceSelection("" + err.stack);
    editor.replaceSelection("XXX");
    let to = editor.getCursor()

    let widget = document.createElement("lively-error")

    lively.components.openIn(document.body, widget).then( comp => {
      widget.stack =  err.stack
    })
    widget.remove()
    editor.markText(from, to, {
      replacedWith: widget,
      handleMouseEvents: false,
      atomic: true
    })
  }


  log() {
    var args = Array.from(arguments)

    if (this.lastLog && (this.lastLog.join("") == args.join(""))) {
      this.lastLogCounter++
      // this.logWithLeftAndRight(args, "" + this.lastLogCounter, this.calledFrom(4))
      this.setLeftAnnotation("" +this.lastLogCounter)
    } else {
      this.logWithLeftAndRight(args, null, this.calledFrom(4))
      this.lastLogCounter=1
    }
    this.lastLog = args

  }

  get editor() {
    var c = this.getSubmorph('#console')
    return c.editor
  }

  logWithLeftAndRight(args, left, right ) {
    var editor = this.editor
    if (!editor) return
    var doc = editor.getDoc();

    editor.execCommand("goDocEnd")
    if (editor.getValue().length  > 0)
      editor.replaceSelection("\n")

    args.forEach(ea => {
      if (ea && ea.stack && ea.message) {
        this.printError(editor, ea)
      } else {
        var s = "" + ea
        s.split("\n").forEach((line, index, lines) => {
          editor.replaceSelection(line);
          if (index < lines.length - 1) {
            var from = editor.getCursor()
            editor.replaceSelection("\n")
            var widget = document.createElement("span")
            widget.innerHTML ="<br>"
            editor.markText(from,editor.getCursor(),
            {
              replacedWith: widget,
              handleMouseEvents: false,
              atomic: true
            })
          }
        })
        editor.replaceSelection(" ")
      }
    })

    if (right) {
      this.setRightAnnotation(right)
    }

    if (left) {
      this.setLeftAnnotation(left)
    }
    // session.insert({
    //     row: session.getLength(),
    //     column: 0
    //   }, "\n" + this.currentStack())

    // this.getSubmorph('#console').editor.scrollToRow(1000000000000)
  }

  setLeftAnnotation(left) {
    var editor = this.editor
    var leftAnnotation = document.createElement("div")
    leftAnnotation.style.fontSize = "8pt"
    leftAnnotation.style.whiteSpace = "nowrap"
    leftAnnotation.innerHTML = "<b>" + left +"<b>"

    leftAnnotation.style.color = "gray";
    leftAnnotation.style.marginTop = "2px"

    leftAnnotation.style.marginLeft = "2px"
    leftAnnotation.classList.add("errorMark")

    editor.setGutterMarker(editor.getCursor().line , "leftgutter", leftAnnotation);
  }

  setRightAnnotation(right) {
      var editor = this.editor
      editor.replaceSelection(" ")
      var from = editor.getCursor()
      editor.replaceSelection(right);
      var to = editor.getCursor()

      var annotation = document.createElement("a")
      annotation.style.display = "inline-block"
      // annotation.style.position = "relative"
      annotation.style.color = "grey"

      annotation.textContent = "" + right

      // annotation.style.position = "relative"
      annotation.style.right = "0px"
      // annotation.style.clear = "both"
      annotation.style.float = "right"

      var ref =  Files.parseSourceReference(right)
      if (ref) {
        annotation.textContent = "" + ref
      }
      var url = (ref && ref.url) || right

      annotation.setAttribute("href", "" + right)
      annotation.addEventListener("click", (evt) => {
        evt.preventDefault()
        lively.openBrowser(url, true, ref)
        return true
      }, true)


      var marker = editor.markText(
        from, to,
        {
          className: "loglink",
          replacedWith: annotation,
          handleMouseEvents: false
        })

      // annotation.style.left = (c.getBoundingClientRect().right - annotation.getBoundingClientRect().right - 20) + "px"
  }

  calledFrom(offset) {
    try {
      throw new Error("XYZError")
    } catch(e) {
      // return e.stack
      /// console.log("DEBUG " + e.stack)
      return e.stack.split("\n")
        .filter(ea => !ea.match("src/client/ContextJS/src/Layers.js") )
        .filter(ea => !ea.match("XYZError") )
        .filter(ea => !ea.match("currentStack"))
        .filter(ea => !ea.match("notify"))


        .slice(offset,offset + 1)
        // .map(ea => ea.replace(/\(.*?\)/,""))
        .join("")
        .replace(/.*\(/,"")
        .replace(/\).*/,"")

    }
  }

  livelyMigrate(other) {
    this.addEventListener("console-loaded", () => {

      other.get("#console").editor.getValue().split("\n").forEach( line => {
        var m = line.match(/^(.*)(https?:\/\/.*[0-9]+:[0-9]+$)/)
        if (m) {
          this.logWithLeftAndRight([m[1]], null, m[2])
        } else {
          this.logWithLeftAndRight([line])
        }
      })

      this.get("#commandline").editor.setValue(other.get("#commandline").editor.getValue())
    })
  }
}

cop.layer(window, "ConsoleLayer").refineObject(console, {
  log() {
    var consoles = document.body.querySelectorAll("lively-console")
    try {
      var args = arguments
      // #TODO chrome cuts off stack ath a given level so the information is lost
      // if we increase it further with "withoutLayers"
      // cop.withoutLayers([ConsoleLayer], () => {
      try {
        consoles.forEach(ea => ea.log.apply(ea, args))
      } catch(e) {
        cop.withoutLayers([ConsoleLayer], () => {
          console.log(e)
        })
      }
      // })
    } finally {
      return cop.proceed.apply(this, arguments)
    }
  }
})

ConsoleLayer.beGlobal()




