
import HaloItem from './HaloItem.js';

var copyBlacklist = ["body", "html"];

export default class HaloCopyItem extends HaloItem {
  
  initialize() {
    // super.initialize()
    lively.addEventListener('CopyHalo', this, 'click', e => this.onClick(e))
  }
  
  onClick() {
      this.handle(window.that);
  }
  
  handle(el) {
    var copyTarget = el;
    if (this.isAllowedToBeCopied(copyTarget)) {
      var copy = $(copyTarget).clone(); // #TODO #jQueryRefactor
      $(copyTarget).after(copy);
    }
  }
  
  isAllowedToBeCopied(element) {
    return copyBlacklist.indexOf(element.tagName.toLowerCase()) < 0;
  }
  
}