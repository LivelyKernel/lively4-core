/* global globalThis */

import paper from 'src/client/paperjs-wrapper.js'

export const fire = <glyph glyph-name="uniF06D" unicode="uF06D" d="M324 397Q292 368 267 337Q226 394 168 448Q93 377 47 300Q1 222 0 166Q1 102 31 50Q60-2 111-33Q161-63 224-64Q287-63 337-33Q388-2 417 50Q447 102 448 166Q447 209 413 276Q379 343 324 397L324 397M224-16Q149-14 100 38L100 38Q50 89 48 166Q48 202 80 260Q111 318 168 380Q202 345 229 309L265 258L305 306Q313 317 323 327Q358 283 379 237Q400 192 400 166Q398 89 348 38Q299-14 224-16L224-16M314 205L262 146Q261 148 241 173Q221 198 201 224Q180 251 176 256Q144 219 128 192Q112 166 112 142Q113 90 146 61Q178 32 227 32Q265 33 294 53Q326 77 334 114Q341 152 323 187Q319 196 314 205L314 205Z" horiz-adv-x="448" vert-adv-y="512" />;
export const water = <glyph glyph-name="uniF043" unicode="uF043" d="M200 80Q222 78 224 56Q222 34 200 32Q156 33 126 63Q97 92 96 137Q96 147 103 154Q110 161 120 161Q130 161 137 154Q144 147 144 137Q145 112 160 97Q176 81 200 80L200 80M368 129Q366 53 316 4L316 4Q267-46 192-48Q117-46 68 4Q18 53 16 129Q17 167 44 224Q71 280 106 336Q141 392 167 429Q177 442 192 442Q207 442 217 429Q243 392 278 336Q313 280 340 224Q367 167 368 129L368 129M307 179Q292 215 269 257Q250 291 230 323Q209 355 192 380Q175 355 154 323Q134 291 115 257Q92 215 77 179Q63 142 64 129Q65 74 101 38Q138 1 192 0Q246 1 283 38Q319 74 320 129Q321 142 307 179L307 179Z" horiz-adv-x="384" vert-adv-y="512" />;
export const earth = <glyph glyph-name="uniF6FC" unicode="uF6FC" d="M503 54L280 404Q271 416 256 416Q241 416 232 404L9 54Q-8 26 7-3Q24-30 56-32L456-32Q488-31 505-3Q520 26 503 54L503 54M256 352L328 240L256 240Q244 240 237 230L208 192L179 231L256 352L256 352M462 20Q461 16 456 16L56 16Q51 16 49 20Q47 24 49 28L151 188L189 138Q196 128 208 128Q220 128 227 138L268 192L358 192L463 28Q465 24 462 20L462 20Z" horiz-adv-x="512" vert-adv-y="512" />;
export const wind = <glyph glyph-name="uniF72E" unicode="uF72E" d="M24 264L356 264Q395 265 421 291Q447 317 448 356Q447 395 421 421Q395 447 356 448L320 448Q298 446 296 424Q298 402 320 400L356 400Q375 400 387 387Q400 375 400 356Q400 337 387 325Q375 312 356 312L24 312Q2 310 0 288Q2 266 24 264L24 264M164 120L24 120Q2 118 0 96Q2 74 24 72L164 72Q183 72 195 59Q208 47 208 28Q208 9 195-3Q183-16 164-16L128-16Q106-18 104-40Q106-62 128-64L164-64Q203-63 229-37Q255-11 256 28Q255 67 229 93Q203 119 164 120L164 120M420 216L24 216Q2 214 0 192Q2 170 24 168L420 168Q439 168 451 155Q464 143 464 124Q464 105 451 93Q439 80 420 80L384 80Q362 78 360 56Q362 34 384 32L420 32Q459 33 485 59Q511 85 512 124Q511 163 485 189Q459 215 420 216L420 216Z" horiz-adv-x="512" vert-adv-y="512" />;
export const gray = <glyph glyph-name="uniF111" unicode="uF111" d="M512 192Q511 120 477 63L477 63Q443 5 385-29L385-29Q328-63 256-64Q184-63 127-29Q69 5 35 63Q1 120 0 192Q1 264 35 321Q69 379 127 413Q184 447 256 448Q328 447 385 413Q443 379 477 321Q511 264 512 192L512 192M256 400Q168 398 109 339L109 339Q50 280 48 192Q50 104 109 45Q168-14 256-16Q344-14 403 45Q462 104 464 192Q462 280 403 339Q344 398 256 400L256 400Z" horiz-adv-x="512" vert-adv-y="512" />;
export const question = <glyph glyph-name="uni3f" unicode="?" d="M144 32Q130 32 121 23L121 23Q112 14 112 0Q112-14 121-23Q130-32 144-32Q158-32 167-23Q176-14 176 0Q176 14 167 23Q158 32 144 32L144 32M211 416L104 416Q60 415 30 386Q1 356 0 312L0 296Q2 274 24 272Q46 274 48 296L48 312Q49 336 64 352Q80 367 104 368L211 368Q237 367 254 350Q271 333 272 307Q271 271 240 253L167 215Q121 189 120 137L120 120Q122 98 144 96Q166 98 168 120L168 137Q169 161 189 173L262 211Q289 226 304 251Q320 276 320 307Q319 353 288 384Q257 415 211 416L211 416Z" horiz-adv-x="320" vert-adv-y="512" />;

