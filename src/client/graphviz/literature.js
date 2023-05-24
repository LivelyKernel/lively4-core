import { Panning } from "src/client/html.js"
import Graph from "./graph.js"
import {Paper} from "src/client/literature.js"
import Literature from "src/client/literature.js"

/*MD
# Literature Graph

<browse://src/client/graphviz/literature.md>

MD*/

export default class LiteratureGraph extends Graph {

  async initialize(parameters={}) {
    this.papersByKey = {}
    this.key = "e967b361ed31400bb7aec8dd33b8d2cedb9eefd4" // default example, scholarid for Krahn2009LWD
    if (parameters.key) {
      this.key = parameters.key
    }
    this.ensureNode(this.key)
  }
  
  async expand(node, direction="forward", getMethodName="getForwardKeys") {
    if (node.paper && node.paper.isPreview) {
      // load the actual paper and replace placeholder
      await this.loadPaper(node) 
    }
    return super.expand(node, direction, getMethodName)
  }
  
  getBackwardKeysCount(node) {
    return node.paper && node.paper.value.referenceCount
  }
  
  getForwardKeysCount(node) {
    return node.paper && node.paper.value.citationCount
  }
  
  async initializeNode(node) {
    // this.details.style.display = ""
    // var start = performance.now()
    // this.details.innerHTML = "Loading " + node.key
    // lively.setPosition(this.details, lively.pt(0,0))
    if (!node.key) return
    
    var paper = this.papersByKey[node.key]
    if (paper) {
      node.paper = paper 
    } else {
      this.loadPaper(node) 
    }
    // this.details.innerHTML = "Loaded " + node.paper.key + " in " + ( performance.now() - start)
  }
  
  async loadPaper(node) {
    
    node.paper = await Paper.getId(node.key)
    this.papersByKey[node.key] = node.paper

    var referencesAndCitations = []
    if (node.paper.value && node.paper.value.references) {
      referencesAndCitations.push(...node.paper.value.references)
    }
    if (node.paper.value && node.paper.value.citations) {
      referencesAndCitations.push(...node.paper.value.citations)
    }
    var papers = referencesAndCitations.filter(ea => ea.paperId).map(ea => new Paper(ea))
    papers.forEach(ea => ea.isPreview = true)
    papers.forEach(ea => {
      if (!this.papersByKey[ea.scholarid]) this.papersByKey[ea.scholarid] = ea
    })
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
    var paperElement = await (<literature-paper scholarid={node.paper.scholarid} mode="short" open="browse"></literature-paper>)
    paperElement.updateView()
    this.details.style.display = ""
    this.details.appendChild(paperElement)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  } 
  
  onSecondClick(node, element) {
    // lively.openBrowser("bib://" + node.key, false)
    // lively.openInspector(node)
  } 
  
  async getForwardKeys(node) {
    if (!node  || !node.paper  || !node.paper.value.references) return []
    return node.paper.value.citations.map(ea => ea.paperId).filter(ea => ea)
  }

  async getBackwardKeys(node) {
    if (!node  || !node.paper  || !node.paper.value.citations) return []
    return node.paper.value.references.map(ea => ea.paperId).filter(ea => ea)
  }
  
  

}
