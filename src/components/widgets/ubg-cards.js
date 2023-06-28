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

const fire = <glyph glyph-name="uniF06D" unicode="uF06D" d="M324 397Q292 368 267 337Q226 394 168 448Q93 377 47 300Q1 222 0 166Q1 102 31 50Q60-2 111-33Q161-63 224-64Q287-63 337-33Q388-2 417 50Q447 102 448 166Q447 209 413 276Q379 343 324 397L324 397M224-16Q149-14 100 38L100 38Q50 89 48 166Q48 202 80 260Q111 318 168 380Q202 345 229 309L265 258L305 306Q313 317 323 327Q358 283 379 237Q400 192 400 166Q398 89 348 38Q299-14 224-16L224-16M314 205L262 146Q261 148 241 173Q221 198 201 224Q180 251 176 256Q144 219 128 192Q112 166 112 142Q113 90 146 61Q178 32 227 32Q265 33 294 53Q326 77 334 114Q341 152 323 187Q319 196 314 205L314 205Z" horiz-adv-x="448" vert-adv-y="512" />;
const water = <glyph glyph-name="uniF043" unicode="uF043" d="M200 80Q222 78 224 56Q222 34 200 32Q156 33 126 63Q97 92 96 137Q96 147 103 154Q110 161 120 161Q130 161 137 154Q144 147 144 137Q145 112 160 97Q176 81 200 80L200 80M368 129Q366 53 316 4L316 4Q267-46 192-48Q117-46 68 4Q18 53 16 129Q17 167 44 224Q71 280 106 336Q141 392 167 429Q177 442 192 442Q207 442 217 429Q243 392 278 336Q313 280 340 224Q367 167 368 129L368 129M307 179Q292 215 269 257Q250 291 230 323Q209 355 192 380Q175 355 154 323Q134 291 115 257Q92 215 77 179Q63 142 64 129Q65 74 101 38Q138 1 192 0Q246 1 283 38Q319 74 320 129Q321 142 307 179L307 179Z" horiz-adv-x="384" vert-adv-y="512" />;
const earth = <glyph glyph-name="uniF6FC" unicode="uF6FC" d="M503 54L280 404Q271 416 256 416Q241 416 232 404L9 54Q-8 26 7-3Q24-30 56-32L456-32Q488-31 505-3Q520 26 503 54L503 54M256 352L328 240L256 240Q244 240 237 230L208 192L179 231L256 352L256 352M462 20Q461 16 456 16L56 16Q51 16 49 20Q47 24 49 28L151 188L189 138Q196 128 208 128Q220 128 227 138L268 192L358 192L463 28Q465 24 462 20L462 20Z" horiz-adv-x="512" vert-adv-y="512" />;
const wind = <glyph glyph-name="uniF72E" unicode="uF72E" d="M24 264L356 264Q395 265 421 291Q447 317 448 356Q447 395 421 421Q395 447 356 448L320 448Q298 446 296 424Q298 402 320 400L356 400Q375 400 387 387Q400 375 400 356Q400 337 387 325Q375 312 356 312L24 312Q2 310 0 288Q2 266 24 264L24 264M164 120L24 120Q2 118 0 96Q2 74 24 72L164 72Q183 72 195 59Q208 47 208 28Q208 9 195-3Q183-16 164-16L128-16Q106-18 104-40Q106-62 128-64L164-64Q203-63 229-37Q255-11 256 28Q255 67 229 93Q203 119 164 120L164 120M420 216L24 216Q2 214 0 192Q2 170 24 168L420 168Q439 168 451 155Q464 143 464 124Q464 105 451 93Q439 80 420 80L384 80Q362 78 360 56Q362 34 384 32L420 32Q459 33 485 59Q511 85 512 124Q511 163 485 189Q459 215 420 216L420 216Z" horiz-adv-x="512" vert-adv-y="512" />;
const gray = <glyph glyph-name="uniF111" unicode="uF111" d="M512 192Q511 120 477 63L477 63Q443 5 385-29L385-29Q328-63 256-64Q184-63 127-29Q69 5 35 63Q1 120 0 192Q1 264 35 321Q69 379 127 413Q184 447 256 448Q328 447 385 413Q443 379 477 321Q511 264 512 192L512 192M256 400Q168 398 109 339L109 339Q50 280 48 192Q50 104 109 45Q168-14 256-16Q344-14 403 45Q462 104 464 192Q462 280 403 339Q344 398 256 400L256 400Z" horiz-adv-x="512" vert-adv-y="512" />;
const question = <glyph glyph-name="uni3f" unicode="?" d="M144 32Q130 32 121 23L121 23Q112 14 112 0Q112-14 121-23Q130-32 144-32Q158-32 167-23Q176-14 176 0Q176 14 167 23Q158 32 144 32L144 32M211 416L104 416Q60 415 30 386Q1 356 0 312L0 296Q2 274 24 272Q46 274 48 296L48 312Q49 336 64 352Q80 367 104 368L211 368Q237 367 254 350Q271 333 272 307Q271 271 240 253L167 215Q121 189 120 137L120 120Q122 98 144 96Q166 98 168 120L168 137Q169 161 189 173L262 211Q289 226 304 251Q320 276 320 307Q319 353 288 384Q257 415 211 416L211 416Z" horiz-adv-x="320" vert-adv-y="512" />;

