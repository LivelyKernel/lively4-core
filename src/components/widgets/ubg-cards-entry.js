import Morph from 'src/components/widgets/lively-morph.js';

export default class UBGCardEntry extends Morph {
  async initialize() {
    this.windowTitle = "UBGCardEntry";
    this.registerButtons();
    this.addEventListener('click', evt => this.clicked(evt));
    this.updateView();
  }

  get ubg() {
    return lively.allParents(this, undefined, true).find(ele => ele.tagName === 'UBG-CARDS');
  }

  clicked(evt) {
    this.ubg.selectEntry(this);
  }

  get mode() {
    return this.getAttribute("mode");
  }

  set mode(mode) {
    // mode: default, edit, readonly
    this.setAttribute("mode", mode);
  }

  get value() {
    return this._value;
  }

  parseAuthors(bibtexAuthors) {
    return bibtexAuthors.split(/ and /).map(ea => ea.split(/, /).reverse().join(" "));
  }

  set value(cardData) {
    if (cardData) {
      this.textContent = JSON.stringify(cardData, undefined, 2);
    } else {
      this.textContent = "{}";
    }
    this._value = cardData;
    this.updateView();
  }

  get card() {
    return this.value;
  }

  get pane() {
    return this.get("#pane");
  }

  updateView() {
    const card = this.value;
    if (!card) {
      // lively.notify('no value for ubg entry');
      return;
    }
    
    this.classList.toggle('is-bad', !!(card.hasTag('bad') || card.hasTag('deprecated')))

    const v = card.versions.last;

    const id = this.get('#id')
    id.style.borderLeft = '5px solid ' + ({
      essential: 'green',
      keep: 'rgb(194, 243, 32)', // '#b2d63f',
      unsure: 'yellow',
      'needs revision': 'orange',
      remove: 'red',
      'to test': 'darkgray',
    }[card.getRating()] || 'lightgray');
    id.innerHTML = card.id || '???';

    const type = v.type && v.type.toLowerCase();
    this.get('#type').className = {
      spell: 'fa fa-magic',
      gadget: 'fa fa-gear',
      character: 'fa fa-user',
      trap: 'fa fa-bug'
    }[type && type.toLowerCase()] || 'fa fa-question';

    this.renderElement(v);

    this.get('#cost').innerHTML = v.cost || '/';
    this.get('#vp').innerHTML = card.getBaseVP() || '-';

    this.get('#name').innerHTML = card.versions.last.name || 'no name yet';
    this.get('#text').innerHTML = card.versions.last.text || 'no text';
    this.get('#art').innerHTML = card.getArtDirection() || '-';
  }

  isVisible() {
    return !this.classList.contains('hidden') && !this.classList.contains('out-of-range')
  }

  updateToRange(start, end) {
    const card = this.card;
    const id = +card.getId();
    
    const inRange = (!start || start <= id) && (!end || id <= end);
    this.classList.toggle('in-range', inRange);
    this.classList.toggle('out-of-range', !inRange);
  }
  
  updateToFilter(filter) {
    let matching
    
    if (filter.startsWith('>')) {
      let functionBody = 'return ' + filter.substring(1).trim();
      let filterFunction = new Function('c', functionBody);
      matching = !!filterFunction(this.card)
    } else {
      filter = filter.toLowerCase();
      
      const card = this.card;
      const id = card.getId();
      const name = card.getName();
      const cardType = card.getType()
      const element = card.getElement();
      const cost = card.getCost();
      const text = card.getText();
      const notes = card.getNotes();
      const tags = card.getTags().join(' ');
      const aspects = [id, name, cardType, element, cost, text, notes, tags];
      
      matching = aspects.some(aspect => (aspect + '').toLowerCase().match(new RegExp(filter, 'gmi')));
    }

    this.classList.toggle('match', matching);
    this.classList.toggle('hidden', !matching);
  }

  renderElement(v) {
    const element = v.element;

    if (!element) {
      this.get('#element').className = 'fa fa-question';
      this.get('#element').style.color = 'darkgray';
      return;
    }

    if (Array.isArray(element)) {
      this.get('#element').className = 'fa fa-square';
      this.get('#element').style.color = 'white';
      return;
    }

    this.get('#element').className = 'fa fa-circle';
    this.get('#element').style.color = {
      fire: 'red',
      water: 'blue',
      earth: 'yellow',
      wind: 'green'
    }[element && element.toLowerCase()];
  }

  livelyMigrate(other) {
    this.value = other.value;
    this.updateView();
  }
}