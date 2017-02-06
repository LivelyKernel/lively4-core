import Morph from './Morph.js';
import {babel} from 'systemjs-babel-build';
import SyntaxChecker from 'src/client/syntax.js'
import traceBabelPlugin from "./lively-continuous-editor-plugin.js"

//import lively from './../src/client/lively.js';

export default class ContinuousEditor extends Morph {

  initialize() {
    this.windowTitle = "Continuous Editor";  // #TODO why does it not work?
    this.get("#source").setURL("https://lively-kernel.org/lively4/lively4-jens/demos/hello.js")
    this.get("#source").loadFile()

    lively.html.registerButtons(this);

    this.get("#traceInspector").hideWorkspace()

    this.get("#traceInspector").addEventListener("select-object", 
      evt => this.selectCallTraceNode(evt))

    this.editorComp().doSave = () => {
      this.get("#source").saveFile();
      this.runCode();      
    };
    
    this.editorComp().addEventListener("change", evt => 
      SyntaxChecker.checkForSyntaxErrors(this.editor()));

    // this.get("#source").get("juicy-ace-editor").editor.session.selection.on("changeSelection", (evt) => {
    //   this.onSourceSelectionChanged(evt)
    // });
    
    // this.get("#source").get("juicy-ace-editor").editor.session.selection.on("changeCursor", (evt) => {
    //   this.onSourceSelectionChanged(evt)
    // });


    // this.get("#plugin").currentEditor()
  //   [this.get("#source").get("juicy-ace-editor")].forEach(ea => ea.editor.session.setOptions({
		// 	mode: "ace/mode/javascript",
  //   	tabSize: 2,
  //   	useSoftTabs: true
		// }));
		
    this.dispatchEvent(new CustomEvent("initialize"));
  }
  
  hideMarker(markId) {
    var marker = this.editorComp().shadowRoot.querySelector("." + markId)
    if (marker) marker.style.backgroundColor = ''
  }
  
  showMarker(markId) {
    if (this.lastMarkId) {
      this.hideMarker(this.lastMarkId)
    }
    this.lastMarkId = markId
    var marker = this.editorComp().shadowRoot.querySelector("." + markId)
    if (marker) marker.style.backgroundColor = 'blue'
  }
  
  selectCallTraceNode(evt) {
    var node = evt.detail.object;
    if (node.markId) {
      this.showMarker(node.markId)
    }
  }
  
  editorComp() {
    return this.get("#source").get("juicy-ace-editor");
  }
  
  editor() {
    return this.editorComp().editor
  }
  
  async runCode() {
    var src = this.editor().getValue();
  
    // this.get("#astInspector").inspect(this.ast)
    try {
      var src = this.editor().getValue();
      this.result = babel.transform(src, {
        babelrc: false,
        plugins: [traceBabelPlugin],
        presets: [],
        filename: undefined,
        sourceFileName: undefined,
        moduleIds: false,
        sourceMaps: false,
        compact: false,
        comments: true,
        code: true,
        ast: true,
        resolveModuleSource: undefined
      })
    } catch(err) {
      console.error(err);
      lively.notify(err.name, err.message, 5, ()=>{}, 'red');
      return;
    }
    
    try {
      // lively.notify("output: " + this.result.code)
      var result =  eval('' +this.result.code);
      // this.get("#result").textContent += "-> " + result;       
    } catch(e) {
        
      this.get("#source").currentEditor().getSession().setAnnotations(err.stack.split('\n')
        .filter(line => line.match('runCode???'))
        .map(line => {
          let [row, column] = line
            .replace(/.*<.*>:/, '')
            .replace(/\)/, '')
            .split(':')
          return {
            row: parseInt(row) - 1, column: parseInt(column), text: err.message, type: "error"
          }
        }));
      throw e
      // this.get("#result").textContent = "Error: " + e
    } finally {
    
    }
    if (window.__tr__root__)   {
      this.get("#traceInspector").inspect(window.__tr__root__)
      this.clearMarkers()
      this.traceRoot = window.__tr__root__
      this.markCallTree(this.traceRoot)
      this.updateTraceView(this.traceRoot)
      
      setTimeout(() => this.updateMarkerResults(this.traceRoot),0 )
    }
  }

  updateTraceView(tree) {
    this.get("#traceView").innerHTML = ""
    this.printTraceNode(this.get("#traceView"), tree)
  }

  printTraceNode(parent, tree) {
    var node = document.createElement("div");
    node.setAttribute("class", "traceNode")
    node.innerHTML = "<div class='traceLabel'> " + tree.code +" -> "  + tree.value + "</div>"
    node.addEventListener("click", (evt) => {
      if (tree.markId) {
        this.showMarker(tree.markId)
      }
      evt.stopPropagation()
    })

    parent.appendChild(node)
    tree.children.forEach( ea => {
      this.printTraceNode(node, ea)
    })
  }


  clearMarkers() {
    this.lastMarkCounter = 0
    var editor = this.editor();
    var markers = editor.getSession().getMarkers();
    for(var i in markers) {
        if (markers[i].clazz == "marked") {
            editor.getSession().removeMarker(i);
        }
    }
  }

  markCallTree(node) {
    var Range = ace.require('ace/range').Range;
    if (node.start && node.end) {
    if (!node.markId) node.markId = 'tracemark' + this.lastMarkCounter++

      var editor = this.editor()
      var doc = editor.getSession().getDocument()
      editor.session.addMarker(Range.fromPoints(
        doc.indexToPosition(node.start),
        doc.indexToPosition(node.end)), "marked " +  node.markId, "text", false); 
    }
    node.children.forEach(ea => {
      this.markCallTree(ea)
    })
  }

  updateMarkerResults(node) {
    // this.updateMarkerResults(this.traceRoot)
    this.get('#markerLayer').innerHTML = ""
    this.markerLines = {};

    var parentBounds = this.getBoundingClientRect()
    this.updateMarkerResultsEach(this.get('#markerLayer'), node, parentBounds)
  }
  
  updateMarkerResultsEach(markerLayer, node, parentBounds) {
    if (node.markId) {
      var marker = this.editorComp().shadowRoot.querySelector("." + node.markId)
      if (marker) {
        var bounds = marker.getBoundingClientRect();
        var markerLine = this.markerLines[bounds.top]
        if (!markerLine) {
          var markerLine = document.createElement("div");
          markerLine.style.position = "absolute";
          markerLine.style.top  = (bounds.top - parentBounds.top) + "px";
          this.markerLines[bounds.top] = markerLine;
          markerLayer.appendChild(markerLine);
        }
        var resultNode = document.createElement("div");
        resultNode.style.float = "left"
        resultNode.style.margin = "2px"
        resultNode.style.paddingLeft = "1px"
        resultNode.style.paddingRight = "1px"

        resultNode.style.border = "solid 1px gray"
        resultNode.innerHTML =  node.code + " = " + node.value ;
        markerLine.insertBefore(resultNode, markerLine.childNodes[0]);
      }
    }    
    node.children.forEach(ea => this.updateMarkerResultsEach(markerLayer, ea, parentBounds))
  }

  livelyMigrate(other) {
    this.addEventListener("initialize", () => {
      this.get("#source").setURL(other.get("#source").getURL())
      this.editor().setValue(other.editor().getValue())
      this.editor().selection.setRange(other.editor().selection.getRange())
      this.runCode()
    })
  }
  
}
