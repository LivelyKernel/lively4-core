/* global globalThis */

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import Bibliography from "src/client/bibliography.js";
import "src/external/pdf.js";
import { shake } from 'utils';
import { Point } from 'src/client/graphics.js'

import paper from 'src/client/paperjs-wrapper.js'
import 'https://lively-kernel.org/lively4/ubg-assets/load-assets.js';

import { serialize, deserialize } from 'src/client/serialize.js';
import Card from 'demos/stefan/untitled-board-game/ubg-card.js';

const POKER_CARD_SIZE_INCHES = lively.pt(2.5, 3.5);
const POKER_CARD_SIZE_MM = POKER_CARD_SIZE_INCHES.scaleBy(25.4);

class FontCache {

  constructor() {
    this.fonts = {};
  }

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

  async getRuneterraFont(fileName) {
    const RUNETERRA_FONT_FOLDER = 'https://lively-kernel.org/lively4/ubg-assets/fonts/runeterra/fonts/';
    return this.getBase64Font(RUNETERRA_FONT_FOLDER + fileName)
  }

  async BASE64_BeaufortforLOLJaBold() {
    return this.getRuneterraFont('BeaufortforLOLJa-Bold.ttf')
  }

  async BASE64_BeaufortforLOLJaRegular() {
    return this.getRuneterraFont('BeaufortforLOLJa-Regular.ttf')
  }
  
  async BASE64_Univers_55() {
    return this.getRuneterraFont('univers_55.ttf')
  }

  async BASE64_Univers45LightItalic() {
    return this.getRuneterraFont('univers-45-light-italic.ttf')
  }

}

if (globalThis.__ubg_font_cache__) {
  globalThis.__ubg_font_cache__.migrateTo(FontCache);
} else {
  globalThis.__ubg_font_cache__ = new FontCache();
}

const BASE64_BeaufortforLOLJaBold = await globalThis.__ubg_font_cache__.BASE64_BeaufortforLOLJaBold()
const BASE64_BeaufortforLOLJaRegular = await globalThis.__ubg_font_cache__.BASE64_BeaufortforLOLJaRegular()
const BASE64_Univers_55 = await globalThis.__ubg_font_cache__.BASE64_Univers_55()
const BASE64_Univers45LightItalic = await globalThis.__ubg_font_cache__.BASE64_Univers45LightItalic()

const FONT_NAME_BEAUFORT_FOR_LOL_BOLD = 'BeaufortforLOLJa-Bold'
const FONT_NAME_BEAUFORT_FOR_LOL_REGULAR = 'BeaufortforLOLJa-Regular'
const FONT_NAME_UNIVERS_55 = 'univers_55'
const FONT_NAME_UNIVERS_45_LIGHT_ITALIC = 'Univers 45 Light Italic'

// Card group name (ELITE, SPIDER, YETI, etc.) -- Univers 59 // #BROKEN?? #TODO
const FONT_NAME_CARD_TYPE = FONT_NAME_UNIVERS_55

// Card name, card cost, card stats -- Beaufort for LOL Bold
const FONT_NAME_CARD_NAME = FONT_NAME_BEAUFORT_FOR_LOL_BOLD
const FONT_NAME_CARD_COST = FONT_NAME_BEAUFORT_FOR_LOL_BOLD
const FONT_NAME_CARD_VP = FONT_NAME_BEAUFORT_FOR_LOL_BOLD

// Card description -- Univers 55
const FONT_NAME_CARD_TEXT = FONT_NAME_UNIVERS_55

const RUNETERRA_FONT_ID = 'runeterra-fonts'
lively.loadCSSThroughDOM(RUNETERRA_FONT_ID, 'https://lively-kernel.org/lively4/ubg-assets/fonts/runeterra/css/runeterra.css')

