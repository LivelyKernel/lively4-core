/* global globalThis */

import Parser from 'src/external/bibtexParse.js';
import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import { Paper } from 'src/client/literature.js';
import Bibliography from "src/client/bibliography.js";
import pdf from "src/external/pdf.js";

function identity(value) {
  return value;
}

function fitRectIntoBounds(rect, bounds) {
  const rectRatio = rect.width / rect.height;
  const boundsRatio = bounds.width / bounds.height;

  let width, height;
  // Rect is more landscape than bounds - fit to width
  if (rectRatio > boundsRatio) {
    width = bounds.width;
    height = rect.height * (bounds.width / rect.width);
  }
  // Rect is more portrait than bounds - fit to height
  else {
      width = rect.width * (bounds.height / rect.height);
      height = bounds.height;
    }

  return lively.rect(bounds.x + (bounds.width - width) / 2, bounds.y + (bounds.height - height) / 2, width, height);
}

function stretchRectIntoBounds(rect, bounds) {
  const rectRatio = rect.width / rect.height;
  const boundsRatio = bounds.width / bounds.height;

  let width, height;
  // Rect is more landscape than bounds - fit to width
  if (rectRatio < boundsRatio) {
    width = bounds.width;
    height = rect.height * (bounds.width / rect.width);
  }
  // Rect is more portrait than bounds - fit to height
  else {
      width = rect.width * (bounds.height / rect.height);
      height = bounds.height;
    }

  return lively.rect(bounds.x + (bounds.width - width) / 2, bounds.y + (bounds.height - height) / 2, width, height);
}

/* `this` is a lively.rect */
function xYWidthHeight() {
  return [this.x, this.y, this.width, this.height];
}

/* `this` is a Number */
function pointToMM() {
  return this / 2.835;
}

/* `this` is a Number */
function mmToPoint() {
  return this * 2.835;
}

async function getImageFromURL(url) {
  const response = await fetch(url);
  const blob = await response.blob();

  const dataURL = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(reader.result);
    }, false);
    reader.readAsDataURL(blob);
  });

  const img = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // img.src,
      // img.height,
      // img.width
      resolve(img);
    };
    img.src = dataURL; // could also just use the image file url here
  });

  return img;
}

class FileCache {

  constructor() {
    this.files = {};
  }

  dirtyFolder(path) {}

  getFile(path, callback) {
    if (this.files[path]) {
      // lively.notify('cache hit')
    } else {
      // lively.notify('cache miss')
      this.files[path] = callback(path);
    }

    return this.files[path];
  }

}

if (globalThis.__ubg_file_cache__) {
  globalThis.__ubg_file_cache__.migrateTo(FileCache);
} else {
  globalThis.__ubg_file_cache__ = new FileCache();
}

