/* global globalThis */

import Morph from 'src/components/widgets/lively-morph.js';

import { Point } from 'src/client/graphics.js'

import paper from 'src/client/paperjs-wrapper.js'
// import 'https://lively-kernel.org/lively4/ubg-assets/load-assets.js';

const POKER_CARD_SIZE_INCHES = lively.pt(2.5, 3.5);
const POKER_CARD_SIZE_MM = POKER_CARD_SIZE_INCHES.scaleBy(25.4);

const CSS_FONT_FAMILY_BEAUFORT_FOR_LOL_BOLD = "Beaufort for LOL Bold"
const CSS_FONT_FAMILY_BEAUFORT_FOR_LOL_REGULAR = "Beaufort for LOL Regular"
const CSS_FONT_FAMILY_UNIVERS_55 = "Univers 55"
const CSS_FONT_FAMILY_UNIVERS_45_LIGHT_ITALIC = "Univers 45 Light Italic"

// Card name, card cost, card stats -- Beaufort for LOL Bold
const CSS_FONT_FAMILY_CARD_NAME = CSS_FONT_FAMILY_BEAUFORT_FOR_LOL_BOLD
const CSS_FONT_FAMILY_CARD_COST = CSS_FONT_FAMILY_BEAUFORT_FOR_LOL_BOLD
const CSS_FONT_FAMILY_CARD_VP = CSS_FONT_FAMILY_BEAUFORT_FOR_LOL_BOLD
const CSS_FONT_FAMILY_CARD_TYPE = CSS_FONT_FAMILY_BEAUFORT_FOR_LOL_REGULAR
// #TODO: Card group name (ELITE, SPIDER, YETI, etc.) -- Univers 59 // #BROKEN?? #TODO

// Card description -- Univers 55
const CSS_FONT_FAMILY_CARD_TEXT = CSS_FONT_FAMILY_UNIVERS_55

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

  static outerSVG(children, innerBounds, outerBounds, attrs = '', style = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewbox="${innerBounds.x} ${innerBounds.y} ${innerBounds.width} ${innerBounds.height}" overflow="visible" width="${outerBounds.width}mm" height="${outerBounds.height}mm" style="position: absolute; left: ${outerBounds.x}mm; top: ${outerBounds.y}mm; ${style}" ${attrs}>${children}</svg>`;
  }

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

const VP_FILL = 'violet';
const VP_STROKE = '#9400d3'; // darkviolet
const VP_FILL_ZERO = '#ddd';
const VP_STROKE_ZERO = 'gray';
const AFFECT_ALL_COLOR = 'rgba(255, 0, 0, 0.2)';

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
  static async renderRuleText(cardEditor, cardDesc, outsideBorder, ruleBox, options) {
    let printedRules = cardDesc.getText() || '';

    // old big cast icon with small tap
    // printedRules = printedRules.replace(/(^|\n)t3x(fire|water|earth|wind|gray)([^\n]*)/gi, function replacer(match, p1, pElement, pText, offset, string, groups) {
    //   return `<div>tap <span style="font-size: 3em; margin: 0 .1em 0 0; line-height: 0.85;">3x${pElement}</span>${pText}</div>`;
    // });

    // separate rules
    printedRules = printedRules.replace(/affectAll(.*)\/affectAll/gmi, function replacer(match, innerText, offset, string, groups) {
      return `<div style='background: repeating-linear-gradient( -45deg, transparent, transparent 5px, ${AFFECT_ALL_COLOR} 5px, ${AFFECT_ALL_COLOR} 10px ); border: 1px solid ${AFFECT_ALL_COLOR};'>${innerText}</div>`;
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
    
    this.renderToDoc(cardEditor, outsideBorder, ruleBox, printedRules, options)
  }
  
  static renderReminderText(printedRules, cardEditor, cardDesc) {
    function italic(text) {
      return `<span style="font-family: '${CSS_FONT_FAMILY_UNIVERS_45_LIGHT_ITALIC}';">${text}</span>`
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
      return `${SVG.inlineSVG(`<g transform="rotate(-45, 5, 5)">
  <rect x="0" y="0" width="10" height="10" fill="${VP_STROKE}"></rect>
  <rect x=".5" y=".5" width="9" height="9" fill="${VP_FILL}"></rect>
</g>
${textToPrint}
`)}`;
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

  static async renderToDoc(cardEditor, outsideBorder, ruleBox, printedRules, options) {
    const {
      insetBoxBy = 1,
      insetTextBy = 1,
      innerStrokeWidth = .2,
      innerStrokeColor = 'black',
      innerFillColor = 'white',
      innerFillOpacity = .5,
      outerStrokeColor= 'gray',
      outerFillColor = 'white',
      outerFillOpacity = .5,
    } = options

    const textShadow = `text-shadow:
     -1px -1px 0 #fff,  
      1px -1px 0 #fff,
     -1px  1px 0 #fff,
      1px  1px 0 #fff;
     -1px  0   0 #fff,  
      1px  0   0 #fff,
      0    1px 0 #fff,
      0   -1px 0 #fff;`
    
    const outerBox = <div style={`
border-top: solid 1mm ${outerStrokeColor};
background: ${cardEditor.colorWithOpacity(outerFillColor, outerFillOpacity)};

position: absolute;
left: 0;
right: 0;
bottom: 0;
`}></div>;
    cardEditor.content.append(outerBox)

    const ruleTextBox = ruleBox.insetBy(insetTextBy);
    // cardEditor.debugRect(ruleTextBox)
    const marginCalc = `${insetBoxBy}mm - ${innerStrokeWidth}mm / 2`;
    const paddingCalc = `${insetTextBy}mm - ${innerStrokeWidth}mm / 2`;
    const ruleTextElement = <div style={`
background: ${cardEditor.colorWithOpacity(innerFillColor, innerFillOpacity)};

margin: calc(${marginCalc});
padding: calc(${paddingCalc});
border: ${innerStrokeColor} solid ${innerStrokeWidth}mm;
border-radius: 1mm;

font-size: 12pt;
font-family: "${CSS_FONT_FAMILY_CARD_TEXT}";

min-height: calc(${ruleTextBox.height}mm - 2 * (${paddingCalc}));

backdrop-filter: blur(4px);
`}></div>;

    ruleTextElement.innerHTML = printedRules;
    outerBox.append(ruleTextElement)
  }
}

