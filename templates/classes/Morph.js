'use strict'

export default class Morph extends HTMLDivElement {
  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
  }

  getSubmorph(selector) {
    var morph = this.querySelector(selector);
    if (!morph && this.shadowRoot) {
      morph = this.shadowRoot.querySelector(selector);
    }

    return morph;
  }

  getAllSubmorphs(selector) {
    var morphs = this.querySelectorAll(selector);
    if (this.shadowRoot) {
      morphs = morphs.concat(this.shadowRoot.querySelectorAll(selector));
    }

    // morphs can contain null, if either none was found in this or this.shadowRoot
    return morphs.filter(m => {
      return m;
    });
  }
}
