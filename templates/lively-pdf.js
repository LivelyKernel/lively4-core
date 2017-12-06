'use strict';
import Morph from 'src/components/widgets/lively-morph.js';
import pdf from "src/external/pdf.js"
// see https://gist.github.com/yurydelendik/c6152fa75049d5c8f62f

export default class LivelyPDF extends Morph {
  initialize() {
    pdf.onLoad().then(()=> {
      this.isLoaded = true
      if (this.getAttribute("src")) {
        lively.notify("onload");
        this.setURL(this.getAttribute("src"));
      }
    })
    
    if (this.getAttribute("overflow")) {
      this.get("#container").style.overflow = this.getAttribute("overflow")
    }
    lively.addEventListener("pdf", this, "extent-changed", 
      (e) => this.onExtentChanged(e));
  }
  
  async setURL(url) {
    this.setAttribute("src", url)
    
    if (!this.isLoaded) return
    
     var container = this.get('#viewerContainer');
    // (Optionally) enable hyperlinks within PDF files.
    this.pdfLinkService = new PDFJS.PDFLinkService();
    this.pdfViewer = new PDFJS.PDFViewer({
      container: container,
      linkService: this.pdfLinkService
    });
    
    this.pdfLinkService.setViewer(this.pdfViewer);
    container.addEventListener('pagesinit',  () => {
      // We can use pdfViewer now, e.g. let's change default scale.
      this.pdfViewer.currentScaleValue = 'page-width';
    });
    // Loading document.
    var that = this;
    fetch(url).then(response => {
      return response.blob();
    }).then(blob => {
      return URL.createObjectURL(blob);
    }).then(base64pdf => {
      PDFJS.getDocument(base64pdf).then(function (pdfDocument) {
        that.pdfViewer.setDocument(pdfDocument);

        that.pdfLinkService.setDocument(pdfDocument, null);
        that.pdfViewer.pagesPromise.then(() => {
          let annotations = that.getAllSubmorphs(".annotationLayer section");
          annotations.forEach((annotation) => {
            lively.addEventListener("pdf", annotation, "click",
                                  (e) => that.onClick(e));
          });
        });
      })
    });
  }
  
  onExtentChanged() {
    this.pdfViewer.currentScaleValue = 'page-width';
  }
  
  onClick(e) {
    this.editAnnotations(e.path[1]);
  }
  
  livelyExample() {
    this.setURL("https://lively-kernel.org/publications/media/KrahnIngallsHirschfeldLinckePalacz_2009_LivelyWikiADevelopmentEnvironmentForCreatingAndSharingActiveWebContent_AcmDL.pdf")
  }
  
  livelyMigrate(other) {
    //  this.setURL(other.getURL())
  }
  
  editAnnotations(annotationSection) {
    let annotationId = annotationSection.dataset.annotationId;
    annotationId = annotationId.match(/\d+/g)[0];
    let url = this.getAttribute("src");
    /*let url = "https://lively-kernel.org/lively4/lively4-pdf-annotator/doc/WebDev2017/project_3/annotations.pdf";
    let newUrl = "https://lively-kernel.org/lively4/lively4-pdf-annotator/doc/WebDev2017/project_3/annotations2.pdf";*/
    fetch(url).then(response => {
      return response.blob();
    }).then(blob => {
      let fileReader = new FileReader();
      fileReader.addEventListener('loadend', function() {
        let pdfText = atob(fileReader.result.replace("data:application/pdf;base64,", ""));
        let annotationRegex = new RegExp("^(" + annotationId + "\\s\\d\\sobj)", "mg");
        let startSubstr = pdfText.substring(pdfText.search(annotationRegex));
        let annotation = startSubstr.substring(0, startSubstr.indexOf('endobj') + 6);
        let newAnnotation = "";
        let replaceRegex = /\/\Contents\s\([^\)]+\)/gm;
            
        //console.log(annotation.match(replaceRegex));
        //console.log(replaceRegex.exec(annotation));
        
        let newValue = window.prompt('Please enter the new value');
        if(newValue !== null) {
          newAnnotation = annotation.replace(replaceRegex, "/Contents (" + newValue + ")");  
        }
        
        //console.log(annotation);
        
        let newPdfText = pdfText.replace(annotation, newAnnotation);
        let newPdfData = "data:application/pdf;base64," + btoa(newPdfText);
        fetch(newPdfData).then(response => response.blob()).then(newBlob => {
          fetch(url, {method: 'PUT', body: newBlob });
        });
      });
      
      fileReader.readAsDataURL(blob);
    });
  }
}