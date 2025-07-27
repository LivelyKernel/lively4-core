import { Panning } from "src/client/html.js"
import Morph from 'src/components/widgets/lively-morph.js';

/*MD # Literature Graph


MD*/

export default class LiteratureGraph extends Morph {
  async initialize () {
    // Legacy structure for compatibility
    this.nodes = []
    this.counter = 1
    this.windowTitle = "Literature Graph";
    
    // Full graph structure - contains ALL nodes and edges
    this.graphNodes = new Map() // id -> node data (papers + keywords)
    this.graphEdges = new Map() // edgeId -> edge data (all relationships)
    
    // Analysis data
    this.worksByKeyword = new Map()
    this.keywordsByWork = new Map()
    this.keywords = new Set()
    this.workByKey = new Map()
    
    
    if (!this.literatureWorks) {
      let source = this.getAttribute("works")
      if (source) {
        this.literatureWorks = JSON.parse(source)
      } else {
        this.literatureWorks = []
      }
    }
  }
  
  connectedCallback() {
    this.get("#content").innerHTML = ""    
    lively.sleep(0).then(() => this.updateView())
  }
  
  nodeFor(object) {
    return this.nodes.find(ea => {
      return ea.object === object
    })
  }

  // Graph structure methods
  addGraphNode(id, data) {
    const node = { id, ...data }
    this.graphNodes.set(id, node)
    // Maintain lookup map by nodeId
    this.nodeIdToGraphNode.set(node.nodeId, node)
  }

  addGraphEdge(from, to, type, weight = 1, metadata = {}) {
    const edgeId = `${from}->${to}-${type}`
    this.graphEdges.set(edgeId, {
      from,
      to,
      type,
      weight,
      ...metadata
    })
  }

  async analyzeGraph() {
    // Clear full graph
    this.graphNodes.clear()
    this.graphEdges.clear()
    
    // Clear and rebuild lookup map
    this.nodeIdToGraphNode = new Map() // nodeId -> graph node
    
    this.worksByKeyword = new Map()
    this.keywordsByWork = new Map()
    this.keywords = new Set()
    this.workByKey = new Map()
    
    function tally(map, key) {
      var list = map.get(key)
      if (!list) {
        list = []
        map.set(key, list)
      }
      return list
    }
    
    // Build full graph structure
    for (let ea of this.literatureWorks) {
      if (this.workByKey.get(ea.key)) {
        lively.warn("[literature graph] duplicate work " + ea.key)
      }
      this.workByKey.set(ea.key, ea)
      
      // Add paper to full graph
      this.addGraphNode(ea.key, {
        object: ea,
        type: 'paper',
        label: ea.title || ea.key,
        nodeId: this.counter++
      })
      
      if (ea.keywords) {
        this.keywordsByWork.set(ea.key, new Set(ea.keywords))
        for (let kw of ea.keywords) {
          tally(this.worksByKeyword, kw).push(ea)
          this.keywords.add(kw)
          
          // Add keyword to full graph
          if (!this.graphNodes.has(kw)) {
            this.addGraphNode(kw, {
              object: kw,
              type: 'keyword',
              label: kw,
              nodeId: this.counter++
            })
          }
          
          // Add directed edge to full graph: paper -> keyword
          this.addGraphEdge(ea.key, kw, 'paper-has-keyword', 1)
        }
      } else {
        this.keywordsByWork.set(ea.key, new Set())
      }
    }
    
    // Add computed edges for papers (based on shared keywords)
    for (let work of this.literatureWorks) {
      const workKeywords = this.keywordsByWork.get(work.key)
      
      for (let otherWork of this.literatureWorks) {
        if (work.key >= otherWork.key) continue // avoid duplicates
        
        const otherKeywords = this.keywordsByWork.get(otherWork.key)
        const sharedKeywords = new Set([...workKeywords].filter(kw => otherKeywords.has(kw)))
        
        if (sharedKeywords.size > 0) {
          this.addGraphEdge(work.key, otherWork.key, 'paper-paper', sharedKeywords.size, {
            sharedKeywords: Array.from(sharedKeywords)
          })
        }
      }
    }
    
    // Add computed edges for keywords (based on co-occurrence)
    for (let [keyword1, works1] of this.worksByKeyword) {
      for (let [keyword2, works2] of this.worksByKeyword) {
        if (keyword1 >= keyword2) continue // avoid duplicates
        
        const sharedWorks = works1.filter(work => works2.includes(work))
        if (sharedWorks.length > 0) {
          this.addGraphEdge(keyword1, keyword2, 'keyword-keyword', sharedWorks.length, {
            sharedWorks: sharedWorks.map(w => w.key)
          })
        }
      }
    }
  }

