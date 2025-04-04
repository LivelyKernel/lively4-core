"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class UbgCardSlot extends Morph {
  
  get ubg() {
    const ancestry = lively.ancestry(this);
    return ancestry.find(e => e.localName === 'ubg-cards');
  }
  
  async initialize() {
    this.windowTitle = "UbgCardSlot";
    this.registerButtons()
    
    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "click", evt => this.onClick())
    this.addEventListener('pointerenter', evt => this.ubg.hoverCard(this.card));
    this.addEventListener('pointerleave', evt => this.ubg.unhoverCard());

    // lively.addEventListener("template", this, 'pointerover', evt => lively.showEvent(evt).innerText = 'pointerover')
    // lively.addEventListener("template", this, 'pointerout', evt => lively.showEvent(evt).innerText = 'pointerout')

    this.setAttribute('draggable', true)
    lively.removeEventListener("dragging", this)
    lively.addEventListener("dragging", this, "dragstart", evt => this.onDragStart(evt))
    
    this.addEventListener('contextmenu', function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.remove()
    });
  }
  
  onDragStart(evt) {
    evt.stopPropagation()
    this.drags = 0
    
    // evt.dataTransfer.setData('text/plain', this.cardID);
    evt.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
    
    const throttledDrag = _.throttle(evt => this.onDrag(evt), 1000 / 30)
    lively.addEventListener("drag", this, "drag", throttledDrag)
    lively.addEventListener("drag", this, "dragend", evt => this.onDragEnd(evt))
  }
  
  onDrag(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    
    this.drags++
    
    const parent = this.ubg;
    if (!parent) {
      return
    }
    
    const mouse = lively.pt(evt.clientX, evt.clientY);
    const cardSlots = [...parent.querySelectorAll('ubg-card-slot')];
    const closestSlot = cardSlots.minBy(slot => {
      const r = slot.getBoundingClientRect();
      const center = lively.rect(r.left, r.top, r.width, r.height).center()
      return center.dist(mouse)
    })
    if (closestSlot === this) {
      return
    }
    
    if (closestSlot.compareDocumentPosition(this) & Node.DOCUMENT_POSITION_FOLLOWING) {
      parent.insertBefore(this, closestSlot);
    } else {
      parent.insertBefore(this, closestSlot.nextSibling);
    }
  }
  
  onDragEnd(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    
    lively.notify('drags:', this.drags)
    
    this.classList.remove('dragging');
    lively.removeEventListener("drag", this)
  }
  
  setCard(cardID, card, cards, src) {
    this.cardID = cardID;
    this.card = card;
    this.cards = cards;
    this.src = src;
    this.updateView()
  }
  
  updateView() {
    const cardPreview = this.get('#card');
    cardPreview.setLowQuality(true)
    cardPreview.setCard(this.card)
    cardPreview.setCards(this.cards)
    cardPreview.setSrc(this.src)
    cardPreview.render()
  }
  
  onClick() {
    this.ubg.selectCard(this.card)
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  /* Lively-specific API */
  
  // store something that would be lost
  livelyPrepareSave() {
    // this.setAttribute("data-mydata", this.get("#textField").value)
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    this.cardID = other.cardID;
    this.card = other.card;
    this.cards = other.cards;
    this.src = other.src;
    if (this.card) {
      this.updateView()
    }
  }
  
  async livelyExample() {
  }
  
  
}
