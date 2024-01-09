import Morph from "src/components/widgets/lively-morph.js"
import { debounce } from "utils";

/*MD # Plain GraphiViz Dot Wrapper Component 

![](graphviz-dot.png){width=200px}

MD*/


if (!window.Viz) {
  await lively.loadJavaScriptThroughDOM("GraphViz", lively4url + "/src/external/viz.js", true)
}

export default class GraphvizDot extends Morph {

  async initialize() {
    this.loaded = new Promise(async (resolve) => {
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
  
  set width(v) {
    this.style.width = v + "px"
    this.updateExtent() 
    return v
  }
  
  get width() {
    return parseFloat(this.style.width)
  }
  
  set height(v) {
    this.style.height = v + "px"
    this.updateExtent() 
    return v
  }
    
  get height() {
    return parseFloat(this.style.height)
  }
  
  updateExtent() {
    var svgContainer = this.get("#container")
    svgContainer.style.width = this.style.width // hard to find out how to do this in CSS, ... with "relative"
    svgContainer.style.height = this.style.height 
  }
  
  
  async updateViz() {
    this.updateExtent()

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
      if (svgResultResp.status == 200) {
        div.innerHTML  = await svgResultResp.text()
      } else {
          div.innerHTML  =  "ERROR" + await svgResultResp.text()
      }
      
      
    } else {
      
      var options = {
        engine: this.getEngine(),
        totalMemory: 32 * 1024 * 1024 
      }

      try {
        div.innerHTML = window.Viz(source, options)
      } catch(e) {
        div.innerHTML =`<lively-error>${e}</lively-error>`
      }
    }    
  }
  onExtentChanged() {
    // this.updateViz()
  }

  setDotData(source) {
    this.innerHTML = `<script type="graphviz">${source}</script>`
    this.updateViz()
  }
  
  async livelyExample() {
    this.setAttribute("engine", "neato")
    this.setDotData(`digraph {
      a -> b
      b -> c
      c -> a}`)
    
    // this.innerHTML = `<script type="graphviz">digraph {
    //   a -> b
    //   b -> c
    //   c -> a}
    // </script>`
    this.updateViz()
  }

  livelyMigrate(other) {

  }
}
