import Morph from 'src/components/widgets/lively-morph.js';
import pdf from "src/external/pdf.js"
// see https://gist.github.com/yurydelendik/c6152fa75049d5c8f62f
import ContextMenu from 'src/client/contextmenu.js';
var eventFunctionObject;

export default class LivelyPDF extends Morph {
  initialize() {
    pdf.onLoad().then(()=> {
      this.isLoaded = true
      if (this.getAttribute("src")) {
        this.setURL(this.getAttribute("src"), this.pdfLoaded);
      }
    })
    
    if (this.getAttribute("overflow")) {
      this.get("#container").style.overflow = this.getAttribute("overflow")
    }
    
    lively.addEventListener("pdf", this, "extent-changed", 
      (e) => this.onExtentChanged(e));
    
    // Store event object to be able to remove the listener later 
    eventFunctionObject = this.onAnnotationClick.bind(this);
    
    lively.html.registerKeys(this, "PDF")
  
    this.registerButtons()
    
    this.currentPage = this.currentPage
    
    
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);

  }
  
  onContextMenu(evt) {
     if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();

       
      var menuItems = [
         ["show outline", async () => {
           var workspace = await lively.openWorkspace(this.extractOutline())
          workspace.parentElement.setAttribute("title","Outline")
          workspace.mode = "text"
          }],
       ]
       
      let url = this.getURL()
      let serverURL = lively.files.serverURL(url)
      if (serverURL && serverURL.match("localhost")) {
        // does only make sense when accessing a localhost server, 
        // otherwise a pdf viewer would be opened on a remote machine?
        menuItems.push(["open externally", async () => {
          let buildPath = url.replace(serverURL,"").replace(/^\//,"")
          var openURL = serverURL + "/_open/" + buildPath 
          fetch(openURL)
         }])
      }
      var menu = new ContextMenu(this, menuItems);
      menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  extractOutline() {    
    return this.get("#container").querySelectorAll("div")
      .map(ea => ea.textContent)
      .filter(ea => ea.match(/^\s*[0-9][0-9\.]*\s+[A-Z]/))
      .join("\n")
  }
  
  
  // pageNumber first==1
  getPage(pageNumber) {
    return this.pages().find(ea => ea.getAttribute("data-page-number") == pageNumber)
  }
  
  pages() {
    return Array.from(this.get("#viewerContainer").querySelectorAll(".page"))
  }
  
  showPage(page) {
    if (!page) return;
    this.pages().forEach(ea => ea.hidden = true)
    page.hidden = false
    this.page = page
  }
  
  prevPage() {
    this.currentPage--
    var page = this.getPage(this.currentPage) 
    if (!page) {
      this.currentPage = Number(this.pages().last.getAttribute("data-page-number")) // wrap around
      page = this.getPage(this.currentPage)  
    }
    return page
  }
  
  nextPage() {
    this.currentPage++
    var page = this.getPage(this.currentPage) 
    if (!page) {
      this.currentPage = 1// wrap around
      page = this.getPage(this.currentPage)  
    }
    return page
  }
  
  getCurrentPage() {
    return this.currentPage
  }
  
  setCurrentPage(number) {
    this.currentPage = number
    var page = this.getPage(number) 
    if (page) {
      this.showPage(page)
    }
  }
  
  onUpDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    this.showPage(this.prevPage())
  }

  onLeftDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    this.showPage(this.prevPage())
  }

  
  onDownDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    this.showPage(this.nextPage())
  }
  
  onRightDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    this.showPage(this.nextPage())
  }
  
  onPrevButton() {
    this.showPage(this.prevPage())
  }
  
  onNextButton() {
    this.showPage(this.nextPage())
  }
  
  getURL() {
    return this.getAttribute("src")
  }

  async setURL(url, oldPromise) {
    this.pdfLoaded = oldPromise || (new Promise(resolve => {
      this.resolveLoaded = resolve
    }))
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
    fetch(url).then(response => {
      return response.blob();
    }).then(blob => {
      let fileReader = new FileReader();
      fileReader.addEventListener('loadend', () => {
        this.editedPdfText = atob(fileReader.result.replace("data:application/pdf;base64,", ""));
        this.originalPdfText = this.editedPdfText;
      });
      
      fileReader.readAsDataURL(blob);
      return URL.createObjectURL(blob);
    }).then(base64pdf => {
      PDFJS.getDocument(base64pdf).then(async (pdfDocument) => {
        this.pdfViewer.setDocument(pdfDocument);
        this.pdfLinkService.setDocument(pdfDocument, null);
    
        await this.pdfViewer.pagesPromise
        this.resolveLoaded()
        // #TODO can we advice the pdfView to only render the current page we need?
        // if (this.getAttribute("mode") != "scroll") {
        //   this.currentPage = 1 
        //   this.showPage(this.getPage(this.currentPage))
        // }
      });
    });
    
    // Update change indicator
    this.setChangeIndicator(false); 
    this.deleteMode = false;
  }
  
  
