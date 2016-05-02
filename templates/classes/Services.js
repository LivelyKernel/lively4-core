'use strict';

import Morph from './Morph.js';

export default class Services extends Morph {
  initialize() {
    this.windowTitle = "Services"
    var container = this.q(".container");
  }
}
