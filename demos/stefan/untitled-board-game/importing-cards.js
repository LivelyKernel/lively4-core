import Card from 'demos/stefan/untitled-board-game/ubg-card.js';

const matches = `Immer besser 000 spell. t3xearth: put (x) on a card. Passive: after coins are put on this, gain coins equal to coins on this.
Langzeitwirkung 000 gadget. Blitz: 3xwater: put x coins on this, then, attach to a card. Passive: Start of turn: remove a coin to exec its blitz effects.
??? 000 Spell. t3xany: 2x coins. Passive: if this is your only untapped spell, you may cast this as a free action.
??? 000 gadget. Blitz: Buy a card. Passive: As a free action: Trash this to buy a card.
??? 000 Spell. has all spell abilities of spells in shop.
??? 000 Spell. start of turn: put 2 coins on this. t3earth: gain all coins from this.
??? 000 wind Spell. t3xWind: gain 2x coins. 6Wind: buy a card. 9wind: cast a spell. Permanent: for any one spell, you may pay the same element once to activate all effects of that element.
??? 000 Spell. blitz: trash 2 cards in shop. Tap: execute x different blitz effect from trashed cards.
`.matchAll(/^([^0-9]+)?\s([0-9]+)?\s?([a-zA-Z ]+)?\s?(?:\((\d+)\))?\.\s(.*)?$/gmi);

const newCards = [...matches].map(match => {
  const card = new Card();

  card.id = parseInt(match[2]);
  card.versions = [{
    name: match[1],
    type: match[3],
    text: match[5]
  }];

  let type = ''
  let element;
  const typeElement = match[3].split(' ').forEach(te => {
    if (['gadget', 'goal', 'spell', 'trap'].includes(te.toLowerCase())) {
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
    card.versions.last.type = type;
  }
  
  if (element) {
    card.versions.last.element = element;
  }
  
  if (match[4]) {
    card.versions.last.cost = match[4];
  }
  return card;
});

// that.cards.push(...newCards)
