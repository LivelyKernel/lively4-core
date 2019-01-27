import Rasterize from "src/client/rasterize.js"
/* globals GraphViewer */

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js'

import Files from "http://localhost:9005/lively4-core/src/client/files.js"


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
            }],
            ["edit @ drawio", () => {
                this.editAtDrawIO()   
            }]

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
      var githubPath = githubInfo.remoteURL.replace("https://github.com/","") + "/" +  githubInfo.branch + githubInfo.path
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
        iFrame.setURL(drawioURL)
      } else {
        window.open(drawioURL)
      }
    } else {
      lively.notify("editing not supported for", this.src)
    }
  }
  
  async getPDFDataURL() {
    var form =  new FormData();
    var config = {
      format: "pdf",
      bg: "#ffffff",
      base64: 1,
      embedXml: 0,
      xml: "%3Cmxfile%20modified%3D%222019-01-26T19%3A00%3A48.908Z%22%20host%3D%22www.draw.io%22%20agent%3D%22Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F71.0.3578.98%20Safari%2F537.36%22%20version%3D%2210.1.4%22%20etag%3D%22JVROaZdnLW3DEGmiwtOJ%22%20type%3D%22github%22%3E%3Cdiagram%20name%3D%22Page-1%22%20id%3D%2297a40813-6b03-0c74-37c1-0168de264b11%22%3ErZRLb4MwDMc%2FDXeeexxb2nWHTprUw84BXIgWMEpNofv0S5rwGq00TeMAzs924vzj4ARx2e0kq4s3zEA4vpt1TrBxfD%2BKQvXW4GLAc%2FRoQC55ZpA3ggP%2FAgtdSxuewWkWSIiCeD2HKVYVpDRjTEps52FHFPNVa5bDAhxSJpb0g2dUGPoUuSN%2FBZ4XduXItY6EpZ%2B5xKayyzl%2BcLw%2Bxl2yfiobfypYhu0EBVsniCUiGavsYhBa2V41k%2FdyxzuULaGi3yT4JuHMRAN9xde66NJLoUqstZk2ifqs24ITHGqWataqw1esoFKokafMRO8dsn3Sg2VFtsgzSIJugmyFO8ASSF5UiPU%2BWLFsL4V22I4HE%2FZ6FpNDGfKYbYZ8mHlURBlWlNsChQuBVimhvKtSUwoTEKz1BrlqqT1LQLzjiRPHSoUkSISlChDasR46Jkah8zZjz4xzrATPdS7hD72xIcEriId74P6P5r47F93zlqoHN0T%2Fg%2BZqODb81Tf5pwTbbw%3D%3D%3C%2Fdiagram%3E%3C%2Fmxfile%3E",
      filename: "testdrawio.pdf"
    }
    for ( var key in config ) {
      form.append(key, config[key]);
    }
    var convertToPDFRequest = fetch("https://exp.draw.io/ImageExport4/export", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form,
      // body: `format=pdf&bg=#ffffff&base64=1&embedXml=0&xml=%3Cmxfile%20modified%3D%222019-01-26T19%3A00%3A48.908Z%22%20host%3D%22www.draw.io%22%20agent%3D%22Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F71.0.3578.98%20Safari%2F537.36%22%20version%3D%2210.1.4%22%20etag%3D%22JVROaZdnLW3DEGmiwtOJ%22%20type%3D%22github%22%3E%3Cdiagram%20name%3D%22Page-1%22%20id%3D%2297a40813-6b03-0c74-37c1-0168de264b11%22%3ErZRLb4MwDMc%2FDXeeexxb2nWHTprUw84BXIgWMEpNofv0S5rwGq00TeMAzs924vzj4ARx2e0kq4s3zEA4vpt1TrBxfD%2BKQvXW4GLAc%2FRoQC55ZpA3ggP%2FAgtdSxuewWkWSIiCeD2HKVYVpDRjTEps52FHFPNVa5bDAhxSJpb0g2dUGPoUuSN%2FBZ4XduXItY6EpZ%2B5xKayyzl%2BcLw%2Bxl2yfiobfypYhu0EBVsniCUiGavsYhBa2V41k%2FdyxzuULaGi3yT4JuHMRAN9xde66NJLoUqstZk2ifqs24ITHGqWataqw1esoFKokafMRO8dsn3Sg2VFtsgzSIJugmyFO8ASSF5UiPU%2BWLFsL4V22I4HE%2FZ6FpNDGfKYbYZ8mHlURBlWlNsChQuBVimhvKtSUwoTEKz1BrlqqT1LQLzjiRPHSoUkSISlChDasR46Jkah8zZjz4xzrATPdS7hD72xIcEriId74P6P5r47F93zlqoHN0T%2Fg%2BZqODb81Tf5pwTbbw%3D%3D%3C%2Fdiagram%3E%3C%2Fmxfile%3E&filename=testdrawio.pdf`
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