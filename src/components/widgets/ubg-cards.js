/* global globalThis */

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import "src/external/pdf.js";
import { shake } from 'utils';
import { Point } from 'src/client/graphics.js'

import { uuid, without, getTempKeyFor, getObjectFor, flatMap, listAsDragImage } from 'utils';

import paper from 'src/client/paperjs-wrapper.js'
import 'https://lively-kernel.org/lively4/ubg-assets/load-assets.js';

import { querySelectorAllDeep } from 'src/external/querySelectorDeep/querySelectorDeep.js';

import { serialize, deserialize } from 'src/client/serialize.js';
import Card from 'demos/stefan/untitled-board-game/ubg-card.js';
import 'demos/stefan/untitled-board-game/ubg-cards-exporter.js';

import preloaWebComponents from 'src/client/preload-components.js'
await preloaWebComponents(['ubg-card'])

const POKER_CARD_SIZE_INCHES = lively.pt(2.5, 3.5);
const POKER_CARD_SIZE_MM = POKER_CARD_SIZE_INCHES.scaleBy(25.4);

const RUNETERRA_FONT_ID = 'runeterra-fonts'
lively.loadCSSThroughDOM(RUNETERRA_FONT_ID, 'https://lively-kernel.org/lively4/ubg-assets/fonts/runeterra/css/runeterra.css')

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

function isAsync(fn) {
  return fn.constructor === (async () => {}).constructor;
}

/* `this` is a jspdf doc */
function withGraphicsState(cb) {
  if (isAsync(cb)) {
    return (async () => {
      this.saveGraphicsState(); // this.internal.write('q');
      try {
        return await cb();
      } finally {
        this.restoreGraphicsState(); // this.internal.write('Q');
      }
    })();
  } else {
    this.saveGraphicsState(); // this.internal.write('q');
    try {
      return cb();
    } finally {
      this.restoreGraphicsState(); // this.internal.write('Q');
    }
  }
}