// --------------------------------------------------------------
// Event functions 
// --------------------------------------------------------------
  
  onExtentChanged() {
    this.pdfViewer.currentScaleValue = 'page-width';
  }   
  
  onPdfEditButton() {
    this.setDeleteMode(false);
    this.enableEditMode();
  }
  
  onPdfDeleteButton() {   
    this.disableEditMode(); 
    this.setDeleteMode(!this.deleteMode);
  }
  
  onPdfAddButton() {
    if (this.shadowRoot.getSelection().rangeCount > 0) {
      let currentPageNumber = this.getPageNumber(this.shadowRoot.getSelection());
      let scale = this.pdfViewer._pages[0].viewport.scale;
      let selectionCoords = this.shadowRoot.getSelection().getRangeAt(0).getBoundingClientRect();
      let pageCoords = this.shadowRoot.querySelector('.page:nth-child(' + currentPageNumber + ') .canvasWrapper').getBoundingClientRect();
      
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
      let content = window.prompt('Please enter the content');
      
      // Create new anntotaion string which can later be inserted
      let newAnnotationId = this.getNewId();
      let newPopupId = this.getNewId(newAnnotationId);
      let [rawAnnotation, rawPopupAnnotation] = this.createAnnotationObjects(scaledSelectionCoords, newAnnotationId, newPopupId, content);
      
      // Get the string of the current page object
      let currentPageString = this.getPageString(currentPageNumber);
      
      // New annotations need to be written into the annotations array of a page
      // Create or update the existing annotations array
      this.setAnnotationsArray(currentPageString, newAnnotationId, newPopupId);
               
      this.editedPdfText = this.editedPdfText.replace('xref', rawPopupAnnotation + rawAnnotation + "xref");
      this.setChangeIndicator(true);
      this.savePdf();      
    }
  }
  
  onPdfSaveButton() {
    this.savePdf();
  }
  
  onPdfCancelButton() {
    this.disableEditMode(); 
  }
  
  
