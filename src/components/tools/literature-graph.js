import Morph from 'src/components/widgets/lively-morph.js';

import Dexie from "src/external/dexie3.js"
import BibtexParser from 'src/external/bibtexParse.js';
import MarkdownIt from "src/external/markdown-it.js";
import Bibliography from "src/client/bibliography.js"
import FileIndex from "src/client/fileindex.js";
import {pt} from "src/client/graphics.js"
import toTitleCase from "src/external/title-case.js"
import moment from "src/external/moment.js"

// import Markdown from 'src/client/markdown.js';

import LiteratureListing from "./literature-listing.js"
import {Paper} from "src/client/literature.js"
import ViewNav from 'src/client/viewnav.js'
/*MD # Literature Graph

![](literature-graph.png)

MD*/

export default class LiteratureGraph extends LiteratureListing {
  async initialize () {
    this.windowTitle = "LiteratureGraph";
    (() => this.updateView()).defer(100)
  }
  
  async updatePaper() {
    for(var ea of this.literatureFiles) {
      if (ea.entry && ea.entry.microsoftid) {
        try {
          var data = await fetch("scholar://data/paper/MAG:" + ea.entry.microsoftid).then(r => r.json())
          if (data  && data.paperId) {
            ea.paper = await Paper.getId(data.paperId)
          }
        } catch(e) {
          lively.warn("could not update paper for: " + ea.entry.microsoftid, e)
        }
      }
    }
  }

  async updateView() {
    this.get("#content").innerHTML = "updating files and entries... (this may take a while)"

    if (!this.literatureFiles) {
      await this.updateFiles()
      await this.updateEntries() // bibtex
      await this.updatePaper() // academic...
    }
    
       
    this.details = <div id="details" style="position:absolute;"></div>
    this.details.hidden = true
    
    
    
    
    this.get("#content").innerHTML = ""
    if (this.literatureFiles.length == 0) {
      this.get("#content").innerHTML = "no literature files found"
    }
    
    this.graphviz = await (<graphviz-dot></graphviz-dot>)
    this.graphviz.style.display = "inline-block"
    
    
    var pane = <div id="pane" style="overflow: hidden; background: gray; position:absolute; height: 100%; width:100%">
        {this.graphviz}
        {this.details}
      </div>
    pane.style.overflow = "auto"
    
    
    this.registerPanning(pane)

    
    
    this.get("#content").appendChild(pane)
    this.update()
  }
  

  /*MD *copied from <edit://doc/files/changesgraph.md> #TODO #pullout* MD*/ 
  registerPanning(pane) {
    var lastMove
    
    let onPanningMove = (evt) => {
      var pos = lively.getPosition(evt)
      var delta = pos.subPt(lastMove)
      var scale = 1/ Number(getComputedStyle(pane).zoom)
      pane.scrollTop -= delta.y * scale
      pane.scrollLeft -= delta.x * scale
      lastMove = pos

    }

    let onPanningDown = (evt) => {
      lastMove = lively.getPosition(evt)
      lively.addEventListener("changegraph", document.body.parentElement, "pointermove", evt => onPanningMove(evt))
      lively.addEventListener("changegraph", document.body.parentElement, "pointerup", evt => {
        this.lastPanning = Date.now()
        lively.removeEventListener("changegraph", document.body.parentElement)
      })
      evt.stopPropagation()
      evt.preventDefault()
    }
    
    
    
    let onMouseWheel = (evt) => {
      if (evt.altKey) {
          // finder granular zoom? using non standard feature
          var zoom = Number(getComputedStyle(pane).zoom) + (evt.wheelDelta / 1000 / 3)
          pane.style.zoom= zoom


          evt.stopPropagation()
          evt.preventDefault()
        }
    }
    
    pane.addEventListener("mousewheel", e => onMouseWheel(e))
    
    // always drag with ctrl pressed
    pane.addEventListener("pointerdown", evt => {
      if (evt.ctrlKey) {
        onPanningDown(evt)          
      }
    }, true)

    // but if nothing else... normal drag will do
    pane.addEventListener("pointerdown", evt => {
      var element = _.first(evt.composedPath())
      lively.notify("element " + element.localName)
      if (element.localName == "polygon") {
        onPanningDown(evt)
      }
    })
  }
  