const OUTSIDE_BORDER_ROUNDING = lively.pt(3, 3)

export default class UbgCard extends Morph {
  /*MD ## Filter MD*/
  get assetsFolder() {
    return this.src.replace(/(.*)\/.*$/i, '$1/assets/');
  }

  /*MD ## Build MD*/
  async fetchAssetsInfo() {
    return (await this.assetsFolder.fetchStats()).contents;
  }

  /*MD ## Extract Card Info MD*/
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

  /*MD ## Debugging MD*/
  debugPoint(pt, color = 'red') {
    this.content.append(<div style={`
position: absolute;
left: ${pt.x}mm;
top: ${pt.y}mm;
width: 2mm;
height: 2mm;
transform: translate(-50%, -50%);
border-radius: 50%;
background: ${color};
`}></div>);
  }
  
  debugRect(rect, color = 'red') {
    return this.roundedRect(rect, 'transparent', color, 1 / 3.7795275591, 0);
  }
    
  /*MD ## Rendering Helpers MD*/
  line(start, end, color, width) {
    const startX = start.x;
    const startY = start.y;
    const endX = end.x;
    const endY = end.y;

    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

    const line = document.createElement('div');
    line.style.width = length + 'mm';
    line.style.transform = `rotate(${angle}deg) translateY(${-width / 2}mm)`;
    line.style.position = 'absolute';
    line.style.top = startY + 'mm';
    line.style.left = startX + 'mm';
    line.style.height = width + 'mm';
    line.style.backgroundColor = color;
    line.style.transformOrigin = 'top left';

    this.content.append(line)
  }

  roundedRect(rect, fill, stroke, strokeWidth, borderRadius) {
    const element = <div style={`
    position: absolute;
    top: ${rect.y - strokeWidth / 2}mm;
    left: ${rect.x - strokeWidth / 2}mm;
    width: ${rect.width - strokeWidth}mm;
    height: ${rect.height - strokeWidth}mm;

    background-color: ${fill};

    border-style: solid;
    border-width: ${strokeWidth}mm;
    border-color: ${stroke};
    border-radius: ${borderRadius}mm;
`}></div>;

    this.content.append(element)
    
    return element;
  }
  
