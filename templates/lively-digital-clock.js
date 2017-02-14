'use strict';

import Morph from './Morph.js';

export default class DigitalClock extends Morph {

  initialize() {
    this.style.backgroundColor = 'red'
    if (!this.start)
      this.start = Date.now()
  }

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
    var date = new Date()
    var time = date.getTime() - this.start
    this.shadowRoot.innerHTML = "It is " + this.formatTime(date) + ", running " + (time / 1000) +"s" ;
  }
  
  livelyMigrate(oldInstance) {
    
    this.start = oldInstance.start
  }
  
}
