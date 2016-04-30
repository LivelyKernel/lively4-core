'use strict';

import Morph from './Morph.js';

export default class ApplicationBar extends Morph {

  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.setup();
    this.render();
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
  defineShortcuts() {
    this.windowSpace = this.shadowRoot.querySelector('#window-space');
    this.toolbar = this.shadowRoot.querySelector('#toolbar');
    this.clock = this.shadowRoot.querySelector('#clock')
  }

  bindEvents() {
    //
  }

  setup() {
    this.defineShortcuts();
    this.bindEvents();
  }

  /*
   * Window methods
   */
  render() {
    //
  }
}
