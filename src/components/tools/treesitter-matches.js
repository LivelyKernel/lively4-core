"enable aexpr";


/*MD [Demo](browse://demos/tree-sitter/matches.md) MD*/

import Morph from 'src/components/widgets/lively-morph.js';
import {visit, Parser, JavaScript, match} from 'src/client/tree-sitter.js';

export default class TreesitterMatches extends Morph {
  
  get livelyUpdateStrategy() { return 'inplace'; }
  
  async update() {
    let graphviz = await (<graphviz-dot style="width: 2000px"></graphviz-dot>)

    function renderTree(rootNode, clusterName) {
      let dotEdges = []
      let dotNodes = []

      visit(rootNode, node => {
          dotNodes.push(`${node.id}[label="${node.type.replace(/\"/,'\\"')}"]`)
          if (node.parent) dotEdges.push(`${node.parent.id} -> ${node.id}`)
        })  

      return `subgraph ${clusterName} { 
        ${dotNodes.join(";\n")}
        ${dotEdges.join(";\n")}
      }`

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
    

    function renderMatches(matches)  {
      let dotEdges  = []
      for(let match of matches) {
        dotEdges.push(`${match.node1.id} -> ${match.node2.id} [color="${match.debugInfo ? colorForPhase(match.debugInfo.phase) : "gray"}" penwidth="${widthFor(match)}" tooltip="${tooltipFor(match)}" label="${labelFor(match)}"]`)
      }
      return dotEdges.join(";\n")
    }

    var source = `digraph {
          rankdir=TB;
          graph [  
            splines="true"  
            overlap="false"  ];
          node [ style="solid"  shape="plain" fontname="Arial"  fontsize="14"  fontcolor="black" ];
          edge [  fontname="Arial"  fontsize="8" ];
          ${renderTree(this.tree1.rootNode, "cluster_0")}
          ${renderTree(this.tree2.rootNode, "cluster_1")}
          ${renderMatches(this.matches)}
        }`
    graphviz.innerHTML = `<` +`script type="graphviz">${source}<` + `/script>}`

    graphviz.updateViz()

    this.get("#pane").innerHTML = ""
    this.get("#pane").appendChild(graphviz)
  }
  
  
  async livelyExample() {
   

    var parser = new Parser();
    parser.setLanguage(JavaScript);

    let sourceCode1 = `class Test { 
  foo(i) { 
    if (i == 0) return "Foo!"
  } 
}`      
    this.tree1 = parser.parse(sourceCode1);

    let sourceCode2 = `class Test { 
  foo(i) { 
    if (i == 0) return "Bar"
    else if (i == -1) return "Foo!"
  } 
}`      
    this.tree2 = parser.parse(sourceCode2);

    this.matches = match(this.tree1.rootNode, this.tree2.rootNode)
  
    this.update() 
  }
  
 
  
  
}