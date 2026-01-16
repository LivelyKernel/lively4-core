/* global globalThis */

function cssPropertyDefined(name) {
  const tempElement = document.createElement('div');

  document.body.appendChild(tempElement);
  tempElement.style.setProperty(name, 'initial');
  
  const computedStyle = getComputedStyle(tempElement);
  const value = computedStyle.getPropertyValue(name);
  
  document.body.removeChild(tempElement);
  return !!value
}

if (!cssPropertyDefined('--primary-text-color')) {
  CSS.registerProperty({
    name: '--primary-text-color', 
    syntax: "<color>",
    inherits: true,
    initialValue: 'black',
  })
}

export const fire = <glyph glyph-name="uniF06D" unicode="uF06D" d="M324 397Q292 368 267 337Q226 394 168 448Q93 377 47 300Q1 222 0 166Q1 102 31 50Q60-2 111-33Q161-63 224-64Q287-63 337-33Q388-2 417 50Q447 102 448 166Q447 209 413 276Q379 343 324 397L324 397M224-16Q149-14 100 38L100 38Q50 89 48 166Q48 202 80 260Q111 318 168 380Q202 345 229 309L265 258L305 306Q313 317 323 327Q358 283 379 237Q400 192 400 166Q398 89 348 38Q299-14 224-16L224-16M314 205L262 146Q261 148 241 173Q221 198 201 224Q180 251 176 256Q144 219 128 192Q112 166 112 142Q113 90 146 61Q178 32 227 32Q265 33 294 53Q326 77 334 114Q341 152 323 187Q319 196 314 205L314 205Z" horiz-adv-x="448" vert-adv-y="512" />;
export const water = <glyph glyph-name="uniF043" unicode="uF043" d="M200 80Q222 78 224 56Q222 34 200 32Q156 33 126 63Q97 92 96 137Q96 147 103 154Q110 161 120 161Q130 161 137 154Q144 147 144 137Q145 112 160 97Q176 81 200 80L200 80M368 129Q366 53 316 4L316 4Q267-46 192-48Q117-46 68 4Q18 53 16 129Q17 167 44 224Q71 280 106 336Q141 392 167 429Q177 442 192 442Q207 442 217 429Q243 392 278 336Q313 280 340 224Q367 167 368 129L368 129M307 179Q292 215 269 257Q250 291 230 323Q209 355 192 380Q175 355 154 323Q134 291 115 257Q92 215 77 179Q63 142 64 129Q65 74 101 38Q138 1 192 0Q246 1 283 38Q319 74 320 129Q321 142 307 179L307 179Z" horiz-adv-x="384" vert-adv-y="512" />;
export const earth = <glyph glyph-name="uniF6FC" unicode="uF6FC" d="M503 54L280 404Q271 416 256 416Q241 416 232 404L9 54Q-8 26 7-3Q24-30 56-32L456-32Q488-31 505-3Q520 26 503 54L503 54M256 352L328 240L256 240Q244 240 237 230L208 192L179 231L256 352L256 352M462 20Q461 16 456 16L56 16Q51 16 49 20Q47 24 49 28L151 188L189 138Q196 128 208 128Q220 128 227 138L268 192L358 192L463 28Q465 24 462 20L462 20Z" horiz-adv-x="512" vert-adv-y="512" />;
export const wind = <glyph glyph-name="uniF72E" unicode="uF72E" d="M24 264L356 264Q395 265 421 291Q447 317 448 356Q447 395 421 421Q395 447 356 448L320 448Q298 446 296 424Q298 402 320 400L356 400Q375 400 387 387Q400 375 400 356Q400 337 387 325Q375 312 356 312L24 312Q2 310 0 288Q2 266 24 264L24 264M164 120L24 120Q2 118 0 96Q2 74 24 72L164 72Q183 72 195 59Q208 47 208 28Q208 9 195-3Q183-16 164-16L128-16Q106-18 104-40Q106-62 128-64L164-64Q203-63 229-37Q255-11 256 28Q255 67 229 93Q203 119 164 120L164 120M420 216L24 216Q2 214 0 192Q2 170 24 168L420 168Q439 168 451 155Q464 143 464 124Q464 105 451 93Q439 80 420 80L384 80Q362 78 360 56Q362 34 384 32L420 32Q459 33 485 59Q511 85 512 124Q511 163 485 189Q459 215 420 216L420 216Z" horiz-adv-x="512" vert-adv-y="512" />;
export const gray = <glyph glyph-name="uniF111" unicode="uF111" d="M512 192Q511 120 477 63L477 63Q443 5 385-29L385-29Q328-63 256-64Q184-63 127-29Q69 5 35 63Q1 120 0 192Q1 264 35 321Q69 379 127 413Q184 447 256 448Q328 447 385 413Q443 379 477 321Q511 264 512 192L512 192M256 400Q168 398 109 339L109 339Q50 280 48 192Q50 104 109 45Q168-14 256-16Q344-14 403 45Q462 104 464 192Q462 280 403 339Q344 398 256 400L256 400Z" horiz-adv-x="512" vert-adv-y="512" />;
export const question = <glyph glyph-name="uni3f" unicode="?" d="M144 32Q130 32 121 23L121 23Q112 14 112 0Q112-14 121-23Q130-32 144-32Q158-32 167-23Q176-14 176 0Q176 14 167 23Q158 32 144 32L144 32M211 416L104 416Q60 415 30 386Q1 356 0 312L0 296Q2 274 24 272Q46 274 48 296L48 312Q49 336 64 352Q80 367 104 368L211 368Q237 367 254 350Q271 333 272 307Q271 271 240 253L167 215Q121 189 120 137L120 120Q122 98 144 96Q166 98 168 120L168 137Q169 161 189 173L262 211Q289 226 304 251Q320 276 320 307Q319 353 288 384Q257 415 211 416L211 416Z" horiz-adv-x="320" vert-adv-y="512" />;