const CSS_CLASS_BEAUFORT_FOR_LOL_BOLD = 'beaufort-for-lol-bold'
const CSS_CLASS_BEAUFORT_FOR_LOL_REGULAR = 'beaufort-for-lol-regular'
const CSS_CLASS_UNIVERS_55 = 'univers-55'
const CSS_CLASS_UNIVERS_45_LIGHT_ITALIC = 'univers-45-light-italic'

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

  const svg = (<svg id='tap-icon-ubg' xmlns="http://www.w3.org/2000/svg" version="1.1"
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
  const hedronTemp = document.getElementById('tap-icon-ubg')
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
    
    printedRules = `<span class="${CSS_CLASS_UNIVERS_55}" style="">${printedRules}</span>`
    
    return this.renderToDoc(ruleBox, insetTextBy, printedRules, beforeRenderRules, doc)
  }
  
  static renderReminderText(printedRules, cardEditor, cardDesc) {
    function italic(text) {
      return `<span class="${CSS_CLASS_UNIVERS_45_LIGHT_ITALIC}">${text}</span>`
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

          return !(element === document.head || element.id === RUNETERRA_FONT_ID || element === document.body || element === elementHTML || elementHTML.contains(element));
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

  updateItemsToFilter() {
    const filterValue = this.filterValue;
    this.allEntries.forEach(entry => {
      entry.updateToFilter(filterValue);
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

    if (evt.ctrlKey && !evt.repeat && evt.key == "/") {
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
    await lively.loadJavaScriptThroughDOM('jspdf', lively4url + '/src/external/jspdf/jspdf.umd.js');
    await lively.loadJavaScriptThroughDOM('svg2pdf', lively4url + '/src/external/jspdf/svg2pdf.umd.js');
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

  async fetchAssetsInfo() {
    return (await this.assetsFolder.fetchStats()).contents;
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
    var allFontData = {
      'BeaufortforLOLJa-Bold': {
        vfsName: 'BeaufortforLOLJa-Bold-normal.ttf', 
        fontDataBase64: BASE64_BeaufortforLOLJaBold
      },
      'BeaufortforLOLJa-Regular': {
        vfsName: 'BeaufortforLOLJa-Regular-normal.ttf', 
        fontDataBase64: BASE64_BeaufortforLOLJaRegular
      },
      'univers_55': {
        vfsName: 'univers_55-normal.ttf', 
        fontDataBase64: BASE64_Univers_55
      },
      'Univers 45 Light Italic': {
        vfsName: 'univers-45-light-italic.ttf', 
        fontDataBase64: BASE64_Univers45LightItalic
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
      const assetsInfo = await this.fetchAssetsInfo();

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
        await this.renderCard(doc, cardToPrint, outsideBorder, assetsInfo);

        if (!skipCardBack) {
          const backPage = frontPage + 1
          doc.setPage(backPage)
          
          const rowIndex = (indexOnPage / rowsPerPage).floor();
          const columnIndex = cardsPerRow - 1 - indexOnPage % cardsPerRow;
          const offset = lively.pt(columnIndex * (POKER_CARD_SIZE_MM.x + GAP.x), rowIndex * (POKER_CARD_SIZE_MM.y + GAP.y)).addPt(margin.scaleBy(1 / 2));
          const outsideBorder = offset.extent(POKER_CARD_SIZE_MM);

          // a.æÆ()
          const cardToPrint = cardsToPrint[i];
          await this.renderCardBack(doc, cardToPrint, outsideBorder, assetsInfo);
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
    const filePath = this.filePathForBackgroundImage(cardDesc, assetsInfo);
    return await this.loadBackgroundImageForFile(filePath, bounds)
  }
  
  filePathForBackgroundImage(cardDesc, assetsInfo) {
    const id = cardDesc.id;
    const typeString = cardDesc.getType() && cardDesc.getType().toLowerCase && cardDesc.getType().toLowerCase()
    const assetFileName = id + '.jpg';
    
    if (id && assetsInfo.find(entry => entry.type === 'file' && entry.name === assetFileName)) {
      return this.assetsFolder + assetFileName;
    }

    const defaultFiles = {
      gadget: 'default-gadget.jpg',
      character: 'default-character.jpg',
      spell: 'default-spell.jpg'
    };
    return this.assetsFolder + (defaultFiles[typeString] || 'default.jpg');
  }
  
  async loadBackgroundImageForFile(filePath, bounds) {
    const img = await globalThis.__ubg_file_cache__.getFile(filePath, getImageFromURL);
    const imgRect = lively.rect(0, 0, img.width, img.height);
    const scaledRect = imgRect.fitToBounds(bounds, true);

    return { img, scaledRect }
  }
  
  async renderMagicStyle(doc, cardDesc, outsideBorder, assetsInfo) {
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

  async renderFullBleedStyle(doc, cardDesc, outsideBorder, assetsInfo) {
    const type = cardDesc.getType();
    const typeString = type && type.toLowerCase && type.toLowerCase() || '';

    if (typeString === 'spell') {
      await this.renderSpell(doc, cardDesc, outsideBorder, assetsInfo)
    } else if (typeString === 'gadget') {
      await this.renderGadget(doc, cardDesc, outsideBorder, assetsInfo)
    } else if (typeString === 'character') {
      await this.renderCharacter(doc, cardDesc, outsideBorder, assetsInfo)
    } else {
      await this.renderMagicStyle(doc, cardDesc, outsideBorder, assetsInfo)
    }
    
    this.renderIsBad(doc, cardDesc, outsideBorder)
    this.renderVersionIndicator(doc, cardDesc, outsideBorder)
  }
  
  /*MD ### Rendering Card Types MD*/
  // #important
  async renderSpell(doc, cardDesc, outsideBorder, assetsInfo) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, outsideBorder, assetsInfo);
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
  async renderGadget(doc, cardDesc, outsideBorder, assetsInfo) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, outsideBorder, assetsInfo);
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
  async renderCharacter(doc, cardDesc, outsideBorder, assetsInfo) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    const { img, scaledRect } = await this.getBackgroundImage(doc, cardDesc, outsideBorder, assetsInfo);
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

  async renderCardBack(doc, cardDesc, outsideBorder, assetsInfo) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    const backgroundImageFile = this.assetsFolder + 'default-spell.jpg'
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
      await this.printForExport(cardsToPrint, evt.shiftKey);
    }
  }

  async onPrintChanges(evt) {
    if (!this.cards) {
      return;
    }
    
    const cardsToPrint = this.filterCardsForPrinting(this.cards.filter(card => !card.getIsPrinted()));

    if (await this.checkForLargePrinting(cardsToPrint)) {
      await this.printForExport(cardsToPrint, evt.shiftKey);
    }
  }
  
  async checkForLargePrinting(cardsToPrint) {
    if (cardsToPrint.length > 30) {
      return await lively.confirm(`Print <b>${cardsToPrint.length}</b> cards?<br/>${cardsToPrint.slice(0, 30).map(c => c.getName()).join(', ')}, ...`);
    }
    
    return true;
  }
  
  async printForExport(cards, quickSavePDF) {
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
    
    const doc = await this.buildFullPDF(cards);
    if (quickSavePDF) {
      this.quicksavePDF(doc);
    } else {
      this.openInNewTab(doc);
    }
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

    if (!await lively.confirm(`Save full cards as ${pdfUrl}?`)) {
      return;
    }
    
    const cardsToSave = this.cards.slice(0, 12);
    const doc = await this.buildFullPDF(cardsToSave);
    const blob = doc.output('blob');
    await lively.files.saveFile(pdfUrl, blob);
  }

  async onShowPreview(evt) {
    const cardsToPreview = this.cards.slice(0, 12);
    const doc = await this.buildFullPDF(cardsToPreview);
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