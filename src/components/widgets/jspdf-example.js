/* global globalThis */

import Morph from 'src/components/widgets/lively-morph.js';
import "src/external/pdf.js";
import { Point } from 'src/client/graphics.js'

import paper from 'src/client/paperjs-wrapper.js'
// import 'https://lively-kernel.org/lively4/ubg-assets/load-assets.js';

import { deserialize } from 'src/client/serialize.js';

// import preloaWebComponents from 'src/client/preload-components.js'
// await preloaWebComponents(['ubg-card'])

const POKER_CARD_SIZE_INCHES = lively.pt(2.5, 3.5);
const POKER_CARD_SIZE_MM = POKER_CARD_SIZE_INCHES.scaleBy(25.4);

class Card {
  
  constructor() {
    this.versions = [{}];
  }

  static foo() {}

  getId() {
    return this.id;
  }

  setId(id) {
    if (id === undefined) {
      delete this.id;
    } else {
      this.id = id;
    }
  }

  getName() {
    return this.versions.last.name;
  }

  setName(name) {
    this.ensureUnprintedVersion();
    this.versions.last.name = name;
  }

  getType() {
    return this.versions.last.type;
  }

  setType(type) {
    this.ensureUnprintedVersion();
    this.versions.last.type = type;
  }

  getElement() {
    return this.versions.last.element;
  }

  setElement(element) {
    this.ensureUnprintedVersion();
    this.versions.last.element = element;
  }

  getCost() {
    return this.versions.last.cost;
  }

  setCost(cost) {
    this.ensureUnprintedVersion();
    this.versions.last.cost = cost;
  }

  getBaseVP() {
    return this.versions.last.baseVP;
  }

  setBaseVP(baseVP) {
    this.ensureUnprintedVersion();

    if (!baseVP) {
      delete this.versions.last.baseVP;
    } else {
      this.versions.last.baseVP = baseVP;
    }
  }

  getText() {
    return this.versions.last.text;
  }

  setText(text) {
    this.ensureUnprintedVersion();
    
    if (text) {
      this.versions.last.text = text;
    } else {
      delete this.versions.last.text;
    }
  }

  getNotes() {
    return this.notes;
  }

  setNotes(notes) {
    if (notes === undefined || notes === '') {
      delete this.notes;
    } else {
      this.notes = notes;
    }
  }

  getRating() {
    return this.versions.last.rating;
  }

  setRating(rating) {
    this.ensureUnprintedVersion();

    if (rating === undefined || rating === 'unset') {
      delete this.versions.last.rating;
    } else {
      this.versions.last.rating = rating;
    }
  }

  getIsPrinted() {
    return this.versions.last.isPrinted;
  }

  setIsPrinted(isPrinted) {
    if (!isPrinted) {
      delete this.versions.last.isPrinted;
    } else {
      this.versions.last.isPrinted = isPrinted;
    }
  }

  getArtDirection() {
    return this.artDirection;
  }

  setArtDirection(value) {
    if (value === undefined || value === '') {
      delete this.artDirection;
    } else {
      this.artDirection = value;
    }
  }

  getTags() {
    return this.versions.last.tags || [];
  }

  hasTag(tag) {
    return this.getTags().includes(tag)
  }

  addTag(value) {
    this.ensureUnprintedVersion();

    if (value === undefined || value === '' || !_.isString(value)) {
      return;
    }

    if (!this.versions.last.tags) {
      this.versions.last.tags = []
    }
    if (this.hasTag(value)) {
      return;
    }
    
    this.versions.last.tags.push(value);
  }

  removeTag(value) {
    this.ensureUnprintedVersion();

    if (!this.versions.last.tags) {
      this.versions.last.tags = []
    }

    this.versions.last.tags = this.versions.last.tags.filter(tag => tag !== value)

    if (this.versions.last.tags.length === 0) {
      delete this.versions.last.tags
    }
  }

  // #important
  ensureUnprintedVersion() {
    if (this.versions.last.isPrinted) {
      const newLastVersion = _.omit(_.cloneDeep(this.versions.last), 'isPrinted');
      this.versions.push(newLastVersion);
    }
  }

  getHighestVersion() {
    return this.versions.length;
  }

}

class FontCache {

  constructor() {
    this.fonts = {};
  }

  /*MD ## Font Loading & Parsing MD*/
  async getFile(path) {
    if (this.fonts[path]) {
      lively.notify('cache hit')
    } else {
      lively.notify('cache miss')
      this.fonts[path] = this.getBase64Font(path)
    }

    return this.fonts[path];
  }

  async getBase64Font(url) {
    async function blobToBase64String(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Extract the Base64 encoded string
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(blob);
      })
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }
    const blob = await response.blob();
    return blobToBase64String(blob)
  }

  /*MD ## Font Asset Locations MD*/
  async getFontAwesomeFont(fileName) {
    const FONT_AWESOME_FONT_FOLDER = lively4url + '/src/external/font-awesome/fonts/';
    return this.getBase64Font(FONT_AWESOME_FONT_FOLDER + fileName)
  }

  async BASE64_FONT_AWESOME() {
    return this.getFontAwesomeFont('fontawesome-webfont.ttf')
  }
  async BASE64_FONT_AWESOME_THIN() {
    return this.getFontAwesomeFont('fontawesome-webfont.ttf')
  }
  async BASE64_FONT_AWESOME_LIGHT() {
    return this.getFontAwesomeFont('fontawesome-webfont.ttf')
  }
  async BASE64_FONT_AWESOME_REGULAR() {
    return this.getFontAwesomeFont('fontawesome-webfont.ttf')
  }
  async BASE64_FONT_AWESOME_SOLID() {
    return this.getFontAwesomeFont('fontawesome-webfont.ttf')
  }
  async BASE64_FONT_AWESOME_BRANDS() {
    return this.getFontAwesomeFont('fontawesome-webfont.ttf')
  }
  async BASE64_FONT_AWESOME_DUOTONE() {
    return this.getFontAwesomeFont('fontawesome-webfont.ttf')
  }
  
  async getFontLato(fileName) {
    const LATO_FONT_FOLDER = lively4url + '/src/external/fonts/lato/';
    return this.getBase64Font(LATO_FONT_FOLDER + fileName)
  }

  async BASE64_LATO_BOLD() {
    return this.getFontLato('Lato-Bold.ttf')
  }
  async BASE64_LATO_REGULAR() {
    return this.getFontLato('Lato-Regular.ttf')
  }
  async BASE64_LATO_LIGHT() {
    return this.getFontLato('Lato-Light.ttf')
  }
  async BASE64_LATO_THIN_ITALIC() {
    return this.getFontLato('Lato-ThinItalic.ttf')
  }

}

if (globalThis.__my_custom_font_cache__) {
  globalThis.__my_custom_font_cache__.migrateTo(FontCache);
} else {
  globalThis.__my_custom_font_cache__ = new FontCache();
}

const BASE64_FONT_AWESOME = await globalThis.__my_custom_font_cache__.BASE64_FONT_AWESOME()

const BASE64_LATO_BOLD = await globalThis.__my_custom_font_cache__.BASE64_LATO_BOLD()
const BASE64_LATO_REGULAR = await globalThis.__my_custom_font_cache__.BASE64_LATO_REGULAR()
const BASE64_LATO_LIGHT = await globalThis.__my_custom_font_cache__.BASE64_LATO_LIGHT()
const BASE64_LATO_THIN_ITALIC = await globalThis.__my_custom_font_cache__.BASE64_LATO_THIN_ITALIC()

const FONT_NAME_FONT_AWESOME = 'fontawesome'

const FONT_NAME_LATO_BOLD = 'Lato-Bold'
const FONT_NAME_LATO_REGULAR = 'Lato-Regular'
const FONT_NAME_LATO_LIGHT = 'Lato-Light'
const FONT_NAME_LATO_THIN_ITALIC = 'Lato-ThinItalic'

const FONT_NAME_CARD_TYPE = FONT_NAME_LATO_LIGHT

const FONT_NAME_CARD_NAME = FONT_NAME_LATO_BOLD
const FONT_NAME_CARD_COST = FONT_NAME_LATO_BOLD
const FONT_NAME_CARD_VP = FONT_NAME_LATO_BOLD

const FONT_NAME_CARD_TEXT = FONT_NAME_LATO_LIGHT

const LATO_FONT_ID = 'my-lato-fonts'
lively.loadCSSThroughDOM(LATO_FONT_ID, lively4url + '/src/external/fonts/lato/lato.css')

const CSS_CLASS_BEAUFORT_FOR_LOL_BOLD = 'lato-bold'
const CSS_CLASS_BEAUFORT_FOR_LOL_REGULAR = 'lato-regular'
const CSS_CLASS_LATO_LIGHT = 'lato-light'
const CSS_CLASS_LATO_THIN_ITALIC = 'lato-thin-italic'

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


const hedronSVG = do {
  function point(pt) {
    return `${pt.x} ${pt.y}`;
  }

  const topB = lively.pt(11.5, 14.401);
  const topL = topB.addXY(-11.5, -4.758);
  const topT = topL.addXY(11.5, -9.66);
  const topR = topT.addXY(11.5, 9.66);
  const topB2 = topR.addXY(-11.5, 4.758);
  const topLeftData = `M${point(topB)} L ${point(topL)} ${point(topT)} z`;
  const topRightData = `M${point(topB)} L ${point(topT)} ${point(topR)} z`;

  const bottomB = lively.pt(11.5, 16.036);
  const bottomL = bottomB.addXY(-11.5, -5.050);
  const bottomT = bottomL.addXY(11.5, 12.030);
  const bottomR = bottomT.addXY(11.5, -12.030);
  const bottomB2 = bottomR.addXY(-11.5, 5.050);
  const bottomLeftData = `M${point(bottomB)} L ${point(bottomL)} ${point(bottomT)} z`;
  const bottomRightData = `M${point(bottomB)} L ${point(bottomT)} ${point(bottomR)} ${point(bottomB2)} z`;
  
  const greenHedron = true;
  <svg
    id='hedron'
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    width="200"
    height="200"
    viewBox="0 0 23 23"
    style="background: transparent; border: 3px solid palegreen;">
    <path fill={greenHedron ? '#61b565' : "#666"} d={topLeftData}></path>
    <path fill={greenHedron ? '#4b9051' : "#444"} d={topRightData}></path>
    <path fill={greenHedron ? '#326738' : "#444"} d={bottomLeftData}></path>
    <path fill={greenHedron ? '#214327' : "#222"} d={bottomRightData}></path>
  </svg>;
};

{
  const hedronTemp = document.getElementById('hedron')
  if (hedronTemp) {
    hedronTemp.remove()
  }
  document.body.insertAdjacentHTML("afterbegin", hedronSVG.outerHTML)
}

