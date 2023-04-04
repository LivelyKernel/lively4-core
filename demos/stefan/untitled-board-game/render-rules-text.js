// element erstellen
// in dom hängen (später entfernen)

var elementHTML = document.querySelector("#ubg-test3");

const rulesText = `Blitz and start of turn
t3xwater: look at top x cards of a non-goal pile.@
t3xwind: fo fo foo
- Trash one,
- add one to the shop
- and add one to your hand. (2x)@
Passive: 3xfire as a free action you may trash this to buy a card.
passive: Start of turn, 3xearth to (3+). treat fire, water, earth, wind, gray
tap: foo.
t3xfire: (2x). foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo.@`;

function coin(text) {
  return `<svg overflow="visible" style="height: 1em; width: 1em; background: lightgray;"xmlns="http://www.w3.org/2000/svg">
     <circle cx=".5em" cy=".5em" r=".5em" fill="goldenrod" stroke="darkviolet" stroke-width=".05em" />
    <text x="50%" y="50%" text-anchor="middle" dy="0.35em" style="font: .8em sans-serif;">${text}</text>
  </svg>`;
}

const fire = <glyph glyph-name="uniF06D" unicode="\\\\\\\\\\\\\\\\uF06D" d="M324 397Q292 368 267 337Q226 394 168 448Q93 377 47 300Q1 222 0 166Q1 102 31 50Q60-2 111-33Q161-63 224-64Q287-63 337-33Q388-2 417 50Q447 102 448 166Q447 209 413 276Q379 343 324 397L324 397M224-16Q149-14 100 38L100 38Q50 89 48 166Q48 202 80 260Q111 318 168 380Q202 345 229 309L265 258L305 306Q313 317 323 327Q358 283 379 237Q400 192 400 166Q398 89 348 38Q299-14 224-16L224-16M314 205L262 146Q261 148 241 173Q221 198 201 224Q180 251 176 256Q144 219 128 192Q112 166 112 142Q113 90 146 61Q178 32 227 32Q265 33 294 53Q326 77 334 114Q341 152 323 187Q319 196 314 205L314 205Z" horiz-adv-x="448" vert-adv-y="512" />;
const water = <glyph glyph-name="uniF043" unicode="\\\\\\\\\\\\\\\\uF043" d="M200 80Q222 78 224 56Q222 34 200 32Q156 33 126 63Q97 92 96 137Q96 147 103 154Q110 161 120 161Q130 161 137 154Q144 147 144 137Q145 112 160 97Q176 81 200 80L200 80M368 129Q366 53 316 4L316 4Q267-46 192-48Q117-46 68 4Q18 53 16 129Q17 167 44 224Q71 280 106 336Q141 392 167 429Q177 442 192 442Q207 442 217 429Q243 392 278 336Q313 280 340 224Q367 167 368 129L368 129M307 179Q292 215 269 257Q250 291 230 323Q209 355 192 380Q175 355 154 323Q134 291 115 257Q92 215 77 179Q63 142 64 129Q65 74 101 38Q138 1 192 0Q246 1 283 38Q319 74 320 129Q321 142 307 179L307 179Z" horiz-adv-x="384" vert-adv-y="512" />;
const earth = <glyph glyph-name="uniF6FC" unicode="\\\\\\\\\\\\\\\\uF6FC" d="M503 54L280 404Q271 416 256 416Q241 416 232 404L9 54Q-8 26 7-3Q24-30 56-32L456-32Q488-31 505-3Q520 26 503 54L503 54M256 352L328 240L256 240Q244 240 237 230L208 192L179 231L256 352L256 352M462 20Q461 16 456 16L56 16Q51 16 49 20Q47 24 49 28L151 188L189 138Q196 128 208 128Q220 128 227 138L268 192L358 192L463 28Q465 24 462 20L462 20Z" horiz-adv-x="512" vert-adv-y="512" />;
const wind = <glyph glyph-name="uniF72E" unicode="\\\\\\\\\\\\\\\\uF72E" d="M24 264L356 264Q395 265 421 291Q447 317 448 356Q447 395 421 421Q395 447 356 448L320 448Q298 446 296 424Q298 402 320 400L356 400Q375 400 387 387Q400 375 400 356Q400 337 387 325Q375 312 356 312L24 312Q2 310 0 288Q2 266 24 264L24 264M164 120L24 120Q2 118 0 96Q2 74 24 72L164 72Q183 72 195 59Q208 47 208 28Q208 9 195-3Q183-16 164-16L128-16Q106-18 104-40Q106-62 128-64L164-64Q203-63 229-37Q255-11 256 28Q255 67 229 93Q203 119 164 120L164 120M420 216L24 216Q2 214 0 192Q2 170 24 168L420 168Q439 168 451 155Q464 143 464 124Q464 105 451 93Q439 80 420 80L384 80Q362 78 360 56Q362 34 384 32L420 32Q459 33 485 59Q511 85 512 124Q511 163 485 189Q459 215 420 216L420 216Z" horiz-adv-x="512" vert-adv-y="512" />;
const any = <glyph glyph-name="uniF111" unicode="\\\\\\\\\\\\\\\\uF111" d="M512 192Q511 120 477 63L477 63Q443 5 385-29L385-29Q328-63 256-64Q184-63 127-29Q69 5 35 63Q1 120 0 192Q1 264 35 321Q69 379 127 413Q184 447 256 448Q328 447 385 413Q443 379 477 321Q511 264 512 192L512 192M256 400Q168 398 109 339L109 339Q50 280 48 192Q50 104 109 45Q168-14 256-16Q344-14 403 45Q462 104 464 192Q462 280 403 339Q344 398 256 400L256 400Z" horiz-adv-x="512" vert-adv-y="512" />;
const question = <glyph glyph-name="uni3f" unicode="?" d="M144 32Q130 32 121 23L121 23Q112 14 112 0Q112-14 121-23Q130-32 144-32Q158-32 167-23Q176-14 176 0Q176 14 167 23Q158 32 144 32L144 32M211 416L104 416Q60 415 30 386Q1 356 0 312L0 296Q2 274 24 272Q46 274 48 296L48 312Q49 336 64 352Q80 367 104 368L211 368Q237 367 254 350Q271 333 272 307Q271 271 240 253L167 215Q121 189 120 137L120 120Q122 98 144 96Q166 98 168 120L168 137Q169 161 189 173L262 211Q289 226 304 251Q320 276 320 307Q319 353 288 384Q257 415 211 416L211 416Z" horiz-adv-x="320" vert-adv-y="512" />;

