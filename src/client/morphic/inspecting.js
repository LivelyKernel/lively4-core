export function activate() {
  console.log("using Inspector");
  $("body").on("click", handleInspect);
}

export function deactivate() {
  console.log("deactivate Inspector");
  $("body").off("click", handleInspect);
}

function handleInspect(e) {
  if (e.ctrlKey || e.metaKey) {
    onMagnify(e);
  } else {
    if (window.that) {
      $(window.that).removeClass("red-border");
    }
  }
}

var objectEditorWindow = null;

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

  // open object editor for new target
  var editor = document.createElement('lively-object-editor');
  editor.targetElement = window.that;
  objectEditorWindow = document.createElement('lively-window');
  $(objectEditorWindow).append(editor);

  var title = '';
  if (window.that.name) {
      title = window.that.name;
  } else if (window.that.id) {
      title = '#'+ window.that.id;
  }
  title += ' <small>' + window.that.tagName.toLowerCase() + '</small>';
  objectEditorWindow.setAttribute('title', title);

  $('body').append(objectEditorWindow);
  objectEditorWindow.centerInWindow();
}
