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

import { forElement, SVG, hedronSVG, upgradeSVG, tradeSVG, cardCostOneSVG, TypeAssets } from './ubg-utils.js';

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
  const path = <path fill="var(--primary-text-color)" stroke="var(--primary-text-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin='round' d={`
  M ${toPair(tip)}
  L ${toPair(tipLeft)}
  L ${toPair(anchorLeft)}
  C ${toPair(controlLeft)} ${toPair(controlTail)} ${toPair(tail)}
  C ${toPair(controlTail)} ${toPair(controlRight)} ${toPair(anchorRight)}
  L ${toPair(tipRight)}
  Z`}
/>
;
  
//   CSS.registerProperty({
//     name: '--primary-text-color', 
//   syntax: "<color>",
//   inherits: true,
//   initialValue: 'black',
// })

  const C_BACKCARD_FILL = "transparent";
  const C_BACKCARD_STROKE = "var(--primary-text-color)";
  const C_FRONTCARD_FILL = "var(--primary-text-color)";
  const C_FRONTCARD_STROKE = "var(--primary-text-color)";

  const svg = (<svg id='tap-icon-ubg3' xmlns="http://www.w3.org/2000/svg" version="1.1"
  style="background: transparent; border: 3px solid palegreen;"
  width="200"
  height="200" viewBox={rectToViewBox(TAP_VIEWBOX)}>
  <rect x="9" y="25" width="45" height="72" rx="5" ry="5" fill={C_BACKCARD_FILL} stroke={C_BACKCARD_STROKE} stroke-width="8" stroke-dasharray="15,5" style={``} />
  <rect x="24" y="73" width="72" height="45" rx="5" ry="5"  stroke={C_FRONTCARD_STROKE} fill={C_FRONTCARD_FILL} stroke-width="8"/>
      {path}
    </svg>);
svg
}; 
// previewSVG(tapSVG)

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
    
    printedRules = printedRules.replace(/^---$/gmi, (match, content) => {
      return `<hr style='border: none; height: .5px; background-color: var(--primary-text-color); margin: 0px 0px;'/>`
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
    printedRules = this.renderTypeIcons(printedRules)
    printedRules = this.renderTapIcon(printedRules)
    printedRules = printedRules.replace(/\bgear\b/gmi, '<i class="fa-solid fa-gear"></i>');
    printedRules = printedRules.replace(/combat/gmi, () => {
      return "<i class='fa fa-swords fa-flip-horizontal'></i>";
    });
    printedRules = printedRules.replace(/!!(.*?)!!/gmis, function replacer(match, content) {
      return `<span class='mandatory-icon'></span><span class='mandatory'>${content}</span>`;
    });
    
    printedRules = this.renderCardnames(printedRules)

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
        return `<span class='cardname-in-rules'>${name}</span>`
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
          return 'gear 1/game If you fulfill its condition (track with []): Sacrifice this to gain 1 trophy point.'
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
          return `To discover ${howManyToChoose}/${howMany}, reveal top ${howMany} cards of any piles. Choose ${howManyToChoose} of them, banish the rest.`
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

        enhance: (cost) => {
          // additional cost or replace cost?
          const isAdditional = (cost + '').startsWith('add');
          const curatedCost = (cost + '').replace('add', '');
          
          return `You may play or buy this as a card costing ${isAdditional ? 'additional ' : ''}(${curatedCost}). If you do: This has the noted effect.`
        },

        accelerate: (cost) => {
          return `You may play or buy this as a card costing (${cost}). If you do, exec its accelerate effect, !!then trash it!!.)`
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

        forgeable: (...args) => {
          return 'gear Play this by sacrificing 2+ cards with total cost equal to this card\'s.'
        },

        forge: (...args) => {
          return 'Sacrifice 2+ cards with total cost equal to a card in hand to play that card.'
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
          return 'gear If you fulfill its condition: Play this.'
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
          
          return `To upgrade, sacrifice ${whoText} to play a card costing up to (${diff}) more.`
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
        return `<span class='keyword' style='white-space: nowrap;${color ? `color: ${color};` : ''} color: ${color};'><!--${icon}-->${text}</span>`
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
    highlightKeyword(/discover(ed)?\b/gmi, C_DARKGRAY, '<i class="fa-regular fa-cards-blank"></i> ');
    highlightKeyword(/\bemerge(\-buy)?\b/gmi);
    highlightKeyword(/\benhance\b/gmi);
    highlightKeyword(/\bevoke\b/gmi);
    highlightKeyword(/\bflashback\b/gmi);
    highlightKeyword(/\bforg(e(able|d)?|ing)\b/gmi);
    highlightKeyword(/\bimpulsed?\b/gmi);
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
  
  renderTypeIcons(printedRules) {
    function inlineType(key, encircled) {
      const svg = TypeAssets.getSVGFor(key)
      const viewBoxRect = SVG.getViewBoxAsRect(svg);
      let typeSymbol;
      if (encircled) {
        typeSymbol = SVG.encircledTypeSymbol(svg)
      } else {
        typeSymbol = svg.innerHTML
      }
      return SVG.inlineSVG(typeSymbol, viewBoxRect, 'x="10%" y="10%" width="80%" height="80%"', '')
    }

    for (let key of TypeAssets.getAllKeys()) {
      printedRules = printedRules.replace(new RegExp(`\\b${key}\\b`, 'gmi'), (match, offset, string, groups) => {
        let label = TypeAssets.getLabelFor(match, TypeAssets.KEEP_CAPITALIZATION)
        // preserve first letter is capital
        if (/^[A-Z]/.test(match)) {
          label = label.upperFirst()
        }
        return `${inlineType(key, true)} <span class='type-highlight'>${label}</span>`
      });
    }
    return printedRules
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
          return `<text x="${100 * middle}%" y="50%" dy="10%" dominant-baseline="middle" text-anchor="middle" style="font: .5em sans-serif; text-shadow: initial; fill: var(--primary-text-color);">${part}</text>`
        }
      }).join('')
    } else {
      // simple form: just some text
      textToPrint = `<text x="50%" y="50%" dy="10%" dominant-baseline="middle" text-anchor="middle" style="font: .5em sans-serif; text-shadow: initial; fill: var(--primary-text-color);">${text}</text>`;
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
      const rect = SVG.getViewBoxAsRect(cardCostOneSVG)
      const center = rect.center();
      
      let textToPrint = that.__textOnIcon__(cost, rect, center);
      return SVG.inlineSVG(`${cardCostOneSVG.innerHTML}
${textToPrint}`, rect, 'x="10%" y="10%" width="80%" height="80%"', '')
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
