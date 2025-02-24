"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import { serialize, deserialize } from 'src/client/serialize.js';
import Card from 'demos/stefan/untitled-board-game/ubg-card.js';

export default class UbgSetViewer extends Morph {
  async initialize() {
    this.setAttribute("exportparts", 'danger');
    this.setAttribute("tabindex", 0);
    this.windowTitle = "UBG Set Viewer";
    this.addEventListener('contextmenu', evt => this.onMenuButton(evt), false);
    
    // this.filter.value = this.filterValue;
    // this.rangeStart.value = this.rangeStartValue;
    // this.rangeEnd.value = this.rangeEndValue;
    
    this.updateView();
    lively.html.registerKeys(this);
    this.registerButtons();
    
    // this.filter.addEventListener('keydown', evt => {
    //   if (evt.key === 'Escape') {
    //     this.filter.value = '';
    //     evt.stopPropagation();
    //     evt.preventDefault();
    //     // programmatic change does not emit an 'input' event, so we emit here explicitly
    //     this.filter.dispatchEvent(new Event('input', {
    //       bubbles: true,
    //       cancelable: true
    //     }));
    //   }
    // });
    
    // this.cardFrameStyle.addEventListener('input', evt => this.updateCardInEditor(this.card), false);
    // for (let eventName of ['input']) {
    //   this.filter.addEventListener(eventName, evt => this.filterChanged(evt), false);
    //   this.rangeStart.addEventListener(eventName, evt => this.rangeChanged(evt), false);
    //   this.rangeEnd.addEventListener(eventName, evt => this.rangeChanged(evt), false);
    // }
    
    this.addEventListener('dragenter', evt => this.dragenter(evt), false);
    this.addEventListener('dragover', evt => this.dragover(evt), false);
    this.addEventListener('dragleave', evt => this.dragleave(evt), false);
    this.addEventListener('drop', evt => this.drop(evt), false);
  }
  
  get src() {
    return this.getAttribute("src");
  }

  set src(url) {
    this.setAttribute("src", url);
    this.updateView();
  }
  
  async updateView() {
    this.innerHTML = "";

    if (!this.src) {
      lively.warn('no src for ubg-set-viewer');
      return;
    }
    
    return;

    // debugger
    if (!this.cards) {
      this.cards = [];
      try {
        const cardsToLoad = await this.loadCardsFromFile();
        await this.addCards(cardsToLoad)
      } catch (e) {
        this.innerHTML = "" + e;
      }
    } else {
      // ensure an entry for each card
      const currentEntries = this.allEntries;
      for (const card of this.cards) {
        let entry = currentEntries.find(entry => entry.card === card);
        if (!entry) {
          entry = await this.appendCardEntry(card);
        }
      }
    }
    this.scheduleUpdateStats()

    this.selectCard(this.card || this.cards.first);
  }

  async loadCardsFromFile() {
    const text = await this.src.fetchText();
    const source = deserialize(text, { Card });
    // source.forEach(card => card.migrateTo(Card))
    return source;
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
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.cards = other.cards;
    this.card = other.card;
  }

/*
  livelyInspect(contentNode, inspector) {
    // overrides how the inspector displays this component
  }
*/
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray"
    this.someJavaScriptProperty = 42
    this.appendChild(<div>This is my content</div>)
  }
  
  
}