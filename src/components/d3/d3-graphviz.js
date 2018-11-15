import Morph from "src/components/widgets/lively-morph.js"

import D3Component from "./d3-component.js"

import d3v5 from "src/external/d3.v5.js"

import { debounce } from "utils";

import "src/external/d3-selection-multi.v1.js"

export default class D3GraphViz extends D3Component {

  async initialize() {
    this.loaded = new Promise(async (resolve) => {

      if (!self.d3) {
        self.d3 = d3v5 // because we go global here...? and it will be replaced...
      }
      if (!window.Viz) {
        await lively.loadJavaScriptThroughDOM("GraphViz", lively4url + "/src/external/viz.js", true)
      }
      //  "javascript/worker"

      if (!d3.select().graphviz) {
        await lively.loadJavaScriptThroughDOM("D3GraphViz", lively4url + "/src/external/d3-graphviz.js", true)
      }
      this.updateViz()
      this.options = {}
      this.addEventListener('extent-changed', ((evt) => {
        this.onExtentChanged(evt);
      })::debounce(500));

      resolve()
    })
  }

  
  getDotData() {
    return this.dotData
  }

  async setDotData(data) {
    this.dotData = data;
    await this.updateViz()
  }
  
  async setData(data) {
    this.data = data
    if (!data) return // do data... no cockies! ;-)
    if (data.nodes && data.relations) {
      var nodesSource = ""
      // Bundleview like data...
      this.walkTreeData(data.nodes, d =>  {
        if (!d.hidden) {
          nodesSource += `${d.id} [shape="rectangle", fontname="Arial", label="${d.name}"];`
        }
      })

      var relationsSource = data.relations.map(ea => ea.source + " -> " + ea.target).join(";")
      var source = `digraph {${nodesSource} ${relationsSource}}`

      try {
       await this.setDotData(source)
        
      } catch(e) {
        throw new Error("D3 GraphViz, could not render: " + source, e)
      }
    }
  }
  

  async updateViz() {
    var svgContainer = this.get("#container")
    svgContainer.style.width = this.style.width // hard to find out how to do this in CSS, ... with "relative"
    svgContainer.style.height = this.style.height
    
    var bounds = this.getBoundingClientRect()
    var div = this.get("#graph")
    div.innerHTML = ""

    var data = this.getDotData()
    if (!data) {
      div.innerHTML = "no data"
      return
    }
    
    var graph = d3.select(div)
    var graphviz = graph.graphviz(false) // default is work, "false" -> no worker
      .fade(false)
      .zoom(true)
      .renderDot(data);
    
    
    var vis = this;
    graph.selectAll("g.node")
      // .attr("stroke", "red")
      .on("click", function(d) {
        vis.onNodeClick(d, d3.event, this)
      })
  }

  config(config) {
    Object.keys(config).forEach(key => {
      lively.notify("key " + key)
      this.options[key] = config[key] // we could check them here...      
    })
  }

  livelyInspect(contentNode, inspector) {
    if (this.dotData) {
      contentNode.appendChild(inspector.display(this.dotData, false, "#dot-data", this));
    }
  }

  onExtentChanged() {
    // this.updateViz()
  }

  async livelyExample() {
    await this.loaded
    this.setDotData('digraph  {a -> b; b -> c; c -> a}')
  }

  livelyMigrate(other) {
    this.dotData = other.dotData
    this.options = other.options
  }

}