// --------------------------------------------------------------
// PDF manipulation functions
// -------------------------------------------------------------- 
  
  onAnnotationClick(e) {
    if(this.deleteMode) {
      this.deleteAnnotation(e.composedPath()[0]);
    } else {
      this.editAnnotation(e.composedPath()[0]);
    }
  }
  
  editAnnotation(annotationSection) {
    let annotationId = annotationSection.dataset.annotationId.match(/\d+/g)[0];
    
    // Get annotation in PDF by ID
    let annotation = this.getObjectString(annotationId);
    
    let replaceRegex = new RegExp("\\/Contents\\s\\([^\\)]+\\)", "gm");

    let newValue = window.prompt('Please enter the new value');
    let newAnnotation = "";
    
    if(newValue !== null) {
      // Replace annotation with new text
      newAnnotation = annotation.replace(replaceRegex, "/Contents (" + newValue + ")");  

      this.editedPdfText = this.editedPdfText.replace(annotation, newAnnotation);
      this.setChangeIndicator(true);
    }
  }
  
   
  deleteAnnotation(annotationSection) {
    let annotationId = annotationSection.dataset.annotationId.match(/\d+/g)[0];
    let popupId = annotationSection.nextSibling.dataset.annotationId.match(/\d+/g)[0];
    
    // Get objects in PDF by ID
    let annotation = this.getObjectString(annotationId);
    let popup = this.getObjectString(popupId);
    
    // Remove actual annotation
    this.editedPdfText = this.editedPdfText.replace(annotation, "");
    this.editedPdfText = this.editedPdfText.replace(popup, "");
    
    this.setChangeIndicator(true);
    
    // Get the annotations array to remove the reference
    let currentPageNumber = annotationSection.parentElement.parentElement.dataset.pageNumber;
    let currentPageString = this.getPageString(currentPageNumber);
    let annotationsArray = this.getAnnotationsArray(currentPageString);
    
    // Remove the reference
    let newAnnotationsArray = annotationsArray.replace(" " + annotationId + " 0 R", "");
    newAnnotationsArray = newAnnotationsArray.replace(" " + popupId + " 0 R", "");
    this.editedPdfText = this.editedPdfText.replace(annotationsArray, newAnnotationsArray);
    
    this.savePdf();
    
    this.setDeleteMode(false);
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
        });
        
        that.originalPdfText = that.editedPdfText;
        that.setChangeIndicator(false);
      });
    });
  }
    
  