const fire = <glyph glyph-name="uniF06D" unicode="uF06D" d="M324 397Q292 368 267 337Q226 394 168 448Q93 377 47 300Q1 222 0 166Q1 102 31 50Q60-2 111-33Q161-63 224-64Q287-63 337-33Q388-2 417 50Q447 102 448 166Q447 209 413 276Q379 343 324 397L324 397M224-16Q149-14 100 38L100 38Q50 89 48 166Q48 202 80 260Q111 318 168 380Q202 345 229 309L265 258L305 306Q313 317 323 327Q358 283 379 237Q400 192 400 166Q398 89 348 38Q299-14 224-16L224-16M314 205L262 146Q261 148 241 173Q221 198 201 224Q180 251 176 256Q144 219 128 192Q112 166 112 142Q113 90 146 61Q178 32 227 32Q265 33 294 53Q326 77 334 114Q341 152 323 187Q319 196 314 205L314 205Z" horiz-adv-x="448" vert-adv-y="512" />;
const water = <glyph glyph-name="uniF043" unicode="uF043" d="M200 80Q222 78 224 56Q222 34 200 32Q156 33 126 63Q97 92 96 137Q96 147 103 154Q110 161 120 161Q130 161 137 154Q144 147 144 137Q145 112 160 97Q176 81 200 80L200 80M368 129Q366 53 316 4L316 4Q267-46 192-48Q117-46 68 4Q18 53 16 129Q17 167 44 224Q71 280 106 336Q141 392 167 429Q177 442 192 442Q207 442 217 429Q243 392 278 336Q313 280 340 224Q367 167 368 129L368 129M307 179Q292 215 269 257Q250 291 230 323Q209 355 192 380Q175 355 154 323Q134 291 115 257Q92 215 77 179Q63 142 64 129Q65 74 101 38Q138 1 192 0Q246 1 283 38Q319 74 320 129Q321 142 307 179L307 179Z" horiz-adv-x="384" vert-adv-y="512" />;
const earth = <glyph glyph-name="uniF6FC" unicode="uF6FC" d="M503 54L280 404Q271 416 256 416Q241 416 232 404L9 54Q-8 26 7-3Q24-30 56-32L456-32Q488-31 505-3Q520 26 503 54L503 54M256 352L328 240L256 240Q244 240 237 230L208 192L179 231L256 352L256 352M462 20Q461 16 456 16L56 16Q51 16 49 20Q47 24 49 28L151 188L189 138Q196 128 208 128Q220 128 227 138L268 192L358 192L463 28Q465 24 462 20L462 20Z" horiz-adv-x="512" vert-adv-y="512" />;
const wind = <glyph glyph-name="uniF72E" unicode="uF72E" d="M24 264L356 264Q395 265 421 291Q447 317 448 356Q447 395 421 421Q395 447 356 448L320 448Q298 446 296 424Q298 402 320 400L356 400Q375 400 387 387Q400 375 400 356Q400 337 387 325Q375 312 356 312L24 312Q2 310 0 288Q2 266 24 264L24 264M164 120L24 120Q2 118 0 96Q2 74 24 72L164 72Q183 72 195 59Q208 47 208 28Q208 9 195-3Q183-16 164-16L128-16Q106-18 104-40Q106-62 128-64L164-64Q203-63 229-37Q255-11 256 28Q255 67 229 93Q203 119 164 120L164 120M420 216L24 216Q2 214 0 192Q2 170 24 168L420 168Q439 168 451 155Q464 143 464 124Q464 105 451 93Q439 80 420 80L384 80Q362 78 360 56Q362 34 384 32L420 32Q459 33 485 59Q511 85 512 124Q511 163 485 189Q459 215 420 216L420 216Z" horiz-adv-x="512" vert-adv-y="512" />;
const gray = <glyph glyph-name="uniF111" unicode="uF111" d="M512 192Q511 120 477 63L477 63Q443 5 385-29L385-29Q328-63 256-64Q184-63 127-29Q69 5 35 63Q1 120 0 192Q1 264 35 321Q69 379 127 413Q184 447 256 448Q328 447 385 413Q443 379 477 321Q511 264 512 192L512 192M256 400Q168 398 109 339L109 339Q50 280 48 192Q50 104 109 45Q168-14 256-16Q344-14 403 45Q462 104 464 192Q462 280 403 339Q344 398 256 400L256 400Z" horiz-adv-x="512" vert-adv-y="512" />;
const question = <glyph glyph-name="uni3f" unicode="?" d="M144 32Q130 32 121 23L121 23Q112 14 112 0Q112-14 121-23Q130-32 144-32Q158-32 167-23Q176-14 176 0Q176 14 167 23Q158 32 144 32L144 32M211 416L104 416Q60 415 30 386Q1 356 0 312L0 296Q2 274 24 272Q46 274 48 296L48 312Q49 336 64 352Q80 367 104 368L211 368Q237 367 254 350Q271 333 272 307Q271 271 240 253L167 215Q121 189 120 137L120 120Q122 98 144 96Q166 98 168 120L168 137Q169 161 189 173L262 211Q289 226 304 251Q320 276 320 307Q319 353 288 384Q257 415 211 416L211 416Z" horiz-adv-x="320" vert-adv-y="512" />;

class PathDataScaleCache {
  static getPathData(element, size = lively.pt(10, 10)) {
    if (!this.cache) {
      this.cache = {}
    }
    
    const key = `${element}-${size.x}-${size.y}`;
    if (!this.cache[key]) {
      // lively.notify(`${element}-${size.x}-${size.y}`, 'cache miss')
      this.cache[key] = this._scalePathData(element, size)
    }
    
    return this.cache[key]
  }
  
