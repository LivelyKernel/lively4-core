import Morph from "src/components/widgets/lively-morph.js"
import { debounce } from "utils";

/* Plain GraphiViz Dot Wrapper Component */


export default class GraphvizDot extends Morph {

  async initialize() {
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
  
  useServer() {
    return this.getAttribute("server") == "true"
  }
    
  getEngine() {
    return  this.getAttribute("engine") || "dot"
  }
  
  async updateViz() {
    var svgContainer = this.get("#container")
    svgContainer.style.width = this.style.width // hard to find out how to do this in CSS, ... with "relative"
    svgContainer.style.height = this.style.height
    

    var bounds = this.getBoundingClientRect()
    var div = this.get("#graph")
    
    var sourceContainer = this.querySelector("script")
    if (sourceContainer) {
      var source  = sourceContainer.innerHTML
    }
    if (!source) return

    div.innerHTML = "layouting... wait for it"
    
    if (this.useServer()) {
      var svgResultResp = await fetch(lively4url.replace(/[^/]+$/,"") +"/_graphviz/", {
        method: "POST",
        headers: {
          graphtype: "svg",
          graphlayout:  this.getEngine()
        },
        body: source
      })
      var result = await svgResultResp.text()
      if (svgResultResp.status == 200) {
          div.innerHTML  = result
      } else {
          div.innerHTML  =  <lively-error>${result}</lively-error>
      }
      
      
    } else {
      
      var options = {
        engine: this.getEngine(),
        totalMemory: 32 * 1024 * 1024 
      }

      try {
        div.innerHTML = Viz(source, options)
      } catch(e) {
        div.innerHTML =`<lively-error>${e}</lively-error>`
      }
    }    
  }
  onExtentChanged() {
    // this.updateViz()
  }

  async livelyExample() {
    this.setAttribute("engine", "neato")
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