  cleanKey(key) {
    return "_"+key.replace(/[^A-Za-z0-9]/g,"")
  }
  
  renderEdge(edge) { 
    return edge.to + " -> " + edge.from + `[ ]`
    // len="${Math.sqrt(edge.length || 1)}"
  }
  
  renderPaper(literatureFile) {
    var key = this.cleanKey(literatureFile.paper.key)
    this.nodes.push({key: key, literatureFile: literatureFile})
    var link = `bib://${literatureFile.paper.key}`
    this.papersByLink.set(link, literatureFile)
    let size = 8
    
    if (literatureFile.paper.value.ECC) {
      size += (Math.log(literatureFile.paper.value.ECC) * 2)
    }
    
    return  key + `[`+
      ` label="${literatureFile.paper.key}"`+
      ` href="${link}"`+
      ` fontcolor="darkgray"`+
      ` fontsize="${size}"` +
      `]`
  }
  
  renderKeyword(keyword) {
    var key = this.cleanKey(keyword)
    this.nodes.push({key: key, keyword: keyword})
    return key + `[`+
      ` label="${keyword}"` +
      ` fontcolor="blue"`+
      ` fontsize="14"` + 
      `]`
  }
  

  async dotSource() {
    this.nodes = []
    this.edges = []

    this.papersByLink = new Map()
    this.papers = _.uniqBy(this.literatureFiles.filter(ea => ea.paper), ea => ea.paper.key)
    this.literatureFilesByKeyword = new Map()
    this.keywordsByKey = new Map()
    this.keywords = []
    
    for(var ea of this.papers) {
      if (ea.paper) {
        for (let keyword of ea.paper.keywords ) {
          var list = this.literatureFilesByKeyword.get(keyword) || [] 
          list.push(this.cleanKey(ea.paper.key))
          this.literatureFilesByKeyword.set(keyword, list)
        }
      }
    }
    
    for(let keyword of this.literatureFilesByKeyword.keys()) {
      var paperKeys = this.literatureFilesByKeyword.get(keyword)
      if (paperKeys.length > 1) {
        for(let key of paperKeys) {
          this.keywords.push(keyword)
          this.keywordsByKey.set(this.cleanKey(keyword), keyword)
          this.edges.push({from:key, to: this.cleanKey(keyword), length: paperKeys.length })
        }
      }
    }
    
    // this.edges = this.edges.filter(edge => this.nodes.find(ea => ea.id ==  edge.from) && this.nodes.find(ea => ea.id == edge.to)) // remove obsolete edges 

    return `digraph "" {
      rankdir=LR;
      graph [  
        splines="true"  
        overlap="false"  ];
      node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
      edge [  fontname="Arial"  arrowhead="none" color="gray" fontsize="8" ];
      ${this.papers.map(ea => this.renderPaper(ea)).join(";\n") /* order is important for index mapping */}
      ${this.keywords.map(ea => this.renderKeyword(ea)).join(";\n")}
      ${this.edges.map(ea => this.renderEdge(ea)).join(";\n")}

    }`
  }
      
  async update() {
    var start = Date.now()
    this.graphviz.get("#graph").innerHTML = ""
    var source = await this.dotSource()
    // this.graphviz.setAttribute("engine", "neato")
    this.graphviz.setAttribute("engine", "fdp")
    this.graphviz.innerHTML = `<` +`script type="graphviz">${source}<` + `/script>}`
    
    await this.graphviz.updateViz()
    // lively.html.fixLinks([this.graphviz.get("#graph")], lively4url, link => this.onLink(link))
  
    for(let a of this.graphviz.get("#graph").querySelectorAll("a")) {
      a.addEventListener("click", evt => {
        this.onLink(evt, a.getAttribute("xlink:href"), a)
        evt.preventDefault()
        evt.stopPropagation()
      })
    }

    for(let element of this.graphviz.get("#graph").querySelectorAll("g")) {
      element.addEventListener("click", evt => {
        this.onElementClick(evt, element)
        evt.preventDefault()
        evt.stopPropagation()
      })
    }
    // Markdown.parseAndReplaceLatex(this.graphviz.get("#graph"))
    lively.notify("updated in " + (Date.now() - start) + "ms")
  }
  
