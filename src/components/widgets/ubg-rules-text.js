/* global globalThis */

import Morph from 'src/components/widgets/lively-morph.js';

import { Point } from 'src/client/graphics.js'

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

import { fire, water, earth, wind, gray, question, PathDataScaleCache, tenTenPathData, elementInfo, forElement, SVG } from './ubg-utils.js';

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


// #Debug
function previewSVG(svg) {
  const hedronTemp = document.getElementById(svg.id)
  if (hedronTemp) {
    hedronTemp.remove()
  }
  document.body.insertAdjacentHTML("afterbegin", svg.outerHTML)
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
// previewSVG(hedronSVG)

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
// previewSVG(upgradeSVG)


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

  const svg = (<svg id='tap-icon-ubg3' xmlns="http://www.w3.org/2000/svg" version="1.1"
  style="background: transparent; border: 3px solid palegreen;"
  width="200"
  height="200" viewBox={rectToViewBox(TAP_VIEWBOX)}>
  <rect x="9" y="25" width="45" height="72" rx="5" ry="5" fill={C_BACKCARD_FILL} stroke={C_BACKCARD_STROKE} stroke-width="8" stroke-dasharray="15,5"/>
  <rect x="24" y="73" width="72" height="45" rx="5" ry="5"  stroke={C_FRONTCARD_STROKE} fill={C_FRONTCARD_FILL} stroke-width="8"/>
      {path}
    </svg>);
svg
}; 
// previewSVG(tapSVG)





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
// previewSVG(tradeSVG)


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
// previewSVG(cardCostOneSVG)


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

export default class UbgRulesText extends Morph {
  
  /*MD ## Filter MD*/
  get assetsFolder() {
    return this.src.replace(/(.*)\/.*$/i, '$1/assets/');
  }

  /*MD ## Build MD*/
  async fetchAssetsInfo() {
    return (await this.assetsFolder.fetchStats()).contents;
  }

