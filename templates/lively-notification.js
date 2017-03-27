'use strict';

import Morph from './Morph.js';
import lively from 'src/client/lively.js'

export default class Notification extends Morph {
  
  initialize() {
    this.render()
    lively.addEventListener("lively", this.shadowRoot.querySelector("#closeButton"), 
      "click", evt => this.onClose(evt))
    lively.addEventListener("lively", this.shadowRoot.querySelector("#moreButton"), 
      "click", evt => this.onMore(evt))
    this.counter = 0
  }
  
  // #TODO get rid of this and replace it with lively.bindings
  get title() {
    return this._title
  }
  
  set title(text) {
    this._title = text
    this.render()
  }

  get color() {
    return this.shadowRoot.querySelector("#notification").style.backgroundColor
  }
  
  set color(colorString) {
    this.shadowRoot.querySelector("#notification").style.backgroundColor = colorString
  }
  
  get message() {
    return this._message
  }
  
  set message(text) {
    this._message = text
    this.render()
  }
  
  get more() {
    return this._more
  }
  
  set more(cb) {
    this._more = cb // callback
    this.render()
  }

  livelyMigrate(oldInstance) {
    // this is crucial state
    this.title = oldInstance.title
    this.message = oldInstance.message
    this.more = oldInstance.more
  }
  
  onClose(evt) {
    var owner = this.parentElement
    this.remove();
    if (owner && owner.hideIfEmpty) {
      owner.hideIfEmpty();
    }
  }

  onMore(evt) {
    if (this.more)
      this.more()
  }

  render() {  
    this.shadowRoot.querySelector("#title").textContent = this.title
    this.shadowRoot.querySelector("#message").textContent = this.message
    this.shadowRoot.querySelector("#moreButton").hidden = ! this.more
    
    if (this.counter > 1) {
      this.shadowRoot.querySelector("#counter").textContent = this.counter
    }
    
  }
  
}