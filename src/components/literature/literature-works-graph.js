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

  async onClick(evt, node, element) {
    if (evt.ctrlKey && evt.shiftKey) {
      lively.openInspector({ evt, node, element })
      return
    }
    
    this.details.style.display = ""
    this.details.innerHTML = ""
    
    var div = <div>{node.object.key}</div>
    this.details.appendChild(div)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  }

  async dotSource() {
    var dotEdges = []
    var dotNodes = []

    for (let ea of this.literatureWorks) {
      await this.ensureNode(ea)
    }
    
    for (let node of this.nodes) {
        dotNodes.push(`${node.id}[label="${this.getLabel(node)}" fontsize="10" tooltip="${this.getTooltip(node)}"]`)
    }

    return `digraph {
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
      ${dotNodes.join(";\n      ")}
      ${dotEdges.join(";\n      ")}
    }`
  }
  
  async livelyExample() {
  
  }
}
