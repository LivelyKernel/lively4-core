import Card from 'demos/stefan/untitled-board-game/ubg-card.js';

const matches = `Increase the Output! 354 wind gadget (3). Passive: when you cast a spell, you may tap this to give it +2 power.
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