  static _scalePathData(element, size) {
    const { glyph } = forElement(element);
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
}

function tenTenPathData(element) {
  return PathDataScaleCache.getPathData(element, lively.pt(10, 10));
}

const elementInfo = {
  fire: {
    name: 'fire',
    faIcon: 'book',
    glyph: fire,
    get pathData() { return tenTenPathData('fire') },
    pathWidth: parseInt(fire.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(fire.getAttribute('vert-adv-y')),
    fill: '#ffbbbb',
    stroke: '#ff0000',
    others: ['water', 'earth', 'wind']
  },
  water: {
    name: 'water',
    faIcon: 'droplet',
    glyph: water,
    get pathData() { return tenTenPathData('water') },
    pathWidth: parseInt(water.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(water.getAttribute('vert-adv-y')),
    fill: '#8888ff',
    stroke: '#0000ff',
    others: ['fire', 'earth', 'wind']
  },
  earth: {
    name: 'earth',
    faIcon: 'mountain',
    glyph: earth,
    get pathData() { return tenTenPathData('earth') },
    pathWidth: parseInt(earth.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(earth.getAttribute('vert-adv-y')),
    fill: 'rgb(255, 255, 183)',
    stroke: '#ffd400',
    others: ['fire', 'water', 'wind']
  },
  wind: {
    name: 'wind',
    faIcon: 'cloud',
    glyph: wind,
    get pathData() { return tenTenPathData('wind') },
    pathWidth: parseInt(wind.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(wind.getAttribute('vert-adv-y')),
    fill: '#bbffbb',
    stroke: '#00ff00',
    others: ['fire', 'water', 'earth']
  },
  gray: {
    name: 'gray',
    faIcon: 'circle',
    glyph: gray,
    get pathData() { return tenTenPathData('gray') },
    pathWidth: parseInt(gray.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(gray.getAttribute('vert-adv-y')),
    fill: '#dddddd',
    stroke: '#5A5A5A',
    others: ['gray', 'gray', 'gray']
  },
  unknown: {
    name: 'unknown',
    faIcon: 'question',
    glyph: question,
    get pathData() { return tenTenPathData('question') },
    pathWidth: parseInt(question.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(question.getAttribute('vert-adv-y')),
    fill: 'pink',
    stroke: 'violet',
    others: ['question', 'question', 'question']
  }
};

function forElement(element) {
  const cleanElement = (element || '').toLowerCase();
  return elementInfo[cleanElement] || elementInfo.unknown;
}

class SVG {

  static inlineSVG(children, bounds = lively.rect(0, 0, 10, 10), attrs = '', style = '') {
    return `<svg viewbox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" overflow="visible" style="display: inline-block;vertical-align: sub;height: 1em; width: ${bounds.width / bounds.height}em; ${style}" xmlns="http://www.w3.org/2000/svg" ${attrs}>${children}</svg>`;
  }

  /*MD ## Basic Shapes MD*/
  static circleRing(center, innerRadius, outerRadius, attrs) {
    return `<path d="M ${center.x} ${(center.y-outerRadius)} A ${outerRadius} ${outerRadius} 0 1 0 ${center.x} ${(center.y+outerRadius)} A ${outerRadius} ${outerRadius} 0 1 0 ${center.x} ${(center.y-outerRadius)} Z M ${center.x} ${(center.y-innerRadius)} A ${innerRadius} ${innerRadius} 0 1 1 ${center.x} ${(center.y+innerRadius)} A ${innerRadius} ${innerRadius} 0 1 1 ${center.x} ${(center.y-innerRadius)} Z" ${attrs || ''}/>`
  }

  static circle(center, radius, attrs) {
    return `<circle cx="${center.x}" cy="${center.y}" r="${radius}" ${attrs || ''}/>`
  }

  /*MD ## Icons MD*/
  static elementGlyph(element, center, radius, attrs) {
    const pathData = PathDataScaleCache.getPathData(element, lively.pt(2 * radius, 2 * radius));
    return `<path d="${pathData}" transform="translate(${center.x-radius},${center.y-radius})" ${attrs || ''}></path>`
  }
  
  static elementSymbol(element, center, radius) {
    const { name: elementName, fill, stroke } = forElement(element);
    const innerRadius = .9 * radius;
    return `${SVG.circle(center, innerRadius, `fill="${fill}"`)}
${SVG.elementGlyph(elementName, center, innerRadius, `fill="${stroke}"`)}
    ${SVG.circleRing(center, innerRadius, radius, `fill="${stroke}"`)}`
  }
}

const castIcon = do {
  const size = 100;
  const bounds = lively.rect(0, 0, size, size)
  const innerBounds = bounds.insetBy(5);
  
  const innerRadius = innerBounds.width / 2;
  const outerCircle = SVG.circleRing(bounds.center(), innerRadius, bounds.width / 2, `fill="#7A7A7A"`);
  
  const sqrt2 = 2**.5
  const radius = innerRadius * 1 / (sqrt2 + 1);
  const distToMiddle = innerRadius * sqrt2 / (sqrt2 + 1);
  const elements = ['water', 'earth', 'fire', 'wind'];
  const mainElements = elements.map((element, i) => {
    const center = bounds.center().addPt(Point.polar(distToMiddle, Math.PI / 2 * i));
    return SVG.elementSymbol(element, center, radius)
  }).join('\n');

  SVG.inlineSVG(`${outerCircle}
${mainElements}`, bounds);
}


function previewSVG(svg) {
  const hedronTemp = document.getElementById(svg.id)
  if (hedronTemp) {
    hedronTemp.remove()
  }
  document.body.insertAdjacentHTML("afterbegin", svg.outerHTML)
}


function rectToViewBox(rect) {
  return `${rect.x} ${rect.y} ${rect.width} ${rect.height}`
}


const CARD_COST_VIEWBOX = lively.rect(0, 0, 376, 326);
const cardCostTwoSVG = do {
  const C_OUTER = 'rgb(243, 243, 243)'
  const C_INNER = 'rgb(129, 129, 129)'
  const C_TOP = 'rgb(162, 165, 168)'
  const C_IMAGE = 'rgb(148, 147, 152)'
  const C_BOTTOM = C_TOP;
  
  const svg = (<svg id='cardCostTwoSVG' xmlns="http://www.w3.org/2000/svg" version="1.1"    style="background: transparent; border: 3px solid palegreen;" height="200" width="200" viewBox={rectToViewBox(CARD_COST_VIEWBOX)}>
      <g>
        <rect x="100" y="35" width="190" height="270" rx="25" ry="25" fill={C_OUTER} stroke={'#ff000088'} stroke-width="1" stroke-dasharray="15,5"/>
        <rect x="115" y="50" width="160" height="240" rx="10" ry="10" fill={C_INNER} stroke={'#00ff0088'} stroke-width="0" stroke-dasharray="15,5"/>
        <rect x="125" y="60" width="140" height={30+95+95} rx="5" ry="5" fill={C_TOP} stroke={'#00ffff88'} stroke-width="0" stroke-dasharray="15,5"/>
        <rect x="125" y="90" width="140" height="95" fill={C_IMAGE} stroke={'#0000ff88'} stroke-width="0" stroke-dasharray="15,5"/>
      </g>
</svg>
);
svg
};

// previewSVG(cardCostTwoSVG)

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

const OUTSIDE_BORDER_ROUNDING = lively.pt(3, 3)

export default class Cards extends Morph {
  async initialize() {

    this.setAttribute("tabindex", 0);
    this.windowTitle = "UBG Cards Viewer";
    this.addEventListener('contextmenu', evt => this.onMenuButton(evt), false);

    this.filter.value = this.filterValue;
    this.rangeStart.value = this.rangeStartValue;
    this.rangeEnd.value = this.rangeEndValue;

    this.updateView();
    lively.html.registerKeys(this);
    this.registerButtons();
    
    this.filter.addEventListener('keydown', evt => {
      if (evt.key === 'Escape') {
        this.filter.value = '';
        evt.stopPropagation();
        evt.preventDefault();
        // programmatic change does not emit an 'input' event, so we emit here explicitly
        this.filter.dispatchEvent(new Event('input', {
          bubbles: true,
          cancelable: true
        }));
      }
    });

    this.cardFrameStyle.addEventListener('input', evt => this.updateCardInEditor(this.card), false);
    for (let eventName of ['input']) {
      this.filter.addEventListener(eventName, evt => this.filterChanged(evt), false);
      this.rangeStart.addEventListener(eventName, evt => this.rangeChanged(evt), false);
      this.rangeEnd.addEventListener(eventName, evt => this.rangeChanged(evt), false);
    }

    this.addEventListener('dragenter', evt => this.dragenter(evt), false);
    this.addEventListener('dragover', evt => this.dragover(evt), false);
    this.addEventListener('dragleave', evt => this.dragleave(evt), false);
    this.addEventListener('drop', evt => this.drop(evt), false);
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

  get rangeStart() {
    return this.get('#rangeStart');
  }
  get rangeStartValue() {
    return this.getAttribute('rangeStart-Value') || '';
  }
  set rangeStartValue(value) {
    this.setAttribute('rangeStart-Value', value);
  }
  get rangeEnd() {
    return this.get('#rangeEnd');
  }
  get rangeEndValue() {
    return this.getAttribute('rangeEnd-Value') || '';
  }
  set rangeEndValue(value) {
    this.setAttribute('rangeEnd-Value', value);
  }

  rangeChanged(evt) {
    this.rangeStartValue = this.rangeStart.value;
    this.rangeEndValue = this.rangeEnd.value;
    
    this.updateItemsToRange();
    this.updateSelectedItemToFilterAndRange();
    return;
  }

  filterChanged(evt) {
    this.filterValue = this.filter.value;

    this.updateItemsToFilter();
    this.updateSelectedItemToFilterAndRange();
    return;
  }

  updateItemsToRange() {
    const start = this.rangeStartValue;
    const end = this.rangeEndValue;
    this.allEntries.forEach(entry => {
      entry.updateToRange(start, end);
    });
  }

  functionForFilter(filter) {
    if (filter.startsWith('>')) {
      let functionBody = `return !!(${filter.substring(1).trim()})`;
      return new Function('c', functionBody);
    }

    filter = filter.toLowerCase();
    const regex = new RegExp(filter, 'gmi')

    return function filterFunction(card) {
      const id = card.getId();
      const name = card.getName();
      const cardType = card.getType()
      const element = card.getElement();
      const cost = card.getCost();
      const text = card.getText();
      const notes = card.getNotes();
      const tags = card.getTags().join(' ');

      const aspects = [id, name, cardType, element, cost, text, notes, tags];
      return aspects.some(aspect => (aspect + '').toLowerCase().match(regex));
    }
  }

  updateItemsToFilter() {
    const filterValue = this.filterValue;
    const filterFunction = this.functionForFilter(filterValue);
    this.allEntries.forEach(entry => {
      entry.updateToFilter(filterFunction);
    });
  }

  updateSelectedItemToFilterAndRange() {
    const selectedEntry = this.selectedEntry;
    if (selectedEntry) {
      if (!selectedEntry.isVisible()) {
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

    const firstPass = listItems.find((item, index) => index > referenceIndex && item.isVisible());
    if (firstPass) {
      return firstPass;
    }

    if (!allowLooping) {
      return;
    }

    return listItems.find((item, index) => index <= referenceIndex && item.isVisible());
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

    if (evt.ctrlKey && !evt.repeat && evt.key == "p") {
      evt.stopPropagation();
      evt.preventDefault();

      if (evt.altKey) {
        this.onPrintChanges(evt)
      } else {
        this.onPrintSelected(evt)
      }
      return;
    }

    if (evt.ctrlKey && !evt.repeat && evt.key == "Tab") {
      evt.stopPropagation();
      evt.preventDefault();

      const otherUBGCards = querySelectorAllDeep('ubg-cards').filter(ubgCards => ubgCards !== this)
      const numOtherUBGCards = otherUBGCards.length;
      if (numOtherUBGCards === 0) {
        lively.warn('no other ubg-cards to copy to')
      return;
      }
      if (numOtherUBGCards >= 2) {
        lively.warn(`too many other ubg-cards found to copy to (${numOtherUBGCards})`)
      return;
      }
      
      const selectedCards = this.getCardsToTransmit();
      if(selectedCards.length === 0) {
        lively.warn(`no cards to copy`)
        return;
      }

      otherUBGCards.first.copyCardsIntoMe(selectedCards)
      
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

    if (evt.ctrlKey && !evt.repeat && ['f', '/'].includes(evt.key)) {
      evt.stopPropagation();
      evt.preventDefault();

      if (this.filter.matches(':focus')) {
        this.editor.focusOnText()
      } else {
        this.filter.select();
      }
      return;
    }

    // lively.notify(evt.key, evt.repeat);
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

    // debugger
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
    this.updateStats()

    this.selectCard(this.card || this.cards.first);
  }

  updateStats() {
    const stats = this.get('#stats');
    try {
      stats.innerHTML = ''
      
      function lowerCase() {
        return this && typeof this.toLowerCase === 'function' && this.toLowerCase();
      }
      
      const typeSplit = Object.entries(this.cards.groupBy(c => c.getType()::lowerCase())).map(([type, cards]) => <div>{type}: {cards.length}</div>);
      const elementSplit = Object.entries(this.cards.groupBy(c => c.getElement()::lowerCase())).map(([element, cards]) => <div style={`color: ${forElement(element).stroke}`}>{element}: {cards.length} ({cards.filter(c => c.getType()::lowerCase() === 'spell').length})</div>);
      stats.append(<div>{...typeSplit}---{...elementSplit}</div>)
    } catch (e) {
      stats.append(<div style='color: red;'>{e}</div>)
    }
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

  getAllTags() {
    if (!this._allTags) {
      const tagCount = new Map();
      this.cards.forEach(card => {
        card.getTags().forEach(tag => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        })
      })
      this._allTags = [...tagCount.entries()].sortBy('first', true).map(pair => ({
        value: pair.first,
        string: `${pair.first} (${pair.second})`
      }));
    }
    return this._allTags
  }
  
  invalidateTags() {
    delete this._allTags
  }

  /*MD ## Build MD*/
  async fetchAssetsInfo() {
    return (await this.assetsFolder.fetchStats()).contents;
  }

  /*MD ### BUILD MD*/
  get editor() {
    return this.get('#editor');
  }

  getCharacterColors() {
  }

  colorsForCard(card) {
    const BOX_FILL_OPACITY = 0.7;

    const currentVersion = card.versions.last;
    
    if (card.getType() === 'character') {
      return ['#efc241', '#b8942d', BOX_FILL_OPACITY];
    }

    const multiElement = Array.isArray(card.getElement());
    if (multiElement) {
      return ['#ff88ff', '#ff00ff', BOX_FILL_OPACITY];
    }

    const singleElementColors = {
      fire: ['#ffaaaa', '#dd0000', BOX_FILL_OPACITY],
      water: ['#aaaaff', '#0000ff', BOX_FILL_OPACITY],
      earth: ['#eeee88', '#cccc00', BOX_FILL_OPACITY],
      wind: ['#88ff88', '#00bb00', BOX_FILL_OPACITY]
    }[currentVersion.element && currentVersion.element.toLowerCase && currentVersion.element.toLowerCase()];
    if (singleElementColors) {
      return singleElementColors;
    }

    return ['#ffffff', '#888888', BOX_FILL_OPACITY];
  }

  /*MD ## Extract Card Info MD*/
  getNameFromCard(cardDesc) {
    const currentVersion = cardDesc.versions.last;
    return currentVersion.name || '<no name>'
  }
  
  getElementsFromCard(cardDesc, grayIfEmpty) {
    const element = cardDesc.getElement();
    if (Array.isArray(element)) {
      return element
    } else if (element) {
      return [element]
    } else {
      return grayIfEmpty ? ['gray'] : []
    }
  }
  getRulesTextFromCard(cardDesc) {
    
  }

  /*MD ## Rendering MD*/
  getSkipCardbacks() {
    return this.get('#skip-cardbacks')
  }

  get cardFrameStyle() {
    return this.get('#magic-style')
  }

  useOldMagicStyle() {
    return this.cardFrameStyle.checked
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
  onOnlyGoodCards(evt) {
    this.filter.value = `> ['essential', 'keep'].includes(c.getRating()) && !c.getTags().includes('expansion')`
    this.filterChanged(evt)
  }
  
  onStartCardScanner(evt) {
    lively.openComponentInWindow('ubg-cards-scanner', undefined, lively.pt(1000, 800))
  }
  
  onSortById(evt) {
    this.setSortKeyOrFlipOrder(SORT_BY.ID);
    this.sortEntries();
  }

  onSortByName(evt) {
    this.setSortKeyOrFlipOrder(SORT_BY.NAME);
    this.sortEntries();
  }
  
  async onCopyIDs(evt) {
    var begin = this.cards.maxProp('id') + 1
    const numIds = 100;
    const idsText =  numIds.times(i => begin + i).join('\n')
    
    try {
      await this.copyTextToClipboard(idsText);
      lively.success('copied ids for google docs!');
    } catch (e) {
      shake(this.get('#copyIDs'));
      lively.error('copying failed', e.message);
    }
  }

  async onImportNewCards(evt) {
    lively.notify('onImportNewCards' + evt.shiftKey);
    if (that && that.localName === 'lively-code-mirror' && document.contains(that)) {
      lively.showElement(that)
      
      const matches = that.value.matchAll(/^([^0-9]+)?\s([0-9]+)?\s?([a-zA-Z ]+)?\s?(?:\(([0-9,]+)\))?(?:\s?([0-9*+-]+))?\.\s(.*)?$/gmi);

      const newCards = [...matches].map(match => {
        const card = new Card();

        const id = match[2];
        const intId = parseInt(id);
        if (!_.isNaN(intId)) {
          card.setId(intId)
        } else {
          card.setId(id)
        }

        card.setName(match[1])
        card.setText(match[6])
        
        const typesAndElements = match[3];
        if (typesAndElements) {
          let type = ''
          let element;
          const typeElement = match[3].split(' ').forEach(te => {
            if (!te) {
              return;
            }

            if (['gadget', 'character', 'spell'].includes(te.toLowerCase())) {
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
        }

        const cost = match[4];
        const intCost = parseInt(cost);
        if (!_.isNaN(intCost)) {
          card.setCost(intCost)
        } else {
          if (cost) {
            card.setCost(cost)
          }
        }
        
        const baseVP = match[5];
        const intBaseVP = parseInt(baseVP);
        if (!_.isNaN(intBaseVP)) {
          card.setBaseVP(intBaseVP)
        } else {
          if (baseVP) {
            card.setBaseVP(baseVP)
          }
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

  async onArtDesc(evt) {
    const text = do {
      const assetsInfo = await this.fetchAssetsInfo();
      let ids = []
      for (let entry of assetsInfo) {
        if (entry.type !== 'file') {
          continue
        }
        
        const match = entry.name.match(/^(.+)\.jpg$/)
        if (!match) {
          continue
        }
        
        // const id = parseInt(match[1])
        // if (_.isInteger(id)) {
        //   ids.push(id)
        // }
        ids.push(match[1])
      }
      
      let cards = this.cards;
      cards = cards
        .filter(c => !c.hasTag('bad'))
        // we just use a string match for now
        .filter(c => !ids.includes(c.getId() + '')).sortBy('id')
      cards.map(c => {
        const artDesc = c.getArtDirection() || c.getName();
        return `[${c.getId()}, '${artDesc}'],`
      }).join('\n')
    };

    try {
      await this.copyTextToClipboard(text)
      lively.success('copied art description!');
    } catch (e) {
      shake(this.get('#artDesc'));
      lively.error('copying failed', e.message);
    }
  }
  
  async copyTextToClipboard(text) {
    const type = "text/plain";
    const blob = new Blob([text], { type });
    // evt.clipboardData.setData('text/html', html);
    const data = [new ClipboardItem({ [type]: blob })];

    return await navigator.clipboard.write(data);
  }
  
  filterCardsForPrinting(cards) {
    return cards.filter(card => {
      if (card.getRating() === 'remove') {
        return false;
      }

      if (card.hasTag('duplicate')) {
        return false;
      }
      if (card.hasTag('unfinished')) {
        return false;
      }
      if (card.hasTag('bad')) {
        return false;
      }
      if (card.hasTag('deprecated')) {
        return false;
      }

      return true
    })
  }

  async onPrintSelected(evt) {
    if (!this.cards) {
      return;
    }

    const filteredEntries = this.allEntries.filter(entry => entry.isVisible())
    const cardsToPrint = this.filterCardsForPrinting(filteredEntries.map(entry => entry.card))
    
    if (await this.checkForLargePrinting(cardsToPrint)) {
      await this.printForExport(cardsToPrint);
    }
  }

  async onPrintChanges(evt) {
    if (!this.cards) {
      return;
    }
    
    const cardsToPrint = this.filterCardsForPrinting(this.cards.filter(card => !card.getIsPrinted()));

    if (await this.checkForLargePrinting(cardsToPrint)) {
      await this.printForExport(cardsToPrint);
    }
  }
  
  async checkForLargePrinting(cardsToPrint) {
    if (cardsToPrint.length > 30) {
      return await lively.confirm(`Print <b>${cardsToPrint.length}</b> cards?<br/>${cardsToPrint.slice(0, 30).map(c => c.getName()).join(', ')}, ...`);
    }
    
    return true;
  }
  
  async printForExport(cards) {
    if (cards.length === 0) {
      lively.warn('no cards to print for export');
      return;
    }
    
    // mark newly printed cards as printed
    let anyNewlyPrintedCard = false
    cards.forEach(card => {
      if (card.getIsPrinted()) {
        return
      }
      anyNewlyPrintedCard = true
      card.setIsPrinted(true)
    })
    if (anyNewlyPrintedCard) {
      this.markAsChanged()
    }
    
    const skipCardBack = this.getSkipCardbacks();
    await globalThis.__ubg_html_to_pdf_exporter__.execute(cards, this, skipCardBack)
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
      evt.stopPropagation();
      evt.preventDefault();

      const menu = new ContextMenu(this, [
        ["foo", () => {
          lively.notify(123)
        }], ["bar", () => {
          lively.notify(456)
        }]
      ]);
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

  /*MD ## Drag & Drop Cards MD*/
  addDragInfoTo(evt) {
    const dt = evt.dataTransfer;
    // #TODO: An improved fix would be to change what is returned by the widget selection
    const selectedCards = this.getCardsToTransmit();
    if(selectedCards.length > 0) {
      dt.setData("javascript/object", getTempKeyFor(selectedCards));
    } else {
      lively.error('no cards to drag');
    }

    dt.setData("ubg", '');
    dt.setData(this.getDataTransferID(), '');

    listAsDragImage(selectedCards, evt, -10, 2);
  }

  getCardsToTransmit() {
    return this.card ? [this.card] : []
  }
  
  getDataTransferID() {
    return "ubg/source-" + lively.ensureID(this)
  }
  
  dragenter(evt) {}
  dragover(evt) {
    evt.preventDefault();

    this._resetDropOverEffects();
    this.classList.add('over');
    
    const dt = evt.dataTransfer;
    const types = dt.types;

    if (!types.includes('ubg')) {
      this.classList.add('reject-drop');
      return;
    }

    if (types.includes(this.getDataTransferID())) {
      // cannot drop on myself
      this.classList.add('reject-drop');
      return;
    }
    
    const hasData = dt.types.includes("javascript/object");
    if(!hasData) {
      this.classList.add('reject-drop');
      return;
    }
    
    this.classList.add('accept-drop');
    dt.dropEffect = "copy";
  }

  dragleave(evt) {
    this._resetDropOverEffects();
  }
  
  _resetDropOverEffects() {
    this.classList.remove('over');
    this.classList.remove('reject-drop');
    this.classList.remove('accept-drop');
  }
  
  async drop(evt) {
    this._resetDropOverEffects();

    const dt = evt.dataTransfer;
    const types = dt.types;

    if (!types.includes('ubg')) {
      return;
    }

    if (types.includes(this.getDataTransferID())) {
      lively.warn('cannot drop onto myself')
      return;
    }
    
    const hasData = dt.types.includes("javascript/object");
    if(!hasData) {
      this.classList.add('reject-drop');
      return;
    }
    
    evt.stopPropagation();
    
    const myWindow = lively.allParents(this).find(ele => ele && ele.localName === 'lively-window')
    if(myWindow) {
      lively.gotoWindow(myWindow, true);
    } else {
      lively.notify('no window')
    }
    this.editor.focusOnText()
    
    const data = getObjectFor(dt.getData("javascript/object"));
    await this.copyCardsIntoMe(data)
  }
  
  async copyCardsIntoMe(cards) {
    const copiedCards = deserialize(serialize(cards), { Card })
    await this.addCards(copiedCards)
    this.selectCard(copiedCards.last);
    if (cards.length === 1) {
      lively.success(`Copied ${cards.first.getName()}`);
    } else {
      lively.success(`Copied ${copiedCards.length} card(s)`);
    }
    this.markAsChanged()
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