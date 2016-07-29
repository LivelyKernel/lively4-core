
import HaloItem from './HaloItem.js';

export default class HaloRemoveItem extends HaloItem {

  onClick() {
    var deleteTarget =window.that;
    if (this.isAllowedToBeDeleted(deleteTarget)) {
      $(deleteTarget).remove();
      window.that = undefined;
    }
    this.hideHalo();
  }

  isAllowedToBeDeleted(element) {
    var deleteBlacklist = ["body", "html"];
    return deleteBlacklist.indexOf($(element).prop("tagName").toLowerCase()) < 0;
  }
}