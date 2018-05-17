import Rasterize from "src/client/rasterize.js"
/* globals GraphViewer */

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js'

export default class LivelyDrawio extends Morph {
  async initialize() {
    await lively.loadJavaScriptThroughDOM("drawio", "https://www.draw.io/js/viewer.min.js")
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);  
    this.update()
  }

  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();
      var menu = new ContextMenu(this, [
            ["save es png", () => {
                this.saveAsPng()   
            }]
        ]);
      menu.openIn(document.body, evt, this);
      return 
    }
  }
  
  update() {
    if (!this.src) return
    var url = this.src
    this.get("#drawio").innerHTML = `<div class="mxgraph" style="border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;target&quot;:&quot;blank&quot;,&quot;lightbox&quot;:false,&quot;nav&quot;:true,&quot;zoom&quot;:2,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;zoom&quot;,&quot;edit&quot;:&quot;_blank&quot;,&quot;url&quot;:&quot;${url}&quot;}"></div>`
  
    if (!self.GraphViewer) {
      throw new Error("draw.io view not loaded")
    }
    GraphViewer.createViewerForElement(this.get(".mxgraph"));
  }
  
  async saveAsPng() {
    var container = lively.query(this, "lively-container");
    if (container) {
      var baseURL = container.getURL().toString().replace(/[^\/]*$/,"");
    } else {
      baseURL = lively4url + "/"
    }
    var svgElement = this.get(".geDiagramContainer svg")
    if (!svgElement) {
      return lively.warn("Cannot export, because SVG element not found")
    }
    var name = this.src.replace(/.*\//,"").replace(/\.xml$/,".png")
    self.LastSVGElement = svgElement
    self.LastURL = baseURL + name
    await Rasterize.elementToURL(svgElement, baseURL + name)
    if (container) {
      container.get("lively-container-navbar").update()
    }
    lively.notify("saved " + name)
  }
  
  get src() {
    return this.getAttribute("src")
  }
  set src(url) {
    this.setAttribute("src", url)
    this.update()
  }

  
  async livelyExample() {
    // this.src = "https://lively-kernel.org/lively4/lively4-jens/doc/figures/testdrawio.xml"
    this.src = "https://raw.githubusercontent.com/JensLincke/drawio-figures/master/contextjs_promises_01.xml"
    // this.src = "https://raw.githubusercontent.com/JensLincke/drawio-figures/master/contextjs_promises_02.xml"
    // this.edit = "https://www.draw.io/#HJensLincke%2Fdrawio-figures%2Fmaster%2Fcontextjs_promises_01.xml"
    
    
  }
  
}