/* global globalThis */

import Parser from 'src/external/bibtexParse.js';
import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import { Paper } from 'src/client/literature.js';
import Bibliography from "src/client/bibliography.js";
import pdf from "src/external/pdf.js";

import { serialize, deserialize } from 'src/client/serialize.js';
import Card from 'demos/stefan/untitled-board-game/ubg-card.js';

const POKER_CARD_SIZE_INCHES = lively.pt(2.5, 3.5);
const POKER_CARD_SIZE_MM = POKER_CARD_SIZE_INCHES.scaleBy(25.4);

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

/* `this` is a jspdf doc */
function withGraphicsState(cb) {
  this.saveGraphicsState(); // this.internal.write('q');
  try {
    return cb();
  } finally {
    this.restoreGraphicsState(); // this.internal.write('Q');
  }
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

export default class Cards extends Morph {
  async initialize() {

    this.setAttribute("tabindex", 0);
    this.windowTitle = "UBG Cards Viewer";
    this.addEventListener('contextmenu', evt => this.onMenuButton(evt), false);

    this.filter.value = this.filterValue;

    this.updateView();
    lively.html.registerKeys(this);
    this.registerButtons();

    for (let eventName of ['input']) {
      this.filter.addEventListener(eventName, evt => this.filterChanged(evt), false);
    }
  }

  /*MD ## Filter MD*/
  get filter() {
    return this.get('#filter');
  }

  get filterValue() {
    return this.getAttribute('filter-Value') || '';
  }

  set filterValue(value) {
    this.setAttribute('filter-Value', value);
  }

  filterChanged(evt) {
    this.filterValue = this.filter.value;
    this.updateItemsToFilter();
    this.updateSelectedItemToFilter();
    return;
  }

  updateItemsToFilter() {
    const filterValue = this.filterValue;
    this.allEntries.forEach(entry => {
      entry.updateToFilter(filterValue)
    });
  }

  updateSelectedItemToFilter() {
    const selectedEntry = this.selectedEntry;
    if (selectedEntry) {
      if (selectedEntry.classList.contains('hidden')) {
        selectedEntry.classList.remove('selected');
        const downwards = this.findNextVisibleItem(selectedEntry, false, false);
        if (downwards) {
          this.selectEntry(downwards);
        } else {
          const upwards = this.findNextVisibleItem(selectedEntry, true, false);
          if (upwards) {
            this.selectEntry(upwards);
          }
        }
      }
    } else {
      const newItem = this.findNextVisibleItem(undefined, false, false);
      if (newItem) {
        this.selectEntry(newItem);
      }
    }

    this.scrollSelectedItemIntoView();
  }

  scrollSelectedItemIntoView() {
    const selectedEntry = this.selectedEntry;
    if (!selectedEntry) {
      return;
    }

    selectedEntry.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "nearest"
    });
  }

  selectNextListItem(evt, prev) {
    const listItems = this.allEntries;

    if (listItems.length <= 1) {
      return;
    }

    const selectedEntry = this.selectedEntry;
    const newItem = this.findNextVisibleItem(selectedEntry, prev, !evt.repeat);
    if (newItem && newItem !== selectedEntry) {
      this.selectEntry(newItem);
      this.scrollSelectedItemIntoView();
    }
  }

  findNextVisibleItem(referenceItem, prev, allowLooping) {
    let listItems = this.allEntries;
    if (listItems.length === 0) {
      return;
    }

    if (prev) {
      listItems = listItems.reverse();
    }

    // might be -1, if no reference item is given (which start the search from the beginning)
    const referenceIndex = listItems.indexOf(referenceItem);

    const firstPass = listItems.find((item, index) => index > referenceIndex && !item.classList.contains('hidden'));
    if (firstPass) {
      return firstPass;
    }

    if (!allowLooping) {
      return;
    }

    return listItems.find((item, index) => index <= referenceIndex && !item.classList.contains('hidden'));
  }

  onKeyDown(evt) {
    if (evt.key === 'PageUp') {
      evt.stopPropagation();
      evt.preventDefault();

      this.selectNextEntryInDirection(true, !evt.repeat)
      return;
    }

    if (evt.key === 'PageDown') {
      evt.stopPropagation();
      evt.preventDefault();

      this.selectNextEntryInDirection(false, !evt.repeat)
      return;
    }

    if (evt.ctrlKey && evt.key == "s") {
      this.onSave();
      return
    }

    if (evt.ctrlKey && evt.key == "/") {
      this.filter.select()
      return
    }
    
    lively.notify(evt.key, evt.repeat);
  }
  
  selectNextEntryInDirection(up, loop) {
    const newEntry = this.findNextVisibleItem(this.selectedEntry, up, loop)
    if (newEntry) {
      this.selectEntry(newEntry);
      this.scrollSelectedItemIntoView();
    }
  }

  async onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var source = evt.dataTransfer.getData("text");
    var value = this.parseEntries(source);
    if (value) {
      value = value[0];
      var beforeEntry = this.findEntryInPath(evt.composedPath());
      var newEntry = await this.appendCardEntry(value);
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

  async appendCardEntry(card) {
    var entry = await identity(<ubg-cards-entry></ubg-cards-entry>);
    entry.value = card;
    this.appendChild(entry);
    return entry;
  }

  async updateView() {
    this.innerHTML = "";

    if (!this.src) {
      lively.warn('no src for ubg-cards');
      return;
    }

    this.cards = this.cards || (await this.loadCardsFromFile());
    await this.updatePreview(this.cards);
    await this.setFromJSON(this.cards);

    this.setCardInEditor(this.card || this.cards.first);
  }

  get allEntries() {
    return [...this.querySelectorAll('ubg-cards-entry')];
  }

  get selectedEntry() {
    return this.allEntries.find(entry => entry.hasAttribute('selected'))
  }
  
  selectEntry(entry) {
    this.setCardInEditor(entry.card)
  }
  
  setCardInEditor(card) {
    this.card = card;

    this.allEntries.forEach(entry => {
      if (entry.value === card) {
        entry.setAttribute('selected', true);
      } else {
        entry.removeAttribute('selected');
      }
    });

    this.editor.src = card;
  }

  async loadCardsFromFile() {
    const text = await this.src.fetchText();
    const source = deserialize(text, { Card });
    // source.forEach(card => card.migrateTo(Card))
    return source;
  }

  async updatePreview(source) {
    if (!this.src) {
      lively.warn('no src for ubg-cards');
      return;
    }

    // const doc = await this.buildFullPDF(source);
  }

  get viewerContainer() {
    return this.get('#viewerContainer');
  }

  openInNewTab(doc) {
    window.open(doc.output('bloburl'), '_blank');
  }

  async quicksavePDF(doc) {
    doc.save('cards.pdf');
  }

  /*MD ## Build MD*/
  async ensureJSPDFLoaded() {
    await lively.loadJavaScriptThroughDOM('jspdf', lively4url + '/src/external/jspdf/jspdf.umd.js');
    await lively.loadJavaScriptThroughDOM('html2canvas', lively4url + '/src/external/jspdf/html2canvas.js');
  }

  async createPDF(config) {
    await this.ensureJSPDFLoaded();
    return new jspdf.jsPDF(config);
  }

  async buildSingleCard(card) {
    const doc = await this.createPDF({
      orientation: 'p',
      unit: 'mm',
      format: POKER_CARD_SIZE_MM.toPair
      // putOnlyUsedFonts:true,
      // floatPrecision: 16 // or "smart", default is 16
      () });

    return this.buildCards(doc, [card]);
  }

  async buildFullPDF(cards) {
    const doc = await this.createPDF({
      orientation: 'p',
      unit: 'mm'
      // format: POKER_CARD_SIZE_MM.addXY(5, 5).toPair(),
      // putOnlyUsedFonts:true,
      // floatPrecision: 16 // or "smart", default is 16
    });

    return this.buildCards(doc, cards);
  }

  async buildCards(doc, cardsToPrint) {
    const GAP = lively.pt(.2, .2);

    const rowsPerPage = Math.max(((doc.internal.pageSize.getHeight() + GAP.y) / (POKER_CARD_SIZE_MM.y + GAP.y)).floor(), 1);
    const cardsPerRow = Math.max(((doc.internal.pageSize.getWidth() + GAP.x) / (POKER_CARD_SIZE_MM.x + GAP.x)).floor(), 1);
    const cardsPerPage = rowsPerPage * cardsPerRow;

    const margin = lively.pt(doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()).subPt(lively.pt(cardsPerRow, rowsPerPage).scaleByPt(POKER_CARD_SIZE_MM).addPt(lively.pt(cardsPerRow - 1, rowsPerPage - 1).scaleByPt(GAP)));

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

  get editor() {
    return this.get('#editor');
  }

  colorsForCard(card) {
    const BOX_FILL_OPACITY = 0.7;

    const currentVersion = card.versions.last;

    const type = currentVersion.type;

    const isGoal = type && type.toLowerCase && type.toLowerCase() === 'goal';
    if (isGoal) {
      return ['#efc241', '#b8942d', BOX_FILL_OPACITY];
    }

    const multiElement = Array.isArray(card.getElement());
    if (multiElement) {
      return ['#ff88ff', '#ff00ff', BOX_FILL_OPACITY];
    }

    const singleElementColors = {
      fire: ['#ffaaaa', '#dd0000', BOX_FILL_OPACITY],
      water: ['#aaaaff', '#0000bb', BOX_FILL_OPACITY],
      earth: ['#eeee88', '#cccc00', BOX_FILL_OPACITY],
      wind: ['#88ff88', '#00bb00', BOX_FILL_OPACITY]
    }[currentVersion.element && currentVersion.element.toLowerCase && currentVersion.element.toLowerCase()];
    if (singleElementColors) {
      return singleElementColors;
    }

    return ['#ffffff', '#888888', BOX_FILL_OPACITY];
  }

  async renderCard(doc, cardDesc, outsideBorder, assetsInfo) {
    const currentVersion = cardDesc.versions.last;

    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background
    doc.setFillColor(0.0);
    doc.roundedRect(...outsideBorder::xYWidthHeight(), 3, 3, 'F');

    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // doc.setFillColor(120, 120, 120);
    // doc.roundedRect(...innerBorder::xYWidthHeight(), 3, 3, 'FD');

    // id
    doc::withGraphicsState(() => {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`${cardDesc.id || '???'}/1`, innerBorder.right(), (innerBorder.bottom() + outsideBorder.bottom()) / 2, { align: 'right', baseline: 'middle' });
    });

    // card image
    const id = cardDesc.id;
    const assetFileName = id + '.jpg';
    let preferredCardImage;
    if (id && assetsInfo.find(entry => entry.type === 'file' && entry.name === assetFileName)) {
      preferredCardImage = this.assetsFolder + assetFileName;
    } else {
      assetsInfo;
      preferredCardImage = this.assetsFolder + ({
        gadget: 'default-gadget.jpg',
        goal: 'default-goal.jpg',
        spell: 'default-spell.jpg'
      }[currentVersion.type && currentVersion.type.toLowerCase && currentVersion.type.toLowerCase()] || 'default.jpg');
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
    doc.setTextColor('#000000');
    doc.text(currentVersion.name || cardDesc.id || '<no name>', ...titleBar.leftCenter().addX(2).toPair(), { align: 'left', baseline: 'middle' });
    // doc.text(['hello world', 'this is a card'], ...titleBar.leftCenter().addX(2).toPair(), { align: 'left', baseline: 'middle' });

    // cost
    const cost = cardDesc.getCost();
    const costs = Array.isArray(cost) ? cost : [cost];
    let top = titleBar.bottom() + 1;
    let right = titleBar.right();
    const COIN_RADIUS = 4;
    costs.forEach((cost, i) => {
      const coinCenter = lively.pt(right - COIN_RADIUS, top + COIN_RADIUS + COIN_RADIUS * 2 * 0.9 * i);

      doc::withGraphicsState(() => {
        doc.setGState(new doc.GState({ opacity: 0.9 }));
        doc.setFillColor('#b8942d');
        doc.setDrawColor('#b8942d');
        doc.ellipse(...coinCenter.toPair(), COIN_RADIUS, COIN_RADIUS, 'DF');
      });

      if (cost !== undefined) {
        doc::withGraphicsState(() => {
          doc.setFontSize(12);
          doc.setTextColor('#000000');
          doc.text('' + cost, ...coinCenter.toPair(), { align: 'center', baseline: 'middle' });
        });
      }
    });

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
    doc.setTextColor('#000000');
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
    await this.showPDFData(base64pdf, this.viewerContainer);
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

  async showPDFData(base64pdf, container, viewer) {
    const eventBus = new window.PDFJSViewer.EventBus();
    const pdfLinkService = new window.PDFJSViewer.PDFLinkService({ eventBus });
    const pdfViewer = new window.PDFJSViewer.PDFViewer({
      eventBus,
      container,
      viewer,
      linkService: pdfLinkService,
      renderer: "canvas", // svg canvas
      textLayerMode: 1
    });
    pdfLinkService.setViewer(pdfViewer);
    container.addEventListener('pagesinit', () => {
      pdfViewer.currentScaleValue = 1;
    });

    const pdfDocument = await PDFJS.getDocument(base64pdf).promise;
    pdfViewer.setDocument(pdfDocument);
    pdfLinkService.setDocument(pdfDocument, null);

    await pdfViewer.pagesPromise;
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
        await this.appendCardEntry(cardData);
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

  /*MD ## Main Bar Buttons MD*/
  async onSortByKeyButton(evt) {
    lively.notify('onSortByKeyButton' + evt.shiftKey);
  }
  async onSortByYearButton(evt) {
    lively.notify('onSortByYearButton' + evt.shiftKey);
  }
  async onImportNewCards(evt) {
    lively.notify('onImportNewCards' + evt.shiftKey);
  }

  async onPrintAll(evt) {
    if (!this.cards) {
      return;
    }

    const doc = await this.buildFullPDF(this.cards);

    if (evt.shiftKey) {
      lively.notify('shift onPrintAll');
      this.quicksavePDF(doc);
      return;
    }

    lively.notify('shift onPrintAll');
    this.openInNewTab(doc);
  }

  async onPrintChanges(evt) {
    lively.notify('onPrintChanges' + evt.shiftKey);
  }

  async onSaveJson(evt) {
    lively.warn(`save ${this.src}`);
    await lively.files.saveFile(this.src, serialize(this.cards));
    lively.success(`saved`);
    this.clearMarkAsChanged();
  }
  async onSavePdf(evt) {
    const pdfUrl = this.src.replace(/\.json$/, '.pdf');

    const doc = await this.buildFullPDF(this.cards);
    const blob = doc.output('blob');
    await lively.files.saveFile(pdfUrl, blob);

    // doc.save('Photo.pdf');
    // window.open(doc.output('bloburl'), '_blank');

    // var pdf = btoa(doc.output());

    // await fetch(pdfUrl, {
    //   method: 'PUT',
    //   body: blob
    // });
    // window.open(pdfUrl, '_blank');

    // await this.showPreview(pdfUrl);
  }
  async onShowPreview(evt) {
    const doc = await this.buildFullPDF(this.cards);
    this.classList.add('show-preview');
    await this.showPDFData(doc.output('dataurlstring'), this.viewerContainer);
  }

  onClosePreview(evt) {
    this.classList.remove('show-preview');
  }

  async onAddButton(evt) {
    lively.notify('onAddButton' + evt.shiftKey);
  }

  async onMenuButton(evt) {
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

  /*MD ## lively API MD*/
  get textChanged() {
    return this.hasAttribute('text-changed');
  }

  markAsChanged(card) {
    const entryToUpdate = this.allEntries.find(entry => entry.value === card);
    lively.notify(entryToUpdate, 'ooo');
    if (entryToUpdate) {
      entryToUpdate.updateView();
    }
    this.setAttribute('text-changed', true);
  }

  clearMarkAsChanged() {
    this.removeAttribute('text-changed');
  }

  livelyMigrate(other) {
    this.cards = other.cards;
    this.card = other.card;
  }

  livelySource() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry")).map(ea => ea.textContent).join("");
  }

}