const upgradeSVG = do {
  const svg = (<svg id='upgradeSVG' xmlns="http://www.w3.org/2000/svg" version="1.1" width="200"
    height="200" viewBox="0.00 0.00 36.00 36.00">
<g stroke-width="2.00" fill="none" stroke-linecap="butt">
<path stroke="#805801" vector-effect="non-scaling-stroke" d={`
  M 11.50 16.59
  A 0.48 0.48 0.0 0 0 11.82 16.45
  L 17.59 10.82
  A 0.48 0.48 0.0 0 1 18.26 10.82
  L 24.12 16.45
  A 0.48 0.48 0.0 0 0 24.44 16.58
  L 31.35 16.74
  A 0.48 0.48 0.0 0 0 31.70 15.92
  L 18.29 2.53
  A 0.48 0.48 0.0 0 0 17.61 2.53
  L 4.03 15.99
  A 0.48 0.48 0.0 0 0 4.38 16.81
  L 11.50 16.59`}
/>
<path stroke="#805801" vector-effect="non-scaling-stroke" d={`
  M 11.43 30.15
  A 0.48 0.48 0.0 0 0 11.76 30.02
  L 17.61 24.33
  A 0.48 0.48 0.0 0 1 18.27 24.32
  L 24.19 30.06
  A 0.48 0.48 0.0 0 0 24.52 30.19
  L 31.38 30.25
  A 0.48 0.48 0.0 0 0 31.72 29.43
  L 18.25 16.10
  A 0.48 0.48 0.0 0 0 17.57 16.11
  L 4.13 29.46
  A 0.48 0.48 0.0 0 0 4.47 30.28
  L 11.43 30.15`}
/>
</g>
<path fill="#010101" d={`
  M 12.02 17.72
  L 1.64 17.75
  A 0.31 0.31 0.0 0 1 1.42 17.22
  L 17.72 0.90
  A 0.31 0.31 0.0 0 1 18.16 0.90
  L 34.52 17.26
  A 0.31 0.31 0.0 0 1 34.29 17.79
  L 23.81 17.71
  A 0.31 0.31 0.0 0 1 23.59 17.62
  L 18.16 12.18
  A 0.31 0.31 0.0 0 0 17.72 12.18
  L 12.24 17.63
  A 0.31 0.31 0.0 0 1 12.02 17.72
  Z
  M 11.50 16.59
  A 0.48 0.48 0.0 0 0 11.82 16.45
  L 17.59 10.82
  A 0.48 0.48 0.0 0 1 18.26 10.82
  L 24.12 16.45
  A 0.48 0.48 0.0 0 0 24.44 16.58
  L 31.35 16.74
  A 0.48 0.48 0.0 0 0 31.70 15.92
  L 18.29 2.53
  A 0.48 0.48 0.0 0 0 17.61 2.53
  L 4.03 15.99
  A 0.48 0.48 0.0 0 0 4.38 16.81
  L 11.50 16.59
  Z`}
/>
<path fill="#ffaf00" d={`
  M 11.50 16.59
  L 4.38 16.81
  A 0.48 0.48 0.0 0 1 4.03 15.99
  L 17.61 2.53
  A 0.48 0.48 0.0 0 1 18.29 2.53
  L 31.70 15.92
  A 0.48 0.48 0.0 0 1 31.35 16.74
  L 24.44 16.58
  A 0.48 0.48 0.0 0 1 24.12 16.45
  L 18.26 10.82
  A 0.48 0.48 0.0 0 0 17.59 10.82
  L 11.82 16.45
  A 0.48 0.48 0.0 0 1 11.50 16.59
  Z`}
/>
<path fill="#010101" d={`
  M 17.74 25.61
  L 12.16 31.16
  A 0.31 0.31 0.0 0 1 11.94 31.25
  L 1.65 31.27
  A 0.31 0.31 0.0 0 1 1.43 30.74
  L 17.71 14.46
  A 0.31 0.31 0.0 0 1 18.15 14.46
  L 34.44 30.73
  A 0.31 0.31 0.0 0 1 34.22 31.26
  L 23.87 31.26
  A 0.31 0.31 0.0 0 1 23.65 31.17
  L 18.18 25.61
  A 0.31 0.31 0.0 0 0 17.74 25.61
  Z
  M 11.43 30.15
  A 0.48 0.48 0.0 0 0 11.76 30.02
  L 17.61 24.33
  A 0.48 0.48 0.0 0 1 18.27 24.32
  L 24.19 30.06
  A 0.48 0.48 0.0 0 0 24.52 30.19
  L 31.38 30.25
  A 0.48 0.48 0.0 0 0 31.72 29.43
  L 18.25 16.10
  A 0.48 0.48 0.0 0 0 17.57 16.11
  L 4.13 29.46
  A 0.48 0.48 0.0 0 0 4.47 30.28
  L 11.43 30.15
  Z`}
/>
<path fill="#ffaf00" d={`
  M 11.43 30.15
  L 4.47 30.28
  A 0.48 0.48 0.0 0 1 4.13 29.46
  L 17.57 16.11
  A 0.48 0.48 0.0 0 1 18.25 16.10
  L 31.72 29.43
  A 0.48 0.48 0.0 0 1 31.38 30.25
  L 24.52 30.19
  A 0.48 0.48 0.0 0 1 24.19 30.06
  L 18.27 24.32
  A 0.48 0.48 0.0 0 0 17.61 24.33
  L 11.76 30.02
  A 0.48 0.48 0.0 0 1 11.43 30.15
  Z`}
/>
</svg>);
svg
};

{
  const hedronTemp = document.getElementById('upgradeSVG')
  if (hedronTemp) {
    hedronTemp.remove()
  }
  document.body.insertAdjacentHTML("afterbegin", upgradeSVG.outerHTML)
}


function rectToViewBox(rect) {
  return `${rect.x} ${rect.y} ${rect.width} ${rect.height}`
}

const TAP_VIEWBOX = lively.rect(2 ,20 ,103 ,103);
const tapSVG = do {
  function toPair(pt) {
    return `${pt.x} ${pt.y}`
  }

  const size = 18
  const tip = lively.pt(83.5, 65)
  const anchor = tip.subY(size);
  const tail = anchor.subXY(20, 25)
  const tipLeft = tip.subXY(size, size)
  const tipRight = tip.addXY(size, -size)
  const anchorLeft = tipLeft.addX(12.5)
  const anchorRight = tipRight.subX(12.5)
  const controlLeft = anchorLeft.subY(18)
  const controlRight = anchorRight.subY(18)
  const controlTail = tail.addX(5)
  const path = <path fill="black" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin='round' d={`
  M ${toPair(tip)}
  L ${toPair(tipLeft)}
  L ${toPair(anchorLeft)}
  C ${toPair(controlLeft)} ${toPair(controlTail)} ${toPair(tail)}
  C ${toPair(controlTail)} ${toPair(controlRight)} ${toPair(anchorRight)}
  L ${toPair(tipRight)}
  Z`}
/>
;
  const C_BACKCARD_FILL = "transparent";
  const C_BACKCARD_STROKE = "black";
  const C_FRONTCARD_FILL = "black";
  const C_FRONTCARD_STROKE = "black";

  const svg = (<svg id='tap-icon-ubg2' xmlns="http://www.w3.org/2000/svg" version="1.1"
  style="background: transparent; border: 3px solid palegreen;"
  width="200"
  height="200" viewBox={rectToViewBox(TAP_VIEWBOX)}>
  <rect x="9" y="25" width="45" height="72" rx="5" ry="5" fill={C_BACKCARD_FILL} stroke={C_BACKCARD_STROKE} stroke-width="8" stroke-dasharray="15,5"/>
  <rect x="24" y="73" width="72" height="45" rx="5" ry="5"  stroke={C_FRONTCARD_STROKE} fill={C_FRONTCARD_FILL} stroke-width="8"/>
      {path}
    </svg>);
svg
}; 

{
  const hedronTemp = document.getElementById('tap-icon-ubg2')
  if (hedronTemp) {
    hedronTemp.remove()
  }
  document.body.insertAdjacentHTML("afterbegin", tapSVG.outerHTML)
}




const tradeSVG = do {
  const path1 = "M19.335 11.943c1.463 0.801 2.775 2.074 4.369 4.148 0.005-0.056 0.010-0.113 0.016-0.171 0.309-3.338 0.912-9.84-9.249-13.17 0.113 0.146 0.508 0.575 0.958 1.064 0.75 0.815 1.651 1.795 1.651 1.901-0.903-0.529-5.419-1.906-9.333 0.847s-5.189 6.67-4.616 11.329c0.455 3.7 3.289 6.799 6.95 8.289-2.584-1.464-4.341-4.342-4.341-7.654 0-4.795 3.684-8.682 8.229-8.682 2.050 0 3.925 0.791 5.366 2.099z";
  const path2 = "M12.665 20.057c-1.463-0.801-2.775-2.074-4.369-4.148-0.005 0.056-0.010 0.113-0.016 0.171-0.309 3.338-0.912 9.839 9.249 13.17-0.113-0.145-0.508-0.575-0.958-1.064-0.75-0.815-1.651-1.795-1.651-1.901 0.903 0.529 5.419 1.906 9.333-0.847s5.189-6.67 4.616-11.329c-0.454-3.7-3.289-6.799-6.95-8.289 2.584 1.464 4.341 4.342 4.341 7.654 0 4.795-3.684 8.682-8.229 8.682-2.050 0-3.925-0.791-5.366-2.099z";
  const svg = (<svg id='tradeSVG' xmlns="http://www.w3.org/2000/svg" height="200" width="200" viewBox="0 0 32 32">
    <defs xmlns="http://www.w3.org/2000/svg">
        <linearGradient id="lor-enlightened-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="25%" stop-color="#3dddca"/>
            <stop offset="75%" stop-color="#41d778"/>
        </linearGradient>
    </defs>
    <path d={path1} fill="black" stroke='black' stroke-width='2'/>
    <path d={path2} fill="black" stroke='black' stroke-width='2'/>
    <path d={path1} fill="url(#lor-enlightened-fill)"/>
    <path d={path2} fill="url(#lor-enlightened-fill)"/>
</svg>);
svg
};

{
  const hedronTemp = document.getElementById('tradeSVG')
  if (hedronTemp) {
    hedronTemp.remove()
  }
  document.body.insertAdjacentHTML("afterbegin", tradeSVG.outerHTML)
}

const CARD_COST_ONE_VIEWBOX = lively.rect(0, 0, 270, 270);
const cardCostOneSVG = do {
  '#d3d3d3'
  const C_OUTER = '#252525'
  const C_INNER = '#d1d1d1'
  const C_TOP = '#e1e5e4'
  const C_IMAGE = '#f4f4f4'
  
  const outer = lively.rect(0, 0, 190, 270)
  const inner = outer.insetBy(15)
  const top = inner.insetBy(10)
  const image = top.insetByRect(lively.rect(0, 30, 0, 45))
  const svg = (<svg id='cardCostOneSVG' xmlns="http://www.w3.org/2000/svg" version="1.1"  style="background: transparent; border: 3px solid palegreen;" height="200" width="200" viewBox={rectToViewBox(CARD_COST_ONE_VIEWBOX)}>
      <g>
        <rect x={outer.x} y={outer.y} width={outer.width} height={outer.height} rx="25" ry="25" fill={C_OUTER} stroke={'#ff000088'} stroke-width="1" stroke-dasharray="15,5"/>
        <rect x={inner.x} y={inner.y} width={inner.width} height={inner.height} rx="10" ry="10" fill={C_INNER} stroke={'#00ff0088'} stroke-width="0" stroke-dasharray="15,5"/>
        <rect x={top.x} y={top.y} width={top.width} height={top.height} rx="5" ry="5" fill={C_TOP} stroke={'#00ffff88'} stroke-width="0" stroke-dasharray="15,5"/>
        <rect x={image.x} y={image.y} width={image.width} height={image.height} fill={C_IMAGE} stroke={'#0000ff88'} stroke-width="0" stroke-dasharray="15,5"/>
      </g>
</svg>

);
svg
};

