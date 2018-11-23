import Morph from "src/components/widgets/lively-morph.js"
import { debounce } from "utils";

/* Plain GraphiViz Dot Wrapper Component */


export default class GraphvizDot extends Morph {

  async initialize() {
    debugger
    this.options = {}
    this.loaded = new Promise(async (resolve) => {
      if (!window.Viz) {
        await lively.loadJavaScriptThroughDOM("GraphViz", lively4url + "/src/external/viz.js", true)
      }
      this.updateViz()
      this.addEventListener('extent-changed', ((evt) => {
        this.onExtentChanged(evt);
      })::debounce(500));

      resolve()
    })
  }

  async updateViz() {
    var svgContainer = this.get("#container")
    svgContainer.style.width = this.style.width // hard to find out how to do this in CSS, ... with "relative"
    svgContainer.style.height = this.style.height
    
    var bounds = this.getBoundingClientRect()
    var div = this.get("#graph")
    try {
      div.innerHTML = Viz(this.querySelector("script").innerHTML)
    } catch(e) {
      div.innerHTML =`<lively-error>${e}</lively-error>`
    }
  }
  onExtentChanged() {
    // this.updateViz()
  }

  async livelyExample() {
    this.innerHTML = `<script type="graphviz">digraph {
      a -> b
      b -> c
      c -> a}
    </script>`
    this.updateViz()
  }

  livelyMigrate(other) {

  }
}