  colorWithOpacity(color, opacity) {
    return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`
  }

  /*MD ## Background Images MD*/
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
  
  async setBackgroundImage(cardDesc, assetsInfo) {
    const filePath = this.filePathForBackgroundImage(cardDesc, assetsInfo);
    await this._setBackgroundImage(filePath)
  }

  async setBackgroundImageForCardBack() {
    const filePath = this.assetsFolder + 'default-spell.jpg';
    await this._setBackgroundImage(filePath)
  }

  // #TODO: wait for image to be loaded
  async _setBackgroundImage(filePath) {
    this.get('#bg').style.backgroundImage = `url(${filePath})`
  }

  /*MD ## Rendering MD*/
  async renderMagicStyle(cardDesc, outsideBorder, assetsInfo) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // black border
    this.roundedRect(outsideBorder, 'black', 'transparent', '0', '0')

    // innerBorder
    const INNER_INSET = 3;
    const innerBorder = outsideBorder.insetBy(INNER_INSET);

    // id
    this.renderId(cardDesc)
    this.get('#id-version').style.color = 'white'

    // card image
    const filePath = this.filePathForBackgroundImage(cardDesc, assetsInfo);
    const newBG = <div style={`
position: absolute;
top: ${INNER_INSET}mm;
left: ${INNER_INSET}mm;
bottom: ${INNER_INSET}mm;
right: ${INNER_INSET}mm;
background-image: url(${filePath});
background-size: cover;
background-repeat: no-repeat;
background-position: center center;
`}></div>;
    this.content.append(newBG)

    // title bar
    const TITLE_BAR_HEIGHT = 7;
    const titleBar = innerBorder.insetBy(1);
    titleBar.height = TITLE_BAR_HEIGHT;
    const TITLE_BAR_BORDER_WIDTH = 0.200025;
    this.roundedRect(titleBar, this.colorWithOpacity(BOX_FILL_COLOR, .5), BOX_STROKE_COLOR, TITLE_BAR_BORDER_WIDTH, 1)

    // card name
    {
      const pos = titleBar.leftCenter().addX(2);
      const fontSize = .6 * titleBar.height::mmToPoint();

      const cardName = this.getNameFromCard(cardDesc);
      this.content.append(<span style={`
position: absolute;
left: ${pos.x}mm;
top: ${pos.y}mm;
transform: translateY(-50%);
max-width: ${titleBar.width}mm;
color: #000000;
font-size: ${fontSize}pt;
font-family: "${CSS_FONT_FAMILY_CARD_NAME}";
`}>{cardName}</span>)
    }

    // cost
    const COIN_RADIUS = 4;
    const coinPos = titleBar.bottomLeft().addY(1).addXY(COIN_RADIUS, COIN_RADIUS);
    this.renderCost(cardDesc, coinPos, COIN_RADIUS)

    // type & elements
    const typePos = coinPos.addY(COIN_RADIUS * 1.5)
    this.renderType(cardDesc, typePos, BOX_FILL_COLOR, BOX_FILL_OPACITY)

    // rule box
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .4;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    // this.debugRect(ruleBox)
    const ruleBoxInset = 1 + INNER_INSET;
    const ruleTextInset = 2;
    await this.renderRuleText(cardDesc, outsideBorder, ruleBox, {
      insetBoxBy: ruleBoxInset,
      insetTextBy: ruleTextInset,
      innerStrokeColor: BOX_STROKE_COLOR,
      innerFillColor: BOX_FILL_COLOR,
      innerFillOpacity: BOX_FILL_OPACITY,
      outerStrokeColor: 'transparent',
      outerFillColor: 'transparent',
      outerFillOpacity: 0,
    });

    // tags
    const tagsAnchor = titleBar.bottomRight().addY(1);
    this.renderTags(cardDesc, tagsAnchor, outsideBorder)
  }

  async renderFullBleedStyle(cardDesc, outsideBorder, assetsInfo) {
    const type = cardDesc.getType();
    const typeString = type && type.toLowerCase && type.toLowerCase() || '';

    if (typeString === 'spell') {
      await this.renderSpell(cardDesc, outsideBorder, assetsInfo)
    } else if (typeString === 'gadget') {
      await this.renderGadget(cardDesc, outsideBorder, assetsInfo)
    } else if (typeString === 'character') {
      await this.renderCharacter(cardDesc, outsideBorder, assetsInfo)
    } else {
      await this.renderMagicStyle(cardDesc, outsideBorder, assetsInfo)
    }
    
    this.renderIsBad(cardDesc, outsideBorder)
    this.renderVersionIndicator(cardDesc, outsideBorder)
  }
  
  maskedCircle(outsideBorder, center, radius, strokeWidth, fillColor, fillOpacity, strokeColor) {
    strokeWidth *= 2; // half covered by mask

    const svg = <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 1 1" width="1mm" height="1mm" overflow="visible" style={`
position: absolute;
`}>
            <defs>
              <mask id="cut-off-spell-circle-mask" x="0" y="0" width="600" height="250" >
                <rect x="0" y="0" width={outsideBorder.width} height={outsideBorder.height}  fill="white"/>
                <circle cx={center.x} cy={center.y} r={radius} fill="black"></circle>
              </mask>
            </defs>
            <rect x="0" y="0" width={outsideBorder.width} height={outsideBorder.height} fill={fillColor} fill-opacity={fillOpacity} mask="url(#cut-off-spell-circle-mask)"/>
            <circle cx={center.x} cy={center.y} r={radius} stroke={strokeColor} stroke-width={strokeWidth} mask="url(#cut-off-spell-circle-mask)"></circle>
          </svg>;

    this.content.insertAdjacentHTML('beforeend', svg.outerHTML)
    
  }
  /*MD ### Rendering Card Types MD*/
  // #important
  async renderSpell(cardDesc, outsideBorder, assetsInfo) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    await this.setBackgroundImage(cardDesc, assetsInfo)

    // spell circle
    {
      const CIRCLE_BORDER = -3;
      const radius = (outsideBorder.width - CIRCLE_BORDER) / 2;
      const center = outsideBorder.center().withY(outsideBorder.top() + CIRCLE_BORDER + radius)
      const strokeWidth = 1;
      this.maskedCircle(outsideBorder, center, radius, strokeWidth, BOX_FILL_COLOR, BOX_FILL_OPACITY, BOX_STROKE_COLOR)
    }
    
    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);

    // title
    const TITLE_BAR_HEIGHT = 7;
    const COST_COIN_RADIUS = 4;
    const COST_COIN_MARGIN = 2;
    
    const titleBorder = innerBorder.insetBy(1);
    titleBorder.height = TITLE_BAR_HEIGHT;

    this.renderTitleBarAndCost(cardDesc, titleBorder, COST_COIN_RADIUS, COST_COIN_MARGIN)

    // rule box
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .3;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    // this.debugRect(ruleBox)
    
    // rule text
    const RULE_BOX_INSET = 1;
    const RULE_TEXT_INSET = 1;
    await this.renderRuleText(cardDesc, outsideBorder, ruleBox, {
      insetBoxBy: RULE_BOX_INSET,
      insetTextBy: RULE_TEXT_INSET,
      outerStrokeColor: 'transparent',
      outerFillColor: 'transparent',
      outerFillOpacity: 0,
    });

    // tags
    const tagsAnchor = lively.pt(titleBorder.right(), titleBorder.bottom()).addXY(-RULE_TEXT_INSET, 1);
    this.renderTags(cardDesc, tagsAnchor, outsideBorder)

    // id
    this.renderId(cardDesc)
  }

  // #important
  async renderGadget(cardDesc, outsideBorder, assetsInfo) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    await this.setBackgroundImage(cardDesc, assetsInfo)

    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // this.roundedRect(innerBorder, 'steelblue', 'red', 3, 0)

    // top box
    const topBox = outsideBorder.copy()
    {
      topBox.height = 13;
      const box = this.roundedRect(topBox, this.colorWithOpacity(BOX_FILL_COLOR, BOX_FILL_OPACITY), 'transparent', 0, 0);
      box.style.backdropFilter = 'blur(4px)';
      
      this.line(topBox.bottomLeft(), topBox.bottomRight(), BOX_STROKE_COLOR, 1)
    }
    
    // title
    {
      const TITLE_BAR_HEIGHT = 7;
      const COST_COIN_RADIUS = 4;
      const COST_COIN_MARGIN = 2;
      
      const titleBorder = innerBorder.insetBy(1);
      titleBorder.height = TITLE_BAR_HEIGHT;
      
      this.renderTitleBarAndCost(cardDesc, titleBorder, COST_COIN_RADIUS, COST_COIN_MARGIN)
    }
        
    // rule box border calc
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .4;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    // this.debugRect(ruleBox)
    
    // rule text
    const RULE_BOX_INSET = 1;
    const RULE_TEXT_INSET = 1;
    await this.renderRuleText(cardDesc, outsideBorder, ruleBox, {
      insetBoxBy: RULE_BOX_INSET,
      insetTextBy: RULE_TEXT_INSET,
      outerStrokeColor: BOX_STROKE_COLOR,
      outerFillColor: BOX_FILL_COLOR,
      outerFillOpacity: BOX_FILL_OPACITY,
    });
    
    // tags
    const tagsAnchor = lively.pt(topBox.right(), topBox.bottom()).addXY(-RULE_TEXT_INSET, 1);
    this.renderTags(cardDesc, tagsAnchor, outsideBorder)

    // id
    this.renderId(cardDesc)
  }

  // #important
  async renderCharacter(cardDesc, outsideBorder, assetsInfo) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    await this.setBackgroundImage(cardDesc, assetsInfo)

    // Zohar design
    {
      const ZOHAR_DESIGN_BORDER_WIDTH = .5;
      [[outsideBorder.topLeft(), lively.pt(1, 0)], [outsideBorder.topRight(), lively.pt(-1, 0)]].forEach(([startingPt, direction]) => {
        const dirX = direction.x;
        startingPt = startingPt.subY(5)
        const topMost = startingPt.addXY(dirX*8, 0);
        const triangleTop = topMost.addXY(0, 15 + 5);
        const triangleOuter = triangleTop.addXY(-dirX*15, 15);
        const triangleBottom = triangleOuter.addXY(dirX*15, 15);
        const bottom = triangleBottom.addXY(0, 100);
        const bottomOuter = bottom.addXY(-dirX*10, 0);
        const diamondPoints = `${startingPt.x} ${startingPt.y}, ${topMost.x} ${topMost.y}, ${triangleTop.x} ${triangleTop.y}, ${triangleOuter.x} ${triangleOuter.y}, ${triangleBottom.x} ${triangleBottom.y}, ${bottom.x} ${bottom.y}, ${bottomOuter.x} ${bottomOuter.y}`;

        const svg = <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 1 1" width="1mm" height="1mm" overflow="visible" style={`
position: absolute;
`}>
                <polygon points={diamondPoints} fill={BOX_FILL_COLOR} fill-opacity='.5' stroke={BOX_STROKE_COLOR} stroke-width={ZOHAR_DESIGN_BORDER_WIDTH}/>
              </svg>;

        this.content.insertAdjacentHTML('beforeend', svg.outerHTML)
      })
    }
    
    // innerBorder
    const innerBorder = outsideBorder.insetBy(3);
    // this.roundedRect(innerBorder, 'steelblue', 'red', 3, 0)

    // title
    const TITLE_BAR_HEIGHT = 7;
    const COST_COIN_RADIUS = 4;
    const COST_COIN_MARGIN = 2;
    
    const titleBorder = innerBorder.insetBy(1);
    titleBorder.height = TITLE_BAR_HEIGHT;
    
    this.renderTitleBarAndCost(cardDesc, titleBorder, COST_COIN_RADIUS, COST_COIN_MARGIN)
    
    // rule box border calc
    const ruleBox = outsideBorder.copy()
    const height = outsideBorder.height * .4;
    ruleBox.y = ruleBox.bottom() - height;
    ruleBox.height = height;
    
    // rule text
    const RULE_BOX_INSET = 1;
    const RULE_TEXT_INSET = 1;
    await this.renderRuleText(cardDesc, outsideBorder, ruleBox, {
      insetBoxBy: RULE_BOX_INSET,
      insetTextBy: RULE_TEXT_INSET,
      outerStrokeColor: BOX_STROKE_COLOR,
      outerFillColor: BOX_FILL_COLOR,
      outerFillOpacity: BOX_FILL_OPACITY,
    });
    
    // tags
    const tagsAnchor = lively.pt(titleBorder.right(), titleBorder.bottom()).addXY(-RULE_TEXT_INSET, 1);
    this.renderTags(cardDesc, tagsAnchor, outsideBorder)

    // id
    this.renderId(cardDesc)
  }
  
  /*MD ### Rendering Card Components MD*/
  renderTitleBarAndCost(cardDesc, border, costCoinRadius, costCoinMargin) {
    const TITLE_BAR_BORDER_WIDTH = 0.200025;

    const titleBar = border.copy()
    const coinLeftCenter = titleBar.leftCenter()
    const spacingForCoin = 2*costCoinRadius + costCoinMargin
    titleBar.x += spacingForCoin
    titleBar.width -= spacingForCoin

    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // title space
    this.roundedRect(border, this.colorWithOpacity('#ffffff', .5), 'transparent', 0, 0)
    
    // title bar
    this.roundedRect(titleBar, this.colorWithOpacity(BOX_FILL_COLOR, .5), BOX_STROKE_COLOR, TITLE_BAR_BORDER_WIDTH, 1)
    
    // card name
    {
      const pos = titleBar.leftCenter().addX(2);
      const fontSize = .6 * titleBar.height::mmToPoint();
      this.content.append(<span style={`
position: absolute;
left: ${pos.x}mm;
top: ${pos.y}mm;
transform: translateY(-50%);
max-width: ${titleBar.width}mm;
color: #000000;
font-size: ${fontSize}pt;
font-family: "${CSS_FONT_FAMILY_CARD_NAME}";
`}>{this.getNameFromCard(cardDesc)}</span>)
    }

    const coinCenter = coinLeftCenter.addX(costCoinRadius);
    this.renderInHandSymbols(cardDesc, border, costCoinRadius, costCoinMargin, coinCenter)
  }
  
  renderInHandSymbols(cardDesc, border, costCoinRadius, costCoinMargin, coinCenter) {
    let currentCenter = coinCenter;

    // cost
    this.renderCost(cardDesc, currentCenter, costCoinRadius)

    if ((cardDesc.getType() || '').toLowerCase() !== 'character') {
      // vp
      currentCenter = currentCenter.addY(costCoinRadius * 2.75);
      this.renderBaseVP(cardDesc, currentCenter, costCoinRadius)

      // element (list)
      currentCenter = currentCenter.addY(costCoinRadius * 2.75);
      const elementListDirection = 1;
      currentCenter = this.renderElementList(cardDesc, currentCenter, costCoinRadius, elementListDirection)
    } else {
      currentCenter = currentCenter.addY(costCoinRadius * 1);
    }

    // type
    currentCenter = currentCenter.addY(costCoinRadius * .75)
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);
    this.renderType(cardDesc, currentCenter, BOX_FILL_COLOR, BOX_FILL_OPACITY)
  }

  renderElementList(cardDesc, pos, radius, direction) {
    const elements = this.getElementsFromCard(cardDesc, true);
    for (let element of elements) {
      this.renderElementSymbol(element, pos, radius)
      pos = pos.addY(direction * radius * .75);
    }
    return pos.addY(direction * radius * .25);
  }

  renderCost(cardDesc, pos, coinRadius) {
    const costSize = coinRadius / 3;

    const costDesc = cardDesc.getCost();
    const cost = Array.isArray(costDesc) ? costDesc.first : costDesc;

    const coinCenter = pos;
    const strokeWidth = .2 * costSize;
    const size = `${2 * coinRadius}mm`;
    const svg = <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10" width={size} height={size} overflow="visible" style={`
position: absolute;
top: ${coinCenter.y - coinRadius}mm;
left: ${coinCenter.x - coinRadius}mm;
`}><circle cx="5" cy="5" r="5" fill="#b8942d" fill-opacity=".9" stroke="rgb(148, 0, 211)" stroke-width={strokeWidth}></circle></svg>;
    this.content.insertAdjacentHTML('beforeend', svg.outerHTML)

//     {
//       const r = <rect x="-2" y="-2" width="10" height="10" fill='red' stroke="#0000ff88" stroke-width="3"/>;
//       const str = <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10" overflow="visible" style={`
// position: absolute;
// top: ${coinCenter.y - coinRadius}mm;
// left: ${coinCenter.x - coinRadius}mm;
// width: ${2 * coinRadius}mm;
// height: ${2 * coinRadius}mm;
// `}>{r}</svg>;
//       this.content.append(str);
//     }

    this.renderIconText(coinCenter, costSize, cost, CSS_FONT_FAMILY_CARD_COST)
  }