{
  const hedronTemp = document.getElementById('cardCostOneSVG')
  if (hedronTemp) {
    hedronTemp.remove()
  }
  document.body.insertAdjacentHTML("afterbegin", cardCostOneSVG.outerHTML)
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

{
  const hedronTemp = document.getElementById('cardCostTwoSVG')
  if (hedronTemp) {
    hedronTemp.remove()
  }
  document.body.insertAdjacentHTML("afterbegin", cardCostTwoSVG.outerHTML)
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

const SORT_BY = {
  ID: 'id',
  NAME: 'name'
};

const VP_FILL = 'violet';
const VP_STROKE = '#9400d3'; // darkviolet
const VP_FILL_ZERO = '#ddd';
const VP_STROKE_ZERO = 'gray';
const AFFECT_ALL_COLOR = 'rgba(255, 0, 0, 0.2)';

import 'src/external/dom-to-image.js'
const affectAllBackground = await (async function getAffectAllBackground() {
  const div = <div style={`height: 14.14px; width: 14.14px; background: repeating-linear-gradient(-45deg, transparent, transparent 5px, ${AFFECT_ALL_COLOR} 5px, ${AFFECT_ALL_COLOR} 10px);`}></div>;
  document.body.append(div)
  try {
    const dataUrl = await globalThis.domtoimage.toPng(div)
    return `url(${dataUrl})`;
  } finally {
    div.remove();
  }
})()

class RuleTextRenderer {
  
  static parseEffectsAndLists(printedRules) {
    function prepRule(rule) {
      return rule
      return `<span style="background: steelblue;">${rule}</span>`
    }

    const lines = printedRules.split('\n');
    if (lines.length === 0) {
      return printedRules;
    }

    const result = [`<div>
${prepRule(lines.shift())}</div>`];
    
    lines.forEach(line => {
      const bulletMatch = line.match(/^\s*-\s*(.+)/);
      if (bulletMatch) {
        const content = bulletMatch[1];
        result.push(`<div>• ${prepRule(content)}</div>`);
      } else {
        result.push(`<div style="padding-top: 5pt;">${prepRule(line)}</div>`);
      }
    });

    return result.join('\n');
  }
  
  static chip(text) {
    return `<span style="color: #fff; background: black; border-radius: 100px; padding-left: .3em; padding-right: .3em;">${text}</span>`
  }
  
  static manaCost(element) {
    const { others } = forElement(element);

    return SVG.inlineSVG(`${SVG.elementSymbol(element, lively.pt(5, 5), 5)}
${SVG.elementSymbol(others[0], lively.pt(12.5, 1.5), 1.5)}
${SVG.elementSymbol(others[1], lively.pt(13, 5), 1.5)}
${SVG.elementSymbol(others[2], lively.pt(12.5, 8.5), 1.5)}`, lively.rect(0, 0, 15, 10));
  }
  
  /*MD ## --- MD*/
  // #important
  static async renderRuleText(cardEditor, cardDesc, doc, ruleBox, {
    insetTextBy = 2,
    beforeRenderRules = () => {}
  } = { }) {
    let printedRules = cardDesc.getText() || '';

    // old big cast icon with small tap
    // printedRules = printedRules.replace(/(^|\n)t3x(fire|water|earth|wind|gray)([^\n]*)/gi, function replacer(match, p1, pElement, pText, offset, string, groups) {
    //   return `<div>tap <span style="font-size: 3em; margin: 0 .1em 0 0; line-height: 0.85;">3x${pElement}</span>${pText}</div>`;
    // });

    // separate rules
    printedRules = printedRules.replace(/affectAll(.*)\/affectAll/gmi, function replacer(match, innerText, offset, string, groups) {
      return `<div style='background: ${affectAllBackground}; border: 1px solid ${AFFECT_ALL_COLOR};'>${innerText}</div>`;
    });
    printedRules = this.parseEffectsAndLists(printedRules);

    printedRules = this.renderReminderText(printedRules, cardEditor, cardDesc)
    
    printedRules = printedRules.replace(/\b(?:\d|-|\+)*x(?:\d|-|\+|vp)*\b/gmi, function replacer(match, innerText, offset, string, groups) {
      // find the bigger pattern, then just replace all x instead of reconstructing its surrounding characters
      return match.replace('x', 'hedron')
    });

    printedRules = printedRules.replace(/blitz/gmi, '<i class="fa-solid fa-bolt-lightning"></i>');
    printedRules = printedRules.replace(/passive/gmi, '<i class="fa-solid fa-infinity" style="transform: scaleX(.7);"></i>');
    printedRules = printedRules.replace(/start of turn,?/gmi, '<span><i class="fa-regular fa-clock-desk"></i></span>');
    printedRules = printedRules.replace(/ignition/gmi, '<span><i class="fa-regular fa-clock-desk"></i></span>');
    printedRules = printedRules.replace(/\btrain\b/gmi, '<i class="fa-solid fa-car-side"></i>');
   
    // <cardname>
    printedRules = printedRules.replace(/\bcardname(?::(\d+))?/gmi, (match, cardId, offset, string, groups) => {
      // lor blue card name #519ff1
      // #ffe967
      // #f8d66a
      // #de9b75
      function highlightName(name) {
        return `<span style='color: #1f62e9;'>${name}</span>`
      }
      if (!cardId) {
        return highlightName(cardEditor.getNameFromCard(cardDesc))
      }
      const card = cardEditor.cards.find(card => card.getId() + '' === cardId)
      if (card) {
        return highlightName(cardEditor.getNameFromCard(card))
      } else {
        return `<span style='color: red;'>unknown id: ${cardId}</span>`
      }
    });

   
    printedRules = printedRules.replace(/actionFree/gmi, () => this.chip('free'));
    printedRules = printedRules.replace(/actionOnce/gmi, () => this.chip('once'));
    printedRules = printedRules.replace(/actionMulti/gmi, () => this.chip('multi'));
    printedRules = printedRules.replace(/actionMain:?/gmi, () => {
      return '<i class="fa-solid fa-right"></i>'
    });
    
    printedRules = this.renderCastIcon(printedRules)

    printedRules = printedRules.replace(/manaCost(fire|water|earth|wind|gray)/gmi, (match, pElement, offset, string, groups) => {
      return this.manaCost(pElement);
    });

    printedRules = this.renderElementIcon(printedRules)
    printedRules = this.renderVPIcon(printedRules)
    printedRules = this.renderCardIcon(printedRules)
    printedRules = this.renderCoinIcon(printedRules)
    printedRules = this.renderBracketIcon(printedRules)
    
    printedRules = this.renderKeywords(printedRules)
    printedRules = this.renderHedronIcon(printedRules)
    printedRules = this.renderTapIcon(printedRules)
    
    printedRules = `<span class="${CSS_CLASS_LATO_LIGHT}" style="">${printedRules}</span>`
    
    return this.renderToDoc(ruleBox, insetTextBy, printedRules, beforeRenderRules, doc)
  }
  
  static renderReminderText(printedRules, cardEditor, cardDesc) {
    function italic(text) {
      return `<span class="${CSS_CLASS_LATO_THIN_ITALIC}">${text}</span>`
    }
    
    return printedRules.replace(/\bremind(?:er)?(\w+(?:\-(\w|\(|\))*)*)\b/gmi, (match, myMatch, offset, string, groups) => {
      const keywords = {
        actionquest: () => {
          return 'You may play this when you perform the action.'
        },
        
        affinity: (...args) => {
          let subject = 'This costs'
          if (args.includes('all')) {
            args = args.filter(arg => arg !== 'all')
            // keyword granted
            subject = 'They cost'
          }

          if (args.includes('power')) {
            return subject + ' (x) less.'
          }

          if (args.includes('vpchips')) {
            return subject + ' (1) less per collected vp.'
          }

          if (args.includes('coins')) {
            return subject + ' (1) less per () you have.'
          }

          if (args.includes('cards')) {
            return subject + ' (1) less for each of those cards.'
          }

          if (args.includes('mana')) {
            const elements = args.filter(arg => arg !== 'mana')
            let elementString
            if (elements.length === 1) {
              elementString = elements.first;            
            } else {
              elementString = `${elements.slice(0, -1).join(', ')} or ${elements.last}`;            
            }
            return subject + ` (1) less for each mana on ${elementString}.`
          }

          throw new Error('unspecified type of Affinity')
        },
        
        blueprint: (cost) => {
          return `Effects below are blocked unless this has stored cards costing (${cost}) or more. As a free action, you may store a card from hand, play or trash.`
        },

        bound: (...args) => {
          return 'Only exec bound abilities if the element is called.'
        },
        
        brittle: (...args) => {
          if (args.includes('all')) {
            // keyword granted
            return 'Trash brittle cards after casting them.'
          }
          
          return 'Trash this after casting it.'
        },
        
        convokecast: (...args) => {
          if (args.includes('all')) {
            // keyword granted
            return 'Increase their x by 1 for each other card sharing an element with them.'
          }
          
          return 'Increase this card\'s x by 1 for each other card sharing an element with it.'
        },
        
        countingquest: () => {
          return 'If you fulfill its condition (track with []), as a free action you may trash this to create an Achievement Token.'
        },
        
        cycle: (cost) => {
          if (cost) {
            return `To cycle (${cost}), pay (${cost}) and trash the card to play a card of equal or lower cost.`
          }
          return `To cycle, trash the card to play a card of equal or lower cost.`
        },
        
        cycling: (cost, who) => {
          let whoToPrint = 'this'
          if (who === 'acard') {
            whoToPrint = 'a card'
          } else if (who === 'one') {
            whoToPrint = 'the card'
          } else if (who === 'all') {
            whoToPrint = 'a card'
          }

          if (cost) {
            return `Passive As a free action, you may pay (${cost}) and trash ${whoToPrint} to play a card of equal or lower cost.`
          }
          return `Passive As a free action, you may trash ${whoToPrint} to play a card of equal or lower cost.`
        },
        
        dash: (cost, who) => {
          let thatCard = 'this'
          let it = 'this'
          
          if (who === 'one') {
            thatCard = 'that card'
            it = 'it'
          }

          return `Pay (${cost}) to play ${thatCard}, but trash ${it} at end of turn.`
        },
        
        
        delirium: () => {
          // alternative: if you have cards of four different elements in trash.
          return `Only activate delirium abilities if you have fire, water, earth and wind cards in trash.`
        },
        
        
        discover: (howMany) => {
          return `To discover ${howMany}, reveal top ${howMany} cards of any piles. Add 1 to your hand, trash the rest.`
        },
        
        emerge: (...args) => {
          if (args.includes('all')) {
            // keyword granted
          return 'When you buy a card, you may trash a card for a discount equal to its cost.'
          }
          
          if (args.includes('one')) {
            // keyword granted
          return 'When you buy the card, you may trash a card for a discount equal to its cost.'
          }
          
          return 'When you buy this, you may trash a card for a discount equal to its cost.'
        },

        evoke: (cost, who) => {
          if (who === 'all') {
            return `As a free action, pay the cost and trash a card from hand to exec its blitz effects.`
          }
          if (who === 'one') {
            return `As a free action, pay the cost and trash that card from hand to exec its blitz effects.`
          }
          return `As a free action, pay (${cost}) and trash this from hand to exec its blitz effects.`
        },

        flashback: (who) => {
          let subject = 'this';
          if (who === 'all') {
            subject = 'a card';
          }
          if (who === 'one') {
            subject = 'the card';
          }
          return `Passive As a free action, you may trash ${subject} to exec its blitz effects.`
        },

        instant: () => {
          return 'You may buy this as a free action.'
        },
                
        invoke: () => {
          return 'You may trash this from hand or field to exec the effect.'
        },
        
        manaburst: () => {
          return 'Only activate manaburst abilities if x is 4+.'
        },
        
        meld: () => {
          return 'The melded card has all abilities and combined stats ((), vp, element, type) of its parts.'
        },
        
        postpone: (cost, delay) => {
          return `You may buy this for ${cost} instead of its normal cost. If you do, put this with [${delay}] in your suspend zone. Start of turn Remove [1] from here. Passive If last [] is removed, play this.`
        },
        
        potion: (...args) => {
          return `Trash this from hand or field to exec the effect.`
        },
        
        quest: () => {
          return 'As a free action, you may play this if you fulfill its condition.'
        },
        
        quickcast: (...args) => {
          if (args.includes('all')) {
            // keyword granted
            return 'Blitz You may cast it.'
          }
          if (args.includes('one')) {
            // keyword granted
            return 'Blitz You may cast it.'
          }
          
          return 'Blitz You may cast this.'
        },

        resonance: (...args) => {
          if (args.includes('all')) {
            // keyword granted
          return 'While a card\'s element is called, you may cast it along your main spell.'
          }
          if (args.includes('one')) {
            // keyword granted
          return 'While that card\'s element is called, you may cast it along your main spell.'
          }
          if (args.includes('this')) {
            // variable element known
          return 'While this card\'s element is called, you may cast this along your main spell.'
          }
          const elements = cardEditor.getElementsFromCard(cardDesc, false)
          let elementString;
          if (elements.length === 0  || (elements.length === 1 && elements.first === 'gray')) {
            elementString = 'this card\'s element';
          } else if (elements.length === 1) {
            elementString = elements.first;
          } else {
            elementString = `${elements.slice(0, -1).join(', ')} or ${elements.last}`;            
          }
          
          // Goal: While wind is called, you may cast this as a free action.
          // While wind is called, you may cast this along another spell.
          return `While ${elementString} is called, you may cast this along your main spell.`
        },
        
        saga: (...args) => {
          return 'Blitz and Start of Turn Put [1] here. Then, exec the corresponding chapter\'s effect.'
        },
        
        seek: (...args) => {
          return 'Reveal cards from any pile until you reveal the appropriate card(s), return the others to the game box.'
        },
        
        stuncounter: (...args) => {
          return 'Casting a card with a stun counter removes the counter instead of the effect.'
        },

        tiny: () => {
          return 'Tiny cards do not count for triggering the game end.'
        },

        trade: (...args) => {
          return 'To trade, trash the card from hand to draw a card.'
        },

        trading: (who) => {
          let whoText = 'this'
          if (who === 'one') {
            whoText = 'the card'
          } else if (who === 'all') {
            whoText = 'a card'
          }

          return `Passive Once per turn as a free action, you may trash ${whoText} from hand to draw a card.`
        },

        upgrade: (diff, who) => {
          let whoText = 'this'
          if (who === 'one') {
            whoText = 'the card'
          }
          
          return `To upgrade, trash ${whoText} to play a card costing up to (${diff}) more.`
        },
      };
      
      const modifiers = myMatch.split('-')
      const keyword = modifiers.shift()
      const reminderText = keywords[keyword.toLowerCase()];
      if (!reminderText) {
        lively.error(keyword, 'unknown reminder text')
        return `<span style='background-color: red;'>unknown reminder text '${keyword}''</span>`;
      }
      
      return italic(`(${reminderText(...modifiers)})`);
    });
  }
  
  static renderKeywords(printedRules) {
    const C_DARKGRAY = '#555';
    const C_LIGHTGRAY = '#999';
    
    function highlightKeyword(pattern, color=C_DARKGRAY, icon) {
      printedRules = printedRules.replace(pattern, (match, pElement, offset, string, groups) => {
        const text = match;
        return `<span style='white-space: nowrap; color: ${color};'>${icon || ''}${text}</span>`
      });
    }
    
    const C_DARKBEIGE = '#550';
    const C_BROWN = '#a50';
    
    const C_RED_LIGHT = '#d44';
    const C_RED = '#f00';
    const C_DARKRED = '#a11';
    
    const C_ORANGE = '#f50';
    
    const C_GREEN_LIGHT = '#292';
    const C_GREEN = '#090';
    const C_GREEN_DARK = '#170';
    
    const C_TEAL_LIGHT = '#085';
    const C_TEAL_DARK = '#164';
    
    const C_TEAL_BLUE = '#05a';
    
    const C_BLUE = '#00f';
    const C_BLUE_DARK = '#00c';
    
    const C_BLUE_VIOLET = '#219';
    const C_VIOLET_BLUE = '#30a';
    
    const C_VIOLET = '#708';

    
    highlightKeyword(/affinity\b/gmi, C_DARKBEIGE);
    highlightKeyword(/\bbound\b(\sto)?/gmi, C_VIOLET_BLUE);
    highlightKeyword(/brittle\b/gmi, C_RED);
    highlightKeyword(/cycl(ed?|ing)\b/gmi, C_DARKGRAY);
    highlightKeyword(/dash(ed|ing)?\b/gmi, C_BROWN);
    highlightKeyword(/delirium:?\b/gmi, C_DARKGRAY);
    highlightKeyword(/discover\b/gmi, C_DARKGRAY, '<i class="fa-regular fa-cards-blank"></i> ');
    highlightKeyword(/manaburst\b:?/gmi, C_VIOLET, '<i class="fa-sharp fa-regular fa-burst"></i> ');
    highlightKeyword(/\b(un)?meld(ed)?\b/gmi, C_BLUE_VIOLET);
    highlightKeyword(/potion\b/gmi, C_BLUE_VIOLET, '<i class="fa-regular fa-flask"></i> ');
    highlightKeyword(/quickcast\b/gmi, C_DARKGRAY);
    highlightKeyword(/resonance\b/gmi, C_GREEN);
    highlightKeyword(/seek\b/gmi, C_GREEN, '<i class="fa-sharp fa-solid fa-eye"></i> ');
    //'#3FDAA5' some turquise
    highlightKeyword(/trad(ed?|ing)\b/gmi, '#2E9F78', SVG.inlineSVG(tradeSVG.innerHTML, lively.rect(0, 0, 36, 36), 'x="10%" y="10%" width="80%" height="80%"', ''));
    highlightKeyword(/upgraded?\b/gmi, C_ORANGE, SVG.inlineSVG(upgradeSVG.innerHTML, lively.rect(0, 0, 36, 36), 'x="10%" y="10%" width="80%" height="80%"', ''));
    
    return printedRules
  }
  
  static renderElementIcon(printedRules) {
    function inlineElement(element) {
      return SVG.inlineSVG(SVG.elementSymbol(element, lively.pt(5, 5), 5));
    }

    return printedRules.replace(/\b(fire|water|earth|wind|gray)\b/gmi, (match, pElement, offset, string, groups) => inlineElement(pElement));
  }
  
  static renderHedronIcon(printedRules) {
    function inlineHedron() {
      return SVG.inlineSVG(hedronSVG.innerHTML, lively.rect(0, 0, 23, 23), 'x="10%" y="10%" width="80%" height="80%"', '')
    }

    return printedRules.replace(/hedron/gmi, (match, pElement, offset, string, groups) => inlineHedron());
  }
  
  static renderTapIcon(printedRules) {
    function inlineTapIcon() {
      return SVG.inlineSVG(tapSVG.innerHTML, TAP_VIEWBOX, 'x="10%" y="10%" width="80%" height="80%"', '')
    }

    return printedRules.replace(/\btap\b/gmi, (match, pElement, offset, string, groups) => inlineTapIcon());
  }
  
  static __textOnIcon__(text, rect, center) {
    let textToPrint
    if (text.includes('hedron') || text.includes('x')) {
      const parts = []
      let isFirst = true;
      for (let part of text.split(/x|hedron/i)) {
        if (isFirst) {
          isFirst = false
        } else {
          parts.push(`hedron`)
        }
        if (part) { // part is not an empty string
          parts.push(part)
        }
      }
      // split available space
      const lengthPerPart = [];
      for (let part of parts) {
        const lengthOfPart = part === 'hedron' ? 1 : part.length
        lengthPerPart.push(lengthOfPart)
      }
      const totalLength = lengthPerPart.sum()
      const percentageSpacePerPart = lengthPerPart.map(len => len / totalLength)
      let iteratingLength = 0
      textToPrint = parts.map((part, i) => {
        let startingLength = iteratingLength
        const endingLength = iteratingLength = startingLength + percentageSpacePerPart[i]
        const middle = (startingLength + endingLength) / 2;
        if (part === 'hedron') {
          const scaleFactor = totalLength > 1 ? .7 : 1
          return `<g transform='translate(${10 * middle - center.x} 0) translate(5 5) scale(${scaleFactor}) translate(-5 -5) '>${part}</g>`
        } else {
          return `<text x="${100 * middle}%" y="50%" dy="10%" dominant-baseline="middle" text-anchor="middle" style="font: .5em sans-serif; text-shadow: initial;">${part}</text>`
        }
      }).join('')
    } else {
      // simple form: just some text
      textToPrint = `<text x="50%" y="50%" dy="10%" dominant-baseline="middle" text-anchor="middle" style="font: .5em sans-serif; text-shadow: initial;">${text}</text>`;
    }
    return textToPrint
  }

  static renderVPIcon(printedRules) {
    const printVP = vp => {
      const rect = lively.rect(0, 0, 10, 10)
      const center = rect.center();
      
      let textToPrint = this.__textOnIcon__(vp, rect, center);
      
      Math.sqrt(.5) 
      return `<span style="font-size: 1em; transform: translate(0.625em, -0.1em) rotate(45deg);">
${SVG.inlineSVG(`<rect x="0" y="0" width="10" height="10" fill="${VP_STROKE}"></rect>
<rect x=".5" y=".5" width="9" height="9" fill="${VP_FILL}"></rect>
<g transform="rotate(-45, 5, 5)">${textToPrint}</g>
`)}
</span>`;
    }

    return printedRules.replace(/(\-?\+?(?:\d+|\*|d+\*|\d+(?:x|y|z|hedron)|(?:x|y|z|hedron)|\b)\-?\+?)VP\b/gmi, function replacer(match, vp, offset, string, groups) {
      return printVP(vp);
    });
  }
  
  static renderCardIcon(printedRules) {
    var that = this;
    function inlineCardCost(cost) {
      const rect = CARD_COST_ONE_VIEWBOX
      const center = rect.center();
      
      let textToPrint = that.__textOnIcon__(cost, rect, center);
      return SVG.inlineSVG(`${cardCostOneSVG.innerHTML}
${textToPrint}`, CARD_COST_ONE_VIEWBOX, 'x="10%" y="10%" width="80%" height="80%"', '')
    }

    return printedRules.replace(/\(\(((?:[*0-9xyz+-]|hedron)*)\)\)/gmi, (match, pElement, offset, string, groups) => inlineCardCost(pElement));
  }
  
  static renderCoinIcon(printedRules) {
    const coin = text => {
      const rect = lively.rect(0, 0, 10, 10)
      const center = rect.center();
      
      let textToPrint = this.__textOnIcon__(text, rect, center);
      
      return SVG.inlineSVG(`${SVG.circle(center, 5, `fill="goldenrod"`)}
${SVG.circleRing(center, 4.75, 5, `fill="darkviolet"`)}
${textToPrint}`);
    }

    return printedRules.replace(/\(((?:[*0-9xyz+-]|hedron)*)\)/gmi, function replacer(match, p1, offset, string, groups) {
      return coin(p1);
    });
  }
  
  static renderBracketIcon(printedRules) {
    const bracket = text => {
      const rect = lively.rect(0, 0, 10, 10)
      const center = rect.center();
      
      let textToPrint = this.__textOnIcon__(text, rect, center);

      return SVG.inlineSVG(`
<rect x="0" y="0" width="10" height="10" rx="1.5" fill="green"></rect>
<rect x="0.5" y="0.5" width="9" height="9" rx="1.5" fill="palegreen"></rect>
${textToPrint}`, undefined, undefined, 'transform:scale(1);');
    }

    return printedRules.replace(/\[((?:[*0-9xyz+-]|hedron)*)\]/gmi, function replacer(match, p1, offset, string, groups) {
      return bracket(p1);
    });
  }
  
  static renderCastIcon(printedRules) {
    return printedRules.replace(/t?3x(fire|water|earth|wind|gray)\:?/gi, (match, pElement, offset, string, groups) => {
      return `${castIcon} <b>Cast:</b>`;
    });
  }

  static async renderToDoc(ruleBox, insetTextBy, printedRules, beforeRenderRules, doc) {
    const textShadow = `text-shadow:
     -1px -1px 0 #fff,  
      1px -1px 0 #fff,
     -1px  1px 0 #fff,
      1px  1px 0 #fff;
     -1px  0   0 #fff,  
      1px  0   0 #fff,
      0    1px 0 #fff,
      0   -1px 0 #fff;`

    const ruleTextBox = ruleBox.insetBy(insetTextBy);
    // doc.rect(ruleBox.x, ruleBox.y, ruleBox.width, ruleBox.height, 'FD')
    
    const elementHTML = <div style={`padding: 1px; background: rgba(255,255,255,0.5); 
width: ${ruleTextBox.width}mm; min-height: ${ruleTextBox.height}mm;`}></div>;
    document.body.append(elementHTML);
    elementHTML.innerHTML = printedRules;

    const canvas = await html2canvas(elementHTML, {
      backgroundColor: null,
      ignoreElements: element => {
        try {
          if (!element) {
            return true;
          }

          return !(element === document.head || element.id === LATO_FONT_ID || element === document.body || element === elementHTML || elementHTML.contains(element));
        } catch (e) {}
      }
    });
    // elementHTML.remove();

    const EXISTING_CANVAS_ID = 'exist-canvas';
    const EXISTING_ELEMENT_ID = 'exist-element';
    const existCanvas = document.getElementById(EXISTING_CANVAS_ID);
    existCanvas && existCanvas.remove();
    document.body.appendChild(canvas);
    canvas.id = EXISTING_CANVAS_ID;

    const existElement = document.getElementById(EXISTING_ELEMENT_ID);
    existElement && existElement.remove();
    document.body.appendChild(elementHTML);
    elementHTML.style.overflow = 'visible';
    elementHTML.id = EXISTING_ELEMENT_ID;

    const imgData = canvas.toDataURL('image/png');
    const imgRect = lively.rect(0, 0, canvas.width, canvas.height);
    const scaledRect = imgRect.fitToBounds(ruleTextBox, true);
    scaledRect.y = ruleTextBox.y + ruleTextBox.height - scaledRect.height;
    
    beforeRenderRules(scaledRect)
    
    doc.addImage(imgData, "PNG", ...scaledRect::xYWidthHeight());
    
    return scaledRect
  }
}

class TextRenderer {
  
  static async rendetTextInBlock(cardEditor, doc, text, outsideBorder, x, y, width) {
    await cardEditor.withinCardBorder(doc, outsideBorder, async () => {
      await doc::withGraphicsState(async () => {
        {
          await cardEditor.setAndEnsureFont(doc, FONT_NAME_CARD_TEXT, "normal")
          doc.setFontSize(11);

          const textHeight = doc.getTextDimensions('a').h
          const lineHeightMultiplier = 1.15;
          const effectSeparatorHeightMultiplier = 1.5;
          
          let currentX = x;
          let currentY = y;

          function newLine(heightMultiplier) {
            currentY += textHeight * heightMultiplier
            currentX = x
          }

          const lines = text.split('\n');
          for (let line of lines) {
            const words = line.split(/\b/gmi);
            for (let word of words) {
              if (word.toLowerCase() === 'blitz') {
                await cardEditor.setAndEnsureFont(doc, FONT_NAME_FONT_AWESOME, "normal")
                word = '\ue0b7'
              } else {
                await cardEditor.setAndEnsureFont(doc, FONT_NAME_CARD_TEXT, "normal")
              }
              
              const wordWidth = doc.getTextWidth(word);
              if (currentX + wordWidth > x + width) {
                newLine(lineHeightMultiplier)
                if (word === ' ') {
                  continue
                }
              }
              
              const HELPER_LINE_WIDTH = .2
              doc::withGraphicsState(() => {
                doc.setGState(new doc.GState({ opacity: .7 }));
                doc.setFillColor('#aaaaff');
                doc.setDrawColor('black');
                doc.setLineWidth(HELPER_LINE_WIDTH)
                doc.rect(currentX, currentY, wordWidth, textHeight, 'FD');
              })
              
              doc.setDrawColor('red');
              doc.setLineWidth(HELPER_LINE_WIDTH * 2)
              doc.line(currentX + wordWidth, currentY, currentX + wordWidth, currentY + textHeight, 'S')
              
              doc.setTextColor('#000000');
              doc.text(word, currentX, currentY, {
                align: 'left',
                baseline: 'top'
              });
              
              currentX += wordWidth
            }
            
            newLine(effectSeparatorHeightMultiplier)
          }
        }
      })
    })
  }
  
  static async renderText(cardEditor, doc, cardDesc, border, {
    insetTextBy = 2,
    beforeRenderRules = () => {}
  } = { }) {
    let printedRules = cardDesc.getText() || '';

    const outerRuleBox = border.insetByRect(lively.rect(10,20,0,0))
    const RULE_BOX_PADDING = 2
    const effectiveRuleBox = outerRuleBox.insetBy(RULE_BOX_PADDING)
    await cardEditor.withinCardBorder(doc, border, async () => {
      doc::withGraphicsState(() => {
        globalThis.doc = doc
        
        doc.setGState(new doc.GState({ opacity: .9 }));
        doc.setFillColor('white');
        doc.setDrawColor('gray');
        // doc.rect(...effectiveRuleBox::xYWidthHeight(), 'FD');
        doc.roundedRect(...outerRuleBox::xYWidthHeight(), RULE_BOX_PADDING, RULE_BOX_PADDING, 'FD')
      })
    })
    
    await this.rendetTextInBlock(cardEditor, doc, printedRules, border, effectiveRuleBox.x, effectiveRuleBox.y, effectiveRuleBox.width)
    return;
    

    // old big cast icon with small tap
    // printedRules = printedRules.replace(/(^|\n)t3x(fire|water|earth|wind|gray)([^\n]*)/gi, function replacer(match, p1, pElement, pText, offset, string, groups) {
    //   return `<div>tap <span style="font-size: 3em; margin: 0 .1em 0 0; line-height: 0.85;">3x${pElement}</span>${pText}</div>`;
    // });

    // separate rules
    printedRules = printedRules.replace(/affectAll(.*)\/affectAll/gmi, function replacer(match, innerText, offset, string, groups) {
      return `<div style='background: ${affectAllBackground}; border: 1px solid ${AFFECT_ALL_COLOR};'>${innerText}</div>`;
    });
    printedRules = this.parseEffectsAndLists(printedRules);

    printedRules = this.renderReminderText(printedRules, cardEditor, cardDesc)

    printedRules = printedRules.replace(/\b(?:\d|-|\+)*x(?:\d|-|\+|vp)*\b/gmi, function replacer(match, innerText, offset, string, groups) {
      // find the bigger pattern, then just replace all x instead of reconstructing its surrounding characters
      return match.replace('x', 'hedron')
    });

    printedRules = printedRules.replace(/blitz/gmi, '<i class="fa-solid fa-bolt-lightning"></i>');
    printedRules = printedRules.replace(/passive/gmi, '<i class="fa-solid fa-infinity" style="transform: scaleX(.7);"></i>');
    printedRules = printedRules.replace(/start of turn,?/gmi, '<span><i class="fa-regular fa-clock-desk"></i></span>');
    printedRules = printedRules.replace(/ignition/gmi, '<span><i class="fa-regular fa-clock-desk"></i></span>');
    printedRules = printedRules.replace(/\btrain\b/gmi, '<i class="fa-solid fa-car-side"></i>');

    // <cardname>
    printedRules = printedRules.replace(/\bcardname(?::(\d+))?/gmi, (match, cardId, offset, string, groups) => {
      // lor blue card name #519ff1
      // #ffe967
      // #f8d66a
      // #de9b75
      function highlightName(name) {
        return `<span style='color: #1f62e9;'>${name}</span>`
      }
      if (!cardId) {
        return highlightName(cardEditor.getNameFromCard(cardDesc))
      }
      const card = cardEditor.cards.find(card => card.getId() + '' === cardId)
      if (card) {
        return highlightName(cardEditor.getNameFromCard(card))
      } else {
        return `<span style='color: red;'>unknown id: ${cardId}</span>`
      }
    });


    printedRules = printedRules.replace(/actionFree/gmi, () => this.chip('free'));
    printedRules = printedRules.replace(/actionOnce/gmi, () => this.chip('once'));
    printedRules = printedRules.replace(/actionMulti/gmi, () => this.chip('multi'));
    printedRules = printedRules.replace(/actionMain:?/gmi, () => {
      return '<i class="fa-solid fa-right"></i>'
    });

    printedRules = this.renderCastIcon(printedRules)

    printedRules = printedRules.replace(/manaCost(fire|water|earth|wind|gray)/gmi, (match, pElement, offset, string, groups) => {
      return this.manaCost(pElement);
    });

    printedRules = this.renderElementIcon(printedRules)
    printedRules = this.renderVPIcon(printedRules)
    printedRules = this.renderCardIcon(printedRules)
    printedRules = this.renderCoinIcon(printedRules)
    printedRules = this.renderBracketIcon(printedRules)

    printedRules = this.renderKeywords(printedRules)
    printedRules = this.renderHedronIcon(printedRules)
    printedRules = this.renderTapIcon(printedRules)

    printedRules = `<span class="${CSS_CLASS_LATO_LIGHT}" style="">${printedRules}</span>`

    return this.renderToDoc(border, insetTextBy, printedRules, beforeRenderRules, doc)
  }
}

const OUTSIDE_BORDER_ROUNDING = lively.pt(3, 3)

export default class JSPDF_Example extends Morph {
  async initialize() {
    this.windowTitle = "JSPDF EXAMPLE";
    this.updateView()
  }
  
  async updateCardPreview(card) {
    const ubg = this;
    
    const pdf = await ubg.buildSingleCard(card);
    this.get('#preview').replaceWith(<div id='preview'><div id='previewViewer'></div></div>)
    await ubg.showPDFData(pdf.output('dataurlstring'), this.get('#preview'), this.get('#previewViewer'), 'ubg-cards-editor');
  }
  
  get assetsFolder() {
    return lively4url + '/src/components/widgets/';
  }

  async updateView() {
    this.innerHTML = "";
    this.cards = this.getCards();
    this.card = this.cards.first;
    
    await this.updateCardPreview(this.card)
    await this.onShowPreview()
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
    this.updateCardPreview(card)
  }
  
  entryForCard(card) {
    return this.allEntries.find(entry => entry.card === card);
  }

  getCards() {
    let text = this.exampleText()
    const source = deserialize(text, { Card });
    // source.forEach(card => card.migrateTo(Card))
    return source;
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

  getAllTags() {
    if (!this._allTags) {
      const tagCount = new Map();
      this.cards.forEach(card => {
        card.getTags().forEach(tag => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        })
      })
      this._allTags = [...tagCount.entries()].sortBy('second', false).map(pair => pair.first);
    }
    return this._allTags
  }
  
  invalidateTags() {
    delete this._allTags
  }

  /*MD ## Build MD*/
  async ensureJSPDFLoaded() {
    debugger
    await lively.loadJavaScriptThroughDOM('jspdf', lively4url + '/src/external/jspdf/jspdf.umd.js');
    await lively.loadJavaScriptThroughDOM('svg2pdf', lively4url + '/src/external/jspdf/svg2pdf.umd.js');
    await lively.loadJavaScriptThroughDOM('html2canvas', lively4url + '/src/external/jspdf/html2canvas.js');
    debugger
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

    return this.buildCards(doc, [card], true);
  }

  async buildFullPDF(cards) {
    const doc = await this.createPDF({
      orientation: 'p',
      unit: 'mm'
      // format: POKER_CARD_SIZE_MM.addXY(5, 5).toPair(),
      // putOnlyUsedFonts:true,
      // floatPrecision: 16 // or "smart", default is 16
    });

    return this.buildCards(doc, cards, false); // .slice(0,12)
  }

  /*MD #### Fonts MD*/
  addFont(doc, vfsName, fontName, fontDataBase64) {
    // "data:font/ttf;base64," + 
    const fontBase64 = fontDataBase64;
    doc.addFileToVFS(vfsName, fontBase64);
    doc.addFont(vfsName, fontName, 'normal');
  }

  async ensureFont(doc, fontName) {
    if (!doc.__ubg_fonts__) {
      doc.__ubg_fonts__ = {}
    }
    
    if (doc.__ubg_fonts__[fontName]) {
      lively.notify(fontName, 'existing font')
      return
    }
    
    doc.__ubg_fonts__[fontName] = true
    
    // convert fonts to jspdf-compatible format at https://peckconsulting.s3.amazonaws.com/fontconverter/fontconverter.html
    const allFontData = {
      [FONT_NAME_FONT_AWESOME]: {
        vfsName: 'fontawesome-webfont.ttf', 
        fontDataBase64: BASE64_FONT_AWESOME
      },
      
      [FONT_NAME_LATO_BOLD]: {
        vfsName: 'Lato-Bold.ttf', 
        fontDataBase64: BASE64_LATO_BOLD
      },
      [FONT_NAME_LATO_REGULAR]: {
        vfsName: 'Lato-Regular.ttf', 
        fontDataBase64: BASE64_LATO_REGULAR
      },
      [FONT_NAME_LATO_LIGHT]: {
        vfsName: 'Lato-Light.ttf', 
        fontDataBase64: BASE64_LATO_LIGHT
      },
      [FONT_NAME_LATO_THIN_ITALIC]: {
        vfsName: 'Lato-ThinItalic.ttf', 
        fontDataBase64: BASE64_LATO_THIN_ITALIC
      },
    }
    
    const fontData = allFontData[fontName]
    if (!fontData) {
      throw new Error('Unknown font: ' + fontName)
    }
    const { vfsName, fontDataBase64 } = fontData
    this.addFont(doc, vfsName, fontName, fontDataBase64);
  }

  async setAndEnsureFont(doc, fontName, fontStyle) {
    // return;
    await this.ensureFont(doc, fontName)
    doc.setFont(fontName, fontStyle)
  }

  /*MD ### BUILD MD*/
  async buildCards(doc, cardsToPrint, skipCardBack) {
    const GAP = lively.pt(.2, .2);

    const rowsPerPage = Math.max(((doc.internal.pageSize.getHeight() + GAP.y) / (POKER_CARD_SIZE_MM.y + GAP.y)).floor(), 1);
    const cardsPerRow = Math.max(((doc.internal.pageSize.getWidth() + GAP.x) / (POKER_CARD_SIZE_MM.x + GAP.x)).floor(), 1);
    const cardsPerPage = rowsPerPage * cardsPerRow;

    const margin = lively.pt(doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()).subPt(lively.pt(cardsPerRow, rowsPerPage).scaleByPt(POKER_CARD_SIZE_MM).addPt(lively.pt(cardsPerRow - 1, rowsPerPage - 1).scaleByPt(GAP)));

    function progressLabel(numCard) {
      return `process cards ${numCard}/${cardsToPrint.length}`;
    }
    const progress = await lively.showProgress(progressLabel(0));

    if (!skipCardBack) {
      doc.addPage("p", "mm", "a4");
    }

    try {
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
          doc.addPage("p", "mm", "a4");
          currentPage++;
          lively.notify(currentPage)
        }
        const frontPage = 2 * currentPage + 1
        doc.setPage(frontPage)

        const rowIndex = (indexOnPage / rowsPerPage).floor();
        const columnIndex = indexOnPage % cardsPerRow;
        const offset = lively.pt(columnIndex * (POKER_CARD_SIZE_MM.x + GAP.x), rowIndex * (POKER_CARD_SIZE_MM.y + GAP.y)).addPt(margin.scaleBy(1 / 2));
        const outsideBorder = offset.extent(POKER_CARD_SIZE_MM);
        
        // a.æÆ()
        const cardToPrint = cardsToPrint[i];
        await this.renderCard(doc, cardToPrint, outsideBorder);

        if (!skipCardBack) {
          const backPage = frontPage + 1
          doc.setPage(backPage)
          
          const rowIndex = (indexOnPage / rowsPerPage).floor();
          const columnIndex = cardsPerRow - 1 - indexOnPage % cardsPerRow;
          const offset = lively.pt(columnIndex * (POKER_CARD_SIZE_MM.x + GAP.x), rowIndex * (POKER_CARD_SIZE_MM.y + GAP.y)).addPt(margin.scaleBy(1 / 2));
          const outsideBorder = offset.extent(POKER_CARD_SIZE_MM);

          // a.æÆ()
          const cardToPrint = cardsToPrint[i];
          await this.renderCardBack(doc, cardToPrint, outsideBorder);
        }
        
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
  async renderCard(doc, cardDesc, outsideBorder) {
    return await this.renderFullBleedStyle(doc, cardDesc, outsideBorder)
  }
  
  async getBackgroundImage(doc, cardDesc, bounds) {
    const filePath = this.assetsFolder + 'jspdf-example-background.jpg'
    return await this.loadBackgroundImageForFile(filePath, bounds)
  }
  
  async loadBackgroundImageForFile(filePath, bounds) {
    const img = await globalThis.__ubg_file_cache__.getFile(filePath, getImageFromURL);
    const imgRect = lively.rect(0, 0, img.width, img.height);
    const scaledRect = imgRect.fitToBounds(bounds, true);

    return { img, scaledRect }
  }
  
  async renderMagicStyle(doc, cardDesc, outsideBorder) {
    const currentVersion = cardDesc.versions.last;

    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // black border
    doc::withGraphicsState(() => {
      doc.setFillColor(0.0);
      doc.roundedRect(...outsideBorder::xYWidthHeight(), 3, 3, 'F');
    });

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
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, innerBorder);

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
    const cardName = this.getNameFromCard(cardDesc);
    doc::withGraphicsState(() => {
      doc.setFontSize(.6 * TITLE_BAR_HEIGHT::mmToPoint());
      doc.setTextColor('#000000');
      doc.text(cardName, ...titleBar.leftCenter().addX(2).toPair(), { align: 'left', baseline: 'middle' });
    });
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
    doc::withGraphicsState(() => {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`${currentVersion.type || '<no type>'} - ${currentVersion.elements || currentVersion.element || '<no element>'}`, ruleBox.left(), ruleBox.top() - .5, { align: 'justify', baseline: 'bottom' });
    });

    await this.renderRuleText(doc, cardDesc, ruleBox, {
      insetTextBy: 2
    });

    // tags
    const tagsAnchor = ruleBox.topRight().subY(1);
    await this.renderTags(doc, cardDesc, tagsAnchor)
  }

  async renderFullBleedStyle(doc, cardDesc, outsideBorder) {
    const type = cardDesc.getType();
    const typeString = type && type.toLowerCase && type.toLowerCase() || '';

    if (typeString === 'spell') {
      await this.renderSpell(doc, cardDesc, outsideBorder)
    } else if (typeString === 'gadget') {
      await this.renderGadget(doc, cardDesc, outsideBorder)
    } else if (typeString === 'character') {
      await this.renderCharacter(doc, cardDesc, outsideBorder)
    } else {
      await this.renderMagicStyle(doc, cardDesc, outsideBorder)
    }
    
    this.renderIsBad(doc, cardDesc, outsideBorder)
    this.renderVersionIndicator(doc, cardDesc, outsideBorder)
    await TextRenderer.renderText(this, doc, cardDesc, outsideBorder)
  }
  
  /*MD ### Rendering Card Types MD*/
  // #important
  async renderSpell(doc, cardDesc, outsideBorder) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, outsideBorder);
    this.withinCardBorder(doc, outsideBorder, () => {
      doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());
    });

    this.withinCardBorder(doc, outsideBorder, () => {
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

      // console.log(doc.getLineWidth())
      this.withinCardBorder(doc, outsideBorder, () => {
        doc::withGraphicsState(() => {
          doc.circle(...middle.toPair(), RADIUS, null);
          doc.internal.write('W n');

          doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());

          doc.setDrawColor(BOX_STROKE_COLOR);
          doc.setLineWidth(2)
          doc.circle(...middle.toPair(), RADIUS, 'D');
        })
      })
    }

    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // doc.setFillColor(120, 120, 120);
    // doc.roundedRect(...innerBorder::xYWidthHeight(), 3, 3, 'FD');

    // title
    const TITLE_BAR_HEIGHT = 7;
    const COST_COIN_RADIUS = 4;
    const COST_COIN_MARGIN = 2;
    
    const titleBorder = innerBorder.insetBy(1);
    titleBorder.height = TITLE_BAR_HEIGHT;

    await this.renderTitleBarAndCost(doc, cardDesc, titleBorder, COST_COIN_RADIUS, COST_COIN_MARGIN)

    // rule box
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .3;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    // const ruleBox = innerBorder.insetBy(1);
    // const height = innerBorder.height * .4;
    // ruleBox.y = ruleBox.bottom() - height;
    // ruleBox.height = height;
    this.withinCardBorder(doc, outsideBorder, () => {
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
    const ruleTextBox = await this.renderRuleText(doc, cardDesc, ruleBox, {
      insetTextBy: 2
    });

    // tags
    const tagsAnchor = ruleTextBox.topRight();
    await this.renderTags(doc, cardDesc, tagsAnchor)
    
    // id
    this.renderId(doc, cardDesc, outsideBorder, innerBorder)
  }

  // #important
  async renderGadget(doc, cardDesc, outsideBorder) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, outsideBorder);
    this.withinCardBorder(doc, outsideBorder, () => {
      doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());
    });

    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // doc.setFillColor(120, 120, 120);
    // doc.roundedRect(...innerBorder::xYWidthHeight(), 3, 3, 'FD');

    // top box
    const ruleBox2 = outsideBorder.copy()
    ruleBox2.height = 13;
    this.withinCardBorder(doc, outsideBorder, () => {
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

    await this.renderTitleBarAndCost(doc, cardDesc, titleBorder, COST_COIN_RADIUS, COST_COIN_MARGIN)
        
    // rule box border calc
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .4;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    
    // rule text
    const RULE_TEXT_INSET = 2;
    let effectiveRuleBox
    const ruleTextBox = await this.renderRuleText(doc, cardDesc, ruleBox, {
      insetTextBy: RULE_TEXT_INSET,
      beforeRenderRules: ruleTextBox => {
        // rule box render
        effectiveRuleBox = ruleTextBox.insetBy(-RULE_TEXT_INSET)
        this.withinCardBorder(doc, outsideBorder, () => {
          doc::withGraphicsState(() => {
            doc.setGState(new doc.GState({ opacity: BOX_FILL_OPACITY }));
            doc.setFillColor(BOX_FILL_COLOR);
            doc.rect(...effectiveRuleBox::xYWidthHeight(), 'F');
          })
        })
        
        doc::withGraphicsState(() => {
          doc.setLineWidth(1);
          doc.setDrawColor(BOX_STROKE_COLOR);
          doc.line(effectiveRuleBox.left(), effectiveRuleBox.top(), effectiveRuleBox.right(), effectiveRuleBox.top());
        });
      }
    });
    
    // tags
    const tagsAnchor = lively.pt(ruleTextBox.right(), effectiveRuleBox.top()).subY(1);
    await this.renderTags(doc, cardDesc, tagsAnchor)

    // id
    this.renderId(doc, cardDesc, outsideBorder, innerBorder)
  }

  // #important
  async renderCharacter(doc, cardDesc, outsideBorder) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, outsideBorder);
    this.withinCardBorder(doc, outsideBorder, () => {
      doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());
    });

    // Zohar design
    const ZOHAR_DESIGN_BORDER_WIDTH = .5;
    [[outsideBorder.topLeft(), lively.pt(1, 0)], [outsideBorder.topRight(), lively.pt(-1, 0)]].forEach(([startingPt, direction]) => {
      const dirX = direction.x;
      this.withinCardBorder(doc, outsideBorder, () => {
        doc::withGraphicsState(() => {
          doc.setGState(new doc.GState({ opacity: 0.5 }));
          doc.setFillColor(BOX_FILL_COLOR);
          doc.setDrawColor(BOX_STROKE_COLOR);
          doc.setLineWidth(ZOHAR_DESIGN_BORDER_WIDTH);
          doc.lines([[dirX*8,0],[0,15],[-dirX*15,15],[dirX*15,15],[0,100], [-dirX*10,0]], ...startingPt.toPair(), [1,1], 'DF', true)
        });
      });
    })
    
    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // doc.setFillColor(120, 120, 120);
    // doc.roundedRect(...innerBorder::xYWidthHeight(), 3, 3, 'FD');

    // title
    const TITLE_BAR_HEIGHT = 7;
    const COST_COIN_RADIUS = 4;
    const COST_COIN_MARGIN = 2;
    
    const titleBorder = innerBorder.insetBy(1);
    titleBorder.height = TITLE_BAR_HEIGHT;

    await this.renderTitleBarAndCost(doc, cardDesc, titleBorder, COST_COIN_RADIUS, COST_COIN_MARGIN)
        
    // rule box border calc
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .4;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    
    // rule text
    const RULE_TEXT_INSET = 2;
    let effectiveRuleBox
    const ruleTextBox = await this.renderRuleText(doc, cardDesc, ruleBox, {
      insetTextBy: RULE_TEXT_INSET,
      beforeRenderRules: ruleTextBox => {
        // rule box render
        effectiveRuleBox = ruleTextBox.insetBy(-RULE_TEXT_INSET)
        this.withinCardBorder(doc, outsideBorder, () => {
          doc::withGraphicsState(() => {
            doc.setGState(new doc.GState({ opacity: BOX_FILL_OPACITY }));
            doc.setFillColor(BOX_FILL_COLOR);
            doc.rect(...effectiveRuleBox::xYWidthHeight(), 'F');
          })
        })
        
        doc::withGraphicsState(() => {
          doc.setLineWidth(1);
          doc.setDrawColor(BOX_STROKE_COLOR);
          doc.line(effectiveRuleBox.left(), effectiveRuleBox.top(), effectiveRuleBox.right(), effectiveRuleBox.top());
        });
      }
    });
    
    // tags
    const tagsAnchor = lively.pt(ruleTextBox.right(), effectiveRuleBox.top()).subY(1);
    await this.renderTags(doc, cardDesc, tagsAnchor)

    // id
    this.renderId(doc, cardDesc, outsideBorder, innerBorder)
  }
  
  /*MD ### Rendering Card Components MD*/
  withinCardBorder(doc, outsideBorder, cb) {
    function clipOuterBorder() {
      doc.roundedRect(...outsideBorder::xYWidthHeight(), OUTSIDE_BORDER_ROUNDING.x, OUTSIDE_BORDER_ROUNDING.y, null); // set clipping area
      doc.internal.write('W n');
    }

    if (isAsync(cb)) {
      return doc::withGraphicsState(async () => {
        clipOuterBorder()
        return await cb();
      });
    } else {
      return doc::withGraphicsState(() => {
        clipOuterBorder()
        return cb();
      });
    }
  }

  async renderTitleBarAndCost(doc, cardDesc, border, costCoinRadius, costCoinMargin) {
    const TITLE_BAR_BORDER_WIDTH = 0.200025;

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
      doc.setLineWidth(TITLE_BAR_BORDER_WIDTH);
      doc.roundedRect(...titleBar::xYWidthHeight(), 1, 1, 'DF');
    });

    // card name
    await doc::withGraphicsState(async () => {
      await this.setAndEnsureFont(doc, FONT_NAME_CARD_NAME, "normal")
      doc.setFontSize(.6 * titleBar.height::mmToPoint());
      doc.setTextColor('#000000');
      doc.text(this.getNameFromCard(cardDesc), ...titleBar.leftCenter().addX(2).toPair(), {
        align: 'left',
        baseline: 'middle',
        maxWidth: titleBar.width
      });
    });

    const coinCenter = coinLeftCenter.addX(costCoinRadius);
    await this.renderInHandSymbols(doc, cardDesc, border, costCoinRadius, costCoinMargin, coinCenter)
  }
  
  async renderInHandSymbols(doc, cardDesc, border, costCoinRadius, costCoinMargin, coinCenter) {
    let currentCenter = coinCenter;

    // cost
    await this.renderCost(doc, cardDesc, currentCenter, costCoinRadius)

    if ((cardDesc.getType() || '').toLowerCase() !== 'character') {
      // vp
      currentCenter = currentCenter.addY(costCoinRadius * 2.75);
      await this.renderBaseVP(doc, cardDesc, currentCenter, costCoinRadius)

      // element (list)
      currentCenter = currentCenter.addY(costCoinRadius * 2.75);
      const elementListDirection = 1;
      currentCenter = await this.renderElementList(doc, cardDesc, currentCenter, costCoinRadius, elementListDirection)
    } else {
      currentCenter = currentCenter.addY(costCoinRadius * 1);
    }

    // type
    currentCenter = currentCenter.addY(costCoinRadius * .75)
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);
    await this.renderType(doc, cardDesc, currentCenter, BOX_FILL_COLOR, BOX_FILL_OPACITY)
  }

  async renderElementList(doc, cardDesc, pos, radius, direction) {
    const elements = this.getElementsFromCard(cardDesc, true);
    for (let element of elements) {
      await this.renderElementSymbol(doc, element, pos, radius)
      pos = pos.addY(direction * radius * .75);
    }
    return pos.addY(direction * radius * .25);
  }

  async renderCost(doc, cardDesc, pos, coinRadius) {
    const costSize = coinRadius / 3;

    const costDesc = cardDesc.getCost();
    const cost = Array.isArray(costDesc) ? costDesc.first : costDesc;

    const coinCenter = pos;
    doc::withGraphicsState(() => {
      doc.setGState(new doc.GState({ opacity: 0.9 }));
      doc.setFillColor('#b8942d');
      doc.setDrawColor(148, 0, 211);
      doc.setLineWidth(0.2 * costSize)
      doc.circle(...coinCenter.toPair(), coinRadius, 'DF');
    });

    await this.renderIconText(doc, coinCenter, costSize, cost, FONT_NAME_CARD_COST)
  }

  async renderBaseVP(doc, cardDesc, pos, coinRadius) {
    const costSize = coinRadius / 3;
    
    const vp = cardDesc.getBaseVP() || 0;

    const iconCenter = pos;
    doc::withGraphicsState(() => {
      doc.setGState(new doc.GState({ opacity: 0.9 }))
      // doc.setFillColor('#b8942d');
      doc.setDrawColor(vp === 0 ? VP_STROKE_ZERO : VP_STROKE)
      doc.setLineWidth(0.2 * costSize)
      // doc.circle(...coinCenter.toPair(), coinRadius, 'DF');
      doc.setFillColor(vp === 0 ? VP_FILL_ZERO : VP_FILL)
      // doc.rect(coinCenter.x - coinRadius, coinCenter.y - coinRadius, 2 * coinRadius, 2 * coinRadius, 'DF');
      
      // diamond shape
      const diagonal = coinRadius * .9 * Math.sqrt(2)
      const rightAbsolute = iconCenter.addX(diagonal).toPair()
      const down = lively.pt(-diagonal, diagonal).toPair()
      const left = lively.pt(-diagonal, -diagonal).toPair()
      const up = lively.pt(diagonal, -diagonal).toPair()
      const rightAgain = lively.pt(diagonal, diagonal).toPair()
      doc.lines([down, left, up, rightAgain], ...rightAbsolute, [1,1], 'DF', true)
    });

    await this.renderIconText(doc, iconCenter, costSize, vp, FONT_NAME_CARD_VP)
  }

  async renderIconText(doc, centerPos, size, text, font) {
    if (text === undefined) {
      return
    }
    
    await doc::withGraphicsState(async () => {
      await this.setAndEnsureFont(doc, font, "normal")
      doc.setFontSize(12 * size);
      doc.setTextColor('#000000');
      doc.text('' + text, ...centerPos.toPair(), { align: 'center', baseline: 'middle' });
    });
  }

  // #important
  async renderRuleText(doc, cardDesc, ruleBox, options = { }) {
    return RuleTextRenderer.renderRuleText(this, cardDesc, doc, ruleBox, options)
    options?.beforeRenderRules?.(lively.rect(10,10,20,20))
    return lively.rect(10,10,20,20)
  }

  // type
  async renderType(doc, cardDesc, anchorPt, color, opacity) {
    // const typeAndElementAnchor = anchorPt
    await doc::withGraphicsState(async () => {
      doc.setGState(new doc.GState({ opacity: opacity }));
      doc.setFillColor(color);
      
      // function curate() {
      //   return this.toLower().upperFirst();
      // }
      // function prepend(other) {
      //   return other + ' ' + this;
      // }
      // const element = cardDesc.getElement();
      let fullText = (cardDesc.getType() || '<no type>').toLower().upperFirst()
      // if (Array.isArray(element)) {
      //   element.forEach(element => {
      //     fullText = fullText::prepend(element::curate())
      //   })
      // } else if (element) {
      //   fullText = fullText::prepend(element::curate())
      // }
      await this.setAndEnsureFont(doc, FONT_NAME_CARD_TYPE, "normal")
      doc.setFontSize(7);

      const { w, h: textHeight } = doc.getTextDimensions(fullText);
      
      const typeElementTextBox = anchorPt.subX(w/2).extent(lively.pt(w, textHeight))
      const typeElementTextBoxExpansion = 1
      const typeElementBox = typeElementTextBox.expandBy(typeElementTextBoxExpansion)
      const roundedCorner = textHeight/2 + typeElementTextBoxExpansion
      doc.roundedRect(...typeElementBox::xYWidthHeight(), roundedCorner, roundedCorner, 'F');
      
      doc.setTextColor('000');
      doc.text(fullText, typeElementTextBox.left(), typeElementTextBox.centerY(), { align: 'justify', baseline: 'middle' });
    })
  }
  
  renderTags(doc, cardDesc, tagsAnchor) {
    const tags = cardDesc.getTags().sortBy(i => i, false).map(tag => '#' + tag);
    doc::withGraphicsState(() => {
      const FONT_SIZE = 7;
      doc.setFontSize(FONT_SIZE);
      // text dimensions only work well for single-line text
      const { w, h } = doc.getTextDimensions(tags.first || '');
      doc.setTextColor('black');
      for (let text of tags) {
        doc.text(text, ...tagsAnchor.toPair(), { align: 'right', baseline: 'bottom' });
        tagsAnchor = tagsAnchor.subY(h)
      }
    });
  }

  async renderElementSymbol(doc, element, pos, radius) {
    const svgInnerPos = lively.pt(5, 5);
    const svgInnerRadius = 5;
    const yourSvgString = SVG.inlineSVG(SVG.elementSymbol(element, svgInnerPos, svgInnerRadius))
    
    let container = document.getElementById('svg-container');
    if (!container) {
      container = <div id='svg-container'></div>;
      document.body.append(container)
    }
    container.innerHTML = yourSvgString
    const svgElement = container.firstElementChild
    // force layout calculation
    svgElement.getBoundingClientRect()
    // const width = svgElement.width.baseVal.value
    // const height = svgElement.height.baseVal.value

    await doc.svg(svgElement, {
      x: pos.x - radius,
      y: pos.y - radius,
      width: radius * 2,
      height: radius * 2
    })

    // doc::withGraphicsState(() => {
    //   doc.setGState(new doc.GState({ opacity: .8 }));
    //   doc.setFillColor(stroke);
    //   doc.ellipse(...pos.subXY(radius, radius).toPair(), 1, 1, 'F')
    // })
  }
  
  renderId(doc, cardDesc, outsideBorder, innerBorder, color = '000') {
    doc::withGraphicsState(() => {
      doc.setFontSize(7);
      doc.setTextColor(color);
      doc.text(`${cardDesc.id || '???'}/${cardDesc.getHighestVersion()}`, innerBorder.right() - 2, (innerBorder.bottom() + outsideBorder.bottom()) / 2, { align: 'right', baseline: 'middle' });
    });
  }

  renderIsBad(doc, cardDesc, outsideBorder) {
    function slash(color, width=2, offset=lively.pt(0,0)) {
      doc::withGraphicsState(() => {
        doc.setDrawColor(color);
        doc.setLineWidth(width)
        doc.line(outsideBorder.right() + offset.x, outsideBorder.top() + offset.y, outsideBorder.left() + offset.x, outsideBorder.bottom() + offset.y);
      });
    }
    
    if (cardDesc.hasTag('duplicate')) {
      slash('#bbbbbb', 2, lively.pt(-3, -3))
    }
    if (cardDesc.hasTag('unfinished')) {
      slash('#888888', 2, lively.pt(-2, -2))
    }
    if (cardDesc.hasTag('bad')) {
      slash('#ff0000', 2)
    }
    if (cardDesc.hasTag('deprecated')) {
      slash('#ff00ff', 2, lively.pt(2, 2))
    }
    if (cardDesc.getRating() === 'remove') {
      slash('#999999', 5, lively.pt(-5, -5))
    }
  }
  
  renderVersionIndicator(doc, cardDesc, outsideBorder) {
    const VERSION_FILL = '#f7d359';
    const renderDiamond = (pos, radius) => {
      this.withinCardBorder(doc, outsideBorder, () => {
        const iconCenter = pos;
        doc::withGraphicsState(() => {
          doc.setGState(new doc.GState({ opacity: 0.9 }))
          doc.setDrawColor(VP_STROKE)
          doc.setLineWidth(0.2)
          doc.setFillColor(VERSION_FILL)
          
          // diamond shape
          const diagonal = radius * .9 * Math.sqrt(2)
          const rightAbsolute = iconCenter.addX(diagonal).toPair()
          const down = lively.pt(-diagonal, diagonal).toPair()
          const left = lively.pt(-diagonal, -diagonal).toPair()
          const up = lively.pt(diagonal, -diagonal).toPair()
          const rightAgain = lively.pt(diagonal, diagonal).toPair()
          doc.lines([down, left, up, rightAgain], ...rightAbsolute, [1,1], 'F', true)
        });
      });
    }
    renderDiamond(outsideBorder.bottomRight(), 3.5)
    // renderDiamond(outsideBorder.topRight(), 4.5)
  }

  async renderCardBack(doc, cardDesc, outsideBorder) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    const backgroundImageFile = this.assetsFolder + 'jspdf-example-cardback.jpg'
    const { img, scaledRect } = await this.loadBackgroundImageForFile(backgroundImageFile, outsideBorder);
    this.withinCardBorder(doc, outsideBorder, () => {
      doc.addImage(img, "JPEG", ...scaledRect::xYWidthHeight());
    });

    // inner border
    {
      const CIRCLE_BORDER = -3;
      const RADIUS = (outsideBorder.width - CIRCLE_BORDER) / 2;
      const middle = outsideBorder.center().withY(outsideBorder.top() + CIRCLE_BORDER + RADIUS)

      // console.log(doc.getLineWidth())
      this.withinCardBorder(doc, outsideBorder, () => {
        doc.saveGraphicsState();
        
        doc.circle(...outsideBorder.center().toPair(), outsideBorder.height * .5 * .9, null) 
        
        // globalThis.doc = doc
        // doc.moveTo(10, 10)
        // doc.lineTo(10, 100)
        // doc.lineTo(50, 100)
        // doc.lineTo(10, 10)
        
        doc.clipEvenOdd()
        doc.saveGraphicsState();
        
        doc.setGState(new doc.GState({ opacity: BOX_FILL_OPACITY }));
        doc.setFillColor(BOX_FILL_COLOR);
        doc.rect(...outsideBorder::xYWidthHeight(), 'F');

        doc.restoreGraphicsState();
        doc.restoreGraphicsState();
      })
    }

    // element symbols
    await this.withinCardBorder(doc, outsideBorder, async () => {
      const innerBorder = outsideBorder.insetBy(3);
      const RADIUS = 5
      await this.renderElementList(doc, cardDesc, innerBorder.topLeft().addXY(RADIUS, RADIUS), RADIUS, 1)
      await this.renderElementList(doc, cardDesc, innerBorder.topRight().addXY(-RADIUS, RADIUS), RADIUS, 1)
      await this.renderElementList(doc, cardDesc, innerBorder.bottomLeft().addXY(RADIUS, -RADIUS), RADIUS, -1)
      await this.renderElementList(doc, cardDesc, innerBorder.bottomRight().addXY(-RADIUS, -RADIUS), RADIUS, -1)
    })

    // outerBorder
    this.withinCardBorder(doc, outsideBorder, () => {
      doc::withGraphicsState(() => {
        doc.setDrawColor(BOX_STROKE_COLOR);
        // only actually draw half of this, other half is masked
        doc.setLineWidth(2)
        doc.roundedRect(...outsideBorder::xYWidthHeight(), OUTSIDE_BORDER_ROUNDING.x, OUTSIDE_BORDER_ROUNDING.y, 'D');
      })
    })
  }
  
  /*MD ## Preview MD*/
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

  /*MD ## Main Bar Buttons MD*/
  async onShowPreview(evt) {
    const doc = await this.buildFullPDF(this.cards);
    this.classList.add('show-preview');
    await this.showPDFData(doc.output('dataurlstring'), this.viewerContainer);
  }

  /*MD ## lively API MD*/
  livelyMigrate(other) {
    this.cards = other.cards
    this.card = other.card
  }

  livelySource() {
  }

  /*MD ## example Data MD*/
  exampleText() {
    return "[\n  {\n    \"versions\": [\n      {\n        \"name\": \"Ascension\",\n        \"type\": \"goal\",\n        \"cost\": 10,\n        \"text\": \"1 SP\",\n        \"notes\": \"[BASIC]\",\n        \"isBad\": true,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Ascension\",\n        \"type\": \"gadget\",\n        \"cost\": 10,\n        \"notes\": \"[\",\n        \"baseVP\": 10,\n        \"element\": [\n          \"earth\",\n          \"wind\",\n          \"water\",\n          \"fire\",\n          \"gray\"\n        ],\n        \"text\": \"Ignition Passive actionFree actionOnce Pay (2) to draw a card.\\nmanaCostfire\\n\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Ascension\",\n        \"type\": \"gadget\",\n        \"cost\": 10,\n        \"baseVP\": 10,\n        \"element\": [\n          \"earth\",\n          \"wind\",\n          \"fire\",\n          \"water\"\n        ],\n        \"text\": \"Gain 2vp. 2xvp\\nt3xfire: Draw hedron cards.\\n(1)(10)hedron(hedron) (2x) (82hedron) xvp 2xvp\\nt3xfire: vp 2vp 10vp *vp 3+vp\\n(x)(0)(1)...(10)(12)(4+) \\n2vp [2] water XXXX (3) XXXX fire\\nIgnition Passive actionFree actionOnce actionMulti manaCostfire\",\n        \"rating\": \"unsure\",\n        \"tags\": [\n          \"overly complicated\"\n        ],\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Ascension\",\n        \"type\": \"gadget\",\n        \"cost\": 5,\n        \"text\": \"Blitz Gain xvp.\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Ascension\",\n        \"type\": \"gadget\",\n        \"cost\": 5,\n        \"text\": \"Blitz Gain xvp.\\nTap Gain 1vp.\\nactionMain Play a card costing up to (5).\\ndiscover\\nseek\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Ascension\",\n        \"type\": \"gadget\",\n        \"cost\": 5,\n        \"text\": \"Blitz Gain xvp.\\nTap Gain 1vp.\\nactionMain Play a card costing up to (5).\\ndiscover\\nseek\",\n        \"tags\": [\n          \"to salvage\",\n          \"forgettable\"\n        ],\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Ascension\",\n        \"type\": \"gadget\",\n        \"cost\": 5,\n        \"text\": \"Blitz Gain xvp.\\nTap Gain 1vp.\\nactionMain Play a card costing up to (5).\\ndiscover\\nseek\",\n        \"tags\": [\n          \"to salvage\",\n          \"forgettable\"\n        ],\n        \"rating\": \"remove\"\n      }\n    ],\n    \"id\": 1,\n    \"artDirection\": \"a hero claiming godhood with a giant magical circle in the background\",\n    \"notes\": \"vp 2vp 10vp *vp 3+vp \\n(x)(0)(1)...(10)(12)(4+) \\ncastIcon \",\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Fire\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"text\": \"t3xfire: (x)\",\n        \"notes\": \"[BASIC]\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Fire\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"text\": \"t3xfire: (x)\",\n        \"notes\": \"[\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Fire\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"text\": \"t3xfire: (x)\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Fire\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 1,\n        \"text\": \"Gain 2vp. 2xvp\\nt3xfire: Draw x cards.\\n(1)(10)x(x) (2x) (82x) xvp 2xvp\\nt3xfire: vp 2vp 10vp *vp 3+vp\\n(x)(0)(1)...(10)(12)(4+) \\n2vp [2] water XXXX (3) XXXX fire\\nIgnition Passive actionFree actionOnce actionMulti manaCostfire\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Fire\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 1,\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\"\n      }\n    ],\n    \"id\": 2,\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Water\",\n        \"type\": \"spell\",\n        \"element\": \"water\",\n        \"cost\": 3,\n        \"text\": \"t3xwater: (x)\",\n        \"notes\": \"[BASIC]\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Water\",\n        \"type\": \"spell\",\n        \"element\": \"water\",\n        \"cost\": 3,\n        \"text\": \"t3xwater: (x)\",\n        \"notes\": \"[\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Water\",\n        \"type\": \"spell\",\n        \"element\": \"water\",\n        \"cost\": 3,\n        \"text\": \"t3xwater: (x)\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Water\",\n        \"type\": \"spell\",\n        \"element\": \"water\",\n        \"cost\": 1,\n        \"text\": \"t3xwater: Draw x cards.\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Water\",\n        \"type\": \"spell\",\n        \"element\": \"water\",\n        \"cost\": 1,\n        \"text\": \"t3xfire: Cycle a card. Affinity Upgrade\\nFlashback, cycling (y), Trading, trade\\nsaga, delirium, emerge, instant\\nbrittle, Discover 3\\nmanaburst\\nevoke (in hand), dash (y) (in hand), postpone (y): 1, …\\nQuickcast, Resonance, convokeCast\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\"\n      }\n    ],\n    \"id\": 3,\n    \"artDirection\": \"natural wellspring filled with water\",\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Earth\",\n        \"type\": \"spell\",\n        \"element\": \"earth\",\n        \"cost\": 3,\n        \"text\": \"t3xearth: (x)\",\n        \"notes\": \"[BASIC]\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Earth\",\n        \"type\": \"spell\",\n        \"element\": \"earth\",\n        \"cost\": 3,\n        \"text\": \"t3xearth: (x)\",\n        \"notes\": \"[\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Earth\",\n        \"type\": \"spell\",\n        \"element\": \"earth\",\n        \"cost\": 3,\n        \"text\": \"t3xearth: (x)\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Earth\",\n        \"type\": \"spell\",\n        \"element\": \"earth\",\n        \"cost\": 1,\n        \"text\": \"t3xearth: Gain xvp.\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Earth\",\n        \"type\": \"spell\",\n        \"element\": \"earth\",\n        \"cost\": 1,\n        \"text\": \"x Tap Start of turn blitz passive t3xfire\\nGain 2vp. 2xvp\\nt3xfire: Draw x cards.\\n\\nt3xfire: vp 2vp 10vp *vp 3+vp\\n(x)(0)(1)...(10)(12)(4+) \\n2vp [2] water XXXX (3) XXXX fire\\nIgnition Passive actionFree actionOnce actionMulti manaCostfire\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\"\n      }\n    ],\n    \"id\": 4,\n    \"artDirection\": \"a grassy meadow with sprinkled flowers\",\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"text\": \"t3xwind: (x)\",\n        \"name\": \"Wind\",\n        \"type\": \"spell\",\n        \"element\": \"wind\",\n        \"cost\": 3,\n        \"notes\": \"[BASIC]\",\n        \"isPrinted\": true\n      },\n      {\n        \"text\": \"t3xwind: (x)\",\n        \"name\": \"Wind\",\n        \"type\": \"spell\",\n        \"element\": \"wind\",\n        \"cost\": 3,\n        \"notes\": \"[\",\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"isPrinted\": true\n      },\n      {\n        \"text\": \"ALL ICONS:\\n_ 3 x 2x hedron -2x 10x x+\\n[] [3] [x] [2x] [hedron] [-2x] [10x] [x+]\\nvp 3vp xvp 2xvp hedronvp -2xvp 10xvp x+vp\\n() (3) (x) (2x) (hedron) (-2x) (10x) (x+)\",\n        \"name\": \"Wind\",\n        \"type\": \"spell\",\n        \"element\": \"wind\",\n        \"cost\": 3,\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\",\n        \"isPrinted\": true\n      },\n      {\n        \"text\": \"ALL ICONS:\\n_ 3 x 2x -2x 10x x+\\n[] [3] [x] [2x] [-2x] [10x] [x+]\\nvp 3vp xvp 2xvp -2xvp 10xvp x+vp\\n() (3) (x) (2x) (-2x) (10x) (x+)\",\n        \"name\": \"Wind\",\n        \"type\": \"spell\",\n        \"element\": \"wind\",\n        \"cost\": 1,\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\",\n        \"isPrinted\": true\n      },\n      {\n        \"text\": \"ALL ICONS:\\n_ 3 x 2x -2x 10 10x x+\\n[] [3] [x] [2x] [-2x] [10] [10x] [x+]\\nvp 3vp xvp 2xvp -2xvp 10vp 10xvp x+vp\\n() (3) (x) (2x) (-2x) (10) (10x) (x+)\\n(()) ((3)) ((x)) ((2x)) ((-2x)) ((10)) ((10x)) ((x+))\",\n        \"name\": \"Wind\",\n        \"type\": \"spell\",\n        \"element\": \"wind\",\n        \"cost\": 1,\n        \"baseVP\": 2,\n        \"tags\": [\n          \"basic\"\n        ],\n        \"rating\": \"remove\"\n      }\n    ],\n    \"id\": 5,\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Immer besser\",\n        \"type\": \"spell\",\n        \"text\": \"Quickcast remindQuickcast\\nt3xearth Put (x) on a card.\\nPassive After you put () here, gain () equal to () here.\",\n        \"element\": \"earth\",\n        \"cost\": 1,\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Immer besser\",\n        \"type\": \"spell\",\n        \"text\": \"Quickcast remindQuickcast\\nt3xearth Put [x] on a card.\\nPassive After you put [] here, draw a card per [1] here.\",\n        \"element\": \"earth\",\n        \"cost\": 0,\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      }\n    ],\n    \"id\": 6,\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Rathaus\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"text\": \"t3xfire: (3x). Opponent gets (3).\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Rathaus\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"text\": \"affectAll t3xfire: (3x). At end of turn, each opponent gains (3). /affectAll\",\n        \"baseVP\": 2,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Rathaus\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"text\": \"affectAll t3xfire: (3x). At end of turn, an opponent of your choice gains (3). /affectAll\",\n        \"baseVP\": 2,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Rathaus\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 1,\n        \"text\": \"affectAll t3xfire: Gain 2xvp. At end of turn, an opponent of your choice gains xvp. /affectAll\",\n        \"isPrinted\": true\n      }\n    ],\n    \"id\": 7,\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Bumerang\",\n        \"type\": \"spell\",\n        \"element\": \"wind\",\n        \"cost\": 2,\n        \"text\": \"t3xwind: (x).\\nPassive: When you recall this, gain (2).\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Bumerang\",\n        \"type\": \"spell\",\n        \"element\": \"wind\",\n        \"cost\": 2,\n        \"text\": \"start of turn If you are the turnplayer, gain (2).\\nt3xwind: (x).\",\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Bumerang\",\n        \"type\": \"spell\",\n        \"element\": \"wind\",\n        \"cost\": 2,\n        \"text\": \"start of turn If you are the turnplayer, gain (2).\\nt3xwind: (x).\",\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Bumerang\",\n        \"type\": \"spell\",\n        \"element\": \"wind\",\n        \"cost\": 1,\n        \"text\": \"start of turn If you are the turnplayer, draw 2 cards.\\nt3xwind: Gain xvp.\",\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      }\n    ],\n    \"id\": 8,\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Meteor Impact\",\n        \"type\": \"spell\",\n        \"text\": \"Blitz: (1).\\nT3xfire exec the blitz effects of a card costing up to (2x). If x is 4+, exec the effects twice.\",\n        \"element\": \"fire\",\n        \"cost\": 2,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Meteor Impact\",\n        \"type\": \"spell\",\n        \"text\": \"Blitz (1).\\nT3xfire: Exec the blitz effects of a card costing up to (2x). If x is 4+, exec the effects twice instead.\",\n        \"element\": \"fire\",\n        \"cost\": 2,\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Meteor Impact\",\n        \"type\": \"spell\",\n        \"text\": \"Blitz (1).\\nT3xfire: Exec the blitz effects of a card costing up to (2x). If x is 4+, exec the effects twice instead.\",\n        \"element\": \"fire\",\n        \"cost\": 2,\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Meteor Impact\",\n        \"type\": \"spell\",\n        \"text\": \"Blitz Draw a card.\\nT3xfire: Exec the blitz effects of a card costing up to (2x). Manaburst: Exec the effects twice instead. remindManaburst\",\n        \"element\": \"fire\",\n        \"cost\": 1,\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      }\n    ],\n    \"id\": 9,\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"text\": \"t3xfire: (3x).\\npassive: when you recall this, loose (2).\",\n        \"name\": \"Rush Recklessly\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 2,\n        \"isPrinted\": true\n      },\n      {\n        \"text\": \"start of turn If you are the turnplayer, loose (2).\\nt3xfire: (3x).\",\n        \"name\": \"Rush Recklessly\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 2,\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      },\n      {\n        \"text\": \"start of turn If you are the turnplayer, trash 2 cards from hand or field.\\nt3xfire: Draw x + 2 cards.\",\n        \"name\": \"Rush Recklessly\",\n        \"type\": \"spell\",\n        \"element\": \"fire\",\n        \"cost\": 1,\n        \"baseVP\": 1,\n        \"isPrinted\": true\n      }\n    ],\n    \"id\": 10,\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Amalgamation\",\n        \"type\": \"spell\",\n        \"text\": \"blitz Move all other spells under this.\\nPassive This has all abilities of cards under it.\\nT3xwater: (x) per card under this.\",\n        \"element\": \"water\",\n        \"cost\": 15,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Amalgamation\",\n        \"type\": \"spell\",\n        \"text\": \"blitz Store all other spells.\\nPassive This has all abilities of stored cards.\\nT3xwater: Exec x different cast abilities of this, each with a power of 1.\",\n        \"element\": \"water\",\n        \"cost\": 12,\n        \"baseVP\": 8,\n        \"notes\": \"(x) per card under this.\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Amalgamation\",\n        \"type\": \"spell\",\n        \"text\": \"blitz Store all other spells.\\nPassive This has all abilities of stored cards.\\nT3xwater: Exec x different cast abilities of this, each with x = 1.\",\n        \"element\": \"water\",\n        \"cost\": 12,\n        \"baseVP\": 8,\n        \"notes\": \"(x) per card under this.\",\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Amalgamation\",\n        \"type\": \"spell\",\n        \"text\": \"blitz Store all other spells.\\nPassive This has all abilities of stored cards.\\nT3xwater: Exec x different cast abilities of this, each with x being 1.\",\n        \"element\": \"water\",\n        \"cost\": 6,\n        \"baseVP\": 8,\n        \"notes\": \"(x) per card under this.\",\n        \"isPrinted\": true\n      }\n    ],\n    \"id\": 11,\n    \"artDirection\": \"an Amalgamation, a slime with traits of multiple animals\",\n    \"notes\": \"(x) per card under this.\",\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Kapitalinvestition\",\n        \"type\": \"spell\",\n        \"text\": \"t3xfire: (x). Play a card costing up to the amount of () you have.\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Kapitalinvestition\",\n        \"type\": \"spell\",\n        \"text\": \"t3xfire: (x). Play a card costing up to the amount of () you have.\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"baseVP\": 2,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Kapitalinvestition\",\n        \"type\": \"spell\",\n        \"text\": \"t3xfire: Draw 2 cards. Play a card costing up to your hand size.\",\n        \"element\": \"fire\",\n        \"cost\": 1,\n        \"baseVP\": 2,\n        \"isPrinted\": true\n      }\n    ],\n    \"id\": 12,\n    \"artDirection\": \"a banker making an equity investment\",\n    \"$class\": \"Card\"\n  },\n  {\n    \"versions\": [\n      {\n        \"name\": \"Discover\",\n        \"type\": \"spell\",\n        \"text\": \"T3xfire: Reveal the top x cards of the spell pile. Play one of them. Put the rest under the pile in any order.\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Discover\",\n        \"type\": \"spell\",\n        \"text\": \"T3xfire: Reveal the top x cards of the spell pile. Play one of them. Put the rest under the pile in any order.\",\n        \"element\": \"fire\",\n        \"cost\": 3,\n        \"baseVP\": 2,\n        \"isPrinted\": true\n      },\n      {\n        \"name\": \"Discover\",\n        \"type\": \"spell\",\n        \"text\": \"T3xfire: Reveal the top x cards of the spell pile. Play one of them. Put the rest under the pile in any order.\",\n        \"element\": \"fire\",\n        \"cost\": 1,\n        \"baseVP\": 2,\n        \"isPrinted\": true\n      }\n    ],\n    \"id\": 13,\n    \"artDirection\": \"a researcher with a machete walking through a thick jungle, focus on the researcher\",\n    \"$class\": \"Card\"\n  }\n]"
  }
}