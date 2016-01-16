$("body").on("click", handleSelect);

function handleSelect(e) {
  if (e.ctrlKey || e.metaKey) {
    onMagnify(e);
  } else {
    if (window.that && !$(e.target).is("lively-toolbox") && !$(e.target).is("lively-halos")) {
      $(window.that).removeClass("red-border");
      hideHalos()
    }
  }
}

function onMagnify(e) {
  var grabTarget = e.target;
  var that = window.that;
  var $that = $(that);
  if (that && $that.hasClass("red-border") && (grabTarget === that || $.contains(that, grabTarget))) {
    parent = $that.parent();
    if (!parent.is("html")) {
      grabTarget = parent.get(0);
    }
  }
  if (grabTarget !== that || !$that.hasClass("red-border")) {
    $that.removeClass("red-border")
    $(grabTarget).addClass("red-border");
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