export default class UBGCards extends Morph {
  async initialize() {

    this.setAttribute("tabindex", 0 // just ensure focusabiltity
    );this.windowTitle = "UBG Cards Viewer";
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);
    this.addEventListener("click", evt => this.onClick(evt));
    this.addEventListener("drop", this.onDrop);
    this.addEventListener("copy", evt => this.onCopy(evt));
    this.addEventListener("cut", evt => this.onCut(evt));
    this.addEventListener("paste", evt => this.onPaste(evt));
    this.updateView();
    this.registerButtons();
  }

  selectedEntries() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry.selected"));
  }

  async importEntries(entries) {

    var source = entries.map(ea => ea.textContent).join("\n");

    return Paper.importBibtexSource(source);
  }

  onContextMenu(evt) {
    if (!evt.shiftKey) {
      var entries = this.selectedEntries();
      if (entries.length == 0) {
        entries = evt.composedPath().filter(ea => ea.localName == "lively-bibtex-entry");
      }
      if (entries.length == 0) return; // nothing selected or clicked on

      evt.stopPropagation();
      evt.preventDefault();
      var menu = new ContextMenu(this, [["generate key", () => {
        entries.forEach(ea => {
          var entry = ea.value;
          var key = Bibliography.generateCitationKey(entry);
          if (key) {
            entry.citationKey = Bibliography.generateCitationKey(entry);
            ea.value = entry;
          } else {
            lively.warn("Bibtex: Could net gernerate key for", ea.toBibtex());
          }
        });
      }], ["generate key and replace all occurences", () => {
        entries.forEach(ea => {
          var entry = ea.value;
          var oldkey = ea.value.citationKey;
          var key = Bibliography.generateCitationKey(entry);
          if (key) {
            entry.citationKey = Bibliography.generateCitationKey(entry);
            ea.value = entry;

            lively.openComponentInWindow("lively-index-search").then(comp => {
              comp.searchAndReplace(oldkey, key);
              lively.setExtent(comp.parentElement, lively.pt(1000, 700));
              comp.focus();
            });
          } else {
            lively.warn("Bibtex: Could net gernerate key for", ea.toBibtex());
          }
        });
      }], ["generate filename(s)", async () => {
        var result = "";
        entries.forEach(ea => {
          var filename = ea.generateFilename();
          result += filename + "\n";
        });

        var workspace = await lively.openWorkspace(result);
        workspace.mode = "text";
      }], ["import", () => {
        this.importEntries(entries);
      }], ["remove", () => {
        entries.forEach(ea => {
          ea.remove();
        });
      }]]);
      menu.openIn(document.body, evt, this);
      return;
    }
  }

  onCopy(evt) {
    if (this.isEditing()) return;
    if (window.getSelection().toString().length > 0) return;
    var data = this.selectedEntries().map(ea => ea.textContent).join("");
    evt.clipboardData.setData('text/plain', data);
    evt.stopPropagation();
    evt.preventDefault();
  }

  onCut(evt) {
    if (this.isEditing()) return;
    if (window.getSelection().toString().length > 0) return;
    this.onCopy(evt);
    this.selectedEntries().forEach(ea => ea.remove());
  }

  async onPaste(evt) {
    if (this.isEditing()) return;
    var scroll = this.scrollTop;
    var data = evt.clipboardData.getData('text');
    var entries = this.parseEntries(data);
    this.selectedEntries().forEach(ea => ea.classList.remove("selected"));

    if (entries) {
      for (var ea of entries) {
        var entryElement = await this.appendBibtexEntry(ea);
        entryElement.classList.add("selected");
        if (this.currentEntry) this.insertBefore(entryElement, this.currentEntry);
      }
    }
    await lively.sleep(0);
    this.scrollTop = scroll;
  }

  parseEntries(source) {
    try {
      return Parser.toJSON(source);
    } catch (e) {
      lively.notify("Bibtex could not parse: " + source);
    }
  }

  isEditing() {
    return this.currentEntry && this.currentEntry.getAttribute("mode") == "edit";
  }

  async onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var source = evt.dataTransfer.getData("text");
    var value = this.parseEntries(source);
    if (value) {
      value = value[0];
      var beforeEntry = this.findEntryInPath(evt.composedPath());
      var newEntry = await this.appendBibtexEntry(value);
      if (beforeEntry) this.insertBefore(newEntry, beforeEntry);
    }
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(url) {
    this.setAttribute("src", url);
    this.updateView();
  }

  get assetsFolder() {
    return this.src.replace(/(.*)\/.*$/i, '$1/assets/');
  }

  findEntryInPath(path) {
    return path.find(ea => ea.tagName == "lively-bibtex-entry".toUpperCase());
  }

  onClick(evt) {
    // don't interfere with selection
    if (window.getSelection().toString().length > 0) return;
    if (this.isEditing()) return;
    // var oldScroll
    var entry = this.findEntryInPath(evt.composedPath());
    if (!entry) return;
    this.select(entry, evt.shiftKey

    // lively.focusWithoutScroll(this.get("#copyHack"))
    );
  }

  select(entry, keepSelection) {
    if (this.currentEntry && !keepSelection) {
      this.currentEntry.classList.remove("selected");
    }
    if (this.currentEntry === entry) {
      this.currentEntry = null;
    } else {
      entry.classList.add("selected");
      this.currentEntry = entry;
    }
  }

  async appendBibtexEntry(value) {
    var entry = await identity(<ubg-cards-entry></ubg-cards-entry>);
    entry.value = value;
    this.appendChild(entry);
    return entry;
  }

  async updateView() {
    this.innerHTML = "";

    if (!this.src) {
      lively.warn('no src for ubg-cards');
      return;
    }

    const source = await fetch(this.src).then(res => res.json());
    await this.updatePreview(source);

    await this.setFromJSON(source);
  }

  async updatePreview(source) {
    if (!this.src) {
      lively.warn('no src for ubg-cards');
      return;
    }

    const doc = await this.buildFullPDF(source);

    await this.showPDFData(doc.output('dataurlstring'));

    await this.exportDoc(doc);
  }

  async exportDoc(doc) {
    const pdfUrl = this.src.replace(/\.json$/, '.pdf');

    // doc.save('Photo.pdf');
    // window.open(doc.output('bloburl'), '_blank');


    // var pdf = btoa(doc.output());

    const blob = doc.output('blob');
    await lively.files.saveFile(pdfUrl, blob);
    // await fetch(pdfUrl, {
    //   method: 'PUT',
    //   body: blob
    // });
    // window.open(pdfUrl, '_blank');

    // await this.showPreview(pdfUrl);
  }

  async quicksavePDF(doc) {
    doc.save('cards.pdf');
  }

  /*MD ## Build MD*/
  async buildFullPDF(cardsJSON) {
    await lively.loadJavaScriptThroughDOM('jspdf', lively4url + '/src/external/jspdf/jspdf.umd.js');
    await lively.loadJavaScriptThroughDOM('html2canvas', lively4url + '/src/external/jspdf/html2canvas.js');

    const doc = new jspdf.jsPDF('p', 'mm', 'a4');

    const POKER_CARD_SIZE_INCHES = lively.pt(2.5, 3.5);
    const POKER_CARD_SIZE_MM = POKER_CARD_SIZE_INCHES.scaleBy(25.4);
    const GAP = lively.pt(2, 2);

    const rowsPerPage = Math.max(((doc.internal.pageSize.getHeight() + GAP.y) / (POKER_CARD_SIZE_MM.y + GAP.y)).floor(), 1);
    const cardsPerRow = Math.max(((doc.internal.pageSize.getWidth() + GAP.x) / (POKER_CARD_SIZE_MM.x + GAP.x)).floor(), 1);
    const cardsPerPage = rowsPerPage * cardsPerRow;

    const margin = lively.pt(doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()).subPt(lively.pt(cardsPerRow, rowsPerPage).scaleByPt(POKER_CARD_SIZE_MM).addPt(lively.pt(cardsPerRow - 1, rowsPerPage - 1).scaleByPt(GAP)));
    const cardsToPrint = cardsJSON //.slice(-10);

    function progressLabel(numCard) {
      return `process cards ${numCard}/${cardsToPrint.length}`;
    }
    const progress = await lively.showProgress(progressLabel(0));

    try {
      const ASSET_FOLDER = this.assetsFolder;
      const assetsInfo = (await ASSET_FOLDER.fetchStats()).contents;

      let i = 0;
      let currentPage = 0;
      while (i < cardsToPrint.length) {
        progress.value = (i + 1) / cardsToPrint.length;
        progress.textContent = progressLabel(i);

        const indexOnPage = i % cardsPerPage;
        const intendedPage = (i - indexOnPage) / cardsPerPage;
        // lively.notify(`${i} ${indexOnPage} ${intendedPage}`);
        if (currentPage < intendedPage) {
          doc.addPage("p", "mm", "a4");
          currentPage++;
        }

        const rowIndex = (indexOnPage / rowsPerPage).floor();
        const columnIndex = indexOnPage % cardsPerRow;
        const offset = lively.pt(columnIndex * (POKER_CARD_SIZE_MM.x + GAP.x), rowIndex * (POKER_CARD_SIZE_MM.y + GAP.y)).addPt(margin.scaleBy(1 / 2));
        const outsideBorder = offset.extent(POKER_CARD_SIZE_MM);

        const cardToPrint = cardsToPrint[i];
        await this.renderCard(doc, cardToPrint, outsideBorder, assetsInfo);

        i++;
      }
    } finally {
      progress.remove();
    }

    return doc;
  }

  async renderCard(doc, cardDesc, outsideBorder, assetsInfo) {
    const currentVersion = cardDesc.versions.last;
    
    const BOX_FILL_OPACITY = 0.5;
    const colorForTypeAndElement = currentVersion.type === 'Goal' || currentVersion.type === 'goal' ? '#b8942d' : {
      Fire: '#dd0000',
      Water: '#0000bb',
      Earth: '#cccc00',
      Wind: '#00bb00',
    }[currentVersion.element] || (currentVersion.element ? '#ff00ff' : '#888888');
    const BOX_FILL_COLOR = colorForTypeAndElement;
    const BOX_STROKE_COLOR = colorForTypeAndElement;

    /* `this` is a pdf */
    function withGraphicsState(cb) {
      doc.saveGraphicsState(); // doc.internal.write('q');
      try {
        return cb();
      } finally {
        doc.restoreGraphicsState(); // doc.internal.write('Q');
      }
    }


    // background
    doc.setFillColor(0.0);
    doc.roundedRect(...outsideBorder::xYWidthHeight(), 3, 3, 'F');

    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // doc.setFillColor(120, 120, 120);
    // doc.roundedRect(...innerBorder::xYWidthHeight(), 3, 3, 'FD');

    // id
    doc.saveGraphicsState();
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${cardDesc.id || '???'}/1`, innerBorder.right(), (innerBorder.bottom() + outsideBorder.bottom()) / 2, { align: 'right', baseline: 'middle' });
    doc.restoreGraphicsState();

    // card image
    const id = cardDesc.id;
    const assetFileName = id + '.jpg';
    let preferredCardImage;
    if (id && assetsInfo.find(entry => entry.type === 'file' && entry.name === assetFileName)) {
      preferredCardImage = this.assetsFolder + assetFileName;
    } else {
      assetsInfo;
      preferredCardImage = this.assetsFolder + ({
        Gadget: 'default-gadget.jpg',
        Goal: 'default-goal.jpg',
        Spell: 'default-spell.jpg'
      }[currentVersion.type] || 'default.jpg');
    }
    const img = await globalThis.__ubg_file_cache__.getFile(preferredCardImage, getImageFromURL);

    const imgRect = lively.rect(0, 0, img.width, img.height);
    const scaledRect = stretchRectIntoBounds(imgRect, innerBorder);

    doc::withGraphicsState(() => {
      doc.rect(...innerBorder::xYWidthHeight(), null); // set clipping area
      doc.internal.write('W n');
      doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());
    });

    // title bar
    const TITLE_BAR_HEIGHT = 7;
    const titleBar = innerBorder.insetBy(1);
    titleBar.height = TITLE_BAR_HEIGHT;
    doc::withGraphicsState(() => {
      doc.setGState(new doc.GState({ opacity: 0.5 }));
      doc.setFillColor(BOX_FILL_COLOR);
      doc.setDrawColor(BOX_STROKE_COLOR);
      doc.roundedRect(...titleBar::xYWidthHeight(), 1, 1, 'DF');
    });

    // card name
    doc.setFontSize(.6 * TITLE_BAR_HEIGHT::mmToPoint());
    doc.setTextColor('#ffffff');
    doc.text(currentVersion.name || cardDesc.id || '<no name>', ...titleBar.leftCenter().addX(2).toPair(), { align: 'left', baseline: 'middle' });
    // doc.text(['hello world', 'this is a card'], ...titleBar.leftCenter().addX(2).toPair(), { align: 'left', baseline: 'middle' });

    //     await new Promise((resolve, reject) => {
    //       const element = <span>foo <i>bar</i></span>;

    //       doc.html(element, {
    //         callback(doc) {
    //           resolve();
    //         },
    //         x: innerBorder.x,
    //         y: innerBorder.y
    //       });
    //     });

    // rule box
    const RULE_BOX_HEIGHT = 7;
    const ruleBox = innerBorder.insetBy(1);
    const height = innerBorder.height * .4;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    doc::withGraphicsState(() => {
      doc.setGState(new doc.GState({ opacity: BOX_FILL_OPACITY }));
      doc.setFillColor(BOX_FILL_COLOR);
      doc.setDrawColor(BOX_STROKE_COLOR);
      doc.roundedRect(...ruleBox::xYWidthHeight(), 1, 1, 'DF');
    });

    // rule text
    const ruleTextBox = ruleBox.insetBy(2);
    doc.setFontSize(9);
    doc.setTextColor('#ffffff');
    doc.text(currentVersion.text, ...ruleTextBox.topLeft().toPair(), { align: 'left', baseline: 'top', maxWidth: ruleTextBox.width });

    // type & elements
    doc.saveGraphicsState();
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${currentVersion.type || '<no type>'} - ${currentVersion.elements || currentVersion.element || '<no element>'}`, ruleBox.left(), ruleBox.top() - .5, { align: 'justify', baseline: 'bottom' });
    doc.restoreGraphicsState();
  }

  /*MD ## Export MD*/

  /*MD ## Preview MD*/
  async showPreview(url) {
    const base64pdf = await this.loadPDFFromURLToBase64(url);
    await this.showPDFData(base64pdf);
  }

  async loadPDFFromURLToBase64(url) {
    // Loading document
    // Load a blob, transform the blob into base64
    // Base64 is the format we need since it is editable and can be shown by PDFJS at the same time.
    const response = await fetch(url);
    const blob = await response.blob();
    //       let fileReader = new FileReader();
    //       fileReader.addEventListener('loadend', () => {
    //         // this.editedPdfText = atob(fileReader.result.replace("data:application/pdf;base64,", ""));
    //       });

    //       fileReader.readAsDataURL(blob);
    return URL.createObjectURL(blob);
  }

  async showPDFData(base64pdf) {
    var eventBus = new window.PDFJSViewer.EventBus();
    var container = this.get('#viewerContainer');
    this.pdfLinkService = new window.PDFJSViewer.PDFLinkService({ eventBus });
    this.pdfViewer = new window.PDFJSViewer.PDFViewer({
      eventBus,
      container,
      linkService: this.pdfLinkService,
      renderer: "canvas", // svg canvas
      textLayerMode: 1
    });
    this.pdfLinkService.setViewer(this.pdfViewer);
    container.addEventListener('pagesinit', () => {
      this.pdfViewer.currentScaleValue = 1;
    });

    const pdfDocument = await PDFJS.getDocument(base64pdf).promise;
    this.pdfDocument = pdfDocument;
    this.pdfViewer.setDocument(pdfDocument);
    this.pdfLinkService.setDocument(pdfDocument, null);

    await this.pdfViewer.pagesPromise;
    // #TODO can we advice the pdfView to only render the current page we need?
    // if (this.getAttribute("mode") != "scroll") {
    //   this.currentPage = 1 
    //   this.showPage(this.getPage(this.currentPage))
    // }
  }

  /*MD ## --- MD*/
  async setFromJSON(json) {
    try {
      // var json= Parser.toJSON(source);    
      for (let cardData of json) {
        await this.appendBibtexEntry(cardData);
      }
    } catch (e) {
      this.innerHTML = "" + e;
    }
  }

  toBibtex() {
    var bibtex = "";
    for (var ea of this.querySelectorAll("lively-bibtex-entry")) {
      bibtex += ea.innerHTML;
    }
    return bibtex;
  }

  async onSaveButton() {
    var bibtex = this.toBibtex();
    if (!this.src) throw new Error("BibtexEditor src missing");
    lively.files.saveFile(this.src, bibtex).then(() => lively.success("saved bibtex", this.src, 5, () => lively.openBrowser(this.src)));
  }

  async onEditButton(evt) {

    if (this.style.position) {
      var pos = lively.getPosition(this);
      var extent = lively.getExtent(this);
    }
    var editor = await identity(<lively-bibtex-editor></lively-bibtex-editor>);
    if (this.src) {
      editor.setAttribute("src", this.src);
    } else {
      editor.textContent = this.textContent;
    }
    if (evt.shiftKey) {
      var win = await identity(<lively-window>{editor}</lively-window>);
      document.body.appendChild(win);
      editor.updateView();
      this.remove();
      if (pos) {
        lively.setPosition(win, pos
        // lively.setExtent(win, extent)
        );
      }
    } else {
      this.parentElement.insertBefore(editor, this);
      editor.updateView();
      this.remove();
      if (pos) {
        lively.setPosition(editor, pos);
        lively.setExtent(editor, extent);
      }
    }
  }

  livelySource() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry")).map(ea => ea.textContent).join("");
  }

}