class PathDataScaleCache {
  static getPathData(element, size = lively.pt(10, 10)) {
    return elementGlyphPathData[element]
  }
}

// path data for element glyphs, scaled to 1, 1
const elementGlyphPathData = {
  'fire': 'M0.65625,0.17969c-0.03333,0.03021 -0.06302,0.06146 -0.08906,0.09375c-0.04271,-0.05937 -0.09427,-0.11719 -0.15469,-0.17344c-0.07812,0.07396 -0.14115,0.15104 -0.18906,0.23125c-0.04792,0.08125 -0.0724,0.15104 -0.07344,0.20937c0.00104,0.06667 0.01719,0.12708 0.04844,0.18125c0.03021,0.05417 0.07187,0.0974 0.125,0.12969c0.05208,0.03125 0.11094,0.0474 0.17656,0.04844c0.06563,-0.00104 0.12448,-0.01719 0.17656,-0.04844c0.05313,-0.03229 0.09479,-0.07552 0.125,-0.12969c0.03125,-0.05417 0.0474,-0.11458 0.04844,-0.18125c-0.00104,-0.04479 -0.01927,-0.10208 -0.05469,-0.17187c-0.03542,-0.06979 -0.08177,-0.13281 -0.13906,-0.18906v0c-0.18229,0.42813 -0.29896,0.6151 -0.35,0.56094v0c-0.05208,-0.05312 -0.07917,-0.11979 -0.08125,-0.2c0,-0.0375 0.01667,-0.08646 0.05,-0.14687c0.03229,-0.06042 0.07813,-0.12292 0.1375,-0.1875c0.03542,0.03646 0.06719,0.07344 0.09531,0.11094l0.05625,0.07969l0.0625,-0.075c0.00833,-0.01146 0.01771,-0.0224 0.02813,-0.03281c0.03646,0.04583 0.06562,0.09271 0.0875,0.14063c0.02188,0.04687 0.03281,0.08385 0.03281,0.11094c-0.00208,0.08021 -0.02917,0.14688 -0.08125,0.2c-0.05104,0.05417 -0.11563,0.08229 -0.19375,0.08437v0l0.05937,-0.25313c-0.00104,-0.00208 -0.01198,-0.01615 -0.03281,-0.04219c-0.02083,-0.02604 -0.04167,-0.0526 -0.0625,-0.07969c-0.02188,-0.02812 -0.0349,-0.04479 -0.03906,-0.05c-0.03333,0.03854 -0.05833,0.07188 -0.075,0.1c-0.01667,0.02708 -0.025,0.05312 -0.025,0.07813c0.00104,0.05417 0.01875,0.09635 0.05313,0.12656c0.03333,0.03021 0.07552,0.04531 0.12656,0.04531c0.03958,-0.00104 0.07448,-0.01198 0.10469,-0.03281c0.03333,-0.025 0.05417,-0.05677 0.0625,-0.09531c0.00729,-0.03958 0.00156,-0.0776 -0.01719,-0.11406c-0.00417,-0.00938 -0.00885,-0.01875 -0.01406,-0.02813v0z',
  'water': 'M0.51306,0.69102c0.02395,0.00218 0.03701,0.01524 0.03918,0.03918c-0.00218,0.02395 -0.01524,0.03701 -0.03918,0.03918c-0.04789,-0.00109 -0.08816,-0.01796 -0.12082,-0.05061c-0.03156,-0.03156 -0.04789,-0.07184 -0.04898,-0.12082c0,-0.01088 0.00381,-0.02014 0.01143,-0.02776c0.00762,-0.00762 0.01687,-0.01143 0.02776,-0.01143c0.01088,0 0.02014,0.00381 0.02776,0.01143c0.00762,0.00762 0.01143,0.01687 0.01143,0.02776c0.00109,0.02721 0.0098,0.04898 0.02612,0.06531c0.01741,0.01741 0.03918,0.02667 0.06531,0.02776v0c0.18068,0.02939 0.24381,0.07075 0.18939,0.12408v0c-0.05333,0.05442 -0.12082,0.08272 -0.20245,0.0849c-0.08163,-0.00218 -0.14912,-0.03048 -0.20245,-0.0849c-0.05442,-0.05333 -0.08272,-0.12136 -0.0849,-0.20408c0.00109,-0.04136 0.01633,-0.09306 0.04571,-0.1551c0.02939,-0.06095 0.06313,-0.1219 0.10122,-0.18286c0.0381,-0.06095 0.07129,-0.11156 0.09959,-0.15184c0.01088,-0.01415 0.02449,-0.02122 0.04082,-0.02122c0.01633,0 0.02993,0.00707 0.04082,0.02122c0.0283,0.04027 0.0615,0.09088 0.09959,0.15184c0.0381,0.06095 0.07184,0.1219 0.10122,0.18286c0.02939,0.06204 0.04463,0.11374 0.04571,0.1551v0c-0.08272,-0.09361 -0.1366,-0.16327 -0.16163,-0.20898c-0.02068,-0.03701 -0.0419,-0.07293 -0.06367,-0.10776c-0.02286,-0.03483 -0.04354,-0.06585 -0.06204,-0.09306c-0.0185,0.02721 -0.03918,0.05823 -0.06204,0.09306c-0.02177,0.03483 -0.04299,0.07075 -0.06367,0.10776c-0.02503,0.04571 -0.04571,0.08816 -0.06204,0.12735c-0.01524,0.04027 -0.02231,0.06748 -0.02122,0.08163c0.00109,0.05986 0.02122,0.10939 0.06041,0.14857c0.04027,0.04027 0.0898,0.06095 0.14857,0.06204c0.05878,-0.00109 0.1083,-0.02177 0.14857,-0.06204c0.03918,-0.03918 0.05932,-0.08871 0.06041,-0.14857c0.00109,-0.01415 -0.00599,-0.04136 -0.02122,-0.08163v0z',
  'earth': 'M0.88589,0.7156l-0.34839,-0.54681c-0.00937,-0.0125 -0.02187,-0.01875 -0.0375,-0.01875c-0.01562,0 -0.02812,0.00625 -0.0375,0.01875l-0.34839,0.54681c-0.01771,0.02916 -0.01875,0.05885 -0.00312,0.08905c0.01771,0.02812 0.04322,0.04322 0.07655,0.04531h0.62492c0.03333,-0.00104 0.05885,-0.01614 0.07655,-0.04531c0.01562,-0.0302 0.01458,-0.05989 -0.00312,-0.08905v0l-0.2734,-0.29059h-0.11249c-0.0125,0 -0.02239,0.00521 -0.02968,0.01562l-0.04531,0.05937l-0.04531,-0.06093l0.1203,-0.18904v0c0.21352,0.34996 0.31767,0.52494 0.31246,0.52494h-0.62492c-0.00521,0 -0.00885,-0.00208 -0.01094,-0.00625c-0.00208,-0.00417 -0.00208,-0.00833 0,-0.0125l0.15936,-0.24997l0.05937,0.07812c0.00729,0.01042 0.01719,0.01562 0.02968,0.01562c0.0125,0 0.02239,-0.00521 0.02968,-0.01562l0.06405,-0.08436h0.14061l0.16404,0.25622c0.00208,0.00417 0.00156,0.00833 -0.00156,0.0125v0z',
  'wind': 'M0.1375,0.3875h0.51875c0.04063,-0.00104 0.07448,-0.0151 0.10156,-0.04219c0.02708,-0.02708 0.04115,-0.06094 0.04219,-0.10156c-0.00104,-0.04063 -0.0151,-0.07448 -0.04219,-0.10156c-0.02708,-0.02708 -0.06094,-0.04115 -0.10156,-0.04219h-0.05625c-0.02292,0.00208 -0.03542,0.01458 -0.0375,0.0375c0.00208,0.02292 0.01458,0.03542 0.0375,0.0375h0.05625c0.01979,0 0.03594,0.00677 0.04844,0.02031c0.01354,0.0125 0.02031,0.02865 0.02031,0.04844c0,0.01979 -0.00677,0.03594 -0.02031,0.04844c-0.0125,0.01354 -0.02865,0.02031 -0.04844,0.02031h-0.51875c-0.02292,0.00208 -0.03542,0.01458 -0.0375,0.0375c0.00208,0.02292 0.01458,0.03542 0.0375,0.0375v0v0.225c-0.02292,0.00208 -0.03542,0.01458 -0.0375,0.0375c0.00208,0.02292 0.01458,0.03542 0.0375,0.0375h0.21875c0.01979,0 0.03594,0.00677 0.04844,0.02031c0.01354,0.0125 0.02031,0.02865 0.02031,0.04844c0,0.01979 -0.00677,0.03594 -0.02031,0.04844c-0.0125,0.01354 -0.02865,0.02031 -0.04844,0.02031h-0.05625c-0.02292,0.00208 -0.03542,0.01458 -0.0375,0.0375c0.00208,0.02292 0.01458,0.03542 0.0375,0.0375h0.05625c0.04062,-0.00104 0.07448,-0.0151 0.10156,-0.04219c0.02708,-0.02708 0.04115,-0.06094 0.04219,-0.10156c-0.00104,-0.04063 -0.0151,-0.07448 -0.04219,-0.10156c-0.02708,-0.02708 -0.06094,-0.04115 -0.10156,-0.04219v0l-0.21875,-0.15c-0.02292,0.00208 -0.03542,0.01458 -0.0375,0.0375c0.00208,0.02292 0.01458,0.03542 0.0375,0.0375h0.61875c0.01979,0 0.03594,0.00677 0.04844,0.02031c0.01354,0.0125 0.02031,0.02865 0.02031,0.04844c0,0.01979 -0.00677,0.03594 -0.02031,0.04844c-0.0125,0.01354 -0.02865,0.02031 -0.04844,0.02031h-0.05625c-0.02292,0.00208 -0.03542,0.01458 -0.0375,0.0375c0.00208,0.02292 0.01458,0.03542 0.0375,0.0375h0.05625c0.04063,-0.00104 0.07448,-0.0151 0.10156,-0.04219c0.02708,-0.02708 0.04115,-0.06094 0.04219,-0.10156c-0.00104,-0.04062 -0.0151,-0.07448 -0.04219,-0.10156c-0.02708,-0.02708 -0.06094,-0.04115 -0.10156,-0.04219v0z',
  'gray': 'M0.9,0.5c-0.00104,0.075 -0.01927,0.14219 -0.05469,0.20156v0c-0.03542,0.06042 -0.08333,0.10833 -0.14375,0.14375v0c-0.05937,0.03542 -0.12656,0.05365 -0.20156,0.05469c-0.075,-0.00104 -0.14219,-0.01927 -0.20156,-0.05469c-0.06042,-0.03542 -0.10833,-0.08333 -0.14375,-0.14375c-0.03542,-0.05938 -0.05365,-0.12656 -0.05469,-0.20156c0.00104,-0.075 0.01927,-0.14219 0.05469,-0.20156c0.03542,-0.06042 0.08333,-0.10833 0.14375,-0.14375c0.05937,-0.03542 0.12656,-0.05365 0.20156,-0.05469c0.075,0.00104 0.14219,0.01927 0.20156,0.05469c0.06042,0.03542 0.10833,0.08333 0.14375,0.14375c0.03542,0.05938 0.05365,0.12656 0.05469,0.20156v0c-0.35833,-0.21458 -0.56823,-0.29115 -0.62969,-0.22969v0c-0.06146,0.06146 -0.09323,0.13802 -0.09531,0.22969c0.00208,0.09167 0.03385,0.16823 0.09531,0.22969c0.06146,0.06146 0.13802,0.09323 0.22969,0.09531c0.09167,-0.00208 0.16823,-0.03385 0.22969,-0.09531c0.06146,-0.06146 0.09323,-0.13802 0.09531,-0.22969c-0.00208,-0.09167 -0.03385,-0.16823 -0.09531,-0.22969c-0.06146,-0.06146 -0.13802,-0.09323 -0.22969,-0.09531v0z',
  'question': 'M0.47143,0.78571c-0.01667,0 -0.03036,0.00536 -0.04107,0.01607v0c-0.01071,0.01071 -0.01607,0.0244 -0.01607,0.04107c0,0.01667 0.00536,0.03036 0.01607,0.04107c0.01071,0.01071 0.0244,0.01607 0.04107,0.01607c0.01667,0 0.03036,-0.00536 0.04107,-0.01607c0.01071,-0.01071 0.01607,-0.0244 0.01607,-0.04107c0,-0.01667 -0.00536,-0.03036 -0.01607,-0.04107c-0.01071,-0.01071 -0.0244,-0.01607 -0.04107,-0.01607v0l-0.07143,-0.68571c-0.05238,0.00119 -0.09643,0.01905 -0.13214,0.05357c-0.03452,0.03571 -0.05238,0.07976 -0.05357,0.13214v0.02857c0.00238,0.02619 0.01667,0.04048 0.04286,0.04286c0.02619,-0.00238 0.04048,-0.01667 0.04286,-0.04286v-0.02857c0.00119,-0.02857 0.01071,-0.05238 0.02857,-0.07143c0.01905,-0.01786 0.04286,-0.02738 0.07143,-0.02857h0.19107c0.03095,0.00119 0.05655,0.0119 0.07679,0.03214c0.02024,0.02024 0.03095,0.04583 0.03214,0.07679c-0.00119,0.04286 -0.02024,0.075 -0.05714,0.09643l-0.13036,0.06786c-0.05476,0.03095 -0.08274,0.07738 -0.08393,0.13929v0.03036c0.00238,0.02619 0.01667,0.04048 0.04286,0.04286c0.02619,-0.00238 0.04048,-0.01667 0.04286,-0.04286v-0.03036c0.00119,-0.02857 0.01369,-0.05 0.0375,-0.06429l0.13036,-0.06786c0.03214,-0.01786 0.05714,-0.04167 0.075,-0.07143c0.01905,-0.02976 0.02857,-0.0631 0.02857,-0.1c-0.00119,-0.05476 -0.02024,-0.1006 -0.05714,-0.1375c-0.0369,-0.0369 -0.08274,-0.05595 -0.1375,-0.05714v0z',
}

