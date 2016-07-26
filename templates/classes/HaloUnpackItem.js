import HaloItem from './HaloItem.js';
import unpacking from 'src/client/morphic/component-creator.js'

export default class HaloUnpackItem extends HaloItem {

  onClick() {
    unpacking.unpackShadowDOM(window.that);
    window.HaloService.hideHalos();
  }
}