  /*MD ## RENDER MD*/
  parseEffectsAndLists(printedRules) {
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
  
  chip(text) {
    return `<span style="color: #fff; background: black; border-radius: 100px; padding-left: .3em; padding-right: .3em;">${text}</span>`
  }
  
  manaCost(element) {
    const { others } = forElement(element);

    return SVG.inlineSVG(`${SVG.elementSymbol(element, lively.pt(5, 5), 5)}
${SVG.elementSymbol(others[0], lively.pt(12.5, 1.5), 1.5)}
${SVG.elementSymbol(others[1], lively.pt(13, 5), 1.5)}
${SVG.elementSymbol(others[2], lively.pt(12.5, 8.5), 1.5)}`, lively.rect(0, 0, 15, 10));
  }

  // #important
  async renderRuleText() {
    let printedRules = this.innerHTML
    // old big cast icon with small tap
    // printedRules = printedRules.replace(/(^|\n)t3x(fire|water|earth|wind|gray)([^\n]*)/gi, function replacer(match, p1, pElement, pText, offset, string, groups) {
    //   return `<div>tap <span style="font-size: 3em; margin: 0 .1em 0 0; line-height: 0.85;">3x${pElement}</span>${pText}</div>`;
    // });

    // separate rules
    printedRules = printedRules.replace(/affectAll(.*)\/affectAll/gmi, function replacer(match, innerText, offset, string, groups) {
      return `<div style='background: repeating-linear-gradient( -45deg, transparent, transparent 5px, ${AFFECT_ALL_COLOR} 5px, ${AFFECT_ALL_COLOR} 10px ); border: 1px solid ${AFFECT_ALL_COLOR};'>${innerText}</div>`;
    });
                                      
    printedRules = printedRules.replace(/\*(.*?)\*/gmi, (match, content) => {
      return this.italic(content);
    });
                                      
    printedRules = this.parseEffectsAndLists(printedRules);

    printedRules = this.renderReminderText(printedRules)
    
    printedRules = printedRules.replace(/\b(?:\d|-|\+)*x(?:\d|-|\+|vp)*\b/gmi, function replacer(match, innerText, offset, string, groups) {
      // find the bigger pattern, then just replace all x instead of reconstructing its surrounding characters
      return match.replace('x', 'hedron')
    });

    printedRules = printedRules.replace(/blitz/gmi, '<i class="fa-solid fa-bolt-lightning"></i>');
    printedRules = printedRules.replace(/passive/gmi, `<span style="
            display: inline-flex;
            width: 0.7em; /* Set the width to 50% of the normal size */
            height: 1em; /* Maintain the height */
            align-items: center; /* Center align the icon */
            justify-content: center; /* Center align the icon */
            "><i class="fa-solid fa-infinity" style="
            transform: scaleX(0.7);
            transform-origin: center center;
            "></i></span>`);
    printedRules = printedRules.replace(/start of turn,?/gmi, '<span><i class="fa-regular fa-clock-desk"></i></span>');
    printedRules = printedRules.replace(/ignition/gmi, '<span><i class="fa-regular fa-clock-desk"></i></span>');
    printedRules = printedRules.replace(/\btrain\b/gmi, '<i class="fa-solid fa-car-side"></i>');
    printedRules = printedRules.replace(/\btrig\b/gmi, '<i class="fa-solid fa-reply-all fa-flip-vertical fa-flip-horizontal"></i>');
    
    printedRules = printedRules.replace(/\bdaybreak\b/gmi, '<i class="fas fa-sun"></i>');
    printedRules = printedRules.replace(/\bnightfall\b/gmi, '<i class="fa-solid fa-moon"></i>');
   
    printedRules = this.renderCardnames(printedRules)
    
    printedRules = printedRules.replace(/actionFree/gmi, () => this.chip('free'));
    printedRules = printedRules.replace(/actionMulti/gmi, () => this.chip('multi'));
    printedRules = this.renderXPerTurnOrGame(printedRules);
    
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
    printedRules = printedRules.replace(/\bgear\b/gmi, '<i class="fa-solid fa-gear"></i>');
    printedRules = printedRules.replace(/combat/gmi, () => {
      return "<i class='fa fa-swords fa-flip-horizontal'></i>";
    });
    printedRules = printedRules.replace(/!!(.*?)!!/gmi, function replacer(match, content) {
      return `<span class='mandatory-icon'></span><span class='mandatory'>${content}</span>`;
    });
    
    this.renderToDoc(printedRules)
  }
  
  findParentWith(condition) {
    return lively.findParent(this, condition, { deep: true });
  }

  renderCardnames(printedRules) {
    const rulesTextElement = this;
    return printedRules.replace(/\bcardname(?::(\d+))?/gmi, (match, cardId, offset, string, groups) => {
      // lor blue card name #519ff1
      // #ffe967
      // #f8d66a
      // #de9b75
      function getNameFromCard(cardDesc) {
        const currentVersion = cardDesc.versions.last;
        return currentVersion.name || '<no name>'
      }

      function highlightName(name) {
        return `<span style='color: #1f62e9;'>${name}</span>`
      }

      function guessOwnCardname() {
        // find a parent with .card
        const parentWithCard = rulesTextElement.findParentWith(element => element.card);
        if (!parentWithCard) {
          return `<span style='color: red;'>no parent for rules with cardname</span>`
        }
        
        return highlightName(getNameFromCard(parentWithCard.card))
      }
      
      function guessCardnameFromId(cardId) {
        // find a parent with .cards
        const parentWithCards = rulesTextElement.findParentWith(element => Array.isArray(element.cards));
        if (!parentWithCards) {
          return `<span style='color: red;'>no parent for rules with card id: ${cardId}</span>`
        }
        
        // search card with id
        const card = parentWithCards.cards.find(card => card.getId() + '' === cardId)
        if (!card) {
          return `<span style='color: red;'>unknown card id: ${cardId} in parent</span>`
        }
        
        return highlightName(getNameFromCard(card))
      }
      
      if (!cardId) {
        return guessOwnCardname()
      } else {
        return guessCardnameFromId(cardId)
      }
    });
  }
  
  renderXPerTurnOrGame(printedRules) {
    return printedRules.replace(/\b((?:\d+)?(?:hedron)?)\/(game|turn)\b/gmi, (match, times, type, string, groups) => {
      let color = 'black';
      if (type === 'turn') {
        const perTurnColors = [
          // https://materialui.co/colors
          'black',
          '#283593',
          '#303F9F',
          '#3949AB',
          '#3F51B5',
        ]
        
        color = perTurnColors[times] || perTurnColors.last
      }
      if (type === 'game') {
        const perGameColors = [
          'black',
          '#4A148C',
          '#6A1B9A',
          '#7B1FA2',
          '#8E24AA',
        ]
        
        color = perGameColors[1]
      }
      return `<span style="color: ${'white'}; background: ${color}; border-radius: 3px; padding-left: .3em; padding-right: .3em; display: inline-block; transform: skewX(-0.02turn);">${times}/${type}</span>`
    })
  }

  italic(text) {
    return `<span style="font-family: '${CSS_FONT_FAMILY_UNIVERS_45_LIGHT_ITALIC}';">${text}</span>`
  }

  renderReminderText(printedRules) {
    return printedRules.replace(/\bremind(?:er)?(\w+(?:\-(\w|\(|\))*)*)\b/gmi, (match, myMatch, offset, string, groups) => {
      const keywords = {
        actionquest: () => {
          return 'You may play this when you perform the action.'
        },
        
        accelerate: (cost) => {
          return `You may play or buy this as a card costing (${cost}). If you do, exec its accelerate effect, !!then trash it!!.)`
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

        clash: (where) => {
          if (!where) {
            throw new Error('no clash area given')
          }
          
          return `To clash, each involved player selects a card from ${where} and draws a card. Compare the total cost of these cards. Higher costs win.`
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
            return `To cycle (${cost}), pay (${cost}) and sacrifice the card to play a card of equal or lower cost.`
          }
          return `To cycle, sacrifice the card to play a card of equal or lower cost.`
        },
        
        cycling: (cost, who) => {
          if (['acard', 'one', 'all'].includes(cost)) {
            who = cost
            cost = undefined
          }

          let whoToPrint = 'this'
          if (who === 'acard') {
            whoToPrint = 'a card'
          } else if (who === 'one') {
            whoToPrint = 'the card'
          } else if (who === 'all') {
            whoToPrint = 'a card'
          }

          if (cost) {
            return `gear Pay (${cost}) and sacrifice ${whoToPrint} to play a card of equal or lower cost.`
          }
          return `gear Sacrifice ${whoToPrint} to play a card of equal or lower cost.`
        },
        
        dash: (cost, who) => {
          let thatCard = 'this'
          let it = 'this'
          
          if (who === 'one') {
            thatCard = 'that card'
            it = 'it'
          }

          if (cost === 'action') {
            return `To dash, play ${thatCard}, but sacrifice ${it} at end of turn.`
          } else {
            return `Pay (${cost}) to play ${thatCard}, but sacrifice ${it} at end of turn.`
          }
        },
        
        
        delirium: () => {
          // alternative: if you have cards of four different elements in trash.
          return `Only activate delirium abilities if you have fire, water, earth and wind cards in trash.`
        },
        
        
        discover: (howMany, howManyToChoose = 1) => {
          return `To discover ${howMany}, reveal top ${howMany} cards of any piles. Choose ${howManyToChoose} of them, banish the rest.`
        },
        
        emerge: (...args) => {
          if (args.includes('all')) {
            // keyword granted
          return 'When you buy a card: You may sacrifice a card for a discount equal to its cost.'
          }
          
          if (args.includes('one')) {
            // keyword granted
          return 'When you buy the card: You may sacrifice a card for a discount equal to its cost.'
          }
          
          return 'When you buy this: You may sacrifice a card for a discount equal to its cost.'
        },

        evoke: (cost, who) => {
          if (who === 'all') {
            return `gear Pay the cost and discard a card to exec its blitz effects.`
          }
          if (who === 'one') {
            return `gear Pay the cost and discard that card to exec its blitz effects.`
          }
          return `gear Pay (${cost}) and discard this to exec its blitz effects.`
        },

        flashback: (who) => {
          let subject = 'this';
          if (who === 'all') {
            subject = 'a card';
          }
          if (who === 'one') {
            subject = 'the card';
          }
          return `gear Sacrifice ${subject} to exec its blitz effects.`
        },

        impulse: () => {
          return `To impulse a card, set it aside. You may buy it this turn as gear. If you don't: Trash it at end of turn.`
        },
        
        instant: () => {
          return 'gear Buy this.'
        },
                
        invoke: () => {
          return 'gear Discard or sacrifice this to exec the effect.'
        },
        
        manaburst: () => {
          return 'Only activate manaburst abilities if x is 4+.'
        },
        
        magnetic: () => {
          return 'gear Pay this card\'s cost to meld it from hand to a card on field. The melded card has all abilities and combined stats ((), vp, element, type) of its parts.'
        },
        
        meld: () => {
          return 'The melded card has all abilities and combined stats ((), vp, element, type) of its parts.'
        },
        
        postpone: (cost, delay) => {
          return `You may buy this for ${cost} instead of its normal cost. If you do, put this with [${delay}] in your suspend zone. Start of turn Remove [1] from here. Passive If last [] is removed, play this.`
        },
        
        potion: (...args) => {
          return `Discard or sacrifice this to exec the effect.`
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

        reap: (...args) => {
          return `To reap a card, gain () equal to its cost OR vp equal to its base vp.`
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
          const elements = this.guessAllElements()
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
          return 'Reveal cards from deck until you reveal the appropriate card(s), return the others to the game box.'
        },
        
        stuncounter: (...args) => {
          return 'Casting a card with a stun counter removes the counter instead of the effect.'
        },

        synchro: (...args) => {
          return 'Play this as a free action by trashing 2+ cards from field with total cost equal to this card\'s.'
        },

        tiny: () => {
          return 'Tiny cards do not count for triggering the game end.'
        },

        trade: (...args) => {
          return 'To <strong>trade</strong>, discard the card to draw a card.'
        },

        trading: (who) => {
          let whoText = 'this'
          if (who === 'one') {
            whoText = 'the card'
          } else if (who === 'all') {
            whoText = 'a card'
          }

          return `gear 1/turn Discard ${whoText} to draw a card.`
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
      
      return this.italic(`(${reminderText(...modifiers)})`);
    });
  }
  
  renderKeywords(printedRules) {
    const C_DARKGRAY = '#555';
    const C_LIGHTGRAY = '#999';
    
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

    function highlightKeyword(pattern, color, icon = '') {
      printedRules = printedRules.replace(pattern, (match, pElement, offset, string, groups) => {
        const text = match;
        return `<span class='keyword' style='white-space: nowrap;${color ? `color: ${color};` : ''} color: ${color};'>${icon}${text}</span>`
      });
    }
    
    highlightKeyword(/\baccelerate\b/gmi);
    highlightKeyword(/\bactionquest\b/gmi);
    highlightKeyword(/\bblueprint\b/gmi);
    highlightKeyword(/\bbound\b(\sto)?/gmi, C_VIOLET_BLUE);
    highlightKeyword(/brittle\b/gmi, C_RED);
    highlightKeyword(/\bclash\b/gmi);
    highlightKeyword(/\bconvokecast\b/gmi);
    highlightKeyword(/\bcountingquest\b/gmi);
    highlightKeyword(/cycl(ed?|ing)\b/gmi, C_DARKGRAY);
    highlightKeyword(/dash(ed|ing)?\b/gmi, C_BROWN);
    highlightKeyword(/delirium:?\b/gmi, C_DARKGRAY);
    highlightKeyword(/discover(ed)?\b/gmi, C_DARKGRAY); // '<i class="fa-regular fa-cards-blank"></i> '
    highlightKeyword(/\bemerge(\-buy)?\b/gmi);
    highlightKeyword(/\benhance\b/gmi);
    highlightKeyword(/\bevoke\b/gmi);
    highlightKeyword(/\bflashback\b/gmi);
    highlightKeyword(/\binstant\b/gmi);
    highlightKeyword(/\binvoke\b/gmi);
    highlightKeyword(/magnetic\b/gmi, C_RED_LIGHT, '<i class="fa-solid fa-magnet"></i> ');
    highlightKeyword(/manaburst\b:?/gmi, C_VIOLET, '<i class="fa-sharp fa-regular fa-burst"></i> ');
    highlightKeyword(/\b(un)?meld(ed|s)?\b/gmi, C_BLUE_VIOLET);
    highlightKeyword(/\bpostpone\b/gmi);
    highlightKeyword(/potion\b/gmi, C_BLUE_VIOLET, '<i class="fa-regular fa-flask"></i> ');
    highlightKeyword(/\bquest\b/gmi);
    highlightKeyword(/quickcast\b/gmi, C_DARKGRAY);
    highlightKeyword(/\breap\b/gmi);
    highlightKeyword(/resonance\b/gmi, C_GREEN);
    highlightKeyword(/\bsaga\b/gmi);
    highlightKeyword(/seek\b/gmi, C_GREEN, '<i class="fa-sharp fa-solid fa-eye"></i> ');
    //'#3FDAA5' some turquise
    highlightKeyword(/\bstuncounter\b/gmi);
    highlightKeyword(/\bsynchro\b/gmi);
    highlightKeyword(/\btiny\b/gmi);
    highlightKeyword(/trad(ed?|ing)\b/gmi, '#2E9F78', SVG.inlineSVG(tradeSVG.innerHTML, lively.rect(0, 0, 36, 36), 'x="10%" y="10%" width="80%" height="80%"', ''));
    highlightKeyword(/troph(y|ies)(\spoints?)?\b/gmi, C_ORANGE + ' !important', '<i class="fa fa-trophy"></i> ');
    highlightKeyword(/upgraded?\b/gmi, C_ORANGE, SVG.inlineSVG(upgradeSVG.innerHTML, lively.rect(0, 0, 36, 36), 'x="10%" y="10%" width="80%" height="80%"', ''));
    
    return printedRules
  }
  
  renderElementIcon(printedRules) {
    function inlineElement(element) {
      return SVG.inlineSVG(SVG.elementSymbol(element, lively.pt(5, 5), 5));
    }

    return printedRules.replace(/\b(fire|water|earth|wind|gray)\b/gmi, (match, pElement, offset, string, groups) => inlineElement(pElement));
  }
  
  renderHedronIcon(printedRules) {
    function inlineHedron() {
      return SVG.inlineSVG(hedronSVG.innerHTML, lively.rect(0, 0, 23, 23), 'x="10%" y="10%" width="80%" height="80%"', '')
    }

    return printedRules.replace(/hedron/gmi, (match, pElement, offset, string, groups) => inlineHedron());
  }
  
  renderTapIcon(printedRules) {
    function inlineTapIcon() {
      return SVG.inlineSVG(tapSVG.innerHTML, TAP_VIEWBOX, 'x="10%" y="10%" width="80%" height="80%"', '')
    }

    return printedRules.replace(/\btap\b/gmi, (match, pElement, offset, string, groups) => inlineTapIcon());
  }
  
  __textOnIcon__(text, rect, center) {
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

  renderVPIcon(printedRules) {
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
  
  renderCardIcon(printedRules) {
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
  
  renderCoinIcon(printedRules) {
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
  
  renderBracketIcon(printedRules) {
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
  
  renderCastIcon(printedRules) {
    printedRules = printedRules.replace(/t?3x(fire|water|earth|wind|gray)\:?/gi, (match, pElement, offset, string, groups) => {
      return `${castIcon} <b>Cast:</b>`;
    });
return printedRules.replace(/castIcon/gi, (match, pElement, offset, string, groups) => {
      return castIcon;
    });
  }

  async renderToDoc(printedRules) {
    // const [notOwnElements, ownElements] = this.ALL_ELEMENTS.computeDiff(this.guessAllElements())
    // notOwnElements.forEach(element => this.classList.remove(element))
    // ownElements.forEach(element => this.classList.add(element))
    
    this.content.innerHTML = printedRules
  }

  get ALL_ELEMENTS() {
    return ['fire', 'water', 'earth', 'wind'];
  }
  /*MD ## Extract Card Info MD*/
  guessAllElements() {
    // find parent
    const parentWithCard = this.findParentWith(element => element.card);
    if (parentWithCard) {
      return this.getElementsAsArrayFromCard(parentWithCard.card)
    }

    // fallback to classList
    const [, ownElements] = this.ALL_ELEMENTS.computeDiff(this.classList)
    return ownElements
  }
  
  getElementsAsArrayFromCard(cardDesc) {
    const element = cardDesc.getElement();
    
    if (Array.isArray(element)) {
      return element
    }
    
    if (element) {
      return [element]
    }
    
    return []
  }

  /*MD ## Basic Web Components MD*/
  get content() {
    return this.get('#content');
  }
  initialize() {
    if (this.hasAttribute('for-preload')) {
      return;
    }

    // globalThis.__global_ubg_text_counter__ = globalThis.__global_ubg_text_counter__ || 1;
    // this.__global_ubg_text_counter__ = globalThis.__global_ubg_text_counter__++
    
    this.windowTitle = "UbgCard";
    
    this._mutationObserver = new MutationObserver(mutations => {
      let rerenderRequired = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') {
          lively.notify('Text content changed to:' + mutation.target.data);
          rerenderRequired = true;
        } else if (mutation.type === 'childList') {
          lively.notify('Child nodes changed:' + mutation);
          rerenderRequired = true;
        } else if (mutation.type == "attributes") {
          rerenderRequired = true;
          this.attributeChangedCallback(mutation.attributeName, mutation.oldValue, mutation.target.getAttribute(mutation.attributeName));
        }
      });
      
      if (rerenderRequired) {
        this.rerender()
      }
    });
    this._mutationObserver.observe(this, {
      attributes: true,
      characterData: true,
      subtree: true,
      childList: true
    });
    
    this.rerender()
  }
  
  rerender() {
    const rulesTextString = this.innerHTML;
    if (rulesTextString) {
      // lively.notify('RERENDER', fro + this.__global_ubg_text_counter__)
      this.renderRuleText()
    } else {
      // lively.notify('NOTHING TO RENDER', fro + this.__global_ubg_text_counter__)
      this.content.innerHTML = ''
    }
  }
  
  static get observedAttributes() {
    return ["card", "src", "is-cardback"];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    lively.notify(`${oldValue} -> ${newValue}`, 'ATTR ' + name)
  }

  /*MD ## Lively-specific API MD*/
  livelyPrepareSave() {
    // this.setAttribute("data-mydata", this.get("#textField").value)
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    lively.notify('migrate rules text')
  }
  
  async livelyExample() {
  }
  
}
