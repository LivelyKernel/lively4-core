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
        lively.addEventListener("pdf", that.getSubmorph("#pdf-add-button"), "click",
                              () => that.onPdfAdd());
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
  
  onPdfAdd() {
    if (this.shadowRoot.getSelection().rangeCount > 0) {
      let content = window.prompt('Please enter the content');
      let scale = this.pdfViewer._pages[0].viewport.scale;
      let selectionCoords = this.shadowRoot.getSelection().getRangeAt(0).getBoundingClientRect();
      let pageCoords = this.shadowRoot.querySelector('.page:first-child .canvasWrapper').getBoundingClientRect();
      
      // Calculate coords of the selection depending on the PDF scale 
      let scaledSelectionCoords = {
        topLeftX: (selectionCoords.x - pageCoords.x) / scale,
        topLeftY: (pageCoords.bottom - selectionCoords.y) / scale,
        topRightX: (selectionCoords.x - pageCoords.x + selectionCoords.width) / scale,
        topRightY: (pageCoords.bottom - selectionCoords.y) / scale,
        bottomLeftX: (selectionCoords.x - pageCoords.x) / scale,
        bottomLeftY: (pageCoords.bottom - selectionCoords.y - selectionCoords.height) / scale,
        bottomRightX: (selectionCoords.x - pageCoords.x + selectionCoords.width) / scale,
        bottomRightY: (pageCoords.bottom - selectionCoords.y - selectionCoords.height) / scale 
      };
      
      // Create new anntotaion string which can later be inserted
      let [newAnnotationId, newPopupId] = this.getNewAnnoationIds();
      let [rawAnnotation, rawPopupAnnotation] = this.createAnnotationsObjects(selectionCoords, newAnnotationId, newPopupId, content);
      
      // Get currentPage object in PDF 
      let currentPageNumber = this.shadowRoot.getSelection().anchorNode.parentNode.parentNode.parentNode.dataset.pageNumber;
      let currentPageRegex = new RegExp("^<<\\s\\/Type\\s\\/Page\\s.*\\n*.*>>$", 'gm');
      let currentPageString = this.editedPdfText.match(currentPageRegex)[currentPageNumber - 1];
      
      // Check for an existing annotations array
      if (currentPageString.indexOf('/Annots') === -1) {
        // Since there are no annotations we have to create a new annotations array
        let lastWhiteSpaceRegEx = new RegExp("(\\s)>>", "gm");
        let lastWhiteSpace = this.editedPdfText.match(lastWhiteSpaceRegEx)[0];
        let newAnnoationsArray = " /Annots [ " + newAnnotationId + " 0 R " + newPopupId + " 0 R ] ";
      
        this.editedPdfText = this.editedPdfText.replace(lastWhiteSpace, newAnnoationsArray);
      }
      else {
        // Get annotations array
        let annotationsArrayReferenceRegEx = new RegExp("/Annots\\s(\\d+)\\s\\d+", "gm");
        let annotationsArrayReference = annotationsArrayReferenceRegEx.exec(currentPageString)[1];
        
        let annotationsArrayRegEx = new RegExp("^(" + annotationsArrayReference + "\\s\\d\\sobj\\n*.*\\n*endobj)", "mg");
        let annotationsArray = this.editedPdfText.match(annotationsArrayRegEx)[0];
        
        // Insert the new IDs into the array
        let newAnnoationsArray = annotationsArray.replace(" ]", " " + newAnnotationId + " 0 R " + newPopupId + " 0 R ]");
        this.editedPdfText = this.editedPdfText.replace(annotationsArray, newAnnoationsArray); 
      }
               
      this.editedPdfText = this.editedPdfText.replace('xref', rawPopupAnnotation + rawAnnotation + "xref");
      this.setChangeIndicator(true);
      this.savePdf();      
    }
  }
  
  onPdfSave() {
    this.savePdf();
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
  
  savePdf() {
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
    
  setChangeIndicator(contentChanged) {
    let livelyContainer = this.parentElement;
    livelyContainer.contentChanged = contentChanged;
    livelyContainer.updateChangeIndicator();
  }
  
  createAnnotationObjects(scaledSelectionCoords, newAnnotationId, newPopupId, content) {
      let rawAnnotation = newAnnotationId + " 0 obj\n\
<< /Type /Annot /Popup " + newPopupId + " 0 R /Rect [ " 
          + scaledSelectionCoords.bottomLeftX + " " 
          + scaledSelectionCoords.bottomLeftY + " "
          + scaledSelectionCoords.topRightX + " " 
          + scaledSelectionCoords.topRightY
        + " ] /Contents (" + content + ") /C [ 0.9709861 0.7674150 0.2850983 ] /F 4 /QuadPoints [ " 
          + scaledSelectionCoords.topLeftX + " " 
          + scaledSelectionCoords.topLeftY + " "
          + scaledSelectionCoords.topRightX + " " 
          + scaledSelectionCoords.topRightY + " "
          + scaledSelectionCoords.bottomLeftX + " " 
          + scaledSelectionCoords.bottomLeftY + " " 
          + scaledSelectionCoords.bottomRightX + " " 
          + scaledSelectionCoords.bottomRightY
        + " ] /Subtype /Highlight >>\n\
endobj\n";
      
      let rawPopupAnnotation = newPopupId + " 0 obj\n\
<< /Parent " + newAnnotationId + " 0 R /Type /Annot /Open true /Subtype /Popup /Rect [" 
      + (scaledSelectionCoords.topRightX + 4) + " " 
      + scaledSelectionCoords.topRightY + " " 
      + (scaledSelectionCoords.bottomRightX + 132) + " " 
      + (scaledSelectionCoords.topRightY + 72) 
      + " ] >>\n\
endobj\n";  
    
    return new Array(rawAnnotation, rawPopupAnnotation);
  }
  
  enableEditMode() {
    let editButton = this.getSubmorph("#pdf-edit-button");
    let addButton = this.getSubmorph("#pdf-add-button");
    let saveButton = this.getSubmorph("#pdf-save-button");
    let cancelButton = this.getSubmorph("#pdf-cancel-button");
    
    editButton.classList.add("-edit--active");
    editButton.setAttribute("disabled", "true");
    addButton.removeAttribute('disabled');
    saveButton.removeAttribute("disabled");
    cancelButton.removeAttribute("disabled");
  }
  
  disableEditMode() {
    let editButton = this.getSubmorph("#pdf-edit-button");
    let addButton = this.getSubmorph("#pdf-add-button");
    let saveButton = this.getSubmorph("#pdf-save-button");
    let cancelButton = this.getSubmorph("#pdf-cancel-button");
    
    editButton.classList.remove("-edit--active");
    editButton.removeAttribute("disabled");
    addButton.setAttribute('disabled', 'true');
    saveButton.setAttribute("disabled", "true");
    cancelButton.setAttribute("disabled", "true");
  }
  
  getNewAnnoationIds() {
    // Optimization based on the assumption that 
    // there are no 1000 annotations within the PDF
    let id1 = 1000;
    while(this.editedPdfText.indexOf(id1 + ' 0 obj') !== -1) {
      id1++;
    }
    let id2 = id1 + 1;
    while(this.editedPdfText.indexOf(id2 + ' 0 obj') !== -1) {
      id2++;
    }
    
    return new Array(id1, id2);
  }
  
  livelyExample() {
    this.setURL("https://lively-kernel.org/publications/media/KrahnIngallsHirschfeldLinckePalacz_2009_LivelyWikiADevelopmentEnvironmentForCreatingAndSharingActiveWebContent_AcmDL.pdf")
  }
  
  livelyMigrate(other) {
    //  this.setURL(other.getURL())
  }
}