function scalePathData(glyph, size = lively.pt(10, 10)) {
  const path = new paper.Path(glyph.getAttribute('d'));

  path.scale(1, -1);

  const margin = size.scaleBy(0.1);
  const boundingRect = new paper.Path.Rectangle({
    point: margin.toPair(),
    size: size.subPt(margin.scaleBy(2)).toPair()
  });
  path.fitBounds(boundingRect.bounds);

  return path.pathData;
}

function tenTenPathData(glyph) {
  return scalePathData(glyph, lively.pt(10, 10));
}
function threeThreePathData(glyph) {
  return scalePathData(glyph, lively.pt(3, 3));
}

const elementInfo = {
  fire: {
    faIcon: 'book',
    pathData: tenTenPathData(fire),
    miniPathData: threeThreePathData(fire),
    pathWidth: parseInt(fire.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(fire.getAttribute('vert-adv-y')),
    fill: '#ffbbbb',
    stroke: '#ff0000',
    others: ['water', 'earth', 'wind']
  },
  water: {
    faIcon: 'droplet',
    pathData: tenTenPathData(water),
    miniPathData: threeThreePathData(water),
    pathWidth: parseInt(water.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(water.getAttribute('vert-adv-y')),
    fill: '#8888ff',
    stroke: '#0000ff',
    others: ['fire', 'earth', 'wind']
  },
  earth: {
    faIcon: 'mountain',
    pathData: tenTenPathData(earth),
    miniPathData: threeThreePathData(earth),
    pathWidth: parseInt(earth.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(earth.getAttribute('vert-adv-y')),
    fill: '#dddd66',
    stroke: '#ffff00',
    others: ['fire', 'water', 'wind']
  },
  wind: {
    faIcon: 'cloud',
    pathData: tenTenPathData(wind),
    miniPathData: threeThreePathData(wind),
    pathWidth: parseInt(wind.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(wind.getAttribute('vert-adv-y')),
    fill: '#bbffbb',
    stroke: '#00ff00',
    others: ['fire', 'water', 'earth']
  },
  gray: {
    faIcon: 'circle',
    pathData: tenTenPathData(gray),
    miniPathData: threeThreePathData(gray),
    pathWidth: parseInt(gray.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(gray.getAttribute('vert-adv-y')),
    fill: '#dddddd',
    stroke: '#5A5A5A',
    others: ['gray', 'gray', 'gray']
  },
  unknown: {
    faIcon: 'question',
    pathData: tenTenPathData(question),
    miniPathData: threeThreePathData(question),
    pathWidth: parseInt(question.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(question.getAttribute('vert-adv-y')),
    fill: 'pink',
    stroke: 'violet',
    others: ['question', 'question', 'question']
  }
};

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

const SORT_BY = {
  ID: 'id',
  NAME: 'name'
};

export default class Cards extends Morph {
  async initialize() {

    this.setAttribute("tabindex", 0);
    this.windowTitle = "UBG Cards Viewer";
    this.addEventListener('contextmenu', evt => this.onMenuButton(evt), false);

    this.filter.value = this.filterValue;

    this.updateView();
    lively.html.registerKeys(this);
    this.registerButtons();
    
    this.cardFrameStyle.addEventListener('input', evt => this.updateCardInEditor(this.card), false);
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
      entry.updateToFilter(filterValue);
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
      } else {
        this.scrollSelectedItemIntoView();
      }
    } else {
      const newItem = this.findNextVisibleItem(undefined, false, false);
      if (newItem) {
        this.selectEntry(newItem);
      }
    }
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

  async onKeyDown(evt) {
    if (evt.key === 'PageUp') {
      evt.stopPropagation();
      evt.preventDefault();

      this.selectNextEntryInDirection(true, !evt.repeat);
      return;
    }

    if (evt.key === 'PageDown') {
      evt.stopPropagation();
      evt.preventDefault();

      this.selectNextEntryInDirection(false, !evt.repeat);
      return;
    }

    if (evt.ctrlKey && evt.key == "s") {
      evt.stopPropagation();
      evt.preventDefault();

      if (!evt.repeat) {
        await this.saveJSON();
      } else {
        lively.warn('prevent saving multiple times');
      }
      return;
    }

    if (evt.ctrlKey && evt.key == "i") {
      evt.stopPropagation();
      evt.preventDefault();

      if (!evt.repeat) {
        await this.onImportNewCards(evt);
      } else {
        lively.warn('prevent importing multiple times');
      }
      return;
    }

    if (evt.ctrlKey && evt.key == "+") {
      evt.stopPropagation();
      evt.preventDefault();

      if (!evt.repeat) {
        await this.addNewCard();
      } else {
        lively.warn('prevent adding multiple new cards');
      }
      return;
    }

    if (evt.ctrlKey && evt.key == "Delete") {
      evt.stopPropagation();
      evt.preventDefault();

      if (!evt.repeat) {
        await this.deleteCurrentEntry();
      } else {
        lively.warn('prevent deleting multiple cards');
      }
      return;
    }

    if (evt.ctrlKey && evt.key == "/") {
      evt.stopPropagation();
      evt.preventDefault();

      this.filter.select();
      return;
    }

    lively.notify(evt.key, evt.repeat);
  }

  selectNextEntryInDirection(up, loop) {
    const newEntry = this.findNextVisibleItem(this.selectedEntry, up, loop);
    if (newEntry) {
      this.selectEntry(newEntry);
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

  async addCards(cards) {
    for await (const card of cards) {
      await this.addCard(card)
    }
  }
  
  async addCard(card) {
    this.cards.push(card);
    await this.appendCardEntry(card);
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

    debugger
    if (!this.cards) {
      this.cards = [];
      try {
        const cardsToLoad = await this.loadCardsFromFile();
        await this.addCards(cardsToLoad)
      } catch (e) {
        this.innerHTML = "" + e;
      }
    } else {
      // ensure an entry for each card
      const currentEntries = this.allEntries;
      for (const card of this.cards) {
        let entry = currentEntries.find(entry => entry.card === card);
        if (!entry) {
          entry = await this.appendCardEntry(card);
        }
      }
    }
    await this.updatePreview(this.cards);

    this.selectCard(this.card || this.cards.first);
  }

  get allEntries() {
    return [...this.querySelectorAll('ubg-cards-entry')];
  }

  get selectedEntry() {
    return this.allEntries.find(entry => entry.hasAttribute('selected'));
  }

  selectEntry(entry) {
    this.selectCard(entry.card);
  }

  selectCard(card) {
    this.card = card;

    this.allEntries.forEach(entry => {
      if (entry.value === card) {
        entry.setAttribute('selected', true);
      } else {
        entry.removeAttribute('selected');
      }
    });

    this.updateCardInEditor(card);
    this.scrollSelectedItemIntoView();
  }
  
  updateCardInEditor(card) {
    this.editor.src = card;
  }

  entryForCard(card) {
    return this.allEntries.find(entry => entry.card === card);
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
        
        // a.æÆ()
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

  /*MD ## Rendering MD*/
  async renderCard(doc, cardDesc, outsideBorder, assetsInfo) {
    if (this.useOldMagicStyle()) {
      return await this.renderMagicStyle(doc, cardDesc, outsideBorder, assetsInfo)
    } else {
      return await this.renderFullBleedStyle(doc, cardDesc, outsideBorder, assetsInfo)
    }
  }
  
  get cardFrameStyle() {
    return this.get('#magic-style')
  }

  useOldMagicStyle() {
    return this.cardFrameStyle.checked
  }

  async getBackgroundImage(doc, cardDesc, bounds, assetsInfo) {
    const id = cardDesc.id;
    const typeString = cardDesc.getType() && cardDesc.getType().toLowerCase && cardDesc.getType().toLowerCase()
    const assetFileName = id + '.jpg';
    
    let preferredCardImage;
    if (id && assetsInfo.find(entry => entry.type === 'file' && entry.name === assetFileName)) {
      preferredCardImage = this.assetsFolder + assetFileName;
    } else {
      preferredCardImage = this.assetsFolder + ({
        gadget: 'default-gadget.jpg',
        goal: 'default-goal.jpg',
        spell: 'default-spell.jpg'
      }[typeString] || 'default.jpg');
    }
    
    const img = await globalThis.__ubg_file_cache__.getFile(preferredCardImage, getImageFromURL);

    const imgRect = lively.rect(0, 0, img.width, img.height);
    const scaledRect = imgRect.fitToBounds(bounds, true);

    return { img, scaledRect }
  }
  
  async renderMagicStyle(doc, cardDesc, outsideBorder, assetsInfo) {
    const currentVersion = cardDesc.versions.last;

    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // black border
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
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, innerBorder, assetsInfo);

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
    doc.text(currentVersion.name || '<no name>', ...titleBar.leftCenter().addX(2).toPair(), { align: 'left', baseline: 'middle' });
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
    const ubgTest = document.querySelector('#ubg-test');
    if (ubgTest && false) {
      lively.notify(244);
      await new Promise((resolve, reject) => {
        doc.html(ubgTest, {
          callback: resolve,
          x: ruleBox.x,
          y: ruleBox.y
        });
      });
    } else {}
    // const ruleTextBox = ruleBox.insetBy(2);
    // doc.setFontSize(9);
    // doc.setTextColor('#000000');
    // doc.text(currentVersion.text, ...ruleTextBox.topLeft().toPair(), { align: 'left', baseline: 'top', maxWidth: ruleTextBox.width });


    // type & elements
    doc.saveGraphicsState();
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${currentVersion.type || '<no type>'} - ${currentVersion.elements || currentVersion.element || '<no element>'}`, ruleBox.left(), ruleBox.top() - .5, { align: 'justify', baseline: 'bottom' });
    doc.restoreGraphicsState();

    await this.renderRuleText(doc, ruleBox, currentVersion.text);
  }

  async renderFullBleedStyle(doc, cardDesc, outsideBorder, assetsInfo) {
    const type = cardDesc.getType();
    const typeString = type && type.toLowerCase && type.toLowerCase() || '';

    if (typeString === 'spell') {
      await this.renderSpell(doc, cardDesc, outsideBorder, assetsInfo)
    } else if (typeString === 'gadget') {
      await this.renderGadget(doc, cardDesc, outsideBorder, assetsInfo)
    } else if (typeString === 'goal') {
      await this.renderGoal(doc, cardDesc, outsideBorder, assetsInfo)
    } else {
      await this.renderMagicStyle(doc, cardDesc, outsideBorder, assetsInfo)
    }
    
    this.renderIsBad(doc, cardDesc, outsideBorder)
  }
  
  /*MD ### Rendering Card Types MD*/
  async renderSpell(doc, cardDesc, outsideBorder, assetsInfo) {
    const currentVersion = cardDesc.versions.last;

    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    const withinCardBorder = cb => doc::withGraphicsState(() => {
      doc.roundedRect(...outsideBorder::xYWidthHeight(), 3, 3, null); // set clipping area
      doc.internal.write('W n');

      cb();
    });

    // background card image
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, outsideBorder, assetsInfo);
    withinCardBorder(() => {
      doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());
    });

    withinCardBorder(() => {
      doc::withGraphicsState(() => {
        doc.setGState(new doc.GState({ opacity: BOX_FILL_OPACITY }));
        doc.setFillColor(BOX_FILL_COLOR);
        doc.rect(...outsideBorder::xYWidthHeight(), 'F');
      });
    })

    // spell circle
    {
      const CIRCLE_BORDER = -3;
      const RADIUS = (outsideBorder.width - CIRCLE_BORDER) / 2;
      const middle = outsideBorder.center().withY(outsideBorder.top() + CIRCLE_BORDER + RADIUS)

      withinCardBorder(() => {
        doc::withGraphicsState(() => {
          doc.circle(...middle.toPair(), RADIUS, null);
          doc.internal.write('W n');

          doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());

          doc.setDrawColor(BOX_STROKE_COLOR);
          doc.setLineWidth(2*1)
          doc.circle(...middle.toPair(), RADIUS, 'D');
        })
      })
    }

    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // doc.setFillColor(120, 120, 120);
    // doc.roundedRect(...innerBorder::xYWidthHeight(), 3, 3, 'FD');

    // id
    doc::withGraphicsState(() => {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`${cardDesc.id || '???'}/${cardDesc.getHighestVersion()}`, innerBorder.right(), (innerBorder.bottom() + outsideBorder.bottom()) / 2, { align: 'right', baseline: 'middle' });
    });
    
    // title
    const TITLE_BAR_HEIGHT = 7;
    const COST_COIN_RADIUS = 4;
    const COST_COIN_MARGIN = 2;
    
    const titleBorder = innerBorder.insetBy(1);
    titleBorder.height = TITLE_BAR_HEIGHT;

    this.renderTitleBarAndCost(doc, cardDesc, titleBorder, COST_COIN_RADIUS, COST_COIN_MARGIN)

    // rule box
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .4;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    // const ruleBox = innerBorder.insetBy(1);
    // const height = innerBorder.height * .4;
    // ruleBox.y = ruleBox.bottom() - height;
    // ruleBox.height = height;
    withinCardBorder(() => {
      doc::withGraphicsState(() => {
        doc.setGState(new doc.GState({ opacity: BOX_FILL_OPACITY }));
        doc.setFillColor(BOX_FILL_COLOR);
        // doc.rect(...ruleBox::xYWidthHeight(), 'F');
      })
    })

    doc::withGraphicsState(() => {
      doc.setLineWidth(1);
      doc.setDrawColor(BOX_STROKE_COLOR);
      doc.setLineDashPattern([2,1], 0);
      // doc.line(ruleBox.left(), ruleBox.top(), ruleBox.right(), ruleBox.top());
    });

    // rule text
    const ruleTextBox = await this.renderRuleText(doc, ruleBox, currentVersion.text);

    // type & elements
    const typeAndElementAnchor = ruleTextBox.topLeft().addY(-4);
    this.renderTypeAndElement(doc, cardDesc, typeAndElementAnchor, BOX_FILL_COLOR, BOX_FILL_OPACITY)
  }


  
  async renderGadget(doc, cardDesc, outsideBorder, assetsInfo) {
    const currentVersion = cardDesc.versions.last;

    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    const withinCardBorder = cb => doc::withGraphicsState(() => {
      doc.roundedRect(...outsideBorder::xYWidthHeight(), 3, 3, null); // set clipping area
      doc.internal.write('W n');

      cb();
    });

    // background card image
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, outsideBorder, assetsInfo);
    withinCardBorder(() => {
      doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());
    });

    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // doc.setFillColor(120, 120, 120);
    // doc.roundedRect(...innerBorder::xYWidthHeight(), 3, 3, 'FD');

    // id
    doc::withGraphicsState(() => {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`${cardDesc.id || '???'}/${cardDesc.getHighestVersion()}`, innerBorder.right(), (innerBorder.bottom() + outsideBorder.bottom()) / 2, { align: 'right', baseline: 'middle' });
    });

    // top box
    const ruleBox2 = outsideBorder.copy()
    ruleBox2.height = 13;
    withinCardBorder(() => {
      doc::withGraphicsState(() => {
        doc.setGState(new doc.GState({ opacity: BOX_FILL_OPACITY }));
        doc.setFillColor(BOX_FILL_COLOR);
        doc.rect(...ruleBox2::xYWidthHeight(), 'F');
      })
    })

    doc::withGraphicsState(() => {
      doc.setLineWidth(1);
      doc.setDrawColor(BOX_STROKE_COLOR);
      doc.setLineDashPattern([2,0], 0);
      doc.line(ruleBox2.left(), ruleBox2.bottom(), ruleBox2.right(), ruleBox2.bottom());
    });

    // title
    const TITLE_BAR_HEIGHT = 7;
    const COST_COIN_RADIUS = 4;
    const COST_COIN_MARGIN = 2;
    
    const titleBorder = innerBorder.insetBy(1);
    titleBorder.height = TITLE_BAR_HEIGHT;

    this.renderTitleBarAndCost(doc, cardDesc, titleBorder, COST_COIN_RADIUS, COST_COIN_MARGIN)
        
    // rule box
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .4;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    withinCardBorder(() => {
      doc::withGraphicsState(() => {
        doc.setGState(new doc.GState({ opacity: BOX_FILL_OPACITY }));
        doc.setFillColor(BOX_FILL_COLOR);
        doc.rect(...ruleBox::xYWidthHeight(), 'F');
      })
    })

    doc::withGraphicsState(() => {
      doc.setLineWidth(1);
      doc.setDrawColor(BOX_STROKE_COLOR);
      doc.setLineDashPattern([2,0], 0);
      doc.line(ruleBox.left(), ruleBox.top(), ruleBox.right(), ruleBox.top());
    });

    // type & elements
    doc.saveGraphicsState();
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${currentVersion.type || '<no type>'} - ${currentVersion.elements || currentVersion.element || '<no element>'}`, ruleBox.left(), ruleBox.top() - .5, { align: 'justify', baseline: 'bottom' });
    doc.restoreGraphicsState();

    // rule text
    await this.renderRuleText(doc, ruleBox, currentVersion.text);
  }

  async renderGoal(doc, cardDesc, outsideBorder, assetsInfo) {
    const currentVersion = cardDesc.versions.last;

    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    const withinCardBorder = cb => doc::withGraphicsState(() => {
      doc.roundedRect(...outsideBorder::xYWidthHeight(), 3, 3, null); // set clipping area
      doc.internal.write('W n');

      cb();
    });

    // background card image
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, outsideBorder, assetsInfo);
    withinCardBorder(() => {
      doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());
    });

    [[outsideBorder.topLeft(), lively.pt(1, 0)], [outsideBorder.topRight(), lively.pt(-1, 0)]].forEach(([startingPt, direction]) => {
      const dirX = direction.x;
      withinCardBorder(() => {
        doc.setGState(new doc.GState({ opacity: 0.5 }));
        doc.setFillColor(BOX_FILL_COLOR);
        doc.setDrawColor(BOX_STROKE_COLOR);
        doc.lines([[dirX*8,0],[0,15],[-dirX*15,15],[dirX*15,15],[0,100], [-dirX*10,0]], ...startingPt.toPair(), [1,1], 'DF', true)
      });
    })
    
    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // doc.setFillColor(120, 120, 120);
    // doc.roundedRect(...innerBorder::xYWidthHeight(), 3, 3, 'FD');

    // id
    doc::withGraphicsState(() => {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`${cardDesc.id || '???'}/${cardDesc.getHighestVersion()}`, innerBorder.right(), (innerBorder.bottom() + outsideBorder.bottom()) / 2, { align: 'right', baseline: 'middle' });
    });

    // title
    const TITLE_BAR_HEIGHT = 7;
    const COST_COIN_RADIUS = 4;
    const COST_COIN_MARGIN = 2;
    
    const titleBorder = innerBorder.insetBy(1);
    titleBorder.height = TITLE_BAR_HEIGHT;

    this.renderTitleBarAndCost(doc, cardDesc, titleBorder, COST_COIN_RADIUS, COST_COIN_MARGIN)
        
    // rule box
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .4;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    withinCardBorder(() => {
      doc::withGraphicsState(() => {
        doc.setGState(new doc.GState({ opacity: BOX_FILL_OPACITY }));
        doc.setFillColor(BOX_FILL_COLOR);
        doc.rect(...ruleBox::xYWidthHeight(), 'F');
      })
    })

    doc::withGraphicsState(() => {
      doc.setLineWidth(1);
      doc.setDrawColor(BOX_STROKE_COLOR);
      doc.setLineDashPattern([2,0], 0);
      doc.line(ruleBox.left(), ruleBox.top(), ruleBox.right(), ruleBox.top());
    });

    // type & elements
    doc.saveGraphicsState();
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${currentVersion.type || '<no type>'} - ${currentVersion.elements || currentVersion.element || '<no element>'}`, ruleBox.left(), ruleBox.top() - .5, { align: 'justify', baseline: 'bottom' });
    doc.restoreGraphicsState();

    // rule text
    await this.renderRuleText(doc, ruleBox, currentVersion.text);
  }
  
  /*MD ### Rendering Card Components MD*/
  renderTitleBarAndCost(doc, cardDesc, border, costCoinRadius, costCoinMargin) {
    const titleBar = border.copy()
    const coinLeftCenter = titleBar.leftCenter()
    const spacingForCoin = 2*costCoinRadius + costCoinMargin
    titleBar.x += spacingForCoin
    titleBar.width -= spacingForCoin

    // title space
//     doc::withGraphicsState(() => {
//       const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);
      
//       doc.setGState(new doc.GState({ opacity: 0.5 }));
//       doc.setFillColor('ffffff');
//       doc.rect(...border::xYWidthHeight(), 'F');
//     });

    // title bar
    doc::withGraphicsState(() => {
      const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);
      
      doc.setGState(new doc.GState({ opacity: .5 }));
      doc.setFillColor(BOX_FILL_COLOR);
      doc.setDrawColor(BOX_STROKE_COLOR);
      doc.roundedRect(...titleBar::xYWidthHeight(), 1, 1, 'DF');
    });

    // card name
    doc.setFontSize(.6 * titleBar.height::mmToPoint());
    doc.setTextColor('#000000');
    doc.text(cardDesc.getName() || '<no name>', ...titleBar.leftCenter().addX(2).toPair(), {
      align: 'left',
      baseline: 'middle',
      maxWidth: titleBar.width
    });

    // cost
    const coinCenter = coinLeftCenter.addXY(costCoinRadius, 0);
    this.renderCost(doc, cardDesc, coinCenter, costCoinRadius)
  }

  renderCost(doc, cardDesc, pos, coinRadius) {
    const COST_SIZE = coinRadius / 4;
    const costDesc = cardDesc.getCost();
    const cost = Array.isArray(costDesc) ? costDesc.first : costDesc;

    const coinCenter = pos;
    doc::withGraphicsState(() => {
      doc.setGState(new doc.GState({ opacity: 0.9 }));
      doc.setFillColor('#b8942d');
      doc.setDrawColor(148, 0, 211);
      doc.setLineWidth(0.2 * COST_SIZE)
      doc.circle(...coinCenter.toPair(), coinRadius, 'DF');
    });

    if (cost !== undefined) {
      doc::withGraphicsState(() => {
        doc.setFontSize(12 * COST_SIZE);
        doc.setTextColor('#000000');
        doc.text('' + cost, ...coinCenter.toPair(), { align: 'center', baseline: 'middle' });
      });
    }
  }

  async renderRuleText(doc, ruleBox, rulesText = '') {
    function coin(text) {
      // background: lightgray;
      return `<svg overflow="visible" style="height: 1em; width: 1em; "xmlns="http://www.w3.org/2000/svg">
<circle cx=".5em" cy=".5em" r=".5em" fill="goldenrod" stroke="darkviolet" stroke-width=".05em" />
<text x="50%" y="50%" text-anchor="middle" dy="0.35em" style="font: .8em sans-serif;">${text}</text>
</svg>`;
    }

    function forElement(element) {
      return elementInfo[element] || elementInfo.unknown;
    }

    function elementSymbol(element) {
      const { fill, stroke, pathData } = forElement(element);
      return `<circle cx="5" cy="5" r="5" fill="${fill}" /><path fill="${stroke}" d="${pathData}"></path>`;
    }

    function element(element) {
      return `<span style="font-size: 1em;"><svg viewbox="0 0 10 10" overflow="visible" style="height: 1em; width: 1em;" xmlns="http://www.w3.org/2000/svg">
${elementSymbol(element)}
</svg></span>`;
    }

    function manaCost(element) {
      const { fill, stroke, pathData, others } = forElement(element);

      function smallElementIcon(element, topLeft) {
        const { fill, stroke, miniPathData } = forElement(element);

        return `<svg x="${topLeft.x}" y="${topLeft.y}">
<circle cx="1.5" cy="1.5" r="1.5" fill="${fill}" />
<path fill="${stroke}" d="${miniPathData}"></path>
</svg>`;
      }
      return `<svg viewbox="0 0 15 10" overflow="visible" style="height: 1em; width: 1.5em;" xmlns="http://www.w3.org/2000/svg">
${elementSymbol(element)}
${smallElementIcon(others[0], lively.pt(11, 0))}
${smallElementIcon(others[1], lively.pt(11.5, 3.5))}
${smallElementIcon(others[2], lively.pt(11, 7))}
</svg>`;
    }

    let printedRules = rulesText;
    printedRules = printedRules.replace(/t3x(fire|water|earth|wind|gray)/gmi, 'tap 3x$1');
    printedRules = printedRules.replace(/(^|\n)tap 3x(fire|water|earth|wind|gray)([^\n]*)/gi, function replacer(match, p1, pElement, pText, offset, string, groups) {
      return `<div>tap <span style="font-size: 3em; margin: 0 .1em 0 0; line-height: 0.85;">3x${pElement}</span>${pText}</div>`;
    });

    printedRules = '<div>' + printedRules.replace(/\n/gmi, '</div><div>') + '</div>';

    printedRules = printedRules.replace(/blitz/gmi, '<i class="fa-solid fa-bolt-lightning"></i>');
    printedRules = printedRules.replace(/\btap\b/gmi, '<i class="fa-sharp fa-solid fa-turn-down fa-rotate-by" style="--fa-rotate-angle: 60deg"></i>');
    printedRules = printedRules.replace(/passive/gmi, '<i class="fa-solid fa-infinity" style="transform: scaleX(.7);"></i>');
    printedRules = printedRules.replace(/start of turn,?/gmi, '<span style="transform: rotate(-10deg);"><i class="fa-regular fa-clock-desk"></i></span>');

    printedRules = printedRules.replace(/3x(fire|water|earth|wind|gray)/gmi, function replacer(match, pElement, offset, string, groups) {
      return manaCost(pElement);
    });
    printedRules = printedRules.replace(/(fire|water|earth|wind|gray)/gmi, function replacer(match, pElement, offset, string, groups) {
      return element(pElement);
    });
    printedRules = printedRules.replace(/\(([*0-9x+-]*)\)/gmi, function replacer(match, p1, offset, string, groups) {
      return coin(p1);
    });

    const ruleTextBox = ruleBox.insetBy(2);
    // doc.rect(ruleBox.x, ruleBox.y, ruleBox.width, ruleBox.height, 'FD')
    
    const elementHTML = <div style={`background: rgba(255,255,255,0.1); width: ${ruleTextBox.width}mm; min-height: ${ruleTextBox.height}mm;`}></div>;
    document.body.append(elementHTML);

    elementHTML.innerHTML = printedRules;

    const canvas = await html2canvas(elementHTML, {
      backgroundColor: null,
      ignoreElements: element => {
        try {
          if (!element) {
            return true;
          }
          return !(element === document.body || element === elementHTML || elementHTML.contains(element));
        } catch (e) {}
      }
    });
    // elementHTML.remove();

    const existCanvas = document.querySelector('#exist-canvas');
    existCanvas && existCanvas.remove();
    document.body.appendChild(canvas);
    canvas.id = 'exist-canvas';

    const existElement = document.querySelector('#exist-element');
    existElement && existElement.remove();
    document.body.appendChild(elementHTML);
    elementHTML.style.overflow = 'visible';
    elementHTML.id = 'exist-element';

    const imgData = canvas.toDataURL('image/png');
    const imgRect = lively.rect(0, 0, canvas.width, canvas.height);
    const scaledRect = imgRect.fitToBounds(ruleTextBox, true);
    scaledRect.y = ruleTextBox.y + ruleTextBox.height - scaledRect.height;
    doc.addImage(imgData, "PNG", ...scaledRect::xYWidthHeight());
    
    return scaledRect
  }

    // type & elements
  renderTypeAndElement(doc, cardDesc, anchorPt, color, opacity) {
    const typeAndElementAnchor = anchorPt
    doc::withGraphicsState(() => {
      doc.setGState(new doc.GState({ opacity: opacity }));
      doc.setFillColor(color);
      
      function curate() {
        return this.toLower().upperFirst();
      }
      function prepend(other) {
        return other + ' ' + this;
      }
      const element = cardDesc.getElement();
      let fullText = (cardDesc.getType() || '<no type>').toLower().upperFirst()
      if (Array.isArray(element)) {
        element.forEach(element => {
          fullText = fullText::prepend(element::curate())
        })
      } else if (element) {
        fullText = fullText::prepend(element::curate())
      }
      doc.setFontSize(7);
      const { w, h } = doc.getTextDimensions(fullText);
      
      const typeElementTextBox = typeAndElementAnchor.extent(lively.pt(w, h))
      const typeElementTextBoxExpansion = 1
      const typeElementBox = typeElementTextBox.expandBy(typeElementTextBoxExpansion)
      const roundedCorner = h/2 + typeElementTextBoxExpansion
      doc.roundedRect(...typeElementBox::xYWidthHeight(), roundedCorner, roundedCorner, 'F');
      
      doc.setTextColor('000');
      doc.text(fullText, typeElementTextBox.left(), typeElementTextBox.centerY(), { align: 'justify', baseline: 'middle' });
    })
  }

renderIsBad(doc, cardDesc, outsideBorder) {
    if (!cardDesc.getIsBad()) {
      return;
    }
    
    doc::withGraphicsState(() => {
      doc.setDrawColor('#ff0000');
      doc.setLineWidth(2*1)
      doc.line(outsideBorder.right(), outsideBorder.top(), outsideBorder.left(), outsideBorder.bottom());
    });
  }

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

  async showPDFData(base64pdf, container, viewer, context = 'ubg-cards-preview') {
    {
      const old = this.pdfContext && this.pdfContext[context];
      if (old) {
        old.pdfDocument.destroy();
        old.pdfViewer.cleanup();
        this.pdfContext[context] = undefined;
      }
    }

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

    (this.pdfContext = this.pdfContext || {})[context] = {
      eventBus,
      pdfLinkService,
      pdfViewer,
      pdfDocument
    };

    await pdfViewer.pagesPromise;
    // #TODO can we advice the pdfView to only render the current page we need?
    // if (this.getAttribute("mode") != "scroll") {
    //   this.currentPage = 1 
    //   this.showPage(this.getPage(this.currentPage))
    // }
  }

  /*MD ## --- MD*/
  toBibtex() {
    var bibtex = "";
    for (var ea of this.querySelectorAll("lively-bibtex-entry")) {
      bibtex += ea.innerHTML;
    }
    return bibtex;
  }

  /*MD ## Sorting MD*/
  get sortBy() {
    return this.getAttribute('sortBy') || SORT_BY.ID;
  }

  set sortBy(key) {
    this.setAttribute('sortBy', key);
  }

  get sortDescending() {
    return this.hasAttribute('sort-descending');
  }

  set sortDescending(bool) {
    if (bool) {
      this.setAttribute('sort-descending', 'true');
    } else {
      this.removeAttribute('sort-descending');
    }
  }

  setSortKeyOrFlipOrder(key) {
    if (this.sortBy === key) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.setAttribute('sortBy', key);
    }
  }

  sortEntries() {
    const sortingFunction = this.getSortingFunction();
    const ascending = !this.sortDescending;
    const sortedEntries = this.allEntries.sortBy(sortingFunction, ascending);
    sortedEntries.forEach(entry => this.append(entry));
  }

  getSortingFunction() {
    return {
      id(entry) {
        return entry.card.getId();
      },
      name(entry) {
        return entry.card.getName();
      }
    }[this.sortBy];
  }

  /*MD ## Main Bar Buttons MD*/
  onSortById(evt) {
    this.setSortKeyOrFlipOrder(SORT_BY.ID);
    this.sortEntries();
  }

  onSortByName(evt) {
    this.setSortKeyOrFlipOrder(SORT_BY.NAME);
    this.sortEntries();
  }

  async onImportNewCards(evt) {
    lively.notify('onImportNewCards' + evt.shiftKey);
    if (that && that.localName === 'lively-code-mirror' && document.contains(that)) {
      lively.showElement(that)
      
      const matches = that.value.matchAll(/^([^0-9]+)?\s([0-9]+)?\s?([a-zA-Z ]+)?\s?(?:\(([0-9,]+)\))?\.\s(.*)?$/gmi);

      const newCards = [...matches].map(match => {
        const card = new Card();

        card.setId(match[2])

        card.setName(match[1])
        card.setType(match[3])
        card.setText(match[5])
        
        let type = ''
        let element;
        const typeElement = match[3].split(' ').forEach(te => {
          if (['gadget', 'goal', 'spell', 'trap'].includes(te.toLowerCase())) {
            type += te
            return
          }

          if (!element) {
            element = te
          } else if (Array.isArray(element)) {
            element.push(te)
          } else {
            element = [element, te]
          }
        })

        if (type) {
          card.setType(type)
        }

        if (element) {
          card.setElement(element)
        }

        const cost = match[4];
        if (cost) {
          card.setCost(cost)
        }
        
        return card;
      });

      const doImport = await lively.confirm(`Import <i>${newCards.length}</i> cards?<br/>${newCards.map(c => c.getName()).join(', ')}`);
      if (doImport) {
        await this.addCards(newCards)
        this.selectCard(newCards.last);

        this.markAsChanged();
      }
    } else {
      const workspace = await lively.openWorkspace("", lively.getPosition(evt))
      await workspace.editorLoaded()
      that = workspace
      workspace.value = 'paste card info here, then press import again'
      workspace.editor.execCommand('selectAll');
      lively.showElement(workspace)
    }
  }

  async onPrintAll(evt) {
    if (!this.cards) {
      return;
    }

    const cardsToPrint = this.cards.slice(0, 15);
    const doc = await this.buildFullPDF(cardsToPrint);

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
    await this.saveJSON();
  }

  async saveJSON() {
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
    await this.addNewCard();
  }

  async addNewCard() {
    const highestId = this.cards.maxProp(card => card.getId());
    const newCard = new Card();
    newCard.setId(highestId + 1);

    await this.addCard(newCard)
    this.selectCard(newCard);

    this.markAsChanged();
  }

  async onDeleteButton(evt) {
    await this.deleteCurrentEntry();
  }

  async deleteCurrentEntry() {
    const cardToDelete = this.card;
    const entryToDelete = this.entryForCard(cardToDelete);

    await this.selectNextEntryInDirection(false, true);

    this.cards.removeItem(cardToDelete);
    entryToDelete.remove();

    this.markAsChanged();
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

  /*MD ## change indicator MD*/
  get textChanged() {
    return this.hasAttribute('text-changed');
  }

  markAsChanged() {
    this.setAttribute('text-changed', true);
  }

  markCardAsChanged(card) {
    const entryToUpdate = this.entryForCard(card);
    if (entryToUpdate) {
      entryToUpdate.updateView();
    }

    this.markAsChanged();
  }

  clearMarkAsChanged() {
    this.removeAttribute('text-changed');
  }

  /*MD ## lively API MD*/
  livelyMigrate(other) {
    this.cards = other.cards;
    this.card = other.card;
  }

  livelySource() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry")).map(ea => ea.textContent).join("");
  }

}