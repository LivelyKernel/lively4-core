'use strict';

import Morph from './Morph.js';
import pdf from "src/external/pdf.js"

// see https://gist.github.com/yurydelendik/c6152fa75049d5c8f62f

export default class LivelyPDF extends Morph {

  initialize() {
    this.zoom = 7;

    if (this.getAttribute("src")) {
      pdf.onLoad().then(()=> {
        lively.notify("onload")
        this.setURL(this.getAttribute("src"));
      })
    }
    
    if (this.getAttribute("overflow")) {
      this.get("#container").style.overflow = this.getAttribute("overflow")
    }
    
    lively.addEventListener("pdf", this, "extent-changed", 
      (e) => this.onExtentChanged(e));
  }

  async setURL(url) {
    this.setAttribute("src", url)
    
     var container = this.get('#viewerContainer');
    // (Optionally) enable hyperlinks within PDF files.
    this.pdfLinkService = new PDFJS.PDFLinkService();
    this.pdfViewer = new PDFJS.PDFViewer({
      container: container,
      renderer: 'canvas', //svg
      linkService: this.pdfLinkService,
      enhanceTextSelection: true
    });
    this.pdfLinkService.setViewer(this.pdfViewer);
    container.addEventListener('pagesinit',  () => {
      // We can use pdfViewer now, e.g. let's change default scale.
      this.pdfViewer.currentScaleValue = 'page-width';
    });
    // Loading document.
    this.pdf = await PDFJS.getDocument(url);

    this.pdfViewer.setDocument(this.pdf);
    this.pdfLinkService.setDocument(this.pdf, null);
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
