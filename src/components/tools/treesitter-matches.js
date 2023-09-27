"enable aexpr";


/*MD [Demo](browse://demos/tree-sitter/matches.md) MD*/

import Morph from 'src/components/widgets/lively-morph.js';
import {visit, Parser, JavaScript, match} from 'src/client/tree-sitter.js';

export default class TreesitterMatches extends Morph {
 
  async update() {
    let graphviz = await (<graphviz-dot></graphviz-dot>)

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

    function renderMatches(matches)  {
      let dotEdges  = []
      for(let match of matches) {
        dotEdges.push(`${match.node1.id} -> ${match.node2.id} [color=green]`)
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

    let sourceCode1 = `let a = 3 + 4`      
    this.tree1 = parser.parse(sourceCode1);

    let sourceCode2 = `let a = 3 + 4\na++`      
    this.tree2 = parser.parse(sourceCode2);

    this.matches = match(this.tree1.rootNode, this.tree2.rootNode)
  
    this.update() 
  }
  
  
}