export class PathDataScaleCache {
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

export function tenTenPathData(element) {
  return PathDataScaleCache.getPathData(element, lively.pt(10, 10));
}

export const elementInfo = {
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

export function forElement(element) {
  const cleanElement = (element || '').toLowerCase();
  return elementInfo[cleanElement] || elementInfo.unknown;
}

export class SVG {

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
  
  static doAsset(assetString, center, radius) {
    const fill = '#dddddd';
    const stroke = '#5A5A5A';

    const innerRadius = .9 * radius;
    return `${SVG.circle(center, innerRadius, `fill="${fill}"`)}
${assetString}
    ${SVG.circleRing(center, innerRadius, radius, `fill="${stroke}"`)}`
  }
  
  static encircledTypeSymbol(svg) {
    const innerBounds = this.getViewBoxAsRect(svg)
    const svgInnerPos = innerBounds.center();
    const svgInnerRadius = innerBounds.width / 2;

    return SVG.doAsset(svg.innerHTML, svgInnerPos, svgInnerRadius);
  }
  
  /*MD ## Helpers MD*/
  static getViewBoxAsRect(svg) {
    const vb = svg.getAttribute('viewBox')
    const r = /([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)/i
    const match = vb.match(r);
    if (!match) {
      throw new Error('could not match viewbox')
    }

    const x = parseFloat(match[1]);
    if (_.isNaN(x)) {
      throw new Error('could not parse x in viewbox')
    }
    const y = parseFloat(match[2]);
    if (_.isNaN(y)) {
      throw new Error('could not parse y in viewbox')
    }
    const width = parseFloat(match[3]);
    if (_.isNaN(width)) {
      throw new Error('could not parse width in viewbox')
    }
    const height = parseFloat(match[4]);
    if (_.isNaN(height)) {
      throw new Error('could not parse height in viewbox')
    }

    return lively.rect(x, y, width, height)
  }
  
  static rectToViewBox(rect) {
    return `${rect.x} ${rect.y} ${rect.width} ${rect.height}`
  }

}

// #Debug
function previewSVG(svg) {
  const hedronTemp = document.getElementById(svg.id)
  if (hedronTemp) {
    hedronTemp.remove()
  }
  document.body.insertAdjacentHTML("afterbegin", svg.outerHTML)
}

export const obeliskSVG = do {
  function point(pt) {
    return `${pt.x} ${pt.y}`;
  }
  
  const circle = <circle cx="5" cy="5" r="4.75" class="ring" style='fill: none; stroke: #3498db; stroke-width: .5;'/>;
  
  const foundationPath = `M2 7.9 L 8 7.9 8 9 2 9 z`
  const foundation = <path fill={"#666"} d={foundationPath}></path>;
  
  const leftPath = `M4.75 7.5 L 2.75 7.5 2.75 3 4.75 5 z`
  const left = <path fill={"#666"} d={leftPath}></path>;

  const rightPath = `M5.25 7.5 L 7.25 7.5 7.25 3 5.25 5 z`
  const right = <path fill={"#666"} d={rightPath}></path>;

  const emblemCenter = lively.pt(5, 2.5);
  const emblemSize = 2;
  const emblemPath = `M${point(emblemCenter.subX(emblemSize))} L ${point(emblemCenter.subY(emblemSize))} ${point(emblemCenter.addX(emblemSize))} ${point(emblemCenter.addY(emblemSize))} z`
  const emblem = <path fill={"#666"} d={emblemPath}></path>;

  <svg
    id='monument'
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    width="300"
    height="300"
    viewBox="0 0 10 10"
    style="background: transparent; border: 3px solid palegreen;">
    {foundation}
    {left}
    {right}
    {emblem}
  </svg>;
};
// previewSVG(obeliskSVG)

export const hedronSVG = do {
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
// previewSVG(hedronSVG)

export const upgradeSVG = do {
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
// previewSVG(upgradeSVG)

export const tradeSVG = do {
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
// previewSVG(tradeSVG)

export const cardCostOneSVG = do {
  '#d3d3d3'
  const C_OUTER = '#252525'
  const C_INNER = '#d1d1d1'
  const C_TOP = '#e1e5e4'
  const C_IMAGE = '#f4f4f4'
  
  const outer = lively.rect(0, 0, 190, 270)
  const inner = outer.insetBy(15)
  const top = inner.insetBy(10)
  const image = top.insetByRect(lively.rect(0, 30, 0, 45))
  const svg = (<svg id='cardCostOneSVG' xmlns="http://www.w3.org/2000/svg" version="1.1"  style="background: transparent; border: 3px solid palegreen;" height="200" width="200" viewBox='0 0 270 270'>
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
// previewSVG(cardCostOneSVG)

const cardCostTwoSVG = do {
  const C_OUTER = 'rgb(243, 243, 243)'
  const C_INNER = 'rgb(129, 129, 129)'
  const C_TOP = 'rgb(162, 165, 168)'
  const C_IMAGE = 'rgb(148, 147, 152)'
  const C_BOTTOM = C_TOP;
  
  const svg = (<svg id='cardCostTwoSVG' xmlns="http://www.w3.org/2000/svg" version="1.1"    style="background: transparent; border: 3px solid palegreen;" height="200" width="200" viewBox='0 0 376 326'>
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

const cardTypeData = {
  rite: ['rite', upgradeSVG],
  codex: ['codex', obeliskSVG],
  apparatus: ['apparatus', obeliskSVG],
  sigil: ['sigil', tradeSVG],
  essence: ['essence', tradeSVG],
  familiar: ['familiar', obeliskSVG],
  dogma: ['dogma', tradeSVG],
  guild: ['guild', obeliskSVG],

  monument: ['monument', obeliskSVG],

  arcane: ['arcane', obeliskSVG],
  machina: ['machina', obeliskSVG],
  natura: ['natura', obeliskSVG],

  relic: ['relic', hedronSVG],
};
    
export class TypeAssets {
  static getAllKeys() {
    return Object.keys(cardTypeData)
  }
  
  static normalizeKey(key) {
    return key.toLower();
  }
  
  static getLabelFor(key) {
    const normalizedKey = this.normalizeKey(key);
    if (normalizedKey in cardTypeData) {
      const [label] = cardTypeData[normalizedKey];
      return label
    } else {
      return key
    }
  }
  
  static getSVGFor(key) {
    const normalizedKey = this.normalizeKey(key);
    if (normalizedKey in cardTypeData) {
      const [,svg] = cardTypeData[normalizedKey];
      return svg
    } else {
      const TYPE_SVG_DEFAULT = cardCostTwoSVG
      return TYPE_SVG_DEFAULT
    }
  }
}





