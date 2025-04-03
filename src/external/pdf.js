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

  static async load() {
    // await lively.loadJavaScriptThroughDOM("pdf", "https://lively-kernel.org/lively4/pdfjs-dist/build/pdf.js")
    // PDFJS.workerSrc = "https://lively-kernel.org/lively4/pdfjs-dist/build/pdf.worker.js"
    // await lively.loadJavaScriptThroughDOM("pdfviewer", "https://lively-kernel.org/lively4/pdfjs-dist/web/pdf_viewer.js")

// OLD:
//     window.PDFJS = (await System.import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.js")).default
//     window["pdfjs-dist/build/pdf"] = window.PDFJS // give the viewer a chance to find it....
//     window.PDFJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.worker.js';
//     window.PDFJSViewer = (await System.import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf_viewer.js")).default


// Experimental:
//       var s1 = document.createElement("script")
//       s1.setAttribute("type", "module")
//       s1.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.mjs")
//       document.head.appendChild(s1)

//       var s2 = document.createElement("script")
//       s2.setAttribute("type", "module")
//       s2.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf_viewer.mjs")
//       document.head.appendChild(s2)
    
//     var counter = 0
//     while(true) {
//       if (window.pdfjsLib) break
//       if(counter++ > 10) throw new Error("PDF Load failed.... in time")
//       await lively.sleep(100)
//     }
    
//     window.PDFJS = window.pdfjsLib
//     window.PDFJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.mjs';
//     window.PDFJSViewer = window.pdfjsViewer

    
    

var s1 = document.createElement("script")
s1.setAttribute("type", "module")
s1.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.mjs")
s1.addEventListener('load', () => {
  window.PDFJS = window.pdfjsLib
  window.PDFJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.mjs';

  var s2 = document.createElement("script")
  s2.setAttribute("type", "module")
  s2.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf_viewer.mjs")
  s2.addEventListener('load', () => {
  
    window.PDFJSViewer = window.pdfjsViewer
    
    
    
    this.loaded = window.PDFJS
    if (this.resolveLoad) {
      this.resolveLoad(window.PDFJS)
      delete this.resolveLoad
    } 
    
  })
  document.head.appendChild(s2)
});
document.head.appendChild(s1)








  }
  
}

PDFLoader.load()