import Morph from 'src/components/widgets/lively-morph.js';
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import SyntaxChecker from 'src/client/syntax.js'
import boundEval from 'src/client/bound-eval.js';
import { debounce } from "utils";

import ShowPerformance from "demos/contextjs/showperformancelayer.js";
import { equalIdentifiers } from 'src/components/demo/lively-whyline-tracing.js'

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
  
  /*
   * Private
   */

  editorComp() {
    return this.get("#source").get("lively-code-mirror");
  }
  
  editor() {
    return this.editorComp().editor
  }
  
  get highlightColor() {
    return '#f9cb9c' //light orange
  }
  
  /*
   * Callbacks
   */
  
  onSourceChange(evt) {
    this.sourceCodeChangedDelay();
  }
  
  onControlFlowQuestion(evt){
    let node = this.selectedNode
    let newNode = node.whyWasThisStatementExecuted()
    this.selectCallTraceNode(newNode)
  }
  
  onDataFlowQuestion(evt){
    let node = this.selectedNode
    let newNode = node.findLastDataFlow()
    this.selectCallTraceNode(newNode)
  }
  
  onGenerateTrace(evt) {
    this.runCode()
  }
  
  /*
   * Highlighting Source Code
   */
  
  markCallTree(traceNode) {
    var astNode = traceNode.astNode
    
    if (!traceNode.markId) traceNode.markId = 'tracemark' + this.lastMarkCounter++;
    //if (astNode) this.markSource(astNode, traceNode.markId);
    
    traceNode.children.forEach(ea => {
      this.markCallTree(ea)
    })
  }
  
  markSource(astNode, markId) {
    let loc = astNode.loc;
    if (loc) {
      this.editor().markText( 
        {line: loc.start.line - 1, ch: loc.start.column},
        {line: loc.end.line - 1, ch: loc.end.column},
        {
          isTraceMark: true,
          className: "marked " + markId,
          css: "background-color: rgba(0,255,0,0.3)",
          title: astNode.type
        })
    }
  }
  
  highlightNodeSource(astNode) {
    this.clearCodeMarkings();
    let loc = astNode.loc;
    if (loc) {
      this.editor().markText( 
        {line: loc.start.line - 1, ch: loc.start.column},
        {line: loc.end.line - 1, ch: loc.end.column},
        {
          isTraceMark: true,
          css: `background-color: ${this.highlightColor}`
        });
    }
  }

  clearCodeMarkings() {
    this.lastMarkCounter = 0
    this.editor().getAllMarks()
      .filter(ea => ea.isTraceMark)
      .forEach(ea => ea.clear())
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
    if (marker) marker.style.backgroundColor = this.highlightColor;

    var traceNode = this.get("#traceView").querySelector("#" + markId)
    if (traceNode ) {
      traceNode.classList.add("selected")
    }
  }
  
  /*
   * Public
   */
  
  selectCallTraceNode(traceNode) {
    console.log(traceNode)
    this.selectedNode = traceNode
    
    this.updateQuestions(traceNode);
    
    this.highlightNodeSource(traceNode.astNode);
    if (this.selectedNode.markId) {
      this.showMarker(this.selectedNode.markId)
    }
  }
  
  /*
   * Asking Questions
   */
  
  updateQuestions(traceNode) {
    let questionPane = this.get("#questionPane")
    questionPane.innerHTML = '' //Clear previous buttons

    for (let question of this.questions(traceNode)) {
      let btn = document.createElement("BUTTON");
      btn.className += " questionButton"
      let t = document.createTextNode(question[0]);
      btn.onclick = () => {
        this.selectCallTraceNode(question[1]())
      }
      btn.appendChild(t);// Append the text to <button>
      questionPane.appendChild(btn)
    }
  }
  
  questions(traceNode) {
    return [...this.controlFlowQuestions(traceNode), ...this.dataFlowQuestions(traceNode)];
  }
  
  controlFlowQuestions(traceNode) {
    if (!traceNode.parent) return [];
    return [
      ['↤', () => traceNode.predecessor],
      ['↥', () => traceNode.previousControlFlow()],
      ['↦', () => traceNode.successor]];
  }
  
  dataFlowQuestions(traceNode) {
    let referencedVars = traceNode.variablesOfInterest()
                          .sort((a, b) => {
                            return a.name.localeCompare(b.name)
                          })
                          .filter((id, i, arr) => {
                            let pred = arr[i-1]
                            return !(pred && equalIdentifiers(id, pred))
                          })
    return referencedVars.map((id) => {
      return [`Previous assignment of '${id.name}'`, () => traceNode.previousAssignmentTo(id)];
    });
  }
  
  /*
   * Trace Execution
   */
  
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
      console.log(this.result)
      var result =  (await boundEval(""+this.result.code, this.get("#canvas"))).value
    } catch(err) {
    } finally {
    
    }
    if (window.__tr_last_ast__)   {
      this.ast = window.__tr_last_ast__
      this.clearCodeMarkings()
      this.traceRoot = this.ast.calltrace

      this.markCallTree(this.traceRoot)
      this.updateTraceView(this.traceRoot)
      this.updateCodeAnnotations(this.traceRoot)
    }
  }
  
  /*
   * Trace View
   */

  updateTraceView(tree) {
    this.get("#traceView").innerHTML = ""
    this.printTraceNode(this.get("#traceView"), tree)
  }
  
  get maxCallId() {
    return 200
  }

  printTraceNode(parentElement, traceNode) {
    if (traceNode.id > this.maxCallId) return

    var nodeElement = document.createElement("div");
    nodeElement.setAttribute("class", "traceNode")

    let label = traceNode.labelString();

    nodeElement.innerHTML = "<div class='traceLabel'> " + label +"</div>"
    nodeElement.setAttribute("title", "" + traceNode.astNode.type)

    nodeElement.id = traceNode.markId
    nodeElement.addEventListener("click", (evt) => {
      this.selectCallTraceNode(traceNode)
      evt.stopPropagation()
    })

    parentElement.appendChild(nodeElement)
    traceNode.children.forEach( ea => {
      this.printTraceNode(nodeElement, ea)
    })
  }
  
  /*
   * Gutters
   * (these things in the code pane on the right showing assignments)
   */

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
  
  /*
   * Lively
   */

  livelyMigrate(other) {
    this.addEventListener("initialize", () => {
      this.get("#source").setURL(other.get("#source").getURL())
      this.editor().setValue(other.editor().getValue())
    })
  }
}


ShowPerformance.measure(Whyline, "runCode")
