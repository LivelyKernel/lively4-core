'use strict';

import Morph from './Morph.js';

export default class RdfaViewer extends Morph {

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
    let box = this.shadowRoot.querySelector('#rdfaBox');
    box.text = "halloööö"
  }

  /*
   * Window methods
   */
  render() {

  }

}
