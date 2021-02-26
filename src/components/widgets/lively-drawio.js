import Rasterize from "src/client/rasterize.js"
/* globals GraphViewer */

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js'

import Files from "src/client/files.js"
import {pt} from 'src/client/graphics.js'

import GitHub from "src/client/github.js"

const DrawioBranch = "drawio"
import Webhook from "src/client/webhook.js"

// import pako from "https://jgraph.github.io/drawio-tools/tools/deflate/pako.min.js"
import pako from "src/external/drawio-pako.min.js"

import XML from "src/client/xml.js"

import Markdown from "src/client/markdown.js"


function stringToBytes(str) {
    var arr = new Array(str.length);
    for (var i = 0; i < str.length; i++){
        arr[i] = str.charCodeAt(i);
    }
    return arr;
}

function bytesToString(arr) {
    var str = '';
    for (var i = 0; i < arr.length; i++){
        str += String.fromCharCode(arr[i]);
    }
    return str;
}

export default class LivelyDrawio extends Morph {
  async initialize() {
    await lively.loadJavaScriptThroughDOM("drawio", "https://www.draw.io/js/viewer.min.js")
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);  
    this._attrObserver = new MutationObserver((mutations) => {
      
    // Install Attribute Observer
    mutations.forEach((mutation) => {  
        if(mutation.type == "attributes") {
          // console.log("observation", mutation.attributeName,mutation.target.getAttribute(mutation.attributeName));
          this.attributeChangedCallback(
            mutation.attributeName,
            mutation.oldValue,
            mutation.target.getAttribute(mutation.attributeName))
        }
      });
    });
    this._attrObserver.observe(this, { attributes: true });
    