// --------------------------------------------------------------
// HELPER METHODS for PDF
// --------------------------------------------------------------
  
  
  setChangeIndicator(contentChanged) {
    let livelyContainer = lively.query(this, "lively-container")
    if (livelyContainer) {
      livelyContainer.contentChanged = contentChanged;
      livelyContainer.updateChangeIndicator();
    }
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
  
  setAnnotationsArray(currentPageString, annotationId, popupId) {
    // Check for an existing annotations array
    if (currentPageString.indexOf('/Annots') === -1) {
      // Since there are no annotations we have to create a new annotations array
      let annotationsArrayId = this.getNewId(popupId);
      let annoationsArrayRef = " /Annots " + annotationsArrayId + " 0 R";
      
      let newPageString = currentPageString.replace(">>", annoationsArrayRef + " >>");
      let newAnnotationsArray = annotationsArrayId + " 0 obj\n [ "
          + annotationId + " 0 R " + popupId + " 0 R ]\nendobj\n";
      
      this.editedPdfText = this.editedPdfText.replace(currentPageString, newPageString);
      this.editedPdfText = this.editedPdfText.replace('xref', newAnnotationsArray + "xref");
    }
    else {
      let annotationsArray = this.getAnnotationsArray(currentPageString);
      
      // Insert the new IDs into the array
      let newAnnoationsArray = annotationsArray.replace(" ]", " " +annotationId + " 0 R " + popupId + " 0 R ]");
      this.editedPdfText = this.editedPdfText.replace(annotationsArray, newAnnoationsArray); 
    }
  }
  
  getAnnotationsArray(currentPageString) {
    let annotationsArrayReferenceRegEx = new RegExp("/Annots\\s(\\d+)\\s\\d+", "gm");
    let annotationsArrayReference = annotationsArrayReferenceRegEx.exec(currentPageString)[1];

    let annotationsArrayRegEx = new RegExp("^(" + annotationsArrayReference + "\\s\\d\\sobj\\n*.*\\n*endobj)", "mg");
    let annotationsArray = this.editedPdfText.match(annotationsArrayRegEx)[0];
    
    return annotationsArray;
  }
  
  getObjectString(id) {
    let regex = new RegExp("^(" + id + "\\s\\d\\sobj)", "mg");
    let startSubstr = this.editedPdfText.substring(this.editedPdfText.search(regex));
    let object = startSubstr.substring(0, startSubstr.indexOf('endobj') + 6);
    return object;
  }
  
  getPageString(pageNumber) {    
    // Get currentPage object (as string) in PDF 
    let pageRegex = new RegExp("^<<\\s\\/Type\\s\\/Page\\s.*\\n*.*>>$", 'gm');
    let pageString = this.editedPdfText.match(pageRegex)[pageNumber - 1];
    
    return pageString;
  }
  
  getPageNumber(selection) {
    return selection.anchorNode.parentNode.parentNode.parentNode.dataset.pageNumber;
  }
  
  getNewId(lastUsedId) {
    // Optimization based on the assumption that 
    // there are no 1000 annotations within the PDF
    let id = (lastUsedId === undefined) ? 1000 : lastUsedId + 1;
    while(this.editedPdfText.indexOf(id + ' 0 obj') !== -1) {
      id++;
    }
    
    return id;
  } 
        
  
// --------------------------------------------------------------
// HELPER METHODS for general use
// --------------------------------------------------------------
  
  
  enableEditMode() {
    let editButton = this.getSubmorph("#pdf-edit-button");
    let saveButton = this.getSubmorph("#pdf-save-button");
    let cancelButton = this.getSubmorph("#pdf-cancel-button");
    let that = this;
    
    editButton.classList.add("-edit--active");
    editButton.setAttribute("disabled", "true");
    saveButton.removeAttribute("disabled");
    cancelButton.removeAttribute("disabled");
    
    this.pdfViewer.pagesPromise.then(() => {
      let annotations = that.getAllSubmorphs(".annotationLayer section.highlightAnnotation");
      annotations.forEach((annotation) => {
        lively.addEventListener("pdf", annotation, "click", eventFunctionObject);
      });
    });
  }
  
  disableEditMode() {
    let editButton = this.getSubmorph("#pdf-edit-button");
    let saveButton = this.getSubmorph("#pdf-save-button");
    let cancelButton = this.getSubmorph("#pdf-cancel-button");
    
    editButton.classList.remove("-edit--active");
    editButton.removeAttribute("disabled");
    saveButton.setAttribute("disabled", "true");
    cancelButton.setAttribute("disabled", "true");
    
    this.editedPdfText = this.originalPdfText;
    // Remove event listener
    let annotations = this.getAllSubmorphs(".annotationLayer section.highlightAnnotation");
    annotations.forEach((annotation) => {
      lively.removeEventListener("pdf", annotation, "click", eventFunctionObject);
    });
  }
  
  setDeleteMode(bool) {
    let deleteButton = this.getSubmorph("#pdf-delete-button");
    let that = this;
    
    if(bool) {
      this.pdfViewer.pagesPromise.then(() => {
        let annotations = that.getAllSubmorphs(".annotationLayer section.highlightAnnotation");
        annotations.forEach((annotation) => {
          lively.addEventListener("pdf", annotation, "click", eventFunctionObject);
        });
      });
      
      deleteButton.classList.add('-delete--active');   
    } else {      
      // Remove event listener
      let annotations = this.getAllSubmorphs(".annotationLayer section.highlightAnnotation");
      annotations.forEach((annotation) => {
        lively.removeEventListener("pdf", annotation, "click", eventFunctionObject);
      });
      
      deleteButton.classList.remove('-delete--active');   
    }  
    
    this.deleteMode = bool;
  }
  
  livelyExample() {
    this.setURL("https://lively-kernel.org/publications/media/KrahnIngallsHirschfeldLinckePalacz_2009_LivelyWikiADevelopmentEnvironmentForCreatingAndSharingActiveWebContent_AcmDL.pdf")
  }
  
  livelyMigrate(other) {
    //  this.setURL(other.getURL())
  }
}
