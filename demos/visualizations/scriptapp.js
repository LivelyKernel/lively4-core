
// Simple Apps that are created inside a script tag in a MarkDown file
// a) Reason: Code reuse?
// b) #FutureWork How does it relate to Components, Objects, HTML and MarkdDown files

// #ResearchQuestion "What is the unit of a Program/Tool/Application in Lively4?"  -> Object, MarkdownFile, Component ?


import moment from "src/external/moment.js";  
import Strings from 'src/client/strings.js'  
import Colors from "src/external/tinycolor.js"
import d3 from "src/external/d3.v5.js"
  
export default class ScriptApp {
  
  static getEngine() {
    return this.engine || "dot"
  }

  static setEngine(engine) {
    this.engine = engine
    if (this.graphviz) {
      this.graphviz.setAttribute("engine", engine);
    }
    return engine
  }

  dataClick(data, element) {
    // subclass responsibility
  }
  
  
  static async create(ctx) {
    
    this.ctx = ctx

    this.container = this.get("lively-container");
    this.containerContent = this.container.get("#container-content")
    this.graphviz = await (<graphviz-dot engine={this.getEngine()} server="true" ></graphviz-dot>) // 

    this.updateExtent()

    lively.removeEventListener("graphvizContent", this.container)
    lively.addEventListener("graphvizContent", this.container, "extent-changed", () => {
      this.updateExtent()
    });

    var style = document.createElement("style")
    style.textContent = `
      td.comment {
        max-width: 300px
      }
      div#root {
        overflow: visible;
      }

      #graphviz {
        position: absolute;
        top: 0px
        left: 0px;

      }
    `

    var div = document.createElement("div")
    this.result = div
    div.id = "root"

    div.appendChild(style)
    div.appendChild(<div>
      <button click={() => this.updateViz()}>update</button>
    </div>)
    div.appendChild(this.graphviz)
    return div
  }
  
  static updateViz() {
    throw new Error("subclass responsibility")
  }
  
  static updateSVG() {
    var svg = this.graphviz.get("svg")
    if (!svg) {
      lively.warn("no svg found") // should we wait?
      return
    }

    var zoomElement = document.createElementNS("http://www.w3.org/2000/svg", "g")  
    var zoomG = d3.select(zoomElement)

    var svgOuter = d3.select(svg)
    var svgGraph = d3.select(this.graphviz.get("#graph0"))

    svgOuter
      .style("pointer-events", "all")        
      .call(d3.zoom()
          .scaleExtent([1 / 30, 30])
          .on("zoom", () => {
            var trans = d3.event.transform
            zoomG.attr("transform", trans);
          }));        
    svg.appendChild(zoomElement)
    zoomElement.appendChild(this.graphviz.get("#graph0"))


    this.graphviz.shadowRoot.querySelectorAll("g.node").forEach(ea => {
      d3.select(ea).style("pointer-events", "all")
      ea.addEventListener("click", async (evt) => {
        // lively.showElement(ea)
        var key = ea.querySelector('title').textContent
        var data = this.graph.dataById.get(key)

        if (evt.shiftKey) {
          lively.openInspector({
            element: ea,
            key: key,
            data: data
          })
          return
        }
        var data = this.graph.dataById(key)
        if (data) {
          this.dataClick(data, ea)
        }
        
        this.lastSelectedNode = this.selectedNode
        this.selectedNode = ea
      })
    })
  }
  
  static updateExtent() {
    var extent = lively.getExtent(this.containerContent)
    this.graphviz.width = extent.x - 40
    this.graphviz.height = extent.y - 40

  }
  
  static connectInput(element, initValue, update) {
    element.value = initValue
    element.addEventListener("change", function(evt) {
        update(this.value)
    })
  }
 
  static get(query) {
    return lively.query(this.ctx, query)
  }  
}