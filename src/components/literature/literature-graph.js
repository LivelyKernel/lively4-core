import { Panning } from "src/client/html.js"
import Morph from 'src/components/widgets/lively-morph.js';

/*MD # Literature Graph


MD*/

export default class LiteratureGraph extends Morph {
  async initialize () {
    this.nodes = []
    this.counter = 1
    this.windowTitle = "Literature Graph";   
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

  async analyzeGraph() {
    this.worksByKeyword = new Map()
    this.keywordsByWork= new Map()
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
    
    for (let ea of this.literatureWorks) {
      if (this.workByKey.get(ea.key)) {
        lively.warn("[literature graph] duplicate work " + ea.key)
      }
      this.workByKey.set(ea.key, ea)
      
      if (ea.keywords) {
        for (let kw of ea.keywords) {
          tally(this.worksByKeyword, kw).push(ea)
          this.keywords.add(kw)
        }
      }
    }
    
    
    
  }
  
  async ensureNode(object) {
    var node = this.nodeFor(object)
    if (!node) {
      node = { id: this.counter++, object: object }
      this.nodes.push(node)
    }
    return node
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
    this.graphviz.setAttribute("engine", "neato")
    await this.graphviz.updateViz()

    let allSVGNodes = this.graphviz.shadowRoot.querySelectorAll("g.node text")
    allSVGNodes.forEach(ea => {
      ea.addEventListener("click", async (evt) => {
        evt.preventDefault()
        evt.stopPropagation()

        var svgNode = lively.allParents(ea).find(parent => parent.classList.contains("node"))
        var text = svgNode.querySelector('title').textContent
        var nodeId = text.replace(/^[a-z]*/, "")
        var node = this.nodes.find(ea => ea.id == nodeId)
        this.onClick(evt, node, ea)
      })
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