function tenTenPathData(glyph) {
  const path = new paper.Path(glyph.getAttribute('d'));

  path.scale(1, -1);

  const boundingRect = new paper.Path.Rectangle({
    point: [0, 0],
    size: [10, 10]
  });
  path.fitBounds(boundingRect.bounds);

  return path.pathData;
}

const elementInfo = {
  fire: {
    faIcon: 'book',
    pathData: tenTenPathData(fire),
    pathWidth: parseInt(fire.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(fire.getAttribute('vert-adv-y')),
    fill: '#ffbbbb',
    stroke: '#ff0000',
    others: ['water', 'earth', 'wind']
  },
  water: {
    faIcon: 'droplet',
    pathData: tenTenPathData(water),
    pathWidth: parseInt(water.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(water.getAttribute('vert-adv-y')),
    fill: '#8888ff',
    stroke: '#0000ff',
    others: ['fire', 'earth', 'wind']
  },
  earth: {
    faIcon: 'mountain',
    pathData: tenTenPathData(earth),
    pathWidth: parseInt(earth.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(earth.getAttribute('vert-adv-y')),
    fill: '#dddd66',
    stroke: '#ffff00',
    others: ['fire', 'water', 'wind']
  },
  wind: {
    faIcon: 'cloud',
    pathData: tenTenPathData(wind),
    pathWidth: parseInt(wind.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(wind.getAttribute('vert-adv-y')),
    fill: '#bbffbb',
    stroke: '#00ff00',
    others: ['fire', 'water', 'earth']
  },
  any: {
    faIcon: 'circle',
    pathData: tenTenPathData(any),
    pathWidth: parseInt(any.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(any.getAttribute('vert-adv-y')),
    fill: 'darkgray',
    stroke: '#dddddd',
    others: ['any', 'any', 'any']
  },
  unknown: {
    faIcon: 'question',
    pathData: tenTenPathData(question),
    pathWidth: parseInt(question.getAttribute('horiz-adv-x')),
    pathHeight: parseInt(question.getAttribute('vert-adv-y')),
    fill: 'pink',
    stroke: 'violet',
    others: ['question', 'question', 'question']
  }
};

function forElement(element) {
  if (element === 'gray') {
    element = 'any';
  }

  return elementInfo[element] || elementInfo.unknown;
}

function element(element) {
  const { fill, stroke, pathData } = forElement(element);
  return `<span style="font-size: 1em;"><svg viewbox="0 0 10 10" overflow="visible" style="height: 1em; width: 1em;" xmlns="http://www.w3.org/2000/svg">
<circle cx="5" cy="5" r="5" fill="${fill}" />
<path fill="${stroke}" d="${pathData}"></path>
  </svg></span>`;
}

function manaCost(element) {
  const { fill, stroke, pathData, others } = forElement(element);
  return `<svg viewbox="0 0 15 10" overflow="visible" style="height: 1em; width: 1.5em;" xmlns="http://www.w3.org/2000/svg">
<circle cx="5" cy="5" r="5" fill="${fill}" />
<circle cx="12.5" cy="1.5" r="1.5" fill="${forElement(others[0]).stroke}" />
<circle cx="13" cy="5" r="1.5" fill="${forElement(others[1]).stroke}" />
<circle cx="12.5" cy="8.5" r="1.5" fill="${forElement(others[2]).stroke}" />
<path fill="${stroke}" d="${pathData}"></path>
  </svg>`;
}

let printedRules = rulesText;
printedRules = printedRules.replace(/t3x(fire|water|earth|wind|gray|any)/gmi, 'tap 3x$1');
printedRules = printedRules.replace(/(^|\n)tap 3x(fire|water|earth|wind|gray|any)([^\n])*/gi, function replacer(match, p1, pElement, pText, offset, string, groups) {
  const { faIcon, fill, stroke } = forElement(pElement);
  return `<p style="color: ${fill};"><i class="fa-sharp fa-solid fa-turn-down fa-rotate-by" style="--fa-rotate-angle: 60deg; float: left;"></i><span style="  color: #A52A2A;  float: left;  font-size: 4em;  margin: 0 .1em 0 0;  line-height: 0.85;"><i class="fa-solid fa-${faIcon}" style="color: ${stroke};"></i></span>${pText}</p>`;
});
printedRules = printedRules.replace(/\n/gmi, '<br/>');

printedRules = printedRules.replace(/blitz/gmi, '<i class="fa-solid fa-bolt-lightning"></i>');
printedRules = printedRules.replace(/tap/gmi, '<i class="fa-sharp fa-solid fa-turn-down fa-rotate-by" style="--fa-rotate-angle: 60deg"></i>');
printedRules = printedRules.replace(/passive/gmi, '<i class="fa-solid fa-infinity" style="transform: scaleX(.7);"></i>');
printedRules = printedRules.replace(/start of turn,?/gmi, '<span style="transform: rotate(-10deg);"><i class="fa-regular fa-clock-desk"></i></span>');

printedRules = printedRules.replace(/3x(fire|water|earth|wind|gray|any)/gmi, function replacer(match, pElement, offset, string, groups) {
  return manaCost(pElement);
});
printedRules = printedRules.replace(/(fire|water|earth|wind|gray|any)/gmi, function replacer(match, pElement, offset, string, groups) {
  return element(pElement);
});
printedRules = printedRules.replace(/\(([0-9x+-]+)\)/gmi, function replacer(match, p1, offset, string, groups) {
  return coin(p1);
});

elementHTML.innerHTML = printedRules;

const start = performance.now();
html2canvas(elementHTML, {
  backgroundColor:null,
  ignoreElements: element => {
    try {
      // debugger;
      if (!element) {
        return true;
      }
      return !(element === document.body || element === elementHTML || elementHTML.contains(element));
      // return !(element.localName === 'body' || element.id === 'ubg-test' || element.matches('#ubg-test *'))
    } catch (e) {}
  }
}).then(function (canvas) {
  lively.notify(performance.now() - start, 'time');
  const existCanvas = document.querySelector('#exist-canvas');
  existCanvas && existCanvas.remove();
  document.body.appendChild(canvas);
  canvas.id = 'exist-canvas';
  
  // var imgData = canvas.toDataURL(
  //                   'image/png');              
  //               var doc = new jsPDF('p', 'mm');
  //               doc.addImage(imgData, 'PNG', 10, 10);
  //               doc.save('sample-file.pdf');
});