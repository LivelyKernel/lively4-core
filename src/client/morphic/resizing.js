export var resizing;

export function start(e) {
  e.preventDefault();

  let $el = $(window.that)
  let offsetWindow = $el.offset();

  removeRestrictions($el)

  resizing = {
    left: offsetWindow.left,
    top: offsetWindow.top,
    offsetX: offsetWindow.left + $el.width() - e.pageX,
    offsetY: offsetWindow.top + $el.height() - e.pageY
  };
}

export function stop(e) {
  e.preventDefault();

  resizing = false;
}

export function move(e) {
  e.preventDefault();

  if (resizing) {
    $(window.that).css({
      width: e.pageX - resizing.left + resizing.offsetX,
      height: e.pageY - resizing.top + resizing.offsetY
    });
  }
}

function removeRestrictions($el) {
  $el.css({
    "min-width": "none",
    "min-height": "none",
    "max-width": "none",
    "max-height": "none"
  })
}