const elementInfo = {
  fire: {
    name: 'fire',
    faIcon: 'book',
    fill: '#ffbbbb',
    stroke: '#ff0000',
    others: ['water', 'earth', 'wind']
  },
  water: {
    name: 'water',
    faIcon: 'droplet',
    fill: '#8888ff',
    stroke: '#0000ff',
    others: ['fire', 'earth', 'wind']
  },
  earth: {
    name: 'earth',
    faIcon: 'mountain',
    fill: 'rgb(255, 255, 183)',
    stroke: '#ffd400',
    others: ['fire', 'water', 'wind']
  },
  wind: {
    name: 'wind',
    faIcon: 'cloud',
    fill: '#bbffbb',
    stroke: '#00ff00',
    others: ['fire', 'water', 'earth']
  },
  gray: {
    name: 'gray',
    faIcon: 'circle',
    fill: '#dddddd',
    stroke: '#5A5A5A',
    others: ['gray', 'gray', 'gray']
  },
  unknown: {
    name: 'unknown',
    faIcon: 'question',
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
    const pathData = elementGlyphPathData[element];
    return `<g transform="translate(${__probes__['ubg-utils 167 7776bc71'] = center.x-radius},${__probes__['ubg-utils 167 d0671792'] = center.y-radius}) scale( ${__probes__['ubg-utils 167 4e4739c3'] = 2*radius})"><path d="${pathData}" ${__probes__['ubg-utils 166 15b39d25'] = attrs || ''}></path></g>`
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

export const zoharSVG = do {
  function point(pt) {
    return `${pt.x} ${pt.y}`;
  }
  
  const top = 5;
  const bottom = 95;
  const left = 32;
  const right = 100 - left;
  
  const crossTop = 23;
  const crossUp = crossTop + 5;
  const crossDown = crossUp + 10;
  const crossBottom = crossDown + 5;
  
  const zoharPath = `
  M${left} ${top} L 
  ${right} ${top}
  ${right} ${crossTop}
  ${right+10} ${crossUp}
  ${right+10} ${crossDown}
  ${right} ${crossBottom}
  ${right} ${bottom} 
  ${left} ${bottom} 
  ${left} ${crossBottom}
  ${left-10} ${crossDown}
  ${left-10} ${crossUp}
  ${left} ${crossTop}
  z`;
  
  const eyeCenter = lively.pt(50, 34);
  const eyeWidth = 16
  const eyeLeft = eyeCenter.subX(eyeWidth / 2);
  const eyeRight = eyeCenter.addX(eyeWidth / 2);
  const eyeTop = eyeCenter.subY(5);
  const eyeBottom = eyeCenter.addY(10);
  const zoharEyePath = `M
  ${point(eyeLeft)} Q ${point(eyeTop)} ${point(eyeRight)} Q ${point(eyeBottom)} ${point(eyeLeft)}
  z`;
        // gray: #cbd8cf
  <svg
    id='zohar'
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    width="200"
    height="200"
    viewBox="0 0 100 100"
    style="background: transparent; border: 3px solid palegreen;">
      <defs>
        <linearGradient id="myGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#eea827;stop-opacity:1" />
          <stop offset="40%" style="stop-color:#eedf33;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#eedf33;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ed9d24;stop-opacity:1" />
        </linearGradient>

        <mask id="myMask">
          <path d={zoharPath} fill="white"></path>
          <path d={zoharEyePath} fill="black" />
        </mask>
    </defs>
    <circle cx={eyeCenter.x} cy={eyeCenter.y} r="3.5" fill="#78effa" />
    <path d={zoharPath} fill='none' stroke='darkgray' stroke-width='5' stroke-linejoin="round"></path>
    <rect x="0" y="0" width="100" height="100" fill="url(#myGradient)" stroke='#cbd8cf' mask="url(#myMask)" />
  </svg>;
};
// previewSVG(zoharSVG)

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
  
  character: ['character', zoharSVG],
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