  // Helper methods to extract subsets for display
  getDotNodes(nodeFilter = () => true) {
    return Array.from(this.graphNodes.values()).filter(nodeFilter)
  }

  getDotEdges(edgeFilter = () => true) {
    return Array.from(this.graphEdges.values()).filter(edgeFilter)
  }

  // Specific subsets for different views
  getPaperDotNodes() {
    return this.getDotNodes(node => node.type === 'paper')
  }

  getPaperDotEdges() {
    return this.getDotEdges(edge => edge.type === 'paper-paper')
  }

  getKeywordDotNodes() {
    return this.getDotNodes(node => node.type === 'keyword')
  }

  getKeywordDotEdges() {
    return this.getDotEdges(edge => edge.type === 'keyword-keyword')
  }
  
  getEngine() {
     return "fdp"
  }

  
  getTooltip(node) {
     return node.label
    
  }
  
  
  // Default edge tooltip formatting - subclasses override this
  getEdgeTooltip(edge, fromNode, toNode) {
    if (edge && edge.type === 'paper-paper' && edge.sharedKeywords) {
      return `${edge.sharedKeywords.join(', ')}`
    } else if (edge && edge.type === 'keyword-keyword' && edge.sharedWorks) {
      return `${edge.sharedWorks.join(', ')}`
    } else if (edge && edge.type === 'paper-has-keyword') {
      return `${fromNode.label} → ${toNode.label}`
    }
    return null
  }

  // Default dotSource - subclasses override this
  async dotSource() {
    await this.analyzeGraph()
    
    // For base class, show full directed graph
    const dotNodes = this.getDotNodes()
    const dotEdges = this.getDotEdges(edge => edge.type === 'paper-has-keyword')

    let dot = `digraph {
      graph [  
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
    
    // Group keywords by how many papers they belong to
    const keywordUsage = new Map()
    for (let [keyword, papers] of this.worksByKeyword) {
      keywordUsage.set(keyword, papers.length)
    }
    
    // Add all nodes
    for (let node of dotNodes) {
      if (node.type === 'paper') {
        dot += `\n      n${node.nodeId} [label="${node.label}", fontcolor="blue", tooltip="${this.getTooltip(node)}"];`
      } else if (node.type === 'keyword') {
        const usage = keywordUsage.get(node.id) || 1
        if (usage === 1) {
          // Unique keyword - gray and smaller
          dot += `\n      n${node.nodeId} [label="${node.label}", fontcolor="gray", fontsize="10"];`
        } else {
          // Shared keyword - darker green and scaled by connections
          const fontSize = Math.min(20, Math.max(12, 10 + usage * 2))
          dot += `\n      n${node.nodeId} [label="${node.label}", fontcolor="darkgreen", fontsize="${fontSize}"];`
        }
      }
    }
    
    // Add edges
    for (let edge of dotEdges) {
      const fromNode = this.graphNodes.get(edge.from)
      const toNode = this.graphNodes.get(edge.to)
      if (fromNode && toNode) {
        dot += `\n      n${fromNode.nodeId} -> n${toNode.nodeId};`
      }
    }
    
    dot += `\n    }`
    return dot
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
    lively.showElement(element)
  }

  getEdgeTooltipByTitle(edgeTitle) {
    const parsed = this.parseEdgeTitle(edgeTitle)
    if (!parsed) return null
    
    return this.getEdgeTooltip(parsed.edge, parsed.fromNode, parsed.toNode)
  }


  parseEdgeTitle(edgeTitle) {
    const match = edgeTitle.match(/n(\d+)->n(\d+)/)
    if (!match) return null
    
    const fromNodeId = parseInt(match[1])
    const toNodeId = parseInt(match[2])
    
    const fromNode = this.nodeIdToGraphNode.get(fromNodeId)
    const toNode = this.nodeIdToGraphNode.get(toNodeId)
    
    if (!fromNode || !toNode) return null
    
    // Find the edge in our graph data
    for (let edge of this.graphEdges.values()) {
      const fromGraphNode = this.graphNodes.get(edge.from)
      const toGraphNode = this.graphNodes.get(edge.to)
      
      if (fromGraphNode && toGraphNode && 
          fromGraphNode.nodeId === fromNodeId && 
          toGraphNode.nodeId === toNodeId) {
        
        return { edge, fromNode, toNode }
      }
    }
    
    return null
  }

  showEdgeTooltip(evt, text) {
    if (!this.tooltip) {
      this.tooltip = document.createElement('div')
      this.tooltip.style.cssText = `
        position: absolute;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 5px 8px;
        border-radius: 3px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
      `
      this.pane.appendChild(this.tooltip)
    }
    
    this.tooltip.textContent = text
    this.tooltip.style.display = 'block'
    this.updateTooltipPosition(evt)
  }

  hideEdgeTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none'
    }
  }

  updateTooltipPosition(evt) {
    if (!this.tooltip) return
    
    // Use lively.getClientPosition to get mouse and pane positions
    const mousePos = lively.getClientPosition(evt)
    const panePos = lively.getClientPosition(this.pane)
    
    // Calculate tooltip position: mouse relative to pane + offset
    const offset = lively.pt(10, -25)  // Right 10px, down 25px
    const tooltipPos = mousePos.subPt(panePos).addPt(offset)
    
    // Use lively.setClientPosition for robust positioning
    lively.setClientPosition(this.tooltip, tooltipPos.addPt(panePos))
  }
  
  
  // #important
  async updateView() {
    if (!this.literatureWorks) {
      this.get("#content").innerHTML = "no literature files"
      return;
    }
    
    this.graphviz = await (<graphviz-dot server="false"></graphviz-dot>)
    this.graphviz.shadowRoot.querySelector("style").textContent = `
        :host {
          min-width: 50px;
          min-height: 50px;
          background: none;
        }