  get rootNode() {
    return this.graphviz.get("#graph")
  }
  
  
  findEdgeNodes(func) {
    var edgeNodes = []
    for(let i=0; i < this.edges.length; i++) {
      let edge = this.edges[i]
      if (func(edge)) {
        let edgeNode = this.rootNode.querySelector("#edge"+ (i + 1))
        if (edgeNode) {
          edgeNodes.push(edgeNode)
        }
      }
    }
    return edgeNodes
  }
  
  edgeNodesToKey(key) {
    return this.findEdgeNodes(edge => edge.to == key)
  }

  edgeNodesFromKey(key) {
    return this.findEdgeNodes(edge => edge.from == key)    
  }
  
  onElementClick(evt, element) {
    if (this.lastPanning && (Date.now() - this.lastPanning < 100)) return
    let title = element.querySelector("title")
    if (title) {
      var key = title.textContent // #FIXME Fragile hack, there has to be a better way
      var keyword = this.keywordsByKey.get(key)
      if (keyword) {
        if (element.classList.contains("selected")) {
          element.classList.remove("selected") 
          for(let edgeNode of this.edgeNodesToKey(key)) {
            let path = edgeNode.querySelector("path")
            path.setAttribute("stroke", "gray")
            path.setAttribute("stroke-width", 1)
          }
        } else {
          element.classList.add("selected")
          for(let edgeNode of this.edgeNodesToKey(key)) {
            let path = edgeNode.querySelector("path")
            path.setAttribute("stroke", "blue")
            path.setAttribute("stroke-width", 2)
          }
        }
      }
    }
    if (evt.shiftKey) {
      lively.openInspector(element)
    }    
  }
  
  onLink(evt, href, element) {
    if (evt.shiftKey) {
      lively.openInspector(element)
    } else {
      // Such mapping of papers, to objects, to keys, to nodes, to elements... back and forth is #Challenging #Research #PaperIdea
      
      var elementNode = element.parentElement.parentElement
      var index = Number(elementNode.id.replace("node",""))
      var node = this.nodes[index-1]    
      var literatureFile = this.papersByLink.get(href)
      if (literatureFile && literatureFile.paper) {
        this.details.innerHTML = `<lively-bibtex-entry>${literatureFile.paper.toBibtex()}</lively-bibtex-entry>` 
        
      } else {
        this.details.innerHTML = "No details for " + href
      }
      this.details.hidden = false
      lively.setClientPosition(this.details, lively.getClientBounds(element).bottomLeft().addPt(pt(20,0)))
      
      if (node) {
        let edgeNodes = this.edgeNodesFromKey(node.key)
        if (element.classList.contains("selected")) {
          element.classList.remove("selected") 
          for(let edgeNode of edgeNodes) {
            let path = edgeNode.querySelector("path")
            path.setAttribute("stroke", "gray")
            path.setAttribute("stroke-width", 1)
          }
        } else {
          element.classList.add("selected")
          for(let edgeNode of edgeNodes) {
            let path = edgeNode.querySelector("path")
            path.setAttribute("stroke", "red")
            path.setAttribute("stroke-width", 2)
          }
        }
      }
      // lively.openBrowser(href)
    }
  }
  
  
  
  async livelyExample() { 
    this.base = "http://localhost:9005/Dropbox/Thesis/Literature/_incoming" // _incoming/
    this.bibliographyBase = "http://localhost:9005/Dropbox/Thesis/Literature/"
    this.container = await (<lively-container></lively-container>)
    this.updateView()

  }
}