  renderBaseVP(cardDesc, pos, coinRadius) {
    const costSize = coinRadius / 3;
    
    const vp = cardDesc.getBaseVP() || 0;
    const fillColor = vp === 0 ? VP_FILL_ZERO : VP_FILL
    const fillOpacity = .9
    const strokeColor = vp === 0 ? VP_STROKE_ZERO : VP_STROKE
    const strokeWidth = .2 * costSize;

    const iconCenter = pos;

    // diamond shape
    const diagonal = coinRadius * .9 * Math.sqrt(2)
    const down = pos.addY(diagonal)
    const left = pos.addX(-diagonal)
    const up = pos.addY(-diagonal)
    const right = pos.addX(diagonal)
    const diamondPoints = `${down.x} ${down.y}, ${left.x} ${right.y}, ${up.x} ${up.y}, ${right.x} ${right.y}`;

    const svg = <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 1 1" width="1mm" height="1mm" overflow="visible" style={`
position: absolute;
`}>
            <polygon points={diamondPoints} fill={fillColor} fill-opacity={fillOpacity} stroke={strokeColor} stroke-width={strokeWidth}/>
          </svg>;
    this.content.insertAdjacentHTML('beforeend', svg.outerHTML)
    this.renderIconText(iconCenter, costSize, vp, CSS_FONT_FAMILY_CARD_VP)
  }

  renderIconText(centerPos, size, text, font) {
    if (text === undefined) {
      return
    }
    
    const iconText = <span style={`
position: absolute;
left: ${centerPos.x}mm;
top: ${centerPos.y}mm;
transform: translate(-50%, -50%);
color: #000000;
font-size: ${12 * size}pt;
font-family: "${font}";
`}>{'' + text}</span>;
    
    this.content.append(iconText)
  }
  
  // #important
  async renderRuleText(cardDesc, outsideBorder, ruleBox, options) {
    return RuleTextRenderer.renderRuleText(this, cardDesc, outsideBorder, ruleBox, options)
  }

  renderType(cardDesc, anchorPt, color, opacity) {
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

    this.content.append(<span style={`
      position: absolute;
      left: ${anchorPt.x}mm;
      top: ${anchorPt.y}mm;
      transform: translateX(-50%);

      color: #000000;
      background-color: ${this.colorWithOpacity(color, opacity)};

      font-size: 7pt;
      font-family: '${CSS_FONT_FAMILY_CARD_TYPE}';

      border-radius: 50mm;
      padding: 1mm;
    `}>{fullText}</span>);
  }
  
  renderTags(cardDesc, tagsAnchor, outsideBorder) {
    const tags = cardDesc.getTags().sortBy(i => i, true).map(tag => <div>#{tag}</div>);
    const FONT_SIZE = 7;
    
    this.content.append(<span style={`
position: absolute;
top: ${tagsAnchor.y}mm;
right: ${outsideBorder.right() - tagsAnchor.x}mm;

color: black;

font-size: ${FONT_SIZE}pt;
font-family: ${CSS_FONT_FAMILY_UNIVERS_55};
`}>{...tags}</span>)
  }

  renderElementSymbol(element, pos, radius) {
    const innerBounds = lively.rect(0, 0, 10, 10)
    const svgInnerPos = innerBounds.center();
    const svgInnerRadius = innerBounds.width / 2;
    const outerBounds = lively.rect(pos.x - radius, pos.y - radius, radius * 2, radius * 2);
    const yourSvgString = SVG.outerSVG(SVG.elementSymbol(element, svgInnerPos, svgInnerRadius), innerBounds, outerBounds);

    this.content.insertAdjacentHTML('beforeend', yourSvgString)
  }
  
  renderId(cardDesc) {
    this.get('#card-id').innerHTML = cardDesc.id || '???'
    this.get('#card-version').innerHTML = cardDesc.getHighestVersion()
  }

  get content() {
    return this.get('#content');
  }
  
  renderIsBad(cardDesc, outsideBorder) {
    const slash = (color, width=2, offset=lively.pt(0,0)) => {
      const start = outsideBorder.topRight().addPt(offset);
      const end = outsideBorder.bottomLeft().addPt(offset);
      this.line(start, end, color, width)
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
  
  renderVersionIndicator(cardDesc, outsideBorder) {
    const VERSION_FILL = '#f7d359';
    this.get('#version-indicator').style.setProperty("--version-fill", VERSION_FILL);
  }

  async _renderCardBack(cardDesc, outsideBorder, assetsInfo) {
    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    // background card image
    await this.setBackgroundImageForCardBack()
    
    // inner border
    {
      const radius = outsideBorder.height * .5 * .9;
      const center = outsideBorder.center()
      
      this.maskedCircle(outsideBorder, center, radius, 0, BOX_FILL_COLOR, BOX_FILL_OPACITY, 'transparent')
    }

    // element symbols
    const innerBorder = outsideBorder.insetBy(3);
    const RADIUS = 5
    this.renderElementList(cardDesc, innerBorder.topLeft().addXY(RADIUS, RADIUS), RADIUS, 1)
    this.renderElementList(cardDesc, innerBorder.topRight().addXY(-RADIUS, RADIUS), RADIUS, 1)
    this.renderElementList(cardDesc, innerBorder.bottomLeft().addXY(RADIUS, -RADIUS), RADIUS, -1)
    this.renderElementList(cardDesc, innerBorder.bottomRight().addXY(-RADIUS, -RADIUS), RADIUS, -1)
    
    // outerBorder
    this.roundedRect(outsideBorder, 'transparent', BOX_STROKE_COLOR, 2, OUTSIDE_BORDER_ROUNDING.x * 1.5)
    
    // hide version elements
    this.get('#id-version').remove()
    this.get('#version-indicator').remove()
  }

  /*MD ## Basic Web Components MD*/
  initialize() {
    if (this.hasAttribute('for-preload')) {
      return;
    }

    this.windowTitle = "UbgCard";
  }
  
  static get observedAttributes() {
    return ["card", "src", "is-cardback"];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    lively.notify(`${oldValue} -> ${newValue}`, name)
  }
  
  /*MD ## External API MD*/
  setSrc(src) {
    return this.src = src;
  }

  setCard(card) {
    return this.card = card;
  }

  setCards(cards) {
    return this.cards = cards;
  }

  async render() {
    this._checkOptionsSet()
    const assetsInfo = await this.fetchAssetsInfo();
    const outsideBorder = lively.pt(0,0).extent(POKER_CARD_SIZE_MM);
    const cardToPrint = this.card;
    await this.renderFullBleedStyle(cardToPrint, outsideBorder, assetsInfo)
  }

  async renderCardBack() {
    this._checkOptionsSet()
    const assetsInfo = await this.fetchAssetsInfo();
    const outsideBorder = lively.pt(0,0).extent(POKER_CARD_SIZE_MM);
    const cardToPrint = this.card;
    await this._renderCardBack(cardToPrint, outsideBorder, assetsInfo)
  }

  _checkOptionsSet() {
    if (!this.src) {
      lively.warn('cannot render: "src" not set')
    }
    if (!this.card) {
      lively.warn('cannot render: "card" not set')
    }
    if (!this.cards) {
      lively.warn('cannot render: "cards" not set')
    }
  }

  /*MD ## Lively-specific API MD*/
  livelyPrepareSave() {
    // this.setAttribute("data-mydata", this.get("#textField").value)
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    const src = other.src;
    if (src) {
      this.setSrc(src);
    }
    
    const cards = other.cards;
    if (cards) {
      this.setCards(cards);
    }
    
    const card = other.card;
    if (card) {
      this.setCard(card);
      this.render();
    }
  }
  
  async livelyExample() {
  }
  
}