        #container {
          position: relative; /* positioning hack.... we make our coordinate system much easier by this */
          border: none;
          overflow: hidden
        }
      `

    this.graphviz.addEventListener("click", async (evt) => {
      this.details.style.display = 'none'
    })
    
    
    var source = await this.dotSource()
    this.graphviz.innerHTML = `<` + `script type="graphviz">${source}<` + `/script>}`
    this.graphviz.setAttribute("engine", this.getEngine())
    await this.graphviz.updateViz()

    let allSVGNodes = this.graphviz.shadowRoot.querySelectorAll("g.node text")
    allSVGNodes.forEach(ea => {
      ea.addEventListener("click", async (evt) => {
        evt.preventDefault()
        evt.stopPropagation()

        var svgNode = lively.allParents(ea).find(parent => parent.classList.contains("node"))
        var text = svgNode.querySelector('title').textContent
        var nodeId = text.replace(/^[a-z]*/, "")
        var node = this.nodeIdToGraphNode.get(parseInt(nodeId))
        this.onClick(evt, node, ea)
      })
    })

    // Add hover tooltips for edges with wider interactive areas
    let allSVGEdges = this.graphviz.shadowRoot.querySelectorAll("g.edge")
    allSVGEdges.forEach(edge => {
      const titleElement = edge.querySelector('title')
      if (titleElement) {
        const edgeTitle = titleElement.textContent
        const tooltip = this.getEdgeTooltipByTitle(edgeTitle)
        
        if (tooltip) {
          // Find the visible path element
          const pathElement = edge.querySelector('path')
          if (pathElement) {
            // Create a wider invisible path for easier hovering
            const invisiblePath = pathElement.cloneNode(true)
            invisiblePath.style.stroke = 'transparent'
            invisiblePath.style.strokeWidth = '15' // Much wider hit area
            invisiblePath.style.fill = 'none'
            invisiblePath.style.pointerEvents = 'stroke'
            
            // Insert the invisible path before the visible one
            pathElement.parentNode.insertBefore(invisiblePath, pathElement)
            
            // Add event listeners to the invisible wider path
            invisiblePath.addEventListener("mouseenter", (evt) => {
              this.showEdgeTooltip(evt, tooltip)
              // Highlight the visible edge
              pathElement.style.strokeWidth = (parseFloat(pathElement.style.strokeWidth) || 1) * 1.5
              pathElement.style.opacity = '0.8'
            })
            
            invisiblePath.addEventListener("mouseleave", (evt) => {
              this.hideEdgeTooltip()
              // Reset the visible edge
              pathElement.style.strokeWidth = ''
              pathElement.style.opacity = ''
            })
            
            invisiblePath.addEventListener("mousemove", (evt) => {
              this.updateTooltipPosition(evt)
            })
          }
        }
      }
    })
    
    
    this.graphviz.style.display = "inline-block" // so it takes the width of children and not parent
    this.details = <div class="details" style="position:absolute; display: none"></div>
    this.pane = <div id="root">
        {this.graphviz}
        {this.details}
      </div>
    this.get("#content").appendChild(this.pane)
  
    new Panning(this.pane)
  }

  
  livelyMigrate(other) {
    this.literatureWorks = other.literatureWorks
  }

  
  livelyPrepareSave() {
    if (this.literatureWorks) {
      this.setAttribute("works", JSON.stringify(this.literatureWorks))
    }
  }
}