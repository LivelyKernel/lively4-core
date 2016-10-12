
import HaloItem from './HaloItem.js';

export default class HaloRemoveItem extends HaloItem {

  onClick() {
    var deleteTarget =window.that;
    if (deleteTarget && this.isAllowedToBeDeleted(deleteTarget)) {
      
      if (deleteTarget.haloRemove) {
        deleteTarget.haloRemove()
      } else {
        deleteTarget.remove();
      }
      window.that = undefined;
    }
    this.hideHalo();
  }

  isAllowedToBeDeleted(element) {
    var deleteBlacklist = ["body", "html"];
    return deleteBlacklist.indexOf($(element).prop("tagName").toLowerCase()) < 0;
  }
}