import { Panning } from "src/client/html.js"
import Graph from "./graph.js"
import {Paper} from "src/client/literature.js"
import Literature from "src/client/literature.js"

/*MD
# Literature Graph

<browse://src/client/graphviz/literature.md>

MD*/

export default class LiteratureGraph extends Graph {

  async initializeNode(node) {
    node.paper = await Paper.getId(node.key)
  }
  
  getLabel(node) {
    return node.paper.key
  }
  
  getTooltip(node) {
    return node.paper.title
  }

  async onFirstClick(node, element) {
    // lively.openBrowser("bib://" + node.key, false)
    
    this.details.innerHTML = ""
    var paperElement = await (<literature-paper scholarid={node.paper.scholarid} mode="short"></literature-paper>)
    paperElement.updateView()
    this.details.style.display = ""
    this.details.appendChild(paperElement)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  } 
  
  onSecondClick(node, element) {
    // lively.openBrowser("bib://" + node.key, false)
    lively.openInspector(node)
  } 
  
  async getForwardKeys(node) {
    if (!node  || !node.paper  || !node.paper.value.references) return []
    return node.paper.value.citations.map(ea => ea.paperId).filter(ea => ea)
  }

  async getBackwardKeys(node) {
    if (!node  || !node.paper  || !node.paper.value.citations) return []
    return node.paper.value.references.map(ea => ea.paperId).filter(ea => ea)
  }
  
  async initialize(parameters={}) {
    this.key = "e967b361ed31400bb7aec8dd33b8d2cedb9eefd4" // default example, scholarid for Krahn2009LWD
    if (parameters.key) {
      this.key = parameters.key
    }
    this.ensureNode(this.key)
  }

}
