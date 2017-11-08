'use strict';

import Morph from './Morph.js';
import pdf from "src/external/pdf.js"

// see https://gist.github.com/yurydelendik/c6152fa75049d5c8f62f

export default class LivelyPDF extends Morph {

  initialize() {

    pdf.onLoad().then(()=> {
      this.isLoaded = true

      if (this.getAttribute("src")) {
        lively.notify("onload")
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
    PDFJS.getDocument(url).then(function (pdfDocument) {
        pdfViewer.setDocument(pdfDocument);
    
        pdfLinkService.setDocument(pdfDocument, null);
    });
  }

  onExtentChanged() {
    this.pdfViewer.currentScaleValue = 'page-width';
  }

  livelyExample() {
    this.setURL("https://lively-kernel.org/publications/media/KrahnIngallsHirschfeldLinckePalacz_2009_LivelyWikiADevelopmentEnvironmentForCreatingAndSharingActiveWebContent_AcmDL.pdf")
  }

  livelyMigrate(other) {
    //  this.setURL(other.getURL())
  }


}
