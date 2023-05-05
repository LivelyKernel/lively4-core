/*MD # Whyline

ComponentBin: #Tool #Debugging

Authors: @stlutz, Martin Stamm, @onsetsu

![](lively-whyline.png){width=400px}

MD*/



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
  
  onPreviousOccurrence(evt){
    let node = this.selectedNode
    this.selectCallTraceNode(node.previousOccurrence)
  }
  
  onPredecessor(evt){
    let node = this.selectedNode
    this.selectCallTraceNode(node.predecessor)
  }
  
  onPreviousControlFlow(evt){
    let node = this.selectedNode
    this.selectCallTraceNode(node.previousControlFlow())
  }
  
    
  onSuccessor(evt){
    let node = this.selectedNode
    this.selectCallTraceNode(node.successor)
  }
  
  onNextOccurrence(evt){
    let node = this.selectedNode
    this.selectCallTraceNode(node.nextOccurrence)
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
    
  
    this.get('#previousOccurrence').disabled = !this.selectedNode.previousOccurrence
    
    this.get('#predecessor').disabled = !this.selectedNode.predecessor
    
    this.get('#previousControlFlow').disabled = !this.selectedNode.parent
    
    this.get('#successor').disabled = !this.selectedNode.successor
    
    this.get('#nextOccurrence').disabled = !this.selectedNode.nextOccurrence
      
  }
  
  /*
   * Asking Questions
   */
  
  updateQuestions(traceNode) {
    let questionPane = this.get("#questionPane")
    questionPane.innerHTML = '' //Clear previous buttons

    traceNode.variablesOfInterest().forEach((variable) => {
      questionPane.appendChild(this.variableQuestionsDiv(variable));
    })
  }
  
  questions(traceNode) {
    return this.dataFlowQuestions(traceNode);
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
  
  variableQuestionsDiv(variable) {
    const varDiv = document.createElement("DIV");
    varDiv.style["display"] = "grid";
    varDiv.style["border-style"] = "outset";
    varDiv.style["margin"] = "1px";
    const label = document.createElement("DIV");
    label.appendChild(document.createTextNode(variable.name));
    label.style["grid-column"] = "1 / 3";
    varDiv.appendChild(label);
    
    this.variableQuestions(variable).forEach((question, i) => {
      const column = (i % 2) + 1;
      const row = Math.floor(i / 2) + 2;
      const questionDiv = document.createElement("DIV");
      questionDiv.style["grid-column"] = column.toString();
      questionDiv.style["grid-row"] = row.toString();
      questionDiv.style["display"] = "grid";
      question.forEach((elem, i) => {
        let elemDiv;
        if (elem.isIcon) {
          //elemDiv = document.createElement("DIV");
          //elemDiv.appendChild(this.icon(elem.content));
          elemDiv = this.icon(elem.content);
          elemDiv.style["vertical-align"] = "middle";
        } else {
          const button = elemDiv = document.createElement("BUTTON");
          button.disabled = !elem.result;
          button.onclick = () => {
            this.selectCallTraceNode(elem.result);
          }
          button.appendChild(this.icon(elem.content));
          button.setAttribute("title", elem.title);
        }
        elemDiv.style["grid-column"] = i + 1;
        elemDiv.style["grid-row"] = 1;
        questionDiv.appendChild(elemDiv);
      })
      
      varDiv.appendChild(questionDiv);
    })
    return varDiv;
  }
  
  variableQuestions(variable) {
    const selected = this.selectedNode;
    return [
      [
        {
          "content": "fa-book",
          "isIcon": true
        },
        {
          "title": "previous read operation",
          "result": variable.readBefore(selected),
          "content": "fa-angle-left"
        },
        {
          "title": "next read operation",
          "result": variable.readAfter(selected),
          "content": "fa-angle-right"
        }
      ],
      [
        {
          "content": "fa-pencil",
          "isIcon": true
        },
        {
          "title": "previous write operation",
          "result": variable.writeBefore(selected),
          "content": "fa-angle-left"
        },
        {
          "title": "next write operation",
          "result": variable.writeAfter(selected),
          "content": "fa-angle-right"
        }
      ],
      [
        {
          "content": "fa-pencil-square-o",
          "isIcon": true
        },
        {
          "title": "previous read or write operation",
          "result": variable.readOrWriteBefore(selected),
          "content": "fa-angle-left"
        },
        {
          "title": "next read or write operation",
          "result": variable.readOrWriteAfter(selected),
          "content": "fa-angle-right"
        }
      ]
    ]
  }
  
  icon(name) {
    const i = document.createElement("i");
    i.className = `fa ${name}`;
    i.setAttribute("aria-hidden", "true");
    return i;
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
