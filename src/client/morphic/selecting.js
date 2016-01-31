$("body").on("click", handleSelect);

function handleSelect(e) {
  if (e.ctrlKey || e.metaKey) {
    onMagnify(e);
  } else {
    if (window.that && !$(e.target).is("lively-halos")) {
      hideHalos()
    }
  }
}

function onMagnify(e) {
  var grabTarget = e.target;
  var that = window.that;
  var $that = $(that);
  if (that && areHalosActive() && (grabTarget === that || $.contains(that, grabTarget))) {
    parent = $that.parent();
    if (!parent.is("html")) {
      grabTarget = parent.get(0);
    }
  }

  window.that = grabTarget;
  console.log("Current element:", grabTarget, "with id:", $(grabTarget).attr("id"));

  showHalos(grabTarget)
}

function showHalos(el) {
  HaloService.showHalos(el);
}

function hideHalos() {
  HaloService.hideHalos();
}

function areHalosActive() {
  return HaloService.areHalosActive();
}
