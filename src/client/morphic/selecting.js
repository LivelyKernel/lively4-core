


export default class Selecting {

  static load() {
    $("body").on("click", (evt) => this.handleSelect(evt));
    $("body").on("mouseup", (evt) => this.handleMouseUp(evt));
  }

  static handleSelect(e) {
    if (e.ctrlKey || e.metaKey) {
      this.onMagnify(e);
      e.stopPropagation();
    }
  }

  static handleMouseUp(e) {
    // hide halos if the user clicks somewhere else
    if (!(e.ctrlKey || e.metaKey)) {
      if (window.that && !$(e.target).is("lively-halos")) {
        this.hideHalos()
      }
    }
  }

  static onMagnify(e) {
    var grabTarget = e.target;
    var that = window.that;
    var $that = $(that);
    if (that && this.areHalosActive() && (grabTarget === that || $.contains(that, grabTarget))) {
      parent = $that.parent();
      if (!parent.is("html")) {
        grabTarget = parent.get(0);
      }
    }

    // if there was no suitable parent, cycle back to the clicked element itself
    window.that = grabTarget;

    this.showHalos(grabTarget)
  }

  static showHalos(el) {
    HaloService.showHalos(el);
  }

  static hideHalos() {
    HaloService.hideHalos();
  }

  static areHalosActive() {
    return HaloService.areHalosActive();
  }
}

Selecting.load()
