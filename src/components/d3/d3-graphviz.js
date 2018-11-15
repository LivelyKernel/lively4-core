import Morph from "src/components/widgets/lively-morph.js"
import d3v5 from "src/external/d3.v5.js"

import { debounce } from "utils";

import "src/external/d3-selection-multi.v1.js"


export default class D3GraphViz extends Morph {

  async initialize() {
    this.loaded = new Promise(async (resolve) => {
      
      if (!self.d3) {
        self.d3 = d3v5 // because we go global here...? and it will be replaced...
      }
      await lively.loadJavaScriptThroughDOM("GraphViz", lively4url + "/src/external/viz.js", false, "javascript/worker")
      await lively.loadJavaScriptThroughDOM("D3GraphViz", lively4url + "/src/external/d3-graphviz.js", false)
      
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

  setDotData(data) {
    this.dotData = data;
    this.updateViz()
  }

  updateViz() {
    var bounds = this.getBoundingClientRect()
    this.get("#graph").innerHTML = ""

    debugger
    d3.select("#graph").graphviz(false)
      .fade(false)
      .renderDot('digraph  {a -> b}');

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
    // this.setDotData("")
  }

  livelyMigrate(other) {
    this.dotData = other.dotData
    this.options = other.options
  }

}
