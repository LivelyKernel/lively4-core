import HaloItem from './HaloItem.js';
import * as unpacking from 'src/client/morphic/component-creator.js'

// #TODO what is the workflow of packing and unpacking of nodes?

export default class HaloUnpackItem extends HaloItem {

  onClick() {
    unpacking.unpackShadowDOM(window.that);
    this.hideHalo();
  }
}