import { Panning } from "src/client/html.js"
import Graph from "./graph.js"
import { MiscPaper, AlexPaper, Paper, LiteratureReference } from "src/client/literature.js"
import Literature from "src/client/literature.js"

/*MD
#  Literature Keywords

MD*/

/*globals that */


import Morph from 'src/components/widgets/lively-morph.js';

export default class LiteratureKeywords extends Morph {

  initialize() {
    this.nodes = []
    this.counter = 1

    if (!this.literatureFiles) {
      this.literatureFiles = []
    }

    // this.literatureFiles = this.literatureFiles.slice(0,10) // DEBUG
  }
  
  connectedCallback() {
    this.get("#content").innerHTML = ""    
    lively.sleep(0).then(() => this.updateView())
  }
  
  getLabel(node) {
    if (node.object && node.object.key) return node.object.key
    return ("" + node.object).replace(/[^A-Za-z0-9]/g, "")
  }
  
  getTooltip(node) {
    var result = ""
    if (_.isString(node.object)) {
      var list = this.tally(this.byKeywords, node.object)
      result += list.map(ea => ea.key).join(", ")

    }
    return result.slice(0, 1000)
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
    
    
    var list = this.byKeywords.get(node.object)
    var links = list.map(ea => <span><a click={() => lively.openBrowser("bib://" + ea.key)}>{ea.key}</a> </span>)
    var div = <div>{...links}</div>
    this.details.appendChild(div)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  }


  tally(map, key) {
    var list = map.get(key)
    if (!list) {
      list = []
      map.set(key, list)
    }
    return list
  }

  async dotSource() {
    var dotEdges = []
    var dotNodes = []

    this.byKeywords = new Map()


    for (let ea of this.literatureFiles) {
      if (ea.keywords) {
        for (let kw of ea.keywords) {
          await this.ensureNode(kw)
          this.tally(this.byKeywords, kw).push(ea)
          //  dotEdges.push(this.nodeFor(ea).id  + " -> "  + this.nodeFor(kw).id)
        }
      }
    }
    var kw2kw = []

    for (let kw of this.byKeywords.keys()) {
      for (let file of this.byKeywords.get(kw)) {
        for (let otherKw of file.keywords) {
          let from = this.nodeFor(kw).id
          let to = this.nodeFor(otherKw).id
          if (from != to) {
            kw2kw.push([from, to].sort().join("->"))
          }
          // dotEdges.push(this.nodeFor(kw).id  + " -> "  + this.nodeFor(otherKw).id)
        }
      }
    }

    this.usedNodeIds = new Set()

    var keywordPairs = _.toPairs(_.countBy(kw2kw))
    keywordPairs = keywordPairs.filter(ea => ea[1] > 2)
    for (let pair of keywordPairs) {
      pair[0].split("->").forEach(ea => this.usedNodeIds.add(ea));

      dotEdges.push(pair[0] + `[arrowhead=none, penwidth=${pair[1]}, color="#10101050" ]`) //  weight=${pair[1]}
    }


    for (let node of this.nodes) {
      if (this.usedNodeIds.has(node.id.toString())) {
        dotNodes.push(node.id + `[` +
          ` label="${this.getLabel(node)}"` +
          ` fontsize="${ this.tally(this.byKeywords, node.object).length + 6 }"` +
          ` tooltip="${this.getTooltip(node)}"` +
          `]`)
      }
    }

    return `digraph {
        rankdir=LR;
        graph [  
          splines="true"  
          overlap="false"  ];
        node [ style="solid"  shape="plain" fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];
        ${dotNodes.join(";\n")}
        ${dotEdges.join(";\n")}
      }`
  }

  
  // #important
  async updateView() {
    if (!this.literatureFiles) {
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
    this.literatureFiles = other.literatureFiles
  }

  async livelyExample() {
  

  }
}
