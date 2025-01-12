/* global globalThis */

import Morph from 'src/components/widgets/lively-morph.js';

import preloaWebComponents from 'src/client/preload-components.js'
await preloaWebComponents(['ubg-rules-text']);

import qrcodegen from 'https://lively-kernel.org/lively4/aexpr/src/external/qrcodegen.js'

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

import { fire, water, earth, wind, gray, question, PathDataScaleCache, tenTenPathData, elementInfo, forElement, SVG } from './ubg-utils.js';

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
    
    if (card.hasType('character')) {
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
    if (id) {
      const possibleFileNames = ['jpg', 'png'].map(ending => `${id}.${ending}`);
      const foundEntry = assetsInfo.find(entry => entry.type === 'file' && possibleFileNames.includes(entry.name));
      if (foundEntry) {
        return this.assetsFolder + foundEntry.name;
      }
    }

    return this.filePathForBackgroundImageForCardTypes(cardDesc)
  }
  
  filePathForBackgroundImageForCardTypes(cardDesc) {
    if (cardDesc.hasType('gadget')) {
      return this.assetsFolder + 'default-gadget.jpg';
    } else if (cardDesc.hasType('character')) {
      return this.assetsFolder + 'default-character.jpg';
    } else if (cardDesc.hasType('spell')) {
      return this.assetsFolder + 'default-spell.jpg';
    }
    
    return this.assetsFolder + 'default.jpg';
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
    await this.loadImage(filePath)
    this.get('#bg').style.backgroundImage = `url(${filePath})`
  }

  async loadImage(filePath) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', resolve);
      image.addEventListener('error', reject);
      image.src = filePath;
    });
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

    // qrcode
    const qrAnchor = titleBar.bottomRight().addY(1);
    this.renderQRCode(cardDesc, qrAnchor, outsideBorder)
    
    // tags
    const tagsAnchor = titleBar.bottomRight().addY(1);
    this.renderTags(cardDesc, tagsAnchor, outsideBorder)
  }

  async renderFullBleedStyle(cardDesc, outsideBorder, assetsInfo) {
    if (cardDesc.hasType('spell')) {
      await this.renderSpell(cardDesc, outsideBorder, assetsInfo)
    } else if (cardDesc.hasType('gadget')) {
      await this.renderGadget(cardDesc, outsideBorder, assetsInfo)
    } else if (cardDesc.hasType('character')) {
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

    // qrcode
    const qrAnchor = lively.pt(titleBorder.right(), titleBorder.bottom()).addXY(-RULE_TEXT_INSET, 1);
    this.renderQRCode(cardDesc, qrAnchor, outsideBorder)
    
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

    // qrcode
    const qrAnchor = lively.pt(topBox.right(), topBox.bottom()).addXY(-RULE_TEXT_INSET, 1);
    this.renderQRCode(cardDesc, qrAnchor, outsideBorder)
    
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

    // qrcode
    const qrAnchor = lively.pt(titleBorder.right(), titleBorder.bottom()).addXY(-RULE_TEXT_INSET, 1);
    this.renderQRCode(cardDesc, qrAnchor, outsideBorder)
    
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
    // this.roundedRect(border, this.colorWithOpacity('#ffffff', .5), 'transparent', 0, 0)
    this.roundedRect(titleBar, this.colorWithOpacity('#ffffff', .5), 'transparent', 0, 1)
    
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

    if (!cardDesc.hasType('character')) {
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
    let cost = Array.isArray(costDesc) ? costDesc.first : (costDesc === undefined ? '' : costDesc);
    const costModifierDesc = cardDesc.getCostModifier();
    if (costModifierDesc) {
      cost += costModifierDesc
    }

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
    const ruleTextBoxElement = this.setupRuleTextBox(cardDesc, outsideBorder, ruleBox, options)
    this.addTextToRuleBox(cardDesc, ruleTextBoxElement)
  }

  setupRuleTextBox(cardDesc, outsideBorder, ruleBox, options) {
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
    
    const outerBox = <div id='outerBox' style={`
border-top: solid 1mm ${outerStrokeColor};
background: ${this.colorWithOpacity(outerFillColor, outerFillOpacity)};

position: absolute;
left: 0;
right: 0;
bottom: 0;
`}></div>;

    this.content.append(outerBox)

    const ruleTextBox = ruleBox.insetBy(insetTextBy);
    // cardEditor.debugRect(ruleTextBox)
    const marginCalc = `${insetBoxBy}mm - ${innerStrokeWidth}mm / 2`;
    const paddingCalc = `${insetTextBy}mm - ${innerStrokeWidth}mm / 2`;
    const ruleTextBoxElement = <div id='ruleText-element' style={`
background: ${this.colorWithOpacity(innerFillColor, innerFillOpacity)};

margin: calc(${marginCalc});
padding: calc(${paddingCalc});
border: ${innerStrokeColor} solid ${innerStrokeWidth}mm;
border-radius: 1mm;

font-size: 12pt;
font-family: "${CSS_FONT_FAMILY_CARD_TEXT}";

min-height: calc(${ruleTextBox.height}mm - 2 * (${paddingCalc}));

backdrop-filter: blur(4px);
`}></div>;

    outerBox.append(ruleTextBoxElement)
    
    return ruleTextBoxElement;
  }
  
  addTextToRuleBox(cardDesc, ruleTextBoxElement) {
    const elements = this.getElementsFromCard(cardDesc, false)
    const rules = cardDesc.getText() || '';
    const htmlString = `<ubg-rules-text class="${elements.join(' ')}">${rules}</ubg-rules-text>`;
    ruleTextBoxElement.insertAdjacentHTML('beforeend', htmlString);
  }
  
  renderType(cardDesc, anchorPt, color, opacity) {
    const types = cardDesc.getTypes();
    const fullText = types.length === 0 ? '&lt;no type>' : types.map(type => type.toLower().upperFirst()).join('<br/>');

    const typesNode = <span style={`
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
    `}></span>;
    typesNode.innerHTML = fullText;
    this.content.append(typesNode);
  }
  
  renderQRCode(cardDesc, qrAnchor, outsideBorder) {
    return;
    const canvas = <canvas id='canvasOutput' style={`
position: absolute;
top: ${qrAnchor.y}mm;
right: ${outsideBorder.right() - qrAnchor.x}mm;

color: black;
`}></canvas>;
    const { QrCode } = qrcodegen
    var qr = QrCode.encodeText("" + cardDesc.getId(), QrCode.Ecc.HIGH);

    function drawCanvas(qr, scale, border, lightColor, darkColor, canvas) {
      if (scale <= 0 || border < 0)
        throw new RangeError("Value out of range");
      const width = (qr.size + border * 2) * scale;
      canvas.width = width;
      canvas.height = width;
      let ctx = canvas.getContext("2d");
      for (let y = -border; y < qr.size + border; y++) {
        for (let x = -border; x < qr.size + border; x++) {
          ctx.fillStyle = qr.getModule(x, y) ? darkColor : lightColor;
          ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
        }
      }
    }

    const [BOX_FILL_COLOR, BOX_STROKE_COLOR, BOX_FILL_OPACITY] = this.colorsForCard(cardDesc);

    drawCanvas(qr, 3, 1, "white", BOX_STROKE_COLOR, canvas);
    this.content.append(canvas)
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
