import Morph from './Morph.js';
import {babel} from 'systemjs-babel-build';
import SyntaxChecker from 'src/client/syntax.js'
import traceBabelPlugin from "./lively-continuous-editor-plugin.js"

// import localsBabelPlugin from 'babel-plugin-locals'

//import lively from './../src/client/lively.js';

export default class ContinuousEditor extends Morph {

  initialize() {
    this.windowTitle = "Continuous Editor";  // #TODO why does it not work?
    this.get("#source").setURL("https://lively-kernel.org/lively4/lively4-jens/demos/hello.js")
    this.get("#source").loadFile()

    lively.html.registerButtons(this);

    this.get("#traceInspector").hideWorkspace()

    this.get("#traceInspector").addEventListener("select-object", 
      evt => this.selectCallTraceNode(evt.detail.object))

    this.editorComp().doSave = () => {
      this.get("#source").saveFile();
      this.runCode();      
    };
    
    this.editorComp().addEventListener("change", evt => 
      SyntaxChecker.checkForSyntaxErrors(this.editor()));

    this.editorComp().addEventListener("change", evt => 
      this.onSourceChange(evt));

    this.dispatchEvent(new CustomEvent("initialize"));
  }
  
  hideMarker(markId) {
    var marker = this.editorComp().shadowRoot.querySelector("." + markId)
    if (marker) marker.style.backgroundColor = ''
    
    var traceNode = this.get("#traceView").querySelector("#" + markId)
    if (traceNode ) {
       traceNode.classList.remove("selected")
    }
    
    var resultNode = this.get("#markerLayer").querySelector("#" + markId)
    if (resultNode ) {
       resultNode.classList.remove("selected")
    }
  }
  
  showMarker(markId) {
    if (this.lastMarkId) {
      this.hideMarker(this.lastMarkId)
    }
    this.lastMarkId = markId
    var marker = this.editorComp().shadowRoot.querySelector("." + markId)
    if (marker) marker.style.backgroundColor = 'rgba(0,0,255,0.5)'

    var traceNode = this.get("#traceView").querySelector("#" + markId)
    if (traceNode ) {
       traceNode.classList.add("selected")
    }
    
    var resultNode = this.get("#markerLayer").querySelector("#" + markId)
    if (resultNode ) {
       resultNode.classList.add("selected")
    }
  }
  
  selectCallTraceNode(node) {
    this.selectedNode = node
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
  
  onSourceChange(evt) {
    this.runCode()
  }
  
  async runCode() {
    this.ast = null; // clear
    this.get("#log").innerHTML = ""
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
      this.get("#log").innerHTML = "" + err
    }
    
    try {
      // lively.notify("output: " + this.result.code)
      var result =  eval('' +this.result.code);
      // this.get("#result").textContent += "-> " + result;       
    } catch(err) {
        
      // this.get("#source").currentEditor().getSession().setAnnotations(err.stack.split('\n')
      //   .filter(line => line.match('runCode???'))
      //   .map(line => {
      //     let [row, column] = line
      //       .replace(/.*<.*>:/, '')
      //       .replace(/\)/, '')
      //       .split(':')
      //     return {
      //       row: parseInt(row) - 1, column: parseInt(column), text: err.message, type: "error"
      //     }
      //   }));
      this.get("#log").textContent = "" + err
    } finally {
    
    }
    if (window.__tr_last_ast__)   {
      this.ast = window.__tr_last_ast__
      this.clearMarkers()
      this.traceRoot = this.ast.calltrace
      this.get("#traceInspector").inspect(this.ast)

      this.markCallTree(this.traceRoot)
      this.updateTraceView(this.traceRoot)
      
      setTimeout(() => this.updateMarkerResults(this.traceRoot),0 )
    }
  }

  updateTraceView(tree) {
    this.get("#traceView").innerHTML = ""
    this.printTraceNode(this.get("#traceView"), tree)
  }

  astNode(id) {
    return this.ast.node_map[id] 
  }

  printTraceNode(parent, call) {
    var astnode = this.astNode(call.id) 

    var node = document.createElement("div");
    node.setAttribute("class", "traceNode")
    
    var label = "";
    
    
    if (astnode.id) {
      label += astnode.id.name
    } else {
      if (astnode)
        label += astnode.type;
    }
    
    if (call.value !== undefined)
      label += "="  + call.value;
    
    node.innerHTML = "<div class='traceLabel'> " + label +"</div>"
    
    
    node.id = call.markId
    node.addEventListener("click", (evt) => {
      this.selectCallTraceNode(call)
      evt.stopPropagation()
    })

    parent.appendChild(node)
    call.children.forEach( ea => {
      this.printTraceNode(node, ea)
    })
  }


  clearMarkers() {
    this.lastMarkCounter = 0
    var editor = this.editor();
    var markers = editor.getSession().getMarkers();
    for(var i in markers) {
        if (markers[i].clazz.match("marked_invisible")) {
            editor.getSession().removeMarker(i);
        }
    }
  }

  markCallTree(call) {
    var Range = ace.require('ace/range').Range;
    var ast_node = this.astNode(call.id)

    if (ast_node && ast_node.start && ast_node.end) {
      if (!call.markId) call.markId = 'tracemark' + this.lastMarkCounter++

      var editor = this.editor()
      var doc = editor.getSession().getDocument()
      editor.session.addMarker(Range.fromPoints(
        doc.indexToPosition(ast_node.start),
        doc.indexToPosition(ast_node.end)), "marked marked_invisible " +  call.markId, "text", false); 
    }
    call.children.forEach(ea => {
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
      var ast_node = this.astNode(node.id)
    
      var marker = this.editorComp().shadowRoot.querySelector("." + node.markId)
      if (marker) {
        var bounds = marker.getBoundingClientRect();
        var markerLine = this.markerLines[bounds.top]
        if (!markerLine) {
          var markerLine = document.createElement("div");
          markerLine.classList.add("markerLine")  // markerLine    

          markerLine.classList.add("marker") 

          markerLine.style.position = "absolute";

          markerLine.style.top  = (bounds.top - parentBounds.top) + "px";
          this.markerLines[bounds.top] = markerLine;
          markerLayer.appendChild(markerLine);
        }
        var resultNode = document.createElement("span");
        resultNode.classList.add("markerResult")
        resultNode.classList.add(node.markId)

        // node.code + " = " +
        resultNode.innerHTML =  ast_node.type +":" + node.value ;
        resultNode.id = node.markId
        resultNode.addEventListener("click", (evt) => {
            this.selectCallTraceNode(node)
            evt.stopPropagation()
        })
      

        markerLine.appendChild(resultNode)
        // markerLine.insertBefore(resultNode, markerLine.childNodes[0]);
      }
    }    
    node.children.forEach(ea => this.updateMarkerResultsEach(markerLayer, ea, parentBounds))
  }

  livelyMigrate(other) {
    this.addEventListener("initialize", () => {
      this.get("#source").setURL(other.get("#source").getURL())
      this.editor().setValue(other.editor().getValue())
      this.editor().selection.setRange(other.editor().selection.getRange())
      var viewState = other.get("#traceInspector").getViewState()
      
      this.runCode()
      
      this.get("#traceInspector").setViewState(viewState)
    })
  }
  
}
