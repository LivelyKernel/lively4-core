// import "./pdf.original.js"

// import "./pdfjs/build/pdf.js"


// just a little wrapper to make the service worker known to pdf.js

// PDFJS.workerSrc = lively4url + "/src/external/pdfjs/build/pdf.worker.js"

export default class PDFLoader {

  static onLoad() {
    return new Promise(resolve => {
      if (this.loaded) resolve(this.loaded)
      else {
        this.resolveLoad = resolve
      }
    })
  }

  static async loadFromLKOrg() {
    await lively.loadJavaScriptThroughDOM("pdf", "https://lively-kernel.org/lively4/pdfjs-dist/build/pdf.js")
    PDFJS.workerSrc = "https://lively-kernel.org/lively4/pdfjs-dist/build/pdf.worker.js"
    
    await lively.loadJavaScriptThroughDOM("pdfviewer", "https://lively-kernel.org/lively4/pdfjs-dist/web/pdf_viewer.js")

    this.loaded = PDFJS
    if (this.resolveLoad) {
      this.resolveLoad(PDFJS)
      delete this.resolveLoad
    } 
  }
  
  
  static async load() {
    await lively.loadJavaScriptThroughDOM("pdf", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.js")
    PDFJS.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.worker.js"
    
    await lively.loadJavaScriptThroughDOM("pdfviewer",
                                          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf_viewer.js")

    this.loaded = PDFJS
    if (this.resolveLoad) {
      this.resolveLoad(PDFJS)
      delete this.resolveLoad
    } 
  }

  
}

PDFLoader.load()