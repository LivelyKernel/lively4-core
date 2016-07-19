'use strict';

import Morph from './Morph.js';

export default class DigitalClock extends Morph {

  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.setup();
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    switch (attrName) {
      //case 'attribute':
      //  this.render();
      //  break;
      default:
        //
    }
  }

  /*
   * Initialization
   */

  setup() {
    this.renderLoop();
  }

  /*
   * Window methods
   */
  render() {
    this.updateTime();
  }
  
  renderLoop() {
    this.render();
    
    setTimeout(
    	this.renderLoop.bind(this),
    	1000
  	);
  }
  
  updateTime() {
    let date = new Date();
    let formattedDate = date.toTimeString().replace(/ .*/,"")
    this.shadowRoot.innerHTML = formattedDate;
  }
}
