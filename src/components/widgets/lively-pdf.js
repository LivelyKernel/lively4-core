import Morph from 'src/components/widgets/lively-morph.js';

// #TODO
import pdf from "src/external/pdf.js"
// var pdf = {onLoad() { return Promise.resolve({}) }}

// see https://gist.github.com/yurydelendik/c6152fa75049d5c8f62f
import ContextMenu from 'src/client/contextmenu.js';
var eventFunctionObject;

import Strings from "src/client/strings.js"

import { pt, rect } from "src/client/graphics.js"
import Bibliography from "src/client/bibliography.js"
import FileIndex from 'src/client/fileindex.js'

export default class LivelyPDF extends Morph {

  // #important
  initialize() {
    pdf.onLoad().then(() => {
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


    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);

  }
  /*MD ## Accessing MD*/

  getURL() {
    return this.getAttribute("src")
  }

  // #important
  async setURL(url, oldPromise) {
    this.setAttribute("src", url)
    this.pdfLoaded = oldPromise || (new Promise(resolve => {
      this.resolveLoaded = resolve
    }))
    this.updateView()
  }

  async updateView() {
    this.container = lively.query(this, "lively-container")
    var url = this.getURL();

    if (!this.isLoaded) return

    var eventBus = new window.PDFJSViewer.EventBus();
    var container = this.get('#viewerContainer');
    this.pdfLinkService = new window.PDFJSViewer.PDFLinkService({ eventBus });
    this.pdfViewer = new window.PDFJSViewer.PDFViewer({
      eventBus,
      container,
      linkService: this.pdfLinkService,
      renderer: "canvas", // svg canvas
      textLayerMode: 1,
    });
    this.pdfLinkService.setViewer(this.pdfViewer);
    container.addEventListener('pagesinit', () => {
      this.pdfViewer.currentScaleValue = 1;
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
      PDFJS.getDocument(base64pdf).promise.then(async (pdfDocument) => {
        this.pdfDocument = pdfDocument
        this.pdfViewer.setDocument(pdfDocument);
        this.pdfLinkService.setDocument(pdfDocument, null);

        await this.pdfViewer.pagesPromise
        this.resolveLoaded()

        this.updateNavbar()
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


    // DEBUG
    lively.sleep(500).then(() => this.extractAnnotations())
  }

  async updateNavbar() {
    if (this.container) {
      this.navbar = this.container.get("lively-container-navbar")
      this.navbarDetails = this.navbar.get("#details")
      let ul = this.navbarDetails.querySelector("ul")
      if (ul) {
        ul.innerHTML = "" // #TODO, be nicer to other content?     
      }
    } else {
      return
    }

    var outlineNav = this.createNavbarItem(`Outline`, 2)

    var outline = await this.pdfDocument.getOutline()
    var depth = 0
    if (!outline) {
      return
    }
    for (let ea of outline) {
      let eaNav = this.createNavbarItem(ea.title, depth + 1)
      eaNav.addEventListener("click", () => {
        lively.notify("goto " + ea.title)
        let element = this.get("#container").querySelectorAll("span")
          .find(s => s.textContent.replace(/ +/, " ") == ea.title)
        if (element) {
          let pageDiv = lively.allParents(element).find(ea => ea.classList.contains('page'))
          // #BUG lively.query(element, ".page") produces unexpected result here
          if (pageDiv) {
            let pageNum = pageDiv.getAttribute("data-page-number")
            this.setCurrentPage(pageNum)
            lively.notify("set page " + pageNum)
            // lively.showElement(element)
          } else {
            lively.notify("no page found")
          }
        } else {
          lively.notify("nothing found")
        }
      })
    }


  }

  createNavbarItem(name, level = 1) {
    if (this.navbar) {
      var detailsItem = this.navbar.createDetailsItem(name)
      detailsItem.classList.add("subitem")
      detailsItem.classList.add("level" + level)
      var ul = this.navbarDetails.querySelector("ul")
      if (ul) ul.appendChild(detailsItem)
      return detailsItem
    }
  }


  // #important
  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();


      var menuItems = [
        ["print outline", async () => {
          var workspace = await lively.openWorkspace(await this.extractOutline())
          workspace.parentElement.setAttribute("title", "Outline")
          workspace.mode = "text"
        }],
        ["print outline (from text)", async () => {
          var workspace = await lively.openWorkspace(await this.extractOutlineFromText())
          workspace.parentElement.setAttribute("title", "Outline from Text")
          workspace.mode = "text"
        }],
        ["print annotations", async () => {
          var workspace = await lively.openWorkspace(await this.extractAnnotations())
          workspace.parentElement.setAttribute("title", "Annotations")
          workspace.mode = "text"
        }],
        // ["update annotation note file", async () => {
        //   this.updateAnnotationNotes()
        // }],
        ["update excerpt file", async () => {
          this.updateExcerptFile()
        }],
      ]

      let url = this.getURL()
      let serverURL = lively.files.serverURL(url)
      if (serverURL && serverURL.match("localhost")) {
        // does only make sense when accessing a localhost server, 
        // otherwise a pdf viewer would be opened on a remote machine?
        menuItems.push(["open externally", async () => {
          let buildPath = url.replace(serverURL, "").replace(/^\//, "")
          var openURL = serverURL + "/_open/" + buildPath
          fetch(openURL)
        }])
      }
      var menu = new ContextMenu(this, menuItems);
      menu.openIn(document.body, evt, this);
      return true;
    }
  }

  onExtentChanged() {
    if (this.pdfViewer) {
      // #TODO does not work
      // this.pdfViewer.currentScaleValue = lively.getExtent(this).x / lively.getExtent(this.get("canvas")).x
    }
  }

  extractOutlineFromText() {
    return this.get("#container").querySelectorAll("span")
      .map(ea => ea.textContent)
      .filter(ea => ea.match(/^\s*[0-9][0-9\.]*\s+[A-Z]/))
      .join("\n")
  }


  async extractOutline() {
    var outline = await this.pdfDocument.getOutline()
    return this.printOutline(outline)
  }

  async extractAnnotations() {
    return this.printAnnotations(await this.allHighlights())
  }

  async allHighlights() {
    // this.spanifiyTextAllPages()
    var annotations = await this.allAnnotations()
    return annotations.filter(ea => ea.annotation.subtype == "Highlight")
  }

  async allAnnotations() {
    var pages = await this.allPdfPages()
    var annotations = []
    for (var page of pages) {
      var annotationsOnPage = (await page.getAnnotations()).map(ea => {
        return { page: page, annotation: ea }
      });

      annotations.push(...annotationsOnPage)
    }
    return annotations
  }


  printOutline(outline, level = 0) {
    if (!outline || !outline.map) return ""
    return outline.map(ea => {
      var s = Strings.indent("- " + ea.title, level, "  ") + "\n"
      s += this.printOutline(ea.items, level + 1)
      return s
    }).join("")
  }

  getClipRects(section) {
    if (section.__clipRects) return section.__clipRects;
    const { left, top, width, height } = section.getBoundingClientRect();
    section.__clipRects = Array.from(section.querySelectorAll('clipPath>rect')).map(r => {
      var topLeft = pt(left + r.x.baseVal.value * width, top + r.y.baseVal.value * height)
        .addPt(pt(-5, 0)) //  some wiggle room, since css and canvas rendering don't fit
      var botttomRight = topLeft
        .addPt(pt(r.width.baseVal.value * width, r.height.baseVal.value * height))
        .addPt(pt(10, 0)) //  and left
      return rect(topLeft, botttomRight)
    })
    return section.__clipRects;
  }

  debugClipRects(section) {
    this.getClipRects(section).forEach(r => {
      var element = lively.showRect(r, undefined, 10000)
      element.style.backgroundColor = "rgba(0,255,0,0.2)"
      element.textContent = r.height
    })
  }

  debugSection(section, text) {
    var element = lively.showElement(section, 10000)
    element.textContent = "TEXT: " + text
    element.style.fontSize = "6pt"
    element.style.backgroundColor = "rgba(255,255,255,0.6)"
    element.style.color = "blue"
  }

  // pdfs don't change... so we can cache this, I hope
  getCharBounds(node, index) {
    if (!this.charBoundCache) {
      this.charBoundCache = new Map()
    }
    var charBounds = this.charBoundCache.get(node)
    if (!charBounds) {
      charBounds = []
      this.charBoundCache.set(node, charBounds)
    }
    var result = charBounds[index]
    if (!result) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      var r = range.getBoundingClientRect();
      range.detach();
      result = rect(pt(r.x, r.y), pt(r.x + r.width, r.y + r.height))
      charBounds[index] = result
    }
    return result
  }

  collectTextNodes(root) {
    const nodes = [];

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
        nodes.push(node);
      } else {
        node.childNodes.forEach(walk);
      }
    }
    walk(root);
    return nodes;
  }

  cleanExtractedText(chars) {
    return chars.join('')
      .replace(/([a-z])- /, '$1')
      .replace(/ +/g, ' ')
      .replace(/^ /, '')
      .replace(/ $/, '');
  }

  collectHighlightedChars(textNodes, clipRects) {
    const collected = [];
    let lastLineY = null;
    const lineThreshold = 2; // px tolerance for vertical drift

    var firstNode


    for (const tNode of textNodes) {
      const str = tNode.textContent;
      for (let i = 0; i < str.length; i++) {
        const charBounds = this.getCharBounds(tNode, i);
        const center = charBounds.center();

        const hit = clipRects.some(r => r.containsPoint(center));
        if (!hit) continue;

        if (!firstNode) firstNode = tNode;

        // line change detection
        const currentY = Math.round(center.y); // use rounded Y to reduce noise

        if (lastLineY !== null && Math.abs(currentY - lastLineY) > lineThreshold) {
          collected.push(' ');
        }

        collected.push(str[i]);
        lastLineY = currentY;
      }
    }

    return { firstNode, chars: collected };
  }

  collectAnnotationSections(pageElement, annotation) {
    return Array.from(pageElement.querySelectorAll(
      `.annotationLayer section[data-annotation-id="${annotation.id}"]`
    ))
  }

  sortHighlightItems(items) {
    // Sort by page, then DOM order of first text node
    items.sort((a, b) => {
      const pnA = a.page.pageNumber ?? (a.page.pageIndex + 1);
      const pnB = b.page.pageNumber ?? (b.page.pageIndex + 1);
      if (pnA !== pnB) return pnA - pnB;

      if (!a.firstNode || !b.firstNode) return 0;

      const pos = a.firstNode.compareDocumentPosition(b.firstNode);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }


  async extractHighlights(highlights) {
    const items = [];

    for (const { annotation, page } of highlights) {
      await page.getTextContent(); // ensure layout

      const pageElement = this.getPage(page.pageNumber);
      const sections = this.collectAnnotationSections(pageElement, annotation);
      const clipRects = sections.flatMap(sec => this.getClipRects(sec));
      const textLayer = pageElement.querySelector('.textLayer');
      const textNodes = this.collectTextNodes(textLayer);

      const { firstNode, chars } = this.collectHighlightedChars(textNodes, clipRects);

      let text = this.cleanExtractedText(chars);
      if (!text) text = 'NONE';
      this.sortHighlightItems(items)
      items.push({ annotation, page, text, firstNode });
    }
    return items.map(({ firstNode, ...rest }) => rest);
  }
  /*MD <browse://doc/journal/2021-04-28.md> MD*/
  // #important 
  async printAnnotations(highlights, level = 0) {
    var s = "# Annotations\n"
    var highlightedTexts = await this.extractHighlights(highlights)

    for (var ea of highlightedTexts) {
      s += "- Page " + ea.page.pageNumber + ": \"" + ea.text + "\"\n"
      if (ea.annotation.contentsObj && ea.annotation.contentsObj.str) {
        s += "  - NOTE: " + ea.annotation.contentsObj.str + "\n"
      }
    }
    debugger
    return s
  }


  async printExcerpt(highlights, level = 0) {
    let s = "### Marked Text\n";
    const highlightedTexts = await this.extractHighlights(highlights);

    // Group by page number
    const grouped = new Map();
    for (const ea of highlightedTexts) {
      const pageNum = ea.page.pageNumber ?? (ea.page.pageIndex + 1);
      if (!grouped.has(pageNum)) grouped.set(pageNum, []);
      grouped.get(pageNum).push(ea);
    }

    // Output grouped highlights
    for (const [pageNum, entries] of Array.from(grouped.entries()).sort(([a], [b]) => a - b)) {
      s += `\n#### Page ${pageNum}:\n`;
      for (const ea of entries) {
        s += "- <span class='marked'> \"" + ea.text + "\"</span>" + `{.excerpt}\n`;

        if (ea.annotation.contentsObj && ea.annotation.contentsObj.str) {
          s += "  - NOTE: <span class='note'>" + ea.annotation.contentsObj.str + "</span>\n";
        }
      }
    }

    return s;
  }


  printAnnotationNotes(highlightedTexts) {
    var s = ""
    for (var ea of highlightedTexts) {
      s += `Page: ${ea.page.pageNumber}\n`
      s += `Marked: ${ea.text}\n`
      if (ea.annotation.contentsObj && ea.annotation.contentsObj.str) {
        s += `Note: ${ea.annotation.contentsObj.str}\n`
      }
    }
    return s
  }

  /*
    // #Workspace in a Comment
    var url = this.getURL()
    // #META, assign the parameters with value, and given that we selected a suiable element with the halo, we have enough context to contue evaluating expressions in the method...
    // #META  Maybe I should start using the babylonian programming editor?
  */
  // #important
  async generateExceprtTemplate(url) {
    var filename = url.replace(/.*\//, "")
    var citekey = Bibliography.filenameToKey(filename)
    if (citekey) {
      var bibs = await FileIndex.current().db.bibliography.where("key").equals(citekey).toArray()
      if (bibs.length > 0) {
        var entry = bibs[0]
        return ` ## [@${citekey}]<br/>${entry.authors.join(",")}. ${entry.year} <br/> <i>${entry.title}</i>\n\n`
      } else {
        return ` ## [@${citekey}] ${filename} \n\n`
      }
    } else {
      return ` ## ${filename} \n\n`
    }
  }

  async updateExcerptFile() {
    var highlights = await this.allHighlights()
    var highlightedTexts = await this.extractHighlights(highlights)
    var url = this.getURL().replace(/\.pdf/, "") + ".md"

    var s;

    if (await lively.files.exists(url)) {
      s = await lively.files.loadFile(url)
    } else {
      s = await this.generateExceprtTemplate(url)
    }


    var BEGIN = '<!-- BEGIN AUTOGENERATED ANNOTATIONS -->'
    var END = '<!-- END AUTOGENERATED ANNOTATIONS -->'
    var newContent = BEGIN + `\n` +
      `<style data-src="/src/client/lively-excerpt.css"></style>\n` +
      `### [PDF](${this.getURL()}) \n` +
      `### Outline\n` +
      await this.extractOutline() + `\n` +
      await this.printExcerpt(highlightedTexts) + "\n" + END
    var pattern = new RegExp(RegExp.escape(BEGIN) + "(.|[\n\r])*" + RegExp.escape(END), "mg")
    s = s.replace(pattern, "")
    s += newContent

    await lively.files.saveFile(url, s)
    lively.notify("updated excerpt ", url.replace(/.*\//, ""), 5, () => lively.openBrowser(url), "green")
  }

  async updateAnnotationNotes() {
    var highlights = await this.allHighlights()
    var highlightedTexts = await this.extractHighlights(highlights)
    var source = this.printAnnotationNotes(highlightedTexts)
    var url = this.getURL().replace(/\.pdf/, "") + ".note"
    await lively.files.saveFile(url, source)
    lively.notify("updated notes ", url.replace(/.*\//, ""))
  }

  /* 
    replaces the text content of a span with little spans that contain only one char.
    This is very useful for getting the bounding boxes of characters. 
    
    Example: <span>hello world</span> 
      -> <span><span class="char">h</span><span class="char">e</span>...</span>
  */
  spanifiyTextAllPages() {
    for (var page of this.pages()) {
      var textLayer = page.querySelector(".textLayer")
      if (!textLayer) continue;
      var spans = textLayer.querySelectorAll("span").filter(ea => !ea.classList.contains("char"))
      for (var span of spans) {
        span.style.border = "1px solid red"
        span.style.position = "relative"
        for (var node of span.childNodes) {
          if (node instanceof Text) {
            var text = node.textContent
            var newContent = text.split("").map(ea => (<span class="char">{ea}</span>))
            node.remove()
            newContent.forEach(ea => {
              // ea.style.border = "1px solid blue"
              // ea.style.color = "blue"
              // ea.style.transform = ""
              // ea.style.top = ""
              // ea.style.left = 
              span.appendChild(ea)
            })
          }
        }
        // some headings don't have whitespace in it's spans...
        span.appendChild(<span class="char space"> </span>) // and add additional whitespace for a good measure...
      }

    }
  }

  /*MD ## Pages MD*/

  // pageNumber first==1
  getPage(pageNumber) {
    return this.pages().find(ea => ea.getAttribute("data-page-number") == pageNumber)
  }

  pages() {
    return Array.from(this.get("#viewerContainer").querySelectorAll(".page"))
  }


  async allPdfPages() {
    var pages = [];
    for (var i = 1; i <= this.pdfDocument.numPages; i++) {
      pages.push(await this.pdfDocument.getPage(i))
    }
    return pages
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
      this.currentPage = 1 // wrap around
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

  /*MD ## Keyboard Navigation MD*/

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

  /*MD ## Edit PDF / Annotations MD*/

  // #deprecated
  onPdfEditButton() {
    this.setDeleteMode(false);
    this.enableEditMode();
  }

  // #deprecated
  onPdfDeleteButton() {
    this.disableEditMode();
    this.setDeleteMode(!this.deleteMode);
  }

  // #deprecated
  onPdfAddButton() {
    if (this.shadowRoot.getSelection().rangeCount > 0) {
      let currentPageNumber = this.getPageNumber(this.shadowRoot.getSelection());
      let scale = this.pdfViewer._pages[0].viewport.scale;
      let selectionCoords = this.shadowRoot.getSelection().getRangeAt(0).getBoundingClientRect();
      let pageCoords = this.shadowRoot.querySelector('.page:nth-child(' + currentPageNumber + ') .canvasWrapper')
        .getBoundingClientRect();

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
      let [rawAnnotation, rawPopupAnnotation] = this.createAnnotationObjects(scaledSelectionCoords, newAnnotationId,
        newPopupId, content);

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

  // #deprecated
  onPdfSaveButton() {
    this.savePdf();
  }

  // #deprecated
  onPdfCancelButton() {
    this.disableEditMode();
  }


  /*MD 
  ## PDF manipulation functions 
  MD*/

  // #deprecated
  onAnnotationClick(e) {
    if (this.deleteMode) {
      this.deleteAnnotation(e.composedPath()[0]);
    } else {
      this.editAnnotation(e.composedPath()[0]);
    }
  }

  // #deprecated
  editAnnotation(annotationSection) {
    let annotationId = annotationSection.dataset.annotationId.match(/\d+/g)[0];

    // Get annotation in PDF by ID
    let annotation = this.getObjectString(annotationId);

    let replaceRegex = new RegExp("\\/Contents\\s\\([^\\)]+\\)", "gm");

    let newValue = window.prompt('Please enter the new value');
    let newAnnotation = "";

    if (newValue !== null) {
      // Replace annotation with new text
      newAnnotation = annotation.replace(replaceRegex, "/Contents (" + newValue + ")");

      this.editedPdfText = this.editedPdfText.replace(annotation, newAnnotation);
      this.setChangeIndicator(true);
    }
  }

  // #deprecated
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

  // #deprecated
  savePdf() {
    let url = this.getAttribute("src");
    let newPdfData = "data:application/pdf;base64," + btoa(this.editedPdfText);
    let that = this;

    // Convert edited base64 back to Blob and write into PDF
    fetch(newPdfData).then(response => response.blob()).then(newBlob => {
      fetch(url, { method: 'PUT', body: newBlob }).then(() => {
        PDFJS.getDocument(newPdfData).promise.then(function(pdfDocument) {
          that.pdfViewer.setDocument(pdfDocument);
          that.pdfLinkService.setDocument(pdfDocument, null);
        });

        that.originalPdfText = that.editedPdfText;
        that.setChangeIndicator(false);
      });
    });
  }


  /*MD ## HELPER METHODS for PDF MD*/

  setChangeIndicator(contentChanged) {
    let livelyContainer = lively.query(this, "lively-container")
    if (livelyContainer) {
      livelyContainer.contentChanged = contentChanged;
      livelyContainer.updateChangeIndicator();
    }
  }

  // #deprecated
  createAnnotationObjects(scaledSelectionCoords, newAnnotationId, newPopupId, content) {
    let rawAnnotation = newAnnotationId + " 0 obj\n\
<< /Type /Annot /Popup " + newPopupId + " 0 R /Rect [ " +
      scaledSelectionCoords.bottomLeftX + " " +
      scaledSelectionCoords.bottomLeftY + " " +
      scaledSelectionCoords.topRightX + " " +
      scaledSelectionCoords.topRightY +
      " ] /Contents (" + content + ") /C [ 0.9709861 0.7674150 0.2850983 ] /F 4 /QuadPoints [ " +
      scaledSelectionCoords.topLeftX + " " +
      scaledSelectionCoords.topLeftY + " " +
      scaledSelectionCoords.topRightX + " " +
      scaledSelectionCoords.topRightY + " " +
      scaledSelectionCoords.bottomLeftX + " " +
      scaledSelectionCoords.bottomLeftY + " " +
      scaledSelectionCoords.bottomRightX + " " +
      scaledSelectionCoords.bottomRightY +
      " ] /Subtype /Highlight >>\n\
endobj\n";

    let rawPopupAnnotation = newPopupId + " 0 obj\n\
<< /Parent " + newAnnotationId + " 0 R /Type /Annot /Open true /Subtype /Popup /Rect [" +
      (scaledSelectionCoords.topRightX + 4) + " " +
      scaledSelectionCoords.topRightY + " " +
      (scaledSelectionCoords.bottomRightX + 132) + " " +
      (scaledSelectionCoords.topRightY + 72) +
      " ] >>\n\
endobj\n";

    return new Array(rawAnnotation, rawPopupAnnotation);
  }

  // #deprecated
  setAnnotationsArray(currentPageString, annotationId, popupId) {
    // Check for an existing annotations array
    if (currentPageString.indexOf('/Annots') === -1) {
      // Since there are no annotations we have to create a new annotations array
      let annotationsArrayId = this.getNewId(popupId);
      let annoationsArrayRef = " /Annots " + annotationsArrayId + " 0 R";

      let newPageString = currentPageString.replace(">>", annoationsArrayRef + " >>");
      let newAnnotationsArray = annotationsArrayId + " 0 obj\n [ " +
        annotationId + " 0 R " + popupId + " 0 R ]\nendobj\n";

      this.editedPdfText = this.editedPdfText.replace(currentPageString, newPageString);
      this.editedPdfText = this.editedPdfText.replace('xref', newAnnotationsArray + "xref");
    } else {
      let annotationsArray = this.getAnnotationsArray(currentPageString);

      // Insert the new IDs into the array
      let newAnnoationsArray = annotationsArray.replace(" ]", " " + annotationId + " 0 R " + popupId + " 0 R ]");
      this.editedPdfText = this.editedPdfText.replace(annotationsArray, newAnnoationsArray);
    }
  }

  // #deprecated
  getAnnotationsArray(currentPageString) {
    let annotationsArrayReferenceRegEx = new RegExp("/Annots\\s(\\d+)\\s\\d+", "gm");
    let annotationsArrayReference = annotationsArrayReferenceRegEx.exec(currentPageString)[1];

    let annotationsArrayRegEx = new RegExp("^(" + annotationsArrayReference + "\\s\\d\\sobj\\n*.*\\n*endobj)", "mg");
    let annotationsArray = this.editedPdfText.match(annotationsArrayRegEx)[0];

    return annotationsArray;
  }

  // #deprecated
  getObjectString(id) {
    let regex = new RegExp("^(" + id + "\\s\\d\\sobj)", "mg");
    let startSubstr = this.editedPdfText.substring(this.editedPdfText.search(regex));
    let object = startSubstr.substring(0, startSubstr.indexOf('endobj') + 6);
    return object;
  }

  // #deprecated
  getPageString(pageNumber) {
    // Get currentPage object (as string) in PDF 
    let pageRegex = new RegExp("^<<\\s\\/Type\\s\\/Page\\s.*\\n*.*>>$", 'gm');
    let pageString = this.editedPdfText.match(pageRegex)[pageNumber - 1];

    return pageString;
  }

  // #deprecated
  getPageNumber(selection) {
    return selection.anchorNode.parentNode.parentNode.parentNode.dataset.pageNumber;
  }

  // #deprecated
  getNewId(lastUsedId) {
    // Optimization based on the assumption that 
    // there are no 1000 annotations within the PDF
    let id = (lastUsedId === undefined) ? 1000 : lastUsedId + 1;
    while (this.editedPdfText.indexOf(id + ' 0 obj') !== -1) {
      id++;
    }

    return id;
  }

  /*MD ## HELPER METHODS for general use MD*/

  // #deprecated
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

  // #deprecated
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

  // #deprecated
  setDeleteMode(bool) {
    let deleteButton = this.getSubmorph("#pdf-delete-button");
    let that = this;

    if (bool) {
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

  /*MD ## Lively4  MD*/

  livelyExample() {
    this.setURL(
      "https://lively-kernel.org/publications/media/KrahnIngallsHirschfeldLinckePalacz_2009_LivelyWikiADevelopmentEnvironmentForCreatingAndSharingActiveWebContent_AcmDL.pdf"
      )

    // this.setURL("http://localhost:9005/Dropbox/Thesis/Literature/2020-29/LittJacksonMillisQuaye_2020_EndUserSoftwareCustomizationByDirectManipulationOfTabularData.pdf")
  }

  livelyMigrate(other) {
    //  this.setURL(other.getURL())
  }
}


// #Experimental... could be test, but I don't know what I want to have... so #LiveProgramming? ;-)
//lively.runDevCodeAndLog()
