

/*MD [Demo](browse://demos/tree-sitter/matches.md) MD*/

import Morph from 'src/components/widgets/lively-morph.js';

import { TrueDiff } from "../../../../sandblocks-text/core/diff.js";
import {languageFor} from "../../../../sandblocks-text/core/languages.js"

export function visit(node, func) {
  
  if (!node) {
    return
  }
  func(node)
  for (let ea of node.children) {
    visit(ea, func)
  }
}

export default class TreesitterMatches extends Morph {
  
  // get livelyUpdateStrategy() { return 'inplace'; }
    
  initialize() {
    this.svgNodesByIdTree1 = new Map()
    this.svgNodesByIdTree2 = new Map()
    
    this.nodesByIdTree1 = new Map()
    this.nodesByIdTree2 = new Map()
  }
  
  async update() {
    
    
    let graphviz = await (<graphviz-dot style="width: 2000px" server="true"></graphviz-dot>)
    let operations = <div class="operations"></div>
    
    let nodesById = new Map()
    
    visit(this.tree1, node => this.nodesByIdTree1.set(node.id, node))
    visit(this.tree2, node => this.nodesByIdTree2.set(node.id, node))
    
    function renderTree(rootNode, clusterName, treeName, otherTreeMap) {
      let dotEdges = []
      let dotNodes = []

      visit(rootNode, node => {
        nodesById.set(treeName + node.id, node)
        
        // node.constructor.name
        let color = "black"
        console.log(otherTreeMap, node.id)
        if (!otherTreeMap.get(node.id)) {
          color = "gray"
        }
        dotNodes.push(`${treeName + node.id}[label="${(node.type || node._text ||  node.constructor.name).replace(/\"/,'\\"')}" fontcolor="${color}"]`)
        if (node.parent) dotEdges.push(`${treeName + node.parent.id} -> ${treeName + node.id}`)
      })  

      return `subgraph ${clusterName} { 
        ${dotNodes.join(";\n")}
        ${dotEdges.join(";\n")}
      }`

    }
    
    function renderMapping(tree1, clusterName1, tree2, clusterName2) {
      let dotEdges = []
      visit(tree1, node => {
        if (node.assigned) {
          let from = clusterName1 + node.id
          let to = clusterName2 + node.assigned.id
          // dotEdges.push(`${from} -> ${to} [color="lightgray"]`)  
        }
      }) 
      
      return dotEdges.join(";\n")
  }
    
    function colorForPhase(phase) {
      var colors = {
        mapTrees_01: "green",
        mapTrees_02: "green",
        lastChanceMatch: "blue",
        bottomUp: "red",
        bottomUpRoot: "orange"
      }
      
      if (!colors[phase]) {
        debugger
      }
      
      return colors[phase] || "gray"
    }
    
    function labelFor(match) {
      if (match.debugInfo && match.debugInfo.phase === "lastChanceMatch") {
        return match.debugInfo.lastChanceCounter
      }
      return ""
    }
    
    function tooltipFor(match) {
      if (!match.debugInfo) return ""
      var s = match.debugInfo.phase
      if (match.debugInfo.time) {
        s += " " + match.debugInfo.time +"ms"
      }
      return s 
    }
    
    function widthFor(match) {
      if (match.debugInfo  && match.debugInfo.time) {
        return match.debugInfo.time * 1
      }
      return 1
    }

    let lastSelectedItem
    let selectOperation =  (op, item) => {
      if (lastSelectedItem) {
        lastSelectedItem.classList.remove("selected")
      }
      lastSelectedItem = item
      lastSelectedItem.classList.add("selected")
      
      this.get("#details").innerHTML = op.debugString()
      var svgNode1 = this.svgNodesByIdTree1.get(op.node.id)
      var svgNode2 = this.svgNodesByIdTree1.get(op.node.id)
      
      if (svgNode1) {lively.showElement(svgNode1)}
      if (svgNode2) {lively.showElement(svgNode2)}
      
      
      // lively.openInspector(op)
    }


    function renderEdits(edits)  {
      let dotEdges  = []
      // for(let match of matches) {
      //   dotEdges.push(`${match.node1.id} -> ${match.node2.id} [color="${match.debugInfo ? colorForPhase(match.debugInfo.phase) : "gray"}" penwidth="${widthFor(match)}" tooltip="${tooltipFor(match)}" label="${labelFor(match)}"]`)
      // }
      
      for(let operation of edits.negBuf) {
        // dotEdges.push(`${match.node1.id} -> ${match.node2.id} [color="${match.debugInfo ? colorForPhase(match.debugInfo.phase) : "gray"}" penwidth="${widthFor(match)}" tooltip="${tooltipFor(match)}" label="${labelFor(match)}"]`)
      }
      
      
      
      return dotEdges.join(";\n")
    }
    

    var source = `digraph {
          rankdir=TB;
          graph [  
            splines="false"  
            overlap="false"  ];
          node [ style="solid"  shape="plain" fontname="Arial"  fontsize="14"  fontcolor="black" ];
          edge [  fontname="Arial"  fontsize="8" ];
          ${renderTree(this.tree1, "cluster_0", "a", this.nodesByIdTree2)}
          ${renderTree(this.tree2, "cluster_1", "b", this.nodesByIdTree1)}
          ${renderMapping(this.tree1, "cluster_0", this.tree2, "cluster_1")}
          ${renderEdits(this.edits)}
        }`
    graphviz.innerHTML = '<' + 'script type="graphviz">' + source + '<' + '/script>'

    await graphviz.updateViz()
    
    

    for(let svgNode of graphviz.get("#container").querySelectorAll("g.node")) {
      let clusterNameAndid = svgNode.querySelector("title").textContent
      if (!clusterNameAndid) continue;
      
      let m = clusterNameAndid.match(/(cluster_[01])(.*)/)
      
      if (m) {
        if (m[1] === "cluster_0") {
          this.svgNodesByIdTree1.set(m[2], svgNode)
        } else {
          this.svgNodesByIdTree2.set(m[2], svgNode)
        }        
      }
       
       svgNode.addEventListener("dblclick", () => {
         lively.openInspector(nodesById.get(clusterNameAndid))
       })  
    }


    for (let op of this.edits.posBuf) {
      let item = <div click={() => selectOperation(op, item)}>{op.constructor.name} {op.node.id}</div>
      operations.appendChild(item)
    }
    
    
  
    this.get("#pane").innerHTML = ""
    this.get("#pane").appendChild(operations)
    this.get("#pane").appendChild(<div class="container">{graphviz}</div>)
  }
  
  livelyMigrate(other) {
    if (true) {
      this.livelyExample()
    } else{
    this.tree1 = other.tree1
    this.tree2 = other.tree2
    this.edits = other.edits
    this.update()}
  }
  
  
  async livelyExample() {
    
   
    const language = languageFor("javascript")
  
    await language.ready()
  

//     let sourceCode1 = `class Test { 
//   foo(i) { 
//     if (i == 0) return "Foo!"
//   } 
// }`      
//     let sourceCode2 = `class Test { 
//   foo(i) { 
//     if (i == 0) return "Bar"
//     else if (i == -1) return "Foo!"
//   } 
// }`      

    let sourceCode1 = `[1, 2, 3]`      
    let sourceCode2 = `[1, 2, 3, ]`      

    const original = language.parse(sourceCode1)
    const tmp = language.parse(sourceCode2);
    
    this.tree1 = original.internalClone();
    const { root, diff } = new TrueDiff().applyEdits(original, tmp, true)
    this.tree2 = root
    
    this.edits = diff
  
    this.update() 
  }
  
}


// dev feedback loop
lively.sleep(100).then(() => {
  // wait for compile...
  document.body.querySelectorAll("sandblocks-tree-matches").forEach(ea => ea.update())
})
