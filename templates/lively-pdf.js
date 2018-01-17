'use strict';
import Morph from 'src/components/widgets/lively-morph.js';
import pdf from "src/external/pdf.js"
// see https://gist.github.com/yurydelendik/c6152fa75049d5c8f62f

var eventFunctionObject;

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
    
    // Store event object to be able to remove the listener later 
    eventFunctionObject = this.onAnnotationClick.bind(this);
  }
  
  async setURL(url) {
    this.setAttribute("src", url)
    
    if (!this.isLoaded) return
    
    var container = this.get('#viewerContainer');
    this.pdfLinkService = new PDFJS.PDFLinkService();
    this.pdfViewer = new PDFJS.PDFViewer({
      container: container,
      linkService: this.pdfLinkService
    });
    
    this.pdfLinkService.setViewer(this.pdfViewer);
    container.addEventListener('pagesinit',  () => {
      this.pdfViewer.currentScaleValue = 'page-width';
    });
    
    // Loading document
    // Load a blob, transform the blob into base64
    // Base64 is the format we need since it is editable and can be shown by PDFJS at the same time.
    var that = this;
    fetch(url).then(response => {
      return response.blob();
    }).then(blob => {
      let fileReader = new FileReader();
      fileReader.addEventListener('loadend', function() {
        that.editedPdfText = atob(fileReader.result.replace("data:application/pdf;base64,", ""));
        that.originalPdfText = that.editedPdfText;
      });
      
      fileReader.readAsDataURL(blob);
      return URL.createObjectURL(blob);
    }).then(base64pdf => {
      PDFJS.getDocument(base64pdf).then(function (pdfDocument) {
        that.pdfViewer.setDocument(pdfDocument);
        that.pdfLinkService.setDocument(pdfDocument, null);
    
        // Register event handlers for edit mode for annotations
        lively.addEventListener("pdf", that.getSubmorph("#pdf-edit-button"), "click",
                              () => that.onPdfEdit());
        lively.addEventListener("pdf", that.getSubmorph("#pdf-save-button"), "click",
                              () => that.onPdfSave());
        lively.addEventListener("pdf", that.getSubmorph("#pdf-cancel-button"), "click",
                              () => that.onPdfCancel());
      });
    });
    
    // Update change indicator
    this.setChangeIndicator(false);    
  }
  
  onExtentChanged() {
    this.pdfViewer.currentScaleValue = 'page-width';
  }  
  
  onAnnotationClick(e) {
    this.editAnnotation(e.path[0]);
  }
  
  editAnnotation(annotationSection) {
    let annotationId = annotationSection.dataset.annotationId.match(/\d+/g)[0];
    
    // Get annotation in PDF by ID
    let annotationRegex = new RegExp("^(" + annotationId + "\\s\\d\\sobj)", "mg");
    let startSubstr = this.editedPdfText.substring(this.editedPdfText.search(annotationRegex));
    let annotation = startSubstr.substring(0, startSubstr.indexOf('endobj') + 6);
    let replaceRegex = new RegExp("\\/Contents\\s\\([^\\)]+\\)", "gm");

    let newValue = window.prompt('Please enter the new value');
    let newAnnotation = "";
    
    if(newValue !== null) {
      // Replace annotation with new text
      this.setChangeIndicator(true);
      newAnnotation = annotation.replace(replaceRegex, "/Contents (" + newValue + ")");  

      this.editedPdfText = this.editedPdfText.replace(annotation, newAnnotation);
      this.setChangeIndicator(true);
    }
  }
  
  setChangeIndicator(contentChanged) {
    let livelyContainer = this.parentElement;
    livelyContainer.contentChanged = contentChanged;
    livelyContainer.updateChangeIndicator();
  }
  
  onPdfEdit() {
    this.enableEditMode();
    let that = this;
    
    this.pdfViewer.pagesPromise.then(() => {
      let annotations = that.getAllSubmorphs(".annotationLayer section.highlightAnnotation");
      annotations.forEach((annotation) => {
        lively.addEventListener("pdf", annotation, "click", eventFunctionObject);
      });
    });
  }
  
  onPdfSave() {
    let url = this.getAttribute("src");
    let newPdfData = "data:application/pdf;base64," + btoa(this.editedPdfText);
    let that = this;
    
    // Convert edited base64 back to Blob and write into PDF
    fetch(newPdfData).then(response => response.blob()).then(newBlob => {
      fetch(url, {method: 'PUT', body: newBlob }).then(() => {
        PDFJS.getDocument(newPdfData).then(function (pdfDocument) {
          that.pdfViewer.setDocument(pdfDocument);
          that.pdfLinkService.setDocument(pdfDocument, null); 
          that.onPdfEdit();
        });
        
        that.setChangeIndicator(false);
      });
    });
  }
  
  onPdfCancel() {
    this.disableEditMode(); 
    
    this.editedPdfText = this.originalPdfText;
    // Remove event listener
    let annotations = this.getAllSubmorphs(".annotationLayer section.highlightAnnotation");
    annotations.forEach((annotation) => {
      lively.removeEventListener("pdf", annotation, "click", eventFunctionObject);
    });
  }
  
  enableEditMode() {
    let editButton = this.getSubmorph("#pdf-edit-button");
    let saveButton = this.getSubmorph("#pdf-save-button");
    let cancelButton = this.getSubmorph("#pdf-cancel-button");
    
    editButton.classList.add("-edit--active");
    editButton.setAttribute("disabled", "true");
    saveButton.removeAttribute("disabled");
    cancelButton.removeAttribute("disabled");
  }
  
  disableEditMode() {
    let editButton = this.getSubmorph("#pdf-edit-button");  
    let saveButton = this.getSubmorph("#pdf-save-button");
    let cancelButton = this.getSubmorph("#pdf-cancel-button");
    
    editButton.classList.remove("-edit--active");
    editButton.removeAttribute("disabled");
    saveButton.setAttribute("disabled", "true");
    cancelButton.setAttribute("disabled", "true");
  }
  
  livelyExample() {
    this.setURL("https://lively-kernel.org/publications/media/KrahnIngallsHirschfeldLinckePalacz_2009_LivelyWikiADevelopmentEnvironmentForCreatingAndSharingActiveWebContent_AcmDL.pdf")
  }
  
  livelyMigrate(other) {
    //  this.setURL(other.getURL())
  }
}
