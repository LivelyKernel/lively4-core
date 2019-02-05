import Rasterize from "src/client/rasterize.js"
/* globals GraphViewer */

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js'

import Files from "src/client/files.js"
import {pt} from 'src/client/graphics.js'

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
            // Is ugly, because we do it ourselfs... and we don't need it any more
            // ["save es png", () => {
            //     this.saveAsPng()   
            // },"", '<i class="fa fa-file-image-o" aria-hidden="true"></i>'],
            ["edit @ drawio", () => {
                this.editAtDrawIO()   
            },"", '<i class="fa fa-pencil" aria-hidden="true"></i>'],
            ["export as pdf", () => {
                this.exportAsPDF()   
            }, "", '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>'],
        ]);
      menu.openIn(document.body, evt, this);
      return 
    }
  }
  
  
  update() {
    if (!this.src) return
    var url = this.src
    this.get("#drawio").innerHTML = `<div class="mxgraph" style="border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;target&quot;:&quot;blank&quot;,&quot;lightbox&quot;:false,&quot;nav&quot;:true,&quot;zoom&quot;:1,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;false&quot;,&quot;edit&quot;:&quot;_blank&quot;,&quot;url&quot;:&quot;${url}&quot;}"></div>`
  
    if (!self.GraphViewer) {
      console.warn("draw.io view not loaded")
    } else {
      GraphViewer.createViewerForElement(this.get(".mxgraph"));
    }
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
    var oldTransform = svgElement.transform
    var oldTransformOrigin = svgElement.transformOrigin
    
    var zoom = 3
    svgElement.style.transform = `scale(${zoom})`
    svgElement.style.transformOrigin = "0 0"
    await lively.sleep(0)
    try {
      await Rasterize.elementToURL(svgElement, baseURL + name, 1)
    } finally {
      svgElement.style.transform = oldTransform
      svgElement.style.transformOrigin = oldTransformOrigin
    }
    
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

  async editAtDrawIO(useIFrame=true) {
    if (!this.src) throw new Error("src attribute not set");

    var drawioURL;
    var githubInfo = await Files.githubFileInfo(this.src)
    if (githubInfo) {
      if (!githubInfo.remoteURL || !githubInfo.branch || !githubInfo.path) {
        throw new Error("Github fileInfo not complete: " + JSON.stringify(githubInfo))
      }

      var githubPath = githubInfo.remoteURL.replace(/https:\/\/github.com\//,"").replace(/git@github.com:/,"").replace(/\.git/,"") + "/" +  githubInfo.branch + githubInfo.path
      drawioURL = "https://www.draw.io/#H" +encodeURIComponent(githubPath)
    }
    
    var githubPrefix = "https://raw.githubusercontent.com/"    
    if (this.src.match(githubPrefix)) {
      
      
      // JensLincke%2Fdrawio-figures%2Fmaster%2Fcontextjs_promises_01.xml
      drawioURL = "https://www.draw.io/#H" +
          encodeURIComponent(this.src.replace(githubPrefix, ""))
    } 
    if (drawioURL) {
      if (useIFrame) {
        var iFrame = await lively.openComponentInWindow("lively-iframe")
        lively.setExtent(iFrame.parentElement, pt(1200,800))
        iFrame.setURL(drawioURL)
      } else {
        window.open(drawioURL)
      }
    } else {
      lively.notify("editing not supported for", this.src)
    }
  }
  
  async updateSourceFromGithub() {
    if (!this.src) throw new Error("src attribute not set");
    var githubInfo = await Files.checkoutGithubFile(this.src)  
  }
  
  
  
  async exportAsPDF() {
    var targetURL = this.src.replace(/xml$/,"pdf") // #Warning override without asking... yeah we need sharp tools!
    if (await lively.confirm("save as " + targetURL)) {
      var dataURL = await this.getPDFDataURL()
      // or maybe we should ask ...
      await lively.files.copyURLtoURL(dataURL, targetURL)
      lively.notify("finisihed exporting pdf")
      
      var container = lively.query(this, "lively-container")
      if (container) container.navbar().update()
    }
  }
  
  async getPDFDataURL() {
    // var form =  new FormData();
    var source = await fetch(this.src).then(r => r.text())
    var filename = this.src.replace(/.*\//,"")
    
    var xform = ""
    var config = {
      format: "pdf",
      bg: "#ffffff",
      base64: 1,
      embedXml: 0,
      xml: encodeURIComponent(source),
      filename: filename
    }
    xform = Object.keys(config).map(key => {
      return key + "=" + config[key] 
    }).join("&")
        
    var convertToPDFRequest = fetch("https://exp.draw.io/ImageExport4/export", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: xform,
    })
    var resp = await convertToPDFRequest
    var text = await resp.text()
    var dataURL = "data:application/pdf;base64,"+text
    return dataURL
  
  // fetch("data:application/pdf;base64,"+text).then(r => r.blob()).then(blob => {
  //   fetch("https://lively-kernel.org/lively4/lively4-jens/doc/figures/test.pdf", 
  //     {
  //       method: "PUT",
  //       body: blob
  //   })  
  // })
  }
  
  
  
   
  async livelyExample() {
    // this.src = "https://lively-kernel.org/lively4/lively4-jens/doc/figures/testdrawio.xml"
    this.src = "https://raw.githubusercontent.com/JensLincke/drawio-figures/master/contextjs_promises_01.xml"
    // this.src = "https://raw.githubusercontent.com/JensLincke/drawio-figures/master/contextjs_promises_02.xml"
    // this.edit = "https://www.draw.io/#HJensLincke%2Fdrawio-figures%2Fmaster%2Fcontextjs_promises_01.xml"
    
    
  }
  
}