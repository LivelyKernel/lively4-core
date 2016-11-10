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
  
  formatTime(dateTime) {
    var hours = ("0" + dateTime.getHours()).substr(-2);
    var minutes = ("0" + dateTime.getMinutes()).substr(-2);
    
    return hours + ":" + minutes;
  }
  
  updateTime() {
    let date = new Date();
    this.shadowRoot.innerHTML = this.formatTime(date);
  }
}
