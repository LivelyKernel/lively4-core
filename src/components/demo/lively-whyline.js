import Morph from 'src/components/widgets/lively-morph.js';
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import SyntaxChecker from 'src/client/syntax.js'
import boundEval from 'src/client/bound-eval.js';
import { debounce } from "utils";

import ShowPerformance from "demos/contextjs/showperformancelayer.js";

// import localsBabelPlugin from 'babel-plugin-locals'

//import lively from './../src/client/lively.js';

export default class Whyline extends Morph {

  initialize() {
    this.windowTitle = "Whyline";  
    this.get("#source").setURL(lively4url + "/src/components/demo/lively-whyline-example.js")
    this.get("#source").loadFile()

    this.sourceCodeChangedDelay = (() => {
      SyntaxChecker.checkForSyntaxErrorsCodeMirror(this.editor());
    })::debounce(500);

    this.registerButtons();
    
    this.editorComp().addEventListener("change", evt => 
      this.onSourceChange(evt));

    this.editorComp().addEventListener("editor-loaded", evt => 
      this.dispatchEvent(new CustomEvent("initialize")));
  }
  
  onGenerateTrace(evt) {
    this.runCode()
  }
  
  hideMarker(markId) {
    var marker = this.editorComp().shadowRoot.querySelector("." + markId)
    if (marker) marker.style.backgroundColor = ''
    
    var traceNode = this.get("#traceView").querySelector("#" + markId)
    if (traceNode ) {
       traceNode.classList.remove("selected")
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
  }
  
  selectCallTraceNode(node) {
    let controlFlow = node.whyWasThisStatementExecuted()
    this.selectedNode = controlFlow
    if (this.selectedNode.markId) {
      this.showMarker(this.selectedNode.markId)
    }
  }

  editorComp() {
    return this.get("#source").get("lively-code-mirror");
  }
  
  editor() {
    return this.editorComp().editor
  }
  
  onSourceChange(evt) {
    this.sourceCodeChangedDelay();
  }

  
  async runCode() {
    this.ast = null; // clear
    var src = this.editor().getValue();
    
    var traceBabelPlugin = (await System.import(lively4url + "/src/components/demo/lively-whyline-plugin.js")).default;
    
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
        sourceType: 'module',
        compact: false,
        comments: true,
        code: true,
        ast: true,
        resolveModuleSource: m=>m
      })
    } catch(err) {
      console.error(err)
    }
    
    try {
      var ctx = this.get("#canvas").getContext("2d")
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, 300, 300);
      
      var result =  (await boundEval(""+this.result.code, this.get("#canvas"))).value ; 
      console.log(result)
    } catch(err) {
    } finally {
    
    }
    if (window.__tr_last_ast__)   {
      this.ast = window.__tr_last_ast__
      this.clearCodeAnnotations()
      this.traceRoot = this.ast.calltrace

      this.markCallTree(this.traceRoot)
      this.updateTraceView(this.traceRoot)
      this.updateCodeAnnotations(this.traceRoot)
    }
  }

  updateTraceView(tree) {
    this.get("#traceView").innerHTML = ""
    this.printTraceNode(this.get("#traceView"), tree)
  }
  
  nodeToString(traceNode) {
    var astNode = traceNode.astNode
    var label = ""
    
    if (!astNode) {
      debugger;
    }
    
    switch(astNode.type) {
      case "UpdateExpression":
        label = astNode.argument.name + "=" + traceNode.value 
        break;
      case "VariableDeclarator":
        label = astNode.id.name + "=" + traceNode.value
        break
      case "ExpressionStatement":
        label = ""
        break
      case "FunctionDeclaration":
        label = ""
        break
      case "CallExpression":
        if (astNode.callee.object)
          label = astNode.callee.object.name + ".";
        if (astNode.callee.property)
          label += astNode.callee.property.name + "()"
        break
       case "ForStatement":
          label = "for{}"
        break
       case "BinaryExpression":
          label = ""
        break

      case "AssignmentExpression":
        var name = astNode.left.name
        if (!name && astNode.left.property)  
          name = astNode.left.property.name;
        label = name + "=" + traceNode.value
        break
      default:
        label = astNode.type
    }
    return label
  }

  get maxCallId() {
    return 200
  }

  printTraceNode(parentElement, call) {
    if (call.id > this.maxCallId) return
    
    var nodeElement = document.createElement("div");
    nodeElement.setAttribute("class", "traceNode")

    var label = this.nodeToString(call);

    nodeElement.innerHTML = "<div class='traceLabel'> " + label +"</div>"
    nodeElement.setAttribute("title", "" + call.astNode.type)

    nodeElement.id = call.markId
    nodeElement.addEventListener("click", (evt) => {
      this.selectCallTraceNode(call)
      evt.stopPropagation()
    })

    parentElement.appendChild(nodeElement)
    call.children.forEach( ea => {
      this.printTraceNode(nodeElement, ea)
    })
  }

  markCallTree(call) {
    var ast_node = call.astNode

    if (ast_node && ast_node.start && ast_node.end) {
      if (!call.markId) call.markId = 'tracemark' + this.lastMarkCounter++

      var editor = this.editor()
      editor.markText( 
        {line: ast_node.loc.start.line - 1, ch: ast_node.loc.start.column}, 
        {line: ast_node.loc.end.line - 1, ch: ast_node.loc.end.column}, 
        {
          isTraceMark: true,
          className: "marked " +  call.markId,
          css: "background-color: rgba(0,255,0,0.3)",
          title: ast_node.type
        })
    } 
    call.children.forEach(ea => {
      this.markCallTree(ea)
    })
  }

  clearCodeAnnotations() {
    this.lastMarkCounter = 0
    this.editor().getAllMarks()
      .filter(ea => ea.isTraceMark)
      .forEach(ea => ea.clear())
  }
  
  addCodeAnnotation(line, text, node) {
    var editor = this.editor()
    var info = editor.lineInfo(line)
    var gutterMarkers = info && info.gutterMarkers;
    var markerLine = gutterMarkers && gutterMarkers.rightgutter
    if (!markerLine) {
        var markerLine = document.createElement("div")
        markerLine.style.fontSize = "8pt"
        markerLine.style.whiteSpace = "nowrap"
        markerLine.classList.add("markerLine")  // markerLine    
        editor.setGutterMarker(line, "rightgutter", markerLine)
    }
    var resultNode = document.createElement("span");
    resultNode.classList.add("markerResult")
    resultNode.classList.add(node.markId)
    
    resultNode.textContent =  text
    
    resultNode.id = node.markId
    resultNode.addEventListener("click", (evt) => {
        this.selectCallTraceNode(node)
        evt.stopPropagation()
    })
    markerLine.appendChild(resultNode)
  }
  
  updateCodeAnnotations(node) {
    this.editor().clearGutter("rightgutter")
    var parentBounds = this.getBoundingClientRect()
    this.updateCodeAnnotation(node, parentBounds)
  }
  
  updateCodeAnnotation(node, parentBounds) {
    var ast_node = node.astNode
    if (ast_node.type == "UpdateExpression") {
      this.addCodeAnnotation(ast_node.loc.start.line - 1, 
        ast_node.argument.name + "=" + node.value + ";", node)
    }
    if (ast_node.type == "VariableDeclarator") {
      this.addCodeAnnotation(ast_node.loc.start.line - 1, 
        ast_node.id.name + "=" + node.value + ";", node)
    }
    if (ast_node.type == "AssignmentExpression") {
      var name = ast_node.left.name
      if (!name && ast_node.left.property)  
        name = ast_node.left.property.name;
      this.addCodeAnnotation(ast_node.loc.start.line - 1, 
        name   + "=" + node.value + ";", node)
    }
    node.children.forEach(ea => this.updateCodeAnnotation(ea, parentBounds))
  }

  livelyMigrate(other) {
    this.addEventListener("initialize", () => {
      this.get("#source").setURL(other.get("#source").getURL())
      this.editor().setValue(other.editor().getValue())
    })
  }
}


ShowPerformance.measure(Whyline, "runCode")
