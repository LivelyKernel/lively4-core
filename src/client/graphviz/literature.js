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
    await super.initialize(parameters)
    this.papersByKey = {}
    this.key = "e967b361ed31400bb7aec8dd33b8d2cedb9eefd4" // default example, scholarid for Krahn2009LWD
    if (parameters.key) {
      this.key = parameters.key
    }
    
    if (parameters.keys) {
      var paperIds = parameters.keys.split(",")
      this.keys = paperIds
      for(var key of this.keys) {
        let node = await this.ensureNode(key)
        node.isRoot = true
      }
      this.key = this.keys[0]
      
      
      var allReferences = {}
      var allCitations = {}

      var tallyReferences = (key) => {
        if (!allReferences[key]) allReferences[key] = 0
        allReferences[key]++
      }
      var tallyCitations = (key) => {
        if (!allCitations[key]) allCitations[key] = 0
        allCitations[key]++
      }
      
      for (let node of this.nodes) {
        if (node.backwardKeys) {
          for(let key of node.backwardKeys) {      
            tallyReferences(key)
          }
        }   
           
        if (node.forwardKeys) {
          for(let key of node.forwardKeys) {
            tallyCitations(key)
          }
        }
      }
      
      // find interconnecting publications
      for(let key of Object.keys(allReferences)) {
        if ((allReferences[key] >= 1) && (allCitations[key] >= 1)) {
          await this.ensureNode(key)
        } else {
          if ((allReferences[key] >= 5)) {
          await this.ensureNode(key)
        }
        }
      }
      
      for (let node of this.nodes) {
        if (node.backwardKeys) {
          for(let key of node.backwardKeys) {      
            let other = this.nodes.find(ea => ea.key == key)
            if (other) {
                this.connect(other, node) 
            }
          }
        }   
           
        if (node.forwardKeys) {
          for(let key of node.forwardKeys) {
            let other = this.nodes.find(ea => ea.key == key)
            if (other) {
                this.connect(node, other) 
            }
          }
        }
      }
      
      
    } else {
      await this.ensureNode(this.key)
    }
  }

  
  connect(fromNode, toNode) {
    if (! fromNode.forward)  fromNode.forward = []
    fromNode.forward.push(toNode)             
                
    if (! toNode.back)  toNode.back = []
    toNode.back.push(fromNode)    
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
      try {
        await this.loadPaper(node) 
      } catch(e) {
        console.warn("Could not loadPaper for", node)
        return
      }
    }
    // this.details.innerHTML = "Loaded " + node.paper.key + " in " + ( performance.now() - start)
  }
  
  async loadPaper(node) {
    if (!node) return
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

  async onFirstClick(evt, node, element) {
    // lively.openBrowser("bib://" + node.key, false)
    
    this.details.innerHTML = ""
    var paperElement = await (<literature-paper scholarid={node.paper.scholarid} mode="short" open="browse"></literature-paper>)
    paperElement.updateView()
    this.details.style.display = ""
    this.details.appendChild(paperElement)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  } 
  
  onSecondClick(evt, node, element) {
    // lively.openInspector(node)
    // lively.openBrowser("bib://" + node.key, false)
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
