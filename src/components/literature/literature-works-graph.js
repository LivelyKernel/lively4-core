/*MD
#  Literature Works Graph

MD*/

/*globals that */


import LiteratureGraph from './literature-graph.js';



export default class LiteratureWorksGraph extends LiteratureGraph {

  initialize() {
    super.initialize()
    this.windowTitle = "Literature Works Graph";   

    if (!this.literatureWorks) {
      
      let source = this.getAttribute("works")
      if (source) {
        this.literatureWorks = JSON.parse(source)
      } else {
        this.literatureWorks = []
      }
    }
  }
  
  getLabel(node) {
    if (node.object && node.object.key) return node.object.key
  }
  
  getTooltip(node) {
    if (node.object && node.object.key) return node.object.key
  }

  getEdgeTooltip(edge, fromNode, toNode) {
    if (edge && edge.type === 'paper-paper' && edge.sharedKeywords) {
      return `${edge.sharedKeywords.join(', ')}`
    }
    return super.getTooltip(edge, fromNode, toNode)
  }

  
  async onClick(evt, node, element) {
    if (evt.ctrlKey && evt.shiftKey) {
      lively.openInspector({ evt, node, element })
      return
    }
    
    this.details.style.display = ""
    this.details.innerHTML = ""
    
    var div = <div>
      <h4>{node.object.key}</h4>
      <p><strong>Keywords:</strong> {(node.object.keywords || []).join(", ")}</p>
    </div>
    this.details.appendChild(div)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  }


  async dotSource() {
    await this.analyzeGraph()
    
    // Use the new graph structure for papers-only view
    const dotNodes = this.getPaperDotNodes()
    const dotEdges = this.getPaperDotEdges()

    let dot = `digraph {
      rankdir=LR;
      graph [  
        splines="true"  
        overlap="false"  
      ];
      node [ 
        style="solid"  
        shape="plain" 
        fontname="Arial"  
        fontsize="14"  
        fontcolor="black" 
      ];
      edge [  
        fontname="Arial"  
        fontsize="8" 
      ];
      
      `
    
    // Add paper nodes
    for (let node of dotNodes) {
      const keywordCount = (node.object.keywords || []).length
      const fontSize = Math.max(10, Math.min(16, 10 + keywordCount))
      dot += `\n      n${node.nodeId} [label="${node.label}", fontcolor="blue", fontsize="${fontSize}", tooltip=" "];`
    }
    
    // Add edges between papers that share keywords
    for (let edge of dotEdges) {
      const fromNode = this.graphNodes.get(edge.from)
      const toNode = this.graphNodes.get(edge.to)
      if (fromNode && toNode) {
        const thickness = Math.min(5, Math.max(1, edge.weight))
        dot += `\n      n${fromNode.nodeId} -> n${toNode.nodeId} [arrowhead=none, penwidth=${thickness}, color="#4169E150", tooltip=" "];`
      }
    }
    
    dot += `\n    }`
    return dot
  }
  
  async livelyExample() {
  
  }
}
