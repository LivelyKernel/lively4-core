import LiteratureGraph from './literature-graph.js';
/*MD
#  Literature Keywords Graph



MD*/

export default class LiteratureKeywordsGraph extends LiteratureGraph {

  initialize() {
    super.initialize()
    this.windowTitle = "Literature Keywords Graph";   
    this.customProperties = [{name: "minPapers", default: 2}]
  }

  
  getLabel(node) {
    if (node.object && node.object.key) {
      return node.object.key
    }
    if (_.isString(node.object)) {
      return node.object
    }
    return ("" + node.object).replace(/[^A-Za-z0-9]/g, "")
  }
  
  getTooltip(node) {
    if (node.object && node.object.key) {
      // For paper nodes, show keywords
      return (node.object.keywords || []).join(", ")
    }
    if (_.isString(node.object)) {
      // For keyword nodes, show papers
      var list = this.worksByKeyword.get(node.object)
      if (list) {
        return list.map(ea => ea.key).join(", ").slice(0, 1000)
      }
    }
    return ""
  }
  
  getEdgeTooltip(edge, fromNode, toNode) {
    if (edge && edge.type === 'keyword-keyword' && edge.sharedWorks) {
      return `${edge.sharedWorks.join(', ')}`
    }
    return super.getEdgeTooltip(edge, fromNode, toNode)
  }



  nodeFor(object) {
    return this.nodes.find(ea => {
      if (object instanceof String) return ea.object == object
      return ea.object === object
    })
  }


  async ensureNode(object) {
    var node = this.nodeFor(object)
    if (!node) {
      node = { id: this.counter++, object: object }
      this.nodes.push(node)
    }
    return node
  }

  async onClick(evt, node, element) {
    if (evt.ctrlKey && evt.shiftKey) {
      lively.openInspector({ evt, node, element })
      return
    }
    
    this.details.style.display = ""
    this.details.innerHTML = ""
    
    var list = this.worksByKeyword.get(node.object)
    var links = list.map(ea => <span><a click={() => lively.openBrowser("bib://" + ea.key)}>{ea.key}</a> </span>)
    var div = <div>{...links}</div>
    this.details.appendChild(div)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  }


  getEngine() {
    return "neato"
  }
  

  async dotSource() {
    await this.analyzeGraph()
    
    // Use the new graph structure for keywords-only view
    const allDotNodes = this.getKeywordDotNodes()
    const allDotEdges = this.getKeywordDotEdges()
    
    // Filter out edges between keywords from the same paper
    const filteredEdges = allDotEdges.filter(edge => {
      const sharedWorks = edge.sharedWorks || []
      // Only keep edges where keywords appear together in multiple papers
      return sharedWorks.length >= this.minPapers
    })
    
    // Only include nodes that have at least one filtered edge
    const connectedNodeIds = new Set()
    filteredEdges.forEach(edge => {
      connectedNodeIds.add(edge.from)
      connectedNodeIds.add(edge.to)
    })
    
    const dotNodes = allDotNodes.filter(node => connectedNodeIds.has(node.id))
    const dotEdges = filteredEdges
    
    // Group keywords by how many papers they belong to
    const keywordUsage = new Map()
    for (let [keyword, papers] of this.worksByKeyword) {
      keywordUsage.set(keyword, papers.length)
    }
    
    // size="10,10";
    //     ratio=fill;
    
    let dot = `digraph {
      rankdir=LR;
      graph [  
        splines="false"  
        overlap="scale"  
        
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
    
    // Add keyword nodes with enhanced styling
    for (let node of dotNodes) {
      const usage = keywordUsage.get(node.id) || 1
      if (usage === 1) {
        // Unique keyword - gray and smaller
        dot += `\n      n${node.nodeId} [label="${node.label}", fontcolor="gray", fontsize="10", tooltip="${this.getTooltip({object: node.id})}"];`
      } else {
        // Shared keyword - darker green and scaled by connections
        const fontSize = 10 + usage * 2
        dot += `\n      n${node.nodeId} [label="${node.label}", fontcolor="darkgreen", fontsize="${fontSize}", tooltip="${this.getTooltip({object: node.id})}"];`
      }
    }
    
    // Add edges with weight-based styling
    for (let edge of dotEdges) {
      const fromNode = this.graphNodes.get(edge.from)
      const toNode = this.graphNodes.get(edge.to)
      if (fromNode && toNode) {
        const thickness = Math.min(5, Math.max(1, edge.weight))
        dot += `\n      n${fromNode.nodeId} -> n${toNode.nodeId} [arrowhead=none, penwidth=${thickness}, color="#10101050", title=" "];`
      }
    }
    
    dot += `\n    }`
    return dot
  }

  
}