    this.update()
  }
  
  
  attributeChangedCallback(attr, oldVal, newVal) {
    this.update()
  }
  
  async updateGithubInfo() {
    this.githubInfo = await Files.githubFileInfo(this.src)
  }
  
  async updateWebhook() {
    if (this.githubInfo) {
      this.webhook = new Webhook(this.githubInfo.user,  this.githubInfo.repo , 
                                 change => this.onWebhook(change))
      await this.webhook.create()
      this.webhook.start()
    }
  }
  
  attachedCallback() {
    this.webhook && this.webhook.start()
  }
  
  detachedCallback() {
    this.webhook && this.webhook.stop()
    
  }

  async onWebhook(change) {
    if (!change || !change.commits) return
    if (change.commits.find(ea => 
          ea.modified.find(path => path == this.githubInfo.path))) {
      this.updateFromDrawIO(change.after)
    }
  }
  
  extractEncodedSource(doc) {
    return doc.querySelector("diagram").textContent
  }
  
  extractSource(doc, prettyPrint) {
    let encoded = this.extractEncodedSource(doc),
      data = atob(encoded),
      source = decodeURIComponent(bytesToString(pako.inflateRaw(data)))
    if (prettyPrint) {
      return XML.prettify(source) 
    }
    return source
  }
  
  encodeSource(source) {
    return btoa(bytesToString(pako.deflateRaw(encodeURIComponent(source))))
  }
  
  async loadXML() {
     var s = await fetch(this.src).then(r => r.text())
     return new DOMParser().parseFromString(s, 'text/xml')
  }

  async saveXML(doc) {
    return await fetch(this.src, {
      method: "PUT",
      body: new XMLSerializer().serializeToString(doc)
    })
  }

  
  async getSource(prettyPrint) {
    return this.extractSource(await this.loadXML(), prettyPrint)
  }
  
  async getGraphModel() {
    var source = await this.getSource()
      return new DOMParser().parseFromString(source, 'text/xml')
  }

  async setGraphModel(model) {
    var source = new XMLSerializer().serializeToString(model)
    return this.setSource(source)
  }

  
  async setSource(source) {
    let doc = await this.loadXML()
    doc.querySelector("diagram").textContent =  this.encodeSource(source) 
    var result = this.saveXML(doc)
    this.update()
    return result
  }
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();
      
      let link = evt.composedPath().find(ea => ea.localName == "a")
      let menu;        
      
      if(link) {
        menu = new ContextMenu(this, [
              ["open", () => {
                  link.click()   
              },"", ''],
          
              ["open in new browser", () => {
                // first try our fixed link
                lively.openBrowser(link.getAttribute("data-href") || link.getAttribute("href"))  
              },"", ''],
          
              
          ]);
      } else {
        menu = new ContextMenu(this, [
              // Is ugly, because we do it ourselfs... and we don't need it any more
              // ["save es png", () => {
              //     this.saveAsPng()   
              // },"", '<i class="fa fa-file-image-o" aria-hidden="true"></i>'],
              ["edit @ drawio", () => {
                  this.editAtDrawIO()   
              },"", '<i class="fa fa-pencil" aria-hidden="true"></i>'],
              ["update from drawio", () => {
                  this.updateFromDrawIO()   
              },"", '<i class="fa fa-pencil" aria-hidden="true"></i>'],

              ["export as pdf", () => {
                  this.exportAsPDF()   
              }, "", '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>'],
          ]);
        
      }
      
      menu.openIn(document.body, evt, this);
      return 
    }
  }
  
  
  async update() {
    if (!this.src) return
    var url = this.src
    this.get("#drawio").innerHTML = `<div class="mxgraph" style="border:1px solid transparent;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;target&quot;:&quot;blank&quot;,&quot;lightbox&quot;:false,&quot;nav&quot;:true,&quot;zoom&quot;:1,&quot;resize&quot;:true,&quot;toolbar&quot;:&quot;false&quot;,&quot;edit&quot;:&quot;_blank&quot;,&quot;url&quot;:&quot;${url}&quot;}"></div>`
  
    if (!self.GraphViewer) {
      console.warn("draw.io view not loaded")
    } else {
      try {
        var root = this.get(".mxgraph")
        
        try {
          await new Promise(resolve => {
              GraphViewer.createViewerForElement(root, resolve);
          })
        } catch(e) {
          console.log("[draw.io] ERROR", e)
        }          
  
        // not needed, because we found the "callback"
        // await lively.sleepUntil(() => this.get("svg"), 2000, 10) 
        
        // Custom fixLinks... 
        var container =   lively.query(this, "lively-container");
        if (container) {
          var containerBase = container.getURL().toString().replace(/[^/]*$/, "")
          
          var base = url.replace(/[^/]*$/, "");
          
          if (!base.match(/^[A-Za-z0-9]+\:/)) {
            base = containerBase + base // my base is relative...
          }
          

          var wrongBase = window.location.toString().replace(/[^/]*$/, "");
          var links = this.get("#drawio").querySelectorAll("a")
          for(let a of links) {
            let href= a.getAttribute("href")
            
            if (!href) continue;
            href = href.replace(wrongBase,"")

            // console.log("[drawio] I guess this is better: " + a.getAttribute("href") + " --> " + href)
                        
            let absoluteLink = href.match(/^[A-Za-z0-9]+\:/)
            a.removeAttribute("href") // #Hack, I don't know why we can't prevent this navigation.... last resort: remove the href
            let fixedRef
            if (absoluteLink) {
               fixedRef = href
            } else {
                fixedRef = base + href
            }
            a.setAttribute("data-href", fixedRef) // we fixed it
            
            
            // a.style.border = "1px solid blue" // for DEV
            
            a.style.textDecoration = "underline"
            lively.addEventListener("drawio", a, "click", evt => {
              // link => 
              evt.stopPropagation()
              evt.preventDefault()
              container.followPath(fixedRef)
              return false
            })
            
            // a.parentElement.appendChild(b, a)
            // a.remove()
          }
          
          
          Markdown.parseAndReplaceLatex(root)
          
        } else {
          console.log("[drawio] no container found ")
        }
      } catch(e) {
        console.log("DrawIO Error", e)
      }
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
  
  async updateFromDrawIO(sha) {
    
    var githubInfo = await Files.githubFileInfo(this.src)
    if (githubInfo) {
      var userAndRepository = githubInfo.user +"/" + githubInfo.repo
      var gh = new GitHub(githubInfo.user, githubInfo.repo)

      // create new branch where drawio edits go into....
      await gh.ensureBranch(DrawioBranch, githubInfo.branch)
      
      
      var content = await gh.getContent(githubInfo.path, sha || DrawioBranch)
      // console.log("source: ", this.extractSource(content))
      await lively.files.saveFile(this.src, content)      
      await this.update()
      lively.notify("updated " + this.src)
    }
  }

  async editAtDrawIO(parent) {
    if (!this.src) throw new Error("src attribute not set");

    await this.updateGithubInfo()
    await this.updateWebhook()

    var drawioURL;
    var githubInfo = await Files.githubFileInfo(this.src)
    if (githubInfo) {
      var userAndRepository = githubInfo.user +"/" + githubInfo.repo 
      var gh = new GitHub(githubInfo.user, githubInfo.repo)
      
      // create new branch where drawio edits go into....
      await gh.ensureBranch(DrawioBranch, githubInfo.branch)
      
      var content = await fetch(this.src).then(r => r.text())
      await gh.setFile(githubInfo.path, DrawioBranch, content)
      var githubPath = userAndRepository + "/" +  DrawioBranch + "/" +githubInfo.path
      drawioURL = "https://www.draw.io/#H" +encodeURIComponent(githubPath)
    } else {
      lively.notify("Please login to GitHub!",  "", undefined, () => {
        
        lively.files.withSynctoolDo(comp => {
          comp.login()
        }, lively4url)
      })
      return
    }
    
    
    var githubPrefix = "https://raw.githubusercontent.com/"    
    if (this.src.match(githubPrefix)) {
      
      
      // JensLincke%2Fdrawio-figures%2Fmaster%2Fcontextjs_promises_01.xml
      drawioURL = "https://www.draw.io/#H" +
          encodeURIComponent(this.src.replace(githubPrefix, ""))
    } 
    if (drawioURL) {
      
        // iFrame does not work any more due to some microsoft iframe security restrictions with GitHub?
        /// var iFrame = await(parent ? lively.create("lively-iframe") : lively.openComponentInWindow("lively-iframe"))
        // lively.setExtent(iFrame.parentElement, pt(1200,800))
        // iFrame.setURL(drawioURL)
        window.open(drawioURL)
    } else {
      lively.notify("editing not supported for", this.src)
    }
  }

  
  async exportAsPDF() {
    var targetURL = this.src.replace(/\.[^.]+$/,"") + ".pdf" // #Warning override without asking... yeah we need sharp tools!
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